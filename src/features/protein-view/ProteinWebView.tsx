import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import WebView from 'react-native-webview';

import { theme } from '../../design-system';
import { moleculeToSdf } from '../../core/parsing/moleculeToSdf';
import { parseMolecule } from '../../core/parsing/molecule';
import { load3DmolScript } from '../../core/vendor/load3DmolScript';
import { AtomInfoCard, type AtomInfo, type BondDetail } from './AtomInfoCard';
import { buildProteinViewerHtml, type ImageExportFormat, type VisualizationMode } from './proteinViewerHtml';

interface ProteinWebViewProps {
  code: string;
  raw: string;
  initialVisualizationMode?: VisualizationMode;
  initialAtomLabelsVisible?: boolean;
}

export interface ProteinWebViewHandle {
  requestSnapshot: (format: ImageExportFormat) => void;
  setVisualizationMode: (mode: VisualizationMode) => void;
  setAtomLabelsVisible: (visible: boolean) => void;
  setMeasureModeEnabled: (enabled: boolean) => void;
}

interface ViewerMessage {
  type:
    | 'ready'
    | 'error'
    | 'atomClick'
    | 'backgroundClick'
    | 'snapshot'
    | 'visualizationModeChanged'
    | 'atomLabelsVisibilityChanged'
    | 'measureModeChanged'
    | 'measurePointSelected'
    | 'measurementResult'
    | 'measureCleared';
  message?: string;
  dataUri?: string;
  atom?: {
    id: number;
    element: string;
    x: number;
    y: number;
    z: number;
    bondOrders: number[];
    bonds?: BondDetail[];
  };
  enabled?: boolean;
  element?: string;
  distance?: number;
  fromElement?: string;
  toElement?: string;
  format?: ImageExportFormat;
}

const SNAPSHOT_MIME_TYPE: Record<ImageExportFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
};

/**
 * 3Dmol.js needs a real browser DOM, so it runs inside a WebView, not
 * React Native's own JS runtime — this component's job is just building
 * that self-contained HTML page (parse -> serialize to SDF -> inline into
 * the 3Dmol template) and bridging its postMessage events back out.
 */
export const ProteinWebView = forwardRef<ProteinWebViewHandle, ProteinWebViewProps>(function ProteinWebView(
  { code, raw, initialVisualizationMode, initialAtomLabelsVisible },
  ref,
) {
  const [html, setHtml] = useState<string | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [selectedAtom, setSelectedAtom] = useState<AtomInfo | null>(null);
  const [measurementBanner, setMeasurementBanner] = useState<string | null>(null);
  const webviewRef = useRef<WebView>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const molecule = parseMolecule(raw);
        const sdf = moleculeToSdf(molecule, code);
        const script = await load3DmolScript();
        if (!cancelled) {
          setHtml(
            buildProteinViewerHtml(script, sdf, {
              initialVisualizationMode,
              initialAtomLabelsVisible,
            })
          );
        }
      } catch (error) {
        if (!cancelled) {
          setBuildError(error instanceof Error ? error.message : String(error));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // initialVisualizationMode/initialAtomLabelsVisible are deliberately
    // excluded from the dependency list — they only seed the WebView's
    // starting state and shouldn't trigger a full HTML rebuild (and thus
    // a visible re-render of the viewer) when the user changes them live
    // via the switcher/toggle in this same screen.
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
    setMeasureModeEnabled(enabled: boolean) {
      webviewRef.current?.injectJavaScript(`window.__setMeasureModeEnabled(${JSON.stringify(enabled)}); true;`);
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
    try {
      await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: `Share ${code}` });
    } finally {
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
    } else if (message.type === 'atomClick' && message.atom !== undefined) {
      setSelectedAtom(message.atom);
    } else if (message.type === 'backgroundClick') {
      setSelectedAtom(null);
    } else if (message.type === 'snapshot' && message.dataUri !== undefined && message.format !== undefined) {
      shareSnapshot(message.dataUri, message.format).catch((error) => {
        console.warn('Failed to share snapshot:', error);
      });
    } else if (message.type === 'measureModeChanged') {
      setMeasurementBanner(message.enabled === true ? 'Tap an atom to start measuring' : null);
    } else if (message.type === 'measurePointSelected') {
      setMeasurementBanner(`${message.element ?? ''} selected — tap a second atom`);
    } else if (message.type === 'measureCleared') {
      setMeasurementBanner('Tap an atom to start measuring');
    } else if (
      message.type === 'measurementResult' &&
      message.distance !== undefined &&
      message.fromElement !== undefined &&
      message.toElement !== undefined
    ) {
      setMeasurementBanner(`${message.fromElement}–${message.toElement}: ${message.distance.toFixed(2)} Å`);
    }
  }

  if (buildError !== null) {
    // Parsing was already proven against real RCSB data in Day 6; this
    // guards only the theoretical case of a genuinely unparseable molecule
    // reaching this screen, so the view stays blank instead of crashing.
    return <View style={styles.container} />;
  }

  if (html === null) {
    return (
      <View style={[styles.container, styles.loading]}>
        <ActivityIndicator color={theme.colors.accent} />
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
      {selectedAtom !== null && <AtomInfoCard atom={selectedAtom} />}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
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
