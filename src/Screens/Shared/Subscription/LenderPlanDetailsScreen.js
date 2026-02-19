import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import Header from '../../../Components/Header';
import moment from 'moment';
import { useSubscription } from '../../../hooks/useSubscription';
import { useSelector } from 'react-redux';

const DetailItem = ({ icon, label, value, isHighlight }) => {
  return (
    <View style={[
      styles.detailItem,
      isHighlight && styles.highlightDetailItem
    ]}>
      <View style={[
        styles.detailIconContainer,
        isHighlight && styles.highlightDetailIcon
      ]}>
        <Icon name={icon} size={22} color={isHighlight ? "#FFFFFF" : "#00A550"} />
      </View>
      <View style={styles.detailContent}>
        <Text style={[
          styles.detailLabel,
          isHighlight && styles.highlightDetailLabel
        ]}>
          {label}
        </Text>
        <Text style={[
          styles.detailValue,
          isHighlight && styles.highlightDetailValue
        ]}>
          {value || 'N/A'}
        </Text>
      </View>
    </View>
  );
};

const FeatureItem = ({ feature, isActive }) => {
  return (
    <View style={[
      styles.featureItem,
      isActive && styles.activeFeatureItem
    ]}>
      <View style={[
        styles.featureIconContainer,
        isActive && styles.activeFeatureIcon
      ]}>
        <Icon
          name="check"
          size={18}
          color={isActive ? "#00A550" : "#FF9800"}
        />
      </View>
      <Text style={[
        styles.featureText,
        isActive && styles.activeFeatureText
      ]}>
        {feature}
      </Text>
    </View>
  );
};

