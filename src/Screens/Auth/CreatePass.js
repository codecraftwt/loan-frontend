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
import Toast from 'react-native-toast-message';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useDispatch} from 'react-redux';
import {resetPassword} from '../../Redux/Slices/authslice';
import {m} from 'walstar-rn-responsive';
import {FontFamily, FontSizes} from '../../constants';
import LinearGradient from 'react-native-linear-gradient';

export default function CreatePass({navigation, route}) {
  const {email, otp} = route.params;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const dispatch = useDispatch();

  const validatePassword = password => {
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasDigits = /\d/.test(password);
    return password.length >= 6 && hasLetters && hasDigits;
  };

  const handleApply = async () => {
    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'info',
        position: 'top',
        text1: 'Passwords do not match!',
      });
      return;
    }

    if (validatePassword(newPassword)) {
      // Dispatch resetPassword action
      const result = await dispatch(
        resetPassword({email, otp, newPassword}),
      ).unwrap();

      Toast.show({
        type: 'success',
        position: 'top',
        text1: 'Password reset successfully',
      });

      navigation.navigate('Login');
    } else {
      Toast.show({
        type: 'info',
        position: 'top',
        text1:
          'Password must be at least 6 characters long and contain both letters and digits.',
      });
    }
  };

  const isButtonDisabled = !validatePassword(newPassword) || !confirmPassword;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
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
          <Text style={styles.headerText}>Create New Password</Text>
          <Text style={styles.instructionText}>
            Set a strong password that includes at least 6 characters with both letters and numbers.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>New Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#ff7900"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter new password"
                secureTextEntry={!passwordVisible}
                placeholderTextColor="#999"
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity
                onPress={() => setPasswordVisible(!passwordVisible)}
                style={styles.eyeButton}>
                <Ionicons
                  name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color="#ff7900"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#ff7900"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Re-enter new password"
                secureTextEntry={!confirmVisible}
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setConfirmVisible(!confirmVisible)}
                style={styles.eyeButton}>
                <Ionicons
                  name={confirmVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color="#ff7900"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.applyButtonContainer,
              isButtonDisabled && styles.applyButtonDisabled,
            ]}
            onPress={handleApply}
            disabled={isButtonDisabled}>
            <LinearGradient
              colors={['#ff6700', '#ff7900', '#ff8500']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.applyButtonGradient}>
              <Text style={styles.applyButtonText}>Update Password</Text>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Back to Login */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Back to </Text>
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
    backgroundColor: '#ff6700',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#ff6700',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: m(20),
    paddingVertical: m(40),
    justifyContent: 'center',
    backgroundColor: '#ff6700',
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
    color: '#FFFFFF',
  },
  tagline: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.secondaryRegular,
    color: '#FFFFFF',
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
    fontSize: FontSizes['3xl'],
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9F0',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#FFEDD5',
    paddingHorizontal: m(16),
    height: m(56),
  },
  input: {
    flex: 1,
    height: m(56),
    fontSize: FontSizes.md,
    fontFamily: FontFamily.primaryRegular,
    color: '#333',
    padding: 0,
  },
  inputIcon: {
    marginRight: m(12),
  },
  eyeButton: {
    padding: m(4),
  },
  icon: {
    paddingHorizontal: m(10),
  },
  applyButtonContainer: {
    borderRadius: m(12),
    marginTop: m(8),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#ff6700',
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
    opacity: 0.6,
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
    fontFamily: FontFamily.primaryRegular,
    color: '#666',
  },
  footerLink: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: '#ff6700',
  },
});
