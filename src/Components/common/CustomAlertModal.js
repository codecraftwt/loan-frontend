// src/Components/common/CustomAlertModal.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { m } from '../../Utils/responsive';
import { colors, FontFamily } from '../../constants';

// Singleton alert controller for global usage
let globalAlertHandler = null;

/**
 * Trigger the global CustomAlertModal from anywhere in the app
 * 
 * @param {Object} options
 * @param {string} options.title - Main modal title (e.g. "Delete Account" or "Sign Out")
 * @param {string} [options.subtitle] - Primary bold question/subtitle (e.g. "Are You Sure You Want To Log Out?")
 * @param {string} [options.message] - Longer explanation/body text
 * @param {string} [options.description] - Alias for message
 * @param {string} [options.confirmText="Confirm"] - Text for primary button
 * @param {string} [options.cancelText="Cancel"] - Text for secondary cancel button
 * @param {Function} [options.onConfirm] - Callback when confirm is pressed
 * @param {Function} [options.onCancel] - Callback when cancel is pressed
 * @param {boolean} [options.showCancel=true] - Whether to show cancel button
 * @param {string} [options.icon] - Optional Feather icon name
 * @param {string} [options.confirmBgColor] - Custom background color for confirm button
 * @param {string} [options.confirmTextColor] - Custom text color for confirm button
 * @param {string} [options.cancelBgColor] - Custom background color for cancel button
 * @param {string} [options.cancelTextColor] - Custom text color for cancel button
 * @param {boolean} [options.dismissible=true] - Whether backdrop press closes modal
 */
export const showCustomAlert = options => {
  if (globalAlertHandler) {
    globalAlertHandler.show(options);
  } else {
    console.warn(
      'CustomAlertModal is not mounted. Ensure <CustomAlertModal /> is rendered in App.js.',
    );
  }
};

export const closeCustomAlert = () => {
  if (globalAlertHandler) {
    globalAlertHandler.hide();
  }
};

export const alertService = {
  show: showCustomAlert,
  hide: closeCustomAlert,
  confirm: (title, message, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel') => {
    showCustomAlert({
      title,
      message,
      confirmText,
      cancelText,
      showCancel: true,
      onConfirm,
    });
  },
  alert: (title, message, onConfirm, confirmText = 'OK') => {
    showCustomAlert({
      title,
      message,
      confirmText,
      showCancel: false,
      onConfirm,
    });
  },
};

export default function CustomAlertModal({
  // Controlled component props (optional, fallback to global singleton state)
  visible: controlledVisible,
  title: propTitle,
  subtitle: propSubtitle,
  message: propMessage,
  description: propDescription,
  confirmText: propConfirmText,
  cancelText: propCancelText,
  onConfirm: propOnConfirm,
  onCancel: propOnCancel,
  showCancel: propShowCancel = true,
  icon: propIcon,
  confirmBgColor: propConfirmBgColor,
  confirmTextColor: propConfirmTextColor,
  cancelBgColor: propCancelBgColor,
  cancelTextColor: propCancelTextColor,
  dismissible: propDismissible = true,
  loading: propLoading = false,
}) {
  // Global uncontrolled state
  const [globalState, setGlobalState] = useState({
    visible: false,
    config: {},
  });

  const [loading, setLoading] = useState(false);

  // Register global singleton handler when mounted without controlled visible prop
  useEffect(() => {
    if (controlledVisible === undefined) {
      globalAlertHandler = {
        show: config => {
          setLoading(false);
          setGlobalState({
            visible: true,
            config: config || {},
          });
        },
        hide: () => {
          setGlobalState(prev => ({
            ...prev,
            visible: false,
          }));
        },
      };

      return () => {
        globalAlertHandler = null;
      };
    }
  }, [controlledVisible]);

  // Determine whether this instance is controlled via props or global state
  const isControlled = controlledVisible !== undefined;
  const isVisible = isControlled ? controlledVisible : globalState.visible;
  const config = isControlled ? {} : globalState.config;

  const title = propTitle || config.title || '';
  const subtitle = propSubtitle || config.subtitle || '';
  const message = propMessage || propDescription || config.message || config.description || '';
  const confirmText = propConfirmText || config.confirmText || 'Confirm';
  const cancelText = propCancelText || config.cancelText || 'Cancel';
  const showCancel = propShowCancel ?? config.showCancel ?? true;
  const icon = propIcon || config.icon || null;
  const confirmBgColor = propConfirmBgColor || config.confirmBgColor || colors.primary;
  const confirmTextColor = propConfirmTextColor || config.confirmTextColor || colors.lettersAndIcons;
  const cancelBgColor = propCancelBgColor || config.cancelBgColor || colors.lightGreen;
  const cancelTextColor = propCancelTextColor || config.cancelTextColor || colors.lettersAndIcons;
  const dismissible = propDismissible ?? config.dismissible ?? true;
  const isLoading = propLoading || loading;

  const handleClose = useCallback(() => {
    if (isControlled) {
      if (propOnCancel) propOnCancel();
    } else {
      setGlobalState(prev => ({ ...prev, visible: false }));
      if (config.onCancel) config.onCancel();
    }
  }, [isControlled, propOnCancel, config]);

  const handleConfirm = useCallback(async () => {
    const callback = isControlled ? propOnConfirm : config.onConfirm;
    if (callback) {
      try {
        const result = callback();
        if (result instanceof Promise) {
          setLoading(true);
          await result;
          setLoading(false);
        }
      } catch (err) {
        setLoading(false);
        console.error('Error in alert onConfirm:', err);
      }
    }
    if (!isControlled) {
      setGlobalState(prev => ({ ...prev, visible: false }));
    }
  }, [isControlled, propOnConfirm, config]);

  const handleCancel = useCallback(() => {
    handleClose();
  }, [handleClose]);

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={() => {
        if (dismissible) handleClose();
      }}
    >
      <View style={styles.overlay}>
        {/* Backdrop touch to dismiss */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => {
            if (dismissible) handleClose();
          }}
        />

        {/* Modal Card */}
        <View style={styles.cardContainer}>
          {/* Optional Icon Circle */}
          {icon && (
            <View style={styles.iconCircle}>
              <Feather name={icon} size={m(24)} color={colors.primary} />
            </View>
          )}

          {/* Main Title */}
          {!!title && <Text style={styles.title}>{title}</Text>}

          {/* Primary Subtitle / Prompt Question */}
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

          {/* Detailed Explanation / Description */}
          {!!message && <Text style={styles.description}>{message}</Text>}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {/* Primary Confirm Button */}
            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: confirmBgColor },
              ]}
              activeOpacity={0.8}
              onPress={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={confirmTextColor} />
              ) : (
                <Text style={[styles.buttonText, { color: confirmTextColor }]}>
                  {confirmText}
                </Text>
              )}
            </TouchableOpacity>

            {/* Secondary Cancel Button */}
            {showCancel && (
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.cancelButton,
                  { backgroundColor: cancelBgColor },
                ]}
                activeOpacity={0.8}
                onPress={handleCancel}
                disabled={isLoading}
              >
                <Text style={[styles.buttonText, { color: cancelTextColor }]}>
                  {cancelText}
                </Text>
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
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButton: {
    borderWidth: 0,
  },
  buttonText: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
  },
});
