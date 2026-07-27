import * as ExpoSplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { loadLigandCodes } from './src/core/persistence/ligandRepository';
import { useAppLock } from './src/core/security/useAppLock';
import { AuthFlow } from './src/features/auth/AuthFlow';
import { LigandListScreen } from './src/features/ligand-list/LigandListScreen';
import { SplashScreen } from './src/features/splash/SplashScreen';

const MIN_SPLASH_DURATION_MS = 1500;

ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [ligandCodes, setLigandCodes] = useState<string[] | null>(null);
  const [minDurationElapsed, setMinDurationElapsed] = useState(false);
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
    return <LigandListScreen codes={ligandCodes ?? []} />;
  }

  return (
    <>
      {renderContent()}
      <StatusBar style="light" />
    </>
  );
}
