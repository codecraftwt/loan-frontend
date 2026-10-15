import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Animated,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { useSelector } from 'react-redux';
import { colors, FontFamily } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper } from '../../../Components/common';
import lenderFlowService from '../../../Services/lenderFlowService';

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

/**
 * Relative time formatter
 */
const formatRelativeTime = (dateStr) => {
  if (!dateStr) return 'Recently';
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All'); // 'All' | 'In Review' | 'Disbursed'

  // Quick OTP Modal state
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchAllDashboardData = useCallback(async () => {
    if (!user?._id || user?.roleId !== 1) return;
    try {
      setLoading(true);
      const [statsRes, loansRes, planRes] = await Promise.allSettled([
        lenderFlowService.getDashboardStats(),
        lenderFlowService.getLoansPortfolio({ limit: 5 }),
        lenderFlowService.getActivePlan(),
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
    } catch (err) {
      if (err?.response?.status !== 401) {
        console.error('Error fetching lender dashboard data:', err);
      }
    } finally {
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllDashboardData();
  };

  const handleVerifyOtpSubmit = async () => {
    if (!selectedEntityId.trim()) {
      Alert.alert('Required', 'Please enter or select a valid Request/Loan ID to verify.');
      return;
    }
    if (!otpInput.trim() || otpInput.trim().length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit disbursal OTP provided by the borrower.');
      return;
    }

    try {
      setVerifyingOtp(true);
      const res = await lenderFlowService.verifyDisbursalOtp(
        selectedEntityId.trim(),
        otpInput.trim(),
        false
      );
      if (res?.success) {
        Alert.alert(
          'Success',
          'Borrower disbursal OTP verified successfully! Capital allocation is confirmed.'
        );
        setOtpModalVisible(false);
        setOtpInput('');
        setSelectedEntityId('');
        fetchAllDashboardData();
      } else {
        Alert.alert('Verification Failed', res?.message || 'Unable to verify OTP.');
      }
    } catch (error) {
      const errMsg =
        error.response?.data?.message || 'OTP verification failed. Please try again.';
      Alert.alert('Error', errMsg);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const displayName =
    user?.companyName || user?.userName || user?.name || 'Institutional Lender';

  // Filter deal inquiries based on active tab
  const filteredInquiries = useMemo(() => {
    const list = stats.recentPendingRequests || [];
    if (selectedFilter === 'In Review') {
      return list.filter(r => r.status === 'pending' || !r.status);
    }
    if (selectedFilter === 'Disbursed') {
      return list.filter(r => r.status === 'disbursed' || r.status === 'accepted');
    }
    return list;
  }, [stats.recentPendingRequests, selectedFilter]);

  const activeLoansCount = portfolioMetrics.activeCount || stats.acceptedRequests || 0;
  const pendingCount = stats.pendingRequests || 0;

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
              onPress={() => navigation.navigate('LenderProfileScreen')}
            >
              <Feather name="bell" size={m(20)} color={colors.lettersAndIcons} />
              {pendingCount > 0 && <View style={styles.notificationDot} />}
            </TouchableOpacity>
          </View>

          {/* 2-Column Summary Stats on Green */}
          <View style={styles.topMetricsCard}>
            {/* Left Column: Disbursed Capital */}
            <TouchableOpacity
              style={styles.metricColumn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('LenderLoansPortfolio')}
            >
              <View style={styles.metricLabelRow}>
                <Feather name="arrow-up-right" size={m(13)} color={colors.lettersAndIcons} />
                <Text style={styles.metricLabelText}>Total Disbursed</Text>
              </View>
              <Text style={styles.metricValueWhite} numberOfLines={1}>
                {formatCurrency(portfolioMetrics.totalDisbursed || 0)}
              </Text>
            </TouchableOpacity>

            {/* Vertical Divider Line */}
            <View style={styles.metricDivider} />

            {/* Right Column: Projected Yield / Returns */}
            <TouchableOpacity
              style={styles.metricColumn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('LenderLoansPortfolio')}
            >
              <View style={styles.metricLabelRow}>
                <Feather name="percent" size={m(13)} color={colors.lettersAndIcons} />
                <Text style={styles.metricLabelText}>Projected Yield</Text>
              </View>
              <Text style={styles.metricValueBlue} numberOfLines={1}>
                +{formatCurrency(portfolioMetrics.totalInterestExpected || 0)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Target Progress Pill */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarPill}>
              <View style={styles.progressDarkTag}>
                <Text style={styles.progressDarkText}>
                  {activeLoansCount > 0 ? `${activeLoansCount} Deals` : 'ACTIVE'}
                </Text>
              </View>
              <View style={styles.progressWhiteBar}>
                <Text style={styles.progressWhiteText} numberOfLines={1}>
                  {activePlan?.name || 'Institutional Allocation'} • {formatCurrency(portfolioMetrics.totalOutstanding || 0)} Out
                </Text>
              </View>
            </View>

            {/* Target Caption */}
            <View style={styles.progressCaptionRow}>
              <Feather name="check-circle" size={m(14)} color={colors.lettersAndIcons} />
              <Text style={styles.progressCaptionText}>
                Capital allocation & underwriting active. Looks Good.
              </Text>
            </View>
          </View>
        </View>

        {/* ======================================================== */}
        {/* 2. MAIN CURVED SHEET SECTION (#F1FFF3)                   */}
        {/* ======================================================== */}
        <View style={styles.sheetSection}>
          {/* Feature Green Highlight Card (Matching Figma Vehicle / Goal Card) */}
          <View style={styles.featureCard}>
            {/* Left Donut / Goal Ring Circle */}
            <TouchableOpacity
              style={styles.featureLeftCol}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('LenderLoansPortfolio')}
            >
              <View style={styles.featureRingWrapper}>
                <Feather name="briefcase" size={m(22)} color={colors.lettersAndIcons} />
              </View>
              <Text style={styles.featureRingLabel}>Active Book</Text>
              <Text style={styles.featureRingSub}>{activeLoansCount} Facilities</Text>
            </TouchableOpacity>

            {/* Vertical White Divider */}
            <View style={styles.featureDivider} />

            {/* Right Metrics Stack */}
            <View style={styles.featureRightCol}>
              {/* Row 1: Incoming Pipeline */}
              <TouchableOpacity
                style={styles.featureStatItem}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('LenderIncomingRequests')}
              >
                <View style={styles.featureStatIconBox}>
                  <Feather name="inbox" size={m(16)} color={colors.lettersAndIcons} />
                </View>
                <View style={styles.featureStatTexts}>
                  <Text style={styles.featureStatLabel}>Incoming Inquiries</Text>
                  <Text style={styles.featureStatValue}>
                    {pendingCount} Awaiting Review
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Horizontal White Divider */}
              <View style={styles.featureHorizontalDivider} />

              {/* Row 2: Settled / Repaid */}
              <TouchableOpacity
                style={styles.featureStatItem}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('LenderLoansPortfolio')}
              >
                <View style={styles.featureStatIconBox}>
                  <Feather name="check-circle" size={m(16)} color={colors.lettersAndIcons} />
                </View>
                <View style={styles.featureStatTexts}>
                  <Text style={styles.featureStatLabel}>Settled Deals</Text>
                  <Text style={styles.featureStatValue}>
                    {portfolioMetrics.closedCount || 0} Fully Paid
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* ======================================================== */}
          {/* COMMERCIAL DEAL FLOW & INQUIRIES (Matching Webapp Strip) */}
          {/* ======================================================== */}
          <View style={[styles.sectionHeaderRow, { marginBottom: m(10) }]}>
            <View>
              <Text style={styles.sectionTitle}>Commercial Deal Flow</Text>
              <Text style={styles.sectionSubtitle}>
                Inflow progression & inquiries
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('LenderIncomingRequests')}
              activeOpacity={0.7}
              style={styles.allRequestsBtn}
            >
              <Text style={styles.allRequestsText}>All Requests</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dealFlowScroll}
          >
            {/* 1. Pending Action */}
            <TouchableOpacity
              style={styles.dealFlowCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('LenderIncomingRequests')}
            >
              <View style={styles.dealFlowTop}>
                <Text style={[styles.dealFlowTag, { color: colors.blueButton }]}>
                  PENDING ACTION
                </Text>
                <View style={[styles.dealFlowIconBox, { backgroundColor: '#eff6ff' }]}>
                  <Feather name="clock" size={m(15)} color={colors.blueButton} />
                </View>
              </View>
              <Text style={styles.dealFlowValue}>{stats.pendingRequests || 0}</Text>
            </TouchableOpacity>

            {/* 2. Accepted Deals */}
            <TouchableOpacity
              style={styles.dealFlowCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('LenderLoansPortfolio')}
            >
              <View style={styles.dealFlowTop}>
                <Text style={[styles.dealFlowTag, { color: colors.blueButton }]}>
                  ACCEPTED DEALS
                </Text>
                <View style={[styles.dealFlowIconBox, { backgroundColor: '#eff6ff' }]}>
                  <Feather name="check-circle" size={m(15)} color={colors.blueButton} />
                </View>
              </View>
              <Text style={styles.dealFlowValue}>{stats.acceptedRequests || 0}</Text>
            </TouchableOpacity>

            {/* 3. Total Inquiries */}
            <TouchableOpacity
              style={styles.dealFlowCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('LenderIncomingRequests')}
            >
              <View style={styles.dealFlowTop}>
                <Text style={[styles.dealFlowTag, { color: colors.blueButton }]}>
                  TOTAL INQUIRIES
                </Text>
                <View style={[styles.dealFlowIconBox, { backgroundColor: '#eff6ff' }]}>
                  <Feather name="inbox" size={m(15)} color={colors.blueButton} />
                </View>
              </View>
              <Text style={styles.dealFlowValue}>
                {stats.totalRequests ||
                  (stats.pendingRequests || 0) + (stats.acceptedRequests || 0) ||
                  0}
              </Text>
            </TouchableOpacity>

            {/* 4. Connected Borrowers */}
            <TouchableOpacity
              style={styles.dealFlowCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('LenderAvailableBorrowers')}
            >
              <View style={styles.dealFlowTop}>
                <Text style={[styles.dealFlowTag, { color: colors.blueButton }]}>
                  CONNECTED BORROWERS
                </Text>
                <View style={[styles.dealFlowIconBox, { backgroundColor: '#eff6ff' }]}>
                  <Feather name="users" size={m(15)} color={colors.blueButton} />
                </View>
              </View>
              <Text style={styles.dealFlowValue}>
                {stats.availableBorrowersCount || 1}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Period Filter Capsule Tabs (Daily / Weekly / Monthly style in Figma) */}
          <View style={styles.periodCapsuleRow}>
            {['All', 'In Review', 'Disbursed'].map(tab => {
              const isSelected = selectedFilter === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.periodTab,
                    isSelected && styles.periodTabActive,
                  ]}
                  onPress={() => setSelectedFilter(tab)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.periodTabText,
                      isSelected && styles.periodTabTextActive,
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Deal Desk Inquiries Section Header */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Deal Desk Pipeline</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('LenderIncomingRequests')}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Inquiries / Deals List (Matching Blue Icon Circles in Figma Design) */}
          {loading && !refreshing ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={colors.lettersAndIcons} />
              <Text style={styles.loadingText}>Syncing deal desk...</Text>
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
                  style={styles.activityItemCard}
                  activeOpacity={0.75}
                  onPress={() =>
                    navigation.navigate('LenderRequestDetails', {
                      requestId: req._id,
                      request: req,
                    })
                  }
                >
                  {/* Vibrant Blue Circle Icon */}
                  <View style={styles.activityIconCircle}>
                    <Feather name="briefcase" size={m(18)} color={colors.white} />
                  </View>

                  {/* Borrower Name & Purpose/Tenure */}
                  <View style={styles.activityMainCol}>
                    <Text style={styles.activityTitleText} numberOfLines={1}>
                      {borrowerName}
                    </Text>
                    <Text style={styles.activityTimeText} numberOfLines={1}>
                      {req.purpose || 'Working Capital'} • {req.tenureMonths || 12} Mo
                    </Text>
                  </View>

                  {/* Credit Score Tag */}
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>Score {creditScore}</Text>
                  </View>

                  {/* Requested Amount */}
                  <View style={styles.activityStatusCol}>
                    <Text style={styles.activityStatusText}>
                      {formatCurrency(req.amount)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

        </View>
      </Animated.View>

      {/* ======================================================== */}
      {/* 3. DISBURSAL OTP MODAL                                   */}
      {/* ======================================================== */}
      <Modal
        visible={otpModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setOtpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}>
                <Feather name="key" size={m(18)} color={colors.blueButton} />
              </View>
              <Text style={styles.modalTitle}>Verify Disbursal OTP</Text>
              <TouchableOpacity
                onPress={() => setOtpModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={m(20)} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Enter the borrower's 6-digit Disbursal Code to release sanctioned funds.
            </Text>

            <Text style={styles.inputLabel}>Select Deal or Enter ID</Text>
            {stats.recentPendingRequests && stats.recentPendingRequests.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipScrollView}
              >
                {stats.recentPendingRequests.map((req) => {
                  const bName =
                    req.borrowerSnapshot?.businessName ||
                    req.borrowerId?.userName ||
                    'Borrower';
                  const isSelected = selectedEntityId === req._id;
                  return (
                    <TouchableOpacity
                      key={req._id}
                      style={[
                        styles.dealChip,
                        isSelected && styles.dealChipSelected,
                      ]}
                      onPress={() => setSelectedEntityId(req._id)}
                    >
                      <Text
                        style={[
                          styles.dealChipText,
                          isSelected && styles.dealChipTextSelected,
                        ]}
                      >
                        {bName} • {formatCurrency(req.amount)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : null}

            <TextInput
              style={styles.inputField}
              placeholder="Deal / Loan ID (or tap chip above)"
              placeholderTextColor="#94a3b8"
              value={selectedEntityId}
              onChangeText={setSelectedEntityId}
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>6-Digit OTP</Text>
            <TextInput
              style={[styles.inputField, styles.otpInputField]}
              placeholder="• • • • • •"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
              maxLength={6}
              value={otpInput}
              onChangeText={setOtpInput}
            />

            <View style={styles.otpHelperRow}>
              <Text style={styles.otpTimerText}>⏱ Valid for 15 mins</Text>
              <TouchableOpacity
                onPress={async () => {
                  if (!selectedEntityId.trim()) {
                    Alert.alert('Required', 'Please select or enter a Deal ID to resend OTP.');
                    return;
                  }
                  try {
                    await lenderFlowService.resendDisbursalOtp(selectedEntityId.trim(), false);
                    Alert.alert('Dispatched', 'Fresh 6-digit OTP sent to borrower.');
                  } catch (e) {
                    Alert.alert('Error', 'Unable to resend OTP.');
                  }
                }}
              >
                <Text style={styles.resendCodeText}>Resend Code</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setOtpModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalVerifyBtn}
                onPress={handleVerifyOtpSubmit}
                disabled={verifyingOtp}
              >
                {verifyingOtp ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.modalVerifyText}>Confirm & Disburse</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  // ==========================================
  // TOP GREEN SECTION (Matching Exact Figma)
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

  // Feature Green Card (Vehicle / Goals Card in Figma)
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
    gap: m(4),
  },
  allRequestsText: {
    fontSize: m(11),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.white,
  },

  // Commercial Deal Flow Strip
  dealFlowScroll: {
    paddingBottom: m(18),
    paddingRight: m(6),
  },
  dealFlowCard: {
    width: m(150),
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

  // Activity Feed Items (Matching Blue Circle Rows in Figma)
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
    backgroundColor: colors.blueButton, // #3299FF matching Figma screenshot
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
    color: colors.blueButton, // Blue subtitle matching Figma screenshot
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
    fontSize: m(13.5),
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


  // Disbursal OTP Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 48, 48, 0.65)',
    justifyContent: 'center',
    padding: m(20),
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: m(24),
    padding: m(20),
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(8),
  },
  modalIconWrap: {
    width: m(32),
    height: m(32),
    borderRadius: m(16),
    backgroundColor: '#E6F2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    flex: 1,
    marginLeft: m(10),
  },
  modalSubtitle: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginBottom: m(14),
    lineHeight: m(17),
  },
  inputLabel: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.lettersAndIcons,
    marginBottom: m(6),
  },
  chipScrollView: {
    marginBottom: m(10),
  },
  dealChip: {
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    borderRadius: m(8),
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: m(6),
  },
  dealChipSelected: {
    backgroundColor: colors.lightGreen,
    borderColor: colors.lettersAndIcons,
  },
  dealChipText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
  },
  dealChipTextSelected: {
    color: colors.lettersAndIcons,
    fontFamily: FontFamily.primaryBold,
  },
  inputField: {
    backgroundColor: colors.backgroundGreenWhite,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: m(12),
    paddingHorizontal: m(12),
    paddingVertical: m(10),
    fontSize: m(13),
    color: colors.lettersAndIcons,
    fontFamily: FontFamily.primaryMedium,
    marginBottom: m(12),
  },
  otpInputField: {
    fontSize: m(18),
    fontFamily: FontFamily.primaryBold,
    letterSpacing: 4,
    textAlign: 'center',
  },
  otpHelperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(14),
  },
  otpTimerText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textMuted,
  },
  resendCodeText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: m(12),
    borderRadius: m(12),
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    marginRight: m(8),
  },
  modalCancelText: {
    fontSize: m(13),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.textSecondary,
  },
  modalVerifyBtn: {
    flex: 2,
    paddingVertical: m(12),
    borderRadius: m(12),
    alignItems: 'center',
    backgroundColor: colors.lettersAndIcons,
  },
  modalVerifyText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
});
