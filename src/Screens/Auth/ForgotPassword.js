import React, {useState} from 'react';
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
import {useDispatch} from 'react-redux';
import {forgotPassword} from '../../Redux/Slices/authslice';
import Toast from 'react-native-toast-message';
import {m} from 'walstar-rn-responsive';
import {FontFamily, FontSizes} from '../../constants';

export default function ForgotPassword({navigation}) {
  const dispatch = useDispatch();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Validate Email Format
  const validateEmail = text => {
    setEmail(text);
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (emailRegex.test(text)) {
      setEmailError('');
    } else {
      setEmailError('Please enter a valid email address.');
    }
  };

  // Check if form is valid
  const isFormValid = () => email.length > 0 && !emailError;

  // Handle form submission (forgot password)
  const handleForgotPassword = async () => {
    if (isFormValid()) {
      try {
        const response = await dispatch(forgotPassword(email));

        if (
          response?.payload?.message === 'Verification code sent to your email'
        ) {
          navigation.navigate('OTP', {email});

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
      }
    } else {
      alert('Please enter a valid email address.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
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
          <Text style={styles.headerText}>Forgot Password</Text>
          <Text style={styles.instructionText}>
            Enter your registered email address to receive a one-time password (OTP).
          </Text>

          {/* Email Input Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View
              style={[
                styles.inputContainer,
                !!emailError && styles.inputError,
                isFormValid() && styles.inputSuccess,
              ]}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={emailError ? '#FF4444' : isFormValid() ? '#28a745' : '#ff7900'}
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
              {isFormValid() && (
                <Ionicons name="checkmark-circle" size={20} color="#28a745" />
              )}
            </View>
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.continueButtonContainer,
              (!isFormValid()) && styles.continueButtonDisabled,
            ]}
            onPress={handleForgotPassword}
            disabled={!isFormValid()}>
            <LinearGradient
              colors={['#ff6700', '#ff7900', '#ff8500']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.continueButtonGradient}>
              <Text style={styles.continueButtonText}>Send OTP</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Back to Login */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Remembered your password? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign In</Text>
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
    backgroundColor: '#f8f8f8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: m(20),
    paddingVertical: m(40),
    justifyContent: 'center',
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
    color: '#ff6700',
  },
  tagline: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.secondaryRegular,
    color: '#ff6700',
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
    fontSize: FontSizes['2xl'],
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
  inputSuccess: {
    borderColor: '#28a745',
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
    fontSize: FontSizes.base,
    color: '#FF4444',
    fontFamily: FontFamily.primaryRegular,
    marginTop: m(4),
    marginLeft: m(4),
  },
  continueButtonContainer: {
    borderRadius: m(12),
    marginTop: m(8),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#ff6700',
    shadowOffset: {width: 0, height: 4},
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
    opacity: 0.6,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.primarySemiBold,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: {width: 1, height: 1},
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
    fontFamily: FontFamily.primaryRegular,
    color: '#666',
  },
  footerLink: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: '#ff6700',
  },
});
