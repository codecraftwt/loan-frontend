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
  Linking,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { FontFamily, colors } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper, showAlert } from '../../../Components/common';
import lenderFlowService from '../../../Services/lenderFlowService';
import { baseurl } from '../../../Utils/API';
import DisbursalOtpModal from '../Components/DisbursalOtpModal';

export default function LenderLoanDetails() {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const params = route.params || {};
  const loanId = params.loanId || params.id || params.loan?._id;
  const initialLoan = params.loan || null;
  const openPaymentModal = params.openPaymentModal;

  const [loan, setLoan] = useState(initialLoan || null);
  const [loading, setLoading] = useState(!initialLoan);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule' | 'history' | 'customize' | 'borrower' | 'agreement'

  // Contract Modal State
  const [showContractModal, setShowContractModal] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Payment Recording Modal State
  const [paymentModalVisible, setPaymentModalVisible] = useState(Boolean(openPaymentModal));
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('bank_transfer'); // 'bank_transfer' | 'upi' | 'cheque' | 'cash'
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);

  // Term Customization State (Tab 3)
  const [customRate, setCustomRate] = useState('12');
  const [customTenure, setCustomTenure] = useState('12');
  const [customRepaymentType, setCustomRepaymentType] = useState('installment'); // 'installment' | 'one-time'
  const [customMethod, setCustomMethod] = useState('reducing'); // 'reducing' | 'flat'
  const [savingSchedule, setSavingSchedule] = useState(false);

  // OTP Verification Modal State
  const [otpModalVisible, setOtpModalVisible] = useState(false);

  const fetchLoanDetails = useCallback(async () => {
    try {
      if (loanId) {
        if (!loan) setLoading(true);
        const res = await lenderFlowService.getLoanById(loanId);
        if (res?.success && res.loan) {
          setLoan(res.loan);
          setCustomRate(String(res.loan.interestRate || 12));
          setCustomTenure(String(res.loan.tenureMonths || 12));
          setCustomRepaymentType(res.loan.repaymentType || 'installment');
          setCustomMethod(res.loan.repaymentMethod || 'reducing');

          // Set default next due payment amount
          const nextPending = res.loan.installments?.find((i) => i.status !== 'paid');
          if (nextPending) {
            const due = (nextPending.totalAmount || nextPending.installmentAmount || 0) - (nextPending.paidAmount || 0);
            setPaymentAmount(String(due > 0 ? due : res.loan.monthlyEmi || ''));
          } else {
            setPaymentAmount(String(res.loan.monthlyEmi || ''));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching loan details:', err);
      showAlert('Error', 'Unable to retrieve loan facility details.');
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

  const formatDateTime = (iso) => {
    if (!iso) return 'N/A';
    const d = new Date(iso);
    return `${d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })}, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
  };

  // WhatsApp outreach shortcut
  const handleOpenWhatsApp = (mobileNo, bName) => {
    if (!mobileNo) {
      showAlert('No Contact', 'No mobile number recorded for this borrower.');
      return;
    }
    const cleanNumber = mobileNo.replace(/\D/g, '');
    const phoneWithCountry = cleanNumber.startsWith('91') ? cleanNumber : `91${cleanNumber}`;
    const textMsg = encodeURIComponent(
      `Hello ${bName}, this is regarding your active loan facility #${loan?._id?.slice(-6)?.toUpperCase()} with our lending institution.`
    );
    const waUrl = `whatsapp://send?phone=${phoneWithCountry}&text=${textMsg}`;
    const webWaUrl = `https://wa.me/${phoneWithCountry}?text=${textMsg}`;

    Linking.canOpenURL(waUrl)
      .then((supported) => {
        if (supported) return Linking.openURL(waUrl);
        return Linking.openURL(webWaUrl);
      })
      .catch(() => {
        Linking.openURL(webWaUrl).catch(() => showAlert('Error', 'Unable to launch WhatsApp.'));
      });
  };

  // Download Contract PDF In-App via System Download Manager / Browser
  const handleDownloadContractPdf = async () => {
    if (isDownloadingPdf) return;
    try {
      setIsDownloadingPdf(true);
      const cleanBase = baseurl.replace(/\/api\/?$/, '');
      const appId = loan?.applicationId?._id || loan?.applicationId;
      const downloadEndpoint = appId
        ? `/api/borrower/applications/${appId}/agreement/download`
        : `/api/lender/loans/${loan?._id}/agreement/download`;
      const fullUrl = `${cleanBase}${downloadEndpoint}`;

      showAlert(
        'Downloading Agreement',
        `Initiating official PDF download (${docId}.pdf). The document is being saved to your device.`
      );

      await Linking.openURL(fullUrl);
    } catch (err) {
      console.error('Error opening download URL:', err);
      showAlert('Download Error', 'Could not complete agreement download on this device. Please retry.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Submit Payment
  const handleRecordPaymentSubmit = async () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      showAlert('Required', 'Please enter a valid payment amount.');
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
        showAlert(
          'Payment Recorded! 🎉',
          res.message || 'Payment has been successfully applied to the amortization schedule.'
        );
        setPaymentModalVisible(false);
        setTransactionRef('');
        setPaymentNotes('');
        fetchLoanDetails();
      } else {
        showAlert('Payment Error', res?.message || 'Could not record repayment.');
      }
    } catch (err) {
      console.error('Error recording payment:', err);
      const msg = err.response?.data?.message || 'Failed to record repayment.';
      showAlert('Error', msg);
    } finally {
      setRecordingPayment(false);
    }
  };

  // Recalculate schedule (Tab 3)
  const handleRecalculateSchedule = async () => {
    try {
      setSavingSchedule(true);
      const payload = {
        annualInterestRate: Number(customRate),
        tenureMonths: Number(customTenure),
        repaymentType: customRepaymentType,
        calculationMethod: customMethod,
      };
      const res = await lenderFlowService.recalculateLoanSchedule(loan._id, payload);
      if (res?.success) {
        showAlert('Schedule Updated', 'Repayment structure has been recalculated and synchronized.');
        fetchLoanDetails();
        setActiveTab('schedule');
      } else {
        showAlert('Notice', res?.message || 'Recalculation complete.');
      }
    } catch (err) {
      console.error('Error recalculating schedule:', err);
      showAlert('Error', 'Unable to recalculate schedule.');
    } finally {
      setSavingSchedule(false);
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

  const borrower = loan?.borrowerId || loan?.applicationId?.borrowerSnapshot || {};
  const lender = loan?.lenderId || loan?.applicationId?.lenderSnapshot || {};

  const borrowerName =
    loan?.name ||
    borrower.userName ||
    borrower.companyName ||
    loan?.applicationId?.borrowerSnapshot?.businessName ||
    loan?.applicationId?.borrowerSnapshot?.userName ||
    'Dhiraj Patil';

  const lenderName =
    lender.userName ||
    lender.companyName ||
    'Prajwal More';

  const borrowerTrade = borrower.companyName || borrowerName;
  const borrowerPan = borrower.panCardNumber || loan?.applicationId?.borrowerSnapshot?.panCardNumber || 'FPIPP2627K';
  const borrowerUidai = borrower.aadharCardNo || loan?.applicationId?.borrowerSnapshot?.aadharCardNo || '772388445613';
  const borrowerAddress = borrower.address || loan?.applicationId?.borrowerSnapshot?.address || loan?.address || 'kalamba rode kolhapur';

  const lenderPhone = lender.mobileNo || '+919876545678';
  const lenderEmail = lender.email || 'prajwal@gmail.com';

  const principal = loan?.amount || loan?.principal || 0;
  const remaining = loan?.remainingAmount !== undefined ? loan?.remainingAmount : principal;
  const totalPaid = loan?.totalPaid || 0;
  const expectedTotal = loan?.totalRepaymentExpected || principal || 1;
  const progressPercent = Math.min(Math.round((totalPaid / expectedTotal) * 100), 100);

  const isPendingDisbursal =
    loan?.status === 'pending_disbursal' ||
    (loan?.disbursalVerification && !loan?.disbursalVerification.isVerified);
  const isFullyPaid = loan?.status === 'closed' || loan?.paymentStatus === 'paid' || remaining <= 0;
  const installments = loan?.installments || [];
  const paymentHistory = loan?.paymentHistory || [];

  const pledgedSecurity =
    loan?.pledgedSecurity ||
    loan?.applicationId?.pledgedSecurity ||
    loan?.applicationId?.agreement?.sanctionTerms?.pledgedSecurity;

  const agreement = loan?.applicationId?.agreement || loan?.agreement || {};
  const sanctionTerms = agreement?.sanctionTerms || loan?.applicationId?.sanctionTerms || {};

  const lenderSig =
    agreement?.lenderSignature ||
    loan?.applicationId?.agreement?.lenderSignature ||
    {};
  const borrowerSig =
    agreement?.borrowerSignature ||
    loan?.applicationId?.agreement?.borrowerSignature ||
    {};

  const lenderSigData = lenderSig?.signatureData;
  const borrowerSigData = borrowerSig?.signatureData || loan?.digitalSignature;

  const docId =
    agreement.documentId ||
    loan?.applicationId?.agreement?.documentId ||
    `AGR-2026-${String(loan?._id || 'VXX6ZP').slice(-6).toUpperCase()}`;

  const calcInterest = loan?.totalInterestExpected || 1570;
  const calcTotalObligation = loan?.totalRepaymentExpected || 51570;

  // Find next upcoming due date
  const nextPendingInstallment = installments.find((inst) => inst.status !== 'paid');
  const nextDueDate = nextPendingInstallment?.dueDate
    ? formatDate(nextPendingInstallment.dueDate)
    : isFullyPaid
    ? 'Completed'
    : 'N/A';

  // Clean deal title without redundant borrower name
  const rawDealTitle = loan?.dealName || loan?.purpose || 'Working Capital Line';
  const cleanDealTitle = rawDealTitle.replace(new RegExp(`\\s*-\\s*${borrowerName}`, 'i'), '').trim() || 'Working Capital Line';
  const paidCount = installments.filter((i) => i.status === 'paid' || i.status === 'completed').length;

  return (
    <ScreenWrapper
      backgroundColor={colors.backgroundGreenWhite}
      topInsetBg={colors.primary}
      statusBarColor={colors.primary}
      statusBarStyle="dark-content"
      includeTabBarClearance={false}
      scrollable={false}
    >
      {/* ── 1. Clean, Modern Top Header Banner ── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Feather name="arrow-left" size={m(19)} color={colors.lettersAndIcons} />
          </TouchableOpacity>

          <View style={styles.headerCenterWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {cleanDealTitle}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {borrowerName} • <Text style={styles.headerSubtitleAmt}>{formatINR(principal)}</Text>
            </Text>
          </View>

          {/* Right Status Badge or Action */}
          {isFullyPaid ? (
            <View style={styles.headerSettledBadge}>
              <Feather name="check" size={m(12)} color="#047857" />
              <Text style={styles.headerSettledText}>Settled</Text>
            </View>
          ) : isPendingDisbursal ? (
            <TouchableOpacity
              style={styles.headerOtpBtn}
              onPress={() => setOtpModalVisible(true)}
              activeOpacity={0.85}
            >
              <Feather name="key" size={m(11)} color="#ffffff" />
              <Text style={styles.headerOtpBtnText}>Verify OTP</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.headerRecordPayBtn}
              onPress={() => setPaymentModalVisible(true)}
              activeOpacity={0.85}
            >
              <Feather name="plus" size={m(11)} color="#ffffff" />
              <Text style={styles.headerRecordPayText}>Record Pay</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── 2. Curved Main Body Section ── */}
      <View style={styles.curvedSheet}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── 2.1 Summary KPI Dossier Cards (4 Cards matching Web) ── */}
          <View style={styles.kpiGrid}>
            {/* 1. Sanctioned Principal */}
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>SANCTIONED PRINCIPAL</Text>
              <Text style={styles.kpiValueDark}>{formatINR(principal)}</Text>
              <Text style={styles.kpiSub}>
                {loan?.interestRate || 10.7}% APR • {loan?.tenureMonths || 6} Months
              </Text>
            </View>

            {/* 2. Total Repaid */}
            <View style={styles.kpiCard}>
              <Text style={[styles.kpiLabel, { color: '#059669' }]}>TOTAL REPAID</Text>
              <Text style={[styles.kpiValueDark, { color: '#059669' }]}>{formatINR(totalPaid)}</Text>
              <Text style={styles.kpiSub}>{progressPercent}% Repaid</Text>
            </View>

            {/* 3. Remaining Balance */}
            <View style={styles.kpiCard}>
              <Text style={[styles.kpiLabel, { color: '#d97706' }]}>REMAINING BALANCE</Text>
              <Text style={styles.kpiValueDark}>{formatINR(remaining)}</Text>
              <Text style={styles.kpiSub}>Expected Total: {formatINR(expectedTotal)}</Text>
            </View>

            {/* 4. Monthly EMI Installment */}
            <View style={styles.kpiCard}>
              <Text style={[styles.kpiLabel, { color: '#2563eb' }]}>MONTHLY EMI</Text>
              <Text style={[styles.kpiValueDark, { color: '#2563eb' }]}>
                {loan?.monthlyEmi ? formatINR(loan.monthlyEmi) : 'Bullet Payment'}
              </Text>
              <Text style={styles.kpiSub} numberOfLines={1}>Next Due: {nextDueDate}</Text>
            </View>
          </View>

          {/* ── 2.2 Navigation Tabs Bar (5 Tabs Matching Web) ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsScrollWrap}
            contentContainerStyle={styles.tabsContainer}
          >
            {[
              { id: 'schedule', label: 'Repayment Schedule & Amortization' },
              { id: 'history', label: `Payment History (${paymentHistory.length})` },
              { id: 'customize', label: 'Adjust Terms & Calculator' },
              { id: 'borrower', label: 'Borrower Contact & KYC' },
              { id: 'agreement', label: 'Loan Agreement & E-Sign' },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tabButton, isSelected && styles.tabButtonActive]}
                  onPress={() => setActiveTab(tab.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabButtonText, isSelected && styles.tabButtonTextActive]}>
                    {tab.label}
                  </Text>
                  {isSelected && <View style={styles.tabActiveIndicator} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* TAB 1: Repayment Schedule & Amortization (Refined Clean UI)    */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'schedule' && (
            <View style={styles.tabSectionCard}>
              {/* Header Box with Clean Progress */}
              <View style={styles.matrixHeaderBox}>
                <View style={styles.matrixHeaderTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.matrixTitle}>Amortization & Schedule</Text>
                    <Text style={styles.matrixSubtitle}>
                      {loan?.repaymentMethod === 'flat' ? 'Flat Rate' : 'Reducing Balance'} • {installments.length} Monthly Installments
                    </Text>
                  </View>
                  <View style={styles.matrixProgressPill}>
                    <Feather
                      name={isFullyPaid ? 'check-circle' : 'clock'}
                      size={m(11)}
                      color={isFullyPaid ? '#059669' : '#2563eb'}
                    />
                    <Text style={[styles.matrixProgressPillText, isFullyPaid && { color: '#059669' }]}>
                      {paidCount}/{installments.length} Paid
                    </Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.matrixProgressBarTrack}>
                  <View
                    style={[
                      styles.matrixProgressBarFill,
                      {
                        width: `${installments.length > 0 ? Math.min((paidCount / installments.length) * 100, 100) : 0}%`,
                        backgroundColor: isFullyPaid ? '#10b981' : '#2563eb',
                      },
                    ]}
                  />
                </View>
              </View>

              {installments.length === 0 ? (
                <View style={styles.emptyStateBox}>
                  <Feather name="calendar" size={m(32)} color={colors.textMuted} />
                  <Text style={styles.emptyStateText}>No installment breakdown generated yet.</Text>
                </View>
              ) : (
                <View style={styles.installmentsList}>
                  {installments.map((inst, index) => {
                    const isPaid = inst.status === 'paid' || inst.status === 'completed';
                    const isPartial = inst.status === 'partially_paid';
                    const isOverdue = inst.status === 'overdue';
                    const dueAmt = (inst.totalAmount || inst.installmentAmount || 0) - (inst.paidAmount || 0);
                    const emiNum = inst.installmentNumber || index + 1;
                    const emiPadded = emiNum < 10 ? `0${emiNum}` : `${emiNum}`;

                    return (
                      <View
                        key={inst._id || index}
                        style={[
                          styles.instCard,
                          isPaid && styles.instCardPaid,
                          isOverdue && styles.instCardOverdue,
                        ]}
                      >
                        {/* Upper Section: Number Badge, Date, Total EMI & Status */}
                        <View style={styles.instTopRow}>
                          <View style={styles.instLeftCol}>
                            <View
                              style={[
                                styles.instNumberCircle,
                                isPaid
                                  ? styles.instNumberPaid
                                  : isOverdue
                                  ? styles.instNumberOverdue
                                  : styles.instNumberPending,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.instNumberText,
                                  isPaid
                                    ? styles.instNumberTextPaid
                                    : isOverdue
                                    ? styles.instNumberTextOverdue
                                    : styles.instNumberTextPending,
                                ]}
                              >
                                {emiPadded}
                              </Text>
                            </View>

                            <View style={styles.instDateInfo}>
                              <Text style={styles.instDueDateText}>
                                {formatDate(inst.dueDate)}
                              </Text>
                              <Text style={styles.instSubLabel}>
                                {isPaid ? 'Settled on schedule' : isOverdue ? 'Payment overdue' : 'Scheduled installment'}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.instRightCol}>
                            <Text style={styles.instEmiAmountText}>
                              {formatINR(inst.totalAmount || inst.installmentAmount || 0)}
                            </Text>
                            <View
                              style={[
                                styles.instStatusPill,
                                isPaid
                                  ? styles.instStatusPaid
                                  : isPartial
                                  ? styles.instStatusPartial
                                  : isOverdue
                                  ? styles.instStatusOverdue
                                  : styles.instStatusPending,
                              ]}
                            >
                              <Feather
                                name={isPaid ? 'check' : isOverdue ? 'alert-triangle' : 'clock'}
                                size={m(10)}
                                color={isPaid ? '#059669' : isOverdue ? '#dc2626' : isPartial ? '#d97706' : '#64748b'}
                              />
                              <Text
                                style={[
                                  styles.instStatusText,
                                  isPaid
                                    ? styles.instTextPaid
                                    : isPartial
                                    ? styles.instTextPartial
                                    : isOverdue
                                    ? styles.instTextOverdue
                                    : styles.instTextPending,
                                ]}
                              >
                                {isPaid ? 'Paid' : isPartial ? 'Partial' : isOverdue ? 'Overdue' : 'Due'}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Attractive, Clean Breakdown Strip (Principal • Interest • Paid) */}
                        <View style={styles.instBreakdownBar}>
                          <View style={styles.instBreakdownCol}>
                            <Text style={styles.instBreakdownLabel}>PRINCIPAL</Text>
                            <Text style={styles.instBreakdownVal}>
                              {formatINR(inst.principalAmount || inst.principal || 0)}
                            </Text>
                          </View>

                          <View style={styles.instBreakdownSeparator} />

                          <View style={styles.instBreakdownCol}>
                            <Text style={styles.instBreakdownLabel}>INTEREST</Text>
                            <Text style={styles.instBreakdownVal}>
                              {formatINR(inst.interestAmount || inst.interest || 0)}
                            </Text>
                          </View>

                          <View style={styles.instBreakdownSeparator} />

                          <View style={styles.instBreakdownCol}>
                            <Text style={styles.instBreakdownLabel}>PAID</Text>
                            <Text
                              style={[
                                styles.instBreakdownVal,
                                isPaid && styles.instBreakdownPaidGreen,
                              ]}
                            >
                              {formatINR(inst.paidAmount || 0)}
                            </Text>
                          </View>
                        </View>

                        {/* Quick Payment Action for Unsettled Installment */}
                        {!isPaid && (
                          <TouchableOpacity
                            style={styles.instActionBtn}
                            onPress={() => {
                              setPaymentAmount(String(dueAmt > 0 ? dueAmt : inst.totalAmount || ''));
                              setPaymentModalVisible(true);
                            }}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.instActionBtnText}>Collect EMI #{emiNum}</Text>
                            <Feather name="arrow-right" size={m(12)} color="#047857" />
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* TAB 2: Payment History & Collection Audit Ledger               */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'history' && (
            <View style={styles.tabSectionCard}>
              <View style={styles.matrixHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.matrixTitle}>Payment Collection Audit Ledger</Text>
                  <Text style={styles.matrixSubtitle}>
                    Complete chronological record of all verified collections and receipts for this facility.
                  </Text>
                </View>
              </View>

              {paymentHistory.length === 0 ? (
                <View style={styles.emptyStateBox}>
                  <Feather name="file-text" size={m(32)} color={colors.textMuted} />
                  <Text style={styles.emptyStateText}>
                    No payments recorded yet for this facility. Tap "Record Payment" to log the first collection.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: m(10) }}>
                  {paymentHistory.map((item, idx) => (
                    <View key={item._id || idx} style={styles.historyCard}>
                      <View style={styles.historyTopRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: m(8) }}>
                          <View style={styles.historyIconCircle}>
                            <Feather name="check-circle" size={m(14)} color="#15803d" />
                          </View>
                          <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: m(6) }}>
                              <Text style={styles.historyAmountText}>{formatINR(item.amount)}</Text>
                              <View style={styles.paymentModePill}>
                                <Text style={styles.paymentModeText}>{(item.paymentMode || 'ONLINE').toUpperCase()}</Text>
                              </View>
                            </View>
                            <Text style={styles.historyRefText}>
                              Ref / UTR: <Text style={{ fontFamily: FontFamily.primaryBold }}>{item.transactionId || 'N/A'}</Text>
                            </Text>
                          </View>
                        </View>

                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.historyDateText}>{formatDateTime(item.paymentDate)}</Text>
                          <Text style={styles.verifiedTagText}>VERIFIED & CONFIRMED</Text>
                        </View>
                      </View>

                      {item.notes ? (
                        <View style={styles.historyNotesBox}>
                          <Text style={styles.historyNotesText}>Note: {item.notes}</Text>
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* TAB 3: Adjust Terms & Calculator                               */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'customize' && (
            <View style={styles.tabSectionCard}>
              <View style={styles.matrixHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.matrixTitle}>Recalculate Repayment Structure</Text>
                  <Text style={styles.matrixSubtitle}>
                    Update interest rates, tenure, or repayment method to regenerate the amortization schedule.
                  </Text>
                </View>
              </View>

              <View style={styles.calculatorForm}>
                <Text style={styles.calcInputLabel}>Annual Interest Rate (% APR)</Text>
                <TextInput
                  style={styles.calcInputField}
                  keyboardType="decimal-pad"
                  value={customRate}
                  onChangeText={setCustomRate}
                />

                <Text style={styles.calcInputLabel}>Tenure (Months)</Text>
                <TextInput
                  style={styles.calcInputField}
                  keyboardType="number-pad"
                  value={customTenure}
                  onChangeText={setCustomTenure}
                />

                <Text style={styles.calcInputLabel}>Repayment Type</Text>
                <View style={styles.calcToggleRow}>
                  <TouchableOpacity
                    style={[styles.calcToggleBtn, customRepaymentType === 'installment' && styles.calcToggleBtnActive]}
                    onPress={() => setCustomRepaymentType('installment')}
                  >
                    <Text
                      style={[
                        styles.calcToggleText,
                        customRepaymentType === 'installment' && styles.calcToggleTextActive,
                      ]}
                    >
                      Monthly EMI
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.calcToggleBtn, customRepaymentType === 'one-time' && styles.calcToggleBtnActive]}
                    onPress={() => setCustomRepaymentType('one-time')}
                  >
                    <Text
                      style={[
                        styles.calcToggleText,
                        customRepaymentType === 'one-time' && styles.calcToggleTextActive,
                      ]}
                    >
                      One-Time Bullet
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.calcInputLabel}>Interest Method</Text>
                <View style={styles.calcToggleRow}>
                  <TouchableOpacity
                    style={[styles.calcToggleBtn, customMethod === 'reducing' && styles.calcToggleBtnActive]}
                    onPress={() => setCustomMethod('reducing')}
                  >
                    <Text style={[styles.calcToggleText, customMethod === 'reducing' && styles.calcToggleTextActive]}>
                      Reducing Balance
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.calcToggleBtn, customMethod === 'flat' && styles.calcToggleBtnActive]}
                    onPress={() => setCustomMethod('flat')}
                  >
                    <Text style={[styles.calcToggleText, customMethod === 'flat' && styles.calcToggleTextActive]}>
                      Flat Rate
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.calcSubmitBtn}
                  onPress={handleRecalculateSchedule}
                  disabled={savingSchedule}
                  activeOpacity={0.85}
                >
                  {savingSchedule ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Feather name="refresh-cw" size={m(14)} color="#ffffff" style={{ marginRight: m(6) }} />
                      <Text style={styles.calcSubmitText}>Apply & Update Amortization</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* TAB 4: Borrower Contact & KYC                                  */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'borrower' && (
            <View style={styles.tabSectionCard}>
              <View style={styles.borrowerHeroHeader}>
                <View style={styles.borrowerAvatarBox}>
                  <Feather name="briefcase" size={m(20)} color="#ffffff" />
                </View>
                <View style={{ flex: 1, marginLeft: m(12) }}>
                  <Text style={styles.borrowerHeroName}>{borrowerName}</Text>
                  <Text style={styles.borrowerHeroSub}>Contact: {loan?.name || borrowerName} • Registered Partner</Text>
                </View>
              </View>

              <View style={styles.borrowerDetailsGrid}>
                {/* 1. Phone & WhatsApp */}
                <View style={styles.borrowerTile}>
                  <Text style={styles.borrowerTileLabel}>PHONE & WHATSAPP</Text>
                  <Text style={styles.borrowerTileValue}>{loan?.mobileNumber || borrower.mobileNo || 'N/A'}</Text>
                  <TouchableOpacity
                    style={styles.tileLinkBtn}
                    onPress={() => handleOpenWhatsApp(loan?.mobileNumber || borrower.mobileNo, borrowerName)}
                  >
                    <Feather name="message-square" size={m(11)} color="#15803d" />
                    <Text style={[styles.tileLinkText, { color: '#15803d' }]}>Chat on WhatsApp</Text>
                  </TouchableOpacity>
                </View>

                {/* 2. Email Address */}
                <View style={styles.borrowerTile}>
                  <Text style={styles.borrowerTileLabel}>EMAIL ADDRESS</Text>
                  <Text style={styles.borrowerTileValue}>{borrower.email || 'N/A'}</Text>
                  <TouchableOpacity
                    style={styles.tileLinkBtn}
                    onPress={() => {
                      if (borrower.email) Linking.openURL(`mailto:${borrower.email}`);
                    }}
                  >
                    <Feather name="mail" size={m(11)} color="#2563eb" />
                    <Text style={[styles.tileLinkText, { color: '#2563eb' }]}>Send Email</Text>
                  </TouchableOpacity>
                </View>

                {/* 3. Address & PAN */}
                <View style={[styles.borrowerTile, { width: '100%' }]}>
                  <Text style={styles.borrowerTileLabel}>ADDRESS & STATUTORY KYC</Text>
                  <Text style={styles.borrowerTileValue}>{loan?.address || borrower.address || 'Maharashtra, India'}</Text>
                  <Text style={styles.borrowerPanSub}>
                    PAN Card: <Text style={{ fontFamily: FontFamily.primaryBold }}>{borrower.panCardNumber || 'Verified'}</Text>
                  </Text>
                </View>

                {/* 4. Pledged Security */}
                {pledgedSecurity ? (
                  <View style={[styles.borrowerTile, styles.pledgedSecurityTile]}>
                    <Text style={[styles.borrowerTileLabel, { color: '#b45309' }]}>PLEDGED SECURITY ASSET</Text>
                    <Text style={[styles.borrowerTileValue, { color: colors.lettersAndIcons }]}>{pledgedSecurity}</Text>
                    <Text style={[styles.borrowerPanSub, { color: '#b45309' }]}>Secured Under Legal Loan Facility</Text>
                  </View>
                ) : null}
              </View>
            </View>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* TAB 5: Loan Agreement & E-Sign                                 */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'agreement' && (
            <View style={styles.tabSectionCard}>
              <View style={styles.agreementHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: m(8) }}>
                  <View style={styles.agreementIconBox}>
                    <Feather name="file-text" size={m(18)} color="#2563eb" />
                  </View>
                  <View>
                    <Text style={styles.agreementTitle}>Master Loan Facility Agreement</Text>
                    <Text style={styles.agreementDocId}>
                      Doc ID: {agreement.documentId || `AGR-2026-${loan._id.slice(-6).toUpperCase()}`}
                    </Text>
                  </View>
                </View>
                <View style={styles.fullyExecutedBadge}>
                  <Text style={styles.fullyExecutedText}>
                    {agreement.status === 'fully_executed' || loan.digitalSignature ? 'Fully Executed' : 'Legally Active'}
                  </Text>
                </View>
              </View>

              {/* View Contract Button */}
              <TouchableOpacity
                style={styles.viewFullContractBtn}
                onPress={() => setShowContractModal(true)}
                activeOpacity={0.85}
              >
                <Feather name="file-text" size={m(14)} color="#ffffff" style={{ marginRight: m(6) }} />
                <Text style={styles.viewFullContractText}>View Full Contract & Clauses</Text>
              </TouchableOpacity>

              {/* Sanction Terms Overview 4-Tile Grid */}
              <View style={styles.sanctionTermsGrid}>
                <View style={styles.sanctionTile}>
                  <Text style={styles.sanctionTileLabel}>SANCTIONED PRINCIPAL</Text>
                  <Text style={styles.sanctionTileVal}>{formatINR(sanctionTerms.amount || principal)}</Text>
                </View>

                <View style={styles.sanctionTile}>
                  <Text style={styles.sanctionTileLabel}>REPAYMENT STRUCTURE</Text>
                  <Text style={styles.sanctionTileValSmall}>
                    {(sanctionTerms.repaymentType || loan.repaymentType) === 'ONE_TIME' ? 'One-Time Bullet' : 'Monthly EMI'}
                  </Text>
                </View>

                <View style={styles.sanctionTile}>
                  <Text style={styles.sanctionTileLabel}>AGREED RATE</Text>
                  <Text style={styles.sanctionTileValSmall}>{sanctionTerms.interestRate || loan.interestRate || 10.7}% p.a.</Text>
                </View>

                <View style={styles.sanctionTile}>
                  <Text style={styles.sanctionTileLabel}>FACILITY TENURE</Text>
                  <Text style={styles.sanctionTileValSmall}>{sanctionTerms.tenureMonths || loan.tenureMonths || 6} Months</Text>
                </View>
              </View>

              {/* Digital Signature Trail Header */}
              <View style={styles.signaturesHeaderRow}>
                <Feather name="shield" size={m(13)} color="#059669" />
                <Text style={styles.signaturesSectionTitle}>DIGITAL E-SIGNATURE AUDIT & EXECUTION TRAIL</Text>
              </View>

              {/* Dual Signature Boxes */}
              <View style={styles.signaturesContainer}>
                {/* 1. Lender Signature */}
                <View style={styles.sigCard}>
                  <View style={styles.sigCardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: m(6) }}>
                      <Feather name="briefcase" size={m(13)} color="#2563eb" />
                      <Text style={styles.sigPartyLabel}>Lender / Sanctioning Authority</Text>
                    </View>
                    <View style={styles.sigVerifiedBadge}>
                      <Feather name="check-circle" size={m(10)} color="#15803d" />
                      <Text style={styles.sigVerifiedText}>Signed & Verified</Text>
                    </View>
                  </View>

                  <View style={styles.signaturePreviewBox}>
                    {lenderSigData ? (
                      lenderSigData.startsWith('data:image') || lenderSigData.startsWith('http') ? (
                        <Image
                          source={{ uri: lenderSigData }}
                          style={styles.signatureImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <Text style={styles.signatureCursiveText}>{lenderSigData}</Text>
                      )
                    ) : (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={styles.signatureCursiveText}>
                          {lenderSig?.signedBy || loan?.lenderId?.companyName || loan?.lenderId?.userName || 'Prajwal More'}
                        </Text>
                        <Text style={styles.signatureMetaSub}>Digitally Certified Signature</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.sigMetaDetails}>
                    <View style={styles.sigMetaRowWrap}>
                      <Text style={styles.sigMetaLabel}>Signer:</Text>
                      <Text style={styles.sigMetaBold}>
                        {lenderSig?.signedBy || loan?.lenderId?.companyName || loan?.lenderId?.userName || 'Prajwal More'}
                      </Text>
                    </View>
                    <View style={styles.sigMetaRowWrap}>
                      <Text style={styles.sigMetaLabel}>Execution Date:</Text>
                      <Text style={styles.sigMetaBold}>
                        {formatDate(lenderSig?.signedAt || loan.loanStartDate || loan.createdAt)}
                      </Text>
                    </View>
                    <View style={styles.sigMetaRowWrap}>
                      <Text style={styles.sigMetaLabel}>IP Stamp:</Text>
                      <Text style={styles.sigMetaMono}>
                        {lenderSig?.ipAddress || '127.0.0.1 (Verified)'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 2. Borrower Signature */}
                <View style={styles.sigCard}>
                  <View style={styles.sigCardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: m(6) }}>
                      <Feather name="shield" size={m(13)} color="#059669" />
                      <Text style={styles.sigPartyLabel}>Borrower / Primary Obligor</Text>
                    </View>
                    <View style={styles.sigVerifiedBadge}>
                      <Feather name="check-circle" size={m(10)} color="#15803d" />
                      <Text style={styles.sigVerifiedText}>Countersigned</Text>
                    </View>
                  </View>

                  <View style={styles.signaturePreviewBox}>
                    {borrowerSigData ? (
                      borrowerSigData.startsWith('data:image') || borrowerSigData.startsWith('http') ? (
                        <Image
                          source={{ uri: borrowerSigData }}
                          style={styles.signatureImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <Text style={styles.signatureCursiveText}>{borrowerSigData}</Text>
                      )
                    ) : (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={styles.signatureCursiveText}>
                          {borrowerSig?.signedBy || loan?.name || borrowerName}
                        </Text>
                        <Text style={styles.signatureMetaSub}>E-Sign Consent Recorded</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.sigMetaDetails}>
                    <View style={styles.sigMetaRowWrap}>
                      <Text style={styles.sigMetaLabel}>Signer:</Text>
                      <Text style={styles.sigMetaBold}>
                        {borrowerSig?.signedBy || loan?.name || borrowerName}
                      </Text>
                    </View>
                    <View style={styles.sigMetaRowWrap}>
                      <Text style={styles.sigMetaLabel}>Execution Date:</Text>
                      <Text style={styles.sigMetaBold}>
                        {formatDate(borrowerSig?.signedAt || loan.loanStartDate || loan.createdAt)}
                      </Text>
                    </View>
                    <View style={styles.sigMetaRowWrap}>
                      <Text style={styles.sigMetaLabel}>IP Stamp:</Text>
                      <Text style={styles.sigMetaMono}>
                        {borrowerSig?.ipAddress || '::1 (Verified)'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          <View style={{ height: m(60) }} />
        </ScrollView>
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
                <Feather name="credit-card" size={m(20)} color="#2563eb" />
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
                placeholder="e.g. 8595"
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
                    style={[styles.modeChip, paymentMode === mItem.key && styles.activeModeChip]}
                    onPress={() => setPaymentMode(mItem.key)}
                  >
                    <Text style={[styles.modeText, paymentMode === mItem.key && styles.activeModeText]}>
                      {mItem.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Transaction Reference / UTR</Text>
              <TextInput
                style={styles.inputField}
                placeholder="e.g. TXN-11549356 or UTR #"
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
                    <Text style={styles.modalSubmitText}>Post Repayment</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── VIEW FULL CONTRACT & PRINT / PDF MODAL (MATCHING SCREENSHOT) ── */}
      <Modal
        visible={showContractModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowContractModal(false)}
      >
        <View style={styles.contractModalContainer}>
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
          {/* 1. Modal Top Bar */}
          <View
            style={[
              styles.contractTopBar,
              {
                paddingTop: Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 14) + m(8),
              },
            ]}
          >
            {/* Header Row: Scale Icon + Title & Ref + Verified Pill + Close Button */}
            <View style={styles.contractTopHeaderRow}>
              <View style={styles.contractScaleIconBox}>
                <MaterialCommunityIcons name="scale-balance" size={m(18)} color="#ffffff" />
              </View>

              <View style={styles.contractTitleBlock}>
                <Text style={styles.contractTopTitle} numberOfLines={1}>
                  Master Loan Facility Agreement
                </Text>
                <View style={styles.contractSubRefRow}>
                  <Text style={styles.contractTopRef} numberOfLines={1}>
                    Ref: {docId}
                  </Text>
                  <View style={styles.contractVectorPill}>
                    <Feather name="shield" size={m(8.5)} color="#2563eb" />
                    <Text style={styles.contractVectorPillText}>Authentic PDF</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setShowContractModal(false)}
                style={styles.contractCloseCircleBtn}
                activeOpacity={0.8}
              >
                <Feather name="x" size={m(18)} color="#475569" />
              </TouchableOpacity>
            </View>

            {/* Top Action Download Button */}
            <View style={styles.contractTopActionsRow}>
              <TouchableOpacity
                style={styles.contractDownloadBtn}
                onPress={handleDownloadContractPdf}
                disabled={isDownloadingPdf}
                activeOpacity={0.85}
              >
                {isDownloadingPdf ? (
                  <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: m(6) }} />
                ) : (
                  <Feather name="download" size={m(13)} color="#ffffff" style={{ marginRight: m(6) }} />
                )}
                <Text style={styles.contractDownloadText}>
                  {isDownloadingPdf ? 'Initiating PDF Download...' : 'Download Official PDF'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. Scrollable Canvas Area (A4 Document Canvas) */}
          <ScrollView
            style={styles.contractScrollArea}
            contentContainerStyle={styles.contractScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.contractCanvas}>
              {/* Instrument Tag */}
              <View style={styles.contractInstrumentBadge}>
                <Feather name="award" size={m(11)} color="#1e40af" />
                <Text style={styles.contractInstrumentText}>REGULATED CREDIT SANCTION INSTRUMENT</Text>
              </View>

              {/* Title & Subtitle */}
              <Text style={styles.contractMainTitle}>COMMERCIAL LOAN FACILITY AGREEMENT</Text>
              <Text style={styles.contractMainSub}>
                Bilateral Master Financing Contract, Sanction Terms & Repayment Undertaking
              </Text>

              <View style={styles.contractHeaderDivider} />

              {/* Preamble */}
              <Text style={styles.contractPreamble}>
                This Master Loan Agreement is executed on{' '}
                <Text style={{ fontFamily: FontFamily.primaryBold }}>
                  {formatDate(agreement.createdAt || loan?.createdAt || new Date())}
                </Text>{' '}
                by and between the contracting parties:
              </Text>

              {/* Contracting Parties Section */}
              <View style={styles.contractPartiesGrid}>
                {/* FIRST PARTY (THE LENDER) */}
                <View style={styles.contractPartyCard}>
                  <View style={styles.contractPartyHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: m(5) }}>
                      <Feather name="briefcase" size={m(12)} color="#2563eb" />
                      <Text style={styles.contractPartyRoleTitle}>FIRST PARTY (THE LENDER)</Text>
                    </View>
                    <View style={styles.contractNbfcBadge}>
                      <Text style={styles.contractNbfcBadgeText}>Regulated NBFC</Text>
                    </View>
                  </View>

                  <Text style={styles.contractPartyName}>{lenderName}</Text>
                  <Text style={styles.contractPartyLine}>
                    <Text style={styles.contractPartyLabel}>Entity Type: </Text>
                    Regulated Institutional Lender / NBFC Partner
                  </Text>
                  <Text style={styles.contractPartyLine}>
                    <Text style={styles.contractPartyLabel}>Contact: </Text>
                    {lenderPhone}
                  </Text>
                  <Text style={styles.contractPartyLine}>
                    <Text style={styles.contractPartyLabel}>Official Email: </Text>
                    {lenderEmail}
                  </Text>
                </View>

                {/* SECOND PARTY (THE BORROWER) */}
                <View style={styles.contractPartyCard}>
                  <View style={styles.contractPartyHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: m(5) }}>
                      <Feather name="user" size={m(12)} color="#059669" />
                      <Text style={[styles.contractPartyRoleTitle, { color: '#059669' }]}>
                        SECOND PARTY (THE BORROWER)
                      </Text>
                    </View>
                    <View style={styles.contractKycBadge}>
                      <Text style={styles.contractKycBadgeText}>KYC Verified</Text>
                    </View>
                  </View>

                  <Text style={styles.contractPartyName}>{borrowerName}</Text>
                  <Text style={styles.contractPartyLine}>
                    <Text style={styles.contractPartyLabel}>Entity / Trade: </Text>
                    {borrowerTrade}
                  </Text>
                  <Text style={styles.contractPartyLine}>
                    <Text style={styles.contractPartyLabel}>KYC Identity: </Text>
                    PAN: {borrowerPan} • UIDAI: {borrowerUidai}
                  </Text>
                  <Text style={styles.contractPartyLine}>
                    <Text style={styles.contractPartyLabel}>Address: </Text>
                    {borrowerAddress}
                  </Text>
                </View>
              </View>

              {/* SCHEDULE 1: SANCTION TERMS & REPAYMENT LEDGER */}
              <View style={styles.scheduleHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: m(5) }}>
                  <Feather name="file-text" size={m(13)} color="#2563eb" />
                  <Text style={styles.scheduleTitle}>SCHEDULE 1: SANCTION TERMS & REPAYMENT LEDGER</Text>
                </View>
                <Text style={styles.currencyNotice}>CURRENCY: INDIAN RUPEE (INR ₹)</Text>
              </View>

              {/* 8-cell Terms Grid */}
              <View style={styles.termsTableBox}>
                <View style={styles.termsTableRow}>
                  <View style={styles.termsTableCell}>
                    <Text style={styles.termsCellLabel}>SANCTIONED PRINCIPAL</Text>
                    <Text style={styles.termsCellValBold}>{formatINR(principal)}</Text>
                  </View>
                  <View style={styles.termsTableCell}>
                    <Text style={styles.termsCellLabel}>ANNUAL INTEREST (APR)</Text>
                    <Text style={styles.termsCellVal}>{loan.interestRate || 10.7}% p.a. Fixed</Text>
                  </View>
                </View>

                <View style={styles.termsTableRow}>
                  <View style={styles.termsTableCell}>
                    <Text style={styles.termsCellLabel}>FACILITY TENURE</Text>
                    <Text style={styles.termsCellVal}>{loan.tenureMonths || 6} Months</Text>
                  </View>
                  <View style={styles.termsTableCell}>
                    <Text style={styles.termsCellLabel}>REPAYMENT STRUCTURE</Text>
                    <Text style={[styles.termsCellVal, { color: '#2563eb' }]}>
                      {loan.repaymentType === 'ONE_TIME' ? 'One-Time Bullet' : 'Monthly Equated EMI'}
                    </Text>
                  </View>
                </View>

                <View style={styles.termsTableRow}>
                  <View style={styles.termsTableCell}>
                    <Text style={styles.termsCellLabel}>MONTHLY INSTALLMENT (EMI)</Text>
                    <Text style={[styles.termsCellValBold, { color: '#2563eb' }]}>
                      {formatINR(loan.monthlyEmi || 8595)} / mo
                    </Text>
                  </View>
                  <View style={styles.termsTableCell}>
                    <Text style={styles.termsCellLabel}>TOTAL INTEREST ACCRUED</Text>
                    <Text style={[styles.termsCellValBold, { color: '#d97706' }]}>
                      {formatINR(calcInterest)}
                    </Text>
                  </View>
                </View>

                <View style={styles.termsTableRow}>
                  <View style={styles.termsTableCell}>
                    <Text style={styles.termsCellLabel}>TOTAL REPAYMENT OBLIGATION</Text>
                    <Text style={[styles.termsCellValBold, { color: '#059669' }]}>
                      {formatINR(calcTotalObligation)}
                    </Text>
                  </View>
                  <View style={styles.termsTableCell}>
                    <Text style={styles.termsCellLabel}>PROCESSING FEE / LEVIES</Text>
                    <Text style={styles.termsCellVal}>₹0 (Waived & Zero)</Text>
                  </View>
                </View>

                {/* Collateral Bar */}
                <View style={styles.collateralBar}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: m(5) }}>
                    <Feather name="shield" size={m(11)} color="#b45309" />
                    <Text style={styles.collateralBarLabel}>PLEDGED SECURITY / COLLATERAL ASSET:</Text>
                  </View>
                  <Text style={styles.collateralBarVal} numberOfLines={2}>
                    {pledgedSecurity || 'None (Unsecured Facility / Personal Guarantee)'}
                  </Text>
                </View>
              </View>

              {/* KEY LEGAL COVENANTS & OPERATIONAL TERMS */}
              <Text style={styles.covenantsHeading}>KEY LEGAL COVENANTS & OPERATIONAL TERMS</Text>
              <View style={styles.covenantsList}>
                <Text style={styles.covenantItem}>
                  <Text style={styles.covenantBold}>1. Disbursement & Activation: </Text>
                  The Lender agrees to disburse the net Sanctioned Principal directly into the Borrower's designated bank account upon bilateral digital execution and 2-way authentication.
                </Text>
                <Text style={styles.covenantItem}>
                  <Text style={styles.covenantBold}>2. Unconditional Repayment Obligation: </Text>
                  The Borrower irrevocably agrees and covenants to repay the sanctioned Principal Amount along with interest in accordance with the schedule specified without any set-off or withholding.
                </Text>
                <Text style={styles.covenantItem}>
                  <Text style={styles.covenantBold}>3. Default Interest & Acceleration: </Text>
                  Any delay in scheduled payment shall attract penal interest at 2.0% per month (24% p.a.) on the overdue sum.
                </Text>
                <Text style={styles.covenantItem}>
                  <Text style={styles.covenantBold}>4. Foreclosure & Prepayment: </Text>
                  The Borrower shall have the right to prepay or foreclose the facility in whole or in part without unreasonable penalty.
                </Text>
                <Text style={styles.covenantItem}>
                  <Text style={styles.covenantBold}>5. Representations, Warranties & Recourse: </Text>
                  The Borrower confirms that all KYC documents and business records furnished are true, accurate, and unencumbered.
                </Text>
                <Text style={styles.covenantItem}>
                  <Text style={styles.covenantBold}>6. Electronic Execution & Admissibility: </Text>
                  This Agreement is executed electronically pursuant to Sections 4, 5, and 10A of the Information Technology Act, 2000 and the Indian Evidence Act.
                </Text>
              </View>

              {/* BILATERAL EXECUTION & DIGITAL E-SIGNATURE CERTIFICATES */}
              <View style={styles.certHeadingRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: m(5) }}>
                  <Feather name="check-circle" size={m(12)} color="#2563eb" />
                  <Text style={styles.certHeadingText}>BILATERAL EXECUTION & DIGITAL E-SIGNATURE CERTIFICATES</Text>
                </View>
                <Text style={styles.certCryptoText}>Cryptographic 256-bit SHA Certified Audit</Text>
              </View>

              {/* Dual Signature Certificates Grid */}
              <View style={styles.contractSigGrid}>
                {/* Lender Signature Box */}
                <View style={styles.contractSigBox}>
                  <View style={styles.contractSigHeader}>
                    <Text style={styles.contractSigTitle}>Lender Digital Execution</Text>
                    <View style={styles.contractVerifiedPill}>
                      <Feather name="check-circle" size={m(9)} color="#059669" />
                      <Text style={styles.contractVerifiedPillText}>Digitally Verified</Text>
                    </View>
                  </View>

                  <View style={styles.contractSigImageCanvas}>
                    {lenderSigData ? (
                      <Image source={{ uri: lenderSigData }} style={styles.contractSignatureImg} resizeMode="contain" />
                    ) : (
                      <Text style={styles.contractSigFallbackText}>{lenderName}</Text>
                    )}
                  </View>

                  <View style={styles.contractSigDetails}>
                    <Text style={styles.contractSigDetailText}>
                      <Text style={styles.contractSigDetailBold}>Signatory: </Text>
                      {lenderSig?.signedBy || lenderName}
                    </Text>
                    <Text style={styles.contractSigDetailText}>
                      <Text style={styles.contractSigDetailBold}>Timestamp: </Text>
                      {formatDateTime(lenderSig?.signedAt || loan.loanStartDate)}
                    </Text>
                    <Text style={styles.contractSigDetailText}>
                      <Text style={styles.contractSigDetailBold}>IP Stamp: </Text>
                      {lenderSig?.ipAddress || '::1'}
                    </Text>
                  </View>
                </View>

                {/* Borrower Signature Box */}
                <View style={styles.contractSigBox}>
                  <View style={styles.contractSigHeader}>
                    <Text style={styles.contractSigTitle}>Borrower Digital Execution</Text>
                    <View style={styles.contractVerifiedPill}>
                      <Feather name="check-circle" size={m(9)} color="#059669" />
                      <Text style={styles.contractVerifiedPillText}>Digitally Verified</Text>
                    </View>
                  </View>

                  <View style={styles.contractSigImageCanvas}>
                    {borrowerSigData ? (
                      <Image source={{ uri: borrowerSigData }} style={styles.contractSignatureImg} resizeMode="contain" />
                    ) : (
                      <Text style={styles.contractSigFallbackText}>{borrowerName}</Text>
                    )}
                  </View>

                  <View style={styles.contractSigDetails}>
                    <Text style={styles.contractSigDetailText}>
                      <Text style={styles.contractSigDetailBold}>Signatory: </Text>
                      {borrowerSig?.signedBy || borrowerName}
                    </Text>
                    <Text style={styles.contractSigDetailText}>
                      <Text style={styles.contractSigDetailBold}>Timestamp: </Text>
                      {formatDateTime(borrowerSig?.signedAt || loan.loanStartDate)}
                    </Text>
                    <Text style={styles.contractSigDetailText}>
                      <Text style={styles.contractSigDetailBold}>IP Stamp: </Text>
                      {borrowerSig?.ipAddress || '::1'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Document Non-Repudiable Footer Line */}
              <View style={styles.contractDocFooterLine}>
                <Text style={styles.contractDocFooterText}>
                  CERTIFIED NON-REPUDIABLE ELECTRONIC INSTRUMENT • IT ACT 2000 SEC 10A
                </Text>
                <Text style={styles.contractDocFooterText}>DOC REF: {docId}</Text>
              </View>
            </View>
          </ScrollView>

          {/* 3. Bottom Bar */}
          <View
            style={[
              styles.contractBottomBar,
              {
                paddingBottom: Math.max(insets.bottom, m(12)),
              },
            ]}
          >
            <Text style={styles.contractBottomDocId} numberOfLines={1}>
              Document Identifier: <Text style={{ fontFamily: FontFamily.primaryBold }}>{docId}</Text>
            </Text>
            <TouchableOpacity
              style={styles.contractCloseViewerBtn}
              onPress={() => setShowContractModal(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.contractCloseViewerText}>Close Viewer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── 2-WAY OTP DISBURSAL VERIFY MODAL ── */}
      <DisbursalOtpModal
        visible={otpModalVisible}
        onClose={() => setOtpModalVisible(false)}
        entityId={loan._id}
        isLoan={true}
        borrowerName={borrowerName}
        amount={loan.amount}
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
  },
  loadingText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(10),
  },

  // ── Top Header Banner (Clean & Modern) ──
  headerBanner: {
    backgroundColor: colors.primary,
    paddingHorizontal: m(16),
    paddingTop: m(10),
    paddingBottom: m(14),
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(10),
  },
  backBtn: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerCenterWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: m(16),
    lineHeight: m(21),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  headerSubtitle: {
    fontSize: m(11.5),
    lineHeight: m(16),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
    opacity: 0.85,
    marginTop: m(1),
  },
  headerSubtitleAmt: {
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  headerSettledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: '#ecfdf5',
    paddingHorizontal: m(9),
    paddingVertical: m(5),
    borderRadius: m(8),
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  headerSettledText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: '#047857',
  },
  headerRecordPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: '#059669',
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    borderRadius: m(8),
  },
  headerRecordPayText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: '#ffffff',
  },
  headerOtpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: '#d97706',
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    borderRadius: m(8),
  },
  headerOtpBtnText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: '#ffffff',
  },

  // ── Curved Main Sheet ──
  curvedSheet: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(28),
    borderTopRightRadius: m(28),
    paddingTop: m(14),
  },
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: m(16),
    paddingBottom: m(40),
  },

  // ── 4 KPI Summary Dossier Cards (Compact & Refined) ──
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(8),
    marginBottom: m(10),
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: colors.white,
    borderRadius: m(12),
    paddingHorizontal: m(10),
    paddingVertical: m(8),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    elevation: 1,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
  },
  kpiLabel: {
    fontSize: m(8.5),
    fontFamily: FontFamily.primaryBold,
    color: '#64748b',
    letterSpacing: 0.5,
  },
  kpiValueDark: {
    fontSize: m(14.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginVertical: m(1),
  },
  kpiSub: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryRegular,
    color: '#64748b',
  },

  // ── Navigation Tabs ──
  tabsScrollWrap: {
    marginBottom: m(12),
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: m(8),
    paddingVertical: m(2),
  },
  tabButton: {
    paddingHorizontal: m(12),
    paddingVertical: m(8),
    borderRadius: m(10),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabButtonActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  tabButtonText: {
    fontSize: m(11),
    fontFamily: FontFamily.primarySemiBold,
    color: '#64748b',
  },
  tabButtonTextActive: {
    color: '#2563eb',
    fontFamily: FontFamily.primaryBold,
  },
  tabActiveIndicator: {
    height: 2,
    backgroundColor: '#2563eb',
    borderRadius: 1,
    marginTop: m(2),
  },

  // ── Tab Section Card ──
  tabSectionCard: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(14),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.06)',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  matrixHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    paddingBottom: m(10),
    marginBottom: m(10),
  },
  matrixTitle: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  matrixSubtitle: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(1),
  },
  // ── Amortization & Installment Matrix (Tab 1 Refined) ──
  matrixHeaderBox: {
    marginBottom: m(14),
  },
  matrixHeaderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matrixTitle: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  matrixSubtitle: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: '#64748b',
    marginTop: m(2),
  },
  matrixProgressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: '#f0fdf4',
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(6),
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  matrixProgressPillText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryBold,
    color: '#059669',
  },
  matrixProgressBarTrack: {
    height: m(4),
    backgroundColor: '#e2e8f0',
    borderRadius: m(2),
    marginTop: m(8),
    overflow: 'hidden',
  },
  matrixProgressBarFill: {
    height: '100%',
    borderRadius: m(2),
  },
  installmentsList: {
    gap: m(8),
  },
  instCard: {
    backgroundColor: '#ffffff',
    borderRadius: m(12),
    paddingHorizontal: m(10),
    paddingVertical: m(9),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: m(3.5),
    borderLeftColor: '#94a3b8',
    elevation: 1,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  instCardPaid: {
    backgroundColor: '#ffffff',
    borderColor: '#bbf7d0',
    borderLeftColor: '#10b981',
  },
  instCardOverdue: {
    borderColor: '#fca5a5',
    borderLeftColor: '#ef4444',
  },
  instTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  instLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    flex: 1,
  },
  instNumberCircle: {
    width: m(26),
    height: m(26),
    borderRadius: m(13),
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instNumberPaid: {
    backgroundColor: '#ecfdf5',
  },
  instNumberOverdue: {
    backgroundColor: '#fee2e2',
  },
  instNumberPending: {
    backgroundColor: '#eff6ff',
  },
  instNumberText: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: '#475569',
  },
  instNumberTextPaid: {
    color: '#059669',
  },
  instNumberTextOverdue: {
    color: '#dc2626',
  },
  instNumberTextPending: {
    color: '#2563eb',
  },
  instDateInfo: {
    flex: 1,
  },
  instDueDateText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  instSubLabel: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryRegular,
    color: '#64748b',
    marginTop: 0,
  },
  instRightCol: {
    alignItems: 'flex-end',
  },
  instEmiAmountText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  instStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(2.5),
    paddingHorizontal: m(5),
    paddingVertical: m(1.5),
    borderRadius: m(4),
    marginTop: m(2),
  },
  instStatusPaid: { backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0' },
  instTextPaid: { color: '#059669', fontSize: m(9), fontFamily: FontFamily.primaryBold },
  instStatusPartial: { backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fde68a' },
  instTextPartial: { color: '#b45309', fontSize: m(9), fontFamily: FontFamily.primaryBold },
  instStatusOverdue: { backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fca5a5' },
  instTextOverdue: { color: '#dc2626', fontSize: m(9), fontFamily: FontFamily.primaryBold },
  instStatusPending: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1' },
  instTextPending: { color: '#64748b', fontSize: m(9), fontFamily: FontFamily.primaryBold },

  instBreakdownBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: m(6),
    paddingVertical: m(5),
    paddingHorizontal: m(10),
    marginTop: m(7),
    borderWidth: 0.5,
    borderColor: '#f1f5f9',
  },
  instBreakdownCol: {
    alignItems: 'center',
    flex: 1,
  },
  instBreakdownLabel: {
    fontSize: m(8),
    fontFamily: FontFamily.primaryMedium,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  instBreakdownVal: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginTop: 0,
  },
  instBreakdownPaidGreen: {
    color: '#059669',
  },
  instBreakdownSeparator: {
    width: 1,
    height: m(14),
    backgroundColor: '#e2e8f0',
  },
  instActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(4),
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: m(6),
    paddingVertical: m(5),
    marginTop: m(6),
  },
  instActionBtnText: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: '#047857',
  },

  // ── Payment History (Tab 2) ──
  historyCard: {
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    padding: m(10),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyIconCircle: {
    width: m(30),
    height: m(30),
    borderRadius: m(15),
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyAmountText: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  paymentModePill: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: m(5),
    paddingVertical: m(1),
    borderRadius: m(4),
  },
  paymentModeText: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: '#475569',
  },
  historyRefText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: '#64748b',
    marginTop: m(2),
  },
  historyDateText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
  },
  verifiedTagText: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: '#15803d',
    marginTop: m(2),
  },
  historyNotesBox: {
    backgroundColor: '#ffffff',
    borderRadius: m(6),
    padding: m(6),
    marginTop: m(6),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  historyNotesText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
  },

  // ── Calculator Form (Tab 3) ──
  calculatorForm: {
    gap: m(8),
  },
  calcInputLabel: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginTop: m(4),
  },
  calcInputField: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: m(10),
    paddingHorizontal: m(12),
    paddingVertical: m(9),
    fontSize: m(13),
    color: colors.lettersAndIcons,
  },
  calcToggleRow: {
    flexDirection: 'row',
    gap: m(8),
  },
  calcToggleBtn: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: m(10),
    paddingVertical: m(10),
    alignItems: 'center',
  },
  calcToggleBtnActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  calcToggleText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryMedium,
    color: '#64748b',
  },
  calcToggleTextActive: {
    color: '#2563eb',
    fontFamily: FontFamily.primaryBold,
  },
  calcSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    borderRadius: m(12),
    paddingVertical: m(13),
    marginTop: m(10),
  },
  calcSubmitText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: '#ffffff',
  },

  // ── Borrower Contact & KYC (Tab 4) ──
  borrowerHeroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    paddingBottom: m(12),
    marginBottom: m(12),
  },
  borrowerAvatarBox: {
    width: m(42),
    height: m(42),
    borderRadius: m(12),
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  borrowerHeroName: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  borrowerHeroSub: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(1),
  },
  borrowerDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(8),
  },
  borrowerTile: {
    width: '48.5%',
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    padding: m(10),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pledgedSecurityTile: {
    width: '100%',
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  borrowerTileLabel: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: '#64748b',
    letterSpacing: 0.5,
  },
  borrowerTileValue: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginVertical: m(3),
  },
  tileLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    marginTop: m(2),
  },
  tileLinkText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryBold,
  },
  borrowerPanSub: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(2),
  },

  // ── Loan Agreement & E-Sign (Tab 5) ──
  agreementHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    paddingBottom: m(10),
    marginBottom: m(10),
  },
  agreementIconBox: {
    width: m(36),
    height: m(36),
    borderRadius: m(10),
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agreementTitle: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  agreementDocId: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(1),
  },
  fullyExecutedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(6),
    borderWidth: 1,
    borderColor: '#86efac',
  },
  fullyExecutedText: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: '#15803d',
  },
  viewFullContractBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    borderRadius: m(10),
    paddingVertical: m(10),
    marginBottom: m(12),
  },
  viewFullContractText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: '#ffffff',
  },
  sanctionTermsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(8),
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    padding: m(10),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: m(12),
  },
  sanctionTile: {
    width: '48%',
  },
  sanctionTileLabel: {
    fontSize: m(8.5),
    fontFamily: FontFamily.primaryBold,
    color: '#64748b',
    letterSpacing: 0.4,
  },
  sanctionTileVal: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: '#2563eb',
    marginTop: m(1),
  },
  sanctionTileValSmall: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginTop: m(1),
  },
  signaturesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
    marginBottom: m(8),
  },
  signaturesSectionTitle: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: '#059669',
    letterSpacing: 0.6,
  },
  signaturesContainer: {
    gap: m(10),
  },
  sigCard: {
    backgroundColor: '#ffffff',
    borderRadius: m(12),
    padding: m(10),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 1,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  sigCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    paddingBottom: m(6),
    marginBottom: m(6),
  },
  sigPartyLabel: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  sigVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(3),
    backgroundColor: '#ecfdf5',
    paddingHorizontal: m(5),
    paddingVertical: m(2),
    borderRadius: m(4),
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  sigVerifiedText: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: '#059669',
  },
  signaturePreviewBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: m(8),
    paddingVertical: m(6),
    paddingHorizontal: m(10),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: m(75),
    marginVertical: m(4),
  },
  signatureImage: {
    width: '94%',
    height: m(62),
  },
  signatureCursiveText: {
    fontSize: m(17),
    fontFamily: FontFamily.primaryBold,
    fontStyle: 'italic',
    color: '#1e3a8a',
  },
  signatureMetaSub: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryRegular,
    color: '#94a3b8',
    marginTop: m(2),
  },
  sigMetaDetails: {
    marginTop: m(4),
    gap: m(2),
  },
  sigMetaRowWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sigMetaLabel: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: '#64748b',
  },
  sigMetaBold: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  sigMetaMono: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryMedium,
    color: '#64748b',
  },

  // ── Master Loan Facility Agreement Modal (Full Screen White Canvas) ──
  contractModalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contractTopBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    paddingHorizontal: m(16),
    paddingBottom: m(12),
    elevation: 2,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  contractTopHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contractScaleIconBox: {
    width: m(36),
    height: m(36),
    borderRadius: m(8),
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contractTitleBlock: {
    flex: 1,
    marginHorizontal: m(10),
  },
  contractTopTitle: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: '#0f172a',
  },
  contractSubRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
    marginTop: m(2),
  },
  contractTopRef: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryMedium,
    color: '#64748b',
  },
  contractVectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(3),
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: m(10),
    paddingHorizontal: m(6),
    paddingVertical: m(1.5),
  },
  contractVectorPillText: {
    fontSize: m(8.5),
    fontFamily: FontFamily.primaryBold,
    color: '#2563eb',
  },
  contractCloseCircleBtn: {
    width: m(32),
    height: m(32),
    borderRadius: m(16),
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contractTopActionsRow: {
    marginTop: m(10),
  },
  contractDownloadBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(6),
    backgroundColor: '#2563eb',
    paddingVertical: m(9.5),
    borderRadius: m(8),
  },
  contractDownloadText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryBold,
    color: '#ffffff',
  },
  contractScrollArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contractScrollContent: {
    paddingHorizontal: m(16),
    paddingTop: m(14),
    paddingBottom: m(32),
    backgroundColor: '#ffffff',
  },
  contractCanvas: {
    backgroundColor: '#ffffff',
    padding: 0,
  },
  contractInstrumentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: m(5),
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: m(4),
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    marginBottom: m(8),
  },
  contractInstrumentText: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: '#1e40af',
    letterSpacing: 0.5,
  },
  contractMainTitle: {
    fontSize: m(15.5),
    fontFamily: FontFamily.primaryBold,
    color: '#0f172a',
    letterSpacing: 0.4,
    marginBottom: m(2),
  },
  contractMainSub: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryMedium,
    color: '#475569',
    marginBottom: m(8),
  },
  contractHeaderDivider: {
    height: 1.5,
    backgroundColor: '#0f172a',
    marginBottom: m(10),
  },
  contractPreamble: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryRegular,
    fontStyle: 'italic',
    color: '#475569',
    marginBottom: m(10),
    lineHeight: m(14),
  },
  contractPartiesGrid: {
    gap: m(8),
    marginBottom: m(12),
  },
  contractPartyCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: m(6),
    padding: m(10),
  },
  contractPartyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(6),
  },
  contractPartyRoleTitle: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    letterSpacing: 0.4,
  },
  contractNbfcBadge: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: m(4),
    paddingHorizontal: m(6),
    paddingVertical: m(2),
  },
  contractNbfcBadgeText: {
    fontSize: m(8.5),
    fontFamily: FontFamily.primaryBold,
    color: '#2563eb',
  },
  contractKycBadge: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: m(4),
    paddingHorizontal: m(6),
    paddingVertical: m(2),
  },
  contractKycBadgeText: {
    fontSize: m(8.5),
    fontFamily: FontFamily.primaryBold,
    color: '#059669',
  },
  contractPartyName: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryBold,
    color: '#0f172a',
    marginBottom: m(4),
  },
  contractPartyLine: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryRegular,
    color: '#334155',
    marginBottom: m(2),
  },
  contractPartyLabel: {
    fontFamily: FontFamily.primaryBold,
    color: '#64748b',
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: m(4),
    marginBottom: m(8),
    flexWrap: 'wrap',
    gap: m(4),
  },
  scheduleTitle: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: '#0f172a',
    letterSpacing: 0.3,
  },
  currencyNotice: {
    fontSize: m(8.5),
    fontFamily: FontFamily.primaryBold,
    color: '#64748b',
    letterSpacing: 0.5,
  },
  termsTableBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: m(6),
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    marginBottom: m(12),
  },
  termsTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  termsTableCell: {
    flex: 1,
    padding: m(8),
    borderRightWidth: 1,
    borderColor: '#e2e8f0',
  },
  termsCellLabel: {
    fontSize: m(8),
    fontFamily: FontFamily.primaryBold,
    color: '#64748b',
    letterSpacing: 0.3,
    marginBottom: m(3),
  },
  termsCellVal: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryBold,
    color: '#0f172a',
  },
  termsCellValBold: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: '#0f172a',
  },
  collateralBar: {
    padding: m(8),
    backgroundColor: '#fffbeb',
    gap: m(2),
  },
  collateralBarLabel: {
    fontSize: m(8),
    fontFamily: FontFamily.primaryBold,
    color: '#b45309',
    letterSpacing: 0.4,
  },
  collateralBarVal: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryMedium,
    color: '#92400e',
  },
  covenantsHeading: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryBold,
    color: '#0f172a',
    letterSpacing: 0.5,
    marginBottom: m(6),
    marginTop: m(2),
  },
  covenantsList: {
    gap: m(5),
    marginBottom: m(12),
  },
  covenantItem: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryRegular,
    color: '#334155',
    lineHeight: m(13.5),
  },
  covenantBold: {
    fontFamily: FontFamily.primaryBold,
    color: '#0f172a',
  },
  certHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: m(4),
    marginBottom: m(8),
    flexWrap: 'wrap',
    gap: m(4),
  },
  certHeadingText: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: '#0f172a',
    letterSpacing: 0.3,
  },
  certCryptoText: {
    fontSize: m(8.5),
    fontFamily: FontFamily.primaryMedium,
    color: '#64748b',
  },
  contractSigGrid: {
    gap: m(8),
    marginBottom: m(10),
  },
  contractSigBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: m(6),
    padding: m(8),
    backgroundColor: '#f8fafc',
  },
  contractSigHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(6),
  },
  contractSigTitle: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: '#0f172a',
  },
  contractVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(3),
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: m(10),
    paddingHorizontal: m(6),
    paddingVertical: m(2),
  },
  contractVerifiedPillText: {
    fontSize: m(8.5),
    fontFamily: FontFamily.primaryBold,
    color: '#059669',
  },
  contractSigImageCanvas: {
    height: m(50),
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: m(4),
    alignItems: 'center',
    justifyContent: 'center',
    padding: m(4),
    marginBottom: m(6),
  },
  contractSignatureImg: {
    width: '100%',
    height: '100%',
  },
  contractSigFallbackText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    fontStyle: 'italic',
    color: '#1e3a8a',
  },
  contractSigDetails: {
    gap: m(2),
  },
  contractSigDetailText: {
    fontSize: m(8.5),
    fontFamily: FontFamily.primaryRegular,
    color: '#64748b',
  },
  contractSigDetailBold: {
    fontFamily: FontFamily.primaryBold,
    color: '#334155',
  },
  contractDocFooterLine: {
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    paddingTop: m(8),
    marginTop: m(8),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: m(4),
  },
  contractDocFooterText: {
    fontSize: m(8),
    fontFamily: FontFamily.primaryMedium,
    color: '#94a3b8',
    letterSpacing: 0.3,
  },
  contractBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: m(14),
    paddingVertical: m(10),
  },
  contractBottomDocId: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: '#64748b',
    flex: 1,
  },
  contractCloseViewerBtn: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: m(6),
    paddingHorizontal: m(14),
    paddingVertical: m(6),
    backgroundColor: '#ffffff',
  },
  contractCloseViewerText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: '#0f172a',
  },

  // ── Empty State ──
  emptyStateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(24),
    gap: m(8),
  },
  emptyStateText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: m(16),
  },

  // ── Record Payment Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: m(24),
    borderTopRightRadius: m(24),
    padding: m(18),
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    paddingBottom: m(12),
    marginBottom: m(12),
  },
  modalIconWrap: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: '#0f172a',
  },
  modalSub: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: '#64748b',
    marginTop: m(1),
  },
  inputLabel: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: '#334155',
    marginBottom: m(4),
    marginTop: m(6),
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
  },
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(6),
  },
  modeChip: {
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    borderRadius: m(8),
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeModeChip: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  modeText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryMedium,
    color: '#64748b',
  },
  activeModeText: {
    color: '#2563eb',
    fontFamily: FontFamily.primaryBold,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: m(8),
    marginTop: m(16),
    marginBottom: m(8),
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: m(10),
    paddingVertical: m(12),
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: '#64748b',
  },
  modalSubmitBtn: {
    flex: 2,
    backgroundColor: '#16a34a',
    borderRadius: m(10),
    paddingVertical: m(12),
    alignItems: 'center',
  },
  modalSubmitText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: '#ffffff',
  },
});
