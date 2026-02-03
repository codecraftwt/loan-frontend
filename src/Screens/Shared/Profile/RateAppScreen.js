import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import Toast from 'react-native-toast-message';

export default function RateAppScreen({ navigation }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const ratingLabels = [
    { stars: 1, label: 'Poor', emoji: '😞' },
    { stars: 2, label: 'Fair', emoji: '😐' },
    { stars: 3, label: 'Good', emoji: '🙂' },
    { stars: 4, label: 'Great', emoji: '😊' },
    { stars: 5, label: 'Excellent', emoji: '🤩' },
  ];

  const feedbackPrompts = [
    'What do you like most about the app?',
    'Any features you would like us to add?',
    'How can we improve your experience?',
  ];

  const getCurrentRatingInfo = () => {
    return ratingLabels.find(r => r.stars === rating) || null;
  };

  const handleOpenStore = () => {
    const storeUrl = Platform.select({
      ios: 'https://apps.apple.com/app/loanhub/id123456789',
      android: 'https://play.google.com/store/apps/details?id=com.loanhub',
    });
    Linking.openURL(storeUrl).catch(err =>
      console.error('Error opening store:', err),
    );
  };

  const handleSubmitFeedback = () => {
    if (rating === 0) {
      Toast.show({
        type: 'error',
        text1: 'Please select a rating',
        text2: 'Tap on the stars to rate the app',
      });
      return;
    }

    // Simulate submission
    setSubmitted(true);
    Toast.show({
      type: 'success',
      text1: 'Thank you for your feedback!',
      text2: 'Your review helps us improve the app',
    });
  };

  if (submitted) {
    return (
      <View style={styles.container}>
        <Header title="Rate App" showBackButton />
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <Icon name="check-circle" size={64} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>Thank You!</Text>
          <Text style={styles.successSubtitle}>
            Your feedback has been submitted successfully.
          </Text>

          {rating >= 4 && (
            <View style={styles.storePromptCard}>
              <Text style={styles.storePromptTitle}>
                Enjoying LoanHub?
              </Text>
              <Text style={styles.storePromptText}>
                Help others discover the app by leaving a review on the{' '}
                {Platform.OS === 'ios' ? 'App Store' : 'Play Store'}!
              </Text>
              <TouchableOpacity
                style={styles.storeButton}
                onPress={handleOpenStore}
                activeOpacity={0.8}>
                <Icon
                  name={Platform.OS === 'ios' ? 'smartphone' : 'play'}
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.storeButtonText}>
                  Rate on {Platform.OS === 'ios' ? 'App Store' : 'Play Store'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}>
            <Icon name="arrow-left" size={18} color="#6B7280" />
            <Text style={styles.backButtonText}>Back to Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Rate App" showBackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerIconContainer}>
            <Icon name="star" size={36} color="#F59E0B" />
          </View>
          <Text style={styles.headerTitle}>Rate LoanHub</Text>
          <Text style={styles.headerSubtitle}>
            We'd love to hear your thoughts about the app
          </Text>
        </View>

        {/* Rating Stars */}
        <View style={styles.ratingCard}>
          <Text style={styles.ratingPrompt}>How would you rate your experience?</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map(star => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                activeOpacity={0.7}
                style={styles.starButton}>
                <Icon
                  name="star"
                  size={40}
                  color={star <= rating ? '#F59E0B' : '#E5E7EB'}
                  style={star <= rating ? styles.filledStar : {}}
                />
              </TouchableOpacity>
            ))}
          </View>
          {getCurrentRatingInfo() && (
            <View style={styles.ratingLabelContainer}>
              <Text style={styles.ratingEmoji}>
                {getCurrentRatingInfo().emoji}
              </Text>
              <Text style={styles.ratingLabel}>
                {getCurrentRatingInfo().label}
              </Text>
            </View>
          )}
        </View>

        {/* Feedback Section */}
        {rating > 0 && (
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackTitle}>Share Your Feedback</Text>
            <Text style={styles.feedbackHint}>
              {feedbackPrompts[Math.floor(Math.random() * feedbackPrompts.length)]}
            </Text>
            <TextInput
              style={styles.feedbackInput}
              placeholder="Tell us what you think..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={feedback}
              onChangeText={setFeedback}
            />
          </View>
        )}

        {/* Quick Feedback Tags */}
        {rating > 0 && rating < 4 && (
          <View style={styles.tagsCard}>
            <Text style={styles.tagsTitle}>What could be better?</Text>
            <View style={styles.tagsContainer}>
              {[
                'App Speed',
                'User Interface',
                'Features',
                'Bugs',
                'Navigation',
                'Notifications',
              ].map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.tag}
                  activeOpacity={0.7}>
                  <Text style={styles.tagText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            rating === 0 && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmitFeedback}
          activeOpacity={0.8}
          disabled={rating === 0}>
          <Icon
            name="send"
            size={20}
            color={rating === 0 ? '#9CA3AF' : '#FFFFFF'}
          />
          <Text
            style={[
              styles.submitButtonText,
              rating === 0 && styles.submitButtonTextDisabled,
            ]}>
            Submit Feedback
          </Text>
        </TouchableOpacity>

        {/* Store Rating Option */}
        <View style={styles.storeCard}>
          <View style={styles.storeInfo}>
            <Icon
              name={Platform.OS === 'ios' ? 'smartphone' : 'play'}
              size={24}
              color="#3B82F6"
            />
            <View style={styles.storeTextContainer}>
              <Text style={styles.storeTitle}>
                Rate on {Platform.OS === 'ios' ? 'App Store' : 'Play Store'}
              </Text>
              <Text style={styles.storeSubtitle}>
                Your review helps others discover LoanHub
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.storeLink}
            onPress={handleOpenStore}
            activeOpacity={0.7}>
            <Icon name="external-link" size={20} color="#3B82F6" />
          </TouchableOpacity>
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
    backgroundColor: '#FFFBEB',
    borderRadius: m(20),
    padding: m(28),
    alignItems: 'center',
    marginBottom: m(20),
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  headerIconContainer: {
    width: m(72),
    height: m(72),
    borderRadius: m(36),
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(16),
  },
  headerTitle: {
    fontSize: m(24),
    fontWeight: '700',
    color: '#92400E',
    marginBottom: m(8),
  },
  headerSubtitle: {
    fontSize: m(14),
    color: '#B45309',
    textAlign: 'center',
  },
  ratingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    padding: m(24),
    alignItems: 'center',
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ratingPrompt: {
    fontSize: m(16),
    fontWeight: '500',
    color: '#374151',
    marginBottom: m(20),
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: m(8),
  },
  starButton: {
    padding: m(4),
  },
  filledStar: {
    textShadowColor: 'rgba(245, 158, 11, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  ratingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: m(20),
    gap: m(8),
  },
  ratingEmoji: {
    fontSize: m(28),
  },
  ratingLabel: {
    fontSize: m(18),
    fontWeight: '600',
    color: '#F59E0B',
  },
  feedbackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    padding: m(20),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  feedbackTitle: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#111827',
    marginBottom: m(6),
  },
  feedbackHint: {
    fontSize: m(13),
    color: '#6B7280',
    marginBottom: m(14),
  },
  feedbackInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: m(12),
    padding: m(14),
    fontSize: m(14),
    color: '#374151',
    minHeight: m(120),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tagsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    padding: m(20),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tagsTitle: {
    fontSize: m(14),
    fontWeight: '500',
    color: '#374151',
    marginBottom: m(12),
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(8),
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: m(14),
    paddingVertical: m(8),
    borderRadius: m(20),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tagText: {
    fontSize: m(13),
    color: '#4B5563',
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    paddingVertical: m(16),
    borderRadius: m(14),
    gap: m(10),
    marginBottom: m(20),
  },
  submitButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  submitButtonText: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submitButtonTextDisabled: {
    color: '#9CA3AF',
  },
  storeCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: m(14),
    padding: m(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(14),
    flex: 1,
  },
  storeTextContainer: {
    flex: 1,
  },
  storeTitle: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#1E40AF',
  },
  storeSubtitle: {
    fontSize: m(12),
    color: '#3B82F6',
    marginTop: m(2),
  },
  storeLink: {
    padding: m(8),
  },

  // Success State Styles
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: m(24),
  },
  successIconContainer: {
    marginBottom: m(24),
  },
  successTitle: {
    fontSize: m(28),
    fontWeight: '700',
    color: '#10B981',
    marginBottom: m(12),
  },
  successSubtitle: {
    fontSize: m(16),
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: m(32),
  },
  storePromptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    padding: m(24),
    width: '100%',
    alignItems: 'center',
    marginBottom: m(24),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  storePromptTitle: {
    fontSize: m(18),
    fontWeight: '600',
    color: '#111827',
    marginBottom: m(8),
  },
  storePromptText: {
    fontSize: m(14),
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: m(20),
    lineHeight: m(22),
  },
  storeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: m(14),
    paddingHorizontal: m(24),
    borderRadius: m(12),
    gap: m(10),
  },
  storeButtonText: {
    fontSize: m(15),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    paddingVertical: m(12),
  },
  backButtonText: {
    fontSize: m(15),
    color: '#6B7280',
    fontWeight: '500',
  },
});
