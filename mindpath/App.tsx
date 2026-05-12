import 'react-native-gesture-handler';

// Patch global fetch to include ngrok bypass header on every request
const _fetch = global.fetch;
global.fetch = (input: RequestInfo | URL, init?: RequestInit) =>
  _fetch(input, {
    ...init,
    headers: { 'ngrok-skip-browser-warning': 'true', ...(init?.headers as Record<string, string> ?? {}) },
  });

import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

import { SavedProvider } from './src/context/SavedContext';
import { FilterProvider } from './src/context/FilterContext';
import { ClinicFilterProvider } from './src/context/ClinicFilterContext';
import { AuthProvider } from './src/context/AuthContext';
import { LocationProvider } from './src/context/LocationContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <LocationProvider>
            <SavedProvider>
              <FilterProvider>
                <ClinicFilterProvider>
                  <AppNavigator />
                </ClinicFilterProvider>
              </FilterProvider>
            </SavedProvider>
          </LocationProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
