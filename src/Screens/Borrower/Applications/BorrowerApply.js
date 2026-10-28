import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { colors, FontFamily } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper, SuccessModal, showAlert } from '../../../Components/common';
import borrowerFlowService from '../../../Services/borrowerFlowService';

const PURPOSE_OPTIONS = [
  'Working Capital Line',
  'Commercial Term Loan',
  'SME Business Expansion',
  'Equipment & Machinery Finance',
  'Invoice Discounting',
  'Real Estate Development Debt',
];

const AMOUNT_PRESETS = [
  { label: '₹50,000', val: 50000 },
  { label: '₹1 Lakh', val: 100000 },
  { label: '₹2.50 Lakh', val: 250000 },
  { label: '₹5.00 Lakh', val: 500000 },
  { label: '₹7.50 Lakh', val: 750000 },
  { label: '₹10.00 Lakh', val: 1000000 },
];

const EMI_TENURES = [
  { label: '6 Months', val: 6 },
  { label: '12 Months (1 Year)', val: 12 },
  { label: '24 Months (2 Years)', val: 24 },
  { label: '36 Months (3 Years)', val: 36 },
  { label: '48 Months (4 Years)', val: 48 },
  { label: '60 Months (5 Years)', val: 60 },
];

const ONE_TIME_TENURES = [
  { label: '1 Month (30 Days)', val: 1 },
  { label: '2 Months (60 Days)', val: 2 },
  { label: '3 Months (90 Days)', val: 3 },
  { label: '6 Months', val: 6 },
  { label: '12 Months (1 Year)', val: 12 },
];

const COLLATERAL_SUGGESTIONS = [
  'Gold Jewellery',
  'Bike / Two-Wheeler',
  'Car / Vehicle',
  'Fixed Deposit Receipt (FDR)',
  'Property / Land Papers',
  'Business Stock / Inventory',
  'None / Unsecured',
];

