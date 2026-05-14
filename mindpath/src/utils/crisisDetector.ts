const CRISIS_PHRASES = [
  // Suicidal ideation — explicit only
  "want to kill myself", "wanna kill myself", "going to kill myself",
  "thinking about killing myself", "thinking of killing myself",
  "want to die", "wanna die",
  "wish i was dead", "wish i were dead",
  "end my life", "take my life", "end it all",
  "don't want to live anymore", "dont want to live anymore",
  "rather be dead", "better off dead",
  "better off without me", "everyone would be better without me",
  "nobody would miss me", "no one would miss me",
  "suicidal", "suicide",

  // Self-harm — explicit only
  "want to hurt myself", "going to hurt myself",
  "want to harm myself", "going to harm myself",
  "cutting myself", "want to cut myself",
  "self harm", "self-harm", "selfharm",

  // Violence toward others — explicit only
  "want to kill someone", "want to kill people",
  "going to kill someone", "going to hurt someone",
  "want to hurt my", "going to hurt my",
];

export function isCrisisMessage(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_PHRASES.some(phrase => lower.includes(phrase));
}
