import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { colors, fontSize, MAX_FONT_MULTIPLIER, radius } from '@/theme';
import { APP_LIMITS } from '@/config/env';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  /** Show a spinner while a debounced search is pending / in flight. */
  busy?: boolean;
}

export function SearchInput({ value, onChangeText, placeholder, busy }: SearchInputProps) {
  return (
    <View style={styles.container}>
      <Search size={16} color={colors.textFaint} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        maxLength={APP_LIMITS.searchMaxLength}
        maxFontSizeMultiplier={MAX_FONT_MULTIPLIER}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel={placeholder}
        style={styles.input}
      />
      {busy ? <ActivityIndicator size="small" color={colors.textFaint} /> : null}
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={10} accessibilityLabel="Clear search">
          <X size={16} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    minHeight: 42,
    gap: 8,
  },
  input: { flex: 1, color: colors.text, fontSize: fontSize.md, paddingVertical: 8 },
});
