// src/Components/common/SuccessModal.js
import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { colors, FontFamily } from '../../constants';
import { m } from '../../Utils/responsive';

/**
 * Reusable Success / Alert Modal matching the app's clean Figma design system
 * 
 * @param {Object} props
 * @param {boolean} props.visible - Modal visibility
 * @param {Function} props.onClose - Backdrop / close callback
 * @param {string} [props.title="Application Submitted!"] - Bold main heading
 * @param {string} [props.subtitle] - Bold prompt/question subtitle
 * @param {string} [props.message] - Explanatory body text
 * @param {string} [props.primaryButtonText="View Applications"] - Text for bright green pill button
 * @param {Function} [props.onPrimaryPress] - Callback for primary button
 * @param {string} [props.secondaryButtonText="Cancel"] - Text for light green pill button
 * @param {Function} [props.onSecondaryPress] - Callback for secondary button
 * @param {boolean} [props.showSecondaryButton=false] - Whether to show the secondary cancel/dashboard button
 * @param {string} [props.icon] - Optional Feather icon name
 * @param {boolean} [props.dismissible=true] - Whether backdrop press closes modal
 */
export default function SuccessModal({
  visible = false,
  onClose,
  title = 'Application Submitted!',
  subtitle,
  message,
  primaryButtonText = 'View Applications',
  onPrimaryPress,
  secondaryButtonText = 'Cancel',
  onSecondaryPress,
  showSecondaryButton = false,
  icon,
  dismissible = true,
}) {
  if (!visible) return null;

  const handleBackdropPress = () => {
    if (dismissible && onClose) {
      onClose();
    }
  };

  const handlePrimaryPress = () => {
    if (onPrimaryPress) {
      onPrimaryPress();
    } else if (onClose) {
      onClose();
    }
  };

  const handleSecondaryPress = () => {
    if (onSecondaryPress) {
      onSecondaryPress();
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={handleBackdropPress}
    >
      <View style={styles.overlay}>
        {/* Backdrop touch */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleBackdropPress}
        />

        {/* Modal Card */}
        <View style={styles.cardContainer}>
          {/* Optional Icon */}
          {!!icon && (
            <View style={styles.iconCircle}>
              <Feather name={icon} size={m(24)} color={colors.primary} />
            </View>
          )}

          {/* Main Title */}
          {!!title && <Text style={styles.title}>{title}</Text>}

          {/* Subtitle / Prompt Question */}
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

          {/* Detailed Message */}
          {!!message && <Text style={styles.description}>{message}</Text>}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {/* Primary Confirm Button (Bright Green Pill) */}
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              activeOpacity={0.85}
              onPress={handlePrimaryPress}
            >
              <Text style={styles.confirmButtonText}>{primaryButtonText}</Text>
            </TouchableOpacity>

            {/* Secondary Cancel Button (Soft Light Green Pill) */}
            {showSecondaryButton && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                activeOpacity={0.85}
                onPress={handleSecondaryPress}
              >
                <Text style={styles.cancelButtonText}>{secondaryButtonText}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 48, 48, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: m(24),
  },
  cardContainer: {
    width: '100%',
    maxWidth: m(330),
    backgroundColor: colors.white,
    borderRadius: m(30),
    paddingHorizontal: m(22),
    paddingTop: m(28),
    paddingBottom: m(22),
    alignItems: 'center',
    shadowColor: colors.lettersAndIcons,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 20,
  },
  iconCircle: {
    width: m(48),
    height: m(48),
    borderRadius: m(24),
    backgroundColor: colors.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(14),
  },
  title: {
    fontSize: m(19),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    textAlign: 'center',
    marginBottom: m(6),
  },
  subtitle: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    textAlign: 'center',
    marginTop: m(6),
    marginBottom: m(4),
    paddingHorizontal: m(4),
  },
  description: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: '#4A6563',
    textAlign: 'center',
    lineHeight: m(18),
    marginTop: m(8),
    marginBottom: m(8),
    paddingHorizontal: m(6),
  },
  actionsContainer: {
    width: '100%',
    marginTop: m(18),
    gap: m(10),
  },
  button: {
    width: '100%',
    height: m(48),
    borderRadius: m(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmButtonText: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  cancelButton: {
    backgroundColor: colors.lightGreen,
    borderWidth: 0,
  },
  cancelButtonText: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
});
