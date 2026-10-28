import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { m } from '../../../Utils/responsive';
import { colors, FontFamily } from '../../../constants';
import { ScreenWrapper } from '../../../Components/common';
import Toast from 'react-native-toast-message';
import { ratingAPI } from '../../../Services/ratingService';

export default function RateAppScreen({ navigation }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const ratingLabels = [
    { stars: 1, label: 'Poor', emoji: '😞' },
    { stars: 2, label: 'Fair', emoji: '😐' },
    { stars: 3, label: 'Good', emoji: '🙂' },
    { stars: 4, label: 'Great', emoji: '😊' },
    { stars: 5, label: 'Excellent', emoji: '🤩' },
  ];

  const feedbackPrompts = [
    'What do you like most about the platform?',
    'Any underwriting features you would like us to add?',
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

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      Toast.show({
        type: 'error',
        text1: 'Please select a rating',
        text2: 'Tap on the stars to rate the app',
      });
      return;
    }

    setLoading(true);
    try {
      const payload = { rating, feedback, selectedOptions };
      const response = await ratingAPI.submitRating(payload);

      if (response.success) {
        setSubmitted(true);
        Toast.show({
          type: 'success',
          text1: 'Thank you for your feedback!',
          text2: 'Your review helps us improve the app',
        });
      } else {
        throw new Error(response.message || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Rating submission error:', error);
      Toast.show({
        type: 'error',
        text1: 'Submission failed',
        text2: error.message || 'Please try again later',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTagToggle = (tag) => {
    setSelectedOptions(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const fetchExistingRating = async () => {
    try {
      const response = await ratingAPI.getUserRating();
      if (response.success) {
        setRating(response.data.rating);
        setFeedback(response.data.feedback || '');
        setSelectedOptions(response.data.selectedOptions || []);
        setSubmitted(true);
      }
    } catch (error) {
      // No existing rating, continue with empty state
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchExistingRating();
  }, []);

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

          <Text style={styles.headerTitle}>Rate App</Text>

          <View style={styles.headerPlaceholder} />
        </View>

        {/* Curved Sheet Container */}
        <View style={styles.sheetSection}>
          {initialLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : submitted ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.successCard}>
                <View style={styles.successIconCircle}>
                  <Feather name="check" size={m(36)} color={colors.white} />
                </View>
                <Text style={styles.successTitle}>Thank You!</Text>
                <Text style={styles.successSubtitle}>
                  Your feedback has been submitted successfully and helps us build a better platform.
                </Text>

                {rating >= 4 && (
                  <View style={styles.storeCard}>
                    <Text style={styles.storeCardTitle}>Enjoying LoanHub?</Text>
                    <Text style={styles.storeCardSubtitle}>
                      Help others discover the platform by leaving a rating on the {Platform.OS === 'ios' ? 'App Store' : 'Google Play Store'}!
                    </Text>
                    <TouchableOpacity
                      style={styles.storeBtn}
                      activeOpacity={0.85}
                      onPress={handleOpenStore}
                    >
                      <Feather name="external-link" size={m(16)} color={colors.white} />
                      <Text style={styles.storeBtnText}>
                        Rate on {Platform.OS === 'ios' ? 'App Store' : 'Play Store'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.backToSettingsBtn}
                  activeOpacity={0.75}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.backToSettingsText}>Back to Settings</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header Hero Card */}
              <View style={styles.heroCard}>
                <View style={styles.heroIconCircle}>
                  <Feather name="star" size={m(24)} color={colors.white} />
                </View>
                <Text style={styles.heroTitle}>Rate LoanHub</Text>
                <Text style={styles.heroSubtitle}>
                  We value your feedback to constantly elevate your experience
                </Text>
              </View>

              {/* Stars Selection Card */}
              <View style={styles.ratingCard}>
                <Text style={styles.ratingPrompt}>How would you rate your experience?</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      activeOpacity={0.7}
                      style={styles.starBtn}
                    >
                      <Feather
                        name="star"
                        size={m(32)}
                        color={star <= rating ? '#F59E0B' : '#CBD5E1'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                {getCurrentRatingInfo() && (
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingEmoji}>{getCurrentRatingInfo().emoji}</Text>
                    <Text style={styles.ratingLabel}>{getCurrentRatingInfo().label}</Text>
                  </View>
                )}
              </View>

              {/* Quick Feedback Tags (for constructive ratings < 4) */}
              {rating > 0 && rating < 4 && (
                <View style={styles.tagsCard}>
                  <Text style={styles.tagsTitle}>What could we improve?</Text>
                  <View style={styles.tagsContainer}>
                    {[
                      'App Speed',
                      'User Interface',
                      'Features',
                      'Navigation',
                      'Notifications',
                      'Reports',
                    ].map((tag, index) => {
                      const isSelected = selectedOptions.includes(tag);
                      return (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.tagPill,
                            isSelected && styles.tagPillSelected,
                          ]}
                          activeOpacity={0.7}
                          onPress={() => handleTagToggle(tag)}
                        >
                          <Text
                            style={[
                              styles.tagText,
                              isSelected && styles.tagTextSelected,
                            ]}
                          >
                            {tag}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Detailed Feedback Textarea */}
              {rating > 0 && (
                <View style={styles.feedbackCard}>
                  <Text style={styles.feedbackTitle}>Share Your Thoughts</Text>
                  <Text style={styles.feedbackHint}>
                    {feedbackPrompts[0]}
                  </Text>
                  <View style={styles.textareaContainer}>
                    <TextInput
                      style={styles.textarea}
                      placeholder="Tell us what you like or what we can do better..."
                      placeholderTextColor="#7E9D86"
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      value={feedback}
                      onChangeText={setFeedback}
                    />
                  </View>
                </View>
              )}

              {/* Submit Button */}
              <View style={styles.actionSection}>
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    rating === 0 && styles.submitBtnDisabled,
                  ]}
                  activeOpacity={0.85}
                  onPress={handleSubmitFeedback}
                  disabled={rating === 0 || loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.lettersAndIcons} />
                  ) : (
                    <Text
                      style={[
                        styles.submitBtnText,
                        rating === 0 && styles.submitBtnTextDisabled,
                      ]}
                    >
                      Submit Feedback
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Store Option Strip */}
                <TouchableOpacity
                  style={styles.storeStrip}
                  onPress={handleOpenStore}
                  activeOpacity={0.75}
                >
                  <Feather name="external-link" size={m(16)} color="#0068FF" />
                  <Text style={styles.storeStripText}>
                    Rate directly on {Platform.OS === 'ios' ? 'App Store' : 'Play Store'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    textAlign: 'center',
    paddingHorizontal: m(16),
  },

  // Rating Stars Card
  ratingCard: {
    backgroundColor: colors.white,
    borderRadius: m(18),
    padding: m(20),
    alignItems: 'center',
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
  },
  ratingPrompt: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(16),
  },
  starsRow: {
    flexDirection: 'row',
    gap: m(14),
    marginBottom: m(14),
  },
  starBtn: {
    padding: m(4),
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    backgroundColor: '#FFF7ED',
    paddingHorizontal: m(14),
    paddingVertical: m(6),
    borderRadius: m(16),
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  ratingEmoji: {
    fontSize: m(16),
  },
  ratingLabel: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: '#D97706',
  },

  // Tags
  tagsCard: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(16),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
  },
  tagsTitle: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(10),
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(8),
  },
  tagPill: {
    backgroundColor: colors.lightGreen,
    paddingHorizontal: m(14),
    paddingVertical: m(7),
    borderRadius: m(14),
  },
  tagPillSelected: {
    backgroundColor: colors.primary,
  },
  tagText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  tagTextSelected: {
    fontFamily: FontFamily.primaryBold,
  },

  // Feedback Textarea
  feedbackCard: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(16),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
  },
  feedbackTitle: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(4),
  },
  feedbackHint: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryRegular,
    color: '#5A7A71',
    marginBottom: m(10),
  },
  textareaContainer: {
    backgroundColor: colors.lightGreen,
    borderRadius: m(16),
    padding: m(12),
    minHeight: m(90),
  },
  textarea: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
    padding: 0,
  },

  // Actions
  actionSection: {
    gap: m(10),
    marginTop: m(4),
  },
  submitBtn: {
    backgroundColor: colors.primary,
    height: m(50),
    borderRadius: m(25),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  submitBtnTextDisabled: {
    color: '#94A3B8',
  },
  storeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
    paddingVertical: m(10),
  },
  storeStripText: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryBold,
    color: '#0068FF',
  },

  // Success Card
  successCard: {
    backgroundColor: colors.white,
    borderRadius: m(20),
    padding: m(24),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    marginTop: m(10),
  },
  successIconCircle: {
    width: m(72),
    height: m(72),
    borderRadius: m(36),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(16),
  },
  successTitle: {
    fontSize: m(20),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(6),
  },
  successSubtitle: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryRegular,
    color: '#5A7A71',
    textAlign: 'center',
    lineHeight: m(18),
    marginBottom: m(20),
  },
  storeCard: {
    backgroundColor: '#F1F7FF',
    borderRadius: m(16),
    padding: m(16),
    alignItems: 'center',
    width: '100%',
    marginBottom: m(18),
    borderWidth: 1,
    borderColor: 'rgba(0, 104, 255, 0.15)',
  },
  storeCardTitle: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(4),
  },
  storeCardSubtitle: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: '#4A6563',
    textAlign: 'center',
    lineHeight: m(17),
    marginBottom: m(14),
  },
  storeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    backgroundColor: colors.oceanBlueButton,
    paddingHorizontal: m(18),
    paddingVertical: m(10),
    borderRadius: m(20),
  },
  storeBtnText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  backToSettingsBtn: {
    paddingVertical: m(8),
  },
  backToSettingsText: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
});
