import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { m } from 'walstar-rn-responsive';
import { FontFamily, FontSizes } from '../../constants';
import bcrypt from 'react-native-bcrypt';
import instance from '../../Utils/AxiosInstance';

const maskEmail = email => {
  if (!email || !email.includes('@')) return email || '';
  const [name, domain] = email.split('@');
  const visible = name.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(name.length - 2, 3))}@${domain}`;
};

export default function ForgotPin({ navigation }) {
  const user = useSelector(state => state.auth.user);
  const userEmail = user?.email || '';

  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [newPin, setNewPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const otpRefs = useRef([]);
  const pinRefs = useRef([]);
  const confirmPinRefs = useRef([]);

  // Step 1: Request OTP via email
  const handleRequestOTP = async () => {
    if (!userEmail) {
      setError('No email address found on your account. Please contact support.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      await instance.post('auth/forgot-pin/request-otp');

      Toast.show({
        type: 'success',
        position: 'top',
        text1: 'OTP Sent successfully',
        text2: `Check ${maskEmail(userEmail)}`,
      });
      setStep(2);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length < 4) {
      setError('Please enter the complete 4-digit OTP.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      await instance.post('auth/forgot-pin/verify-otp', { otp: otpCode });

      Toast.show({
        type: 'success',
        position: 'top',
        text1: 'OTP Verified',
      });
      setStep(3);
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Set New PIN
  const handleSetNewPin = async () => {
    const pinString = newPin.join('');
    const confirmPinString = confirmPin.join('');

    if (pinString.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }
    if (pinString !== confirmPinString) {
      setError('PINs do not match');
      return;
    }
    const isSequential = '1234,2345,3456,4567,5678,6789'.includes(pinString);
    if (isSequential) {
      setError('Please choose a more secure PIN (avoid sequential numbers)');
      return;
    }
    const isRepeated = /^(\d)\1{3}$/.test(pinString);
    if (isRepeated) {
      setError('Please choose a more secure PIN (avoid repeated digits)');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const salt = bcrypt.genSaltSync(10);
      const hashedPin = bcrypt.hashSync(pinString, salt);

      await instance.post('auth/reset-pin', {
        pinHash: hashedPin,
        pinCreatedAt: new Date().toISOString(),
        otp: otp.join(''),
      });

      Toast.show({
        type: 'success',
        position: 'top',
        text1: 'PIN Reset Successfully',
        text2: 'You can now use your new PIN to accept loans.',
      });
      navigation.goBack();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to reset PIN. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Input Handlers
  const handleOtpChange = (text, index) => {
    const numericText = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = numericText;
    setOtp(newOtp);
    setError('');
    if (numericText && index < 3) otpRefs.current[index + 1]?.focus();
  };

  const handlePinChange = (text, index) => {
    const numericText = text.replace(/[^0-9]/g, '');
    const pinArr = [...newPin];
    pinArr[index] = numericText;
    setNewPin(pinArr);
    setError('');
    if (numericText && index < 3) pinRefs.current[index + 1]?.focus();
  };

  const handleConfirmPinChange = (text, index) => {
    const numericText = text.replace(/[^0-9]/g, '');
    const pinArr = [...confirmPin];
    pinArr[index] = numericText;
    setConfirmPin(pinArr);
    setError('');
    if (numericText && index < 3) confirmPinRefs.current[index + 1]?.focus();
  };

  const renderStep1 = () => (
    <>
      <Text style={styles.headerText}>Forgot PIN</Text>
      <Text style={styles.instructionText}>
        We'll send a one-time password (OTP) to your registered email
        address.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email Address</Text>
        <View style={styles.inputContainer}>
          <Ionicons
            name="mail-outline"
            size={20}
            color="#ff7900"
            style={styles.inputIcon}
          />
          <Text style={styles.input}>{maskEmail(userEmail) || 'No email on file'}</Text>
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <TouchableOpacity
        style={[
          styles.continueButtonContainer,
          (isSubmitting || !userEmail) && styles.continueButtonDisabled,
        ]}
        onPress={handleRequestOTP}
        disabled={isSubmitting || !userEmail}
      >
        <LinearGradient
          colors={['#ff6700', '#ff7900', '#ff8500']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.continueButtonGradient}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.continueButtonText}>Send OTP</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.headerText}>Verify OTP</Text>
      <Text style={styles.instructionText}>
        Enter the 4-digit OTP sent to {maskEmail(userEmail)}
      </Text>

      <View style={styles.digitContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={`otp-${index}`}
            style={[
              styles.digitInput,
              digit && styles.digitInputFilled,
              error && styles.digitInputError,
            ]}
            value={digit}
            onChangeText={text => handleOtpChange(text, index)}
            onKeyPress={e => {
              if (
                e.nativeEvent.key === 'Backspace' &&
                !otp[index] &&
                index > 0
              ) {
                otpRefs.current[index - 1]?.focus();
              }
            }}
            keyboardType="numeric"
            maxLength={1}
            ref={el => (otpRefs.current[index] = el)}
          />
        ))}
      </View>
      {error ? <Text style={styles.errorTextCenter}>{error}</Text> : null}

      <TouchableOpacity
        style={[
          styles.continueButtonContainer,
          (isSubmitting || otp.includes('')) && styles.continueButtonDisabled,
        ]}
        onPress={handleVerifyOTP}
        disabled={isSubmitting || otp.includes('')}
      >
        <LinearGradient
          colors={['#ff6700', '#ff7900', '#ff8500']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.continueButtonGradient}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.continueButtonText}>Verify & Continue</Text>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#FFFFFF"
              />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={styles.headerText}>Set New PIN</Text>
      <Text style={styles.instructionText}>
        Create a new 4-digit security PIN.
      </Text>

      <Text style={styles.inputLabel}>New 4-Digit PIN</Text>
      <View style={styles.digitContainer}>
        {newPin.map((digit, index) => (
          <TextInput
            key={`pin-${index}`}
            style={[styles.digitInput, digit && styles.digitInputFilled]}
            value={digit}
            onChangeText={text => handlePinChange(text, index)}
            onKeyPress={e => {
              if (
                e.nativeEvent.key === 'Backspace' &&
                !newPin[index] &&
                index > 0
              ) {
                pinRefs.current[index - 1]?.focus();
              }
            }}
            secureTextEntry={!showPin}
            keyboardType="numeric"
            maxLength={1}
            ref={el => (pinRefs.current[index] = el)}
          />
        ))}
      </View>

      <Text style={[styles.inputLabel, { marginTop: m(20) }]}>
        Confirm New PIN
      </Text>
      <View style={styles.digitContainer}>
        {confirmPin.map((digit, index) => (
          <TextInput
            key={`confirm-${index}`}
            style={[styles.digitInput, digit && styles.digitInputFilled]}
            value={digit}
            onChangeText={text => handleConfirmPinChange(text, index)}
            onKeyPress={e => {
              if (
                e.nativeEvent.key === 'Backspace' &&
                !confirmPin[index] &&
                index > 0
              ) {
                confirmPinRefs.current[index - 1]?.focus();
              }
            }}
            secureTextEntry={!showPin}
            keyboardType="numeric"
            maxLength={1}
            ref={el => (confirmPinRefs.current[index] = el)}
          />
        ))}
      </View>

      <TouchableOpacity
        style={styles.showPinButton}
        onPress={() => setShowPin(!showPin)}
      >
        <Ionicons
          name={showPin ? 'eye-off-outline' : 'eye-outline'}
          size={20}
          color="#ff7900"
        />
        <Text style={styles.showPinText}>
          {showPin ? 'Hide PIN' : 'Show PIN'}
        </Text>
      </TouchableOpacity>

      {error ? <Text style={styles.errorTextCenter}>{error}</Text> : null}

      <TouchableOpacity
        style={[
          styles.continueButtonContainer,
          (isSubmitting || newPin.includes('') || confirmPin.includes('')) &&
            styles.continueButtonDisabled,
        ]}
        onPress={handleSetNewPin}
        disabled={
          isSubmitting || newPin.includes('') || confirmPin.includes('')
        }
      >
        <LinearGradient
          colors={['#ff6700', '#ff7900', '#ff8500']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.continueButtonGradient}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.continueButtonText}>Save New PIN</Text>
              <Ionicons name="save-outline" size={20} color="#FFFFFF" />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#ff6700" />
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (step > 1 ? setStep(step - 1) : navigation.goBack())}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContent}>
          <Text style={styles.appName}>LoanHub</Text>
          <Text style={styles.tagline}>Security Recovery</Text>
        </View>

        <View style={styles.formCard}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ff6700' },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: m(20),
    paddingVertical: m(20),
    justifyContent: 'center',
  },
  topBar: {
    paddingTop: Platform.OS === 'android' ? m(10) : m(20),
    paddingHorizontal: m(16),
  },
  backButton: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  headerContent: { alignItems: 'center', marginBottom: m(20) },
  appName: {
    fontSize: FontSizes['4xl'],
    fontFamily: FontFamily.secondaryBold,
    color: '#FFFFFF',
  },
  tagline: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.secondaryRegular,
    color: '#FFFFFF',
    fontStyle: 'italic',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(20),
    padding: m(24),
    borderWidth: 1,
    borderColor: '#FFEDD5',
    elevation: 8,
    shadowColor: '#ff6700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  headerText: {
    fontSize: FontSizes['2xl'],
    color: '#333',
    fontFamily: FontFamily.secondaryBold,
    textAlign: 'center',
    marginBottom: m(8),
  },
  instructionText: {
    fontSize: FontSizes.md,
    color: '#666',
    fontFamily: FontFamily.primaryRegular,
    textAlign: 'center',
    marginBottom: m(24),
  },
  inputGroup: { marginBottom: m(20) },
  inputLabel: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: '#555',
    marginBottom: m(8),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9F0',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#FFEDD5',
    paddingHorizontal: m(16),
    height: m(56),
  },
  inputError: { borderColor: '#FF4444' },
  inputIcon: { marginRight: m(12) },
  input: {
    flex: 1,
    fontSize: FontSizes.md,
    fontFamily: FontFamily.primaryRegular,
    color: '#333',
  },
  errorText: {
    fontSize: FontSizes.base,
    color: '#FF4444',
    fontFamily: FontFamily.primaryRegular,
    marginTop: m(4),
    marginLeft: m(4),
  },
  errorTextCenter: {
    fontSize: FontSizes.base,
    color: '#FF4444',
    fontFamily: FontFamily.primaryRegular,
    marginTop: m(10),
    textAlign: 'center',
  },
  continueButtonContainer: {
    borderRadius: m(12),
    marginTop: m(16),
    overflow: 'hidden',
  },
  continueButtonDisabled: { opacity: 0.6 },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(16),
    gap: m(8),
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.primarySemiBold,
  },
  digitContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: m(12),
    marginBottom: m(10),
  },
  digitInput: {
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
  digitInputFilled: { borderColor: '#3B82F6', backgroundColor: '#FFFFFF' },
  digitInputError: { borderColor: '#DC2626' },
  showPinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
    marginTop: m(10),
    padding: m(8),
  },
  showPinText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryMedium,
    color: '#ff7900',
  },
});
