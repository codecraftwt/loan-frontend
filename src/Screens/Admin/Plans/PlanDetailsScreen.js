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

/**
 * Format currency
 */
const formatCurrency = value => {
  if (!value) return '₹0';
  const num = Number(value) || 0;
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

/**
 * Format date
 */
const formatDate = dateStr => {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};

export default function PlanDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { plan } = route.params || {};

  const handleEditPlan = useCallback(() => {
    navigation.navigate('CreateEditPlan', { plan, mode: 'edit' });
  }, [navigation, plan]);

  if (!plan) {
    return (
      <View style={styles.container}>
        <Header title="Plan Specifications" showBackButton />
        <View style={styles.emptyBox}>
          <Icon name="alert-circle" size={44} color="#f87171" />
          <Text style={styles.emptyTitle}>Plan Not Found</Text>
          <Text style={styles.emptySubtitle}>The specified plan could not be located.</Text>
        </View>
      </View>
    );
  }

  const durationDays =
    plan.durationDays ||
    (plan.duration === '1 year'
      ? 365
      : plan.duration === '6 months'
      ? 180
      : plan.duration === '3 months'
      ? 90
      : 30);

  const packPrice = Number(plan.price || plan.priceMonthly || 1999);
  const monthlyRate =
    plan.priceMonthly || Math.round(packPrice / (durationDays / 30)) || packPrice;
  const isActive = plan.isActive ?? true;

  return (
    <View style={styles.container}>
      <Header title="Plan Specifications" showBackButton />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Plan Banner */}
        <LinearGradient
          colors={['#0f172a', '#1e293b', '#0f2942']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <View style={styles.heroHeader}>
            <View style={styles.heroTitleArea}>
              <View style={styles.titleBadgeRow}>
                <Text style={styles.planTitle}>{plan.planName}</Text>
                {plan.tag ? (
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagText}>{plan.tag}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.planDurationText}>
                {plan.duration} • {durationDays} Days Unrestricted Platform Access
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                isActive ? styles.activeBadge : styles.inactiveBadge,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isActive ? '#22c55e' : '#ef4444' },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  isActive ? styles.activeText : styles.inactiveText,
                ]}
              >
                {isActive ? 'Published' : 'Archived'}
              </Text>
            </View>
          </View>

          {/* Pricing Highlight */}
          <View style={styles.pricingStrip}>
            <View>
              <Text style={styles.priceSubLabel}>Pack Price</Text>
              <Text style={styles.heroPrice}>{formatCurrency(packPrice)}</Text>
            </View>
            <View style={styles.monthlyBlock}>
              <Text style={styles.priceSubLabel}>Effective Monthly</Text>
              <Text style={styles.heroMonthly}>{formatCurrency(monthlyRate)}/mo</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Feature Specifications */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Icon name="check-circle" size={16} color="#2563eb" />
            <Text style={styles.sectionTitle}>Included Capabilities</Text>
          </View>

          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <View style={styles.featureIconBox}>
                <Icon name="check" size={14} color="#16a34a" />
              </View>
              <View style={styles.featureTextCol}>
                <Text style={styles.featureTitle}>Full Platform Services</Text>
                <Text style={styles.featureDesc}>
                  Underwriting pipeline, borrower exploration, and loan agreement tools.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconBox}>
                <Icon name="check" size={14} color="#16a34a" />
              </View>
              <View style={styles.featureTextCol}>
                <Text style={styles.featureTitle}>DigiLocker KYC Credentials Access</Text>
                <Text style={styles.featureDesc}>
                  Direct access to verified government identity dossiers.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconBox}>
                <Icon name="check" size={14} color="#16a34a" />
              </View>
              <View style={styles.featureTextCol}>
                <Text style={styles.featureTitle}>Portfolio & Deal Quota</Text>
                <Text style={styles.featureDesc}>
                  Unlimited incoming deal evaluation and loan application tracking.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Specifications Ledger */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Icon name="layers" size={16} color="#7c3aed" />
            <Text style={styles.sectionTitle}>Technical Specifications</Text>
          </View>

          <View style={styles.specGrid}>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Duration Tier</Text>
              <Text style={styles.specValue}>{plan.duration || '1 month'}</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Active Days</Text>
              <Text style={styles.specValue}>{durationDays} Days</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Created Date</Text>
              <Text style={styles.specValue}>{formatDate(plan.createdAt)}</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Last Configured</Text>
              <Text style={styles.specValue}>{formatDate(plan.updatedAt)}</Text>
            </View>
          </View>
        </View>

        {/* Edit Button */}
        <TouchableOpacity
          style={styles.editButton}
          activeOpacity={0.85}
          onPress={handleEditPlan}
        >
          <Icon name="edit" size={16} color="#ffffff" />
          <Text style={styles.editButtonText}>Configure Plan Specifications</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: m(16),
    paddingBottom: m(80),
  },
  heroBanner: {
    borderRadius: m(16),
    padding: m(18),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroTitleArea: {
    flex: 1,
    marginRight: m(8),
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: m(6),
  },
  planTitle: {
    fontSize: m(18),
    fontWeight: '800',
    color: '#ffffff',
  },
  tagBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: m(8),
    paddingVertical: m(2),
    borderRadius: m(4),
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.4)',
  },
  tagText: {
    fontSize: m(10),
    fontWeight: '700',
    color: '#93c5fd',
  },
  planDurationText: {
    fontSize: m(12),
    color: '#cbd5e1',
    marginTop: m(4),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(6),
    gap: m(4),
  },
  activeBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  inactiveBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  statusDot: {
    width: m(5),
    height: m(5),
    borderRadius: m(2.5),
  },
  statusText: {
    fontSize: m(10),
    fontWeight: '700',
  },
  activeText: {
    color: '#86efac',
  },
  inactiveText: {
    color: '#fca5a5',
  },
  pricingStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: m(10),
    padding: m(12),
    marginTop: m(14),
  },
  priceSubLabel: {
    fontSize: m(10),
    color: '#94a3b8',
    fontWeight: '600',
  },
  heroPrice: {
    fontSize: m(20),
    fontWeight: '800',
    color: '#ffffff',
    marginTop: m(2),
  },
  monthlyBlock: {
    alignItems: 'flex-end',
  },
  heroMonthly: {
    fontSize: m(15),
    fontWeight: '700',
    color: '#60a5fa',
    marginTop: m(2),
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: m(14),
    padding: m(16),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: m(14),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    marginBottom: m(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: m(8),
  },
  sectionTitle: {
    fontSize: m(14),
    fontWeight: '700',
    color: '#0f172a',
  },
  featureList: {
    gap: m(12),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: m(10),
  },
  featureIconBox: {
    width: m(24),
    height: m(24),
    borderRadius: m(12),
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: m(1),
  },
  featureTextCol: {
    flex: 1,
  },
  featureTitle: {
    fontSize: m(13),
    fontWeight: '700',
    color: '#1e293b',
  },
  featureDesc: {
    fontSize: m(11),
    color: '#64748b',
    marginTop: m(2),
    lineHeight: m(15),
  },
  specGrid: {
    gap: m(10),
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specLabel: {
    fontSize: m(12),
    color: '#64748b',
  },
  specValue: {
    fontSize: m(12),
    fontWeight: '600',
    color: '#0f172a',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: m(14),
    borderRadius: m(12),
    gap: m(8),
    marginTop: m(4),
  },
  editButtonText: {
    fontSize: m(14),
    fontWeight: '700',
    color: '#ffffff',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: m(60),
    gap: m(8),
  },
  emptyTitle: {
    fontSize: m(15),
    fontWeight: '700',
    color: '#334155',
  },
  emptySubtitle: {
    fontSize: m(12),
    color: '#94a3b8',
  },
});
