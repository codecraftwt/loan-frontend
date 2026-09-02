import { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { m } from 'walstar-rn-responsive';

const PromptBox = ({
  visible,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  const [clicked, setClicked] = useState(null);

  useEffect(() => {
    if (!visible) {
      setClicked(null);
    }
  }, [visible]);

  const handleButtonClick = buttonType => {
    setClicked(buttonType);
    setTimeout(() => {
      if (buttonType === 'confirm') {
        onConfirm();
      } else {
        onCancel();
      }
    }, 100);
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}>
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                clicked === 'cancel' && styles.cancelButtonActive,
              ]}
              onPress={() => handleButtonClick('cancel')}>
              <Text
                style={[
                  styles.cancelButtonText,
                  clicked === 'cancel' && styles.cancelButtonTextActive,
                ]}>
                {cancelText}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                clicked === 'confirm' && styles.confirmButtonActive,
              ]}
              onPress={() => handleButtonClick('confirm')}>
              <Text
                style={[
                  styles.confirmButtonText,
                  clicked === 'confirm' && styles.confirmButtonTextActive,
                ]}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(35, 42, 37, 0.68)',
    padding: m(24),
  },
  modalContainer: {
    width: '100%',
    maxWidth: m(356),
    padding: m(24),
    backgroundColor: '#FFF',
    borderRadius: m(24),
    alignItems: 'flex-start',
    shadowColor: '#101510',
    shadowOffset: {
      width: 0,
      height: m(10),
    },
    shadowOpacity: 0.22,
    shadowRadius: m(20),
    elevation: 12,
  },
  modalTitle: {
    fontSize: m(22),
    lineHeight: m(28),
    fontWeight: '800',
    color: '#19211C',
    marginBottom: m(8),
  },
  modalMessage: {
    fontSize: m(15),
    fontWeight: '400',
    marginBottom: m(28),
    color: '#5F6963',
    lineHeight: m(22),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: m(12),
  },
  button: {
    flex: 1,
    minHeight: m(54),
    paddingVertical: m(13),
    borderRadius: m(14),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  // Cancel button styles
  cancelButton: {
    backgroundColor: '#F8F7F3',
    borderColor: '#E7E2DA',
  },
  cancelButtonActive: {
    backgroundColor: '#EFECE6',
    borderColor: '#DCD5CA',
  },
  cancelButtonText: {
    fontSize: m(15),
    fontWeight: '800',
    color: '#1D261F',
  },
  cancelButtonTextActive: {
    color: '#1D261F',
  },
  // Confirm button styles
  confirmButton: {
    backgroundColor: '#0B4A40',
  },
  confirmButtonActive: {
    backgroundColor: '#073B33',
  },
  confirmButtonText: {
    fontSize: m(15),
    fontWeight: '800',
    color: '#FFF',
  },
  confirmButtonTextActive: {
    color: '#FFF',
  },
});

export default PromptBox;
