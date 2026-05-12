import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Provider, Facility } from '../types';
import { useAuth } from './AuthContext';
import { BASE_URL } from '../config';

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

export const SavedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoggedIn } = useAuth();
  const [savedMap, setSavedMap] = useState<Map<string, Provider>>(new Map());
  const [savedFacilityMap, setSavedFacilityMap] = useState<Map<number, Facility>>(new Map());

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  // Load saved items from backend when user logs in
  useEffect(() => {
    if (!isLoggedIn || !token) {
      setSavedMap(new Map());
      setSavedFacilityMap(new Map());
      return;
    }
    const load = async () => {
      try {
        const [provRes, facRes] = await Promise.all([
          fetch(`${BASE_URL}/auth/saved/providers`, { headers: authHeaders }),
          fetch(`${BASE_URL}/auth/saved/facilities`, { headers: authHeaders }),
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
  }, [isLoggedIn, token]);

  const toggleSaved = useCallback((provider: Provider) => {
    setSavedMap((prev) => {
      const next = new Map(prev);
      const isSaving = !next.has(provider.id);
      if (isSaving) next.set(provider.id, provider);
      else next.delete(provider.id);
      // Sync to backend
      if (token) {
        fetch(`${BASE_URL}/auth/saved/providers/${provider.id}`, {
          method: isSaving ? 'POST' : 'DELETE',
          headers: authHeaders,
        }).catch(() => {});
      }
      return next;
    });
  }, [token]);

  const isSaved = useCallback((id: string) => savedMap.has(id), [savedMap]);

  const toggleSavedFacility = useCallback((facility: Facility) => {
    setSavedFacilityMap((prev) => {
      const next = new Map(prev);
      const isSaving = !next.has(facility.id);
      if (isSaving) next.set(facility.id, facility);
      else next.delete(facility.id);
      // Sync to backend
      if (token) {
        fetch(`${BASE_URL}/auth/saved/facilities/${facility.id}`, {
          method: isSaving ? 'POST' : 'DELETE',
          headers: authHeaders,
        }).catch(() => {});
      }
      return next;
    });
  }, [token]);

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
