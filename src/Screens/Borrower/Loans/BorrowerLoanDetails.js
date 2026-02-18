import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import moment from 'moment';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import borrowerLoanAPI from '../../../Services/borrowerLoanService';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { baseurl } from '../../../Utils/API';

export default function BorrowerLoanDetails() {
  // Navigation & Route
  const navigation = useNavigation();
  const route = useRoute();
  const { loan } = route.params;
  const user = useSelector(state => state.auth.user);

  // State Management
  const [loanDetails, setLoanDetails] = useState(loan);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [installmentDetails, setInstallmentDetails] = useState(null);
  const [hasPendingPayment, setHasPendingPayment] = useState(false);
  const [proofViewerVisible, setProofViewerVisible] = useState(false);
  const [selectedProofUrl, setSelectedProofUrl] = useState(null);

  // Effects
  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchPaymentHistory();
    }, [loan._id])
  );

  // API Functions
  const fetchPaymentHistory = async () => {
    try {
      if (!loan?._id) {
        throw new Error('Loan ID is required');
      }
      
      const borrowerId = user?._id || loan.borrowerId || loan.borrower?._id;
      if (!borrowerId) {
        throw new Error('Borrower ID is required');
      }
      
      const response = await borrowerLoanAPI.getPaymentHistory(loan._id, borrowerId);
      const paymentData = response || {};
      
      // Extract payments array - API returns payments in paymentHistory.allPayments
      const payments = paymentData.paymentHistory?.allPayments || paymentData.payments || [];
      setPaymentHistory(payments);
      
      // Check for pending payments
      const pending = payments.find(
        payment => payment.paymentStatus?.toLowerCase() === 'pending'
      );
      setHasPendingPayment(!!pending);
      
      // Extract installmentDetails (null for one-time loans)
      setInstallmentDetails(paymentData.installmentDetails || null);
      
      // Calculate totalPaid from confirmed payments if loanSummary doesn't have it
      let calculatedTotalPaid = 0;
      if (payments.length > 0) {
        calculatedTotalPaid = payments
          .filter(p => p.paymentStatus?.toLowerCase() === 'confirmed' || p.paymentStatus?.toLowerCase() === 'paid')
          .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      }
      
      // Update loan details with latest totals from API (loanSummary structure)
      if (paymentData.loanSummary) {
        const loanSummary = paymentData.loanSummary;
        
        // Try multiple possible field names for totalPaid - API uses totalPaidAmount
        const totalPaidValue = 
          loanSummary.totalPaidAmount ??
          loanSummary.totalPaid ?? 
          loanSummary.currentPaidAmount ?? 
          loanSummary.paidAmount ?? 
          calculatedTotalPaid;
        
        // Try multiple possible field names for remainingAmount
        const remainingAmountValue = 
          loanSummary.remainingAmount ?? 
          loanSummary.currentRemainingAmount ?? 
          loanSummary.remaining ?? 
          (typeof loanDetails.amount === 'number' ? loanDetails.amount : parseFloat(loanDetails.amount) || 0) - totalPaidValue;
        
        setLoanDetails(prev => ({
          ...prev,
          totalPaid: typeof totalPaidValue === 'number' 
            ? totalPaidValue 
            : parseFloat(totalPaidValue) || 0,
          remainingAmount: typeof remainingAmountValue === 'number'
            ? remainingAmountValue
            : parseFloat(remainingAmountValue) || 0,
          paymentStatus: loanSummary.paymentStatus || loanSummary.loanStatus || prev.paymentStatus,
          paymentType: loanSummary.loanType || loanSummary.paymentType || prev.paymentType,
        }));
      } else if (calculatedTotalPaid > 0) {
        // If loanSummary doesn't exist but we have payments, use calculated values
        setLoanDetails(prev => ({
          ...prev,
          totalPaid: calculatedTotalPaid,
          remainingAmount: Math.max(0, (typeof prev.amount === 'number' ? prev.amount : parseFloat(prev.amount) || 0) - calculatedTotalPaid),
        }));
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
      
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || error.message 
        || 'Failed to fetch payment history';
      
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: errorMessage,
      });
    }
  };

  // Utility Functions
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'confirmed': return '#10B981';
      case 'part paid': return '#F59E0B';
      case 'pending': return '#6B7280';
      case 'rejected': return '#EF4444';
      case 'overdue': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'confirmed': return 'check-circle';
      case 'part paid':
      case 'pending': return 'clock';
      case 'rejected':
      case 'overdue': return 'x-circle';
      default: return 'circle';
    }
  };

  const formatCurrency = (amount) => {
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    return `₹${numAmount.toLocaleString('en-IN')}`;
  };

  const calculateProgress = () => {
    const totalAmount = typeof loanDetails.amount === 'number' 
      ? loanDetails.amount 
      : parseFloat(loanDetails.amount) || 0;
    const totalPaid = typeof loanDetails.totalPaid === 'number'
      ? loanDetails.totalPaid
      : parseFloat(loanDetails.totalPaid) || 0;
    return totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
  };

  const isLoanExpired = () => {
    if (!loanDetails.loanEndDate) return false;
    const endDate = moment(loanDetails.loanEndDate);
    const today = moment();
    return endDate.isBefore(today, 'day');
  };

  // Get proof URL - Cloudinary URLs are already full URLs
  const getProofUrl = (proof) => {
    if (!proof) return null;
    
    // If it's already a full URL (starts with http:// or https://), return as is
    if (proof.startsWith('http://') || proof.startsWith('https://')) {
      return proof;
    }
    
    // If it's a relative path, construct full URL (unlikely for Cloudinary, but handle it)
    let baseUrl = baseurl.replace('/api', '').replace(/\/$/, '');
    
    let proofPath = proof;
    if (proofPath.startsWith('/')) {
      proofPath = proofPath.substring(1);
    }
    
    const fullUrl = `${baseUrl}/${proofPath}`;
    return fullUrl;
  };

  // Handle viewing loan proof
  const handleViewProof = () => {
    const proofUrl = getProofUrl(loanDetails.proof);
    if (proofUrl) {
      setSelectedProofUrl(proofUrl);
      setProofViewerVisible(true);
    } else {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: 'Loan proof image not available',
      });
    }
  };

  // Navigation Handlers
  const handleMakePayment = () => {
    navigation.navigate('MakePayment', { loan: loanDetails });
  };

  const handleViewPaymentHistory = () => {
    navigation.navigate('PaymentHistory', { loan: loanDetails, paymentHistory });
  };

  // Render Components
  const DetailItem = ({ icon, label, value, isStatus = false }) => (
    <View style={styles.detailItem}>
      <View style={styles.detailIconContainer}>
        <Icon name={icon} size={20} color="#3B82F6" />
      </View>
      <View style={styles.lenderDetails}>
        <Text style={styles.detailLabel}>{label}</Text>
        {isStatus ? (
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(value) + '20' }]}>
            <Icon name={getStatusIcon(value)} size={14} color={getStatusColor(value)} />
            <Text style={[styles.statusText, { color: getStatusColor(value) }]}>
              {value?.charAt(0).toUpperCase() + value?.slice(1)}
            </Text>
          </View>
        ) : (
          <Text style={styles.detailValue}>{value}</Text>
        )}
      </View>
    </View>
  );

  const PaymentHistoryItem = ({ item }) => (
    <View style={styles.paymentHistoryItem}>
      <View style={styles.paymentHeader}>
        <View style={styles.lenderDetails}>
          <Text style={styles.paymentAmountText}>{formatCurrency(item.amount)}</Text>
          <Text style={styles.paymentMode}>
            {item.paymentMode?.charAt(0).toUpperCase() + item.paymentMode?.slice(1) || 'N/A'}
            {item.installmentLabel && ` • ${item.installmentLabel}`}
            {!item.installmentLabel && item.installmentNumber && ` • Installment ${item.installmentNumber}`}
          </Text>
        </View>
        <View style={[styles.paymentStatusBadge, { backgroundColor: getStatusColor(item.paymentStatus) + '20' }]}>
          <Icon name={getStatusIcon(item.paymentStatus)} size={12} color={getStatusColor(item.paymentStatus)} />
          <Text style={[styles.paymentStatusText, { color: getStatusColor(item.paymentStatus) }]}>
            {item.paymentStatus?.charAt(0).toUpperCase() + item.paymentStatus?.slice(1)}
          </Text>
        </View>
      </View>
      <View style={styles.paymentDetails}>
        <Text style={styles.paymentDate}>
          {moment(item.paymentDate).format('DD MMM YYYY, hh:mm A')}
        </Text>
        {item.confirmedAt && (
          <Text style={styles.confirmedDate}>
            Confirmed: {moment(item.confirmedAt).format('DD MMM YYYY, hh:mm A')}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Loan Details" showBackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Loan Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <Text style={styles.overviewTitle}>Loan Overview</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(loanDetails.paymentStatus) + '20' }]}>
              <Icon name={getStatusIcon(loanDetails.paymentStatus)} size={16} color={getStatusColor(loanDetails.paymentStatus)} />
              <Text style={[styles.statusText, { color: getStatusColor(loanDetails.paymentStatus) }]}>
                {loanDetails.paymentStatus?.charAt(0).toUpperCase() + loanDetails.paymentStatus?.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.amountOverview}>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Total Amount</Text>
              <Text style={styles.amountValue}>{formatCurrency(loanDetails.amount)}</Text>
            </View>
            <View style={styles.amountDivider} />
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Paid</Text>
              <Text style={[styles.amountValue, { color: '#10B981' }]}>
                {formatCurrency(loanDetails.totalPaid)}
              </Text>
            </View>
            <View style={styles.amountDivider} />
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Remaining</Text>
              <Text style={[styles.amountValue, { color: '#EF4444' }]}>
                {formatCurrency(loanDetails.remainingAmount)}
              </Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${calculateProgress()}%`,
                    backgroundColor: getStatusColor(loanDetails.paymentStatus),
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {calculateProgress().toFixed(1)}% Paid
            </Text>
          </View>
        </View>

        {/* Lender Information */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Lender Information</Text>
          <View style={styles.lenderInfo}>
            <View style={styles.lenderAvatar}>
              <Text style={styles.avatarText}>
                {loanDetails.lenderId?.userName?.charAt(0)?.toUpperCase() || 'L'}
              </Text>
            </View>
            <View style={styles.lenderDetails}>
              <Text style={styles.lenderName}>{loanDetails.lenderId?.userName || 'N/A'}</Text>
              <Text style={styles.lenderContact}>{loanDetails.lenderId?.mobileNo || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Loan Details */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Loan Information</Text>
          <View style={styles.detailsGrid}>
            <DetailItem
              icon="dollar-sign"
              label="Loan Amount"
              value={formatCurrency(loanDetails.amount)}
            />
            <DetailItem
              icon="check-circle"
              label="Total Paid"
              value={formatCurrency(loanDetails.totalPaid)}
            />
            <DetailItem
              icon="clock"
              label="Remaining Amount"
              value={formatCurrency(loanDetails.remainingAmount)}
            />
            <DetailItem
              icon="calendar"
              label="End Date"
              value={loanDetails.loanEndDate ? moment(loanDetails.loanEndDate).format('DD MMM YYYY') : 'N/A'}
            />
            <DetailItem
              icon="credit-card"
              label="Payment Status"
              value={loanDetails.paymentStatus}
              isStatus
            />
            {loanDetails.paymentType && (
              <DetailItem
                icon="repeat"
                label="Payment Type"
                value={loanDetails.paymentType === 'installment' ? 'Installment' : 'One-time'}
              />
            )}
          </View>
        </View>

        {/* Loan Proof Section - Only show if proof exists */}
        {loanDetails.proof && (
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Loan Proof</Text>
            <TouchableOpacity
              style={styles.proofCard}
              onPress={handleViewProof}
              activeOpacity={0.8}>
              <View style={styles.proofIconContainer}>
                <Icon name="file-image" size={24} color="#3B82F6" />
              </View>
              <View style={styles.lenderDetails}>
                <Text style={styles.proofTitle}>Loan Proof Available</Text>
                <Text style={styles.proofSubtext}>Tap to view proof document</Text>
              </View>
              <Icon name="chevron-right" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        )}

        {/* Installment Details */}
        {installmentDetails && (
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Installment Details</Text>
            <View style={styles.installmentContainer}>
              <View style={styles.installmentRow}>
                <Icon name="check-circle" size={20} color="#10B981" />
                <View style={styles.installmentContent}>
                  <Text style={styles.installmentLabel}>Installments Paid</Text>
                  <Text style={styles.installmentValue}>
                    {installmentDetails.paidInstallments ?? installmentDetails.totalInstallmentsPaid ?? 0} Installment{(installmentDetails.paidInstallments ?? installmentDetails.totalInstallmentsPaid ?? 0) !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              {installmentDetails.nextDueDate && (
                <View style={styles.installmentRow}>
                  <Icon name="calendar" size={20} color="#3B82F6" />
                  <View style={styles.installmentContent}>
                    <Text style={styles.installmentLabel}>Next Due Date</Text>
                    <Text style={styles.installmentValue}>
                      {moment(installmentDetails.nextDueDate).format('DD MMM YYYY')}
                    </Text>
                  </View>
                </View>
              )}
              {installmentDetails.frequency && (
                <View style={styles.installmentRow}>
                  <Icon name="repeat" size={20} color="#6B7280" />
                  <View style={styles.installmentContent}>
                    <Text style={styles.installmentLabel}>Frequency</Text>
                    <Text style={styles.installmentValue}>
                      {installmentDetails.frequency.charAt(0).toUpperCase() + installmentDetails.frequency.slice(1)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Recent Payments */}
        {paymentHistory.length > 0 && (
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Recent Payments</Text>
              <TouchableOpacity onPress={handleViewPaymentHistory}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            {paymentHistory.slice(0, 3).map((payment) => (
              <PaymentHistoryItem key={payment._id} item={payment} />
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {loanDetails.paymentStatus !== 'paid' && loanDetails.remainingAmount > 0 && (
            <TouchableOpacity
              style={[
                styles.actionButton, 
                styles.primaryButton,
                (hasPendingPayment || isLoanExpired()) && styles.disabledButton
              ]}
              onPress={handleMakePayment}
              disabled={hasPendingPayment || isLoanExpired()}
            >
              <Ionicons name="cash-outline" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>
                {isLoanExpired() 
                  ? 'Loan Expired' 
                  : hasPendingPayment 
                    ? 'Payment Pending' 
                    : 'Make Payment'}
              </Text>
            </TouchableOpacity>
          )}
          {hasPendingPayment && (
            <View style={styles.pendingPaymentBanner}>
              <Icon name="clock" size={16} color="#92400E" />
              <Text style={styles.pendingPaymentBannerText}>
                You have a pending payment. Please wait for lender confirmation.
              </Text>
            </View>
          )}
          {isLoanExpired() && !hasPendingPayment && (
            <View style={styles.expiredLoanBanner}>
              <Icon name="alert-circle" size={16} color="#DC2626" />
              <Text style={styles.expiredLoanBannerText}>
                The loan end date has passed. Please contact your lender to extend the loan before making a payment.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleViewPaymentHistory}
          >
            <Icon name="clock" size={20} color="#3B82F6" />
            <Text style={styles.secondaryButtonText}>Payment History</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Loan created {moment(loanDetails.createdAt).fromNow()}
          </Text>
        </View>
      </ScrollView>

      {/* Loan Proof Image Viewer */}
      <Modal
        visible={proofViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setProofViewerVisible(false);
          setSelectedProofUrl(null);
        }}>
        <View style={styles.proofViewerOverlay}>
          <View style={styles.proofViewerHeader}>
            <Text style={styles.proofViewerHeaderText}>Loan Proof</Text>
            <TouchableOpacity
              onPress={() => {
                setProofViewerVisible(false);
                setSelectedProofUrl(null);
              }}
              style={styles.proofViewerCloseButton}>
              <Icon name="x" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <ScrollView
            contentContainerStyle={styles.proofViewerScrollContent}
            maximumZoomScale={3}
            minimumZoomScale={1}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}>
            {selectedProofUrl && (
              <Image
                source={{ uri: selectedProofUrl }}
                style={styles.proofViewerImage}
                resizeMode="contain"
                onError={(error) => {
                  console.error('Image load error:', error);
                  console.error('Failed URL:', selectedProofUrl);
                  Toast.show({
                    type: 'error',
                    position: 'top',
                    text1: 'Error Loading Image',
                    text2: 'Failed to load loan proof image. Please check the URL.',
                    visibilityTime: 4000,
                  });
                }}
              />
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Container
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
  
  // Overview Card
  overviewCard: {
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
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(20),
  },
  overviewTitle: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(20),
    gap: m(6),
  },
  statusText: {
    fontSize: m(12),
    fontWeight: '600',
  },
  amountOverview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(20),
  },
  amountItem: {
    flex: 1,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: m(12),
    color: '#6B7280',
    marginBottom: m(4),
  },
  amountValue: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#111827',
  },
  amountDivider: {
    width: 1,
    height: m(40),
    backgroundColor: '#E5E7EB',
    marginHorizontal: m(12),
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: m(8),
    backgroundColor: '#E5E7EB',
    borderRadius: m(4),
    marginBottom: m(8),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: m(4),
  },
  progressText: {
    fontSize: m(12),
    color: '#6B7280',
  },
  
  // Info Card
  infoCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(10),
  },
  cardTitle: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(16),
  },
  viewAllText: {
    fontSize: m(14),
    color: '#3B82F6',
    fontWeight: '600',
  },
  
  // Lender Info
  lenderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lenderAvatar: {
    width: m(50),
    height: m(50),
    borderRadius: m(25),
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(16),
  },
  avatarText: {
    fontSize: m(20),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  lenderDetails: {
    flex: 1,
  },
  lenderName: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#111827',
    marginBottom: m(4),
  },
  lenderContact: {
    fontSize: m(14),
    color: '#6B7280',
  },
  
  // Details Grid
  detailsGrid: {
    gap: m(9),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: m(12),
    padding: m(10.2),
  },
  detailIconContainer: {
    width: m(40),
    height: m(40),
    borderRadius: m(10),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(12),
  },
  // detailContent: {
  //   flex: 1,
  // },
  detailLabel: {
    fontSize: m(12),
    color: '#6B7280',
    marginBottom: m(2),
  },
  detailValue: {
    fontSize: m(14),
    fontWeight: '500',
    color: '#374151',
  },
  
  // Payment History Item
  paymentHistoryItem: {
    backgroundColor: '#f2f7fcff',
    borderRadius: m(12),
    padding: m(12),
    marginBottom: m(8),
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: m(8),
  },
  // paymentAmount: {
  //   flex: 1,
  // },
  paymentAmountText: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(2),
  },
  paymentMode: {
    fontSize: m(12),
    color: '#6B7280',
  },
  paymentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(12),
    gap: m(4),
  },
  paymentStatusText: {
    fontSize: m(10),
    fontWeight: '600',
  },
  paymentDetails: {
    gap: m(2),
  },
  paymentDate: {
    fontSize: m(12),
    color: '#6B7280',
  },
  confirmedDate: {
    fontSize: m(12),
    color: '#10B981',
  },
  
  // Installment Details
  installmentContainer: {
    gap: m(16),
  },
  installmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(12),
  },
  installmentContent: {
    flex: 1,
  },
  installmentLabel: {
    fontSize: m(12),
    color: '#6B7280',
    marginBottom: m(4),
  },
  installmentValue: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#111827',
  },
  
  // Actions
  actionsContainer: {
    gap: m(12),
    marginBottom: m(16),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: m(16),
    borderRadius: m(12),
    gap: m(8),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButton: {
    backgroundColor: '#10B981',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  primaryButtonText: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#3B82F6',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  pendingPaymentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: m(12),
    padding: m(12),
    gap: m(8),
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingPaymentBannerText: {
    fontSize: m(14),
    color: '#92400E',
    fontWeight: '500',
    flex: 1,
  },
  expiredLoanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: m(12),
    padding: m(12),
    gap: m(8),
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  expiredLoanBannerText: {
    fontSize: m(14),
    color: '#DC2626',
    fontWeight: '500',
    flex: 1,
  },
  
  // Footer
  footer: {
    alignItems: 'center',
    padding: m(16),
  },
  footerText: {
    fontSize: m(12),
    color: '#9CA3AF',
  },
  
  // Loan Proof Styles
  proofCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: m(12),
    padding: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  proofIconContainer: {
    width: m(48),
    height: m(48),
    borderRadius: m(12),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(12),
  },
  // proofTextContainer: {
  //   flex: 1,
  // },
  proofTitle: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#111827',
    marginBottom: m(4),
  },
  proofSubtext: {
    fontSize: m(14),
    color: '#6B7280',
  },
  
  // Proof Viewer Modal Styles
  proofViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  proofViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: m(16),
    paddingTop: m(40),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  proofViewerHeaderText: {
    fontSize: m(18),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  proofViewerCloseButton: {
    padding: m(8),
  },
  proofViewerScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: m(20),
  },
  proofViewerImage: {
    width: '100%',
    height: m(500),
    borderRadius: m(8),
  },
});