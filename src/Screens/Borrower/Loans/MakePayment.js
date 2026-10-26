import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Platform,
  PermissionsAndroid,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors, FontFamily } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper } from '../../../Components/common';
import Toast from 'react-native-toast-message';
import borrowerLoanAPI from '../../../Services/borrowerLoanService';
import { useDispatch, useSelector } from 'react-redux';
import { getBorrowerLoans } from '../../../Redux/Slices/borrowerLoanSlice';
import { openRazorpayCheckoutForLoan } from '../../../Services/razorpayService';
import moment from 'moment';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

export default function MakePayment() {
  const navigation = useNavigation();
  const route = useRoute();
  const { loan } = route.params;
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);

  const [loading, setLoading] = useState(false);
  const [checkingPending, setCheckingPending] = useState(true);
  const [pendingPayment, setPendingPayment] = useState(null);
  const [paymentMode, setPaymentMode] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentProof, setPaymentProof] = useState(null);
  const [proofModalVisible, setProofModalVisible] = useState(false);
  const [confirmPaymentModalVisible, setConfirmPaymentModalVisible] = useState(false);

  const paymentModes = [
    {
      id: 'online',
      label: 'Digital Gateway (Razorpay)',
      icon: 'credit-card',
      description: 'Instant UPI, NetBanking, Debit/Credit Card with digital receipt',
    },
    {
      id: 'cash',
      label: 'Direct / Offline Payment',
      icon: 'dollar-sign',
      description: 'IMPS, NEFT, Cheque or Cash directly to lender with proof upload',
    },
  ];

  const paymentTypes = [
    {
      id: 'installment',
      label: 'Scheduled Installment',
      icon: 'calendar',
      description: 'Pay partial or upcoming monthly EMI amount',
    },
    {
      id: 'one-time',
      label: 'Full Balance Settlement',
      icon: 'check-circle',
      description: 'Pay off the complete outstanding balance and close facility',
    },
  ];

  useEffect(() => {
    checkForPendingPayment();
  }, []);

  useEffect(() => {
    if (paymentType === 'one-time') {
      setAmount(loan.remainingAmount?.toString() || '');
    }
  }, [paymentType, loan.remainingAmount]);

  const checkForPendingPayment = async () => {
    try {
      setCheckingPending(true);
      if (!loan?._id) return;
      const borrowerId = user?._id || loan.borrowerId || loan.borrower?._id;
      if (!borrowerId) return;

      const response = await borrowerLoanAPI.getPaymentHistory(loan._id, borrowerId);
      const data = response || {};
      const payments = data.payments || [];
      const pending = payments.find(
        p => p.paymentStatus?.toLowerCase() === 'pending'
      );
      if (pending) {
        setPendingPayment(pending);
      } else {
        setPendingPayment(null);
      }
    } catch (error) {
      console.error('Error checking for pending payment:', error);
      setPendingPayment(null);
    } finally {
      setCheckingPending(false);
    }
  };

  const validateForm = () => {
    if (pendingPayment) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Pending Payment Exists',
        text2: 'You have a pending payment awaiting lender confirmation.',
      });
      return false;
    }

    if (!paymentMode) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Payment Mode Required',
        text2: 'Please select Online Gateway or Direct Payment.',
      });
      return false;
    }

    if (!paymentType) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Payment Type Required',
        text2: 'Please select Installment or Full Settlement.',
      });
      return false;
    }

    if (!amount || amount.trim() === '') {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Amount Required',
        text2: 'Please enter the payment amount.',
      });
      return false;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Invalid Amount',
        text2: 'Please enter a valid amount greater than zero.',
      });
      return false;
    }

    const remainingAmount = loan.remainingAmount || 0;
    if (amountNum > remainingAmount) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Amount Exceeds Balance',
        text2: `Payment amount (₹${amountNum.toLocaleString('en-IN')}) cannot exceed remaining balance (₹${remainingAmount.toLocaleString('en-IN')}).`,
      });
      return false;
    }

    return true;
  };

  const handleSubmitPayment = async () => {
    if (!validateForm()) return;
    if (paymentMode === 'online') {
      await handleOnlinePayment();
      return;
    }
    setConfirmPaymentModalVisible(true);
  };

  const handleOnlinePayment = async () => {
    setLoading(true);
    try {
      const paymentAmount = parseFloat(amount);

      let orderResponse;
      try {
        orderResponse = await borrowerLoanAPI.createRazorpayOrder(loan._id, {
          paymentType: paymentType,
          amount: paymentAmount,
        });
      } catch (orderError) {
        setLoading(false);
        const orderErrorResponse = orderError.response?.data || {};
        const orderErrorMessage = orderErrorResponse.message || orderErrorResponse.error || orderError.message || '';
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Order Creation Failed',
          text2: orderErrorMessage || 'Failed to initialize payment gateway. Please try again.',
        });
        return;
      }

      if (!orderResponse || !orderResponse.success) {
        setLoading(false);
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Order Creation Failed',
          text2: orderResponse?.message || 'Failed to initialize payment order.',
        });
        return;
      }

      let paymentResult;
      try {
        paymentResult = await openRazorpayCheckoutForLoan(orderResponse, user, loan);
      } catch (razorpayError) {
        setLoading(false);
        if (razorpayError.type === 'USER_CANCELLED' || razorpayError.code === 2) {
          Toast.show({
            type: 'info',
            position: 'top',
            text1: 'Payment Cancelled',
            text2: 'Transaction was cancelled by user.',
          });
          return;
        }
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Payment Incomplete',
          text2: razorpayError.message || 'Payment failed during checkout.',
        });
        return;
      }

      if (!paymentResult.success) {
        setLoading(false);
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Payment Failed',
          text2: 'Payment could not be completed. Please try again.',
        });
        return;
      }

      if (
        !paymentResult.data.razorpay_payment_id ||
        !paymentResult.data.razorpay_order_id ||
        !paymentResult.data.razorpay_signature
      ) {
        throw new Error('Incomplete transaction payload from gateway');
      }

      let verifyResponse;
      try {
        verifyResponse = await borrowerLoanAPI.verifyRazorpayPayment(loan._id, {
          razorpay_payment_id: paymentResult.data.razorpay_payment_id,
          razorpay_order_id: paymentResult.data.razorpay_order_id,
          razorpay_signature: paymentResult.data.razorpay_signature,
          amount: paymentAmount,
          paymentMode: 'online',
          paymentType: paymentType,
          notes: notes.trim() || undefined,
        });
      } catch (verifyError) {
        setLoading(false);
        const verifyErrorResponse = verifyError.response?.data || {};
        const verifyErrorMessage = verifyErrorResponse.message || verifyErrorResponse.error || verifyError.message || '';
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Verification Error',
          text2: verifyErrorMessage || 'Payment captured but verification encountered an issue.',
        });
        return;
      }

      if (!verifyResponse || !verifyResponse.success) {
        setLoading(false);
        const errorMsg = verifyResponse?.message || verifyResponse?.error || 'Payment verification failed';
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Verification Failed',
          text2: errorMsg,
        });
        return;
      }

      setLoading(false);
      Toast.show({
        type: 'success',
        position: 'top',
        text1: 'Payment Successful',
        text2: verifyResponse.message || 'Payment posted successfully. Lender confirmation pending.',
      });

      if (user?._id) {
        await dispatch(getBorrowerLoans({ borrowerId: user._id })).unwrap();
      }

      navigation.setParams({
        loan: {
          ...loan,
          totalPaid: verifyResponse.data?.loanSummary?.currentPaidAmount ?? loan.totalPaid,
          remainingAmount: verifyResponse.data?.loanSummary?.currentRemainingAmount ?? loan.remainingAmount,
          paymentStatus: verifyResponse.data?.loanSummary?.loanStatus || loan.paymentStatus,
          updatedAt: new Date().toISOString(),
        },
      });

      navigation.goBack();
    } catch (error) {
      setLoading(false);
      console.error('Online payment error:', error);
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Payment Failed',
        text2: error.message || 'Payment processing error.',
      });
    }
  };

  const submitPayment = async () => {
    setLoading(true);
    try {
      if (!paymentMode || !paymentType || !amount) {
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Validation Error',
          text2: 'Mode, type, and amount are required.',
        });
        setLoading(false);
        return;
      }

      const paymentAmount = parseFloat(amount);
      const formData = new FormData();
      formData.append('paymentMode', paymentMode.trim());
      formData.append('paymentType', paymentType.trim());
      formData.append('amount', paymentAmount);

      if (transactionId && transactionId.trim()) {
        formData.append('transactionId', transactionId.trim());
      }
      if (notes && notes.trim()) {
        formData.append('notes', notes.trim());
      }
      if (paymentProof) {
        formData.append('paymentProof', {
          uri: paymentProof.uri,
          type: paymentProof.type,
          name: paymentProof.fileName,
        });
      }

      const response = await borrowerLoanAPI.makePayment(loan._id, formData);

      Toast.show({
        type: 'success',
        position: 'top',
        text1: 'Payment Recorded',
        text2: response.message || 'Payment submitted successfully. Awaiting lender verification.',
      });

      if (user?._id) {
        await dispatch(getBorrowerLoans({ borrowerId: user._id })).unwrap();
      }

      navigation.setParams({
        loan: {
          ...loan,
          totalPaid: response.data?.totalPaid || loan.totalPaid,
          remainingAmount: response.data?.remainingAmount || loan.remainingAmount,
          paymentStatus: response.data?.paymentStatus || loan.paymentStatus,
          updatedAt: new Date().toISOString(),
        },
      });

      navigation.goBack();
    } catch (error) {
      console.error('Payment submission error:', error);
      const errorResponse = error.response?.data || {};
      const errorMessage = errorResponse.message || error.message || 'Payment submission failed.';
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Submission Error',
        text2: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const requestCameraPermission = async () => {
    if (Platform.OS !== 'android') return true;
    try {
      const checkResult = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
      if (checkResult) return true;

      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
        title: 'Camera Permission Required',
        message: 'FinWise requires camera access to attach proof of transaction.',
        buttonPositive: 'Allow',
        buttonNegative: 'Cancel',
      });
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Camera permission error:', err);
      return false;
    }
  };

  const handleProofSelected = asset => {
    setPaymentProof({
      uri: asset.uri,
      type: asset.type || 'image/jpeg',
      fileName: asset.fileName || `proof_${Date.now()}.jpg`,
    });
    setProofModalVisible(false);
    Toast.show({
      type: 'success',
      position: 'top',
      text1: 'Receipt Attached',
      text2: 'Payment proof voucher selected.',
    });
  };

  const openCamera = async () => {
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return;

      launchCamera(
        { mediaType: 'photo', quality: 0.8, saveToPhotos: true },
        response => {
          if (response.didCancel) return;
          if (response.assets && response.assets[0]) {
            handleProofSelected(response.assets[0]);
          }
        }
      );
    } catch (error) {
      console.error('Camera error:', error);
    }
  };

  const openGallery = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, response => {
      if (response.didCancel) return;
      if (response.assets && response.assets[0]) {
        handleProofSelected(response.assets[0]);
      }
    });
  };

  const formatCurrency = value => {
    return `₹${Number(value || 0).toLocaleString('en-IN')}`;
  };

  const handleAmountChange = text => {
    const numericValue = text.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    let filteredValue = parts[0];
    if (parts.length > 1) {
      filteredValue = parts[0] + '.' + parts.slice(1).join('').substring(0, 2);
    }
    setAmount(filteredValue);
  };

  return (
    <ScreenWrapper
      backgroundColor={colors.backgroundGreenWhite}
      topInsetBg={colors.primary}
      statusBarColor={colors.primary}
      statusBarStyle="dark-content"
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
            <Text style={styles.headerTag}>REPAYMENT PORTAL</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Post Facility Repayment
            </Text>
          </View>

          <View style={{ width: m(38) }} />
        </View>
      </View>

      {/* Main Curved Body Section */}
      <View style={styles.sheetSection}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Facility Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryCardHeader}>
              <View>
                <Text style={styles.summaryTitle}>
                  {loan.purpose || loan.dealName || 'Commercial Facility'}
                </Text>
                <Text style={styles.summarySub}>
                  Account: #{loan.loanNumber || loan._id?.slice(-8).toUpperCase()}
                </Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>ACTIVE FACILITY</Text>
              </View>
            </View>

            {/* Neutral slate-50 telemetry strip (No Green Overload) */}
            <View style={styles.metricsBox}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Total Sanctioned</Text>
                <Text style={styles.metricValue}>{formatCurrency(loan.amount)}</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Total Repaid</Text>
                <Text style={[styles.metricValue, { color: '#059669' }]}>
                  {formatCurrency(loan.totalPaid)}
                </Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Outstanding</Text>
                <Text style={[styles.metricValue, { color: '#DC2626' }]}>
                  {formatCurrency(loan.remainingAmount)}
                </Text>
              </View>
            </View>
          </View>

          {/* Pending Payment Warning */}
          {checkingPending ? (
            <View style={styles.pendingCheckCard}>
              <ActivityIndicator size="small" color="#D97706" />
              <Text style={styles.pendingCheckText}>Syncing ledger payment status...</Text>
            </View>
          ) : pendingPayment ? (
            <View style={styles.pendingPaymentCard}>
              <View style={styles.pendingPaymentHeader}>
                <View style={styles.pendingIconWrap}>
                  <Feather name="clock" size={m(18)} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pendingPaymentTitle}>Payment Verification In Progress</Text>
                  <Text style={styles.pendingPaymentSubtitle}>
                    Awaiting lender confirmation before accepting subsequent installments.
                  </Text>
                </View>
              </View>

              <View style={styles.pendingMetricsStrip}>
                <View style={styles.pendingDetailRow}>
                  <Text style={styles.pendingDetailLabel}>Submitted Amount</Text>
                  <Text style={styles.pendingDetailValue}>
                    {formatCurrency(pendingPayment.amount)}
                  </Text>
                </View>
                <View style={styles.pendingDetailRow}>
                  <Text style={styles.pendingDetailLabel}>Payment Mode</Text>
                  <Text style={styles.pendingDetailValue}>
                    {pendingPayment.paymentMode?.toUpperCase() || 'ONLINE'}
                  </Text>
                </View>
                {pendingPayment.paymentDate && (
                  <View style={styles.pendingDetailRow}>
                    <Text style={styles.pendingDetailLabel}>Timestamp</Text>
                    <Text style={styles.pendingDetailValue}>
                      {moment(pendingPayment.paymentDate).format('DD MMM YYYY, hh:mm A')}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ) : null}

          {/* Payment Mode Selection */}
          <View style={[styles.sectionCard, pendingPayment && styles.disabledSection]}>
            <Text style={styles.sectionTitle}>Select Repayment Rail</Text>
            <Text style={styles.sectionSubtitle}>Choose your preferred settlement channel</Text>

            <View style={styles.optionsList}>
              {paymentModes.map(mode => {
                const isSelected = paymentMode === mode.id;
                return (
                  <TouchableOpacity
                    key={mode.id}
                    style={[
                      styles.optionCard,
                      isSelected && styles.selectedOptionCard,
                    ]}
                    onPress={() => !pendingPayment && setPaymentMode(mode.id)}
                    disabled={Boolean(pendingPayment)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.optionIconWrap, isSelected && styles.selectedIconWrap]}>
                      <Feather
                        name={mode.icon}
                        size={m(18)}
                        color={isSelected ? colors.primary : colors.lettersAndIcons}
                      />
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={[styles.optionTitle, isSelected && styles.selectedOptionTitle]}>
                        {mode.label}
                      </Text>
                      <Text style={styles.optionDescription}>{mode.description}</Text>
                    </View>
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                      {isSelected && <View style={styles.radioInnerDot} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Payment Type Selection */}
          <View style={[styles.sectionCard, pendingPayment && styles.disabledSection]}>
            <Text style={styles.sectionTitle}>Repayment Structure</Text>
            <Text style={styles.sectionSubtitle}>Specify installment vs complete closure</Text>

            <View style={styles.optionsList}>
              {paymentTypes.map(type => {
                const isSelected = paymentType === type.id;
                return (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.optionCard,
                      isSelected && styles.selectedOptionCard,
                    ]}
                    onPress={() => !pendingPayment && setPaymentType(type.id)}
                    disabled={Boolean(pendingPayment)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.optionIconWrap, isSelected && styles.selectedIconWrap]}>
                      <Feather
                        name={type.icon}
                        size={m(18)}
                        color={isSelected ? colors.primary : colors.lettersAndIcons}
                      />
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={[styles.optionTitle, isSelected && styles.selectedOptionTitle]}>
                        {type.label}
                      </Text>
                      <Text style={styles.optionDescription}>{type.description}</Text>
                    </View>
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                      {isSelected && <View style={styles.radioInnerDot} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Amount Input */}
          <View style={[styles.sectionCard, pendingPayment && styles.disabledSection]}>
            <Text style={styles.sectionTitle}>Repayment Amount</Text>
            <Text style={styles.sectionSubtitle}>
              {paymentType === 'one-time'
                ? 'Full outstanding balance automatically calculated'
                : 'Enter principal and interest amount to post'}
            </Text>

            <View style={styles.amountInputContainer}>
              <Text style={styles.amountPrefix}>₹</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                keyboardType="numeric"
                value={amount}
                onChangeText={handleAmountChange}
                editable={!pendingPayment && paymentType !== 'one-time'}
                placeholderTextColor="#94A3B8"
              />
              {paymentType === 'one-time' && (
                <View style={styles.lockedPill}>
                  <Text style={styles.lockedPillText}>FULL BALANCE</Text>
                </View>
              )}
            </View>

            {paymentType === 'one-time' && (
              <Text style={styles.helperText}>
                All principal, interest, and covenants will be marked as settled upon confirmation.
              </Text>
            )}
          </View>

          {/* Online Gateway Info Banner */}
          {paymentMode === 'online' && (
            <View style={styles.gatewayNoticeCard}>
              <Feather name="shield" size={m(18)} color="#0284C7" />
              <View style={{ flex: 1 }}>
                <Text style={styles.gatewayNoticeTitle}>RBI-Compliant Encrypted Gateway</Text>
                <Text style={styles.gatewayNoticeText}>
                  Your payment will be processed securely via 256-bit TLS encrypted Razorpay checkout. Transaction receipt will be instantly archived.
                </Text>
              </View>
            </View>
          )}

          {/* Offline Transaction Reference & Proof (Only for Direct/Cash) */}
          {paymentMode === 'cash' && (
            <View style={[styles.sectionCard, pendingPayment && styles.disabledSection]}>
              <Text style={styles.sectionTitle}>Transaction Reference & Proof</Text>
              <Text style={styles.sectionSubtitle}>
                Attach UTR / Cheque No. and image voucher for lender audit
              </Text>

              <View style={styles.inputFieldWrap}>
                <Text style={styles.fieldLabel}>UTR / REFERENCE NO. (OPTIONAL)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. UTR19827364819"
                  placeholderTextColor="#94A3B8"
                  value={transactionId}
                  onChangeText={setTransactionId}
                  editable={!pendingPayment}
                />
              </View>

              <TouchableOpacity
                style={[styles.uploadBox, pendingPayment && styles.disabledUpload]}
                onPress={selectImage}
                disabled={Boolean(pendingPayment)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="cloud-upload-outline"
                  size={m(24)}
                  color={pendingPayment ? '#94A3B8' : colors.lettersAndIcons}
                />
                <Text style={styles.uploadBoxText}>
                  {paymentProof ? 'Change Voucher Image' : 'Upload Bank Slip / Receipt Image'}
                </Text>
                <Text style={styles.uploadBoxSub}>Supports JPG, PNG up to 10MB</Text>
              </TouchableOpacity>

              {paymentProof && (
                <View style={styles.proofPreviewWrap}>
                  <Image source={{ uri: paymentProof.uri }} style={styles.proofImage} />
                  <View style={styles.proofInfoRow}>
                    <Text style={styles.proofFileName} numberOfLines={1}>
                      {paymentProof.fileName}
                    </Text>
                    <TouchableOpacity
                      style={styles.removeProofBtn}
                      onPress={() => setPaymentProof(null)}
                      disabled={Boolean(pendingPayment)}
                    >
                      <Feather name="trash-2" size={m(14)} color="#EF4444" />
                      <Text style={styles.removeProofText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Notes */}
          <View style={[styles.sectionCard, pendingPayment && styles.disabledSection]}>
            <Text style={styles.sectionTitle}>Notes for Portfolio Manager</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add payment remarks or repayment breakdown notes..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
              editable={!pendingPayment}
            />
          </View>

          {/* Submit Action Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (loading || pendingPayment || checkingPending) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitPayment}
            disabled={loading || Boolean(pendingPayment) || checkingPending}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <Feather
                  name={paymentMode === 'online' ? 'credit-card' : 'send'}
                  size={m(18)}
                  color={colors.white}
                />
                <Text style={styles.submitButtonText}>
                  {pendingPayment
                    ? 'Payment In Verification'
                    : paymentMode === 'online'
                    ? `Pay ₹${amount || '0'} via Gateway`
                    : 'Submit Repayment for Confirmation'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: m(40) }} />
        </ScrollView>
      </View>

      {/* Proof Source Picker Modal */}
      <Modal
        visible={proofModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProofModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Voucher Source</Text>
            <Text style={styles.modalSubtitle}>
              Take a photo of payment slip or pick from gallery
            </Text>

            <View style={styles.modalOptionGrid}>
              <TouchableOpacity
                style={styles.modalOptionTile}
                onPress={openCamera}
                activeOpacity={0.85}
              >
                <View style={styles.modalOptionIconCircle}>
                  <Ionicons name="camera" size={m(22)} color={colors.lettersAndIcons} />
                </View>
                <Text style={styles.modalOptionTileText}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalOptionTile}
                onPress={openGallery}
                activeOpacity={0.85}
              >
                <View style={styles.modalOptionIconCircle}>
                  <Ionicons name="image" size={m(22)} color={colors.lettersAndIcons} />
                </View>
                <Text style={styles.modalOptionTileText}>Gallery</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setProofModalVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Confirm Repayment Modal */}
      <Modal
        visible={confirmPaymentModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.confirmHeaderRow}>
              <View style={styles.confirmIconWrap}>
                <Feather name="alert-circle" size={m(22)} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Confirm Repayment</Text>
                <Text style={styles.modalSubtitle}>Post repayment to facility ledger</Text>
              </View>
            </View>

            {/* Neutral Slate-50 Summary Box */}
            <View style={styles.confirmSummaryBox}>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Payment Amount</Text>
                <Text style={styles.confirmValue}>₹{Number(amount || 0).toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Channel</Text>
                <Text style={styles.confirmValue}>Direct / Offline</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Structure</Text>
                <Text style={styles.confirmValue}>
                  {paymentType === 'one-time' ? 'Full Settlement' : 'Installment'}
                </Text>
              </View>
              {transactionId ? (
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Reference UTR</Text>
                  <Text style={styles.confirmValue}>{transactionId}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.confirmActionsRow}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setConfirmPaymentModalVisible(false)}
                activeOpacity={0.85}
                disabled={loading}
              >
                <Text style={styles.confirmCancelBtnText}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmSubmitBtn, loading && styles.submitButtonDisabled]}
                onPress={() => {
                  setConfirmPaymentModalVisible(false);
                  submitPayment();
                }}
                activeOpacity={0.85}
                disabled={loading}
              >
                <Text style={styles.confirmSubmitBtnText}>Confirm & Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  topBanner: {
    backgroundColor: colors.primary,
    paddingHorizontal: m(16),
    paddingTop: m(8),
    paddingBottom: m(22),
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
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: m(12),
  },
  headerTag: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: m(18),
    fontFamily: FontFamily.primaryExtraBold,
    color: colors.lettersAndIcons,
  },
  sheetSection: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(26),
    borderTopRightRadius: m(26),
    marginTop: -m(12),
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: m(16),
    paddingBottom: m(60),
  },

  // Facility Summary Card
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: m(18),
    padding: m(16),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: m(14),
  },
  summaryTitle: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  summarySub: {
    fontSize: m(11),
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
    marginTop: m(2),
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(6),
  },
  statusBadgeText: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: '#166534',
    letterSpacing: 0.5,
  },

  // Strict Neutral slate-50 telemetry strip (No Green Overload)
  metricsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: m(12),
    paddingHorizontal: m(8),
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: m(10),
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
    marginBottom: m(3),
  },
  metricValue: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryExtraBold,
    color: colors.lettersAndIcons,
  },
  metricDivider: {
    width: 1,
    height: m(28),
    backgroundColor: '#E2E8F0',
  },

  // Pending Payment
  pendingCheckCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: m(14),
    padding: m(12),
    marginBottom: m(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(10),
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingCheckText: {
    fontSize: m(12),
    fontFamily: FontFamily.bodyMedium,
    color: '#92400E',
  },
  pendingPaymentCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: m(16),
    padding: m(16),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  pendingPaymentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: m(12),
    marginBottom: m(12),
  },
  pendingIconWrap: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingPaymentTitle: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: '#92400E',
  },
  pendingPaymentSubtitle: {
    fontSize: m(11),
    fontFamily: FontFamily.bodyRegular,
    color: '#B45309',
    marginTop: m(2),
  },
  pendingMetricsStrip: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(12),
    padding: m(12),
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: m(8),
  },
  pendingDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pendingDetailLabel: {
    fontSize: m(12),
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
  },
  pendingDetailValue: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  // Sections
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: m(18),
    padding: m(16),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  disabledSection: {
    opacity: 0.6,
  },
  sectionTitle: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(2),
  },
  sectionSubtitle: {
    fontSize: m(12),
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
    marginBottom: m(14),
  },

  // Options
  optionsList: {
    gap: m(10),
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: m(12),
    borderRadius: m(14),
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  selectedOptionCard: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.lettersAndIcons,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  optionIconWrap: {
    width: m(38),
    height: m(38),
    borderRadius: m(12),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(12),
  },
  selectedIconWrap: {
    backgroundColor: colors.lettersAndIcons,
    borderColor: colors.lettersAndIcons,
  },
  optionContent: {
    flex: 1,
    marginRight: m(8),
  },
  optionTitle: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  selectedOptionTitle: {
    color: colors.lettersAndIcons,
  },
  optionDescription: {
    fontSize: m(11),
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
    marginTop: m(2),
  },
  radioCircle: {
    width: m(20),
    height: m(20),
    borderRadius: m(10),
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: colors.lettersAndIcons,
  },
  radioInnerDot: {
    width: m(10),
    height: m(10),
    borderRadius: m(5),
    backgroundColor: colors.lettersAndIcons,
  },

  // Amount Input
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: m(14),
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: m(14),
    height: m(56),
  },
  amountPrefix: {
    fontSize: m(20),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginRight: m(6),
  },
  amountInput: {
    flex: 1,
    fontSize: m(20),
    fontFamily: FontFamily.primaryExtraBold,
    color: colors.lettersAndIcons,
    padding: 0,
  },
  lockedPill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(6),
  },
  lockedPillText: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: '#475569',
    letterSpacing: 0.5,
  },
  helperText: {
    fontSize: m(11),
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
    marginTop: m(8),
    lineHeight: m(16),
  },

  // Gateway Notice
  gatewayNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    borderRadius: m(14),
    padding: m(14),
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: m(14),
    gap: m(12),
  },
  gatewayNoticeTitle: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: '#0369A1',
    marginBottom: m(2),
  },
  gatewayNoticeText: {
    fontSize: m(11),
    fontFamily: FontFamily.bodyRegular,
    color: '#0284C7',
    lineHeight: m(16),
  },

  // Offline Inputs
  inputFieldWrap: {
    marginBottom: m(12),
  },
  fieldLabel: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: m(6),
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: m(12),
    paddingVertical: m(10),
    fontSize: m(14),
    fontFamily: FontFamily.bodyRegular,
    color: colors.lettersAndIcons,
  },
  uploadBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(20),
    paddingHorizontal: m(14),
    borderRadius: m(14),
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    gap: m(6),
  },
  disabledUpload: {
    opacity: 0.5,
  },
  uploadBoxText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  uploadBoxSub: {
    fontSize: m(11),
    fontFamily: FontFamily.bodyRegular,
    color: '#94A3B8',
  },
  proofPreviewWrap: {
    marginTop: m(12),
    borderRadius: m(12),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  proofImage: {
    width: '100%',
    height: m(140),
  },
  proofInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: m(10),
  },
  proofFileName: {
    flex: 1,
    fontSize: m(12),
    fontFamily: FontFamily.bodyRegular,
    color: colors.lettersAndIcons,
    marginRight: m(8),
  },
  removeProofBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
  },
  removeProofText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: '#EF4444',
  },

  // Notes
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: m(12),
    fontSize: m(13),
    fontFamily: FontFamily.bodyRegular,
    color: colors.lettersAndIcons,
    textAlignVertical: 'top',
    minHeight: m(70),
  },

  // Action Button
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lettersAndIcons,
    borderRadius: m(16),
    paddingVertical: m(15),
    paddingHorizontal: m(18),
    gap: m(10),
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: m(20),
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: m(22),
    padding: m(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: m(18),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  modalSubtitle: {
    fontSize: m(12),
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
    marginTop: m(3),
    marginBottom: m(16),
  },
  modalOptionGrid: {
    flexDirection: 'row',
    gap: m(12),
    marginBottom: m(16),
  },
  modalOptionTile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(18),
    borderRadius: m(14),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: m(8),
  },
  modalOptionIconCircle: {
    width: m(42),
    height: m(42),
    borderRadius: m(21),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOptionTileText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  modalCancelBtn: {
    paddingVertical: m(12),
    borderRadius: m(12),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: '#475569',
  },

  // Confirm Modal
  confirmHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(12),
    marginBottom: m(14),
  },
  confirmIconWrap: {
    width: m(42),
    height: m(42),
    borderRadius: m(21),
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: m(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: m(14),
    gap: m(10),
    marginBottom: m(18),
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confirmLabel: {
    fontSize: m(12),
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
  },
  confirmValue: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    gap: m(12),
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: m(13),
    borderRadius: m(12),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelBtnText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: '#475569',
  },
  confirmSubmitBtn: {
    flex: 1.3,
    paddingVertical: m(13),
    borderRadius: m(12),
    backgroundColor: colors.lettersAndIcons,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmSubmitBtnText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
});
