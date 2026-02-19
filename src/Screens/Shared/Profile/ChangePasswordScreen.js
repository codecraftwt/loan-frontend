import { useState, useRef } from 'react';
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
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import { userAPI } from '../../../Services/userService';

const ChangePasswordScreen = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [focusedField, setFocusedField] = useState(null);
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
    return { level: 4, label: 'Strong', color: '#10B981' };
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const passwordsMatch = confirmNewPassword.length > 0 && newPassword === confirmNewPassword;
  const passwordsMismatch = submitted && confirmNewPassword.length > 0 && newPassword !== confirmNewPassword;

  const validate = () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
      Toast.show({ type: 'error', text1: 'All fields are required' });
      return false;
    }
    if (newPassword.length < 6) {
      Toast.show({ type: 'error', text1: 'New password must be at least 6 characters' });
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
        setTimeout(() => navigation.goBack(), 1500);
      }
    } catch (error) {
      const message =
        error.response?.data?.message || 'Something went wrong. Please try again.';
      Toast.show({ type: 'error', text1: message });
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordField = ({
    label,
    value,
    setValue,
    showPassword,
    toggleShow,
    iconName,
    accentColor,
    fieldKey,
    nextRef,
  }) => {
    const isFocused = focusedField === fieldKey;
    const isMatchField = fieldKey === 'confirm';
    const showMatchIcon = isMatchField && confirmNewPassword.length > 0 && (passwordsMatch || submitted);

    return (
      <View
        style={[
          styles.fieldCard,
          isFocused && { borderColor: accentColor, borderWidth: 1.5 },
        ]}>
        <View style={[styles.fieldIconCircle, { backgroundColor: `${accentColor}12` }]}>
          <View style={[styles.fieldIconInner, { backgroundColor: `${accentColor}20` }]}>
            <Icon name={iconName} size={20} color={accentColor} />
          </View>
        </View>

        <View style={styles.fieldBody}>
          <Text style={[styles.fieldLabel, isFocused && { color: accentColor }]}>{label}</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.fieldInput}
              value={value}
              onChangeText={setValue}
              placeholder={`Enter ${label.toLowerCase()}`}
              placeholderTextColor="#C5C9D6"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              onFocus={() => setFocusedField(fieldKey)}
              onBlur={() => setFocusedField(null)}
              returnKeyType={nextRef ? 'next' : 'done'}
              onSubmitEditing={() => nextRef?.current?.focus()}
              ref={
                fieldKey === 'new'
                  ? newPasswordRef
                  : fieldKey === 'confirm'
                  ? confirmPasswordRef
                  : undefined
              }
            />
            <View style={styles.inputActions}>
              {showMatchIcon && (
                <View style={[styles.matchBadge, { backgroundColor: passwordsMatch ? '#10B98118' : '#EF444418' }]}>
                  <Icon
                    name={passwordsMatch ? 'check' : 'x'}
                    size={14}
                    color={passwordsMatch ? '#10B981' : '#EF4444'}
                  />
                </View>
              )}
              <TouchableOpacity onPress={toggleShow} style={styles.eyeButton} activeOpacity={0.6}>
                <Icon name={showPassword ? 'eye' : 'eye-off'} size={18} color={isFocused ? accentColor : '#B0B5C3'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Header title="Change Password" showBackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#FFF7ED', '#FEF3C7', '#FFEDD5']}
            style={styles.heroIconWrapper}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <View style={styles.heroIconOuter}>
              <LinearGradient
                colors={['#ff8800', '#ff6700']}
                style={styles.heroIconInner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}>
                <Icon name="shield" size={m(32)} color="#FFFFFF" />
              </LinearGradient>
            </View>
          </LinearGradient>
          <Text style={styles.heroTitle}>Secure Your Account</Text>
          <Text style={styles.heroSubtitle}>
            Keep your account protected by updating your password regularly
          </Text>
        </View>

        {/* Current Password Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionTitle}>Verify Identity</Text>
          </View>
          {renderPasswordField({
            label: 'Current Password',
            value: currentPassword,
            setValue: setCurrentPassword,
            showPassword: showCurrentPassword,
            toggleShow: () => setShowCurrentPassword(prev => !prev),
            iconName: 'key',
            accentColor: '#6366F1',
            fieldKey: 'current',
            nextRef: newPasswordRef,
          })}
        </View>

        {/* New Password Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.sectionTitle}>Set New Password</Text>
          </View>

          {renderPasswordField({
            label: 'New Password',
            value: newPassword,
            setValue: setNewPassword,
            showPassword: showNewPassword,
            toggleShow: () => setShowNewPassword(prev => !prev),
            iconName: 'lock',
            accentColor: '#10B981',
            fieldKey: 'new',
            nextRef: confirmPasswordRef,
          })}

          {/* Strength Indicator */}
          {newPassword.length > 0 && (
            <View style={styles.strengthSection}>
              <View style={styles.strengthBarTrack}>
                {[1, 2, 3, 4].map(i => (
                  <View
                    key={i}
                    style={[
                      styles.strengthBarSegment,
                      {
                        backgroundColor:
                          i <= passwordStrength.level ? passwordStrength.color : '#E5E7EB',
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                {passwordStrength.label}
              </Text>
            </View>
          )}

          {renderPasswordField({
            label: 'Confirm New Password',
            value: confirmNewPassword,
            setValue: setConfirmNewPassword,
            showPassword: showConfirmPassword,
            toggleShow: () => setShowConfirmPassword(prev => !prev),
            iconName: 'check-circle',
            accentColor: '#F59E0B',
            fieldKey: 'confirm',
            nextRef: null,
          })}

          {passwordsMismatch && (
            <View style={styles.mismatchRow}>
              <Icon name="alert-circle" size={14} color="#EF4444" />
              <Text style={styles.mismatchText}>Passwords do not match</Text>
            </View>
          )}
        </View>

        {/* Security Tips */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Icon name="info" size={16} color="#6366F1" />
            <Text style={styles.tipsTitle}>Password Tips</Text>
          </View>
          <View style={styles.tipsList}>
            {[
              'At least 6 characters long',
              'Mix uppercase & lowercase letters',
              'Include numbers and symbols',
            ].map((tip, i) => (
              <View key={i} style={styles.tipItem}>
                <View style={[styles.tipDot, {
                  backgroundColor:
                    i === 0 && newPassword.length >= 6 ? '#10B981' :
                    i === 1 && /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? '#10B981' :
                    i === 2 && /[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword) ? '#10B981' :
                    '#D1D5DB',
                }]} />
                <Text style={[styles.tipText, {
                  color:
                    i === 0 && newPassword.length >= 6 ? '#10B981' :
                    i === 1 && /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? '#10B981' :
                    i === 2 && /[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword) ? '#10B981' :
                    '#6B7280',
                }]}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            onPress={handleChangePassword}
            activeOpacity={0.8}
            disabled={loading}>
            <LinearGradient
              colors={loading ? ['#d1d5db', '#9ca3af'] : ['#ff6700', '#ff9100']}
              style={styles.primaryButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}>
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="check-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Update Password</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
            disabled={loading}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: m(16),
    paddingBottom: m(120),
  },

  /* ── Hero ── */
  heroSection: {
    alignItems: 'center',
    paddingVertical: m(24),
    marginBottom: m(8),
  },
  heroIconWrapper: {
    width: m(96),
    height: m(96),
    borderRadius: m(48),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(18),
  },
  heroIconOuter: {
    width: m(72),
    height: m(72),
    borderRadius: m(36),
    backgroundColor: 'rgba(255, 135, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroIconInner: {
    width: m(56),
    height: m(56),
    borderRadius: m(28),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff6700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  heroTitle: {
    fontSize: m(22),
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.3,
    marginBottom: m(6),
  },
  heroSubtitle: {
    fontSize: m(13),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: m(20),
    paddingHorizontal: m(32),
  },

  /* ── Section Cards ── */
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(20),
    padding: m(18),
    marginBottom: m(14),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(16),
    gap: m(10),
  },
  sectionDot: {
    width: m(8),
    height: m(8),
    borderRadius: m(4),
    backgroundColor: '#6366F1',
  },
  sectionTitle: {
    fontSize: m(15),
    fontWeight: '700',
    color: '#374151',
    letterSpacing: 0.2,
  },

  /* ── Field Card ── */
  fieldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: m(14),
    backgroundColor: '#F9FAFB',
    borderRadius: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: m(14),
    marginBottom: m(12),
  },
  fieldIconCircle: {
    width: m(50),
    height: m(50),
    borderRadius: m(25),
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldIconInner: {
    width: m(40),
    height: m(40),
    borderRadius: m(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldBody: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: m(11),
    color: '#9CA3AF',
    fontWeight: '700',
    marginBottom: m(6),
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: m(10),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: m(10),
  },
  fieldInput: {
    flex: 1,
    fontSize: m(15),
    fontWeight: '600',
    color: '#111827',
    paddingVertical: Platform.OS === 'ios' ? m(10) : m(8),
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
  },
  matchBadge: {
    width: m(24),
    height: m(24),
    borderRadius: m(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeButton: {
    padding: m(6),
  },

  /* ── Strength Indicator ── */
  strengthSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(10),
    marginBottom: m(14),
    paddingHorizontal: m(4),
  },
  strengthBarTrack: {
    flex: 1,
    flexDirection: 'row',
    gap: m(4),
  },
  strengthBarSegment: {
    flex: 1,
    height: m(4),
    borderRadius: m(2),
  },
  strengthLabel: {
    fontSize: m(11),
    fontWeight: '700',
    letterSpacing: 0.5,
    minWidth: m(44),
    textAlign: 'right',
  },

  /* ── Mismatch Warning ── */
  mismatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
    paddingHorizontal: m(4),
    marginTop: m(-4),
  },
  mismatchText: {
    fontSize: m(12),
    color: '#EF4444',
    fontWeight: '500',
  },

  /* ── Tips Card ── */
  tipsCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: m(16),
    padding: m(16),
    marginBottom: m(20),
    borderWidth: 1,
    borderColor: '#E0E0FF',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    marginBottom: m(12),
  },
  tipsTitle: {
    fontSize: m(13),
    fontWeight: '700',
    color: '#6366F1',
    letterSpacing: 0.3,
  },
  tipsList: {
    gap: m(8),
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(10),
  },
  tipDot: {
    width: m(7),
    height: m(7),
    borderRadius: m(3.5),
  },
  tipText: {
    fontSize: m(12),
    fontWeight: '500',
  },

  /* ── Action Buttons ── */
  actionSection: {
    gap: m(12),
    paddingHorizontal: m(4),
  },
  primaryButton: {
    borderRadius: m(16),
    overflow: 'hidden',
    shadowColor: '#ff6700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: m(56),
    gap: m(10),
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: m(16),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: m(48),
    borderRadius: m(14),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: m(15),
    fontWeight: '600',
  },
});

export default ChangePasswordScreen;
