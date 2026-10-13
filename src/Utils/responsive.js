// src/Utils/responsive.js
// Standardized Responsive Foundation for FinWise / LoanHub Mobile App

import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Figma standard base guidelines (iPhone X / 11 Pro / standard 375x812)
const GUIDELINE_BASE_WIDTH = 375;
const GUIDELINE_BASE_HEIGHT = 812;

/**
 * Horizontal scaling relative to guideline width
 */
export const scale = size => (SCREEN_WIDTH / GUIDELINE_BASE_WIDTH) * size;

/**
 * Vertical scaling relative to guideline height
 */
export const verticalScale = size => (SCREEN_HEIGHT / GUIDELINE_BASE_HEIGHT) * size;

/**
 * Bounded Moderate Scale (m)
 * Ensures elements scale smoothly without becoming overly large on tablets
 * or excessively small on compact budget phones.
 *
 * @param {number} size - base size in pixels
 * @param {number} factor - scale dampening (default 0.5)
 * @returns {number} properly scaled pixel value
 */
export const moderateScale = (size, factor = 0.5) => {
  const scaled = size + (scale(size) - size) * factor;

  // Safety clamps: limit maximum scale to +28% and minimum to -15%
  const minBound = size * 0.85;
  const maxBound = size * 1.28;

  return Math.round(Math.min(Math.max(scaled, minBound), maxBound));
};

// Aliases for convenient usage
export const m = moderateScale;
export const s = scale;
export const vs = verticalScale;

// Screen dimensions & device category helpers
export const isSmallDevice = SCREEN_WIDTH < 360;
export const isLargeDevice = SCREEN_WIDTH >= 414;
export const isTablet = SCREEN_WIDTH >= 600 || SCREEN_HEIGHT >= 1000;

// Device dimensions
export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;

/**
 * Clearance padding for floating bottom tab bar
 * Ensures lists & cards are never blocked by the bottom navigation pill.
 */
export const TAB_BAR_HEIGHT = m(64);
export const TAB_BAR_OFFSET = m(16);
export const TAB_BAR_CLEARANCE = m(96);

/**
 * Standard font scaler respecting system font scaling while preventing UI breakage
 */
export const fontScale = (size) => {
  const systemScale = PixelRatio.getFontScale();
  // Cap system scale to prevent UI destruction on large accessibility settings
  const cappedScale = Math.min(Math.max(systemScale, 0.9), 1.2);
  return Math.round(moderateScale(size) * (cappedScale / systemScale));
};

export default {
  m,
  moderateScale,
  scale,
  s,
  verticalScale,
  vs,
  fontScale,
  screenWidth,
  screenHeight,
  isSmallDevice,
  isLargeDevice,
  isTablet,
  TAB_BAR_HEIGHT,
  TAB_BAR_OFFSET,
  TAB_BAR_CLEARANCE,
};
