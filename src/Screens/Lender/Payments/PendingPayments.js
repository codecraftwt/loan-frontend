import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  Image,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
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
import { baseurl } from '../../../Utils/API';
import { FontFamily, FontSizes } from '../../../constants';

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
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchPendingPayments();
    }, [])
  );


  const fetchPendingPayments = async () => {
    await dispatch(getPendingPayments({ page: 1, limit: 20 }));
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

  const getPaymentProofUrl = (paymentProof) => {
    if (!paymentProof) return null;
    
    // If it's already a full URL (starts with http:// or https://), return as is
    if (paymentProof.startsWith('http://') || paymentProof.startsWith('https://')) {
      return paymentProof;
    }
    
    // If it's a relative path, construct full URL
    // Remove '/api' from baseurl if present, then append the proof path
    let baseUrl = baseurl.replace('/api', '').replace(/\/$/, ''); // Remove trailing slash
    
    // Handle payment proof path
    let proofPath = paymentProof;
    // Remove leading / if present to avoid double slashes
    if (proofPath.startsWith('/')) {
      proofPath = proofPath.substring(1);
    }
    
    const fullUrl = `${baseUrl}/${proofPath}`;
    return fullUrl;
  };

  const handleViewProof = (paymentProof) => {
    const imageUrl = getPaymentProofUrl(paymentProof);
    if (imageUrl) {
      setSelectedImageUrl(imageUrl);
      setImageViewerVisible(true);
    } else {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: 'Payment proof image not available',
      });
    }
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
    const paymentId = payment?.paymentId || 
                     payment?._id;
    
    // Get loan ID - check all possible field names
    const loanId = loan?.loanId || 
                   loan?._id;
    
    if (!paymentId) {
      console.error('Payment ID not found in payment object:', payment);
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: 'Payment ID not found. Please check the payment object structure.',
      });
      return;
    }
    
    if (!loanId) {
      console.error('Loan ID not found in loan object:', loan);
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: 'Loan ID not found. Please check the loan object structure.',
      });
      return;
    }
        
    try {
      await dispatch(
        confirmPayment({
          loanId: loanId,
          paymentId: paymentId,
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
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to confirm payment';
      console.error('Confirm payment error:', errorMessage);
      console.error('Full error:', error);
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: errorMessage,
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
    const paymentId = payment?.paymentId || 
                     payment?._id;
    
    // Get loan ID - check all possible field names
    const loanId = loan?.loanId || 
                   loan?._id; 
    
    if (!paymentId) {
      console.error('Payment ID not found in payment object (reject):', payment);
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: 'Payment ID not found. Please check the payment object structure.',
      });
      return;
    }
    
    if (!loanId) {
      console.error('Loan ID not found in loan object (reject):', loan);
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: 'Loan ID not found. Please check the loan object structure.',
      });
      return;
    }
    
    try {
      await dispatch(
        rejectPayment({
          loanId: loanId,
          paymentId: paymentId,
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
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to reject payment';
      console.error('Reject payment error:', errorMessage);
      console.error('Full error:', error);
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: errorMessage,
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
            <Text style={styles.borrowerName}>{loan.borrowerName || loan.loanName || 'Unknown Borrower'}</Text>
            {loan.borrowerMobile && (
              <Text style={styles.borrowerInfo}>
                <Icon name="phone" size={12} color="#6B7280" /> {loan.borrowerMobile}
              </Text>
            )}
            {loan.borrowerAadhaar && (
              <Text style={styles.borrowerInfo}>
                <Icon name="credit-card" size={12} color="#6B7280" /> Aadhaar: {loan.borrowerAadhaar}
              </Text>
            )}
            <View style={styles.loanAmountRow}>
              <View style={styles.loanAmountItem}>
                <Text style={styles.loanAmountLabel}>Total Loan</Text>
                <Text style={styles.loanAmountValue}>{formatCurrency(loan.totalLoanAmount || loan.totalAmount)}</Text>
              </View>
              <View style={styles.loanAmountItem}>
                <Text style={styles.loanAmountLabel}>Paid</Text>
                <Text style={[styles.loanAmountValue, { color: '#10B981' }]}>
                  {formatCurrency(loan.totalPaid)}
                </Text>
              </View>
              <View style={styles.loanAmountItem}>
                <Text style={styles.loanAmountLabel}>Remaining</Text>
                <Text style={[styles.loanAmountValue, { color: '#EF4444' }]}>
                  {formatCurrency(loan.remainingAmount)}
                </Text>
              </View>
            </View>
            <View style={styles.loanStatusBadge}>
              <Text style={styles.loanStatusText}>
                Status: {loan.currentLoanStatus || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {loan.pendingPayments.map((payment, index) => {
          // Use paymentId as primary key, fallback to _id
          const paymentKey = payment.paymentId || payment._id || `payment-${index}`;
          return (
          <View key={paymentKey} style={styles.paymentCard}>
            <View style={styles.paymentHeader}>
              <View style={styles.paymentInfo}>
                <View style={styles.paymentAmountRow}>
                  <View>
                    <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                    <Text style={styles.paymentSubtitle}>Payment Amount</Text>
                  </View>
                  <View style={styles.badgeContainer}>
                    <View style={[
                      styles.paymentTypeBadge,
                      payment.paymentType === 'one-time' ? styles.oneTimeBadge : styles.installmentBadge
                    ]}>
                      <Text style={styles.paymentTypeText}>
                        {payment.paymentType === 'one-time' ? 'One-time' : `Installment #${payment.installmentNumber || 'N/A'}`}
                      </Text>
                    </View>
                    <View style={[
                      styles.paymentModeBadge,
                      payment.paymentMode === 'online' ? styles.onlineBadge : styles.cashBadge
                    ]}>
                      <Icon 
                        name={payment.paymentMode === 'online' ? 'credit-card' : 'dollar-sign'} 
                        size={12} 
                        color="#FFFFFF" 
                      />
                      <Text style={styles.paymentModeText}>
                        {payment.paymentMode?.charAt(0).toUpperCase() + payment.paymentMode?.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.paymentDetailsGrid}>
                  <View style={styles.detailItem}>
                    <Icon name="calendar" size={14} color="#6B7280" />
                    <Text style={styles.detailLabel}>Payment Date:</Text>
                    <Text style={styles.detailValue}>
                      {moment(payment.paymentDate || payment.submittedAt).format('DD MMM YYYY, hh:mm A')}
                    </Text>
                  </View>

                  {payment.transactionId && (
                    <View style={styles.detailItem}>
                      <Icon name="hash" size={14} color="#6B7280" />
                      <Text style={styles.detailLabel}>Transaction ID:</Text>
                      <Text style={styles.transactionIdValue}>{payment.transactionId}</Text>
                    </View>
                  )}

                  {payment.installmentNumber && payment.paymentType === 'installment' && (
                    <View style={styles.detailItem}>
                      <Icon name="list" size={14} color="#6B7280" />
                      <Text style={styles.detailLabel}>Installment Number:</Text>
                      <Text style={styles.detailValue}>#{payment.installmentNumber}</Text>
                    </View>
                  )}

                  {payment.notes && (
                    <View style={styles.detailItem}>
                      <Icon name="message-circle" size={14} color="#6B7280" />
                      <Text style={styles.detailLabel}>Notes:</Text>
                      <Text style={styles.notesValue}>{payment.notes}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {payment.paymentProof && (
              <TouchableOpacity
                style={styles.proofContainer}
                onPress={() => handleViewProof(payment.paymentProof)}
                activeOpacity={0.8}>
                <View style={styles.proofIconContainer}>
                  <Ionicons name="image-outline" size={20} color="#3B82F6" />
                </View>
                <View style={styles.proofTextContainer}>
                  <Text style={styles.proofText}>Payment Proof Available</Text>
                  <Text style={styles.proofSubtext}>Tap to view image</Text>
                </View>
                <Icon name="external-link" size={18} color="#3B82F6" />
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
          );
        })}
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
        <Header title="Pending Payments" showBackButton />
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
      <Header title="Pending Payments" showBackButton />

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
      <ImageViewer
        visible={imageViewerVisible}
        imageUrl={selectedImageUrl}
        onClose={() => {
          setImageViewerVisible(false);
          setSelectedImageUrl(null);
        }}
      />
    </View>
  );
}

const ImageViewer = ({ visible, imageUrl, onClose }) => {
  if (!visible || !imageUrl) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={imageViewerStyles.overlay}>
        <View style={imageViewerStyles.header}>
          <Text style={imageViewerStyles.headerText}>Payment Proof</Text>
          <TouchableOpacity onPress={onClose} style={imageViewerStyles.closeButton}>
            <Icon name="x" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <ScrollView
          contentContainerStyle={imageViewerStyles.scrollContent}
          maximumZoomScale={3}
          minimumZoomScale={1}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}>
          <Image
            source={{ uri: imageUrl }}
            style={imageViewerStyles.image}
            resizeMode="contain"
            onError={(error) => {
              console.error('Image load error:', error);
              console.error('Failed URL:', imageUrl);
              Toast.show({
                type: 'error',
                position: 'top',
                text1: 'Error Loading Image',
                text2: 'Failed to load payment proof image. Please check the URL.',
                visibilityTime: 4000,
              });
            }}
          />
        </ScrollView>
      </View>
    </Modal>
  );
};

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
    fontSize: FontSizes.md,
    fontFamily: FontFamily.primaryRegular,
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
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.secondaryBold,
    color: '#111827',
    marginBottom: m(4),
  },
  borrowerInfo: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#6B7280',
    marginBottom: m(2),
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
  },
  loanAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: m(8),
    marginBottom: m(8),
    gap: m(8),
  },
  loanAmountItem: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: m(8),
    borderRadius: m(8),
    alignItems: 'center',
  },
  loanAmountLabel: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.primaryRegular,
    color: '#6B7280',
    marginBottom: m(4),
  },
  loanAmountValue: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primaryBold,
    color: '#111827',
  },
  loanStatusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(12),
    marginTop: m(4),
  },
  loanStatusText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primarySemiBold,
    color: '#3B82F6',
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: m(12),
  },
  paymentAmount: {
    fontSize: FontSizes['2xl'],
    fontFamily: FontFamily.primaryBold,
    color: '#111827',
  },
  paymentSubtitle: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.primaryRegular,
    color: '#6B7280',
    marginTop: m(2),
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: m(6),
    flexWrap: 'wrap',
  },
  paymentTypeBadge: {
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    borderRadius: m(12),
    marginBottom: m(4),
  },
  oneTimeBadge: {
    backgroundColor: '#10B981',
  },
  installmentBadge: {
    backgroundColor: '#3B82F6',
  },
  paymentTypeText: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.primarySemiBold,
    color: '#FFFFFF',
  },
  paymentModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    borderRadius: m(12),
    gap: m(4),
    marginBottom: m(4),
  },
  onlineBadge: {
    backgroundColor: '#8B5CF6',
  },
  cashBadge: {
    backgroundColor: '#F59E0B',
  },
  paymentModeText: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.primarySemiBold,
    color: '#FFFFFF',
  },
  paymentDetailsGrid: {
    gap: m(8),
    marginTop: m(8),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    flexWrap: 'wrap',
  },
  detailLabel: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryMedium,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primarySemiBold,
    color: '#111827',
  },
  transactionIdValue: {
    fontSize: FontSizes.sm,
    color: '#3B82F6',
    fontFamily: 'monospace',
  },
  notesValue: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#374151',
    fontStyle: 'italic',
    flex: 1,
  },
  proofContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: m(12),
    padding: m(12),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: m(12),
  },
  proofIconContainer: {
    width: m(40),
    height: m(40),
    borderRadius: m(20),
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proofTextContainer: {
    flex: 1,
  },
  proofText: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: '#3B82F6',
    marginBottom: m(2),
  },
  proofSubtext: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.primaryRegular,
    color: '#6B7280',
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
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: m(32),
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.secondarySemiBold,
    color: '#111827',
    marginTop: m(16),
    marginBottom: m(8),
  },
  emptySubtitle: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primaryRegular,
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
    fontSize: FontSizes.xl,
    fontFamily: FontFamily.secondaryBold,
    color: '#111827',
  },
  modalBody: {
    padding: m(20),
  },
  modalMessage: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.primaryRegular,
    color: '#374151',
    marginBottom: m(16),
  },
  inputContainer: {
    marginTop: m(12),
  },
  inputLabel: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: '#374151',
    marginBottom: m(8),
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: m(8),
    padding: m(12),
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primaryRegular,
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
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: '#6B7280',
  },
  confirmModalButton: {
    backgroundColor: '#10B981',
  },
  rejectModalButton: {
    backgroundColor: '#EF4444',
  },
  modalButtonText: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: m(32),
  },
  errorTitle: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.secondarySemiBold,
    color: '#111827',
    marginTop: m(16),
    marginBottom: m(8),
  },
  errorMessage: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primaryRegular,
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
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
  },
});

const imageViewerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: m(16),
    paddingTop: m(50),
  },
  headerText: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.secondaryBold,
    color: '#FFFFFF',
  },
  closeButton: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: m(20),
  },
  image: {
    width: '100%',
    minHeight: m(400),
    aspectRatio: 1,
  },
});

