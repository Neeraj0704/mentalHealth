import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { saveAssessmentSummary } from '../services/preferences';
import { Colors, Spacing, Radius, Shadows, Typography } from '../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'Assessment'>;

const { width } = Dimensions.get('window');

// ─── Condition Definitions ────────────────────────────────────────────────────

type ConditionId = 'anxiety' | 'depression' | 'trauma' | 'notsure';

interface ConditionDef {
  id: ConditionId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  instrument: 'GAD7' | 'PHQ9' | 'PCPTSD5' | null;
  searchTerm: string;
}

const CONDITIONS: ConditionDef[] = [
  { id: 'anxiety', label: 'Anxiety', icon: 'pulse-outline', instrument: 'GAD7', searchTerm: 'Anxiety' },
  { id: 'depression', label: 'Depression', icon: 'cloud-outline', instrument: 'PHQ9', searchTerm: 'Depression' },
  { id: 'trauma', label: 'PTSD / Trauma', icon: 'shield-outline', instrument: 'PCPTSD5', searchTerm: 'Trauma' },
  { id: 'notsure', label: 'Not Sure', icon: 'help-circle-outline', instrument: null, searchTerm: '' },
];

// ─── Instrument Question Data ─────────────────────────────────────────────────

const SCALE_ANSWERS = [
  { label: 'Not at all', value: 0 },
  { label: 'Several days', value: 1 },
  { label: 'More than half the days', value: 2 },
  { label: 'Nearly every day', value: 3 },
];

const YESNO_ANSWERS = [
  { label: 'Yes', value: 1 },
  { label: 'No', value: 0 },
];

const ASRS_ANSWERS = [
  { label: 'Never', value: 0 },
  { label: 'Rarely', value: 1 },
  { label: 'Sometimes', value: 2 },
  { label: 'Often', value: 3 },
  { label: 'Very Often', value: 4 },
];

const GAD7_QUESTIONS = [
  'Feeling nervous, anxious, or on edge',
  'Not being able to stop or control worrying',
  'Worrying too much about different things',
  'Trouble relaxing',
  'Being so restless that it is hard to sit still',
  'Becoming easily annoyed or irritable',
  'Feeling afraid, as if something awful might happen',
];

const GAD7_STEM = 'Over the last two weeks, how often have you been bothered by the following problems?';

const PHQ9_QUESTIONS = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed or hopeless',
  'Trouble falling asleep, staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  "Feeling bad about yourself, or that you're a failure or have let yourself or your family down",
  'Trouble concentrating on things, such as reading the newspaper or watching television',
  'Moving or speaking so slowly that other people could have noticed, or being so fidgety or restless that you have been moving around a lot more than usual',
  'Thoughts that you would be better off dead or of hurting yourself in some way',
];

const PHQ9_STEM = 'Over the last 2 weeks, how often have you been bothered by the following problems?';

const PCPTSD5_GATE = 'Have you ever experienced a frightening, horrible, or traumatic event?\n\nFor example: a serious accident or fire, a physical or sexual assault or abuse, an earthquake or flood, a war, or seeing someone be killed or seriously injured.';

const PCPTSD5_STEM = 'In the past month, have you…';

const PCPTSD5_QUESTIONS = [
  'Had nightmares about the event(s) or thought about the event(s) when you did not want to?',
  'Tried hard not to think about the event(s) or went out of your way to avoid situations that reminded you of the event(s)?',
  'Been constantly on guard, watchful, or easily startled?',
  'Felt numb or detached from people, activities, or your surroundings?',
  'Felt guilty or unable to stop blaming yourself or others for the event(s) or any problems the event(s) may have caused?',
];

const ASRS_STEM = 'Please answer each question as best you can.';

const ASRS_QUESTIONS = [
  'How often do you have trouble wrapping up the final details of a project, once the challenging parts have been done?',
  'How often do you have difficulty getting things in order when you have to do a task that requires organization?',
  'How often do you have problems remembering appointments or obligations?',
  'When you have a task that requires a lot of thought, how often do you avoid or delay getting started?',
  'How often do you fidget or squirm with your hands or feet when you have to sit down for a long time?',
  'How often do you feel overly active and compelled to do things, like you were driven by a motor?',
];

