import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface UserLocation {
  lat: number;
  lng: number;
}

interface LocationContextType {
  userLocation: UserLocation | null;
  locationGranted: boolean;
  locationLoading: boolean;
  requestLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType>({
  userLocation: null,
  locationGranted: false,
  locationLoading: false,
  requestLocation: async () => {},
});

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const requestLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationGranted(false);
        return;
      }
      setLocationGranted(true);
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch {
      // Permission denied or location unavailable — silent fail
    } finally {
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  return (
    <LocationContext.Provider value={{ userLocation, locationGranted, locationLoading, requestLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
