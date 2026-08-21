import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { m } from 'walstar-rn-responsive';
import { FontFamily, FontSizes } from '../../../constants';
import aadhaarKycAPI from '../../../Services/aadhaarKycService';

export default function EnterAadhaarScreen({ navigation, route }) {
  const [aadhaarNumber, setAadhaarNumber] = useState(route?.params?.aadhaarNumber || '');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleAadhaarChange = text => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 12) {
      setAadhaarNumber(numericText);
      setError('');
    }
  };

  const handleSendOtp = async () => {
    if (aadhaarNumber.length !== 12) {
      setError('Enter a valid 12 digit Aadhaar number.');
      return;
    }

    try {
      setIsSending(true);
      const response = await aadhaarKycAPI.sendOtp({
        aadhaarNumber,
        consentAccepted: true,
      });

      Toast.show({
        type: 'success',
        position: 'top',
        text1: response?.message || 'OTP sent successfully.',
        text2: response?.mockOtp ? `Test OTP: ${response.mockOtp}` : undefined,
      });

      navigation.navigate('VerifyAadhaarOtpScreen', {
        aadhaarNumber,
        transactionId: response?.transactionId || response?.txnId,
      });
    } catch (apiError) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1:
          apiError?.response?.data?.message ||
          apiError?.message ||
          'Unable to send OTP. Please try again.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor="#ff6700" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerContent}>
          <Text style={styles.appName}>LoanHub</Text>
          <Text style={styles.tagline}>Aadhaar eKYC Verification</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="id-card-outline" size={m(40)} color="#ff6700" />
          </View>

          <Text style={styles.title}>Enter Aadhaar Number</Text>
          <Text style={styles.subtitle}>
           We will send an OTP for verification
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Aadhaar Number</Text>
            <View style={[styles.inputContainer, error ? styles.inputError : {}]}>
              <Ionicons
                name="finger-print-outline"
                size={20}
                color={error ? '#FF4444' : '#ff7900'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={aadhaarNumber}
                onChangeText={handleAadhaarChange}
                placeholder="Enter 12 digit Aadhaar number"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                maxLength={12}
              />
              {aadhaarNumber.length === 12 && !error ? (
                <Ionicons name="checkmark-circle" size={20} color="#28a745" />
              ) : null}
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isSending && styles.disabledButton]}
            onPress={handleSendOtp}
            disabled={isSending}>
            <LinearGradient
              colors={['#ff6700', '#ff7900', '#ff8500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}>
              {isSending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Send OTP</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
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
    paddingTop: Platform.OS === 'ios' ? m(52) : m(32),
    paddingBottom: m(40),
    backgroundColor: '#ff6700',
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
    borderWidth: 1,
    borderColor: '#FFEDD5',
    elevation: 8,
    shadowColor: '#ff6700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  iconCircle: {
    width: m(80),
    height: m(80),
    borderRadius: m(40),
    backgroundColor: '#FFF9F0',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#FFEDD5',
    marginBottom: m(16),
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
    marginBottom: m(24),
  },
  inputGroup: {
    marginBottom: m(24),
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
    backgroundColor: '#FFF9F0',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#FFEDD5',
    paddingHorizontal: m(16),
    height: m(56),
  },
  inputError: {
    borderColor: '#FF4444',
  },
  inputIcon: {
    marginRight: m(12),
  },
  input: {
    flex: 1,
    fontSize: FontSizes.md,
    fontFamily: FontFamily.primaryRegular,
    color: '#333',
    padding: 0,
  },
  errorText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#FF4444',
    marginTop: m(6),
  },
  primaryButton: {
    borderRadius: m(12),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#ff6700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  disabledButton: {
    opacity: 0.7,
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
});
