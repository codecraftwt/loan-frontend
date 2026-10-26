import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Animated,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, FontFamily } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper } from '../../../Components/common';
import borrowerFlowService from '../../../Services/borrowerFlowService';
import { logout } from '../../../Redux/Slices/authslice';

/**
 * Format currency to Indian Rupee representation
 */
const formatCurrency = (val) => {
  if (!val && val !== 0) return '₹0';
  const num = Number(val) || 0;
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lakh`;
  return `₹${num.toLocaleString('en-IN')}`;
};

/**
 * Dynamic greeting based on current local hour
 */
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export default function BorrowerDashboard() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth?.user);

  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    autoRejectedApplications: 0,
    rejectedApplications: 0,
    totalLendersAvailable: 0,
    latestAccepted: null,
  });

  const [portfolioMetrics, setPortfolioMetrics] = useState({
    totalBorrowed: 0,
    totalRepaid: 0,
    totalOutstanding: 0,
    totalLoans: 0,
    activeLoansCount: 0,
    closedLoansCount: 0,
    nextEmi: null,
  });

  const [recentApplications, setRecentApplications] = useState([]);
  const [activeLoans, setActiveLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fade-in animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchAllDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, loansRes, appsRes] = await Promise.allSettled([
        borrowerFlowService.getDashboardStats(),
        borrowerFlowService.getLoansPortfolio({ limit: 5 }),
        borrowerFlowService.getMyApplications({ limit: 5 }),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
        setStats(statsRes.value.stats || {});
      }

      if (loansRes.status === 'fulfilled' && loansRes.value?.success) {
        if (loansRes.value.metrics) {
          setPortfolioMetrics(loansRes.value.metrics);
        }
        if (loansRes.value.loans) {
          setActiveLoans(loansRes.value.loans);
        }
      }

      if (appsRes.status === 'fulfilled' && appsRes.value?.success) {
        setRecentApplications(appsRes.value.applications || []);
      }
    } catch (err) {
      console.error('Error fetching borrower dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAllDashboardData();
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }, [fetchAllDashboardData, fadeAnim])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllDashboardData();
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out from the Borrower Workspace?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            dispatch(logout());
            await AsyncStorage.clear();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  const handleViewAcceptedApplication = async () => {
    if (!stats.latestAccepted?._id) {
      navigation.navigate('BorrowerApplications');
      return;
    }
    const appId = stats.latestAccepted._id;
    // Optimistically remove from state so banner disappears immediately
    setStats((prev) => ({ ...prev, latestAccepted: null }));
    try {
      await borrowerFlowService.markApplicationRead(appId);
    } catch (e) {
      console.error('Failed to mark accepted app as read:', e);
    }
    navigation.navigate('BorrowerApplications');
  };

  const displayName =
    user?.companyName || user?.businessName || user?.userName || user?.name || 'Commercial Borrower';

  // Active facility calculations
  const activeCount = portfolioMetrics.activeLoansCount || (stats.latestAccepted ? 1 : 0);
  const pendingCount = stats.pendingApplications || 0;
  const totalBorrowedVal = portfolioMetrics.totalBorrowed || stats.latestAccepted?.amount || 0;
  const nextEmiVal =
    typeof portfolioMetrics.nextEmi === 'object'
      ? portfolioMetrics.nextEmi?.amount || 0
      : Number(portfolioMetrics.nextEmi) || 0;

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
        {/* 1. TOP GREEN SECTION (Matching Exact Figma Design)       */}
        {/* ======================================================== */}
        <View style={styles.topSection}>
          {/* Greeting & Action Header */}
          <View style={styles.greetingRow}>
            <TouchableOpacity
              style={styles.greetingTextContainer}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('BorrowerProfileScreen')}
            >
              <Text style={styles.greetingTitle}>Hi, Welcome Back</Text>
              <Text style={styles.greetingSubtitle} numberOfLines={1}>
                {getGreeting()}, {displayName}
              </Text>
            </TouchableOpacity>

            <View style={styles.headerBtnGroup}>
              {/* White Circular Notification Button (Matching Lender & Admin Panels) */}
              <TouchableOpacity
                style={styles.notificationBtn}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('BorrowerRecentActivity')}
              >
                <Feather name="bell" size={m(19)} color={colors.lettersAndIcons} />
                {stats.latestAccepted && <View style={styles.notificationDot} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* 2-Column Summary Stats on Green */}
          <View style={styles.topMetricsCard}>
            {/* Left Column: Total Borrowed / Credit */}
            <TouchableOpacity
              style={styles.metricColumn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('BorrowerLoansPortfolio')}
            >
              <View style={styles.metricLabelRow}>
                <Feather name="arrow-down-left" size={m(13)} color={colors.lettersAndIcons} />
                <Text style={styles.metricLabelText}>Sanctioned Debt</Text>
              </View>
              <Text style={styles.metricValueWhite} numberOfLines={1}>
                {formatCurrency(totalBorrowedVal)}
              </Text>
            </TouchableOpacity>

            {/* Vertical Divider */}
            <View style={styles.metricDivider} />

            {/* Right Column: Next Due EMI */}
            <TouchableOpacity
              style={styles.metricColumn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('BorrowerLoansPortfolio')}
            >
              <View style={styles.metricLabelRow}>
                <Feather name="clock" size={m(13)} color={colors.lettersAndIcons} />
                <Text style={styles.metricLabelText}>Next Installment</Text>
              </View>
              <Text style={styles.metricValueBlue} numberOfLines={1}>
                {nextEmiVal > 0 ? formatCurrency(nextEmiVal) : '₹0 Due'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Target Progress Pill */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarPill}>
              <View style={styles.progressDarkTag}>
                <Text style={styles.progressDarkText}>
                  {activeCount > 0 ? `${activeCount} ACTIVE` : 'HEALTHY'}
                </Text>
              </View>
              <View style={styles.progressWhiteBar}>
                <Text style={styles.progressWhiteText} numberOfLines={1}>
                  Credit Grade A • Commercial Facility in Good Standing
                </Text>
              </View>
            </View>

            {/* Target Caption */}
            <View style={styles.progressCaptionRow}>
              <Feather name="shield" size={m(13)} color={colors.lettersAndIcons} />
              <Text style={styles.progressCaptionText}>
                Borrower verified via DigiLocker & NSDL. Credit ready.
              </Text>
            </View>
          </View>
        </View>

        {/* ======================================================== */}
        {/* 2. MAIN CURVED SHEET SECTION (#F1FFF3)                   */}
        {/* ======================================================== */}
        <View style={styles.sheetSection}>
          {/* Accepted Deal Banner (When active accepted deal exists) */}
          {stats.latestAccepted ? (
            <View style={styles.acceptedBannerCard}>
              <View style={styles.acceptedBannerHeader}>
                <View style={styles.acceptedIconCircle}>
                  <Feather name="check-circle" size={m(18)} color="#059669" />
                </View>
                <View style={{ flex: 1, marginLeft: m(10) }}>
                  <Text style={styles.acceptedBadgeText}>FACILITY SANCTIONED</Text>
                  <Text style={styles.acceptedTitleText}>
                    {formatCurrency(stats.latestAccepted.amount)} accepted by{' '}
                    <Text style={{ fontFamily: FontFamily.primaryBold, color: '#047857' }}>
                      {stats.latestAccepted.lenderId?.companyName ||
                        stats.latestAccepted.lenderId?.userName ||
                        'Institutional Lender'}
                    </Text>
                  </Text>
                </View>
              </View>

              <Text style={styles.acceptedSubText}>
                Purpose: {stats.latestAccepted.purpose} • Tenure: {stats.latestAccepted.tenureMonths} Months. Other pending applications were automatically closed.
              </Text>

              <View style={styles.acceptedBottomRow}>
                <TouchableOpacity
                  style={styles.acceptedContactBox}
                  activeOpacity={0.8}
                  onPress={() => {
                    const lenderId = stats.latestAccepted.lenderId?._id || stats.latestAccepted.lenderId;
                    if (lenderId) {
                      navigation.navigate('BorrowerLenderDetails', { lenderId });
                    }
                  }}
                >
                  {/* <Text style={styles.acceptedContactLabel}>LENDER CONTACT</Text> */}
                  <Text style={styles.acceptedContactName} numberOfLines={1}>
                    {stats.latestAccepted.lenderId?.userName || 'Loan Officer'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.viewAppBtn}
                  activeOpacity={0.85}
                  onPress={handleViewAcceptedApplication}
                >
                  <Text style={styles.viewAppBtnText}>View Application</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* Feature Highlight Card (Goal / Solvency Overview) */}
          <View style={styles.featureCard}>
            {/* Left Solvency Ring */}
            <TouchableOpacity
              style={styles.featureLeftCol}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('BorrowerLoansPortfolio')}
            >
              <View style={styles.featureRingWrapper}>
                <Feather name="credit-card" size={m(22)} color={colors.lettersAndIcons} />
              </View>
              <Text style={styles.featureRingLabel}>Active Book</Text>
              <Text style={styles.featureRingSub}>{activeCount} Facilities</Text>
            </TouchableOpacity>

            {/* Vertical White Divider */}
            <View style={styles.featureDivider} />

            {/* Right Metrics Stack */}
            <View style={styles.featureRightCol}>
              {/* Row 1: Available Institutional Lenders */}
              <TouchableOpacity
                style={styles.featureStatItem}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('BorrowerExploreLenders')}
              >
                <View style={styles.featureStatIconBox}>
                  <Feather name="briefcase" size={m(16)} color={colors.lettersAndIcons} />
                </View>
                <View style={styles.featureStatTexts}>
                  <Text style={styles.featureStatLabel}>Available Lenders</Text>
                  <Text style={styles.featureStatValue}>
                    {stats.totalLendersAvailable || 12} Institutional
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Horizontal White Divider */}
              <View style={styles.featureHorizontalDivider} />

              {/* Row 2: Applications In Flight */}
              <TouchableOpacity
                style={styles.featureStatItem}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('BorrowerApplications')}
              >
                <View style={styles.featureStatIconBox}>
                  <Feather name="inbox" size={m(16)} color={colors.lettersAndIcons} />
                </View>
                <View style={styles.featureStatTexts}>
                  <Text style={styles.featureStatLabel}>Facility Inquiries</Text>
                  <Text style={styles.featureStatValue}>
                    {pendingCount} Under Review
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* ======================================================== */}
          {/* COMMERCIAL PIPELINE PROGRESSION STRIP                    */}
          {/* ======================================================== */}
          <View style={[styles.sectionHeaderRow, { marginTop: m(6), marginBottom: m(12) }]}>
            <View>
              <Text style={styles.sectionTitle}>Financing Progression</Text>
              <Text style={styles.sectionSubtitle}>
                Active facility inflow & requests
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('BorrowerApplications')}
              activeOpacity={0.7}
              style={styles.allRequestsBtn}
            >
              <Text style={styles.allRequestsText}>All Pipeline</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dealFlowScrollView}
            contentContainerStyle={styles.dealFlowScroll}
          >
            {/* 1. In Review */}
            <TouchableOpacity
              style={styles.dealFlowCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('BorrowerApplications')}
            >
              <View style={styles.dealFlowTop}>
                <Text style={[styles.dealFlowTag, { color: colors.blueButton }]}>
                  UNDER REVIEW
                </Text>
                <View style={[styles.dealFlowIconBox, { backgroundColor: '#eff6ff' }]}>
                  <Feather name="clock" size={m(15)} color={colors.blueButton} />
                </View>
              </View>
              <Text style={styles.dealFlowValue}>{stats.pendingApplications || 0}</Text>
            </TouchableOpacity>

            {/* 2. Accepted Offers */}
            <TouchableOpacity
              style={styles.dealFlowCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('BorrowerApplications')}
            >
              <View style={styles.dealFlowTop}>
                <Text style={[styles.dealFlowTag, { color: '#059669' }]}>
                  ACCEPTED
                </Text>
                <View style={[styles.dealFlowIconBox, { backgroundColor: '#ecfdf5' }]}>
                  <Feather name="check-circle" size={m(15)} color="#059669" />
                </View>
              </View>
              <Text style={styles.dealFlowValue}>{stats.acceptedApplications || 0}</Text>
            </TouchableOpacity>

            {/* 3. Active Facilities */}
            <TouchableOpacity
              style={styles.dealFlowCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('BorrowerLoansPortfolio')}
            >
              <View style={styles.dealFlowTop}>
                <Text style={[styles.dealFlowTag, { color: colors.lettersAndIcons }]}>
                  ACTIVE LOANS
                </Text>
                <View style={[styles.dealFlowIconBox, { backgroundColor: '#f1f5f9' }]}>
                  <Feather name="layers" size={m(15)} color={colors.lettersAndIcons} />
                </View>
              </View>
              <Text style={styles.dealFlowValue}>{portfolioMetrics.activeLoansCount || 0}</Text>
            </TouchableOpacity>

            {/* 4. Capital Network */}
            <TouchableOpacity
              style={styles.dealFlowCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('BorrowerExploreLenders')}
            >
              <View style={styles.dealFlowTop}>
                <Text style={[styles.dealFlowTag, { color: colors.blueButton }]}>
                  LENDER NETWORK
                </Text>
                <View style={[styles.dealFlowIconBox, { backgroundColor: '#eff6ff' }]}>
                  <Feather name="globe" size={m(15)} color={colors.blueButton} />
                </View>
              </View>
              <Text style={styles.dealFlowValue}>
                {stats.totalLendersAvailable || 12}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Quick Action Navigation Header */}
          <View style={[styles.sectionHeaderRow, { marginBottom: m(10) }]}>
            <View>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <Text style={styles.sectionSubtitle}>
                Request capital or explore partner terms
              </Text>
            </View>
          </View>

          {/* Quick Action Navigation Grid */}
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.actionButtonPrimary}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('BorrowerApply')}
            >
              <View style={styles.actionIconCircle}>
                <Feather name="send" size={m(16)} color={colors.white} />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={styles.actionTitlePrimary}>Apply for Capital</Text>
                <Text style={styles.actionSubPrimary}>Request facility</Text>
              </View>
              <Feather name="chevron-right" size={m(16)} color={colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButtonSecondary}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('BorrowerExploreLenders')}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: '#eff6ff' }]}>
                <Feather name="search" size={m(16)} color={colors.blueButton} />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={styles.actionTitleSecondary}>Explore Lenders</Text>
                <Text style={styles.actionSubSecondary}>Compare terms</Text>
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
  // TOP GREEN SECTION (Matching Exact Figma Design)
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
    color: colors.lettersAndIcons,
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
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  progressWhiteBar: {
    flex: 1,
    paddingHorizontal: m(12),
    justifyContent: 'center',
  },
  progressWhiteText: {
    fontSize: m(11.5),
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
    fontSize: m(11.5),
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

  // Feature Green Highlight Card
  featureCard: {
    backgroundColor: colors.primary,
    borderRadius: m(24),
    padding: m(18),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(24),
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

  // Accepted Offer Callout
  acceptedOfferBanner: {
    backgroundColor: '#fffbeb',
    borderRadius: m(16),
    padding: m(14),
    marginBottom: m(18),
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  acceptedOfferHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(8),
  },
  acceptedOfferBadge: {
    width: m(34),
    height: m(34),
    borderRadius: m(17),
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(10),
  },
  acceptedOfferTitle: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: '#92400e',
  },
  acceptedOfferSub: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: '#b45309',
    marginTop: m(1),
  },
  acceptedStatusTag: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(6),
  },
  acceptedStatusText: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: '#b45309',
  },
  acceptedOfferDesc: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryRegular,
    color: '#78350f',
    lineHeight: m(16),
  },

  // Progression Strip
  dealFlowScrollView: {
    marginBottom: m(24),
  },
  dealFlowScroll: {
    paddingBottom: m(8),
    paddingRight: m(6),
  },
  dealFlowCard: {
    width: m(145),
    backgroundColor: colors.white,
    borderRadius: m(18),
    paddingVertical: m(12),
    paddingHorizontal: m(14),
    marginRight: m(10),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    justifyContent: 'center',
  },
  dealFlowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(6),
  },
  dealFlowTag: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    letterSpacing: 0.4,
    flex: 1,
    paddingRight: m(4),
  },
  dealFlowIconBox: {
    width: m(28),
    height: m(28),
    borderRadius: m(14),
    justifyContent: 'center',
    alignItems: 'center',
  },
  dealFlowValue: {
    fontSize: m(22),
    lineHeight: m(28),
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
    marginBottom: m(18),
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
    padding: m(13),
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
    width: m(36),
    height: m(36),
    borderRadius: m(18),
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
    fontSize: m(14),
    lineHeight: m(18),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  activityTimeText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.blueButton,
    marginTop: m(1),
  },
  statusPill: {
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(6),
  },
  pillPending: {
    backgroundColor: '#fef3c7',
  },
  pillAccepted: {
    backgroundColor: '#ecfdf5',
  },
  pillRejected: {
    backgroundColor: '#fee2e2',
  },
  statusPillText: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
  },
  pillTextPending: {
    color: '#d97706',
  },
  pillTextAccepted: {
    color: '#059669',
  },
  pillTextRejected: {
    color: '#dc2626',
  },

  // Compact Metrics Box - Clean Neutral Slate-50 (#F8FAFC)
  metricsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: m(10),
    paddingVertical: m(8),
    paddingHorizontal: m(10),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
    marginBottom: m(1),
  },
  metricValueBold: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  metricValue: {
    fontSize: m(11),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.lettersAndIcons,
  },
  metricValueScore: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  metricDividerLine: {
    width: 1,
    height: m(20),
    backgroundColor: '#e2e8f0',
  },
  chevronWrap: {
    marginLeft: m(6),
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Loading & Empty States
  loadingBox: {
    paddingVertical: m(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(8),
  },
  emptyBox: {
    backgroundColor: colors.white,
    borderRadius: m(18),
    padding: m(24),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.06)',
  },
  emptyTitle: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginTop: m(10),
  },
  emptySubtitle: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: m(4),
    lineHeight: m(16),
  },
  emptyActionBtn: {
    marginTop: m(14),
    backgroundColor: colors.primary,
    paddingHorizontal: m(16),
    paddingVertical: m(8),
    borderRadius: m(12),
  },
  emptyActionText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  // Accepted Deal Banner
  acceptedBannerCard: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
    borderRadius: m(20),
    padding: m(16),
    marginBottom: m(18),
    elevation: 2,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  acceptedBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(8),
  },
  acceptedIconCircle: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptedBadgeText: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: '#059669',
    letterSpacing: 0.6,
  },
  acceptedTitleText: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.lettersAndIcons,
    marginTop: m(1),
  },
  acceptedSubText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: '#334155',
    lineHeight: m(16),
    marginBottom: m(12),
  },
  acceptedBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(10),
  },
  acceptedContactBox: {
    flex: 1,
    flexBasis: 0,
    height: m(44),
    backgroundColor: colors.white,
    paddingHorizontal: m(12),
    borderRadius: m(12),
    borderWidth: 1.2,
    borderColor: '#a7f3d0',
    justifyContent: 'center',
  },
  acceptedContactLabel: {
    fontSize: m(8.5),
    fontFamily: FontFamily.primaryBold,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  acceptedContactName: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginTop: m(1),
    textAlign: 'center',
  },
  viewAppBtn: {
    flex: 1,
    flexBasis: 0,
    height: m(44),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: m(10),
    borderRadius: m(12),
  },
  viewAppBtnText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
});
