import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import WebView from 'react-native-webview';

import { theme } from '../../design-system';
import { moleculeToSdf } from '../../core/parsing/moleculeToSdf';
import { parseMolecule } from '../../core/parsing/molecule';
import { load3DmolScript } from '../../core/vendor/load3DmolScript';
import { AtomInfoCard, type AtomInfo } from './AtomInfoCard';
import { buildProteinViewerHtml, type VisualizationMode } from './proteinViewerHtml';

interface ProteinWebViewProps {
  code: string;
  raw: string;
}

export interface ProteinWebViewHandle {
  requestSnapshot: () => void;
  setVisualizationMode: (mode: VisualizationMode) => void;
  setAtomLabelsVisible: (visible: boolean) => void;
}

interface ViewerMessage {
  type:
    | 'ready'
    | 'error'
    | 'atomClick'
    | 'backgroundClick'
    | 'snapshot'
    | 'visualizationModeChanged'
    | 'atomLabelsVisibilityChanged';
  message?: string;
  dataUri?: string;
  atom?: { id: number; element: string; x: number; y: number; z: number; bondOrders: number[] };
}

const SNAPSHOT_DATA_URI_PREFIX = 'data:image/png;base64,';

/**
 * 3Dmol.js needs a real browser DOM, so it runs inside a WebView, not
 * React Native's own JS runtime — this component's job is just building
 * that self-contained HTML page (parse -> serialize to SDF -> inline into
 * the 3Dmol template) and bridging its postMessage events back out.
 */
export const ProteinWebView = forwardRef<ProteinWebViewHandle, ProteinWebViewProps>(function ProteinWebView(
  { code, raw },
  ref,
) {
  const [html, setHtml] = useState<string | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [selectedAtom, setSelectedAtom] = useState<AtomInfo | null>(null);
  const webviewRef = useRef<WebView>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const molecule = parseMolecule(raw);
        const sdf = moleculeToSdf(molecule, code);
        const script = await load3DmolScript();
        if (!cancelled) {
          setHtml(buildProteinViewerHtml(script, sdf));
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
  }, [raw, code]);

  useImperativeHandle(ref, () => ({
    requestSnapshot() {
      webviewRef.current?.injectJavaScript('window.__captureSnapshot(); true;');
    },
    setVisualizationMode(mode: VisualizationMode) {
      webviewRef.current?.injectJavaScript(`window.__setVisualizationMode(${JSON.stringify(mode)}); true;`);
    },
    setAtomLabelsVisible(visible: boolean) {
      webviewRef.current?.injectJavaScript(`window.__setAtomLabelsVisible(${JSON.stringify(visible)}); true;`);
    },
  }));

  async function shareSnapshot(dataUri: string) {
    if (!dataUri.startsWith(SNAPSHOT_DATA_URI_PREFIX)) {
      return;
    }
    const base64Content = dataUri.slice(SNAPSHOT_DATA_URI_PREFIX.length);
    const file = new File(Paths.cache, `${code}-${Date.now()}.png`);
    file.create();
    file.write(base64Content, { encoding: 'base64' });
    try {
      await Sharing.shareAsync(file.uri, { mimeType: 'image/png', dialogTitle: `Share ${code}` });
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
    } else if (message.type === 'snapshot' && message.dataUri !== undefined) {
      shareSnapshot(message.dataUri).catch((error) => {
        console.warn('Failed to share snapshot:', error);
      });
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
});
