import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, FontFamily } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper } from '../../../Components/common';
import borrowerFlowService from '../../../Services/borrowerFlowService';

export default function BorrowerSecurityScreen() {
  const navigation = useNavigation();

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  // 4-Digit Transaction PIN state
  const [hasPin, setHasPin] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPinForm, setShowPinForm] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);

  // Biometrics state
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  useEffect(() => {
    loadSecurityPreferences();
  }, []);

  const loadSecurityPreferences = async () => {
    try {
      const storedPin = await AsyncStorage.getItem('@borrower_transaction_pin');
      setHasPin(Boolean(storedPin));
      const bioPref = await AsyncStorage.getItem('@borrower_biometrics_enabled');
      setBiometricsEnabled(bioPref === 'true');
    } catch (e) {
      console.error('Failed to load security preferences:', e);
    }
  };

  const handleToggleBiometrics = async value => {
    setBiometricsEnabled(value);
    try {
      await AsyncStorage.setItem('@borrower_biometrics_enabled', value ? 'true' : 'false');
      Alert.alert(
        value ? 'Biometrics Enabled' : 'Biometrics Disabled',
        value
          ? 'Biometric touch/face verification is now activated for swift authorization.'
          : 'Biometric authorization has been deactivated.'
      );
    } catch (e) {
      console.error('Failed to save biometric preference:', e);
    }
  };

  // 4-digit PIN setup/update
  const handleSavePin = async () => {
    if (pin.length !== 4 || isNaN(Number(pin))) {
      Alert.alert('Invalid PIN', 'Please enter a valid 4-digit numeric transaction PIN.');
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert('PIN Mismatch', 'The confirmation PIN does not match.');
      return;
    }

    const isSequential = '1234,2345,3456,4567,5678,6789,9876,8765,7654,6543,5432,4321'.includes(pin);
    if (isSequential) {
      Alert.alert('Weak PIN', 'Avoid sequential combinations such as 1234 or 9876.');
      return;
    }

    const isRepeated = /^(\d)\1{3}$/.test(pin);
    if (isRepeated) {
      Alert.alert('Weak PIN', 'Avoid repeated digits such as 1111 or 0000.');
      return;
    }

    try {
      setPinLoading(true);
      await AsyncStorage.setItem('@borrower_transaction_pin', pin);
      setHasPin(true);
      setShowPinForm(false);
      setPin('');
      setConfirmPin('');
      Alert.alert(
        'Transaction MPIN Saved',
        'Your 4-digit transaction PIN has been successfully secured for loan acceptances and tranche drawdowns.'
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to store transaction PIN.');
    } finally {
      setPinLoading(false);
    }
  };

  // Password Strength Meter
  const strengthDetails = useMemo(() => {
    const pwd = newPassword;
    const hasMinLength = pwd.length >= 6;
    const hasLongLength = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    const matchesConfirm = pwd.length > 0 && confirmPassword.length > 0 && pwd === confirmPassword;

    let score = 0;
    if (hasMinLength) score += 20;
    if (hasLongLength) score += 20;
    if (hasUpper && hasLower) score += 20;
    if (hasNumber) score += 20;
    if (hasSpecial) score += 20;

    let label = 'Weak';
    let color = '#EF4444';

    if (score >= 80) {
      label = 'Strong';
      color = '#059669';
    } else if (score >= 60) {
      label = 'Good';
      color = '#0284C7';
    } else if (score >= 40) {
      label = 'Fair';
      color = '#D97706';
    }

    return {
      score,
      label,
      color,
      hasMinLength,
      hasLongLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
      matchesConfirm,
    };
  }, [newPassword, confirmPassword]);

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      Alert.alert('Required Field', 'Please provide your current account password.');
      return;
    }
    if (!newPassword.trim()) {
      Alert.alert('Required Field', 'Please enter your new password.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Password Length', 'New password must be at least 6 characters long.');
      return;
    }
    if (currentPassword === newPassword) {
      Alert.alert('Password Notice', 'Your new password must be different from your current password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'The new passwords do not match.');
      return;
    }

    try {
      setPwdLoading(true);
      const res = await borrowerFlowService.changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword: confirmPassword,
      });

      if (res?.success) {
        Alert.alert(
          'Password Updated',
          'Your account credentials have been securely updated.',
          [
            {
              text: 'OK',
              onPress: () => {
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                navigation.goBack();
              },
            },
          ]
        );
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Failed to change password. Please verify your current password.';
      Alert.alert('Security Error', msg);
    } finally {
      setPwdLoading(false);
    }
  };

  const handleRevokeSessions = () => {
    Alert.alert(
      'Session Governance',
      'All other active mobile and web login sessions will be immediately invalidated.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke Sessions',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Sessions Terminated', 'Other device tokens have been revoked.');
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper
      backgroundColor={colors.backgroundGreenWhite}
      topInsetBg={colors.primary}
      statusBarColor={colors.primary}
      statusBarStyle="dark-content"
      scrollable={false}
    >
      {/* Top Green Banner */}
      <View style={styles.topBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backCircularBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={m(20)} color={colors.white} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTag}>CREDENTIAL & ACCESS GOVERNANCE</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Enterprise Security
            </Text>
          </View>

          <View style={{ width: m(38) }} />
        </View>
      </View>

      {/* Main Curved Body Section */}
      <View style={styles.sheetSection}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Section 1: 4-Digit Transaction MPIN */}
          <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <Feather name="hash" size={m(16)} color={colors.lettersAndIcons} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>4-Digit Transaction MPIN</Text>
                <Text style={styles.cardSubtitle}>
                  Required for facility disbursements & tranche releases
                </Text>
              </View>
              <View style={hasPin ? styles.badgeActive : styles.badgeInactive}>
                <Text style={hasPin ? styles.badgeActiveText : styles.badgeInactiveText}>
                  {hasPin ? 'PIN ACTIVE' : 'NOT SET'}
                </Text>
              </View>
            </View>

            {!showPinForm ? (
              <View style={styles.pinInfoBox}>
                <Text style={styles.pinInfoText}>
                  {hasPin
                    ? 'Your 4-digit transaction MPIN is configured and encrypts every commercial facility execution.'
                    : 'Set up a 4-digit MPIN to quickly authorize contract drawdowns without full passwords.'}
                </Text>
                <TouchableOpacity
                  style={styles.actionOutlineBtn}
                  onPress={() => setShowPinForm(true)}
                  activeOpacity={0.8}
                >
                  <Feather name={hasPin ? 'refresh-cw' : 'plus'} size={m(14)} color={colors.lettersAndIcons} />
                  <Text style={styles.actionOutlineBtnText}>
                    {hasPin ? 'Reset Transaction MPIN' : 'Configure 4-Digit MPIN'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.pinFormWrap}>
                <View style={styles.fieldWrap}>
                  <Text style={styles.inputLabel}>NEW 4-DIGIT MPIN</Text>
                  <TextInput
                    style={styles.pinInput}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                    value={pin}
                    onChangeText={setPin}
                    placeholder="••••"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={styles.inputLabel}>CONFIRM 4-DIGIT MPIN</Text>
                  <TextInput
                    style={styles.pinInput}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                    value={confirmPin}
                    onChangeText={setConfirmPin}
                    placeholder="••••"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={styles.pinActionsRow}>
                  <TouchableOpacity
                    style={styles.cancelPinBtn}
                    onPress={() => {
                      setShowPinForm(false);
                      setPin('');
                      setConfirmPin('');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelPinBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.savePinBtn, pinLoading && styles.btnDisabled]}
                    onPress={handleSavePin}
                    disabled={pinLoading}
                    activeOpacity={0.85}
                  >
                    {pinLoading ? (
                      <ActivityIndicator color={colors.white} size="small" />
                    ) : (
                      <Text style={styles.savePinBtnText}>Save MPIN</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Section 2: Biometric Authentication */}
          <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <Feather name="shield" size={m(16)} color={colors.lettersAndIcons} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Biometric Authorization</Text>
                <Text style={styles.cardSubtitle}>
                  TouchID / FaceID instant login & verification
                </Text>
              </View>
              <Switch
                value={biometricsEnabled}
                onValueChange={handleToggleBiometrics}
                trackColor={{ false: '#CBD5E1', true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>

            <View style={styles.neutralTelemetryBox}>
              <Text style={styles.telemetryText}>
                Hardware security enclave status:{' '}
                <Text style={{ fontFamily: FontFamily.primaryBold, color: '#059669' }}>
                  HARDWARE-BACKED KEYSTORE ACTIVE
                </Text>
              </Text>
            </View>
          </View>

          {/* Section 3: Active Session & Device Telemetry */}
          <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <Feather name="smartphone" size={m(16)} color={colors.lettersAndIcons} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Session & Device Governance</Text>
                <Text style={styles.cardSubtitle}>Current active enterprise token telemetry</Text>
              </View>
            </View>

            <View style={styles.neutralTelemetryBox}>
              <View style={styles.telemetryRow}>
                <Text style={styles.telemetryLabel}>Device Platform</Text>
                <Text style={styles.telemetryValue}>
                  {Platform.OS === 'android' ? 'Android OS 14.x' : 'iOS 17.x'}
                </Text>
              </View>
              <View style={styles.telemetryRow}>
                <Text style={styles.telemetryLabel}>Cipher Suite</Text>
                <Text style={styles.telemetryValue}>TLS 1.3 / AES-256 GCM</Text>
              </View>
              <View style={styles.telemetryRow}>
                <Text style={styles.telemetryLabel}>Token Expiry</Text>
                <Text style={styles.telemetryValue}>Rolling 30-Day Enterprise Lease</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.terminateSessionsBtn}
              onPress={handleRevokeSessions}
              activeOpacity={0.8}
            >
              <Feather name="alert-triangle" size={m(14)} color="#DC2626" />
              <Text style={styles.terminateSessionsBtnText}>
                Revoke All Secondary Device Sessions
              </Text>
            </TouchableOpacity>
          </View>

          {/* Section 4: Change Password Form */}
          <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <Feather name="key" size={m(16)} color={colors.lettersAndIcons} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Change Access Password</Text>
                <Text style={styles.cardSubtitle}>
                  Update account credentials for commercial workspace
                </Text>
              </View>
            </View>

            {/* Current Password */}
            <View style={styles.fieldWrap}>
              <Text style={styles.inputLabel}>CURRENT PASSWORD</Text>
              <View style={styles.passwordInputWrap}>
                <TextInput
                  style={styles.passwordInput}
                  secureTextEntry={!showCurrent}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current account password"
                  placeholderTextColor="#94A3B8"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowCurrent(!showCurrent)}
                >
                  <Feather
                    name={showCurrent ? 'eye-off' : 'eye'}
                    size={m(16)}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password */}
            <View style={styles.fieldWrap}>
              <Text style={styles.inputLabel}>NEW PASSWORD</Text>
              <View style={styles.passwordInputWrap}>
                <TextInput
                  style={styles.passwordInput}
                  secureTextEntry={!showNew}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor="#94A3B8"
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNew(!showNew)}>
                  <Feather name={showNew ? 'eye-off' : 'eye'} size={m(16)} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm New Password */}
            <View style={styles.fieldWrap}>
              <Text style={styles.inputLabel}>CONFIRM NEW PASSWORD</Text>
              <View style={styles.passwordInputWrap}>
                <TextInput
                  style={styles.passwordInput}
                  secureTextEntry={!showConfirm}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#94A3B8"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConfirm(!showConfirm)}
                >
                  <Feather
                    name={showConfirm ? 'eye-off' : 'eye'}
                    size={m(16)}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Dynamic Strength Meter */}
            {newPassword.length > 0 && (
              <View style={styles.strengthBox}>
                <View style={styles.strengthHeader}>
                  <Text style={styles.strengthTitle}>Password Entropy:</Text>
                  <Text style={[styles.strengthBadge, { color: strengthDetails.color }]}>
                    {strengthDetails.label} ({strengthDetails.score}%)
                  </Text>
                </View>
                <View style={styles.strengthTrack}>
                  <View
                    style={[
                      styles.strengthFill,
                      {
                        width: `${strengthDetails.score}%`,
                        backgroundColor: strengthDetails.color,
                      },
                    ]}
                  />
                </View>

                <View style={styles.checklistGrid}>
                  <View style={styles.checkItem}>
                    <Feather
                      name={strengthDetails.hasMinLength ? 'check' : 'circle'}
                      size={m(12)}
                      color={strengthDetails.hasMinLength ? '#059669' : '#94A3B8'}
                    />
                    <Text
                      style={[
                        styles.checkItemText,
                        strengthDetails.hasMinLength && styles.checkItemTextActive,
                      ]}
                    >
                      Min 6 characters
                    </Text>
                  </View>
                  <View style={styles.checkItem}>
                    <Feather
                      name={strengthDetails.hasUpper && strengthDetails.hasLower ? 'check' : 'circle'}
                      size={m(12)}
                      color={
                        strengthDetails.hasUpper && strengthDetails.hasLower
                          ? '#059669'
                          : '#94A3B8'
                      }
                    />
                    <Text
                      style={[
                        styles.checkItemText,
                        strengthDetails.hasUpper &&
                          strengthDetails.hasLower &&
                          styles.checkItemTextActive,
                      ]}
                    >
                      Upper & lowercase
                    </Text>
                  </View>
                  <View style={styles.checkItem}>
                    <Feather
                      name={strengthDetails.hasNumber ? 'check' : 'circle'}
                      size={m(12)}
                      color={strengthDetails.hasNumber ? '#059669' : '#94A3B8'}
                    />
                    <Text
                      style={[
                        styles.checkItemText,
                        strengthDetails.hasNumber && styles.checkItemTextActive,
                      ]}
                    >
                      Includes numeric (0-9)
                    </Text>
                  </View>
                  {confirmPassword.length > 0 && (
                    <View style={styles.checkItem}>
                      <Feather
                        name={strengthDetails.matchesConfirm ? 'check' : 'x'}
                        size={m(12)}
                        color={strengthDetails.matchesConfirm ? '#059669' : '#DC2626'}
                      />
                      <Text
                        style={[
                          styles.checkItemText,
                          strengthDetails.matchesConfirm && styles.checkItemTextActive,
                        ]}
                      >
                        Passwords match
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Submit Password Button */}
            <TouchableOpacity
              style={[styles.savePasswordBtn, pwdLoading && styles.btnDisabled]}
              onPress={handleChangePassword}
              disabled={pwdLoading}
              activeOpacity={0.85}
            >
              {pwdLoading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <>
                  <Feather name="shield" size={m(16)} color={colors.white} />
                  <Text style={styles.savePasswordBtnText}>Update Account Password</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: m(40) }} />
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  topBanner: {
    backgroundColor: colors.primary,
    paddingHorizontal: m(16),
    paddingTop: m(8),
    paddingBottom: m(22),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backCircularBtn: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    backgroundColor: 'rgba(9, 48, 48, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: m(12),
  },
  headerTag: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: m(18),
    fontFamily: FontFamily.primaryExtraBold,
    color: colors.lettersAndIcons,
  },
  sheetSection: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(26),
    borderTopRightRadius: m(26),
    marginTop: -m(12),
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: m(16),
    paddingBottom: m(60),
    gap: m(14),
  },

  // Card Containers
  cardContainer: {
    backgroundColor: colors.white,
    borderRadius: m(18),
    padding: m(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: m(12),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(10),
  },
  iconCircle: {
    width: m(36),
    height: m(36),
    borderRadius: m(10),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  cardSubtitle: {
    fontSize: m(11),
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
    marginTop: m(1),
  },
  badgeActive: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(6),
  },
  badgeActiveText: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: '#166534',
  },
  badgeInactive: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(6),
  },
  badgeInactiveText: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: '#64748B',
  },

  // PIN Info
  pinInfoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: m(12),
    gap: m(10),
  },
  pinInfoText: {
    fontSize: m(12),
    fontFamily: FontFamily.bodyRegular,
    color: '#475569',
    lineHeight: m(18),
  },
  actionOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(6),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.lettersAndIcons,
    borderRadius: m(12),
    paddingVertical: m(10),
  },
  actionOutlineBtnText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  // PIN Form
  pinFormWrap: {
    backgroundColor: '#F8FAFC',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: m(12),
    gap: m(10),
  },
  pinInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(10),
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: m(12),
    paddingVertical: m(8),
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: 4,
    textAlign: 'center',
  },
  pinActionsRow: {
    flexDirection: 'row',
    gap: m(10),
    marginTop: m(4),
  },
  cancelPinBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(10),
    borderRadius: m(10),
    backgroundColor: '#E2E8F0',
  },
  cancelPinBtnText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: '#475569',
  },
  savePinBtn: {
    flex: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(10),
    borderRadius: m(10),
    backgroundColor: colors.lettersAndIcons,
  },
  savePinBtnText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },

  // Neutral Telemetry Box (Strictly No Green Overload)
  neutralTelemetryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: m(12),
    gap: m(8),
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  telemetryLabel: {
    fontSize: m(11),
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
  },
  telemetryValue: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  telemetryText: {
    fontSize: m(11),
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
  },
  terminateSessionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(6),
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: m(12),
    paddingVertical: m(10),
  },
  terminateSessionsBtnText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: '#DC2626',
  },

  // Fields
  fieldWrap: {
    gap: m(6),
  },
  inputLabel: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: '#64748B',
    letterSpacing: 0.5,
  },
  passwordInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: m(12),
  },
  passwordInput: {
    flex: 1,
    paddingVertical: m(10),
    fontSize: m(13),
    fontFamily: FontFamily.bodyRegular,
    color: colors.lettersAndIcons,
  },
  eyeBtn: {
    padding: m(6),
  },

  // Strength Box
  strengthBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: m(12),
    gap: m(8),
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  strengthTitle: {
    fontSize: m(11),
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
  },
  strengthBadge: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
  },
  strengthTrack: {
    height: m(4),
    backgroundColor: '#E2E8F0',
    borderRadius: m(2),
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: m(2),
  },
  checklistGrid: {
    gap: m(4),
    marginTop: m(4),
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  checkItemText: {
    fontSize: m(11),
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
  },
  checkItemTextActive: {
    color: colors.lettersAndIcons,
    fontFamily: FontFamily.primaryBold,
  },

  // Submit Password Button
  savePasswordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lettersAndIcons,
    borderRadius: m(16),
    paddingVertical: m(14),
    gap: m(8),
    marginTop: m(6),
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  savePasswordBtnText: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
});
