import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import Toast from 'react-native-toast-message';
import { m } from '../../../Utils/responsive';
import { colors, FontFamily } from '../../../constants';
import { ScreenWrapper } from '../../../Components/common';
import { userAPI } from '../../../Services/userService';

const ChangePasswordScreen = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitted, setSubmitted] = useState(false);

  const newPasswordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const getPasswordStrength = (password) => {
    if (!password) return { level: 0, label: '', color: '#E5E7EB' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { level: 1, label: 'Weak', color: '#EF4444' };
    if (score <= 2) return { level: 2, label: 'Fair', color: '#F59E0B' };
    if (score <= 3) return { level: 3, label: 'Good', color: '#3B82F6' };
    return { level: 4, label: 'Strong', color: '#00D09E' };
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const passwordsMatch = confirmNewPassword.length > 0 && newPassword === confirmNewPassword;
  const passwordsMismatch = submitted && confirmNewPassword.length > 0 && newPassword !== confirmNewPassword;

  const hasMinLength = newPassword.length >= 8;
  const hasMixedCase = /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword);
  const hasNumberAndSymbol = /[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword);

  const validate = () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
      Toast.show({ type: 'error', text1: 'All fields are required' });
      return false;
    }
    if (!hasMinLength) {
      Toast.show({ type: 'error', text1: 'New password must be at least 8 characters' });
      return false;
    }
    if (!hasMixedCase) {
      Toast.show({ type: 'error', text1: 'New password must include uppercase & lowercase letters' });
      return false;
    }
    if (!hasNumberAndSymbol) {
      Toast.show({ type: 'error', text1: 'New password must include numbers and symbols' });
      return false;
    }
    if (newPassword !== confirmNewPassword) {
      Toast.show({ type: 'error', text1: 'New password and confirm password do not match' });
      return false;
    }
    if (currentPassword === newPassword) {
      Toast.show({ type: 'error', text1: 'New password must be different from current password' });
      return false;
    }
    return true;
  };

  const handleChangePassword = async () => {
    setSubmitted(true);
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await userAPI.changePassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
        confirmNewPassword: confirmNewPassword.trim(),
      });

      if (response?.success) {
        Toast.show({ type: 'success', text1: response.message || 'Password changed successfully' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setSubmitted(false);
        setTimeout(() => navigation.goBack(), 1200);
      }
    } catch (error) {
      const message =
        error.response?.data?.message || 'Something went wrong. Please try again.';
      Toast.show({ type: 'error', text1: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper
      backgroundColor={colors.backgroundGreenWhite}
      topInsetBg={colors.primary}
      statusBarColor={colors.primary}
      statusBarStyle="dark-content"
      includeTabBarClearance={false}
      scrollable={false}
    >
      <KeyboardAvoidingView
        style={styles.pageWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Fixed Top Mint Green Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={m(22)} color={colors.white} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Change Password</Text>

          <View style={styles.headerPlaceholder} />
        </View>

        {/* Curved Sheet Container */}
        <View style={styles.sheetSection}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Hero Security Icon */}
            <View style={styles.heroSection}>
              <View style={styles.heroOuterCircle}>
                <View style={styles.heroInnerCircle}>
                  <Feather name="shield" size={m(26)} color={colors.white} />
                </View>
              </View>
              <Text style={styles.heroTitle}>Secure Your Account</Text>
              <Text style={styles.heroSubtitle}>
                Keep your account protected by updating your password regularly
              </Text>
            </View>

            {/* Form Fields - Pastel Mint Input Style */}
            <View style={styles.formContainer}>
              {/* Current Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Current Password *</Text>
                <View style={styles.inputContainer}>
                  <Feather
                    name="key"
                    size={m(16)}
                    color={colors.lettersAndIcons}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Enter current password"
                    placeholderTextColor="#7E9D86"
                    secureTextEntry={!showCurrentPassword}
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={() => newPasswordRef.current?.focus()}
                  />
                  <TouchableOpacity
                    onPress={() => setShowCurrentPassword(prev => !prev)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather
                      name={showCurrentPassword ? 'eye' : 'eye-off'}
                      size={m(17)}
                      color={colors.lettersAndIcons}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* New Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>New Password *</Text>
                <View style={styles.inputContainer}>
                  <Feather
                    name="lock"
                    size={m(16)}
                    color={colors.lettersAndIcons}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    ref={newPasswordRef}
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Enter new password"
                    placeholderTextColor="#7E9D86"
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword(prev => !prev)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather
                      name={showNewPassword ? 'eye' : 'eye-off'}
                      size={m(17)}
                      color={colors.lettersAndIcons}
                    />
                  </TouchableOpacity>
                </View>

                {/* Password Strength Bar */}
                {newPassword.length > 0 && (
                  <View style={styles.strengthSection}>
                    <View style={styles.strengthTrack}>
                      {[1, 2, 3, 4].map(i => (
                        <View
                          key={i}
                          style={[
                            styles.strengthSegment,
                            {
                              backgroundColor:
                                i <= passwordStrength.level ? passwordStrength.color : '#D5EBD7',
                            },
                          ]}
                        />
                      ))}
                    </View>
                    <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                      {passwordStrength.label}
                    </Text>
                  </View>
                )}
              </View>

              {/* Confirm New Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Confirm New Password *</Text>
                <View style={styles.inputContainer}>
                  <Feather
                    name="check-circle"
                    size={m(16)}
                    color={colors.lettersAndIcons}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    ref={confirmPasswordRef}
                    style={styles.input}
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                    placeholder="Re-enter new password"
                    placeholderTextColor="#7E9D86"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handleChangePassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(prev => !prev)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather
                      name={showConfirmPassword ? 'eye' : 'eye-off'}
                      size={m(17)}
                      color={colors.lettersAndIcons}
                    />
                  </TouchableOpacity>
                </View>

                {passwordsMismatch && (
                  <View style={styles.mismatchRow}>
                    <Feather name="alert-circle" size={m(13)} color="#EF4444" />
                    <Text style={styles.mismatchText}>Passwords do not match</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Password Tips Checklist Card */}
            <View style={styles.tipsCard}>
              <View style={styles.tipsHeader}>
                <Feather name="info" size={m(14)} color={colors.primary} />
                <Text style={styles.tipsTitle}>Password Requirements</Text>
              </View>
              <View style={styles.tipsList}>
                {[
                  { label: 'At least 8 characters long', met: hasMinLength },
                  { label: 'Mix uppercase & lowercase letters', met: hasMixedCase },
                  { label: 'Include numbers and symbols', met: hasNumberAndSymbol },
                ].map((tip, i) => (
                  <View key={i} style={styles.tipItem}>
                    <Feather
                      name={tip.met ? 'check' : 'circle'}
                      size={m(13)}
                      color={tip.met ? colors.primary : '#94A3B8'}
                    />
                    <Text
                      style={[
                        styles.tipText,
                        { color: tip.met ? colors.lettersAndIcons : '#64748B' },
                      ]}
                    >
                      {tip.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Action Buttons: Mint Green Pill & Cancel */}
            <View style={styles.actionSection}>
              <TouchableOpacity
                style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
                activeOpacity={0.85}
                onPress={handleChangePassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.lettersAndIcons} />
                ) : (
                  <Text style={styles.saveBtnText}>Update Password</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                activeOpacity={0.7}
                onPress={() => navigation.goBack()}
                disabled={loading}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  pageWrapper: {
    flex: 1,
    backgroundColor: colors.primary,
  },

  // Fixed Top Mint Green Header
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: m(18),
    paddingTop: m(12),
    paddingBottom: m(16),
  },
  backBtn: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    backgroundColor: 'rgba(9, 48, 48, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: m(19),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: m(36),
  },

  // Curved Sheet
  sheetSection: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(36),
    borderTopRightRadius: m(36),
    paddingTop: m(16),
  },
  scrollContent: {
    paddingHorizontal: m(18),
    paddingBottom: m(90),
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingVertical: m(14),
    marginBottom: m(8),
  },
  heroOuterCircle: {
    width: m(76),
    height: m(76),
    borderRadius: m(38),
    backgroundColor: colors.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(12),
  },
  heroInnerCircle: {
    width: m(50),
    height: m(50),
    borderRadius: m(25),
    backgroundColor: '#52A6FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#52A6FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  heroTitle: {
    fontSize: m(18),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(4),
  },
  heroSubtitle: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: '#5A7A71',
    textAlign: 'center',
    lineHeight: m(17),
    paddingHorizontal: m(20),
  },

  // Form Container
  formContainer: {
    marginTop: m(6),
  },
  fieldGroup: {
    marginBottom: m(14),
  },
  fieldLabel: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(6),
    marginLeft: m(4),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGreen,
    borderRadius: m(18),
    height: m(50),
    paddingHorizontal: m(16),
  },
  inputIcon: {
    marginRight: m(10),
  },
  input: {
    flex: 1,
    fontSize: m(14),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
    padding: 0,
  },

  // Strength Bar
  strengthSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: m(6),
    paddingHorizontal: m(4),
  },
  strengthTrack: {
    flex: 1,
    flexDirection: 'row',
    gap: m(4),
    marginRight: m(10),
  },
  strengthSegment: {
    flex: 1,
    height: m(4),
    borderRadius: m(2),
  },
  strengthText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryBold,
  },

  // Mismatch
  mismatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
    marginTop: m(6),
    marginLeft: m(4),
  },
  mismatchText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryMedium,
    color: '#EF4444',
  },

  // Tips Card
  tipsCard: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(14),
    marginTop: m(4),
    marginBottom: m(18),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    marginBottom: m(10),
  },
  tipsTitle: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  tipsList: {
    gap: m(6),
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
  },
  tipText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
  },

  // Actions
  actionSection: {
    gap: m(10),
    marginTop: m(4),
  },
  saveBtn: {
    backgroundColor: colors.primary,
    height: m(50),
    borderRadius: m(25),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnDisabled: {
    opacity: 0.65,
  },
  saveBtnText: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  cancelBtn: {
    height: m(46),
    borderRadius: m(23),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(9, 48, 48, 0.15)',
  },
  cancelBtnText: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
});

export default ChangePasswordScreen;