const MDQ_Q1_STEM = 'Has there ever been a period of time when you were not your usual self and…';

const MDQ_Q1_ITEMS = [
  'You felt so good or so hyper that other people thought you were not your normal self, or you were so hyper that you got into trouble?',
  'You were so irritable that you shouted at people or started fights or arguments?',
  'You felt much more self-confident than usual?',
  'You got much less sleep than usual and found you didn\'t really miss it?',
  'You were much more talkative or spoke much faster than usual?',
  'Thoughts raced through your head or you couldn\'t slow your mind down?',
  'You were so easily distracted by things around you that you had trouble concentrating or staying on track?',
  'You had much more energy than usual?',
  'You were much more active or did many more things than usual?',
  'You were much more social or outgoing than usual, for example you telephoned friends in the middle of the night?',
  'You were much more interested in sex than usual?',
  'You did things that were unusual for you or that other people might have thought were excessive, foolish, or risky?',
  'Spending money got you or your family into trouble?',
];

const MDQ_Q3_OPTIONS = ['No problem', 'Minor problem', 'Moderate problem', 'Serious problem'];

// ─── Scoring ──────────────────────────────────────────────────────────────────

interface ResultData {
  condition: string;
  severity: string;
  message: string;
  showCrisis: boolean;
  searchTerm: string;
}

function scoreGAD7(answers: number[]): ResultData {
  const total = answers.reduce((a, b) => a + b, 0);
  let severity = 'Minimal';
  let message = 'Your responses suggest minimal anxiety symptoms. Speaking with a provider can still be helpful.';
  if (total >= 15) {
    severity = 'Severe';
    message = 'Based on your responses, you may be experiencing severe anxiety. I can help connect you with a specialist.';
  } else if (total >= 10) {
    severity = 'Moderate';
    message = 'Based on your responses, you may be experiencing moderate anxiety. I can help you find providers who specialize in this.';
  } else if (total >= 5) {
    severity = 'Mild';
    message = 'Based on your responses, you may be experiencing mild anxiety. I can help you find providers who specialize in this.';
  }
  return { condition: 'Anxiety', severity, message, showCrisis: false, searchTerm: 'Anxiety' };
}

function scorePHQ9(answers: number[]): ResultData {
  const total = answers.reduce((a, b) => a + b, 0);
  const showCrisis = answers[8] >= 1;
  let severity = 'None-minimal';
  let message = 'Your responses suggest minimal depression symptoms. A provider can still offer support.';
  if (total >= 20) {
    severity = 'Severe';
    message = 'Based on your responses, you may be experiencing severe depression. I can help connect you with a specialist.';
  } else if (total >= 15) {
    severity = 'Moderately Severe';
    message = 'Based on your responses, you may be experiencing moderately severe depression. I can help connect you with a specialist.';
  } else if (total >= 10) {
    severity = 'Moderate';
    message = 'Based on your responses, you may be experiencing moderate depression. I can help you find providers who specialize in this.';
  } else if (total >= 5) {
    severity = 'Mild';
    message = 'Based on your responses, you may be experiencing mild depression. I can help you find providers who specialize in this.';
  }
  return { condition: 'Depression', severity, message, showCrisis, searchTerm: 'Depression' };
}

function scorePCPTSD5(answers: number[], gateYes: boolean): ResultData {
  if (!gateYes) {
    return {
      condition: 'Trauma',
      severity: 'Below threshold',
      message: 'Your responses are below the threshold for PTSD. A provider can still offer support.',
      showCrisis: false,
      searchTerm: 'Trauma',
    };
  }
  const total = answers.reduce((a, b) => a + b, 0);
  const positive = total >= 3;
  return {
    condition: 'Trauma',
    severity: positive ? 'Screen positive' : 'Below threshold',
    message: positive
      ? 'Based on your responses, you may be experiencing symptoms related to trauma. I can help you find specialists.'
      : 'Your responses are below the threshold for PTSD. A provider can still offer support.',
    showCrisis: false,
    searchTerm: 'Trauma',
  };
}

