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
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { m } from '../../../Utils/responsive';
import { FontFamily, colors } from '../../../constants';
import { ScreenWrapper, showAlert } from '../../../Components/common';
import lenderFlowService from '../../../Services/lenderFlowService';
import DisbursalOtpModal from '../Components/DisbursalOtpModal';

export default function LenderRequestDetails() {
  const route = useRoute();
  const navigation = useNavigation();
  const { requestId, request: initialRequest } = route.params || {};

  const [request, setRequest] = useState(initialRequest || null);
  const [borrowerLoans, setBorrowerLoans] = useState([]);
  const [borrowerSummary, setBorrowerSummary] = useState(null);
  const [showAllFacilities, setShowAllFacilities] = useState(false);
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
          if (res.borrowerLoans) setBorrowerLoans(res.borrowerLoans);
          if (res.borrowerSummary) setBorrowerSummary(res.borrowerSummary);
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
      showAlert('Error', 'Unable to load full request details.');
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
        showAlert(
          'Loan Facility Sanctioned!',
          `Term sheet generated! ${res.autoRejectedApplicationsCount || 0} other pending applications for this borrower were atomically auto-closed.`,
          [{ text: 'OK', onPress: () => fetchRequestDetails() }]
        );
        setShowAcceptModal(false);
        setSanctionStep(1);
      } else {
        showAlert('Sanction Failed', res?.message || 'Could not sanction loan.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to sanction application.';
      showAlert('Error', msg);
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
        showAlert('Request Declined', 'Borrower has been notified.');
        setShowRejectModal(false);
        setRejectReason('');
        fetchRequestDetails();
      } else {
        showAlert('Failed', res?.message || 'Could not decline application.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to decline application.';
      showAlert('Error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Verify Disbursal OTP
  const handleVerifyOtp = async () => {
    if (!otpInput.trim() || otpInput.trim().length !== 6) {
      showAlert('Invalid OTP', 'Please enter the 6-digit Disbursal OTP from borrower.');
      return;
    }

    try {
      setOtpLoading(true);
      const res = await lenderFlowService.verifyDisbursalOtp(request._id, otpInput.trim(), false);
      if (res?.success) {
        showAlert('Success', 'Borrower Disbursal OTP verified! Funds released atomically.');
        setShowOtpModal(false);
        setOtpInput('');
        fetchRequestDetails();
      } else {
        showAlert('Verification Failed', res?.message || 'Invalid OTP.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to verify disbursal OTP.';
      showAlert('Error', msg);
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
        showAlert('OTP Dispatched', 'A fresh 6-digit disbursal OTP has been sent to the borrower.');
      }
    } catch (err) {
      showAlert('Error', 'Unable to resend OTP.');
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
  const businessType = b.businessType || bProfile.businessType || 'Private Limited Company';
  const employmentType = b.employmentType || bProfile.employmentType || 'Salaried Employee';
  const panNumber = b.panCardNumber || bUser.panCardNumber || 'Not Provided';
  const aadharNumber = b.aadharCardNo || bUser.aadharCardNo || 'Not Provided';
  const gstNumber = b.gstNumber || bProfile.gstNumber || 'Not Provided';
  const yearsInBusiness = b.yearsInBusiness !== undefined ? b.yearsInBusiness : (bProfile.yearsInBusiness ?? 3);

  // Credit Score and Financials
  const creditScore = Number(b.creditScore || bProfile.creditScore || 750);
  const rawRiskGrade = b.riskGrade || (creditScore >= 750 ? 'A' : creditScore >= 680 ? 'B' : 'C');
  const riskGrade = String(rawRiskGrade).replace(/^Grade\s+/i, '');
  const annualRevenue = Number(b.annualRevenue || bProfile.annualRevenue || 0);
  const monthlyIncome = Number(b.monthlyIncome || bProfile.monthlyIncome || 0);
  const totalLoansTaken = b.totalLoansTaken !== undefined ? b.totalLoansTaken : (bProfile.totalLoansTaken ?? (borrowerSummary?.totalLoansCount ?? borrowerLoans.length));
  const onTimeRepayments = b.onTimeRepayments !== undefined ? b.onTimeRepayments : (bProfile.onTimeRepayments ?? 0);
  const defaultsCount = b.defaultsCount !== undefined ? b.defaultsCount : (bProfile.defaultsCount ?? 0);

  // Contact & Address
  const phone = b.mobileNo || bUser.mobileNo || 'Not Available';
  const altPhone = b.altMobileNo || bUser.altMobileNo || '';
  const email = b.email || bUser.email || 'Not Available';
  const streetAddress = b.address || bUser.address || '';
  const city = b.city || bUser.city || '';
  const taluka = b.taluka || bUser.taluka || '';
  const district = b.district || bUser.district || '';
  const state = b.state || bUser.state || '';
  const pincode = b.pincode || bUser.pincode || '';
  const fullAddress = [streetAddress, taluka, city, district, state, pincode].filter(Boolean).join(', ') || 'Not Provided';

  const formatAadhaar = (val) => {
    if (!val || val === 'Not Provided') return 'Not Provided';
    const clean = String(val).replace(/\s+/g, '');
    if (clean.length === 12) {
      return `${clean.slice(0, 4)} **** ${clean.slice(8)}`;
    }
    return val;
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
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isAutoClosed = request.status === 'auto_rejected';
  const isAccepted = request.status === 'accepted';
  const isPending = request.status === 'pending';
  const statusLabel = isAutoClosed
    ? 'AUTO-CLOSED'
    : isPending
    ? 'PENDING REVIEW'
    : isAccepted
    ? 'ACCEPTED & ACTIVE'
    : request.status.toUpperCase();

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
        {/* Header: Back Button + Borrower Name & App ID */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <Feather name="chevron-left" size={m(22)} color={colors.lettersAndIcons} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {borrowerName}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              App ID: #{request._id?.slice(-8).toUpperCase()} • Submitted {formatDate(request.createdAt)}
            </Text>
          </View>
        </View>

        {/* Below to Header: The Two Cards (Credit Score Badge & Status Pill) */}
        <View style={styles.headerBadgesRow}>
          <View style={styles.cibilScoreBadge}>
            <Feather name="shield" size={m(12)} color="#15803d" />
            <Text style={styles.cibilScoreBadgeText}>
              SCORE: {creditScore} (GRADE {riskGrade})
            </Text>
          </View>

          <View
            style={[
              styles.statusPill,
              isPending
                ? styles.pillPending
                : isAccepted
                ? styles.pillAccepted
                : isAutoClosed
                ? styles.pillAutoClosed
                : styles.pillRejected,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                isPending
                  ? styles.dotPending
                  : isAccepted
                  ? styles.dotAccepted
                  : isAutoClosed
                  ? styles.dotAutoClosed
                  : styles.dotRejected,
              ]}
            />
            <Text
              style={[
                styles.statusPillText,
                isPending
                  ? styles.textPending
                  : isAccepted
                  ? styles.textAccepted
                  : isAutoClosed
                  ? styles.textAutoClosed
                  : styles.textRejected,
              ]}
            >
              {statusLabel}
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
            isPending && { paddingBottom: m(100) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── SECTION 1: LOAN APPLICATION FACILITY ── */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconCircleBlue}>
                <Feather name="dollar-sign" size={m(16)} color={colors.white} />
              </View>
              <View style={{ flex: 1, marginLeft: m(10) }}>
                <Text style={styles.cardSectionTitle}>LOAN APPLICATION FACILITY</Text>
                <Text style={styles.cardSectionSub}>Financing terms & collateral specification</Text>
              </View>
            </View>

            <View style={styles.facilityGrid}>
              <View style={styles.facilityTilePrimary}>
                <Text style={styles.facilityTileLabel}>REQUESTED PRINCIPAL</Text>
                <Text style={styles.facilityTileValPrimary}>{formatINR(request.amount)}</Text>
                <Text style={styles.facilityTileSub}>₹{Number(request.amount || 0).toLocaleString('en-IN')} INR</Text>
              </View>

              <View style={styles.facilityTile}>
                <Text style={styles.facilityTileLabel}>REPAYMENT TYPE</Text>
                <Text style={styles.facilityTileVal}>
                  {request.repaymentType === 'ONE_TIME' ? 'One-Time Bullet' : 'Monthly EMI'}
                </Text>
                <Text style={styles.facilityTileSub}>
                  {request.repaymentType === 'ONE_TIME' ? 'Lump sum at maturity' : 'Equal monthly installments'}
                </Text>
              </View>

              <View style={styles.facilityTile}>
                <Text style={styles.facilityTileLabel}>LOAN PURPOSE</Text>
                <Text style={styles.facilityTileVal}>{request.purpose || 'Working Capital Line'}</Text>
                <Text style={styles.facilityTileSub}>Commercial facility</Text>
              </View>

              <View style={styles.facilityTile}>
                <Text style={styles.facilityTileLabel}>REPAYMENT TENURE</Text>
                <Text style={styles.facilityTileVal}>{request.tenureMonths || 12} Months</Text>
                <Text style={styles.facilityTileSub}>
                  {((request.tenureMonths || 12) / 12).toFixed(1)} Years duration
                </Text>
              </View>
            </View>

            {/* Pledged Security / Collateral Offered Box */}
            <View style={styles.securityBox}>
              <View style={styles.securityBoxHeader}>
                <Feather name="shield" size={m(13)} color="#b45309" />
                <Text style={styles.securityBoxLabel}>PLEDGED SECURITY / COLLATERAL OFFERED</Text>
                <View style={styles.securityBadge}>
                  <Text style={styles.securityBadgeText}>Borrower Declaration</Text>
                </View>
              </View>
              <Text style={styles.securityValText}>
                {request.pledgedSecurity || 'None Specified / Unsecured Facility'}
              </Text>
              <Text style={styles.securityNoteText}>
                This pledged security is recorded in the official loan application and will be incorporated into Schedule 1 of the legal facility agreement upon sanctioning.
              </Text>
            </View>

            {request.notes ? (
              <View style={styles.notesBox}>
                <Text style={styles.notesLabel}>Borrower Note:</Text>
                <Text style={styles.notesVal}>{request.notes}</Text>
              </View>
            ) : null}
          </View>

          {/* ── SECTION 2: BORROWER & BUSINESS DETAILS ── */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconCircleDark}>
                <Feather name="briefcase" size={m(16)} color={colors.white} />
              </View>
              <View style={{ flex: 1, marginLeft: m(10) }}>
                <Text style={styles.cardSectionTitle}>BORROWER & BUSINESS DETAILS</Text>
                <Text style={styles.cardSectionSub}>Corporate constitution & statutory identifiers</Text>
              </View>
            </View>

            <View style={styles.detailsList}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Borrower Full Name</Text>
                <Text style={styles.detailValBold}>{borrowerName}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Business / Trade Name</Text>
                <Text style={styles.detailValBold}>{businessName}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Business Structure</Text>
                <Text style={styles.detailVal}>{businessType}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Employment Type</Text>
                <Text style={styles.detailVal}>{employmentType}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Years in Business</Text>
                <Text style={styles.detailVal}>{yearsInBusiness} Years</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>PAN Card Number</Text>
                <Text style={styles.detailValMono}>{panNumber}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Aadhaar Card No</Text>
                <Text style={styles.detailValMono}>{formatAadhaar(aadharNumber)}</Text>
              </View>

              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.detailLabel}>GST Registration No</Text>
                <Text style={styles.detailValMono}>{gstNumber || 'Not Provided'}</Text>
              </View>
            </View>
          </View>

          {/* ── SECTION 3: FINANCIAL & CREDIT ASSESSMENT ── */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconCircleGreen}>
                <Feather name="shield" size={m(16)} color={colors.white} />
              </View>
              <View style={{ flex: 1, marginLeft: m(10) }}>
                <Text style={styles.cardSectionTitle}>FINANCIAL & CREDIT ASSESSMENT</Text>
                <Text style={styles.cardSectionSub}>Credit score, cashflow & risk grading</Text>
              </View>
            </View>

            <View style={styles.detailsList}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Credit Risk Score</Text>
                <Text style={[styles.detailValBold, { color: creditScore >= 700 ? '#16a34a' : '#d97706' }]}>
                  {creditScore} / 900
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Assigned Risk Grade</Text>
                <View style={styles.riskGradeBadge}>
                  <Text style={styles.riskGradeBadgeText}>
                    Grade {riskGrade} ({creditScore >= 750 ? 'Low Default Risk' : creditScore >= 680 ? 'Moderate Risk' : 'High Risk'})
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Annual Business Turnover</Text>
                <Text style={styles.detailValBold}>{formatINR(annualRevenue)}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Monthly Net Income / Cashflow</Text>
                <Text style={styles.detailValBold}>{formatINR(monthlyIncome)}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Repayment Track Record</Text>
                <Text style={styles.detailValBold}>
                  {totalLoansTaken} Total • {onTimeRepayments} On-Time • {defaultsCount} Defaults
                </Text>
              </View>

              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.detailLabel}>Underwriting Verification</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: m(4) }}>
                  <Feather name="check-circle" size={m(13)} color="#16a34a" />
                  <Text style={{ fontSize: m(11.5), fontFamily: FontFamily.primaryBold, color: '#16a34a' }}>
                    100% Profile Complete & Verified
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── SECTION 4: BORROWER LOAN FACILITIES & REPAYMENT HISTORY ── */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconCircleBlue, { backgroundColor: '#2563eb' }]}>
                <Feather name="layers" size={m(16)} color={colors.white} />
              </View>
              <View style={{ flex: 1, marginLeft: m(10) }}>
                <Text style={styles.cardSectionTitle}>BORROWER FACILITIES & REPAYMENT HISTORY</Text>
                <Text style={styles.cardSectionSub}>Cross-platform borrowings & repayment track</Text>
              </View>
              {borrowerLoans.length > 0 && (
                <TouchableOpacity
                  style={styles.viewAllBadgeBtn}
                  onPress={() => setShowAllFacilities(!showAllFacilities)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.viewAllBadgeText}>
                    {showAllFacilities ? 'Show Recent' : `View All (${borrowerLoans.length})`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 4 Financial KPI Summary Cards */}
            <View style={styles.kpiGrid}>
              <View style={styles.kpiTile}>
                <Text style={styles.kpiTileLabel}>TOTAL BORROWED FACILITIES</Text>
                <Text style={styles.kpiTileVal}>
                  {borrowerSummary?.totalLoansCount ?? borrowerLoans.length} Loans
                </Text>
              </View>

              <View style={styles.kpiTile}>
                <Text style={styles.kpiTileLabel}>TOTAL SANCTIONED BOOK</Text>
                <Text style={[styles.kpiTileVal, { color: '#2563eb' }]}>
                  {formatINR(borrowerSummary?.totalLoanAmount ?? borrowerLoans.reduce((s, l) => s + (Number(l.amount) || 0), 0))}
                </Text>
              </View>

              <View style={styles.kpiTile}>
                <Text style={styles.kpiTileLabel}>TOTAL REPAID AMOUNT</Text>
                <Text style={[styles.kpiTileVal, { color: '#16a34a' }]}>
                  {formatINR(borrowerSummary?.totalPaidAmount ?? borrowerLoans.reduce((s, l) => s + (Number(l.totalPaid) || 0), 0))}
                </Text>
              </View>

              <View style={styles.kpiTile}>
                <Text style={styles.kpiTileLabel}>OUTSTANDING BALANCE</Text>
                <Text style={[styles.kpiTileVal, { color: (borrowerSummary?.totalRemainingAmount ?? 0) > 0 ? '#d97706' : colors.textSecondary }]}>
                  {formatINR(borrowerSummary?.totalRemainingAmount ?? borrowerLoans.reduce((s, l) => s + (Number(l.remainingAmount) || 0), 0))}
                </Text>
              </View>
            </View>

            {/* List of Previous Facilities */}
            {borrowerLoans.length === 0 ? (
              <View style={styles.emptyLoansBox}>
                <Feather name="check-circle" size={m(18)} color="#16a34a" />
                <Text style={styles.emptyLoansText}>
                  No prior loan facilities found on the platform. First-time applicant.
                </Text>
              </View>
            ) : (
              <View style={{ marginTop: m(10), gap: m(8) }}>
                {(showAllFacilities ? borrowerLoans : borrowerLoans.slice(0, 3)).map((loan, idx) => {
                  const s = (loan.paymentStatus || 'pending').toLowerCase();
                  const isPaidStatus = s === 'paid';
                  const isOverdueStatus = s === 'overdue';
                  const isPartPaidStatus = s === 'part paid';

                  return (
                    <View key={loan._id || idx} style={styles.loanFacilityCard}>
                      <View style={styles.loanFacHeader}>
                        <View style={{ flex: 1, marginRight: m(8) }}>
                          <Text style={styles.loanFacPurpose} numberOfLines={1}>
                            {loan.purpose || loan.dealName || 'Commercial Facility'}
                          </Text>
                          <Text style={styles.loanFacLender} numberOfLines={1}>
                            ID: #{loan._id?.slice(-8).toUpperCase() || idx + 1}
                            {loan.lenderName ? ` • ${loan.lenderName}` : ''}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.loanFacPill,
                            isPaidStatus
                              ? styles.facPillPaid
                              : isOverdueStatus
                              ? styles.facPillOverdue
                              : isPartPaidStatus
                              ? styles.facPillPartPaid
                              : styles.facPillPending,
                          ]}
                        >
                          <Text
                            style={[
                              styles.loanFacPillText,
                              isPaidStatus
                                ? styles.facTextPaid
                                : isOverdueStatus
                                ? styles.facTextOverdue
                                : isPartPaidStatus
                                ? styles.facTextPartPaid
                                : styles.facTextPending,
                            ]}
                          >
                            {(loan.paymentStatus || 'ACTIVE').toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.loanFacMetricsRow}>
                        <View style={styles.loanFacMetricCol}>
                          <Text style={styles.loanFacMetricLabel}>Sanctioned</Text>
                          <Text style={styles.loanFacMetricVal}>{formatINR(loan.amount)}</Text>
                        </View>
                        <View style={styles.loanFacMetricCol}>
                          <Text style={styles.loanFacMetricLabel}>Repaid</Text>
                          <Text style={[styles.loanFacMetricVal, { color: '#16a34a' }]}>
                            {formatINR(loan.totalPaid)}
                          </Text>
                        </View>
                        <View style={styles.loanFacMetricCol}>
                          <Text style={styles.loanFacMetricLabel}>Remaining</Text>
                          <Text style={[styles.loanFacMetricVal, { color: (loan.remainingAmount || 0) > 0 ? '#d97706' : colors.textSecondary }]}>
                            {formatINR(loan.remainingAmount)}
                          </Text>
                        </View>
                        <View style={styles.loanFacMetricCol}>
                          <Text style={styles.loanFacMetricLabel}>End Date</Text>
                          <Text style={styles.loanFacMetricVal}>{formatDate(loan.loanEndDate)}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}

                {borrowerLoans.length > 3 && (
                  <TouchableOpacity
                    style={styles.showMoreFacilitiesBtn}
                    onPress={() => setShowAllFacilities(!showAllFacilities)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.showMoreFacilitiesText}>
                      {showAllFacilities
                        ? 'Show Less'
                        : `Showing 3 of ${borrowerLoans.length} facilities • View All`}
                    </Text>
                    <Feather
                      name={showAllFacilities ? 'chevron-up' : 'chevron-down'}
                      size={m(14)}
                      color="#2563eb"
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* ── SECTION 5: CONTACT & ADDRESS INFORMATION ── */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconCircleBlue, { backgroundColor: '#0284c7' }]}>
                <Feather name="map-pin" size={m(16)} color={colors.white} />
              </View>
              <View style={{ flex: 1, marginLeft: m(10) }}>
                <Text style={styles.cardSectionTitle}>CONTACT & ADDRESS INFORMATION</Text>
                <Text style={styles.cardSectionSub}>Direct borrower communication channels</Text>
              </View>
            </View>

            <View style={styles.contactGrid}>
              <View style={styles.contactTile}>
                <Text style={styles.contactTileLabel}>PRIMARY MOBILE</Text>
                <View style={styles.contactRow}>
                  <Feather name="phone" size={m(13)} color="#2563eb" />
                  <Text style={styles.contactValBold}>{phone}</Text>
                </View>
              </View>

              <View style={styles.contactTile}>
                <Text style={styles.contactTileLabel}>ALTERNATE PHONE</Text>
                <View style={styles.contactRow}>
                  <Feather name="phone-call" size={m(13)} color="#2563eb" />
                  <Text style={styles.contactValBold}>{altPhone || 'Not Provided'}</Text>
                </View>
              </View>

              <View style={[styles.contactTile, { width: '100%' }]}>
                <Text style={styles.contactTileLabel}>EMAIL ADDRESS</Text>
                <View style={styles.contactRow}>
                  <Feather name="mail" size={m(13)} color="#2563eb" />
                  <Text style={styles.contactValBold}>{email}</Text>
                </View>
              </View>

              <View style={[styles.contactTile, { width: '100%' }]}>
                <Text style={styles.contactTileLabel}>LOCATION / ADDRESS</Text>
                <View style={[styles.contactRow, { alignItems: 'flex-start' }]}>
                  <Feather name="map-pin" size={m(13)} color="#2563eb" style={{ marginTop: m(2) }} />
                  <Text style={[styles.contactValText, { flex: 1 }]}>{fullAddress}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── SECTION 6: Disbursal OTP Status Card (when Accepted) ── */}
          {isAccepted && (
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
    paddingBottom: m(14),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(6),
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
    fontSize: m(19),
    lineHeight: m(25),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  headerSubtitle: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
    opacity: 0.85,
    marginTop: m(2),
  },
  headerBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    paddingLeft: m(48),
    marginTop: m(2),
  },
  cibilScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(5),
    backgroundColor: '#dcfce7',
    paddingHorizontal: m(9),
    paddingVertical: m(4),
    borderRadius: m(8),
    borderWidth: 1,
    borderColor: '#86efac',
  },
  cibilScoreBadgeText: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: '#15803d',
    letterSpacing: 0.3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(5),
    paddingHorizontal: m(9),
    paddingVertical: m(4),
    borderRadius: m(8),
  },
  statusDot: {
    width: m(6),
    height: m(6),
    borderRadius: m(3),
  },
  dotPending: { backgroundColor: '#b45309' },
  dotAccepted: { backgroundColor: '#047857' },
  dotAutoClosed: { backgroundColor: '#475569' },
  dotRejected: { backgroundColor: '#dc2626' },
  pillPending: { backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fde68a' },
  textPending: { color: '#b45309', fontSize: m(10), fontFamily: FontFamily.primaryBold },
  pillAccepted: { backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0' },
  textAccepted: { color: '#047857', fontSize: m(10), fontFamily: FontFamily.primaryBold },
  pillAutoClosed: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1' },
  textAutoClosed: { color: '#475569', fontSize: m(10), fontFamily: FontFamily.primaryBold },
  pillRejected: { backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fca5a5' },
  textRejected: { color: '#dc2626', fontSize: m(10), fontFamily: FontFamily.primaryBold },

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
  notesBox: {
    backgroundColor: '#f8fafc',
    padding: m(10),
    borderRadius: m(8),
    marginTop: m(8),
    borderWidth: 1,
    borderColor: '#e2e8f0',
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

  // ── Facility Grid & Security Box ──
  facilityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(8),
    marginBottom: m(10),
  },
  facilityTilePrimary: {
    width: '48.5%',
    backgroundColor: '#eff6ff',
    borderRadius: m(12),
    paddingHorizontal: m(12),
    paddingVertical: m(10),
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  facilityTile: {
    width: '48.5%',
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    paddingHorizontal: m(12),
    paddingVertical: m(10),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  facilityTileLabel: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: m(2),
  },
  facilityTileValPrimary: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: '#1e40af',
  },
  facilityTileVal: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  facilityTileSub: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryRegular,
    color: '#64748b',
    marginTop: m(2),
  },
  securityBox: {
    backgroundColor: '#fffbeb',
    borderRadius: m(12),
    padding: m(12),
    borderWidth: 1,
    borderColor: '#fde68a',
    marginTop: m(4),
  },
  securityBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(4),
    flexWrap: 'wrap',
    gap: m(6),
  },
  securityBoxLabel: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: '#92400e',
    letterSpacing: 0.4,
  },
  securityBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: m(6),
    paddingVertical: m(2),
    borderRadius: m(4),
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  securityBadgeText: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: '#b45309',
  },
  securityValText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(4),
  },
  securityNoteText: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryRegular,
    color: '#78350f',
    lineHeight: m(14),
  },

  // ── Risk Grade Badge ──
  riskGradeBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(6),
    borderWidth: 1,
    borderColor: '#86efac',
  },
  riskGradeBadgeText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: '#15803d',
  },

  // ── KPI Summary Cards ──
  viewAllBadgeBtn: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(6),
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  viewAllBadgeText: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: '#2563eb',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(8),
    marginBottom: m(10),
  },
  kpiTile: {
    width: '48.5%',
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    paddingHorizontal: m(10),
    paddingVertical: m(8),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  kpiTileLabel: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: '#64748b',
    letterSpacing: 0.4,
    marginBottom: m(2),
  },
  kpiTileVal: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  // ── Previous Facility Cards ──
  emptyLoansBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    backgroundColor: '#f0fdf4',
    padding: m(12),
    borderRadius: m(10),
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginTop: m(4),
  },
  emptyLoansText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: '#166534',
    flex: 1,
  },
  loanFacilityCard: {
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    padding: m(10),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  loanFacHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(6),
  },
  loanFacPurpose: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  loanFacLender: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryRegular,
    color: '#64748b',
    marginTop: m(1),
  },
  loanFacPill: {
    paddingHorizontal: m(7),
    paddingVertical: m(2.5),
    borderRadius: m(6),
  },
  loanFacPillText: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    letterSpacing: 0.3,
  },
  facPillPaid: { backgroundColor: '#dcfce7', borderWidth: 1, borderColor: '#86efac' },
  facTextPaid: { color: '#15803d' },
  facPillPartPaid: { backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fcd34d' },
  facTextPartPaid: { color: '#b45309' },
  facPillPending: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  facTextPending: { color: '#1d4ed8' },
  facPillOverdue: { backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fca5a5' },
  facTextOverdue: { color: '#b91c1c' },
  loanFacMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: m(6),
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
  },
  loanFacMetricCol: {
    alignItems: 'flex-start',
  },
  loanFacMetricLabel: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryRegular,
    color: '#64748b',
    marginBottom: m(1),
  },
  loanFacMetricVal: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  showMoreFacilitiesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(4),
    paddingVertical: m(8),
    marginTop: m(4),
  },
  showMoreFacilitiesText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: '#2563eb',
  },

  // ── Contact & Address Info Grid ──
  contactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(8),
  },
  contactTile: {
    width: '48.5%',
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    paddingHorizontal: m(12),
    paddingVertical: m(10),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  contactTileLabel: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: m(4),
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  contactValBold: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    flexShrink: 1,
  },
  contactValText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
    lineHeight: m(16),
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
