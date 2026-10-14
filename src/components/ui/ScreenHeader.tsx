import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, MAX_FONT_MULTIPLIER } from '@/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, right }: ScreenHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.texts}>
        <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.title} numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  texts: { flex: 1 },
  title: { fontSize: fontSize.xl, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: fontSize.xs, color: colors.textFaint, fontWeight: '600', marginTop: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
