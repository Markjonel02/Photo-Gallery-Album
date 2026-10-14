import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { isConfigured } from '@/config/env';
import { AuthScreen } from '@/features/auth/AuthScreen';
import { useAuth } from '@/features/auth/AuthContext';
import { colors } from '@/theme';
import { ConfigErrorScreen } from './ConfigErrorScreen';
import { MainTabs } from './MainTabs';

export function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (!isConfigured) return <ConfigErrorScreen />;
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  return user ? <MainTabs /> : <AuthScreen />;
}

const styles = StyleSheet.create({ center: { flex: 1, alignItems: 'center', justifyContent: 'center' } });
