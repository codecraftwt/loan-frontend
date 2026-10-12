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
import { m } from 'walstar-rn-responsive';
import { colors } from '../../../constants';
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
          [{ text: 'View Disbursal OTP', onPress: () => {
            onClose();
            if (onSignedSuccess) onSignedSuccess();
          }}]
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
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Feather name="x" size={m(22)} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.titleBox}>
            <Text style={styles.topBarTitle}>Master Commercial Facility Agreement</Text>
            <Text style={styles.docIdText}>Doc ID: {docId}</Text>
          </View>
          <View style={{ width: m(22) }} />
        </View>

        {signingStep === 'review' ? (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Agreement Notice Banner */}
            <View style={styles.noticeBanner}>
              <Feather name="shield" size={m(16)} color="#2563EB" />
              <Text style={styles.noticeText}>
                Digitally legally binding credit contract governed by the Indian Contract Act, 1872 & IT Act, 2000.
              </Text>
            </View>

            {/* Key Sanctioned Financial Terms */}
            <View style={styles.card}>
              <Text style={styles.cardHeaderTitle}>Schedule A: Facility Covenants</Text>

              <View style={styles.termRow}>
                <Text style={styles.termLabel}>Sanctioned Facility Amount:</Text>
                <Text style={styles.termValueBold}>{formatINR(terms.amount)}</Text>
              </View>

              <View style={styles.termRow}>
                <Text style={styles.termLabel}>Annual Interest Rate:</Text>
                <Text style={styles.termValue}>{terms.interestRate}% p.a.</Text>
              </View>

              <View style={styles.termRow}>
                <Text style={styles.termLabel}>Facility Tenure:</Text>
                <Text style={styles.termValue}>{terms.tenureMonths} Months</Text>
              </View>

              <View style={styles.termRow}>
                <Text style={styles.termLabel}>Repayment Mode:</Text>
                <Text style={styles.termValue}>{terms.repaymentType === 'ONE_TIME' ? 'Bullet Repayment' : 'Monthly Amortizing EMI'}</Text>
              </View>

              <View style={styles.termRow}>
                <Text style={styles.termLabel}>Pledged Collateral / Security:</Text>
                <Text style={styles.termValue}>{application.pledgedSecurity || 'Commercial hypothecation / Unsecured'}</Text>
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
                3. <Text style={styles.boldText}>Prepayment & Charges:</Text> Foreclosure and partial prepayment will adhere to the agreed master terms.
              </Text>
            </View>

            {/* Existing Signatures Status */}
            <View style={styles.card}>
              <Text style={styles.cardHeaderTitle}>Signatures & Execution</Text>

              {/* Lender Signature */}
              <View style={styles.sigStatusBox}>
                <View style={styles.sigStatusHeader}>
                  <Text style={styles.sigPartyLabel}>Lender Representative</Text>
                  <View style={styles.signedTag}>
                    <Feather name="check-circle" size={m(12)} color="#16A34A" />
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
                      <Feather name="check-circle" size={m(12)} color="#16A34A" />
                      <Text style={styles.signedTagText}>Countersigned</Text>
                    </View>
                  ) : (
                    <View style={[styles.signedTag, { backgroundColor: '#FEF3C7' }]}>
                      <Feather name="clock" size={m(12)} color="#D97706" />
                      <Text style={[styles.signedTagText, { color: '#D97706' }]}>Pending Signature</Text>
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
          <ScrollView contentContainerStyle={styles.scrollContent}>
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
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Digital Signature Simulated Pad */}
              <View style={styles.sigPadBox}>
                <View style={styles.sigPadHeader}>
                  <Text style={styles.sigPadTitle}>ELECTRONIC SIGNATURE PREVIEW</Text>
                  <Feather name="check" size={m(14)} color="#16A34A" />
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
                  onPress={() => setSigningStep('review')}
                >
                  <Text style={styles.cancelBtnText}>Back to Review</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmSignBtn, signing && styles.disabledBtn]}
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
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: m(16),
    paddingVertical: m(14),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  closeBtn: {
    padding: m(4),
  },
  titleBox: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: m(10),
  },
  topBarTitle: {
    fontSize: m(14),
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  docIdText: {
    fontSize: m(10),
    color: '#64748B',
    marginTop: m(2),
    fontFamily: 'monospace',
  },
  scrollContent: {
    padding: m(16),
    gap: m(14),
    paddingBottom: m(60),
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(10),
    backgroundColor: '#EFF6FF',
    padding: m(12),
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  noticeText: {
    flex: 1,
    fontSize: m(11),
    color: '#1E40AF',
    lineHeight: m(16),
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: m(10),
  },
  cardHeaderTitle: {
    fontSize: m(14),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: m(4),
  },
  termRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: m(3),
  },
  termLabel: {
    fontSize: m(12),
    color: '#64748B',
  },
  termValue: {
    fontSize: m(12),
    fontWeight: '600',
    color: '#0F172A',
  },
  termValueBold: {
    fontSize: m(14),
    fontWeight: '800',
    color: '#2563EB',
  },
  partyBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: m(10),
    padding: m(12),
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  partyRole: {
    fontSize: m(10),
    textTransform: 'uppercase',
    fontWeight: '700',
    color: '#64748B',
  },
  partyName: {
    fontSize: m(13),
    fontWeight: '700',
    color: '#0F172A',
    marginTop: m(2),
  },
  partyDetails: {
    fontSize: m(11),
    color: '#94A3B8',
    marginTop: m(2),
  },
  clauseText: {
    fontSize: m(11),
    color: '#475569',
    lineHeight: m(17),
  },
  boldText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  sigStatusBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: m(10),
    padding: m(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sigStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sigPartyLabel: {
    fontSize: m(11),
    fontWeight: '600',
    color: '#64748B',
  },
  signedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: '#DCFCE7',
    paddingHorizontal: m(6),
    paddingVertical: m(2),
    borderRadius: m(6),
  },
  signedTagText: {
    fontSize: m(10),
    fontWeight: '700',
    color: '#16A34A',
  },
  sigNameText: {
    fontSize: m(13),
    fontWeight: '700',
    color: '#0F172A',
    marginTop: m(4),
  },
  sigDateText: {
    fontSize: m(10),
    color: '#94A3B8',
    marginTop: m(2),
  },
  proceedSignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
    backgroundColor: '#2563EB',
    paddingVertical: m(14),
    borderRadius: m(14),
    marginTop: m(6),
  },
  proceedSignBtnText: {
    fontSize: m(14),
    fontWeight: '700',
    color: colors.white,
  },
  signSubtitle: {
    fontSize: m(12),
    color: '#64748B',
    lineHeight: m(17),
    marginBottom: m(8),
  },
  inputGroup: {
    gap: m(6),
  },
  label: {
    fontSize: m(12),
    fontWeight: '600',
    color: '#334155',
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
  sigPadBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: m(12),
    padding: m(14),
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginTop: m(8),
  },
  sigPadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sigPadTitle: {
    fontSize: m(9),
    fontWeight: '700',
    color: '#64748B',
  },
  sigPadContent: {
    alignItems: 'center',
    paddingVertical: m(20),
  },
  scriptSignature: {
    fontSize: m(24),
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#1E3A8A',
  },
  sigMetaLine: {
    fontSize: m(9),
    color: '#94A3B8',
    marginTop: m(8),
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: m(10),
    marginTop: m(10),
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: m(12),
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: m(13),
    fontWeight: '600',
    color: '#475569',
  },
  confirmSignBtn: {
    flex: 1.5,
    flexDirection: 'row',
    backgroundColor: '#16A34A',
    borderRadius: m(12),
    paddingVertical: m(12),
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(6),
  },
  disabledBtn: {
    opacity: 0.6,
  },
  confirmSignBtnText: {
    fontSize: m(13),
    fontWeight: '700',
    color: colors.white,
  },
});
