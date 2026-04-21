import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Linking } from 'react-native';

interface UserLocation {
  lat: number;
  lng: number;
}

interface LocationContextType {
  userLocation: UserLocation | null;
  locationGranted: boolean;
  locationLoading: boolean;
  locationDenied: boolean;
  requestLocation: () => Promise<void>;
  openLocationSettings: () => void;
}

const LocationContext = createContext<LocationContextType>({
  userLocation: null,
  locationGranted: false,
  locationLoading: true,
  locationDenied: false,
  requestLocation: async () => {},
  openLocationSettings: () => {},
});

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationDenied, setLocationDenied] = useState(false);

  const requestLocation = async () => {
    setLocationLoading(true);
    setLocationDenied(false);
    try {
      const { status: existing } = await Location.getForegroundPermissionsAsync();
      console.log('[Location] existing permission status:', existing);
      let finalStatus = existing;
      if (existing !== 'granted') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        finalStatus = status;
        console.log('[Location] after request, status:', finalStatus);
      }
      if (finalStatus !== 'granted') {
        console.log('[Location] permission denied');
        setLocationGranted(false);
        setLocationDenied(true);
        return;
      }
      setLocationGranted(true);
      console.log('[Location] permission granted, getting position...');
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      console.log('[Location] got position:', loc.coords.latitude, loc.coords.longitude);
      setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch (e) {
      console.warn('[Location] Failed to get location:', e);
      setLocationDenied(true);
    } finally {
      setLocationLoading(false);
      console.log('[Location] loading done');
    }
  };

  const openLocationSettings = () => Linking.openSettings();

  useEffect(() => {
    requestLocation();
  }, []);

  return (
    <LocationContext.Provider value={{ userLocation, locationGranted, locationLoading, locationDenied, requestLocation, openLocationSettings }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
