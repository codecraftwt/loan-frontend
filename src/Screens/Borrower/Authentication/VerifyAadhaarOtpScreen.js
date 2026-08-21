import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { m } from 'walstar-rn-responsive';
import { FontFamily, FontSizes } from '../../../constants';
import aadhaarKycAPI from '../../../Services/aadhaarKycService';

export default function VerifyAadhaarOtpScreen({ navigation, route }) {
  const { aadhaarNumber, transactionId } = route.params || {};
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const maskedAadhaar = aadhaarNumber
    ? `XXXX XXXX ${aadhaarNumber.slice(-4)}`
    : 'your Aadhaar number';

  const handleOtpChange = text => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 6) {
      setOtp(numericText);
      setError('');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      setError('Enter the OTP sent to your Aadhaar-linked mobile number.');
      return;
    }

    try {
      setIsVerifying(true);
      const response = await aadhaarKycAPI.verifyOtp({
        aadhaarNumber,
        otp,
        transactionId,
      });

      const isVerified =
        response?.success === true ||
        response?.verified === true ||
        response?.status === 'success';

      if (!isVerified) {
        throw new Error(response?.message || 'OTP verification failed.');
      }

      navigation.replace('AadhaarKycSuccessScreen', {
        aadhaarNumber,
        kycData: response?.kycData || response?.data,
      });
    } catch (apiError) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1:
          apiError?.response?.data?.message ||
          apiError?.message ||
          'Unable to verify OTP. Please try again.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setIsResending(true);
      const response = await aadhaarKycAPI.sendOtp({
        aadhaarNumber,
        consentAccepted: true,
      });

      Toast.show({
        type: 'success',
        position: 'top',
        text1: response?.message || 'OTP resent successfully.',
        text2: response?.mockOtp ? `Test OTP: ${response.mockOtp}` : undefined,
      });

      navigation.setParams({
        transactionId: response?.transactionId || response?.txnId || transactionId,
      });
    } catch (apiError) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1:
          apiError?.response?.data?.message ||
          apiError?.message ||
          'Unable to resend OTP. Please try again.',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor="#ff6700" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerContent}>
          <Text style={styles.appName}>LoanHub</Text>
          <Text style={styles.tagline}>Aadhaar eKYC Verification</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="keypad-outline" size={m(40)} color="#ff6700" />
          </View>

          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            Enter the OTP sent to your registered mobile number for {maskedAadhaar} to proceed with verification
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>OTP</Text>
            <View style={[styles.inputContainer, error ? styles.inputError : {}]}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={error ? '#FF4444' : '#ff7900'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={otp}
                onChangeText={handleOtpChange}
                placeholder="Enter OTP"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                maxLength={6}
                secureTextEntry
              />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isVerifying && styles.disabledButton]}
            onPress={handleVerifyOtp}
            disabled={isVerifying}>
            <LinearGradient
              colors={['#ff6700', '#ff7900', '#ff8500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}>
              {isVerifying ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Verify OTP</Text>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#FFFFFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleResendOtp}
            disabled={isResending || isVerifying}>
            {isResending ? (
              <ActivityIndicator color="#ff6700" />
            ) : (
              <>
                <Ionicons name="refresh-outline" size={18} color="#ff6700" />
                <Text style={styles.secondaryButtonText}>Resend OTP</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ff6700',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#ff6700',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: m(20),
    paddingTop: Platform.OS === 'ios' ? m(52) : m(32),
    paddingBottom: m(40),
    backgroundColor: '#ff6700',
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: m(18),
  },
  appName: {
    fontSize: FontSizes['4xl'],
    fontFamily: FontFamily.secondaryBold,
    color: '#FFFFFF',
  },
  tagline: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.secondaryRegular,
    color: '#FFFFFF',
    marginTop: m(6),
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
  iconCircle: {
    width: m(80),
    height: m(80),
    borderRadius: m(40),
    backgroundColor: '#FFF9F0',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#FFEDD5',
    marginBottom: m(16),
  },
  title: {
    fontSize: FontSizes['2xl'],
    fontFamily: FontFamily.secondaryBold,
    color: '#333',
    textAlign: 'center',
    marginBottom: m(8),
  },
  subtitle: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primaryRegular,
    color: '#666',
    textAlign: 'center',
    lineHeight: m(22),
    marginBottom: m(24),
  },
  inputGroup: {
    marginBottom: m(24),
  },
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
  inputError: {
    borderColor: '#FF4444',
  },
  inputIcon: {
    marginRight: m(12),
  },
  input: {
    flex: 1,
    fontSize: FontSizes.md,
    fontFamily: FontFamily.primaryRegular,
    color: '#333',
    padding: 0,
  },
  errorText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#FF4444',
    marginTop: m(6),
  },
  primaryButton: {
    borderRadius: m(12),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#ff6700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonGradient: {
    minHeight: m(54),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
  },
  primaryButtonText: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.primarySemiBold,
    color: '#FFFFFF',
  },
  secondaryButton: {
    minHeight: m(48),
    marginTop: m(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
  },
  secondaryButtonText: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: '#ff6700',
  },
});
