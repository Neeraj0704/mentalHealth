import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, StatusBar, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { Colors, Spacing, Radius, Shadows } from '../theme';
import { sendVoiceTurn, MindpathUI } from '../services/api';
import { saveAssessmentSummary } from '../services/preferences';
import { getInstrument, calculateScore, Instrument } from '../services/instruments';

type Props = NativeStackScreenProps<HomeStackParamList, 'MiraChat'>;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const GREETING: Message = {
  id: 'greeting',
  role: 'assistant',
  content: "Hi, I'm Mira. Tell me a bit about what's been on your mind lately — I'm here to listen.",
};

export default function MiraChatScreen({ navigation }: Props) {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [options, setOptions] = useState<string[] | null>(null);

  // Instrument mode
  const [instrumentMode, setInstrumentMode] = useState(false);
  const [currentInstrument, setCurrentInstrument] = useState<Instrument | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [instrumentAnswers, setInstrumentAnswers] = useState<number[]>([]);

  const sessionId = useRef(Math.random().toString(36).slice(2) + Date.now().toString(36));
  const pendingUiRef = useRef<MindpathUI | null>(null);
  const qaItemsRef = useRef<Array<{ question: string; answer: string }>>([]);
  // Full conversation history (both sides) for summary generation
  const conversationRef = useRef<Array<{ role: string; content: string }>>([]);

  const handleInstrumentAnswer = (value: number) => {
    if (!currentInstrument) return;

    const answerLabel = currentInstrument.options[currentInstrument.optionValues.indexOf(value)];
    qaItemsRef.current = [
      ...qaItemsRef.current,
      { question: currentInstrument.questions[questionIndex].text, answer: answerLabel },
    ];

    const newAnswers = [...instrumentAnswers, value];
    const nextIndex = questionIndex + 1;

    if (nextIndex < currentInstrument.questions.length) {
      setInstrumentAnswers(newAnswers);
      setQuestionIndex(nextIndex);
      const nextQ: Message = {
        id: Date.now().toString() + Math.random(),
        role: 'assistant',
        content: currentInstrument.questions[nextIndex].text,
      };
      setMessages(prev => [nextQ, ...prev]);
    } else {
      // All questions answered — score and navigate to result screen
      const result = calculateScore(currentInstrument, newAnswers);
      const ui = pendingUiRef.current!;

      setInstrumentMode(false);
      setCurrentInstrument(null);
      setInstrumentAnswers([]);

      saveAssessmentSummary({
        condition: ui.condition ?? currentInstrument.id,
        severity: result.severity,
        score: result.score,
        message: result.message,
      });

      navigation.navigate('AssessmentResult', {
        condition: ui.condition ?? currentInstrument.id,
        severity: result.severity,
        score: result.score,
        instrumentId: currentInstrument.id,
        qaItems: qaItemsRef.current,
        conversation: conversationRef.current,
      });
    }
  };

  const startInstrument = (ui: MindpathUI) => {
    const instrument = getInstrument(ui.condition ?? '');
    pendingUiRef.current = ui;
    qaItemsRef.current = [];

    if (!instrument) {
      // No formal instrument — save and navigate with empty qa
      saveAssessmentSummary({
        condition: ui.condition ?? 'General',
        severity: ui.severity ?? undefined,
        score: ui.score ?? undefined,
        message: "Based on our conversation, I've matched you with relevant providers.",
      });
      navigation.navigate('AssessmentResult', {
        condition: ui.condition ?? 'General',
        severity: ui.severity ?? 'General',
        score: 0,
        instrumentId: '',
        qaItems: [],
        conversation: conversationRef.current,
      });
      return;
    }

    const introMsg: Message = {
      id: Date.now().toString() + '0',
      role: 'assistant',
      content: instrument.introMessage,
    };
    const firstQ: Message = {
      id: Date.now().toString() + '1',
      role: 'assistant',
      content: instrument.questions[0].text,
    };
    setMessages(prev => [firstQ, introMsg, ...prev]);
    setCurrentInstrument(instrument);
    setQuestionIndex(0);
    setInstrumentAnswers([]);
    setInstrumentMode(true);
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isThinking) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: trimmed };
    setMessages(prev => [userMsg, ...prev]);
    conversationRef.current = [...conversationRef.current, { role: 'user', content: trimmed }];
    setInputText('');
    setOptions(null);
    setIsThinking(true);

    try {
      const response = await sendVoiceTurn(sessionId.current, trimmed);
      const ui = response.mindpath_ui;

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.speech,
      };
      setMessages(prev => [assistantMsg, ...prev]);
      conversationRef.current = [...conversationRef.current, { role: 'assistant', content: response.speech }];

      if (ui.options?.length) setOptions(ui.options);

      if (ui.phase === 'instrument') {
        startInstrument(ui);
      } else if (ui.phase === 'completed') {
        // Fallback: backend completed without instrument phase
        await saveAssessmentSummary({
          condition: ui.condition ?? 'General',
          severity: ui.severity ?? undefined,
          score: ui.score ?? undefined,
          message: response.speech,
        });
        navigation.navigate('AssessmentResult', {
          condition: ui.condition ?? 'General',
          severity: ui.severity ?? 'General',
          score: ui.score ?? 0,
          instrumentId: '',
          qaItems: [],
          conversation: conversationRef.current,
        });
      }
    } catch {
      setMessages(prev => [{
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again.",
      }, ...prev]);
    } finally {
      setIsThinking(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowMira]}>
        {!isUser && (
          <View style={styles.avatarDot}>
            <Ionicons name="aperture-outline" size={14} color="#fff" />
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleMira]}>
          <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextMira]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Mira</Text>
          <Text style={styles.headerSub}>AI Health Assistant</Text>
        </View>
        <TouchableOpacity
          style={styles.voiceBtn}
          onPress={() => navigation.navigate('VoiceAssessment')}
          activeOpacity={0.8}
        >
          <Ionicons name="mic-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </SafeAreaView>

      <FlatList
        data={messages}
        keyExtractor={m => m.id}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          isThinking ? (
            <View style={[styles.messageRow, styles.messageRowMira]}>
              <View style={styles.avatarDot}>
                <Ionicons name="aperture-outline" size={14} color="#fff" />
              </View>
              <View style={[styles.bubble, styles.bubbleMira, styles.typingBubble]}>
                <ActivityIndicator size="small" color={Colors.textTertiary} />
              </View>
            </View>
          ) : null
        }
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Instrument answer buttons */}
        {instrumentMode && currentInstrument && (
          <View style={styles.instrumentAnswers}>
            <View style={styles.instrumentProgress}>
              <Text style={styles.instrumentProgressText}>
                Question {questionIndex + 1} of {currentInstrument.questions.length}
              </Text>
              <View style={styles.instrumentProgressBar}>
                <View
                  style={[
                    styles.instrumentProgressFill,
                    { width: `${(questionIndex / currentInstrument.questions.length) * 100}%` },
                  ]}
                />
              </View>
            </View>
            {currentInstrument.options.map((label, i) => (
              <TouchableOpacity
                key={label}
                style={styles.answerBtn}
                onPress={() => handleInstrumentAnswer(currentInstrument.optionValues[i])}
                activeOpacity={0.75}
              >
                <Text style={styles.answerBtnText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Conversational option chips */}
        {!instrumentMode && options && options.length > 0 && (
          <View style={styles.optionsRow}>
            {options.map(opt => (
              <TouchableOpacity
                key={opt}
                style={styles.optionChip}
                onPress={() => sendMessage(opt)}
                activeOpacity={0.8}
              >
                <Text style={styles.optionChipText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Text input — hidden during instrument mode */}
        {!instrumentMode && (
          <SafeAreaView edges={['bottom']} style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Message Mira..."
              placeholderTextColor={Colors.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={() => sendMessage(inputText)}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!inputText.trim() || isThinking) && styles.sendBtnDisabled]}
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim() || isThinking}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-up" size={20} color="#fff" />
            </TouchableOpacity>
          </SafeAreaView>
        )}

        {instrumentMode && <SafeAreaView edges={['bottom']} style={styles.instrumentSafeArea} />}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textTertiary, marginTop: 1 },
  voiceBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center', justifyContent: 'center',
  },
  listContent: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10, gap: 8 },
  messageRowUser: { justifyContent: 'flex-end' },
  messageRowMira: { justifyContent: 'flex-start' },
  avatarDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleMira: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    ...Shadows.xs,
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  bubbleTextUser: { color: '#fff' },
  bubbleTextMira: { color: Colors.textPrimary },
  typingBubble: { paddingVertical: 14, paddingHorizontal: 18 },
  optionsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: Spacing.md, paddingBottom: 8,
  },
  optionChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1.5, borderColor: Colors.primary + '55',
  },
  optionChipText: { fontSize: 13, fontWeight: '500', color: Colors.primary },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.border },
  instrumentAnswers: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingHorizontal: Spacing.md,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  instrumentProgress: { marginBottom: 4 },
  instrumentProgressText: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  instrumentProgressBar: {
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginBottom: 8,
  },
  instrumentProgressFill: {
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  answerBtn: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 4,
  },
  answerBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  instrumentSafeArea: { backgroundColor: Colors.surface },
});
