import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { loginUser } from '../../core/auth/authService';
import { PrimaryButton, TextField, theme } from '../../design-system';

interface LoginScreenProps {
  onAuthenticated: (username: string) => void;
  onNavigateToSignUp: () => void;
}

export function LoginScreen({ onAuthenticated, onNavigateToSignUp }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit() {
    setFormError(null);
    setSubmitting(true);
    const result = await loginUser(username, password);
    setSubmitting(false);

    if (result.success) {
      onAuthenticated(result.username);
    } else {
      setFormError(result.reasons[0]);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Sign in to view ligands</Text>

      <TextField
        label="Username"
        placeholder="Enter your username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TextField
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      {formError !== null && <Text style={styles.error}>{formError}</Text>}

      <PrimaryButton label="Log in" onPress={handleSubmit} loading={submitting} />

      <View style={styles.footer}>
        <Pressable onPress={onNavigateToSignUp} hitSlop={8}>
          <Text style={styles.link}>Create an account</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xxl * 2,
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
  error: {
    fontSize: theme.fontSize.caption,
    color: theme.colors.danger,
    marginBottom: theme.spacing.sm,
  },
  footer: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  link: {
    fontSize: theme.fontSize.caption,
    color: theme.colors.accent,
  },
});
