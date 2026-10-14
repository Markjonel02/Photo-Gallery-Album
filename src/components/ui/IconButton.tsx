import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fontSize, MAX_FONT_MULTIPLIER, radius } from '@/theme';

interface IconButtonProps {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  text?: string;
  active?: boolean;
  tone?: 'default' | 'primary';
}

/** Compact header button; `label` is the accessibility name. */
export function IconButton({ label, icon, onPress, text, active, tone = 'default' }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={[styles.base, tone === 'primary' ? styles.primary : styles.default, active && styles.active, !text && styles.square]}
    >
      {icon}
      {text ? <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={[styles.text, active && { color: colors.white }]}>{text}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 36, borderRadius: radius.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 10 },
  square: { width: 36, paddingHorizontal: 0 },
  default: { backgroundColor: colors.surfaceAlt },
  primary: { backgroundColor: colors.primary },
  active: { backgroundColor: '#0284C7' },
  text: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textMuted },
});
