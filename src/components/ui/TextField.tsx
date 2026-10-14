import React, { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fontSize, MAX_FONT_MULTIPLIER, radius } from '@/theme';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string | null;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, style, ...rest },
  ref,
) {
  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.label}>
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textFaint}
        maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}
        accessibilityLabel={label}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...rest}
      />
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  label: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600', marginBottom: 6 },
  input: {
    minHeight: 46,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: fontSize.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: fontSize.sm, marginTop: 4 },
});
