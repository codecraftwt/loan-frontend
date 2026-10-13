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

export default function PrivacyPolicyScreen({ navigation }) {
  const sections = [
    {
      title: 'Information We Collect',
      icon: 'database',
      items: [
        'Personal identification information (name, email, phone number)',
        'DigiLocker / Aadhaar verification records for KYC',
        'Financial records and loan agreement data',
        'Device diagnostic data and app interactions',
        'Optional location services (with explicit permission)',
      ],
    },
    {
      title: 'How We Use Your Information',
      icon: 'sliders',
      items: [
        'To provision and maintain the loan management ecosystem',
        'To process underwriting workflows and automated reminders',
        'To verify counterparty identity and reduce fraud risk',
        'To improve platform security and user experience',
        'To transmit regulatory compliance audit logs',
      ],
    },
    {
      title: 'Data Protection & Security',
      icon: 'shield',
      items: [
        'AES-256 end-to-end encryption for stored sensitive payloads',
        'TLS 1.3 transport security across all API endpoints',
        'Role-based access control with multi-factor authentication',
        'Encrypted database snapshots and hot-standby redundancy',
        'Continuous automated vulnerability and compliance monitoring',
      ],
    },
    {
      title: 'Data Sharing & Disclosure',
      icon: 'share-2',
      items: [
        'We never sell or commercialize your personal information',
        'Data shared only with authorized lenders or KYC providers',
        'Third-party services operate under strict confidentiality NDAs',
        'Disclosures made only when mandated by regulatory court orders',
        'Anonymized aggregates used solely for macro analytics',
      ],
    },
    {
      title: 'Your Privacy Rights',
      icon: 'user-check',
      items: [
        'Inspect and access your verified profile dossier anytime',
        'Request correction of outdated information',
        'Export your transaction history in structured format',
        'Opt-out of non-essential analytical notifications',
        'Request account closure subject to active loan resolution',
      ],
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

          <Text style={styles.headerTitle}>Privacy Policy</Text>

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
                <Feather name="shield" size={m(24)} color={colors.white} />
              </View>
              <Text style={styles.heroTitle}>Privacy Policy</Text>
              <Text style={styles.heroSubtitle}>Last updated: January 2026 • Encrypted Dossiers</Text>
            </View>

            {/* Intro Notice */}
            <View style={styles.introCard}>
              <Feather name="lock" size={m(16)} color={colors.primary} style={styles.introIcon} />
              <Text style={styles.introText}>
                Your privacy and data security are core tenets of LoanHub. This policy details how your sensitive financial credentials and dossiers are safeguarded.
              </Text>
            </View>

            {/* Policy Sections */}
            {sections.map((section, index) => (
              <View key={index} style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconCircle}>
                    <Feather name={section.icon} size={m(15)} color={colors.white} />
                  </View>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>
                <View style={styles.sectionItemsList}>
                  {section.items.map((item, itemIndex) => (
                    <View key={itemIndex} style={styles.listItem}>
                      <View style={styles.checkCircle}>
                        <Feather name="check" size={m(11)} color={colors.primary} />
                      </View>
                      <Text style={styles.listItemText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            {/* Data Retention Notice Card */}
            <View style={styles.retentionCard}>
              <View style={styles.retentionHeader}>
                <Feather name="clock" size={m(16)} color="#0068FF" />
                <Text style={styles.retentionTitle}>Data Retention Policy</Text>
              </View>
              <Text style={styles.retentionText}>
                Records are retained while your subscription account remains active. After settlement, legal audit logs are maintained for statutory periods compliant with financial regulations.
              </Text>
            </View>

            {/* Contact Support Card */}
            <View style={styles.contactCard}>
              <View style={styles.contactIconCircle}>
                <Feather name="mail" size={m(18)} color={colors.white} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Data Protection Officer</Text>
                <Text style={styles.contactSubtitle}>privacy@loanhub.internal</Text>
              </View>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(10),
    marginBottom: m(12),
  },
  sectionIconCircle: {
    width: m(32),
    height: m(32),
    borderRadius: m(16),
    backgroundColor: '#52A6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: m(14.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  sectionItemsList: {
    gap: m(8),
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: m(8),
  },
  checkCircle: {
    width: m(18),
    height: m(18),
    borderRadius: m(9),
    backgroundColor: '#DFF7E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: m(2),
  },
  listItemText: {
    flex: 1,
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryRegular,
    color: '#4A6563',
    lineHeight: m(18),
  },

  // Data Retention Card
  retentionCard: {
    backgroundColor: '#F1F7FF',
    borderRadius: m(14),
    padding: m(14),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 255, 0.15)',
  },
  retentionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    marginBottom: m(6),
  },
  retentionTitle: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: '#0068FF',
  },
  retentionText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
    lineHeight: m(18),
  },

  // Contact Card
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: m(14),
    padding: m(14),
    gap: m(12),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
  },
  contactIconCircle: {
    width: m(40),
    height: m(40),
    borderRadius: m(20),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  contactSubtitle: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryMedium,
    color: '#5A7A71',
    marginTop: m(2),
  },
});
