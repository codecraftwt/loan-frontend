import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { m } from '../../Utils/responsive';
import { colors, FontFamily } from '../../constants';
import { ScreenWrapper } from '../../Components/common';
import helpData from '../../data/helpData';

export default function HelpAndSupportScreen() {
  const navigation = useNavigation();
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(0);

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessage('');
      setSubject('');
      Toast.show({
        type: 'success',
        position: 'top',
        text1: 'Message sent successfully!',
        text2: "We'll get back to you within 24 hours.",
      });
    } else {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Please enter a message before sending.',
      });
    }
  };

  const handleQuickHelpPress = title => {
    Toast.show({
      type: 'info',
      position: 'top',
      text1: `${title} Section`,
      text2: 'Knowledge base resources are opening...',
    });
  };

  // Quick Help Tiles
  const quickHelpOptions = [
    {
      id: 'guides',
      title: 'Guides',
      desc: 'Step-by-step',
      icon: 'book-open',
      color: '#00D09E',
      bgColor: '#DFF7E2',
    },
    {
      id: 'tutorials',
      title: 'Tutorials',
      desc: 'Video demos',
      icon: 'video',
      color: '#0068FF',
      bgColor: '#E6F0FF',
    },
    {
      id: 'community',
      title: 'Community',
      desc: 'Peer forum',
      icon: 'users',
      color: '#7C3AED',
      bgColor: '#F3E8FF',
    },
    {
      id: 'resources',
      title: 'Resources',
      desc: 'Doc & PDFs',
      icon: 'download-cloud',
      color: '#F59E0B',
      bgColor: '#FEF3C7',
    },
  ];

  // Comprehensive FAQs combining helpData and relevant platform questions
  const faqs = [
    ...(helpData?.faq || []),
    {
      question: 'How do I check my loan application status?',
      answer:
        'You can view real-time status updates from your Dashboard or by navigating to Loans > My Applications.',
    },
    {
      question: 'What documents are required for KYC verification?',
      answer:
        'Standard verification requires a government-issued photo ID (Aadhaar / PAN), recent address proof, and bank statements from the last 3-6 months.',
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
            <Feather name="chevron-left" size={m(22)} color={colors.white} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Help & Support</Text>

          <View style={styles.headerPlaceholder} />
        </View>

        {/* Curved Sheet Container */}
        <View style={styles.sheetSection}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Ocean Blue Hero Banner */}
            <View style={styles.heroBanner}>
              <View style={styles.heroTopRow}>
                <View style={styles.heroIconBox}>
                  <Feather name="help-circle" size={m(24)} color={colors.white} />
                </View>
                <View style={styles.statusPill}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusPillText}>Support Active</Text>
                </View>
              </View>

              <Text style={styles.heroTitle}>How can we help?</Text>
              <Text style={styles.heroSubtitle}>
                Browse guides, search frequent solutions, or connect with our specialized support team directly.
              </Text>
            </View>

            {/* Quick Help Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick Help</Text>
              <Text style={styles.sectionSubtext}>Self-service resources</Text>
            </View>

            <View style={styles.quickHelpGrid}>
              {quickHelpOptions.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.quickCard}
                  activeOpacity={0.75}
                  onPress={() => handleQuickHelpPress(item.title)}
                >
                  <View
                    style={[styles.quickIconCircle, { backgroundColor: item.bgColor }]}
                  >
                    <Feather name={item.icon} size={m(20)} color={item.color} />
                  </View>
                  <Text style={styles.quickCardTitle}>{item.title}</Text>
                  <Text style={styles.quickCardDesc}>{item.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Frequently Asked Questions Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
              <Text style={styles.sectionSubtext}>Tap any question to view answers</Text>
            </View>

            <View style={styles.faqList}>
              {faqs.map((faq, index) => {
                const isExpanded = expandedFaq === index;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.faqCard, isExpanded && styles.faqCardActive]}
                    activeOpacity={0.8}
                    onPress={() => setExpandedFaq(isExpanded ? null : index)}
                  >
                    <View style={styles.faqHeaderRow}>
                      <View style={styles.faqQuestionContainer}>
                        <View style={[styles.faqBadge, isExpanded && styles.faqBadgeActive]}>
                          <Text style={[styles.faqBadgeText, isExpanded && styles.faqBadgeTextActive]}>
                            Q
                          </Text>
                        </View>
                        <Text style={styles.faqQuestionText}>{faq.question}</Text>
                      </View>
                      <Feather
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={m(18)}
                        color={isExpanded ? colors.primary : colors.lettersAndIcons}
                      />
                    </View>

                    {isExpanded && (
                      <View style={styles.faqAnswerContainer}>
                        <View style={styles.faqDivider} />
                        <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Direct Contact Channels */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Contact Channels</Text>
              <Text style={styles.sectionSubtext}>Reach out directly to an agent</Text>
            </View>

            <View style={styles.contactList}>
              {/* Email Support */}
              <TouchableOpacity
                style={styles.contactCard}
                activeOpacity={0.75}
                onPress={() => Linking.openURL('mailto:support@loanhub.com')}
              >
                <View style={[styles.contactIconBox, { backgroundColor: '#E6F0FF' }]}>
                  <Feather name="mail" size={m(20)} color="#0068FF" />
                </View>
                <View style={styles.contactDetails}>
                  <View style={styles.contactTitleRow}>
                    <Text style={styles.contactTitle}>Email Support</Text>
                    <View style={styles.contactBadge}>
                      <Text style={styles.contactBadgeText}>24h Response</Text>
                    </View>
                  </View>
                  <Text style={styles.contactValue}>support@loanhub.com</Text>
                </View>
                <Feather name="chevron-right" size={m(18)} color="#7E9D86" />
              </TouchableOpacity>

              {/* Phone Helpline */}
              <TouchableOpacity
                style={styles.contactCard}
                activeOpacity={0.75}
                onPress={() => Linking.openURL('tel:+9118001234567')}
              >
                <View style={[styles.contactIconBox, { backgroundColor: '#DFF7E2' }]}>
                  <Feather name="phone-call" size={m(20)} color="#00D09E" />
                </View>
                <View style={styles.contactDetails}>
                  <View style={styles.contactTitleRow}>
                    <Text style={styles.contactTitle}>Toll-Free Helpline</Text>
                    <View style={[styles.contactBadge, { backgroundColor: '#DFF7E2' }]}>
                      <Text style={[styles.contactBadgeText, { color: '#008764' }]}>Mon-Fri</Text>
                    </View>
                  </View>
                  <Text style={styles.contactValue}>+91 1800 123 4567</Text>
                </View>
                <Feather name="chevron-right" size={m(18)} color="#7E9D86" />
              </TouchableOpacity>
            </View>

            {/* Send Us a Message Form */}
            <View style={styles.messageFormCard}>
              <View style={styles.messageFormHeader}>
                <View style={styles.formIconCircle}>
                  <Feather name="message-square" size={m(18)} color={colors.white} />
                </View>
                <View style={styles.formHeaderText}>
                  <Text style={styles.formTitle}>Send us a Message</Text>
                  <Text style={styles.formSubtitle}>Our team typically responds within 24 hours</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Subject</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Query regarding repayment"
                  placeholderTextColor="#8EABA3"
                  value={subject}
                  onChangeText={setSubject}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Message</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Describe your issue or question in detail..."
                  placeholderTextColor="#8EABA3"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !message.trim() && styles.sendButtonDisabled,
                ]}
                activeOpacity={0.8}
                onPress={handleSendMessage}
                disabled={!message.trim()}
              >
                <Feather name="send" size={m(16)} color={colors.white} />
                <Text style={styles.sendButtonText}>Send Message</Text>
              </TouchableOpacity>
            </View>

            {/* Operating Hours & Security Footer */}
            <View style={styles.footerCard}>
              <View style={styles.footerRow}>
                <Feather name="clock" size={m(15)} color="#5A7A71" />
                <Text style={styles.footerText}>
                  Support Hours: 9:00 AM – 6:00 PM IST (Mon - Fri)
                </Text>
              </View>
              <View style={styles.footerRow}>
                <Feather name="shield" size={m(15)} color="#5A7A71" />
                <Text style={styles.footerSubText}>
                  Bank-grade encrypted & secure customer support.
                </Text>
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
    paddingBottom: m(50),
  },

  // Ocean Blue Hero Banner
  heroBanner: {
    backgroundColor: colors.oceanBlueButton,
    borderRadius: m(22),
    padding: m(18),
    marginBottom: m(20),
    shadowColor: colors.oceanBlueButton,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(12),
  },
  heroIconBox: {
    width: m(42),
    height: m(42),
    borderRadius: m(14),
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: m(10),
    paddingVertical: m(4),
    borderRadius: m(12),
    gap: m(6),
  },
  statusDot: {
    width: m(6),
    height: m(6),
    borderRadius: m(3),
    backgroundColor: '#00D09E',
  },
  statusPillText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  heroTitle: {
    fontSize: m(22),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
    marginBottom: m(4),
  },
  heroSubtitle: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryMedium,
    color: 'rgba(255, 255, 255, 0.88)',
    lineHeight: m(18),
  },

  // Section Headers
  sectionHeader: {
    marginBottom: m(12),
  },
  sectionTitle: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  sectionSubtext: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryMedium,
    color: '#5A7A71',
    marginTop: m(1),
  },

  // Quick Help 2x2 Grid
  quickHelpGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: m(10),
    marginBottom: m(22),
  },
  quickCard: {
    width: '48.5%',
    backgroundColor: colors.white,
    borderRadius: m(18),
    padding: m(14),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  quickIconCircle: {
    width: m(38),
    height: m(38),
    borderRadius: m(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(10),
  },
  quickCardTitle: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  quickCardDesc: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: '#5A7A71',
    marginTop: m(2),
  },

  // FAQ Accordion
  faqList: {
    marginBottom: m(22),
    gap: m(10),
  },
  faqCard: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(14),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  faqCardActive: {
    borderColor: 'rgba(0, 208, 158, 0.35)',
  },
  faqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: m(8),
    gap: m(10),
  },
  faqBadge: {
    width: m(24),
    height: m(24),
    borderRadius: m(8),
    backgroundColor: '#F1FFF3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqBadgeActive: {
    backgroundColor: colors.lightGreen,
  },
  faqBadgeText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: '#5A7A71',
  },
  faqBadgeTextActive: {
    color: colors.lettersAndIcons,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    lineHeight: m(18),
  },
  faqAnswerContainer: {
    marginTop: m(10),
  },
  faqDivider: {
    height: 1,
    backgroundColor: 'rgba(9, 48, 48, 0.06)',
    marginBottom: m(10),
  },
  faqAnswerText: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryRegular,
    color: '#4A6563',
    lineHeight: m(19),
  },

  // Contact List
  contactList: {
    gap: m(10),
    marginBottom: m(22),
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(14),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  contactIconBox: {
    width: m(42),
    height: m(42),
    borderRadius: m(14),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(12),
  },
  contactDetails: {
    flex: 1,
  },
  contactTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
  },
  contactTitle: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  contactBadge: {
    backgroundColor: '#E6F0FF',
    paddingHorizontal: m(8),
    paddingVertical: m(2),
    borderRadius: m(8),
  },
  contactBadgeText: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: '#0068FF',
  },
  contactValue: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryMedium,
    color: '#5A7A71',
    marginTop: m(2),
  },

  // Send Message Card
  messageFormCard: {
    backgroundColor: colors.white,
    borderRadius: m(20),
    padding: m(16),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: m(20),
  },
  messageFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(12),
    marginBottom: m(16),
  },
  formIconCircle: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formHeaderText: {
    flex: 1,
  },
  formTitle: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  formSubtitle: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: '#5A7A71',
    marginTop: m(1),
  },
  inputGroup: {
    marginBottom: m(12),
  },
  inputLabel: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(6),
  },
  textInput: {
    backgroundColor: '#F8FCF9',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.1)',
    paddingHorizontal: m(12),
    paddingVertical: m(10),
    fontSize: m(13),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  textArea: {
    minHeight: m(90),
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.oceanBlueButton,
    borderRadius: m(14),
    paddingVertical: m(12),
    gap: m(8),
    marginTop: m(4),
    shadowColor: colors.oceanBlueButton,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#A0B4B0',
    shadowOpacity: 0,
    elevation: 0,
  },
  sendButtonText: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },

  // Footer Card
  footerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: m(16),
    padding: m(14),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.06)',
    alignItems: 'center',
    gap: m(6),
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  footerText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryMedium,
    color: '#5A7A71',
    textAlign: 'center',
  },
  footerSubText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: '#7E9D86',
    textAlign: 'center',
  },
});