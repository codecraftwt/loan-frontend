import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';

export default function PrivacyPolicyScreen() {
  const sections = [
    {
      title: 'Information We Collect',
      icon: 'database',
      items: [
        'Personal identification information (name, email, phone number)',
        'Aadhaar number for identity verification',
        'Financial information related to loan transactions',
        'Device information and usage data',
        'Location data (with your permission)',
      ],
    },
    {
      title: 'How We Use Your Information',
      icon: 'settings',
      items: [
        'To provide and maintain our loan management services',
        'To process transactions and send related notifications',
        'To verify user identity and prevent fraud',
        'To improve our services and user experience',
        'To communicate with you about updates and offers',
      ],
    },
    {
      title: 'Data Security',
      icon: 'shield',
      items: [
        'End-to-end encryption for sensitive data',
        'Secure servers with regular security audits',
        'Access controls and authentication measures',
        'Regular data backups and recovery systems',
        'Compliance with industry security standards',
      ],
    },
    {
      title: 'Data Sharing',
      icon: 'share-2',
      items: [
        'We do not sell your personal information',
        'Data shared only with your explicit consent',
        'Service providers bound by confidentiality agreements',
        'Legal requirements may necessitate disclosure',
        'Anonymized data for analytics and improvements',
      ],
    },
    {
      title: 'Your Rights',
      icon: 'user-check',
      items: [
        'Access your personal data at any time',
        'Request correction of inaccurate information',
        'Delete your account and associated data',
        'Export your data in a portable format',
        'Opt-out of marketing communications',
      ],
    },
    {
      title: 'Cookies & Tracking',
      icon: 'eye',
      items: [
        'Essential cookies for app functionality',
        'Analytics to understand usage patterns',
        'No third-party advertising cookies',
        'You can manage cookie preferences in settings',
        'Session data is cleared upon logout',
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <Header title="Privacy Policy" showBackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerIconContainer}>
            <Icon name="lock" size={32} color="#3B82F6" />
          </View>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <Text style={styles.headerSubtitle}>
            Last updated: January 2026
          </Text>
        </View>

        {/* Introduction */}
        <View style={styles.introCard}>
          <Icon name="info" size={20} color="#1D4ED8" />
          <Text style={styles.introText}>
            Your privacy is important to us. This policy explains how we collect,
            use, and protect your personal information when you use the LoanHub
            application.
          </Text>
        </View>

        {/* Policy Sections */}
        {sections.map((section, index) => (
          <View key={index} style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Icon name={section.icon} size={18} color="#3B82F6" />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.listItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.listItemText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Data Retention Card */}
        <View style={styles.retentionCard}>
          <View style={styles.retentionHeader}>
            <Icon name="clock" size={20} color="#F59E0B" />
            <Text style={styles.retentionTitle}>Data Retention</Text>
          </View>
          <Text style={styles.retentionText}>
            We retain your personal data for as long as your account is active or
            as needed to provide services. After account deletion, we may retain
            certain information for legal compliance for up to 7 years.
          </Text>
        </View>

        {/* Contact Card */}
        <View style={styles.contactCard}>
          <Icon name="mail" size={24} color="#10B981" />
          <View style={styles.contactContent}>
            <Text style={styles.contactTitle}>Questions about your privacy?</Text>
            <Text style={styles.contactText}>
              Contact our Data Protection Officer at privacy@loanhub.com
            </Text>
          </View>
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
    backgroundColor: '#EFF6FF',
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
    backgroundColor: '#EFF6FF',
    borderRadius: m(12),
    padding: m(16),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#BFDBFE',
    flexDirection: 'row',
    gap: m(12),
    alignItems: 'flex-start',
  },
  introText: {
    flex: 1,
    fontSize: m(14),
    color: '#1E40AF',
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(14),
  },
  sectionIconContainer: {
    width: m(32),
    height: m(32),
    borderRadius: m(8),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(12),
  },
  sectionTitle: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#111827',
  },
  sectionContent: {
    paddingLeft: m(4),
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: m(10),
  },
  bulletPoint: {
    width: m(6),
    height: m(6),
    borderRadius: m(3),
    backgroundColor: '#3B82F6',
    marginTop: m(7),
    marginRight: m(12),
  },
  listItemText: {
    flex: 1,
    fontSize: m(14),
    color: '#4B5563',
    lineHeight: m(20),
  },
  retentionCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: m(12),
    padding: m(16),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  retentionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(10),
    marginBottom: m(10),
  },
  retentionTitle: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#92400E',
  },
  retentionText: {
    fontSize: m(14),
    color: '#78350F',
    lineHeight: m(22),
  },
  contactCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: m(12),
    padding: m(16),
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(14),
    marginTop: m(8),
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: m(15),
    fontWeight: '600',
    color: '#065F46',
    marginBottom: m(4),
  },
  contactText: {
    fontSize: m(13),
    color: '#047857',
  },
});