export default function LenderPlanDetailsScreen({ route, navigation }) {
  const { plan, isActivePlan } = route.params || {};
  const user = useSelector(state => state.auth.user);

  const {
    activePlan,
    hasActivePlan,
    purchaseDate,
    expiryDate,
    remainingDays,
    purchaseSubscription,
    purchaseLoading,
    getActivePlan,
  } = useSubscription();

  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isActivePlan) {
      getActivePlan();
    }
  }, [isActivePlan]);

  if (!plan && !isActivePlan) {
    return (
      <View style={styles.container}>
        <Header title="Plan Details" showBackButton />
        <View style={styles.errorContainer}>
          <View style={styles.errorIconWrapper}>
            <Icon name="alert-circle" size={64} color="#FF9800" />
          </View>
          <Text style={styles.errorTitle}>Plan Not Found</Text>
          <Text style={styles.errorText}>The requested plan could not be loaded</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <LinearGradient
              colors={['#FF9800', '#FF5722']}
              style={styles.backButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}>
              <Icon name="arrow-left" size={20} color="#FFFFFF" />
              <Text style={styles.backButtonText}>Go Back</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Use active plan data if viewing active plan, otherwise use passed plan
  const displayPlan = isActivePlan && activePlan ? activePlan : plan;
  const planName = displayPlan?.planName || displayPlan?.name || 'Plan';
  const planPrice = displayPlan?.priceMonthly || displayPlan?.amount || 0;
  const planDuration = displayPlan?.duration || 'N/A';
  const planDescription = displayPlan?.description || 'Unlimited loans with premium features';
  const planFeatures = displayPlan?.features || [
    'Unlimited loans',
    ...(displayPlan?.planFeatures?.advancedAnalytics ? ['Advanced Analytics'] : []),
    ...(displayPlan?.planFeatures?.prioritySupport ? ['Priority Support'] : []),
  ];

  const planInfo = [
    {
      icon: 'tag',
      label: 'Plan Name',
      value: planName,
    },
    {
      icon: 'clock',
      label: 'Duration',
      value: planDuration,
    },
    {
      icon: 'dollar-sign',
      label: 'Price',
      value: `₹${planPrice?.toLocaleString() || '0'}`,
    },
  ];

  // Add active plan specific info
  const activePlanInfo = [];
  if (isActivePlan && activePlan) {
    activePlanInfo.push(
      {
        icon: 'calendar',
        label: 'Purchase Date',
        value: purchaseDate
          ? moment(purchaseDate).format('DD MMM YYYY, hh:mm A')
          : 'N/A',
      },
      {
        icon: 'calendar',
        label: 'Expiry Date',
        value: expiryDate
          ? moment(expiryDate).format('DD MMM YYYY, hh:mm A')
          : 'N/A',
      },
      {
        icon: 'clock',
        label: 'Remaining Days',
        value: remainingDays > 0 ? `${remainingDays} days` : 'Expired',
        isHighlight: true,
      }
    );
  }

  const handleBuyPlan = async () => {
    if (!displayPlan?._id) {
      Alert.alert('Error', 'Plan ID is missing');
      return;
    }

    if (hasActivePlan && remainingDays > 0) {
      Alert.alert(
        'Active Plan',
        `You already have an active plan. It expires in ${remainingDays} days. Would you like to purchase a new plan?`,
        [
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      proceedWithPurchase();
    }
  };

  const proceedWithPurchase = async () => {
    setProcessing(true);

    try {
      const result = await purchaseSubscription(displayPlan._id, user);

      if (result.success) {
        await getActivePlan();

        Alert.alert(
          'Success!',
          result.message || 'Plan purchased and activated successfully!',
          [
            {
              text: 'Great!',
              onPress: () => {
                navigation.goBack();
              }
            },
          ]
        );
      } else if (result.type === 'CANCELLED') {
        Alert.alert(
          'Payment Cancelled',
          'You have cancelled the payment. You can try again whenever you\'re ready.',
          [{ text: 'OK' }]
        );
      } else {
        let errorMessage = result.message || 'Payment failed. Please try again.';

        // Sanitize raw JSON / API error objects that aren't user-friendly
        if (
          errorMessage.startsWith('{') ||
          errorMessage.startsWith('[') ||
          errorMessage === 'undefined'
        ) {
          errorMessage = 'Payment failed. Please try again.';
        }

        if (result.message?.includes('signature') || result.message?.includes('verification')) {
          errorMessage = result.message +
            (result.paymentId ? `\n\nPayment ID: ${result.paymentId}` : '') +
            '\n\nPlease contact support if this issue persists.';
        }

        Alert.alert('Payment Failed', errorMessage, [{ text: 'OK' }]);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error.message || 'An error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={isActivePlan ? 'My Active Plan' : 'Plan Details'}
        showBackButton
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#FFF3E0', '#FFECB3']}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <View style={styles.heroContent}>
              <View style={styles.planIconContainer}>
                <Icon
                  name={isActivePlan ? "shield" : "star"}
                  size={30}
                  color="#FF9800"
                />
                <Text style={styles.planName}>{planName}</Text>
              </View>
              <Text style={styles.planDescription}>
                {planDescription}
              </Text>
              <View style={styles.priceContainer}>
                <Text style={styles.priceText}>₹{planPrice?.toLocaleString()}</Text>
                <Text style={styles.durationText}>/{planDuration}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Plan Status Banner */}
        {isActivePlan && (
          <View style={styles.statusBanner}>
            <LinearGradient
              colors={
                remainingDays > 7
                  ? ['#4CAF50', '#66BB6A']
                  : remainingDays > 0
                    ? ['#FF9800', '#FF5722']
                    : ['#F44336', '#E53935']
              }
              style={styles.statusGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}>
              <View style={styles.statusContent}>
                <Icon
                  name={
                    remainingDays > 7
                      ? "check-circle"
                      : remainingDays > 0
                        ? "alert-circle"
                        : "x-circle"
                  }
                  size={24}
                  color="#FFFFFF"
                />
                <View style={styles.statusTextContainer}>
                  <Text style={styles.statusTitle}>
                    {remainingDays > 0 ? 'Active Plan' : 'Plan Expired'}
                  </Text>
                  <Text style={styles.statusSubtitle}>
                    {remainingDays > 0
                      ? `${remainingDays} ${remainingDays === 1 ? 'day' : 'days'} remaining`
                      : 'Renew now to continue creating loans'
                    }
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Plan Details Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Icon name="info" size={22} color="#FF9800" />
            <Text style={styles.sectionTitle}>Plan Information</Text>
          </View>
          <View style={styles.detailsGrid}>
            {planInfo.map((item, index) => (
              <DetailItem
                key={index}
                icon={item.icon}
                label={item.label}
                value={item.value}
              />
            ))}
          </View>
        </View>

        {/* Active Plan Details */}
        {isActivePlan && activePlanInfo.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Icon name="activity" size={22} color="#FF9800" />
              <Text style={styles.sectionTitle}>Active Plan Details</Text>
            </View>
            <View style={styles.detailsGrid}>
              {activePlanInfo.map((item, index) => (
                <DetailItem
                  key={index}
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
                  isHighlight={item.isHighlight}
                />
              ))}
            </View>
          </View>
        )}

        {/* Plan Features Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Icon name="check-square" size={22} color="#FF9800" />
            <Text style={styles.sectionTitle}>Included Features</Text>
          </View>
          <View style={styles.featuresGrid}>
            {planFeatures.map((feature, index) => (
              <FeatureItem
                key={index}
                feature={feature}
                isActive={true}
              />
            ))}
          </View>
        </View>

        {/* Additional Features */}
        <View style={styles.additionalFeaturesSection}>
          <Text style={styles.additionalFeaturesTitle}>All Plans Include</Text>
          <View style={styles.additionalFeaturesGrid}>
            <View style={styles.additionalFeature}>
              <View style={styles.additionalFeatureIcon}>
                <Icon name="shield" size={20} color="#FF9800" />
              </View>
              <Text style={styles.additionalFeatureText}>Secure Platform</Text>
            </View>
            <View style={styles.additionalFeature}>
              <View style={styles.additionalFeatureIcon}>
                <Icon name="headphones" size={20} color="#FF9800" />
              </View>
              <Text style={styles.additionalFeatureText}>24/7 Support</Text>
            </View>
            <View style={styles.additionalFeature}>
              <View style={styles.additionalFeatureIcon}>
                <Icon name="trending-up" size={20} color="#FF9800" />
              </View>
              <Text style={styles.additionalFeatureText}>Real-time Updates</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {!isActivePlan && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.buyButton,
                (purchaseLoading || processing) && styles.buyButtonDisabled,
              ]}
              onPress={handleBuyPlan}
              disabled={purchaseLoading || processing}>
              <LinearGradient
                colors={['#FF9800', '#FF5722']}
                style={styles.buyGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}>
                {purchaseLoading || processing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="shopping-cart" size={22} color="#FFFFFF" />
                    <Text style={styles.buyButtonText}>
                      {purchaseLoading || processing
                        ? 'Processing...'
                        : 'Get This Plan'}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.goBack()}>
              <Text style={styles.secondaryButtonText}>View All Plans</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#FFFFFF',
  },
  errorIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  backButton: {
    width: '80%',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  backButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 10,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  heroSection: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  heroGradient: {
    padding: 25,
  },
  heroContent: {
    alignItems: 'center',
  },
  planIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20, 
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 152, 0, 0.2)',
    marginBottom: 16,
  },
  planName: {
    marginLeft: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  durationText: {
    fontSize: 16,
    color: '#999',
    marginLeft: 4,
  },
  statusBanner: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statusGradient: {
    padding: 20,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#333',
  },
  detailsGrid: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBF5',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFF3E0',
  },
  highlightDetailItem: {
     backgroundColor: '#FF9800',
    borderColor: '#FF9800',
  },
  detailIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
     backgroundColor: '#D0F0C0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  highlightDetailIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  highlightDetailLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  highlightDetailValue: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  featuresGrid: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBF5',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFF3E0',
  },
  activeFeatureItem: {
    backgroundColor: 'rgba(255, 152, 0, 0.05)',
    borderColor: 'rgba(255, 152, 0, 0.2)',
  },
  featureIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activeFeatureIcon: {
    backgroundColor: '#D0F0C0',
  },
  featureText: {
    fontSize: 15,
    color: '#555',
    flex: 1,
  },
  activeFeatureText: {
    color: '#333',
    fontWeight: '500',
  },
  additionalFeaturesSection: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#FFFBF5',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#FFF3E0',
  },
  additionalFeaturesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  additionalFeaturesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  additionalFeature: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 10,
  },
  additionalFeatureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  additionalFeatureText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  actionsContainer: {
    marginHorizontal: 20,
    marginTop: 30,
    gap: 12,
  },
  buyButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buyButtonDisabled: {
    opacity: 0.7,
  },
  buyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FF9800',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  secondaryButtonText: {
    color: '#FF9800',
    fontSize: 16,
    fontWeight: '600',
  },
});