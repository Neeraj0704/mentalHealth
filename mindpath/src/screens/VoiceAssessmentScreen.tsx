/**
 * VoiceAssessmentScreen — Option B
 *
 * Uses our custom backend (sendVoiceTurn) for conversation + provider matching.
 * Uses AudioSession from @livekit/react-native for proper iOS audio routing.
 * Adds silence-detection VAD so the conversation is hands-free after the first tap.
 *
 * Flow:
 *  1. Tap orb → AudioSession starts, recording begins with metering enabled
 *  2. VAD watches dB level — after 1.5s of silence, auto-stops and transcribes
 *  3. Transcript → sendVoiceTurn → get speech text + mindpath_ui
 *  4. ElevenLabs TTS plays the response
 *  5. After TTS finishes → auto-restart recording (loop, hands-free)
 *  6. When mindpath_ui.phase === 'completed' → orb shrinks, providers slide up
 *  7. If STT fails (401/no plan) → text input fallback appears
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, StatusBar, ScrollView, Easing,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { MindpathUI, sendVoiceTurn } from '../services/api';
import { speak, stopSpeech } from '../services/elevenLabsTTS';
import { saveAssessmentSummary } from '../services/preferences';

type Props = NativeStackScreenProps<HomeStackParamList, 'VoiceAssessment'>;

const EL_API_KEY     = '6ded44660a946ccecacfd38dc72f2117ad08721ef3875ced2795041c9dd1ea4c';
const STT_URL        = 'https://api.elevenlabs.io/v1/speech-to-text';
const ORB_FULL       = 150;
const ORB_SMALL      = 70;
const SILENCE_DB     = -38;   // dB threshold — below this is silence
const SILENCE_MS     = 1500;  // ms of continuous silence before auto-stop

type Phase = 'idle' | 'recording' | 'processing' | 'speaking' | 'completed';

function makeSessionId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function transcribe(uri: string): Promise<string | null> {
  try {
    const form = new FormData();
    form.append('file', { uri, type: 'audio/m4a', name: 'speech.m4a' } as any);
    form.append('model_id', 'scribe_v1');
    const res = await fetch(STT_URL, {
      method: 'POST',
      headers: { 'xi-api-key': EL_API_KEY },
      body: form,
    });
    if (!res.ok) { console.warn('STT error', res.status); return null; }
    const data = await res.json();
    return (data.text ?? '').trim() || null;
  } catch (e) {
    console.warn('STT exception', e);
    return null;
  } finally {
    FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
  }
}

function sevColor(s: string) {
  return ({
    Minimal: '#34D399', Mild: '#60A5FA',
    Moderate: '#FBBF24', 'Moderately Severe': '#F87171', Severe: '#F87171',
  } as Record<string, string>)[s] ?? '#60A5FA';
}

export default function VoiceAssessmentScreen({ navigation }: Props) {
  const [phase, setPhase]           = useState<Phase>('idle');
  const [ui, setUi]                 = useState<MindpathUI | null>(null);
  const [hint, setHint]             = useState('Tap the orb to start');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textVal, setTextVal]       = useState('');
  const [summaryText, setSummaryText] = useState('');

  const sessionId     = useRef(makeSessionId());
  const recordingRef  = useRef<Audio.Recording | null>(null);
  const doneRef       = useRef(false);
  const stoppingRef   = useRef(false);   // prevent double VAD trigger
  const silenceSince  = useRef<number | null>(null);
  const hasSpokeRef   = useRef(false);   // don't trigger silence until user has spoken

  // Ref-based bridge to break startListening ↔ sendTurn circular dependency
  const startListeningRef = useRef<() => Promise<void>>(async () => {});

  // ── Animations ──────────────────────────────────────────────────────────────
  const orbScale  = useRef(new Animated.Value(1)).current;
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpac  = useRef(new Animated.Value(0.25)).current;
  const spinVal   = useRef(new Animated.Value(0)).current;
  const providerY = useRef(new Animated.Value(500)).current;
  const loopAnim  = useRef<Animated.CompositeAnimation | null>(null);
  const spinAnim  = useRef<Animated.CompositeAnimation | null>(null);
  const spin      = spinVal.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const stopAnims = useCallback(() => {
    loopAnim.current?.stop(); loopAnim.current = null;
    spinAnim.current?.stop(); spinAnim.current = null;
    orbScale.setValue(1); ringScale.setValue(1); ringOpac.setValue(0.2);
  }, [orbScale, ringScale, ringOpac]);

  useEffect(() => {
    stopAnims();
    if (phase === 'processing') {
      spinVal.setValue(0);
      spinAnim.current = Animated.loop(
        Animated.timing(spinVal, { toValue: 1, duration: 900, useNativeDriver: false, easing: Easing.linear }),
      );
      spinAnim.current.start();
      return;
    }
    const cfg: Partial<Record<Phase, { s: number; r: number; d: number }>> = {
      idle:      { s: 1.04, r: 1.15, d: 2000 },
      recording: { s: 1.12, r: 1.40, d: 700  },
      speaking:  { s: 1.14, r: 1.45, d: 600  },
      completed: { s: 1.04, r: 1.15, d: 2200 },
    };
    const c = cfg[phase]; if (!c) return;
    loopAnim.current = Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(orbScale,  { toValue: c.s, duration: c.d, useNativeDriver: false }),
        Animated.timing(ringScale, { toValue: c.r, duration: c.d, useNativeDriver: false }),
        Animated.timing(ringOpac,  { toValue: 0,   duration: c.d, useNativeDriver: false }),
      ]),
      Animated.parallel([
        Animated.timing(orbScale,  { toValue: 1,   duration: c.d, useNativeDriver: false }),
        Animated.timing(ringScale, { toValue: 1,   duration: c.d, useNativeDriver: false }),
        Animated.timing(ringOpac,  { toValue: 0.2, duration: c.d, useNativeDriver: false }),
      ]),
    ]));
    loopAnim.current.start();
  }, [phase, stopAnims, orbScale, ringScale, ringOpac, spinVal]);

  // ── Audio helpers ────────────────────────────────────────────────────────────

  const stopRecording = useCallback(async (): Promise<string | null> => {
    const rec = recordingRef.current;
    if (!rec) return null;
    recordingRef.current = null;
    silenceSince.current = null;
    stoppingRef.current = false;
    try { await rec.stopAndUnloadAsync(); } catch {}
    try { await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true }); } catch {}
    return rec.getURI() ?? null;
  }, []);

  // ── Core conversation turn ───────────────────────────────────────────────────

  const sendTurn = useCallback(async (transcript: string) => {
    if (!transcript || doneRef.current) return;
    setPhase('processing');
    setHint('Thinking…');
    setShowTextInput(false);
    setTextVal('');

    let response;
    try {
      response = await sendVoiceTurn(sessionId.current, transcript);
    } catch (e) {
      console.warn('sendVoiceTurn error', e);
      setPhase('idle');
      setHint('Something went wrong. Tap to try again.');
      return;
    }

    if (doneRef.current) return;
    setUi(response.mindpath_ui);

    if (response.mindpath_ui.phase === 'completed') {
      doneRef.current = true;
      setSummaryText(response.speech);
      setPhase('completed');
      setHint('');
      stopAnims();
      // Save summary so BookingScreen can attach it
      if (response.mindpath_ui.condition || response.mindpath_ui.severity) {
        saveAssessmentSummary({
          condition: response.mindpath_ui.condition ?? '',
          severity: response.mindpath_ui.severity ?? undefined,
          score: response.mindpath_ui.score ?? undefined,
          message: response.speech,
        }).catch(() => {});
      }
      Animated.parallel([
        Animated.spring(orbScale,  { toValue: ORB_SMALL / ORB_FULL, useNativeDriver: false, bounciness: 8 }),
        Animated.spring(providerY, { toValue: 0, useNativeDriver: false, bounciness: 5 }),
      ]).start();
      return;
    }

    setPhase('speaking');
    setHint('');
    await speak(response.speech);

    // Auto-restart listening after TTS finishes
    if (!doneRef.current) {
      await startListeningRef.current();
    }
  }, [orbScale, providerY, stopAnims]);

  const runTurn = useCallback(async (uri: string) => {
    setPhase('processing');
    setHint('Transcribing…');

    const transcript = await transcribe(uri);
    if (doneRef.current) return;

    if (!transcript) {
      setPhase('idle');
      setHint('Voice unavailable — type your response below');
      setShowTextInput(true);
      return;
    }

    await sendTurn(transcript);
  }, [sendTurn]);

  // ── VAD auto-stop ────────────────────────────────────────────────────────────

  const triggerAutoStop = useCallback(async () => {
    if (stoppingRef.current || doneRef.current) return;
    stoppingRef.current = true;
    const uri = await stopRecording();
    if (uri && !doneRef.current) runTurn(uri);
  }, [stopRecording, runTurn]);

  // ── Start listening ──────────────────────────────────────────────────────────

  const startListening = useCallback(async () => {
    if (doneRef.current) return;

    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) { setHint('Microphone permission required'); return; }

    try {
      await stopSpeech();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording } = await Audio.Recording.createAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      });

      silenceSince.current = null;
      stoppingRef.current = false;
      hasSpokeRef.current = false;

      recording.setOnRecordingStatusUpdate((status) => {
        if (!status.isRecording || doneRef.current || stoppingRef.current) return;
        const db = status.metering ?? -160; // null metering = silence, not max volume
        if (db >= SILENCE_DB) {
          hasSpokeRef.current = true;
          silenceSince.current = null;
        } else if (hasSpokeRef.current) {
          // only detect silence after user has spoken at least once
          if (silenceSince.current === null) silenceSince.current = Date.now();
          else if (Date.now() - silenceSince.current >= SILENCE_MS) {
            triggerAutoStop();
          }
        }
      });
      recording.setProgressUpdateInterval(100);

      recordingRef.current = recording;
      setPhase('recording');
      setHint('Listening… speak naturally');
    } catch (e) {
      console.warn('startListening error', e);
      setHint('Could not start recording');
      Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true }).catch(() => {});
    }
  }, [triggerAutoStop]);

  // Keep the ref in sync so sendTurn can call it
  useEffect(() => { startListeningRef.current = startListening; }, [startListening]);

  // ── Orb tap handler ──────────────────────────────────────────────────────────

  const handleOrbPress = useCallback(async () => {
    if (phase === 'processing' || phase === 'speaking' || phase === 'completed') return;

    if (phase === 'recording') {
      // Manual stop — user tapped to end their turn early
      const uri = await stopRecording();
      if (uri) runTurn(uri);
      return;
    }

    // idle → start listening
    await startListening();
  }, [phase, stopRecording, runTurn, startListening]);

  const handleTextSubmit = useCallback(() => {
    const text = textVal.trim();
    if (!text) return;
    sendTurn(text);
  }, [textVal, sendTurn]);

  // ── Cleanup ──────────────────────────────────────────────────────────────────

  const handleBack = useCallback(async () => {
    doneRef.current = true;
    stopAnims();
    await stopSpeech();
    await stopRecording();
    navigation.goBack();
  }, [stopAnims, stopRecording, navigation]);

  useEffect(() => () => {
    doneRef.current = true;
    stopSpeech().catch(() => {});
    stopRecording().catch(() => {});
  }, [stopRecording]);

  // ── Derived ──────────────────────────────────────────────────────────────────

  const orbColor    = { idle: '#4F46E5', recording: '#EF4444', processing: '#6B7280', speaking: '#10B981', completed: '#4F46E5' }[phase];
  const orbIcon     = { idle: 'mic-outline', recording: 'stop', processing: 'sync', speaking: 'volume-high', completed: 'checkmark' }[phase] as any;
  const statusLabel = { idle: 'Ready', recording: 'Listening…', processing: 'Thinking…', speaking: 'Speaking…', completed: 'Done' }[phase];

  const providers   = ui?.providers ?? [];
  const isCompleted = phase === 'completed';

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <SafeAreaView edges={['top']} style={styles.safeHeader}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>MindPath AI</Text>
          <View style={{ width: 38 }} />
        </View>
      </SafeAreaView>

      {/* Orb zone */}
      <View style={[styles.orbZone, isCompleted && styles.orbZoneCompact]}>
        <TouchableOpacity onPress={handleOrbPress} activeOpacity={0.85}>
          <View style={{ width: ORB_FULL, height: ORB_FULL, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={[styles.ring, {
              borderColor: orbColor,
              opacity: ringOpac,
              transform: [{ scale: ringScale }],
            }]} />
            <Animated.View style={[styles.orb, {
              backgroundColor: orbColor,
              transform: [
                { scale: phase === 'processing' ? 1 : orbScale },
                { rotate: phase === 'processing' ? spin : '0deg' },
              ],
            }]}>
              <Ionicons name={orbIcon} size={isCompleted ? 22 : 32} color="#fff" />
            </Animated.View>
          </View>
        </TouchableOpacity>

        <Text style={styles.statusText}>{statusLabel}</Text>
        {!!hint && <Text style={styles.hintText}>{hint}</Text>}
      </View>

      {/* Text input fallback */}
      {showTextInput && !isCompleted && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.textInputBar}
        >
          <TextInput
            style={styles.textInput}
            value={textVal}
            onChangeText={setTextVal}
            placeholder="Type your response…"
            placeholderTextColor="rgba(255,255,255,0.25)"
            returnKeyType="send"
            onSubmitEditing={handleTextSubmit}
            autoFocus
          />
          <TouchableOpacity
            style={[styles.sendBtn, !textVal.trim() && styles.sendBtnDisabled]}
            onPress={handleTextSubmit}
            disabled={!textVal.trim()}
            activeOpacity={0.75}
          >
            <Ionicons name="arrow-up" size={18} color="#fff" />
          </TouchableOpacity>
        </KeyboardAvoidingView>
      )}

      {/* Summary + Provider panel */}
      {isCompleted && (
        <Animated.View style={[styles.providerPane, { transform: [{ translateY: providerY }] }]}>
          <ScrollView showsVerticalScrollIndicator={false}>

            {/* ── Assessment Summary ── */}
            <View style={styles.summarySection}>
              <View style={styles.summaryTitleRow}>
                <Ionicons name="document-text-outline" size={16} color="rgba(255,255,255,0.6)" />
                <Text style={styles.summaryTitle}>Your Assessment Summary</Text>
              </View>

              {/* Condition + Severity + Score */}
              <View style={styles.summaryScoreRow}>
                {ui?.condition ? (
                  <View style={styles.summaryConditionPill}>
                    <Text style={styles.summaryConditionText}>{ui.condition}</Text>
                  </View>
                ) : null}
                {ui?.severity ? (
                  <View style={[styles.summarySeverityPill, { borderColor: sevColor(ui.severity) + '60' }]}>
                    <View style={[styles.severityDot, { backgroundColor: sevColor(ui.severity) }]} />
                    <Text style={[styles.summarySeverityText, { color: sevColor(ui.severity) }]}>{ui.severity}</Text>
                  </View>
                ) : null}
                {ui?.score != null && (
                  <Text style={styles.summaryScoreText}>Score: {ui.score}</Text>
                )}
              </View>

              {/* What the AI said as summary */}
              {!!summaryText && (
                <View style={styles.summaryMessageCard}>
                  <Text style={styles.summaryMessageLabel}>What we found</Text>
                  <Text style={styles.summaryMessageText}>{summaryText}</Text>
                </View>
              )}

              <Text style={styles.summaryDisclaimer}>
                This is not a clinical diagnosis. A licensed provider can give you a full evaluation.
              </Text>
            </View>

            {/* ── Matched Providers ── */}
            {providers.length > 0 && (
              <>
                <View style={styles.paneHeader}>
                  <Text style={styles.paneTitle}>
                    Matched providers{ui?.condition ? ` for ${ui.condition}` : ''}
                  </Text>
                </View>
                {providers.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.providerCard}
                    onPress={() => navigation.navigate('ProviderDetail', { providerId: p.id })}
                    activeOpacity={0.8}
                  >
                    <View style={styles.avatar}>
                      <Ionicons name="person" size={18} color="rgba(255,255,255,0.5)" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.provName}>{p.name}</Text>
                      <Text style={styles.provMeta}>{p.provider_type} · {p.city}, {p.state}</Text>
                    </View>
                    <View style={styles.ratingPill}>
                      <Ionicons name="star" size={10} color="#FBBF24" />
                      <Text style={styles.ratingText}>{p.rating?.toFixed(1)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.3)" />
                  </TouchableOpacity>
                ))}
              </>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#0D1117' },
  safeHeader:  { backgroundColor: 'transparent' },
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

  orbZone:        { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 20 },
  orbZoneCompact: { flex: 0, paddingVertical: 28 },

  ring: {
    position: 'absolute',
    width: ORB_FULL * 1.55, height: ORB_FULL * 1.55,
    borderRadius: (ORB_FULL * 1.55) / 2,
    borderWidth: 2, backgroundColor: 'transparent',
  },
  orb: {
    width: ORB_FULL, height: ORB_FULL, borderRadius: ORB_FULL / 2,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 12,
  },

  statusText: { fontSize: 14, color: 'rgba(255,255,255,0.45)', fontWeight: '500', letterSpacing: 0.6 },
  hintText:   { fontSize: 13, color: 'rgba(255,255,255,0.25)', textAlign: 'center', maxWidth: 260, lineHeight: 20 },

  providerPane: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: '58%',
    backgroundColor: '#13161E',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)',
    paddingTop: 16,
  },
  summarySection: {
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  summaryTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  summaryTitle:    { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.45)', letterSpacing: 0.8, textTransform: 'uppercase' },
  summaryScoreRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  summaryConditionPill: {
    backgroundColor: 'rgba(79,70,229,0.3)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(79,70,229,0.5)',
  },
  summaryConditionText: { fontSize: 13, fontWeight: '700', color: '#A5B4FC' },
  summarySeverityPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.05)',
  },
  severityDot: { width: 7, height: 7, borderRadius: 4 },
  summarySeverityText: { fontSize: 13, fontWeight: '600' },
  summaryScoreText: { fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },
  summaryMessageCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    gap: 6,
  },
  summaryMessageLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: 0.6, textTransform: 'uppercase' },
  summaryMessageText: { fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 22 },
  summaryDisclaimer: { fontSize: 11, color: 'rgba(255,255,255,0.25)', lineHeight: 17, fontStyle: 'italic' },
  paneHeader:    { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  paneTitle:     { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },

  providerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  provName:   { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  provMeta:   { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  ratingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4,
  },
  ratingText: { fontSize: 11, fontWeight: '700', color: '#FBBF24' },

  textInputBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 28,
    backgroundColor: '#13161E',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
  },
  textInput: {
    flex: 1, height: 44,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 22, paddingHorizontal: 16,
    fontSize: 15, color: '#fff',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#4F46E5',
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: 'rgba(79,70,229,0.35)' },
});
