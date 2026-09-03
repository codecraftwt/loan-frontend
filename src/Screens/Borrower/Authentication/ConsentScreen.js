import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { m } from 'walstar-rn-responsive';
import { FontFamily, FontSizes } from '../../../constants';

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

export default function ConsentScreen({ navigation, route }) {
  const [agreed, setAgreed] = useState(false);
  const { source, userData } = route.params || {};

   const handleContinue = () => {
     if (!agreed) {
       return;
     }
     navigation.navigate('EnterAadhaarScreen', {
       aadhaarNumber: route?.params?.aadhaarNumber,
       source,
       userData,
     });
   };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND_NAVY} />

      <View style={styles.fixedTop}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.appName}>LoanHub</Text>
          </View>
          <Text style={styles.tagline}>Smart Loan Management</Text>
        </View>

        <ProgressTracker />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.formCard}>
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark-outline" size={m(40)} color={BRAND_TEAL} />
            </View>
          </View>

          <Text style={styles.title}>Verify Your Identity with Aadhaar</Text>
          <Text style={styles.subtitle}>
            This is required to complete your KYC as per RBI guidelines
          </Text>

          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="shield-checkmark-outline" size={m(20)} color={BRAND_TEAL} />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailText}>
                  Your Aadhaar number will be used only for eKYC verification as per RBI guidelines.
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="call-outline" size={m(20)} color={BRAND_TEAL} />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailText}>
                  An OTP will be sent to your Aadhaar-linked mobile number to confirm it's you.
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="lock-closed-outline" size={m(20)} color={BRAND_TEAL} />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailText}>
                  Your Aadhaar data is encrypted in transit and never stored in full.
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="refresh-outline" size={m(20)} color={BRAND_TEAL} />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailText}>
                  You can withdraw consent at any time before OTP verification.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setAgreed(!agreed)}
            activeOpacity={0.7}>
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && (
                <Ionicons name="checkmark" size={m(16)} color="#FFFFFF" />
              )}
            </View>
            <Text style={styles.checkboxText}>
              I agree to share my Aadhaar number and verify my identity through Aadhaar OTP for loan application and KYC purposes.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.continueButtonContainer,
              !agreed && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!agreed}>
            <LinearGradient
              colors={agreed ? [BRAND_NAVY, BRAND_TEAL] : ['#C8D8D3', '#8FCAB8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueButtonGradient}>
              <Text style={styles.continueButtonText}>Continue with Aadhaar</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.securityNote}>
            <Ionicons name="shield-checkmark-outline" size={m(16)} color="#999" />
            <Text style={styles.securityNoteText}>
              Your data is protected with bank-level encryption
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

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
    paddingTop: m(20),
  },
  headerContent: {
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? m(10) : m(5),
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
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  tagline: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.secondaryRegular,
    color: 'white',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(20),
    padding: m(24),
    marginTop: m(10),
    borderWidth: 1,
    borderColor: BRAND_BORDER,
    elevation: 8,
    shadowColor: BRAND_TEAL,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: m(16),
  },
  iconCircle: {
    width: m(80),
    height: m(80),
    borderRadius: m(40),
    backgroundColor: BRAND_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BRAND_BORDER,
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
    color: '#5E687E',
    textAlign: 'center',
    lineHeight: m(22),
    marginBottom: m(20),
  },
  detailsContainer: {
    marginBottom: m(20),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: m(16),
  },
  detailIconContainer: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    backgroundColor: BRAND_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(12),
    marginTop: m(2),
  },
  detailTextContainer: {
    flex: 1,
  },
  detailText: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primaryRegular,
    color: '#555',
    lineHeight: m(22),
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: m(20),
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: m(24),
  },
  checkbox: {
    width: m(22),
    height: m(22),
    borderRadius: m(6),
    borderWidth: 2,
    borderColor: '#CCCCCC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(12),
    marginTop: m(2),
  },
  checkboxChecked: {
    backgroundColor: BRAND_TEAL,
    borderColor: BRAND_TEAL,
  },
  checkboxText: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#555',
    lineHeight: m(20),
  },
  continueButtonContainer: {
    borderRadius: m(12),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: BRAND_TEAL,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  continueButtonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Platform.OS === 'android' ? m(16) : m(0),
    gap: m(8),
  },
  continueButtonText: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.primarySemiBold,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    paddingVertical: Platform.OS === 'android' ? m(1) : m(16),
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: m(16),
    gap: m(6),
  },
  securityNoteText: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.primaryRegular,
    color: '#999',
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
