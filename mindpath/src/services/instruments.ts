export interface InstrumentQuestion {
  text: string;
}

export interface ScoreRange {
  label: string;
  max: number;
}

export interface Instrument {
  id: string;
  title: string;
  questions: InstrumentQuestion[];
  options: string[];
  optionValues: number[];
  scoreRanges: ScoreRange[];
  introMessage: string;
  outroPrefix: string;
}

export interface ScoreResult {
  score: number;
  severity: string;
  message: string;
}

// ── GAD-7 (Generalized Anxiety Disorder) ─────────────────────────────────────

const GAD7: Instrument = {
  id: 'GAD7',
  title: 'GAD-7',
  introMessage:
    "Thank you for sharing that with me. I'd like to ask you a few quick questions about how you've been feeling over the past two weeks. Just tap the answer that feels most accurate.",
  outroPrefix: 'Your responses suggest',
  questions: [
    { text: 'How often have you been feeling nervous, anxious, or on edge?' },
    { text: 'How often have you not been able to stop or control worrying?' },
    { text: 'How often have you been worrying too much about different things?' },
    { text: 'How often have you had trouble relaxing?' },
    { text: 'How often have you been so restless it was hard to sit still?' },
    { text: 'How often have you become easily annoyed or irritable?' },
    { text: 'How often have you felt afraid, as if something awful might happen?' },
  ],
  options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
  optionValues: [0, 1, 2, 3],
  scoreRanges: [
    { label: 'Minimal anxiety', max: 4 },
    { label: 'Mild anxiety', max: 9 },
    { label: 'Moderate anxiety', max: 14 },
    { label: 'Severe anxiety', max: 21 },
  ],
};

// ── PHQ-9 (Patient Health Questionnaire) ─────────────────────────────────────

const PHQ9: Instrument = {
  id: 'PHQ9',
  title: 'PHQ-9',
  introMessage:
    "Thank you for opening up to me. I'd like to ask you a few questions about how you've been feeling over the past two weeks. Just tap the answer that fits best.",
  outroPrefix: 'Your responses suggest',
  questions: [
    { text: 'How often have you had little interest or pleasure in doing things?' },
    { text: 'How often have you been feeling down, depressed, or hopeless?' },
    { text: 'How often have you had trouble falling or staying asleep, or been sleeping too much?' },
    { text: 'How often have you been feeling tired or having little energy?' },
    { text: 'How often have you had poor appetite or been overeating?' },
    { text: 'How often have you been feeling bad about yourself — or that you are a failure?' },
    { text: 'How often have you had trouble concentrating on things like reading or watching TV?' },
    {
      text: 'How often have you been moving or speaking so slowly that others noticed — or the opposite, being fidgety or restless?',
    },
    { text: 'How often have you had thoughts that you would be better off dead, or thoughts of hurting yourself?' },
  ],
  options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
  optionValues: [0, 1, 2, 3],
  scoreRanges: [
    { label: 'Minimal depression', max: 4 },
    { label: 'Mild depression', max: 9 },
    { label: 'Moderate depression', max: 14 },
    { label: 'Moderately severe depression', max: 19 },
    { label: 'Severe depression', max: 27 },
  ],
};

// ── ASRS-5 (ADHD Self-Report Scale, Part A screener) ─────────────────────────

