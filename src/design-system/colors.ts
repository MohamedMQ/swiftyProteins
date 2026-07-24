/**
 * Palette extracted from the Swifty Protein UI mockups (auth, ligand list,
 * 3D viewer screens). The mockups are dark-only today, so `darkTheme` is the
 * single implemented palette; `ColorTheme` exists so a `lightTheme` can be
 * added later without touching consumers.
 */
export interface ColorTheme {
  background: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  borderStrong: string;
  divider: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textQuaternary: string;
  accent: string;
  onAccent: string;
  danger: string;
}

export const darkTheme: ColorTheme = {
  background: '#0E1116',
  surface: '#171B22',
  surfaceRaised: '#1A1F27',
  border: '#262C35',
  borderStrong: '#2F3641',
  divider: '#1B2027',
  textPrimary: '#E8EAED',
  textSecondary: '#D8DCE2',
  textTertiary: '#8B93A0',
  textQuaternary: '#6E7683',
  accent: '#35C7A0',
  onAccent: '#04342C',
  danger: '#F09595',
};
