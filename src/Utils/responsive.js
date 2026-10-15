// src/Utils/responsive.js
import { Dimensions, PixelRatio } from 'react-native';

/* ==========================================================================
   1. SCREEN DIMENSIONS & BASELINE
   ========================================================================== */
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Standard mobile baseline width & height (iPhone 11/X baseline)
const GUIDELINE_BASE_WIDTH = 375;
const GUIDELINE_BASE_HEIGHT = 812;

/* ==========================================================================
   2. CORE RESPONSIVE SCALING UTILITIES
   ========================================================================== */
/** Horizontal scale proportional to screen width */
export const scale = (size) => (SCREEN_WIDTH / GUIDELINE_BASE_WIDTH) * size;
export const s = scale;

/** Vertical scale proportional to screen height */
export const verticalScale = (size) => (SCREEN_HEIGHT / GUIDELINE_BASE_HEIGHT) * size;
export const vs = verticalScale;

/**
 * moderateScale:
 * Smoothly scales sizes with a damping factor (default: 0.25).
 * Prevents text and elements from blowing up on larger screens or high-DPI Android devices.
 * Uses PixelRatio.roundToNearestPixel to eliminate blurry sub-pixel rendering.
 */
export const moderateScale = (size, factor = 0.25) => {
  const scaled = size + (scale(size) - size) * factor;
  return Math.round(PixelRatio.roundToNearestPixel(scaled));
};
export const m = moderateScale;
export const ms = moderateScale;

/**
 * vms (Vertical Moderate Scale):
 * Moderate scaling anchored to screen height. Best for button heights, vertical paddings & cards.
 */
export const vms = (size, factor = 0.2) => {
  const scaled = size + (verticalScale(size) - size) * factor;
  return Math.round(PixelRatio.roundToNearestPixel(scaled));
};

/* ==========================================================================
   3. SPACING & RADIUS TOKENS
   ========================================================================== */
export const spacing = {
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(16),
  lg: moderateScale(24),
  xl: moderateScale(32),
  xxl: moderateScale(40),
};

export const radius = {
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(12),
  lg: moderateScale(16),
  xl: moderateScale(24),
  full: 9999,
};

/* ==========================================================================
   4. TYPOGRAPHY SYSTEM
   ========================================================================== */
export const fontFamilies = {
  regular: 'Poppins-Regular',
  medium: 'Poppins-Medium',
  semiBold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
};

export const typography = {
  h1: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(28),
  },
  h2: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(24),
  },
  h3: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(20),
  },
  h4: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(16),
  },
  appTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: moderateScale(21),
  },
  sectionTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: moderateScale(18),
  },
  jobTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: moderateScale(16),
  },
  labelLarge: {
    fontFamily: fontFamilies.semiBold,
    fontSize: moderateScale(16),
  },
  labelMedium: {
    fontFamily: fontFamilies.semiBold,
    fontSize: moderateScale(14),
  },
  labelSmall: {
    fontFamily: fontFamilies.semiBold,
    fontSize: moderateScale(12),
  },
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: moderateScale(14),
  },
  small: {
    fontFamily: fontFamilies.regular,
    fontSize: moderateScale(12),
  },
  tiny: {
    fontFamily: fontFamilies.regular,
    fontSize: moderateScale(10),
  },
};

/* ==========================================================================
   5. RESPONSIVE LAYOUT HELPERS (CARDS, GRIDS, WINDOW)
   ========================================================================== */
export const screen = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  /** Dynamic width for horizontal preview cards with maximum cap */
  getCardWidth: (percentage = 0.75, maxWidth = 300) =>
    Math.min(SCREEN_WIDTH * percentage, maxWidth),
  /** Calculate multi-column width with spacing */
  getColumnWidth: (columns = 2, horizontalPadding = 16, gap = 12) =>
    (SCREEN_WIDTH - horizontalPadding * 2 - gap * (columns - 1)) / columns,
};

// Compatibility & device category helpers
export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;
export const isSmallDevice = SCREEN_WIDTH < 360;
export const isLargeDevice = SCREEN_WIDTH >= 414;
export const isTablet = SCREEN_WIDTH >= 600 || SCREEN_HEIGHT >= 1000;

export const fontScale = (size) => moderateScale(size, 0.2);
export const fs = fontScale;

/**
 * Standard clearance padding for floating bottom tab bar
 */
export const TAB_BAR_HEIGHT = moderateScale(64);
export const TAB_BAR_OFFSET = moderateScale(16);
export const TAB_BAR_CLEARANCE = moderateScale(96);

export default {
  scale,
  s,
  verticalScale,
  vs,
  moderateScale,
  m,
  ms,
  vms,
  spacing,
  radius,
  fontFamilies,
  typography,
  screen,
  screenWidth,
  screenHeight,
  isSmallDevice,
  isLargeDevice,
  isTablet,
  fontScale,
  fs,
  TAB_BAR_HEIGHT,
  TAB_BAR_OFFSET,
  TAB_BAR_CLEARANCE,
};
