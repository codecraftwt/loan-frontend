import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {useDispatch} from 'react-redux';
import {verifyOtp, resendOtp} from '../../Redux/Slices/authslice';
import Toast from 'react-native-toast-message';
import {m} from 'walstar-rn-responsive';
import {FontFamily, FontSizes} from '../../constants';

export default function OTP({navigation, route}) {
  const {email} = route.params; 
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(0);
  
  // Countdown timer effect for resend OTP
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Handle input change and focus logic
  const handleChange = (text, index) => {
    const numericText = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = numericText;
    setOtp(newOtp);

    if (numericText && index < otp.length - 1) {
      inputRefs.current[index + 1].focus();
    } else if (!numericText && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // Handle Resend OTP
  const handleResendOtp = useCallback(async () => {
    if (countdown > 0 || resendLoading) return;

    setResendLoading(true);
    try {
      const result = await dispatch(resendOtp(email)).unwrap();
      
      Toast.show({
        type: 'success',
        position: 'top',
        text1: result.message || 'OTP sent to your email',
      });
      
      // Start countdown timer (60 seconds cooldown)
      setCountdown(60);
    } catch (err) {
      // Handle rate limiting error
      if (err?.isRateLimited && err?.retryAfterSeconds) {
        setCountdown(err.retryAfterSeconds);
        Toast.show({
          type: 'info',
          position: 'top',
          text1: `Please wait ${err.retryAfterSeconds} seconds before resending`,
        });
      } else {
        Toast.show({
          type: 'error',
          position: 'top',
          text1: err?.message || err || 'Failed to resend OTP',
        });
      }
    } finally {
      setResendLoading(false);
    }
  }, [dispatch, email, countdown, resendLoading]);

  // Handle OTP verification
  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      Alert.alert('Error', 'Please enter a complete 6-digit OTP.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Dispatch the verifyOtp action and wait for the response
      const result = await dispatch(verifyOtp({email, otp: otpCode})).unwrap();
      
      if (result.message === 'Invalid verification code') {
        Alert.alert('Error', 'The OTP you entered is invalid or expired.');
      } else {
        // OTP is valid, navigate to CreatePass to set the new password
        navigation.navigate('CreatePass', {email, otp: otpCode});

        Toast.show({
          type: 'success',
          position: 'top',
          text1: 'OTP verified successfully',
        });
      }
    } catch (err) {
      setError(err || 'An error occurred while verifying the OTP.');
      Toast.show({
        type: 'error',
        position: 'top',
        text1: err || 'Invalid OTP',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
      <StatusBar barStyle="light-content" backgroundColor="#ff6700" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Brand Header */}
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.appName}>LoanHub</Text>
          </View>
          <Text style={styles.tagline}>Smart Loan Management</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.headerText}>Enter OTP</Text>
          <Text style={styles.instructionText}>
            We sent a 6-digit verification code to{' '}
            <Text style={styles.highlightEmail}>{email}</Text>.
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                style={styles.otpInput}
                value={digit}
                onChangeText={text => handleChange(text, index)}
                keyboardType="numeric"
                maxLength={1}
                ref={el => (inputRefs.current[index] = el)}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.verifyButtonContainer,
              (otp.some(d => d === '') || loading) && styles.verifyButtonDisabled,
            ]}
            onPress={handleVerify}
            disabled={otp.some(d => d === '') || loading}>
            <LinearGradient
              colors={['#ff6700', '#ff7900', '#ff8500']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.verifyButtonGradient}>
              <Text style={styles.verifyButtonText}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Text>
              {!loading && (
                <Ionicons name="shield-checkmark-outline" size={20} color="#FFFFFF" />
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Resend OTP Section */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendHint}>
              Didn't receive the code?{' '}
            </Text>
            {countdown > 0 ? (
              <Text style={styles.countdownText}>
                Resend in {countdown}s
              </Text>
            ) : (
              <TouchableOpacity
                onPress={handleResendOtp}
                disabled={resendLoading}>
                <Text style={[
                  styles.resendLink,
                  resendLoading && styles.resendLinkDisabled
                ]}>
                  {resendLoading ? 'Sending...' : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Back Button */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Wrong email? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.footerLink}>Go Back</Text>
            </TouchableOpacity>
          </View>
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
    paddingVertical: m(40),
    justifyContent: 'center',
    backgroundColor: '#ff6700',
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: m(10),
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(8),
  },
  appName: {
    fontSize: FontSizes['4xl'],
    fontFamily: FontFamily.secondaryBold,
    color: '#FFFFFF',
  },
  tagline: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.secondaryRegular,
    color: '#FFFFFF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(20),
    padding: m(24),
    marginTop: m(20),
    borderWidth: 1,
    borderColor: '#FFEDD5',
    elevation: 8,
    shadowColor: '#ff6700',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  headerText: {
    fontSize: FontSizes['3xl'],
    color: '#333',
    fontFamily: FontFamily.secondaryBold,
    textAlign: 'center',
    marginBottom: m(4),
  },
  instructionText: {
    fontSize: FontSizes.md,
    color: '#666',
    fontFamily: FontFamily.primaryRegular,
    textAlign: 'center',
    marginBottom: m(24),
  },
  highlightEmail: {
    fontFamily: FontFamily.primarySemiBold,
    color: '#ff6700',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: m(30),
  },
  otpInput: {
    height: m(60),
    width: '14%',
    borderColor: '#FFEDD5',
    borderWidth: m(1),
    borderRadius: m(8),
    textAlign: 'center',
    fontSize: FontSizes['2xl'],
    fontFamily: FontFamily.primaryRegular,
    color: '#333333',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: m(2)},
    shadowOpacity: 0.1,
    shadowRadius: m(4),
  },
  verifyButtonContainer: {
    borderRadius: m(12),
    marginTop: m(16),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#ff6700',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  verifyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Platform.OS === 'android' ? m(16) : m(0),
    gap: m(8),
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.primarySemiBold,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
    paddingVertical: Platform.OS === 'android' ? m(0) : m(16),
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: m(16),
  },
  resendHint: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#777',
  },
  countdownText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primarySemiBold,
    color: '#ff6700',
  },
  resendLink: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primarySemiBold,
    color: '#ff6700',
    textDecorationLine: 'underline',
  },
  resendLinkDisabled: {
    opacity: 0.6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: m(20),
  },
  footerText: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primaryRegular,
    color: '#666',
  },
  footerLink: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: '#ff6700',
  },
});
