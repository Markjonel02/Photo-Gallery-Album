import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, MAX_FONT_MULTIPLIER } from '@/theme';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon}
      <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.title}>{title}</Text>
      {message ? <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.message}>{message}</Text> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textSoft, marginTop: 12, textAlign: 'center' },
  message: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  action: { marginTop: 16 },
});
