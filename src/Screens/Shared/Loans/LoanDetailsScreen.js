import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import moment from 'moment';
import { useDispatch, useSelector } from 'react-redux';
import { updateLoanStatus } from '../../../Redux/Slices/loanSlice';
import { getPendingPayments, confirmPayment, rejectPayment } from '../../../Redux/Slices/lenderPaymentSlice';
import Toast from 'react-native-toast-message';
import { m } from 'walstar-rn-responsive';
import PromptBox from '../../PromptBox/Prompt';
import Header from '../../../Components/Header';
import { useFocusEffect } from '@react-navigation/native';
import lenderLoanAPI from '../../../Services/lenderLoanService';

const DetailItem = ({ icon, label, value, isStatus, onStatusChange }) => {
  const isAccepted = value?.toLowerCase() === 'accepted';
  
  return (
    <View style={styles.detailItem}>
      <View style={styles.detailIconContainer}>
        <Icon name={icon} size={20} color="#3B82F6" />
      </View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
      {isStatus && value === 'pending' && isAccepted && (
        <TouchableOpacity
          style={styles.statusButton}
          onPress={onStatusChange}>
          <Text style={styles.statusButtonText}>Mark as Paid</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default function LoanDetailScreen({ route, navigation }) {
  const { loanDetails, isEdit } = route.params;
  const dispatch = useDispatch();
  const { updateError } = useSelector(state => state.loans);
  const user = useSelector(state => state.auth.user);
  const { pendingPayments, confirming, rejecting } = useSelector(state => state.lenderPayments);

  const [isPromptVisible, setPromptVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [pendingPaymentsForLoan, setPendingPaymentsForLoan] = useState([]);
  const [loadingPendingPayments, setLoadingPendingPayments] = useState(false);
  const [currentLoanDetails, setCurrentLoanDetails] = useState(loanDetails);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [actionType, setActionType] = useState(null); // 'confirm' or 'reject'
  const [rejectReason, setRejectReason] = useState('');
  const [confirmNotes, setConfirmNotes] = useState('');

  const isLender = user?.roleId === 1;

  // Fetch loan details and check for pending confirmations
  useFocusEffect(
    useCallback(() => {
      if (isLender && loanDetails?._id) {
        fetchLoanDetailsWithConfirmations();
      }
    }, [isLender, loanDetails?._id])
  );

  useEffect(() => {
    if (!isLender) return;
    
    // Strategy 1: Check currentLoanDetails (from API)
    if (currentLoanDetails?.pendingConfirmations?.payments) {
      const payments = currentLoanDetails.pendingConfirmations.payments;
      if (Array.isArray(payments) && payments.length > 0) {
        setPendingPaymentsForLoan(payments);
        return;
      }
    }
    
    // Strategy 2: Check pendingPayments from Redux
    if (pendingPayments && pendingPayments.length > 0) {
      const loanPendingPayments = pendingPayments.find(
        loan => loan.loanId === loanDetails?._id || loan._id === loanDetails?._id
      );
      if (loanPendingPayments && loanPendingPayments.pendingPayments) {
        setPendingPaymentsForLoan(loanPendingPayments.pendingPayments);
        return;
      }
    }
    
    // Strategy 3: Check paymentHistory for pending payments
    if (loanDetails?.paymentHistory && Array.isArray(loanDetails.paymentHistory)) {
      const pendingFromHistory = loanDetails.paymentHistory.filter(
        payment => payment.paymentStatus?.toLowerCase() === 'pending'
      );
      if (pendingFromHistory.length > 0) {
        setPendingPaymentsForLoan(pendingFromHistory);
        return;
      }
    }
    
    // Strategy 4: Check original loanDetails
    if (loanDetails?.pendingConfirmations?.payments) {
      const payments = loanDetails.pendingConfirmations.payments;
      if (Array.isArray(payments) && payments.length > 0) {
        setPendingPaymentsForLoan(payments);
        return;
      }
    }
      setPendingPaymentsForLoan([]);
  }, [pendingPayments, currentLoanDetails, loanDetails, isLender]);

  const fetchLoanDetailsWithConfirmations = async () => {
    if (!isLender || !loanDetails?._id) return;
    
    setLoadingPendingPayments(true);
    try {
      // Strategy 1: Try to fetch loan details from API (should include pendingConfirmations)
      try {
        const response = await lenderLoanAPI.getLoanDetails(loanDetails._id);
        if (response?.data) {
          setCurrentLoanDetails(response.data);
          if (response.data.pendingConfirmations?.payments) {
            setPendingPaymentsForLoan(response.data.pendingConfirmations.payments);
            setLoadingPendingPayments(false);
            return;
          }
        }
      } catch (apiError) {
        // Handle 500 error gracefully - API endpoint might not be available
        if (apiError.response?.status === 500) {
          console.log('Lender loan details endpoint returned 500, using fallback');
        }
      }

      // Strategy 2: Try pending payments endpoint (handles 500 gracefully)
      try {
        const result = await dispatch(getPendingPayments({ page: 1, limit: 50 })).unwrap();
        if (result.payments && result.payments.length > 0) {
          // Find payments for this loan
          const loanPending = result.payments.find(
            loan => loan.loanId === loanDetails._id || loan._id === loanDetails._id
          );
          if (loanPending?.pendingPayments && loanPending.pendingPayments.length > 0) {
            setPendingPaymentsForLoan(loanPending.pendingPayments);
            setLoadingPendingPayments(false);
            return;
          }
        }
      } catch (pendingError) {
        // console.log('Pending payments endpoint failed (expected for 500):', pendingError);
        // This is expected - the endpoint returns 500, but Redux handles it gracefully
      }

      // Strategy 3: Check if loan object has paymentHistory with pending payments
      if (loanDetails?.paymentHistory && Array.isArray(loanDetails.paymentHistory)) {
        const pendingFromHistory = loanDetails.paymentHistory.filter(
          payment => payment.paymentStatus?.toLowerCase() === 'pending'
        );
        if (pendingFromHistory.length > 0) {
          setPendingPaymentsForLoan(pendingFromHistory);
          setLoadingPendingPayments(false);
          return;
        }
      }

      // Strategy 4: Check existing loanDetails for pendingConfirmations
      if (loanDetails?.pendingConfirmations?.payments) {
        setPendingPaymentsForLoan(loanDetails.pendingConfirmations.payments);
      } else {
        setPendingPaymentsForLoan([]);
      }
    } catch (error) {
      // Use existing loanDetails if available
      if (loanDetails?.pendingConfirmations?.payments) {
        setPendingPaymentsForLoan(loanDetails.pendingConfirmations.payments);
      } else {
        setPendingPaymentsForLoan([]);
      }
    } finally {
      setLoadingPendingPayments(false);
    }
  };

  const formatDate = date => moment(date).format('DD MMM, YYYY');

  const handleEdit = () => {
    if (loanDetails) {
      navigation.navigate('AddDetails', { loanDetails });
    } else {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: 'Loan details not available',
      });
    }
  };

  const updateLoanStatusHandler = newStatus => {
    dispatch(updateLoanStatus({ loanId: loanDetails._id, status: newStatus }))
      .unwrap()
      .then(() => {
        Toast.show({
          type: 'success',
          position: 'top',
          text1: `Loan status updated to ${newStatus}`,
        });
        setPromptVisible(false);
      })
      .catch(err => {
        Toast.show({
          type: 'error',
          position: 'top',
          text1: updateError || err.message || 'Error updating loan status',
        });
        setPromptVisible(false);
      });
  };

  const handleStatusChangeClick = () => {
    const newStatus = loanDetails.status === 'pending' ? 'paid' : 'pending';
    setSelectedStatus(newStatus);
    setPromptVisible(true);
  };

  const handleConfirm = () => {
    if (selectedStatus) {
      updateLoanStatusHandler(selectedStatus);
    }
  };

  const handleCancel = () => {
    setPromptVisible(false);
  };

  const formatCurrency = (amount) => {
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    return `₹${numAmount.toLocaleString('en-IN')}`;
  };

  const handlePaymentAction = (payment, type) => {
    setSelectedPayment(payment);
    setActionType(type);
    setActionModalVisible(true);
    if (type === 'reject') {
      setRejectReason('');
    } else {
      setConfirmNotes('');
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedPayment || !loanDetails?._id) return;

    try {
      await dispatch(
        confirmPayment({
          loanId: loanDetails._id,
          paymentId: selectedPayment._id,
          notes: confirmNotes.trim(),
        })
      ).unwrap();

      Toast.show({
        type: 'success',
        position: 'top',
        text1: 'Payment Confirmed',
        text2: `Payment of ${formatCurrency(selectedPayment.amount)} has been confirmed successfully.`,
      });

      setActionModalVisible(false);
      setSelectedPayment(null);
      setConfirmNotes('');
      
      // Refresh loan details and pending payments
      await fetchLoanDetailsWithConfirmations();
      
      // Remove confirmed payment from local state
      setPendingPaymentsForLoan(prev => 
        prev.filter(p => p._id !== selectedPayment._id)
      );
    } catch (error) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: error || 'Failed to confirm payment',
      });
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedPayment || !loanDetails?._id || !rejectReason.trim()) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: 'Please provide a reason for rejection',
      });
      return;
    }

    try {
      await dispatch(
        rejectPayment({
          loanId: loanDetails._id,
          paymentId: selectedPayment._id,
          reason: rejectReason.trim(),
        })
      ).unwrap();

      Toast.show({
        type: 'success',
        position: 'top',
        text1: 'Payment Rejected',
        text2: `Payment of ${formatCurrency(selectedPayment.amount)} has been rejected.`,
      });

      setActionModalVisible(false);
      setSelectedPayment(null);
      setRejectReason('');
      
      // Refresh loan details and pending payments
      await fetchLoanDetailsWithConfirmations();
      
      // Remove rejected payment from local state
      setPendingPaymentsForLoan(prev => 
        prev.filter(p => p._id !== selectedPayment._id)
      );
    } catch (error) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: error || 'Failed to reject payment',
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'pending': return '#F59E0B';
      case 'paid': return '#10B981';
      case 'closed': return '#10B981';
      case 'part paid': return '#F59E0B';
      case 'overdue': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted': return 'check-circle';
      case 'rejected': return 'x-circle';
      case 'paid': return 'check-circle';
      case 'closed': return 'check-circle';
      case 'part paid': return 'clock';
      case 'overdue': return 'alert-circle';
      default: return 'clock';
    }
  };

  // Calculate loan amounts
  const loanAmount = typeof loanDetails.amount === 'number' 
    ? loanDetails.amount 
    : parseFloat(loanDetails.amount) || 0;
  const totalPaid = typeof loanDetails.totalPaid === 'number'
    ? loanDetails.totalPaid
    : parseFloat(loanDetails.totalPaid) || 0;
  const remainingAmount = typeof loanDetails.remainingAmount === 'number'
    ? loanDetails.remainingAmount
    : parseFloat(loanDetails.remainingAmount) || loanAmount;
  
  // Check if loan is closed
  const isLoanClosed = remainingAmount <= 0 && totalPaid > 0;
  
  // Check if loan is overdue
  const isOverdue = loanDetails.loanEndDate && 
    moment(loanDetails.loanEndDate).isBefore(moment(), 'day') && 
    remainingAmount > 0 && 
    !isLoanClosed;
  
  // Get effective status (overdue takes priority)
  const effectiveStatus = isOverdue ? 'overdue' : (isLoanClosed ? 'closed' : (loanDetails.paymentStatus || loanDetails.status || 'pending'));

  const loanInfo = [
    {
      label: 'Loan Amount',
      value: formatCurrency(loanAmount),
      icon: 'dollar-sign',
    },
    {
      label: 'Total Paid',
      value: formatCurrency(totalPaid),
      icon: 'check-circle',
    },
    {
      label: 'Remaining Amount',
      value: isLoanClosed ? '₹0 (Loan Closed)' : formatCurrency(remainingAmount),
      icon: 'dollar-sign',
    },
    {
      label: 'Loan Status',
      value: isOverdue ? 'Overdue' : (isLoanClosed ? 'Closed' : (loanDetails.paymentStatus || loanDetails.status || 'N/A')),
      icon: getStatusIcon(effectiveStatus),
      isStatus: !isLoanClosed && !isOverdue && canMarkAsPaid,
      onStatusChange: handleStatusChangeClick,
    },
    {
      label: 'Borrower Acceptance',
      value: loanDetails.borrowerAcceptanceStatus || 'N/A',
      icon: 'user-check',
    },
    { 
      label: 'Purpose', 
      value: loanDetails.purpose || 'Not specified', 
      icon: 'book' 
    },
    {
      label: 'Loan Start Date',
      value: loanDetails.loanStartDate ? formatDate(loanDetails.loanStartDate) : 'N/A',
      icon: 'calendar',
    },
    {
      label: 'Loan End Date',
      value: loanDetails.loanEndDate ? formatDate(loanDetails.loanEndDate) : 'N/A',
      icon: 'calendar',
    },
    { 
      label: 'Address', 
      value: loanDetails.address || 'Not specified', 
      icon: 'map-pin' 
    },
  ];

  const isAccepted = loanDetails.borrowerAcceptanceStatus?.toLowerCase() === 'accepted';
  const canMarkAsPaid = isAccepted && loanDetails.status === 'pending' && !isLoanClosed;

  return (
    <View style={styles.container}>
      <Header
        title="Loan Details"
        showBackButton
        isEdit={isEdit}
        onEditPress={handleEdit}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            {loanDetails.profileImage ? (
              <Image
                source={{ uri: loanDetails.profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileAvatar}>
                <Text style={styles.avatarText}>
                  {loanDetails.name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={2}>
                {loanDetails.name}
              </Text>
              <View style={styles.profileMeta}>
                <View style={styles.metaItem}>
                  <Icon name="phone" size={14} color="#6B7280" />
                  <Text style={styles.metaText}>
                    {loanDetails.mobileNumber || 'N/A'}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <FontAwesome name="id-card" color="black" size={14} />
                  <Text style={styles.metaText}>
                    {loanDetails.aadhaarNumber || 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Status Indicators */}
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(effectiveStatus) }]}>
                <Icon name={getStatusIcon(effectiveStatus)} size={14} color="#FFFFFF" />
                <Text style={styles.statusText}>
                  {isOverdue ? 'Overdue' : (isLoanClosed ? 'Loan Closed' : (loanDetails.status?.charAt(0).toUpperCase() + loanDetails.status?.slice(1)))}
                </Text>
              </View>
              <Text style={styles.statusLabel}>Loan Status</Text>
            </View>

            <View style={styles.statusDivider} />

            <View style={styles.statusItem}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(loanDetails.borrowerAcceptanceStatus) }]}>
                <Icon name="user-check" size={14} color="#FFFFFF" />
                <Text style={styles.statusText}>
                  {loanDetails.borrowerAcceptanceStatus?.charAt(0).toUpperCase() + loanDetails.borrowerAcceptanceStatus?.slice(1)}
                </Text>
              </View>
              <Text style={styles.statusLabel}>Borrower Status</Text>
            </View>
          </View>
        </View>

        {/* Payment Summary Card */}
        {loanAmount > 0 && (
          <View style={styles.paymentSummaryCard}>
            <Text style={styles.paymentSummaryTitle}>Payment Summary</Text>
            
            <View style={styles.paymentSummaryRow}>
              <View style={styles.paymentSummaryItem}>
                <Text style={styles.paymentSummaryLabel}>Loan Amount</Text>
                <Text style={styles.paymentSummaryValue}>{formatCurrency(loanAmount)}</Text>
              </View>
              <View style={styles.paymentSummaryItem}>
                <Text style={styles.paymentSummaryLabel}>Total Paid</Text>
                <Text style={[styles.paymentSummaryValue, styles.paidAmount]}>
                  {formatCurrency(totalPaid)}
                </Text>
              </View>
              <View style={styles.paymentSummaryItem}>
                <Text style={styles.paymentSummaryLabel}>Remaining</Text>
                <Text style={[styles.paymentSummaryValue, isLoanClosed ? styles.closedAmount : styles.remainingAmount]}>
                  {isLoanClosed ? '₹0' : formatCurrency(remainingAmount)}
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${loanAmount > 0 ? (totalPaid / loanAmount) * 100 : 0}%`,
                      backgroundColor: isLoanClosed ? '#10B981' : '#3B82F6'
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {loanAmount > 0 ? `${((totalPaid / loanAmount) * 100).toFixed(1)}%` : '0%'} Paid
              </Text>
            </View>

            {/* Overdue Badge */}
            {isOverdue && (
              <View style={styles.overdueBadge}>
                <Icon name="alert-circle" size={20} color="#EF4444" />
                <Text style={styles.overdueBadgeText}>
                  Overdue - Payment was due on {moment(loanDetails.loanEndDate).format('DD MMM YYYY')}
                </Text>
              </View>
            )}
            
            {/* Loan Closed Badge */}
            {isLoanClosed && !isOverdue && (
              <View style={styles.closedBadge}>
                <Icon name="check-circle" size={20} color="#10B981" />
                <Text style={styles.closedBadgeText}>Loan Closed - All Amount Paid</Text>
              </View>
            )}
          </View>
        )}

        {/* Loan Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Loan Information</Text>
          
          <View style={styles.detailsGrid}>
            {loanInfo.map((item, index) => (
              <DetailItem
                key={index}
                icon={item.icon}
                label={item.label}
                value={item.value}
                isStatus={item.isStatus && canMarkAsPaid}
                onStatusChange={item.onStatusChange}
              />
            ))}
          </View>

          {/* Additional Information if needed */}
          {loanDetails.notes && (
            <View style={styles.notesContainer}>
              <View style={styles.notesHeader}>
                <Icon name="file-text" size={18} color="#3B82F6" />
                <Text style={styles.notesTitle}>Additional Notes</Text>
              </View>
              <Text style={styles.notesText}>{loanDetails.notes}</Text>
            </View>
          )}
        </View>

        {/* Pending Payment Confirmations - For Lenders */}
        {isLender && (
          <>
            {loadingPendingPayments && (
              <View style={styles.loadingCard}>
                <ActivityIndicator size="small" color="#F59E0B" />
                <Text style={styles.loadingText}>Loading pending payments...</Text>
              </View>
            )}
            {pendingPaymentsForLoan && pendingPaymentsForLoan.length > 0 && (
          <View style={styles.pendingConfirmationsCard}>
            <View style={styles.pendingConfirmationsHeader}>
              <View style={styles.pendingConfirmationsTitleRow}>
                <Ionicons name="notifications" size={24} color="#F59E0B" />
                <Text style={styles.pendingConfirmationsTitle}>
                  Pending Payment Confirmations
                </Text>
              </View>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{pendingPaymentsForLoan.length}</Text>
              </View>
            </View>
            <Text style={styles.pendingConfirmationsMessage}>
              {loanDetails.name || 'Borrower'} has submitted {pendingPaymentsForLoan.length} payment{pendingPaymentsForLoan.length !== 1 ? 's' : ''} awaiting your review.
            </Text>

            {pendingPaymentsForLoan.map((payment, index) => (
              <View key={payment._id || index} style={styles.pendingPaymentItem}>
                <View style={styles.pendingPaymentInfo}>
                  <View style={styles.pendingPaymentHeader}>
                    <Text style={styles.pendingPaymentAmount}>
                      {formatCurrency(payment.amount)}
                    </Text>
                    <View style={styles.pendingPaymentTypeBadge}>
                      <Text style={styles.pendingPaymentTypeText}>
                        {payment.installmentLabel || (payment.installmentNumber ? `Installment ${payment.installmentNumber}` : (payment.paymentType === 'one-time' ? 'One-time' : 'Installment'))}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.pendingPaymentDetails}>
                    {payment.paymentMode?.charAt(0).toUpperCase() + payment.paymentMode?.slice(1)} Payment
                  </Text>
                  <Text style={styles.pendingPaymentDate}>
                    Paid on: {moment(payment.paymentDate).format('DD MMM YYYY, hh:mm A')}
                  </Text>
                  {payment.transactionId && (
                    <Text style={styles.pendingPaymentTxnId}>
                      Txn ID: {payment.transactionId}
                    </Text>
                  )}
                  {payment.notes && (
                    <Text style={styles.pendingPaymentNotes}>
                      Note: {payment.notes}
                    </Text>
                  )}
                </View>

                {payment.paymentProof && (
                  <TouchableOpacity
                    style={styles.pendingPaymentProof}
                    onPress={() => {
                      // Open image viewer
                      Toast.show({
                        type: 'info',
                        position: 'top',
                        text1: 'Payment Proof',
                        text2: 'View payment proof image',
                      });
                    }}>
                    <Ionicons name="document-outline" size={16} color="#3B82F6" />
                    <Text style={styles.pendingPaymentProofText}>View Proof</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.pendingPaymentActions}>
                  <TouchableOpacity
                    style={[styles.pendingActionButton, styles.rejectPendingButton]}
                    onPress={() => handlePaymentAction(payment, 'reject')}
                    disabled={rejecting}>
                    <Icon name="x" size={16} color="#FFFFFF" />
                    <Text style={styles.pendingActionButtonText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pendingActionButton, styles.confirmPendingButton]}
                    onPress={() => handlePaymentAction(payment, 'confirm')}
                    disabled={confirming}>
                    <Icon name="check" size={16} color="#FFFFFF" />
                    <Text style={styles.pendingActionButtonText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
            )}
            {!loadingPendingPayments && pendingPaymentsForLoan && pendingPaymentsForLoan.length === 0 && isLender && (
              <View style={styles.noPendingCard}>
                <Ionicons name="checkmark-circle-outline" size={48} color="#D1D5DB" />
                <Text style={styles.noPendingText}>No Pending Payments</Text>
                <Text style={styles.noPendingSubtext}>
                  All payments have been reviewed for this loan.
                </Text>
              </View>
            )}
          </>
        )}

        {/* Action Button - Only show if loan is pending AND borrower has accepted */}
        {canMarkAsPaid && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#10B981' }]}
            onPress={handleStatusChangeClick}>
            <Icon name="check-circle" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Mark as Paid</Text>
          </TouchableOpacity>
        )}

        {/* Created Date */}
        <View style={styles.footer}>
          <Icon name="clock" size={14} color="#9CA3AF" />
          <Text style={styles.footerText}>
            Created {moment(loanDetails.createdAt).fromNow()}
          </Text>
        </View>
      </ScrollView>

      {/* PromptBox for Status Change */}
      <PromptBox
        visible={isPromptVisible}
        message={`Are you sure you want to mark this loan as ${selectedStatus === 'pending' ? 'pending' : 'paid'}?`}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      {/* Payment Action Modal */}
      {actionModalVisible && selectedPayment && (
        <Modal
          visible={actionModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setActionModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {actionType === 'reject' ? 'Reject Payment' : 'Confirm Payment'}
                </Text>
                <TouchableOpacity onPress={() => setActionModalVisible(false)}>
                  <Icon name="x" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.modalMessage}>
                  {actionType === 'reject'
                    ? `Are you sure you want to reject this payment of ${formatCurrency(selectedPayment.amount)}?`
                    : `Confirm payment of ${formatCurrency(selectedPayment.amount)} from ${loanDetails.name || 'borrower'}?`}
                </Text>

                {actionType === 'reject' ? (
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
                  style={[styles.modalButton, actionType === 'reject' ? styles.rejectModalButton : styles.confirmModalButton]}
                  onPress={actionType === 'reject' ? handleRejectPayment : handleConfirmPayment}
                  disabled={actionType === 'reject' ? !rejectReason.trim() || rejecting : confirming}>
                  {actionType === 'reject' ? (
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
      )}
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
    paddingBottom: m(40),
  },
  
  // Profile Card
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(20),
    padding: m(24),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(14),
  },
  profileAvatar: {
    width: m(60),
    height: m(60),
    borderRadius: m(30),
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(16),
    borderWidth: 3,
    borderColor: '#EFF6FF',
  },
  avatarText: {
    fontSize: m(24),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  profileImage: {
    width: m(60),
    height: m(60),
    borderRadius: m(30),
    marginRight: m(16),
    borderWidth: 3,
    borderColor: '#EFF6FF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: m(22),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(8),
  },
  profileMeta: {
    gap: m(5),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  metaText: {
    fontSize: m(14),
    color: '#6B7280',
  },
  
  // Status Container
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: m(10),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(20),
    gap: m(6),
    marginBottom: m(6),
  },
  statusText: {
    fontSize: m(12),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusLabel: {
    fontSize: m(12),
    color: '#6B7280',
  },
  statusDivider: {
    width: 1,
    height: m(40),
    backgroundColor: '#E5E7EB',
  },
  
  // Details Card
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(20),
    padding: m(24),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  detailsTitle: {
    fontSize: m(20),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(16),
  },
  detailsGrid: {
    gap: m(10),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: m(14),
    padding: m(14),
    marginBottom: m(5),
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  detailIconContainer: {
    width: m(40),
    height: m(40),
    borderRadius: m(12),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(14),
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: m(11),
    color: '#9CA3AF',
    marginBottom: m(4),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: m(15),
    fontWeight: '600',
    color: '#111827',
  },
  statusButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(8),
    marginLeft: m(8),
  },
  statusButtonText: {
    fontSize: m(12),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Notes Section
  notesContainer: {
    marginTop: m(20),
    paddingTop: m(16),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    marginBottom: m(8),
  },
  notesTitle: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#374151',
  },
  notesText: {
    fontSize: m(14),
    color: '#6B7280',
    lineHeight: m(20),
  },
  
  // Action Button
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
    backgroundColor: '#3B82F6',
    borderRadius: m(12),
    padding: m(16),
    marginBottom: m(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButtonText: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(6),
    padding: m(12),
  },
  footerText: {
    fontSize: m(14),
    color: '#9CA3AF',
  },
  
  // Payment Summary Card
  paymentSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(20),
    padding: m(24),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  paymentSummaryTitle: {
    fontSize: m(20),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(20),
  },
  paymentSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: m(16),
    gap: m(12),
  },
  paymentSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  paymentSummaryLabel: {
    fontSize: m(12),
    color: '#6B7280',
    marginBottom: m(4),
  },
  paymentSummaryValue: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#111827',
  },
  paidAmount: {
    color: '#10B981',
  },
  remainingAmount: {
    color: '#EF4444',
  },
  closedAmount: {
    color: '#10B981',
  },
  progressContainer: {
    marginBottom: m(16),
  },
  progressBar: {
    height: m(8),
    backgroundColor: '#E5E7EB',
    borderRadius: m(4),
    overflow: 'hidden',
    marginBottom: m(8),
  },
  progressFill: {
    height: '100%',
    borderRadius: m(4),
    backgroundColor: '#3B82F6',
  },
  progressText: {
    fontSize: m(12),
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  closedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: m(8),
    padding: m(12),
    gap: m(8),
    marginTop: m(8),
  },
  closedBadgeText: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#10B981',
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: m(8),
    padding: m(12),
    gap: m(8),
    marginTop: m(8),
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  overdueBadgeText: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#DC2626',
    flex: 1,
  },
  
  // Pending Confirmations Card
  pendingConfirmationsCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: m(16),
    padding: m(20),
    marginBottom: m(16),
    borderWidth: 2,
    borderColor: '#F59E0B',
    elevation: 2,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  pendingConfirmationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(12),
  },
  pendingConfirmationsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    flex: 1,
  },
  pendingConfirmationsTitle: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#111827',
  },
  pendingBadge: {
    backgroundColor: '#EF4444',
    borderRadius: m(12),
    minWidth: m(24),
    height: m(24),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: m(8),
  },
  pendingBadgeText: {
    color: '#FFFFFF',
    fontSize: m(12),
    fontWeight: '700',
  },
  pendingConfirmationsMessage: {
    fontSize: m(14),
    color: '#92400E',
    marginBottom: m(16),
    lineHeight: m(20),
  },
  pendingPaymentItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(12),
    padding: m(16),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingPaymentInfo: {
    marginBottom: m(12),
  },
  pendingPaymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(8),
  },
  pendingPaymentAmount: {
    fontSize: m(20),
    fontWeight: '700',
    color: '#111827',
  },
  pendingPaymentTypeBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(8),
  },
  pendingPaymentTypeText: {
    fontSize: m(10),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pendingPaymentDetails: {
    fontSize: m(14),
    color: '#6B7280',
    marginBottom: m(4),
  },
  pendingPaymentDate: {
    fontSize: m(12),
    color: '#6B7280',
    marginBottom: m(4),
  },
  pendingPaymentTxnId: {
    fontSize: m(12),
    color: '#3B82F6',
    fontFamily: 'monospace',
    marginBottom: m(4),
  },
  pendingPaymentNotes: {
    fontSize: m(12),
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: m(4),
  },
  pendingPaymentProof: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: m(8),
    padding: m(10),
    marginBottom: m(12),
    gap: m(8),
  },
  pendingPaymentProofText: {
    flex: 1,
    fontSize: m(14),
    color: '#3B82F6',
    fontWeight: '500',
  },
  pendingPaymentActions: {
    flexDirection: 'row',
    gap: m(12),
  },
  pendingActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: m(12),
    borderRadius: m(8),
    gap: m(6),
  },
  rejectPendingButton: {
    backgroundColor: '#EF4444',
  },
  confirmPendingButton: {
    backgroundColor: '#10B981',
  },
  pendingActionButtonText: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Modal Styles
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
  
  // Loading Card
  loadingCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: m(12),
    padding: m(16),
    marginBottom: m(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(12),
  },
  loadingText: {
    fontSize: m(14),
    color: '#92400E',
  },
  
  // No Pending Card
  noPendingCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: m(12),
    padding: m(24),
    marginBottom: m(16),
    alignItems: 'center',
  },
  noPendingText: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#111827',
    marginTop: m(12),
    marginBottom: m(4),
  },
  noPendingSubtext: {
    fontSize: m(14),
    color: '#6B7280',
    textAlign: 'center',
  },
});