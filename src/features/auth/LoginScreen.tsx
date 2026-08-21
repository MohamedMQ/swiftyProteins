import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getLastAuthenticatedUsername, loginUser, loginWithBiometrics } from '../../core/auth/authService';
import { mapBiometricError } from '../../core/security/biometricErrorMessages';
import {
  authenticateWithBiometrics,
  getBiometricButtonLabel,
  getBiometricCapability,
  isBiometricLoginAvailable,
} from '../../core/security/biometricService';
import { PrimaryButton, TextField, useTheme, type Theme } from '../../design-system';

interface LoginScreenProps {
  onAuthenticated: (username: string) => void;
  onNavigateToSignUp: () => void;
}

export function LoginScreen({ onAuthenticated, onNavigateToSignUp }: LoginScreenProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [biometricLabel, setBiometricLabel] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);

  useEffect(() => {
    (async () => {
      const [capability, lastUsername] = await Promise.all([
        getBiometricCapability(),
        getLastAuthenticatedUsername(),
      ]);

      if (isBiometricLoginAvailable(capability) && lastUsername !== null) {
        setBiometricLabel(getBiometricButtonLabel(capability.types));
      }
    })();
  }, []);

  function handleUsernameChange(value: string) {
    setUsername(value);
    setFormError(null);
  }

  function handlePasswordChange(value: string) {
    setPassword(value);
    setFormError(null);
  }

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

  async function handleBiometricLogin() {
    setFormError(null);
    const scan = await authenticateWithBiometrics();

    if (!scan.success) {
      const message = mapBiometricError(scan.error);
      if (message !== null) {
        setFormError(message);
      }
      return;
    }

    const result = await loginWithBiometrics();
    if (result.success) {
      onAuthenticated(result.username);
    } else {
      setFormError(result.reasons[0]);
    }
  }

  const canSubmit = username.length > 0 && password.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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

            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to view ligands</Text>

            <TextField
              label="Username"
              placeholder="Enter your username"
              value={username}
              onChangeText={handleUsernameChange}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            <TextField
              ref={passwordRef}
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={() => {
                if (canSubmit) {
                  handleSubmit();
                }
              }}
            />

            {formError !== null && <Text style={styles.error}>{formError}</Text>}

            <PrimaryButton
              label="Log in"
              onPress={handleSubmit}
              loading={submitting}
              disabled={!canSubmit}
            />

            {biometricLabel !== null && (
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Pressable style={styles.biometricButton} onPress={handleBiometricLogin}>
                  <Text style={styles.biometricLabel}>{biometricLabel}</Text>
                </Pressable>
              </>
            )}

            <View style={styles.footer}>
              <Pressable onPress={onNavigateToSignUp} hitSlop={8}>
                <Text style={styles.link}>Create an account</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'stretch',
      padding: theme.spacing.xl,
    },
    formWidth: {
      width: '100%',
      maxWidth: 420,
      alignSelf: 'center',
    },
    mark: {
      width: 56,
      height: 56,
      alignSelf: 'center',
      marginBottom: theme.spacing.lg,
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
      marginBottom: theme.spacing.xxl,
      textAlign: 'center',
    },
    error: {
      fontSize: theme.fontSize.caption,
      color: theme.colors.danger,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginVertical: theme.spacing.md,
    },
    dividerLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
    },
    dividerText: {
      fontSize: theme.fontSize.caption,
      color: theme.colors.textQuaternary,
    },
    biometricButton: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.borderStrong,
      borderRadius: theme.radius.md,
      paddingVertical: theme.spacing.sm + 1,
      alignItems: 'center',
    },
    biometricLabel: {
      fontSize: theme.fontSize.body,
      color: theme.colors.textSecondary,
    },
    footer: {
      alignItems: 'center',
      marginTop: theme.spacing.xl,
    },
    link: {
      fontSize: theme.fontSize.body,
      fontWeight: theme.fontWeight.medium,
      color: theme.colors.accent,
    },
  });
}
