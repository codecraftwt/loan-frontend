import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Keyboard,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch } from 'react-redux';
import { verifyOtp, resendOtp } from '../../Redux/Slices/authslice';
import Toast from 'react-native-toast-message';
import { m } from 'walstar-rn-responsive';
import { FontFamily, FontSizes, colors } from '../../constants';
import { showAlert } from '../../Components/common';

const GRADIENT_INDIGO = '#23305c';
const GRADIENT_TEAL = '#1b6b5c';

export default function OTP({ navigation, route }) {
  const { email } = route.params || {};
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);


  // Keyboard avoidance handling
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(m(260));
  const scrollViewRef = useRef(null);

  const scrollToCard = useCallback(() => {
    [80, 200, 350].forEach(delay => {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: m(120), animated: true });
      }, delay);
    });
  }, []);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, e => {
      if (e?.endCoordinates?.height) {
        setKeyboardHeight(e.endCoordinates.height + m(40));
      }
      setIsKeyboardVisible(true);
      scrollToCard();
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [scrollToCard]);

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

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
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
      showAlert('Error', 'Please enter a complete 6-digit OTP.');
      return;
    }

    setLoading(true);

    try {
      const result = await dispatch(verifyOtp({ email, otp: otpCode })).unwrap();


      if (result.message === 'Invalid verification code') {
        showAlert('Error', 'The OTP you entered is invalid or expired.');
      } else {
        navigation.navigate('CreatePass', { email, otp: otpCode });

        Toast.show({
          type: 'success',
          position: 'top',
          text1: 'OTP verified successfully',
        });
      }
    } catch (err) {
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
      <StatusBar barStyle="light-content" backgroundColor={GRADIENT_INDIGO} />

            <LinearGradient
              colors={[GRADIENT_INDIGO, GRADIENT_TEAL]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientContainer}>
              <ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                contentContainerStyle={[
                  styles.scrollContent,
                  isKeyboardVisible && {
                    paddingBottom: keyboardHeight,
                    justifyContent: 'flex-start',
                  },
                ]}
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
            <View style={styles.iconCircle}>
              <Ionicons
                name="shield-checkmark-outline"
                size={m(34)}
                color={GRADIENT_TEAL}
              />
            </View>
            <Text style={styles.headerText}>Enter OTP</Text>
            <Text style={styles.instructionText}>
              We sent a 6-digit verification code to{' '}
              <Text style={styles.highlightEmail}>{email}</Text>.
            </Text>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  style={[
                    styles.otpInput,
                    !!digit && styles.otpInputFilled,
                  ]}
                  value={digit}
                  onChangeText={text => handleChange(text, index)}
                  onKeyPress={e => handleKeyPress(e, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  ref={el => (inputRefs.current[index] = el)}
                  onFocus={() => {
                    setIsKeyboardVisible(true);
                    scrollToCard();
                  }}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.verifyButtonContainer,
                (otp.some(d => d === '') || loading) &&
                  styles.verifyButtonDisabled,
              ]}
              onPress={handleVerify}
              disabled={otp.some(d => d === '') || loading}>
              <LinearGradient
                colors={[GRADIENT_INDIGO, GRADIENT_TEAL]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.verifyButtonGradient}>
                <Text style={styles.verifyButtonText}>
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </Text>
                {!loading && (
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color="#FFFFFF"
                  />
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Resend OTP Section */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendHint}>Didn't receive the code? </Text>
              {countdown > 0 ? (
                <Text style={styles.countdownText}>Resend in {countdown}s</Text>
              ) : (
                <TouchableOpacity
                  onPress={handleResendOtp}
                  disabled={resendLoading}>
                  <Text
                    style={[
                      styles.resendLink,
                      resendLoading && styles.resendLinkDisabled,
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
          </LinearGradient>
        </KeyboardAvoidingView>
        );
}

        const styles = StyleSheet.create({
          container: {
          flex: 1,
  },
        gradientContainer: {
          flex: 1,
  },
        scrollView: {
          flex: 1,
  },
        scrollContent: {
          flexGrow: 1,
        paddingHorizontal: m(20),
        paddingTop: m(12),
        paddingBottom: m(40),
        justifyContent: 'center',
  },
        headerContent: {
          alignItems: 'center',
        marginBottom: m(26),
  },
        logoContainer: {
          flexDirection: 'row',
        alignItems: 'center',
        marginBottom: m(8),
  },
        appName: {
          fontSize: FontSizes['4xl'],
        fontFamily: FontFamily.primaryBold,
        color: '#FFFFFF',
  },
        tagline: {
        fontSize: FontSizes.md,
        fontFamily: FontFamily.bodyRegular,
        color: '#FFFFFF',
        textAlign: 'center',
        fontStyle: 'italic',
  },
        iconCircle: {
          width: m(70),
        height: m(70),
        borderRadius: m(35),
        backgroundColor: colors.navyFaint,
        borderWidth: 1,
        borderColor: colors.navyBorder,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: m(18),
  },
        formCard: {
          backgroundColor: '#FFFFFF',
        borderRadius: m(20),
        padding: m(24),
        borderWidth: 1,
        borderColor: colors.navyBorder,
        elevation: 8,
        shadowColor: GRADIENT_TEAL,
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.15,
        shadowRadius: 12,
  },
        headerText: {
        fontSize: FontSizes['2xl'],
        color: '#333',
        fontFamily: FontFamily.primaryBold,
        textAlign: 'center',
        marginBottom: m(4),
  },
        instructionText: {
        fontSize: FontSizes.base,
        color: '#666',
        fontFamily: FontFamily.bodyRegular,
        textAlign: 'center',
        marginBottom: m(24),
        lineHeight: m(22),
  },
        highlightEmail: {
          fontFamily: FontFamily.primarySemiBold,
        color: GRADIENT_TEAL,
  },
        otpContainer: {
          flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: m(24),
  },
        otpInput: {
        height: m(56),
        width: '14.5%',
        borderColor: colors.navyBorder,
        borderWidth: 1.5,
        borderRadius: m(12),
        textAlign: 'center',
        fontSize: FontSizes['2xl'],
        fontFamily: FontFamily.primaryBold,
        color: '#333333',
        backgroundColor: colors.navyFaint,
  },
        otpInputFilled: {
          borderColor: GRADIENT_TEAL,
        backgroundColor: '#FFFFFF',
  },
        verifyButtonContainer: {
          borderRadius: m(12),
        marginTop: m(8),
        overflow: 'hidden',
        elevation: 4,
        shadowColor: GRADIENT_TEAL,
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
        opacity: 0.5,
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
        marginTop: m(20),
  },
        resendHint: {
        fontSize: FontSizes.base,
        fontFamily: FontFamily.bodyRegular,
        color: '#666',
  },
        countdownText: {
        fontSize: FontSizes.base,
        fontFamily: FontFamily.primarySemiBold,
        color: GRADIENT_TEAL,
  },
        resendLink: {
        fontSize: FontSizes.base,
        fontFamily: FontFamily.primarySemiBold,
        color: GRADIENT_TEAL,
        textDecorationLine: 'underline',
  },
        resendLinkDisabled: {
        opacity: 0.5,
  },
        footer: {
          flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: m(16),
  },
        footerText: {
          fontSize: FontSizes.base,
        fontFamily: FontFamily.bodyRegular,
        color: '#666',
  },
        footerLink: {
          fontSize: FontSizes.base,
        fontFamily: FontFamily.primarySemiBold,
        color: GRADIENT_TEAL,
  },
});
