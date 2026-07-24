import { darkTheme } from './colors';
import { radius } from './radius';
import { spacing } from './spacing';
import { fontSize, fontWeight } from './typography';

export const theme = {
  colors: darkTheme,
  spacing,
  radius,
  fontSize,
  fontWeight,
} as const;

export type Theme = typeof theme;
