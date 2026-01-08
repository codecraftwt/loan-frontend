// src/constants/typography.js
// Standardized Typography System for the Loan Management App

import { StyleSheet, Platform } from 'react-native';
import { m } from 'walstar-rn-responsive';
import { FontFamily, POPPINS, MONTSERRAT, RUBIK } from './fonts';

/**
 * Typography Scale
 * 
 * Size Reference:
 * - xs: 10px   - Small labels, timestamps
 * - sm: 12px   - Captions, secondary text
 * - base: 14px - Body text, descriptions
 * - md: 16px   - Primary content, inputs
 * - lg: 18px   - Section titles
 * - xl: 20px   - Card titles, stats
 * - 2xl: 24px  - Page headers
 * - 3xl: 28px  - Hero titles
 * - 4xl: 32px  - App branding
 */

const fontSizes = {
  xs: m(10),
  sm: m(12),
  base: m(14),
  md: m(16),
  lg: m(18),
  xl: m(20),
  '2xl': m(24),
  '3xl': m(28),
  '4xl': m(32),
};

const lineHeights = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
  loose: 1.8,
};

/**
 * Typography Styles
 * 
 * Naming Convention:
 * - h1-h4: Headlines (Montserrat Bold)
 * - title: Section titles (Montserrat SemiBold/Bold)
 * - subtitle: Subtitles (Montserrat Regular)
 * - body: Body text (Poppins Regular)
 * - label: Labels (Poppins SemiBold)
 * - button: Button text (Poppins SemiBold)
 * - caption: Small text (Poppins Regular)
 * - price: Currency/amounts (Poppins Bold)
 */

