import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  Linking,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';

export default function AboutUsScreen() {
  const features = [
    {
      icon: 'file-text',
      title: 'Loan Management',
      description: 'Track all your loans in one place with detailed records',
    },
    {
      icon: 'bell',
      title: 'Smart Reminders',
      description: 'Never miss a payment with automated notifications',
    },
    {
      icon: 'shield',
      title: 'Fraud Detection',
      description: 'Advanced security to protect your transactions',
    },
    {
      icon: 'trending-up',
      title: 'Analytics',
      description: 'Comprehensive reports and insights for better decisions',
    },
  ];

  const teamMembers = [
    { name: 'John Doe', role: 'CEO & Founder', avatar: 'J' },
    { name: 'Jane Smith', role: 'CTO', avatar: 'J' },
    { name: 'Mike Johnson', role: 'Head of Design', avatar: 'M' },
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
    <View style={styles.container}>
      <Header title="About Us" showBackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* App Info Card */}
        <View style={styles.appInfoCard}>
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Icon name="dollar-sign" size={40} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.appName}>LoanHub</Text>
          <Text style={styles.appTagline}>
            Your trusted partner for loan management
          </Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </View>

        {/* Mission Card */}
        <View style={styles.missionCard}>
          <View style={styles.missionHeader}>
            <Icon name="target" size={24} color="#FF9800" />
            <Text style={styles.missionTitle}>Our Mission</Text>
          </View>
          <Text style={styles.missionText}>
            At LoanHub, we believe in simplifying personal finance. Our mission is
            to provide a transparent, secure, and user-friendly platform that
            helps individuals manage their lending and borrowing activities with
            ease and confidence.
          </Text>
        </View>

        {/* Features Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>What We Offer</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIconContainer}>
                  <Icon name={feature.icon} size={22} color="#FF9800" />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Team Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Our Team</Text>
          <View style={styles.teamContainer}>
            {teamMembers.map((member, index) => (
              <View key={index} style={styles.teamCard}>
                <View style={styles.teamAvatar}>
                  <Text style={styles.teamAvatarText}>{member.avatar}</Text>
                </View>
                <Text style={styles.teamName}>{member.name}</Text>
                <Text style={styles.teamRole}>{member.role}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>50K+</Text>
            <Text style={styles.statLabel}>Active Users</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹10Cr+</Text>
            <Text style={styles.statLabel}>Loans Managed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>4.8★</Text>
            <Text style={styles.statLabel}>App Rating</Text>
          </View>
        </View>

        {/* Social Links */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Connect With Us</Text>
          <View style={styles.socialContainer}>
            {socialLinks.map((link, index) => (
              <TouchableOpacity
                key={index}
                style={styles.socialButton}
                onPress={() => handleOpenLink(link.url)}
                activeOpacity={0.7}>
                <Icon name={link.icon} size={20} color="#FF9800" />
                <Text style={styles.socialLabel}>{link.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contact Card */}
        <View style={styles.contactCard}>
          <Icon name="mail" size={24} color="#3B82F6" />
          <View style={styles.contactContent}>
            <Text style={styles.contactTitle}>Get in Touch</Text>
            <Text style={styles.contactText}>support@loanhub.com</Text>
            <Text style={styles.contactText}>+91 1800-XXX-XXXX (Toll Free)</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with ❤️ in India
          </Text>
          <Text style={styles.copyrightText}>
            © 2026 LoanHub. All rights reserved.
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
  appInfoCard: {
    backgroundColor: '#FF9800',
    borderRadius: m(20),
    padding: m(28),
    alignItems: 'center',
    marginBottom: m(16),
  },
  logoContainer: {
    marginBottom: m(16),
  },
  logoPlaceholder: {
    width: m(80),
    height: m(80),
    borderRadius: m(20),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: m(28),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: m(8),
  },
  appTagline: {
    fontSize: m(15),
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: m(16),
  },
  versionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: m(16),
    paddingVertical: m(6),
    borderRadius: m(20),
  },
  versionText: {
    fontSize: m(13),
    color: '#FFFFFF',
    fontWeight: '500',
  },
  missionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    padding: m(20),
    marginBottom: m(20),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(12),
    marginBottom: m(14),
  },
  missionTitle: {
    fontSize: m(18),
    fontWeight: '600',
    color: '#111827',
  },
  missionText: {
    fontSize: m(14),
    color: '#4B5563',
    lineHeight: m(24),
  },
  sectionContainer: {
    marginBottom: m(20),
  },
  sectionTitle: {
    fontSize: m(18),
    fontWeight: '600',
    color: '#111827',
    marginBottom: m(14),
    paddingHorizontal: m(4),
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(12),
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: m(14),
    padding: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  featureIconContainer: {
    width: m(44),
    height: m(44),
    borderRadius: m(12),
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(12),
  },
  featureTitle: {
    fontSize: m(15),
    fontWeight: '600',
    color: '#111827',
    marginBottom: m(6),
  },
  featureDescription: {
    fontSize: m(12),
    color: '#6B7280',
    lineHeight: m(18),
  },
  teamContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  teamCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: m(14),
    padding: m(16),
    alignItems: 'center',
    marginHorizontal: m(4),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  teamAvatar: {
    width: m(50),
    height: m(50),
    borderRadius: m(25),
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(10),
  },
  teamAvatarText: {
    fontSize: m(20),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  teamName: {
    fontSize: m(13),
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  teamRole: {
    fontSize: m(11),
    color: '#6B7280',
    textAlign: 'center',
    marginTop: m(4),
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    padding: m(20),
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: m(20),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: m(22),
    fontWeight: '700',
    color: '#FF9800',
  },
  statLabel: {
    fontSize: m(12),
    color: '#6B7280',
    marginTop: m(4),
  },
  statDivider: {
    width: 1,
    height: m(40),
    backgroundColor: '#E5E7EB',
  },
  socialContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(10),
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: m(16),
    paddingVertical: m(12),
    borderRadius: m(12),
    gap: m(10),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  socialLabel: {
    fontSize: m(14),
    fontWeight: '500',
    color: '#374151',
  },
  contactCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: m(16),
    padding: m(20),
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(16),
    marginBottom: m(20),
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: m(6),
  },
  contactText: {
    fontSize: m(13),
    color: '#3B82F6',
    marginBottom: m(2),
  },
  footer: {
    alignItems: 'center',
    paddingVertical: m(16),
  },
  footerText: {
    fontSize: m(14),
    color: '#6B7280',
    marginBottom: m(8),
  },
  copyrightText: {
    fontSize: m(12),
    color: '#9CA3AF',
  },
});
