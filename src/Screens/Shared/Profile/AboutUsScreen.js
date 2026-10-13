import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Linking,
  TouchableOpacity,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { m } from '../../../Utils/responsive';
import { colors, FontFamily } from '../../../constants';
import { ScreenWrapper } from '../../../Components/common';

export default function AboutUsScreen({ navigation }) {
  const features = [
    {
      icon: 'file-text',
      title: 'Loan Pipeline',
      description: 'End-to-end deal underwriting, tracking, and compliance.',
    },
    {
      icon: 'bell',
      title: 'Smart Reminders',
      description: 'Automated installment nudges & dispute escalation.',
    },
    {
      icon: 'shield',
      title: 'Fraud Guard',
      description: 'DigiLocker KYC verification and risk scoring.',
    },
    {
      icon: 'trending-up',
      title: 'Macro Analytics',
      description: 'Live lender yield, portfolio exposure, and delinquency.',
    },
  ];

  const socialLinks = [
    { icon: 'globe', label: 'Website', url: 'https://loanhub.com' },
    { icon: 'twitter', label: 'Twitter', url: 'https://twitter.com/loanhub' },
    { icon: 'linkedin', label: 'LinkedIn', url: 'https://linkedin.com/company/loanhub' },
    { icon: 'instagram', label: 'Instagram', url: 'https://instagram.com/loanhub' },
  ];

  const handleOpenLink = (url) => {
    Linking.openURL(url).catch(err => console.error('Error opening URL:', err));
  };

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

          <Text style={styles.headerTitle}>About Us</Text>

          <View style={styles.headerPlaceholder} />
        </View>

        {/* Curved Sheet Container */}
        <View style={styles.sheetSection}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Ocean Blue Hero Brand Card */}
            <View style={styles.heroBanner}>
              <View style={styles.logoBadge}>
                <Feather name="dollar-sign" size={m(28)} color={colors.white} />
              </View>
              <Text style={styles.appName}>LoanHub Platform</Text>
              <Text style={styles.appTagline}>
                Next-generation SaaS infrastructure for private lending institutions and borrowers.
              </Text>
              <View style={styles.versionBadge}>
                <Text style={styles.versionText}>Enterprise Version 2.4.0</Text>
              </View>
            </View>

            {/* Performance Stats Strip */}
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>50K+</Text>
                <Text style={styles.statLabel}>Active Users</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>₹10Cr+</Text>
                <Text style={styles.statLabel}>Volume Managed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>4.9★</Text>
                <Text style={styles.statLabel}>User Rating</Text>
              </View>
            </View>

            {/* Mission Statement Card */}
            <View style={styles.missionCard}>
              <View style={styles.missionHeader}>
                <View style={styles.missionIconCircle}>
                  <Feather name="target" size={m(16)} color={colors.white} />
                </View>
                <Text style={styles.missionTitle}>Our Mission</Text>
              </View>
              <Text style={styles.missionText}>
                We empower lenders with institutional-grade underwriting tools while providing borrowers transparent, direct access to capital. Designed for speed, security, and verified trust.
              </Text>
            </View>

            {/* Platform Features Grid */}
            <View style={styles.featuresSection}>
              <Text style={styles.sectionTitle}>What We Provide</Text>
              <View style={styles.featuresGrid}>
                {features.map((feature, index) => (
                  <View key={index} style={styles.featureCard}>
                    <View style={styles.featureIconCircle}>
                      <Feather name={feature.icon} size={m(16)} color={colors.white} />
                    </View>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDesc}>{feature.description}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Connect With Us */}
            <View style={styles.socialSection}>
              <Text style={styles.sectionTitle}>Connect With Us</Text>
              <View style={styles.socialGrid}>
                {socialLinks.map((link, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.socialBtn}
                    onPress={() => handleOpenLink(link.url)}
                    activeOpacity={0.8}
                  >
                    <Feather name={link.icon} size={m(16)} color={colors.lettersAndIcons} />
                    <Text style={styles.socialLabel}>{link.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Contact Card */}
            <View style={styles.contactCard}>
              <View style={styles.contactIconCircle}>
                <Feather name="mail" size={m(18)} color={colors.white} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Direct Support Line</Text>
                <Text style={styles.contactDetail}>support@loanhub.internal</Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerHeart}>Engineered with precision for FinTech operations</Text>
              <Text style={styles.copyrightText}>© 2026 LoanHub. All rights reserved.</Text>
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

  // Ocean Blue Brand Hero Banner
  heroBanner: {
    backgroundColor: colors.oceanBlueButton,
    borderRadius: m(22),
    padding: m(22),
    alignItems: 'center',
    marginBottom: m(14),
    shadowColor: colors.oceanBlueButton,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  logoBadge: {
    width: m(60),
    height: m(60),
    borderRadius: m(20),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(12),
  },
  appName: {
    fontSize: m(22),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
    marginBottom: m(4),
  },
  appTagline: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryMedium,
    color: 'rgba(255, 255, 255, 0.88)',
    textAlign: 'center',
    lineHeight: m(18),
    marginBottom: m(12),
    paddingHorizontal: m(10),
  },
  versionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: m(12),
    paddingVertical: m(4),
    borderRadius: m(12),
  },
  versionText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },

  // Stats Card
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(16),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: m(17),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  statLabel: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: '#5A7A71',
    marginTop: m(2),
  },
  statDivider: {
    width: 1,
    height: m(24),
    backgroundColor: '#E2E8F0',
  },

  // Mission Card
  missionCard: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(16),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    marginBottom: m(8),
  },
  missionIconCircle: {
    width: m(30),
    height: m(30),
    borderRadius: m(15),
    backgroundColor: '#52A6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  missionTitle: {
    fontSize: m(14.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  missionText: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryRegular,
    color: '#4A6563',
    lineHeight: m(19),
  },

  // Features
  featuresSection: {
    marginBottom: m(14),
  },
  sectionTitle: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: '#5A7A71',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: m(10),
    marginLeft: m(4),
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(10),
  },
  featureCard: {
    width: '48.5%',
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(14),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
  },
  featureIconCircle: {
    width: m(34),
    height: m(34),
    borderRadius: m(17),
    backgroundColor: '#52A6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(8),
  },
  featureTitle: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(3),
  },
  featureDesc: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: '#5A7A71',
    lineHeight: m(15),
  },

  // Social
  socialSection: {
    marginBottom: m(14),
  },
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(8),
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
    backgroundColor: colors.white,
    paddingHorizontal: m(14),
    paddingVertical: m(9),
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
  },
  socialLabel: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },

  // Contact Card
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(14),
    gap: m(12),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
  },
  contactIconCircle: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
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
  contactDetail: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryMedium,
    color: '#5A7A71',
    marginTop: m(2),
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: m(10),
  },
  footerHeart: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryMedium,
    color: '#7E9D86',
  },
  copyrightText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: '#94A3B8',
    marginTop: m(3),
  },
});
