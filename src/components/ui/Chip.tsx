import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fontSize, MAX_FONT_MULTIPLIER, radius } from '@/theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={[styles.chip, selected && styles.selected]}
    >
      <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={[styles.text, selected && styles.textSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt },
  selected: { backgroundColor: colors.primary },
  text: { fontSize: fontSize.sm, color: colors.textMuted, textTransform: 'capitalize' },
  textSelected: { color: colors.white, fontWeight: '700' },
});
