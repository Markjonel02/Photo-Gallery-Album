export const colors = {
  bg: '#090D16',
  surface: '#0F172A',
  surfaceAlt: '#1E293B',
  border: '#1E293B',
  borderStrong: '#334155',
  text: '#F8FAFC',
  textSoft: '#E2E8F0',
  textMuted: '#94A3B8',
  textFaint: '#64748B',
  primary: '#3B82F6',
  primaryText: '#93C5FD',
  accent: '#38BDF8',
  danger: '#EF4444',
  favorite: '#F43F5E',
  overlay: 'rgba(0,0,0,0.7)',
  scrim: 'rgba(0,0,0,0.45)',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;
export const fontSize = { xs: 11, sm: 12, md: 14, lg: 16, xl: 20, xxl: 28 } as const;

/** Apps should honour user font scaling but never let layouts break. */
export const MAX_FONT_MULTIPLIER = 1.3;
export const TAB_BAR_HEIGHT = 60;
