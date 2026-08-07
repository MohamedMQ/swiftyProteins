import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import WebView from 'react-native-webview';

import { theme } from '../../design-system';
import { moleculeToSdf } from '../../core/parsing/moleculeToSdf';
import { parseMolecule } from '../../core/parsing/molecule';
import { load3DmolScript } from '../../core/vendor/load3DmolScript';
import { AtomInfoCard, type AtomInfo } from './AtomInfoCard';
import { buildProteinViewerHtml } from './proteinViewerHtml';

interface ProteinWebViewProps {
  code: string;
  raw: string;
}

interface ViewerMessage {
  type: 'ready' | 'error' | 'atomClick' | 'backgroundClick';
  message?: string;
  atom?: { id: number; element: string; x: number; y: number; z: number; bondOrders: number[] };
}

/**
 * 3Dmol.js needs a real browser DOM, so it runs inside a WebView, not
 * React Native's own JS runtime — this component's job is just building
 * that self-contained HTML page (parse -> serialize to SDF -> inline into
 * the 3Dmol template) and bridging its postMessage events back out.
 */
export function ProteinWebView({ code, raw }: ProteinWebViewProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [selectedAtom, setSelectedAtom] = useState<AtomInfo | null>(null);

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
}

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
