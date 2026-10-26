// src/Components/common/CustomAlertModal.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { m } from '../../Utils/responsive';
import { colors, FontFamily } from '../../constants';

// Singleton alert controller for global usage
let globalAlertHandler = null;

/**
 * Helper to determine alert badge type and icon
 */
const resolveTypeConfig = (type, customIcon, showIcon = true) => {
  if (showIcon === false) {
    return { icon: null, iconBg: 'transparent', iconColor: 'transparent' };
  }

  switch (type) {
    case 'error':
      return {
        icon: customIcon || 'alert-circle',
        iconBg: '#fee2e2',
        iconColor: '#dc2626',
        defaultConfirmBg: colors.primary,
        defaultConfirmTextColor: colors.lettersAndIcons,
      };
    case 'success':
      return {
        icon: customIcon || 'check-circle',
        iconBg: '#ecfdf5',
        iconColor: '#059669',
        defaultConfirmBg: colors.primary,
        defaultConfirmTextColor: colors.lettersAndIcons,
      };
    case 'warning':
      return {
        icon: customIcon || 'alert-triangle',
        iconBg: '#fef3c7',
        iconColor: '#d97706',
        defaultConfirmBg: colors.primary,
        defaultConfirmTextColor: colors.lettersAndIcons,
      };
    case 'destructive':
      return {
        icon: customIcon || 'trash-2',
        iconBg: '#fee2e2',
        iconColor: '#dc2626',
        defaultConfirmBg: '#dc2626',
        defaultConfirmTextColor: colors.white,
      };
    case 'confirm':
      return {
        icon: customIcon || 'help-circle',
        iconBg: colors.lightGreen,
        iconColor: colors.lettersAndIcons,
        defaultConfirmBg: colors.primary,
        defaultConfirmTextColor: colors.lettersAndIcons,
      };
    case 'info':
    default:
      return {
        icon: customIcon || 'info',
        iconBg: colors.lightGreen,
        iconColor: colors.lettersAndIcons,
        defaultConfirmBg: colors.primary,
        defaultConfirmTextColor: colors.lettersAndIcons,
      };
  }
};

/**
 * Auto-detect alert category type based on title and message text
 */
const autoDetectType = (title = '', message = '', showCancel = false) => {
  const combined = `${title} ${message}`.toLowerCase();
  if (
    combined.includes('error') ||
    combined.includes('failed') ||
    combined.includes('invalid') ||
    combined.includes('declined') ||
    combined.includes('unable') ||
    combined.includes('not supported') ||
    combined.includes('unauthorized') ||
    combined.includes('rejected')
  ) {
    return 'error';
  }
  if (
    combined.includes('success') ||
    combined.includes('recorded') ||
    combined.includes('completed') ||
    combined.includes('verified') ||
    combined.includes('approved') ||
    combined.includes('copied') ||
    combined.includes('🎉')
  ) {
    return 'success';
  }
  if (
    combined.includes('warning') ||
    combined.includes('notice') ||
    combined.includes('required') ||
    combined.includes('missing') ||
    combined.includes('alert') ||
    combined.includes('urgent') ||
    combined.includes('expire')
  ) {
    return 'warning';
  }
  if (showCancel) {
    return 'confirm';
  }
  return 'info';
};

/**
 * Global Custom Alert Trigger (1:1 Drop-in for React Native Alert.alert)
 * 
 * Overloads supported:
 * 1) showAlert("Title", "Message", [{ text: 'Cancel' }, { text: 'OK', onPress }])
 * 2) showAlert("Title", "Message")
 * 3) showAlert({ title, message, ... })
 */
export const showAlert = (titleOrOptions, message, buttons, options) => {
  let config = {};

  if (typeof titleOrOptions === 'object' && titleOrOptions !== null) {
    config = { ...titleOrOptions };
  } else {
    config.title = typeof titleOrOptions === 'string' ? titleOrOptions : '';
    config.message = typeof message === 'string' ? message : '';

    if (Array.isArray(buttons) && buttons.length > 0) {
      if (buttons.length === 1) {
        config.confirmText = buttons[0].text || 'OK';
        config.onConfirm = buttons[0].onPress;
        config.showCancel = false;
        if (buttons[0].style === 'destructive') {
          config.type = 'destructive';
          config.confirmBgColor = '#dc2626';
          config.confirmTextColor = colors.white;
        }
      } else {
        // Find cancel button (either style === 'cancel' or first button if contains cancel)
        const cancelBtn =
          buttons.find(b => b.style === 'cancel') ||
          (buttons[0]?.text?.toLowerCase().includes('cancel') ? buttons[0] : buttons[0]);
        const actionBtn = buttons.find(b => b !== cancelBtn) || buttons[1];

        config.cancelText = cancelBtn.text || 'Cancel';
        config.onCancel = cancelBtn.onPress;
        config.showCancel = true;

        config.confirmText = actionBtn.text || 'Confirm';
        config.onConfirm = actionBtn.onPress;

        if (actionBtn.style === 'destructive') {
          config.type = 'destructive';
          config.confirmBgColor = '#dc2626';
          config.confirmTextColor = colors.white;
        }
      }
    } else if (typeof buttons === 'function') {
      config.onConfirm = buttons;
      config.showCancel = false;
    }

    if (options && typeof options === 'object') {
      if (options.cancelable !== undefined) {
        config.dismissible = options.cancelable;
      }
      if (options.type) config.type = options.type;
      if (options.icon) config.icon = options.icon;
      if (options.showIcon !== undefined) config.showIcon = options.showIcon;
    }
  }

  // Deduce type if not explicitly set
  if (!config.type) {
    config.type = autoDetectType(config.title, config.message, config.showCancel);
  }

  showCustomAlert(config);
};

