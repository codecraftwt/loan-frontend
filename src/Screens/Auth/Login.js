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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../../Redux/Slices/authslice';
import { getActivePlan } from '../../Redux/Slices/planPurchaseSlice';
import Toast from 'react-native-toast-message';
import { m } from 'walstar-rn-responsive';
import { FontFamily, FontSizes } from '../../constants';

export default function LoginScreen({ navigation }) {
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [mobileError, setMobileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const { isLoading } = useSelector(state => state.auth || {});
  const dispatch = useDispatch();

  const validateMobile = text => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 10) {
      setMobileNumber(numericText);
      setMobileError('');
    }
  };

  const validatePassword = text => {
    setPassword(text);
    setPasswordError('');
  };

  const handleLogin = () => {
    let hasError = false;
    let localMobileError = '';
    let localPasswordError = '';

    if (!mobileNumber) {
      localMobileError = 'Mobile number is required.';
      hasError = true;
    } else if (mobileNumber.length !== 10) {
      localMobileError = 'Mobile number must be 10 digits.';
      hasError = true;
    }

    if (!password) {
      localPasswordError = 'Password is required.';
      hasError = true;
    } else if (password.length < 6) {
      localPasswordError = 'Password must be at least 6 characters.';
      hasError = true;
    }

    setMobileError(localMobileError);
    setPasswordError(localPasswordError);

    if (hasError) {
      return;
    }

    dispatch(login({ emailOrMobile: mobileNumber, password }))
      .unwrap()
      .then((userData) => {
        if (userData?.roleId === 1) {
          dispatch(getActivePlan());
        }
        navigation.navigate('BottomNavigation');
      })
      .catch(error => {
        console.error('Error ->', error);
        // Handle error message from backend
        const errorMessage =
          (typeof error === 'string' ? error : null) ||
          error?.message ||
          'Invalid credentials or network error. Please try again.';

        Toast.show({
          type: 'error',
          position: 'top',
          text1: errorMessage,
        });
      });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <LinearGradient
        colors={['#ff6700', '#ff8800ff', '#ff9100ff', '#ffa200ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        {/* ScrollView to prevent keyboard hiding content */}
        <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.appName}>LoanHub</Text>
          </View>
          <Text style={styles.tagline}>Smart Loan Management</Text>
        </View>
        {/* Login Form Card - EXACTLY your design */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Welcome Back</Text>
          <Text style={styles.formSubtitle}>Sign in to manage your loans</Text>

          {/* Mobile Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mobile Number</Text>
            <View style={[
              styles.inputContainer,
              mobileError ? styles.inputError : {},
              mobileNumber.length === 10 ? styles.inputSuccess : {}
            ]}>
              <Ionicons
                name="call-outline"
                size={20}
                color={mobileError ? '#FF4444' : mobileNumber.length === 10 ? '#28a745' : '#ff7900'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter 10 digit number"
                keyboardType="phone-pad"
                placeholderTextColor="#999"
                value={mobileNumber}
                onChangeText={validateMobile}
                maxLength={10}
              />
              {mobileNumber.length === 10 && (
                <Ionicons name="checkmark-circle" size={20} color="#28a745" />
              )}
            </View>
            {mobileError ? (
              <Text style={styles.errorText}>{mobileError}</Text>
            ) : null}
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={[
              styles.inputContainer,
              passwordError ? styles.inputError : {}
            ]}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={passwordError ? '#FF4444' : '#ff7900'}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Enter your password"
                secureTextEntry={!passwordVisible}
                placeholderTextColor="#999"
                value={password}
                onChangeText={validatePassword}
              />
              <TouchableOpacity
                onPress={() => setPasswordVisible(!passwordVisible)}
                style={styles.eyeButton}>
                <Ionicons
                  name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#ff7900"
                />
              </TouchableOpacity>
            </View>
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}
          </View>

          {/* Login Button with Orange Gradient */}
          <TouchableOpacity
            style={[
              styles.loginButtonContainer,
              (!mobileNumber || !password || isLoading) && styles.loginButtonDisabled
            ]}
            onPress={handleLogin}
            disabled={!mobileNumber || !password || isLoading}>
            <LinearGradient
              colors={['#ff6700', '#ff7900', '#ff8500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginButtonGradient}>
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Logging in...' : 'Sign In'}
              </Text>
              {!isLoading && (
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Alternative Actions */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}>
            <View
              style={styles.registerButtonGradient}>
              <Text style={styles.registerButtonText}>Create New Account</Text>
            </View>
          </TouchableOpacity>

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },

  headerContent: {
    borderBottomLeftRadius: m(25),
    borderBottomRightRadius: m(25),
    paddingTop: Platform.OS === 'ios' ? m(50) : m(40),
    backgroundColor: 'transparent',
    alignItems: 'center',
    marginTop: m(10),
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(12),
  },
  appName: {
    fontSize: FontSizes['4xl'],
    fontFamily: FontFamily.secondaryBold,
    color: '#ff6700',
  },
  tagline: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.secondaryRegular,
    color: '#ff6700',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // ScrollView to prevent keyboard hiding
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: m(40),
    // backgroundColor: '#f8f8f8'
    // backgroundColor: '#ff6700',
  },

  // Form Card
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(20),
    padding: m(24),
    marginTop: m(30),
    marginHorizontal: m(20),
    borderWidth: 1,
    borderColor: '#FFEDD5',
    elevation: 8,
    shadowColor: '#ff6700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  formTitle: {
    fontSize: FontSizes['2xl'],
    fontFamily: FontFamily.secondaryBold,
    color: '#333',
    marginBottom: m(4),
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primaryRegular,
    color: '#666',
    marginBottom: m(24),
    textAlign: 'center',
  },

  // Input Groups
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
  eyeButton: {
    padding: m(4),
  },
  errorText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#FF4444',
    marginTop: m(4),
    marginLeft: m(4),
  },

  // Login Button with Gradient
  loginButtonContainer: {
    borderRadius: m(12),
    marginTop: m(8),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#ff6700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Platform.OS === 'android' ? m(16) : m(0),
    gap: m(8),
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.primarySemiBold,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    paddingVertical: Platform.OS === 'android' ? m(0) : m(16),
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: m(24),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#FFEDD5',
  },
  dividerText: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primaryMedium,
    color: '#ff7900',
    marginHorizontal: m(16),
  },

  // Alternative Buttons
  registerButtonGradient: {
    paddingVertical: m(8),
    alignItems: 'center',
  },
  registerButtonText: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.primarySemiBold,
    color: '#ff6700',
  },

  // Forgot Password
  forgotPasswordButton: {
    alignItems: 'center',
    paddingVertical: m(8),
  },
  forgotPasswordText: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: '#ff7900',
  },
});