// src/Components/common/AdminHeader.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { colors, FontFamily } from '../../constants';
import { m } from '../../Utils/responsive';

/**
 * Standard Admin Screen Header
 * Provides title, subtitle/badge, back button, and optional right actions.
 */
export default function AdminHeader({
  title,
  subtitle,
  badge = 'Admin Console',
  showBack = false,
  onBack,
  rightAction,
  theme = 'dark', // 'dark' | 'light' | 'green'
  style,
}) {
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation?.canGoBack()) {
      navigation.goBack();
    }
  };

  const isDark = theme === 'dark';
  const isGreen = theme === 'green';

  const containerBg = isDark
    ? colors.lettersAndIcons
    : isGreen
    ? colors.primary
    : colors.backgroundGreenWhite;

  const textColor = isDark || isGreen ? colors.white : colors.lettersAndIcons;
  const subtitleColor = isDark || isGreen ? 'rgba(255, 255, 255, 0.85)' : colors.textSecondary;
  const backIconColor = isDark || isGreen ? colors.white : colors.lettersAndIcons;
  const badgeBg = isDark
    ? 'rgba(0, 208, 158, 0.18)'
    : isGreen
    ? 'rgba(9, 48, 48, 0.15)'
    : colors.lightGreen;
  const badgeText = isDark ? colors.primary : colors.lettersAndIcons;

  return (
    <View style={[styles.container, { backgroundColor: containerBg }, style]}>
      <View style={styles.topRow}>
        <View style={styles.leftCol}>
          {showBack && (
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backButton}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="arrow-left" size={m(22)} color={backIconColor} />
            </TouchableOpacity>
          )}

          {badge ? (
            <View style={[styles.badgePill, { backgroundColor: badgeBg }]}>
              <View style={[styles.badgeDot, { backgroundColor: badgeText }]} />
              <Text style={[styles.badgeText, { color: badgeText }]}>{badge}</Text>
            </View>
          ) : null}
        </View>

        {rightAction ? <View style={styles.rightCol}>{rightAction}</View> : null}
      </View>

      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: subtitleColor }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: m(18),
    paddingTop: m(14),
    paddingBottom: m(18),
    borderBottomLeftRadius: m(24),
    borderBottomRightRadius: m(24),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(10),
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(10),
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(4),
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(10),
    paddingVertical: m(4),
    borderRadius: m(12),
    gap: m(6),
  },
  badgeDot: {
    width: m(6),
    height: m(6),
    borderRadius: m(3),
  },
  badgeText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primarySemiBold,
    letterSpacing: 0.2,
  },
  titleContainer: {
    marginTop: m(2),
  },
  title: {
    fontSize: m(24),
    lineHeight: m(30),
    fontFamily: FontFamily.primaryBold,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: m(12.5),
    lineHeight: m(18),
    fontFamily: FontFamily.primaryRegular,
    marginTop: m(4),
  },
});