// Convenience semantic shortcuts
showAlert.success = (title, message, onPress) => {
  showAlert({
    title,
    message,
    type: 'success',
    showCancel: false,
    confirmText: 'OK',
    onConfirm: onPress,
  });
};

showAlert.error = (title, message, onPress) => {
  showAlert({
    title,
    message,
    type: 'error',
    showCancel: false,
    confirmText: 'OK',
    onConfirm: onPress,
  });
};

showAlert.warning = (title, message, onPress) => {
  showAlert({
    title,
    message,
    type: 'warning',
    showCancel: false,
    confirmText: 'OK',
    onConfirm: onPress,
  });
};

showAlert.info = (title, message, onPress) => {
  showAlert({
    title,
    message,
    type: 'info',
    showCancel: false,
    confirmText: 'OK',
    onConfirm: onPress,
  });
};

showAlert.confirm = (
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel'
) => {
  showAlert({
    title,
    message,
    type: 'confirm',
    showCancel: true,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
  });
};

/**
 * Raw singleton show trigger (retained for backward compatibility)
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

export const closeAlert = closeCustomAlert;

export const alertService = {
  show: showCustomAlert,
  hide: closeCustomAlert,
  confirm: (title, message, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel') => {
    showAlert.confirm(title, message, onConfirm, null, confirmText, cancelText);
  },
  alert: (title, message, onConfirm, confirmText = 'OK') => {
    showAlert({
      title,
      message,
      confirmText,
      showCancel: false,
      onConfirm,
    });
  },
  success: showAlert.success,
  error: showAlert.error,
  warning: showAlert.warning,
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
  showIcon: propShowIcon = true,
  type: propType,
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

  // Smooth entrance scale & opacity animation
  const animScale = useRef(new Animated.Value(0.92)).current;
  const animOpacity = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    if (isVisible) {
      animScale.setValue(0.92);
      animOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(animScale, {
          toValue: 1,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(animOpacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, animScale, animOpacity]);

  const title = propTitle || config.title || '';
  const subtitle = propSubtitle || config.subtitle || '';
  const message = propMessage || propDescription || config.message || config.description || '';
  const confirmText = propConfirmText || config.confirmText || 'OK';
  const cancelText = propCancelText || config.cancelText || 'Cancel';
  const showCancel = propShowCancel !== undefined ? propShowCancel : (config.showCancel ?? false);
  const showIcon = propShowIcon !== undefined ? propShowIcon : (config.showIcon ?? true);
  const type = propType || config.type || (showCancel ? 'confirm' : 'info');

  const typeConfig = resolveTypeConfig(type, propIcon || config.icon, showIcon);

  const confirmBgColor =
    propConfirmBgColor || config.confirmBgColor || typeConfig.defaultConfirmBg || colors.primary;
  const confirmTextColor =
    propConfirmTextColor ||
    config.confirmTextColor ||
    typeConfig.defaultConfirmTextColor ||
    colors.lettersAndIcons;
  const cancelBgColor = propCancelBgColor || config.cancelBgColor || colors.lightGreen;
  const cancelTextColor = propCancelTextColor || config.cancelTextColor || colors.lettersAndIcons;
  const dismissible = propDismissible !== undefined ? propDismissible : (config.dismissible ?? true);
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
        <Animated.View
          style={[
            styles.cardContainer,
            {
              transform: [{ scale: animScale }],
              opacity: animOpacity,
            },
          ]}
        >
          {/* Optional Icon Badge */}
          {typeConfig.icon && (
            <View style={[styles.iconCircle, { backgroundColor: typeConfig.iconBg }]}>
              <Feather name={typeConfig.icon} size={m(24)} color={typeConfig.iconColor} />
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
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 48, 48, 0.48)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: m(24),
  },
  cardContainer: {
    width: '100%',
    maxWidth: m(330),
    backgroundColor: colors.white,
    borderRadius: m(28),
    paddingHorizontal: m(22),
    paddingTop: m(26),
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
    width: m(50),
    height: m(50),
    borderRadius: m(25),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(14),
  },
  title: {
    fontSize: m(18),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    textAlign: 'center',
    marginBottom: m(4),
  },
  subtitle: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    textAlign: 'center',
    marginTop: m(4),
    marginBottom: m(4),
    paddingHorizontal: m(4),
  },
  description: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryRegular,
    color: '#4A6563',
    textAlign: 'center',
    lineHeight: m(18),
    marginTop: m(6),
    marginBottom: m(6),
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
