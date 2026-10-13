import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  TextInput,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { m } from 'walstar-rn-responsive';
import { colors } from '../../../constants';
import borrowerFlowService from '../../../Services/borrowerFlowService';

export default function BorrowerLoansPortfolio() {
  const navigation = useNavigation();
  const [loans, setLoans] = useState([]);
  const [metrics, setMetrics] = useState({
    totalBorrowed: 0,
    totalRepaid: 0,
    totalOutstanding: 0,
    totalLoans: 0,
    activeLoansCount: 0,
    closedLoansCount: 0,
    nextEmi: null,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'active' | 'closed'
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPortfolio = useCallback(async () => {
    try {
      setLoading(true);
      const res = await borrowerFlowService.getLoansPortfolio({
        status: activeTab,
        search: searchQuery,
      });
      if (res?.success) {
        setLoans(res.loans || []);
        if (res.metrics) {
          setMetrics(res.metrics);
        }
      }
    } catch (err) {
      console.error('Error fetching borrower loans portfolio:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, searchQuery]);

  useFocusEffect(
    useCallback(() => {
      fetchPortfolio();
    }, [fetchPortfolio])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPortfolio();
  };

  const formatINR = (val) => {
    if (!val) return '₹0';
    const num = Number(val);
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lakh`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const formatDate = (iso) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (loan) => {
    if (
      loan.status === 'pending_disbursal' ||
      (loan.disbursalVerification && !loan.disbursalVerification.isVerified)
    ) {
      return {
        label: 'Disbursal OTP Ready',
        bg: '#FEF3C7',
        text: '#D97706',
        icon: 'lock',
      };
    }
    const isOverdue = loan.installments?.some((i) => i.status === 'overdue');
    if (isOverdue) {
      return {
        label: 'EMI Overdue',
        bg: '#FEE2E2',
        text: '#DC2626',
        icon: 'alert-circle',
      };
    }
    if (loan.status === 'closed' || loan.remainingAmount <= 0) {
      return {
        label: 'Fully Repaid',
        bg: '#F1F5F9',
        text: '#64748B',
        icon: 'check-circle',
      };
    }
    return {
      label: 'Active Facility',
      bg: '#DCFCE7',
      text: '#16A34A',
      icon: 'check-circle',
    };
  };

  const renderLoanCard = ({ item }) => {
    const statusMeta = getStatusBadge(item);
    const lenderName =
      item.lenderSnapshot?.companyName ||
      item.lenderSnapshot?.userName ||
      item.lenderId?.companyName ||
      item.lenderId?.userName ||
      'Institutional Lender';

    const principal = Number(item.amount || 0);
    const repaid = Number(item.totalPaid || 0);
    const totalExpected = Number(item.totalRepaymentExpected || principal);
    const progressPercent =
      totalExpected > 0 ? Math.min(100, Math.round((repaid / totalExpected) * 100)) : 0;

    return (
      <TouchableOpacity
        style={styles.loanCard}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('BorrowerLoanDetails', { id: item._id })}
      >
        {/* Top Lender & Status Header */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.lenderIcon}>
              <Feather name="credit-card" size={m(16)} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.lenderName} numberOfLines={1}>
                {lenderName}
              </Text>
              <Text style={styles.purposeText} numberOfLines={1}>
                {item.purpose || item.dealName || 'Commercial Line'} · Disbursed {formatDate(item.loanStartDate || item.createdAt)}
              </Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}>
            <Feather name={statusMeta.icon} size={m(10)} color={statusMeta.text} />
            <Text style={[styles.statusText, { color: statusMeta.text }]}>
              {statusMeta.label}
            </Text>
          </View>
        </View>

        {/* 4 Metrics Strip */}
        <View style={styles.metricsGrid}>
          <View style={styles.mItem}>
            <Text style={styles.mLabel}>Principal</Text>
            <Text style={[styles.mVal, { color: '#2563EB' }]}>{formatINR(principal)}</Text>
          </View>
          <View style={styles.mItem}>
            <Text style={styles.mLabel}>Monthly EMI</Text>
            <Text style={styles.mVal}>{formatINR(item.monthlyEmi)}</Text>
          </View>
          <View style={styles.mItem}>
            <Text style={styles.mLabel}>Interest Rate</Text>
            <Text style={styles.mVal}>{item.interestRate || 12}% APR</Text>
          </View>
          <View style={styles.mItem}>
            <Text style={styles.mLabel}>Tenure</Text>
            <Text style={styles.mVal}>{item.tenureMonths || 24} Mo</Text>
          </View>
        </View>

        {/* Repayment Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabelText}>
              Cleared {formatINR(repaid)} of {formatINR(totalExpected)}
            </Text>
            <Text style={styles.progressPercentText}>{progressPercent}%</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        {/* Pledged Security info */}
        {item.pledgedSecurity ? (
          <View style={styles.securityTagRow}>
            <Feather name="shield" size={m(12)} color="#D97706" />
            <Text style={styles.securityTagText} numberOfLines={1}>
              Security: {item.pledgedSecurity}
            </Text>
          </View>
        ) : null}

        {/* Footer CTA */}
        <View style={styles.cardFooter}>
          <Text style={styles.footerLinkText}>View Amortization Matrix & History</Text>
          <Feather name="chevron-right" size={m(14)} color="#2563EB" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Loans & EMI Schedule</Text>
          <Text style={styles.headerSubtitle}>
            Active sanctioned credit facilities, repayment schedules, and ledger.
          </Text>
        </View>
      </View>

      {/* 4 Macro KPI Portfolio Cards */}
      <View style={styles.macroGrid}>
        {/* Total Sanctioned */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiLabel}>SANCTIONED</Text>
            <Feather name="credit-card" size={m(12)} color="#2563EB" />
          </View>
          <Text style={styles.kpiVal}>{formatINR(metrics.totalBorrowed)}</Text>
          <Text style={styles.kpiSub}>{metrics.totalLoans} loan deals</Text>
        </View>

        {/* Total Repaid */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiLabel}>REPAID</Text>
            <Feather name="check-circle" size={m(12)} color="#16A34A" />
          </View>
          <Text style={[styles.kpiVal, { color: '#16A34A' }]}>{formatINR(metrics.totalRepaid)}</Text>
          <Text style={styles.kpiSub}>Principal cleared</Text>
        </View>

        {/* Outstanding */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiLabel}>OUTSTANDING</Text>
            <Feather name="trending-up" size={m(12)} color="#4F46E5" />
          </View>
          <Text style={[styles.kpiVal, { color: '#4F46E5' }]}>
            {formatINR(metrics.totalOutstanding)}
          </Text>
          <Text style={styles.kpiSub}>{metrics.activeLoansCount} active facilities</Text>
        </View>

        {/* Next EMI */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiLabel}>NEXT EMI DUE</Text>
            <Feather name="clock" size={m(12)} color="#D97706" />
          </View>
          <Text style={[styles.kpiVal, { color: '#D97706' }]}>
            {metrics.nextEmi ? formatINR(metrics.nextEmi.emiAmount) : 'All Clear'}
          </Text>
          <Text style={styles.kpiSub} numberOfLines={1}>
            {metrics.nextEmi ? `Due ${formatDate(metrics.nextEmi.dueDate)}` : 'No pending dues'}
          </Text>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={m(16)} color="#94A3B8" style={{ marginRight: m(8) }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by facility name or purpose..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={fetchPortfolio}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Feather name="x" size={m(16)} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {[
          { key: 'all', label: `All Loans (${metrics.totalLoans})` },
          { key: 'active', label: `Active (${metrics.activeLoansCount})` },
          { key: 'closed', label: `Repaid (${metrics.closedLoansCount})` },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && styles.activeTabBtn]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabBtnText, activeTab === tab.key && styles.activeTabBtnText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Loans List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={loans}
          keyExtractor={(item) => item._id}
          renderItem={renderLoanCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="credit-card" size={m(42)} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Loan Facilities Found</Text>
              <Text style={styles.emptyText}>
                {activeTab === 'active'
                  ? 'You do not have any currently active commercial facilities.'
                  : 'No sanctioned loan records matching this category.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: m(16),
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || m(24)) + m(8) : m(14),
    paddingBottom: m(8),
  },
  headerTitle: {
    fontSize: m(18),
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: m(12),
    color: '#64748B',
    marginTop: m(2),
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: m(16),
    marginTop: m(6),
    gap: m(8),
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: colors.white,
    borderRadius: m(12),
    padding: m(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: m(9),
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.3,
  },
  kpiVal: {
    fontSize: m(15),
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: 'monospace',
    marginTop: m(4),
  },
  kpiSub: {
    fontSize: m(10),
    color: '#64748B',
    marginTop: m(2),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: m(16),
    marginTop: m(10),
    paddingHorizontal: m(12),
    paddingVertical: m(8),
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: m(13),
    color: '#0F172A',
    padding: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: m(16),
    marginTop: m(10),
    gap: m(6),
  },
  tabBtn: {
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    borderRadius: m(16),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeTabBtn: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  tabBtnText: {
    fontSize: m(11),
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabBtnText: {
    color: colors.white,
  },
  listContent: {
    padding: m(16),
    gap: m(12),
    paddingBottom: m(90),
  },
  loanCard: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: m(10),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    flex: 1,
  },
  lenderIcon: {
    width: m(34),
    height: m(34),
    borderRadius: m(10),
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lenderName: {
    fontSize: m(14),
    fontWeight: '700',
    color: '#0F172A',
  },
  purposeText: {
    fontSize: m(10),
    color: '#64748B',
    marginTop: m(1),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(6),
  },
  statusText: {
    fontSize: m(10),
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: m(10),
    padding: m(10),
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  mItem: {
    alignItems: 'center',
  },
  mLabel: {
    fontSize: m(9),
    color: '#64748B',
    textTransform: 'uppercase',
  },
  mVal: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#0F172A',
    marginTop: m(2),
    fontFamily: 'monospace',
  },
  progressContainer: {
    marginTop: m(2),
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(4),
  },
  progressLabelText: {
    fontSize: m(10),
    color: '#64748B',
  },
  progressPercentText: {
    fontSize: m(11),
    fontWeight: '700',
    color: '#16A34A',
    fontFamily: 'monospace',
  },
  progressBarTrack: {
    height: m(6),
    backgroundColor: '#E2E8F0',
    borderRadius: m(3),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#16A34A',
  },
  securityTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: '#FEF3C7',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(6),
  },
  securityTagText: {
    fontSize: m(10),
    color: '#92400E',
    fontWeight: '600',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: m(8),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerLinkText: {
    fontSize: m(11),
    fontWeight: '600',
    color: '#2563EB',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(60),
    gap: m(8),
  },
  emptyTitle: {
    fontSize: m(15),
    fontWeight: '700',
    color: '#0F172A',
  },
  emptyText: {
    fontSize: m(12),
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: m(30),
  },
});
