import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { m } from 'walstar-rn-responsive';
import { colors } from '../../../constants';
import borrowerFlowService from '../../../Services/borrowerFlowService';

export default function BorrowerSecurityScreen() {
  const navigation = useNavigation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);

  // Dynamic Password Strength Meter
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
      color = '#16A34A';
    } else if (score >= 60) {
      label = 'Good';
      color = '#2563EB';
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
      Alert.alert(
        'Password Notice',
        'Your new password must be different from your current password.'
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'The new passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await borrowerFlowService.changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword: confirmPassword,
      });

      if (res?.success) {
        Alert.alert(
          'Password Updated!',
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
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backIcon} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={m(22)} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Password & Security</Text>
        <View style={{ width: m(22) }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Security Overview Banner */}
        <View style={styles.securityBanner}>
          <View style={styles.bannerIconBox}>
            <Feather name="shield" size={m(20)} color="#2563EB" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Commercial Credential Protection</Text>
            <Text style={styles.bannerSub}>
              Ensure your borrower profile uses a strong, unique password to safeguard company financial documents.
            </Text>
          </View>
        </View>

        {/* Change Password Form */}
        <View style={styles.formCard}>
          <Text style={styles.cardHeaderTitle}>Change Access Credentials</Text>

          {/* Current Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Current Password</Text>
            <View style={styles.passwordInputWrap}>
              <TextInput
                style={styles.passwordInput}
                secureTextEntry={!showCurrent}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
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
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.passwordInputWrap}>
              <TextInput
                style={styles.passwordInput}
                secureTextEntry={!showNew}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Minimum 6 characters"
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowNew(!showNew)}>
                <Feather name={showNew ? 'eye-off' : 'eye'} size={m(16)} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm New Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Confirm New Password</Text>
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
                style={styles.eyeIcon}
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

          {/* Password Strength Meter */}
          {newPassword.length > 0 ? (
            <View style={styles.strengthBox}>
              <View style={styles.strengthHeader}>
                <Text style={styles.strengthLabel}>Password Strength:</Text>
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

              {/* Requirement Checklist */}
              <View style={styles.checklist}>
                <View style={styles.checkItem}>
                  <Feather
                    name={strengthDetails.hasMinLength ? 'check' : 'circle'}
                    size={m(12)}
                    color={strengthDetails.hasMinLength ? '#16A34A' : '#94A3B8'}
                  />
                  <Text
                    style={[
                      styles.checkText,
                      strengthDetails.hasMinLength && styles.checkTextActive,
                    ]}
                  >
                    At least 6 characters
                  </Text>
                </View>

                <View style={styles.checkItem}>
                  <Feather
                    name={strengthDetails.hasUpper && strengthDetails.hasLower ? 'check' : 'circle'}
                    size={m(12)}
                    color={
                      strengthDetails.hasUpper && strengthDetails.hasLower
                        ? '#16A34A'
                        : '#94A3B8'
                    }
                  />
                  <Text
                    style={[
                      styles.checkText,
                      strengthDetails.hasUpper &&
                        strengthDetails.hasLower &&
                        styles.checkTextActive,
                    ]}
                  >
                    Uppercase & lowercase letters
                  </Text>
                </View>

                <View style={styles.checkItem}>
                  <Feather
                    name={strengthDetails.hasNumber ? 'check' : 'circle'}
                    size={m(12)}
                    color={strengthDetails.hasNumber ? '#16A34A' : '#94A3B8'}
                  />
                  <Text
                    style={[
                      styles.checkText,
                      strengthDetails.hasNumber && styles.checkTextActive,
                    ]}
                  >
                    Contains a number (0-9)
                  </Text>
                </View>

                {confirmPassword.length > 0 ? (
                  <View style={styles.checkItem}>
                    <Feather
                      name={strengthDetails.matchesConfirm ? 'check' : 'x'}
                      size={m(12)}
                      color={strengthDetails.matchesConfirm ? '#16A34A' : '#DC2626'}
                    />
                    <Text
                      style={[
                        styles.checkText,
                        strengthDetails.matchesConfirm && styles.checkTextActive,
                      ]}
                    >
                      Passwords match
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* Submit Action */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.disabledBtn]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Feather name="lock" size={m(16)} color={colors.white} />
                <Text style={styles.submitBtnText}>Update Account Password</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: m(16),
    paddingVertical: m(14),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: m(16),
    fontWeight: '800',
    color: '#0F172A',
  },
  backIcon: {
    padding: m(4),
  },
  scrollContent: {
    padding: m(16),
    gap: m(14),
    paddingBottom: m(80),
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(12),
    backgroundColor: '#EFF6FF',
    padding: m(14),
    borderRadius: m(16),
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  bannerIconBox: {
    width: m(40),
    height: m(40),
    borderRadius: m(12),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  bannerTitle: {
    fontSize: m(13),
    fontWeight: '800',
    color: '#1E40AF',
  },
  bannerSub: {
    fontSize: m(11),
    color: '#3B82F6',
    marginTop: m(2),
    lineHeight: m(16),
  },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: m(14),
  },
  cardHeaderTitle: {
    fontSize: m(14),
    fontWeight: '800',
    color: '#0F172A',
  },
  fieldGroup: {
    gap: m(6),
  },
  label: {
    fontSize: m(12),
    fontWeight: '600',
    color: '#334155',
  },
  passwordInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: m(10),
    paddingHorizontal: m(12),
  },
  passwordInput: {
    flex: 1,
    paddingVertical: m(10),
    fontSize: m(13),
    color: '#0F172A',
  },
  eyeIcon: {
    padding: m(4),
  },
  strengthBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: m(12),
    padding: m(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: m(8),
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  strengthLabel: {
    fontSize: m(11),
    color: '#64748B',
    fontWeight: '600',
  },
  strengthBadge: {
    fontSize: m(11),
    fontWeight: '800',
  },
  strengthTrack: {
    height: m(5),
    backgroundColor: '#E2E8F0',
    borderRadius: m(3),
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: m(3),
  },
  checklist: {
    gap: m(4),
    marginTop: m(4),
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  checkText: {
    fontSize: m(11),
    color: '#64748B',
  },
  checkTextActive: {
    color: '#0F172A',
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
    backgroundColor: '#2563EB',
    borderRadius: m(14),
    paddingVertical: m(14),
    marginTop: m(8),
  },
  disabledBtn: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: m(14),
    fontWeight: '700',
    color: colors.white,
  },
});
