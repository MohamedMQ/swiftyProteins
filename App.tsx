import * as ExpoSplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { loadLigandCodes } from './src/core/persistence/ligandRepository';
import { useAppLock } from './src/core/security/useAppLock';
import { PrivacyOverlay } from './src/features/app-lock/PrivacyOverlay';
import { AuthFlow } from './src/features/auth/AuthFlow';
import { LigandListScreen } from './src/features/ligand-list/LigandListScreen';
import { ProteinViewScreen } from './src/features/protein-view/ProteinViewScreen';
import { SplashScreen } from './src/features/splash/SplashScreen';

const MIN_SPLASH_DURATION_MS = 1500;

ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [ligandCodes, setLigandCodes] = useState<string[] | null>(null);
  const [minDurationElapsed, setMinDurationElapsed] = useState(false);
  const [protein, setProtein] = useState<{ code: string; raw: string } | null>(null);
  const { isLocked, unlock } = useAppLock();

  useEffect(() => {
    ExpoSplashScreen.hideAsync().catch(() => {});

    const timer = setTimeout(() => setMinDurationElapsed(true), MIN_SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    loadLigandCodes()
      .then(setLigandCodes)
      .catch(() => setLigandCodes([]));
  }, []);

  const ready = ligandCodes !== null && minDurationElapsed;

  function renderContent() {
    if (!ready) {
      return <SplashScreen />;
    }
    if (isLocked) {
      return <AuthFlow onAuthenticated={unlock} />;
    }
    if (protein !== null) {
      return (
        <ProteinViewScreen
          code={protein.code}
          raw={protein.raw}
          onBack={() => setProtein(null)}
        />
      );
    }
    return (
      <LigandListScreen
        codes={ligandCodes ?? []}
        onLigandLoaded={(code, raw) => setProtein({ code, raw })}
      />
    );
  }

  return (
    <SafeAreaProvider>
      {renderContent()}
      <PrivacyOverlay />
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
