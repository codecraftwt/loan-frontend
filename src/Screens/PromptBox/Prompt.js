import { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const PromptBox = ({ visible, message, onConfirm, onCancel }) => {
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
                Cancel
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
                Confirm
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: 300,
    padding: 24,
    backgroundColor: '#FFF',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalMessage: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 24,
    textAlign: 'center',
    color: '#333',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  // Cancel button styles
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
  },
  cancelButtonActive: {
    backgroundColor: '#e0e0e0',
    borderColor: '#ccc',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  cancelButtonTextActive: {
    color: '#444',
  },
  // Confirm button styles
  confirmButton: {
    backgroundColor: '#ff8800ff',
  },
  confirmButtonActive: {
    backgroundColor: '#ff8800ff',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  confirmButtonTextActive: {
    color: '#FFF',
  },
});

export default PromptBox;