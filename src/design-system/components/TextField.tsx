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
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.caption,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textTertiary,
    marginBottom: theme.spacing.xs + 1,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 4,
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
