// src/Components/common/ScreenWrapper.js
import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants';
import { TAB_BAR_CLEARANCE, m } from '../../Utils/responsive';

/**
 * Standard Screen Container for Admin & App screens
 * Handles SafeArea, StatusBar, responsive bottom tab bar clearance, and optional scrolling.
 */
export default function ScreenWrapper({
  children,
  scrollable = true,
  backgroundColor = colors.backgroundGreenWhite,
  statusBarStyle = 'dark-content',
  statusBarColor,
  topInsetBg,
  includeTabBarClearance = true,
  showsVerticalScrollIndicator = false,
  refreshControl,
  style,
  contentContainerStyle,
  headerComponent,
  footerComponent,
  keyboardAvoiding = false,
  useTopInset = true,
}) {
  const insets = useSafeAreaInsets();
  const effectiveStatusBarColor = statusBarColor || topInsetBg || backgroundColor;

  // Accurately compute top clearance for status bar, notches, and camera cutouts
  const topInset = useTopInset
    ? Platform.OS === 'android'
      ? Math.max(insets.top, StatusBar.currentHeight || 0, m(32))
      : insets.top
    : 0;

  const content = scrollable ? (
    <ScrollView
      style={[styles.flex, { backgroundColor }]}
      contentContainerStyle={[
        styles.scrollContent,
        includeTabBarClearance && {
          paddingBottom: Math.max(insets.bottom + TAB_BAR_CLEARANCE, m(90)),
        },
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.flex,
        { backgroundColor },
        includeTabBarClearance && {
          paddingBottom: Math.max(insets.bottom + TAB_BAR_CLEARANCE, m(90)),
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  const wrappedContent = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <View style={[styles.safeArea, { backgroundColor }]}>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={effectiveStatusBarColor}
        translucent={Platform.OS === 'android'}
      />

      {/* Top notch color fill (e.g. green top banner) */}
      {topInset > 0 && topInsetBg ? (
        <View
          style={{
            height: topInset,
            backgroundColor: topInsetBg,
            width: '100%',
          }}
        />
      ) : null}

      <View
        style={[
          styles.flex,
          !topInsetBg && { paddingTop: topInset },
        ]}
      >
        {headerComponent}
        {wrappedContent}
        {footerComponent}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
