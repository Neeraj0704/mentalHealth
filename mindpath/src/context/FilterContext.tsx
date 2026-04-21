import React, { createContext, useContext, useState, useCallback } from 'react';
import { SearchFilters, DEFAULT_FILTERS } from '../types';

interface FilterContextType {
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  resetFilters: () => void;
  activeFilterCount: number;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

const countActiveFilters = (f: SearchFilters): number => {
  let count = 0;
  if (f.specialty.length) count++;
  if (f.provider_type.length) count++;
  if (f.insurance.length) count++;
  if (f.language.length) count++;
  if (f.gender.length) count++;
  if (f.telehealth_only) count++;
  if (f.in_person_only) count++;
  if (f.min_rating > 0) count++;
  if (f.accepting_new_patients) count++;
  if (f.min_years_experience > 0) count++;
  if (f.max_distance_miles > 0) count++;
  return count;
};

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFiltersState] = useState<SearchFilters>(DEFAULT_FILTERS);

  const setFilters = useCallback((newFilters: SearchFilters) => {
    setFiltersState(newFilters);
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  return (
    <FilterContext.Provider
      value={{
        filters,
        setFilters,
        resetFilters,
        activeFilterCount: countActiveFilters(filters),
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = (): FilterContextType => {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within FilterProvider');
  return ctx;
};
