import AsyncStorage from '@react-native-async-storage/async-storage';
import { AssessmentSummary } from '../types';

const PREFS_KEY = 'mindpath_user_prefs';
const SUMMARY_KEY = 'mindpath_last_assessment';
const ONBOARDED_KEY = 'mindpath_preferences_set';

export interface UserPreferences {
  displayName: string;
  gender: string;
  ageGroup: string;
  race: string;
  insurance: string;
  language: string;
  providerGenderPreference: string;
  maxDistanceMiles: number;
  sessionType: 'any' | 'telehealth' | 'in-person';
  serviceType: string;
  costPreference: 'any' | 'free' | 'sliding' | 'medicaid';
  anonymousMode: boolean;
}

export const DEFAULT_PREFS: UserPreferences = {
  displayName: '',
  gender: 'Prefer not to say',
  ageGroup: 'Prefer not to say',
  race: 'Prefer not to say',
  insurance: '',
  language: '',
  providerGenderPreference: 'No preference',
  maxDistanceMiles: 25,
  sessionType: 'any',
  serviceType: '',
  costPreference: 'any',
  anonymousMode: false,
};

export async function savePreferences(prefs: Partial<UserPreferences>): Promise<void> {
  const current = await getPreferences();
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify({ ...current, ...prefs }));
  await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
}

export async function getPreferences(): Promise<UserPreferences> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function hasSetPreferences(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ONBOARDED_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function saveAssessmentSummary(summary: AssessmentSummary): Promise<void> {
  try {
    await AsyncStorage.setItem(SUMMARY_KEY, JSON.stringify(summary));
  } catch {}
}

export async function getAssessmentSummary(): Promise<AssessmentSummary | null> {
  try {
    const raw = await AsyncStorage.getItem(SUMMARY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function clearAssessmentSummary(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SUMMARY_KEY);
  } catch {}
}
