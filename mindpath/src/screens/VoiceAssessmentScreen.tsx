import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { sendVoiceTurn, MindpathUI } from '../services/api';
import { speak, stopSpeech } from '../services/elevenLabsTTS';
import { startRecording, stopAndTranscribe, cancelRecording, isRecording } from '../services/elevenLabsSTT';

type Props = NativeStackScreenProps<HomeStackParamList, 'VoiceAssessment'>;

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'completed';

function generateSessionId(): string {
  return 'sess_' + Math.random().toString(36).slice(2, 11);
}

const ORB_SIZE = 160;
const RING_SIZE = ORB_SIZE * 1.55;

const ORB_COLORS: Record<VoiceState, string> = {
  idle:      '#4F46E5',
  listening: '#EF4444',
  thinking:  '#6B7280',
  speaking:  '#10B981',
  completed: '#4F46E5',
};

const STATUS_TEXT: Record<VoiceState, string> = {
  idle:      'Tap to speak',
  listening: 'Listening…',
  thinking:  'Thinking…',
  speaking:  'Speaking…',
  completed: 'Assessment complete',
};

export default function VoiceAssessmentScreen({ navigation }: Props) {
  const sessionId     = useRef(generateSessionId());
  const interruptedRef = useRef(false); // set true when user taps during 'speaking'
  const [voiceState, setVoiceState] = useState<VoiceState>('thinking');
  const [agentText, setAgentText] = useState('');
  const [userText, setUserText]   = useState('');
  const [ui, setUi]               = useState<MindpathUI | null>(null);
  const [sttUnavailable, setSttUnavailable] = useState(false);
  const [fallbackText, setFallbackText]     = useState('');

  // Animations
  const orbScale    = useRef(new Animated.Value(1)).current;
  const ringScale   = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.4)).current;
  const spinAnim    = useRef(new Animated.Value(0)).current;
  const loopRef     = useRef<Animated.CompositeAnimation | null>(null);
  const spinRef     = useRef<Animated.CompositeAnimation | null>(null);

  // ── Animation control ───────────────────────────────────────────────────────

  const stopAnimations = useCallback(() => {
    loopRef.current?.stop();
    spinRef.current?.stop();
    loopRef.current = null;
    spinRef.current = null;
  }, []);

  const playOrbAnim = useCallback((state: VoiceState) => {
    stopAnimations();
    orbScale.setValue(1);
    ringScale.setValue(1);
    ringOpacity.setValue(0.3);

    if (state === 'thinking') {
      const spin = Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 1200, useNativeDriver: true, easing: Easing.linear }),
      );
      spinAnim.setValue(0);
      spinRef.current = spin;
      spin.start();
      return;
    }

    const config = {
      idle:      { scale: 1.06, ring: 1.25, dur: 1800 },
      listening: { scale: 1.18, ring: 1.4,  dur: 600  },
      speaking:  { scale: 1.10, ring: 1.3,  dur: 900  },
      completed: { scale: 1.04, ring: 1.2,  dur: 2200 },
    }[state] ?? { scale: 1.06, ring: 1.25, dur: 1800 };

    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(orbScale,    { toValue: config.scale, duration: config.dur, useNativeDriver: true }),
          Animated.timing(ringScale,   { toValue: config.ring,  duration: config.dur, useNativeDriver: true }),
          Animated.timing(ringOpacity, { toValue: 0.0,          duration: config.dur, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(orbScale,    { toValue: 1.0, duration: config.dur, useNativeDriver: true }),
          Animated.timing(ringScale,   { toValue: 1.0, duration: config.dur, useNativeDriver: true }),
          Animated.timing(ringOpacity, { toValue: 0.3, duration: config.dur, useNativeDriver: true }),
        ]),
      ]),
    );
    loopRef.current = loop;
    loop.start();
  }, [orbScale, ringScale, ringOpacity, spinAnim, stopAnimations]);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // ── Conversation ─────────────────────────────────────────────────────────────

  const transition = useCallback((s: VoiceState) => {
    setVoiceState(s);
    playOrbAnim(s);
  }, [playOrbAnim]);

  const processInput = useCallback(async (text: string) => {
    interruptedRef.current = false;
    setUserText(text);
    transition('thinking');
    try {
      const res = await sendVoiceTurn(sessionId.current, text);
      if (interruptedRef.current) return;
      setAgentText(res.speech);
      setUi(res.mindpath_ui);

      const isCompleted = res.mindpath_ui?.phase === 'completed';
      transition('speaking');
      await speak(res.speech);
      if (interruptedRef.current) return; // user interrupted during TTS
      transition(isCompleted ? 'completed' : 'idle');
    } catch (e) {
      console.error('Voice turn error:', e);
      if (!interruptedRef.current) transition('idle');
    }
  }, [transition]);

  // Greeting on mount
  useEffect(() => {
    playOrbAnim('thinking');
    sendVoiceTurn(sessionId.current, '').then(async (res) => {
      setAgentText(res.speech);
      setUi(res.mindpath_ui);
      transition('speaking');
      await speak(res.speech);
      if (!interruptedRef.current) transition('idle');
    }).catch(() => transition('idle'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Orb tap ──────────────────────────────────────────────────────────────────

  const handleOrbPress = useCallback(async () => {
    if (voiceState === 'speaking') {
      interruptedRef.current = true; // prevent processInput from overwriting state
      await stopSpeech();
      try {
        await startRecording();
        transition('listening');
      } catch (e) {
        console.warn('Mic error:', e);
        transition('idle');
      }
      return;
    }

    if (voiceState === 'listening') {
      // Stop and transcribe
      transition('thinking');
      const transcript = await stopAndTranscribe();
      if (transcript) {
        await processInput(transcript);
      } else {
        // STT not available — show text fallback
        setSttUnavailable(true);
        transition('idle');
      }
      return;
    }

    if (voiceState === 'idle' || voiceState === 'completed') {
      try {
        await startRecording();
        transition('listening');
      } catch (e) {
        console.warn('Mic error:', e);
        setSttUnavailable(true);
      }
    }
  }, [voiceState, transition, processInput]);

  const handleFallbackSend = useCallback(async () => {
    const text = fallbackText.trim();
    if (!text || voiceState === 'thinking' || voiceState === 'speaking') return;
    setFallbackText('');
    await processInput(text);
  }, [fallbackText, voiceState, processInput]);

  const handleExit = useCallback(async () => {
    await cancelRecording().catch(() => {});
    await stopSpeech().catch(() => {});
    navigation.goBack();
  }, [navigation]);

  const isCompleted = voiceState === 'completed';
  const orbColor    = ORB_COLORS[voiceState];
  const statusText  = STATUS_TEXT[voiceState];
  const canTap      = voiceState !== 'thinking';

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleExit} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>MindPath</Text>
          <View style={{ width: 38 }} />
        </View>
      </SafeAreaView>

      {/* Main content */}
      <View style={styles.center}>

        {/* Agent text (what the AI just said) */}
        {agentText ? (
          <Text style={styles.agentText} numberOfLines={3}>{agentText}</Text>
        ) : null}

        {/* Orb */}
        <TouchableOpacity
          onPress={handleOrbPress}
          disabled={!canTap}
          activeOpacity={0.9}
          style={styles.orbContainer}
        >
          {/* Outer expanding ring */}
          <Animated.View
            style={[
              styles.ring,
              {
                width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2,
                borderColor: orbColor,
                opacity: ringOpacity,
                transform: [{ scale: ringScale }],
              },
            ]}
          />

          {/* Inner orb */}
          <Animated.View
            style={[
              styles.orb,
              {
                backgroundColor: orbColor,
                transform: [
                  { scale: voiceState === 'thinking' ? 1 : orbScale },
                  { rotate: voiceState === 'thinking' ? spin : '0deg' },
                ],
              },
            ]}
          >
            {voiceState === 'thinking' ? (
              <Ionicons name="sync" size={36} color="rgba(255,255,255,0.9)" />
            ) : voiceState === 'listening' ? (
              <Ionicons name="mic" size={36} color="#fff" />
            ) : voiceState === 'speaking' ? (
              <Ionicons name="volume-high" size={34} color="#fff" />
            ) : (
              <Ionicons name="mic-outline" size={36} color="rgba(255,255,255,0.85)" />
            )}
          </Animated.View>
        </TouchableOpacity>

        {/* Status label */}
        <Text style={styles.statusText}>{statusText}</Text>

        {/* User transcript */}
        {userText ? (
          <Text style={styles.userText}>You: {userText}</Text>
        ) : null}

        {/* Result card */}
        {isCompleted && ui && (
          <View style={styles.resultCard}>
            {ui.severity ? (
              <Text style={[styles.severityText, { color: _sevColor(ui.severity) }]}>
                {ui.severity}
              </Text>
            ) : null}
            {ui.score !== null && (
              <Text style={styles.scoreText}>GAD-7 score: {ui.score} / 21</Text>
            )}
            {ui.providers && ui.providers.length > 0 && (
              <View style={styles.providerList}>
                {ui.providers.slice(0, 3).map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.providerRow}
                    onPress={() => navigation.navigate('ProviderDetail', { providerId: p.id })}
                    activeOpacity={0.8}
                  >
                    <View style={styles.providerAvatar}>
                      <Ionicons name="person" size={16} color="rgba(255,255,255,0.6)" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.providerName}>{p.name}</Text>
                      <Text style={styles.providerMeta}>{p.provider_type} · {p.city}, {p.state}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Text fallback (shown when STT is unavailable) */}
      {sttUnavailable && (
        <SafeAreaView edges={['bottom']} style={styles.fallbackSafe}>
          <View style={styles.fallbackBar}>
            <Ionicons name="mic-off-outline" size={16} color="rgba(255,255,255,0.4)" style={{ marginRight: 6 }} />
            <TextInput
              style={styles.fallbackInput}
              value={fallbackText}
              onChangeText={setFallbackText}
              placeholder="Voice unavailable — type here"
              placeholderTextColor="rgba(255,255,255,0.3)"
              returnKeyType="send"
              onSubmitEditing={handleFallbackSend}
              editable={canTap}
            />
            <TouchableOpacity onPress={handleFallbackSend} disabled={!fallbackText.trim() || !canTap}>
              <Ionicons name="send" size={18} color={fallbackText.trim() ? '#4F46E5' : 'rgba(255,255,255,0.2)'} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}
    </KeyboardAvoidingView>
  );
}

function _sevColor(sev: string): string {
  const map: Record<string, string> = {
    Minimal: '#34D399', Mild: '#60A5FA',
    Moderate: '#FBBF24', 'Moderately Severe': '#F87171', Severe: '#F87171',
  };
  return map[sev] ?? '#60A5FA';
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D1117' },

  headerSafe: { backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },

  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 28, gap: 20,
  },

  agentText: {
    fontSize: 16, color: 'rgba(255,255,255,0.75)', textAlign: 'center',
    lineHeight: 24, maxWidth: 300,
  },

  orbContainer: { alignItems: 'center', justifyContent: 'center', width: RING_SIZE, height: RING_SIZE },

  ring: {
    position: 'absolute',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },

  orb: {
    width: ORB_SIZE, height: ORB_SIZE, borderRadius: ORB_SIZE / 2,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 12,
  },

  statusText: {
    fontSize: 15, color: 'rgba(255,255,255,0.5)', fontWeight: '500', letterSpacing: 0.5,
  },

  userText: {
    fontSize: 13, color: 'rgba(255,255,255,0.35)', textAlign: 'center', maxWidth: 280,
  },

  resultCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20, padding: 20, width: '100%',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    gap: 6,
  },
  severityText: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  scoreText: { fontSize: 13, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginBottom: 8 },

  providerList: { gap: 2, marginTop: 4 },
  providerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  providerAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  providerName: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  providerMeta: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 },

  fallbackSafe: { backgroundColor: 'rgba(0,0,0,0.4)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  fallbackBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, gap: 8,
  },
  fallbackInput: {
    flex: 1, fontSize: 14, color: '#fff',
    paddingVertical: 8, paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
});
