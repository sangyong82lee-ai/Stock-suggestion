import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const isTablet = width >= 768;
export const isLargeScreen = width >= 1024;

export const colors = {
  // Primary
  primary: '#4A90D9',
  primaryDark: '#2C6CB0',
  primaryLight: '#7AB3E8',

  // Background
  background: '#0F0F23',
  surface: '#1A1A2E',
  surfaceLight: '#252542',
  card: '#16213E',

  // Text
  textPrimary: '#E8E8F0',
  textSecondary: '#9A9ABF',
  textMuted: '#6B6B8D',

  // Accent
  accent: '#FF6B6B',
  success: '#00C851',
  warning: '#ffbb33',
  danger: '#ff4444',
  info: '#33b5e5',

  // Score colors
  scoreHigh: '#00C851',
  scoreMid: '#ffbb33',
  scoreLow: '#ff4444',

  // Borders
  border: '#2A2A4A',
  borderLight: '#3A3A5A',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  title: 28,
  hero: 36,
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const shadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  android: {
    elevation: 4,
  },
  default: {},
});
