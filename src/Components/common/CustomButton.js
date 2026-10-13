// src/Components/common/CustomButton.js
import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { colors, FontFamily } from '../../constants';
import { m } from '../../Utils/responsive';

/**
 * Standard Reusable Action Button
 * Supports Figma color variants: primary (#00D09E), secondary (#DFF7E2),
 * blue (#3299FF), lightBlue (#6DB6FE), oceanBlue (#0068FF), and outline.
 */
export default function CustomButton({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'blue' | 'lightBlue' | 'oceanBlue' | 'outline' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon,
  iconPosition = 'left', // 'left' | 'right'
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}) {
  let bg = colors.primary;
  let textColor = colors.lettersAndIcons;
  let borderColor = 'transparent';

  switch (variant) {
    case 'primary':
      bg = colors.primary;
      textColor = colors.lettersAndIcons;
      break;
    case 'secondary':
    case 'light':
      bg = colors.lightGreen;
      textColor = colors.lettersAndIcons;
      break;
    case 'blue':
      bg = colors.blueButton;
      textColor = colors.white;
      break;
    case 'lightBlue':
      bg = colors.lightBlueButton;
      textColor = colors.lettersAndIcons;
      break;
    case 'oceanBlue':
      bg = colors.oceanBlueButton;
      textColor = colors.white;
      break;
    case 'outline':
      bg = 'transparent';
      textColor = colors.lettersAndIcons;
      borderColor = colors.lettersAndIcons;
      break;
    case 'outlineGreen':
      bg = 'transparent';
      textColor = colors.primary;
      borderColor = colors.primary;
      break;
    case 'danger':
      bg = '#FFEBEB';
      textColor = '#E02424';
      borderColor = '#FFC7C7';
      break;
    default:
      bg = colors.primary;
      textColor = colors.lettersAndIcons;
  }

  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const height = isSm ? m(38) : isLg ? m(54) : m(48);
  const fontSize = isSm ? m(13) : isLg ? m(16.5) : m(15);
  const iconSize = isSm ? m(14) : m(17);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth: borderColor !== 'transparent' ? 1.5 : 0,
          height,
        },
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && (
            <Feather
              name={icon}
              size={iconSize}
              color={textColor}
              style={styles.iconLeft}
            />
          )}

          <Text
            style={[
              styles.text,
              { color: textColor, fontSize },
              textStyle,
            ]}
          >
            {title}
          </Text>

          {icon && iconPosition === 'right' && (
            <Feather
              name={icon}
              size={iconSize}
              color={textColor}
              style={styles.iconRight}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: m(26),
    paddingHorizontal: m(20),
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  fullWidth: {
    alignSelf: 'stretch',
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: FontFamily.primaryBold,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  iconLeft: {
    marginRight: m(8),
  },
  iconRight: {
    marginLeft: m(8),
  },
  disabled: {
    opacity: 0.55,
  },
});
