import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '../../theme';

type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral'
  | 'telehealth'
  | 'inPerson'
  | 'verified'
  | 'newPatients'
  | 'rating';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

const variantStyles: Record<
  BadgeVariant,
  { bg: string; text: string; border?: string }
> = {
  primary:    { bg: Colors.primaryBg,   text: Colors.primaryDark },
  secondary:  { bg: Colors.secondaryBg, text: '#2E7B5E' },
  accent:     { bg: Colors.accentBg,    text: '#B5622A' },
  success:    { bg: Colors.successBg,   text: Colors.success },
  warning:    { bg: Colors.warningBg,   text: '#B5622A' },
  error:      { bg: Colors.errorBg,     text: Colors.error },
  neutral:    { bg: Colors.surfaceAlt,  text: Colors.textSecondary },
  telehealth: { bg: '#EEF6F9',          text: '#2E6A7E' },
  inPerson:   { bg: '#EEF7F2',          text: '#2E7B5E' },
  verified:   { bg: Colors.primaryBg,   text: Colors.primaryDark },
  newPatients:{ bg: Colors.secondaryBg, text: '#2E7B5E' },
  rating:     { bg: Colors.ratingBg,    text: '#8A6000' },
};

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  icon,
  size = 'sm',
  style,
}) => {
  const vs = variantStyles[variant];
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: vs.bg },
        isSm ? styles.sm : styles.md,
        style,
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={isSm ? 11 : 13}
          color={vs.text}
          style={{ marginRight: 3 }}
        />
      )}
      <Text
        style={[
          styles.label,
          { color: vs.text },
          isSm ? styles.labelSm : styles.labelMd,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  sm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  md: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  label: {
    fontWeight: '600',
  },
  labelSm: {
    fontSize: 11,
    lineHeight: 15,
  },
  labelMd: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export default Badge;
