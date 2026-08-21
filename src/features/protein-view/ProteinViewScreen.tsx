import Ionicons from '@expo/vector-icons/Ionicons';
import * as Sharing from 'expo-sharing';
import { useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { beginAppLockSuppression, endAppLockSuppression } from '../../core/security/appLockSuppression';
import { getScreenRecorder, type ScreenRecordingFile } from '../../core/vendor/screenRecorder';
import { useTheme, type Theme } from '../../design-system';
import { ProteinWebView, type ProteinWebViewHandle } from './ProteinWebView';
import { type MeasureMode, type VisualizationMode } from './proteinViewerHtml';
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
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const screenRecorder = useMemo(() => getScreenRecorder(), []);
  const webviewRef = useRef<ProteinWebViewHandle>(null);
  const [mode, setMode] = useState<VisualizationMode>(initialVisualizationMode);
  const [labelsVisible, setLabelsVisible] = useState(initialAtomLabelsVisible);
  const [measureMode, setMeasureModeState] = useState<MeasureMode>('off');
  const [isRecording, setIsRecording] = useState(false);
  const lastFinishedRecording = useRef<ScreenRecordingFile | null>(null);

  function handleModeChange(nextMode: VisualizationMode) {
    setMode(nextMode);
    webviewRef.current?.setVisualizationMode(nextMode);
  }

  function toggleLabels() {
    const next = !labelsVisible;
    setLabelsVisible(next);
    webviewRef.current?.setAtomLabelsVisible(next);
  }

  function toggleMeasureMode(target: Exclude<MeasureMode, 'off'>) {
    const next = measureMode === target ? 'off' : target;
    setMeasureModeState(next);
    webviewRef.current?.setMeasureMode(next);
  }

  function handleSharePress() {
    Alert.alert('Share ligand', 'Choose an image format', [
      { text: 'PNG', onPress: () => webviewRef.current?.requestSnapshot('png') },
      { text: 'JPEG', onPress: () => webviewRef.current?.requestSnapshot('jpeg') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function shareRecording(file: ScreenRecordingFile) {
    const uri = file.path.startsWith('file://') ? file.path : `file://${file.path}`;
    try {
      await Sharing.shareAsync(uri, { mimeType: 'video/mp4', dialogTitle: `Share ${code} recording` });
    } catch (error) {
      console.warn('Failed to share recording:', error);
    }
  }

  async function handleToggleRecording() {
    if (screenRecorder === null) {
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      try {
        if (Platform.OS === 'ios') {
          const file = (await screenRecorder.stopInAppRecording()) ?? lastFinishedRecording.current;
          lastFinishedRecording.current = null;
          if (file) {
            await shareRecording(file);
          }
        } else if (Platform.OS === 'android') {
          let file = await screenRecorder.stopGlobalRecording({ settledTimeMs: 1500 });
          if (!file) {
            file = screenRecorder.retrieveLastGlobalRecording();
          }
          if (file) {
            await shareRecording(file);
          }
        }
      } finally {
        endAppLockSuppression();
      }
      return;
    }

    beginAppLockSuppression();

    if (Platform.OS === 'ios') {
      lastFinishedRecording.current = null;
      await screenRecorder.startInAppRecording({
        options: { enableCamera: false, enableMic: false },
        onRecordingFinished: (file) => {
          lastFinishedRecording.current = file;
        },
      });
      setIsRecording(true);
    } else if (Platform.OS === 'android') {
      screenRecorder.startGlobalRecording({
        options: { enableMic: false },
        onRecordingError: (error) => {
          setIsRecording(false);
          endAppLockSuppression();
          Alert.alert('Recording failed', error.message);
        },
      });
      setIsRecording(true);
    }
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
        <View style={styles.headerActions}>
          {screenRecorder !== null && (
            <Pressable
              onPress={handleToggleRecording}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityState={{ checked: isRecording }}
              accessibilityLabel={isRecording ? 'Stop recording' : 'Record this ligand'}
            >
              <Ionicons
                name={isRecording ? 'stop-circle' : 'radio-button-on'}
                size={24}
                color={isRecording ? theme.colors.danger : theme.colors.textSecondary}
              />
            </Pressable>
          )}
          <Pressable
            onPress={handleSharePress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Share this ligand"
          >
            <Ionicons name="share-outline" size={24} color={theme.colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {isRecording && (
        <View style={styles.recordingBanner} accessible accessibilityRole="text">
          <View style={styles.recordingDot} />
          <Text style={styles.recordingBannerText}>Recording</Text>
        </View>
      )}

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
        <Pressable
          onPress={() => toggleMeasureMode('distance')}
          hitSlop={8}
          style={styles.labelsToggle}
          accessibilityRole="switch"
          accessibilityState={{ checked: measureMode === 'distance' }}
          accessibilityLabel="Toggle measure distance mode"
        >
          <Ionicons
            name={measureMode === 'distance' ? 'resize' : 'resize-outline'}
            size={20}
            color={measureMode === 'distance' ? theme.colors.accent : theme.colors.textSecondary}
          />
        </Pressable>
        <Pressable
          onPress={() => toggleMeasureMode('angle')}
          hitSlop={8}
          style={styles.labelsToggle}
          accessibilityRole="switch"
          accessibilityState={{ checked: measureMode === 'angle' }}
          accessibilityLabel="Toggle measure angle mode"
        >
          <Ionicons
            name={measureMode === 'angle' ? 'triangle' : 'triangle-outline'}
            size={20}
            color={measureMode === 'angle' ? theme.colors.accent : theme.colors.textSecondary}
          />
        </Pressable>
      </View>

      <ProteinWebView
        ref={webviewRef}
        code={code}
        raw={raw}
        initialVisualizationMode={initialVisualizationMode}
        initialAtomLabelsVisible={initialAtomLabelsVisible}
        onParseFailure={onBack}
      />
    </SafeAreaView>
  );
}

function createStyles(theme: Theme) {
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
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.lg,
    },
    recordingBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',
      gap: theme.spacing.xs,
      backgroundColor: theme.colors.surfaceRaised,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.borderStrong,
      borderRadius: theme.radius.pill,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      marginBottom: theme.spacing.sm,
    },
    recordingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.danger,
    },
    recordingBannerText: {
      fontSize: theme.fontSize.caption,
      fontWeight: theme.fontWeight.medium,
      color: theme.colors.textPrimary,
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
  });
}
