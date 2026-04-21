import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

import { SavedProvider } from './src/context/SavedContext';
import { FilterProvider } from './src/context/FilterContext';
import { LocationProvider } from './src/context/LocationContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <LocationProvider>
          <SavedProvider>
            <FilterProvider>
              <AppNavigator />
            </FilterProvider>
          </SavedProvider>
        </LocationProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
