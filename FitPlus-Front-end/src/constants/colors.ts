// All the colors used in the app live here.
// Dark theme only — change these values to re-skin the whole app.

export const COLORS = {
  background: '#121214',
  surface: '#1E1E22',
  surfaceElevated: '#282830',
  primary: '#00E5FF',     // cyan accent
  secondary: '#00FF87',   // green accent
  danger: '#FF2A5F',      // red for errors / destructive actions
  text: '#FFFFFF',
  textMuted: '#A0A0AB',
  fat: '#FF9F40',         // orange for "fat" macro
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  round: 9999,
} as const;
