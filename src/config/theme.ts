export const COLORS = {
  // EcoCircle Fresh Green Palette (Zero Black/Slate)
  primary: '#059669',         // Vibrant Emerald Green
  primaryDark: '#047857',     // Deep Forest Emerald
  primaryLight: '#D1FAE5',    // Soft Fresh Mint
  primaryExtraLight: '#ECFDF5',// Mint Background Tint
  
  secondary: '#065F46',       // Rich Forest Green (replaces black/slate)
  secondaryLight: '#047857',  // Leaf Green Header Accent
  
  // Backgrounds & Surface
  background: '#F0FDF4',      // Soft Fresh Mint Tinted Background
  surface: '#FFFFFF',         // Pure White Card Surface
  surfaceSecondary: '#E6F4EA',// Light Mint Card Accent

  // Text Colors
  textPrimary: '#064E3B',     // Deep Eco Forest Text (replaces black)
  textSecondary: '#047857',   // Muted Leaf Green
  textLight: '#A7F3D0',       // Light Mint Text
  textWhite: '#FFFFFF',       // Clean White

  // Status Colors
  statusAssigned: '#0284C7',   // Ocean Blue
  statusInProgress: '#D97706', // Warm Amber
  statusCompleted: '#059669',  // Emerald Green
  statusCancelled: '#DC2626',  // Coral Red
  statusPending: '#7C3AED',    // Deep Purple

  // Waste Type Badges
  recyclable: '#059669',
  organic: '#65A30D',
  hazardous: '#DC2626',
  eWaste: '#7C3AED',
  general: '#4B5563',

  // UI Accents
  border: '#A7F3D0',
  divider: '#E6F4EA',
  shadow: '#064E3B',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const FONTS = {
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};
