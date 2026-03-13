// LifeArc Design System — theme tokens
// Jediný zdroj pravdy pro barvy, typografii, spacing, stíny.

export const fontSizes = {
  xs:   11,
  sm:   13,
  md:   15,
  lg:   17,
  xl:   20,
  xxl:  24,
  hero: 32,
} as const;

export const fontWeights = {
  regular:   '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
  extrabold: '800' as const,
};

export const spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
} as const;

export const radius = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   18,
  full: 999,
} as const;

export const shadows = {
  card: {
    shadowColor: '#0F1117',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  modal: {
    shadowColor: '#0F1117',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  fab: {
    shadowColor: '#3B6FE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  capsuleLocked: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  capsuleUnlocked: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 7,
  },
} as const;

// ---------------------------------------------------------------------------
// Palety barev
// ---------------------------------------------------------------------------

const lightColors = {
  bg:               '#f2f4f8',
  surface:          '#ffffff',
  surfaceElevated:  '#f0f2f8',
  text:             '#1a1a2e',
  textSecondary:    '#1a1a2e',
  textTertiary:     '#999999',
  primary:          '#2563eb',
  primaryLight:     '#e8f0ff',
  border:           '#dde2f0',
  borderFocus:      '#2563eb',
  success:          '#16a34a',
  successLight:     '#edfff5',
  danger:           '#e53e3e',
  dangerLight:      '#fff0f0',
  warning:          '#d97706',
  neutral:          '#999999',
};

const darkColors = {
  bg:               '#0d0d14',
  surface:          '#16162a',
  surfaceElevated:  '#1e1e30',
  text:             '#f0f0f0',
  textSecondary:    '#e8e8f0',
  textTertiary:     '#555555',
  primary:          '#4a9eff',
  primaryLight:     '#1a2540',
  border:           '#2e2e4a',
  borderFocus:      '#4a9eff',
  success:          '#4ade80',
  successLight:     '#1a2a1e',
  danger:           '#ff4a4a',
  dangerLight:      '#2a0a0a',
  warning:          '#fbbf24',
  neutral:          '#888888',
};

// Space téma — vždy tmavé, pro Time Capsule
export const spaceColors = {
  bg:               '#06060F',
  surface:          '#0D0D1E',
  surfaceElevated:  '#131325',
  text:             '#E8E8F0',
  textSub:          '#8888AA',
  border:           '#1E1E3F',
  borderActive:     '#7C3AED',
  accent1:          '#7C3AED',  // nebula violet
  accent2:          '#2563EB',  // deep cosmic blue
  accent3:          '#06B6D4',  // cyan star-light
  accentGlow:       'rgba(124,58,237,0.25)',
  unlocked:         '#10B981',  // emerald — "kapsle dorazila"
  locked:           '#7C3AED',  // mysterious purple
  warning:          '#F59E0B',
  starDim:          'rgba(200,200,255,0.05)',
};

export const colors = {
  light: lightColors,
  dark:  darkColors,
} as const;

export type AppTheme = 'light' | 'dark';
export type ColorSet = typeof lightColors;

export function getColors(dark: boolean): ColorSet {
  return dark ? darkColors : lightColors;
}

// Module accent colors per screen
export const moduleAccents = {
  vaults: {
    dark:  '#4a9eff',
    light: '#2563eb',
    iconBgDark:  '#1a2540',
    iconBgLight: '#e8f0ff',
  },
  calendar: {
    dark:  '#4a9eff',
    light: '#2563eb',
    iconBgDark:  '#1a2540',
    iconBgLight: '#e8f0ff',
  },
  capsules: {
    dark:  '#a78bfa',
    light: '#7c3aed',
    iconBgDark:  '#1e1a30',
    iconBgLight: '#f0eeff',
  },
  notes: {
    dark:  '#4ade80',
    light: '#16a34a',
    iconBgDark:  '#1a2a1e',
    iconBgLight: '#edfff5',
  },
  settings: {
    dark:  '#888888',
    light: '#999999',
    iconBgDark:  '#1e1e2a',
    iconBgLight: '#f0f0f4',
  },
} as const;

export function getModuleAccent(module: keyof typeof moduleAccents, dark: boolean) {
  const m = moduleAccents[module];
  return {
    accent:   dark ? m.dark  : m.light,
    iconBg:   dark ? m.iconBgDark : m.iconBgLight,
  };
}
