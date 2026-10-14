import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize } from '@/theme';

export function ConfigErrorScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supabase isn't configured</Text>
      <Text style={styles.body}>
        Copy <Text style={styles.code}>.env.example</Text> to <Text style={styles.code}>.env</Text>, add your project URL and anon key, then restart with <Text style={styles.code}>npx expo start -c</Text>.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text, marginBottom: 10, textAlign: 'center' },
  body: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  code: { color: colors.accent, fontWeight: '700' },
});
