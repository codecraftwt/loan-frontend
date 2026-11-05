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
import Toast from 'react-native-toast-message';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch } from 'react-redux';
import { resetPassword } from '../../Redux/Slices/authslice';
import { m } from 'walstar-rn-responsive';
import { FontFamily, FontSizes, colors } from '../../constants';
import LinearGradient from 'react-native-linear-gradient';

const GRADIENT_INDIGO = '#23305c';
const GRADIENT_TEAL = '#1b6b5c';

export default function CreatePass({ navigation, route }) {
  const { email, otp } = route.params || {};
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch();

  // Keyboard avoidance handling
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(m(260));
  const scrollViewRef = useRef(null);

  const scrollToCard = useCallback((yOffset = m(140)) => {
    [80, 200, 350].forEach(delay => {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
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

  const validatePassword = password => {
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasDigits = /\d/.test(password);
    return password.length >= 6 && hasLetters && hasDigits;
  };

  const isPasswordValid = validatePassword(newPassword);
  const isConfirmMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;

  const handleApply = async () => {
    if (isSubmitting) return;

    if (!newPassword) {
      Toast.show({
        type: 'info',
        position: 'top',
        text1: 'Please enter a new password.',
      });
      return;
    }

    if (!validatePassword(newPassword)) {
      Toast.show({
        type: 'info',
        position: 'top',
        text1:
          'Password must be at least 6 characters and contain letters and numbers.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'info',
        position: 'top',
        text1: 'Passwords do not match!',
      });
      return;
    }

        setIsSubmitting(true);
      try {
        await dispatch(
          resetPassword({ email, otp, newPassword }),
        ).unwrap();

        Toast.show({
          type: 'success',
          position: 'top',
          text1: 'Password reset successfully',
        });

        navigation.navigate('Login');
      } catch (err) {
        Toast.show({
          type: 'error',
          position: 'top',
          text1: err?.message || err || 'Failed to reset password',
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    const isButtonDisabled =
      !isPasswordValid || !isConfirmMatch || isSubmitting;

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
                            name="lock-closed-outline"
                            size={m(34)}
                            color={GRADIENT_TEAL}
                          />
                        </View>
                        <Text style={styles.headerText}>Create New Password</Text>
                        <Text style={styles.instructionText}>
                          Set a strong password that includes at least 6 characters with both
                          letters and numbers.
                        </Text>

                        {/* New Password Input */}
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>New Password</Text>
                          <View
                            style={[
                              styles.inputContainer,
                              isPasswordValid && styles.inputSuccess,
                            ]}>
                            <Ionicons
                              name="lock-closed-outline"
                              size={20}
                              color={isPasswordValid ? colors.success : GRADIENT_TEAL}
                              style={styles.inputIcon}
                            />
                          <TextInput
                            style={styles.input}
                            placeholder="Enter new password"
                            secureTextEntry={!passwordVisible}
                            placeholderTextColor="#999"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            onFocus={() => {
                              setIsKeyboardVisible(true);
                              scrollToCard(m(140));
                            }}
                          />
                          {isPasswordValid && (
                            <Ionicons
                              name="checkmark-circle"
                              size={20}
                              color={colors.success}
                              style={{ marginRight: m(8) }}
                            />
                          )}
                          <TouchableOpacity
                            onPress={() => setPasswordVisible(!passwordVisible)}
                            style={styles.eyeButton}>
                            <Ionicons
                              name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                              size={20}
                              color={GRADIENT_TEAL}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>

                          {/* Confirm Password Input */}
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Confirm Password</Text>
                            <View
                              style={[
                                styles.inputContainer,
                                isConfirmMatch && styles.inputSuccess,
                              ]}>
                              <Ionicons
                                name="lock-closed-outline"
                                size={20}
                                color={isConfirmMatch ? colors.success : GRADIENT_TEAL}
                                style={styles.inputIcon}
                              />
                            <TextInput
                              style={styles.input}
                              placeholder="Re-enter new password"
                              secureTextEntry={!confirmVisible}
                              placeholderTextColor="#999"
                              value={confirmPassword}
                              onChangeText={setConfirmPassword}
                              onFocus={() => {
                                setIsKeyboardVisible(true);
                                scrollToCard(m(180));
                              }}
                            />
                            {isConfirmMatch && (
                              <Ionicons
                                name="checkmark-circle"
                                size={20}
                                color={colors.success}
                                style={{ marginRight: m(8) }}
                              />
                            )}
                            <TouchableOpacity
                              onPress={() => setConfirmVisible(!confirmVisible)}
                              style={styles.eyeButton}>
                              <Ionicons
                                name={confirmVisible ? 'eye-off-outline' : 'eye-outline'}
                                size={20}
                                color={GRADIENT_TEAL}
                              />
                            </TouchableOpacity>
                          </View>
                      </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                      style={[
                        styles.applyButtonContainer,
                        isButtonDisabled && styles.applyButtonDisabled,
                      ]}
                      onPress={handleApply}
                      disabled={isButtonDisabled}>
                      <LinearGradient
                        colors={[GRADIENT_INDIGO, GRADIENT_TEAL]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.applyButtonGradient}>
                        <Text style={styles.applyButtonText}>
                          {isSubmitting ? 'Updating...' : 'Reset Password'}
                        </Text>
                        {!isSubmitting && (
                          <Ionicons
                            name="arrow-forward"
                            size={20}
                            color="#FFFFFF"
                          />
                        )}
                      </LinearGradient>
                    </TouchableOpacity>

                      <View style={styles.footer}>
                        <Text style={styles.footerText}>Remember your password? </Text>
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
          inputGroup: {
          marginBottom: m(16),
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
          eyeButton: {
            padding: m(4),
  },
          applyButtonContainer: {
            borderRadius: m(12),
          marginTop: m(12),
          overflow: 'hidden',
          elevation: 4,
          shadowColor: GRADIENT_TEAL,
          shadowOffset: {width: 0, height: 4},
          shadowOpacity: 0.3,
          shadowRadius: 6,
  },
          applyButtonGradient: {
            flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: Platform.OS === 'android' ? m(16) : m(0),
          gap: m(8),
  },
          applyButtonDisabled: {
          opacity: 0.5,
  },
          applyButtonText: {
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
          fontFamily: FontFamily.bodyRegular,
          color: '#666',
  },
          footerLink: {
            fontSize: FontSizes.base,
          fontFamily: FontFamily.primarySemiBold,
          color: GRADIENT_TEAL,
  },
});
