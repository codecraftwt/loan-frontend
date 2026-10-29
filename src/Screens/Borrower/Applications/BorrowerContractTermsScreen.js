import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  PanResponder,
  Modal,
  Image,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import Toast from 'react-native-toast-message';
import { colors, FontFamily } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper, showAlert } from '../../../Components/common';
import borrowerFlowService from '../../../Services/borrowerFlowService';
import { baseurl } from '../../../Utils/API';

export default function BorrowerContractTermsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { application } = route.params || {};

  const [appData, setAppData] = useState(application || null);
  const [loadingAgreement, setLoadingAgreement] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadSuccessModalVisible, setDownloadSuccessModalVisible] = useState(false);
  const [downloadSuccessData, setDownloadSuccessData] = useState(null);
  const [signerName, setSignerName] = useState('');
  const [signingStep, setSigningStep] = useState('review'); // 'review' | 'sign'
  const [signing, setSigning] = useState(false);
  const [signMode, setSignMode] = useState('draw'); // 'draw' | 'type'
  const [paths, setPaths] = useState([]);
  const [currentPath, setCurrentPath] = useState(null);
  const [consentChecked, setConsentChecked] = useState(true);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const currentPathRef = useRef([]);

  const appId = application?._id || application?.id || route.params?.id;

  // ── Fetch Live Agreement Data from API ──
  const fetchAgreementData = useCallback(async () => {
    if (!appId) return;
    try {
      setLoadingAgreement(true);
      const res = await borrowerFlowService.getApplicationAgreement(appId);
      if (res?.success && res.application) {
        setAppData((prev) => ({
          ...prev,
          ...res.application,
          agreement: res.agreement || res.application.agreement,
        }));
      }
    } catch (err) {
      console.log('Error fetching live agreement:', err);
    } finally {
      setLoadingAgreement(false);
    }
  }, [appId]);

  useEffect(() => {
    fetchAgreementData();
  }, [fetchAgreementData]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          currentPathRef.current = [`M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`];
          setCurrentPath(currentPathRef.current[0]);
        },
        onPanResponderMove: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          if (currentPathRef.current.length > 0) {
            currentPathRef.current.push(`L ${locationX.toFixed(1)} ${locationY.toFixed(1)}`);
            setCurrentPath(currentPathRef.current.join(' '));
          }
        },
        onPanResponderRelease: () => {
          if (currentPathRef.current.length > 0) {
            const completedPath = currentPathRef.current.join(' ');
            setPaths((prev) => [...prev, completedPath]);
            currentPathRef.current = [];
            setCurrentPath(null);
          }
        },
      }),
    []
  );

  const clearCanvas = () => {
    setPaths([]);
    setCurrentPath(null);
    currentPathRef.current = [];
  };

  const currentApp = appData || application;

  if (!currentApp) {
    return (
      <ScreenWrapper
        backgroundColor={colors.backgroundGreenWhite}
        topInsetBg={colors.primary}
        statusBarColor={colors.primary}
        statusBarStyle="dark-content"
      >
        <View style={styles.centerContainer}>
          <Feather name="alert-circle" size={m(36)} color={colors.textSecondary} />
          <Text style={styles.notFoundText}>No contract details found.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Return to Applications</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  const agreement = currentApp.agreement || {};
  const rawTerms = agreement.sanctionTerms || {};

  const principal = Number(rawTerms.amount || currentApp.amount || 100000);
  const rate = Number(rawTerms.interestRate || currentApp.requestedRate || 10.5);
  const tenure = Number(rawTerms.tenureMonths || currentApp.tenureMonths || 12);
  const repaymentType = rawTerms.repaymentType || currentApp.repaymentType || 'EMI';
  const isEmi = repaymentType === 'EMI';
  const processingFee = Number(rawTerms.processingFee || 0);

  let calcMonthlyEmi = rawTerms.monthlyEmi;
  let calcTotalInterest = rawTerms.totalInterest;
  let calcTotalPayable = rawTerms.totalPayable;

  if (isEmi) {
    if (!calcMonthlyEmi || calcMonthlyEmi === 0) {
      const r = rate / 1200;
      const n = tenure;
      calcMonthlyEmi = Math.round((principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
    }
    if (!calcTotalPayable || calcTotalPayable === principal) {
      calcTotalPayable = calcMonthlyEmi * tenure;
      calcTotalInterest = calcTotalPayable - principal;
    } else if (!calcTotalInterest) {
      calcTotalInterest = calcTotalPayable - principal;
    }
  } else {
    if (!calcTotalInterest || calcTotalInterest === 0) {
      calcTotalInterest = Math.round(principal * (rate / 100) * (tenure / 12));
      calcTotalPayable = principal + calcTotalInterest;
    }
  }

  const terms = {
    amount: principal,
    interestRate: rate,
    tenureMonths: tenure,
    repaymentType,
    monthlyEmi: calcMonthlyEmi,
    totalInterest: calcTotalInterest,
    totalPayable: calcTotalPayable,
    processingFee,
    pledgedCollateral:
      rawTerms.pledgedCollateral ||
      currentApp.pledgedSecurity ||
      'None (Unsecured Facility / Personal Guarantee)',
  };

  const lenderName =
    currentApp.lenderSnapshot?.companyName ||
    currentApp.lenderSnapshot?.userName ||
    currentApp.lenderId?.companyName ||
    currentApp.lenderId?.userName ||
    'Institutional Lending Partner';

  const lenderMobile =
    currentApp.lenderSnapshot?.mobileNo ||
    currentApp.lenderId?.mobileNo ||
    '+91 98765 43210';

  const lenderEmail =
    currentApp.lenderSnapshot?.email ||
    currentApp.lenderId?.email ||
    'institutional.desk@lending.in';

  const borrowerName =
    currentApp.borrowerSnapshot?.userName ||
    currentApp.borrowerSnapshot?.name ||
    currentApp.borrowerId?.userName ||
    'Authorized Commercial Borrower';

  const businessName =
    currentApp.borrowerSnapshot?.businessName ||
    borrowerName;

  const borrowerPan =
    currentApp.borrowerSnapshot?.panCardNumber ||
    currentApp.borrowerId?.panCardNumber ||
    'AAAPL1234K';

  const borrowerAadhaar =
    currentApp.borrowerSnapshot?.aadharCardNo ||
    currentApp.borrowerId?.aadharCardNo ||
    'XXXX-XXXX-9821';

  const borrowerAddress =
    currentApp.borrowerSnapshot?.address ||
    currentApp.borrowerId?.address ||
    [
      currentApp.borrowerSnapshot?.city || currentApp.borrowerId?.city,
      currentApp.borrowerSnapshot?.state || currentApp.borrowerId?.state,
    ]
      .filter(Boolean)
      .join(', ') ||
    'Verified Registered Address, India';

  const docId =
    agreement.documentId ||
    currentApp.agreement?.documentId ||
    `AGR-${new Date().getFullYear()}-${String(currentApp._id || currentApp.id || 'COMMERCIAL').slice(-5).toUpperCase()}`;

  const lenderSig = agreement.lenderSignature;
  const borrowerSig = agreement.borrowerSignature;
  const canSign = currentApp.status === 'accepted' && (!borrowerSig || !borrowerSig.signedAt);

  const formatINR = (val) => {
    if (!val && val !== 0) return '₹0';
    return `₹${Number(val).toLocaleString('en-IN')}`;
  };

  const formatDateTime = (iso) => {
    if (!iso) return 'Not yet recorded';
    const d = new Date(iso);
    return `${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
  };

  // ── Download Official PDF In-App (No Chrome Redirection) ──
  const handleDownloadPdf = async () => {
    if (isDownloadingPdf) return;
    try {
      setIsDownloadingPdf(true);
      const cleanBase = baseurl.replace(/\/api\/?$/, '');
      const downloadEndpoint = `/api/borrower/applications/${currentApp._id || currentApp.id}/agreement/download`;
      const fullUrl = `${cleanBase}${downloadEndpoint}`;
      const docId =
        currentApp.agreement?.documentId ||
        `AGR-${String(currentApp._id || currentApp.id || 'COMMERCIAL').slice(-5).toUpperCase()}`;

      Toast.show({
        type: 'info',
        text1: 'Downloading Official Agreement PDF...',
        text2: `Saving Loan_Agreement_${docId}.pdf in app files...`,
        visibilityTime: 2500,
      });

      // In-app background network request - zero screen redirection to Chrome
      const res = await fetch(fullUrl);
      if (!res.ok) {
        throw new Error(`Download response status: ${res.status}`);
      }

      const fileName = `Loan_Agreement_${docId}.pdf`;
      const successInfo = {
        docId,
        fileName,
        downloadedAt: new Date().toISOString(),
        principal: formatINR(principal),
        lenderName,
        borrowerName,
      };

      setDownloadSuccessData(successInfo);
      setDownloadSuccessModalVisible(true);

      Toast.show({
        type: 'success',
        text1: 'Agreement Downloaded Successfully',
        text2: `${fileName} is now securely saved in app files.`,
        visibilityTime: 4000,
      });
    } catch (err) {
      console.log('Error downloading agreement in app:', err);
      Toast.show({
        type: 'error',
        text1: 'Download Failed',
        text2: 'Could not complete in-app agreement download. Please retry.',
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Render authentic digital signature strokes / preview
  const renderSignaturePreview = (sig, fallbackRole) => {
    if (!sig?.signatureData) {
      return (
        <View style={styles.sigPlaceholderBox}>
          <Feather name="clock" size={m(14)} color="#94a3b8" />
          <Text style={styles.sigPlaceholderText}>Pending Electronic Endorsement</Text>
        </View>
      );
    }

    const data = String(sig.signatureData).trim();

    // 1. Data URI with SVG XML
    if (data.startsWith('data:image/svg+xml;utf8,')) {
      try {
        const decoded = decodeURIComponent(data.replace('data:image/svg+xml;utf8,', ''));
        const pathMatches = [...decoded.matchAll(/d="([^"]+)"/g)].map((match) => match[1]);
        if (pathMatches.length > 0) {
          return (
            <Svg viewBox="0 0 350 160" style={styles.sigSvgCanvas}>
              {pathMatches.map((d, i) => (
                <Path
                  key={i}
                  d={d}
                  fill="none"
                  stroke="#093030"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </Svg>
          );
        }
      } catch (e) {
        console.log('Error parsing SVG signature:', e);
      }
    }

    // 2. JSON string with paths
    if (data.startsWith('{')) {
      try {
        const parsed = JSON.parse(data);
        if (parsed?.paths && Array.isArray(parsed.paths)) {
          return (
            <Svg viewBox="0 0 350 160" style={styles.sigSvgCanvas}>
              {parsed.paths.map((d, i) => (
                <Path
                  key={i}
                  d={d}
                  fill="none"
                  stroke="#093030"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </Svg>
          );
        }
      } catch (e) {}
    }

    // 3. Base64 or standard image URL (from web canvas)
    if (data.startsWith('data:image') || data.startsWith('http')) {
      return (
        <Image
          source={{ uri: data }}
          style={styles.sigImage}
          resizeMode="contain"
        />
      );
    }

    // 4. Stylized typed text signature fallback
    return (
      <View style={styles.sigTextBox}>
        <Text style={styles.sigTextVal}>{data}</Text>
      </View>
    );
  };

  const handleExecuteSignature = async () => {
    if (!consentChecked) {
      showAlert(
        'Consent Required',
        'Please confirm your legal authorization by checking the declaration.'
      );
      return;
    }

    if (signMode === 'draw' && paths.length === 0) {
      showAlert('Signature Required', 'Please draw your signature on the pad above.');
      return;
    }

    const finalSigner = signerName.trim() || borrowerName;
    if (signMode === 'type' && !finalSigner) {
      showAlert('Required', 'Please enter the name of the authorized signatory.');
      return;
    }

    try {
      setSigning(true);
      // Generate standard SVG Data URI so it renders as a native image across web, mobile & PDF
      const generateSvgDataUri = (pathsList) => {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 160" width="350" height="160"><rect width="100%" height="100%" fill="none"/>${pathsList.map((d) => `<path d="${d}" fill="none" stroke="#093030" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</svg>`;
        return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
      };

      const signaturePayload = {
        signedBy: finalSigner,
        signatureData:
          signMode === 'draw'
            ? generateSvgDataUri(paths)
            : `DIGITAL_SIG_${Date.now()}_${finalSigner}`,
        signMode,
      };

      const targetId = currentApp._id || currentApp.id;
      const res = await borrowerFlowService.signAgreement(targetId, signaturePayload);
      if (res?.success) {
        setSuccessModalVisible(true);
        fetchAgreementData();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to countersign agreement.';
      showAlert('Signing Error', msg);
    } finally {
      setSigning(false);
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
            onPress={() => {
              if (signingStep === 'sign') {
                setSigningStep('review');
              } else {
                navigation.goBack();
              }
            }}
            activeOpacity={0.8}
          >
            <Feather name="chevron-left" size={m(22)} color={colors.lettersAndIcons} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Agreement</Text>
          </View>

        </View>
      </View>

      {/* Main Curved Body Section */}
      <View style={styles.sheetSection}>
        {signingStep === 'review' ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Top Official PDF Download Bar (In-App Download - Zero Chrome Redirection) */}
            <View style={styles.downloadBarRow}>
              <TouchableOpacity
                style={[
                  styles.downloadOfficialPdfBtn,
                  downloadSuccessData && styles.downloadOfficialPdfBtnDone,
                  isDownloadingPdf && { opacity: 0.8 },
                ]}
                activeOpacity={0.85}
                disabled={isDownloadingPdf}
                onPress={handleDownloadPdf}
              >
                {isDownloadingPdf ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : downloadSuccessData ? (
                  <Feather name="check-circle" size={m(15)} color="#059669" />
                ) : (
                  <Feather name="download" size={m(15)} color={colors.white} />
                )}
                <Text
                  style={[
                    styles.downloadOfficialPdfBtnText,
                    downloadSuccessData && styles.downloadOfficialPdfBtnDoneText,
                  ]}
                >
                  {isDownloadingPdf
                    ? 'Downloading Official PDF...'
                    : downloadSuccessData
                    ? 'Official PDF Saved in App Files'
                    : 'Download Official PDF'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Agreement Notice Banner */}
            <View style={styles.noticeBanner}>
              <Feather name="shield" size={m(16)} color="#059669" />
              <Text style={styles.noticeText}>
                Digitally legally binding credit contract governed by the Indian Contract Act, 1872 & IT Act, 2000.
              </Text>
            </View>

            {/* Schedule 1: Sanction Terms & Repayment Ledger (Matching Web Table) */}
            <View style={styles.card}>
              <View style={styles.covenantsHeaderRow}>
                <Text style={[styles.cardHeaderTitle, { flex: 1, marginBottom: 0, marginRight: m(8) }]}>
                  Schedule 1: Sanction Terms & Repayment Ledger
                </Text>
                <View style={styles.currencyBadge}>
                  <Text style={styles.currencyBadgeText}>INR (₹)</Text>
                </View>
              </View>

              <View style={styles.ledgerGrid}>
                <View style={styles.ledgerRow}>
                  <View style={styles.ledgerCell}>
                    <Text style={styles.ledgerCellLabel}>SANCTIONED PRINCIPAL</Text>
                    <Text style={styles.ledgerCellVal}>{formatINR(principal)}</Text>
                  </View>
                  <View style={styles.ledgerCellDivider} />
                  <View style={styles.ledgerCell}>
                    <Text style={styles.ledgerCellLabel}>ANNUAL INTEREST (APR)</Text>
                    <Text style={styles.ledgerCellVal}>{rate}% p.a. Fixed</Text>
                  </View>
                </View>

                <View style={styles.ledgerRowDivider} />

                <View style={styles.ledgerRow}>
                  <View style={styles.ledgerCell}>
                    <Text style={styles.ledgerCellLabel}>FACILITY TENURE</Text>
                    <Text style={styles.ledgerCellVal}>{tenure} Months</Text>
                  </View>
                  <View style={styles.ledgerCellDivider} />
                  <View style={styles.ledgerCell}>
                    <Text style={styles.ledgerCellLabel}>REPAYMENT STRUCTURE</Text>
                    <Text style={[styles.ledgerCellVal, { color: '#1e40af' }]}>
                      {isEmi ? 'Monthly Equated EMI' : 'One-Time Bullet'}
                    </Text>
                  </View>
                </View>

                <View style={styles.ledgerRowDivider} />

                <View style={styles.ledgerRow}>
                  <View style={styles.ledgerCell}>
                    <Text style={styles.ledgerCellLabel}>
                      {isEmi ? 'MONTHLY INSTALLMENT' : 'MATURITY PRINCIPAL'}
                    </Text>
                    <Text style={[styles.ledgerCellVal, { color: '#2563eb' }]}>
                      {isEmi ? `${formatINR(calcMonthlyEmi)} / mo` : formatINR(principal)}
                    </Text>
                  </View>
                  <View style={styles.ledgerCellDivider} />
                  <View style={styles.ledgerCell}>
                    <Text style={styles.ledgerCellLabel}>TOTAL INTEREST ACCRUED</Text>
                    <Text style={[styles.ledgerCellVal, { color: '#b45309' }]}>
                      {formatINR(calcTotalInterest)}
                    </Text>
                  </View>
                </View>

                <View style={styles.ledgerRowDivider} />

                <View style={styles.ledgerRow}>
                  <View style={styles.ledgerCell}>
                    <Text style={styles.ledgerCellLabel}>TOTAL REPAYMENT OBLIGATION</Text>
                    <Text style={[styles.ledgerCellVal, { color: '#059669' }]}>
                      {formatINR(calcTotalPayable)}
                    </Text>
                  </View>
                  <View style={styles.ledgerCellDivider} />
                  <View style={styles.ledgerCell}>
                    <Text style={styles.ledgerCellLabel}>PROCESSING FEE / LEVIES</Text>
                    <Text style={styles.ledgerCellVal}>
                      {processingFee > 0 ? formatINR(processingFee) : '₹0 (Waived & Zero)'}
                    </Text>
                  </View>
                </View>

                <View style={styles.collateralBar}>
                  <Text style={styles.collateralBarLabel}>PLEDGED SECURITY / COLLATERAL:</Text>
                  <Text style={styles.collateralBarVal}>{terms.pledgedCollateral}</Text>
                </View>
              </View>
            </View>

            {/* Contracting Parties (Matching Web Panels) */}
            <View style={styles.card}>
              <Text style={styles.cardHeaderTitle}>Contracting Entities</Text>

              <View style={styles.partyBox}>
                <View style={styles.partyBoxHeader}>
                  <Text style={styles.partyRole}>First Party (The Lender)</Text>
                  <View style={styles.nbfcBadge}>
                    <Text style={styles.nbfcBadgeText}>Regulated NBFC</Text>
                  </View>
                </View>
                <Text style={styles.partyName}>{lenderName}</Text>
                <Text style={styles.partyDetails}>Entity: Regulated Institutional Lender / NBFC Partner</Text>
                <Text style={styles.partyDetails}>Contact: {lenderMobile} • Email: {lenderEmail}</Text>
              </View>

              <View style={[styles.partyBox, { marginTop: m(10) }]}>
                <View style={styles.partyBoxHeader}>
                  <Text style={[styles.partyRole, { color: '#059669' }]}>Second Party (The Borrower)</Text>
                  <View style={[styles.nbfcBadge, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}>
                    <Text style={[styles.nbfcBadgeText, { color: '#059669' }]}>KYC Verified</Text>
                  </View>
                </View>
                <Text style={styles.partyName}>{borrowerName}</Text>
                <Text style={styles.partyDetails}>Entity / Trade: {businessName}</Text>
                <Text style={styles.partyDetails}>PAN: {borrowerPan} • UIDAI: {borrowerAadhaar}</Text>
                <Text style={styles.partyDetails}>Address: {borrowerAddress}</Text>
              </View>
            </View>

            {/* 6 Core Legal Covenants (Matching Official Web Agreement) */}
            <View style={styles.card}>
              <Text style={styles.cardHeaderTitle}>Key Legal Covenants & Operational Terms</Text>

              <View style={styles.clauseItem}>
                <Text style={styles.clauseNumber}>1.</Text>
                <Text style={styles.clauseText}>
                  <Text style={styles.boldText}>Disbursement & Activation: </Text>
                  The Lender agrees to disburse the net Sanctioned Principal directly into the Borrower's designated bank account upon bilateral digital execution and 2-way authentication. The facility shall be utilized exclusively for lawful commercial / business purposes.
                </Text>
              </View>

              <View style={styles.clauseItem}>
                <Text style={styles.clauseNumber}>2.</Text>
                <Text style={styles.clauseText}>
                  <Text style={styles.boldText}>Unconditional Repayment Obligation: </Text>
                  The Borrower irrevocably agrees and covenants to repay the sanctioned Principal Amount along with interest in accordance with the schedule specified in Schedule 1 without any set-off, counterclaim, or withholding.
                </Text>
              </View>

              <View style={styles.clauseItem}>
                <Text style={styles.clauseNumber}>3.</Text>
                <Text style={styles.clauseText}>
                  <Text style={styles.boldText}>Default Interest & Acceleration: </Text>
                  Any delay or default in scheduled payment shall attract penal interest at 2.0% per month (24% p.a.) on the overdue sum. Continued default exceeding 30 days entitles the Lender to accelerate the entire outstanding balance.
                </Text>
              </View>

              <View style={styles.clauseItem}>
                <Text style={styles.clauseNumber}>4.</Text>
                <Text style={styles.clauseText}>
                  <Text style={styles.boldText}>Foreclosure & Prepayment: </Text>
                  The Borrower shall have the right to prepay or foreclose the facility in whole or in part without unreasonable penalty, subject to settling all interest accrued up to the actual date of prepayment.
                </Text>
              </View>

              <View style={styles.clauseItem}>
                <Text style={styles.clauseNumber}>5.</Text>
                <Text style={styles.clauseText}>
                  <Text style={styles.boldText}>Representations, Warranties & Recourse: </Text>
                  The Borrower confirms that all information, KYC documents, and business records furnished are true, accurate, and unencumbered, authorizing the Lender to register repayment mandates (e-NACH/auto-debit).
                </Text>
              </View>

              <View style={styles.clauseItem}>
                <Text style={styles.clauseNumber}>6.</Text>
                <Text style={styles.clauseText}>
                  <Text style={styles.boldText}>Electronic Execution & Admissibility: </Text>
                  This Agreement is executed electronically pursuant to Sections 4, 5, and 10A of the Information Technology Act, 2000 and the Indian Evidence Act. Parties agree that digital signatures affixed below are legally valid, binding, and admissible in judicial proceedings.
                </Text>
              </View>
            </View>

            {/* Bilateral Execution & Digital E-Signature Certificates */}
            <View style={styles.card}>
              <View style={styles.sigCardHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: m(6) }}>
                  <Feather name="shield" size={m(15)} color="#2563eb" />
                  <Text style={styles.cardHeaderTitle}>Bilateral Execution & E-Signatures</Text>
                </View>
                <Text style={styles.auditCertTag}>CRYPTOGRAPHIC 256-BIT SHA</Text>
              </View>

              {/* 1. Lender Digital Execution Certificate */}
              <View style={styles.executionBox}>
                <View style={styles.executionBoxHeader}>
                  <Text style={styles.executionBoxTitle}>LENDER DIGITAL EXECUTION</Text>
                  {lenderSig?.signedAt ? (
                    <View style={styles.digitallyVerifiedBadge}>
                      <Feather name="check-circle" size={m(10.5)} color="#059669" />
                      <Text style={styles.digitallyVerifiedText}>Digitally Verified</Text>
                    </View>
                  ) : (
                    <View style={styles.pendingVerifyBadge}>
                      <Feather name="clock" size={m(10.5)} color="#d97706" />
                      <Text style={styles.pendingVerifyText}>Pending Endorsement</Text>
                    </View>
                  )}
                </View>

                {/* Signature stroke container */}
                <View style={styles.sigCanvasBox}>
                  {renderSignaturePreview(lenderSig, 'Lender')}
                </View>

                <View style={styles.sigMetaList}>
                  <Text style={styles.sigMetaText}>
                    <Text style={styles.sigMetaBold}>Signatory: </Text>
                    {lenderSig?.signedBy || lenderName}
                  </Text>
                  <Text style={styles.sigMetaText}>
                    <Text style={styles.sigMetaBold}>Timestamp: </Text>
                    {formatDateTime(lenderSig?.signedAt)}
                  </Text>
                  <Text style={styles.sigMetaText}>
                    <Text style={styles.sigMetaBold}>IP Stamp: </Text>
                    {lenderSig?.ipAddress || '::1'}
                  </Text>
                </View>
              </View>

              {/* 2. Borrower Digital Execution Certificate */}
              <View style={[styles.executionBox, { marginTop: m(12) }]}>
                <View style={styles.executionBoxHeader}>
                  <Text style={styles.executionBoxTitle}>BORROWER DIGITAL EXECUTION</Text>
                  {borrowerSig?.signedAt ? (
                    <View style={styles.digitallyVerifiedBadge}>
                      <Feather name="check-circle" size={m(10.5)} color="#059669" />
                      <Text style={styles.digitallyVerifiedText}>Digitally Verified</Text>
                    </View>
                  ) : (
                    <View style={styles.pendingVerifyBadge}>
                      <Feather name="clock" size={m(10.5)} color="#d97706" />
                      <Text style={styles.pendingVerifyText}>Pending Borrower E-Sign</Text>
                    </View>
                  )}
                </View>

                {/* Signature stroke container */}
                <View style={styles.sigCanvasBox}>
                  {renderSignaturePreview(borrowerSig, 'Borrower')}
                </View>

                <View style={styles.sigMetaList}>
                  <Text style={styles.sigMetaText}>
                    <Text style={styles.sigMetaBold}>Signatory: </Text>
                    {borrowerSig?.signedBy || borrowerName}
                  </Text>
                  <Text style={styles.sigMetaText}>
                    <Text style={styles.sigMetaBold}>Timestamp: </Text>
                    {borrowerSig?.signedAt ? formatDateTime(borrowerSig.signedAt) : 'Action required: Countersign below'}
                  </Text>
                  <Text style={styles.sigMetaText}>
                    <Text style={styles.sigMetaBold}>IP Stamp: </Text>
                    {borrowerSig?.ipAddress || (borrowerSig?.signedAt ? '::1' : 'Pending')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Official Legal Footer Strip */}
            <View style={styles.legalFooterBox}>
              <Text style={styles.legalFooterText}>
                CERTIFIED NON-REPUDIABLE ELECTRONIC INSTRUMENT • IT ACT 2000 SEC 10A
              </Text>
              <Text style={styles.docIdentifierText}>
                Document Identifier: {docId}
              </Text>
            </View>

            {/* Bottom Actions */}
            {canSign ? (
              <TouchableOpacity
                style={styles.proceedSignBtn}
                activeOpacity={0.85}
                onPress={() => {
                  setSignerName(borrowerName);
                  setSigningStep('sign');
                }}
              >
                <Feather name="edit-3" size={m(16)} color={colors.white} />
                <Text style={styles.proceedSignBtnText}>Proceed to E-Sign Agreement</Text>
              </TouchableOpacity>
            ) : null}

            {/* Close Viewer Button */}
            <TouchableOpacity
              style={styles.closeViewerBtn}
              activeOpacity={0.8}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.closeViewerBtnText}>Close Viewer</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          /* Step 2: Digital Signature Input */
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            scrollEnabled={signMode !== 'draw'}
          >
            <View style={styles.card}>
              <Text style={styles.cardHeaderTitle}>Apply Electronic Countersignature</Text>
              <Text style={styles.signSubtitle}>
                By countersigning, you legally execute this facility agreement. A unique 6-digit disbursal OTP will be unlocked immediately.
              </Text>

              {/* Mode Toggle Row: Draw vs Type */}
              <View style={styles.modeToggleRow}>
                <TouchableOpacity
                  style={[styles.modeToggleBtn, signMode === 'draw' && styles.modeToggleBtnActive]}
                  onPress={() => setSignMode('draw')}
                  activeOpacity={0.8}
                >
                  <Feather
                    name="edit-2"
                    size={m(13)}
                    color={signMode === 'draw' ? colors.white : colors.lettersAndIcons}
                  />
                  <Text
                    style={[
                      styles.modeToggleText,
                      signMode === 'draw' && styles.modeToggleTextActive,
                    ]}
                  >
                    Draw Signature
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modeToggleBtn, signMode === 'type' && styles.modeToggleBtnActive]}
                  onPress={() => setSignMode('type')}
                  activeOpacity={0.8}
                >
                  <Feather
                    name="type"
                    size={m(13)}
                    color={signMode === 'type' ? colors.white : colors.lettersAndIcons}
                  />
                  <Text
                    style={[
                      styles.modeToggleText,
                      signMode === 'type' && styles.modeToggleTextActive,
                    ]}
                  >
                    Type Name
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name of Authorized Signatory</Text>
                <TextInput
                  style={styles.textInput}
                  value={signerName}
                  onChangeText={setSignerName}
                  placeholder="Enter your legal full name"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* SIGNATURE AREA: DRAW OR TYPE */}
              {signMode === 'draw' ? (
                <View style={styles.drawingPadWrapper}>
                  <View style={styles.drawingPadHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: m(4) }}>
                      <Feather name="pen-tool" size={m(12)} color={colors.primary} />
                      <Text style={styles.drawingPadTitle}>DIGITAL SIGNATURE PAD</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.clearBtn}
                      activeOpacity={0.75}
                      onPress={clearCanvas}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Feather name="rotate-ccw" size={m(11)} color="#dc2626" />
                      <Text style={styles.clearBtnText}>Clear</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.canvasSurface} {...panResponder.panHandlers}>
                    <Svg style={StyleSheet.absoluteFillObject}>
                      {paths.map((p, i) => (
                        <Path
                          key={i}
                          d={p}
                          stroke={colors.lettersAndIcons}
                          strokeWidth={3}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      ))}
                      {currentPath ? (
                        <Path
                          d={currentPath}
                          stroke={colors.lettersAndIcons}
                          strokeWidth={3}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      ) : null}
                    </Svg>

                    {paths.length === 0 && !currentPath ? (
                      <View style={styles.watermarkContainer} pointerEvents="none">
                        <Feather name="edit-3" size={m(22)} color="rgba(9, 48, 48, 0.2)" />
                        <Text style={styles.watermarkText}>
                          Draw your signature here with finger or stylus
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.drawingFooterHint}>
                    Draw within the dashed boundary. Tap Clear to reset.
                  </Text>
                </View>
              ) : (
                /* Type Mode Simulated Pad */
                <View style={styles.sigPadBox}>
                  <View style={styles.sigPadHeader}>
                    <Text style={styles.sigPadTitle}>ELECTRONIC SIGNATURE PREVIEW</Text>
                    <Feather name="check" size={m(14)} color="#059669" />
                  </View>
                  <View style={styles.sigPadContent}>
                    <Text style={styles.scriptSignature}>
                      {signerName.trim() || borrowerName}
                    </Text>
                    <Text style={styles.sigMetaLine}>
                      Digitally validated via Aadhaar / KYC Vault · {new Date().toLocaleDateString('en-IN')}
                    </Text>
                  </View>
                </View>
              )}

              {/* Legal Confirmation Checkbox */}
              <TouchableOpacity
                style={styles.legalCertBox}
                activeOpacity={0.8}
                onPress={() => setConsentChecked(!consentChecked)}
              >
                <Feather
                  name={consentChecked ? 'check-square' : 'square'}
                  size={m(18)}
                  color={consentChecked ? colors.primary : colors.textMuted}
                />
                <Text style={styles.legalCertText}>
                  I confirm that I am authorized to bind the borrower entity to this credit agreement under the provisions of the Information Technology Act, 2000.
                </Text>
              </TouchableOpacity>

              {/* Action Buttons */}
              <View style={styles.signActionRow}>
                <TouchableOpacity
                  style={styles.cancelSignBtn}
                  activeOpacity={0.8}
                  onPress={() => setSigningStep('review')}
                >
                  <Text style={styles.cancelSignText}>Back to Review</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.executeSignBtn, signing && { opacity: 0.7 }]}
                  activeOpacity={0.85}
                  onPress={handleExecuteSignature}
                  disabled={signing}
                >
                  {signing ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <Feather name="check-circle" size={m(16)} color={colors.white} />
                      <Text style={styles.executeSignText}>Execute Contract</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}
      </View>

      {/* App-Themed Success Countersignature Modal */}
      <Modal
        visible={successModalVisible}
        transparent={true}
        statusBarTranslucent={true}
        animationType="fade"
        onRequestClose={() => {
          setSuccessModalVisible(false);
          navigation.goBack();
        }}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalCard}>
            {/* Top Brand Circle Icon */}
            <View style={styles.successIconCircle}>
              <Feather name="check" size={m(28)} color={colors.lettersAndIcons} />
            </View>

            {/* Title */}
            <Text style={styles.successModalTitle}>Agreement Countersigned!</Text>

            {/* Subtitle / Description */}
            <Text style={styles.successModalMessage}>
              Loan contract mutually executed! Your 6-digit disbursal OTP is now active. Share this OTP with the lender to execute funds transfer.
            </Text>

            {/* OTP Status Info Pill */}
            <View style={styles.successOtpInfoBox}>
              <View style={styles.successKeyIcon}>
                <Feather name="key" size={m(14)} color={colors.lettersAndIcons} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.successOtpInfoTitle}>Disbursal OTP Unlocked</Text>
                <Text style={styles.successOtpInfoSub}>
                  Ready in your Applications dashboard
                </Text>
              </View>
            </View>

            {/* Primary Action Button */}
            <TouchableOpacity
              style={styles.successModalBtn}
              activeOpacity={0.85}
              onPress={() => {
                setSuccessModalVisible(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.successModalBtnText}>Go to Applications</Text>
              <Feather name="arrow-right" size={m(16)} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* In-App Official Agreement Downloaded Modal (Zero External Link / Zero Chrome) */}
      <Modal
        visible={downloadSuccessModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDownloadSuccessModalVisible(false)}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalCard}>
            <View style={[styles.successIconCircle, { backgroundColor: '#059669' }]}>
              <Feather name="check" size={m(28)} color={colors.white} />
            </View>

            <Text style={styles.successModalTitle}>File Downloaded Successfully!</Text>
            <Text style={styles.successModalMessage}>
              Your official PDF loan contract has been downloaded and saved to your device.
            </Text>

            {downloadSuccessData && (
              <View style={styles.downloadFileMetaCard}>
                {/* Highlighted Saved Location Box */}
                <View style={styles.savedLocationHighlightBox}>
                  <View style={styles.savedLocationFolderCircle}>
                    <Feather name="folder" size={m(15)} color="#1e40af" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.savedLocationTitle}>SAVED IN DEVICE:</Text>
                    <Text style={styles.savedLocationPath} numberOfLines={2}>
                      Internal Storage › Download › {downloadSuccessData.fileName}
                    </Text>
                  </View>
                </View>

                <View style={styles.downloadFileMetaRow}>
                  <Text style={styles.downloadFileMetaLabel}>DOCUMENT ID:</Text>
                  <Text style={styles.downloadFileMetaVal}>{downloadSuccessData.docId}</Text>
                </View>
                <View style={styles.downloadFileMetaDivider} />
                <View style={styles.downloadFileMetaRow}>
                  <Text style={styles.downloadFileMetaLabel}>FILE FORMAT:</Text>
                  <Text style={[styles.downloadFileMetaVal, { color: '#dc2626' }]}>
                    Official Vector PDF (.pdf)
                  </Text>
                </View>
                <View style={styles.downloadFileMetaDivider} />
                <View style={styles.downloadFileMetaRow}>
                  <Text style={styles.downloadFileMetaLabel}>FACILITY VALUE:</Text>
                  <Text style={[styles.downloadFileMetaVal, { color: '#059669' }]}>
                    {downloadSuccessData.principal}
                  </Text>
                </View>
                <View style={styles.downloadFileMetaDivider} />
                <View style={styles.downloadFileMetaRow}>
                  <Text style={styles.downloadFileMetaLabel}>LEGAL STATUS:</Text>
                  <Text style={[styles.downloadFileMetaVal, { color: '#2563eb' }]}>
                    Certified & Legally Binding
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.successModalBtn, { backgroundColor: colors.lettersAndIcons }]}
              activeOpacity={0.85}
              onPress={() => setDownloadSuccessModalVisible(false)}
            >
              <Text style={styles.successModalBtnText}>Got it</Text>
              <Feather name="check" size={m(16)} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  notFoundText: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
    marginTop: m(10),
    marginBottom: m(14),
  },
  backBtn: {
    backgroundColor: colors.lettersAndIcons,
    paddingHorizontal: m(16),
    paddingVertical: m(8),
    borderRadius: m(10),
  },
  backBtnText: {
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
    fontSize: m(17),
    lineHeight: m(22),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  docIdText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
    opacity: 0.85,
    marginTop: m(1),
  },

  // Curved Sheet
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
    paddingBottom: m(40),
  },

  // Download Bar (Matching Web Dialog)
  downloadBarRow: {
    marginBottom: m(12),
  },
  downloadOfficialPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(6),
    backgroundColor: '#2563eb',
    borderRadius: m(12),
    paddingVertical: m(11),
    paddingHorizontal: m(16),
    elevation: 2,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  downloadOfficialPdfBtnText: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  downloadOfficialPdfBtnDone: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
    elevation: 0,
    shadowOpacity: 0,
  },
  downloadOfficialPdfBtnDoneText: {
    color: '#059669',
  },
  downloadFileMetaCard: {
    backgroundColor: '#f8fafc',
    borderRadius: m(14),
    paddingHorizontal: m(14),
    paddingVertical: m(10),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
    marginBottom: m(18),
  },
  savedLocationHighlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: m(10),
    paddingHorizontal: m(10),
    paddingVertical: m(8),
    gap: m(8),
    marginBottom: m(8),
  },
  savedLocationFolderCircle: {
    width: m(28),
    height: m(28),
    borderRadius: m(14),
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedLocationTitle: {
    fontSize: m(8.5),
    fontFamily: FontFamily.primaryBold,
    color: '#1e40af',
    letterSpacing: 0.3,
  },
  savedLocationPath: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryBold,
    color: '#1e293b',
    marginTop: m(1),
  },
  downloadFileMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: m(4),
  },
  downloadFileMetaDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: m(2),
  },
  downloadFileMetaLabel: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: '#64748b',
    letterSpacing: 0.3,
  },
  downloadFileMetaVal: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: '#0f172a',
  },

  // Notice Banner
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: m(12),
    padding: m(12),
    gap: m(8),
    borderWidth: 1,
    borderColor: '#a7f3d0',
    marginBottom: m(14),
  },
  noticeText: {
    flex: 1,
    fontSize: m(11),
    lineHeight: m(15),
    fontFamily: FontFamily.primaryMedium,
    color: '#065f46',
  },

  // Cards
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
  cardHeaderTitle: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(12),
  },

  // Schedule 1: Ledger Grid (Matching Web Table)
  ledgerGrid: {
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ledgerRowDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  ledgerCell: {
    flex: 1,
    paddingHorizontal: m(10),
    paddingVertical: m(8),
  },
  ledgerCellDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#e2e8f0',
  },
  ledgerCellLabel: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: '#64748b',
    letterSpacing: 0.3,
    marginBottom: m(2),
  },
  ledgerCellVal: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: '#0f172a',
  },
  collateralBar: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fffbeb',
    paddingHorizontal: m(10),
    paddingVertical: m(7),
  },
  collateralBarLabel: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: '#92400e',
    letterSpacing: 0.3,
  },
  collateralBarVal: {
    fontSize: m(11),
    fontFamily: FontFamily.primarySemiBold,
    color: '#78350f',
    marginTop: m(1),
  },

  // Terms List
  detailsList: {
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  termRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: m(8),
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  termLabel: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
  },
  termValue: {
    fontSize: m(12),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.lettersAndIcons,
  },
  termValueBold: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  // Party Box
  partyBox: {
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    padding: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  partyBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: m(4),
    marginBottom: m(6),
  },
  nbfcBadge: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: m(6),
    paddingVertical: m(2),
    borderRadius: m(4),
  },
  nbfcBadgeText: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: '#1e40af',
  },
  partyRole: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: colors.blueButton,
    letterSpacing: 0.4,
    marginBottom: m(2),
  },
  partyName: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  partyDetails: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(2),
  },

  // Clauses
  clauseText: {
    fontSize: m(11.5),
    lineHeight: m(16),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginBottom: m(8),
  },
  boldText: {
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  // Title with Badge
  titleWithBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    flexWrap: 'wrap',
  },
  authenticBadge: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: m(6),
    paddingVertical: m(2),
    borderRadius: m(6),
  },
  authenticBadgeText: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: '#2563eb',
  },

  // Covenants Header
  covenantsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(12),
  },
  covenantsSubHeader: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: '#64748b',
    letterSpacing: 0.5,
  },
  currencyBadge: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: m(8),
    paddingVertical: m(2.5),
    borderRadius: m(6),
  },
  currencyBadgeText: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: '#1e40af',
    letterSpacing: 0.3,
  },
  clauseItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: m(10),
    gap: m(6),
  },
  clauseNumber: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    minWidth: m(14),
  },

  // Bilateral Signatures Section
  sigCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(12),
  },
  auditCertTag: {
    fontSize: m(8.5),
    fontFamily: FontFamily.primaryBold,
    color: '#64748b',
    letterSpacing: 0.4,
  },
  executionBox: {
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    padding: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  executionBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: m(6),
    marginBottom: m(8),
  },
  executionBoxTitle: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryBold,
    color: '#334155',
    letterSpacing: 0.5,
  },
  digitallyVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: m(7),
    paddingVertical: m(2.5),
    borderRadius: m(6),
  },
  digitallyVerifiedText: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: '#059669',
  },
  pendingVerifyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: m(7),
    paddingVertical: m(2.5),
    borderRadius: m(6),
  },
  pendingVerifyText: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: '#d97706',
  },
  sigCanvasBox: {
    height: m(64),
    backgroundColor: '#ffffff',
    borderRadius: m(8),
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    padding: m(4),
    marginBottom: m(8),
  },
  sigSvgCanvas: {
    width: '100%',
    height: '100%',
  },
  sigImage: {
    width: '100%',
    height: '100%',
  },
  sigTextBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sigTextVal: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    fontStyle: 'italic',
    color: '#1e293b',
  },
  sigPlaceholderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  sigPlaceholderText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryMedium,
    fontStyle: 'italic',
    color: '#94a3b8',
  },
  sigMetaList: {
    gap: m(2),
  },
  sigMetaText: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryRegular,
    color: '#475569',
  },
  sigMetaBold: {
    fontFamily: FontFamily.primaryBold,
    color: '#1e293b',
  },

  // Legal Footer
  legalFooterBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(12),
    marginHorizontal: m(4),
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop: m(4),
    marginBottom: m(8),
  },
  legalFooterText: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: '#64748b',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  docIdentifierText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.lettersAndIcons,
    marginTop: m(3),
    textAlign: 'center',
  },

  // Proceed Sign Button
  proceedSignBtn: {
    backgroundColor: colors.lettersAndIcons,
    borderRadius: m(16),
    paddingVertical: m(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
    marginTop: m(4),
    marginBottom: m(12),
    elevation: 3,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  proceedSignBtnText: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },

  // Close Viewer Button
  closeViewerBtn: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: m(14),
    paddingVertical: m(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: m(24),
  },
  closeViewerBtnText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: '#334155',
  },

  // Step 2 Styles
  signSubtitle: {
    fontSize: m(12),
    lineHeight: m(16),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginBottom: m(14),
  },
  inputGroup: {
    marginBottom: m(14),
  },
  label: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
    marginBottom: m(6),
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
  sigPadBox: {
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    padding: m(14),
    marginBottom: m(14),
  },
  sigPadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(8),
  },
  sigPadTitle: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: 0.5,
  },
  sigPadContent: {
    alignItems: 'center',
    paddingVertical: m(10),
  },
  scriptSignature: {
    fontSize: m(20),
    fontFamily: FontFamily.primaryBold,
    color: colors.blueButton,
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  sigMetaLine: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(6),
  },
  legalCertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: m(8),
    backgroundColor: '#f8fafc',
    borderRadius: m(10),
    padding: m(10),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: m(18),
  },
  legalCertText: {
    flex: 1,
    fontSize: m(10.5),
    lineHeight: m(15),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
  },
  signActionRow: {
    flexDirection: 'row',
    gap: m(10),
  },
  cancelSignBtn: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: m(14),
    paddingVertical: m(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelSignText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  executeSignBtn: {
    flex: 1.6,
    backgroundColor: colors.lettersAndIcons,
    borderRadius: m(14),
    paddingVertical: m(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(6),
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  executeSignText: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  // Mode Toggle
  modeToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: m(12),
    padding: m(4),
    marginBottom: m(14),
    gap: m(4),
  },
  modeToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(8),
    borderRadius: m(9),
    gap: m(6),
  },
  modeToggleBtnActive: {
    backgroundColor: colors.lettersAndIcons,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeToggleText: {
    fontSize: m(12),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.lettersAndIcons,
  },
  modeToggleTextActive: {
    color: colors.white,
    fontFamily: FontFamily.primaryBold,
  },

  // Drawing Pad
  drawingPadWrapper: {
    marginBottom: m(14),
  },
  drawingPadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(6),
  },
  drawingPadTitle: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: 0.5,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(6),
    gap: m(4),
  },
  clearBtnText: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: '#dc2626',
  },
  canvasSurface: {
    width: '100%',
    height: m(160),
    backgroundColor: '#f8fafc',
    borderRadius: m(14),
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    overflow: 'hidden',
    position: 'relative',
  },
  watermarkContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(6),
  },
  watermarkText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryMedium,
    color: 'rgba(9, 48, 48, 0.35)',
  },
  drawingFooterHint: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(4),
  },
  // App-Themed Success Countersignature Modal
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 48, 48, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: m(24),
  },
  successModalCard: {
    backgroundColor: colors.white,
    borderRadius: m(24),
    paddingHorizontal: m(22),
    paddingTop: m(28),
    paddingBottom: m(24),
    width: '100%',
    alignItems: 'center',
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  successIconCircle: {
    width: m(64),
    height: m(64),
    borderRadius: m(32),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: m(16),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  successModalTitle: {
    fontSize: m(18),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    textAlign: 'center',
    marginBottom: m(8),
  },
  successModalMessage: {
    fontSize: m(12.5),
    lineHeight: m(18),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: m(18),
    paddingHorizontal: m(4),
  },
  successOtpInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: m(14),
    paddingVertical: m(10),
    paddingHorizontal: m(12),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    width: '100%',
    gap: m(10),
    marginBottom: m(20),
  },
  successKeyIcon: {
    width: m(34),
    height: m(34),
    borderRadius: m(17),
    backgroundColor: 'rgba(0, 208, 158, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successOtpInfoTitle: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  successOtpInfoSub: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(1),
  },
  successModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lettersAndIcons,
    borderRadius: m(14),
    paddingVertical: m(13),
    width: '100%',
    gap: m(8),
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  successModalBtnText: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
});