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
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import { useSubscription } from '../../../hooks/useSubscription';
import { useSelector } from 'react-redux';

const SubscriptionScreen = ({ navigation }) => {
  const {
    plans,
    selectedPlan,
    hasActiveSubscription,
    plansLoading,
    purchaseLoading,
    plansError,
    fetchPlans,
    handleSelectPlan,
    purchaseSubscription,
  } = useSubscription();

  // const user = useSelector((state) => state.auth.user);
    const user = useSelector(state => state.auth.user);

  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (hasActiveSubscription) {
      Alert.alert(
        'Active Subscription',
        'You already have an active subscription. You can view your current plan in the profile section.',
        [
          { 
            text: 'View Profile', 
            onPress: () => navigation.navigate('ProfileDetails') 
          },
          { 
            text: 'Stay Here', 
            style: 'cancel' 
          },
        ]
      );
    }
  }, [hasActiveSubscription]);

  const handleProceedToPayment = async () => {
    if (!selectedPlan) {
      Alert.alert('Select a Plan', 'Please select a subscription plan to continue.');
      return;
    }

    if (hasActiveSubscription) {
      Alert.alert(
        'Active Subscription',
        'You already have an active subscription. Would you like to upgrade?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => proceedWithPayment() },
        ]
      );
    } else {
      proceedWithPayment();
    }
  };

  const proceedWithPayment = async () => {
    setProcessing(true);
    
    const result = await purchaseSubscription(selectedPlan._id, user);
    
    setProcessing(false);
    
    if (result.success) {
      Alert.alert(
        'Success!',
        result.message,
        [
          { 
            text: 'Great!', 
            onPress: () => {
              navigation.goBack();
            } 
          },
        ]
      );
    } else if (result.type !== 'CANCELLED') {
      Alert.alert(
        'Payment Failed',
        result.message,
        [{ text: 'OK' }]
      );
    }
  };

  const renderPlanFeatures = (features) => {
    return features?.map((feature, index) => (
      <View key={index} style={styles.featureItem}>
        <Icon name="check-circle" size={16} color="#4CAF50" />
        <Text style={styles.featureText}>{feature}</Text>
      </View>
    ));
  };

  const renderPlanCard = (plan) => {
    const isSelected = selectedPlan?._id === plan._id;
    const isPopular = plan.name?.toLowerCase().includes('pro') || plan.name?.toLowerCase().includes('professional');

    return (
      <TouchableOpacity
        key={plan._id}
        style={[
          styles.planCard,
          isSelected && styles.selectedPlanCard,
          isPopular && styles.popularPlanCard,
        ]}
        onPress={() => handleSelectPlan(plan)}>
        
        {isPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>POPULAR</Text>
          </View>
        )}
        
        <View style={styles.planHeader}>
          <Text style={[
            styles.planName,
            isSelected && styles.selectedPlanText,
          ]}>
            {plan.name}
          </Text>
          <Text style={[
            styles.planPrice,
            isSelected && styles.selectedPlanText,
          ]}>
            ₹{plan.amount}
            <Text style={styles.planDuration}> / {plan.duration}</Text>
          </Text>
        </View>
        
        <Text style={[
          styles.planDescription,
          isSelected && styles.selectedPlanText,
        ]}>
          {plan.description}
        </Text>
        
        <View style={styles.featuresContainer}>
          {renderPlanFeatures(plan.features)}
        </View>
        
        <Text style={styles.loanLimit}>
          {plan.maxLoans === 0 ? 'Unlimited loans' : `Up to ${plan.maxLoans} loans per ${plan.duration}`}
        </Text>
        
        <View style={styles.selectIndicator}>
          {isSelected ? (
            <Icon name="check-circle" size={24} color="#4CAF50" />
          ) : (
            <View style={styles.unselectedCircle} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (plansLoading) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <Header title="Subscription" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (plansError) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <Header title="Subscription" showBackButton />
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color="#e74c3c" />
          <Text style={styles.errorText}>Failed to load plans</Text>
          <Text style={styles.errorSubText}>{plansError}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchPlans}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header title="Subscription" showBackButton />
        
        <View style={styles.container}>
          <Text style={styles.title}>Choose Your Plan</Text>
          <Text style={styles.subtitle}>
            Select a plan to unlock loan creation and premium features.
          </Text>
          
          {hasActiveSubscription && (
            <View style={styles.activeSubscriptionBanner}>
              <Icon name="shield" size={20} color="#fff" />
              <Text style={styles.activeSubscriptionText}>
                You have an active subscription
              </Text>
            </View>
          )}

          {/* Plans List */}
          <View style={styles.plansContainer}>
            {plans.length > 0 ? (
              plans.map(renderPlanCard)
            ) : (
              <View style={styles.noPlansContainer}>
                <Icon name="package" size={48} color="#ccc" />
                <Text style={styles.noPlansText}>No subscription plans available</Text>
              </View>
            )}
          </View>

          {/* Selected Plan Summary */}
          {selectedPlan && (
            <View style={styles.selectedPlanSummary}>
              <Text style={styles.summaryTitle}>Selected Plan:</Text>
              <View style={styles.summaryDetails}>
                <Text style={styles.summaryPlanName}>{selectedPlan.name}</Text>
                <Text style={styles.summaryPrice}>₹{selectedPlan.amount}</Text>
              </View>
              <Text style={styles.summaryDuration}>
                {selectedPlan.duration === 'yearly' ? '1 Year' : 
                 selectedPlan.duration === 'monthly' ? '1 Month' : 
                 `${selectedPlan.durationInMonths} Months`}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          {selectedPlan && !processing && (
            <TouchableOpacity
              style={styles.subscribeButton}
              onPress={handleProceedToPayment}
              disabled={purchaseLoading || processing}>
              {purchaseLoading || processing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.subscribeButtonText}>
                  {hasActiveSubscription ? 'Upgrade Plan' : 'Subscribe Now'}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* Already have subscription message */}
          {hasActiveSubscription && !selectedPlan && (
            <View style={styles.viewCurrentPlanButton}>
              <TouchableOpacity
                style={styles.currentPlanButton}
                onPress={() => navigation.navigate('Profile')}>
                <Text style={styles.currentPlanButtonText}>
                  View Current Plan
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginTop: 10,
  },
  errorSubText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#777',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  activeSubscriptionBanner: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  activeSubscriptionText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  plansContainer: {
    marginBottom: 20,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  selectedPlanCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#f0f9f0',
  },
  popularPlanCard: {
    borderColor: '#FF9800',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  planPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  planDuration: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'normal',
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  featuresContainer: {
    marginBottom: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
    flex: 1,
  },
  loanLimit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 10,
  },
  selectIndicator: {
    alignItems: 'center',
    marginTop: 5,
  },
  unselectedCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
  },
  selectedPlanText: {
    color: '#2E7D32',
  },
  selectedPlanSummary: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  summaryTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  summaryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  summaryPlanName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  summaryDuration: {
    fontSize: 14,
    color: '#666',
  },
  subscribeButton: {
    backgroundColor: '#4CAF50',
    borderRadius: m(8),
    paddingVertical: m(16),
    alignItems: 'center',
    width: '100%',
    elevation: m(5),
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  viewCurrentPlanButton: {
    marginTop: 20,
  },
  currentPlanButton: {
    backgroundColor: '#2196F3',
    borderRadius: m(8),
    paddingVertical: m(14),
    alignItems: 'center',
    width: '100%',
  },
  currentPlanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  noPlansContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noPlansText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default SubscriptionScreen;