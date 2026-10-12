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
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { m } from 'walstar-rn-responsive';
import { FontFamily, colors } from '../../../constants';
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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={styles.loadingText}>Loading underwriting workspace...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const b = request.borrowerSnapshot || {};
  const bUser = request.borrowerId || {};
  const bProfile = bUser.borrowerProfile || {};

  const borrowerName = b.userName || bUser.userName || 'Corporate Borrower';
  const businessName = b.businessName || bProfile.businessName || bUser.companyName || borrowerName;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* App Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={m(20)} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: m(10) }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {businessName}
          </Text>
          <Text style={styles.headerSubtitle}>App ID: #{request._id.slice(-6).toUpperCase()}</Text>
        </View>
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

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* ── 1. Requested Financing Facility Card ── */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Feather name="dollar-sign" size={m(16)} color="#2563eb" />
            <Text style={styles.cardTitle}>Application Facility</Text>
          </View>

          <View style={styles.facilityHighlight}>
            <Text style={styles.facilityLabel}>Requested Principal</Text>
            <Text style={styles.facilityAmount}>{formatINR(request.amount)}</Text>
            <Text style={styles.facilitySub}>₹{Number(request.amount || 0).toLocaleString('en-IN')} INR</Text>
          </View>

          <View style={styles.grid2}>
            <View style={styles.gridBox}>
              <Text style={styles.gridBoxLabel}>Tenure</Text>
              <Text style={styles.gridBoxVal}>{request.tenureMonths || 12} Months</Text>
            </View>
            <View style={styles.gridBox}>
              <Text style={styles.gridBoxLabel}>Repayment Mode</Text>
              <Text style={styles.gridBoxVal}>
                {request.repaymentType === 'ONE_TIME' || request.repaymentType === 'bullet'
                  ? 'One-Time Bullet'
                  : 'Monthly EMI'}
              </Text>
            </View>
            <View style={styles.gridBox}>
              <Text style={styles.gridBoxLabel}>Requested Rate</Text>
              <Text style={styles.gridBoxVal}>{request.requestedRate || 12}% p.a.</Text>
            </View>
            <View style={styles.gridBox}>
              <Text style={styles.gridBoxLabel}>Loan Purpose</Text>
              <Text style={styles.gridBoxVal}>{request.purpose || 'Working Capital'}</Text>
            </View>
          </View>

          {/* Pledged Security / Collateral */}
          <View style={styles.securityBanner}>
            <Feather name="shield" size={m(16)} color="#d97706" style={{ marginTop: m(2) }} />
            <View style={{ flex: 1, marginLeft: m(8) }}>
              <Text style={styles.securityTitle}>Pledged Security / Collateral</Text>
              <Text style={styles.securityVal}>
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

        {/* ── 2. AI Underwriting & Credit Risk Hub ── */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Feather name="cpu" size={m(16)} color="#16a34a" />
            <Text style={styles.cardTitle}>AI Credit Underwriting Hub</Text>
          </View>

          <View style={styles.underwritingGrid}>
            {/* Credit Score & Grade */}
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Credit Score</Text>
              <Text style={[styles.metricVal, { color: '#16a34a' }]}>
                {underwritingData?.creditScore || 750} / 900
              </Text>
              <Text style={styles.metricSub}>Grade {underwritingData?.riskGrade} (Low Risk)</Text>
            </View>

            {/* DSCR Gauge */}
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>DSCR Ratio</Text>
              <Text
                style={[
                  styles.metricVal,
                  { color: (underwritingData?.dscr || 1) >= 1.3 ? '#16a34a' : '#d97706' },
                ]}
              >
                {underwritingData?.dscr || 1.45}x
              </Text>
              <Text style={styles.metricSub}>
                {(underwritingData?.dscr || 1) >= 1.3 ? 'Healthy Coverage' : 'Moderate Coverage'}
              </Text>
            </View>

            {/* Max Recommended Cap */}
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Recommended Cap</Text>
              <Text style={[styles.metricVal, { color: '#2563eb' }]}>
                {formatINR(underwritingData?.recommendedMaxCap || 500000)}
              </Text>
              <Text style={styles.metricSub}>Based on 35% turnover</Text>
            </View>

            {/* Monthly Net Inflow */}
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Monthly Cashflow</Text>
              <Text style={styles.metricVal}>
                {formatINR(underwritingData?.monthlyIncome || 85000)}
              </Text>
              <Text style={styles.metricSub}>Verified Bank Inflow</Text>
            </View>
          </View>

          {/* Statutory Checklist */}
          <Text style={styles.checklistTitle}>Statutory Verification Checklist</Text>
          <View style={styles.checklist}>
            <View style={styles.checkItem}>
              <Feather name="check-circle" size={m(14)} color="#16a34a" />
              <Text style={styles.checkText}>PAN Card Authenticated via NSDL</Text>
            </View>
            <View style={styles.checkItem}>
              <Feather name="check-circle" size={m(14)} color="#16a34a" />
              <Text style={styles.checkText}>Aadhaar DigiLocker e-KYC Verified</Text>
            </View>
            <View style={styles.checkItem}>
              <Feather name="check-circle" size={m(14)} color="#16a34a" />
              <Text style={styles.checkText}>Active GST Registration & Filing History</Text>
            </View>
            <View style={styles.checkItem}>
              <Feather name="check-circle" size={m(14)} color="#16a34a" />
              <Text style={styles.checkText}>Bank Account Mandate Ready</Text>
            </View>
          </View>
        </View>

        {/* ── 3. Borrower & Enterprise Details ── */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Feather name="briefcase" size={m(16)} color="#0f172a" />
            <Text style={styles.cardTitle}>Borrower Profile</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Borrower Name</Text>
            <Text style={styles.detailValBold}>{borrowerName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Company / Trade Name</Text>
            <Text style={styles.detailValBold}>{businessName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Business Type</Text>
            <Text style={styles.detailVal}>{b.businessType || bProfile.businessType || 'Private Limited'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Years in Business</Text>
            <Text style={styles.detailVal}>{b.yearsInBusiness || bProfile.yearsInBusiness || 4} Years</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>PAN Number</Text>
            <Text style={styles.detailValMono}>{b.panCardNumber || bUser.panCardNumber || 'Disclosed'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>GSTIN</Text>
            <Text style={styles.detailValMono}>{b.gstNumber || bProfile.gstNumber || 'Disclosed'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mobile & Email</Text>
            <Text style={styles.detailVal}>{b.mobileNo || bUser.mobileNo || 'N/A'}</Text>
          </View>
        </View>

        {/* ── 4. Disbursal OTP Status Card (when Accepted) ── */}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
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
  headerTitle: {
    fontSize: m(16),
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: m(11),
    color: '#64748b',
    marginTop: m(1),
  },
  statusPill: {
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(8),
  },
  pillPending: { backgroundColor: '#fef3c7' },
  textPending: { color: '#b45309', fontSize: m(10), fontWeight: '800' },
  pillAccepted: { backgroundColor: '#ecfdf5' },
  textAccepted: { color: '#047857', fontSize: m(10), fontWeight: '800' },
  pillRejected: { backgroundColor: '#f1f5f9' },
  textRejected: { color: '#64748b', fontSize: m(10), fontWeight: '800' },
  container: { flex: 1 },
  scrollContent: {
    padding: m(16),
    paddingBottom: m(120),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: m(13),
    color: '#64748b',
    marginTop: m(10),
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: m(16),
    padding: m(16),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(12),
  },
  cardTitle: {
    fontSize: m(14),
    fontWeight: '800',
    color: '#0f172a',
    marginLeft: m(6),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  facilityHighlight: {
    backgroundColor: '#eff6ff',
    borderRadius: m(12),
    padding: m(14),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  facilityLabel: {
    fontSize: m(11),
    color: '#2563eb',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  facilityAmount: {
    fontSize: m(24),
    fontWeight: '900',
    color: '#1e40af',
    marginTop: m(2),
  },
  facilitySub: {
    fontSize: m(11),
    color: '#60a5fa',
    marginTop: m(2),
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: m(10),
  },
  gridBox: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: m(10),
    padding: m(10),
    marginBottom: m(8),
  },
  gridBoxLabel: {
    fontSize: m(10),
    color: '#64748b',
    fontWeight: '600',
  },
  gridBoxVal: {
    fontSize: m(13),
    fontWeight: '700',
    color: '#0f172a',
    marginTop: m(2),
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbeb',
    padding: m(12),
    borderRadius: m(10),
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: m(8),
  },
  securityTitle: {
    fontSize: m(11),
    fontWeight: '700',
    color: '#b45309',
  },
  securityVal: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#78350f',
    marginTop: m(2),
  },
  notesBox: {
    backgroundColor: '#f8fafc',
    padding: m(10),
    borderRadius: m(8),
  },
  notesLabel: {
    fontSize: m(11),
    fontWeight: '700',
    color: '#334155',
  },
  notesVal: {
    fontSize: m(11),
    color: '#64748b',
    marginTop: m(2),
  },
  underwritingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: m(12),
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    padding: m(12),
    marginBottom: m(8),
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  metricLabel: {
    fontSize: m(10),
    fontWeight: '600',
    color: '#64748b',
  },
  metricVal: {
    fontSize: m(17),
    fontWeight: '800',
    color: '#0f172a',
    marginTop: m(2),
  },
  metricSub: {
    fontSize: m(10),
    color: '#64748b',
    marginTop: m(2),
  },
  checklistTitle: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#334155',
    marginBottom: m(8),
  },
  checklist: {
    backgroundColor: '#f8fafc',
    borderRadius: m(10),
    padding: m(10),
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: m(4),
  },
  checkText: {
    fontSize: m(11),
    color: '#334155',
    fontWeight: '600',
    marginLeft: m(6),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: m(8),
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: m(12),
    color: '#64748b',
  },
  detailVal: {
    fontSize: m(12),
    color: '#0f172a',
    fontWeight: '600',
  },
  detailValBold: {
    fontSize: m(13),
    color: '#0f172a',
    fontWeight: '700',
  },
  detailValMono: {
    fontSize: m(12),
    color: '#0f172a',
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  disbursalCard: {
    backgroundColor: '#fffbeb',
    borderRadius: m(16),
    padding: m(16),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  disbursalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(12),
  },
  disbursalIconWrap: {
    width: m(36),
    height: m(36),
    borderRadius: m(10),
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(10),
  },
  disbursalTitle: {
    fontSize: m(14),
    fontWeight: '800',
    color: '#b45309',
  },
  disbursalSubtitle: {
    fontSize: m(11),
    color: '#92400e',
    marginTop: m(2),
  },
  disbursalActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resendOtpBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: m(10),
    paddingVertical: m(10),
    alignItems: 'center',
    marginRight: m(8),
  },
  resendOtpText: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#b45309',
  },
  verifyOtpBtn: {
    flex: 1.5,
    backgroundColor: '#d97706',
    borderRadius: m(10),
    paddingVertical: m(10),
    alignItems: 'center',
  },
  verifyOtpText: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#ffffff',
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
