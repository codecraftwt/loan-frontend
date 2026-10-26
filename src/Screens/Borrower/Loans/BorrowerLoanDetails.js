import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { colors, FontFamily } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper } from '../../../Components/common';
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
    if (!val && val !== 0) return '₹0';
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
      <ScreenWrapper
        backgroundColor={colors.backgroundGreenWhite}
        topInsetBg={colors.primary}
        statusBarColor={colors.primary}
        statusBarStyle="dark-content"
      >
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.lettersAndIcons} />
          <Text style={styles.loadingText}>Loading facility parameters...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!loan) {
    return (
      <ScreenWrapper
        backgroundColor={colors.backgroundGreenWhite}
        topInsetBg={colors.primary}
        statusBarColor={colors.primary}
        statusBarStyle="dark-content"
      >
        <View style={styles.centerContainer}>
          <Feather name="alert-circle" size={m(36)} color={colors.textSecondary} />
          <Text style={styles.errorTitle}>Facility Record Not Found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Return to Loans</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  const lender = loan.lenderId || {};
  const totalRepayable = Number(loan.totalRepaymentExpected || loan.amount || 0);
  const totalPaid = Number(loan.totalPaid || 0);
  const paidPercent =
    totalRepayable > 0 ? Math.min(100, Math.round((totalPaid / totalRepayable) * 100)) : 0;
  const isClosed = loan.status === 'closed' || loan.remainingAmount <= 0;

  const isPendingOtp =
    loan.disbursalVerification?.otp && !loan.disbursalVerification?.isVerified;

  return (
    <ScreenWrapper
      backgroundColor={colors.backgroundGreenWhite}
      topInsetBg={colors.primary}
      statusBarColor={colors.primary}
      statusBarStyle="dark-content"
      includeTabBarClearance={false}
      scrollable={false}
    >
      {/* Top Green Banner */}
      <View style={styles.topBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backCircularBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={m(18)} color={colors.lettersAndIcons} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTag}>CREDIT FACILITY AMORTIZATION</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {loan.purpose || loan.dealName || 'Commercial Facility'}
            </Text>
          </View>

          {lender.mobileNo ? (
            <TouchableOpacity
              style={styles.chatCircularBtn}
              activeOpacity={0.8}
              onPress={() => openLenderChat(lender.mobileNo)}
            >
              <Feather name="message-square" size={m(17)} color={colors.lettersAndIcons} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: m(38) }} />
          )}
        </View>
      </View>

      {/* Main Curved Body Section */}
      <View style={styles.sheetSection}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Facility Overview Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.lenderIcon}>
                <Feather name="briefcase" size={m(16)} color={colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.facilityTitle}>
                  {loan.purpose || loan.dealName || 'Commercial Facility'}
                </Text>
                <Text style={styles.lenderSub}>
                  Sanctioned by: <Text style={{ fontFamily: FontFamily.primaryBold }}>{lender.companyName || lender.userName || 'Institutional Lender'}</Text>
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  isClosed ? styles.statusBadgeClosed : styles.statusBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    isClosed ? styles.statusTextClosed : styles.statusTextActive,
                  ]}
                >
                  {isClosed ? 'SETTLED' : 'ACTIVE'}
                </Text>
              </View>
            </View>

            {/* 6 Macro Metrics Grid - Neutral Slate-50 (#F8FAFC) */}
            <View style={styles.metricsBox}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Principal</Text>
                <Text style={styles.metricValueBold}>{formatINR(loan.amount)}</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Monthly EMI</Text>
                <Text style={styles.metricValue}>{formatINR(loan.monthlyEmi)}</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Interest Rate</Text>
                <Text style={styles.metricValue}>{loan.interestRate || 10.5}%</Text>
              </View>
            </View>

            <View style={[styles.metricsBox, { marginTop: m(8) }]}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Total Expected</Text>
                <Text style={styles.metricValue}>{formatINR(totalRepayable)}</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Total Repaid</Text>
                <Text style={[styles.metricValue, { color: '#059669' }]}>
                  {formatINR(totalPaid)}
                </Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Remaining</Text>
                <Text style={styles.metricValueBold}>
                  {formatINR(loan.remainingAmount || 0)}
                </Text>
              </View>
            </View>

            {/* Pledged Security / Collateral Strip */}
            {(loan.pledgedSecurity || loan.applicationId?.pledgedSecurity) ? (
              <View style={styles.collateralStrip}>
                <Feather name="shield" size={m(13)} color="#b45309" />
                <View style={{ flex: 1, marginLeft: m(6) }}>
                  <Text style={styles.collateralLabel}>PLEDGED COLLATERAL / SECURITY</Text>
                  <Text style={styles.collateralVal} numberOfLines={2}>
                    {loan.pledgedSecurity || loan.applicationId?.pledgedSecurity}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Repayment Progress Bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressTextRow}>
                <Text style={styles.progressDesc}>
                  Repayment Progress ({formatINR(totalPaid)} of {formatINR(totalRepayable)})
                </Text>
                <Text style={styles.progressPercent}>{paidPercent}%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${paidPercent}%` }]} />
              </View>
            </View>
          </View>

          {/* Pending Disbursal OTP Alert */}
          {isPendingOtp ? (
            <View style={styles.otpCard}>
              <View style={styles.otpHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: m(4) }}>
                  <Feather name="key" size={m(13)} color="#d97706" />
                  <Text style={styles.otpTitle}>DISBURSAL CODE READY</Text>
                </View>
                <Text style={styles.actionReqBadge}>Action Required</Text>
              </View>
              <Text style={styles.otpDesc}>
                Your contract is countersigned. Share this 6-digit OTP with the lender to execute RTGS funds release.
              </Text>
              <View style={styles.otpCodeRow}>
                <Text style={styles.otpCode}>{loan.disbursalVerification.otp}</Text>
                <TouchableOpacity
                  style={styles.copyOtpBtn}
                  activeOpacity={0.8}
                  onPress={() => copyOtpToClipboard(loan.disbursalVerification.otp)}
                >
                  <Feather name="copy" size={m(12)} color="#b45309" />
                  <Text style={styles.copyOtpText}>
                    {copiedOtp ? 'Copied!' : 'Copy Code'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* Tab Switcher Capsule */}
          <View style={styles.tabSwitcher}>
            <TouchableOpacity
              style={[
                styles.switcherBtn,
                activeTab === 'schedule' && styles.activeSwitcherBtn,
              ]}
              onPress={() => setActiveTab('schedule')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.switcherBtnText,
                  activeTab === 'schedule' && styles.activeSwitcherBtnText,
                ]}
              >
                Installment Schedule
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.switcherBtn,
                activeTab === 'payments' && styles.activeSwitcherBtn,
              ]}
              onPress={() => setActiveTab('payments')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.switcherBtnText,
                  activeTab === 'payments' && styles.activeSwitcherBtnText,
                ]}
              >
                Payment Ledger
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab 1: Installment Schedule */}
          {activeTab === 'schedule' ? (
            <View style={styles.scheduleList}>
              {loan.installments && loan.installments.length > 0 ? (
                loan.installments.map((inst, index) => {
                  const isPaid = inst.status === 'paid';
                  const isOverdue = inst.status === 'overdue';

                  return (
                    <View key={inst._id || index} style={styles.installmentCard}>
                      <View style={styles.instLeftCol}>
                        <View
                          style={[
                            styles.instIndexCircle,
                            isPaid && { backgroundColor: '#ecfdf5' },
                            isOverdue && { backgroundColor: '#fee2e2' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.instIndexText,
                              isPaid && { color: '#059669' },
                              isOverdue && { color: '#dc2626' },
                            ]}
                          >
                            #{inst.installmentNumber || index + 1}
                          </Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: m(10) }}>
                          <Text style={styles.instAmountText}>
                            {formatINR(inst.emiAmount || inst.totalAmount || inst.amount || loan.monthlyEmi)}
                          </Text>
                          <Text style={styles.instDateText}>
                            Due {formatDate(inst.dueDate)}
                            {inst.principalComponent !== undefined && inst.interestComponent !== undefined ? (
                              <Text style={styles.instBreakdownText}>
                                {' '}• P: {formatINR(inst.principalComponent)} | I: {formatINR(inst.interestComponent)}
                              </Text>
                            ) : null}
                          </Text>
                          {isPaid && inst.paymentRef ? (
                            <Text style={styles.instPaidRefText}>
                              UTR: {inst.paymentRef}
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      <View
                        style={[
                          styles.instStatusPill,
                          isPaid
                            ? styles.instPaidPill
                            : isOverdue
                            ? styles.instOverduePill
                            : styles.instUpcomingPill,
                        ]}
                      >
                        <Text
                          style={[
                            styles.instStatusText,
                            isPaid
                              ? styles.instPaidText
                              : isOverdue
                              ? styles.instOverdueText
                              : styles.instUpcomingText,
                          ]}
                        >
                          {isPaid ? 'PAID' : isOverdue ? 'OVERDUE' : 'UPCOMING'}
                        </Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyBox}>
                  <Feather name="calendar" size={m(32)} color={colors.primary} />
                  <Text style={styles.emptyBoxTitle}>Bullet Repayment Mode</Text>
                  <Text style={styles.emptyBoxSub}>
                    This facility is structured as single bullet repayment payable upon maturity.
                  </Text>
                </View>
              )}
            </View>
          ) : (
            /* Tab 2: Payment Ledger */
            <View style={styles.paymentsList}>
              {loan.payments && loan.payments.length > 0 ? (
                loan.payments.map((p, index) => (
                  <View key={p._id || index} style={styles.paymentCard}>
                    <View style={styles.paymentCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.paymentAmountText}>{formatINR(p.amount)}</Text>
                        <Text style={styles.paymentDateText}>
                          Date: {formatDate(p.paymentDate || p.createdAt)} · Mode: {p.paymentMode || 'Online'}
                        </Text>
                      </View>
                      <View style={styles.acknowledgedBadge}>
                        <Feather name="check-circle" size={m(11)} color="#059669" />
                        <Text style={styles.acknowledgedText}>Acknowledged</Text>
                      </View>
                    </View>

                    <View style={styles.paymentMetaBox}>
                      <Text style={styles.paymentRefText}>
                        UTR / Ref: <Text style={{ fontFamily: FontFamily.primaryBold }}>{p.paymentReference || 'N/A'}</Text>
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyBox}>
                  <Feather name="receipt" size={m(32)} color={colors.primary} />
                  <Text style={styles.emptyBoxTitle}>No Payments Recorded Yet</Text>
                  <Text style={styles.emptyBoxSub}>
                    When monthly repayments are posted and acknowledged by your lender, they will appear in this ledger.
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Bottom Sticky Action Bar: Make Repayment */}
        {/* {!isClosed ? (
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.payNowBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('MakePayment', { loan })}
            >
              <Feather name="credit-card" size={m(16)} color={colors.white} />
              <Text style={styles.payNowBtnText}>Make EMI Repayment</Text>
            </TouchableOpacity>
          </View>
        ) : null} */}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: m(20),
  },
  loadingText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
    marginTop: m(10),
  },
  errorTitle: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginTop: m(10),
  },
  backButton: {
    marginTop: m(12),
    backgroundColor: colors.lettersAndIcons,
    paddingHorizontal: m(16),
    paddingVertical: m(8),
    borderRadius: m(10),
  },
  backButtonText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },

  // Top Green Banner
  topBanner: {
    backgroundColor: colors.primary,
    paddingHorizontal: m(18),
    paddingTop: m(10),
    paddingBottom: m(18),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backCircularBtn: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: m(12),
    marginRight: m(8),
  },
  headerTag: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: 0.8,
    opacity: 0.85,
  },
  headerTitle: {
    fontSize: m(17),
    lineHeight: m(22),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  chatCircularBtn: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },

  // Main Curved Sheet
  sheetSection: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(32),
    borderTopRightRadius: m(32),
    paddingTop: m(16),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: m(18),
    paddingBottom: m(100),
  },

  // Hero Overview Card
  heroCard: {
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
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(12),
  },
  lenderIcon: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    backgroundColor: colors.blueButton,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(10),
  },
  facilityTitle: {
    fontSize: m(15),
    lineHeight: m(19),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  lenderSub: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(1),
  },
  statusBadge: {
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(6),
  },
  statusBadgeActive: {
    backgroundColor: '#ecfdf5',
  },
  statusBadgeClosed: {
    backgroundColor: '#f1f5f9',
  },
  statusBadgeText: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
  },
  statusTextActive: {
    color: '#059669',
  },
  statusTextClosed: {
    color: '#64748b',
  },

  // Metrics Box - Neutral Slate-50 (#F8FAFC)
  metricsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: m(10),
    paddingVertical: m(8),
    paddingHorizontal: m(8),
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
  metricValue: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.lettersAndIcons,
  },
  metricDivider: {
    width: 1,
    height: m(20),
    backgroundColor: '#e2e8f0',
  },

  // Progress Section
  progressSection: {
    marginTop: m(12),
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(4),
  },
  progressDesc: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
  },
  progressPercent: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: '#059669',
  },
  progressBarBg: {
    height: m(6),
    backgroundColor: '#e2e8f0',
    borderRadius: m(3),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: m(3),
  },

  // OTP Card
  otpCard: {
    backgroundColor: '#fffbeb',
    borderRadius: m(14),
    padding: m(14),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  otpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(6),
  },
  otpTitle: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: '#92400e',
    letterSpacing: 0.5,
  },
  actionReqBadge: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: '#b45309',
    backgroundColor: '#fef3c7',
    paddingHorizontal: m(6),
    paddingVertical: m(2),
    borderRadius: m(4),
  },
  otpDesc: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: '#78350f',
    lineHeight: m(15),
    marginBottom: m(8),
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
    borderColor: '#fef08a',
  },
  otpCode: {
    fontSize: m(18),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: 4,
  },
  copyOtpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: '#fef3c7',
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    borderRadius: m(8),
  },
  copyOtpText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: '#92400e',
  },

  // Tab Switcher
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: m(8),
    padding: m(4),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
  },
  switcherBtn: {
    flex: 1,
    paddingVertical: m(8),
    borderRadius: m(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSwitcherBtn: {
    backgroundColor: colors.primary,
  },
  switcherBtnText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  activeSwitcherBtnText: {
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  // Installment Cards
  scheduleList: {
    gap: m(10),
  },
  installmentCard: {
    backgroundColor: colors.white,
    borderRadius: m(14),
    padding: m(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.06)',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  instLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  instIndexCircle: {
    width: m(32),
    height: m(32),
    borderRadius: m(16),
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instIndexText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  instAmountText: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  instDateText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(1),
  },
  instStatusPill: {
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(6),
  },
  instPaidPill: {
    backgroundColor: '#ecfdf5',
  },
  instOverduePill: {
    backgroundColor: '#fee2e2',
  },
  instUpcomingPill: {
    backgroundColor: '#f1f5f9',
  },
  instStatusText: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
  },
  instPaidText: {
    color: '#059669',
  },
  instOverdueText: {
    color: '#dc2626',
  },
  instUpcomingText: {
    color: '#64748b',
  },

  // Payment Cards
  paymentsList: {
    gap: m(10),
  },
  paymentCard: {
    backgroundColor: colors.white,
    borderRadius: m(14),
    padding: m(12),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.06)',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  paymentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(8),
  },
  paymentAmountText: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  paymentDateText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(1),
  },
  acknowledgedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(3),
    backgroundColor: '#ecfdf5',
    paddingHorizontal: m(7),
    paddingVertical: m(3),
    borderRadius: m(6),
  },
  acknowledgedText: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: '#059669',
  },
  paymentMetaBox: {
    backgroundColor: '#f8fafc',
    borderRadius: m(8),
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  paymentRefText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
  },

  // Empty Box
  emptyBox: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(24),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.06)',
  },
  emptyBoxTitle: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginTop: m(10),
  },
  emptyBoxSub: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: m(4),
    lineHeight: m(16),
  },

  // Sticky Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: m(18),
    paddingVertical: m(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(9, 48, 48, 0.08)',
    elevation: 8,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  payNowBtn: {
    backgroundColor: colors.lettersAndIcons,
    borderRadius: m(14),
    paddingVertical: m(13),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
  },
  payNowBtnText: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },

  // Collateral Strip
  collateralStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: m(12),
    paddingHorizontal: m(12),
    paddingVertical: m(8),
    marginTop: m(10),
  },
  collateralLabel: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: '#92400e',
    letterSpacing: 0.5,
  },
  collateralVal: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primarySemiBold,
    color: '#78350f',
    marginTop: m(1),
  },
  instBreakdownText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: '#64748b',
  },
  instPaidRefText: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryMedium,
    color: '#059669',
    marginTop: m(2),
  },
});
