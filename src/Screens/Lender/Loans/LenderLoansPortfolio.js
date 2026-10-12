import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { m } from 'walstar-rn-responsive';
import { FontFamily, colors } from '../../../constants';
import lenderFlowService from '../../../Services/lenderFlowService';

export default function LenderLoansPortfolio() {
  const navigation = useNavigation();
  const [loans, setLoans] = useState([]);
  const [metrics, setMetrics] = useState({
    totalDisbursed: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    totalInterestExpected: 0,
    totalLoans: 0,
    activeCount: 0,
    closedCount: 0,
    overdueCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'active' | 'overdue' | 'closed'

  const fetchPortfolio = useCallback(async () => {
    try {
      setLoading(true);
      const res = await lenderFlowService.getLoansPortfolio({
        status: activeTab === 'all' ? undefined : activeTab,
        search: search.trim() || undefined,
      });

      if (res?.success) {
        setLoans(res.loans || []);
        if (res.portfolioMetrics) {
          setMetrics(res.portfolioMetrics);
        }
      } else {
        setLoans([]);
      }
    } catch (err) {
      console.error('Error fetching lender loans portfolio:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, search]);

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
    if (!val && val !== 0) return '₹0';
    const num = Number(val) || 0;
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

  // WhatsApp shortcut
  const handleOpenWhatsApp = (mobileNo, borrowerName, amount) => {
    if (!mobileNo) {
      Alert.alert('No Contact', 'No mobile number recorded for this borrower.');
      return;
    }
    const cleanNumber = mobileNo.replace(/\D/g, '');
    const phoneWithCountry = cleanNumber.startsWith('91') ? cleanNumber : `91${cleanNumber}`;
    const textMsg = encodeURIComponent(
      `Hello ${borrowerName}, this is regarding your active loan facility of ${formatINR(amount)} with our lending institution.`
    );
    const waUrl = `whatsapp://send?phone=${phoneWithCountry}&text=${textMsg}`;
    const webWaUrl = `https://wa.me/${phoneWithCountry}?text=${textMsg}`;

    Linking.canOpenURL(waUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(waUrl);
        } else {
          return Linking.openURL(webWaUrl);
        }
      })
      .catch(() => {
        Linking.openURL(webWaUrl).catch(() => {
          Alert.alert('Error', 'Unable to launch WhatsApp.');
        });
      });
  };

  const renderItem = ({ item }) => {
    const borrowerName =
      item.borrowerId?.companyName ||
      item.borrowerId?.userName ||
      item.name ||
      'Commercial Borrower';

    const phone = item.borrowerId?.mobileNo || item.mobileNumber || '';
    const principal = item.principal || item.amount || 0;
    const remaining = item.remainingAmount !== undefined ? item.remainingAmount : principal;
    const totalPaid = item.totalPaid || 0;
    const totalExpected = item.totalRepaymentExpected || principal || 1;
    const progressPercent = Math.min(Math.round((totalPaid / totalExpected) * 100), 100);

    const hasOverdue = item.installments?.some((inst) => inst.status === 'overdue');
    const isPendingDisbursal =
      item.status === 'pending_disbursal' ||
      (item.disbursalVerification && !item.disbursalVerification.isVerified);
    const isClosed = item.status === 'closed' || item.paymentStatus === 'paid' || remaining <= 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('LenderLoanDetails', {
            loanId: item._id,
            loan: item,
          })
        }
        activeOpacity={0.7}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{borrowerName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, marginRight: m(8) }}>
            <Text style={styles.borrowerName} numberOfLines={1}>
              {borrowerName}
            </Text>
            <Text style={styles.loanIdText}>
              Facility #{item._id.slice(-6).toUpperCase()} • {item.interestRate || 12}% p.a.
            </Text>
          </View>

          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              isClosed
                ? styles.badgeClosed
                : isPendingDisbursal
                ? styles.badgePending
                : hasOverdue
                ? styles.badgeOverdue
                : styles.badgeActive,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isClosed
                  ? styles.textClosed
                  : isPendingDisbursal
                  ? styles.textPending
                  : hasOverdue
                  ? styles.textOverdue
                  : styles.textActive,
              ]}
            >
              {isClosed
                ? 'SETTLED'
                : isPendingDisbursal
                ? 'OTP PENDING'
                : hasOverdue
                ? 'OVERDUE'
                : 'ACTIVE'}
            </Text>
          </View>
        </View>

        {/* Financial Metrics Strip */}
        <View style={styles.metricsStrip}>
          <View>
            <Text style={styles.metricLabel}>Sanctioned Principal</Text>
            <Text style={styles.metricValBold}>{formatINR(principal)}</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.metricLabel}>Outstanding</Text>
            <Text style={styles.metricValBold}>{formatINR(remaining)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.metricLabel}>Next Due EMI</Text>
            <Text style={styles.metricVal}>
              {formatINR(item.monthlyEmi || item.emiAmount || 0)}
            </Text>
          </View>
        </View>

        {/* Repayment Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeaderRow}>
            <Text style={styles.progressLabel}>Repayment Progress</Text>
            <Text style={styles.progressValueText}>{progressPercent}% collected</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercent}%`,
                  backgroundColor: isClosed ? '#10b981' : hasOverdue ? '#ef4444' : '#2563eb',
                },
              ]}
            />
          </View>
        </View>

        {/* Card Footer: WhatsApp & Manage */}
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.whatsappBtn}
            onPress={() => handleOpenWhatsApp(phone, borrowerName, principal)}
          >
            <Feather name="message-circle" size={m(14)} color="#15803d" />
            <Text style={styles.whatsappBtnText}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.manageBtn}
            onPress={() =>
              navigation.navigate('LenderLoanDetails', {
                loanId: item._id,
                loan: item,
              })
            }
          >
            <Text style={styles.manageBtnText}>Manage Facility</Text>
            <Feather name="chevron-right" size={m(14)} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Active Loan Facilities</Text>
          <Text style={styles.subtitle}>Institutional Debt Portfolio & Collections</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} disabled={loading}>
          <Feather name="refresh-cw" size={m(16)} color="#0f172a" />
        </TouchableOpacity>
      </View>

      {/* Macro Portfolio KPI Grid */}
      <View style={styles.macroKpiGrid}>
        <View style={styles.macroCard}>
          <View style={styles.macroTop}>
            <Text style={styles.macroTag}>TOTAL DISBURSED</Text>
            <Feather name="dollar-sign" size={m(14)} color="#2563eb" />
          </View>
          <Text style={styles.macroVal}>{formatINR(metrics.totalDisbursed)}</Text>
          <Text style={styles.macroSub}>{metrics.totalLoans} Total Deals</Text>
        </View>

        <View style={styles.macroCard}>
          <View style={styles.macroTop}>
            <Text style={[styles.macroTag, { color: '#16a34a' }]}>RECOVERED CAPITAL</Text>
            <Feather name="check-circle" size={m(14)} color="#16a34a" />
          </View>
          <Text style={styles.macroVal}>{formatINR(metrics.totalCollected)}</Text>
          <Text style={styles.macroSub}>{metrics.closedCount} Settled</Text>
        </View>

        <View style={styles.macroCard}>
          <View style={styles.macroTop}>
            <Text style={[styles.macroTag, { color: '#7c3aed' }]}>OUTSTANDING BOOK</Text>
            <Feather name="trending-up" size={m(14)} color="#7c3aed" />
          </View>
          <Text style={styles.macroVal}>{formatINR(metrics.totalOutstanding)}</Text>
          <Text style={styles.macroSub}>{metrics.activeCount} Active Loans</Text>
        </View>

        <View style={styles.macroCard}>
          <View style={styles.macroTop}>
            <Text style={[styles.macroTag, { color: '#d97706' }]}>EXPECTED YIELD</Text>
            <Feather name="credit-card" size={m(14)} color="#d97706" />
          </View>
          <Text style={styles.macroVal}>{formatINR(metrics.totalInterestExpected)}</Text>
          <Text style={styles.macroSub}>Gross Portfolio ARR</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Feather name="search" size={m(18)} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by company, deal name, or phone..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={fetchPortfolio}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Feather name="x" size={m(16)} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {[
          { key: 'all', label: 'All Facilities' },
          { key: 'active', label: 'Active' },
          { key: 'overdue', label: 'Overdue' },
          { key: 'closed', label: 'Settled' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && styles.activeTabBtn]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={styles.loadingText}>Loading debt portfolio...</Text>
        </View>
      ) : (
        <FlatList
          data={loans}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f172a']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="credit-card" size={m(48)} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Loan Facilities Found</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'all'
                  ? 'Sanctioned loans and active facilities will be managed here.'
                  : `No facilities in the '${activeTab}' category.`}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: m(16),
    paddingTop: m(16),
    paddingBottom: m(10),
  },
  title: {
    fontSize: m(22),
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FontFamily.primaryBold,
  },
  subtitle: {
    fontSize: m(12),
    color: '#64748b',
    marginTop: m(2),
  },
  refreshBtn: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  macroKpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: m(16),
    marginBottom: m(12),
  },
  macroCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: m(14),
    padding: m(12),
    marginBottom: m(8),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
  },
  macroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroTag: {
    fontSize: m(9),
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  macroVal: {
    fontSize: m(17),
    fontWeight: '800',
    color: '#0f172a',
    marginTop: m(4),
  },
  macroSub: {
    fontSize: m(10),
    color: '#64748b',
    marginTop: m(2),
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: m(12),
    marginHorizontal: m(16),
    marginBottom: m(10),
    paddingHorizontal: m(12),
    height: m(44),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    marginLeft: m(8),
    fontSize: m(13),
    color: '#0f172a',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: m(16),
    marginBottom: m(12),
  },
  tabBtn: {
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(18),
    backgroundColor: '#f1f5f9',
    marginRight: m(6),
  },
  activeTabBtn: {
    backgroundColor: '#0f172a',
  },
  tabText: {
    fontSize: m(11),
    fontWeight: '700',
    color: '#64748b',
  },
  activeTabText: {
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: m(16),
    paddingBottom: m(100),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: m(12),
    color: '#64748b',
    marginTop: m(8),
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: m(16),
    padding: m(16),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(12),
  },
  avatar: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(10),
  },
  avatarText: {
    fontSize: m(16),
    fontWeight: '800',
    color: '#2563eb',
  },
  borrowerName: {
    fontSize: m(15),
    fontWeight: '800',
    color: '#0f172a',
  },
  loanIdText: {
    fontSize: m(11),
    color: '#64748b',
    marginTop: m(2),
  },
  statusBadge: {
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(8),
  },
  badgeActive: { backgroundColor: '#eff6ff' },
  textActive: { color: '#2563eb', fontSize: m(10), fontWeight: '800' },
  badgePending: { backgroundColor: '#fef3c7' },
  textPending: { color: '#b45309', fontSize: m(10), fontWeight: '800' },
  badgeOverdue: { backgroundColor: '#fee2e2' },
  textOverdue: { color: '#ef4444', fontSize: m(10), fontWeight: '800' },
  badgeClosed: { backgroundColor: '#ecfdf5' },
  textClosed: { color: '#047857', fontSize: m(10), fontWeight: '800' },
  metricsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    padding: m(12),
    marginBottom: m(12),
  },
  metricLabel: {
    fontSize: m(10),
    color: '#64748b',
    fontWeight: '600',
  },
  metricValBold: {
    fontSize: m(15),
    fontWeight: '800',
    color: '#0f172a',
    marginTop: m(2),
  },
  metricVal: {
    fontSize: m(13),
    fontWeight: '700',
    color: '#0f172a',
    marginTop: m(2),
  },
  progressContainer: {
    marginBottom: m(12),
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: m(4),
  },
  progressLabel: {
    fontSize: m(11),
    color: '#64748b',
    fontWeight: '600',
  },
  progressValueText: {
    fontSize: m(11),
    fontWeight: '700',
    color: '#0f172a',
  },
  progressTrack: {
    height: m(6),
    backgroundColor: '#f1f5f9',
    borderRadius: m(3),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: m(3),
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
    paddingTop: m(10),
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(8),
  },
  whatsappBtnText: {
    fontSize: m(11),
    fontWeight: '700',
    color: '#15803d',
    marginLeft: m(4),
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: m(12),
    paddingVertical: m(7),
    borderRadius: m(8),
  },
  manageBtnText: {
    fontSize: m(11),
    fontWeight: '700',
    color: '#ffffff',
    marginRight: m(4),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(60),
  },
  emptyTitle: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#0f172a',
    marginTop: m(12),
  },
  emptySubtitle: {
    fontSize: m(12),
    color: '#64748b',
    marginTop: m(4),
    textAlign: 'center',
  },
});
