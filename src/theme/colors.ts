export const colors = {
  // Tło
  background: '#0a0a0f',
  surface: '#1a1a2e',
  surfaceLight: '#2a2a4e',
  card: '#16213e',

  // Neony
  neonPink: '#ff00ff',
  neonBlue: '#00d4ff',
  neonGreen: '#00ff88',
  neonPurple: '#bf00ff',
  neonYellow: '#ffff00',

  // Tekst
  textPrimary: '#ffffff',
  textSecondary: '#a0a0a0',
  textMuted: '#666666',

  // Akcenty
  success: '#00ff88',
  error: '#ff4757',
  warning: '#ffa502',

  // Gradient kombinacje
  gradients: {
    neonPinkBlue: ['#ff00ff', '#00d4ff'] as const,
    neonPurpleBlue: ['#bf00ff', '#00d4ff'] as const,
    neonGreenBlue: ['#00ff88', '#00d4ff'] as const,
    darkCard: ['#1a1a2e', '#16213e'] as const,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadows = {
  neonPink: {
    shadowColor: '#ff00ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  neonBlue: {
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  neonGreen: {
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};
