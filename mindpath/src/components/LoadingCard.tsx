import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors, Radius, Spacing, Shadows } from '../theme';

const Skeleton: React.FC<{ width: number | string; height: number; radius?: number; style?: object }> = ({
  width,
  height,
  radius = 6,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: Colors.surfaceAlt, opacity },
        style,
      ]}
    />
  );
};

export const LoadingCard: React.FC = () => (
  <View style={styles.card}>
    <View style={styles.topRow}>
      <Skeleton width={72} height={72} radius={36} />
      <View style={styles.mainInfo}>
        <Skeleton width="80%" height={16} style={{ marginBottom: 8 }} />
        <Skeleton width="55%" height={12} style={{ marginBottom: 8 }} />
        <Skeleton width="40%" height={12} style={{ marginBottom: 8 }} />
        <Skeleton width="60%" height={12} />
      </View>
    </View>
    <Skeleton width="100%" height={12} style={{ marginBottom: 6 }} />
    <Skeleton width="75%" height={12} style={{ marginBottom: 14 }} />
    <View style={styles.badgeRow}>
      <Skeleton width={80} height={24} radius={12} />
      <Skeleton width={72} height={24} radius={12} />
      <Skeleton width={110} height={24} radius={12} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: 12,
    ...Shadows.md,
  },
  topRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 14,
  },
  mainInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
});

export default LoadingCard;
