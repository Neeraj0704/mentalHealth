import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '../../theme';

interface FilterChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  size?: 'sm' | 'md';
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  selected = false,
  onPress,
  icon,
  style,
  size = 'md',
}) => {
  const isSm = size === 'sm';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.chip,
        isSm ? styles.chipSm : styles.chipMd,
        selected ? styles.selected : styles.unselected,
        style,
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={isSm ? 13 : 15}
          color={selected ? Colors.textInverse : Colors.textSecondary}
          style={{ marginRight: 4 }}
        />
      )}
      <Text
        style={[
          styles.label,
          isSm ? styles.labelSm : styles.labelMd,
          { color: selected ? Colors.textInverse : Colors.textSecondary },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {selected && (
        <Ionicons
          name="checkmark"
          size={isSm ? 12 : 14}
          color={Colors.textInverse}
          style={{ marginLeft: 3 }}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  chipMd: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSm: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  selected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  unselected: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  label: {
    fontWeight: '500',
  },
  labelMd: {
    fontSize: 14,
  },
  labelSm: {
    fontSize: 12,
  },
});

export default FilterChip;
