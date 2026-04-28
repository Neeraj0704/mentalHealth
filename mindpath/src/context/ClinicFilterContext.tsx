import React, { createContext, useContext, useState, useCallback } from 'react';

export interface ClinicFilters {
  cost: 'free' | 'sliding' | 'medicaid' | null;
  telehealth: boolean;
  language: string | null;
  service: string | null;
  distance: number; // 0 = any
}

export const DEFAULT_CLINIC_FILTERS: ClinicFilters = {
  cost: null,
  telehealth: false,
  language: null,
  service: null,
  distance: 0,
};

interface ClinicFilterContextType {
  clinicFilters: ClinicFilters;
  setClinicFilters: (f: ClinicFilters) => void;
  resetClinicFilters: () => void;
  activeClinicFilterCount: number;
}

const ClinicFilterContext = createContext<ClinicFilterContextType | undefined>(undefined);

function countActive(f: ClinicFilters): number {
  let count = 0;
  if (f.cost) count++;
  if (f.telehealth) count++;
  if (f.language) count++;
  if (f.service) count++;
  if (f.distance > 0) count++;
  return count;
}

export const ClinicFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clinicFilters, setFiltersState] = useState<ClinicFilters>(DEFAULT_CLINIC_FILTERS);

  const setClinicFilters = useCallback((f: ClinicFilters) => setFiltersState(f), []);
  const resetClinicFilters = useCallback(() => setFiltersState(DEFAULT_CLINIC_FILTERS), []);

  return (
    <ClinicFilterContext.Provider value={{
      clinicFilters,
      setClinicFilters,
      resetClinicFilters,
      activeClinicFilterCount: countActive(clinicFilters),
    }}>
      {children}
    </ClinicFilterContext.Provider>
  );
};

export const useClinicFilters = (): ClinicFilterContextType => {
  const ctx = useContext(ClinicFilterContext);
  if (!ctx) throw new Error('useClinicFilters must be used within ClinicFilterProvider');
  return ctx;
};
