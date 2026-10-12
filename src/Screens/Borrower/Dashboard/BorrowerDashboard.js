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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { useSelector } from 'react-redux';
import { m } from 'walstar-rn-responsive';
import { FontFamily, colors } from '../../../constants';
import borrowerFlowService from '../../../Services/borrowerFlowService';

export default function BorrowerDashboard() {
  const navigation = useNavigation();
  const user = useSelector(state => state.auth.user);

  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    autoRejectedApplications: 0,
    rejectedApplications: 0,
    totalLendersAvailable: 0,
    latestAccepted: null,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await borrowerFlowService.getDashboardStats();
      if (res?.success && res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Error fetching borrower dashboard stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardStats();
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, [fetchDashboardStats, fadeAnim])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardStats();
  };

  const formatINR = (val) => {
    if (!val) return '₹0';
    const num = Number(val);
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lakh`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Top Header / Greeting Bar */}
      <View style={styles.topNav}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>
              {user?.userName ? user.userName.charAt(0).toUpperCase() : 'B'}
            </Text>
          </View>
          <View>
            <View style={styles.roleRow}>
              <Text style={styles.greetingTitle}>
                {user?.userName || 'Borrower'}
              </Text>
              <View style={styles.roleTag}>
                <Text style={styles.roleTagText}>BORROWER</Text>
              </View>
            </View>
            <Text style={styles.subGreeting}>Commercial Capital Workspace</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => navigation.navigate('BorrowerProfileScreen')}
        >
          <Feather name="user" size={m(18)} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.navy} />}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Hero Banner */}
          <View style={styles.heroBanner}>
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>Commercial Financing</Text>
              <Text style={styles.heroSubtitle}>
                Apply to verified institutional lenders, receive instant terms, and manage amortized facilities.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.heroBtn}
              onPress={() => navigation.navigate('BorrowerExploreLenders')}
            >
              <Feather name="search" size={m(14)} color={colors.white} />
              <Text style={styles.heroBtnText}>Explore Lenders & Apply</Text>
            </TouchableOpacity>
          </View>

          {/* Accepted Deal Banner (if active deal exists) */}
          {stats.latestAccepted ? (
            <View style={styles.acceptedBanner}>
              <View style={styles.acceptedBannerHeader}>
                <View style={styles.acceptedIconBadge}>
                  <Feather name="check-circle" size={m(18)} color="#16A34A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.acceptedBannerTitle}>
                    {formatINR(stats.latestAccepted.amount)} Facility Accepted!
                  </Text>
                  <Text style={styles.acceptedLenderName}>
                    By {stats.latestAccepted.lenderId?.companyName || stats.latestAccepted.lenderId?.userName || 'Institutional Lender'}
                  </Text>
                </View>
              </View>

              <Text style={styles.acceptedBannerDesc}>
                Purpose: <Text style={styles.boldText}>{stats.latestAccepted.purpose}</Text> · Tenure: <Text style={styles.boldText}>{stats.latestAccepted.tenureMonths} Months</Text>. Other pending applications were auto-closed.
              </Text>

              <View style={styles.acceptedFooter}>
                <View style={styles.lenderContactBox}>
                  <Text style={styles.contactLabel}>Lender Contact</Text>
                  <Text style={styles.contactVal}>
                    {stats.latestAccepted.lenderId?.mobileNo || 'Contact via portal'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.viewDealBtn}
                  onPress={() => navigation.navigate('BorrowerApplications')}
                >
                  <Text style={styles.viewDealBtnText}>View Deal</Text>
                  <Feather name="arrow-right" size={m(13)} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* 4 Summary KPI Metric Cards */}
          <Text style={styles.sectionHeader}>Financing Portfolio Overview</Text>
          <View style={styles.kpiGrid}>
            {/* KPI 1: Pending */}
            <TouchableOpacity
              style={[styles.kpiCard, styles.kpiBorderAmber]}
              onPress={() => navigation.navigate('BorrowerApplications')}
            >
              <View style={styles.kpiCardTop}>
                <Text style={[styles.kpiTag, { color: '#D97706' }]}>PENDING REVIEW</Text>
                <View style={[styles.kpiIconWrapper, { backgroundColor: '#FEF3C7' }]}>
                  <Feather name="clock" size={m(14)} color="#D97706" />
                </View>
              </View>
              <Text style={styles.kpiValue}>{stats.pendingApplications}</Text>
              <Text style={styles.kpiSub}>With selected lenders</Text>
            </TouchableOpacity>

            {/* KPI 2: Accepted */}
            <TouchableOpacity
              style={[styles.kpiCard, styles.kpiBorderEmerald]}
              onPress={() => navigation.navigate('BorrowerApplications')}
            >
              <View style={styles.kpiCardTop}>
                <Text style={[styles.kpiTag, { color: '#16A34A' }]}>ACCEPTED DEALS</Text>
                <View style={[styles.kpiIconWrapper, { backgroundColor: '#DCFCE7' }]}>
                  <Feather name="check-circle" size={m(14)} color="#16A34A" />
                </View>
              </View>
              <Text style={styles.kpiValue}>{stats.acceptedApplications}</Text>
              <Text style={styles.kpiSub}>Sanctioned loans</Text>
            </TouchableOpacity>

            {/* KPI 3: Auto-Closed */}
            <TouchableOpacity
              style={[styles.kpiCard, styles.kpiBorderSlate]}
              onPress={() => navigation.navigate('BorrowerApplications')}
            >
              <View style={styles.kpiCardTop}>
                <Text style={[styles.kpiTag, { color: '#64748B' }]}>AUTO-CLOSED</Text>
                <View style={[styles.kpiIconWrapper, { backgroundColor: '#F1F5F9' }]}>
                  <Feather name="x-circle" size={m(14)} color="#64748B" />
                </View>
              </View>
              <Text style={styles.kpiValue}>{stats.autoRejectedApplications}</Text>
              <Text style={styles.kpiSub}>Closed on acceptance</Text>
            </TouchableOpacity>

            {/* KPI 4: Active Lenders */}
            <TouchableOpacity
              style={[styles.kpiCard, styles.kpiBorderBlue]}
              onPress={() => navigation.navigate('BorrowerExploreLenders')}
            >
              <View style={styles.kpiCardTop}>
                <Text style={[styles.kpiTag, { color: '#2563EB' }]}>ACTIVE LENDERS</Text>
                <View style={[styles.kpiIconWrapper, { backgroundColor: '#DBEAFE' }]}>
                  <Feather name="users" size={m(14)} color="#2563EB" />
                </View>
              </View>
              <Text style={styles.kpiValue}>{stats.totalLendersAvailable}</Text>
              <Text style={styles.kpiSub}>Ready to finance</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Action Shortcuts */}
          <Text style={styles.sectionHeader}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('BorrowerExploreLenders')}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#E0F2FE' }]}>
                <Feather name="search" size={m(20)} color="#0284C7" />
              </View>
              <Text style={styles.actionTitle}>Explore Lenders</Text>
              <Text style={styles.actionDesc}>Compare rates & terms</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('BorrowerApply')}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#DCFCE7' }]}>
                <Feather name="send" size={m(20)} color="#16A34A" />
              </View>
              <Text style={styles.actionTitle}>Apply for Loan</Text>
              <Text style={styles.actionDesc}>Submit to up to 8 lenders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('BorrowerApplications')}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Feather name="inbox" size={m(20)} color="#D97706" />
              </View>
              <Text style={styles.actionTitle}>My Applications</Text>
              <Text style={styles.actionDesc}>Track status ({stats.totalApplications})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('BorrowerLoansPortfolio')}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#F3E8FF' }]}>
                <Feather name="credit-card" size={m(20)} color="#9333EA" />
              </View>
              <Text style={styles.actionTitle}>Loans & EMI</Text>
              <Text style={styles.actionDesc}>Repayment schedule</Text>
            </TouchableOpacity>
          </View>

          {/* 3 Step Financing Guide Card */}
          <View style={styles.guideCard}>
            <View style={styles.guideCardHeader}>
              <Text style={styles.guideBadge}>HOW IT WORKS</Text>
              <Text style={styles.guideTitle}>Apply to Multiple Lenders with Zero Friction</Text>
            </View>

            <View style={styles.stepsList}>
              <View style={styles.stepItem}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>Explore & Select</Text>
                  <Text style={styles.stepDesc}>Browse verified institutions and their loan limits.</Text>
                </View>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>Apply to up to 8 Lenders</Text>
                  <Text style={styles.stepDesc}>Submit one unified application with custom EMI calculator.</Text>
                </View>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>First Acceptance Wins</Text>
                  <Text style={styles.stepDesc}>When a lender accepts, other offers automatically close to prevent over-leverage.</Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topNav: {
    backgroundColor: '#0F172A',
    paddingHorizontal: m(16),
    paddingTop: m(12),
    paddingBottom: m(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(10),
  },
  userAvatar: {
    width: m(40),
    height: m(40),
    borderRadius: m(12),
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#38BDF8',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  greetingTitle: {
    fontSize: m(15),
    fontWeight: '700',
    color: colors.white,
  },
  roleTag: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: m(6),
    paddingVertical: m(2),
    borderRadius: m(4),
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  roleTagText: {
    fontSize: m(9),
    fontWeight: '700',
    color: '#A5B4FC',
  },
  subGreeting: {
    fontSize: m(11),
    color: '#94A3B8',
    marginTop: m(1),
  },
  profileBtn: {
    width: m(36),
    height: m(36),
    borderRadius: m(10),
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: m(16),
    gap: m(16),
    paddingBottom: m(90),
  },
  heroBanner: {
    backgroundColor: '#0F172A',
    borderRadius: m(18),
    padding: m(18),
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  heroTextContainer: {
    marginBottom: m(14),
  },
  heroTitle: {
    fontSize: m(18),
    fontWeight: '800',
    color: colors.white,
  },
  heroSubtitle: {
    fontSize: m(12),
    color: '#94A3B8',
    marginTop: m(4),
    lineHeight: m(17),
  },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
    backgroundColor: '#2563EB',
    paddingVertical: m(10),
    paddingHorizontal: m(16),
    borderRadius: m(12),
    alignSelf: 'flex-start',
  },
  heroBtnText: {
    fontSize: m(13),
    fontWeight: '700',
    color: colors.white,
  },
  acceptedBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: m(16),
    padding: m(16),
  },
  acceptedBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(10),
  },
  acceptedIconBadge: {
    width: m(34),
    height: m(34),
    borderRadius: m(10),
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptedBannerTitle: {
    fontSize: m(15),
    fontWeight: '800',
    color: '#0F172A',
  },
  acceptedLenderName: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#16A34A',
  },
  acceptedBannerDesc: {
    fontSize: m(12),
    color: '#475569',
    marginTop: m(8),
    lineHeight: m(17),
  },
  boldText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  acceptedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: m(12),
    paddingTop: m(10),
    borderTopWidth: 1,
    borderTopColor: '#DCFCE7',
  },
  lenderContactBox: {
    flex: 1,
  },
  contactLabel: {
    fontSize: m(9),
    textTransform: 'uppercase',
    fontWeight: '700',
    color: '#94A3B8',
  },
  contactVal: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#0F172A',
    marginTop: m(2),
  },
  viewDealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
    backgroundColor: '#16A34A',
    paddingHorizontal: m(14),
    paddingVertical: m(8),
    borderRadius: m(10),
  },
  viewDealBtnText: {
    fontSize: m(12),
    fontWeight: '700',
    color: colors.white,
  },
  sectionHeader: {
    fontSize: m(14),
    fontWeight: '700',
    color: '#0F172A',
    marginTop: m(4),
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(10),
  },
  kpiCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: m(14),
    padding: m(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiBorderAmber: {
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  kpiBorderEmerald: {
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  kpiBorderSlate: {
    borderLeftWidth: 3,
    borderLeftColor: '#64748B',
  },
  kpiBorderBlue: {
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  kpiCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiTag: {
    fontSize: m(9),
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  kpiIconWrapper: {
    width: m(24),
    height: m(24),
    borderRadius: m(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    fontSize: m(22),
    fontWeight: '800',
    color: '#0F172A',
    marginTop: m(8),
  },
  kpiSub: {
    fontSize: m(11),
    color: '#94A3B8',
    marginTop: m(2),
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(10),
  },
  actionItem: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: m(14),
    padding: m(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: m(6),
  },
  actionIconBox: {
    width: m(38),
    height: m(38),
    borderRadius: m(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: m(13),
    fontWeight: '700',
    color: '#0F172A',
  },
  actionDesc: {
    fontSize: m(10),
    color: '#64748B',
  },
  guideCard: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  guideCardHeader: {
    marginBottom: m(12),
  },
  guideBadge: {
    fontSize: m(9),
    fontWeight: '700',
    color: '#2563EB',
    textTransform: 'uppercase',
  },
  guideTitle: {
    fontSize: m(14),
    fontWeight: '700',
    color: '#0F172A',
    marginTop: m(2),
  },
  stepsList: {
    gap: m(12),
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: m(10),
  },
  stepNumberBadge: {
    width: m(24),
    height: m(24),
    borderRadius: m(12),
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: m(11),
    fontWeight: '700',
    color: '#2563EB',
  },
  stepTitle: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#1E293B',
  },
  stepDesc: {
    fontSize: m(11),
    color: '#64748B',
    marginTop: m(2),
    lineHeight: m(15),
  },
});