const typography = StyleSheet.create({
  // ==========================================
  // HEADLINES - Montserrat Bold
  // Use for main headers, app titles, branding
  // ==========================================
  
  h1: {
    fontFamily: MONTSERRAT.bold,
    fontSize: fontSizes['4xl'],
    lineHeight: fontSizes['4xl'] * lineHeights.tight,
    letterSpacing: 0.5,
  },
  
  h2: {
    fontFamily: MONTSERRAT.bold,
    fontSize: fontSizes['3xl'],
    lineHeight: fontSizes['3xl'] * lineHeights.tight,
    letterSpacing: 0.3,
  },
  
  h3: {
    fontFamily: MONTSERRAT.bold,
    fontSize: fontSizes['2xl'],
    lineHeight: fontSizes['2xl'] * lineHeights.tight,
    letterSpacing: 0.2,
  },
  
  h4: {
    fontFamily: MONTSERRAT.bold,
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * lineHeights.tight,
  },
  
  // ==========================================
  // TITLES - Montserrat SemiBold/Bold
  // Use for section headers, card titles
  // ==========================================
  
  titleLarge: {
    fontFamily: MONTSERRAT.bold,
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * lineHeights.normal,
  },
  
  titleMedium: {
    fontFamily: MONTSERRAT.bold,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * lineHeights.normal,
  },
  
  titleSmall: {
    fontFamily: MONTSERRAT.semiBold,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
  },
  
  // Profile header style
  profileHeader: {
    fontFamily: MONTSERRAT.semiBold,
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * lineHeights.normal,
  },
  
  // ==========================================
  // SUBTITLES - Montserrat Regular
  // Use for secondary headers, subtext
  // ==========================================
  
  subtitleLarge: {
    fontFamily: MONTSERRAT.regular,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
  },
  
  subtitleMedium: {
    fontFamily: MONTSERRAT.regular,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.normal,
  },
  
  subtitleSmall: {
    fontFamily: MONTSERRAT.regular,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  
  // ==========================================
  // BODY TEXT - Poppins Regular
  // Use for paragraphs, descriptions, content
  // ==========================================
  
  bodyLarge: {
    fontFamily: POPPINS.regular,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.relaxed,
  },
  
  bodyMedium: {
    fontFamily: POPPINS.regular,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.relaxed,
  },
  
  bodySmall: {
    fontFamily: POPPINS.regular,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.relaxed,
  },
  
  // ==========================================
  // LABELS - Poppins SemiBold
  // Use for form labels, section titles, buttons
  // ==========================================
  
  labelLarge: {
    fontFamily: POPPINS.semiBold,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
  },
  
  labelMedium: {
    fontFamily: POPPINS.semiBold,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.normal,
  },
  
  labelSmall: {
    fontFamily: POPPINS.semiBold,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  
  labelXSmall: {
    fontFamily: POPPINS.semiBold,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.normal,
    textTransform: 'uppercase',
  },
  
  // ==========================================
  // BUTTON TEXT - Poppins SemiBold
  // Use for all button labels
  // ==========================================
  
  buttonLarge: {
    fontFamily: POPPINS.semiBold,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * lineHeights.tight,
  },
  
  buttonMedium: {
    fontFamily: POPPINS.semiBold,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.tight,
  },
  
  buttonSmall: {
    fontFamily: POPPINS.semiBold,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.tight,
  },
  
  // ==========================================
  // PRICES & AMOUNTS - Poppins Bold
  // Use for currency, prices, important numbers
  // ==========================================
  
  priceLarge: {
    fontFamily: POPPINS.bold,
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * lineHeights.tight,
  },
  
  priceMedium: {
    fontFamily: POPPINS.bold,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.tight,
  },
  
  priceSmall: {
    fontFamily: POPPINS.bold,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.tight,
  },
  
  // Stat values (dashboard cards)
  statValue: {
    fontFamily: POPPINS.bold,
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * lineHeights.tight,
  },
  
  // ==========================================
  // CAPTIONS & HELPER TEXT - Poppins Regular
  // Use for timestamps, hints, small descriptions
  // ==========================================
  
  caption: {
    fontFamily: POPPINS.regular,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  
  captionSmall: {
    fontFamily: POPPINS.regular,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.normal,
  },
  
  // Placeholder text
  placeholder: {
    fontFamily: POPPINS.regular,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
  },
  
  // Error text
  errorText: {
    fontFamily: POPPINS.regular,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  
  // ==========================================
  // INPUT FIELDS - Poppins Regular
  // Use for text inputs
  // ==========================================
  
  input: {
    fontFamily: POPPINS.regular,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
  },
  
  inputLabel: {
    fontFamily: POPPINS.semiBold,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.normal,
  },
  
  // ==========================================
  // LINKS & ACTIONS - Poppins Medium/SemiBold
  // Use for clickable text, links
  // ==========================================
  
  link: {
    fontFamily: POPPINS.semiBold,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.normal,
  },
  
  linkSmall: {
    fontFamily: POPPINS.semiBold,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  
  // ==========================================
  // EMPHASIS TEXT - Poppins Medium
  // Use for medium emphasis text
  // ==========================================
  
  emphasis: {
    fontFamily: POPPINS.medium,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.normal,
  },
  
  emphasisSmall: {
    fontFamily: POPPINS.medium,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  
  // ==========================================
  // APP BRANDING - Montserrat Bold
  // Use for app name, logo text
  // ==========================================
  
  appTitle: {
    fontFamily: MONTSERRAT.bold,
    fontSize: fontSizes['4xl'],
    lineHeight: fontSizes['4xl'] * lineHeights.tight,
    letterSpacing: m(1.2),
  },
  
  appTagline: {
    fontFamily: MONTSERRAT.regular,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.normal,
  },
  
  // ==========================================
  // STATUS & BADGES - Poppins SemiBold
  // Use for status labels, badges
  // ==========================================
  
  badge: {
    fontFamily: POPPINS.semiBold,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.tight,
    textTransform: 'uppercase',
  },
  
  status: {
    fontFamily: POPPINS.semiBold,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.tight,
    textTransform: 'uppercase',
  },
});

/**
 * Font Size Scale Export
 */
export const FontSizes = fontSizes;

/**
 * Line Height Scale Export
 */
export const LineHeights = lineHeights;

/**
 * Quick access to common text styles
 * Use with spread operator: { ...TextStyles.body }
 */
export const TextStyles = typography;

export default typography;



