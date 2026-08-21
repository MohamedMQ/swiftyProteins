import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Share, StyleSheet, Text, View } from 'react-native';
import WebView from 'react-native-webview';

import { AlertCard, useTheme, type Theme } from '../../design-system';
import {
  getLigandFetchErrorIcon,
  getLigandFetchErrorMessage,
  getLigandFetchErrorTitle,
} from '../../core/networking/ligandFetchError';
import { beginAppLockSuppression, endAppLockSuppression } from '../../core/security/appLockSuppression';
import { moleculeToSdf } from '../../core/parsing/moleculeToSdf';
import { parseMolecule } from '../../core/parsing/molecule';
import { load3DmolScript } from '../../core/vendor/load3DmolScript';
import { AtomInfoCard, type AtomInfo, type BondDetail } from './AtomInfoCard';
import { BondInfoCard, type BondInfo } from './BondInfoCard';
import {
  buildProteinViewerHtml,
  type ImageExportFormat,
  type MeasureMode,
  type VisualizationMode,
} from './proteinViewerHtml';

interface ProteinWebViewProps {
  code: string;
  raw: string;
  initialVisualizationMode?: VisualizationMode;
  initialAtomLabelsVisible?: boolean;
  onParseFailure: () => void;
}

export interface ProteinWebViewHandle {
  requestSnapshot: (format: ImageExportFormat) => void;
  setVisualizationMode: (mode: VisualizationMode) => void;
  setAtomLabelsVisible: (visible: boolean) => void;
  setMeasureMode: (mode: MeasureMode) => void;
}

interface ViewerMessage {
  type:
    | 'ready'
    | 'error'
    | 'atomClick'
    | 'bondClick'
    | 'backgroundClick'
    | 'snapshot'
    | 'visualizationModeChanged'
    | 'atomLabelsVisibilityChanged'
    | 'measureModeChanged'
    | 'measurePointSelected'
    | 'measurementResult'
    | 'measureCleared'
    | 'performanceDowngraded';
  message?: string;
  dataUri?: string;
  fps?: number;
  atom?: {
    id: number;
    element: string;
    x: number;
    y: number;
    z: number;
    bondOrders: number[];
    bonds?: BondDetail[];
  };
  bond?: BondInfo;
  mode?: MeasureMode;
  element?: string;
  hint?: string;
  kind?: 'distance' | 'angle';
  distance?: number;
  angle?: number;
  fromElement?: string;
  toElement?: string;
  elementA?: string;
  elementB?: string;
  elementC?: string;
  format?: ImageExportFormat;
}

const SNAPSHOT_MIME_TYPE: Record<ImageExportFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
};

const MEASURE_PROMPT: Record<Exclude<MeasureMode, 'off'>, string> = {
  distance: 'Tap an atom to start measuring distance',
  angle: 'Tap an atom to start measuring an angle',
};

