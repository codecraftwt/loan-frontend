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
import { colors, FontFamily } from '../../../constants';
import lenderFlowService from '../../../Services/lenderFlowService';

export default function LenderSettingsScreen() {
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
    let color = '#ef4444';

    if (score >= 80) {
      label = 'Strong';
      color = '#10b981';
    } else if (score >= 60) {
      label = 'Good';
      color = '#2563eb';
    } else if (score >= 40) {
      label = 'Fair';
      color = '#f59e0b';
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
      Alert.alert('Required Field', 'Please provide your current administrative password.');
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
      Alert.alert('Mismatch', 'The new password and confirm password do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await lenderFlowService.changePassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
        confirmNewPassword: confirmPassword.trim(),
      });

      if (res?.success || res?.message?.toLowerCase().includes('success')) {
        Alert.alert(
          'Password Updated 🔒',
          'Your institutional credentials have been securely updated.',
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
      } else {
        Alert.alert('Update Failed', res?.message || 'Could not change password.');
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        'Failed to update password. Please verify your current password.';
      Alert.alert('Security Error', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={m(20)} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Account Security</Text>
          <Text style={styles.headerSubtitle}>Password & Compliance</Text>
        </View>
        <View style={{ width: m(40) }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Security Shield Banner */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerIconBox}>
            <Feather name="shield" size={m(24)} color="#2563eb" />
          </View>
          <View style={{ flex: 1, marginLeft: m(14) }}>
            <Text style={styles.bannerTitle}>Institutional Protection</Text>
            <Text style={styles.bannerSubtitle}>
              Keep your NBFC / lending portal account safeguarded with encrypted credentials.
            </Text>
          </View>
        </View>

        {/* Change Password Form */}
        <View style={styles.formCard}>
          <Text style={styles.sectionHeader}>Change Account Password</Text>

          {/* Current Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Current Password *</Text>
            <View style={styles.inputWrapper}>
              <Feather name="lock" size={m(16)} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                secureTextEntry={!showCurrent}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowCurrent(!showCurrent)}
                style={styles.eyeBtn}
              >
                <Feather
                  name={showCurrent ? 'eye-off' : 'eye'}
                  size={m(16)}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>New Password *</Text>
            <View style={styles.inputWrapper}>
              <Feather name="key" size={m(16)} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                secureTextEntry={!showNew}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password (min. 6 chars)"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowNew(!showNew)}
                style={styles.eyeBtn}
              >
                <Feather name={showNew ? 'eye-off' : 'eye'} size={m(16)} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Real-Time Password Strength Meter */}
            {newPassword.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthTop}>
                  <Text style={styles.strengthLabel}>Password Strength:</Text>
                  <Text style={[styles.strengthValue, { color: strengthDetails.color }]}>
                    {strengthDetails.label} ({strengthDetails.score}%)
                  </Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${strengthDetails.score}%`,
                        backgroundColor: strengthDetails.color,
                      },
                    ]}
                  />
                </View>

                {/* Criteria Checklist */}
                <View style={styles.criteriaGrid}>
                  <View style={styles.criteriaItem}>
                    <Feather
                      name={strengthDetails.hasMinLength ? 'check-circle' : 'circle'}
                      size={m(12)}
                      color={strengthDetails.hasMinLength ? '#10b981' : '#94a3b8'}
                    />
                    <Text
                      style={[
                        styles.criteriaText,
                        strengthDetails.hasMinLength && styles.criteriaTextActive,
                      ]}
                    >
                      6+ Characters
                    </Text>
                  </View>

                  <View style={styles.criteriaItem}>
                    <Feather
                      name={strengthDetails.hasUpper ? 'check-circle' : 'circle'}
                      size={m(12)}
                      color={strengthDetails.hasUpper ? '#10b981' : '#94a3b8'}
                    />
                    <Text
                      style={[
                        styles.criteriaText,
                        strengthDetails.hasUpper && styles.criteriaTextActive,
                      ]}
                    >
                      Uppercase (A-Z)
                    </Text>
                  </View>

                  <View style={styles.criteriaItem}>
                    <Feather
                      name={strengthDetails.hasNumber ? 'check-circle' : 'circle'}
                      size={m(12)}
                      color={strengthDetails.hasNumber ? '#10b981' : '#94a3b8'}
                    />
                    <Text
                      style={[
                        styles.criteriaText,
                        strengthDetails.hasNumber && styles.criteriaTextActive,
                      ]}
                    >
                      Number (0-9)
                    </Text>
                  </View>

                  <View style={styles.criteriaItem}>
                    <Feather
                      name={strengthDetails.hasSpecial ? 'check-circle' : 'circle'}
                      size={m(12)}
                      color={strengthDetails.hasSpecial ? '#10b981' : '#94a3b8'}
                    />
                    <Text
                      style={[
                        styles.criteriaText,
                        strengthDetails.hasSpecial && styles.criteriaTextActive,
                      ]}
                    >
                      Symbol (!@#$)
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm New Password *</Text>
            <View style={styles.inputWrapper}>
              <Feather name="check-square" size={m(16)} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirm(!showConfirm)}
                style={styles.eyeBtn}
              >
                <Feather
                  name={showConfirm ? 'eye-off' : 'eye'}
                  size={m(16)}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>

            {confirmPassword.length > 0 && (
              <View style={styles.matchIndicator}>
                <Feather
                  name={strengthDetails.matchesConfirm ? 'check-circle' : 'alert-circle'}
                  size={m(12)}
                  color={strengthDetails.matchesConfirm ? '#10b981' : '#ef4444'}
                />
                <Text
                  style={[
                    styles.matchText,
                    { color: strengthDetails.matchesConfirm ? '#10b981' : '#ef4444' },
                  ]}
                >
                  {strengthDetails.matchesConfirm
                    ? 'Passwords match'
                    : 'Passwords do not match yet'}
                </Text>
              </View>
            )}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleChangePassword}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Feather name="check" size={m(18)} color="#ffffff" style={{ marginRight: m(8) }} />
                <Text style={styles.submitBtnText}>Update Credentials</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Security Standards Card */}
        <View style={styles.standardsCard}>
          <Text style={styles.standardsTitle}>Security Best Practices</Text>
          <View style={styles.standardRow}>
            <Feather name="check" size={m(14)} color="#10b981" />
            <Text style={styles.standardText}>
              Never share administrative login details with unauthorized individuals.
            </Text>
          </View>
          <View style={styles.standardRow}>
            <Feather name="check" size={m(14)} color="#10b981" />
            <Text style={styles.standardText}>
              Use a dedicated, complex passphrase not used across personal accounts.
            </Text>
          </View>
          <View style={styles.standardRow}>
            <Feather name="check" size={m(14)} color="#10b981" />
            <Text style={styles.standardText}>
              All deal actions and loan sanctions are legally time-stamped and audit-logged.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: m(16),
    paddingVertical: m(12),
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  backBtn: {
    width: m(40),
    height: m(40),
    borderRadius: m(20),
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: m(16),
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FontFamily?.primaryBold,
  },
  headerSubtitle: {
    fontSize: m(11),
    color: '#64748b',
    marginTop: m(1),
  },
  container: {
    flex: 1,
  },
  content: {
    padding: m(16),
    paddingBottom: m(40),
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: m(16),
    padding: m(16),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  bannerIconBox: {
    width: m(48),
    height: m(48),
    borderRadius: m(24),
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: m(14),
    fontWeight: '800',
    color: '#1e3a8a',
  },
  bannerSubtitle: {
    fontSize: m(11),
    color: '#3b82f6',
    lineHeight: m(16),
    marginTop: m(2),
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: m(16),
    padding: m(18),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionHeader: {
    fontSize: m(15),
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: m(16),
  },
  inputGroup: {
    marginBottom: m(16),
  },
  inputLabel: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#334155',
    marginBottom: m(6),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: m(12),
  },
  inputIcon: {
    marginRight: m(8),
  },
  input: {
    flex: 1,
    height: m(46),
    fontSize: m(13),
    color: '#0f172a',
    fontWeight: '600',
  },
  eyeBtn: {
    padding: m(6),
  },
  strengthContainer: {
    marginTop: m(10),
    backgroundColor: '#f8fafc',
    borderRadius: m(10),
    padding: m(10),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  strengthTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: m(6),
  },
  strengthLabel: {
    fontSize: m(11),
    fontWeight: '600',
    color: '#64748b',
  },
  strengthValue: {
    fontSize: m(11),
    fontWeight: '800',
  },
  progressBarTrack: {
    height: m(6),
    backgroundColor: '#e2e8f0',
    borderRadius: m(3),
    overflow: 'hidden',
    marginBottom: m(8),
  },
  progressBarFill: {
    height: '100%',
    borderRadius: m(3),
  },
  criteriaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: m(4),
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginVertical: m(2),
  },
  criteriaText: {
    fontSize: m(10),
    color: '#94a3b8',
    marginLeft: m(4),
    fontWeight: '600',
  },
  criteriaTextActive: {
    color: '#334155',
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: m(6),
  },
  matchText: {
    fontSize: m(11),
    fontWeight: '600',
    marginLeft: m(4),
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    borderRadius: m(12),
    height: m(48),
    marginTop: m(8),
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: m(13),
    fontWeight: '800',
    color: '#ffffff',
  },
  standardsCard: {
    backgroundColor: '#ffffff',
    borderRadius: m(16),
    padding: m(16),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  standardsTitle: {
    fontSize: m(13),
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: m(10),
  },
  standardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: m(8),
  },
  standardText: {
    fontSize: m(11),
    color: '#64748b',
    marginLeft: m(8),
    flex: 1,
    lineHeight: m(16),
  },
});
