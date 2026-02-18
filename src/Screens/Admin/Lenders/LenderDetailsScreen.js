import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { m } from 'walstar-rn-responsive';
import { useRoute } from '@react-navigation/native';
import Header from '../../../Components/Header';

/**
 * Format currency value to Indian Rupee format
 * @param {number} value - The amount to format
 * @returns {string} Formatted currency string
 */
const formatCurrency = value => {
  if (!value) return '₹0';
  const num = Number(value) || 0;
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

/**
 * Format date string to readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
const formatDate = dateString => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};

const DetailRow = ({ label, value, icon, iconColor = '#666' }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailRowLeft}>
      {icon && <Icon name={icon} size={16} color={iconColor} style={styles.detailIcon} />}
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
    <Text style={styles.detailValue}>{value || 'N/A'}</Text>
  </View>
);

const PlanCard = ({ plan, planDetails, isExpanded, onToggle, isActive }) => {
  const planStatus = planDetails?.planStatus || 'expired';
  const isPlanActive = planDetails?.isPlanActive || false;

  return (
    <View style={[styles.planCard, !isActive && styles.expiredPlanCard]}>
      <TouchableOpacity
        style={styles.planCardHeader}
        onPress={onToggle}
        activeOpacity={0.7}>
        <View style={styles.planCardHeaderLeft}>
          <View style={[
            styles.planStatusIndicator,
            isPlanActive ? styles.planStatusActive : styles.planStatusExpired
          ]} />
          <Text style={styles.planCardTitle}>{plan?.planName || 'Plan'}</Text>
        </View>
        <TouchableOpacity
          onPress={onToggle}
          style={styles.toggleButton}
          activeOpacity={0.7}>
          <Icon
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#ff6700"
          />
        </TouchableOpacity>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.planCardContent}>
          {/* Plan Information */}
          <View style={styles.planInfoSection}>
            <Text style={styles.planSectionTitle}>Plan Information</Text>
            <DetailRow
              label="Plan Name"
              value={plan?.planName}
              icon="package"
              iconColor="#ff6700"
            />
            <DetailRow
              label="Description"
              value={plan?.description}
              icon="file-text"
            />
            <DetailRow
              label="Duration"
              value={plan?.duration}
              icon="calendar"
            />
            <DetailRow
              label="Price"
              value={`${formatCurrency(plan?.priceMonthly)}/${plan?.duration}`}
              icon="dollar-sign"
            />
          </View>

          {/* Plan Features */}
          {plan?.planFeatures && (
            <View style={styles.planInfoSection}>
              <Text style={styles.planSectionTitle}>Plan Features</Text>
              <View style={styles.featuresList}>
                {plan.planFeatures.unlimitedLoans && (
                  <View style={styles.featureItem}>
                    <Icon name="check-circle" size={16} color="#4CAF50" />
                    <Text style={styles.featureText}>Unlimited Loans</Text>
                  </View>
                )}
                {plan.planFeatures.advancedAnalytics && (
                  <View style={styles.featureItem}>
                    <Icon name="check-circle" size={16} color="#4CAF50" />
                    <Text style={styles.featureText}>Advanced Analytics</Text>
                  </View>
                )}
                {plan.planFeatures.prioritySupport && (
                  <View style={styles.featureItem}>
                    <Icon name="check-circle" size={16} color="#4CAF50" />
                    <Text style={styles.featureText}>Priority Support</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Purchase Details */}
          {planDetails && (
            <View style={styles.planInfoSection}>
              <Text style={styles.planSectionTitle}>Purchase Details</Text>
              <DetailRow
                label="Purchase Date"
                value={formatDate(planDetails.planPurchaseDate)}
                icon="calendar"
              />
              <DetailRow
                label="Expiry Date"
                value={formatDate(planDetails.planExpiryDate)}
                icon="clock"
              />
              <DetailRow
                label="Status"
                value={planStatus === 'active' ? 'Active' : 'Expired'}
                icon={isPlanActive ? 'check-circle' : 'x-circle'}
                iconColor={isPlanActive ? '#4CAF50' : '#F44336'}
              />
              {isPlanActive && planDetails.remainingDays !== undefined && (
                <DetailRow
                  label="Remaining Days"
                  value={`${planDetails.remainingDays} days`}
                  icon="clock"
                  iconColor="#4CAF50"
                />
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default function LenderDetailsScreen() {
  const route = useRoute();
  const { lenderData } = route.params || {};
  const [expandedPlans, setExpandedPlans] = useState({});

  // Memoized lender data
  const lenderInfo = useMemo(() => {
    if (!lenderData) return null;
    const lender = lenderData.lender || {};
    const currentPlan = lenderData.currentPlan || null;
    const planPurchaseDetails = lenderData.planPurchaseDetails || null;

    // Build plans array
    const plans = [];
    if (currentPlan && planPurchaseDetails) {
      plans.push({
        plan: currentPlan,
        planDetails: planPurchaseDetails,
        isActive: planPurchaseDetails.isPlanActive,
      });
    }

    return { lender, plans };
  }, [lenderData]);

  // Get user initials helper
  const getInitials = useCallback((name) => {
    if (!name) return 'L';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }, []);

  // Toggle plan expansion
  const togglePlan = useCallback((index) => {
    setExpandedPlans(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  }, []);

  // Error state - lender data not available
  if (!lenderData || !lenderInfo) {
    return (
      <View style={styles.container}>
        <Header title="Lender Details" showBackButton />
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color="#F44336" />
          <Text style={styles.errorText}>Lender details not available</Text>
        </View>
      </View>
    );
  }

  const { lender, plans } = lenderInfo;

  return (
    <View style={styles.container}>
      <Header title="Lender Details" showBackButton />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Lender Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            {lender.profileImage ? (
              <Image
                source={{ uri: lender.profileImage }}
                style={styles.profileImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>
                  {getInitials(lender.userName)}
                </Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{lender.userName || 'N/A'}</Text>
              <View style={styles.profileBadge}>
                <Icon name="user" size={14} color="#FFFFFF" />
                <Text style={styles.profileBadgeText}>Lender</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Lender Information Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Icon name="user" size={20} color="#ff6700" />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>
          <View style={styles.sectionContent}>
            <DetailRow
              label="Full Name"
              value={lender.userName}
              icon="user"
            />
            <DetailRow
              label="Email"
              value={lender.email}
              icon="mail"
            />
            <DetailRow
              label="Mobile Number"
              value={lender.mobileNo}
              icon="phone"
            />
            <DetailRow
              label="Aadhar Card"
              value={lender.aadharCardNo}
              icon="credit-card"
            />
            {lender.panCardNumber && (
              <DetailRow
                label="PAN Card"
                value={lender.panCardNumber}
                icon="file-text"
              />
            )}
            <DetailRow
              label="Address"
              value={lender.address}
              icon="map-pin"
            />
          </View>
        </View>

        {/* Account Status Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Icon name="shield" size={20} color="#ff6700" />
            <Text style={styles.sectionTitle}>Account Status</Text>
          </View>
          <View style={styles.sectionContent}>
            <DetailRow
              label="Account Status"
              value={lender.isActive ? 'Active' : 'Inactive'}
              icon={lender.isActive ? 'check-circle' : 'x-circle'}
              iconColor={lender.isActive ? '#4CAF50' : '#F44336'}
            />
            <DetailRow
              label="Account Created"
              value={formatDate(lender.createdAt)}
              icon="calendar"
            />
            <DetailRow
              label="Last Updated"
              value={formatDate(lender.updatedAt)}
              icon="clock"
            />
          </View>
        </View>

        {/* Plans Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Icon name="package" size={20} color="#ff6700" />
            <Text style={styles.sectionTitle}>
              Subscription Plans {plans.length > 0 && `(${plans.length})`}
            </Text>
          </View>
          {plans.length > 0 ? (
            <View style={styles.plansContainer}>
              {plans.map((planData, index) => (
                <PlanCard
                  key={`plan-${index}`}
                  plan={planData.plan}
                  planDetails={planData.planDetails}
                  isExpanded={expandedPlans[index] || false}
                  onToggle={() => togglePlan(index)}
                  isActive={planData.isActive}
                />
              ))}
            </View>
          ) : (
            <View style={styles.noPlansContainer}>
              <Icon name="package" size={48} color="#CCC" />
              <Text style={styles.noPlansText}>No plans found</Text>
            </View>
          )}
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: m(40),
  },
  errorText: {
    marginTop: m(16),
    fontSize: m(16),
    color: '#F44336',
    textAlign: 'center',
  },
  profileCard: {
    borderRadius: m(20),
    overflow: 'hidden',
    marginBottom: m(20),
    backgroundColor: 'black',
    padding: m(24),
    alignItems: 'flex-start',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(28),
  },
  profileImage: {
    width: m(76),
    height: m(76),
    borderRadius: m(40),
    marginBottom: 0,
  },
  profileAvatar: {
    width: m(80),
    height: m(80),
    borderRadius: m(40),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: m(32),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileInfo: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  profileName: {
    fontSize: m(24),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: m(4),
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(16),
    gap: m(6),
  },
  profileBadgeText: {
    fontSize: m(12),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    padding: m(20),
    marginBottom: m(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(16),
    gap: m(10),
  },
  sectionTitle: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#333',
  },
  sectionContent: {
    gap: m(12),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: m(10),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  detailRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: m(8),
  },
  detailIcon: {
    marginRight: m(4),
  },
  detailLabel: {
    fontSize: m(14),
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
    flex: 1,
  },
  plansContainer: {
    gap: m(12),
  },
  planCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: m(12),
    borderWidth: 2,
    borderColor: '#4CAF50',
    overflow: 'hidden',
  },
  expiredPlanCard: {
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: m(16),
  },
  planCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: m(12),
  },
  planStatusIndicator: {
    width: m(12),
    height: m(12),
    borderRadius: m(6),
  },
  planStatusActive: {
    backgroundColor: '#4CAF50',
  },
  planStatusExpired: {
    backgroundColor: '#CCC',
  },
  planCardTitle: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  toggleButton: {
    padding: m(8),
    borderRadius: m(8),
    backgroundColor: '#FFF3E0',
  },
  planCardContent: {
    padding: m(16),
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  planInfoSection: {
    marginBottom: m(16),
  },
  planSectionTitle: {
    fontSize: m(14),
    fontWeight: '700',
    color: '#333',
    marginBottom: m(12),
    paddingBottom: m(8),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  featuresList: {
    gap: m(8),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
  },
  featureText: {
    fontSize: m(14),
    color: '#666',
  },
  noPlansContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(40),
  },
  noPlansText: {
    marginTop: m(12),
    fontSize: m(16),
    color: '#999',
  },
});

