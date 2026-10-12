import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { m } from 'walstar-rn-responsive';
import { colors } from '../../../constants';
import borrowerFlowService from '../../../Services/borrowerFlowService';

export default function BorrowerLoanDetails() {
  const navigation = useNavigation();
  const route = useRoute();
  const loanId = route.params?.id || route.params?.loan?._id;

  const [loan, setLoan] = useState(route.params?.loan || null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(!route.params?.loan);
  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule' | 'payments'
  const [copiedOtp, setCopiedOtp] = useState(false);

  const fetchLoanDetails = useCallback(async () => {
    if (!loanId) return;
    try {
      setLoading(true);
      const res = await borrowerFlowService.getLoanById(loanId);
      if (res?.success && res.loan) {
        setLoan(res.loan);
        if (res.summary) {
          setSummary(res.summary);
        }
      }
    } catch (err) {
      console.error('Error fetching loan details:', err);
    } finally {
      setLoading(false);
    }
  }, [loanId]);

  useFocusEffect(
    useCallback(() => {
      fetchLoanDetails();
    }, [fetchLoanDetails])
  );

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

  const copyOtpToClipboard = (otp) => {
    setCopiedOtp(true);
    Alert.alert(
      'Disbursal Verification OTP',
      `Your 6-digit Disbursal Code is:\n\n${otp}\n\nShare this code with your lender to execute funds transfer.`,
      [{ text: 'OK', onPress: () => setCopiedOtp(false) }]
    );
  };

  const openLenderChat = (mobileNo) => {
    if (!mobileNo) {
      Alert.alert('Contact', 'Lender phone number is not listed.');
      return;
    }
    const cleanNumber = mobileNo.replace(/\D/g, '');
    const url = `whatsapp://send?phone=91${cleanNumber}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(`tel:${cleanNumber}`);
        }
      })
      .catch(() => Linking.openURL(`tel:${cleanNumber}`));
  };

  if (loading && !loan) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading facility parameters...</Text>
      </SafeAreaView>
    );
  }

  if (!loan) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Feather name="alert-circle" size={m(40)} color="#94A3B8" />
        <Text style={styles.errorTitle}>Loan Record Not Found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Return to Loans</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const lender = loan.lenderId || {};
  const totalRepayable = Number(loan.totalRepaymentExpected || loan.amount || 0);
  const totalPaid = Number(loan.totalPaid || 0);
  const paidPercent =
    totalRepayable > 0 ? Math.min(100, Math.round((totalPaid / totalRepayable) * 100)) : 0;

  const isPendingOtp =
    loan.disbursalVerification?.otp && !loan.disbursalVerification?.isVerified;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backIcon} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={m(22)} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {loan.purpose || loan.dealName || 'Credit Facility'}
        </Text>
        {lender.mobileNo ? (
          <TouchableOpacity
            style={styles.chatIconBtn}
            onPress={() => openLenderChat(lender.mobileNo)}
          >
            <Feather name="message-square" size={m(18)} color="#16A34A" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: m(22) }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Facility Overview Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.lenderIcon}>
              <Feather name="shield" size={m(18)} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.facilityTitle}>
                {loan.purpose || loan.dealName || 'Commercial Line'}
              </Text>
              <Text style={styles.lenderSub}>
                Sanctioned by: <Text style={styles.boldText}>{lender.companyName || lender.userName}</Text>
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>
                {loan.status === 'active' ? 'Active' : 'Closed'}
              </Text>
            </View>
          </View>

          {/* 6 Macro Metrics Grid */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.mLabel}>Principal</Text>
              <Text style={[styles.mVal, { color: '#2563EB' }]}>{formatINR(loan.amount)}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.mLabel}>Monthly EMI</Text>
              <Text style={styles.mVal}>{formatINR(loan.monthlyEmi)}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.mLabel}>Interest Rate</Text>
              <Text style={styles.mVal}>{loan.interestRate || 12}% APR</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.mLabel}>Total Expected</Text>
              <Text style={styles.mVal}>{formatINR(totalRepayable)}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.mLabel}>Total Repaid</Text>
              <Text style={[styles.mVal, { color: '#16A34A' }]}>{formatINR(totalPaid)}</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.mLabel}>Remaining</Text>
              <Text style={[styles.mVal, { color: '#4F46E5' }]}>
                {formatINR(loan.remainingAmount)}
              </Text>
            </View>
          </View>

          {/* Repayment Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressTextRow}>
              <Text style={styles.progressDesc}>
                {summary?.paidInstallments || 0} of {summary?.totalInstallments || loan.tenureMonths || 0} Paid ({summary?.remainingInstallments || 0} remaining)
              </Text>
              <Text style={styles.progressPercent}>{paidPercent}% Cleared</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${paidPercent}%` }]} />
            </View>
          </View>

          {/* Pledged Security info */}
          {loan.pledgedSecurity ? (
            <View style={styles.securityBox}>
              <Feather name="shield" size={m(12)} color="#D97706" />
              <Text style={styles.securityText}>Pledged Collateral: {loan.pledgedSecurity}</Text>
            </View>
          ) : null}
        </View>

        {/* Disbursal OTP Code Box (if not yet verified) */}
        {isPendingOtp ? (
          <View style={styles.otpCard}>
            <View style={styles.otpHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: m(6) }}>
                <Feather name="lock" size={m(14)} color="#D97706" />
                <Text style={styles.otpTitle}>DISBURSAL VERIFICATION CODE</Text>
              </View>
              <Text style={styles.actionReqBadge}>Action Required</Text>
            </View>
            <Text style={styles.otpDesc}>
              Share this 6-digit code with <Text style={styles.boldText}>{lender.companyName || lender.userName}</Text> to verify agreement and release funds.
            </Text>
            <View style={styles.otpCodeRow}>
              <Text style={styles.otpCodeText}>{loan.disbursalVerification.otp}</Text>
              <TouchableOpacity
                style={styles.copyOtpBtn}
                onPress={() => copyOtpToClipboard(loan.disbursalVerification.otp)}
              >
                <Feather name="copy" size={m(14)} color="#D97706" />
                <Text style={styles.copyOtpBtnText}>View / Copy</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Dual Tab Switcher: Schedule vs Payments */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.switcherBtn, activeTab === 'schedule' && styles.activeSwitcherBtn]}
            onPress={() => setActiveTab('schedule')}
          >
            <Feather
              name="calendar"
              size={m(13)}
              color={activeTab === 'schedule' ? colors.white : '#64748B'}
            />
            <Text
              style={[
                styles.switcherBtnText,
                activeTab === 'schedule' && styles.activeSwitcherBtnText,
              ]}
            >
              Amortization Matrix ({loan.installments?.length || 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.switcherBtn, activeTab === 'payments' && styles.activeSwitcherBtn]}
            onPress={() => setActiveTab('payments')}
          >
            <Feather
              name="file-text"
              size={m(13)}
              color={activeTab === 'payments' ? colors.white : '#64748B'}
            />
            <Text
              style={[
                styles.switcherBtnText,
                activeTab === 'payments' && styles.activeSwitcherBtnText,
              ]}
            >
              Payment Ledger ({loan.payments?.length || 0})
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: Amortization / EMI Schedule List */}
        {activeTab === 'schedule' ? (
          <View style={styles.tabContent}>
            {loan.installments && loan.installments.length > 0 ? (
              loan.installments.map((inst) => {
                const isPaid = inst.status === 'paid';
                const isOverdue = inst.status === 'overdue';

                return (
                  <View
                    key={inst.installmentNumber}
                    style={[
                      styles.installmentCard,
                      isPaid && styles.paidInstCard,
                      isOverdue && styles.overdueInstCard,
                    ]}
                  >
                    <View style={styles.instCardTop}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: m(8) }}>
                        <View style={styles.instNumBadge}>
                          <Text style={styles.instNumText}>#{inst.installmentNumber}</Text>
                        </View>
                        <View>
                          <Text style={styles.instDueDate}>Due {formatDate(inst.dueDate)}</Text>
                          <Text style={styles.instClosingBal}>
                            Closing Bal: {formatINR(inst.remainingPrincipal)}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.instStatusBadge,
                          isPaid && { backgroundColor: '#DCFCE7' },
                          isOverdue && { backgroundColor: '#FEE2E2' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.instStatusText,
                            isPaid && { color: '#16A34A' },
                            isOverdue && { color: '#DC2626' },
                          ]}
                        >
                          {isPaid ? 'PAID' : isOverdue ? 'OVERDUE' : 'UPCOMING'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.instBreakdownRow}>
                      <View>
                        <Text style={styles.instBLabel}>Monthly EMI</Text>
                        <Text style={styles.instBVal}>{formatINR(inst.emiAmount)}</Text>
                      </View>
                      <View>
                        <Text style={styles.instBLabel}>Principal</Text>
                        <Text style={[styles.instBVal, { color: '#2563EB' }]}>
                          {formatINR(inst.principalComponent)}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.instBLabel}>Interest</Text>
                        <Text style={styles.instBVal}>
                          {formatINR(inst.interestComponent)}
                        </Text>
                      </View>
                    </View>

                    {isPaid ? (
                      <View style={styles.paidInfoRow}>
                        <Feather name="check-circle" size={m(11)} color="#16A34A" />
                        <Text style={styles.paidInfoText}>
                          Settled on {formatDate(inst.paidAt)}{' '}
                          {inst.paymentRef ? `· Ref: ${inst.paymentRef}` : ''}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyBoxText}>No installment schedule generated.</Text>
              </View>
            )}
          </View>
        ) : (
          /* TAB 2: Payment Verification Ledger */
          <View style={styles.tabContent}>
            {loan.payments && loan.payments.length > 0 ? (
              loan.payments.map((p, idx) => (
                <View key={idx} style={styles.paymentCard}>
                  <View style={styles.paymentCardHeader}>
                    <View>
                      <Text style={styles.paymentDateText}>
                        {formatDate(p.paymentDate || p.createdAt)}
                      </Text>
                      <Text style={styles.paymentModeText}>
                        Mode: {p.paymentMode || 'Bank Transfer'}
                      </Text>
                    </View>
                    <Text style={styles.paymentAmountText}>{formatINR(p.amount)}</Text>
                  </View>

                  <View style={styles.paymentDetailsRow}>
                    <Text style={styles.paymentRefText}>
                      UTR / Ref: <Text style={{ fontFamily: 'monospace' }}>{p.paymentReference || 'N/A'}</Text>
                    </Text>
                    <View style={styles.verifiedTag}>
                      <Feather name="check" size={m(10)} color="#16A34A" />
                      <Text style={styles.verifiedTagText}>Acknowledged</Text>
                    </View>
                  </View>

                  {p.notes ? (
                    <Text style={styles.paymentNotesText}>Note: {p.notes}</Text>
                  ) : null}
                </View>
              ))
            ) : (
              <View style={styles.emptyBox}>
                <Feather name="receipt" size={m(32)} color="#94A3B8" />
                <Text style={styles.emptyBoxTitle}>No Payments Recorded Yet</Text>
                <Text style={styles.emptyBoxSub}>
                  When monthly repayments are made and acknowledged by your lender, they will appear in this ledger.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Sticky Action Bar: Make Repayment */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.payBtn}
          onPress={() => navigation.navigate('MakePayment', { loan })}
        >
          <Feather name="credit-card" size={m(16)} color={colors.white} />
          <Text style={styles.payBtnText}>Make EMI Repayment</Text>
        </TouchableOpacity>
      </View>
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
    padding: m(20),
  },
  loadingText: {
    fontSize: m(13),
    color: '#64748B',
    marginTop: m(10),
  },
  errorTitle: {
    fontSize: m(15),
    fontWeight: '700',
    color: '#0F172A',
    marginTop: m(10),
  },
  backBtn: {
    marginTop: m(12),
    backgroundColor: '#2563EB',
    paddingHorizontal: m(16),
    paddingVertical: m(8),
    borderRadius: m(8),
  },
  backBtnText: {
    color: colors.white,
    fontWeight: '600',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: m(16),
    paddingVertical: m(14),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: m(15),
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginHorizontal: m(10),
  },
  backIcon: {
    padding: m(4),
  },
  chatIconBtn: {
    padding: m(4),
  },
  scrollContent: {
    padding: m(16),
    gap: m(14),
    paddingBottom: m(90),
  },
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: m(12),
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(10),
  },
  lenderIcon: {
    width: m(36),
    height: m(36),
    borderRadius: m(10),
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  facilityTitle: {
    fontSize: m(15),
    fontWeight: '800',
    color: '#0F172A',
  },
  lenderSub: {
    fontSize: m(11),
    color: '#64748B',
    marginTop: m(2),
  },
  boldText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(6),
  },
  statusBadgeText: {
    fontSize: m(10),
    fontWeight: '700',
    color: '#16A34A',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F8FAFC',
    borderRadius: m(12),
    padding: m(10),
    gap: m(8),
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  metricItem: {
    width: '31%',
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
  progressSection: {
    gap: m(4),
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressDesc: {
    fontSize: m(11),
    color: '#64748B',
  },
  progressPercent: {
    fontSize: m(11),
    fontWeight: '700',
    color: '#16A34A',
    fontFamily: 'monospace',
  },
  progressBarBg: {
    height: m(6),
    backgroundColor: '#E2E8F0',
    borderRadius: m(3),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#16A34A',
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
    backgroundColor: '#FEF3C7',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(6),
  },
  securityText: {
    fontSize: m(11),
    color: '#92400E',
    fontWeight: '600',
  },
  otpCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: m(14),
    padding: m(14),
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: m(8),
  },
  otpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  otpTitle: {
    fontSize: m(10),
    fontWeight: '800',
    color: '#D97706',
  },
  actionReqBadge: {
    fontSize: m(9),
    fontWeight: '700',
    color: '#92400E',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: m(6),
    paddingVertical: m(2),
    borderRadius: m(4),
  },
  otpDesc: {
    fontSize: m(11),
    color: '#78350F',
    lineHeight: m(16),
  },
  otpCodeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: m(12),
    paddingVertical: m(8),
    borderRadius: m(10),
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  otpCodeText: {
    fontSize: m(18),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 4,
    fontFamily: 'monospace',
  },
  copyOtpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: '#FEF3C7',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(6),
  },
  copyOtpBtnText: {
    fontSize: m(11),
    fontWeight: '700',
    color: '#D97706',
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: m(12),
    padding: m(3),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: m(4),
  },
  switcherBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(6),
    paddingVertical: m(8),
    borderRadius: m(8),
  },
  activeSwitcherBtn: {
    backgroundColor: '#0F172A',
  },
  switcherBtnText: {
    fontSize: m(11),
    fontWeight: '600',
    color: '#64748B',
  },
  activeSwitcherBtnText: {
    color: colors.white,
    fontWeight: '700',
  },
  tabContent: {
    gap: m(10),
  },
  installmentCard: {
    backgroundColor: colors.white,
    borderRadius: m(12),
    padding: m(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: m(8),
  },
  paidInstCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#16A34A',
  },
  overdueInstCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  instCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  instNumBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: m(6),
    paddingVertical: m(2),
    borderRadius: m(4),
  },
  instNumText: {
    fontSize: m(11),
    fontWeight: '700',
    color: '#475569',
  },
  instDueDate: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#0F172A',
  },
  instClosingBal: {
    fontSize: m(10),
    color: '#94A3B8',
  },
  instStatusBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: m(6),
    paddingVertical: m(2),
    borderRadius: m(4),
  },
  instStatusText: {
    fontSize: m(9),
    fontWeight: '700',
    color: '#64748B',
  },
  instBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: m(8),
    padding: m(8),
  },
  instBLabel: {
    fontSize: m(9),
    color: '#64748B',
  },
  instBVal: {
    fontSize: m(11),
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'monospace',
    marginTop: m(1),
  },
  paidInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
  },
  paidInfoText: {
    fontSize: m(10),
    color: '#16A34A',
    fontWeight: '600',
  },
  paymentCard: {
    backgroundColor: colors.white,
    borderRadius: m(12),
    padding: m(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: m(6),
  },
  paymentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentDateText: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#0F172A',
  },
  paymentModeText: {
    fontSize: m(10),
    color: '#64748B',
    marginTop: m(1),
  },
  paymentAmountText: {
    fontSize: m(14),
    fontWeight: '800',
    color: '#16A34A',
    fontFamily: 'monospace',
  },
  paymentDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentRefText: {
    fontSize: m(10),
    color: '#64748B',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(2),
    backgroundColor: '#DCFCE7',
    paddingHorizontal: m(6),
    paddingVertical: m(2),
    borderRadius: m(4),
  },
  verifiedTagText: {
    fontSize: m(9),
    fontWeight: '700',
    color: '#16A34A',
  },
  paymentNotesText: {
    fontSize: m(10),
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(40),
    gap: m(6),
    backgroundColor: colors.white,
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyBoxTitle: {
    fontSize: m(13),
    fontWeight: '700',
    color: '#0F172A',
    marginTop: m(4),
  },
  emptyBoxSub: {
    fontSize: m(11),
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: m(20),
  },
  emptyBoxText: {
    fontSize: m(12),
    color: '#64748B',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: m(16),
    paddingVertical: m(12),
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
    backgroundColor: '#2563EB',
    paddingVertical: m(12),
    borderRadius: m(12),
  },
  payBtnText: {
    fontSize: m(14),
    fontWeight: '700',
    color: colors.white,
  },
});
