import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Preferences } from '../../core/persistence/preferencesRepository';
import { theme } from '../../design-system';
import { VisualizationModeSwitcher } from '../protein-view/VisualizationModeSwitcher';

interface SettingsScreenProps {
  preferences: Preferences;
  onChange: (preferences: Preferences) => void;
  onBack: () => void;
}

export function SettingsScreen({ preferences, onChange, onBack }: SettingsScreenProps) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back to ligand list"
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.textSecondary} />
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Default visualization model</Text>
        <VisualizationModeSwitcher
          mode={preferences.defaultVisualizationMode}
          onChange={(mode) => onChange({ ...preferences, defaultVisualizationMode: mode })}
        />
      </View>

      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowLabel}>Show atom labels by default</Text>
          <Text style={styles.rowSubtitle}>Element symbols appear on atoms as soon as a ligand opens.</Text>
        </View>
        <Switch
          value={preferences.defaultAtomLabelsVisible}
          onValueChange={(value) => onChange({ ...preferences, defaultAtomLabelsVisible: value })}
          trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
          thumbColor={theme.colors.textPrimary}
          accessibilityLabel="Show atom labels by default"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.subtitle,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  headerSpacer: {
    width: 24,
  },
  section: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  sectionLabel: {
    fontSize: theme.fontSize.caption,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  rowText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  rowLabel: {
    fontSize: theme.fontSize.body,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  rowSubtitle: {
    fontSize: theme.fontSize.caption,
    color: theme.colors.textQuaternary,
  },
});
