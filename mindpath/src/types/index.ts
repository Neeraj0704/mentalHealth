export type ProviderType =
  | 'Psychiatrist'
  | 'Psychologist'
  | 'Licensed Clinical Social Worker'
  | 'Marriage & Family Therapist'
  | 'Licensed Professional Counselor'
  | 'Licensed Mental Health Counselor'
  | 'Neuropsychologist'
  | 'Child & Adolescent Psychiatrist';

export type Gender = 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say';

export interface Education {
  degree: string;
  school: string;
  year?: number;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  content: string;
  helpful_count?: number;
}

export interface Provider {
  id: string;
  name: string;
  credentials: string;
  provider_type: ProviderType;
  image: string;
  rating: number;
  rating_count?: number;
  review_count?: number;
  years_experience: number;
  practice_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  specialties: string[];
  expertise: string[];
  conditions_treated: string[];
  insurance_accepted: string[];
  languages: string[];
  gender: Gender;
  telehealth_available: boolean;
  in_person_available: boolean;
  accepting_new_patients: boolean;
  overview: string;
  treatment_approaches: string[];
  education: Education[];
  reviews: Review[];
  verified: boolean;
  phone?: string;
  next_available?: string;
  session_rate?: string;
  featured?: boolean;
  profile_summary?: string;
  pros?: string[];
  cons?: string[];
  sentiment_score?: number;
}

export interface SearchFilters {
  specialty: string[];
  provider_type: ProviderType[];
  insurance: string[];
  language: string[];
  gender: Gender[];
  telehealth_only: boolean;
  in_person_only: boolean;
  min_rating: number;
  accepting_new_patients: boolean;
  min_years_experience: number;
  max_distance_miles: number; // 0 = no distance filter
}

export const DEFAULT_FILTERS: SearchFilters = {
  specialty: [],
  provider_type: [],
  insurance: [],
  language: [],
  gender: [],
  telehealth_only: false,
  in_person_only: false,
  min_rating: 0,
  accepting_new_patients: false,
  min_years_experience: 0,
  max_distance_miles: 0,
};

export interface Facility {
  id: number;
  name: string;
  address: string;
  zip: string;
  phone: string;
  hours: string;
  languages: string[];
  payment: string[];
  ages_served: string;
  services: string[];
  telehealth: boolean;
  website: string;
  crisis_line: string | null;
  emergency_serves: string;
  inpatient_outpatient: string;
  keywords: string;
  google_maps_link: string;
  num_of_beds: number;
  acuity: string;
  types: string[];
}

// Navigation types
import { NavigatorScreenParams } from '@react-navigation/native';

export interface AssessmentSummary {
  condition: string;
  severity?: string;
  score?: number;
  message: string;
}

export type RootStackParamList = {
  Consent: undefined;
  Onboarding: undefined;
  PreferencesSetup: undefined;
  MainTabs: undefined;
  FilterModal: { currentFilters: SearchFilters };
  ClinicFilterModal: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  Assessment: undefined;
  VoiceAssessment: undefined;
  MiraChat: undefined;
  AssessmentResult: {
    condition: string;
    severity: string;
    score: number;
    instrumentId: string;
    qaItems: Array<{ question: string; answer: string }>;
    conversation: Array<{ role: string; content: string }>;
  };
  Results: { query: string; filters?: SearchFilters; specialty?: string };
  ProviderDetail: { providerId: string };
  Booking: { providerId: string; providerName: string };
  FacilityDetail: { facilityId: number };
  FacilitiesList: { facilities: Facility[]; lat: number; lng: number };
  Wellness: undefined;
  Breathing: { pattern?: 'box' | '4-6' | 'panic' };
  PanicMode: undefined;
  Grounding: undefined;
  SOSResources: undefined;
};

export type SavedStackParamList = {
  Saved: undefined;
  ProviderDetail: { providerId: string };
  Booking: { providerId: string; providerName: string };
  FacilityDetail: { facilityId: number };
};

export type ProfileStackParamList = {
  Profile: undefined;
};

export type MainTabParamList = {
  ScreeningTab: NavigatorScreenParams<HomeStackParamList>;
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  AITab: undefined;
  SavedTab: NavigatorScreenParams<SavedStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};
