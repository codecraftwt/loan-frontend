import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { m } from 'walstar-rn-responsive';
import { colors } from '../../../constants';
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
  const [selectedLender, setSelectedLender] = useState(null);
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
        if (preselectedLender) {
          const found = list.find((l) => l._id === preselectedLender._id);
          setSelectedLender(found || preselectedLender);
        } else if (list.length > 0 && !selectedLender) {
          setSelectedLender(list[0]);
        }
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
  }, [preselectedLender, selectedLender]);

  useFocusEffect(
    useCallback(() => {
      fetchPrerequisites();
    }, [fetchPrerequisites])
  );

  // Real-time EMI Calculator
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
      Alert.alert(
        'Active Application in Review',
        `You already have an active loan application with ${lenderName}. In accordance with commercial lending rules, borrowers can have 1 active application under review at a time. Please wait for a decision or view status in My Applications.`,
        [
          { text: 'View Applications', onPress: () => navigation.navigate('BorrowerApplications') },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    if (!profileCompletion.isComplete) {
      Alert.alert(
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
      Alert.alert('Selection Required', 'Please select an institutional lender.');
      return;
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount < 1000) {
      Alert.alert('Validation Error', 'Minimum loan amount is ₹1,000');
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
        Alert.alert(
          'Application Submitted!',
          `Your loan application of ${formatINR(numAmount)} has been submitted to ${
            selectedLender.companyName || selectedLender.userName
          }. The institution has a 48-hour review window.`,
          [
            {
              text: 'View Applications',
              onPress: () => navigation.navigate('BorrowerApplications'),
            },
          ]
        );
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit loan application.';
      Alert.alert('Application Notice', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={m(22)} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Apply for Commercial Loan</Text>
        <View style={{ width: m(22) }} />
      </View>

      {loadingPrereqs ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Checking prerequisites & lending limits...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Active Pending Application Warning */}
          {activePendingApp ? (
            <View style={styles.pendingAlertCard}>
              <View style={styles.alertHeader}>
                <Feather name="clock" size={m(16)} color="#D97706" />
                <Text style={styles.alertTitle}>Active Application in Review</Text>
              </View>
              <Text style={styles.alertDesc}>
                You currently have an application under review with{' '}
                <Text style={styles.boldText}>
                  {activePendingApp.lenderSnapshot?.companyName ||
                    activePendingApp.lenderSnapshot?.userName ||
                    activePendingApp.lenderId?.companyName ||
                    'an institutional lender'}
                </Text>
                . Single-lender review protocol is active.
              </Text>
              <TouchableOpacity
                style={styles.alertBtn}
                onPress={() => navigation.navigate('BorrowerApplications')}
              >
                <Text style={styles.alertBtnText}>Go to My Applications</Text>
                <Feather name="arrow-right" size={m(12)} color="#D97706" />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Profile Completion Warning */}
          {!profileCompletion.isComplete ? (
            <View style={styles.profileAlertCard}>
              <View style={styles.alertHeader}>
                <Feather name="alert-triangle" size={m(16)} color="#DC2626" />
                <Text style={[styles.alertTitle, { color: '#DC2626' }]}>
                  Profile {profileCompletion.percentage}% Complete
                </Text>
              </View>
              <Text style={styles.alertDesc}>
                Complete statutory business and address details before applying for financing.
              </Text>
              <TouchableOpacity
                style={[styles.alertBtn, { borderColor: '#DC2626' }]}
                onPress={() => navigation.navigate('BorrowerProfileScreen')}
              >
                <Text style={[styles.alertBtnText, { color: '#DC2626' }]}>Complete Profile Details</Text>
                <Feather name="arrow-right" size={m(12)} color="#DC2626" />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Real-time Dynamic EMI Calculator Card */}
          <View style={styles.calculatorCard}>
            <View style={styles.calcHeader}>
              <Text style={styles.calcTag}>ESTIMATED REPAYMENT SCHEDULE</Text>
              <View style={styles.calcTypeBadge}>
                <Text style={styles.calcTypeBadgeText}>{repaymentType}</Text>
              </View>
            </View>

            <View style={styles.emiHighlightRow}>
              <Text style={styles.emiAmount}>
                ₹{emiCalculation.monthlyEmi.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.emiPerMonth}>/ month</Text>
            </View>

            <View style={styles.calcBreakdownRow}>
              <View style={styles.calcBreakdownItem}>
                <Text style={styles.calcBLabel}>Principal</Text>
                <Text style={styles.calcBVal}>{formatINR(amount)}</Text>
              </View>
              <View style={styles.calcBreakdownItem}>
                <Text style={styles.calcBLabel}>Total Interest</Text>
                <Text style={styles.calcBVal}>
                  ₹{emiCalculation.totalInterest.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.calcBreakdownItem}>
                <Text style={styles.calcBLabel}>Total Repayable</Text>
                <Text style={styles.calcBVal}>
                  ₹{emiCalculation.totalPayable.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          </View>

          {/* Section 1: Choose Target Institution */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>1. Target Institutional Lender</Text>
              <Text style={styles.sectionSubtitle}>
                {selectedLender ? 'Selected' : 'Choose 1 lender'}
              </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.lendersRow}>
              {availableLenders.map((item) => {
                const isSelected = selectedLender?._id === item._id;
                return (
                  <TouchableOpacity
                    key={item._id}
                    style={[styles.lenderSelectCard, isSelected && styles.selectedLenderCard]}
                    onPress={() => setSelectedLender(item)}
                  >
                    <View style={styles.lenderCardTop}>
                      <View style={[styles.lenderIcon, isSelected && styles.selectedLenderIcon]}>
                        <Feather
                          name="shield"
                          size={m(14)}
                          color={isSelected ? colors.white : '#2563EB'}
                        />
                      </View>
                      {isSelected ? (
                        <Feather name="check-circle" size={m(16)} color="#2563EB" />
                      ) : null}
                    </View>
                    <Text
                      style={[styles.lenderSelectName, isSelected && styles.selectedLenderName]}
                      numberOfLines={1}
                    >
                      {item.companyName || item.userName}
                    </Text>
                    <Text style={styles.lenderSelectRate}>
                      From {item.lenderProfile?.minInterestRate || 10.5}% p.a.
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Section 2: Loan Amount & Facility Parameters */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>2. Loan Facility Details</Text>

            {/* Loan Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Requested Loan Amount (₹)</Text>
              <View style={styles.currencyInputWrap}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.currencyInput}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="e.g. 500000"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              {/* Amount Quick Chips */}
              <View style={styles.presetChipsRow}>
                {AMOUNT_PRESETS.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.presetChip, Number(amount) === p && styles.activePresetChip]}
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
                    style={[styles.purposeOpt, purpose === opt && styles.activePurposeOpt]}
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

            {/* Tenure Input & Presets */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Facility Tenure (Months)</Text>
              <View style={styles.presetChipsRow}>
                {TENURE_PRESETS.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.presetChip, Number(tenureMonths) === t && styles.activePresetChip]}
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

            {/* Repayment Type Toggle */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Repayment Structure</Text>
              <View style={styles.repaymentToggle}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    repaymentType === 'EMI' && styles.activeToggleBtn,
                  ]}
                  onPress={() => setRepaymentType('EMI')}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      repaymentType === 'EMI' && styles.activeToggleBtnText,
                    ]}
                  >
                    Monthly Amortizing EMI
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    repaymentType === 'ONE_TIME' && styles.activeToggleBtn,
                  ]}
                  onPress={() => setRepaymentType('ONE_TIME')}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      repaymentType === 'ONE_TIME' && styles.activeToggleBtnText,
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
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Pledged Collateral */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pledged Collateral / Security (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={pledgedSecurity}
                onChangeText={setPledgedSecurity}
                placeholder="e.g. Commercial inventory, equipment hypothecation, receivables"
                placeholderTextColor="#94A3B8"
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
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Submit Action Button */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              (submitting || !!activePendingApp) && styles.disabledBtn,
            ]}
            onPress={handleSubmit}
            disabled={submitting || !!activePendingApp}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Submit Loan Application</Text>
                <Feather name="send" size={m(16)} color={colors.white} />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
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
    padding: m(20),
  },
  loadingText: {
    fontSize: m(13),
    color: '#64748B',
    marginTop: m(10),
  },
  header: {
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
    fontSize: m(16),
    fontWeight: '700',
    color: '#0F172A',
  },
  backIcon: {
    padding: m(4),
  },
  scrollContent: {
    padding: m(16),
    gap: m(16),
    paddingBottom: m(100),
  },
  pendingAlertCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: m(14),
    padding: m(14),
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  profileAlertCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: m(14),
    padding: m(14),
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
  },
  alertTitle: {
    fontSize: m(13),
    fontWeight: '700',
    color: '#D97706',
  },
  alertDesc: {
    fontSize: m(11),
    color: '#475569',
    marginTop: m(4),
    lineHeight: m(16),
  },
  boldText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  alertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    alignSelf: 'flex-start',
    marginTop: m(8),
    paddingVertical: m(4),
  },
  alertBtnText: {
    fontSize: m(11),
    fontWeight: '700',
    color: '#D97706',
  },
  calculatorCard: {
    backgroundColor: '#0F172A',
    borderRadius: m(18),
    padding: m(18),
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  calcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcTag: {
    fontSize: m(9),
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  calcTypeBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(6),
  },
  calcTypeBadgeText: {
    fontSize: m(10),
    fontWeight: '700',
    color: '#38BDF8',
  },
  emiHighlightRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: m(10),
    gap: m(6),
  },
  emiAmount: {
    fontSize: m(28),
    fontWeight: '800',
    color: colors.white,
  },
  emiPerMonth: {
    fontSize: m(13),
    color: '#94A3B8',
    fontWeight: '600',
  },
  calcBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: m(12),
    padding: m(12),
    marginTop: m(14),
  },
  calcBreakdownItem: {
    alignItems: 'center',
  },
  calcBLabel: {
    fontSize: m(9),
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  calcBVal: {
    fontSize: m(12),
    fontWeight: '700',
    color: colors.white,
    marginTop: m(2),
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: m(14),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: m(14),
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: m(11),
    color: '#64748B',
  },
  lendersRow: {
    flexDirection: 'row',
    marginTop: m(4),
  },
  lenderSelectCard: {
    width: m(150),
    backgroundColor: '#F8FAFC',
    borderRadius: m(12),
    padding: m(12),
    marginRight: m(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedLenderCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
    borderWidth: 2,
  },
  lenderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lenderIcon: {
    width: m(28),
    height: m(28),
    borderRadius: m(8),
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedLenderIcon: {
    backgroundColor: '#2563EB',
  },
  lenderSelectName: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#0F172A',
    marginTop: m(8),
  },
  selectedLenderName: {
    color: '#2563EB',
  },
  lenderSelectRate: {
    fontSize: m(10),
    color: '#64748B',
    marginTop: m(2),
  },
  inputGroup: {
    gap: m(6),
  },
  inputLabel: {
    fontSize: m(12),
    fontWeight: '600',
    color: '#334155',
  },
  currencyInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: m(12),
    paddingHorizontal: m(12),
  },
  currencySymbol: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#64748B',
    marginRight: m(6),
  },
  currencyInput: {
    flex: 1,
    fontSize: m(15),
    fontWeight: '700',
    color: '#0F172A',
    paddingVertical: m(10),
  },
  presetChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(6),
    marginTop: m(4),
  },
  presetChip: {
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    borderRadius: m(8),
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activePresetChip: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  presetChipText: {
    fontSize: m(11),
    fontWeight: '600',
    color: '#475569',
  },
  activePresetChipText: {
    color: colors.white,
  },
  purposeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(6),
  },
  purposeOpt: {
    paddingHorizontal: m(10),
    paddingVertical: m(7),
    borderRadius: m(8),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activePurposeOpt: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  purposeOptText: {
    fontSize: m(11),
    fontWeight: '600',
    color: '#475569',
  },
  activePurposeOptText: {
    color: colors.white,
  },
  repaymentToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: m(10),
    padding: m(3),
    gap: m(4),
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: m(8),
    alignItems: 'center',
    borderRadius: m(8),
  },
  activeToggleBtn: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleBtnText: {
    fontSize: m(11),
    fontWeight: '600',
    color: '#64748B',
  },
  activeToggleBtnText: {
    color: '#0F172A',
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: m(10),
    paddingHorizontal: m(12),
    paddingVertical: m(10),
    fontSize: m(13),
    color: '#0F172A',
  },
  multilineInput: {
    minHeight: m(65),
    textAlignVertical: 'top',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
    backgroundColor: '#2563EB',
    borderRadius: m(14),
    paddingVertical: m(14),
    marginTop: m(8),
  },
  disabledBtn: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: m(15),
    fontWeight: '700',
    color: colors.white,
  },
});
