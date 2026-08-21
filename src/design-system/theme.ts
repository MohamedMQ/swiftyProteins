import { createContext, useContext, useMemo } from 'react';

import { darkTheme, lightTheme } from './colors';
import { radius } from './radius';
import { spacing } from './spacing';
import { fontSize, fontWeight } from './typography';

export type ThemeMode = 'dark' | 'light';

export function buildTheme(mode: ThemeMode) {
  return {
    colors: mode === 'dark' ? darkTheme : lightTheme,
    spacing,
    radius,
    fontSize,
    fontWeight,
  } as const;
}

export type Theme = ReturnType<typeof buildTheme>;

export const theme: Theme = buildTheme('dark');

export const ThemeModeContext = createContext<ThemeMode>('dark');

export function useTheme(): Theme {
  const mode = useContext(ThemeModeContext);
  return useMemo(() => buildTheme(mode), [mode]);
}
