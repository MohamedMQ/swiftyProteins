import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { theme } from '../theme';

interface TextFieldProps extends TextInputProps {
  label: string;
  errorText?: string;
}

export function TextField({ label, errorText, style, ...inputProps }: TextFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, errorText !== undefined && styles.inputError, style]}
        placeholderTextColor={theme.colors.textTertiary}
        {...inputProps}
      />
      {errorText !== undefined && <Text style={styles.errorText}>{errorText}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.sm,
  },
  label: {
    fontSize: theme.fontSize.caption,
    color: theme.colors.textTertiary,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md - 2,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.body,
    color: theme.colors.textPrimary,
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
