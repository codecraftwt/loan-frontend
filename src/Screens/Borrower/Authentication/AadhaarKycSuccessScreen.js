import React from 'react';
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

export default function AadhaarKycSuccessScreen({ navigation }) {
  const handleContinue = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'BottomNavigation' }],
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#ff6700" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerContent}>
          <Text style={styles.appName}>LoanHub</Text>
          <Text style={styles.tagline}>Aadhaar eKYC Verification</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={m(48)} color="#FFFFFF" />
          </View>

          <Text style={styles.title}>eKYC Success</Text>
          <Text style={styles.subtitle}>
            Your Aadhaar OTP verification is complete and your borrower profile is marked verified.
          </Text>

          <View style={styles.statusBox}>
            <Ionicons name="shield-checkmark-outline" size={m(22)} color="#28a745" />
            <Text style={styles.statusText}>Borrower Profile Verified</Text>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleContinue}>
            <LinearGradient
              colors={['#ff6700', '#ff7900', '#ff8500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}>
              <Text style={styles.primaryButtonText}>Continue</Text>
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
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    elevation: 8,
    shadowColor: '#ff6700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  successCircle: {
    width: m(88),
    height: m(88),
    borderRadius: m(44),
    backgroundColor: '#28a745',
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
    backgroundColor: '#F0FFF4',
    borderWidth: 1,
    borderColor: '#B7E4C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
    marginBottom: m(24),
  },
  statusText: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: '#1B7F3A',
  },
  primaryButton: {
    width: '100%',
    borderRadius: m(12),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#ff6700',
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
});
