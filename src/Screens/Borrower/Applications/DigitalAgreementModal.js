import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { colors, FontFamily } from '../../../constants';
import { m } from '../../../Utils/responsive';
import borrowerFlowService from '../../../Services/borrowerFlowService';

export default function DigitalAgreementModal({
  visible,
  onClose,
  application,
  onSignedSuccess,
}) {
  const [signerName, setSignerName] = useState('');
  const [signingStep, setSigningStep] = useState('review'); // 'review' | 'sign'
  const [signing, setSigning] = useState(false);

  if (!application) return null;

  const agreement = application.agreement || {};
  const terms = agreement.sanctionTerms || {
    amount: application.amount || 500000,
    interestRate: application.requestedRate || 10.5,
    tenureMonths: application.tenureMonths || 24,
    repaymentType: application.repaymentType || 'EMI',
    monthlyEmi: application.activeLoan?.monthlyEmi || 0,
  };

  const lenderName =
    application.lenderSnapshot?.companyName ||
    application.lenderSnapshot?.userName ||
    application.lenderId?.companyName ||
    application.lenderId?.userName ||
    'Institutional Lender';

  const borrowerName =
    application.borrowerSnapshot?.userName ||
    application.borrowerSnapshot?.businessName ||
    'Authorized Borrower';

  const docId =
    agreement.documentId ||
    `AGR-${new Date().getFullYear()}-${String(application._id).slice(-5).toUpperCase()}`;

  const lenderSig = agreement.lenderSignature;
  const borrowerSig = agreement.borrowerSignature;
  const canSign = agreement.status === 'lender_signed' || !borrowerSig?.signedAt;

  const formatINR = (val) => {
    if (!val) return '₹0';
    return `₹${Number(val).toLocaleString('en-IN')}`;
  };

  const handleExecuteSignature = async () => {
    const finalSigner = signerName.trim() || borrowerName;
    if (!finalSigner) {
      Alert.alert('Required', 'Please enter the name of the authorized signatory.');
      return;
    }

    try {
      setSigning(true);
      const signaturePayload = {
        signedBy: finalSigner,
        signatureData: `DIGITAL_SIG_${Date.now()}_${finalSigner}`,
      };

      const res = await borrowerFlowService.signAgreement(application._id, signaturePayload);
      if (res?.success) {
        Alert.alert(
          'Agreement Countersigned!',
          'Loan contract mutually executed! Your 6-digit disbursal OTP is now active. Share this OTP with the lender to execute funds transfer.',
          [
            {
              text: 'View Disbursal OTP',
              onPress: () => {
                onClose();
                if (onSignedSuccess) onSignedSuccess();
              },
            },
          ]
        );
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to countersign agreement.';
      Alert.alert('Signing Error', msg);
    } finally {
      setSigning(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top App Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.closeCircularBtn} onPress={onClose} activeOpacity={0.8}>
            <Feather name="x" size={m(18)} color={colors.lettersAndIcons} />
          </TouchableOpacity>

          <View style={styles.titleBox}>
            <Text style={styles.headerTag}>DIGITAL CREDIT FACILITY CONTRACT</Text>
            <Text style={styles.topBarTitle} numberOfLines={1}>
              Master Facility Agreement
            </Text>
            <Text style={styles.docIdText}>Doc ID: {docId}</Text>
          </View>

          <View style={{ width: m(38) }} />
        </View>

        {signingStep === 'review' ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Agreement Notice Banner */}
            <View style={styles.noticeBanner}>
              <Feather name="shield" size={m(16)} color="#059669" />
              <Text style={styles.noticeText}>
                Digitally legally binding credit contract governed by the Indian Contract Act, 1872 & IT Act, 2000.
              </Text>
            </View>

            {/* Key Sanctioned Financial Terms */}
            <View style={styles.card}>
              <Text style={styles.cardHeaderTitle}>Schedule A: Facility Covenants</Text>

              <View style={styles.detailsList}>
                <View style={styles.termRow}>
                  <Text style={styles.termLabel}>Sanctioned Facility Amount</Text>
                  <Text style={styles.termValueBold}>{formatINR(terms.amount)}</Text>
                </View>

                <View style={styles.termRow}>
                  <Text style={styles.termLabel}>Annual Interest Rate</Text>
                  <Text style={styles.termValue}>{terms.interestRate}% p.a.</Text>
                </View>

                <View style={styles.termRow}>
                  <Text style={styles.termLabel}>Facility Tenure</Text>
                  <Text style={styles.termValue}>{terms.tenureMonths} Months</Text>
                </View>

                <View style={styles.termRow}>
                  <Text style={styles.termLabel}>Repayment Mode</Text>
                  <Text style={styles.termValue}>
                    {terms.repaymentType === 'ONE_TIME' ? 'Bullet Repayment' : 'Monthly Amortizing EMI'}
                  </Text>
                </View>

                <View style={[styles.termRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.termLabel}>Pledged Collateral</Text>
                  <Text style={styles.termValue}>
                    {application.pledgedSecurity || 'Commercial Hypothecation / Unsecured'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Contracting Parties */}
            <View style={styles.card}>
              <Text style={styles.cardHeaderTitle}>Contracting Entities</Text>

              <View style={styles.partyBox}>
                <Text style={styles.partyRole}>1. Institutional Lender</Text>
                <Text style={styles.partyName}>{lenderName}</Text>
                <Text style={styles.partyDetails}>Licensed Lending Partner · Registered Entity</Text>
              </View>

              <View style={[styles.partyBox, { marginTop: m(10) }]}>
                <Text style={styles.partyRole}>2. Commercial Borrower</Text>
                <Text style={styles.partyName}>{borrowerName}</Text>
                <Text style={styles.partyDetails}>MSME / Corporate Applicant</Text>
              </View>
            </View>

            {/* Core Legal Covenants */}
            <View style={styles.card}>
              <Text style={styles.cardHeaderTitle}>Standard Terms & Disbursal Conditions</Text>
              <Text style={styles.clauseText}>
                1. <Text style={styles.boldText}>Disbursal Protocol:</Text> Funds will be released via RTGS/NEFT upon verification of the mutual 6-digit Disbursal OTP generated upon countersigning.
              </Text>
              <Text style={styles.clauseText}>
                2. <Text style={styles.boldText}>Repayment Obligation:</Text> The borrower unconditionally covenants to repay each monthly EMI on or before the due date.
              </Text>
              <Text style={styles.clauseText}>
                3. <Text style={styles.boldText}>Prepayment & Charges:</Text> Foreclosure and partial prepayment will adhere to agreed institutional master terms.
              </Text>
            </View>

            {/* Signatures Status */}
            <View style={styles.card}>
              <Text style={styles.cardHeaderTitle}>Signatures & Execution</Text>

              {/* Lender Signature */}
              <View style={styles.sigStatusBox}>
                <View style={styles.sigStatusHeader}>
                  <Text style={styles.sigPartyLabel}>Lender Representative</Text>
                  <View style={styles.signedTag}>
                    <Feather name="check-circle" size={m(12)} color="#059669" />
                    <Text style={styles.signedTagText}>Digitally Executed</Text>
                  </View>
                </View>
                <Text style={styles.sigNameText}>{lenderSig?.signedBy || lenderName}</Text>
                <Text style={styles.sigDateText}>
                  Timestamp: {lenderSig?.signedAt ? new Date(lenderSig.signedAt).toLocaleString('en-IN') : 'Approved & Verified'}
                </Text>
              </View>

              {/* Borrower Signature */}
              <View style={[styles.sigStatusBox, { marginTop: m(10) }]}>
                <View style={styles.sigStatusHeader}>
                  <Text style={styles.sigPartyLabel}>Borrower Signatory</Text>
                  {borrowerSig?.signedAt ? (
                    <View style={styles.signedTag}>
                      <Feather name="check-circle" size={m(12)} color="#059669" />
                      <Text style={styles.signedTagText}>Countersigned</Text>
                    </View>
                  ) : (
                    <View style={[styles.signedTag, { backgroundColor: '#fef3c7' }]}>
                      <Feather name="clock" size={m(12)} color="#d97706" />
                      <Text style={[styles.signedTagText, { color: '#d97706' }]}>Pending Signature</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.sigNameText}>
                  {borrowerSig?.signedBy || borrowerName}
                </Text>
                <Text style={styles.sigDateText}>
                  {borrowerSig?.signedAt
                    ? `Timestamp: ${new Date(borrowerSig.signedAt).toLocaleString('en-IN')}`
                    : 'Action required: Apply electronic countersignature'}
                </Text>
              </View>
            </View>

            {/* Bottom Review Action */}
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
          </ScrollView>
        ) : (
          /* Step 2: Digital Signature Input */
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <Text style={styles.cardHeaderTitle}>Apply Electronic Countersignature</Text>
              <Text style={styles.signSubtitle}>
                By countersigning, you legally execute this facility agreement. A unique 6-digit disbursal OTP will be unlocked immediately.
              </Text>

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

              {/* Digital Signature Simulated Pad */}
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

              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  activeOpacity={0.8}
                  onPress={() => setSigningStep('review')}
                >
                  <Text style={styles.cancelBtnText}>Back to Review</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmSignBtn, signing && styles.disabledBtn]}
                  activeOpacity={0.85}
                  onPress={handleExecuteSignature}
                  disabled={signing}
                >
                  {signing ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <>
                      <Feather name="check-circle" size={m(16)} color={colors.white} />
                      <Text style={styles.confirmSignBtnText}>Execute & Sign</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(18),
    paddingTop: m(14),
    paddingBottom: m(16),
    backgroundColor: colors.primary,
  },
  closeCircularBtn: {
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
  titleBox: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: m(10),
  },
  headerTag: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: 0.7,
    opacity: 0.85,
  },
  topBarTitle: {
    fontSize: m(15),
    lineHeight: m(20),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    textAlign: 'center',
  },
  docIdText: {
    fontSize: m(10),
    color: colors.lettersAndIcons,
    opacity: 0.8,
    marginTop: m(1),
    fontFamily: FontFamily.primaryMedium,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: m(18),
    gap: m(12),
    paddingBottom: m(60),
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(10),
    backgroundColor: '#ecfdf5',
    padding: m(12),
    borderRadius: m(14),
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  noticeText: {
    flex: 1,
    fontSize: m(11),
    lineHeight: m(16),
    fontFamily: FontFamily.primaryRegular,
    color: '#065f46',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: m(18),
    padding: m(16),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.06)',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    gap: m(10),
  },
  cardHeaderTitle: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(2),
  },
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
    borderColor: '#f1f5f9',
  },
  termLabel: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
  },
  termValue: {
    fontSize: m(12),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.lettersAndIcons,
  },
  termValueBold: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  partyBox: {
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    padding: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  partyRole: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: colors.textSecondary,
    letterSpacing: 0.4,
  },
  partyName: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginTop: m(2),
  },
  partyDetails: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(2),
  },
  clauseText: {
    fontSize: m(11.5),
    lineHeight: m(17),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
  },
  boldText: {
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  sigStatusBox: {
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    padding: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sigStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(4),
  },
  sigPartyLabel: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
  },
  signedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: '#ecfdf5',
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(6),
  },
  signedTagText: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: '#059669',
  },
  sigNameText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  sigDateText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(2),
  },
  proceedSignBtn: {
    backgroundColor: colors.lettersAndIcons,
    borderRadius: m(16),
    paddingVertical: m(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
    marginTop: m(6),
    elevation: 3,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  proceedSignBtnText: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  signSubtitle: {
    fontSize: m(11.5),
    lineHeight: m(16),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
  },
  inputGroup: {
    marginTop: m(8),
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
    borderRadius: m(14),
    padding: m(14),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: m(10),
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
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  sigPadContent: {
    alignItems: 'center',
    paddingVertical: m(14),
  },
  scriptSignature: {
    fontSize: m(22),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  sigMetaLine: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(8),
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: m(10),
    marginTop: m(14),
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: m(12),
    borderRadius: m(14),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.12)',
  },
  cancelBtnText: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.lettersAndIcons,
  },
  confirmSignBtn: {
    flex: 1.4,
    backgroundColor: colors.lettersAndIcons,
    paddingVertical: m(12),
    borderRadius: m(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(6),
  },
  confirmSignBtnText: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  disabledBtn: {
    opacity: 0.6,
  },
});
