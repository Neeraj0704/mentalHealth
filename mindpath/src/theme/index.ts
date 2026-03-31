export const Colors = {
  // Brand
  primary: '#4A8B9F',
  primaryLight: '#6BA8BA',
  primaryDark: '#2E6A7E',
  primaryBg: '#EEF6F9',

  // Secondary – sage green
  secondary: '#6BAF92',
  secondaryLight: '#8FC9AC',
  secondaryBg: '#EEF7F2',

  // Accent – warm amber (CTAs)
  accent: '#E8956A',
  accentLight: '#F2B38A',
  accentBg: '#FDF0E8',

  // Backgrounds
  background: '#F7F9FC',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F4F8',
  surfaceSubtle: '#F8FAFC',

  // Text
  textPrimary: '#1A2B3C',
  textSecondary: '#6B7A8D',
  textTertiary: '#9BA8B5',
  textInverse: '#FFFFFF',
  textLink: '#4A8B9F',

  // Borders
  border: '#E2E8F0',
  borderLight: '#EEF2F7',
  divider: '#F0F4F8',

  // Status
  success: '#48A999',
  successBg: '#EEF8F7',
  warning: '#E8956A',
  warningBg: '#FDF0E8',
  error: '#D95B5B',
  errorBg: '#FDF0F0',
  info: '#4A8B9F',
  infoBg: '#EEF6F9',

  // Rating
  rating: '#F5A623',
  ratingBg: '#FEF6E7',

  // Verified badge
  verified: '#4A8B9F',
  verifiedBg: '#EEF6F9',

  // Overlay
  overlay: 'rgba(26, 43, 60, 0.5)',
  overlayLight: 'rgba(26, 43, 60, 0.08)',
};

export const Typography = {
  heading1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  heading2: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 30,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 26,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  heading4: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
    color: Colors.textPrimary,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 23,
    color: Colors.textPrimary,
  },
  bodyMedium: {
    fontSize: 15,
    fontWeight: '500' as const,
    lineHeight: 23,
    color: Colors.textPrimary,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 18,
    color: Colors.textTertiary,
  },
  label: {
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 16,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
};

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  full: 9999,
};

export const Shadows = {
  xs: {
    shadowColor: '#1A2B3C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sm: {
    shadowColor: '#1A2B3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#1A2B3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1A2B3C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
};

export const Theme = {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
};

export default Theme;
