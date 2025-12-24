import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import Toast from 'react-native-toast-message';
import axiosInstance from '../../../Utils/AxiosInstance';

export default function MakePayment() {
  const navigation = useNavigation();
  const route = useRoute();
  const { loan } = route.params;

  const [loading, setLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentProof, setPaymentProof] = useState(null);

  const paymentModes = [
    { id: 'cash', label: 'Cash', icon: 'cash', description: 'Pay directly to lender' },
    { id: 'online', label: 'Online', icon: 'credit-card', description: 'Bank transfer, UPI, etc.' },
  ];

  const paymentTypes = [
    { id: 'one-time', label: 'One-time Payment', icon: 'check-circle', description: 'Pay full remaining amount' },
    { id: 'installment', label: 'Installment', icon: 'calendar', description: 'Pay partial amount' },
  ];

  useEffect(() => {
    // If one-time payment is selected, set amount to remaining amount
    if (paymentType === 'one-time') {
      setAmount(loan.remainingAmount?.toString() || '');
    }
  }, [paymentType]);

  const validateForm = () => {
    if (!paymentMode) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: 'Please select payment mode',
      });
      return false;
    }

    if (!paymentType) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: 'Please select payment type',
      });
      return false;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: 'Please enter valid amount',
      });
      return false;
    }

    const amountNum = parseFloat(amount);
    const remainingAmount = loan.remainingAmount || 0;

    if (amountNum > remainingAmount) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: 'Amount cannot exceed remaining balance',
      });
      return false;
    }

    if (paymentMode === 'online' && !transactionId.trim()) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: 'Transaction ID is required for online payments',
      });
      return false;
    }

    return true;
  };

  const handleSubmitPayment = async () => {
    if (!validateForm()) return;

    Alert.alert(
      'Confirm Payment',
      `Are you sure you want to submit this payment?\n\nAmount: ₹${amount}\nMode: ${paymentMode}\nType: ${paymentType}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: submitPayment },
      ]
    );
  };

  const submitPayment = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('paymentMode', paymentMode);
      formData.append('paymentType', paymentType);
      formData.append('amount', parseFloat(amount));
      if (transactionId.trim()) {
        formData.append('transactionId', transactionId.trim());
      }
      if (notes.trim()) {
        formData.append('notes', notes.trim());
      }
      if (paymentProof) {
        formData.append('paymentProof', {
          uri: paymentProof.uri,
          type: paymentProof.type,
          name: paymentProof.fileName,
        });
      }

      const response = await axiosInstance.post(
        `/borrower/loans/payment/${loan._id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      Toast.show({
        type: 'success',
        position: 'top',
        text1: 'Success',
        text2: response.data.message || 'Payment submitted successfully',
      });

      // Navigate back to loan details
      navigation.goBack();
    } catch (error) {
      console.error('Payment submission error:', error);
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to submit payment',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectImage = () => {
    // For now, we'll use a placeholder - in real implementation,
    // you'd use react-native-image-picker or similar
    Alert.alert(
      'Upload Payment Proof',
      'This feature requires image picker implementation',
      [{ text: 'OK' }]
    );
  };

  const formatCurrency = (value) => {
    return `₹${value?.toLocaleString('en-IN') || 0}`;
  };

  const renderPaymentModeCard = (mode) => (
    <TouchableOpacity
      key={mode.id}
      style={[
        styles.optionCard,
        paymentMode === mode.id && styles.selectedOptionCard,
      ]}
      onPress={() => setPaymentMode(mode.id)}
    >
      <View style={styles.optionIcon}>
        <Icon name={mode.icon} size={24} color={paymentMode === mode.id ? '#FFFFFF' : '#3B82F6'} />
      </View>
      <View style={styles.optionContent}>
        <Text style={[
          styles.optionTitle,
          paymentMode === mode.id && styles.selectedText
        ]}>
          {mode.label}
        </Text>
        <Text style={[
          styles.optionDescription,
          paymentMode === mode.id && styles.selectedText
        ]}>
          {mode.description}
        </Text>
      </View>
      {paymentMode === mode.id && (
        <View style={styles.checkmark}>
          <Icon name="check" size={16} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderPaymentTypeCard = (type) => (
    <TouchableOpacity
      key={type.id}
      style={[
        styles.optionCard,
        paymentType === type.id && styles.selectedOptionCard,
      ]}
      onPress={() => setPaymentType(type.id)}
    >
      <View style={styles.optionIcon}>
        <Icon name={type.icon} size={24} color={paymentType === type.id ? '#FFFFFF' : '#10B981'} />
      </View>
      <View style={styles.optionContent}>
        <Text style={[
          styles.optionTitle,
          paymentType === type.id && styles.selectedText
        ]}>
          {type.label}
        </Text>
        <Text style={[
          styles.optionDescription,
          paymentType === type.id && styles.selectedText
        ]}>
          {type.description}
        </Text>
      </View>
      {paymentType === type.id && (
        <View style={styles.checkmark}>
          <Icon name="check" size={16} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title="Make Payment" showBackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Loan Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Loan Summary</Text>
          <View style={styles.summaryDetails}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Amount</Text>
              <Text style={styles.summaryValue}>{formatCurrency(loan.amount)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Paid</Text>
              <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                {formatCurrency(loan.totalPaid)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Remaining</Text>
              <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
                {formatCurrency(loan.remainingAmount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Mode Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Mode</Text>
          <Text style={styles.sectionSubtitle}>Choose how you want to make the payment</Text>
          <View style={styles.optionsGrid}>
            {paymentModes.map(renderPaymentModeCard)}
          </View>
        </View>

        {/* Payment Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Type</Text>
          <Text style={styles.sectionSubtitle}>Select payment structure</Text>
          <View style={styles.optionsGrid}>
            {paymentTypes.map(renderPaymentTypeCard)}
          </View>
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Amount</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="Enter amount"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              editable={paymentType !== 'one-time'}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          {paymentType === 'one-time' && (
            <Text style={styles.helperText}>
              Full remaining amount will be paid
            </Text>
          )}
        </View>

        {/* Transaction ID (for online payments) */}
        {paymentMode === 'online' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transaction Details</Text>
            <View style={styles.inputContainer}>
              <Icon name="hash" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Transaction ID / UTR Number"
                value={transactionId}
                onChangeText={setTransactionId}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        )}

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add any additional information..."
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Payment Proof Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Proof (Optional)</Text>
          <Text style={styles.sectionSubtitle}>
            Upload receipt, bank statement, or payment screenshot
          </Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={selectImage}
          >
            <Ionicons name="cloud-upload-outline" size={24} color="#6B7280" />
            <Text style={styles.uploadText}>
              {paymentProof ? 'Change Proof' : 'Upload Payment Proof'}
            </Text>
          </TouchableOpacity>
          {paymentProof && (
            <View style={styles.proofPreview}>
              <Image source={{ uri: paymentProof.uri }} style={styles.proofImage} />
              <Text style={styles.proofName}>{paymentProof.fileName}</Text>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmitPayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="cash-outline" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Submit Payment</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Important Notes */}
        <View style={styles.notesCard}>
          <Icon name="info" size={20} color="#F59E0B" />
          <View style={styles.notesContent}>
            <Text style={styles.notesTitle}>Important Notes</Text>
            <Text style={styles.notesText}>
              • Payment will be reviewed by the lender before confirmation{'\n'}
              • You will receive a notification once payment is confirmed{'\n'}
              • Keep payment proof safe until confirmation
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: m(16),
    paddingBottom: m(100),
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    padding: m(20),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  summaryTitle: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(16),
  },
  summaryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: m(12),
    color: '#6B7280',
    marginBottom: m(4),
  },
  summaryValue: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#111827',
  },
  summaryDivider: {
    width: 1,
    height: m(40),
    backgroundColor: '#E5E7EB',
    marginHorizontal: m(12),
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    padding: m(20),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(8),
  },
  sectionSubtitle: {
    fontSize: m(14),
    color: '#6B7280',
    marginBottom: m(16),
  },
  optionsGrid: {
    gap: m(12),
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: m(16),
    borderRadius: m(12),
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  selectedOptionCard: {
    borderColor: '#3B82F6',
    backgroundColor: '#3B82F6',
  },
  optionIcon: {
    width: m(48),
    height: m(48),
    borderRadius: m(24),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(16),
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#111827',
    marginBottom: m(4),
  },
  optionDescription: {
    fontSize: m(14),
    color: '#6B7280',
  },
  selectedText: {
    color: '#FFFFFF',
  },
  checkmark: {
    width: m(24),
    height: m(24),
    borderRadius: m(12),
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: m(12),
    paddingHorizontal: m(16),
    backgroundColor: '#F9FAFB',
  },
  currencySymbol: {
    fontSize: m(18),
    fontWeight: '600',
    color: '#111827',
    marginRight: m(8),
  },
  amountInput: {
    flex: 1,
    fontSize: m(16),
    color: '#111827',
    paddingVertical: m(12),
  },
  inputIcon: {
    marginRight: m(12),
  },
  textInput: {
    flex: 1,
    fontSize: m(16),
    color: '#111827',
    paddingVertical: m(12),
  },
  helperText: {
    fontSize: m(12),
    color: '#6B7280',
    marginTop: m(8),
    fontStyle: 'italic',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: m(12),
    padding: m(16),
    fontSize: m(16),
    color: '#111827',
    backgroundColor: '#F9FAFB',
    textAlignVertical: 'top',
    minHeight: m(80),
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: m(16),
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: m(12),
    backgroundColor: '#F9FAFB',
    gap: m(8),
  },
  uploadText: {
    fontSize: m(16),
    color: '#6B7280',
    fontWeight: '500',
  },
  proofPreview: {
    marginTop: m(12),
    padding: m(12),
    backgroundColor: '#F0F9FF',
    borderRadius: m(8),
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  proofImage: {
    width: '100%',
    height: m(150),
    borderRadius: m(8),
    marginBottom: m(8),
  },
  proofName: {
    fontSize: m(14),
    color: '#0369A1',
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    padding: m(16),
    borderRadius: m(12),
    gap: m(8),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: m(18),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  notesCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderRadius: m(12),
    padding: m(16),
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: m(12),
  },
  notesContent: {
    flex: 1,
  },
  notesTitle: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#92400E',
    marginBottom: m(8),
  },
  notesText: {
    fontSize: m(14),
    color: '#92400E',
    lineHeight: m(20),
  },
});

