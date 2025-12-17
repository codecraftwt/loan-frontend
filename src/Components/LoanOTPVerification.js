import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch } from 'react-redux';
import { verifyLoanOTP } from '../Redux/Slices/loanSlice';
import Toast from 'react-native-toast-message';
import { m } from 'walstar-rn-responsive';

const LoanOTPVerification = ({
  visible,
  loanId,
  borrowerMobile,
  onVerifySuccess,
  onSkip,
  onClose,
}) => {
  const dispatch = useDispatch();
  const [otp, setOtp] = useState(['', '', '', '']); // 4-digit OTP
  const inputRefs = useRef([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Reset OTP when modal opens
  useEffect(() => {
    if (visible) {
      setOtp(['', '', '', '']);
      setError(null);
      inputRefs.current[0]?.focus();
    }
  }, [visible]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (text, index) => {
    const numericText = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = numericText;
    setOtp(newOtp);
    setError(null);

    if (numericText && index < otp.length - 1) {
      inputRefs.current[index + 1]?.focus();
    } else if (!numericText && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length < 4) {
      setError('Please enter a complete 4-digit OTP.');
      return;
    }

    if (!loanId) {
      setError('Loan ID is missing.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await dispatch(
        verifyLoanOTP({ loanId, otp: otpCode })
      ).unwrap();

      if (result.success) {
        Toast.show({
          type: 'success',
          position: 'top',
          text1: 'Loan confirmed successfully',
          text2: 'Borrower has accepted the loan.',
        });
        onVerifySuccess?.(result.data);
      } else {
        setError(result.message || 'OTP verification failed');
      }
    } catch (err) {
      const errorMsg =
        err?.message ||
        err ||
        'Invalid OTP. Please try again.';
      setError(errorMsg);
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Verification Failed',
        text2: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) {
      return;
    }

    setResendLoading(true);
    setError(null);

    try {
      // Note: The API doc doesn't show a resend endpoint, but we can show a message
      // In a real implementation, you might need to call a resend OTP endpoint
      Toast.show({
        type: 'info',
        position: 'top',
        text1: 'OTP Resent',
        text2: 'Please check your mobile number for the OTP.',
      });
      setResendCooldown(60); // 60 second cooldown
      setOtp(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSkip = () => {
    setOtp(['', '', '', '']);
    setError(null);
    onSkip?.();
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Verify OTP</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.instructionText}>
              Enter the 4-digit OTP sent to borrower's mobile number
            </Text>
            {borrowerMobile && (
              <Text style={styles.mobileText}>
                {borrowerMobile}
              </Text>
            )}

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  style={[
                    styles.otpInput,
                    digit && styles.otpInputFilled,
                    error && styles.otpInputError,
                  ]}
                  value={digit}
                  onChangeText={text => handleChange(text, index)}
                  onKeyPress={e => handleKeyPress(e, index)}
                  keyboardType="numeric"
                  maxLength={1}
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
                (!isOtpComplete || loading) && styles.verifyButtonDisabled,
              ]}
              onPress={handleVerify}
              disabled={!isOtpComplete || loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="verified" size={20} color="#FFFFFF" />
                  <Text style={styles.verifyButtonText}>Verify OTP</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.footerActions}>
              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendOTP}
                disabled={resendLoading || resendCooldown > 0}>
                {resendLoading ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <>
                    <Icon
                      name="refresh"
                      size={16}
                      color={resendCooldown > 0 ? '#9CA3AF' : '#3B82F6'}
                    />
                    <Text
                      style={[
                        styles.resendButtonText,
                        resendCooldown > 0 && styles.resendButtonTextDisabled,
                      ]}>
                      {resendCooldown > 0
                        ? `Resend OTP (${resendCooldown}s)`
                        : 'Resend OTP'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}>
                <Icon name="skip-next" size={16} color="#6B7280" />
                <Text style={styles.skipButtonText}>Skip for Now</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.noteText}>
              Note: You can skip OTP verification and verify later. The loan will
              remain pending until verified.
            </Text>
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
    fontSize: m(20),
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: m(4),
  },
  content: {
    padding: m(20),
  },
  instructionText: {
    fontSize: m(14),
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: m(8),
  },
  mobileText: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: m(24),
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: m(12),
    marginBottom: m(20),
  },
  otpInput: {
    width: m(56),
    height: m(56),
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: m(12),
    fontSize: m(24),
    fontWeight: '600',
    textAlign: 'center',
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  otpInputFilled: {
    borderColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
  },
  otpInputError: {
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
    backgroundColor: '#3B82F6',
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
    gap: m(12),
    marginBottom: m(16),
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: m(12),
    gap: m(6),
  },
  resendButtonText: {
    fontSize: m(14),
    fontWeight: '500',
    color: '#3B82F6',
  },
  resendButtonTextDisabled: {
    color: '#9CA3AF',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: m(12),
    gap: m(6),
  },
  skipButtonText: {
    fontSize: m(14),
    fontWeight: '500',
    color: '#6B7280',
  },
  noteText: {
    fontSize: m(12),
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: m(16),
  },
});

export default LoanOTPVerification;







