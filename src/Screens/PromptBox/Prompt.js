import React, {useState, useEffect} from 'react';
import {Modal, View, Text, StyleSheet, TouchableOpacity} from 'react-native';

const PromptBox = ({visible, message, onConfirm, onCancel}) => {
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
                {
                  backgroundColor:
                    clicked === 'confirm' ? '#b80266' : '#ededed',
                },
              ]}
              onPress={() => handleButtonClick('confirm')}>
              <Text
                style={[
                  styles.buttonText,
                  {color: clicked === 'confirm' ? '#FFF' : '#b80266'}, // Change text color based on button color
                ]}>
                Confirm
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                {backgroundColor: clicked === 'cancel' ? '#b80266' : '#ededed'},
              ]}
              onPress={() => handleButtonClick('cancel')}>
              <Text
                style={[
                  styles.buttonText,
                  {color: clicked === 'cancel' ? '#FFF' : '#b80266'},
                ]}>
                Cancel
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
    borderRadius: 10,
    alignItems: 'center',
  },
  modalMessage: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
    color: '#000',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    marginHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PromptBox;
