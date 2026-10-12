import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { m } from 'walstar-rn-responsive';
import { FontFamily, colors } from '../../../constants';
import lenderFlowService from '../../../Services/lenderFlowService';

export default function DisbursalOtpModal({
  visible,
  onClose,
  entityId,
  isLoan = false,
  borrowerName = 'Borrower Entity',
  amount = 0,
  onVerifiedSuccess,
}) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [isSuccess, setIsSuccess] = useState(false);
  const [activatedLoan, setActivatedLoan] = useState(null);

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setOtp('');
      setError('');
      setIsSuccess(false);
      setActivatedLoan(null);
    }
  }, [visible]);

  const formatINR = (val) => {
    if (!val && val !== 0) return '₹0';
    return `₹${Number(val).toLocaleString('en-IN')}`;
  };

  const handleVerify = async () => {
    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await lenderFlowService.verifyDisbursalOtp(entityId, otp.trim(), isLoan);

      if (res?.success) {
        setIsSuccess(true);
        setActivatedLoan(res.loan || null);
        if (onVerifiedSuccess) {
          onVerifiedSuccess(res.loan);
        }
      } else {
        setError(res?.message || 'Invalid OTP code.');
      }
    } catch (err) {
      console.error('Error verifying disbursal OTP:', err);
      const msg = err.response?.data?.message || 'Verification failed. Please check the code.';
      setError(msg);
      setAttemptsLeft((prev) => Math.max(0, prev - 1));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;

    try {
      setResendLoading(true);
      setError('');
      const res = await lenderFlowService.resendDisbursalOtp(entityId, isLoan);
      if (res?.success) {
        setResendCooldown(30); // 30-sec cooldown
        setOtp('');
      } else {
        setError(res?.message || 'Failed to resend code.');
      }
    } catch (err) {
      console.error('Error resending disbursal OTP:', err);
      const msg = err.response?.data?.message || 'Unable to generate fresh OTP.';
      setError(msg);
    } finally {
      setResendLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.iconBadge}>
              <Feather name="shield" size={m(20)} color="#d97706" />
            </View>
            <View style={{ flex: 1, marginLeft: m(10) }}>
              <Text style={styles.modalTitle}>2-Way Disbursal Verification</Text>
              <Text style={styles.modalSubtitle}>Atomic Capital Release Protocol</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={m(20)} color="#64748b" />
            </TouchableOpacity>
          </View>

          {isSuccess ? (
            /* Success State */
            <View style={styles.successContainer}>
              <View style={styles.successIconCircle}>
                <Feather name="check-circle" size={m(48)} color="#16a34a" />
              </View>
              <Text style={styles.successTitle}>Facility Active & Disbursed! 🚀</Text>
              <Text style={styles.successDesc}>
                The borrower OTP has been authenticated. The loan contract is formally in effect, and the amortization schedule is active.
              </Text>

              <View style={styles.dealSummaryBox}>
                <View style={styles.dealRow}>
                  <Text style={styles.dealLabel}>Borrower</Text>
                  <Text style={styles.dealVal}>{borrowerName}</Text>
                </View>
                <View style={styles.dealRow}>
                  <Text style={styles.dealLabel}>Disbursed Capital</Text>
                  <Text style={styles.dealValBold}>{formatINR(amount)}</Text>
                </View>
                <View style={styles.dealRow}>
                  <Text style={styles.dealLabel}>Amortization</Text>
                  <Text style={styles.dealVal}>EMI Schedule Live</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
                <Text style={styles.doneBtnText}>Return to Deal Desk</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Input & Verification State */
            <View style={styles.formContainer}>
              {/* Deal Info Pill */}
              <View style={styles.infoBanner}>
                <View>
                  <Text style={styles.infoBorrower} numberOfLines={1}>
                    {borrowerName}
                  </Text>
                  <Text style={styles.infoAmount}>Sanctioned: {formatINR(amount)}</Text>
                </View>
                <View style={styles.verifiedTag}>
                  <Feather name="lock" size={m(10)} color="#2563eb" />
                  <Text style={styles.verifiedTagText}>Encrypted</Text>
                </View>
              </View>

              <Text style={styles.instructionText}>
                Ask the borrower for their <Text style={{ fontWeight: '800', color: '#0f172a' }}>6-Digit Disbursal OTP</Text> displayed on their dashboard. Entering this code atomically executes legal fund transfer.
              </Text>

              {/* OTP Input Field */}
              <TextInput
                style={styles.otpInput}
                placeholder="• • • • • •"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={(val) => {
                  setOtp(val.replace(/\D/g, ''));
                  if (error) setError('');
                }}
                autoFocus
              />

              {error ? (
                <View style={styles.errorBox}>
                  <Feather name="alert-circle" size={m(14)} color="#ef4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Text style={styles.metaNotice}>
                ⏱ Code valid for 15 minutes • {attemptsLeft} attempts remaining
              </Text>

              {/* Resend & Action Row */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[
                    styles.resendBtn,
                    (resendCooldown > 0 || resendLoading) && styles.resendBtnDisabled,
                  ]}
                  onPress={handleResend}
                  disabled={resendCooldown > 0 || resendLoading}
                >
                  {resendLoading ? (
                    <ActivityIndicator size="small" color="#2563eb" />
                  ) : (
                    <Text style={styles.resendBtnText}>
                      {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Code'}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.verifyBtn,
                    (loading || otp.length !== 6) && styles.verifyBtnDisabled,
                  ]}
                  onPress={handleVerify}
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.verifyBtnText}>Verify & Disburse</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    padding: m(16),
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: m(24),
    padding: m(20),
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(14),
  },
  iconBadge: {
    width: m(40),
    height: m(40),
    borderRadius: m(12),
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: m(16),
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: m(11),
    color: '#64748b',
    marginTop: m(1),
  },
  closeBtn: {
    width: m(32),
    height: m(32),
    borderRadius: m(16),
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContainer: {},
  infoBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: m(12),
    padding: m(12),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoBorrower: {
    fontSize: m(14),
    fontWeight: '800',
    color: '#1e40af',
  },
  infoAmount: {
    fontSize: m(12),
    fontWeight: '600',
    color: '#3b82f6',
    marginTop: m(2),
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(8),
  },
  verifiedTagText: {
    fontSize: m(10),
    fontWeight: '700',
    color: '#2563eb',
    marginLeft: m(4),
  },
  instructionText: {
    fontSize: m(12),
    color: '#475569',
    lineHeight: m(18),
    marginBottom: m(14),
  },
  otpInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderRadius: m(14),
    fontSize: m(24),
    fontWeight: '800',
    letterSpacing: 10,
    textAlign: 'center',
    paddingVertical: m(14),
    color: '#0f172a',
    marginBottom: m(10),
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: m(8),
    borderRadius: m(8),
    marginBottom: m(8),
  },
  errorText: {
    fontSize: m(11),
    color: '#dc2626',
    fontWeight: '600',
    marginLeft: m(6),
    flex: 1,
  },
  metaNotice: {
    fontSize: m(11),
    color: '#64748b',
    textAlign: 'center',
    marginBottom: m(16),
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resendBtn: {
    paddingVertical: m(12),
    paddingHorizontal: m(14),
    borderRadius: m(12),
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(10),
  },
  resendBtnDisabled: {
    opacity: 0.6,
  },
  resendBtnText: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#2563eb',
  },
  verifyBtn: {
    flex: 1,
    backgroundColor: '#d97706',
    borderRadius: m(12),
    paddingVertical: m(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyBtnDisabled: {
    opacity: 0.5,
  },
  verifyBtnText: {
    fontSize: m(13),
    fontWeight: '800',
    color: '#ffffff',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: m(10),
  },
  successIconCircle: {
    width: m(72),
    height: m(72),
    borderRadius: m(36),
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: m(14),
  },
  successTitle: {
    fontSize: m(18),
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  successDesc: {
    fontSize: m(12),
    color: '#64748b',
    textAlign: 'center',
    marginTop: m(6),
    lineHeight: m(18),
    paddingHorizontal: m(10),
  },
  dealSummaryBox: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: m(14),
    padding: m(14),
    marginVertical: m(16),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dealRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: m(4),
  },
  dealLabel: {
    fontSize: m(12),
    color: '#64748b',
  },
  dealVal: {
    fontSize: m(12),
    fontWeight: '600',
    color: '#0f172a',
  },
  dealValBold: {
    fontSize: m(13),
    fontWeight: '800',
    color: '#16a34a',
  },
  doneBtn: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: m(12),
    paddingVertical: m(14),
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: m(13),
    fontWeight: '700',
    color: '#ffffff',
  },
});
