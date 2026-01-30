import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import Header from '../../../Components/Header';
import { useSubscription } from '../../../hooks/useSubscription';
import { useSelector } from 'react-redux';

const SubscriptionScreen = ({ navigation }) => {
  const {
    plans,
    activePlan,
    hasActivePlan,
    expiryDate,
    remainingDays,
    plansLoading,
    purchaseLoading,
    plansError,
    fetchPlans,
    purchaseSubscription,
    getActivePlan,
  } = useSubscription();

  const user = useSelector(state => state.auth.user);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPlans();
    getActivePlan();
  }, []);

  useEffect(() => {
    if (hasActivePlan && remainingDays <= 0) {
      Alert.alert(
        'Plan Expired',
        'Your plan has expired. Please renew to continue creating loans.',
        [{ text: 'OK', style: 'cancel' }]
      );
    }
  }, [hasActivePlan, remainingDays]);

  const renderPlanFeatures = (features) => {
    return features?.map((feature, index) => (
      <View key={index} style={styles.featureItem}>
        <Icon name="check" size={18} color="#FF9800" style={styles.checkIcon} />
        <Text style={styles.featureText}>{feature}</Text>
      </View>
    ));
  };

  const handlePlanPress = (plan) => {
    navigation.navigate('LenderPlanDetailsScreen', { plan, isActivePlan: false });
  };

  const handleActivePlanPress = () => {
    if (activePlan) {
      navigation.navigate('LenderPlanDetailsScreen', {
        plan: activePlan,
        isActivePlan: true
      });
    }
  };

  const handleBuyFromCard = async (plan, event) => {
    event?.stopPropagation?.();
    if (!plan?._id) {
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
      proceedWithPaymentFromCard(plan);
    }
  };

  const proceedWithPaymentFromCard = async (plan) => {
    setProcessing(true);

    try {
      const result = await purchaseSubscription(plan._id, user);

      if (result.success) {
        await getActivePlan();

        Alert.alert(
          'Success!',
          result.message || 'Plan purchased and activated successfully!',
          [
            {
              text: 'Great!',
              onPress: () => { }
            },
          ]
        );
      } else if (result.type !== 'CANCELLED') {
        let errorMessage = result.message || 'Payment failed. Please try again.';

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

  const renderPlanCard = (plan) => {
    const planName = plan.planName || plan.name || '';

    return (
      <TouchableOpacity
        key={plan._id}
        style={[
          styles.planCard,
          styles.popularPlanCard,
        ]}
        onPress={() => handlePlanPress(plan)}
        activeOpacity={0.9}>

        <View style={styles.planCardContent}>
          <View style={styles.planHeader}>
            <View>
              <Text style={styles.planName}>
                {planName}
              </Text>
              <Text style={styles.planDescription}>
                {plan.description || 'Unlimited loans with premium features'}
              </Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.planPrice}>
                ₹{plan.priceMonthly || plan.amount || 0}
              </Text>
              <Text style={styles.planDuration}>/{plan.duration}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.featuresContainer}>
            {plan.features ? (
              renderPlanFeatures(plan.features)
            ) : (
              <>
                <View style={styles.featureItem}>
                  <Icon name="check" size={18} color="#FF9800" style={styles.checkIcon} />
                  <Text style={styles.featureText}>Unlimited loans</Text>
                </View>
                {(plan.planFeatures?.advancedAnalytics ?? false) && (
                  <View style={styles.featureItem}>
                    <Icon name="check" size={18} color="#FF9800" style={styles.checkIcon} />
                    <Text style={styles.featureText}>Advanced Analytics</Text>
                  </View>
                )}
                {(plan.planFeatures?.prioritySupport ?? false) && (
                  <View style={styles.featureItem}>
                    <Icon name="check" size={18} color="#FF9800" style={styles.checkIcon} />
                    <Text style={styles.featureText}>Priority Support</Text>
                  </View>
                )}
              </>
            )}
          </View>

          <View style={styles.loanLimitContainer}>
            <Icon name="zap" size={16} color="#00A550" />
            <Text style={styles.loanLimit}>Unlimited loans creation</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.buyButtonCard,
              styles.popularBuyButton,
            ]}
            onPress={(e) => handleBuyFromCard(plan, e)}
            disabled={purchaseLoading || processing}
            activeOpacity={0.8}>
            <LinearGradient
              colors={['#ffa011ff', '#ff7722ff']}
              style={[
                styles.buyButtonGradient,
                styles.popularBuyButtonGradient,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}>
              {purchaseLoading || processing ? (
                <ActivityIndicator size="small" color={"#FF9800"} />
              ) : (
                <>
                  <Icon
                    name="shopping-cart"
                    size={18}
                    color={"white"}
                  />
                  <Text style={[
                    styles.buyButtonCardText,
                    styles.popularBuyButtonText,
                  ]}>
                    Get Started
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (plansLoading) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <Header title="Subscription Plans" showBackButton />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingAnimation}>
            <ActivityIndicator size="large" color="#FF9800" />
          </View>
          <Text style={styles.loadingText}>Loading premium plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (plansError) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <Header title="Subscription Plans" showBackButton />
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Icon name="alert-circle" size={64} color="#FF9800" />
          </View>
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>Failed to load subscription plans</Text>
          <Text style={styles.errorSubText}>{plansError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchPlans}>
            <LinearGradient
              colors={['#FF9800', '#FF5722']}
              style={styles.retryButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}>
              <Icon name="refresh-cw" size={20} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Header with custom styling */}
      <View style={styles.headerWrapper}>
        <Header title="Upgrade Your Plan" showBackButton />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>


        <View style={styles.container}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <LinearGradient
              colors={['#FFF3E0', '#FFECB3']}
              style={styles.heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              <View style={styles.heroContent}>
                <Icon name="star" size={30} color="#FF9800" />
                <Text style={styles.heroTitle}>Unlock Premium Features</Text>
                <Text style={styles.heroSubtitle}>
                  Choose a plan that grows with your lending business
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Active Plan Status */}
          {hasActivePlan && (
            <TouchableOpacity
              style={styles.activePlanBanner}
              onPress={handleActivePlanPress}
              activeOpacity={0.9}>
              <LinearGradient
                colors={remainingDays > 0 ? ['#60ea64ff', '#72da78ff'] : ['#FF5722', '#FF9800']}
                style={styles.activePlanGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}>
                <View style={styles.activePlanContent}>
                  <Icon
                    name={remainingDays > 0 ? "shield" : "alert-circle"}
                    size={24}
                    color="#fff"
                  />
                  <View style={styles.activePlanTextContainer}>
                    <Text style={styles.activePlanTitle}>
                      {remainingDays > 0 ? 'Active Plan' : 'Plan Expired'}
                    </Text>
                    <Text style={styles.activePlanName}>
                      {activePlan?.planName || activePlan?.name || 'Current Plan'}
                    </Text>
                    <Text style={styles.activePlanDetails}>
                      {remainingDays > 0
                        ? `${remainingDays} ${remainingDays === 1 ? 'day' : 'days'} remaining • Expires ${new Date(expiryDate).toLocaleDateString()}`
                        : 'Renew now to continue creating loans'
                      }
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={24} color="#fff" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Plans Section */}
          <View style={styles.plansSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Available Plans</Text>
              <Text style={styles.sectionSubtitle}>
                Select the perfect plan for your needs
              </Text>
            </View>

            <View style={styles.plansContainer}>
              {plans.length > 0 ? (
                plans.map(renderPlanCard)
              ) : (
                <View style={styles.noPlansContainer}>
                  <View style={styles.noPlansIcon}>
                    <Icon name="package" size={64} color="#FFD180" />
                  </View>
                  <Text style={styles.noPlansTitle}>No Plans Available</Text>
                  <Text style={styles.noPlansText}>
                    Subscription plans are currently being prepared
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Features Comparison */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>All Plans Include</Text>
            <View style={styles.featuresGrid}>
              <View style={styles.featureBox}>
                <Icon name="shield" size={28} color="#FF9800" />
                <Text style={styles.featureBoxTitle}>Secure</Text>
                <Text style={styles.featureBoxText}>Bank-level security</Text>
              </View>
              <View style={styles.featureBox}>
                <Icon name="clock" size={28} color="#FF9800" />
                <Text style={styles.featureBoxTitle}>24/7 Support</Text>
                <Text style={styles.featureBoxText}>Always available</Text>
              </View>
              <View style={styles.featureBox}>
                <Icon name="trending-up" size={28} color="#FF9800" />
                <Text style={styles.featureBoxTitle}>Analytics</Text>
                <Text style={styles.featureBoxText}>Real-time insights</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerWrapper: {
    backgroundColor: '#FF9800',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingAnimation: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'System',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#FFFFFF',
  },
  errorIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  errorSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
  },
  retryButton: {
    width: '80%',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  heroSection: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  heroGradient: {
    padding: 24,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  activePlanBanner: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  activePlanGradient: {
    padding: 20,
  },
  activePlanContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activePlanTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  activePlanTitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 2,
  },
  activePlanName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  activePlanDetails: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  plansSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
    position: 'relative',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  popularPlanCard: {
    borderColor: '#FF9800',
    elevation: 8,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  planCardContent: {
    padding: 24,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 19,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    maxWidth: '70%',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 29,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  planDuration: {
    fontSize: 14,
    color: '#999',
    marginTop: -4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 20,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF3E0',
    padding: 2,
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#555',
    flex: 1,
  },
  loanLimitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D0F0C0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 20,
  },
  loanLimit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00A550',
    marginLeft: 8,
  },
  buyButtonCard: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  popularBuyButton: {
    borderColor: '#FF9800',
  },
  buyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  popularBuyButtonGradient: {
    borderWidth: 0,
  },
  buyButtonCardText: {
    color: '#FF9800',
    fontSize: 16,
    fontWeight: 'bold',
  },
  popularBuyButtonText: {
    color: '#FFFFFF',
  },
  noPlansContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    backgroundColor: '#FFFBF5',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFF3E0',
    borderStyle: 'dashed',
  },
  noPlansIcon: {
    marginBottom: 20,
  },
  noPlansTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  noPlansText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  featuresSection: {
    marginBottom: 32,
    backgroundColor: '#FFFBF5',
    borderRadius: 20,
    padding: 24,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  featureBox: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
  },
  featureBoxTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  featureBoxText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    lineHeight: 15,
  },
});

export default SubscriptionScreen;