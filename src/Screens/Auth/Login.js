import React, {useState} from 'react';
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
  SafeAreaView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useDispatch, useSelector} from 'react-redux';
import {login} from '../../Redux/Slices/authslice';
import {getActivePlan} from '../../Redux/Slices/planPurchaseSlice';
import Toast from 'react-native-toast-message';
import {m} from 'walstar-rn-responsive';
import {FontFamily, colors} from '../../constants';

export default function LoginScreen({navigation}) {
  const [emailOrMobile, setEmailOrMobile] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [identifierError, setIdentifierError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const {isLoading} = useSelector(state => state.auth || {});
  const dispatch = useDispatch();

  const handleIdentifierChange = text => {
    setEmailOrMobile(text);
    if (identifierError) setIdentifierError('');
  };

  const handlePasswordChange = text => {
    setPassword(text);
    if (passwordError) setPasswordError('');
  };

  const handleLogin = () => {
    let hasError = false;
    let localIdError = '';
    let localPasswordError = '';

    const cleanInput = emailOrMobile.trim();

    if (!cleanInput) {
      localIdError = 'Username or email is required.';
      hasError = true;
    }

    if (!password) {
      localPasswordError = 'Password is required.';
      hasError = true;
    } else if (password.length < 6) {
      localPasswordError = 'Password must be at least 6 characters.';
      hasError = true;
    }

    setIdentifierError(localIdError);
    setPasswordError(localPasswordError);

    if (hasError) {
      return;
    }

    dispatch(login({emailOrMobile: cleanInput, password}))
      .unwrap()
      .then(userData => {
        if (userData?.roleId === 1) {
          dispatch(getActivePlan());
        }
        navigation.navigate('BottomNavigation');
      })
      .catch(error => {
        console.error('Error ->', error);
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.primary}
        translucent={false}
      />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Top Header Section with LoanHub & Tagline */}
          <View style={styles.headerSection}>
            <Text style={styles.appName}>LoanHub</Text>
            <Text style={styles.tagline} numberOfLines={1}>
              Smart Loan Management
            </Text>
          </View>

          {/* Bottom Sheet Card */}
          <View style={styles.sheetCard}>
            {/* Username Or Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username Or Email</Text>
              <View
                style={[
                  styles.inputContainer,
                  identifierError ? styles.inputErrorBorder : null,
                ]}>
                <TextInput
                  style={styles.input}
                  placeholder="example@example.com"
                  placeholderTextColor="#7E9D86"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={emailOrMobile}
                  onChangeText={handleIdentifierChange}
                />
              </View>
              {identifierError ? (
                <Text style={styles.errorText}>{identifierError}</Text>
              ) : null}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View
                style={[
                  styles.inputContainer,
                  passwordError ? styles.inputErrorBorder : null,
                ]}>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#7E9D86"
                  secureTextEntry={!passwordVisible}
                  value={password}
                  onChangeText={handlePasswordChange}
                />
                <TouchableOpacity
                  onPress={() => setPasswordVisible(!passwordVisible)}
                  style={styles.eyeButton}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Ionicons
                    name={passwordVisible ? 'eye-outline' : 'eye-off-outline'}
                    size={m(20)}
                    color={colors.lettersAndIcons}
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              {/* Log In Button */}
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  isLoading && styles.buttonDisabled,
                ]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.85}>
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.lettersAndIcons} />
                ) : (
                  <Text style={styles.loginButtonText}>Log In</Text>
                )}
              </TouchableOpacity>

              {/* Forgot Password Link */}
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={() => navigation.navigate('ForgotPassword')}
                activeOpacity={0.7}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Sign Up Button */}
              <TouchableOpacity
                style={styles.signUpButton}
                onPress={() => navigation.navigate('Register')}
                activeOpacity={0.85}>
                <Text style={styles.signUpButtonText}>Sign Up</Text>
              </TouchableOpacity>

              {/* Don't have an account? Sign Up */}
              <View style={styles.bottomSignUpRow}>
                <Text style={styles.bottomPromptText}>
                  Don't have an account?{' '}
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Register')}
                  activeOpacity={0.7}>
                  <Text style={styles.bottomSignUpLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  keyboardView: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },

  // Header Section - LoanHub branding
  headerSection: {
    paddingTop: Platform.OS === 'ios' ? m(82) : m(72),
    paddingBottom: m(66),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: m(20),
    width: '100%',
  },
  appName: {
    fontSize: m(32),
    lineHeight: m(40),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.lettersAndIcons,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  tagline: {
    fontSize: m(13.5),
    lineHeight: m(20),
    fontFamily: FontFamily.primaryRegular,
    fontStyle: 'italic',
    color: colors.lettersAndIcons,
    textAlign: 'center',
    marginTop: m(4),
    opacity: 0.88,
  },

  // Bottom Sheet
  sheetCard: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(44),
    borderTopRightRadius: m(44),
    paddingHorizontal: m(26),
    paddingTop: m(40),
    paddingBottom: m(28),
    minHeight: m(540),
  },

  // Input Groups
  inputGroup: {
    marginBottom: m(20),
  },
  inputLabel: {
    fontSize: m(14.5),
    lineHeight: m(20),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.lettersAndIcons,
    marginBottom: m(10),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGreen,
    borderRadius: m(26),
    height: m(52),
    paddingHorizontal: m(20),
  },
  inputErrorBorder: {
    borderWidth: 1,
    borderColor: '#E02424',
  },
  input: {
    flex: 1,
    fontSize: m(15),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
    padding: 0,
  },
  eyeButton: {
    padding: m(4),
  },
  errorText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: '#E02424',
    marginTop: m(5),
    marginLeft: m(14),
  },

  // Action Buttons
  actionsContainer: {
    marginTop: m(32),
  },
  loginButton: {
    backgroundColor: colors.primary,
    height: m(52),
    borderRadius: m(26),
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  loginButtonText: {
    fontSize: m(16.5),
    lineHeight: m(22),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  forgotPasswordButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(16),
  },
  forgotPasswordText: {
    fontSize: m(13.5),
    lineHeight: m(18),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.lettersAndIcons,
  },
  signUpButton: {
    backgroundColor: colors.lightGreen,
    height: m(52),
    borderRadius: m(26),
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpButtonText: {
    fontSize: m(16.5),
    lineHeight: m(22),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  // Bottom prompt row: "Don't have an account? Sign Up"
  bottomSignUpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: m(20),
    paddingBottom: m(8),
  },
  bottomPromptText: {
    fontSize: m(13.5),
    lineHeight: m(18),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  bottomSignUpLink: {
    fontSize: m(13.5),
    lineHeight: m(18),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.lightBlueButton, // #6DB6FE
  },
});