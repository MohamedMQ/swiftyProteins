import { File, Paths } from 'expo-file-system';

import type { ThemeMode } from '../../design-system';
import { VISUALIZATION_MODES, type VisualizationMode } from '../viewer/visualizationMode';

export interface Preferences {
  defaultVisualizationMode: VisualizationMode;
  defaultAtomLabelsVisible: boolean;
  themeMode: ThemeMode;
  hasSeenOnboarding: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = {
  defaultVisualizationMode: 'ballAndStick',
  defaultAtomLabelsVisible: false,
  themeMode: 'dark',
  hasSeenOnboarding: false,
};

const PREFERENCES_FILE = new File(Paths.document, 'preferences.json');

function isVisualizationMode(value: unknown): value is VisualizationMode {
  return typeof value === 'string' && (VISUALIZATION_MODES as readonly string[]).includes(value);
}

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'dark' || value === 'light';
}

export function parsePreferencesJson(raw: string): Preferences {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return DEFAULT_PREFERENCES;
    }
    const candidate = parsed as Record<string, unknown>;
    return {
      defaultVisualizationMode: isVisualizationMode(candidate.defaultVisualizationMode)
        ? candidate.defaultVisualizationMode
        : DEFAULT_PREFERENCES.defaultVisualizationMode,
      defaultAtomLabelsVisible:
        typeof candidate.defaultAtomLabelsVisible === 'boolean'
          ? candidate.defaultAtomLabelsVisible
          : DEFAULT_PREFERENCES.defaultAtomLabelsVisible,
      themeMode: isThemeMode(candidate.themeMode) ? candidate.themeMode : DEFAULT_PREFERENCES.themeMode,
      hasSeenOnboarding:
        typeof candidate.hasSeenOnboarding === 'boolean'
          ? candidate.hasSeenOnboarding
          : DEFAULT_PREFERENCES.hasSeenOnboarding,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function loadPreferences(): Promise<Preferences> {
  if (!PREFERENCES_FILE.exists) {
    return DEFAULT_PREFERENCES;
  }
  return parsePreferencesJson(await PREFERENCES_FILE.text());
}

export function savePreferences(preferences: Preferences): void {
  try {
    if (!PREFERENCES_FILE.exists) {
      PREFERENCES_FILE.create({ intermediates: true });
    }
    PREFERENCES_FILE.write(JSON.stringify(preferences));
  } catch {
  }
}
