import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme, type Theme } from '../../design-system';
import { ProteinWebView, type ProteinWebViewHandle } from '../protein-view/ProteinWebView';
import { type VisualizationMode } from '../protein-view/proteinViewerHtml';
import { VisualizationModeSwitcher } from '../protein-view/VisualizationModeSwitcher';

interface LigandPayload {
  code: string;
  raw: string;
}

interface ComparisonScreenProps {
  ligandA: LigandPayload;
  ligandB: LigandPayload;
  onBack: () => void;
}

export function ComparisonScreen({ ligandA, ligandB, onBack }: ComparisonScreenProps) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, width > height), [theme, width, height]);
  const webviewRefA = useRef<ProteinWebViewHandle>(null);
  const webviewRefB = useRef<ProteinWebViewHandle>(null);
  const [mode, setMode] = useState<VisualizationMode>('ballAndStick');
  const [labelsVisible, setLabelsVisible] = useState(false);

  function handleModeChange(nextMode: VisualizationMode) {
    setMode(nextMode);
    webviewRefA.current?.setVisualizationMode(nextMode);
    webviewRefB.current?.setVisualizationMode(nextMode);
  }

  function toggleLabels() {
    const next = !labelsVisible;
    setLabelsVisible(next);
    webviewRefA.current?.setAtomLabelsVisible(next);
    webviewRefB.current?.setAtomLabelsVisible(next);
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
        <Text style={styles.title}>
          {ligandA.code} vs {ligandB.code}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.switcherRow}>
        <VisualizationModeSwitcher mode={mode} onChange={handleModeChange} style={styles.switcherFill} />
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
      </View>

      <View style={styles.panes}>
        <View style={styles.pane}>
          <Text style={styles.paneLabel}>{ligandA.code}</Text>
          <ProteinWebView
            ref={webviewRefA}
            code={ligandA.code}
            raw={ligandA.raw}
            initialVisualizationMode={mode}
            initialAtomLabelsVisible={labelsVisible}
            onParseFailure={onBack}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.pane}>
          <Text style={styles.paneLabel}>{ligandB.code}</Text>
          <ProteinWebView
            ref={webviewRefB}
            code={ligandB.code}
            raw={ligandB.raw}
            initialVisualizationMode={mode}
            initialAtomLabelsVisible={labelsVisible}
            onParseFailure={onBack}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function createStyles(theme: Theme, isLandscape: boolean) {
  return StyleSheet.create({
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
    switcherRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.sm,
    },
    switcherFill: {
      flex: 1,
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
    panes: {
      flex: 1,
      flexDirection: isLandscape ? 'row' : 'column',
    },
    pane: {
      flex: 1,
    },
    paneLabel: {
      position: 'absolute',
      top: theme.spacing.sm,
      left: theme.spacing.sm,
      zIndex: 1,
      fontSize: theme.fontSize.caption,
      fontWeight: theme.fontWeight.medium,
      color: theme.colors.textPrimary,
      backgroundColor: theme.colors.surfaceRaised,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.borderStrong,
      borderRadius: theme.radius.sm,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs / 2,
      overflow: 'hidden',
    },
    divider: {
      width: isLandscape ? StyleSheet.hairlineWidth : '100%',
      height: isLandscape ? '100%' : StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.divider,
    },
  });
}