function yieldToUI(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export const ProteinWebView = forwardRef<ProteinWebViewHandle, ProteinWebViewProps>(function ProteinWebView(
  { code, raw, initialVisualizationMode, initialAtomLabelsVisible, onParseFailure },
  ref,
) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [html, setHtml] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState('Parsing atomic structure…');
  const [buildError, setBuildError] = useState(false);
  const [moleculeSummary, setMoleculeSummary] = useState<{ formula: string; atomCount: number } | null>(
    null
  );
  const [selectedAtom, setSelectedAtom] = useState<AtomInfo | null>(null);
  const [selectedBond, setSelectedBond] = useState<BondInfo | null>(null);
  const [measurementBanner, setMeasurementBanner] = useState<string | null>(null);
  const activeMeasureMode = useRef<MeasureMode>('off');
  const webviewRef = useRef<WebView>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoadingStage('Parsing atomic structure…');
        await yieldToUI();
        if (cancelled) {
          return;
        }
        const molecule = parseMolecule(raw);

        setLoadingStage('Building 3D model…');
        await yieldToUI();
        if (cancelled) {
          return;
        }
        const sdf = moleculeToSdf(molecule, code);

        setLoadingStage('Loading 3D engine…');
        const script = await load3DmolScript();
        if (cancelled) {
          return;
        }

        setLoadingStage('Preparing viewer…');
        await yieldToUI();
        if (cancelled) {
          return;
        }
        setMoleculeSummary({ formula: molecule.formula, atomCount: molecule.atoms.length });
        setHtml(
          buildProteinViewerHtml(script, sdf, {
            initialVisualizationMode,
            initialAtomLabelsVisible,
            backgroundColor: theme.colors.background,
            atomCount: molecule.atoms.length,
          })
        );
      } catch {
        if (!cancelled) {
          setBuildError(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [raw, code]);

  useImperativeHandle(ref, () => ({
    requestSnapshot(format: ImageExportFormat) {
      webviewRef.current?.injectJavaScript(`window.__captureSnapshot(${JSON.stringify(format)}); true;`);
    },
    setVisualizationMode(mode: VisualizationMode) {
      webviewRef.current?.injectJavaScript(`window.__setVisualizationMode(${JSON.stringify(mode)}); true;`);
    },
    setAtomLabelsVisible(visible: boolean) {
      webviewRef.current?.injectJavaScript(`window.__setAtomLabelsVisible(${JSON.stringify(visible)}); true;`);
    },
    setMeasureMode(mode: MeasureMode) {
      webviewRef.current?.injectJavaScript(`window.__setMeasureMode(${JSON.stringify(mode)}); true;`);
    },
  }));

  async function shareSnapshot(dataUri: string, format: ImageExportFormat) {
    const mimeType = SNAPSHOT_MIME_TYPE[format];
    const prefix = `data:${mimeType};base64,`;
    if (!dataUri.startsWith(prefix)) {
      return;
    }
    const base64Content = dataUri.slice(prefix.length);
    const extension = format === 'jpeg' ? 'jpg' : 'png';
    const file = new File(Paths.cache, `${code}-${Date.now()}.${extension}`);
    file.create();
    file.write(base64Content, { encoding: 'base64' });
    const caption =
      moleculeSummary !== null
        ? `${code} — ${moleculeSummary.formula} (${moleculeSummary.atomCount} atoms) · Swifty Protein`
        : code;
    beginAppLockSuppression();
    try {
      if (Platform.OS === 'ios') {
        await Share.share({ message: caption, url: file.uri });
      } else {
        await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: caption });
      }
    } finally {
      endAppLockSuppression();
      if (file.exists) {
        file.delete();
      }
    }
  }

  function handleMessage(event: { nativeEvent: { data: string } }) {
    let message: ViewerMessage;
    try {
      message = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }

    if (message.type === 'error') {
      console.warn('3Dmol viewer error:', message.message);
    } else if (message.type === 'performanceDowngraded') {
      console.info('3Dmol viewer: reduced render quality after sustained low FPS', message.fps);
    } else if (message.type === 'atomClick' && message.atom !== undefined) {
      setSelectedBond(null);
      setSelectedAtom(message.atom);
    } else if (message.type === 'bondClick' && message.bond !== undefined) {
      setSelectedAtom(null);
      setSelectedBond(message.bond);
    } else if (message.type === 'backgroundClick') {
      setSelectedAtom(null);
      setSelectedBond(null);
    } else if (message.type === 'snapshot' && message.dataUri !== undefined && message.format !== undefined) {
      shareSnapshot(message.dataUri, message.format).catch((error) => {
        console.warn('Failed to share snapshot:', error);
      });
    } else if (message.type === 'measureModeChanged') {
      const mode = message.mode ?? 'off';
      activeMeasureMode.current = mode;
      setMeasurementBanner(mode !== 'off' ? MEASURE_PROMPT[mode] : null);
    } else if (message.type === 'measurePointSelected') {
      setMeasurementBanner(`${message.element ?? ''} selected — ${message.hint ?? 'tap the next atom'}`);
    } else if (message.type === 'measureCleared') {
      const mode = activeMeasureMode.current;
      setMeasurementBanner(mode !== 'off' ? MEASURE_PROMPT[mode] : null);
    } else if (message.type === 'measurementResult' && message.kind === 'angle' && message.angle !== undefined) {
      setMeasurementBanner(
        `${message.elementA}–${message.elementB}–${message.elementC}: ${message.angle.toFixed(1)}°`
      );
    } else if (
      message.type === 'measurementResult' &&
      message.kind === 'distance' &&
      message.distance !== undefined &&
      message.fromElement !== undefined &&
      message.toElement !== undefined
    ) {
      setMeasurementBanner(`${message.fromElement}–${message.toElement}: ${message.distance.toFixed(2)} Å`);
    }
  }

  if (buildError) {
    return (
      <View style={styles.container}>
        <AlertCard
          iconName={getLigandFetchErrorIcon({ type: 'parseFailure' })}
          title={getLigandFetchErrorTitle({ type: 'parseFailure' })}
          message={getLigandFetchErrorMessage({ type: 'parseFailure' })}
          onDismiss={onParseFailure}
        />
      </View>
    );
  }

  if (html === null) {
    return (
      <View style={[styles.container, styles.loading]}>
        <ActivityIndicator color={theme.colors.accent} />
        <Text style={styles.loadingText}>{loadingStage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        style={styles.container}
        source={{ html }}
        onMessage={handleMessage}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled={false}
      />
      {measurementBanner !== null && (
        <View style={styles.measurementBanner} accessible accessibilityRole="text">
          <Text style={styles.measurementBannerText}>{measurementBanner}</Text>
        </View>
      )}
      {selectedAtom !== null && (
        <AtomInfoCard
          atom={selectedAtom}
          onDismiss={() => {
            setSelectedAtom(null);
            webviewRef.current?.injectJavaScript('window.__clearSelection && window.__clearSelection(); true;');
          }}
        />
      )}
      {selectedBond !== null && <BondInfoCard bond={selectedBond} onDismiss={() => setSelectedBond(null)} />}
    </View>
  );
});

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loading: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
    },
    loadingText: {
      fontSize: theme.fontSize.caption,
      color: theme.colors.textQuaternary,
    },
    measurementBanner: {
      position: 'absolute',
      top: theme.spacing.md,
      left: theme.spacing.lg,
      right: theme.spacing.lg,
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceRaised,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.borderStrong,
      borderRadius: theme.radius.md,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
    },
    measurementBannerText: {
      fontSize: theme.fontSize.caption,
      fontWeight: theme.fontWeight.medium,
      color: theme.colors.textPrimary,
    },
  });
}
