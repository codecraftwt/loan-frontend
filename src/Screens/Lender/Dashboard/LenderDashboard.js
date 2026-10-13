import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { useSelector } from 'react-redux';
import { m } from 'walstar-rn-responsive';
import { FontFamily, colors } from '../../../constants';
import lenderFlowService from '../../../Services/lenderFlowService';

export default function LenderDashboard() {
  const navigation = useNavigation();
  const user = useSelector(state => state.auth.user);

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

  // Quick OTP Modal state
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchAllDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, loansRes, planRes] = await Promise.allSettled([
        lenderFlowService.getDashboardStats(),
        lenderFlowService.getLoansPortfolio({ limit: 1 }),
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
      console.error('Error fetching dashboard data:', err);
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
        duration: 450,
        useNativeDriver: true,
      }).start();
    }, [fetchAllDashboardData, fadeAnim])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllDashboardData();
  };

  const formatINR = (val) => {
    if (!val && val !== 0) return '₹0';
    const num = Number(val) || 0;
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lakh`;
    return `₹${num.toLocaleString('en-IN')}`;
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
      const res = await lenderFlowService.verifyDisbursalOtp(selectedEntityId.trim(), otpInput.trim(), false);
      if (res?.success) {
        Alert.alert('Success', 'Borrower disbursal OTP verified successfully! Capital allocation is confirmed.');
        setOtpModalVisible(false);
        setOtpInput('');
        setSelectedEntityId('');
        fetchAllDashboardData();
      } else {
        Alert.alert('Verification Failed', res?.message || 'Unable to verify OTP.');
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || 'OTP verification failed. Please try again.';
      Alert.alert('Error', errMsg);
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Pipeline calculations
  const totalPipelineCount =
    (stats.pendingRequests || 0) +
    (stats.acceptedRequests || 0) +
    (portfolioMetrics.activeCount || 0) +
    (portfolioMetrics.closedCount || 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f172a']} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerGreeting}>Institutional Terminal</Text>
              <Text style={styles.headerName} numberOfLines={1}>
                {user?.userName || user?.companyName || 'Institutional Lender'}
              </Text>

              {/* Subscription Tier Status Pill */}
              <TouchableOpacity
                style={styles.tierPill}
                onPress={() => navigation.navigate('LenderSubscriptionScreen')}
                activeOpacity={0.8}
              >
                <View style={styles.tierPillDot} />
                <Text style={styles.tierPillText}>
                  {activePlan?.name || 'Institutional Pro Suite'}
                </Text>
                <Text style={styles.tierPillDivider}>•</Text>
                <Text style={styles.tierPillQuota}>Active Allocation</Text>
                <Feather name="chevron-right" size={m(12)} color="#15803d" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.profileBtn}
              onPress={() => navigation.navigate('LenderProfileScreen')}
              activeOpacity={0.8}
            >
              <Feather name="user" size={m(20)} color="#0f172a" />
            </TouchableOpacity>
          </View>

          {/* 4 Macro KPI Metric Cards */}
          <View style={styles.kpiGrid}>
            {/* KPI 1: Incoming Requests (Amber) */}
            <TouchableOpacity
              style={[styles.kpiCard, { borderTopColor: '#f59e0b', borderTopWidth: 3 }]}
              onPress={() => navigation.navigate('LenderIncomingRequests')}
              activeOpacity={0.7}
            >
              <View style={styles.kpiTopRow}>
                <Text style={[styles.kpiTag, { color: '#d97706' }]}>INCOMING REQUESTS</Text>
                <View style={[styles.kpiIconWrap, { backgroundColor: '#fef3c7' }]}>
                  <Feather name="clock" size={m(16)} color="#d97706" />
                </View>
              </View>
              <Text style={styles.kpiValue}>{stats.pendingRequests || 0}</Text>
              <Text style={styles.kpiSub}>Awaiting credit review</Text>
            </TouchableOpacity>

            {/* KPI 2: Active Facilities (Emerald) */}
            <TouchableOpacity
              style={[styles.kpiCard, { borderTopColor: '#10b981', borderTopWidth: 3 }]}
              onPress={() => navigation.navigate('LenderLoansPortfolio')}
              activeOpacity={0.7}
            >
              <View style={styles.kpiTopRow}>
                <Text style={[styles.kpiTag, { color: '#059669' }]}>ACTIVE FACILITIES</Text>
                <View style={[styles.kpiIconWrap, { backgroundColor: '#ecfdf5' }]}>
                  <Feather name="check-circle" size={m(16)} color="#059669" />
                </View>
              </View>
              <Text style={styles.kpiValue}>
                {portfolioMetrics.activeCount || stats.acceptedRequests || 0}
              </Text>
              <Text style={styles.kpiSub}>Live sanctioned deals</Text>
            </TouchableOpacity>

            {/* KPI 3: Total Disbursed Capital (Blue) */}
            <TouchableOpacity
              style={[styles.kpiCard, { borderTopColor: '#3b82f6', borderTopWidth: 3 }]}
              onPress={() => navigation.navigate('LenderLoansPortfolio')}
              activeOpacity={0.7}
            >
              <View style={styles.kpiTopRow}>
                <Text style={[styles.kpiTag, { color: '#2563eb' }]}>DISBURSED CAPITAL</Text>
                <View style={[styles.kpiIconWrap, { backgroundColor: '#eff6ff' }]}>
                  <Feather name="trending-up" size={m(16)} color="#2563eb" />
                </View>
              </View>
              <Text style={styles.kpiValue}>
                {formatINR(portfolioMetrics.totalDisbursed || 0)}
              </Text>
              <Text style={styles.kpiSub}>Aggregate deployed</Text>
            </TouchableOpacity>

            {/* KPI 4: Projected Returns / ARR (Purple) */}
            <TouchableOpacity
              style={[styles.kpiCard, { borderTopColor: '#8b5cf6', borderTopWidth: 3 }]}
              onPress={() => navigation.navigate('LenderLoansPortfolio')}
              activeOpacity={0.7}
            >
              <View style={styles.kpiTopRow}>
                <Text style={[styles.kpiTag, { color: '#7c3aed' }]}>PROJECTED YIELD</Text>
                <View style={[styles.kpiIconWrap, { backgroundColor: '#f5f3ff' }]}>
                  <Feather name="percent" size={m(16)} color="#7c3aed" />
                </View>
              </View>
              <Text style={styles.kpiValue}>
                {formatINR(portfolioMetrics.totalInterestExpected || 0)}
              </Text>
              <Text style={styles.kpiSub}>Portfolio gross earnings</Text>
            </TouchableOpacity>
          </View>

          {/* Active Deal Pipeline Kanban / Bar */}
          <View style={styles.pipelineCard}>
            <View style={styles.pipelineHeader}>
              <View>
                <Text style={styles.pipelineTitle}>Deal Pipeline Overview</Text>
                <Text style={styles.pipelineSubtitle}>Live facility progression across lifecycle</Text>
              </View>
              <View style={styles.pipelineBadge}>
                <Text style={styles.pipelineBadgeText}>{totalPipelineCount} Total Inflow</Text>
              </View>
            </View>

            {/* Visual Multi-Segment Bar */}
            <View style={styles.pipelineTrack}>
              <View
                style={[
                  styles.trackSegment,
                  {
                    flex: Math.max(stats.pendingRequests || 1, 1),
                    backgroundColor: '#f59e0b',
                  },
                ]}
              />
              <View
                style={[
                  styles.trackSegment,
                  {
                    flex: Math.max(stats.acceptedRequests || 1, 1),
                    backgroundColor: '#3b82f6',
                  },
                ]}
              />
              <View
                style={[
                  styles.trackSegment,
                  {
                    flex: Math.max(portfolioMetrics.activeCount || 1, 1),
                    backgroundColor: '#10b981',
                  },
                ]}
              />
              <View
                style={[
                  styles.trackSegment,
                  {
                    flex: Math.max(portfolioMetrics.closedCount || 0.5, 0.5),
                    backgroundColor: '#64748b',
                  },
                ]}
              />
            </View>

            {/* Stage Indicators */}
            <View style={styles.stagesRow}>
              <View style={styles.stageItem}>
                <View style={[styles.stageDot, { backgroundColor: '#f59e0b' }]} />
                <Text style={styles.stageName}>In Review</Text>
                <Text style={styles.stageCount}>{stats.pendingRequests || 0}</Text>
              </View>

              <View style={styles.stageItem}>
                <View style={[styles.stageDot, { backgroundColor: '#3b82f6' }]} />
                <Text style={styles.stageName}>Term Sheet</Text>
                <Text style={styles.stageCount}>{stats.acceptedRequests || 0}</Text>
              </View>

              <View style={styles.stageItem}>
                <View style={[styles.stageDot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.stageName}>Disbursed</Text>
                <Text style={styles.stageCount}>{portfolioMetrics.activeCount || 0}</Text>
              </View>

              <View style={styles.stageItem}>
                <View style={[styles.stageDot, { backgroundColor: '#64748b' }]} />
                <Text style={styles.stageName}>Settled</Text>
                <Text style={styles.stageCount}>{portfolioMetrics.closedCount || 0}</Text>
              </View>
            </View>
          </View>

          {/* Quick Action Grid */}
          <Text style={styles.sectionHeader}>Institutional Operations</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('LenderIncomingRequests')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: '#eff6ff' }]}>
                <Feather name="inbox" size={m(20)} color="#2563eb" />
              </View>
              <Text style={styles.actionCardTitle}>Review Requests</Text>
              <Text style={styles.actionCardDesc}>Assess incoming applications & risk</Text>
              <View style={styles.actionCardArrow}>
                <Feather name="arrow-right" size={m(14)} color="#2563eb" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => setOtpModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: '#fef3c7' }]}>
                <Feather name="shield" size={m(20)} color="#d97706" />
              </View>
              <Text style={styles.actionCardTitle}>Verify OTP</Text>
              <Text style={styles.actionCardDesc}>2-Way borrower release code</Text>
              <View style={styles.actionCardArrow}>
                <Feather name="arrow-right" size={m(14)} color="#d97706" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('LenderLoansPortfolio')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: '#ecfdf5' }]}>
                <Feather name="credit-card" size={m(20)} color="#059669" />
              </View>
              <Text style={styles.actionCardTitle}>Loans Portfolio</Text>
              <Text style={styles.actionCardDesc}>Record repayments & recalculate</Text>
              <View style={styles.actionCardArrow}>
                <Feather name="arrow-right" size={m(14)} color="#059669" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('LenderAvailableBorrowers')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: '#f5f3ff' }]}>
                <Feather name="users" size={m(20)} color="#7c3aed" />
              </View>
              <Text style={styles.actionCardTitle}>Borrower Hub</Text>
              <Text style={styles.actionCardDesc}>Network of sanctioned entities</Text>
              <View style={styles.actionCardArrow}>
                <Feather name="arrow-right" size={m(14)} color="#7c3aed" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Recent Pending Inquiries */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>Recent Pending Inquiries</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('LenderIncomingRequests')}
              style={styles.viewAllBtn}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Feather name="chevron-right" size={m(14)} color="#2563eb" />
            </TouchableOpacity>
          </View>

          {loading && !refreshing ? (
            <ActivityIndicator size="small" color="#0f172a" style={{ marginVertical: m(20) }} />
          ) : stats.recentPendingRequests && stats.recentPendingRequests.length > 0 ? (
            stats.recentPendingRequests.map((req) => (
              <View key={req._id} style={styles.recentCard}>
                <View style={styles.recentTop}>
                  <View style={styles.borrowerAvatar}>
                    <Text style={styles.borrowerAvatarText}>
                      {(
                        req.borrowerSnapshot?.businessName ||
                        req.borrowerId?.userName ||
                        'B'
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recentBorrowerName} numberOfLines={1}>
                      {req.borrowerSnapshot?.businessName ||
                        req.borrowerId?.companyName ||
                        req.borrowerId?.userName ||
                        'Corporate Borrower'}
                    </Text>
                    <Text style={styles.recentBorrowerSub}>
                      {req.purpose || 'Working Capital'} • {req.tenureMonths || 12} Mo
                    </Text>
                  </View>
                  <View style={styles.scorePill}>
                    <Text style={styles.scorePillText}>
                      Score: {req.borrowerSnapshot?.creditScore || 750}
                    </Text>
                  </View>
                </View>

                <View style={styles.recentBottom}>
                  <View>
                    <Text style={styles.reqAmountLabel}>Requested Facility</Text>
                    <Text style={styles.reqAmountVal}>{formatINR(req.amount)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.reviewBtn}
                    onPress={() =>
                      navigation.navigate('LenderRequestDetails', {
                        requestId: req._id,
                        request: req,
                      })
                    }
                  >
                    <Text style={styles.reviewBtnText}>Review & Terms</Text>
                    <Feather name="arrow-right" size={m(13)} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyPendingCard}>
              <Feather name="check-circle" size={m(32)} color="#10b981" />
              <Text style={styles.emptyPendingTitle}>Deal Desk Clear</Text>
              <Text style={styles.emptyPendingSub}>
                All incoming borrower requests have been reviewed.
              </Text>
            </View>
          )}

          {/* Atomic Underwriting Protocol Banner */}
          <View style={styles.protocolBanner}>
            <View style={styles.protocolIconWrap}>
              <Feather name="shield" size={m(18)} color="#2563eb" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.protocolTitle}>Atomic Underwriting Engine</Text>
              <Text style={styles.protocolDesc}>
                Accepting a borrower's financing inquiry generates a legally binding term sheet and atomically cancels competing requests for that borrower across other lenders.
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Disbursal OTP Modal */}
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
                <Feather name="key" size={m(20)} color="#2563eb" />
              </View>
              <Text style={styles.modalTitle}>Verify Disbursal OTP</Text>
              <TouchableOpacity onPress={() => setOtpModalVisible(false)}>
                <Feather name="x" size={m(20)} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Enter the borrower's 6-digit Disbursal Code to release sanctioned funds.
            </Text>

            <Text style={styles.inputLabel}>Select Deal or Enter ID</Text>
            {stats.recentPendingRequests && stats.recentPendingRequests.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: m(10) }}>
                {stats.recentPendingRequests.map((req) => {
                  const bName =
                    req.borrowerSnapshot?.businessName ||
                    req.borrowerId?.userName ||
                    'Borrower';
                  const isSelected = selectedEntityId === req._id;
                  return (
                    <TouchableOpacity
                      key={req._id}
                      style={{
                        paddingHorizontal: m(10),
                        paddingVertical: m(6),
                        borderRadius: m(8),
                        backgroundColor: isSelected ? '#eff6ff' : '#f8fafc',
                        borderWidth: 1,
                        borderColor: isSelected ? '#2563eb' : '#e2e8f0',
                        marginRight: m(6),
                      }}
                      onPress={() => setSelectedEntityId(req._id)}
                    >
                      <Text
                        style={{
                          fontSize: m(11),
                          fontWeight: '700',
                          color: isSelected ? '#2563eb' : '#475569',
                        }}
                      >
                        {bName} • {formatINR(req.amount)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : null}

            <TextInput
              style={styles.inputField}
              placeholder="e.g. 660f... or tap a deal above"
              placeholderTextColor="#94a3b8"
              value={selectedEntityId}
              onChangeText={setSelectedEntityId}
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>6-Digit OTP</Text>
            <TextInput
              style={[styles.inputField, styles.otpInputField]}
              placeholder="0 0 0 0 0 0"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
              maxLength={6}
              value={otpInput}
              onChangeText={setOtpInput}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: m(12) }}>
              <Text style={{ fontSize: m(11), color: '#64748b' }}>
                ⏱ Valid for 15 mins
              </Text>
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
                <Text style={{ fontSize: m(11), fontWeight: '700', color: '#2563eb' }}>
                  Resend Code
                </Text>
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
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalVerifyText}>Verify & Disburse</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: m(16),
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || m(24)) + m(8) : m(16),
    paddingBottom: m(100),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: m(18),
  },
  headerGreeting: {
    fontSize: m(12),
    color: '#64748b',
    fontFamily: FontFamily.primaryMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerName: {
    fontSize: m(20),
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FontFamily.primaryBold,
    marginTop: m(2),
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: m(10),
    paddingVertical: m(4),
    borderRadius: m(16),
    alignSelf: 'flex-start',
    marginTop: m(8),
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  tierPillDot: {
    width: m(6),
    height: m(6),
    borderRadius: m(3),
    backgroundColor: '#16a34a',
    marginRight: m(6),
  },
  tierPillText: {
    fontSize: m(11),
    fontWeight: '700',
    color: '#15803d',
  },
  tierPillDivider: {
    marginHorizontal: m(5),
    color: '#86efac',
    fontSize: m(10),
  },
  tierPillQuota: {
    fontSize: m(11),
    fontWeight: '500',
    color: '#166534',
    marginRight: m(4),
  },
  profileBtn: {
    width: m(44),
    height: m(44),
    borderRadius: m(22),
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: m(18),
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: m(14),
    padding: m(14),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  kpiTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(8),
  },
  kpiTag: {
    fontSize: m(9),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  kpiIconWrap: {
    width: m(28),
    height: m(28),
    borderRadius: m(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    fontSize: m(20),
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FontFamily.primaryBold,
  },
  kpiSub: {
    fontSize: m(11),
    color: '#64748b',
    marginTop: m(2),
  },
  pipelineCard: {
    backgroundColor: '#ffffff',
    borderRadius: m(16),
    padding: m(16),
    marginBottom: m(20),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
  },
  pipelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: m(14),
  },
  pipelineTitle: {
    fontSize: m(15),
    fontWeight: '700',
    color: '#0f172a',
  },
  pipelineSubtitle: {
    fontSize: m(11),
    color: '#64748b',
    marginTop: m(2),
  },
  pipelineBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(10),
  },
  pipelineBadgeText: {
    fontSize: m(10),
    fontWeight: '700',
    color: '#2563eb',
  },
  pipelineTrack: {
    flexDirection: 'row',
    height: m(8),
    borderRadius: m(4),
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    marginBottom: m(14),
  },
  trackSegment: {
    height: '100%',
  },
  stagesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stageItem: {
    alignItems: 'center',
    flex: 1,
  },
  stageDot: {
    width: m(8),
    height: m(8),
    borderRadius: m(4),
    marginBottom: m(4),
  },
  stageName: {
    fontSize: m(10),
    color: '#64748b',
    fontWeight: '500',
  },
  stageCount: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#0f172a',
    marginTop: m(2),
  },
  sectionHeader: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: m(12),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: m(6),
    marginBottom: m(12),
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: m(12),
    fontWeight: '600',
    color: '#2563eb',
    marginRight: m(2),
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: m(20),
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: m(14),
    padding: m(14),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
  },
  actionIconWrap: {
    width: m(38),
    height: m(38),
    borderRadius: m(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: m(10),
  },
  actionCardTitle: {
    fontSize: m(13),
    fontWeight: '700',
    color: '#0f172a',
  },
  actionCardDesc: {
    fontSize: m(10),
    color: '#64748b',
    marginTop: m(2),
    lineHeight: m(14),
  },
  actionCardArrow: {
    marginTop: m(10),
    alignSelf: 'flex-start',
  },
  recentCard: {
    backgroundColor: '#ffffff',
    borderRadius: m(14),
    padding: m(14),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
  },
  recentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(12),
  },
  borrowerAvatar: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(10),
  },
  borrowerAvatarText: {
    fontSize: m(15),
    fontWeight: '700',
    color: '#2563eb',
  },
  recentBorrowerName: {
    fontSize: m(14),
    fontWeight: '700',
    color: '#0f172a',
  },
  recentBorrowerSub: {
    fontSize: m(11),
    color: '#64748b',
    marginTop: m(2),
  },
  scorePill: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(8),
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  scorePillText: {
    fontSize: m(10),
    fontWeight: '700',
    color: '#16a34a',
  },
  recentBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
    paddingTop: m(10),
  },
  reqAmountLabel: {
    fontSize: m(10),
    color: '#64748b',
  },
  reqAmountVal: {
    fontSize: m(15),
    fontWeight: '800',
    color: '#0f172a',
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: m(12),
    paddingVertical: m(7),
    borderRadius: m(8),
  },
  reviewBtnText: {
    fontSize: m(11),
    fontWeight: '700',
    color: '#ffffff',
    marginRight: m(4),
  },
  emptyPendingCard: {
    backgroundColor: '#ffffff',
    borderRadius: m(14),
    padding: m(24),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyPendingTitle: {
    fontSize: m(15),
    fontWeight: '700',
    color: '#0f172a',
    marginTop: m(8),
  },
  emptyPendingSub: {
    fontSize: m(12),
    color: '#64748b',
    marginTop: m(2),
    textAlign: 'center',
  },
  protocolBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#eff6ff',
    borderRadius: m(14),
    padding: m(14),
    marginTop: m(6),
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  protocolIconWrap: {
    width: m(32),
    height: m(32),
    borderRadius: m(16),
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(10),
    marginTop: m(2),
  },
  protocolTitle: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#1e40af',
  },
  protocolDesc: {
    fontSize: m(11),
    color: '#3b82f6',
    marginTop: m(2),
    lineHeight: m(16),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: m(20),
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: m(20),
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
    width: m(36),
    height: m(36),
    borderRadius: m(10),
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: m(17),
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
    marginLeft: m(10),
  },
  modalSubtitle: {
    fontSize: m(12),
    color: '#64748b',
    marginBottom: m(16),
    lineHeight: m(18),
  },
  inputLabel: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#334155',
    marginBottom: m(6),
  },
  inputField: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: m(10),
    paddingHorizontal: m(12),
    paddingVertical: m(10),
    fontSize: m(13),
    color: '#0f172a',
    marginBottom: m(12),
  },
  otpInputField: {
    fontSize: m(18),
    fontWeight: '800',
    letterSpacing: 4,
    textAlign: 'center',
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: m(8),
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: m(12),
    borderRadius: m(10),
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    marginRight: m(8),
  },
  modalCancelText: {
    fontSize: m(13),
    fontWeight: '700',
    color: '#64748b',
  },
  modalVerifyBtn: {
    flex: 2,
    paddingVertical: m(12),
    borderRadius: m(10),
    alignItems: 'center',
    backgroundColor: '#2563eb',
  },
  modalVerifyText: {
    fontSize: m(13),
    fontWeight: '700',
    color: '#ffffff',
  },
});
