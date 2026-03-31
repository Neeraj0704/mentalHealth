import AsyncStorage from '@react-native-async-storage/async-storage';
import { Provider, SearchFilters } from '../types';

const BASE_URL = 'http://localhost:8000';

async function fetchProviders(params: Record<string, string | number | boolean>): Promise<Provider[]> {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && p.set(k, String(v)));
  const res = await fetch(`${BASE_URL}/providers?${p}`);
  if (!res.ok) throw new Error('Failed to fetch providers');
  const data = await res.json();
  return data.providers as Provider[];
}

export async function getProviders(filters?: Partial<SearchFilters>, q?: string, specialty?: string): Promise<Provider[]> {
  const params: Record<string, string | number | boolean> = { limit: 100 };
  if (q) params.q = q;
  if (specialty) params.condition = specialty;
  if (filters?.gender?.length === 1) params.gender = filters.gender[0];
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

export async function getNearby(lat: number, lng: number, limit = 10): Promise<Provider[]> {
  const res = await fetch(`${BASE_URL}/providers/nearby?lat=${lat}&lng=${lng}&limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch nearby providers');
  const data = await res.json();
  return data.providers as Provider[];
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
