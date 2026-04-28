import React, { createContext, useContext, useState, useCallback } from 'react';
import { Provider, Facility } from '../types';

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
  const [savedMap, setSavedMap] = useState<Map<string, Provider>>(new Map());
  const [savedFacilityMap, setSavedFacilityMap] = useState<Map<number, Facility>>(new Map());

  const toggleSaved = useCallback((provider: Provider) => {
    setSavedMap((prev) => {
      const next = new Map(prev);
      if (next.has(provider.id)) next.delete(provider.id);
      else next.set(provider.id, provider);
      return next;
    });
  }, []);

  const isSaved = useCallback((id: string) => savedMap.has(id), [savedMap]);

  const toggleSavedFacility = useCallback((facility: Facility) => {
    setSavedFacilityMap((prev) => {
      const next = new Map(prev);
      if (next.has(facility.id)) next.delete(facility.id);
      else next.set(facility.id, facility);
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
