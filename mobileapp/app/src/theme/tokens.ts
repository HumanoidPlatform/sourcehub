export const colors = {
  white: '#FFFFFF',
  canvas: '#F6F8FB',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF3F7',
  ink: '#0F172A',
  inkSoft: '#243447',
  slate500: '#64748B',
  slate300: '#CBD5E1',
  slate200: '#E2E8F0',
  border: '#D7E0EA',
  accent: '#0E9F8E',
  accentDark: '#087567',
  cobalt: '#2563EB',
  amber: '#F59E0B',
  amberSoft: '#FFF7E6',
  green: '#16A34A',
  greenSoft: '#E9F8EF',
  red: '#DC2626',
  redSoft: '#FEF2F2',
  lavender: '#7C3AED',
  lavenderSoft: '#F1ECFF',
  cyanSoft: '#E7F8FC',
  darkBand: '#111827',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
} as const;

export const radii = {
  xs: 4,
  sm: 6,
  md: 8,
} as const;

export const typography = {
  caption: 12,
  small: 13,
  body: 15,
  bodyLarge: 17,
  title: 28,
  heading: 22,
  subheading: 18,
} as const;

export const shadows = {
  card: {
    boxShadow: '0px 6px 12px rgba(15, 23, 42, 0.08)',
    elevation: 2,
  },
} as const;
