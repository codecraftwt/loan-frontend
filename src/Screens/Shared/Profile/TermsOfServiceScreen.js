import {
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';

export default function TermsOfServiceScreen() {
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
    <View style={styles.container}>
      <Header title="Terms of Service" showBackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerIconContainer}>
            <Icon name="file-text" size={32} color="#FF9800" />
          </View>
          <Text style={styles.headerTitle}>Terms of Service</Text>
          <Text style={styles.headerSubtitle}>
            Last updated: January 2026
          </Text>
        </View>

        {/* Introduction */}
        <View style={styles.introCard}>
          <Text style={styles.introText}>
            Welcome to LoanHub. These terms and conditions outline the rules and
            regulations for the use of our mobile application. Please read these
            terms carefully before using our services.
          </Text>
        </View>

        {/* Terms Sections */}
        {sections.map((section, index) => (
          <View key={index} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footerCard}>
          <Icon name="check-circle" size={24} color="#10B981" />
          <Text style={styles.footerText}>
            By using LoanHub, you agree to these terms of service.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: m(16),
    paddingBottom: m(40),
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    padding: m(24),
    alignItems: 'center',
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerIconContainer: {
    width: m(64),
    height: m(64),
    borderRadius: m(32),
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(16),
  },
  headerTitle: {
    fontSize: m(22),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(8),
  },
  headerSubtitle: {
    fontSize: m(14),
    color: '#6B7280',
  },
  introCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: m(12),
    padding: m(16),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  introText: {
    fontSize: m(14),
    color: '#92400E',
    lineHeight: m(22),
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(12),
    padding: m(16),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#111827',
    marginBottom: m(10),
  },
  sectionContent: {
    fontSize: m(14),
    color: '#4B5563',
    lineHeight: m(22),
  },
  footerCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: m(12),
    padding: m(16),
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(12),
    marginTop: m(8),
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  footerText: {
    flex: 1,
    fontSize: m(14),
    color: '#065F46',
    fontWeight: '500',
  },
});
