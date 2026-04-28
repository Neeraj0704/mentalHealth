import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';

type Props = NativeStackScreenProps<HomeStackParamList, 'SafeSpace'>;

const { width } = Dimensions.get('window');

export default function SafeSpaceScreen({ navigation }: Props) {
  const orbScale = useRef(new Animated.Value(1)).current;
  const orbOpac  = useRef(new Animated.Value(0.3)).current;
  const textOpac = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in text
    Animated.timing(textOpac, { toValue: 1, duration: 2000, useNativeDriver: true }).start();

    // Gentle breathing orb loop
    const breathe = () => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(orbScale, { toValue: 1.25, duration: 4000, useNativeDriver: false }),
          Animated.timing(orbOpac,  { toValue: 0.55, duration: 4000, useNativeDriver: false }),
        ]),
        Animated.parallel([
          Animated.timing(orbScale, { toValue: 1,    duration: 6000, useNativeDriver: false }),
          Animated.timing(orbOpac,  { toValue: 0.3,  duration: 6000, useNativeDriver: false }),
        ]),
      ]).start(({ finished }) => { if (finished) breathe(); });
    };
    breathe();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0a0f1e', '#0d1f2d', '#111827']} style={styles.gradient}>
        <SafeAreaView edges={['top']} style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.exitBtn}>
            <Ionicons name="close" size={20} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Orb */}
        <View style={styles.orbContainer}>
          <Animated.View style={[styles.orbGlow, { transform: [{ scale: orbScale }], opacity: orbOpac }]} />
          <Animated.View style={[styles.orbCore, { transform: [{ scale: Animated.multiply(orbScale, 0.6) }] }]} />
        </View>

        {/* Text */}
        <Animated.View style={[styles.textContainer, { opacity: textOpac }]}>
          <Text style={styles.mainText}>You are safe here</Text>
          <Text style={styles.subText}>
            Breathe slowly.{'\n'}This moment is yours.
          </Text>
        </Animated.View>

        <SafeAreaView edges={['bottom']} style={styles.bottom}>
          <TouchableOpacity onPress={() => navigation.navigate('Breathing', { pattern: 'box' })} style={styles.breatheLink}>
            <Ionicons name="radio-button-on-outline" size={14} color="rgba(255,255,255,0.35)" />
            <Text style={styles.breatheLinkText}>Start guided breathing</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  topBar: { alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 8 },
  exitBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  orbContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  orbGlow: {
    position: 'absolute',
    width: width * 0.7, height: width * 0.7, borderRadius: width * 0.35,
    backgroundColor: '#4A8B9F',
  },
  orbCore: {
    width: width * 0.42, height: width * 0.42, borderRadius: width * 0.21,
    backgroundColor: '#1e4a5e',
  },
  textContainer: { alignItems: 'center', paddingHorizontal: 40, paddingBottom: 40 },
  mainText: { fontSize: 28, fontWeight: '300', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.5, marginBottom: 12, textAlign: 'center' },
  subText: { fontSize: 16, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 26, letterSpacing: 0.3 },
  bottom: { paddingBottom: 20, alignItems: 'center' },
  breatheLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  breatheLinkText: { fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecorationLine: 'underline' },
});
