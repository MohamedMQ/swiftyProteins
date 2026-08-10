import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '../../design-system';
import { ProteinWebView, type ProteinWebViewHandle } from './ProteinWebView';
import { type VisualizationMode } from './proteinViewerHtml';
import { VisualizationModeSwitcher } from './VisualizationModeSwitcher';

interface ProteinViewScreenProps {
  code: string;
  raw: string;
  initialVisualizationMode: VisualizationMode;
  initialAtomLabelsVisible: boolean;
  onBack: () => void;
}

export function ProteinViewScreen({
  code,
  raw,
  initialVisualizationMode,
  initialAtomLabelsVisible,
  onBack,
}: ProteinViewScreenProps) {
  const webviewRef = useRef<ProteinWebViewHandle>(null);
  const [mode, setMode] = useState<VisualizationMode>(initialVisualizationMode);
  const [labelsVisible, setLabelsVisible] = useState(initialAtomLabelsVisible);
  const [measureModeEnabled, setMeasureModeEnabled] = useState(false);

  function handleModeChange(nextMode: VisualizationMode) {
    setMode(nextMode);
    webviewRef.current?.setVisualizationMode(nextMode);
  }

  function toggleLabels() {
    const next = !labelsVisible;
    setLabelsVisible(next);
    webviewRef.current?.setAtomLabelsVisible(next);
  }

  function toggleMeasureMode() {
    const next = !measureModeEnabled;
    setMeasureModeEnabled(next);
    webviewRef.current?.setMeasureModeEnabled(next);
  }

  function handleSharePress() {
    Alert.alert('Share ligand', 'Choose an image format', [
      { text: 'PNG', onPress: () => webviewRef.current?.requestSnapshot('png') },
      { text: 'JPEG', onPress: () => webviewRef.current?.requestSnapshot('jpeg') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
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
        <Pressable
          onPress={handleSharePress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Share this ligand"
        >
          <Ionicons name="share-outline" size={24} color={theme.colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.switcherRow}>
        <VisualizationModeSwitcher mode={mode} onChange={handleModeChange} />
        <Pressable
          onPress={toggleLabels}
          hitSlop={8}
          style={styles.labelsToggle}
          accessibilityRole="switch"
          accessibilityState={{ checked: labelsVisible }}
          accessibilityLabel="Toggle atom element labels"
        >
          <Ionicons
            name={labelsVisible ? 'text' : 'text-outline'}
            size={20}
            color={labelsVisible ? theme.colors.accent : theme.colors.textSecondary}
          />
        </Pressable>
        <Pressable
          onPress={toggleMeasureMode}
          hitSlop={8}
          style={styles.labelsToggle}
          accessibilityRole="switch"
          accessibilityState={{ checked: measureModeEnabled }}
          accessibilityLabel="Toggle measure distance mode"
        >
          <Ionicons
            name={measureModeEnabled ? 'resize' : 'resize-outline'}
            size={20}
            color={measureModeEnabled ? theme.colors.accent : theme.colors.textSecondary}
          />
        </Pressable>
      </View>

      <ProteinWebView
        ref={webviewRef}
        code={code}
        raw={raw}
        initialVisualizationMode={initialVisualizationMode}
        initialAtomLabelsVisible={initialAtomLabelsVisible}
      />
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
  switcherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  labelsToggle: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
