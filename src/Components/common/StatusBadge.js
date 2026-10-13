// src/Components/common/StatusBadge.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { colors, FontFamily } from '../../constants';
import { m } from '../../Utils/responsive';

/**
 * Standard Status Badge Pill
 * Consistent status indicators for KYC, Plans, Loans, and Verification.
 */
export default function StatusBadge({
  status,
  label,
  icon,
  size = 'md', // 'sm' | 'md'
  style,
}) {
  const normalized = (status || label || '').toLowerCase().trim();

  let bg = colors.lightGreen;
  let text = colors.lettersAndIcons;
  let defaultIcon = null;

  if (['active', 'verified', 'approved', 'success', 'paid'].includes(normalized)) {
    bg = colors.lightGreen;
    text = colors.lettersAndIcons;
    defaultIcon = 'check-circle';
  } else if (['pending', 'in review', 'submitted'].includes(normalized)) {
    bg = '#FFF7E6';
    text = '#D46B08';
    defaultIcon = 'clock';
  } else if (['expired', 'rejected', 'failed', 'inactive'].includes(normalized)) {
    bg = '#FFEBEB';
    text = '#E02424';
    defaultIcon = 'alert-circle';
  } else if (['pro', 'enterprise', 'standard'].includes(normalized)) {
    bg = 'rgba(50, 153, 255, 0.14)';
    text = colors.blueButton;
    defaultIcon = 'shield';
  }

  const iconName = icon !== undefined ? icon : defaultIcon;
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg },
        isSm && styles.badgeSm,
        style,
      ]}
    >
      {iconName ? (
        <Feather
          name={iconName}
          size={isSm ? m(10) : m(12)}
          color={text}
          style={styles.icon}
        />
      ) : null}
      <Text
        style={[
          styles.text,
          { color: text },
          isSm && styles.textSm,
        ]}
      >
        {label || status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(9),
    paddingVertical: m(4),
    borderRadius: m(12),
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: m(7),
    paddingVertical: m(2.5),
    borderRadius: m(8),
  },
  icon: {
    marginRight: m(4),
  },
  text: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primarySemiBold,
    textTransform: 'capitalize',
  },
  textSm: {
    fontSize: m(10),
  },
});
