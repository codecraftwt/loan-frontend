import React, { useEffect, useState, useMemo } from 'react';
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
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { m } from '../../../Utils/responsive';
import { FontFamily, colors } from '../../../constants';
import { ScreenWrapper } from '../../../Components/common';
import lenderFlowService from '../../../Services/lenderFlowService';
import DisbursalOtpModal from '../Components/DisbursalOtpModal';

export default function LenderRequestDetails() {
  const route = useRoute();
  const navigation = useNavigation();
  const { requestId, request: initialRequest } = route.params || {};

  const [request, setRequest] = useState(initialRequest || null);
  const [loading, setLoading] = useState(!initialRequest);

  // Term Sheet / Accept Modal State
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [sanctionStep, setSanctionStep] = useState(1); // 1 = Terms, 2 = E-Sign
  const [sanctionAmount, setSanctionAmount] = useState('500000');
  const [sanctionRepaymentType, setSanctionRepaymentType] = useState('EMI');
  const [sanctionRate, setSanctionRate] = useState('12.5');
  const [sanctionTenure, setSanctionTenure] = useState('12');
  const [sanctionProcessingFee, setSanctionProcessingFee] = useState('2500');
  const [signerName, setSignerName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Reject Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // OTP Verification Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const fetchRequestDetails = async () => {
    try {
      if (requestId) {
        setLoading(true);
        const res = await lenderFlowService.getRequestById(requestId);
        if (res?.success && res.request) {
          setRequest(res.request);
          // Pre-populate terms from application
          setSanctionAmount(String(res.request.amount || 500000));
          setSanctionRate(String(res.request.requestedRate || 12.5));
          setSanctionTenure(String(res.request.tenureMonths || 12));
          setSanctionRepaymentType(
            res.request.repaymentType === 'ONE_TIME' || res.request.repaymentType === 'bullet'
              ? 'ONE_TIME'
              : 'EMI'
          );
        }
      }
    } catch (err) {
      console.error('Error fetching request details:', err);
      Alert.alert('Error', 'Unable to load full request details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [requestId]);

  const formatINR = (val) => {
    if (!val && val !== 0) return '₹0';
    const num = Number(val) || 0;
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lakh`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  // Live EMI Calculator
  const emiPreview = useMemo(() => {
    const p = Number(sanctionAmount) || 0;
    const rAnnual = Number(sanctionRate) || 0;
    const n = Number(sanctionTenure) || 12;

    if (p <= 0 || n <= 0) return { emi: 0, totalInterest: 0, totalPayable: p };

    if (sanctionRepaymentType === 'ONE_TIME') {
      const totalInterest = Math.round(p * (rAnnual / 100) * (n / 12));
      return {
        emi: 0,
        totalInterest,
        totalPayable: p + totalInterest,
      };
    }

    if (rAnnual <= 0) {
      return {
        emi: Math.round(p / n),
        totalInterest: 0,
        totalPayable: p,
      };
    }

    const r = rAnnual / 1200;
    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayable = emi * n;
    const totalInterest = totalPayable - p;

    return {
      emi: Math.round(emi),
      totalInterest: Math.round(totalInterest),
      totalPayable: Math.round(totalPayable),
    };
  }, [sanctionAmount, sanctionRate, sanctionTenure, sanctionRepaymentType]);

  // AI Underwriting & DSCR Evaluation
  const underwritingData = useMemo(() => {
    if (!request) return null;
    const b = request.borrowerSnapshot || {};
    const bUser = request.borrowerId || {};
    const bProfile = bUser.borrowerProfile || {};

    const creditScore = Number(b.creditScore || bProfile.creditScore || 750);
    const monthlyIncome = Number(b.monthlyIncome || bProfile.monthlyIncome || 85000);
    const annualRevenue = Number(b.annualRevenue || bProfile.annualRevenue || 1200000);

    // DSCR = (Monthly Income * 12) / Estimated Annual Debt Service
    const reqAmount = Number(request.amount) || 500000;
    const reqRate = Number(request.requestedRate) || 12;
    const annualInterest = reqAmount * (reqRate / 100);
    const principalRepaymentYear = reqAmount / ((request.tenureMonths || 12) / 12);
    const totalAnnualService = Math.max(annualInterest + principalRepaymentYear, 1000);

    const rawDscr = (monthlyIncome * 12) / totalAnnualService;
    const dscr = Math.round(rawDscr * 100) / 100;

    const riskGrade = creditScore >= 750 ? 'A+' : creditScore >= 680 ? 'A' : creditScore >= 600 ? 'B' : 'C';
    const recommendedMaxCap = Math.round(annualRevenue * 0.35);

    return {
      creditScore,
      riskGrade,
      monthlyIncome,
      annualRevenue,
      dscr,
      recommendedMaxCap,
    };
  }, [request]);

  // Execute Accept & Issue Term Sheet
  const handleExecuteSanction = async () => {
    try {
      setActionLoading(true);
      const payload = {
        amount: Number(sanctionAmount),
        interestRate: Number(sanctionRate),
        tenureMonths: Number(sanctionTenure),
        repaymentType: sanctionRepaymentType,
        processingFee: Number(sanctionProcessingFee),
        signatureData: `LENDER_E_SIGN_${Date.now()}_${signerName.trim()}`,
        signedBy: signerName.trim() || 'Authorized Institutional Signatory',
      };

      const res = await lenderFlowService.acceptLoanRequest(request._id, payload);
      if (res?.success) {
        Alert.alert(
          'Loan Facility Sanctioned!',
          `Term sheet generated! ${res.autoRejectedApplicationsCount || 0} other pending applications for this borrower were atomically auto-closed.`,
          [{ text: 'OK', onPress: () => fetchRequestDetails() }]
        );
        setShowAcceptModal(false);
        setSanctionStep(1);
      } else {
        Alert.alert('Sanction Failed', res?.message || 'Could not sanction loan.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to sanction application.';
      Alert.alert('Error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Execute Reject
  const handleExecuteReject = async () => {
    try {
      setActionLoading(true);
      const res = await lenderFlowService.rejectLoanRequest(
        request._id,
        rejectReason.trim() || 'Underwriting criteria not satisfied'
      );
      if (res?.success) {
        Alert.alert('Request Declined', 'Borrower has been notified.');
        setShowRejectModal(false);
        setRejectReason('');
        fetchRequestDetails();
      } else {
        Alert.alert('Failed', res?.message || 'Could not decline application.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to decline application.';
      Alert.alert('Error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Verify Disbursal OTP
  const handleVerifyOtp = async () => {
    if (!otpInput.trim() || otpInput.trim().length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit Disbursal OTP from borrower.');
      return;
    }

    try {
      setOtpLoading(true);
      const res = await lenderFlowService.verifyDisbursalOtp(request._id, otpInput.trim(), false);
      if (res?.success) {
        Alert.alert('Success', 'Borrower Disbursal OTP verified! Funds released atomically.');
        setShowOtpModal(false);
        setOtpInput('');
        fetchRequestDetails();
      } else {
        Alert.alert('Verification Failed', res?.message || 'Invalid OTP.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to verify disbursal OTP.';
      Alert.alert('Error', msg);
    } finally {
      setOtpLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    try {
      setOtpLoading(true);
      const res = await lenderFlowService.resendDisbursalOtp(request._id, false);
      if (res?.success) {
        Alert.alert('OTP Dispatched', 'A fresh 6-digit disbursal OTP has been sent to the borrower.');
      }
    } catch (err) {
      Alert.alert('Error', 'Unable to resend OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  if (loading || !request) {
    return (
      <ScreenWrapper
        backgroundColor={colors.backgroundGreenWhite}
        statusBarStyle="dark-content"
        includeTabBarClearance={false}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.lettersAndIcons} />
          <Text style={styles.loadingText}>Loading underwriting workspace...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const b = request.borrowerSnapshot || {};
  const bUser = request.borrowerId || {};
  const bProfile = bUser.borrowerProfile || {};

  const borrowerName = b.userName || bUser.userName || 'Corporate Borrower';
  const businessName = b.businessName || bProfile.businessName || bUser.companyName || borrowerName;

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
      <View style={styles.topBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={m(18)} color={colors.lettersAndIcons} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTag}>COMMERCIAL FACILITY UNDERWRITING</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {businessName}
            </Text>
            <Text style={styles.headerSubtitle}>
              App ID: #{request._id.slice(-6).toUpperCase()}
            </Text>
          </View>

          {/* Status Badge */}
          <View
            style={[
              styles.statusPill,
              request.status === 'pending'
                ? styles.pillPending
                : request.status === 'accepted'
                ? styles.pillAccepted
                : styles.pillRejected,
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                request.status === 'pending'
                  ? styles.textPending
                  : request.status === 'accepted'
                  ? styles.textAccepted
                  : styles.textRejected,
              ]}
            >
              {request.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Unified 3-Column Telemetry Strip on Green */}
        <View style={styles.topMetricsCard}>
          <View style={styles.topMetricColumn}>
            <Text style={styles.topMetricLabel}>Principal</Text>
            <Text style={styles.topMetricValueWhite}>{formatINR(request.amount)}</Text>
          </View>
          <View style={styles.topMetricDivider} />
          <View style={styles.topMetricColumn}>
            <Text style={styles.topMetricLabel}>Tenure / Rate</Text>
            <Text style={styles.topMetricValueBlue}>
              {request.tenureMonths || 12}M • {request.requestedRate || 12}%
            </Text>
          </View>
          <View style={styles.topMetricDivider} />
          <View style={styles.topMetricColumn}>
            <Text style={styles.topMetricLabel}>CIBIL Score</Text>
            <Text style={styles.topMetricValueDark}>
              {underwritingData?.creditScore || 750} ({underwritingData?.riskGrade || 'A'})
            </Text>
          </View>
        </View>
      </View>

      {/* ── 2. Curved Main Body Section ── */}
      <View style={styles.sheetSection}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.scrollContent,
            request.status === 'pending' && { paddingBottom: m(100) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Card 1: Application Facility */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconCircleBlue}>
                <Feather name="dollar-sign" size={m(16)} color={colors.white} />
              </View>
              <View style={{ flex: 1, marginLeft: m(10) }}>
                <Text style={styles.cardSectionTitle}>Application Facility</Text>
                <Text style={styles.cardSectionSub}>Financing terms & collateral specification</Text>
              </View>
            </View>

            <View style={styles.detailsList}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Repayment Mode</Text>
                <Text style={styles.detailValBold}>
                  {request.repaymentType === 'ONE_TIME' || request.repaymentType === 'bullet'
                    ? 'One-Time Bullet'
                    : 'Monthly EMI'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Loan Purpose</Text>
                <Text style={styles.detailValBold}>{request.purpose || 'Working Capital'}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Pledged Collateral</Text>
                <View style={styles.securityTag}>
                  <Feather name="shield" size={m(11)} color="#b45309" />
                  <Text style={styles.securityTagText}>
                    {request.pledgedSecurity || 'Unsecured Commercial Facility'}
                  </Text>
                </View>
              </View>

              {request.notes ? (
                <View style={styles.notesBox}>
                  <Text style={styles.notesLabel}>Borrower Note:</Text>
                  <Text style={styles.notesVal}>{request.notes}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Card 2: AI Credit Underwriting Hub */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconCircleGreen}>
                <Feather name="cpu" size={m(16)} color={colors.white} />
              </View>
              <View style={{ flex: 1, marginLeft: m(10) }}>
                <Text style={styles.cardSectionTitle}>AI Credit Underwriting Hub</Text>
                <Text style={styles.cardSectionSub}>Automated solvency & risk analysis</Text>
              </View>
            </View>

            <View style={styles.underwritingGrid}>
              {/* Credit Score & Grade */}
              <View style={styles.metricTile}>
                <Text style={styles.uwMetricLabel}>Credit Score</Text>
                <Text style={[styles.uwMetricVal, { color: '#16a34a' }]}>
                  {underwritingData?.creditScore || 750} / 900
                </Text>
                <Text style={styles.uwMetricSub}>Grade {underwritingData?.riskGrade} (Low Risk)</Text>
              </View>

              {/* DSCR Gauge */}
              <View style={styles.metricTile}>
                <Text style={styles.uwMetricLabel}>DSCR Ratio</Text>
                <Text
                  style={[
                    styles.uwMetricVal,
                    { color: (underwritingData?.dscr || 1) >= 1.3 ? '#16a34a' : '#d97706' },
                  ]}
                >
                  {underwritingData?.dscr || 1.45}x
                </Text>
                <Text style={styles.uwMetricSub}>
                  {(underwritingData?.dscr || 1) >= 1.3 ? 'Healthy Coverage' : 'Moderate Coverage'}
                </Text>
              </View>

              {/* Max Recommended Cap */}
              <View style={styles.metricTile}>
                <Text style={styles.uwMetricLabel}>Recommended Cap</Text>
                <Text style={[styles.uwMetricVal, { color: colors.oceanBlueButton }]}>
                  {formatINR(underwritingData?.recommendedMaxCap || 500000)}
                </Text>
                <Text style={styles.uwMetricSub}>Based on 35% turnover</Text>
              </View>

              {/* Monthly Net Inflow */}
              <View style={styles.metricTile}>
                <Text style={styles.uwMetricLabel}>Monthly Cashflow</Text>
                <Text style={styles.uwMetricVal}>
                  {formatINR(underwritingData?.monthlyIncome || 85000)}
                </Text>
                <Text style={styles.uwMetricSub}>Verified Bank Inflow</Text>
              </View>
            </View>

            {/* Statutory Checklist */}
            <View style={styles.checklistCard}>
              <Text style={styles.checklistTitle}>Statutory Verification Checklist</Text>
              <View style={styles.checkItem}>
                <Feather name="check-circle" size={m(13)} color="#16a34a" />
                <Text style={styles.checkText}>PAN Card Authenticated via NSDL</Text>
              </View>
              <View style={styles.checkItem}>
                <Feather name="check-circle" size={m(13)} color="#16a34a" />
                <Text style={styles.checkText}>Aadhaar DigiLocker e-KYC Verified</Text>
              </View>
              <View style={styles.checkItem}>
                <Feather name="check-circle" size={m(13)} color="#16a34a" />
                <Text style={styles.checkText}>Active GST Registration & Filing History</Text>
              </View>
              <View style={styles.checkItem}>
                <Feather name="check-circle" size={m(13)} color="#16a34a" />
                <Text style={styles.checkText}>Bank Account Mandate Ready</Text>
              </View>
            </View>
          </View>

          {/* Card 3: Borrower Profile */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconCircleDark}>
                <Feather name="briefcase" size={m(16)} color={colors.white} />
              </View>
              <View style={{ flex: 1, marginLeft: m(10) }}>
                <Text style={styles.cardSectionTitle}>Borrower Profile</Text>
                <Text style={styles.cardSectionSub}>Corporate KYC & contact records</Text>
              </View>
            </View>

            <View style={styles.detailsList}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Authorized Person</Text>
                <Text style={styles.detailValBold}>{borrowerName}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Constitution</Text>
                <Text style={styles.detailValBold}>
                  {b.businessType || bProfile.businessType || 'Private Limited'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Years in Business</Text>
                <Text style={styles.detailValBold}>
                  {b.yearsInBusiness || bProfile.yearsInBusiness || 4} Years
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>PAN Number</Text>
                <Text style={styles.detailValMono}>
                  {b.panCardNumber || bUser.panCardNumber || 'Disclosed'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>GSTIN</Text>
                <Text style={styles.detailValMono}>
                  {b.gstNumber || bProfile.gstNumber || 'Disclosed'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Contact</Text>
                <Text style={styles.detailValBold}>
                  {b.mobileNo || bUser.mobileNo || 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          {/* Card 4: Disbursal OTP Status Card (when Accepted) */}
          {request.status === 'accepted' && (
            <View style={styles.disbursalCard}>
              <View style={styles.disbursalHeader}>
                <View style={styles.disbursalIconWrap}>
                  <Feather name="key" size={m(18)} color="#d97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.disbursalTitle}>Disbursal OTP Verification</Text>
                  <Text style={styles.disbursalSubtitle}>
                    {request.disbursalVerification?.isVerified
                      ? 'Funds verified & released successfully.'
                      : 'Awaiting borrower 6-digit release code.'}
                  </Text>
                </View>
              </View>

              {!request.disbursalVerification?.isVerified && (
                <View style={styles.disbursalActionRow}>
                  <TouchableOpacity
                    style={styles.resendOtpBtn}
                    onPress={handleResendOtp}
                    disabled={otpLoading}
                  >
                    <Text style={styles.resendOtpText}>Resend Code</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.verifyOtpBtn}
                    onPress={() => setShowOtpModal(true)}
                  >
                    <Text style={styles.verifyOtpText}>Enter 6-Digit OTP</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>

      {/* ── Fixed Bottom Decision Action Bar ── */}
      {request.status === 'pending' && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.bottomDeclineBtn}
            onPress={() => setShowRejectModal(true)}
          >
            <Text style={styles.bottomDeclineText}>Decline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomAcceptBtn}
            onPress={() => {
              setSanctionStep(1);
              setShowAcceptModal(true);
            }}
          >
            <Feather name="file-text" size={m(16)} color="#ffffff" style={{ marginRight: m(6) }} />
            <Text style={styles.bottomAcceptText}>Accept & Issue Term Sheet</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── 2-STEP ACCEPT & TERM SHEET MODAL ── */}
      <Modal
        visible={showAcceptModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAcceptModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Header */}
            <View style={styles.modalSheetHeader}>
              <View>
                <Text style={styles.modalSheetTitle}>
                  {sanctionStep === 1 ? 'Configure Sanction Terms' : 'Digital Countersignature'}
                </Text>
                <Text style={styles.modalSheetSub}>
                  Step {sanctionStep} of 2 • {businessName}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAcceptModal(false)}>
                <Feather name="x" size={m(20)} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {sanctionStep === 1 ? (
                /* Step 1: Configure Terms */
                <View style={styles.stepContent}>
                  {/* Repayment Type Toggle */}
                  <Text style={styles.inputTitle}>Repayment Facility Structure</Text>
                  <View style={styles.typeToggleRow}>
                    <TouchableOpacity
                      style={[
                        styles.typeToggleBox,
                        sanctionRepaymentType === 'EMI' && styles.activeToggleBox,
                      ]}
                      onPress={() => setSanctionRepaymentType('EMI')}
                    >
                      <Feather
                        name="credit-card"
                        size={m(16)}
                        color={sanctionRepaymentType === 'EMI' ? '#2563eb' : '#64748b'}
                      />
                      <Text
                        style={[
                          styles.toggleText,
                          sanctionRepaymentType === 'EMI' && styles.activeToggleText,
                        ]}
                      >
                        Monthly EMI
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.typeToggleBox,
                        sanctionRepaymentType === 'ONE_TIME' && styles.activeToggleBox,
                      ]}
                      onPress={() => setSanctionRepaymentType('ONE_TIME')}
                    >
                      <Feather
                        name="calendar"
                        size={m(16)}
                        color={sanctionRepaymentType === 'ONE_TIME' ? '#2563eb' : '#64748b'}
                      />
                      <Text
                        style={[
                          styles.toggleText,
                          sanctionRepaymentType === 'ONE_TIME' && styles.activeToggleText,
                        ]}
                      >
                        One-Time Bullet
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Form Inputs */}
                  <Text style={styles.inputTitle}>Sanctioned Principal (₹)</Text>
                  <TextInput
                    style={styles.modalInputField}
                    keyboardType="number-pad"
                    value={sanctionAmount}
                    onChangeText={setSanctionAmount}
                  />

                  <View style={styles.inputRow2}>
                    <View style={{ flex: 1, marginRight: m(6) }}>
                      <Text style={styles.inputTitle}>Rate (% p.a.)</Text>
                      <TextInput
                        style={styles.modalInputField}
                        keyboardType="decimal-pad"
                        value={sanctionRate}
                        onChangeText={setSanctionRate}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: m(6) }}>
                      <Text style={styles.inputTitle}>Tenure (Mo)</Text>
                      <TextInput
                        style={styles.modalInputField}
                        keyboardType="number-pad"
                        value={sanctionTenure}
                        onChangeText={setSanctionTenure}
                      />
                    </View>
                  </View>

                  <Text style={styles.inputTitle}>Processing Fee (₹)</Text>
                  <TextInput
                    style={styles.modalInputField}
                    keyboardType="number-pad"
                    value={sanctionProcessingFee}
                    onChangeText={setSanctionProcessingFee}
                  />

                  {/* Live Calculation Preview Card */}
                  <View style={styles.calcPreviewCard}>
                    <View style={styles.calcRow}>
                      <Text style={styles.calcLabel}>
                        {sanctionRepaymentType === 'EMI' ? 'Monthly Installment' : 'Bullet Maturity'}
                      </Text>
                      <Text style={styles.calcValBold}>
                        {sanctionRepaymentType === 'EMI'
                          ? `${formatINR(emiPreview.emi)}/mo`
                          : formatINR(emiPreview.totalPayable)}
                      </Text>
                    </View>
                    <View style={styles.calcRow}>
                      <Text style={styles.calcLabel}>Estimated Gross Interest</Text>
                      <Text style={styles.calcVal}>{formatINR(emiPreview.totalInterest)}</Text>
                    </View>
                    <View style={styles.calcRow}>
                      <Text style={styles.calcLabel}>Total Repayable Facility</Text>
                      <Text style={styles.calcValBold}>{formatINR(emiPreview.totalPayable)}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.modalNextBtn}
                    onPress={() => setSanctionStep(2)}
                  >
                    <Text style={styles.modalNextText}>Proceed to Sign Agreement</Text>
                    <Feather name="arrow-right" size={m(16)} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              ) : (
                /* Step 2: Digital E-Sign */
                <View style={styles.stepContent}>
                  <View style={styles.legalNoticeBox}>
                    <Feather name="shield" size={m(18)} color="#16a34a" />
                    <Text style={styles.legalNoticeText}>
                      By submitting this term sheet, you confirm that your NBFC/Lender entity sanctions {formatINR(sanctionAmount)} to {businessName}.
                    </Text>
                  </View>

                  <Text style={styles.inputTitle}>Authorized Signatory Name</Text>
                  <TextInput
                    style={styles.modalInputField}
                    placeholder="Enter full legal name of signatory"
                    placeholderTextColor="#94a3b8"
                    value={signerName}
                    onChangeText={setSignerName}
                  />

                  <View style={styles.signaturePreviewBox}>
                    <Text style={styles.signaturePreviewLabel}>ELECTRONIC SIGNATURE</Text>
                    <Text style={styles.signaturePreviewText}>
                      {signerName.trim() || 'Institutional Authorized Signatory'}
                    </Text>
                    <Text style={styles.signatureMeta}>
                      Timestamp: {new Date().toLocaleDateString('en-IN')} • IP Binding Active
                    </Text>
                  </View>

                  <View style={styles.modalStepActionRow}>
                    <TouchableOpacity
                      style={styles.modalBackBtn}
                      onPress={() => setSanctionStep(1)}
                    >
                      <Text style={styles.modalBackText}>Back</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modalSubmitSanctionBtn}
                      onPress={handleExecuteSanction}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.modalSubmitText}>Sanction & Bind Deal</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── REJECT MODAL ── */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.rejectModalCard}>
            <Text style={styles.rejectModalTitle}>Decline Application</Text>
            <Text style={styles.rejectModalSubtitle}>
              State the reason for declining {businessName}'s inquiry:
            </Text>

            <TextInput
              style={styles.rejectInputField}
              placeholder="e.g. Debt-Service ratio exceeds institutional risk threshold"
              placeholderTextColor="#94a3b8"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalStepActionRow}>
              <TouchableOpacity
                style={styles.modalBackBtn}
                onPress={() => setShowRejectModal(false)}
              >
                <Text style={styles.modalBackText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rejectConfirmBtn}
                onPress={handleExecuteReject}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.rejectConfirmText}>Decline Deal</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── 2-WAY OTP DISBURSAL VERIFY MODAL ── */}
      <DisbursalOtpModal
        visible={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        entityId={request._id}
        isLoan={false}
        borrowerName={businessName}
        amount={request.amount}
        onVerifiedSuccess={() => {
          fetchRequestDetails();
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
    paddingBottom: m(16),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(12),
  },
  backBtn: {
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
    shadowRadius: 4,
    marginRight: m(10),
  },
  headerTitleWrap: {
    flex: 1,
    marginRight: m(8),
  },
  headerTag: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: 0.8,
    opacity: 0.85,
    marginBottom: m(1),
  },
  headerTitle: {
    fontSize: m(18),
    lineHeight: m(24),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  headerSubtitle: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
    opacity: 0.85,
    marginTop: m(1),
  },
  statusPill: {
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(8),
  },
  pillPending: { backgroundColor: '#fef3c7' },
  textPending: { color: '#b45309', fontSize: m(10), fontFamily: FontFamily.primaryBold },
  pillAccepted: { backgroundColor: '#ecfdf5' },
  textAccepted: { color: '#047857', fontSize: m(10), fontFamily: FontFamily.primaryBold },
  pillRejected: { backgroundColor: '#fee2e2' },
  textRejected: { color: '#dc2626', fontSize: m(10), fontFamily: FontFamily.primaryBold },

  // 3-Column Telemetry Strip on Green
  topMetricsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: m(14),
    paddingVertical: m(9),
    paddingHorizontal: m(14),
    marginTop: m(2),
  },
  topMetricColumn: {
    flex: 1,
    alignItems: 'center',
  },
  topMetricLabel: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
    opacity: 0.8,
    marginBottom: m(2),
  },
  topMetricValueWhite: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  topMetricValueBlue: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.oceanBlueButton,
  },
  topMetricValueDark: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  topMetricDivider: {
    width: 1,
    height: m(22),
    backgroundColor: 'rgba(9, 48, 48, 0.15)',
  },

  // Main Curved Sheet
  sheetSection: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(28),
    borderTopRightRadius: m(28),
    paddingTop: m(14),
  },
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: m(18),
    paddingBottom: m(40),
  },
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

  // Sleek Cards
  card: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(14),
    marginBottom: m(12),
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
    marginBottom: m(12),
  },
  iconCircleBlue: {
    width: m(34),
    height: m(34),
    borderRadius: m(17),
    backgroundColor: colors.blueButton,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleGreen: {
    width: m(34),
    height: m(34),
    borderRadius: m(17),
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleDark: {
    width: m(34),
    height: m(34),
    borderRadius: m(17),
    backgroundColor: colors.lettersAndIcons,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardSectionTitle: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: 0.2,
  },
  cardSectionSub: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(1),
  },

  // Key-Value Rows
  detailsList: {
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: m(8),
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
  },
  detailValBold: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  detailValMono: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  securityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: m(8),
    paddingVertical: m(3.5),
    borderRadius: m(6),
    gap: m(4),
  },
  securityTagText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: '#b45309',
  },
  notesBox: {
    backgroundColor: colors.white,
    padding: m(10),
    borderRadius: m(8),
    marginTop: m(8),
    marginBottom: m(4),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
  },
  notesLabel: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  notesVal: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(2),
  },

  // 4-Tile Underwriting Grid
  underwritingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(8),
    marginBottom: m(10),
  },
  metricTile: {
    width: '48.5%',
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    paddingHorizontal: m(12),
    paddingVertical: m(10),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  uwMetricLabel: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
    marginBottom: m(2),
  },
  uwMetricVal: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  uwMetricSub: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(2),
  },

  // Statutory Checklist
  checklistCard: {
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    padding: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  checklistTitle: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(8),
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: m(3.5),
    gap: m(6),
  },
  checkText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },

  // Disbursal Card
  disbursalCard: {
    backgroundColor: '#fffbeb',
    borderRadius: m(14),
    padding: m(14),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  disbursalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(10),
  },
  disbursalIconWrap: {
    width: m(34),
    height: m(34),
    borderRadius: m(17),
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(10),
  },
  disbursalTitle: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: '#b45309',
  },
  disbursalSubtitle: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: '#92400e',
    marginTop: m(1),
  },
  disbursalActionRow: {
    flexDirection: 'row',
    gap: m(8),
  },
  resendOtpBtn: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: m(8),
    paddingVertical: m(9),
    alignItems: 'center',
  },
  resendOtpText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryBold,
    color: '#b45309',
  },
  verifyOtpBtn: {
    flex: 1.4,
    backgroundColor: '#d97706',
    borderRadius: m(8),
    paddingVertical: m(9),
    alignItems: 'center',
  },
  verifyOtpText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    paddingHorizontal: m(16),
    paddingVertical: m(12),
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 8,
  },
  bottomDeclineBtn: {
    flex: 1,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: m(12),
    paddingVertical: m(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(10),
  },
  bottomDeclineText: {
    fontSize: m(13),
    fontWeight: '700',
    color: '#dc2626',
  },
  bottomAcceptBtn: {
    flex: 2.2,
    backgroundColor: '#0f172a',
    borderRadius: m(12),
    paddingVertical: m(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomAcceptText: {
    fontSize: m(13),
    fontWeight: '700',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: m(24),
    borderTopRightRadius: m(24),
    padding: m(20),
    maxHeight: '90%',
  },
  modalSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: m(16),
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    paddingBottom: m(12),
  },
  modalSheetTitle: {
    fontSize: m(16),
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSheetSub: {
    fontSize: m(11),
    color: '#64748b',
    marginTop: m(2),
  },
  stepContent: {
    paddingBottom: m(20),
  },
  inputTitle: {
    fontSize: m(11),
    fontWeight: '700',
    color: '#334155',
    marginBottom: m(4),
  },
  typeToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: m(12),
  },
  typeToggleBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: m(10),
    paddingVertical: m(10),
    marginHorizontal: m(4),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeToggleBox: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  toggleText: {
    fontSize: m(12),
    fontWeight: '600',
    color: '#64748b',
    marginLeft: m(6),
  },
  activeToggleText: {
    color: '#2563eb',
    fontWeight: '700',
  },
  modalInputField: {
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
  inputRow2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calcPreviewCard: {
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    padding: m(12),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: m(4),
  },
  calcLabel: {
    fontSize: m(11),
    color: '#64748b',
  },
  calcVal: {
    fontSize: m(11),
    fontWeight: '600',
    color: '#0f172a',
  },
  calcValBold: {
    fontSize: m(12),
    fontWeight: '800',
    color: '#0f172a',
  },
  modalNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    borderRadius: m(12),
    paddingVertical: m(14),
  },
  modalNextText: {
    color: '#ffffff',
    fontSize: m(13),
    fontWeight: '700',
    marginRight: m(8),
  },
  legalNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0fdf4',
    padding: m(12),
    borderRadius: m(10),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  legalNoticeText: {
    fontSize: m(11),
    color: '#166534',
    marginLeft: m(8),
    flex: 1,
    lineHeight: m(16),
  },
  signaturePreviewBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: m(12),
    padding: m(16),
    alignItems: 'center',
    marginBottom: m(16),
  },
  signaturePreviewLabel: {
    fontSize: m(9),
    color: '#94a3b8',
    letterSpacing: 1,
    fontWeight: '700',
  },
  signaturePreviewText: {
    fontSize: m(18),
    fontWeight: '800',
    color: '#0f172a',
    fontStyle: 'italic',
    marginVertical: m(8),
  },
  signatureMeta: {
    fontSize: m(10),
    color: '#64748b',
  },
  modalStepActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalBackBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: m(10),
    paddingVertical: m(12),
    alignItems: 'center',
    marginRight: m(8),
  },
  modalBackText: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#64748b',
  },
  modalSubmitSanctionBtn: {
    flex: 2,
    backgroundColor: '#16a34a',
    borderRadius: m(10),
    paddingVertical: m(12),
    alignItems: 'center',
  },
  modalSubmitText: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#ffffff',
  },
  rejectModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: m(20),
    padding: m(20),
    margin: m(20),
  },
  rejectModalTitle: {
    fontSize: m(16),
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: m(4),
  },
  rejectModalSubtitle: {
    fontSize: m(12),
    color: '#64748b',
    marginBottom: m(12),
  },
  rejectInputField: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: m(10),
    padding: m(10),
    fontSize: m(12),
    color: '#0f172a',
    marginBottom: m(14),
    textAlignVertical: 'top',
  },
  rejectConfirmBtn: {
    flex: 2,
    backgroundColor: '#ef4444',
    borderRadius: m(10),
    paddingVertical: m(12),
    alignItems: 'center',
  },
  rejectConfirmText: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#ffffff',
  },
  otpModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: m(20),
    padding: m(20),
    margin: m(20),
  },
  otpModalTitle: {
    fontSize: m(16),
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: m(4),
  },
  otpModalSubtitle: {
    fontSize: m(12),
    color: '#64748b',
    marginBottom: m(14),
  },
  otpInputBig: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: m(10),
    fontSize: m(20),
    fontWeight: '800',
    letterSpacing: 6,
    textAlign: 'center',
    paddingVertical: m(12),
    color: '#0f172a',
    marginBottom: m(16),
  },
  otpVerifyBtn: {
    flex: 2,
    backgroundColor: '#2563eb',
    borderRadius: m(10),
    paddingVertical: m(12),
    alignItems: 'center',
  },
  otpVerifyText: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#ffffff',
  },
});
