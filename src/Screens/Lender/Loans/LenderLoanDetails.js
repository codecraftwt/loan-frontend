import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { m } from 'walstar-rn-responsive';
import { FontFamily, colors } from '../../../constants';
import lenderFlowService from '../../../Services/lenderFlowService';
import DisbursalOtpModal from '../Components/DisbursalOtpModal';

export default function LenderLoanDetails() {
  const route = useRoute();
  const navigation = useNavigation();
  const { loanId } = route.params || {};

  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule' | 'borrower' | 'repayments'

  // Payment Recording Modal State
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('bank_transfer'); // 'bank_transfer' | 'upi' | 'cheque' | 'cash'
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);

  // OTP Verification Modal State
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  const fetchLoanDetails = useCallback(async () => {
    try {
      if (loanId) {
        setLoading(true);
        const res = await lenderFlowService.getLoanById(loanId);
        if (res?.success && res.loan) {
          setLoan(res.loan);
          // Set default payment amount to next installment or monthly EMI
          const nextEmi = res.loan.monthlyEmi || res.loan.emiAmount || '';
          setPaymentAmount(String(nextEmi));
        }
      }
    } catch (err) {
      console.error('Error fetching loan details:', err);
      Alert.alert('Error', 'Unable to retrieve loan facility details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loanId]);

  useEffect(() => {
    fetchLoanDetails();
  }, [fetchLoanDetails]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLoanDetails();
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

  // Submit Payment
  const handleRecordPaymentSubmit = async () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      Alert.alert('Required', 'Please enter a valid payment amount.');
      return;
    }

    try {
      setRecordingPayment(true);
      const payload = {
        paymentAmount: Number(paymentAmount),
        paymentMode,
        transactionReference: transactionRef.trim() || undefined,
        paymentDate: new Date().toISOString(),
        notes: paymentNotes.trim() || undefined,
      };

      const res = await lenderFlowService.recordLoanPayment(loan._id, payload);
      if (res?.success) {
        Alert.alert(
          'Payment Recorded! 🎉',
          res.message || 'Payment has been successfully applied to the amortization schedule.'
        );
        setPaymentModalVisible(false);
        setTransactionRef('');
        setPaymentNotes('');
        fetchLoanDetails();
      } else {
        Alert.alert('Payment Error', res?.message || 'Could not record repayment.');
      }
    } catch (err) {
      console.error('Error recording payment:', err);
      const msg = err.response?.data?.message || 'Failed to record repayment.';
      Alert.alert('Error', msg);
    } finally {
      setRecordingPayment(false);
    }
  };

  // Recalculate schedule
  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      const res = await lenderFlowService.recalculateLoanSchedule(loan._id);
      if (res?.success) {
        Alert.alert('Amortization Recalculated', 'Schedule has been synchronized with live debt balances.');
        fetchLoanDetails();
      } else {
        Alert.alert('Notice', res?.message || 'Recalculation complete.');
      }
    } catch (err) {
      Alert.alert('Error', 'Unable to recalculate schedule.');
    } finally {
      setRecalculating(false);
    }
  };

  if (loading || !loan) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={styles.loadingText}>Loading loan facility & amortization matrix...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const borrower = loan.borrowerId || {};
  const borrowerName = borrower.companyName || borrower.userName || loan.name || 'Commercial Borrower';
  const principal = loan.principal || loan.amount || 0;
  const remaining = loan.remainingAmount !== undefined ? loan.remainingAmount : principal;
  const totalPaid = loan.totalPaid || 0;
  const totalRepayable = loan.totalRepaymentExpected || principal || 1;
  const progressPercent = Math.min(Math.round((totalPaid / totalRepayable) * 100), 100);

  const isPendingDisbursal =
    loan.status === 'pending_disbursal' ||
    (loan.disbursalVerification && !loan.disbursalVerification.isVerified);
  const isClosed = loan.status === 'closed' || loan.paymentStatus === 'paid' || remaining <= 0;
  const installments = loan.installments || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={m(20)} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: m(10) }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {borrowerName}
          </Text>
          <Text style={styles.headerSub}>Facility #{loan._id.slice(-6).toUpperCase()}</Text>
        </View>
        <View
          style={[
            styles.statusPill,
            isClosed
              ? styles.pillClosed
              : isPendingDisbursal
              ? styles.pillPending
              : styles.pillActive,
          ]}
        >
          <Text
            style={[
              styles.statusPillText,
              isClosed
                ? styles.textClosed
                : isPendingDisbursal
                ? styles.textPending
                : styles.textActive,
            ]}
          >
            {isClosed ? 'SETTLED' : isPendingDisbursal ? 'OTP PENDING' : 'ACTIVE'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* ── 1. Facility Parameters Overview Card ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="credit-card" size={m(16)} color="#2563eb" />
            <Text style={styles.cardTitle}>Sanctioned Facility Parameters</Text>
          </View>

          <View style={styles.balanceHighlight}>
            <View>
              <Text style={styles.balanceLabel}>Remaining Debt Balance</Text>
              <Text style={styles.balanceVal}>{formatINR(remaining)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.balanceLabel}>Next Installment</Text>
              <Text style={styles.balanceEmi}>
                {formatINR(loan.monthlyEmi || loan.emiAmount || 0)}
              </Text>
            </View>
          </View>

          {/* Repayment Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Recovered: {formatINR(totalPaid)}</Text>
              <Text style={styles.progressPercent}>{progressPercent}% Recovered</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPercent}%`,
                    backgroundColor: isClosed ? '#10b981' : '#2563eb',
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.paramsGrid}>
            <View style={styles.paramItem}>
              <Text style={styles.paramLabel}>Principal Sanctioned</Text>
              <Text style={styles.paramVal}>{formatINR(principal)}</Text>
            </View>
            <View style={styles.paramItem}>
              <Text style={styles.paramLabel}>Interest Rate</Text>
              <Text style={styles.paramVal}>{loan.interestRate || 12}% p.a.</Text>
            </View>
            <View style={styles.paramItem}>
              <Text style={styles.paramLabel}>Tenure Duration</Text>
              <Text style={styles.paramVal}>{loan.tenureMonths || 12} Months</Text>
            </View>
            <View style={styles.paramItem}>
              <Text style={styles.paramLabel}>Maturity Date</Text>
              <Text style={styles.paramVal}>{formatDate(loan.loanEndDate)}</Text>
            </View>
          </View>
        </View>

        {/* ── 2. Pending Disbursal OTP Alert (if applicable) ── */}
        {isPendingDisbursal && (
          <View style={styles.otpAlertCard}>
            <View style={styles.otpAlertTop}>
              <Feather name="shield" size={m(18)} color="#d97706" />
              <View style={{ flex: 1, marginLeft: m(10) }}>
                <Text style={styles.otpAlertTitle}>Awaiting 2-Way Disbursal OTP</Text>
                <Text style={styles.otpAlertSub}>
                  Enter the borrower's 6-digit code to release sanctioned capital.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.verifyOtpBtn}
              onPress={() => setOtpModalVisible(true)}
            >
              <Text style={styles.verifyOtpBtnText}>Enter 6-Digit Disbursal OTP</Text>
              <Feather name="arrow-right" size={m(14)} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}

        {/* ── 3. Amortization Matrix & Installments ── */}
        <View style={styles.card}>
          <View style={styles.scheduleHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="calendar" size={m(16)} color="#16a34a" />
              <Text style={[styles.cardTitle, { marginLeft: m(6) }]}>
                Amortization Ledger ({installments.length} EMIs)
              </Text>
            </View>

            <TouchableOpacity
              style={styles.recalcBtn}
              onPress={handleRecalculate}
              disabled={recalculating}
            >
              {recalculating ? (
                <ActivityIndicator size="small" color="#2563eb" />
              ) : (
                <>
                  <Feather name="refresh-cw" size={m(12)} color="#2563eb" />
                  <Text style={styles.recalcText}>Sync</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {installments.length === 0 ? (
            <View style={styles.emptyScheduleBox}>
              <Feather name="calendar" size={m(32)} color="#cbd5e1" />
              <Text style={styles.emptyScheduleText}>No installment breakdown generated</Text>
            </View>
          ) : (
            installments.map((inst, index) => {
              const isPaid = inst.status === 'paid' || inst.status === 'completed';
              const isOverdue = inst.status === 'overdue';

              return (
                <View key={inst._id || index} style={styles.installmentRow}>
                  <View style={styles.instIndexCol}>
                    <Text style={styles.instIndexText}>#{index + 1}</Text>
                  </View>

                  <View style={{ flex: 1, paddingHorizontal: m(8) }}>
                    <Text style={styles.instDateText}>{formatDate(inst.dueDate)}</Text>
                    <Text style={styles.instComponentsText}>
                      Principal: {formatINR(inst.principalComponent || inst.principal || 0)} • Int:{' '}
                      {formatINR(inst.interestComponent || inst.interest || 0)}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.instAmountText}>
                      {formatINR(inst.installmentAmount || inst.amount || loan.monthlyEmi || 0)}
                    </Text>
                    <View
                      style={[
                        styles.instStatusPill,
                        isPaid
                          ? styles.instPaidPill
                          : isOverdue
                          ? styles.instOverduePill
                          : styles.instPendingPill,
                      ]}
                    >
                      <Text
                        style={[
                          styles.instStatusText,
                          isPaid
                            ? styles.instPaidText
                            : isOverdue
                            ? styles.instOverdueText
                            : styles.instPendingText,
                        ]}
                      >
                        {isPaid ? 'PAID' : isOverdue ? 'OVERDUE' : 'PENDING'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* ── 4. Borrower Entity Snapshot ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="user" size={m(16)} color="#0f172a" />
            <Text style={styles.cardTitle}>Borrower Profile</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Entity / Name</Text>
            <Text style={styles.valBold}>{borrowerName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Mobile Contact</Text>
            <Text style={styles.val}>{borrower.mobileNo || loan.mobileNumber || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email Address</Text>
            <Text style={styles.val}>{borrower.email || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>PAN Card</Text>
            <Text style={styles.val}>{borrower.panCardNumber || 'Verified'}</Text>
          </View>
        </View>
      </ScrollView>

      {/* ── Fixed Bottom Actions Bar ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.recordPaymentBtn}
          onPress={() => setPaymentModalVisible(true)}
        >
          <Feather name="plus-circle" size={m(18)} color="#ffffff" style={{ marginRight: m(8) }} />
          <Text style={styles.recordPaymentText}>Record Loan Repayment</Text>
        </TouchableOpacity>
      </View>

      {/* ── RECORD PAYMENT MODAL ── */}
      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}>
                <Feather name="credit-card" size={m(20)} color="#16a34a" />
              </View>
              <View style={{ flex: 1, marginLeft: m(10) }}>
                <Text style={styles.modalTitle}>Record Facility Repayment</Text>
                <Text style={styles.modalSub}>{borrowerName}</Text>
              </View>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <Feather name="x" size={m(20)} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Payment Amount (₹)</Text>
              <TextInput
                style={styles.inputField}
                placeholder="e.g. 25000"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
              />

              <Text style={styles.inputLabel}>Payment Mode</Text>
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
                placeholderTextColor="#94a3b8"
                value={transactionRef}
                onChangeText={setTransactionRef}
              />

              <Text style={styles.inputLabel}>Notes / Narration</Text>
              <TextInput
                style={[styles.inputField, { height: m(70), textAlignVertical: 'top' }]}
                placeholder="Optional repayment notes"
                placeholderTextColor="#94a3b8"
                value={paymentNotes}
                onChangeText={setPaymentNotes}
                multiline
              />

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setPaymentModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={handleRecordPaymentSubmit}
                  disabled={recordingPayment}
                >
                  {recordingPayment ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.modalSubmitText}>Post Payment</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── 2-WAY OTP DISBURSAL MODAL ── */}
      <DisbursalOtpModal
        visible={otpModalVisible}
        onClose={() => setOtpModalVisible(false)}
        entityId={loan._id}
        isLoan={true}
        borrowerName={borrowerName}
        amount={principal}
        onVerifiedSuccess={() => {
          fetchLoanDetails();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(16),
    paddingVertical: m(12),
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  backBtn: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: m(16), fontWeight: '800', color: '#0f172a' },
  headerSub: { fontSize: m(11), color: '#64748b', marginTop: m(1) },
  statusPill: { paddingHorizontal: m(8), paddingVertical: m(4), borderRadius: m(8) },
  pillActive: { backgroundColor: '#eff6ff' },
  textActive: { color: '#2563eb', fontSize: m(10), fontWeight: '800' },
  pillPending: { backgroundColor: '#fef3c7' },
  textPending: { color: '#b45309', fontSize: m(10), fontWeight: '800' },
  pillClosed: { backgroundColor: '#ecfdf5' },
  textClosed: { color: '#047857', fontSize: m(10), fontWeight: '800' },
  container: { flex: 1 },
  scrollContent: { padding: m(16), paddingBottom: m(110) },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: m(12), color: '#64748b', marginTop: m(10) },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: m(16),
    padding: m(16),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: m(12) },
  cardTitle: {
    fontSize: m(13),
    fontWeight: '800',
    color: '#0f172a',
    marginLeft: m(6),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceHighlight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: m(14),
    padding: m(14),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  balanceLabel: { fontSize: m(11), color: '#2563eb', fontWeight: '700' },
  balanceVal: { fontSize: m(22), fontWeight: '900', color: '#1e40af', marginTop: m(2) },
  balanceEmi: { fontSize: m(15), fontWeight: '800', color: '#1e40af', marginTop: m(2) },
  progressContainer: { marginBottom: m(14) },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: m(4) },
  progressLabel: { fontSize: m(11), color: '#64748b', fontWeight: '600' },
  progressPercent: { fontSize: m(11), fontWeight: '800', color: '#0f172a' },
  progressTrack: { height: m(6), backgroundColor: '#f1f5f9', borderRadius: m(3), overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: m(3) },
  paramsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  paramItem: { width: '48%', backgroundColor: '#f8fafc', padding: m(10), borderRadius: m(10), marginBottom: m(8) },
  paramLabel: { fontSize: m(10), color: '#64748b' },
  paramVal: { fontSize: m(13), fontWeight: '700', color: '#0f172a', marginTop: m(2) },
  otpAlertCard: {
    backgroundColor: '#fffbeb',
    borderRadius: m(16),
    padding: m(16),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  otpAlertTop: { flexDirection: 'row', alignItems: 'center', marginBottom: m(12) },
  otpAlertTitle: { fontSize: m(13), fontWeight: '800', color: '#b45309' },
  otpAlertSub: { fontSize: m(11), color: '#92400e', marginTop: m(2) },
  verifyOtpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d97706',
    paddingVertical: m(10),
    borderRadius: m(10),
  },
  verifyOtpBtnText: { color: '#ffffff', fontSize: m(12), fontWeight: '700', marginRight: m(6) },
  scheduleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(12),
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    paddingBottom: m(8),
  },
  recalcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(8),
  },
  recalcText: { fontSize: m(11), fontWeight: '700', color: '#2563eb', marginLeft: m(4) },
  installmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: m(10),
    borderBottomWidth: 1,
    borderColor: '#f8fafc',
  },
  instIndexCol: {
    width: m(32),
    height: m(32),
    borderRadius: m(8),
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instIndexText: { fontSize: m(11), fontWeight: '800', color: '#475569' },
  instDateText: { fontSize: m(12), fontWeight: '700', color: '#0f172a' },
  instComponentsText: { fontSize: m(10), color: '#64748b', marginTop: m(1) },
  instAmountText: { fontSize: m(13), fontWeight: '800', color: '#0f172a' },
  instStatusPill: { paddingHorizontal: m(6), paddingVertical: m(2), borderRadius: m(4), marginTop: m(2) },
  instPaidPill: { backgroundColor: '#ecfdf5' },
  instPaidText: { color: '#16a34a', fontSize: m(9), fontWeight: '800' },
  instPendingPill: { backgroundColor: '#fffbeb' },
  instPendingText: { color: '#d97706', fontSize: m(9), fontWeight: '800' },
  instOverduePill: { backgroundColor: '#fef2f2' },
  instOverdueText: { color: '#ef4444', fontSize: m(9), fontWeight: '800' },
  emptyScheduleBox: { alignItems: 'center', paddingVertical: m(24) },
  emptyScheduleText: { fontSize: m(12), color: '#64748b', marginTop: m(8) },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: m(8),
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  label: { fontSize: m(12), color: '#64748b' },
  val: { fontSize: m(12), color: '#0f172a', fontWeight: '600' },
  valBold: { fontSize: m(13), color: '#0f172a', fontWeight: '800' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: m(16),
    paddingVertical: m(12),
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 8,
  },
  recordPaymentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    borderRadius: m(12),
    paddingVertical: m(14),
  },
  recordPaymentText: { color: '#ffffff', fontSize: m(14), fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: m(24),
    borderTopRightRadius: m(24),
    padding: m(20),
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(16),
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    paddingBottom: m(10),
  },
  modalIconWrap: {
    width: m(36),
    height: m(36),
    borderRadius: m(10),
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: { fontSize: m(16), fontWeight: '800', color: '#0f172a' },
  modalSub: { fontSize: m(11), color: '#64748b', marginTop: m(1) },
  inputLabel: { fontSize: m(11), fontWeight: '700', color: '#334155', marginBottom: m(4) },
  inputField: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: m(10),
    paddingHorizontal: m(12),
    paddingVertical: m(10),
    fontSize: m(13),
    color: '#0f172a',
    marginBottom: m(12),
  },
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: m(8) },
  modeChip: {
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    borderRadius: m(8),
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: m(6),
    marginBottom: m(6),
  },
  activeModeChip: { backgroundColor: '#eff6ff', borderColor: '#2563eb' },
  modeText: { fontSize: m(11), color: '#64748b', fontWeight: '600' },
  activeModeText: { color: '#2563eb', fontWeight: '700' },
  modalActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: m(10) },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: m(12),
    borderRadius: m(10),
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    marginRight: m(8),
  },
  modalCancelText: { fontSize: m(12), fontWeight: '700', color: '#64748b' },
  modalSubmitBtn: {
    flex: 2,
    paddingVertical: m(12),
    borderRadius: m(10),
    backgroundColor: '#16a34a',
    alignItems: 'center',
  },
  modalSubmitText: { fontSize: m(12), fontWeight: '700', color: '#ffffff' },
});
