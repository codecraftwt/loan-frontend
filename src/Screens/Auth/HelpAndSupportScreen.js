import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Toast from 'react-native-toast-message';
import { m } from 'walstar-rn-responsive';
import helpData from '../../data/helpData';
import Header from '../../Components/Header';

export default function HelpAndSupportScreen() {
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessage('');
      Toast.show({
        type: 'success',
        position: 'top',
        text1: 'Message sent successfully!',
        text2: 'We\'ll get back to you within 24 hours.',
      });
    } else {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Please enter a message before sending.',
      });
    }
  };

  const FAQItem = ({ item, index }) => (
    <TouchableOpacity style={styles.faqCard} activeOpacity={0.8}>
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>Q: {item.question}</Text>
        {/* <Icon name="chevron-down" size={20} color="#6B7280" /> */}
      </View>
      <Text style={styles.faqAnswer}>A: {item.answer}</Text>
    </TouchableOpacity>
  );

  const ContactOption = ({ icon, title, description, action, isLink = false }) => (
    <TouchableOpacity 
      style={styles.contactOption}
      onPress={action}
      activeOpacity={0.7}>
      <View style={styles.contactIconContainer}>
        <Icon name={icon} size={24} color="#3B82F6" />
      </View>
      <View style={styles.contactTextContainer}>
        <Text style={styles.contactTitle}>{title}</Text>
        <Text style={styles.contactDescription}>{description}</Text>
        {isLink && (
          <Text style={styles.contactLink}>Tap to open →</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Help & Support"
        showBackButton
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <Icon name="help-circle" size={40} color="#3B82F6" />
          </View>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSubtitle}>
            Find answers to common questions or get in touch with our support team.
          </Text>
        </View>

        {/* Quick Help Cards */}
        <Text style={styles.sectionTitle}>Quick Help</Text>
        <View style={styles.quickHelpGrid}>
          <TouchableOpacity style={styles.helpCard}>
            <Icon name="book-open" size={24} color="#10B981" />
            <Text style={styles.helpCardTitle}>Guides</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.helpCard}>
            <Icon name="video" size={24} color="#EF4444" />
            <Text style={styles.helpCardTitle}>Tutorials</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.helpCard}>
            <Icon name="message-circle" size={24} color="#F59E0B" />
            <Text style={styles.helpCardTitle}>Community</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.helpCard}>
            <Icon name="download" size={24} color="#8B5CF6" />
            <Text style={styles.helpCardTitle}>Resources</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {helpData.faq.map((item, index) => (
          <FAQItem key={index} item={item} index={index} />
        ))}

        {/* Contact Support Section */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          <Text style={styles.sectionDescription}>
            Get in touch with our support team for personalized assistance.
          </Text>

          <ContactOption
            icon="mail"
            title="Email Support"
            description="support@loanhub.com"
            action={() => Linking.openURL('mailto:support@loanhub.com')}
            isLink={true}
          />

          <ContactOption
            icon="phone"
            title="Call Us"
            description="+1 (800) 123-4567"
            action={() => Linking.openURL('tel:+18001234567')}
            isLink={true}
          />

          <ContactOption
            icon="message-square"
            title="Meetup"
            description="Available 9AM-6PM, Mon-Fri"
            action={() => {}}
          />
        </View>

        {/* Send Message Section */}
        <View style={styles.messageSection}>
          <Text style={styles.sectionTitle}>Send us a Message</Text>
          <View style={styles.messageInputContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Describe your issue or question..."
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              placeholderTextColor="#9CA3AF"
            />
            <View style={styles.messageFooter}>
              <Text style={styles.messageHint}>
                Our team typically responds within 24 hours
              </Text>
              <TouchableOpacity
                style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
                onPress={handleSendMessage}
                disabled={!message.trim()}>
                <Icon name="send" size={18} color="#FFFFFF" />
                <Text style={styles.sendButtonText}>Send Message</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Icon name="clock" size={16} color="#6B7280" />
          <Text style={styles.footerText}>
            Support Hours: 9AM - 6PM, Monday to Friday
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

  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: m(32),
  },
  heroIcon: {
    width: m(80),
    height: m(80),
    borderRadius: m(40),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(16),
  },
  heroTitle: {
    fontSize: m(28),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(8),
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: m(16),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: m(24),
    maxWidth: '90%',
  },

  // Quick Help
  sectionTitle: {
    fontSize: m(20),
    fontWeight: '600',
    color: '#111827',
    marginBottom: m(16),
  },
  quickHelpGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(12),
    marginBottom: m(32),
  },
  helpCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    padding: m(16),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  helpCardTitle: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#374151',
    marginTop: m(8),
  },

  // FAQ Section
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(12),
    padding: m(16),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(8),
  },
  faqQuestion: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  faqAnswer: {
    fontSize: m(14),
    color: '#6B7280',
    lineHeight: m(20),
  },

  // Contact Section
  contactSection: {
    marginBottom: m(32),
  },
  sectionDescription: {
    fontSize: m(14),
    color: '#6B7280',
    marginBottom: m(16),
    lineHeight: m(20),
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: m(12),
    padding: m(16),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contactIconContainer: {
    width: m(48),
    height: m(48),
    borderRadius: m(12),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(16),
  },
  contactTextContainer: {
    flex: 1,
  },
  contactTitle: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#111827',
    marginBottom: m(4),
  },
  contactDescription: {
    fontSize: m(14),
    color: '#6B7280',
    marginBottom: m(4),
  },
  contactLink: {
    fontSize: m(12),
    color: '#3B82F6',
    fontWeight: '500',
  },

  // Message Section
  messageSection: {
    marginBottom: m(32),
  },
  messageInputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  messageInput: {
    minHeight: m(120),
    padding: m(16),
    fontSize: m(16),
    color: '#111827',
    textAlignVertical: 'top',
  },
  messageFooter: {
    padding: m(16),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  messageHint: {
    fontSize: m(12),
    color: '#9CA3AF',
    marginBottom: m(12),
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
    borderRadius: m(12),
    padding: m(14),
    gap: m(8),
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  sendButtonText: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Links Section
  linksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(8),
    marginBottom: m(32),
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: m(20),
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    gap: m(6),
  },
  linkText: {
    fontSize: m(14),
    color: '#3B82F6',
    fontWeight: '500',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
    padding: m(16),
    backgroundColor: '#FFFFFF',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  footerText: {
    fontSize: m(14),
    color: '#6B7280',
  },
});