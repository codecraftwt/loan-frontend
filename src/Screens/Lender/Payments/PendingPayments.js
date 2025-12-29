import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import Toast from 'react-native-toast-message';
import {
  getPendingPayments,
  confirmPayment,
  rejectPayment,
} from '../../../Redux/Slices/lenderPaymentSlice';

export default function PendingPayments() {
  // const navigation = useNavigation();
  const dispatch = useDispatch();
  const {
    pendingPayments,
    loading,
    confirming,
    rejecting,
    error,
    // pagination,
  } = useSelector(state => state.lenderPayments);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionType, setActionType] = useState(null); // 'confirm' or 'reject'
  const [rejectReason, setRejectReason] = useState('');
  const [confirmNotes, setConfirmNotes] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchPendingPayments();
    }, [])
  );

  useEffect(() => {
    console.log('Pending payments updated:', pendingPayments);
    if (pendingPayments && pendingPayments.length > 0) {
      const totalPending = pendingPayments.reduce((total, loan) => total + (loan.pendingPayments?.length || 0), 0);
      console.log('Total pending payments count:', totalPending);
    }
  }, [pendingPayments]);

  const fetchPendingPayments = async () => {
    console.log('Fetching pending payments...');
    const result = await dispatch(getPendingPayments({ page: 1, limit: 20 }));
    console.log('Pending payments fetch result:', result);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPendingPayments();
    setRefreshing(false);
  };

  useEffect(() => {
    if (error) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: error,
      });
    }
  }, [error]);

  const formatCurrency = (amount) => {
    // Ensure amount is a number before formatting
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    return `₹${numAmount.toLocaleString('en-IN')}`;
  };

  const handlePaymentAction = (loan, payment, type) => {
    setSelectedPayment({ loan, payment });
    setActionType(type);
    setActionModalVisible(true);
    if (type === 'reject') {
      setRejectReason('');
    } else {
      setConfirmNotes('');
    }
  };

  const handleConfirm = async () => {
    if (!selectedPayment) return;

    const { loan, payment } = selectedPayment;
    try {
      await dispatch(
        confirmPayment({
          loanId: loan.loanId,
          paymentId: payment._id,
          notes: confirmNotes.trim(),
        })
      ).unwrap();

      Toast.show({
        type: 'success',
        position: 'top',
        text1: 'Payment Confirmed',
        text2: `Payment of ${formatCurrency(payment.amount)} has been confirmed successfully.`,
      });

      setActionModalVisible(false);
      setSelectedPayment(null);
      fetchPendingPayments();
    } catch (error) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: error || 'Failed to confirm payment',
      });
    }
  };

  const handleReject = async () => {
    if (!selectedPayment || !rejectReason.trim()) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: 'Please provide a reason for rejection',
      });
      return;
    }

    const { loan, payment } = selectedPayment;
    try {
      await dispatch(
        rejectPayment({
          loanId: loan.loanId,
          paymentId: payment._id,
          reason: rejectReason.trim(),
        })
      ).unwrap();

      Toast.show({
        type: 'success',
        position: 'top',
        text1: 'Payment Rejected',
        text2: `Payment of ${formatCurrency(payment.amount)} has been rejected.`,
      });

      setActionModalVisible(false);
      setSelectedPayment(null);
      setRejectReason('');
      fetchPendingPayments();
    } catch (error) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: error || 'Failed to reject payment',
      });
    }
  };

  const renderPaymentCard = ({ item: loan }) => {
    if (!loan.pendingPayments || loan.pendingPayments.length === 0) {
      return null;
    }

    return (
      <View style={styles.loanCard}>
        <View style={styles.loanHeader}>
          <View style={styles.loanInfo}>
            <Text style={styles.borrowerName}>{loan.loanName || 'Unknown Borrower'}</Text>
            <Text style={styles.loanAmount}>Loan: {formatCurrency(loan.totalAmount)}</Text>
            <Text style={styles.loanStatus}>
              Paid: {formatCurrency(loan.totalPaid)} | Remaining: {formatCurrency(loan.remainingAmount)}
            </Text>
          </View>
        </View>

        {loan.pendingPayments.map((payment, index) => (
          <View key={payment._id || index} style={styles.paymentCard}>
            <View style={styles.paymentHeader}>
              <View style={styles.paymentInfo}>
                <View style={styles.paymentAmountRow}>
                  <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                  <View style={styles.paymentTypeBadge}>
                    <Text style={styles.paymentTypeText}>
                      {payment.paymentType === 'one-time' ? 'One-time' : 'Installment'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.paymentMode}>
                  {payment.paymentMode?.charAt(0).toUpperCase() + payment.paymentMode?.slice(1)} Payment
                </Text>
                <Text style={styles.paymentDate}>
                  Paid on: {moment(payment.paymentDate).format('DD MMM YYYY, hh:mm A')}
                </Text>
                {payment.transactionId && (
                  <Text style={styles.transactionId}>Txn ID: {payment.transactionId}</Text>
                )}
                {payment.notes && (
                  <Text style={styles.paymentNotes}>Note: {payment.notes}</Text>
                )}
              </View>
            </View>

            {payment.paymentProof && (
              <TouchableOpacity
                style={styles.proofContainer}
                onPress={() => {
                  // Open image viewer
                  Alert.alert('Payment Proof', 'View payment proof image');
                }}>
                <Ionicons name="document-outline" size={16} color="#3B82F6" />
                <Text style={styles.proofText}>View Payment Proof</Text>
                <Icon name="external-link" size={14} color="#3B82F6" />
              </TouchableOpacity>
            )}

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handlePaymentAction(loan, payment, 'reject')}
                disabled={rejecting}>
                <Icon name="x" size={16} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.confirmButton]}
                onPress={() => handlePaymentAction(loan, payment, 'confirm')}
                disabled={confirming}>
                <Icon name="check" size={16} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderActionModal = () => {
    if (!selectedPayment || !actionType) return null;

    const { payment } = selectedPayment;
    const isReject = actionType === 'reject';

    return (
      <Modal
        visible={actionModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setActionModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isReject ? 'Reject Payment' : 'Confirm Payment'}
              </Text>
              <TouchableOpacity onPress={() => setActionModalVisible(false)}>
                <Icon name="x" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>
                {isReject
                  ? `Are you sure you want to reject this payment of ${formatCurrency(payment.amount)}?`
                  : `Confirm payment of ${formatCurrency(payment.amount)} from ${selectedPayment.loan.loanName}?`}
              </Text>

              {isReject ? (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Reason for Rejection *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter reason for rejection..."
                    multiline
                    numberOfLines={4}
                    value={rejectReason}
                    onChangeText={setRejectReason}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              ) : (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Notes (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Add confirmation notes..."
                    multiline
                    numberOfLines={3}
                    value={confirmNotes}
                    onChangeText={setConfirmNotes}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setActionModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, isReject ? styles.rejectModalButton : styles.confirmModalButton]}
                onPress={isReject ? handleReject : handleConfirm}
                disabled={isReject ? !rejectReason.trim() || rejecting : confirming}>
                {isReject ? (
                  rejecting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalButtonText}>Reject</Text>
                  )
                ) : (
                  confirming ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalButtonText}>Confirm</Text>
                  )
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="checkmark-circle-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No Pending Payments</Text>
      <Text style={styles.emptySubtitle}>
        All payments have been reviewed. Check back later for new payment submissions.
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <Header title="Pending Payments" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading pending payments...</Text>
        </View>
      </View>
    );
  }

  // Filter out loans with no pending payments
  const loansWithPendingPayments = pendingPayments?.filter(
    loan => loan.pendingPayments && Array.isArray(loan.pendingPayments) && loan.pendingPayments.length > 0
  ) || [];

  return (
    <View style={styles.container}>
      <Header title="Pending Payments" />

      {error && !loading && (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Error Loading Payments</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchPendingPayments}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!error && (
        <FlatList
          data={loansWithPendingPayments}
          renderItem={renderPaymentCard}
          keyExtractor={(item, index) => item.loanId || index.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}

      {renderActionModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: m(16),
    fontSize: m(16),
    color: '#6B7280',
  },
  listContainer: {
    padding: m(16),
    paddingBottom: m(100),
  },
  loanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    padding: m(16),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  loanHeader: {
    marginBottom: m(12),
    paddingBottom: m(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  loanInfo: {
    gap: m(4),
  },
  borrowerName: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#111827',
  },
  loanAmount: {
    fontSize: m(14),
    color: '#6B7280',
  },
  loanStatus: {
    fontSize: m(12),
    color: '#6B7280',
  },
  paymentCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: m(12),
    padding: m(12),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paymentHeader: {
    marginBottom: m(12),
  },
  paymentInfo: {
    gap: m(6),
  },
  paymentAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(4),
  },
  paymentAmount: {
    fontSize: m(20),
    fontWeight: '700',
    color: '#111827',
  },
  paymentTypeBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(8),
  },
  paymentTypeText: {
    fontSize: m(10),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  paymentMode: {
    fontSize: m(14),
    color: '#6B7280',
  },
  paymentDate: {
    fontSize: m(12),
    color: '#6B7280',
  },
  transactionId: {
    fontSize: m(12),
    color: '#3B82F6',
    fontFamily: 'monospace',
  },
  paymentNotes: {
    fontSize: m(12),
    color: '#6B7280',
    fontStyle: 'italic',
  },
  proofContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: m(8),
    padding: m(10),
    marginBottom: m(12),
    gap: m(8),
  },
  proofText: {
    flex: 1,
    fontSize: m(14),
    color: '#3B82F6',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: m(12),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: m(12),
    borderRadius: m(8),
    gap: m(6),
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  confirmButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: m(32),
  },
  emptyTitle: {
    fontSize: m(18),
    fontWeight: '600',
    color: '#111827',
    marginTop: m(16),
    marginBottom: m(8),
  },
  emptySubtitle: {
    fontSize: m(14),
    color: '#6B7280',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: m(20),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: m(20),
    fontWeight: '700',
    color: '#111827',
  },
  modalBody: {
    padding: m(20),
  },
  modalMessage: {
    fontSize: m(16),
    color: '#374151',
    marginBottom: m(16),
  },
  inputContainer: {
    marginTop: m(12),
  },
  inputLabel: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#374151',
    marginBottom: m(8),
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: m(8),
    padding: m(12),
    fontSize: m(14),
    color: '#111827',
    backgroundColor: '#F9FAFB',
    textAlignVertical: 'top',
    minHeight: m(80),
  },
  modalActions: {
    flexDirection: 'row',
    padding: m(20),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: m(12),
  },
  modalButton: {
    flex: 1,
    padding: m(12),
    borderRadius: m(8),
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmModalButton: {
    backgroundColor: '#10B981',
  },
  rejectModalButton: {
    backgroundColor: '#EF4444',
  },
  modalButtonText: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: m(32),
  },
  errorTitle: {
    fontSize: m(18),
    fontWeight: '600',
    color: '#111827',
    marginTop: m(16),
    marginBottom: m(8),
  },
  errorMessage: {
    fontSize: m(14),
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: m(24),
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: m(24),
    paddingVertical: m(12),
    borderRadius: m(8),
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: m(14),
    fontWeight: '600',
  },
});

