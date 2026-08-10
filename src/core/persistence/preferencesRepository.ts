import { File, Paths } from 'expo-file-system';

import { VISUALIZATION_MODES, type VisualizationMode } from '../viewer/visualizationMode';

export interface Preferences {
  defaultVisualizationMode: VisualizationMode;
  defaultAtomLabelsVisible: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = {
  defaultVisualizationMode: 'ballAndStick',
  defaultAtomLabelsVisible: false,
};

const PREFERENCES_FILE = new File(Paths.document, 'preferences.json');

function isVisualizationMode(value: unknown): value is VisualizationMode {
  return typeof value === 'string' && (VISUALIZATION_MODES as readonly string[]).includes(value);
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

/**
 * Preferences are best-effort persistence — a write failure shouldn't break
 * the in-memory setting the user just changed.
 */
export function savePreferences(preferences: Preferences): void {
  try {
    if (!PREFERENCES_FILE.exists) {
      PREFERENCES_FILE.create({ intermediates: true });
    }
    PREFERENCES_FILE.write(JSON.stringify(preferences));
  } catch {
    // Best-effort; a failed write just means the preference won't survive restart.
  }
}
