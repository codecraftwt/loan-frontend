import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Linking,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Feather from 'react-native-vector-icons/Feather';
import { colors, FontFamily } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper, showAlert } from '../../../Components/common';
import lenderFlowService from '../../../Services/lenderFlowService';

export default function LenderLoansPortfolio() {
  const navigation = useNavigation();
  const user = useSelector(state => state.auth?.user);
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

  // Quick Repayment Modal State
  const [repaymentModalVisible, setRepaymentModalVisible] = useState(false);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('bank_transfer'); // 'bank_transfer' | 'upi' | 'cheque' | 'cash'
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);

  const fetchPortfolio = useCallback(async () => {
    if (!user?._id || user?.roleId !== 1) return;
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
      if (err?.response?.status !== 401) {
        console.error('Error fetching lender loans portfolio:', err);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?._id, user?.roleId, activeTab, search]);

  useFocusEffect(
    useCallback(() => {
      if (!user?._id || user?.roleId !== 1) return;
      fetchPortfolio();
    }, [user?._id, user?.roleId, fetchPortfolio])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPortfolio();
  };

  const formatINR = (val) => {
    if (!val && val !== 0) return '₹0';
    const num = Number(val) || 0;
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
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

  // Calculate total overdue amount across loans
  const overdueTotalAmount = useMemo(() => {
    return loans.reduce((sum, loan) => {
      const overdues = (loan.installments || []).filter(i => i.status === 'overdue');
      const oSum = overdues.reduce((s, i) => s + (i.installmentAmount || i.amount || 0), 0);
      return sum + oSum;
    }, 0);
  }, [loans]);

  // WhatsApp outreach shortcut
  const handleOpenWhatsApp = (mobileNo, borrowerName, amount) => {
    if (!mobileNo) {
      showAlert('No Contact', 'No mobile number recorded for this borrower.');
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
          showAlert('Error', 'Unable to launch WhatsApp.');
        });
      });
  };

  // Open Quick Record Repayment Modal
  const handleOpenRecordPayment = (loanItem) => {
    setSelectedLoanForPayment(loanItem);
    const defaultAmount = loanItem.monthlyEmi || loanItem.emiAmount || '';
    setPaymentAmount(defaultAmount ? String(defaultAmount) : '');
    setPaymentMode('bank_transfer');
    setTransactionRef('');
    setPaymentNotes('');
    setRepaymentModalVisible(true);
  };

  // Submit Repayment
  const handleSubmitPayment = async () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      showAlert('Invalid Amount', 'Please enter a valid repayment amount.');
      return;
    }
    if (!selectedLoanForPayment?._id) return;

    try {
      setRecordingPayment(true);
      const payload = {
        paymentAmount: Number(paymentAmount),
        paymentMode,
        transactionReference: transactionRef.trim() || undefined,
        paymentDate: new Date().toISOString(),
        notes: paymentNotes.trim() || undefined,
      };

      const res = await lenderFlowService.recordLoanPayment(selectedLoanForPayment._id, payload);
      if (res?.success) {
        showAlert(
          'Repayment Recorded! 🎉',
          res.message || 'Payment has been applied to the facility amortization schedule.'
        );
        setRepaymentModalVisible(false);
        fetchPortfolio();
      } else {
        showAlert('Error', res?.message || 'Could not post payment.');
      }
    } catch (err) {
      console.error('Error posting repayment:', err);
      const msg = err.response?.data?.message || 'Failed to post payment.';
      showAlert('Payment Error', msg);
    } finally {
      setRecordingPayment(false);
    }
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

    // Find next upcoming or overdue installment for EMI due date
    const nextInstallment = (item.installments || []).find(
      (inst) => inst.status === 'pending' || inst.status === 'overdue'
    );
    const nextDueDate = nextInstallment?.dueDate
      ? formatDate(nextInstallment.dueDate)
      : item.loanEndDate
      ? formatDate(item.loanEndDate)
      : 'N/A';
    const isNextOverdue = nextInstallment?.status === 'overdue' || hasOverdue;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('LenderLoanDetails', {
            loanId: item._id,
            loan: item,
          })
        }
        activeOpacity={0.8}
      >
        {/* Top Header Row */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.activityIconCircle}>
            <Feather name="credit-card" size={m(16)} color={colors.white} />
          </View>

          <View style={styles.headerInfoCol}>
            <Text style={styles.borrowerNameText} numberOfLines={1}>
              {borrowerName}
            </Text>
            <Text style={styles.facilitySubtitle} numberOfLines={1}>
              Facility #{item._id.slice(-6).toUpperCase()} • {item.interestRate || 12}% p.a.
            </Text>
            {item.pledgedSecurity || item.applicationId?.pledgedSecurity ? (
              <View style={styles.pledgedSecurityBadge}>
                <Feather name="shield" size={m(10)} color="#b45309" />
                <Text style={styles.pledgedSecurityBadgeText} numberOfLines={1}>
                  {item.pledgedSecurity || item.applicationId?.pledgedSecurity}
                </Text>
              </View>
            ) : null}
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
                ? 'CLOSED'
                : isPendingDisbursal
                ? 'OTP PENDING'
                : hasOverdue
                ? 'OVERDUE'
                : 'ACTIVE'}
            </Text>
          </View>
        </View>

        {/* Compact Financial Metrics Strip */}
        <View style={styles.metricsBox}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Sanctioned</Text>
            <Text style={styles.metricValueBold}>{formatINR(principal)}</Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Outstanding</Text>
            <Text style={styles.metricValueBlue}>{formatINR(remaining)}</Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>
              {isClosed ? 'Status' : isNextOverdue ? 'Overdue Due' : 'Next EMI'}
            </Text>
            <Text
              style={[styles.metricValueBold, isNextOverdue && styles.metricValueOverdue]}
              numberOfLines={1}
            >
              {isClosed ? 'Paid Off' : formatINR(item.monthlyEmi || item.emiAmount || 0)}
            </Text>
            {!isClosed && nextDueDate !== 'N/A' && (
              <Text
                style={[styles.metricSubDate, isNextOverdue && styles.metricSubDateOverdue]}
                numberOfLines={1}
              >
                {nextDueDate}
              </Text>
            )}
          </View>

          <View style={styles.chevronWrap}>
            <Feather name="chevron-right" size={m(16)} color={colors.textSecondary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper
      backgroundColor={colors.backgroundGreenWhite}
      topInsetBg={colors.primary}
      statusBarColor={colors.primary}
      statusBarStyle="dark-content"
      includeTabBarClearance={true}
      scrollable={false}
    >
      {/* ── 1. Top Green Banner with Unified 4-Metrics Bar ── */}
      <View style={styles.topBanner}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTag}>INSTITUTIONAL DEBT BOOK</Text>
            <Text style={styles.headerTitle}>Loans Portfolio</Text>
            <Text style={styles.headerSubtitle}>
              Live portfolio, repayment schedules & collections
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={onRefresh}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Feather name="refresh-cw" size={m(17)} color={colors.lettersAndIcons} />
          </TouchableOpacity>
        </View>

        {/* Unified 4-Tile Portfolio Metrics Bar */}
        <View style={styles.unifiedMetricsGrid}>
          {/* Tile 1: Total Disbursed */}
          <View style={styles.metricTile}>
            <View style={styles.tileHeaderRow}>
              <Feather name="arrow-up-right" size={m(12)} color={colors.lettersAndIcons} />
              <Text style={styles.tileLabel}>Disbursed</Text>
            </View>
            <Text style={styles.tileValueWhite} numberOfLines={1}>
              {formatINR(metrics.totalDisbursed)}
            </Text>
          </View>

          {/* Tile 2: Collected */}
          <View style={styles.metricTile}>
            <View style={styles.tileHeaderRow}>
              <Feather name="check-circle" size={m(12)} color={colors.lettersAndIcons} />
              <Text style={styles.tileLabel}>Collected</Text>
            </View>
            <Text style={styles.tileValueBlue} numberOfLines={1}>
              {formatINR(metrics.totalCollected)}
            </Text>
          </View>

          {/* Tile 3: Outstanding */}
          <View style={styles.metricTile}>
            <View style={styles.tileHeaderRow}>
              <Feather name="clock" size={m(12)} color={colors.lettersAndIcons} />
              <Text style={styles.tileLabel}>Outstanding</Text>
            </View>
            <Text style={styles.tileValueDark} numberOfLines={1}>
              {formatINR(metrics.totalOutstanding)}
            </Text>
          </View>

          {/* Tile 4: Overdue */}
          <View style={styles.metricTile}>
            <View style={styles.tileHeaderRow}>
              <Feather name="alert-circle" size={m(12)} color="#b91c1c" />
              <Text style={[styles.tileLabel, { color: '#7f1d1d' }]}>Overdue</Text>
            </View>
            <Text style={styles.tileValueRed} numberOfLines={1}>
              {overdueTotalAmount > 0
                ? formatINR(overdueTotalAmount)
                : `${metrics.overdueCount || 0} Deals`}
            </Text>
          </View>
        </View>
      </View>

      {/* ── 2. Main Curved Body Section ── */}
      <View style={styles.sheetSection}>
        {/* Search Input Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={m(16)} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by company, facility ID, or borrower..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={fetchPortfolio}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={m(16)} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Lifecycle Status Filter: Capsule Pills (All, Active, Overdue, Closed) */}
        <View style={styles.periodCapsuleRow}>
          {[
            { key: 'all', label: 'All', count: metrics.totalLoans || loans.length },
            { key: 'active', label: 'Active', count: metrics.activeCount || 0 },
            { key: 'overdue', label: 'Overdue', count: metrics.overdueCount || 0 },
            { key: 'closed', label: 'Closed', count: metrics.closedCount || 0 },
          ].map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.periodTab, isSelected && styles.periodTabActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.periodTabText,
                    isSelected && styles.periodTabTextActive,
                  ]}
                >
                  {tab.label}
                  {tab.count > 0 ? ` (${tab.count})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* List Content */}
        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.lettersAndIcons} />
            <Text style={styles.loadingText}>Syncing debt portfolio...</Text>
          </View>
        ) : (
          <FlatList
            data={loans}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.lettersAndIcons]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="credit-card" size={m(42)} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Loan Facilities Found</Text>
                <Text style={styles.emptySubtitle}>
                  {activeTab === 'all'
                    ? 'Sanctioned loans and active facilities will appear here.'
                    : `No facilities in the '${activeTab}' category.`}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* ── 3. Quick Record Repayment Modal ── */}
      <Modal
        visible={repaymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRepaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}>
                <Feather name="credit-card" size={m(20)} color={colors.oceanBlueButton} />
              </View>
              <View style={{ flex: 1, marginLeft: m(10) }}>
                <Text style={styles.modalTitle}>Record Repayment</Text>
                <Text style={styles.modalSub} numberOfLines={1}>
                  {selectedLoanForPayment?.borrowerId?.companyName ||
                    selectedLoanForPayment?.borrowerId?.userName ||
                    selectedLoanForPayment?.name ||
                    'Commercial Facility'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setRepaymentModalVisible(false)}>
                <Feather name="x" size={m(20)} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Payment Amount (₹) *</Text>
              <TextInput
                style={styles.inputField}
                placeholder="e.g. 25000"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
              />

              <Text style={styles.inputLabel}>Payment Channel</Text>
              <View style={styles.modeGrid}>
                {[
                  { key: 'bank_transfer', label: 'Bank / RTGS' },
                  { key: 'upi', label: 'UPI' },
                  { key: 'cheque', label: 'Cheque' },
                  { key: 'cash', label: 'Cash' },
                ].map((mItem) => (
                  <TouchableOpacity
                    key={mItem.key}
                    style={[
                      styles.modeChip,
                      paymentMode === mItem.key && styles.activeModeChip,
                    ]}
                    onPress={() => setPaymentMode(mItem.key)}
                  >
                    <Text
                      style={[
                        styles.modeText,
                        paymentMode === mItem.key && styles.activeModeText,
                      ]}
                    >
                      {mItem.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Transaction Reference / UTR</Text>
              <TextInput
                style={styles.inputField}
                placeholder="e.g. UTR-9823482734 or Cheque #"
                placeholderTextColor={colors.textMuted}
                value={transactionRef}
                onChangeText={setTransactionRef}
              />

              <Text style={styles.inputLabel}>Repayment Narration</Text>
              <TextInput
                style={[styles.inputField, { height: m(60), textAlignVertical: 'top' }]}
                placeholder="Optional repayment notes"
                placeholderTextColor={colors.textMuted}
                value={paymentNotes}
                onChangeText={setPaymentNotes}
                multiline
              />

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setRepaymentModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={handleSubmitPayment}
                  disabled={recordingPayment}
                >
                  {recordingPayment ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.modalSubmitText}>Post Repayment</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  // Top Green Banner
  topBanner: {
    backgroundColor: colors.primary,
    paddingHorizontal: m(18),
    paddingTop: m(10),
    paddingBottom: m(16),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(12),
  },
  headerTag: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: 0.8,
    opacity: 0.85,
    marginBottom: m(2),
  },
  headerTitle: {
    fontSize: m(22),
    lineHeight: m(28),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  headerSubtitle: {
    fontSize: m(12),
    lineHeight: m(16),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
    opacity: 0.9,
    marginTop: m(2),
  },
  refreshBtn: {
    width: m(40),
    height: m(40),
    borderRadius: m(20),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // Unified 4-Tile Metrics Grid
  unifiedMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(8),
    marginTop: m(2),
  },
  metricTile: {
    width: '48.5%',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: m(14),
    paddingHorizontal: m(12),
    paddingVertical: m(9),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
  },
  tileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(5),
    marginBottom: m(3),
  },
  tileLabel: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
    opacity: 0.85,
  },
  tileValueWhite: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  tileValueBlue: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: colors.oceanBlueButton,
  },
  tileValueDark: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  tileValueRed: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: '#b91c1c',
  },

  // Main Curved Sheet
  sheetSection: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(30),
    borderTopRightRadius: m(30),
    paddingTop: m(16),
  },

  // Search Input Container
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: m(16),
    marginHorizontal: m(18),
    marginBottom: m(10),
    paddingHorizontal: m(14),
    height: m(44),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
  },
  searchInput: {
    flex: 1,
    marginLeft: m(8),
    fontSize: m(13),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
  },

  // Capsule Filter Tabs
  periodCapsuleRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: m(24),
    padding: m(4),
    marginHorizontal: m(18),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
  },
  periodTab: {
    flex: 1,
    paddingVertical: m(6),
    borderRadius: m(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodTabActive: {
    backgroundColor: colors.primary,
  },
  periodTabText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  periodTabTextActive: {
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  listContent: {
    paddingHorizontal: m(18),
    paddingBottom: m(30),
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(8),
  },

  // Short Compact Deal Card
  card: {
    backgroundColor: colors.white,
    borderRadius: m(14),
    padding: m(12),
    marginBottom: m(10),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.06)',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(8),
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
  headerInfoCol: {
    flex: 1,
    marginRight: m(8),
  },
  borrowerNameText: {
    fontSize: m(14),
    lineHeight: m(18),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  facilitySubtitle: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.blueButton,
    marginTop: m(1),
  },
  pledgedSecurityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#fef3c7',
    paddingHorizontal: m(5),
    paddingVertical: m(1.5),
    borderRadius: m(5),
    marginTop: m(3),
    borderWidth: 0.5,
    borderColor: '#fde68a',
    maxWidth: '100%',
  },
  pledgedSecurityBadgeText: {
    fontFamily: FontFamily.primaryMedium,
    fontSize: m(10),
    color: '#92400e',
    marginLeft: m(3),
  },

  // Status Badges
  statusBadge: {
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(8),
  },
  badgeActive: {
    backgroundColor: colors.lightGreen,
  },
  badgePending: {
    backgroundColor: '#fef3c7',
  },
  badgeOverdue: {
    backgroundColor: '#fee2e2',
  },
  badgeClosed: {
    backgroundColor: '#f1f5f9',
  },
  statusBadgeText: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
  },
  textActive: {
    color: colors.lettersAndIcons,
  },
  textPending: {
    color: '#d97706',
  },
  textOverdue: {
    color: '#dc2626',
  },
  textClosed: {
    color: '#64748b',
  },

  // Compact Metrics Box
  metricsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: m(10),
    paddingVertical: m(8),
    paddingHorizontal: m(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  metricValueBlue: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.oceanBlueButton,
  },
  metricValueOverdue: {
    color: '#dc2626',
  },
  metricSubDate: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(1),
  },
  metricSubDateOverdue: {
    color: '#dc2626',
    fontFamily: FontFamily.primaryMedium,
  },
  metricDivider: {
    width: 1,
    height: m(20),
    backgroundColor: '#e2e8f0',
  },
  chevronWrap: {
    marginLeft: m(6),
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyContainer: {
    paddingVertical: m(50),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginTop: m(10),
  },
  emptySubtitle: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: m(4),
    paddingHorizontal: m(20),
  },

  // Repayment Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: m(24),
    borderTopRightRadius: m(24),
    padding: m(20),
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(16),
  },
  modalIconWrap: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  modalSub: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(1),
  },
  inputLabel: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(6),
    marginTop: m(10),
  },
  inputField: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: m(12),
    paddingHorizontal: m(12),
    paddingVertical: m(10),
    fontSize: m(13),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(8),
  },
  modeChip: {
    paddingHorizontal: m(12),
    paddingVertical: m(7),
    borderRadius: m(16),
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeModeChip: {
    backgroundColor: colors.oceanBlueButton,
    borderColor: colors.oceanBlueButton,
  },
  modeText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
  },
  activeModeText: {
    color: colors.white,
    fontFamily: FontFamily.primaryBold,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: m(10),
    marginTop: m(20),
    marginBottom: m(10),
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: m(12),
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: m(13),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.textSecondary,
  },
  modalSubmitBtn: {
    flex: 2,
    backgroundColor: colors.oceanBlueButton,
    paddingVertical: m(12),
    borderRadius: m(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
});
