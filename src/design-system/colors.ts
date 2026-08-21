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

export const lightTheme: ColorTheme = {
  background: '#F5F6F8',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  border: '#DDE1E6',
  borderStrong: '#C7CCD4',
  divider: '#E7EAEE',
  textPrimary: '#12151A',
  textSecondary: '#2B303A',
  textTertiary: '#5B6472',
  textQuaternary: '#7A8492',
  accent: '#0E9C79',
  onAccent: '#FFFFFF',
  danger: '#C4453F',
};
