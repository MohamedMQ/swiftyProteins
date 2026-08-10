import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { registerUser } from '../../core/auth/authService';
import { validatePassword, validateUsername } from '../../core/auth/validation';
import { PrimaryButton, TextField, theme } from '../../design-system';

interface SignUpScreenProps {
  onRegistered: (username: string) => void;
  onNavigateToLogin: () => void;
}

// Mirrors the rule count in validatePassword (length, number, letter).
const PASSWORD_RULE_COUNT = 3;

export function SignUpScreen({ onRegistered, onNavigateToLogin }: SignUpScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const usernameErrors = useMemo(() => validateUsername(username), [username]);
  const passwordErrors = useMemo(() => validatePassword(password), [password]);
  const passedRuleCount = PASSWORD_RULE_COUNT - passwordErrors.length;
  const strengthLabel =
    password.length === 0
      ? null
      : passwordErrors.length === 0
        ? 'Strong'
        : passedRuleCount === 0
          ? 'Weak'
          : 'Fair';
  const confirmError =
    confirmPassword.length > 0 && confirmPassword !== password
      ? 'Passwords do not match'
      : undefined;

  function handleUsernameChange(value: string) {
    setUsername(value);
    setFormError(null);
  }

  function handlePasswordChange(value: string) {
    setPassword(value);
    setFormError(null);
  }

  function handleConfirmPasswordChange(value: string) {
    setConfirmPassword(value);
    setFormError(null);
  }

  async function handleSubmit() {
    setUsernameTouched(true);
    setFormError(null);

    if (usernameErrors.length > 0 || passwordErrors.length > 0 || confirmError !== undefined) {
      return;
    }

    setSubmitting(true);
    const result = await registerUser(username, password);
    setSubmitting(false);

    if (result.success) {
      onRegistered(result.username);
    } else {
      setFormError(result.reasons[0]);
    }
  }

  const canSubmit = username.length > 0 && password.length > 0 && confirmPassword.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <Pressable
        onPress={onNavigateToLogin}
        hitSlop={8}
        style={styles.back}
        accessibilityRole="button"
        accessibilityLabel="Back to login"
      >
        <Ionicons name="chevron-back" size={24} color={theme.colors.textSecondary} />
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formWidth}>
          <Image
            source={require('../../../assets/splash-icon.png')}
            style={styles.mark}
            resizeMode="contain"
          />

          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Stored securely on your device</Text>

          <TextField
            label="Username"
            placeholder="Choose a username"
            value={username}
            onChangeText={handleUsernameChange}
            onBlur={() => setUsernameTouched(true)}
            errorText={usernameTouched ? usernameErrors[0] : undefined}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextField
            label="Password"
            placeholder="Choose a password"
            value={password}
            onChangeText={handlePasswordChange}
            secureTextEntry
            autoCapitalize="none"
          />

          {password.length > 0 && (
            <View style={styles.strength}>
              <View style={styles.strengthBars}>
                {Array.from({ length: PASSWORD_RULE_COUNT }).map((_, index) => (
                  <View
                    key={index}
                    style={[styles.strengthBar, index < passedRuleCount && styles.strengthBarFilled]}
                  />
                ))}
              </View>
              <Text style={styles.strengthLabel}>
                {strengthLabel}
                {passwordErrors.length > 0 ? ` — ${passwordErrors.join(', ')}` : ''}
              </Text>
            </View>
          )}

          <TextField
            label="Confirm password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={handleConfirmPasswordChange}
            errorText={confirmError}
            secureTextEntry
            autoCapitalize="none"
          />

          {formError !== null && <Text style={styles.error}>{formError}</Text>}

          <PrimaryButton
            label="Create account"
            onPress={handleSubmit}
            loading={submitting}
            disabled={!canSubmit}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  back: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.md,
  },
  formWidth: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  mark: {
    width: 48,
    height: 48,
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.heading,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.fontSize.subtitle,
    color: theme.colors.textQuaternary,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  strength: {
    marginTop: -theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  strengthBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
  },
  strengthBarFilled: {
    backgroundColor: theme.colors.accent,
  },
  strengthLabel: {
    fontSize: theme.fontSize.caption,
    color: theme.colors.textQuaternary,
    marginTop: theme.spacing.xs,
  },
  error: {
    fontSize: theme.fontSize.caption,
    color: theme.colors.danger,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
});
