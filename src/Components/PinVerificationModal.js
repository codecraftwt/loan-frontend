import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { m } from 'walstar-rn-responsive';

const PinVerificationModal = ({
  visible,
  loanId,
  lenderName,
  loanAmount,
  onVerifySuccess,
  onForgotPin,
  onClose,
}) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const inputRefs = useRef([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Reset PIN when modal opens
  useEffect(() => {
    if (visible) {
      setPin(['', '', '', '']);
      setError(null);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [visible]);

  const handleChange = (text, index) => {
    const numericText = text.replace(/[^0-9]/g, '');
    const newPin = [...pin];
    newPin[index] = numericText;
    setPin(newPin);
    setError(null);

    if (numericText && index < pin.length - 1) {
      inputRefs.current[index + 1]?.focus();
    } else if (!numericText && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const pinCode = pin.join('');
    if (pinCode.length < 4) {
      setError('Please enter your complete 4-digit PIN.');
      return;
    }

    if (!loanId) {
      setError('Loan ID is missing.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onVerifySuccess(pinCode);
    } catch (err) {
      const errorMsg =
        err?.message || err || 'Incorrect PIN. Please try again.';
      setError(errorMsg);
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Verification Failed',
        text2: errorMsg,
      });
      // Clear PIN on failure for retry
      setPin(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const isPinComplete = pin.every(digit => digit !== '');

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Accept Loan Offer</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.infoBanner}>
              <Icon name="info-outline" size={20} color="#3B82F6" />
              <Text style={styles.infoText}>
                You are accepting a loan offer of{' '}
                <Text style={{ fontWeight: 'bold' }}>₹{loanAmount}</Text> from{' '}
                <Text style={{ fontWeight: 'bold' }}>
                  {lenderName || 'Lender'}
                </Text>
                .
              </Text>
            </View>

            <Text style={styles.instructionText}>
              Enter your 4-digit security PIN to confirm and accept this loan.
            </Text>

            <View style={styles.pinContainer}>
              {pin.map((digit, index) => (
                <TextInput
                  key={index}
                  style={[
                    styles.pinInput,
                    digit && styles.pinInputFilled,
                    error && styles.pinInputError,
                  ]}
                  value={digit}
                  onChangeText={text => handleChange(text, index)}
                  onKeyPress={e => handleKeyPress(e, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  secureTextEntry={true}
                  ref={el => (inputRefs.current[index] = el)}
                  selectTextOnFocus
                />
              ))}
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Icon name="error-outline" size={16} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.verifyButton,
                (!isPinComplete || loading) && styles.verifyButtonDisabled,
              ]}
              onPress={handleVerify}
              disabled={!isPinComplete || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="verified" size={20} color="#FFFFFF" />
                  <Text style={styles.verifyButtonText}>Accept Loan</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.footerActions}>
              <TouchableOpacity
                style={styles.forgotPinButton}
                onPress={onForgotPin}
              >
                <Text style={styles.forgotPinText}>Forgot PIN?</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: m(20),
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(20),
    width: '100%',
    maxWidth: m(400),
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: m(20),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: m(4),
  },
  content: {
    padding: m(20),
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: m(12),
    padding: m(12),
    marginBottom: m(16),
    gap: m(8),
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoText: {
    flex: 1,
    fontSize: m(13),
    color: '#1E3A8A',
    lineHeight: m(18),
  },
  instructionText: {
    fontSize: m(14),
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: m(24),
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: m(12),
    marginBottom: m(24),
  },
  pinInput: {
    width: m(56),
    height: m(56),
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: m(12),
    fontSize: m(24),
    fontWeight: '700',
    textAlign: 'center',
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  pinInputFilled: {
    borderColor: '#10B981',
    backgroundColor: '#FFFFFF',
  },
  pinInputError: {
    borderColor: '#DC2626',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: m(12),
    borderRadius: m(8),
    marginBottom: m(16),
    gap: m(8),
  },
  errorText: {
    flex: 1,
    fontSize: m(13),
    color: '#DC2626',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981', // green for accept
    padding: m(16),
    borderRadius: m(12),
    marginBottom: m(16),
    gap: m(8),
  },
  verifyButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  verifyButtonText: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footerActions: {
    alignItems: 'center',
  },
  forgotPinButton: {
    padding: m(8),
  },
  forgotPinText: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#3B82F6',
  },
});

export default PinVerificationModal;
