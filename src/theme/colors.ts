// EVI Brand Colors
export const Colors = {
  // Primary brand
  primary: '#2563EB',        // Blue - trust, reliability
  primaryLight: '#60A5FA',
  primaryDark: '#1D4ED8',

  // Secondary
  secondary: '#7C3AED',     // Purple - premium feel
  secondaryLight: '#A78BFA',

  // Accent
  accent: '#F59E0B',        // Amber - warmth, home
  accentLight: '#FCD34D',

  // Status colors (matching the proactive alerts)
  urgent: '#EF4444',        // Red - needs immediate attention
  warning: '#F59E0B',       // Amber - coming up soon
  good: '#10B981',          // Green - all good
  info: '#3B82F6',          // Blue - informational

  // Neutrals
  background: '#FFFFFF',
  surface: '#F8FAFC',
  surfaceAlt: '#F1F5F9',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',

  // Dark mode (for future)
  dark: {
    background: '#0F172A',
    surface: '#1E293B',
    surfaceAlt: '#334155',
    border: '#475569',
    textPrimary: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textTertiary: '#64748B',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  hero: 40,
};

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};
