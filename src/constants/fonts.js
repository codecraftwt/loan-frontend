// src/constants/fonts.js
// Centralized font configuration for the Loan Management App

import { Platform } from 'react-native';

/**
 * Font Families Configuration
 * 
 * Usage Guidelines:
 * - Poppins (Primary): Most UI elements
 * - Montserrat (Secondary): Headers, branding, titles
 * - Rubik: Available but rarely used
 * - Intrepid: Specialty use cases
 */

// System font fallbacks
const SYSTEM_FONTS = {
  ios: 'Helvetica Neue',
  android: 'Roboto',
};

const getSystemFont = () => Platform.select(SYSTEM_FONTS) || SYSTEM_FONTS.android;

// Primary Font - Poppins (Most used)
// Note: Poppins-Medium maps to Poppins-Regular as fallback (not available in assets)
// Note: Poppins-Light maps to Poppins-Regular as fallback (not available in assets)
export const POPPINS = {
  regular: 'Poppins-Regular',      // Body text, descriptions, placeholders
  medium: 'Poppins-Regular',       // Medium emphasis text (fallback to Regular - add Poppins-Medium.ttf for true medium weight)
  semiBold: 'Poppins-SemiBold',    // Labels, section titles, buttons
  bold: 'Poppins-Bold',            // Headlines, prices, important text
  light: 'Poppins-Regular',        // Light emphasis text (fallback to Regular - add Poppins-Light.ttf for true light weight)
};

// Secondary Font - Montserrat
export const MONTSERRAT = {
  regular: 'Montserrat-Regular',   // Subtitle text
  semiBold: 'Montserrat-SemiBold', // Profile headers
  bold: 'Montserrat-Bold',         // App titles, main headers, branding text
};

// Tertiary Font - Rubik (Rarely used)
export const RUBIK = {
  regular: 'Rubik-Regular',
  semiBold: 'Rubik-SemiBold',
  bold: 'Rubik-Bold',
};

// Specialty Font - Intrepid
export const INTREPID = {
  regular: 'Intrepid',
};

// System Fonts (Fallbacks)
export const SYSTEM = {
  regular: getSystemFont(),
};

/**
 * Font Family Constants - Easy access for common use cases
 */
const fonts = {
  // Primary font family (Poppins)
  primary: {
    regular: POPPINS.regular,
    medium: POPPINS.medium,
    semiBold: POPPINS.semiBold,
    bold: POPPINS.bold,
    light: POPPINS.light,
  },
  
  // Secondary font family (Montserrat)
  secondary: {
    regular: MONTSERRAT.regular,
    semiBold: MONTSERRAT.semiBold,
    bold: MONTSERRAT.bold,
  },
  
  // Tertiary font family (Rubik)
  tertiary: {
    regular: RUBIK.regular,
    semiBold: RUBIK.semiBold,
    bold: RUBIK.bold,
  },
  
  // Specialty font (Intrepid)
  specialty: INTREPID.regular,
  
  // System fallback
  system: SYSTEM.regular,
};

/**
 * Quick Font Access - For simple fontFamily assignment
 * 
 * Usage: 
 *   fontFamily: FontFamily.primaryRegular
 *   fontFamily: FontFamily.secondaryBold
 */
export const FontFamily = {
  // Poppins
  primaryRegular: POPPINS.regular,
  primaryMedium: POPPINS.medium,
  primarySemiBold: POPPINS.semiBold,
  primaryBold: POPPINS.bold,
  primaryLight: POPPINS.light,
  
  // Montserrat
  secondaryRegular: MONTSERRAT.regular,
  secondarySemiBold: MONTSERRAT.semiBold,
  secondaryBold: MONTSERRAT.bold,
  
  // Rubik
  tertiaryRegular: RUBIK.regular,
  tertiarySemiBold: RUBIK.semiBold,
  tertiaryBold: RUBIK.bold,
  
  // Specialty & System
  specialty: INTREPID.regular,
  system: getSystemFont(),
};

export default fonts;

