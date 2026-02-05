import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import moment from 'moment';

/**
 * DetailItem Component
 * Renders a detail row with icon, label, and value
 */
const DetailItem = ({ icon, label, value }) => (
  <View style={styles.detailItem}>
    <View style={styles.detailIconContainer}>
      <Icon name={icon} size={20} color="#ff6700" />
    </View>
    <View style={styles.detailContent}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>
        {value || 'N/A'}
      </Text>
    </View>
  </View>
);

// FeatureBadge Component
const FeatureBadge = ({ label, enabled }) => {
  if (!enabled) return null;
  return (
    <View style={styles.featureBadge}>
      <Icon name="check" size={14} color="#4CAF50" />
      <Text style={styles.featureText}>{label}</Text>
    </View>
  );
};

// PlanDetailsScreen Component
export default function PlanDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { plan } = route.params || {};

  // Handle navigation to edit screen
  const handleEditPlan = useCallback(() => {
    navigation.navigate('CreateEditPlan', { plan, mode: 'edit' });
  }, [navigation, plan]);

  // Memoized plan information array
  const planInfo = useMemo(() => {
    if (!plan) return [];
    return [
      {
        icon: 'tag',
        label: 'Plan Name',
        value: plan.planName,
      },
      {
        icon: 'clock',
        label: 'Duration',
        value: plan.duration,
      },
      {
        icon: 'dollar-sign',
        label: 'Monthly Price',
        value: `₹${plan.priceMonthly?.toLocaleString('en-IN') || '0'}`,
      },
      {
        icon: 'calendar',
        label: 'Created At',
        value: plan.createdAt
          ? moment(plan.createdAt).format('DD MMM YYYY, hh:mm A')
          : 'N/A',
      },
      {
        icon: 'edit',
        label: 'Last Updated',
        value: plan.updatedAt
          ? moment(plan.updatedAt).format('DD MMM YYYY, hh:mm A')
          : 'N/A',
      },
      {
        icon: 'credit-card',
        label: 'Razorpay Plan ID',
        value: plan.razorpayPlanId || 'Not configured',
      },
    ];
  }, [plan]);

  // Error state - plan not found
  if (!plan) {
    return (
      <View style={styles.container}>
        <Header title="Plan Details" showBackButton />
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color="#F44336" />
          <Text style={styles.errorText}>Plan not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Plan Details" showBackButton />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Plan Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.planIconContainer}>
              <Icon name="package" size={32} color="#ff6700" />
            </View>
            <View style={styles.planHeaderInfo}>
              <Text style={styles.planName} numberOfLines={2}>
                {plan.planName}
              </Text>
              <View style={styles.planMeta}>
                <View style={styles.metaItem}>
                  <Icon name="clock" size={14} color="#666" />
                  <Text style={styles.metaText}>{plan.duration}</Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                  <Icon name="dollar-sign" size={14} color="#666" />
                  <Text style={styles.metaText}>
                    ₹{plan.priceMonthly?.toLocaleString('en-IN')}/month
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: plan.isActive ? '#E8F5E9' : '#FFEBEE',
              },
            ]}>
            <Icon
              name={plan.isActive ? 'check-circle' : 'x-circle'}
              size={16}
              color={plan.isActive ? '#4CAF50' : '#F44336'}
            />
            <Text
              style={[
                styles.statusText,
                { color: plan.isActive ? '#4CAF50' : '#F44336' },
              ]}>
              {plan.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {/* Plan Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Plan Information</Text>
          <View style={styles.detailsGrid}>
            {planInfo.map((item, index) => (
              <DetailItem
                key={`${item.label}-${index}`}
                icon={item.icon}
                label={item.label}
                value={item.value}
              />
            ))}
          </View>
        </View>

        {/* Plan Features Card */}
        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>Plan Features</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Icon name="check-circle" size={20} color="#4CAF50" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureLabel}>Unlimited Loans</Text>
                <Text style={styles.featureDescription}>
                  Create unlimited loans with this plan
                </Text>
              </View>
            </View>
            <FeatureBadge
              label="Advanced Analytics"
              enabled={plan.planFeatures?.advancedAnalytics ?? false}
            />
            <FeatureBadge
              label="Priority Support"
              enabled={plan.planFeatures?.prioritySupport ?? false}
            />
          </View>
          <View style={styles.featuresGrid}>
            {(plan.planFeatures?.advancedAnalytics ?? false) && (
              <View style={styles.featureBadge}>
                <Icon name="bar-chart-2" size={14} color="#4CAF50" />
                <Text style={styles.featureText}>Advanced Analytics</Text>
              </View>
            )}
            {(plan.planFeatures?.prioritySupport ?? false) && (
              <View style={styles.featureBadge}>
                <Icon name="headphones" size={14} color="#4CAF50" />
                <Text style={styles.featureText}>Priority Support</Text>
              </View>
            )}
          </View>
        </View>

        {/* Description Card */}
        {plan.description && (
          <View style={styles.descriptionCard}>
            <View style={styles.descriptionHeader}>
              <Icon name="file-text" size={18} color="#ff6700" />
              <Text style={styles.descriptionTitle}>Description</Text>
            </View>
            <Text style={styles.descriptionText}>{plan.description}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditPlan}
            activeOpacity={0.8}>
            <LinearGradient
              colors={['#ff6700', '#ff7900']}
              style={styles.editGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}>
              <Icon name="edit" size={18} color="#FFFFFF" />
              <Text style={styles.editButtonText}>Edit Plan</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: m(20),
    paddingBottom: m(100),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: m(16),
  },
  errorText: {
    fontSize: m(16),
    color: '#666',
    fontWeight: '500',
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    padding: m(20),
    marginBottom: m(16),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(16),
  },
  planIconContainer: {
    width: m(64),
    height: m(64),
    borderRadius: m(16),
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(16),
  },
  planHeaderInfo: {
    flex: 1,
  },
  planName: {
    fontSize: m(22),
    fontWeight: '700',
    color: '#333',
    marginBottom: m(8),
    letterSpacing: 0.3,
  },
  planMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(12),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
  },
  metaText: {
    fontSize: m(14),
    color: '#666',
  },
  metaDivider: {
    width: 1,
    height: m(16),
    backgroundColor: '#E0E0E0',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(20),
    gap: m(6),
  },
  statusText: {
    fontSize: m(12),
    fontWeight: '600',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    padding: m(20),
    marginBottom: m(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  detailsTitle: {
    fontSize: m(18),
    fontWeight: '600',
    color: '#333',
    marginBottom: m(16),
    letterSpacing: 0.3,
  },
  detailsGrid: {
    gap: m(12),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: m(12),
    padding: m(14),
  },
  detailIconContainer: {
    width: m(40),
    height: m(40),
    borderRadius: m(10),
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(12),
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: m(12),
    color: '#666',
    marginBottom: m(4),
    fontWeight: '500',
  },
  detailValue: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#333',
  },
  featuresCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    padding: m(20),
    marginBottom: m(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  featuresTitle: {
    fontSize: m(18),
    fontWeight: '600',
    color: '#333',
    marginBottom: m(16),
    letterSpacing: 0.3,
  },
  featuresList: {
    gap: m(12),
    marginBottom: m(16),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: m(12),
    padding: m(14),
  },
  featureIconContainer: {
    marginRight: m(12),
  },
  featureContent: {
    flex: 1,
  },
  featureLabel: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: m(4),
  },
  featureDescription: {
    fontSize: m(12),
    color: '#666',
    lineHeight: m(16),
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(8),
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(20),
    gap: m(6),
  },
  featureText: {
    fontSize: m(12),
    fontWeight: '600',
    color: '#4CAF50',
  },
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    padding: m(20),
    marginBottom: m(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    marginBottom: m(12),
  },
  descriptionTitle: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#333',
  },
  descriptionText: {
    fontSize: m(14),
    color: '#666',
    lineHeight: m(20),
  },
  actionsContainer: {
    marginTop: m(8),
  },
  editButton: {
    borderRadius: m(12),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#ff6700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  editGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(16),
    gap: m(8),
  },
  editButtonText: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
