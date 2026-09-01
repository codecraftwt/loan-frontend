import React, { useState } from 'react';
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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch } from 'react-redux';
import { forgotPassword } from '../../Redux/Slices/authslice';
import Toast from 'react-native-toast-message';
import { m } from 'walstar-rn-responsive';
import { FontFamily, FontSizes, colors } from '../../constants';

const GRADIENT_INDIGO = '#23305c';
const GRADIENT_TEAL = '#1b6b5c';

export default function ForgotPassword({ navigation }) {
  const dispatch = useDispatch();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle email input change (do not show validation error while typing)
  const validateEmail = text => {
    setEmail(text);
    // Clear previous error when user starts editing again
    if (emailError) {
      setEmailError('');
    }
  };

  const isEmailFormatValid = () => {
    const trimmedEmail = email.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return trimmedEmail.length > 0 && emailRegex.test(trimmedEmail);
  };

  // Handle form submission (forgot password)
  const handleForgotPassword = async () => {
    if (isSubmitting) {
      return;
    }

    const trimmedEmail = email.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!trimmedEmail) {
      setEmailError('Please enter your email address.');
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setEmailError('');
    setIsSubmitting(true);

    try {
      const response = await dispatch(forgotPassword(trimmedEmail));

      if (
        response?.payload?.message === 'Verification code sent to your email'
      ) {
        navigation.navigate('OTP', { email: trimmedEmail });

        Toast.show({
          type: 'success',
          position: 'top',
          text1: response.payload.message,
        });
      } else {
        const errorMessage =
          response?.payload?.message ||
          response?.payload ||
          'An error occurred. Please try again.';

        Toast.show({
          type: 'error',
          position: 'top',
          text1: errorMessage,
        });
      }
    } catch (error) {
      console.error('Error during forgot password:', error);

      Toast.show({
        type: 'error',
        position: 'top',
        text1: error?.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar barStyle="light-content" backgroundColor={GRADIENT_INDIGO} />

      <LinearGradient
        colors={[GRADIENT_INDIGO, GRADIENT_TEAL]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Text style={styles.appName}>LoanHub</Text>
            </View>
            <Text style={styles.tagline}>Smart Loan Management</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.iconCircle}>
              <Ionicons name="key-outline" size={m(34)} color={GRADIENT_TEAL} />
            </View>
            <Text style={styles.headerText}>Forgot Password</Text>
            <Text style={styles.instructionText}>
              Enter your registered email address to receive a one-time password
              (OTP).
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View
                style={[
                  styles.inputContainer,
                  !!emailError && styles.inputError,
                  isEmailFormatValid() && !emailError && styles.inputSuccess,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={
                    emailError
                      ? colors.error
                      : isEmailFormatValid()
                      ? colors.success
                      : GRADIENT_TEAL
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={validateEmail}
                />
                {isEmailFormatValid() && !emailError && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.success}
                  />
                )}
              </View>
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[
                styles.continueButtonContainer,
                (isSubmitting || !email.trim()) &&
                  styles.continueButtonDisabled,
              ]}
              onPress={handleForgotPassword}
              disabled={isSubmitting || !email.trim()}
            >
              <LinearGradient
                colors={[GRADIENT_INDIGO, GRADIENT_TEAL]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.continueButtonGradient}
              >
                <Text style={styles.continueButtonText}>
                  {isSubmitting ? 'Sending...' : 'Send OTP'}
                </Text>
                {!isSubmitting && (
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Remembered your password? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerLink}>Sign In</Text>
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
    shadowOffset: { width: 0, height: 8 },
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
  inputGroup: {
    marginBottom: m(20),
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
    backgroundColor: colors.navyFaint,
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: colors.navyBorder,
    paddingHorizontal: m(16),
    height: m(56),
  },
  inputError: {
    borderColor: colors.error,
  },
  inputSuccess: {
    borderColor: colors.success,
  },
  inputIcon: {
    marginRight: m(12),
  },
  input: {
    flex: 1,
    fontSize: FontSizes.md,
    fontFamily: FontFamily.bodyRegular,
    color: '#333',
    padding: 0,
  },
  errorText: {
    fontSize: FontSizes.sm,
    color: colors.error,
    fontFamily: FontFamily.bodyRegular,
    marginTop: m(4),
    marginLeft: m(4),
  },
  continueButtonContainer: {
    borderRadius: m(12),
    marginTop: m(8),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: GRADIENT_TEAL,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Platform.OS === 'android' ? m(16) : m(0),
    gap: m(8),
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.primarySemiBold,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    paddingVertical: Platform.OS === 'android' ? m(0) : m(16),
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
  topBar: {
    paddingTop: Platform.OS === 'android' ? m(36) : m(52),
    paddingHorizontal: m(16),
    marginBottom: m(10),
  },
  backButton: {
    width: m(40),
    height: m(40),
    borderRadius: m(20),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});
