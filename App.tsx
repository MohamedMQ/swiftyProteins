import * as ExpoSplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeModeContext } from './src/design-system';
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
import { ComparisonScreen } from './src/features/comparison/ComparisonScreen';
import { LigandListScreen } from './src/features/ligand-list/LigandListScreen';
import { OnboardingScreen } from './src/features/onboarding/OnboardingScreen';
import { ProteinViewScreen } from './src/features/protein-view/ProteinViewScreen';
import { SettingsScreen } from './src/features/settings/SettingsScreen';
import { SplashScreen } from './src/features/splash/SplashScreen';

const MIN_SPLASH_DURATION_MS = 1500;
const SCREEN_FADE_DURATION_MS = 220;

ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

interface LigandPayload {
  code: string;
  raw: string;
}

function ScreenFade({ screenKey, children }: { screenKey: string; children: ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: SCREEN_FADE_DURATION_MS,
      useNativeDriver: true,
    }).start();
  }, [screenKey, opacity]);

  return <Animated.View style={{ flex: 1, opacity }}>{children}</Animated.View>;
}

export default function App() {
  const [ligandCodes, setLigandCodes] = useState<string[] | null>(null);
  const [minDurationElapsed, setMinDurationElapsed] = useState(false);
  const [protein, setProtein] = useState<LigandPayload | null>(null);
  const [comparison, setComparison] = useState<{ a: LigandPayload; b: LigandPayload } | null>(null);
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [showSettings, setShowSettings] = useState(false);
  const { isLocked, unlock, lock } = useAppLock();

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

  function getScreen(): { key: string; node: ReactNode } {
    if (!ready) {
      return { key: 'splash', node: <SplashScreen /> };
    }
    if (isLocked) {
      return { key: 'auth', node: <AuthFlow onAuthenticated={unlock} /> };
    }
    if (!preferences.hasSeenOnboarding) {
      return {
        key: 'onboarding',
        node: (
          <OnboardingScreen
            onComplete={() => handlePreferencesChange({ ...preferences, hasSeenOnboarding: true })}
          />
        ),
      };
    }
    if (protein !== null) {
      return {
        key: 'protein',
        node: (
          <ProteinViewScreen
            code={protein.code}
            raw={protein.raw}
            initialVisualizationMode={preferences.defaultVisualizationMode}
            initialAtomLabelsVisible={preferences.defaultAtomLabelsVisible}
            onBack={() => setProtein(null)}
          />
        ),
      };
    }
    if (comparison !== null) {
      return {
        key: 'comparison',
        node: (
          <ComparisonScreen
            ligandA={comparison.a}
            ligandB={comparison.b}
            onBack={() => setComparison(null)}
          />
        ),
      };
    }
    if (showSettings) {
      return {
        key: 'settings',
        node: (
          <SettingsScreen
            preferences={preferences}
            onChange={handlePreferencesChange}
            onBack={() => setShowSettings(false)}
            onLogout={() => {              setShowSettings(false);
              lock();
            }}
          />
        ),
      };
    }
    return {
      key: 'list',
      node: (
        <LigandListScreen
          codes={ligandCodes ?? []}
          onLigandLoaded={(code, raw) => setProtein({ code, raw })}
          onOpenSettings={() => setShowSettings(true)}
          onCompareReady={(a, b) => setComparison({ a, b })}
        />
      ),
    };
  }

  const { key: screenKey, node: screenNode } = getScreen();

  return (
    <ThemeModeContext.Provider value={preferences.themeMode}>
      <SafeAreaProvider>
        <ScreenFade screenKey={screenKey}>{screenNode}</ScreenFade>
        <PrivacyOverlay />
        <StatusBar style={preferences.themeMode === 'dark' ? 'light' : 'dark'} />
      </SafeAreaProvider>
    </ThemeModeContext.Provider>
  );
}
