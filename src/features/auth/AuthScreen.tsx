import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { Button, TextField } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, fontSize, MAX_FONT_MULTIPLIER } from '@/theme';
import { firstError, signInSchema, signUpSchema } from '@/utils/validation';
import { logError, toUserMessage } from '@/utils/errors';
import { useAuth } from './AuthContext';

type Mode = 'signIn' | 'signUp';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const { insets } = useResponsive();
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const isSignUp = mode === 'signUp';

  const submit = async () => {
    if (busy) return;
    setError(null);
    setNotice(null);
    const parsed = (isSignUp ? signUpSchema : signInSchema).safeParse({ email, password });
    if (!parsed.success) { setError(firstError(parsed.error)); return; }

    setBusy(true);
    try {
      if (isSignUp) {
        const signedIn = await signUp(parsed.data.email, parsed.data.password);
        if (!signedIn) {
          setNotice('Check your inbox to confirm your email, then sign in.');
          setMode('signIn');
          setPassword('');
        }
      } else {
        await signIn(parsed.data.email, parsed.data.password);
      }
    } catch (e) {
      logError('auth', e);
      setError(toUserMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.brand}>Aura</Text>
          <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.tagline}>
            {isSignUp ? 'Create your private gallery' : 'Welcome back'}
          </Text>

          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            maxLength={254}
          />

          <View>
            <TextField
              ref={passwordRef}
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              textContentType={isSignUp ? 'newPassword' : 'password'}
              returnKeyType="go"
              onSubmitEditing={submit}
              maxLength={128}
              style={styles.passwordInput}
            />
            <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={10} style={styles.eye} accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
            </Pressable>
          </View>

          {isSignUp ? (
            <Text maxFontSizeMultiplier={MAX_FONT_MULTIPLIER} style={styles.hint}>At least 8 characters with a letter and a number.</Text>
          ) : null}
          {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
          {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}

          <Button label={isSignUp ? 'Create account' : 'Sign in'} onPress={submit} loading={busy} style={styles.submit} />
          <Button
            label={isSignUp ? 'I already have an account' : 'Create an account'}
            variant="ghost"
            onPress={() => { setMode(isSignUp ? 'signIn' : 'signUp'); setError(null); setNotice(null); }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 20 },
  card: { width: '100%', maxWidth: 420 },
  brand: { fontSize: 40, fontWeight: '900', color: colors.text, letterSpacing: -1 },
  tagline: { fontSize: fontSize.md, color: colors.textMuted, marginBottom: 28, marginTop: 4 },
  passwordInput: { paddingRight: 44 },
  eye: { position: 'absolute', right: 14, top: 32 },
  hint: { fontSize: fontSize.xs, color: colors.textFaint, marginBottom: 8 },
  error: { color: colors.danger, fontSize: fontSize.sm, marginBottom: 8 },
  notice: { color: colors.accent, fontSize: fontSize.sm, marginBottom: 8 },
  submit: { marginTop: 8 },
});
