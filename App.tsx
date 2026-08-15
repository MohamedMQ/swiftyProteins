import * as ExpoSplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { loadLigandCodes } from './src/core/persistence/ligandRepository';
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
  type Preferences,
} from './src/core/persistence/preferencesRepository';
import { useAppLock } from './src/core/security/useAppLock';
import { PrivacyOverlay } from './src/features/app-lock/PrivacyOverlay';
import { AuthFlow } from './src/features/auth/AuthFlow';
import { LigandListScreen } from './src/features/ligand-list/LigandListScreen';
import { ProteinViewScreen } from './src/features/protein-view/ProteinViewScreen';
import { SettingsScreen } from './src/features/settings/SettingsScreen';
import { SplashScreen } from './src/features/splash/SplashScreen';

const MIN_SPLASH_DURATION_MS = 1500;

ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [ligandCodes, setLigandCodes] = useState<string[] | null>(null);
  const [minDurationElapsed, setMinDurationElapsed] = useState(false);
  const [protein, setProtein] = useState<{ code: string; raw: string } | null>(null);
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [showSettings, setShowSettings] = useState(false);
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

  useEffect(() => {
    loadPreferences().then(setPreferences);
  }, []);

  function handlePreferencesChange(next: Preferences) {
    setPreferences(next);
    savePreferences(next);
  }

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
          initialVisualizationMode={preferences.defaultVisualizationMode}
          initialAtomLabelsVisible={preferences.defaultAtomLabelsVisible}
          onBack={() => setProtein(null)}
        />
      );
    }
    if (showSettings) { 
      return (
        <SettingsScreen
          preferences={preferences}
          onChange={handlePreferencesChange}
          onBack={() => setShowSettings(false)}
        />
      );
    }
    return (
      <LigandListScreen
        codes={ligandCodes ?? []}
        onLigandLoaded={(code, raw) => setProtein({ code, raw })}
        onOpenSettings={() => setShowSettings(true)}
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