function scoreASRS(answers: number[]): ResultData {
  let positiveCount = 0;
  answers.forEach((value, index) => {
    if (index <= 2 && value >= 2) positiveCount++;
    if (index >= 3 && value >= 3) positiveCount++;
  });
  const positive = positiveCount >= 4;
  return {
    condition: 'ADHD',
    severity: positive ? 'Positive' : 'Negative',
    message: positive
      ? 'Your responses suggest you may be experiencing symptoms consistent with ADHD. I can help you find providers who specialize in this.'
      : 'Your responses do not suggest ADHD symptoms at this time. A provider can still offer support.',
    showCrisis: false,
    searchTerm: 'ADHD',
  };
}

function scoreMDQ(q1: boolean[], q2: boolean, q3: string): ResultData {
  const q1Count = q1.filter(Boolean).length;
  const positive = q1Count >= 7 && q2 && (q3 === 'Moderate problem' || q3 === 'Serious problem');
  return {
    condition: 'Bipolar',
    severity: positive ? 'Positive' : 'Negative',
    message: positive
      ? 'Your responses suggest you may benefit from further evaluation for mood disorders. I can help connect you with a specialist.'
      : 'Your responses do not suggest bipolar symptoms at this time. A provider can still offer support.',
    showCrisis: false,
    searchTerm: 'Bipolar',
  };
}

