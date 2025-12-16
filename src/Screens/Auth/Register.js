import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch } from 'react-redux';
import { registerUser } from '../../Redux/Slices/authslice';
import Toast from 'react-native-toast-message';
import { m } from 'walstar-rn-responsive';

const { height } = Dimensions.get('window');

export default function Register({ navigation }) {
  const [name, setName] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const [nameError, setNameError] = useState('');
  const [aadharError, setAadharError] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const dispatch = useDispatch();

  const validateName = text => {
    setName(text);
    if (text.length < 1) {
      setNameError('Name is required.');
    } else {
      setNameError('');
    }
  };

  const validateAadhar = text => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 12) {
      setAadharNumber(numericText);
      setAadharError(
        numericText.length < 12 ? 'Aadhar number must be 12 digits.' : '',
      );
    }
  };

  const validateMobile = text => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 10) {
      setMobileNumber(numericText);
      setMobileError(
        numericText.length < 10 ? 'Mobile number must be 10 digits.' : '',
      );
    }
  };

  const validateEmail = text => {
    setEmail(text);
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(text)) {
      setEmailError('Please enter a valid email address.');
    } else {
      setEmailError('');
    }
  };

  const validateAddress = text => {
    setAddress(text);
    if (text.length < 1) {
      setAddressError('Address is required.');
    } else {
      setAddressError('');
    }
  };

  const validatePassword = text => {
    setPassword(text);
    if (text.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
    } else if (confirmPassword && text !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
    } else {
      setPasswordError('');
      if (confirmPassword && text === confirmPassword) {
        setConfirmPasswordError('');
      }
    }
  };

  const validateConfirmPassword = text => {
    setConfirmPassword(text);
    if (text !== password) {
      setConfirmPasswordError('Passwords do not match.');
    } else {
      setConfirmPasswordError('');
    }
  };

  const isFormValid = () => {
    return (
      name &&
      aadharNumber.length === 12 &&
      mobileNumber.length === 10 &&
      email &&
      address &&
      password.length >= 6 &&
      password === confirmPassword
    );
  };

  const handleRegister = async () => {
    if (!isFormValid()) {
      Alert.alert('Invalid Form', 'Please fill in all fields correctly.');
      return;
    }

    const payload = {
      userName: name,
      aadharCardNo: aadharNumber,
      mobileNo: mobileNumber,
      email: email,
      address: address,
      password: password,
    };

    try {
      await dispatch(registerUser(payload)).unwrap();

      Toast.show({
        type: 'success',
        position: 'top',
        text1: 'Account created successfully!',
      });

      navigation.navigate('Login');
    } catch (error) {
      console.log(error, 'Error while creating user');
      Toast.show({
        type: 'error',
        position: 'top',
        text1: error.message || 'Registration failed. Please try again.',
      });
    }
  };

  const InputField = ({
    label,
    value,
    onChangeText,
    error,
    placeholder,
    keyboardType = 'default',
    secureTextEntry = false,
    icon,
    showEyeIcon = false,
    onToggleVisibility,
    maxLength,
    isLastField = false
  }) => (
    <View style={[styles.inputGroup, isLastField && styles.lastInputGroup]}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[
        styles.inputContainer,
        error ? styles.inputError : {},
        (keyboardType === 'numeric' && value?.length === maxLength) && styles.inputSuccess
      ]}>
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={error ? '#FF4444' : (keyboardType === 'numeric' && value?.length === maxLength) ? '#28a745' : '#ff7900'}
            style={styles.inputIcon}
          />
        )}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          maxLength={maxLength}
        />
        {showEyeIcon && (
          <TouchableOpacity
            onPress={onToggleVisibility}
            style={styles.eyeButton}>
            <Ionicons
              name={secureTextEntry ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#ff7900"
            />
          </TouchableOpacity>
        )}
        {(keyboardType === 'numeric' && value?.length === maxLength) && (
          <Ionicons name="checkmark-circle" size={20} color="#28a745" />
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <StatusBar barStyle="light-content" backgroundColor="#ff6700" />

      {/* Orange Gradient Header - Exactly matching Login */}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View
          style={styles.gradientHeader}>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Text style={styles.appName}>LoanHub</Text>
            </View>
            <Text style={styles.tagline}>Smart Loan Management</Text>
          </View>
        </View>

        {/* Form Card - Same styling as Login */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Join LoanHub</Text>
          <Text style={styles.formSubtitle}>Start managing your loans today</Text>

          {/* Form Fields */}
          <InputField
            label="Full Name"
            value={name}
            onChangeText={validateName}
            error={nameError}
            placeholder="Enter your full name"
            icon="person-outline"
          />

          <InputField
            label="Aadhar Card Number"
            value={aadharNumber}
            onChangeText={validateAadhar}
            error={aadharError}
            placeholder="Enter 12 digit Aadhar number"
            keyboardType="numeric"
            icon="id-card-outline"
            maxLength={12}
          />

          <InputField
            label="Mobile Number"
            value={mobileNumber}
            onChangeText={validateMobile}
            error={mobileError}
            placeholder="Enter 10 digit mobile number"
            keyboardType="phone-pad"
            icon="call-outline"
            maxLength={10}
          />

          <InputField
            label="Email Address"
            value={email}
            onChangeText={validateEmail}
            error={emailError}
            placeholder="Enter your email"
            keyboardType="email-address"
            icon="mail-outline"
          />

          <InputField
            label="Address"
            value={address}
            onChangeText={validateAddress}
            error={addressError}
            placeholder="Enter your full address"
            icon="location-outline"
          />

          <InputField
            label="Password"
            value={password}
            onChangeText={validatePassword}
            error={passwordError}
            placeholder="Create a password (min. 6 characters)"
            secureTextEntry={!passwordVisible}
            icon="lock-closed-outline"
            showEyeIcon={true}
            onToggleVisibility={() => setPasswordVisible(!passwordVisible)}
          />

          <InputField
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={validateConfirmPassword}
            error={confirmPasswordError}
            placeholder="Confirm your password"
            secureTextEntry={!confirmPasswordVisible}
            icon="lock-closed-outline"
            showEyeIcon={true}
            onToggleVisibility={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
            isLastField={true}
          />

          {/* Terms Agreement - Orange Theme */}
          <View style={styles.termsContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#28a745" />
            <Text style={styles.termsText}>
              By creating an account, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>

          {/* Register Button with Orange Gradient */}
          <TouchableOpacity
            style={[
              styles.registerButtonContainer,
              !isFormValid() && styles.registerButtonDisabled
            ]}
            onPress={handleRegister}
            disabled={!isFormValid()}>
            <LinearGradient
              colors={['#ff6700', '#ff7900', '#ff8500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.registerButtonGradient}>
              <Text style={styles.registerButtonText}>Create Account</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Login Link - Orange Theme */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Info - Orange Theme */}
        <View style={styles.securityInfo}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#ff7900" />
          <Text style={styles.securityText}>
            Your data is secured with bank-level encryption
          </Text>
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

  // Orange Gradient Header - EXACTLY matching Login screen
  gradientHeader: {
    // height: m(160),
    // borderBottomLeftRadius: m(25),
    // borderBottomRightRadius: m(25),
    paddingTop: Platform.OS === 'ios' ? m(50) : m(38),
    paddingHorizontal: m(20),
  },
  headerContent: {
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? m(10) : m(5),
  },
  appName: {
    fontSize: m(32),
    fontWeight: '700',
    color: '#ff6700',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  tagline: {
    fontSize: m(16),
    color: '#ff6700',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // ScrollView for better keyboard handling
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: m(20),
    paddingTop: m(10),
    paddingBottom: m(100),
  },

  // Form Card - EXACTLY matching Login styling
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(20),
    padding: m(24),
    marginTop: m(-40),
    marginBottom: m(20),
    borderWidth: 1,
    borderColor: '#FFEDD5',
    elevation: 8,
    shadowColor: '#ff6700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    marginTop: m(30)
  },
  formTitle: {
    fontSize: m(24),
    fontWeight: '700',
    color: '#333',
    marginBottom: m(4),
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: m(14),
    color: '#666',
    marginBottom: m(24),
    textAlign: 'center',
  },

  // Input Groups - EXACTLY matching Login
  inputGroup: {
    marginBottom: m(20),
  },
  lastInputGroup: {
    marginBottom: m(24),
  },
  inputLabel: {
    fontSize: m(14),
    fontWeight: '500',
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
    fontSize: m(16),
    color: '#333',
    padding: 0,
  },
  eyeButton: {
    padding: m(4),
    marginLeft: m(8),
  },
  errorText: {
    fontSize: m(12),
    color: '#FF4444',
    marginTop: m(4),
    marginLeft: m(4),
  },

  // Terms Agreement - Orange Theme
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: m(24),
    padding: m(12),
    backgroundColor: '#FFF7ED',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  termsText: {
    flex: 1,
    fontSize: m(12),
    color: '#7C2D12',
    marginLeft: m(8),
    lineHeight: m(18),
  },
  termsLink: {
    fontWeight: '600',
    color: '#C2410C',
  },

  // Register Button with Gradient - EXACTLY matching Login button
  registerButtonContainer: {
    borderRadius: m(12),
    marginBottom: m(24),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#ff6700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    marginTop: m(8),
  },
  registerButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Platform.OS === 'android' ? m(16) : m(0),
    gap: m(8),
  },
  registerButtonDisabled: {
    opacity: 0.5,
  },
  registerButtonText: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    paddingVertical: Platform.OS === 'android' ? m(0) : m(16),
  },

  // Login Link - Orange Theme
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: m(8),
  },
  loginText: {
    fontSize: m(14),
    color: '#666',
  },
  loginLink: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#ff6700',
  },

  // Security Info - Orange Theme
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
    padding: m(16),
    backgroundColor: '#FFFFFF',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#FFEDD5',
    marginBottom: m(20),
  },
  securityText: {
    fontSize: m(12),
    color: '#666',
  },
});