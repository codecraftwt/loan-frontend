import React, { useEffect, useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import { getRevenueStatistics } from '../../../Redux/Slices/adminRevenueSlice';
import { getAdminRecentActivities } from '../../../Redux/Slices/adminActivitiesSlice';

/**
 * Format currency value to Indian Rupee format
 */
const formatCurrency = value => {
  if (!value) return '₹0';
  const num = Number(value) || 0;
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

/**
 * Format relative time
 */
const formatRelativeTime = dateStr => {
  if (!dateStr) return 'Just now';
  try {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return 'Recently';
  }
};

export default function AdminDashboard() {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  // Redux state selectors
  const user = useSelector(state => state.auth.user);
  const { revenueData, loading: revenueLoading } = useSelector(
    state => state.adminRevenue,
  );
  const { activities: recentActivities, loading: activitiesLoading } = useSelector(
    state => state.adminActivities,
  );

  const [refreshing, setRefreshing] = useState(false);

  // Fetch data
  const fetchData = useCallback(() => {
    dispatch(getRevenueStatistics({ groupBy: 'all' }));
    dispatch(getAdminRecentActivities({ limit: 8 }));
  }, [dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      dispatch(getRevenueStatistics({ groupBy: 'all' })),
      dispatch(getAdminRecentActivities({ limit: 8 })),
    ]).finally(() => setRefreshing(false));
  }, [dispatch]);

  // Memoized revenue summary
  const summary = useMemo(() => {
    const s = revenueData?.summary || {};
    return {
      totalRevenue: s.totalRevenue || 0,
      totalPurchases: s.totalPurchases || 0,
      avgRevenue: s.averageRevenuePerPurchase || 0,
      activePlans: s.activePlansCount || 0,
    };
  }, [revenueData]);

  // Activity type icon configuration
  const getActivityConfig = useCallback((type) => {
    switch (type) {
      case 'subscription_purchased':
        return { icon: 'shopping-cart', color: '#16a34a', bg: '#dcfce7', label: 'Subscription' };
      case 'plan_updated':
        return { icon: 'edit-3', color: '#2563eb', bg: '#dbeafe', label: 'Plan Updated' };
      case 'plan_created':
        return { icon: 'plus-circle', color: '#7c3aed', bg: '#ede9fe', label: 'Plan Created' };
      case 'lender_registered':
        return { icon: 'user-plus', color: '#0284c7', bg: '#e0f2fe', label: 'New Lender' };
      default:
        return { icon: 'activity', color: '#0284c7', bg: '#e0f2fe', label: 'System Event' };
    }
  }, []);

  const displayName = user?.name || user?.userName || 'Admin';

  return (
    <View style={styles.container}>
      <Header title="System Console" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
        }
      >
        {/* Enterprise Hero Banner */}
        <LinearGradient
          colors={['#090d16', '#0f172a', '#1e293b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <View style={styles.heroBadgeRow}>
            <View style={styles.consoleBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.consoleBadgeText}>Admin Console</Text>
            </View>
            <Text style={styles.enterpriseTag}>LoanHub Enterprise</Text>
          </View>

          <Text style={styles.heroTitle}>System Dashboard</Text>
          <Text style={styles.heroSubtitle}>
            Welcome back, {displayName}. Oversee institutional lenders, borrower KYC dossiers, and SaaS revenues.
          </Text>

          {/* Banner Quick Actions */}
          <View style={styles.heroActionsRow}>
            <TouchableOpacity
              style={styles.heroPrimaryBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('LenderList')}
            >
              <Icon name="users" size={14} color="#ffffff" />
              <Text style={styles.heroPrimaryBtnText}>Manage Lenders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.heroSecondaryBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Revenue')}
            >
              <Icon name="trending-up" size={14} color="#e2e8f0" />
              <Text style={styles.heroSecondaryBtnText}>Revenue Reports</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* KPI Stats Grid */}
        <View style={styles.kpiGrid}>
          {/* Total Revenue */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>TOTAL SAAS REVENUE</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: '#eff6ff' }]}>
                <Icon name="trending-up" size={16} color="#2563eb" />
              </View>
            </View>
            <Text style={styles.kpiValue} numberOfLines={1}>
              {formatCurrency(summary.totalRevenue)}
            </Text>
          </View>

          {/* Total Subscriptions */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>TOTAL SUBSCRIPTIONS</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: '#f0fdf4' }]}>
                <Icon name="shopping-cart" size={16} color="#16a34a" />
              </View>
            </View>
            <Text style={styles.kpiValue} numberOfLines={1}>
              {summary.totalPurchases.toLocaleString('en-IN')}
            </Text>
          </View>

          {/* Average Deal Size */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>AVERAGE DEAL SIZE</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: '#faf5ff' }]}>
                <Icon name="dollar-sign" size={16} color="#7c3aed" />
              </View>
            </View>
            <Text style={styles.kpiValue} numberOfLines={1}>
              {formatCurrency(Math.round(summary.avgRevenue))}
            </Text>
          </View>

          {/* Active Plans */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>ACTIVE PLANS</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: '#ecfeff' }]}>
                <Icon name="check-circle" size={16} color="#0891b2" />
              </View>
            </View>
            <Text style={styles.kpiValue} numberOfLines={1}>
              {summary.activePlans.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Core Management Hub Cards */}
        <Text style={styles.sectionHeading}>Management Directory</Text>

        <View style={styles.hubGrid}>
          {/* Card 1: Lending Institutions */}
          <View style={styles.hubCard}>
            <View style={[styles.hubIconBox, { backgroundColor: '#eff6ff' }]}>
              <Icon name="users" size={20} color="#2563eb" />
            </View>
            <Text style={styles.hubTitle}>Lending Institutions</Text>
            <Text style={styles.hubDesc}>
              Oversee registered private lending firms, inspect active subscriptions, and view lender portfolios.
            </Text>
            <TouchableOpacity
              style={[styles.hubButton, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('LenderList')}
            >
              <Text style={[styles.hubButtonText, { color: '#1d4ed8' }]}>View All Lenders</Text>
              <Icon name="arrow-right" size={14} color="#1d4ed8" />
            </TouchableOpacity>
          </View>

          {/* Card 2: Borrowers Directory */}
          <View style={styles.hubCard}>
            <View style={[styles.hubIconBox, { backgroundColor: '#eef2ff' }]}>
              <Icon name="shield" size={20} color="#4f46e5" />
            </View>
            <Text style={styles.hubTitle}>Borrowers Directory</Text>
            <Text style={styles.hubDesc}>
              Inspect registered borrowers, verified DigiLocker KYC credentials, and platform credit exposure.
            </Text>
            <TouchableOpacity
              style={[styles.hubButton, { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' }]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('AdminBorrowerList')}
            >
              <Text style={[styles.hubButtonText, { color: '#4338ca' }]}>View All Borrowers</Text>
              <Icon name="arrow-right" size={14} color="#4338ca" />
            </TouchableOpacity>
          </View>

          {/* Card 3: Subscription Tiers & Pricing */}
          <View style={styles.hubCard}>
            <View style={[styles.hubIconBox, { backgroundColor: '#f0fdfa' }]}>
              <Icon name="layers" size={20} color="#0d9488" />
            </View>
            <Text style={styles.hubTitle}>Subscription Tiers & Pricing</Text>
            <Text style={styles.hubDesc}>
              Create, configure, and manage SaaS pricing plans, deal capacity quotas, and AI review credits.
            </Text>
            <TouchableOpacity
              style={[styles.hubButton, { backgroundColor: '#f0fdfa', borderColor: '#99f6e4' }]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('PlansList')}
            >
              <Text style={[styles.hubButtonText, { color: '#0f766e' }]}>Manage Plans</Text>
              <Icon name="arrow-right" size={14} color="#0f766e" />
            </TouchableOpacity>
          </View>

          {/* Card 4: Financial Revenue Analytics */}
          <View style={styles.hubCard}>
            <View style={[styles.hubIconBox, { backgroundColor: '#ecfdf5' }]}>
              <Icon name="trending-up" size={20} color="#059669" />
            </View>
            <Text style={styles.hubTitle}>Financial Revenue Analytics</Text>
            <Text style={styles.hubDesc}>
              Analyze platform billing breakdowns, monthly growth trajectories, and download auditor-ready ledger reports.
            </Text>
            <TouchableOpacity
              style={[styles.hubButton, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Revenue')}
            >
              <Text style={[styles.hubButtonText, { color: '#047857' }]}>Open Analytics</Text>
              <Icon name="arrow-right" size={14} color="#047857" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Platform Audit & Subscription Events */}
        <View style={styles.auditSection}>
          <View style={styles.auditHeader}>
            <View style={styles.auditHeaderLeft}>
              <View style={styles.auditTitleRow}>
                <Icon name="activity" size={16} color="#2563eb" />
                <Text style={styles.auditTitle}>Platform Audit & Subscription Events</Text>
              </View>
              <Text style={styles.auditSubtitle}>
                Live updates across plan upgrades, lender registrations, and system configurations.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.viewLogsBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('AdminActivityDetailsScreen')}
            >
              <Text style={styles.viewLogsText}>View All Logs</Text>
            </TouchableOpacity>
          </View>

          {/* Activity List */}
          {activitiesLoading && recentActivities.length === 0 ? (
            <View style={styles.activityLoadingBox}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.activityLoadingText}>Loading audit events...</Text>
            </View>
          ) : recentActivities.length > 0 ? (
            <View style={styles.activityList}>
              {recentActivities.slice(0, 6).map((item, idx) => {
                const config = getActivityConfig(item.type || item.action);
                const title = item.shortMessage || item.title || item.type || 'Platform Event';
                const desc = item.message || item.description || item.details || 'Event logged successfully.';
                const timeStr = item.relativeTime || formatRelativeTime(item.createdAt || item.timestamp);

                return (
                  <View
                    key={item._id || item.id || idx}
                    style={[
                      styles.activityRow,
                      idx < recentActivities.length - 1 && styles.activityRowBorder,
                    ]}
                  >
                    <View style={[styles.activityIconCircle, { backgroundColor: config.bg }]}>
                      <Icon name={config.icon} size={15} color={config.color} />
                    </View>
                    <View style={styles.activityBody}>
                      <View style={styles.activityMetaRow}>
                        <Text style={styles.activityItemTitle} numberOfLines={1}>
                          {title}
                        </Text>
                        <Text style={styles.activityItemTime}>{timeStr}</Text>
                      </View>
                      <Text style={styles.activityItemDesc} numberOfLines={2}>
                        {desc}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyActivityBox}>
              <Icon name="check-circle" size={32} color="#cbd5e1" />
              <Text style={styles.emptyActivityText}>No recent activity recorded yet.</Text>
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
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: m(16),
    paddingBottom: m(90),
  },
  heroBanner: {
    borderRadius: m(16),
    padding: m(18),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(10),
  },
  consoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    gap: m(5),
  },
  pulseDot: {
    width: m(6),
    height: m(6),
    borderRadius: m(3),
    backgroundColor: '#60a5fa',
  },
  consoleBadgeText: {
    fontSize: m(10),
    fontWeight: '700',
    color: '#93c5fd',
    letterSpacing: 0.3,
  },
  enterpriseTag: {
    fontSize: m(11),
    fontWeight: '600',
    color: '#94a3b8',
  },
  heroTitle: {
    fontSize: m(20),
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.3,
    marginBottom: m(4),
  },
  heroSubtitle: {
    fontSize: m(12),
    color: '#cbd5e1',
    lineHeight: m(17),
    marginBottom: m(14),
  },
  heroActionsRow: {
    flexDirection: 'row',
    gap: m(10),
  },
  heroPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: m(14),
    paddingVertical: m(8),
    borderRadius: m(8),
    gap: m(6),
  },
  heroPrimaryBtnText: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#ffffff',
  },
  heroSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: m(14),
    paddingVertical: m(8),
    borderRadius: m(8),
    gap: m(6),
  },
  heroSecondaryBtnText: {
    fontSize: m(12),
    fontWeight: '600',
    color: '#e2e8f0',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(10),
    marginBottom: m(18),
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderRadius: m(12),
    padding: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(8),
  },
  kpiLabel: {
    fontSize: m(10),
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.3,
    flex: 1,
  },
  kpiIconBox: {
    width: m(28),
    height: m(28),
    borderRadius: m(6),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: m(4),
  },
  kpiValue: {
    fontSize: m(18),
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  sectionHeading: {
    fontSize: m(14),
    fontWeight: '700',
    color: '#334155',
    marginBottom: m(10),
    marginLeft: m(2),
  },
  hubGrid: {
    gap: m(12),
    marginBottom: m(20),
  },
  hubCard: {
    backgroundColor: '#ffffff',
    borderRadius: m(14),
    padding: m(16),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  hubIconBox: {
    width: m(40),
    height: m(40),
    borderRadius: m(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: m(10),
  },
  hubTitle: {
    fontSize: m(15),
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: m(4),
  },
  hubDesc: {
    fontSize: m(12),
    color: '#64748b',
    lineHeight: m(17),
    marginBottom: m(12),
  },
  hubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(8),
    paddingHorizontal: m(12),
    borderRadius: m(8),
    borderWidth: 1,
    gap: m(6),
    alignSelf: 'flex-start',
  },
  hubButtonText: {
    fontSize: m(12),
    fontWeight: '700',
  },
  auditSection: {
    backgroundColor: '#ffffff',
    borderRadius: m(14),
    padding: m(16),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: m(16),
  },
  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: m(12),
    marginBottom: m(10),
  },
  auditHeaderLeft: {
    flex: 1,
    marginRight: m(10),
  },
  auditTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  auditTitle: {
    fontSize: m(13),
    fontWeight: '700',
    color: '#0f172a',
  },
  auditSubtitle: {
    fontSize: m(11),
    color: '#94a3b8',
    marginTop: m(2),
    lineHeight: m(15),
  },
  viewLogsBtn: {
    paddingHorizontal: m(10),
    paddingVertical: m(5),
    borderRadius: m(6),
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  viewLogsText: {
    fontSize: m(11),
    fontWeight: '700',
    color: '#1d4ed8',
  },
  activityList: {
    gap: m(2),
  },
  activityRow: {
    flexDirection: 'row',
    paddingVertical: m(10),
    alignItems: 'flex-start',
  },
  activityRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  activityIconCircle: {
    width: m(32),
    height: m(32),
    borderRadius: m(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(10),
    marginTop: m(2),
  },
  activityBody: {
    flex: 1,
  },
  activityMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityItemTitle: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  activityItemTime: {
    fontSize: m(10),
    color: '#94a3b8',
    marginLeft: m(6),
  },
  activityItemDesc: {
    fontSize: m(11),
    color: '#64748b',
    marginTop: m(2),
    lineHeight: m(15),
  },
  activityLoadingBox: {
    paddingVertical: m(24),
    alignItems: 'center',
    gap: m(8),
  },
  activityLoadingText: {
    fontSize: m(12),
    color: '#64748b',
  },
  emptyActivityBox: {
    paddingVertical: m(24),
    alignItems: 'center',
    gap: m(6),
  },
  emptyActivityText: {
    fontSize: m(12),
    color: '#94a3b8',
  },
});
