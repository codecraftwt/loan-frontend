import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { FontFamily, colors } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper } from '../../../Components/common';
import lenderFlowService from '../../../Services/lenderFlowService';
import DisbursalOtpModal from '../Components/DisbursalOtpModal';

export default function LenderLoanDetails() {
  const route = useRoute();
  const navigation = useNavigation();
  const { loanId, loan: initialLoan, openPaymentModal } = route.params || {};

  const [loan, setLoan] = useState(initialLoan || null);
  const [loading, setLoading] = useState(!initialLoan);
  const [refreshing, setRefreshing] = useState(false);

  // Payment Recording Modal State
  const [paymentModalVisible, setPaymentModalVisible] = useState(Boolean(openPaymentModal));
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
        if (!loan) setLoading(true);
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
  }, [loanId, loan]);

  useEffect(() => {
    fetchLoanDetails();
  }, [loanId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLoanDetails();
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

  // WhatsApp outreach shortcut
  const handleOpenWhatsApp = (mobileNo, borrowerName, amount) => {
    if (!mobileNo) {
      Alert.alert('No Contact', 'No mobile number recorded for this borrower.');
      return;
    }
    const cleanNumber = mobileNo.replace(/\D/g, '');
    const phoneWithCountry = cleanNumber.startsWith('91') ? cleanNumber : `91${cleanNumber}`;
    const textMsg = encodeURIComponent(
      `Hello ${borrowerName}, this is regarding your active loan facility #${loan?._id?.slice(-6)?.toUpperCase()} with our lending institution.`
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
        Alert.alert('Amortization Synchronized', 'Schedule has been synchronized with live debt balances.');
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

  if (loading && !loan) {
    return (
      <ScreenWrapper
        backgroundColor={colors.backgroundGreenWhite}
        topInsetBg={colors.primary}
        statusBarColor={colors.primary}
        statusBarStyle="dark-content"
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.lettersAndIcons} />
          <Text style={styles.loadingText}>Loading facility parameters & amortization ledger...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const borrower = loan?.borrowerId || {};
  const borrowerName = borrower.companyName || borrower.userName || loan?.name || 'Commercial Borrower';
  const principal = loan?.principal || loan?.amount || 0;
  const remaining = loan?.remainingAmount !== undefined ? loan?.remainingAmount : principal;
  const totalPaid = loan?.totalPaid || 0;
  const totalRepayable = loan?.totalRepaymentExpected || principal || 1;
  const progressPercent = Math.min(Math.round((totalPaid / totalRepayable) * 100), 100);

  const isPendingDisbursal =
    loan?.status === 'pending_disbursal' ||
    (loan?.disbursalVerification && !loan?.disbursalVerification.isVerified);
  const isClosed = loan?.status === 'closed' || loan?.paymentStatus === 'paid' || remaining <= 0;
  const installments = loan?.installments || [];
  const hasOverdue = installments.some((inst) => inst.status === 'overdue');

  return (
    <ScreenWrapper
      backgroundColor={colors.backgroundGreenWhite}
      topInsetBg={colors.primary}
      statusBarColor={colors.primary}
      statusBarStyle="dark-content"
      includeTabBarClearance={false}
      scrollable={false}
    >
      {/* ── 1. Top Green Header Banner ── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={m(18)} color={colors.lettersAndIcons} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.facilityTag}>COMMERCIAL FACILITY</Text>
            <Text style={styles.borrowerNameHeader} numberOfLines={1}>
              {borrowerName}
            </Text>
            <Text style={styles.facilityIdSub}>
              ID: #{loan?._id?.slice(-8)?.toUpperCase()}
            </Text>
          </View>

          {/* Status Badge */}
          <View
            style={[
              styles.statusPill,
              isClosed
                ? styles.pillClosed
                : isPendingDisbursal
                ? styles.pillPending
                : hasOverdue
                ? styles.pillOverdue
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
                  : hasOverdue
                  ? styles.textOverdue
                  : styles.textActive,
              ]}
            >
              {isClosed ? 'CLOSED' : isPendingDisbursal ? 'OTP PENDING' : hasOverdue ? 'OVERDUE' : 'ACTIVE'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── 2. Curved Main Body Section ── */}
      <View style={styles.curvedSheet}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── 2.1 Facility Parameters Overview Card ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconCircle}>
                <Feather name="pie-chart" size={m(15)} color={colors.white} />
              </View>
              <Text style={styles.cardTitle}>Debt Exposure Parameters</Text>
            </View>

            {/* Balance Highlight Box */}
            <View style={styles.balanceHighlight}>
              <View style={{ flex: 1 }}>
                <Text style={styles.balanceLabel}>Remaining Debt Balance</Text>
                <Text style={styles.balanceVal}>{formatINR(remaining)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.balanceLabel}>Next Installment</Text>
                <Text style={styles.balanceEmi}>
                  {formatINR(loan?.monthlyEmi || loan?.emiAmount || 0)}
                </Text>
              </View>
            </View>

            {/* Repayment Progress Track */}
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>
                  Recovered: {formatINR(totalPaid)} of {formatINR(totalRepayable)}
                </Text>
                <Text style={styles.progressPercent}>{progressPercent}% Recovered</Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progressPercent}%`,
                      backgroundColor: isClosed
                        ? '#10b981'
                        : hasOverdue
                        ? '#ef4444'
                        : colors.oceanBlueButton,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Parameters 2x2 Grid */}
            <View style={styles.paramsGrid}>
              <View style={styles.paramItem}>
                <Text style={styles.paramLabel}>Principal Sanctioned</Text>
                <Text style={styles.paramVal}>{formatINR(principal)}</Text>
              </View>
              <View style={styles.paramItem}>
                <Text style={styles.paramLabel}>Interest Rate</Text>
                <Text style={styles.paramVal}>{loan?.interestRate || 12}% p.a.</Text>
              </View>
              <View style={styles.paramItem}>
                <Text style={styles.paramLabel}>Tenure Duration</Text>
                <Text style={styles.paramVal}>{loan?.tenureMonths || 12} Months</Text>
              </View>
              <View style={styles.paramItem}>
                <Text style={styles.paramLabel}>Maturity Date</Text>
                <Text style={styles.paramVal}>{formatDate(loan?.loanEndDate)}</Text>
              </View>
            </View>
          </View>

          {/* ── 2.2 Pending Disbursal OTP Alert (if applicable) ── */}
          {isPendingDisbursal && (
            <View style={styles.otpAlertCard}>
              <View style={styles.otpAlertTop}>
                <Feather name="shield" size={m(18)} color="#d97706" />
                <View style={{ flex: 1, marginLeft: m(10) }}>
                  <Text style={styles.otpAlertTitle}>Awaiting 2-Way Disbursal OTP</Text>
                  <Text style={styles.otpAlertSub}>
                    Enter the borrower's 6-digit verification code to disburse sanctioned capital.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.verifyOtpBtn}
                onPress={() => setOtpModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.verifyOtpBtnText}>Enter 6-Digit Disbursal OTP</Text>
                <Feather name="arrow-right" size={m(14)} color={colors.white} />
              </TouchableOpacity>
            </View>
          )}

          {/* ── 2.3 Amortization Ledger & Installments ── */}
          <View style={styles.card}>
            <View style={styles.scheduleHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.cardIconCircle, { backgroundColor: '#10b981' }]}>
                  <Feather name="calendar" size={m(14)} color={colors.white} />
                </View>
                <Text style={styles.cardTitle}>
                  Amortization Ledger ({installments.length} EMIs)
                </Text>
              </View>

              <TouchableOpacity
                style={styles.recalcBtn}
                onPress={handleRecalculate}
                disabled={recalculating}
                activeOpacity={0.8}
              >
                {recalculating ? (
                  <ActivityIndicator size="small" color={colors.oceanBlueButton} />
                ) : (
                  <>
                    <Feather name="refresh-cw" size={m(12)} color={colors.oceanBlueButton} />
                    <Text style={styles.recalcText}>Sync</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {installments.length === 0 ? (
              <View style={styles.emptyScheduleBox}>
                <Feather name="calendar" size={m(32)} color={colors.textMuted} />
                <Text style={styles.emptyScheduleText}>No installment breakdown generated yet.</Text>
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
                        {formatINR(inst.installmentAmount || inst.amount || loan?.monthlyEmi || 0)}
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

          {/* ── 2.4 Borrower Entity Snapshot ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: colors.lettersAndIcons }]}>
                <Feather name="user" size={m(14)} color={colors.white} />
              </View>
              <Text style={styles.cardTitle}>Borrower Dossier</Text>
            </View>

            <View style={styles.dossierRow}>
              <Text style={styles.dossierLabel}>Entity / Name</Text>
              <Text style={styles.dossierValBold}>{borrowerName}</Text>
            </View>
            <View style={styles.dossierRow}>
              <Text style={styles.dossierLabel}>Mobile Contact</Text>
              <Text style={styles.dossierVal}>{borrower.mobileNo || loan?.mobileNumber || 'N/A'}</Text>
            </View>
            <View style={styles.dossierRow}>
              <Text style={styles.dossierLabel}>Email Address</Text>
              <Text style={styles.dossierVal}>{borrower.email || 'N/A'}</Text>
            </View>
            <View style={styles.dossierRow}>
              <Text style={styles.dossierLabel}>PAN / KYC</Text>
              <Text style={styles.dossierVal}>{borrower.panCardNumber || 'Verified'}</Text>
            </View>

            {/* Direct WhatsApp Outreach */}
            <TouchableOpacity
              style={styles.dossierWhatsAppBtn}
              onPress={() =>
                handleOpenWhatsApp(
                  borrower.mobileNo || loan?.mobileNumber,
                  borrowerName,
                  principal
                )
              }
              activeOpacity={0.8}
            >
              <Feather name="message-circle" size={m(14)} color="#15803d" />
              <Text style={styles.dossierWhatsAppText}>Open WhatsApp Discussion</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* ── Fixed Bottom Actions Bar ── */}
        <View style={styles.bottomBar}>
          {!isClosed ? (
            <TouchableOpacity
              style={styles.recordPaymentBtn}
              onPress={() => setPaymentModalVisible(true)}
              activeOpacity={0.85}
            >
              <Feather name="plus-circle" size={m(18)} color={colors.white} style={{ marginRight: m(8) }} />
              <Text style={styles.recordPaymentText}>Record Loan Repayment</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.closedBarNotice}>
              <Feather name="check-circle" size={m(16)} color="#10b981" />
              <Text style={styles.closedBarText}>Facility Fully Repaid & Closed</Text>
            </View>
          )}
        </View>
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
                <Feather name="credit-card" size={m(20)} color={colors.oceanBlueButton} />
              </View>
              <View style={{ flex: 1, marginLeft: m(10) }}>
                <Text style={styles.modalTitle}>Record Facility Repayment</Text>
                <Text style={styles.modalSub}>{borrowerName}</Text>
              </View>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
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

              <Text style={styles.inputLabel}>Narration / Notes</Text>
              <TextInput
                style={[styles.inputField, { height: m(65), textAlignVertical: 'top' }]}
                placeholder="Optional repayment notes"
                placeholderTextColor={colors.textMuted}
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

      {/* ── 2-WAY OTP DISBURSAL MODAL ── */}
      <DisbursalOtpModal
        visible={otpModalVisible}
        onClose={() => setOtpModalVisible(false)}
        entityId={loan?._id}
        isLoan={true}
        borrowerName={borrowerName}
        amount={principal}
        onVerifiedSuccess={() => {
          fetchLoanDetails();
        }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: m(20),
  },
  loadingText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
    marginTop: m(10),
    textAlign: 'center',
  },

  // Header Banner
  headerBanner: {
    backgroundColor: colors.primary,
    paddingHorizontal: m(16),
    paddingTop: m(10),
    paddingBottom: m(18),
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: m(12),
  },
  facilityTag: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: 0.8,
    opacity: 0.85,
  },
  borrowerNameHeader: {
    fontSize: m(17),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginTop: m(1),
  },
  facilityIdSub: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
    opacity: 0.8,
  },
  statusPill: {
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(8),
  },
  pillActive: {
    backgroundColor: colors.white,
  },
  textActive: {
    color: colors.lettersAndIcons,
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
  },
  pillPending: {
    backgroundColor: '#fef3c7',
  },
  textPending: {
    color: '#b45309',
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
  },
  pillOverdue: {
    backgroundColor: '#fee2e2',
  },
  textOverdue: {
    color: '#dc2626',
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
  },
  pillClosed: {
    backgroundColor: '#f1f5f9',
  },
  textClosed: {
    color: '#64748b',
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
  },

  // Curved Main Sheet
  curvedSheet: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(28),
    borderTopRightRadius: m(28),
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: m(16),
    paddingBottom: m(90),
  },

  // Card Styles
  card: {
    backgroundColor: colors.white,
    borderRadius: m(18),
    padding: m(16),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.06)',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(12),
  },
  cardIconCircle: {
    width: m(28),
    height: m(28),
    borderRadius: m(14),
    backgroundColor: colors.oceanBlueButton,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(8),
  },
  cardTitle: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: 0.3,
  },

  // Balance Highlight
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
  balanceLabel: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryMedium,
    color: colors.oceanBlueButton,
  },
  balanceVal: {
    fontSize: m(20),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginTop: m(2),
  },
  balanceEmi: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.oceanBlueButton,
    marginTop: m(2),
  },

  // Repayment Progress Track
  progressContainer: {
    marginBottom: m(14),
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: m(4),
  },
  progressLabel: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
  },
  progressPercent: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
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

  // Parameters Grid
  paramsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  paramItem: {
    width: '48.5%',
    backgroundColor: '#f8fafc',
    padding: m(10),
    borderRadius: m(10),
    marginBottom: m(8),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  paramLabel: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
  },
  paramVal: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginTop: m(2),
  },

  // Disbursal OTP Card
  otpAlertCard: {
    backgroundColor: '#fffbeb',
    borderRadius: m(16),
    padding: m(16),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  otpAlertTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(10),
  },
  otpAlertTitle: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: '#92400e',
  },
  otpAlertSub: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: '#b45309',
    marginTop: m(1),
  },
  verifyOtpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d97706',
    borderRadius: m(10),
    paddingVertical: m(10),
    gap: m(6),
  },
  verifyOtpBtnText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },

  // Schedule Ledger
  scheduleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(12),
  },
  recalcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: m(10),
    paddingVertical: m(5),
    borderRadius: m(8),
    gap: m(4),
  },
  recalcText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: colors.oceanBlueButton,
  },
  emptyScheduleBox: {
    alignItems: 'center',
    paddingVertical: m(24),
  },
  emptyScheduleText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(6),
  },
  installmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: m(10),
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  instIndexCol: {
    width: m(28),
    height: m(28),
    borderRadius: m(14),
    backgroundColor: colors.backgroundGreenWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instIndexText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  instDateText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  instComponentsText: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(1),
  },
  instAmountText: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  instStatusPill: {
    paddingHorizontal: m(6),
    paddingVertical: m(2),
    borderRadius: m(6),
    marginTop: m(2),
  },
  instPaidPill: {
    backgroundColor: '#dcfce7',
  },
  instPaidText: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: '#15803d',
  },
  instOverduePill: {
    backgroundColor: '#fee2e2',
  },
  instOverdueText: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: '#dc2626',
  },
  instPendingPill: {
    backgroundColor: '#f1f5f9',
  },
  instPendingText: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: '#64748b',
  },

  // Borrower Dossier Card
  dossierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: m(6),
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  dossierLabel: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
  },
  dossierVal: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  dossierValBold: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  dossierWhatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: m(10),
    paddingVertical: m(8),
    marginTop: m(12),
    gap: m(6),
  },
  dossierWhatsAppText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primarySemiBold,
    color: '#15803d',
  },

  // Fixed Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: m(16),
    paddingVertical: m(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(9, 48, 48, 0.08)',
    elevation: 8,
  },
  recordPaymentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.oceanBlueButton,
    borderRadius: m(12),
    paddingVertical: m(13),
  },
  recordPaymentText: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  closedBarNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(10),
    gap: m(6),
  },
  closedBarText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: '#10b981',
  },

  // Modal
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
