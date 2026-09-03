import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { m } from 'walstar-rn-responsive';
import { FontFamily, FontSizes } from '../../../constants';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { registerUser } from '../../../Redux/Slices/authslice';

const BRAND_NAVY = '#172340';
const BRAND_TEAL = '#118A6B';
const BRAND_SOFT = '#EAF7F2';
const BRAND_BORDER = '#BDE5D8';

const ProgressTracker = () => (
  <View style={styles.progressContainer}>
    {[1, 2, 3, 4].map(step => (
      <View key={step} style={styles.progressStepWrap}>
        <View
          style={[
            styles.progressStep,
            step === 1 && styles.progressStepComplete,
            step === 2 && styles.progressStepActive,
          ]}>
          {step === 1 ? (
            <Ionicons name="checkmark" size={m(16)} color="#FFFFFF" />
          ) : (
            <Text style={styles.progressStepText}>{step}</Text>
          )}
        </View>
        {step < 4 ? (
          <View
            style={[
              styles.progressLine,
              step === 1 && styles.progressLineActive,
            ]}
          />
        ) : null}
      </View>
    ))}
  </View>
);

export default function AadhaarKycSuccessScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const { isLoading } = useSelector(state => state.auth || {});
  const [signupError, setSignupError] = useState('');
  const { aadhaarNumber, kycData, userData } = route.params || {};
  const maskedAadhaar = aadhaarNumber
    ? `XXXX XXXX ${aadhaarNumber.slice(-4)}`
    : 'XXXX XXXX';

  const handleContinue = async () => {
    if (!userData) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'BottomNavigation' }],
      });
      return;
    }

    try {
      setSignupError('');
      const formData = new FormData();
      formData.append('userName', userData.name);
      formData.append('email', userData.email);
      formData.append('password', userData.password);
      formData.append('confirmPassword', userData.confirmPassword);
      formData.append('roleId', userData.roleId.toString());
      formData.append('address', userData.address || 'Not provided');
      formData.append('aadharCardNo', aadhaarNumber);

      if (userData.mobileNumber) {
        formData.append('mobileNo', userData.mobileNumber);
      }

      if (userData.panCardNumber && userData.panCardNumber.length === 10) {
        formData.append('panCardNumber', userData.panCardNumber);
      }

      if (userData.profileImage) {
        formData.append('profileImage', {
          uri: userData.profileImage.uri,
          type: userData.profileImage.type || 'image/jpeg',
          name: userData.profileImage.fileName || 'profile.jpg',
        });
      }

      await dispatch(registerUser(formData)).unwrap();

      Toast.show({
        type: 'success',
        position: 'top',
        text1: 'Account created successfully!',
      });

      navigation.reset({
        index: 0,
        routes: [{ name: 'BottomNavigation' }],
      });
    } catch (error) {
      const errorMessage =
        (typeof error === 'string' ? error : error?.message) ||
        'Registration failed. Please try again.';
      setSignupError(errorMessage);
      Toast.show({
        type: 'error',
        position: 'top',
        text1: errorMessage,
      });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND_NAVY} />
      <View style={styles.fixedTop}>
        <View style={styles.headerContent}>
          <Text style={styles.appName}>LoanHub</Text>
          <Text style={styles.tagline}>Aadhaar eKYC Verification</Text>
        </View>

        <ProgressTracker />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={m(42)} color={BRAND_TEAL} />
          </View>

          <Text style={styles.title}>Identity Verified</Text>
          <Text style={styles.subtitle}>
            Your Aadhaar eKYC is complete
          </Text>

          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>Aadhaar Number</Text>
            <View style={styles.statusRow}>
              <Text style={styles.statusValue}>{maskedAadhaar}</Text>
              <Ionicons name="checkmark" size={m(16)} color={BRAND_TEAL} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.statusLabel}>Name (as per Aadhaar)</Text>
            <Text style={styles.statusValue}>{kycData?.name || 'Rohan Sharma'}</Text>
          </View>

          <Text style={styles.confirmText}>
            Please confirm this is correct before continuing.
          </Text>

          {signupError ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={m(18)} color="#D93025" />
              <Text style={styles.errorText}>{signupError}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.disabledButton]}
            onPress={handleContinue}
            disabled={isLoading}>
            <LinearGradient
              colors={[BRAND_NAVY, BRAND_TEAL]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}>
              <Text style={styles.primaryButtonText}>
                {isLoading ? 'Creating Account...' : 'Looks good, Continue'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_TEAL,
  },
  scrollView: {
    flex: 1,
    backgroundColor: BRAND_TEAL,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: m(20),
    paddingTop: 0,
    paddingBottom: m(40),
    backgroundColor: BRAND_TEAL,
  },
  fixedTop: {
    paddingHorizontal: m(20),
    paddingTop: Platform.OS === 'ios' ? m(52) : m(32),
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: m(18),
  },
  appName: {
    fontSize: FontSizes['4xl'],
    fontFamily: FontFamily.secondaryBold,
    color: '#FFFFFF',
  },
  tagline: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.secondaryRegular,
    color: '#FFFFFF',
    marginTop: m(6),
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(20),
    padding: m(24),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BRAND_BORDER,
    elevation: 8,
    shadowColor: BRAND_TEAL,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  successCircle: {
    width: m(88),
    height: m(88),
    borderRadius: m(44),
    backgroundColor: BRAND_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: m(18),
  },
  title: {
    fontSize: FontSizes['2xl'],
    fontFamily: FontFamily.secondaryBold,
    color: '#333',
    textAlign: 'center',
    marginBottom: m(8),
  },
  subtitle: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primaryRegular,
    color: '#666',
    textAlign: 'center',
    lineHeight: m(22),
    marginBottom: m(22),
  },
  statusBox: {
    width: '100%',
    minHeight: m(56),
    borderRadius: m(12),
    backgroundColor: BRAND_SOFT,
    borderWidth: 1,
    borderColor: BRAND_BORDER,
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: m(8),
    padding: m(14),
    marginBottom: m(24),
  },
  statusLabel: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primarySemiBold,
    color: '#0E1B34',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
  },
  statusValue: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primaryRegular,
    color: '#0E1B34',
  },
  verifiedText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primarySemiBold,
    color: BRAND_TEAL,
  },
  divider: {
    height: 1,
    alignSelf: 'stretch',
    backgroundColor: BRAND_BORDER,
    marginVertical: m(8),
  },
  confirmText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#5E687E',
    textAlign: 'center',
    marginBottom: m(18),
  },
  errorBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#F8B4B4',
    borderRadius: m(10),
    padding: m(12),
    gap: m(8),
    marginBottom: m(16),
  },
  errorText: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#D93025',
    lineHeight: m(18),
  },
  primaryButton: {
    width: '100%',
    borderRadius: m(12),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: BRAND_TEAL,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  primaryButtonGradient: {
    minHeight: m(54),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
  },
  primaryButtonText: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.primarySemiBold,
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.7,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: m(6),
    marginBottom: m(18),
  },
  progressStepWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressStep: {
    width: m(30),
    height: m(30),
    borderRadius: m(15),
    backgroundColor: '#516178',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStepComplete: {
    backgroundColor: BRAND_TEAL,
  },
  progressStepActive: {
    backgroundColor: BRAND_TEAL,
    borderWidth: 3,
    borderColor: '#46B89D',
  },
  progressStepText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primarySemiBold,
    color: '#FFFFFF',
  },
  progressLine: {
    width: m(42),
    height: 2,
    backgroundColor: '#516178',
  },
  progressLineActive: {
    backgroundColor: BRAND_TEAL,
  },
});
