import React from 'react';
import { StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppProviders } from '@/app/AppProviders';
import { AppNavigator } from '@/app/AppNavigator';
import { colors } from '@/theme';

export default function App() {
  return (
    <AppProviders>
      <StatusBar style="light" />
      {/* Bottom inset is handled by the tab bar / sheets themselves. */}
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
        <AppNavigator />
      </SafeAreaView>
    </AppProviders>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.bg } });
