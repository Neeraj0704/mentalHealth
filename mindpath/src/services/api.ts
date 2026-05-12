import AsyncStorage from '@react-native-async-storage/async-storage';
import { Provider, SearchFilters, Facility } from '../types';

import { BASE_URL } from '../config';

async function fetchProviders(params: Record<string, string | number | boolean>): Promise<Provider[]> {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && p.set(k, String(v)));
  const res = await fetch(`${BASE_URL}/providers?${p}`);
  if (!res.ok) throw new Error('Failed to fetch providers');
  const data = await res.json();
  return data.providers as Provider[];
}

const ZIP_RE = /^\d{5}$/;

export async function getProviders(filters?: Partial<SearchFilters>, q?: string, specialty?: string): Promise<Provider[]> {
  const params: Record<string, string | number | boolean> = { limit: 500 };

  if (q) {
    const trimmed = q.trim();
    if (ZIP_RE.test(trimmed)) {
      // Route 5-digit ZIP codes as a dedicated filter for exact JSON match
      params.zip_code = trimmed;
    } else {
      params.q = trimmed;
    }
  }

  if (specialty) params.condition = specialty;
  if (filters?.telehealth_only) params.telehealth_only = true;
  if (filters?.accepting_new_patients) params.accepting_only = true;
  if (filters?.insurance?.length) params.insurance = filters.insurance[0];
  if (filters?.language?.length) params.language = filters.language[0];
  return fetchProviders(params);
}

export async function getProviderById(id: string): Promise<Provider | undefined> {
  const res = await fetch(`${BASE_URL}/providers/${id}`);
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error('Failed to fetch provider');
  return res.json() as Promise<Provider>;
}

export async function getTopRated(limit = 10): Promise<Provider[]> {
  return fetchProviders({ sort: 'rating', limit });
}

export async function getMostReviewed(limit = 10): Promise<Provider[]> {
  return fetchProviders({ sort: 'reviews', limit });
}

export async function getRecentlyAdded(limit = 10): Promise<Provider[]> {
  return fetchProviders({ sort: 'recent', limit });
}

export async function getAcceptingNew(limit = 10): Promise<Provider[]> {
  return fetchProviders({ accepting_only: true, sort: 'rating', limit });
}

export async function getTelehealth(limit = 10): Promise<Provider[]> {
  return fetchProviders({ telehealth_only: true, sort: 'rating', limit });
}

export async function getNearby(lat: number, lng: number, limit = 10, radiusMiles = 50): Promise<Provider[]> {
  const res = await fetch(`${BASE_URL}/providers/nearby?lat=${lat}&lng=${lng}&limit=${limit}&radius=${radiusMiles}`);
  if (!res.ok) throw new Error('Failed to fetch nearby providers');
  const data = await res.json();
  return data.providers as Provider[];
}

export interface BookingPayload {
  provider_id: string;
  provider_name: string;
  user_name: string;
  user_email: string;
  user_phone?: string;
  preferred_time: string;
  message?: string;
  assessment_condition?: string;
  assessment_severity?: string;
  assessment_score?: number;
  assessment_message?: string;
}

export async function bookAppointment(payload: BookingPayload): Promise<{ success: boolean; booking_id?: string }> {
  const res = await fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Booking failed: ${res.status}`);
  return res.json();
}

// ── Voice agent ──────────────────────────────────────────────────────────────

export interface MindpathUI {
  phase: 'conversing' | 'extracting' | 'completed' | string;
  turn_count: number;
  progress: number;
  score: number | null;
  severity: string | null;
  condition: string | null;
  options: string[] | null;
  providers: Array<{
    id: string;
    name: string;
    provider_type: string;
    rating: number;
    city: string;
    state: string;
    telehealth_available: boolean;
    accepting_new_patients: boolean;
    image: string;
  }> | null;
}

export interface VoiceTurnResponse {
  speech: string;
  mindpath_ui: MindpathUI;
}

export async function sendVoiceTurn(
  sessionId: string,
  userMessage: string,
): Promise<VoiceTurnResponse> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'mindpath',
      messages: [{ role: 'user', content: userMessage }],
      conversation_id: sessionId,
      stream: false,
    }),
  });
  if (!res.ok) throw new Error(`Voice turn failed: ${res.status}`);
  const data = await res.json();
  return {
    speech: data.choices[0].message.content,
    mindpath_ui: data.mindpath_ui,
  };
}

export async function generateConversationSummary(
  conversation: Array<{ role: string; content: string }>,
  qaItems: Array<{ question: string; answer: string }>,
  condition: string,
): Promise<string> {
  const res = await fetch(`${BASE_URL}/voice/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversation, qa_items: qaItems, condition }),
  });
  if (!res.ok) throw new Error('Summary failed');
  const data = await res.json();
  return data.summary as string;
}

// ── Community Facilities ─────────────────────────────────────────────────────

export async function getNearbyFacilities(lat: number, lng: number, radiusMiles = 25): Promise<Facility[]> {
  const res = await fetch(`${BASE_URL}/facilities/nearby?lat=${lat}&lng=${lng}&radius=${radiusMiles}`);
  if (!res.ok) throw new Error('Failed to fetch nearby facilities');
  const data = await res.json();
  return data.facilities as Facility[];
}

export async function getFacilities(params: {
  zip_code?: string;
  language?: string;
  telehealth_only?: boolean;
  sliding_scale?: boolean;
  free_only?: boolean;
  q?: string;
} = {}): Promise<Facility[]> {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && v !== false && v !== '' && p.set(k, String(v)));
  const res = await fetch(`${BASE_URL}/facilities?${p}`);
  if (!res.ok) throw new Error('Failed to fetch facilities');
  const data = await res.json();
  return data.facilities as Facility[];
}

// ── Trending searches ────────────────────────────────────────────────────────

const TRENDING_KEY = 'mindpath_trending_searches';
const MAX_TRENDING = 8;

export async function saveTrendingSearch(query: string): Promise<void> {
  if (!query.trim()) return;
  try {
    const raw = await AsyncStorage.getItem(TRENDING_KEY);
    const searches: string[] = raw ? JSON.parse(raw) : [];
    const updated = [query, ...searches.filter(s => s.toLowerCase() !== query.toLowerCase())].slice(0, MAX_TRENDING);
    await AsyncStorage.setItem(TRENDING_KEY, JSON.stringify(updated));
  } catch {}
}

export async function getTrendingSearches(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(TRENDING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
