import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Provider, Facility } from '../types';
import { BASE_URL } from '../config';

const TOKEN_KEY = 'mindpath_auth_token';

interface SavedContextType {
  savedIds: Set<string>;
  savedProviders: Provider[];
  toggleSaved: (provider: Provider) => void;
  isSaved: (id: string) => boolean;
  savedFacilityIds: Set<number>;
  savedFacilities: Facility[];
  toggleSavedFacility: (facility: Facility) => void;
  isFacilitySaved: (id: number) => boolean;
}

const SavedContext = createContext<SavedContextType | undefined>(undefined);

async function getToken(): Promise<string | null> {
  try { return await AsyncStorage.getItem(TOKEN_KEY); } catch { return null; }
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export const SavedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [savedMap, setSavedMap] = useState<Map<string, Provider>>(new Map());
  const [savedFacilityMap, setSavedFacilityMap] = useState<Map<number, Facility>>(new Map());

  useEffect(() => {
    const load = async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const [provRes, facRes] = await Promise.all([
          fetch(`${BASE_URL}/auth/saved/providers`, { headers: authHeader(token) }),
          fetch(`${BASE_URL}/auth/saved/facilities`, { headers: authHeader(token) }),
        ]);
        if (provRes.ok) {
          const d = await provRes.json();
          const map = new Map<string, Provider>();
          (d.providers || []).forEach((p: Provider) => map.set(p.id, p));
          setSavedMap(map);
        }
        if (facRes.ok) {
          const d = await facRes.json();
          const map = new Map<number, Facility>();
          (d.facilities || []).forEach((f: Facility) => map.set(f.id, f));
          setSavedFacilityMap(map);
        }
      } catch {}
    };
    load();
  }, []);

  const toggleSaved = useCallback((provider: Provider) => {
    setSavedMap((prev) => {
      const next = new Map(prev);
      const isSaving = !next.has(provider.id);
      if (isSaving) next.set(provider.id, provider);
      else next.delete(provider.id);
      getToken().then(token => {
        if (token) {
          fetch(`${BASE_URL}/auth/saved/providers/${provider.id}`, {
            method: isSaving ? 'POST' : 'DELETE',
            headers: authHeader(token),
          }).catch(() => {});
        }
      });
      return next;
    });
  }, []);

  const isSaved = useCallback((id: string) => savedMap.has(id), [savedMap]);

  const toggleSavedFacility = useCallback((facility: Facility) => {
    setSavedFacilityMap((prev) => {
      const next = new Map(prev);
      const isSaving = !next.has(facility.id);
      if (isSaving) next.set(facility.id, facility);
      else next.delete(facility.id);
      getToken().then(token => {
        if (token) {
          fetch(`${BASE_URL}/auth/saved/facilities/${facility.id}`, {
            method: isSaving ? 'POST' : 'DELETE',
            headers: authHeader(token),
          }).catch(() => {});
        }
      });
      return next;
    });
  }, []);

  const isFacilitySaved = useCallback((id: number) => savedFacilityMap.has(id), [savedFacilityMap]);

  return (
    <SavedContext.Provider value={{
      savedIds: new Set(savedMap.keys()),
      savedProviders: Array.from(savedMap.values()),
      toggleSaved,
      isSaved,
      savedFacilityIds: new Set(savedFacilityMap.keys()),
      savedFacilities: Array.from(savedFacilityMap.values()),
      toggleSavedFacility,
      isFacilitySaved,
    }}>
      {children}
    </SavedContext.Provider>
  );
};

export const useSaved = (): SavedContextType => {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error('useSaved must be used within SavedProvider');
  return ctx;
};
