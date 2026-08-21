import { DEFAULT_PREFERENCES, parsePreferencesJson } from '../preferencesRepository';

describe('parsePreferencesJson', () => {
  it('parses a fully valid preferences object', () => {
    expect(
      parsePreferencesJson(
        '{"defaultVisualizationMode":"spaceFilling","defaultAtomLabelsVisible":true,"themeMode":"light","hasSeenOnboarding":true}'
      )
    ).toEqual({
      defaultVisualizationMode: 'spaceFilling',
      defaultAtomLabelsVisible: true,
      themeMode: 'light',
      hasSeenOnboarding: true,
    });
  });

  it('returns the defaults for malformed JSON rather than throwing', () => {
    expect(parsePreferencesJson('not valid json')).toEqual(DEFAULT_PREFERENCES);
  });

  it('returns the defaults when the JSON is valid but not an object', () => {
    expect(parsePreferencesJson('42')).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferencesJson('null')).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferencesJson('[1,2,3]')).toEqual(DEFAULT_PREFERENCES);
  });

  it('falls back to the default visualization mode when the stored value is not a recognized mode', () => {
    expect(parsePreferencesJson('{"defaultVisualizationMode":"holographic"}')).toEqual({
      ...DEFAULT_PREFERENCES,
      defaultVisualizationMode: DEFAULT_PREFERENCES.defaultVisualizationMode,
    });
  });

  it('falls back to the default atom labels visibility when the stored value is not a boolean', () => {
    expect(parsePreferencesJson('{"defaultAtomLabelsVisible":"yes"}')).toEqual({
      ...DEFAULT_PREFERENCES,
      defaultAtomLabelsVisible: DEFAULT_PREFERENCES.defaultAtomLabelsVisible,
    });
  });

  it('fills in missing fields with defaults rather than requiring the full shape', () => {
    expect(parsePreferencesJson('{"defaultAtomLabelsVisible":true}')).toEqual({
      ...DEFAULT_PREFERENCES,
      defaultAtomLabelsVisible: true,
    });
  });

  it('falls back to the default theme mode when the stored value is not "dark" or "light"', () => {
    expect(parsePreferencesJson('{"themeMode":"solarized"}')).toEqual({
      ...DEFAULT_PREFERENCES,
      themeMode: DEFAULT_PREFERENCES.themeMode,
    });
  });

  it('accepts a stored light theme mode', () => {
    expect(parsePreferencesJson('{"themeMode":"light"}')).toEqual({
      ...DEFAULT_PREFERENCES,
      themeMode: 'light',
    });
  });

  it('falls back to the default onboarding flag when the stored value is not a boolean', () => {
    expect(parsePreferencesJson('{"hasSeenOnboarding":"yes"}')).toEqual({
      ...DEFAULT_PREFERENCES,
      hasSeenOnboarding: DEFAULT_PREFERENCES.hasSeenOnboarding,
    });
  });
});
