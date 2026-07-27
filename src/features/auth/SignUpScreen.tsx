import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={onNavigateToLogin} hitSlop={8}>
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
  },
  back: {
    fontSize: theme.fontSize.caption,
    color: theme.colors.textTertiary,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.title,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: theme.fontSize.caption,
    color: theme.colors.textQuaternary,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  strength: {
    marginTop: -theme.spacing.xs,
    marginBottom: theme.spacing.sm,
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
  },
});