export default function BorrowerApply() {
  const navigation = useNavigation();
  const route = useRoute();
  const { preselectedLender } = route.params || {};

  // Form states matching web 1:1
  const [selectedLender, setSelectedLender] = useState(preselectedLender || null);
  const [availableLenders, setAvailableLenders] = useState([]);
  const [amount, setAmount] = useState('100000'); // Default ₹1 Lakh
  const [purpose, setPurpose] = useState('Working Capital Line');
  const [tenureMonths, setTenureMonths] = useState('24');
  const [requestedRate, setRequestedRate] = useState('10.5');
  const [repaymentType, setRepaymentType] = useState('EMI'); // 'EMI' | 'ONE_TIME'
  const [creditScore, setCreditScore] = useState('750');
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

  // Active Pending Application Info Modal
  const [showPendingInfoModal, setShowPendingInfoModal] = useState(false);
  // Modal Picker for Purpose & Tenure
  const [pickerModal, setPickerModal] = useState({
    visible: false,
    title: '',
    options: [],
    selectedValue: null,
    onSelect: null,
  });

  // Format currency in Indian numbering system
  const formatINR = (val) => {
    if (!val || isNaN(val)) return '₹0';
    const num = Number(val);
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lakh`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  // Sync selected lender when navigating back from Explore Lenders
  useEffect(() => {
    if (route.params?.preselectedLender) {
      setSelectedLender(route.params.preselectedLender);
    }
  }, [route.params?.preselectedLender]);

  // When changing repayment type, ensure valid default tenure
  const handleRepaymentTypeChange = (type) => {
    setRepaymentType(type);
    if (type === 'ONE_TIME') {
      const current = Number(tenureMonths);
      if (!ONE_TIME_TENURES.some((t) => t.val === current)) {
        setTenureMonths('3');
      }
    } else {
      const current = Number(tenureMonths);
      if (!EMI_TENURES.some((t) => t.val === current)) {
        setTenureMonths('24');
      }
    }
  };

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

      // Profile Completion & Credit Score
      if (profileRes.status === 'fulfilled' && profileRes.value?.success) {
        if (profileRes.value.profileCompletion) {
          setProfileCompletion(profileRes.value.profileCompletion);
        }
        const score = profileRes.value.borrower?.borrowerProfile?.creditScore;
        if (score) {
          setCreditScore(String(score));
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

  // Real-time Dynamic EMI Calculator (Annuity formula)
  const emiCalc = useMemo(() => {
    const p = Number(amount) || 0;
    const rAnnual = Number(requestedRate) || 0;
    const n = Number(tenureMonths) || 12;

    if (p <= 0 || rAnnual <= 0 || n <= 0) {
      return { emi: 0, totalInterest: 0, totalPayable: p };
    }

    const rMonthly = rAnnual / (12 * 100);
    const emi = (p * rMonthly * Math.pow(1 + rMonthly, n)) / (Math.pow(1 + rMonthly, n) - 1);
    const totalPayable = emi * n;
    const totalInterest = Math.max(0, totalPayable - p);

    return {
      emi: Math.round(emi),
      totalInterest: Math.round(totalInterest),
      totalPayable: Math.round(totalPayable),
    };
  }, [amount, requestedRate, tenureMonths]);

  // Real-time Dynamic One-Time / Bullet Calculator
  const oneTimeCalc = useMemo(() => {
    const p = Number(amount) || 0;
    const rAnnual = Number(requestedRate) || 0;
    const n = Number(tenureMonths) || 12;

    if (p <= 0 || rAnnual <= 0 || n <= 0) {
      return { totalInterest: 0, totalPayable: p, maturityDate: 'N/A' };
    }

    const totalInterest = p * (rAnnual / 100) * (n / 12);
    const totalPayable = p + totalInterest;

    const maturity = new Date();
    maturity.setMonth(maturity.getMonth() + n);

    return {
      totalInterest: Math.round(totalInterest),
      totalPayable: Math.round(totalPayable),
      maturityDate: maturity.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    };
  }, [amount, requestedRate, tenureMonths]);

  // Dynamic Credit Score Grade badge
  const creditGrade = useMemo(() => {
    const s = Number(creditScore) || 750;
    if (s >= 750) {
      return {
        label: 'Grade A (Low Default Risk)',
        textColor: '#059669',
        bgColor: '#ecfdf5',
        borderColor: '#a7f3d0',
      };
    }
    if (s >= 650) {
      return {
        label: 'Grade B (Moderate Default Risk)',
        textColor: '#d97706',
        bgColor: '#fffbeb',
        borderColor: '#fde68a',
      };
    }
    return {
      label: 'Grade C (High Default Risk)',
      textColor: '#e11d48',
      bgColor: '#fff1f2',
      borderColor: '#fecdd3',
    };
  }, [creditScore]);

  const handleSubmit = async () => {
    if (activePendingApp) {
      const lenderName =
        activePendingApp.lenderSnapshot?.companyName ||
        activePendingApp.lenderSnapshot?.userName ||
        activePendingApp.lenderId?.companyName ||
        'your selected lender';
      const remaining =
        activePendingApp.remainingHours != null
          ? `${activePendingApp.remainingHours} hours`
          : 'up to 48 hours';
      showAlert(
        'Active Application in Review',
        `You have an active application under review with ${lenderName} (expires in ${remaining}). You can only apply to 1 lender at a time. Please wait for the decision or 48-hour auto-expiration before applying with another lender.`,
        [
          { text: 'Track Request', onPress: () => navigation.navigate('BorrowerApplications') },
          { text: 'Dismiss', style: 'cancel' },
        ]
      );
      return;
    }

    if (!profileCompletion.isComplete) {
      showAlert(
        'Profile Incomplete (100% Required)',
        `Your profile is only ${profileCompletion.percentage}% complete. Lenders require verified personal, address, and financial details before evaluating applications.`,
        [
          { text: 'Complete Profile (100%)', onPress: () => navigation.navigate('BorrowerProfileScreen') },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    if (!selectedLender) {
      showAlert('Lender Required', 'Please select a verified institutional lender to proceed.');
      return;
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount < 1000) {
      showAlert('Validation Error', 'Please enter a valid loan amount (minimum ₹1,000).');
      return;
    }

    const scoreNum = Number(creditScore);
    if (isNaN(scoreNum) || scoreNum < 300 || scoreNum > 900) {
      showAlert('Validation Error', 'Please provide a valid CIBIL credit score between 300 and 900.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        lenderId: selectedLender._id,
        amount: numAmount,
        purpose,
        tenureMonths: Number(tenureMonths) || 12,
        requestedRate: Number(requestedRate) || 10.5,
        repaymentType,
        creditScore: scoreNum,
        pledgedSecurity: (pledgedSecurity || '').trim(),
        notes: (notes || '').trim(),
      };

      const res = await borrowerFlowService.submitApplications(payload);
      if (res?.success) {
        setSubmittedAppInfo({
          amount: numAmount,
          lenderName: selectedLender.companyName || selectedLender.userName,
          purpose,
          tenure: tenureMonths,
          rate: requestedRate,
          repaymentType,
        });
        setShowSuccessModal(true);
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.hasPendingApplication) {
        showAlert(
          'Single Application Rule',
          data.message || 'You currently have an active application under review. Please wait for 48-hour turnaround.',
          [
            { text: 'View Applications', onPress: () => navigation.navigate('BorrowerApplications') },
            { text: 'OK', style: 'cancel' },
          ]
        );
      } else if (data?.isProfileIncomplete) {
        showAlert(
          'Profile Incomplete',
          data.message || 'Please complete 100% of your borrower profile details before applying.',
          [
            { text: 'Complete Profile', onPress: () => navigation.navigate('BorrowerProfileScreen') },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      } else {
        const msg = data?.message || 'Failed to submit loan application. Please verify details and try again.';
        showAlert('Application Notice', msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const lenderNameDisplay = selectedLender?.companyName || selectedLender?.userName || 'Selected Lender';

  return (
    <ScreenWrapper
      backgroundColor={colors.backgroundGreenWhite}
      topInsetBg={colors.primary}
      statusBarColor={colors.primary}
      statusBarStyle="dark-content"
      includeTabBarClearance={false}
      scrollable={false}
    >
      {/* ── Top Header Banner (Clean & Simple) ── */}
      <View style={styles.topBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backCircularBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Feather name="chevron-left" size={m(22)} color={colors.lettersAndIcons} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTag}>FINANCING FACILITY</Text>
            <Text style={styles.headerTitle}>Submit Loan Application</Text>
          </View>

          <TouchableOpacity
            style={styles.backCircularBtn}
            onPress={fetchPrerequisites}
            disabled={loadingPrereqs}
            activeOpacity={0.8}
          >
            <Feather name="refresh-cw" size={m(16)} color={colors.lettersAndIcons} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Main Sheet Body ── */}
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
            keyboardShouldPersistTaps="handled"
          >
            {/* ── 48-Hour Turnaround Notice & Browse Lenders (Below Header) ── */}
            <View style={styles.turnaroundNoticeCard}>
              <View style={styles.turnaroundNoticeLeft}>
                <View style={styles.turnaroundNoticeIconWrap}>
                  <Feather name="clock" size={m(15)} color="#059669" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.turnaroundNoticeTitle}>
                    48-Hour Response Turnaround
                  </Text>
                  <Text style={styles.turnaroundNoticeDesc}>
                    Apply to <Text style={styles.turnaroundNoticeBold}>1 verified institutional lender</Text> at a time with guaranteed 48-hour response turnaround.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.browseLendersActionBtn}
                onPress={() =>
                  navigation.navigate('BorrowerExploreLenders', {
                    selectMode: true,
                    currentLenderId: selectedLender?._id,
                  })
                }
                activeOpacity={0.85}
              >
                <Feather name="layers" size={m(13)} color="#059669" />
                <Text style={styles.browseLendersActionText}>Browse Lenders</Text>
                <Feather name="chevron-right" size={m(13)} color="#059669" />
              </TouchableOpacity>
            </View>
            {/* ── Active Application Warning Banner (1 Lender Rule) ── */}
            {activePendingApp && (
              <View style={styles.pendingAlertCard}>
                <View style={styles.alertTopRow}>
                  <View style={styles.alertIconBadgeAmber}>
                    <Feather name="clock" size={m(16)} color="#ffffff" />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={styles.alertTitleRow}>
                      <Text style={styles.alertTitleAmber}>
                        Application Already Under Review (1 Lender Rule)
                      </Text>
                      <TouchableOpacity
                        style={styles.alertInfoBtn}
                        activeOpacity={0.7}
                        onPress={() => setShowPendingInfoModal(true)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Feather name="info" size={m(14)} color="#d97706" />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.alertBtn}
                      activeOpacity={0.85}
                      onPress={() => navigation.navigate('BorrowerApplications')}
                    >
                      <Text style={styles.alertBtnText}>Track Request</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* ── 100% Profile Completion Required Banner ── */}
            {!profileCompletion.isComplete && (
              <View style={styles.profileAlertCard}>
                <View style={styles.alertHeader}>
                  <View style={[styles.alertIconBadge, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}>
                    <Feather name="alert-circle" size={m(15)} color="#dc2626" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.alertTitle, { color: '#dc2626' }]}>
                      100% Profile Completion Required ({profileCompletion.percentage}% Completed)
                    </Text>
                  </View>
                </View>
                <Text style={[styles.alertDesc, { color: '#7f1d1d' }]}>
                  Lenders require verified personal, address (Taluka, District, Pincode), and business financials before receiving loan applications.
                </Text>
                <TouchableOpacity
                  style={[styles.alertBtn, { backgroundColor: '#dc2626' }]}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('BorrowerProfileScreen')}
                >
                  <Text style={styles.alertBtnText}>Complete Profile (100%)</Text>
                  <Feather name="chevron-right" size={m(14)} color={colors.white} />
                </TouchableOpacity>
              </View>
            )}

            {/* ── Section 1: Selected Financing Partner (1 Lender Only) ── */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderLeft}>
                  <Feather name="briefcase" size={m(16)} color="#2563eb" />
                  <Text style={styles.cardHeaderTitle}>Selected Financing Partner (1 Lender Only)</Text>
                </View>
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
                  <Feather name="repeat" size={m(12)} color="#2563eb" />
                  <Text style={styles.changeLenderText}>Change Lender</Text>
                </TouchableOpacity>
              </View>

              {selectedLender ? (
                <View style={styles.lenderHeroCard}>
                  <View style={styles.lenderHeroLeft}>
                    <View style={styles.lenderHeroAvatar}>
                      <Feather name="briefcase" size={m(20)} color={colors.white} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={styles.lenderNameRow}>
                        <Text style={styles.lenderHeroName} numberOfLines={1}>
                          {selectedLender.companyName || selectedLender.userName}
                        </Text>
                        <View style={styles.verifiedBadge}>
                          <Feather name="check" size={m(9)} color="#2563eb" />
                        </View>
                      </View>

                      <View style={styles.lenderMetaWrap}>
                        <Text style={styles.lenderMetaInterest}>
                          Interest:{' '}
                          {selectedLender.lenderProfile?.minInterestRate != null
                            ? `${selectedLender.lenderProfile.minInterestRate}% - ${
                                selectedLender.lenderProfile.maxInterestRate ||
                                selectedLender.lenderProfile.minInterestRate
                              }%`
                            : 'On Request'}
                        </Text>
                        <Text style={styles.lenderMetaBullet}>•</Text>
                        <Text style={styles.lenderMetaText}>
                          TAT: {selectedLender.lenderProfile?.turnaroundTime || '24-48 Hours'}
                        </Text>
                        {(selectedLender.city || selectedLender.state) && (
                          <>
                            <Text style={styles.lenderMetaBullet}>•</Text>
                            <Text style={styles.lenderMetaText} numberOfLines={1}>
                              {[selectedLender.city, selectedLender.state].filter(Boolean).join(', ')}
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.viewProfileBtn}
                    activeOpacity={0.8}
                    onPress={() =>
                      navigation.navigate('BorrowerLenderDetails', {
                        id: selectedLender._id,
                        lenderId: selectedLender._id,
                      })
                    }
                  >
                    <Feather name="eye" size={m(13)} color={colors.lettersAndIcons} />
                    <Text style={styles.viewProfileBtnText}>View Lender Profile</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.noLenderCard}
                  activeOpacity={0.8}
                  onPress={() =>
                    navigation.navigate('BorrowerExploreLenders', {
                      selectMode: true,
                    })
                  }
                >
                  <Feather name="plus-circle" size={m(22)} color="#2563eb" />
                  <Text style={styles.noLenderTitle}>No Lender Selected</Text>
                  <Text style={styles.noLenderSub}>Tap to browse and select a verified financing partner</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ── Section 2: Financing Requirements ── */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderLeft}>
                  <Feather name="credit-card" size={m(16)} color="#059669" />
                  <Text style={styles.cardHeaderTitle}>Financing Requirements</Text>
                </View>
              </View>

              {/* ── Repayment Structure Selector (Monthly EMI vs One-Time) ── */}
              <View style={styles.inputGroup}>
                <View style={styles.labelWithSubRow}>
                  <Text style={styles.inputLabel}>
                    Repayment Type <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <Text style={styles.labelSubHint}>
                    {repaymentType === 'EMI' ? 'Regular monthly installments' : 'Lump sum bullet payout at maturity'}
                  </Text>
                </View>

                <View style={styles.repaymentCardsRow}>
                  {/* Option 1: Monthly EMI Plan */}
                  <TouchableOpacity
                    style={[
                      styles.repaymentOptionCard,
                      repaymentType === 'EMI' && styles.repaymentOptionCardActiveEmi,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => handleRepaymentTypeChange('EMI')}
                  >
                    <View style={styles.repaymentCardTopRow}>
                      <View style={styles.repaymentCardLeft}>
                        <View
                          style={[
                            styles.repaymentIconWrap,
                            repaymentType === 'EMI'
                              ? { backgroundColor: '#2563eb' }
                              : { backgroundColor: '#e2e8f0' },
                          ]}
                        >
                          <Feather
                            name="credit-card"
                            size={m(15)}
                            color={repaymentType === 'EMI' ? colors.white : '#64748b'}
                          />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.repaymentCardTitle}>Monthly EMI Plan</Text>
                          <Text style={styles.repaymentCardSubtitle} numberOfLines={1}>
                            Equal monthly installments
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.radioCircle,
                          repaymentType === 'EMI' && styles.radioCircleActiveEmi,
                        ]}
                      >
                        {repaymentType === 'EMI' && <Feather name="check" size={m(11)} color={colors.white} />}
                      </View>
                    </View>

                    <View style={styles.repaymentBottomRow}>
                      <Text style={styles.repaymentBottomLabel}>Est. Monthly EMI:</Text>
                      <Text style={styles.repaymentBottomValueEmi}>
                        {formatINR(emiCalc.emi)} / mo
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Option 2: One-Time Bullet Payment */}
                  <TouchableOpacity
                    style={[
                      styles.repaymentOptionCard,
                      repaymentType === 'ONE_TIME' && styles.repaymentOptionCardActiveBullet,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => handleRepaymentTypeChange('ONE_TIME')}
                  >
                    <View style={styles.repaymentCardTopRow}>
                      <View style={styles.repaymentCardLeft}>
                        <View
                          style={[
                            styles.repaymentIconWrap,
                            repaymentType === 'ONE_TIME'
                              ? { backgroundColor: '#7c3aed' }
                              : { backgroundColor: '#e2e8f0' },
                          ]}
                        >
                          <Feather
                            name="calendar"
                            size={m(15)}
                            color={repaymentType === 'ONE_TIME' ? colors.white : '#64748b'}
                          />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.repaymentCardTitle}>One-Time Bullet Payment</Text>
                          <Text style={styles.repaymentCardSubtitle} numberOfLines={1}>
                            Pay total at end of tenure
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.radioCircle,
                          repaymentType === 'ONE_TIME' && styles.radioCircleActiveBullet,
                        ]}
                      >
                        {repaymentType === 'ONE_TIME' && <Feather name="check" size={m(11)} color={colors.white} />}
                      </View>
                    </View>

                    <View style={styles.repaymentBottomRow}>
                      <Text style={styles.repaymentBottomLabel}>Due at Maturity:</Text>
                      <Text style={styles.repaymentBottomValueBullet}>
                        {formatINR(oneTimeCalc.totalPayable)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* ── Quick Amount Presets (Matches Web 1:1) ── */}
              <View style={styles.inputGroup}>
                <Text style={styles.sectionMicroLabel}>QUICK AMOUNT PRESETS</Text>
                <View style={styles.presetChipsWrap}>
                  {AMOUNT_PRESETS.map((p) => {
                    const isSelected = Number(amount) === p.val;
                    return (
                      <TouchableOpacity
                        key={p.val}
                        style={[
                          styles.amountPresetChip,
                          isSelected && styles.amountPresetChipActive,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => setAmount(String(p.val))}
                      >
                        <Text
                          style={[
                            styles.amountPresetChipText,
                            isSelected && styles.amountPresetChipTextActive,
                          ]}
                        >
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* ── Loan Amount Input ── */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Loan Amount (₹ INR) <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <View style={styles.inputWithPrefixWrap}>
                  <Text style={styles.inputPrefix}>₹</Text>
                  <TextInput
                    style={styles.textInputWithPrefix}
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="100000"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              {/* ── Loan Purpose / Facility Type ── */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Loan Purpose / Facility Type <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.dropdownSelector}
                  activeOpacity={0.8}
                  onPress={() =>
                    setPickerModal({
                      visible: true,
                      title: 'Select Facility / Loan Purpose',
                      options: PURPOSE_OPTIONS.map((p) => ({ label: p, value: p })),
                      selectedValue: purpose,
                      onSelect: (val) => setPurpose(val),
                    })
                  }
                >
                  <Text style={styles.dropdownValueText}>{purpose}</Text>
                  <Feather name="chevron-down" size={m(16)} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* ── Facility Tenure ── */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {repaymentType === 'ONE_TIME' ? 'Repayment Period / Bullet Duration' : 'Tenure (Months)'}{' '}
                  <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.dropdownSelector}
                  activeOpacity={0.8}
                  onPress={() => {
                    const options =
                      repaymentType === 'ONE_TIME'
                        ? ONE_TIME_TENURES.map((t) => ({ label: t.label, value: String(t.val) }))
                        : EMI_TENURES.map((t) => ({ label: t.label, value: String(t.val) }));
                    setPickerModal({
                      visible: true,
                      title: repaymentType === 'ONE_TIME' ? 'Select Bullet Duration' : 'Select Facility Tenure',
                      options,
                      selectedValue: tenureMonths,
                      onSelect: (val) => setTenureMonths(val),
                    });
                  }}
                >
                  <Text style={styles.dropdownValueText}>
                    {repaymentType === 'ONE_TIME'
                      ? ONE_TIME_TENURES.find((t) => String(t.val) === tenureMonths)?.label || `${tenureMonths} Months`
                      : EMI_TENURES.find((t) => String(t.val) === tenureMonths)?.label || `${tenureMonths} Months`}
                  </Text>
                  <Feather name="chevron-down" size={m(16)} color="#64748b" />
                </TouchableOpacity>
                {repaymentType === 'ONE_TIME' && (
                  <Text style={styles.helperPurpleNote}>
                    * Full principal + total interest will be paid on this maturity date.
                  </Text>
                )}
              </View>

              {/* ── Target Requested APR (% p.a.) ── */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {repaymentType === 'ONE_TIME'
                    ? 'Requested Indicative APR (% p.a.)'
                    : 'Target Requested APR (% p.a.)'}
                </Text>
                <View style={styles.inputWithSuffixWrap}>
                  <TextInput
                    style={styles.textInputWithSuffix}
                    keyboardType="numeric"
                    value={requestedRate}
                    onChangeText={setRequestedRate}
                    placeholder="10.5"
                    placeholderTextColor="#94a3b8"
                  />
                  <Text style={styles.inputSuffix}>% p.a.</Text>
                </View>
                {repaymentType === 'ONE_TIME' && (
                  <Text style={styles.helperPurpleNote}>
                    * For one-time payment, the lender will set the final interest manually upon sanctioning.
                  </Text>
                )}
              </View>

              {/* ── CIBIL / Credit Score (300 - 900) ── */}
              <View style={styles.inputGroup}>
                <View style={styles.labelWithSubRow}>
                  <Text style={styles.inputLabel}>
                    CIBIL / Credit Score (300 - 900) <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <View
                    style={[
                      styles.riskGradeBadge,
                      {
                        backgroundColor: creditGrade.bgColor,
                        borderColor: creditGrade.borderColor,
                      },
                    ]}
                  >
                    <Text style={[styles.riskGradeBadgeText, { color: creditGrade.textColor }]}>
                      {creditGrade.label}
                    </Text>
                  </View>
                </View>

                <TextInput
                  style={styles.standardTextInput}
                  keyboardType="numeric"
                  maxLength={3}
                  value={creditScore}
                  onChangeText={setCreditScore}
                  placeholder="750"
                  placeholderTextColor="#94a3b8"
                />
                <Text style={styles.scoreScaleHint}>
                  750+ = Grade A • 650 - 749 = Grade B • &lt;650 = Grade C
                </Text>
              </View>

              {/* ── Dynamic Repayment Schedule Preview Card (Matches Web 1:1) ── */}
              <View style={styles.schedulePreviewCard}>
                <View style={styles.schedulePreviewHeader}>
                  <View style={styles.scheduleHeaderTitleRow}>
                    <Feather name="activity" size={m(15)} color="#2563eb" />
                    <Text style={styles.scheduleHeaderTitle}>
                      {repaymentType === 'EMI'
                        ? 'Monthly EMI Schedule Preview'
                        : 'One-Time Maturity Payout Preview'}
                    </Text>
                  </View>
                  <View style={styles.scheduleRateTenureBadge}>
                    <Text style={styles.scheduleRateTenureBadgeText}>
                      {requestedRate}% APR • {tenureMonths} Mos
                    </Text>
                  </View>
                </View>

                <View style={styles.previewGrid}>
                  {/* Item 1: Principal Amount */}
                  <View style={styles.previewGridBox}>
                    <Text style={styles.previewBoxLabel}>Principal Amount</Text>
                    <Text style={styles.previewBoxValuePrincipal}>
                      {formatINR(amount)}
                    </Text>
                  </View>

                  {repaymentType === 'EMI' ? (
                    <>
                      {/* Item 2: Monthly Installment */}
                      <View style={styles.previewGridBox}>
                        <Text style={styles.previewBoxLabel}>Monthly Installment</Text>
                        <Text style={styles.previewBoxValueEmi}>
                          {formatINR(emiCalc.emi)}
                        </Text>
                      </View>
                      {/* Item 3: Estimated Interest */}
                      <View style={styles.previewGridBox}>
                        <Text style={styles.previewBoxLabel}>Estimated Interest</Text>
                        <Text style={styles.previewBoxValueInterest}>
                          {formatINR(emiCalc.totalInterest)}
                        </Text>
                      </View>
                      {/* Item 4: Total Repayment */}
                      <View style={styles.previewGridBox}>
                        <Text style={styles.previewBoxLabel}>Total Repayment</Text>
                        <Text style={styles.previewBoxValueTotal}>
                          {formatINR(emiCalc.totalPayable)}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <>
                      {/* Item 2: Accrued Interest */}
                      <View style={styles.previewGridBox}>
                        <Text style={styles.previewBoxLabel}>Accrued Interest</Text>
                        <Text style={styles.previewBoxValueInterest}>
                          {formatINR(oneTimeCalc.totalInterest)}
                        </Text>
                      </View>
                      {/* Item 3: Total at Maturity */}
                      <View style={styles.previewGridBox}>
                        <Text style={styles.previewBoxLabel}>Total at Maturity</Text>
                        <Text style={styles.previewBoxValueBullet}>
                          {formatINR(oneTimeCalc.totalPayable)}
                        </Text>
                      </View>
                      {/* Item 4: Maturity Date */}
                      <View style={styles.previewGridBox}>
                        <Text style={styles.previewBoxLabel}>Maturity Date</Text>
                        <Text style={styles.previewBoxValueDate}>
                          {oneTimeCalc.maturityDate}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </View>

              {/* ── Pledged Security / Collateral Offered (Optional / As Agreed) ── */}
              <View style={styles.collateralContainer}>
                <View style={styles.collateralHeaderRow}>
                  <View style={styles.collateralTitleWrap}>
                    <Feather name="shield" size={m(15)} color="#d97706" />
                    <Text style={styles.collateralHeaderTitle}>
                      Pledged Security / Collateral Offered{' '}
                      <Text style={styles.collateralOptionalText}>(Optional / As Agreed)</Text>
                    </Text>
                  </View>
                  <View style={styles.collateralLegalBadge}>
                    <Text style={styles.collateralLegalBadgeText}>
                      Recorded in Legal Contract
                    </Text>
                  </View>
                </View>

                <Text style={styles.collateralDescription}>
                  Manually mention what physical item or asset you are pledging as security (such as gold, a bike, car, fixed deposit, or property documents).
                </Text>

                <TextInput
                  style={styles.collateralInput}
                  value={pledgedSecurity}
                  onChangeText={setPledgedSecurity}
                  placeholder="e.g. Gold Jewellery (22K, 45 grams) OR Hero Splendor Bike (MH-12-AB-1234) OR Commercial Shop Documents"
                  placeholderTextColor="#94a3b8"
                  multiline={false}
                />

                {/* Quick Suggestion Chips */}
                <View style={styles.collateralSuggestionsSection}>
                  <Text style={styles.suggestionsHeaderLabel}>Quick Suggestions:</Text>
                  <View style={styles.suggestionsChipsWrap}>
                    {COLLATERAL_SUGGESTIONS.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={styles.suggestionChip}
                        activeOpacity={0.75}
                        onPress={() =>
                          setPledgedSecurity((prev) => (prev ? `${prev}, ${item}` : item))
                        }
                      >
                        <Text style={styles.suggestionChipText}>+ {item}</Text>
                      </TouchableOpacity>
                    ))}
                    {!!pledgedSecurity && (
                      <TouchableOpacity
                        style={styles.clearCollateralChip}
                        activeOpacity={0.75}
                        onPress={() => setPledgedSecurity('')}
                      >
                        <Text style={styles.clearCollateralChipText}>Clear</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>

              {/* ── Additional Notes / Collateral Overview (Optional) ── */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Additional Notes / Collateral Overview (Optional)
                </Text>
                <TextInput
                  style={styles.notesTextarea}
                  multiline
                  numberOfLines={3}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Provide any specific requirements, existing cash flows, or collateral details..."
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            {/* ── Ready Status & Submit Button ── */}
            <View style={styles.submitSectionWrap}>
              <View style={styles.readyStatusRow}>
                <Feather name="check" size={m(14)} color="#059669" />
                <Text style={styles.readyStatusText}>
                  Ready to submit to{' '}
                  <Text style={{ fontFamily: FontFamily.primaryBold }}>{lenderNameDisplay}</Text>
                </Text>
              </View>

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
                    <Feather name="send" size={m(16)} color={colors.white} />
                    <Text style={styles.submitBtnText}>
                      Submit Application to {lenderNameDisplay}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>

      {/* ── Bottom Sheet Selection Modal (For Purpose & Tenure) ── */}
      <Modal
        visible={pickerModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerModal((p) => ({ ...p, visible: false }))}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setPickerModal((p) => ({ ...p, visible: false }))}
        >
          <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{pickerModal.title}</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setPickerModal((p) => ({ ...p, visible: false }))}
              >
                <Feather name="x" size={m(18)} color={colors.lettersAndIcons} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalOptionsList} showsVerticalScrollIndicator={false}>
              {pickerModal.options.map((opt) => {
                const isSelected = String(pickerModal.selectedValue) === String(opt.value);
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.modalOptionItem,
                      isSelected && styles.modalOptionItemActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (pickerModal.onSelect) pickerModal.onSelect(opt.value);
                      setPickerModal((p) => ({ ...p, visible: false }));
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        isSelected && styles.modalOptionTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {isSelected && <Feather name="check" size={m(16)} color="#2563eb" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Success Confirmation Modal ── */}
      <SuccessModal
        visible={showSuccessModal}
        title="Application Dispatched to Lender!"
        subtitle="48-Hour Decision Window Active"
        message={`Your loan application for ${formatINR(
          submittedAppInfo?.amount || amount
        )} has been submitted to ${
          submittedAppInfo?.lenderName || lenderNameDisplay
        }. The lender has 48 hours to evaluate your application. If not approved within 48h, you will automatically be eligible to apply with another lender.`}
        primaryButtonText="View Application Status"
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

      {/* ── Active Pending Application Info Modal (1-Lender Rule) ── */}
      <Modal
        visible={showPendingInfoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPendingInfoModal(false)}
      >
        <Pressable
          style={styles.infoModalOverlay}
          onPress={() => setShowPendingInfoModal(false)}
        >
          <Pressable style={styles.infoModalCard} onPress={(e) => e?.stopPropagation?.()}>
            {/* Header */}
            <View style={styles.infoModalHeader}>
              <View style={styles.infoModalIconWrap}>
                <Feather name="clock" size={m(20)} color="#d97706" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.infoModalTitle}>
                  Application Already Under Review
                </Text>
                <Text style={styles.infoModalSub}>
                  1 Lender Rule Policy
                </Text>
              </View>
              <TouchableOpacity
                style={styles.infoModalCloseBtn}
                onPress={() => setShowPendingInfoModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={m(18)} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Information Highlight Box */}
            <View style={styles.infoModalBodyBox}>
              <Text style={styles.infoModalBodyText}>
                You have an active pending loan request with{' '}
                <Text style={{ fontFamily: FontFamily.primaryBold, color: '#78350f' }}>
                  {activePendingApp?.lenderSnapshot?.companyName ||
                    activePendingApp?.lenderSnapshot?.userName ||
                    'your selected lender'}
                </Text>{' '}
                ({formatINR(activePendingApp?.amount)}).{' '}
                {activePendingApp?.remainingHours != null && (
                  <Text>
                    Expires in approximately{' '}
                    <Text style={{ fontFamily: FontFamily.primaryBold, color: '#78350f' }}>
                      {activePendingApp.remainingHours} hours
                    </Text>.
                  </Text>
                )}{' '}
                You will be able to apply with another lender once this request is accepted, rejected, or auto-expired.
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  // ── Top Header Banner (Clean & Simple) ──
  topBanner: {
    backgroundColor: colors.primary,
    paddingHorizontal: m(16),
    paddingTop: m(10),
    paddingBottom: m(14),
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
    marginHorizontal: m(12),
  },
  headerTag: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: 0.8,
    opacity: 0.85,
  },
  headerTitle: {
    fontSize: m(17.5),
    lineHeight: m(23),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  // ── 48-Hour Turnaround Notice Card (Below Header) ──
  turnaroundNoticeCard: {
    backgroundColor: colors.white,
    borderRadius: m(18),
    padding: m(14),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
  },
  turnaroundNoticeLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: m(10),
  },
  turnaroundNoticeIconWrap: {
    width: m(32),
    height: m(32),
    borderRadius: m(10),
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: m(1),
  },
  turnaroundNoticeTitle: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(2),
  },
  turnaroundNoticeDesc: {
    fontSize: m(11),
    lineHeight: m(16),
    fontFamily: FontFamily.primaryRegular,
    color: '#64748b',
  },
  turnaroundNoticeBold: {
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  browseLendersActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(6),
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: m(12),
    paddingVertical: m(8),
    marginTop: m(10),
  },
  browseLendersActionText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryBold,
    color: '#059669',
  },

  // ── Sheet Section ──
  sheetSection: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(28),
    borderTopRightRadius: m(28),
    paddingTop: m(14),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: m(16),
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

  // ── Alerts ──
  pendingAlertCard: {
    backgroundColor: '#fffdf0',
    borderRadius: m(16),
    padding: m(14),
    marginBottom: m(14),
    borderWidth: 1.5,
    borderColor: '#fde68a',
  },
  alertTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: m(10),
  },
  alertIconBadgeAmber: {
    width: m(36),
    height: m(36),
    borderRadius: m(10),
    backgroundColor: '#ea580c',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: m(2),
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: m(6),
    marginBottom: m(10),
  },
  alertTitleAmber: {
    flex: 1,
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryBold,
    color: '#78350f',
    lineHeight: m(17),
  },
  alertInfoBtn: {
    width: m(24),
    height: m(24),
    borderRadius: m(12),
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -m(2),
  },
  profileAlertCard: {
    backgroundColor: '#fef2f2',
    borderRadius: m(16),
    padding: m(14),
    marginBottom: m(14),
    borderWidth: 1.5,
    borderColor: '#fecaca',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
  },
  alertIconBadge: {
    width: m(32),
    height: m(32),
    borderRadius: m(8),
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: '#991b1b',
  },
  alertDesc: {
    fontSize: m(11.5),
    lineHeight: m(17),
    fontFamily: FontFamily.primaryRegular,
    color: '#92400e',
    marginBottom: m(10),
  },
  alertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(6),
    backgroundColor: '#d97706',
    paddingVertical: m(9),
    borderRadius: m(10),
  },
  alertBtnText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },

  // ── 1-Lender Policy Info Modal ──
  infoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: m(20),
  },
  infoModalCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: m(22),
    padding: m(18),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  infoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(10),
    marginBottom: m(14),
  },
  infoModalIconWrap: {
    width: m(40),
    height: m(40),
    borderRadius: m(12),
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoModalTitle: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  infoModalSub: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryMedium,
    color: '#d97706',
    marginTop: m(1),
  },
  infoModalCloseBtn: {
    width: m(30),
    height: m(30),
    borderRadius: m(15),
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoModalBodyBox: {
    backgroundColor: '#fffdf0',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: m(14),
    padding: m(14),
    marginBottom: 0,
  },
  infoModalBodyText: {
    fontSize: m(12),
    lineHeight: m(18),
    fontFamily: FontFamily.primaryRegular,
    color: '#92400e',
  },

  // ── Section Cards ──
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: m(20),
    padding: m(16),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: m(12),
    marginBottom: m(14),
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    flex: 1,
  },
  cardHeaderTitle: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    flexShrink: 1,
  },
  changeLenderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: '#eff6ff',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(8),
  },
  changeLenderText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: '#2563eb',
  },

  // ── Single Lender Hero Card ──
  lenderHeroCard: {
    backgroundColor: '#f8fafc',
    borderRadius: m(16),
    padding: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  lenderHeroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(10),
  },
  lenderHeroAvatar: {
    width: m(44),
    height: m(44),
    borderRadius: m(14),
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lenderNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(5),
  },
  lenderHeroName: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    flexShrink: 1,
  },
  verifiedBadge: {
    width: m(14),
    height: m(14),
    borderRadius: m(7),
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lenderMetaWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: m(4),
    marginTop: m(3),
  },
  lenderMetaInterest: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: '#059669',
  },
  lenderMetaBullet: {
    fontSize: m(10),
    color: '#94a3b8',
  },
  lenderMetaText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: '#64748b',
  },
  viewProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(6),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: m(10),
    paddingVertical: m(8),
    marginTop: m(10),
  },
  viewProfileBtnText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  noLenderCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(20),
    backgroundColor: '#f8fafc',
    borderRadius: m(14),
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  noLenderTitle: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginTop: m(8),
  },
  noLenderSub: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: '#64748b',
    marginTop: m(2),
  },

  // ── Input Elements ──
  inputGroup: {
    marginBottom: m(15),
  },
  inputLabel: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  requiredAsterisk: {
    color: '#e11d48',
  },
  labelWithSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(6),
  },
  labelSubHint: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: '#64748b',
  },
  sectionMicroLabel: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: '#94a3b8',
    letterSpacing: 0.6,
    marginBottom: m(6),
  },

  // ── Repayment Structure Options (Cards) ──
  repaymentCardsRow: {
    gap: m(9),
  },
  repaymentOptionCard: {
    backgroundColor: '#f8fafc',
    borderRadius: m(14),
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: m(12),
  },
  repaymentOptionCardActiveEmi: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  repaymentOptionCardActiveBullet: {
    backgroundColor: '#faf5ff',
    borderColor: '#7c3aed',
  },
  repaymentCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  repaymentCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(10),
    flex: 1,
  },
  repaymentIconWrap: {
    width: m(34),
    height: m(34),
    borderRadius: m(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  repaymentCardTitle: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  repaymentCardSubtitle: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: '#64748b',
    marginTop: m(1),
  },
  radioCircle: {
    width: m(20),
    height: m(20),
    borderRadius: m(10),
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActiveEmi: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  radioCircleActiveBullet: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  repaymentBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: m(8),
    marginTop: m(8),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  repaymentBottomLabel: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: '#64748b',
  },
  repaymentBottomValueEmi: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: '#2563eb',
  },
  repaymentBottomValueBullet: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: '#7c3aed',
  },

  // ── Amount Quick Presets ──
  presetChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(6),
  },
  amountPresetChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: m(11),
    paddingVertical: m(6),
    borderRadius: m(10),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  amountPresetChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  amountPresetChipText: {
    fontSize: m(11),
    fontFamily: FontFamily.primarySemiBold,
    color: '#334155',
  },
  amountPresetChipTextActive: {
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },

  // ── Inputs with Affix / Standard ──
  inputWithPrefixWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: m(12),
    height: m(46),
    marginTop: m(6),
  },
  inputPrefix: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginRight: m(8),
  },
  textInputWithPrefix: {
    flex: 1,
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    padding: 0,
  },
  inputWithSuffixWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: m(12),
    height: m(46),
    marginTop: m(6),
  },
  textInputWithSuffix: {
    flex: 1,
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    padding: 0,
  },
  inputSuffix: {
    fontSize: m(12),
    fontFamily: FontFamily.primarySemiBold,
    color: '#64748b',
    marginLeft: m(6),
  },
  standardTextInput: {
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: m(12),
    height: m(46),
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginTop: m(6),
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: m(12),
    height: m(46),
    marginTop: m(6),
  },
  dropdownValueText: {
    fontSize: m(13),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.lettersAndIcons,
  },
  helperPurpleNote: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryMedium,
    color: '#7c3aed',
    marginTop: m(4),
  },

  // ── Risk Grade Badge ──
  riskGradeBadge: {
    paddingHorizontal: m(8),
    paddingVertical: m(2),
    borderRadius: m(6),
    borderWidth: 1,
  },
  riskGradeBadgeText: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
  },
  scoreScaleHint: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryRegular,
    color: '#94a3b8',
    marginTop: m(4),
  },

  // ── Schedule Preview Card (Matches Web 1:1) ──
  schedulePreviewCard: {
    backgroundColor: '#eff6ff',
    borderRadius: m(16),
    padding: m(12),
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: m(15),
  },
  schedulePreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(10),
  },
  scheduleHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
    flex: 1,
  },
  scheduleHeaderTitle: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  scheduleRateTenureBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: m(8),
    paddingVertical: m(2),
    borderRadius: m(6),
  },
  scheduleRateTenureBadgeText: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: '#1d4ed8',
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(8),
  },
  previewGridBox: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: m(10),
    padding: m(10),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  previewBoxLabel: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryMedium,
    color: '#64748b',
    marginBottom: m(2),
  },
  previewBoxValuePrincipal: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  previewBoxValueEmi: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: '#2563eb',
  },
  previewBoxValueInterest: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: '#d97706',
  },
  previewBoxValueTotal: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: '#059669',
  },
  previewBoxValueBullet: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: '#7c3aed',
  },
  previewBoxValueDate: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  // ── Collateral Offered Box (Matches Web Amber Theme) ──
  collateralContainer: {
    backgroundColor: '#fffbeb',
    borderRadius: m(16),
    padding: m(14),
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: m(15),
  },
  collateralHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: m(6),
    marginBottom: m(6),
  },
  collateralTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
    flex: 1,
  },
  collateralHeaderTitle: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  collateralOptionalText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: '#94a3b8',
  },
  collateralLegalBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: m(6),
    paddingVertical: m(2),
    borderRadius: m(4),
  },
  collateralLegalBadgeText: {
    fontSize: m(8.5),
    fontFamily: FontFamily.primaryBold,
    color: '#b45309',
  },
  collateralDescription: {
    fontSize: m(11),
    lineHeight: m(15.5),
    fontFamily: FontFamily.primaryRegular,
    color: '#78716c',
    marginBottom: m(10),
  },
  collateralInput: {
    backgroundColor: colors.white,
    borderRadius: m(10),
    borderWidth: 1,
    borderColor: '#fcd34d',
    paddingHorizontal: m(12),
    paddingVertical: m(9),
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
    marginBottom: m(10),
  },
  collateralSuggestionsSection: {
    paddingTop: m(2),
  },
  suggestionsHeaderLabel: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: '#94a3b8',
    marginBottom: m(6),
  },
  suggestionsChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(5),
  },
  suggestionChip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: m(8),
    paddingHorizontal: m(8),
    paddingVertical: m(5),
  },
  suggestionChipText: {
    fontSize: m(10),
    fontFamily: FontFamily.primarySemiBold,
    color: '#78716c',
  },
  clearCollateralChip: {
    paddingHorizontal: m(8),
    paddingVertical: m(5),
  },
  clearCollateralChipText: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: '#e11d48',
  },

  // ── Notes Textarea ──
  notesTextarea: {
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: m(12),
    paddingVertical: m(10),
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
    height: m(75),
    textAlignVertical: 'top',
    marginTop: m(6),
  },

  // ── Submit Section ──
  submitSectionWrap: {
    paddingTop: m(4),
  },
  readyStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(6),
    marginBottom: m(10),
  },
  readyStatusText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryRegular,
    color: '#059669',
  },
  submitBtn: {
    backgroundColor: colors.lettersAndIcons,
    borderRadius: m(16),
    paddingVertical: m(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
    elevation: 3,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },

  // ── Modal Bottom Sheet ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: m(24),
    borderTopRightRadius: m(24),
    paddingHorizontal: m(18),
    paddingTop: m(10),
    paddingBottom: m(30),
    maxHeight: '60%',
  },
  modalHandle: {
    width: m(38),
    height: m(4),
    borderRadius: m(2),
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginBottom: m(12),
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: m(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: m(8),
  },
  modalTitle: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  modalCloseBtn: {
    padding: m(4),
  },
  modalOptionsList: {
    marginTop: m(4),
  },
  modalOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: m(12),
    paddingHorizontal: m(12),
    borderRadius: m(12),
    marginBottom: m(4),
  },
  modalOptionItemActive: {
    backgroundColor: '#eff6ff',
  },
  modalOptionText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
  },
  modalOptionTextActive: {
    fontFamily: FontFamily.primaryBold,
    color: '#2563eb',
  },
});