const ASRS5: Instrument = {
  id: 'ASRS5',
  title: 'ASRS-5',
  introMessage:
    "I'd like to ask you a few short questions about your focus and attention over the past 6 months. Just tap the answer that fits best.",
  outroPrefix: 'Based on your responses',
  questions: [
    { text: 'How often do you have trouble wrapping up the final details of a project, once the challenging parts have been done?' },
    { text: 'How often do you have difficulty getting things in order when you have to do a task that requires organization?' },
    { text: 'How often do you have problems remembering appointments or obligations?' },
    { text: 'When you have a task that requires a lot of thought, how often do you avoid or delay getting started?' },
    { text: 'How often do you fidget or squirm with your hands or feet when you have to sit down for a long time?' },
    { text: 'How often do you feel overly active and compelled to do things, like you were driven by a motor?' },
  ],
  options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Very often'],
  optionValues: [0, 1, 2, 3, 4],
  // Threshold-based: items 1-3 positive if ≥ "Sometimes" (2), items 4-6 positive if ≥ "Often" (3)
  // ≥4 positive items = positive screen
  scoreRanges: [
    { label: 'Unlikely ADHD', max: 3 },
    { label: 'Consistent with ADHD', max: 6 },
  ],
};

// ── PC-PTSD-5 (Primary Care PTSD Screen) ─────────────────────────────────────

const PCPTSD5: Instrument = {
  id: 'PCPTSD5',
  title: 'PC-PTSD-5',
  introMessage:
    "I'd like to ask you a few questions about some difficult experiences. These help me understand what you've been going through. Just tap Yes or No.",
  outroPrefix: 'Based on your responses',
  questions: [
    { text: 'Have you had nightmares about a traumatic event, or thought about it when you did not want to?' },
    { text: 'Have you tried hard not to think about it, or gone out of your way to avoid situations that remind you of it?' },
    { text: 'Have you been constantly on guard, watchful, or easily startled?' },
    { text: 'Have you felt numb or detached from others, activities, or your surroundings?' },
    { text: 'Have you felt guilty or unable to stop blaming yourself or others for the event?' },
  ],
  options: ['No', 'Yes'],
  optionValues: [0, 1],
  scoreRanges: [
    { label: 'Low PTSD indicators', max: 2 },
    { label: 'Positive PTSD screen', max: 5 },
  ],
};

// ── Instrument map ────────────────────────────────────────────────────────────

const INSTRUMENT_MAP: Record<string, Instrument> = {
  Anxiety: GAD7,
  Depression: PHQ9,
  ADHD: ASRS5,
  Trauma: PCPTSD5,
};

export function getInstrument(condition: string): Instrument | null {
  const key = Object.keys(INSTRUMENT_MAP).find(
    k => k.toLowerCase() === condition.toLowerCase()
  );
  return key ? INSTRUMENT_MAP[key] : null;
}

// ── Scoring ───────────────────────────────────────────────────────────────────

export function calculateScore(instrument: Instrument, answers: number[]): ScoreResult {
  let score: number;

  if (instrument.id === 'ASRS5') {
    // Threshold-based: items 0-2 positive if ≥ 2, items 3-5 positive if ≥ 3
    const positives = answers.filter((v, i) => (i < 3 ? v >= 2 : v >= 3)).length;
    score = positives;
    const severity = positives >= 4 ? 'Consistent with ADHD' : 'Unlikely ADHD';
    const message =
      positives >= 4
        ? `Your responses are consistent with ADHD symptoms. A specialist can provide a formal evaluation and discuss next steps.`
        : `Your responses don't strongly suggest ADHD, but if concentration difficulties are affecting your daily life, speaking with a provider can still help.`;
    return { score: positives, severity, message };
  }

  score = answers.reduce((sum, v) => sum + v, 0);

  const range = instrument.scoreRanges.find(r => score <= r.max) ?? instrument.scoreRanges[instrument.scoreRanges.length - 1];
  const severity = range.label;

  let message: string;
  if (instrument.id === 'PCPTSD5') {
    message =
      score >= 3
        ? `Your responses indicate significant trauma-related symptoms. Connecting with a trauma-informed therapist could make a real difference.`
        : `Your responses show some stress-related symptoms. A mental health provider can help you work through what you've experienced.`;
  } else {
    message = `${instrument.outroPrefix} ${severity.toLowerCase()} (score: ${score}). Connecting with the right provider can help you feel better.`;
  }

  return { score, severity, message };
}
