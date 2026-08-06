import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../../design-system';
import { SceneView } from './SceneView';

interface ProteinViewScreenProps {
  code: string;
  raw: string;
  onBack: () => void;
}

/**
 * Day 7 smoke test: SceneView currently renders a placeholder spinning cube
 * to prove the expo-gl + three.js bridge works on-device, before the real
 * CPK ball-and-stick renderer (built from `raw`) replaces it in the next
 * commits.
 */
export function ProteinViewScreen({ code, raw: _raw, onBack }: ProteinViewScreenProps) {
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
        <Text style={styles.title}>{code}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <SceneView />
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
});
