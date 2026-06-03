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

export default function ConsentScreen({ navigation, route }) {
  const [agreed, setAgreed] = useState(false);
  const { source } = route.params || {};

   const handleContinue = () => {
     if (!agreed) {
       return;
     }
     navigation.navigate('EnterAadhaarScreen', {
       aadhaarNumber: route?.params?.aadhaarNumber,
       source,
     });
   };

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
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.appName}>LoanHub</Text>
          </View>
          <Text style={styles.tagline}>Smart Loan Management</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="finger-print-outline" size={m(40)} color="#ff6700" />
            </View>
          </View>

          <Text style={styles.title}>Verify Your Identity with Aadhaar</Text>

          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="shield-checkmark-outline" size={m(20)} color="#ff6700" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailText}>
                  Your Aadhaar number will be used only for eKYC verification as per RBI guidelines.
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="call-outline" size={m(20)} color="#ff6700" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailText}>
                  An OTP will be sent to your Aadhaar-linked mobile number.
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="lock-closed-outline" size={m(20)} color="#ff6700" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailText}>
                  Your Aadhaar data will be encrypted and stored securely.
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="refresh-outline" size={m(20)} color="#ff6700" />
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
              colors={agreed ? ['#ff6700', '#ff7900', '#ff8500'] : ['#cccccc', '#b3b3b3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueButtonGradient}>
              <Text style={styles.continueButtonText}>Continue</Text>
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
    backgroundColor: '#ff6700',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#ff6700',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: m(20),
    paddingTop: m(20),
    paddingBottom: m(40),
    backgroundColor: '#ff6700',
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
    borderColor: '#FFEDD5',
    elevation: 8,
    shadowColor: '#ff6700',
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
    backgroundColor: '#FFF9F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFEDD5',
  },
  title: {
    fontSize: FontSizes['2xl'],
    fontFamily: FontFamily.secondaryBold,
    color: '#333',
    textAlign: 'center',
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
    backgroundColor: '#FFF9F0',
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
    backgroundColor: '#ff6700',
    borderColor: '#ff6700',
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
    shadowColor: '#ff6700',
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
});
