import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { colors, FontFamily } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper, SuccessModal, showAlert } from '../../../Components/common';
import borrowerFlowService from '../../../Services/borrowerFlowService';

const PURPOSE_OPTIONS = [
  'Working Capital Line',
  'Machinery & Equipment',
  'Business Expansion',
  'Inventory Financing',
  'Debt Refinancing',
  'Invoice Discounting',
];

const TENURE_PRESETS = [12, 24, 36, 48, 60];
const AMOUNT_PRESETS = [100000, 500000, 1000000, 2500000, 5000000];

export default function BorrowerApply() {
  const navigation = useNavigation();
  const route = useRoute();
  const { preselectedLender } = route.params || {};

  // Form states
  const [selectedLender, setSelectedLender] = useState(preselectedLender || null);
  const [availableLenders, setAvailableLenders] = useState([]);
  const [amount, setAmount] = useState('500000');
  const [tenureMonths, setTenureMonths] = useState('24');
  const [purpose, setPurpose] = useState('Working Capital Line');
  const [requestedRate, setRequestedRate] = useState('10.5');
  const [repaymentType, setRepaymentType] = useState('EMI'); // 'EMI' | 'ONE_TIME'
  const [pledgedSecurity, setPledgedSecurity] = useState('');
  const [notes, setNotes] = useState('');

  // Status & Verification states
  const [loadingPrereqs, setLoadingPrereqs] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activePendingApp, setActivePendingApp] = useState(null);
  const [profileCompletion, setProfileCompletion] = useState({
    percentage: 100,
    isComplete: true,
    missingFields: [],
  });

  // Success Confirmation Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedAppInfo, setSubmittedAppInfo] = useState(null);

  // Active Pending Alert Collapsible State
  const [isPendingExpanded, setIsPendingExpanded] = useState(false);

  // Sync selected lender when navigating back from Explore Lenders
  useEffect(() => {
    if (route.params?.preselectedLender) {
      setSelectedLender(route.params.preselectedLender);
    }
  }, [route.params?.preselectedLender]);

  const fetchPrerequisites = useCallback(async () => {
    try {
      setLoadingPrereqs(true);
      const [lendersRes, profileRes, appsRes] = await Promise.allSettled([
        borrowerFlowService.getLenders(),
        borrowerFlowService.getProfile(),
        borrowerFlowService.getMyApplications({ status: 'pending' }),
      ]);

      // Lenders
      if (lendersRes.status === 'fulfilled' && lendersRes.value?.success) {
        const list = lendersRes.value.lenders || [];
        setAvailableLenders(list);
        setSelectedLender((prev) => {
          const target = route.params?.preselectedLender || prev;
          if (target) {
            const found = list.find((l) => l._id === target._id);
            return found || target;
          }
          return list.length > 0 ? list[0] : null;
        });
      }

      // Profile Completion
      if (profileRes.status === 'fulfilled' && profileRes.value?.success) {
        if (profileRes.value.profileCompletion) {
          setProfileCompletion(profileRes.value.profileCompletion);
        }
      }

      // Active Pending Application Check
      if (appsRes.status === 'fulfilled' && appsRes.value?.success) {
        const apps = appsRes.value.applications || [];
        const pending = apps.find((a) => a.status === 'pending');
        setActivePendingApp(pending || null);
      }
    } catch (err) {
      console.error('Error fetching apply prerequisites:', err);
    } finally {
      setLoadingPrereqs(false);
    }
  }, [preselectedLender]);

  useFocusEffect(
    useCallback(() => {
      fetchPrerequisites();
    }, [fetchPrerequisites])
  );

  // Real-time Dynamic EMI Calculator
  const emiCalculation = useMemo(() => {
    const p = Number(amount) || 0;
    const rAnnual = Number(requestedRate) || 10.5;
    const n = Number(tenureMonths) || 12;

    if (p <= 0 || n <= 0) {
      return { monthlyEmi: 0, totalInterest: 0, totalPayable: p };
    }

    if (repaymentType === 'ONE_TIME') {
      const totalInterest = Math.round((p * rAnnual * (n / 12)) / 100);
      return {
        monthlyEmi: Math.round(totalInterest / n),
        totalInterest,
        totalPayable: p + totalInterest,
      };
    }

    const rMonthly = rAnnual / (12 * 100);
    const emi =
      rMonthly > 0
        ? (p * rMonthly * Math.pow(1 + rMonthly, n)) / (Math.pow(1 + rMonthly, n) - 1)
        : p / n;
    const roundedEmi = Math.round(emi);
    const totalPayable = Math.round(roundedEmi * n);
    const totalInterest = Math.max(0, totalPayable - p);

    return {
      monthlyEmi: roundedEmi,
      totalInterest,
      totalPayable,
    };
  }, [amount, requestedRate, tenureMonths, repaymentType]);

  const formatINR = (val) => {
    if (!val) return '₹0';
    const num = Number(val);
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lakh`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const handleSubmit = async () => {
    if (activePendingApp) {
      const lenderName =
        activePendingApp.lenderSnapshot?.companyName ||
        activePendingApp.lenderSnapshot?.userName ||
        activePendingApp.lenderId?.companyName ||
        'your selected lender';
      showAlert(
        'Active Application in Review',
        `You currently have an active loan application with ${lenderName}. In accordance with commercial lending rules, borrowers can have 1 active application under review at a time. Please wait for a decision or view status in My Applications.`,
        [
          { text: 'View Applications', onPress: () => navigation.navigate('BorrowerApplications') },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    if (!profileCompletion.isComplete) {
      showAlert(
        'Profile Incomplete',
        `Your profile is ${profileCompletion.percentage}% complete. Please complete 100% of your borrower profile before applying.`,
        [
          { text: 'Complete Profile', onPress: () => navigation.navigate('BorrowerProfileScreen') },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    if (!selectedLender) {
      showAlert('Selection Required', 'Please select an institutional lender.');
      return;
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount < 1000) {
      showAlert('Validation Error', 'Minimum loan amount is ₹1,000');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        lenderId: selectedLender._id,
        amount: numAmount,
        purpose,
        tenureMonths: Number(tenureMonths) || 24,
        requestedRate: Number(requestedRate) || 10.5,
        repaymentType,
        pledgedSecurity,
        notes,
      };

      const res = await borrowerFlowService.submitApplications(payload);
      if (res?.success) {
        setSubmittedAppInfo({
          amount: numAmount,
          lenderName: selectedLender.companyName || selectedLender.userName,
          purpose,
          tenure: tenureMonths,
          rate: requestedRate,
        });
        setShowSuccessModal(true);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit loan application.';
      showAlert('Application Notice', msg);
    } finally {
      setSubmitting(false);
    }
  };

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
            <Text style={styles.headerTag}>FINANCING FACILITY</Text>
            <Text style={styles.headerTitle}>Apply for Capital</Text>
          </View>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={fetchPrerequisites}
            disabled={loadingPrereqs}
            activeOpacity={0.8}
          >
            <Feather name="refresh-cw" size={m(17)} color={colors.lettersAndIcons} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Curved Body Section */}
      <View style={styles.sheetSection}>
        {loadingPrereqs ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="small" color={colors.lettersAndIcons} />
            <Text style={styles.loadingText}>Checking prerequisites & lending limits...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Active Pending Application Banner */}
            {activePendingApp ? (
              <TouchableOpacity
                style={[
                  styles.pendingAlertCard,
                  !isPendingExpanded && styles.pendingAlertCardCollapsed,
                ]}
                activeOpacity={0.88}
                onPress={() => setIsPendingExpanded((prev) => !prev)}
              >
                <View
                  style={[
                    styles.alertHeader,
                    !isPendingExpanded && { marginBottom: 0 },
                  ]}
                >
                  <View style={styles.alertIconBadge}>
                    <Feather name="clock" size={m(14)} color="#d97706" />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.alertTitle} numberOfLines={1}>Active Application in Review</Text>
                    <Text style={styles.alertSubtitle} numberOfLines={1}>Single-lender review protocol active</Text>
                  </View>
                  <View style={styles.alertHeaderRight}>
                    <View style={styles.alertStatusPill}>
                      <Text style={styles.alertStatusPillText}>IN REVIEW</Text>
                    </View>
                    <Feather
                      name={isPendingExpanded ? 'chevron-up' : 'chevron-down'}
                      size={m(13)}
                      color="#b45309"
                      style={{ marginLeft: m(3) }}
                    />
                  </View>
                </View>

                {isPendingExpanded && (
                  <View style={{ marginTop: m(10) }}>
                    <View style={styles.lenderLockStrip}>
                      <View style={styles.lenderLockLeft}>
                        <Feather name="briefcase" size={m(13)} color={colors.lettersAndIcons} />
                        <Text style={styles.lenderLockName} numberOfLines={1}>
                          {activePendingApp.lenderSnapshot?.companyName ||
                            activePendingApp.lenderSnapshot?.userName ||
                            activePendingApp.lenderId?.companyName ||
                            'Institutional Partner'}
                        </Text>
                      </View>
                      <Text style={styles.lenderLockWindow}>48h Window</Text>
                    </View>

                    <Text style={styles.alertDesc}>
                      You currently have a facility request under assessment. New application submissions are temporarily paused until a decision is issued.
                    </Text>

                    <TouchableOpacity
                      style={styles.alertBtn}
                      activeOpacity={0.85}
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        navigation.navigate('BorrowerApplications');
                      }}
                    >
                      <Text style={styles.alertBtnText}>Go to My Applications</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            ) : null}

            {/* Profile Completion Warning */}
            {!profileCompletion.isComplete ? (
              <View style={styles.profileAlertCard}>
                <View style={styles.alertHeader}>
                  <View style={[styles.alertIconBadge, { backgroundColor: '#fee2e2' }]}>
                    <Feather name="alert-triangle" size={m(15)} color="#dc2626" />
                  </View>
                  <Text style={[styles.alertTitle, { color: '#dc2626' }]}>
                    Profile {profileCompletion.percentage}% Complete
                  </Text>
                </View>
                <Text style={[styles.alertDesc, { color: '#7f1d1d' }]}>
                  Complete statutory corporate, tax and address details before applying for capital.
                </Text>
                <TouchableOpacity
                  style={[styles.alertBtn, { borderColor: '#fca5a5' }]}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('BorrowerProfileScreen')}
                >
                  <Text style={[styles.alertBtnText, { color: '#dc2626' }]}>
                    Complete Profile Details
                  </Text>
                  <Feather name="chevron-right" size={m(14)} color="#dc2626" />
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Real-time Dynamic EMI Simulator Card */}
            <View style={styles.calculatorCard}>
              <View style={styles.calcHeader}>
                <Text style={styles.calcTag}>ESTIMATED REPAYMENT SCHEDULE</Text>
                <View style={styles.calcTypeBadge}>
                  <Text style={styles.calcTypeBadgeText}>
                    {repaymentType === 'ONE_TIME' ? 'BULLET' : 'MONTHLY EMI'}
                  </Text>
                </View>
              </View>

              <View style={styles.emiHighlightRow}>
                <Text style={styles.emiAmount}>
                  ₹{emiCalculation.monthlyEmi.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.emiPerMonth}>/ month</Text>
              </View>

              {/* Inner Neutral Breakdown Strip (#F8FAFC) */}
              <View style={styles.calcBreakdownRow}>
                <View style={styles.calcBreakdownItem}>
                  <Text style={styles.calcBLabel}>Principal</Text>
                  <Text style={styles.calcBVal}>{formatINR(amount)}</Text>
                </View>
                <View style={styles.calcDivider} />
                <View style={styles.calcBreakdownItem}>
                  <Text style={styles.calcBLabel}>Total Interest</Text>
                  <Text style={styles.calcBVal}>
                    ₹{emiCalculation.totalInterest.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.calcDivider} />
                <View style={styles.calcBreakdownItem}>
                  <Text style={styles.calcBLabel}>Total Payable</Text>
                  <Text style={styles.calcBVal}>
                    ₹{emiCalculation.totalPayable.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Section 1: Target Institutional Lender */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitleInRow}>1. Target Institutional Lender</Text>
                <TouchableOpacity
                  style={styles.changeLenderBtn}
                  onPress={() =>
                    navigation.navigate('BorrowerExploreLenders', {
                      selectMode: true,
                      currentLenderId: selectedLender?._id,
                    })
                  }
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.changeLenderText}>Change</Text>
                  <Feather name="arrow-right" size={m(12)} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {selectedLender ? (
                <TouchableOpacity
                  style={styles.selectedLenderSingleCard}
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate('BorrowerExploreLenders', {
                      selectMode: true,
                      currentLenderId: selectedLender?._id,
                    })
                  }
                >
                  <View style={styles.selectedLenderIconWrap}>
                    <Feather name="briefcase" size={m(16)} color={colors.white} />
                  </View>
                  <View style={styles.selectedLenderInfoCol}>
                    <View style={styles.lenderNameRow}>
                      <Text style={styles.selectedLenderNameText} numberOfLines={1}>
                        {selectedLender.companyName || selectedLender.userName}
                      </Text>
                      <View style={styles.verifiedSmallBadge}>
                        <Feather name="check-circle" size={m(10)} color="#059669" />
                        <Text style={styles.verifiedSmallText}>Verified</Text>
                      </View>
                    </View>
                    <Text style={styles.selectedLenderRateText}>
                      From {selectedLender.lenderProfile?.minInterestRate || 10.5}% p.a. • Max {formatINR(selectedLender.lenderProfile?.maxLoanAmount || 5000000)}
                    </Text>
                  </View>
                  <View style={styles.selectedCheckBadge}>
                    <Feather name="check" size={m(13)} color="#059669" />
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.selectedLenderSingleCard, { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }]}
                  activeOpacity={0.8}
                  onPress={() =>
                    navigation.navigate('BorrowerExploreLenders', {
                      selectMode: true,
                    })
                  }
                >
                  <View style={[styles.selectedLenderIconWrap, { backgroundColor: colors.blueButton }]}>
                    <Feather name="plus" size={m(16)} color={colors.white} />
                  </View>
                  <View style={styles.selectedLenderInfoCol}>
                    <Text style={styles.selectedLenderNameText}>Select an Institutional Partner</Text>
                    <Text style={styles.selectedLenderRateText}>Tap to browse and choose a lender</Text>
                  </View>
                  <Feather name="chevron-right" size={m(16)} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Section 2: Loan Facility Details */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>2. Loan Facility Details</Text>

              {/* Loan Amount Input & Presets */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Requested Facility Amount (₹)</Text>
                <View style={styles.currencyInputWrap}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={styles.currencyInput}
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="e.g. 500000"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                {/* Amount Quick Presets */}
                <View style={styles.presetChipsRow}>
                  {AMOUNT_PRESETS.map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.presetChip,
                        Number(amount) === p && styles.activePresetChip,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => setAmount(String(p))}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          Number(amount) === p && styles.activePresetChipText,
                        ]}
                      >
                        {formatINR(p)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Purpose Selector Chips */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Financing Purpose</Text>
                <View style={styles.purposeGrid}>
                  {PURPOSE_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.purposeOpt,
                        purpose === opt && styles.activePurposeOpt,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => setPurpose(opt)}
                    >
                      <Text
                        style={[
                          styles.purposeOptText,
                          purpose === opt && styles.activePurposeOptText,
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Tenure Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Facility Tenure (Months)</Text>
                <View style={styles.presetChipsRow}>
                  {TENURE_PRESETS.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.presetChip,
                        Number(tenureMonths) === t && styles.activePresetChip,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => setTenureMonths(String(t))}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          Number(tenureMonths) === t && styles.activePresetChipText,
                        ]}
                      >
                        {t} Mo
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Repayment Structure Toggle */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Repayment Structure</Text>
                <View style={styles.periodCapsuleRow}>
                  <TouchableOpacity
                    style={[
                      styles.periodTab,
                      repaymentType === 'EMI' && styles.periodTabActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setRepaymentType('EMI')}
                  >
                    <Text
                      style={[
                        styles.periodTabText,
                        repaymentType === 'EMI' && styles.periodTabTextActive,
                      ]}
                    >
                      Monthly Amortizing EMI
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.periodTab,
                      repaymentType === 'ONE_TIME' && styles.periodTabActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setRepaymentType('ONE_TIME')}
                  >
                    <Text
                      style={[
                        styles.periodTabText,
                        repaymentType === 'ONE_TIME' && styles.periodTabTextActive,
                      ]}
                    >
                      Bullet / One-Time
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Requested Interest Rate */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Requested Annual Interest Rate (% p.a.)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={requestedRate}
                  onChangeText={setRequestedRate}
                  placeholder="10.5"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* Pledged Collateral */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Pledged Collateral / Security (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={pledgedSecurity}
                  onChangeText={setPledgedSecurity}
                  placeholder="e.g. Commercial inventory, receivables, equipment"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* Business Notes */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Application Remarks / Business Notes</Text>
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  multiline
                  numberOfLines={3}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Provide notes on seasonal cash flows or supplier purchase order details"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            {/* Submit Action Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (submitting || !!activePendingApp) && styles.disabledBtn,
              ]}
              activeOpacity={0.85}
              onPress={handleSubmit}
              disabled={submitting || !!activePendingApp}
            >
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  {/* <Feather name="send" size={m(16)} color={colors.white} /> */}
                  <Text style={styles.submitBtnText}>Submit Loan Application</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* Reusable Custom Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        title="Application Submitted!"
        subtitle="Your Facility Request Has Been Sent"
        message={`Your loan application of ${formatINR(submittedAppInfo?.amount || amount)} has been submitted to ${
          submittedAppInfo?.lenderName || selectedLender?.companyName || selectedLender?.userName || 'the institutional partner'
        }. The institution has a 48-hour review window.`}
        primaryButtonText="View Applications"
        onPrimaryPress={() => {
          setShowSuccessModal(false);
          navigation.navigate('BorrowerApplications');
        }}
        showSecondaryButton={false}
        onClose={() => {
          setShowSuccessModal(false);
          navigation.navigate('BorrowerApplications');
        }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
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
    justifyContent: 'space-between',
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
  },
  headerTag: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: 0.8,
    opacity: 0.85,
  },
  headerTitle: {
    fontSize: m(18),
    lineHeight: m(24),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  refreshBtn: {
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
    paddingBottom: m(50),
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: m(30),
  },
  loadingText: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(10),
  },

  // Alerts
  pendingAlertCard: {
    backgroundColor: colors.white,
    borderRadius: m(18),
    padding: m(16),
    marginBottom: m(14),
    borderWidth: 1.5,
    borderColor: '#fef3c7',
    elevation: 3,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  pendingAlertCardCollapsed: {
    paddingVertical: m(10),
    paddingHorizontal: m(12),
  },
  profileAlertCard: {
    backgroundColor: '#fef2f2',
    borderRadius: m(16),
    padding: m(14),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    marginBottom: m(10),
  },
  alertHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIconBadge: {
    width: m(32),
    height: m(32),
    borderRadius: m(8),
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  alertSubtitle: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(1),
  },
  alertStatusPill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: m(6),
    paddingVertical: m(2.5),
    borderRadius: m(5),
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  alertStatusPillText: {
    fontSize: m(8.5),
    fontFamily: FontFamily.primaryBold,
    color: '#b45309',
    letterSpacing: 0.4,
  },
  lenderLockStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: m(10),
    paddingHorizontal: m(12),
    paddingVertical: m(9),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: m(10),
  },
  lenderLockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(7),
    flex: 1,
    marginRight: m(8),
  },
  lenderLockName: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    flexShrink: 1,
  },
  lenderLockWindow: {
    fontSize: m(11),
    fontFamily: FontFamily.primarySemiBold,
    color: '#b45309',
    backgroundColor: '#fffbeb',
    paddingHorizontal: m(7),
    paddingVertical: m(2),
    borderRadius: m(5),
  },
  alertDesc: {
    fontSize: m(11.5),
    lineHeight: m(17),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginBottom: m(12),
  },
  alertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(6),
    backgroundColor: colors.lettersAndIcons,
    paddingVertical: m(11),
    borderRadius: m(12),
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  alertBtnText: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },

  // Dynamic EMI Simulator Card
  calculatorCard: {
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
  calcHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(6),
  },
  calcTag: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: colors.textSecondary,
    letterSpacing: 0.6,
  },
  calcTypeBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(6),
  },
  calcTypeBadgeText: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: '#059669',
  },
  emiHighlightRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: m(12),
  },
  emiAmount: {
    fontSize: m(24),
    lineHeight: m(30),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  emiPerMonth: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginLeft: m(6),
  },

  // Breakdown Strip - Neutral Slate-50 (#F8FAFC)
  calcBreakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    paddingVertical: m(8),
    paddingHorizontal: m(10),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  calcBreakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  calcBLabel: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
    marginBottom: m(2),
  },
  calcBVal: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  calcDivider: {
    width: 1,
    height: m(22),
    backgroundColor: '#e2e8f0',
  },

  // Section Cards
  sectionCard: {
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(10),
  },
  sectionTitle: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(8),
  },
  sectionTitleInRow: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    lineHeight: m(18),
  },
  sectionSubtitle: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
  },
  changeLenderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(3),
    paddingVertical: m(2),
  },
  changeLenderText: {
    fontSize: m(12),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.primary,
  },

  // Single Selected Lender Card
  selectedLenderSingleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: m(14),
    padding: m(12),
    borderWidth: 1.5,
    borderColor: colors.primary,
    marginTop: m(2),
  },
  selectedLenderIconWrap: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(10),
  },
  selectedLenderInfoCol: {
    flex: 1,
    marginRight: m(6),
  },
  lenderNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(5),
  },
  selectedLenderNameText: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    flexShrink: 1,
  },
  verifiedSmallBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(2),
    backgroundColor: '#d1fae5',
    paddingHorizontal: m(5),
    paddingVertical: m(1),
    borderRadius: m(4),
  },
  verifiedSmallText: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: '#059669',
  },
  selectedLenderRateText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(2),
  },
  selectedCheckBadge: {
    width: m(24),
    height: m(24),
    borderRadius: m(12),
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Lenders Horizontal List
  lendersRow: {
    marginTop: m(2),
  },
  lenderSelectCard: {
    width: m(145),
    backgroundColor: '#f8fafc',
    borderRadius: m(14),
    padding: m(12),
    marginRight: m(10),
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  selectedLenderCard: {
    backgroundColor: '#ecfdf5',
    borderColor: colors.primary,
  },
  lenderCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(8),
  },
  lenderIcon: {
    width: m(28),
    height: m(28),
    borderRadius: m(14),
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedLenderIcon: {
    backgroundColor: colors.primary,
  },
  lenderSelectName: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(2),
  },
  selectedLenderName: {
    color: colors.lettersAndIcons,
  },
  lenderSelectRate: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
  },

  // Inputs & Groups
  inputGroup: {
    marginBottom: m(14),
  },
  inputLabel: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
    marginBottom: m(6),
  },
  currencyInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: m(12),
    height: m(46),
  },
  currencySymbol: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginRight: m(8),
  },
  currencyInput: {
    flex: 1,
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    padding: 0,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: m(12),
    paddingVertical: m(10),
    fontSize: m(13),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
  },
  multilineInput: {
    height: m(70),
    textAlignVertical: 'top',
  },

  // Preset Chips
  presetChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(6),
    marginTop: m(8),
  },
  presetChip: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    borderRadius: m(10),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activePresetChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetChipText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  activePresetChipText: {
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  // Purpose Grid
  purposeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(6),
  },
  purposeOpt: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: m(10),
    paddingVertical: m(7),
    borderRadius: m(10),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activePurposeOpt: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  purposeOptText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  activePurposeOptText: {
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  // Period / Repayment Capsule Toggle
  periodCapsuleRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: m(14),
    padding: m(3),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  periodTab: {
    flex: 1,
    paddingVertical: m(8),
    borderRadius: m(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodTabActive: {
    backgroundColor: colors.primary,
  },
  periodTabText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
  },
  periodTabTextActive: {
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  // Submit Action Button
  submitBtn: {
    backgroundColor: colors.lettersAndIcons,
    borderRadius: m(16),
    paddingVertical: m(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
    marginTop: m(6),
    marginBottom: m(20),
    elevation: 3,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
});
