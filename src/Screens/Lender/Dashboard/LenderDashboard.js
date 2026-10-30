import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Animated,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { useSelector } from 'react-redux';
import { colors, FontFamily } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper, showAlert } from '../../../Components/common';
import lenderFlowService from '../../../Services/lenderFlowService';
import NotificationService from '../../../Services/NotificationService';

/**
 * Format currency to Indian Rupee format
 */
const formatCurrency = (val) => {
  if (!val && val !== 0) return '₹0';
  const num = Number(val) || 0;
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lakh`;
  return `₹${num.toLocaleString('en-IN')}`;
};

/**
 * Dynamic greeting based on current time
 */
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export default function LenderDashboard() {
  const navigation = useNavigation();
  const user = useSelector(state => state.auth?.user);

  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    acceptedRequests: 0,
    rejectedRequests: 0,
    availableBorrowersCount: 0,
    recentPendingRequests: [],
  });

  const [portfolioMetrics, setPortfolioMetrics] = useState({
    totalDisbursed: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    totalInterestExpected: 0,
    activeCount: 0,
    closedCount: 0,
    overdueCount: 0,
  });

  const [activePlan, setActivePlan] = useState(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Deduplication & cooldown refs
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);

  const fetchAllDashboardData = useCallback(async (isSilent = false, force = false) => {
    if (!user?._id || user?.roleId !== 1) return;
    if (isFetchingRef.current) return;

    const now = Date.now();
    if (!force && now - lastFetchTimeRef.current < 45000) return;

    try {
      isFetchingRef.current = true;
      lastFetchTimeRef.current = now;
      if (!isSilent) setLoading(true);
      const [statsRes, loansRes, planRes, notifsRes] = await Promise.allSettled([
        lenderFlowService.getDashboardStats(force),
        lenderFlowService.getLoansPortfolio({ limit: 5 }),
        lenderFlowService.getActivePlan(),
        lenderFlowService.getNotifications(),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
        setStats(statsRes.value.stats || {});
      }

      if (loansRes.status === 'fulfilled' && loansRes.value?.success) {
        if (loansRes.value.portfolioMetrics) {
          setPortfolioMetrics(loansRes.value.portfolioMetrics);
        }
      }

      if (planRes.status === 'fulfilled' && planRes.value?.success) {
        setActivePlan(planRes.value.data || planRes.value.plan || null);
      }

      if (notifsRes.status === 'fulfilled' && notifsRes.value?.success) {
        setUnreadNotificationsCount(notifsRes.value.unreadCount || 0);
      }
    } catch (err) {
      if (err?.response?.status !== 401) {
        console.error('Error fetching lender dashboard data:', err);
      }
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?._id, user?.roleId]);

  useFocusEffect(
    useCallback(() => {
      if (!user?._id || user?.roleId !== 1) return;
      fetchAllDashboardData();
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }, [user?._id, user?.roleId, fetchAllDashboardData, fadeAnim])
  );

  // Real-time foreground notification listener to update bell badge immediately
  useEffect(() => {
    const unsubscribe = NotificationService.addListener(() => {
      lenderFlowService
        .getNotifications()
        .then((res) => {
          if (res?.success) {
            setUnreadNotificationsCount(res.unreadCount || 0);
          }
        })
        .catch(() => {});
    });
    return unsubscribe;
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllDashboardData(false, true);
  };

  const displayName =
    user?.companyName || user?.userName || user?.name || 'Institutional Lender';

  // Recent pending inquiries list
  const filteredInquiries = useMemo(() => {
    return stats.recentPendingRequests || [];
  }, [stats.recentPendingRequests]);

  const activeLoansCount = portfolioMetrics.activeCount || stats.acceptedRequests || 0;
  const pendingCount = stats.pendingRequests || 0;
  const totalDisbursedVal = portfolioMetrics.totalDisbursed || 0;
  const expectedYieldVal = portfolioMetrics.totalInterestExpected || 0;

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
      <Animated.View style={[{ opacity: fadeAnim }, styles.pageGreenWrapper]}>
        {/* ======================================================== */}
        {/* 1. TOP GREEN SECTION (Matching Borrower Dashboard)       */}
        {/* ======================================================== */}
        <View style={styles.topSection}>
          <View style={styles.greetingRow}>
            <TouchableOpacity
              style={styles.greetingTextContainer}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('LenderProfile')}
            >
              <Text style={styles.greetingTitle}>Hi, Welcome Back</Text>
              <Text style={styles.greetingSubtitle} numberOfLines={1}>
                {getGreeting()}, {displayName}
              </Text>
            </TouchableOpacity>

            <View style={styles.headerBtnGroup}>
              {/* White Circular Notification Button */}
              <TouchableOpacity
                style={styles.notificationBtn}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('NotificationsScreen')}
              >
                <Feather name="bell" size={m(19)} color={colors.lettersAndIcons} />
                {unreadNotificationsCount > 0 ? (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                    </Text>
                  </View>
                ) : pendingCount > 0 ? (
                  <View style={styles.notificationDot} />
                ) : null}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ======================================================== */}
        {/* 2. MAIN CURVED SHEET SECTION (#F1FFF3)                   */}
        {/* ======================================================== */}
        <View style={styles.sheetSection}>
          {/* Feature Highlight Hero Card */}
          <View style={styles.featureCard}>
            {/* Left Column: Total Disbursed Capital */}
            <TouchableOpacity
              style={styles.featureLeftCol}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('LenderLoansPortfolio')}
            >
              <View style={styles.featureRingWrapper}>
                <Feather name="arrow-up-right" size={m(18)} color="#059669" />
              </View>
              <Text style={styles.featureCountText} numberOfLines={1}>
                {formatCurrency(totalDisbursedVal)}
              </Text>
              <Text style={styles.featureRingLabel}>Total Disbursed</Text>
              <Text style={styles.featureRingSub}>{activeLoansCount} Active Deals ›</Text>
            </TouchableOpacity>

            {/* Vertical Divider */}
            <View style={styles.featureDivider} />

            {/* Right Column: Pipeline & Yield */}
            <View style={styles.featureRightCol}>
              {/* Row 1: Incoming Inquiries */}
              <TouchableOpacity
                style={styles.featureStatItem}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('LenderIncomingRequests')}
              >
                <View style={[styles.featureStatIconBox, { backgroundColor: '#eff6ff' }]}>
                  <Feather name="inbox" size={m(15)} color="#2563eb" />
                </View>
                <View style={styles.featureStatTexts}>
                  <Text style={styles.featureStatLabel}>Incoming Inquiries</Text>
                  <Text
                    style={[
                      styles.featureStatValue,
                      { color: pendingCount > 0 ? '#2563eb' : colors.lettersAndIcons },
                    ]}
                    numberOfLines={1}
                  >
                    {pendingCount > 0 ? `${pendingCount} Awaiting Review` : 'All Reviewed'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Horizontal Divider */}
              <View style={styles.featureHorizontalDivider} />

              {/* Row 2: Projected Returns / Yield */}
              <TouchableOpacity
                style={styles.featureStatItem}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('LenderLoansPortfolio')}
              >
                <View style={[styles.featureStatIconBox, { backgroundColor: '#ecfdf5' }]}>
                  <Feather name="percent" size={m(15)} color="#059669" />
                </View>
                <View style={styles.featureStatTexts}>
                  <Text style={styles.featureStatLabel}>Projected Yield</Text>
                  <Text style={styles.featureStatValue} numberOfLines={1}>
                    +{formatCurrency(expectedYieldVal)}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* ======================================================== */}
          {/* PORTFOLIO OVERVIEW (2x2 Grid Matching Borrower Dashboard) */}
          {/* ======================================================== */}
          <View style={[styles.sectionHeaderRow, { marginTop: m(4), marginBottom: m(12) }]}>
            <View>
              <Text style={styles.sectionTitle}>Portfolio Overview</Text>
              <Text style={styles.sectionSubtitle}>
                Your lending facilities and deal flow
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('LenderLoansPortfolio')}
              activeOpacity={0.7}
              style={styles.allRequestsBtn}
            >
              <Text style={styles.allRequestsText}>All Loans</Text>
              <Feather name="chevron-right" size={m(13)} color={colors.white} style={{ marginLeft: m(2) }} />
            </TouchableOpacity>
          </View>

          {/* 2x2 Clean Activity Grid */}
          <View style={styles.overviewGrid}>
            {/* Row 1 */}
            <View style={styles.overviewGridRow}>
              {/* 1. Active Facilities */}
              <TouchableOpacity
                style={styles.overviewCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('LenderLoansPortfolio')}
              >
                <View style={styles.overviewCardTop}>
                  <View style={[styles.overviewIconBox, { backgroundColor: '#ecfdf5' }]}>
                    <Feather name="layers" size={m(16)} color="#059669" />
                  </View>
                  <View style={[styles.overviewTag, { backgroundColor: '#ecfdf5' }]}>
                    <Text style={[styles.overviewTagText, { color: '#059669' }]}>ACTIVE</Text>
                  </View>
                </View>
                <Text style={styles.overviewValue}>{activeLoansCount}</Text>
                <Text style={styles.overviewTitle}>Active Facilities</Text>
                <Text style={styles.overviewSub}>Earning interest</Text>
              </TouchableOpacity>

              {/* 2. In Review */}
              <TouchableOpacity
                style={styles.overviewCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('LenderIncomingRequests')}
              >
                <View style={styles.overviewCardTop}>
                  <View style={[styles.overviewIconBox, { backgroundColor: '#fffbeb' }]}>
                    <Feather name="clock" size={m(16)} color="#d97706" />
                  </View>
                  <View style={[styles.overviewTag, { backgroundColor: '#fffbeb' }]}>
                    <Text style={[styles.overviewTagText, { color: '#d97706' }]}>PENDING</Text>
                  </View>
                </View>
                <Text style={styles.overviewValue}>{pendingCount}</Text>
                <Text style={styles.overviewTitle}>New Inquiries</Text>
                <Text style={styles.overviewSub}>Awaiting decision</Text>
              </TouchableOpacity>
            </View>

            {/* Row 2 */}
            <View style={styles.overviewGridRow}>
              {/* 3. Sanctioned Deals */}
              <TouchableOpacity
                style={styles.overviewCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('LenderLoansPortfolio')}
              >
                <View style={styles.overviewCardTop}>
                  <View style={[styles.overviewIconBox, { backgroundColor: '#eff6ff' }]}>
                    <Feather name="check-circle" size={m(16)} color="#2563eb" />
                  </View>
                  <View style={[styles.overviewTag, { backgroundColor: '#eff6ff' }]}>
                    <Text style={[styles.overviewTagText, { color: '#2563eb' }]}>SANCTIONED</Text>
                  </View>
                </View>
                <Text style={styles.overviewValue}>{stats.acceptedRequests || 0}</Text>
                <Text style={styles.overviewTitle}>Sanctioned Deals</Text>
                <Text style={styles.overviewSub}>Ready to disburse</Text>
              </TouchableOpacity>

              {/* 4. Borrower Network */}
              <TouchableOpacity
                style={styles.overviewCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('LenderAvailableBorrowers')}
              >
                <View style={styles.overviewCardTop}>
                  <View style={[styles.overviewIconBox, { backgroundColor: '#f5f3ff' }]}>
                    <Feather name="users" size={m(16)} color="#7c3aed" />
                  </View>
                  <View style={[styles.overviewTag, { backgroundColor: '#f5f3ff' }]}>
                    <Text style={[styles.overviewTagText, { color: '#7c3aed' }]}>NETWORK</Text>
                  </View>
                </View>
                <Text style={styles.overviewValue}>{stats.availableBorrowersCount || 1}</Text>
                <Text style={styles.overviewTitle}>Borrower Network</Text>
                <Text style={styles.overviewSub}>Verified pool</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ======================================================== */}
          {/* RECENT PENDING INQUIRIES LIST                            */}
          {/* ======================================================== */}
          <View style={[styles.sectionHeaderRow, { marginTop: m(14), marginBottom: m(12) }]}>
            <View>
              <Text style={styles.sectionTitle}>Recent Pending Inquiries</Text>
              <Text style={styles.sectionSubtitle}>
                Incoming loan requests awaiting underwriting
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('LenderIncomingRequests')}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Pending Inquiries List */}
          {loading && !refreshing ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={colors.lettersAndIcons} />
              <Text style={styles.loadingText}>Syncing pending inquiries...</Text>
            </View>
          ) : filteredInquiries.length === 0 ? (
            <View style={styles.emptyBox}>
              <Feather name="check-circle" size={m(28)} color={colors.primary} />
              <Text style={styles.emptyText}>All incoming applications attended</Text>
            </View>
          ) : (
            filteredInquiries.map((req, index) => {
              const borrowerName =
                req.borrowerSnapshot?.businessName ||
                req.borrowerId?.companyName ||
                req.borrowerId?.userName ||
                'Corporate Borrower';
              const creditScore = req.borrowerSnapshot?.creditScore || 750;

              return (
                <TouchableOpacity
                  key={req._id || index}
                  style={styles.activityCard}
                  activeOpacity={0.75}
                  onPress={() =>
                    navigation.navigate('LenderRequestDetails', {
                      requestId: req._id,
                      request: req,
                    })
                  }
                >
                  <View style={styles.activityHeaderRow}>
                    <View style={styles.activityIconCircle}>
                      <Feather name="briefcase" size={m(16)} color={colors.white} />
                    </View>
                    <View style={styles.activityInfoCol}>
                      <Text style={styles.activityTitleText} numberOfLines={1}>
                        {borrowerName}
                      </Text>
                      <Text style={styles.activityTimeText} numberOfLines={1}>
                        {req.purpose || 'Working Capital'} • {req.tenureMonths || 12} Months
                      </Text>
                    </View>
                    <View style={styles.categoryTag}>
                      <Text style={styles.categoryTagText}>Score {creditScore}</Text>
                    </View>
                  </View>

                  <View style={styles.activityFooterRow}>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusPillText}>
                        {req.status === 'accepted' ? 'SANCTIONED' : req.status === 'disbursed' ? 'DISBURSED' : 'PENDING REVIEW'}
                      </Text>
                    </View>
                    <Text style={styles.activityAmountText}>
                      {formatCurrency(req.amount)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* ======================================================== */}
          {/* QUICK ACTIONS GRID                                       */}
          {/* ======================================================== */}
          <View style={[styles.sectionHeaderRow, { marginTop: m(18), marginBottom: m(10) }]}>
            <View>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>
          </View>

          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.actionButtonPrimary}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('LenderSubscriptionScreen')}
            >
              <View style={styles.actionIconCircle}>
                <Feather name="credit-card" size={m(16)} color={colors.white} />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={styles.actionTitlePrimary}>Subscription Packs</Text>
                <Text style={styles.actionSubPrimary} numberOfLines={1}>
                  {activePlan?.hasActivePlan
                    ? `${activePlan?.plan?.planName || 'Active Plan'} (${activePlan?.remainingDays ?? 0}d left)`
                    : (activePlan?.plan?.planName || activePlan?.planName || 'Explore & Recharge')}
                </Text>
              </View>
              <Feather name="chevron-right" size={m(16)} color={colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButtonSecondary}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('LenderAvailableBorrowers')}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: '#eff6ff' }]}>
                <Feather name="search" size={m(16)} color="#2563eb" />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={styles.actionTitleSecondary}>Explore Borrowers</Text>
                <Text style={styles.actionSubSecondary}>Deploy capital</Text>
              </View>
              <Feather name="chevron-right" size={m(16)} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={{ height: m(20) }} />
        </View>
      </Animated.View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  // ==========================================
  // TOP GREEN SECTION (Matching Borrower Dashboard)
  // ==========================================
  pageGreenWrapper: {
    backgroundColor: colors.primary,
  },
  topSection: {
    backgroundColor: colors.primary,
    paddingHorizontal: m(20),
    paddingTop: m(14),
    paddingBottom: m(20),
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
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
  headerBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
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
    backgroundColor: '#d97706',
  },
  notificationBadge: {
    position: 'absolute',
    top: m(2),
    right: m(2),
    backgroundColor: '#EF4444',
    minWidth: m(18),
    height: m(18),
    borderRadius: m(9),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: m(3),
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  notificationBadgeText: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
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

  // Feature Highlight Card (Hero Overview)
  featureCard: {
    backgroundColor: colors.white,
    borderRadius: m(20),
    paddingVertical: m(14),
    paddingHorizontal: m(16),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(20),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    elevation: 3,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  featureLeftCol: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: m(4),
    minWidth: m(110),
  },
  featureRingWrapper: {
    width: m(42),
    height: m(42),
    borderRadius: m(21),
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(4),
  },
  featureCountText: {
    fontSize: m(17),
    lineHeight: m(22),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    textAlign: 'center',
  },
  featureRingLabel: {
    fontSize: m(11.5),
    lineHeight: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    textAlign: 'center',
  },
  featureRingSub: {
    fontSize: m(9.5),
    lineHeight: m(13),
    fontFamily: FontFamily.primaryMedium,
    color: '#059669',
    textAlign: 'center',
    marginTop: m(1),
  },
  featureDivider: {
    width: 1,
    height: '75%',
    backgroundColor: '#e2e8f0',
    marginHorizontal: m(12),
  },
  featureHorizontalDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: m(6),
    width: '100%',
  },
  featureRightCol: {
    flex: 1,
    justifyContent: 'center',
  },
  featureStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: m(4),
  },
  featureStatIconBox: {
    width: m(34),
    height: m(34),
    borderRadius: m(10),
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
    color: colors.textSecondary,
  },
  featureStatValue: {
    fontSize: m(13.5),
    lineHeight: m(18),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginTop: m(1),
  },

  // 2x2 Clean Activity Grid
  overviewGrid: {
    marginBottom: m(18),
    gap: m(10),
  },
  overviewGridRow: {
    flexDirection: 'row',
    gap: m(10),
  },
  overviewCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: m(16),
    paddingVertical: m(12),
    paddingHorizontal: m(12),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.06)',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  overviewCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(6),
  },
  overviewIconBox: {
    width: m(30),
    height: m(30),
    borderRadius: m(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  overviewTag: {
    paddingHorizontal: m(6),
    paddingVertical: m(2),
    borderRadius: m(6),
  },
  overviewTagText: {
    fontSize: m(8.5),
    fontFamily: FontFamily.primaryBold,
    letterSpacing: 0.4,
  },
  overviewValue: {
    fontSize: m(20),
    lineHeight: m(26),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  overviewTitle: {
    fontSize: m(12),
    lineHeight: m(16),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginTop: m(2),
  },
  overviewSub: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(1),
  },

  // Quick Action Navigation Buttons
  quickActionsGrid: {
    flexDirection: 'row',
    gap: m(10),
    marginBottom: m(16),
  },
  actionButtonPrimary: {
    flex: 1,
    backgroundColor: colors.lettersAndIcons,
    borderRadius: m(16),
    paddingVertical: m(12),
    paddingHorizontal: m(12),
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButtonSecondary: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: m(16),
    paddingVertical: m(12),
    paddingHorizontal: m(12),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  actionIconCircle: {
    width: m(32),
    height: m(32),
    borderRadius: m(16),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(8),
  },
  actionTextWrap: {
    flex: 1,
  },
  actionTitlePrimary: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  actionSubPrimary: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryRegular,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  actionTitleSecondary: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  actionSubSecondary: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
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
  sectionSubtitle: {
    fontSize: m(11),
    lineHeight: m(15),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(1),
  },
  viewAllText: {
    fontSize: m(13),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.blueButton,
  },
  allRequestsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blueButton,
    paddingHorizontal: m(10),
    paddingVertical: m(5),
    borderRadius: m(16),
  },
  allRequestsText: {
    fontSize: m(11),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.white,
  },

  // Period Tabs Capsule
  periodCapsuleRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: m(24),
    padding: m(4),
    marginBottom: m(16),
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
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  periodTabTextActive: {
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  // Activity / Deal Cards
  activityCard: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(14),
    marginBottom: m(10),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.06)',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  activityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(10),
  },
  activityIconCircle: {
    width: m(34),
    height: m(34),
    borderRadius: m(17),
    backgroundColor: colors.blueButton,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(10),
  },
  activityInfoCol: {
    flex: 1,
    marginRight: m(8),
  },
  activityTitleText: {
    fontSize: m(13.5),
    lineHeight: m(18),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  activityTimeText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(1),
  },
  categoryTag: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(6),
  },
  categoryTagText: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: '#059669',
  },
  activityFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: m(8),
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  statusPill: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(6),
  },
  statusPillText: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: '#2563eb',
  },
  activityAmountText: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  loadingBox: {
    paddingVertical: m(30),
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
  },
  loadingText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
  },
  emptyBox: {
    paddingVertical: m(30),
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
  },
  emptyText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
  },
});
