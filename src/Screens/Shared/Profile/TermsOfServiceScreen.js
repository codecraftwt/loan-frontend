import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { m } from '../../../Utils/responsive';
import { colors, FontFamily } from '../../../constants';
import { ScreenWrapper } from '../../../Components/common';

export default function TermsOfServiceScreen({ navigation }) {
  const sections = [
    {
      title: '1. Acceptance of Terms',
      content:
        'By accessing and using the LoanHub application, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.',
    },
    {
      title: '2. Description of Service',
      content:
        'LoanHub provides a platform for managing personal loans between lenders and borrowers. Our service facilitates loan tracking, payment management, and financial record keeping. We do not provide financial advice or act as a financial institution.',
    },
    {
      title: '3. User Accounts',
      content:
        'To use our services, you must create an account with accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use.',
    },
    {
      title: '4. User Responsibilities',
      content:
        'Users agree to use the service only for lawful purposes and in accordance with these terms. You shall not use the service to engage in any fraudulent, misleading, or illegal activities. All loan agreements made through the platform are between the respective parties.',
    },
    {
      title: '5. Privacy & Data',
      content:
        'Your use of the service is also governed by our Privacy Policy. We collect and process personal data as described in our Privacy Policy. By using our service, you consent to such processing and warrant that all data provided by you is accurate.',
    },
    {
      title: '6. Intellectual Property',
      content:
        'The service and its original content, features, and functionality are owned by LoanHub and are protected by international copyright, trademark, and other intellectual property laws. You may not copy, modify, or distribute any part of our service without permission.',
    },
    {
      title: '7. Limitation of Liability',
      content:
        'LoanHub shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service. We do not guarantee the accuracy of loan calculations or the reliability of user-provided information.',
    },
    {
      title: '8. Termination',
      content:
        'We may terminate or suspend your account and access to the service immediately, without prior notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties, or for any other reason at our sole discretion.',
    },
    {
      title: '9. Changes to Terms',
      content:
        'We reserve the right to modify these terms at any time. We will notify users of any material changes via the app or email. Your continued use of the service after such modifications constitutes acceptance of the updated terms.',
    },
    {
      title: '10. Contact Information',
      content:
        'If you have any questions about these Terms of Service, please contact us at support@loanhub.com or through our in-app support feature.',
    },
  ];

  return (
    <ScreenWrapper
      backgroundColor={colors.backgroundGreenWhite}
      topInsetBg={colors.primary}
      statusBarColor={colors.primary}
      statusBarStyle="dark-content"
      includeTabBarClearance={false}
      scrollable={false}
    >
      <View style={styles.pageWrapper}>
        {/* Fixed Top Mint Green Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={m(22)} color={colors.white} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Terms of Service</Text>

          <View style={styles.headerPlaceholder} />
        </View>

        {/* Curved Sheet Container */}
        <View style={styles.sheetSection}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header Badge Card */}
            <View style={styles.heroCard}>
              <View style={styles.heroIconCircle}>
                <Feather name="file-text" size={m(24)} color={colors.white} />
              </View>
              <Text style={styles.heroTitle}>Terms of Service</Text>
              <Text style={styles.heroSubtitle}>Last updated: January 2026</Text>
            </View>

            {/* Intro Notice */}
            <View style={styles.introCard}>
              <Feather name="info" size={m(16)} color={colors.primary} style={styles.introIcon} />
              <Text style={styles.introText}>
                Welcome to LoanHub. These terms outline the rules and regulations for the use of our platform. Please read them carefully.
              </Text>
            </View>

            {/* Terms Sections */}
            {sections.map((section, index) => (
              <View key={index} style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionContent}>{section.content}</Text>
              </View>
            ))}

            {/* Footer Consent Notice */}
            <View style={styles.footerCard}>
              <Feather name="check-circle" size={m(18)} color={colors.primary} />
              <Text style={styles.footerText}>
                By using LoanHub, you agree to comply with these terms of service.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  pageWrapper: {
    flex: 1,
    backgroundColor: colors.primary,
  },

  // Fixed Top Mint Green Header
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: m(18),
    paddingTop: m(12),
    paddingBottom: m(16),
  },
  backBtn: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    backgroundColor: 'rgba(9, 48, 48, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: m(19),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: m(36),
  },

  // Curved Sheet
  sheetSection: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(36),
    borderTopRightRadius: m(36),
    paddingTop: m(18),
  },
  scrollContent: {
    paddingHorizontal: m(18),
    paddingBottom: m(80),
  },

  // Hero Card
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: m(18),
    padding: m(20),
    alignItems: 'center',
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  heroIconCircle: {
    width: m(54),
    height: m(54),
    borderRadius: m(27),
    backgroundColor: '#52A6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(10),
    shadowColor: '#52A6FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  heroTitle: {
    fontSize: m(18),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(4),
  },
  heroSubtitle: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryMedium,
    color: '#5A7A71',
  },

  // Intro Notice
  introCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.lightGreen,
    borderRadius: m(14),
    padding: m(14),
    marginBottom: m(14),
  },
  introIcon: {
    marginTop: m(2),
    marginRight: m(10),
  },
  introText: {
    flex: 1,
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
    lineHeight: m(18),
  },

  // Section Cards
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(16),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: m(14.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(6),
  },
  sectionContent: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryRegular,
    color: '#4A6563',
    lineHeight: m(19),
  },

  // Footer Card
  footerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: m(14),
    padding: m(14),
    gap: m(10),
    marginTop: m(4),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 158, 0.3)',
  },
  footerText: {
    flex: 1,
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
});
