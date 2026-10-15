import React, { useEffect, useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { useSelector, useDispatch } from 'react-redux';
import { colors, FontFamily } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper } from '../../../Components/common';
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

/**
 * Get dynamic greeting based on time of day
 */
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export default function AdminDashboard() {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  // Redux state selectors
  const user = useSelector(state => state.auth?.user);
  const { revenueData } = useSelector(state => state.adminRevenue || {});
  const { activities: recentActivities = [], loading: activitiesLoading } = useSelector(
    state => state.adminActivities || {},
  );

  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('All');

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

  const displayName = user?.name || user?.userName || 'Admin';

  // Activity type icon configuration
  const getActivityConfig = useCallback((type) => {
    switch (type) {
      case 'subscription_purchased':
        return { icon: 'shopping-cart', label: 'Subscription', tag: 'Plan' };
      case 'plan_updated':
        return { icon: 'edit-3', label: 'Plan Updated', tag: 'Config' };
      case 'plan_created':
        return { icon: 'plus-circle', label: 'Plan Created', tag: 'Tier' };
      case 'lender_registered':
        return { icon: 'user-plus', label: 'New Lender', tag: 'KYC' };
      default:
        return { icon: 'activity', label: 'System Event', tag: 'Audit' };
    }
  }, []);

  // Filter activities based on tab
  const filteredActivities = useMemo(() => {
    if (!recentActivities || recentActivities.length === 0) return [];
    if (selectedPeriod === 'All') return recentActivities.slice(0, 5);
    if (selectedPeriod === 'Plans') {
      return recentActivities
        .filter(a => a.type?.includes('plan') || a.type?.includes('subscription'))
        .slice(0, 5);
    }
    if (selectedPeriod === 'Lenders') {
      return recentActivities
        .filter(a => a.type?.includes('lender') || a.type?.includes('user'))
        .slice(0, 5);
    }
    return recentActivities.slice(0, 5);
  }, [recentActivities, selectedPeriod]);

  return (
    <ScreenWrapper
      backgroundColor={colors.backgroundGreenWhite}
      topInsetBg={colors.primary}
      statusBarColor={colors.primary}
      statusBarStyle="dark-content"
      includeTabBarClearance={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.lettersAndIcons]}
        />
      }
    >
      <View style={styles.pageGreenWrapper}>
        {/* ======================================================== */}
        {/* 1. TOP GREEN SECTION (Matching Figma Design)             */}
        {/* ======================================================== */}
        <View style={styles.topSection}>
          {/* Greeting & Notification Row */}
          <View style={styles.greetingRow}>
            <View style={styles.greetingTextContainer}>
              <Text style={styles.greetingTitle}>Hi, Welcome Back</Text>
              <Text style={styles.greetingSubtitle}>
                {getGreeting()}, {displayName}
              </Text>
            </View>

            {/* White Circular Notification Button */}
            <TouchableOpacity
              style={styles.notificationBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('AdminActivityDetailsScreen')}
            >
              <Feather name="bell" size={m(20)} color={colors.lettersAndIcons} />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>

          {/* 2-Column Summary Stats on Green */}
          <View style={styles.topMetricsCard}>
            {/* Left Column: Total SaaS Revenue */}
            <View style={styles.metricColumn}>
              <View style={styles.metricLabelRow}>
                <Feather name="credit-card" size={m(13)} color={colors.lettersAndIcons} />
                <Text style={styles.metricLabelText}>Total SaaS Revenue</Text>
              </View>
              <Text style={styles.metricValueWhite} numberOfLines={1}>
                {formatCurrency(summary.totalRevenue)}
              </Text>
            </View>

            {/* Vertical Divider Line */}
            <View style={styles.metricDivider} />

            {/* Right Column: Active Plans */}
            <View style={styles.metricColumn}>
              <View style={styles.metricLabelRow}>
                <Feather name="layers" size={m(13)} color={colors.lettersAndIcons} />
                <Text style={styles.metricLabelText}>Active Plans</Text>
              </View>
              <Text style={styles.metricValueBlue} numberOfLines={1}>
                {summary.activePlans} Tiers
              </Text>
            </View>
          </View>

          {/* Target Progress Pill */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarPill}>
              <View style={styles.progressDarkTag}>
                <Text style={styles.progressDarkText}>100%</Text>
              </View>
              <View style={styles.progressWhiteBar}>
                <Text style={styles.progressWhiteText}>
                  {summary.totalPurchases} Subscriptions Active
                </Text>
              </View>
            </View>

            {/* Target caption */}
            <View style={styles.progressCaptionRow}>
              <Feather name="check-circle" size={m(14)} color={colors.lettersAndIcons} />
              <Text style={styles.progressCaptionText}>
                Platform SaaS operations active & healthy.
              </Text>
            </View>
          </View>
        </View>

        {/* ======================================================== */}
        {/* 2. MAIN CURVED SHEET SECTION (#F1FFF3)                   */}
        {/* ======================================================== */}
        <View style={styles.sheetSection}>
          {/* Feature Green Highlight Card */}
          <View style={styles.featureCard}>
            {/* Left Donut / Quota Circle */}
            <View style={styles.featureLeftCol}>
              <View style={styles.featureRingWrapper}>
                <Feather name="briefcase" size={m(22)} color={colors.lettersAndIcons} />
              </View>
              <Text style={styles.featureRingLabel}>Institutional</Text>
              <Text style={styles.featureRingSub}>Lenders Active</Text>
            </View>

            {/* Vertical White Divider */}
            <View style={styles.featureDivider} />

            {/* Right Metrics Stack */}
            <View style={styles.featureRightCol}>
              {/* Row 1: Avg Deal Size */}
              <View style={styles.featureStatItem}>
                <View style={styles.featureStatIconBox}>
                  <Feather name="dollar-sign" size={m(16)} color={colors.lettersAndIcons} />
                </View>
                <View style={styles.featureStatTexts}>
                  <Text style={styles.featureStatLabel}>Average Deal Size</Text>
                  <Text style={styles.featureStatValue}>
                    {formatCurrency(Math.round(summary.avgRevenue))}
                  </Text>
                </View>
              </View>

              {/* Horizontal White Divider */}
              <View style={styles.featureHorizontalDivider} />

              {/* Row 2: Total Purchases */}
              <View style={styles.featureStatItem}>
                <View style={styles.featureStatIconBox}>
                  <Feather name="shopping-bag" size={m(16)} color={colors.lettersAndIcons} />
                </View>
                <View style={styles.featureStatTexts}>
                  <Text style={styles.featureStatLabel}>Total Purchases</Text>
                  <Text style={styles.featureStatValue}>
                    {summary.totalPurchases} Deals
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Period Filter Capsule Tabs */}
          <View style={styles.periodCapsuleRow}>
            {['All', 'Plans', 'Lenders'].map(period => {
              const isSelected = selectedPeriod === period;
              return (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodTab,
                    isSelected && styles.periodTabActive,
                  ]}
                  onPress={() => setSelectedPeriod(period)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.periodTabText,
                      isSelected && styles.periodTabTextActive,
                    ]}
                  >
                    {period}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Activity Feed Section */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Activities</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('AdminActivityDetailsScreen')}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Activity Items List (Matching Blue Icon Circles in Figma Design) */}
          {activitiesLoading && recentActivities.length === 0 ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={colors.lettersAndIcons} />
              <Text style={styles.loadingText}>Loading activities...</Text>
            </View>
          ) : filteredActivities.length === 0 ? (
            <View style={styles.emptyBox}>
              <Feather name="inbox" size={m(28)} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No recent activity events found</Text>
            </View>
          ) : (
            filteredActivities.map((act, index) => {
              const cfg = getActivityConfig(act.type);
              return (
                <TouchableOpacity
                  key={act._id || act.id || index}
                  style={styles.activityItemCard}
                  activeOpacity={0.75}
                  onPress={() => navigation.navigate('AdminActivityDetailsScreen')}
                >
                  {/* Vibrant Blue Circle Icon */}
                  <View style={styles.activityIconCircle}>
                    <Feather name={cfg.icon} size={m(18)} color={colors.white} />
                  </View>

                  {/* Event Name & Timestamp */}
                  <View style={styles.activityMainCol}>
                    <Text style={styles.activityTitleText} numberOfLines={1}>
                      {act.description || act.title || cfg.label}
                    </Text>
                    <Text style={styles.activityTimeText}>
                      {formatRelativeTime(act.createdAt)}
                    </Text>
                  </View>

                  {/* Category Pill Tag */}
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{cfg.tag}</Text>
                  </View>

                  {/* Status or Amount */}
                  <View style={styles.activityStatusCol}>
                    <Text style={styles.activityStatusText}>
                      {act.metadata?.amount
                        ? formatCurrency(act.metadata.amount)
                        : 'Logged'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* Core Management Hub Shortcuts */}
          <View style={[styles.sectionHeaderRow, { marginTop: m(22) }]}>
            <Text style={styles.sectionTitle}>Management Directory</Text>
          </View>

          <View style={styles.hubGrid}>
            {/* Row 1: Lenders & Borrowers */}
            <View style={styles.hubRow}>
              {/* Hub 1: Lenders */}
              <TouchableOpacity
                style={styles.hubCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Lenders')}
              >
                <View style={styles.hubCardTop}>
                  <View style={[styles.hubIconCircle, { backgroundColor: '#E6F2FF' }]}>
                    <Feather name="users" size={m(17)} color={colors.blueButton} />
                  </View>
                  <Feather name="arrow-up-right" size={m(15)} color={colors.textSecondary} />
                </View>
                <Text style={styles.hubTitle}>Lenders</Text>
                <Text style={styles.hubSubtitle}>Institutions</Text>
              </TouchableOpacity>

              {/* Hub 2: Borrowers */}
              <TouchableOpacity
                style={styles.hubCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Borrowers')}
              >
                <View style={styles.hubCardTop}>
                  <View style={[styles.hubIconCircle, { backgroundColor: '#E6F2FF' }]}>
                    <Feather name="shield" size={m(17)} color={colors.blueButton} />
                  </View>
                  <Feather name="arrow-up-right" size={m(15)} color={colors.textSecondary} />
                </View>
                <Text style={styles.hubTitle}>Borrowers</Text>
                <Text style={styles.hubSubtitle}>KYC Dossiers</Text>
              </TouchableOpacity>
            </View>

            {/* Row 2: Plans & Revenue */}
            <View style={styles.hubRow}>
              {/* Hub 3: Plans */}
              <TouchableOpacity
                style={styles.hubCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Plans')}
              >
                <View style={styles.hubCardTop}>
                  <View style={[styles.hubIconCircle, { backgroundColor: '#E6F2FF' }]}>
                    <Feather name="layers" size={m(17)} color={colors.blueButton} />
                  </View>
                  <Feather name="arrow-up-right" size={m(15)} color={colors.textSecondary} />
                </View>
                <Text style={styles.hubTitle}>Plans</Text>
                <Text style={styles.hubSubtitle}>SaaS Pricing</Text>
              </TouchableOpacity>

              {/* Hub 4: Revenue */}
              <TouchableOpacity
                style={styles.hubCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Revenue')}
              >
                <View style={styles.hubCardTop}>
                  <View style={[styles.hubIconCircle, { backgroundColor: '#E6F2FF' }]}>
                    <Feather name="trending-up" size={m(17)} color={colors.blueButton} />
                  </View>
                  <Feather name="arrow-up-right" size={m(15)} color={colors.textSecondary} />
                </View>
                <Text style={styles.hubTitle}>Revenue</Text>
                <Text style={styles.hubSubtitle}>Analytics</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  // ==========================================
  // TOP GREEN SECTION
  // ==========================================
  pageGreenWrapper: {
    backgroundColor: colors.primary,
  },
  topSection: {
    backgroundColor: colors.primary,
    paddingHorizontal: m(20),
    paddingTop: m(14),
    paddingBottom: m(22),
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(18),
  },
  greetingTextContainer: {
    flex: 1,
    paddingRight: m(12),
  },
  greetingTitle: {
    fontSize: m(22),
    lineHeight: m(28),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: -0.2,
  },
  greetingSubtitle: {
    fontSize: m(13),
    lineHeight: m(18),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
    marginTop: m(2),
    opacity: 0.9,
  },
  notificationBtn: {
    width: m(44),
    height: m(44),
    borderRadius: m(22),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  notificationDot: {
    position: 'absolute',
    top: m(10),
    right: m(11),
    width: m(8),
    height: m(8),
    borderRadius: m(4),
    backgroundColor: colors.blueButton,
  },

  // 2-Column Summary Stats on Green
  topMetricsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(18),
  },
  metricColumn: {
    flex: 1,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
    marginBottom: m(4),
  },
  metricLabelText: {
    fontSize: m(12),
    lineHeight: m(16),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
    opacity: 0.9,
  },
  metricValueWhite: {
    fontSize: m(24),
    lineHeight: m(30),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
    letterSpacing: -0.3,
  },
  metricValueBlue: {
    fontSize: m(22),
    lineHeight: m(28),
    fontFamily: FontFamily.primaryBold,
    color: colors.oceanBlueButton,
    letterSpacing: -0.3,
  },
  metricDivider: {
    width: 1.5,
    height: m(40),
    backgroundColor: colors.white,
    marginHorizontal: m(16),
  },

  // Target Progress Pill
  progressContainer: {
    marginTop: m(2),
  },
  progressBarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: m(20),
    overflow: 'hidden',
    height: m(36),
  },
  progressDarkTag: {
    backgroundColor: colors.lettersAndIcons,
    paddingHorizontal: m(14),
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDarkText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  progressWhiteBar: {
    flex: 1,
    paddingHorizontal: m(12),
    justifyContent: 'center',
  },
  progressWhiteText: {
    fontSize: m(12),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.lettersAndIcons,
  },
  progressCaptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: m(8),
    gap: m(6),
  },
  progressCaptionText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
    opacity: 0.9,
  },

  // ==========================================
  // MAIN CURVED SHEET SECTION
  // ==========================================
  sheetSection: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(40),
    borderTopRightRadius: m(40),
    paddingHorizontal: m(18),
    paddingTop: m(24),
    paddingBottom: m(110),
  },

  // Feature Green Card
  featureCard: {
    backgroundColor: colors.primary,
    borderRadius: m(24),
    padding: m(18),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(20),
    elevation: 3,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  featureLeftCol: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: m(2),
  },
  featureRingWrapper: {
    width: m(54),
    height: m(54),
    borderRadius: m(27),
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 2.5,
    borderColor: colors.blueButton,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(6),
  },
  featureRingLabel: {
    fontSize: m(11.5),
    lineHeight: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    textAlign: 'center',
  },
  featureRingSub: {
    fontSize: m(10),
    lineHeight: m(13),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
    textAlign: 'center',
    opacity: 0.85,
  },
  featureDivider: {
    width: 1.5,
    height: '85%',
    backgroundColor: colors.white,
    marginHorizontal: m(12),
  },
  featureHorizontalDivider: {
    height: 1.5,
    backgroundColor: colors.white,
    marginVertical: m(8),
    width: '100%',
  },
  featureRightCol: {
    flex: 1,
    justifyContent: 'center',
  },
  featureStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureStatIconBox: {
    width: m(34),
    height: m(34),
    borderRadius: m(10),
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(10),
  },
  featureStatTexts: {
    flex: 1,
  },
  featureStatLabel: {
    fontSize: m(11),
    lineHeight: m(15),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
    opacity: 0.85,
  },
  featureStatValue: {
    fontSize: m(15),
    lineHeight: m(20),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  // Period Tabs Capsule
  periodCapsuleRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: m(24),
    padding: m(4),
    marginBottom: m(20),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
  },
  periodTab: {
    flex: 1,
    paddingVertical: m(8),
    borderRadius: m(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodTabActive: {
    backgroundColor: colors.primary,
  },
  periodTabText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  periodTabTextActive: {
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(12),
  },
  sectionTitle: {
    fontSize: m(16),
    lineHeight: m(22),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  viewAllText: {
    fontSize: m(13),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.blueButton,
  },

  // Activity Feed Items (Matching Blue Circle Rows)
  activityItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: m(18),
    paddingVertical: m(12),
    paddingHorizontal: m(14),
    marginBottom: m(10),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.06)',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  activityIconCircle: {
    width: m(40),
    height: m(40),
    borderRadius: m(20),
    backgroundColor: colors.blueButton, // #3299FF matching screenshot
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(12),
  },
  activityMainCol: {
    flex: 1,
    paddingRight: m(8),
  },
  activityTitleText: {
    fontSize: m(13.5),
    lineHeight: m(18),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.lettersAndIcons,
  },
  activityTimeText: {
    fontSize: m(11),
    lineHeight: m(15),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(2),
  },
  categoryTag: {
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(8),
    backgroundColor: colors.lightGreen,
    marginRight: m(8),
  },
  categoryTagText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  activityStatusCol: {
    alignItems: 'flex-end',
  },
  activityStatusText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  // Loading & Empty States
  loadingBox: {
    paddingVertical: m(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(6),
  },
  emptyBox: {
    paddingVertical: m(28),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: m(18),
  },
  emptyText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(8),
  },

  // Management Directory Grid - Compact Modern Cards
  hubGrid: {
    gap: m(10),
  },
  hubRow: {
    flexDirection: 'row',
    gap: m(10),
  },
  hubCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(12),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    minHeight: m(88),
    justifyContent: 'space-between',
  },
  hubCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(8),
  },
  hubIconCircle: {
    width: m(32),
    height: m(32),
    borderRadius: m(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  hubTitle: {
    fontSize: m(14),
    lineHeight: m(18),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  hubSubtitle: {
    fontSize: m(11),
    lineHeight: m(15),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(1),
  },
});
