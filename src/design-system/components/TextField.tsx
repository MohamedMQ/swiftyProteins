import Ionicons from '@expo/vector-icons/Ionicons';
import { forwardRef, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { useTheme, type Theme } from '../theme';

interface TextFieldProps extends TextInputProps {
  label: string;
  errorText?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, errorText, style, secureTextEntry, ...inputProps },
  ref
) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [revealed, setRevealed] = useState(false);
  const isPasswordField = secureTextEntry === true;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, errorText !== undefined && styles.inputError]}>
        <TextInput
          ref={ref}
          style={[styles.input, style]}
          placeholderTextColor={theme.colors.textTertiary}
          secureTextEntry={isPasswordField && !revealed}
          {...inputProps}
        />
        {isPasswordField && (
          <Pressable
            onPress={() => setRevealed((current) => !current)}
            hitSlop={8}
            style={styles.revealButton}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
          >
            <Ionicons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={theme.colors.textTertiary}
            />
          </Pressable>
        )}
      </View>
      {errorText !== undefined && <Text style={styles.errorText}>{errorText}</Text>}
    </View>
  );
});

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    label: {
      fontSize: theme.fontSize.caption,
      fontWeight: theme.fontWeight.medium,
      color: theme.colors.textTertiary,
      marginBottom: theme.spacing.xs + 1,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
    },
    input: {
      flex: 1,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm + 4,
      fontSize: theme.fontSize.body,
      color: theme.colors.textPrimary,
    },
    revealButton: {
      paddingHorizontal: theme.spacing.md,
    },
    inputError: {
      borderColor: theme.colors.danger,
    },
    errorText: {
      fontSize: theme.fontSize.caption,
      color: theme.colors.danger,
      marginTop: theme.spacing.xs,
    },
  });
}