function getNoInstrumentResult(condition: ConditionDef): ResultData {
  const messages: Record<string, string> = {
    grief: 'Grief can be deeply difficult. I can help you find providers who specialize in supporting people through loss.',
    relationships: 'Relationship challenges are common. I can help you find therapists who specialize in this area.',
    notsure: "That's okay. I can help you find a provider who can work with you to understand what you're experiencing.",
  };
  return {
    condition: condition.label,
    severity: '',
    message: messages[condition.id] ?? "I can help you find a provider.",
    showCrisis: false,
    searchTerm: condition.searchTerm,
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AssessmentScreen({ navigation }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCondition, setSelectedCondition] = useState<ConditionDef | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [pcptsdGate, setPcptsdGate] = useState<boolean | null>(null);
  const [mdqQ1, setMdqQ1] = useState<boolean[]>(new Array(13).fill(false));
  const [mdqQ2, setMdqQ2] = useState<boolean | null>(null);
  const [mdqQ3, setMdqQ3] = useState<string | null>(null);
  const [mdqSubStep, setMdqSubStep] = useState<'q1' | 'q2' | 'q3'>('q1');
  const [result, setResult] = useState<ResultData | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (result) {
      saveAssessmentSummary({
        condition: result.condition,
        severity: result.severity || undefined,
        message: result.message,
      }).catch(() => {});
    }
  }, [result]);

  const animateTransition = (callback: () => void) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      callback();
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const handleConditionSelect = (condition: ConditionDef) => {
    setSelectedCondition(condition);
  };

  const handleConditionContinue = () => {
    if (!selectedCondition) return;
    if (!selectedCondition.instrument) {
      const r = getNoInstrumentResult(selectedCondition);
      setResult(r);
      animateTransition(() => setStep(3));
      return;
    }
    setAnswers([]);
    setQuestionIndex(0);
    setPcptsdGate(null);
    setMdqQ1(new Array(13).fill(false));
    setMdqQ2(null);
    setMdqQ3(null);
    setMdqSubStep('q1');
    animateTransition(() => setStep(2));
  };

  const handleAnswer = (value: number) => {
    const instrument = selectedCondition?.instrument;
    if (!instrument) return;

    if (instrument === 'PCPTSD5' && pcptsdGate === null) {
      const gateYes = value === 1;
      setPcptsdGate(gateYes);
      if (!gateYes) {
        const r = scorePCPTSD5([], false);
        setResult(r);
        animateTransition(() => setStep(3));
        return;
      }
      animateTransition(() => setQuestionIndex(0));
      return;
    }

    const questions = getQuestions(instrument);
    const newAnswers = [...answers, value];

    if (questionIndex < questions.length - 1) {
      setAnswers(newAnswers);
      animateTransition(() => setQuestionIndex(questionIndex + 1));
    } else {
      // Last question — score
      const r = computeResult(instrument, newAnswers);
      setResult(r);
      animateTransition(() => setStep(3));
    }
  };

  const handleMdqQ1Continue = () => {
    animateTransition(() => setMdqSubStep('q2'));
  };

  const handleMdqQ2 = (yes: boolean) => {
    setMdqQ2(yes);
    animateTransition(() => setMdqSubStep('q3'));
  };

  const handleMdqQ3 = (option: string) => {
    setMdqQ3(option);
    const r = scoreMDQ(mdqQ1, mdqQ2 ?? false, option);
    setResult(r);
    animateTransition(() => setStep(3));
  };

  const handleBack = () => {
    const instrument = selectedCondition?.instrument;
    if (step === 1) return;
    if (step === 3) {
      animateTransition(() => {
        setStep(2);
        setResult(null);
      });
      return;
    }
    if (step === 2) {
      if (instrument === 'MDQ') {
        if (mdqSubStep === 'q3') { animateTransition(() => setMdqSubStep('q2')); return; }
        if (mdqSubStep === 'q2') { animateTransition(() => setMdqSubStep('q1')); return; }
        animateTransition(() => { setStep(1); setAnswers([]); });
        return;
      }
      if (instrument === 'PCPTSD5' && pcptsdGate !== null && questionIndex === 0) {
        animateTransition(() => setPcptsdGate(null));
        return;
      }
      if (questionIndex > 0) {
        setAnswers(answers.slice(0, -1));
        animateTransition(() => setQuestionIndex(questionIndex - 1));
        return;
      }
      animateTransition(() => { setStep(1); setAnswers([]); });
    }
  };

  const handleFindProviders = () => {
    if (!result) return;
    if (!result.searchTerm) {
      // "Not Sure" — go to Results with no filter so all providers are shown
      navigation.reset({
        index: 1,
        routes: [
          { name: 'Home' },
          { name: 'Results', params: { query: '', specialty: '' } },
        ],
      });
      return;
    }
    navigation.reset({
      index: 1,
      routes: [
        { name: 'Home' },
        { name: 'Results', params: { query: result.searchTerm, specialty: result.searchTerm } },
      ],
    });
  };

  const handleSkip = () => {
    navigation.getParent()?.navigate('HomeTab');
  };

  const computeResult = (instrument: string, ans: number[]): ResultData => {
    switch (instrument) {
      case 'GAD7': return scoreGAD7(ans);
      case 'PHQ9': return scorePHQ9(ans);
      case 'PCPTSD5': return scorePCPTSD5(ans, pcptsdGate ?? false);
      case 'ASRS': return scoreASRS(ans);
      default: return { condition: '', severity: '', message: '', showCrisis: false, searchTerm: '' };
    }
  };

  const getQuestions = (instrument: string): string[] => {
    switch (instrument) {
      case 'GAD7': return GAD7_QUESTIONS;
      case 'PHQ9': return PHQ9_QUESTIONS;
      case 'PCPTSD5': return PCPTSD5_QUESTIONS;
      case 'ASRS': return ASRS_QUESTIONS;
      default: return [];
    }
  };

  const getAnswerOptions = (instrument: string) => {
    if (instrument === 'PCPTSD5') return YESNO_ANSWERS;
    if (instrument === 'ASRS') return ASRS_ANSWERS;
    return SCALE_ANSWERS;
  };

  const getStem = (instrument: string): string => {
    if (instrument === 'GAD7') return GAD7_STEM;
    if (instrument === 'PHQ9') return PHQ9_STEM;
    if (instrument === 'PCPTSD5') return PCPTSD5_STEM;
    if (instrument === 'ASRS') return ASRS_STEM;
    return '';
  };

  const getTotalQuestions = (instrument: string): number => {
    if (instrument === 'PCPTSD5') return PCPTSD5_QUESTIONS.length;
    return getQuestions(instrument).length;
  };

  // ── Render Step 1 ─────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepLabel}>Step 1 of 3</Text>
      <Text style={styles.heading}>What's been affecting{'\n'}you most lately?</Text>
      <Text style={styles.subheading}>Select what resonates most, or talk to Mira if you are not sure.</Text>

      {/* Talk to Mira featured card */}
      <TouchableOpacity
        style={styles.miraCard}
        onPress={() => navigation.getParent()?.navigate('HomeTab', { screen: 'MiraChat' })}
        activeOpacity={0.85}
      >
        <View style={styles.miraCardIcon}>
          <Ionicons name="aperture-outline" size={26} color="#fff" />
        </View>
        <View style={styles.miraCardText}>
          <Text style={styles.miraCardTitle}>Not sure? Talk to Mira</Text>
          <Text style={styles.miraCardSub}>Our AI assistant will help figure out what you are feeling</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>

      <Text style={styles.orLabel}>Or select a condition</Text>

      <View style={styles.conditionGrid}>
        {CONDITIONS.filter(c => c.id !== 'notsure').map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.conditionCard, selectedCondition?.id === c.id && styles.conditionCardActive]}
            onPress={() => handleConditionSelect(c)}
            activeOpacity={0.8}
          >
            <View style={[styles.conditionIcon, selectedCondition?.id === c.id && styles.conditionIconActive]}>
              <Ionicons name={c.icon} size={22} color={selectedCondition?.id === c.id ? Colors.textInverse : Colors.primary} />
            </View>
            <Text style={[styles.conditionLabel, selectedCondition?.id === c.id && styles.conditionLabelActive]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  // ── Render Step 2 ─────────────────────────────────────────────────────────

  const renderStep2 = () => {
    const instrument = selectedCondition?.instrument;
    if (!instrument) return null;

    // MDQ special handling
    if (instrument === 'MDQ') {
      if (mdqSubStep === 'q1') return renderMDQQ1();
      if (mdqSubStep === 'q2') return renderMDQQ2();
      if (mdqSubStep === 'q3') return renderMDQQ3();
    }

    // PCPTSD5 gate question
    if (instrument === 'PCPTSD5' && pcptsdGate === null) {
      return (
        <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.stemText}>{PCPTSD5_GATE}</Text>
          <View style={styles.answersStack}>
            {YESNO_ANSWERS.map((a) => (
              <TouchableOpacity
                key={a.label}
                style={styles.answerBtn}
                onPress={() => handleAnswer(a.value)}
                activeOpacity={0.8}
              >
                <Text style={styles.answerBtnText}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      );
    }

    const questions = getQuestions(instrument);
    const answers_opts = getAnswerOptions(instrument);
    const stem = getStem(instrument);
    const total = getTotalQuestions(instrument);

    return (
      <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepLabel}>Question {questionIndex + 1} of {total}</Text>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${((questionIndex + 1) / total) * 100}%` }]} />
        </View>
        <Text style={styles.stemText}>{stem}</Text>
        <Text style={styles.questionText}>{questions[questionIndex]}</Text>
        <View style={styles.answersStack}>
          {answers_opts.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={styles.answerBtn}
              onPress={() => handleAnswer(a.value)}
              activeOpacity={0.8}
            >
              <Text style={styles.answerBtnText}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderMDQQ1 = () => (
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepLabel}>Step 2 of 3</Text>
      <Text style={styles.stemText}>{MDQ_Q1_STEM}</Text>
      <Text style={styles.subheading}>Select all that apply.</Text>
      <View style={styles.mdqList}>
        {MDQ_Q1_ITEMS.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.mdqItem, mdqQ1[i] && styles.mdqItemActive]}
            onPress={() => {
              const updated = [...mdqQ1];
              updated[i] = !updated[i];
              setMdqQ1(updated);
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.mdqCheckbox, mdqQ1[i] && styles.mdqCheckboxActive]}>
              {mdqQ1[i] && <Ionicons name="checkmark" size={14} color={Colors.textInverse} />}
            </View>
            <Text style={[styles.mdqItemText, mdqQ1[i] && styles.mdqItemTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderMDQQ2 = () => (
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stemText}>If you checked YES to more than one of the above, have several of these ever happened during the same period of time?</Text>
      <View style={styles.answersStack}>
        {[{ label: 'Yes', value: true }, { label: 'No', value: false }].map((a) => (
          <TouchableOpacity
            key={a.label}
            style={styles.answerBtn}
            onPress={() => handleMdqQ2(a.value)}
            activeOpacity={0.8}
          >
            <Text style={styles.answerBtnText}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderMDQQ3 = () => (
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stemText}>How much of a problem did any of these cause you, such as being unable to work, having family or money troubles, getting into arguments or fights?</Text>
      <View style={styles.answersStack}>
        {MDQ_Q3_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={styles.answerBtn}
            onPress={() => handleMdqQ3(opt)}
            activeOpacity={0.8}
          >
            <Text style={styles.answerBtnText}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  // ── Render Step 3 ─────────────────────────────────────────────────────────

  const renderStep3 = () => {
    if (!result) return null;
    const instrument = selectedCondition?.instrument;
    const questions = instrument ? getQuestions(instrument) : [];
    const answerOptions = instrument ? getAnswerOptions(instrument) : SCALE_ANSWERS;

    const severityColor = ({
      Minimal: Colors.success, Mild: Colors.info,
      Moderate: Colors.warning, 'Moderately Severe': Colors.error,
      Severe: Colors.error, Positive: Colors.warning, Negative: Colors.success,
    } as Record<string, string>)[result.severity] ?? Colors.info;

    return (
      <ScrollView contentContainerStyle={[styles.stepContent, { paddingTop: Spacing.md }]} showsVerticalScrollIndicator={false}>

        {/* Result header card */}
        <View style={[styles.summaryHeaderCard, { borderLeftColor: severityColor }]}>
          <View style={styles.summaryHeaderTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryConditionLabel}>{result.condition}</Text>
              {result.severity ? (
                <View style={[styles.severityPill, { backgroundColor: severityColor + '18', borderColor: severityColor + '40' }]}>
                  <View style={[styles.severityDotInline, { backgroundColor: severityColor }]} />
                  <Text style={[styles.severityText, { color: severityColor }]}>{result.severity}</Text>
                </View>
              ) : null}
            </View>
            <Ionicons name="checkmark-circle" size={40} color={severityColor} />
          </View>
          <Text style={styles.resultMessage}>{result.message}</Text>
        </View>

        {/* Question-answer breakdown */}
        {questions.length > 0 && answers.length > 0 && (
          <View style={styles.responsesSection}>
            <View style={styles.responsesSectionHeader}>
              <Ionicons name="list-outline" size={15} color={Colors.primary} />
              <Text style={styles.responsesSectionTitle}>Your responses</Text>
              {instrument && (
                <View style={styles.instrumentBadge}>
                  <Text style={styles.instrumentBadgeText}>{instrument}</Text>
                </View>
              )}
            </View>
            {questions.map((q, i) => {
              const val = answers[i];
              const label = answerOptions.find(a => a.value === val)?.label ?? String(val);
              const intensity = val / (answerOptions.length - 1);
              const dotColor = intensity > 0.6 ? Colors.error : intensity > 0.3 ? Colors.warning : Colors.success;
              return (
                <View key={i} style={styles.responseRow}>
                  <View style={[styles.responseDot, { backgroundColor: dotColor }]} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={styles.responseQuestion}>{q}</Text>
                    <Text style={[styles.responseAnswer, { color: dotColor }]}>{label}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* MDQ special case — show checkmark count */}
        {instrument === 'MDQ' && mdqQ1.filter(Boolean).length > 0 && (
          <View style={styles.responsesSection}>
            <View style={styles.responsesSectionHeader}>
              <Ionicons name="list-outline" size={15} color={Colors.primary} />
              <Text style={styles.responsesSectionTitle}>Your responses</Text>
              <View style={styles.instrumentBadge}>
                <Text style={styles.instrumentBadgeText}>MDQ</Text>
              </View>
            </View>
            <Text style={styles.mdqSummaryText}>
              You endorsed {mdqQ1.filter(Boolean).length} of 13 mood symptoms.
              {mdqQ2 !== null && ` Multiple symptoms occurred together: ${mdqQ2 ? 'Yes' : 'No'}.`}
              {mdqQ3 && ` Impact level: ${mdqQ3}.`}
            </Text>
          </View>
        )}

        {result.showCrisis && (
          <View style={styles.crisisCard}>
            <Ionicons name="call-outline" size={18} color={Colors.error} />
            <View style={{ flex: 1 }}>
              <Text style={styles.crisisTitle}>Crisis Support Available</Text>
              <Text style={styles.crisisText}>
                If you're having thoughts of self-harm, please reach out to the 988 Suicide & Crisis Lifeline by calling or texting 988.
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.disclaimer}>
          This screening is not a diagnosis. A licensed provider can give you a full evaluation.
        </Text>
      </ScrollView>
    );
  };

  // ── Header / Progress ─────────────────────────────────────────────────────

  const showBack = step > 1 || (step === 2 && questionIndex > 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.headerBtn, !showBack && { opacity: 0 }]}
            onPress={handleBack}
            disabled={!showBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.stepDots}>
            {[1, 2, 3].map((s) => (
              <View key={s} style={[styles.stepDot, step === s && styles.stepDotActive]} />
            ))}
          </View>
          <TouchableOpacity style={styles.headerBtn} onPress={handleSkip} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </Animated.View>

      {/* Bottom CTA */}
      <SafeAreaView edges={['bottom']} style={styles.bottomSafe}>
        {step === 1 && (
          <TouchableOpacity
            style={[styles.primaryBtn, !selectedCondition && styles.primaryBtnDisabled]}
            onPress={handleConditionContinue}
            disabled={!selectedCondition}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.textInverse} />
          </TouchableOpacity>
        )}
        {step === 2 && selectedCondition?.instrument === 'MDQ' && mdqSubStep === 'q1' && (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleMdqQ1Continue}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.textInverse} />
          </TouchableOpacity>
        )}
        {step === 3 && (
          <View style={styles.resultActions}>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleFindProviders} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Find Providers</Text>
              <Ionicons name="search" size={18} color={Colors.textInverse} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleSkip} activeOpacity={0.8}>
              <Text style={styles.secondaryBtnText}>Explore on my own</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeTop: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  stepDots: { flexDirection: 'row', gap: 6 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  stepDotActive: { width: 22, backgroundColor: Colors.primary },
  content: { flex: 1 },
  stepContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  stepLabel: {
    ...Typography.labelSmall,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  heading: {
    ...Typography.heading2,
    marginBottom: Spacing.sm,
  },
  subheading: {
    ...Typography.bodySmall,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  miraCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.primary, borderRadius: Radius.lg,
    padding: 16, marginBottom: 20,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  miraCardIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  miraCardText: { flex: 1 },
  miraCardTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 3 },
  miraCardSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 17 },
  orLabel: {
    fontSize: 12, fontWeight: '600', color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 12,
  },
  conditionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  conditionCard: {
    width: (width - Spacing.md * 2 - 10) / 2,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'flex-start',
    gap: 10,
    ...Shadows.xs,
  },
  conditionCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  conditionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conditionIconActive: {
    backgroundColor: Colors.primary,
  },
  conditionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  conditionLabelActive: {
    color: Colors.primary,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  stemText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  questionText: {
    ...Typography.heading3,
    marginBottom: Spacing.lg,
    lineHeight: 28,
  },
  answersStack: { gap: 10 },
  answerBtn: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadows.xs,
  },
  answerBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  mdqList: { gap: 10 },
  mdqItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  mdqItemActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  mdqCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  mdqCheckboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  mdqItemText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  mdqItemTextActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
  summaryHeaderCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    gap: 10,
    ...Shadows.sm,
  },
  summaryHeaderTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryConditionLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  severityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    marginBottom: 4,
  },
  severityDotInline: { width: 7, height: 7, borderRadius: 4 },
  severityText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  resultMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  responsesSection: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    gap: 12,
    ...Shadows.xs,
  },
  responsesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 4,
  },
  responsesSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  instrumentBadge: {
    backgroundColor: Colors.primaryBg,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  instrumentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  responseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  responseDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  responseQuestion: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  responseAnswer: {
    fontSize: 13,
    fontWeight: '700',
  },
  mdqSummaryText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  crisisCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.errorBg,
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.error,
    marginBottom: Spacing.md,
  },
  crisisTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.error,
    marginBottom: 4,
  },
  crisisText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.textTertiary,
    lineHeight: 18,
    fontStyle: 'italic',
    marginTop: 4,
  },
  bottomSafe: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    ...Shadows.sm,
  },
  resultActions: { gap: 10, padding: Spacing.md },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: 16,
    margin: Spacing.md,
  },
  primaryBtnDisabled: { backgroundColor: Colors.border },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textInverse,
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
});
