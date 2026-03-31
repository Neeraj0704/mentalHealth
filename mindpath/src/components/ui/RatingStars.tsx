import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';

interface RatingStarsProps {
  rating: number;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  reviewCount,
  size = 'md',
  showCount = true,
}) => {
  const starSize = size === 'sm' ? 12 : size === 'md' ? 14 : 18;
  const textSize = size === 'sm' ? 12 : size === 'md' ? 14 : 16;

  const stars = Array.from({ length: 5 }, (_, i) => {
    const filled = i < Math.floor(rating);
    const half = !filled && i < Math.ceil(rating) && rating % 1 >= 0.5;
    return { filled, half };
  });

  return (
    <View style={styles.container}>
      <View style={styles.stars}>
        {stars.map((s, i) => (
          <Ionicons
            key={i}
            name={s.filled ? 'star' : s.half ? 'star-half' : 'star-outline'}
            size={starSize}
            color={s.filled || s.half ? Colors.rating : Colors.border}
            style={i > 0 ? { marginLeft: 1 } : undefined}
          />
        ))}
      </View>
      <Text
        style={[
          styles.ratingText,
          { fontSize: textSize, color: Colors.textPrimary },
        ]}
      >
        {rating.toFixed(1)}
      </Text>
      {showCount && reviewCount !== undefined && (
        <Text
          style={[
            styles.countText,
            { fontSize: textSize - 1, color: Colors.textSecondary },
          ]}
        >
          ({reviewCount})
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontWeight: '600',
    marginLeft: 2,
  },
  countText: {
    fontWeight: '400',
  },
});

export default RatingStars;
