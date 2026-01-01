import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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

export default function BorrowerLoanDetails() {
  const navigation = useNavigation();
  const route = useRoute();
  const { loan } = route.params;
  const user = useSelector(state => state.auth.user);

  const [loanDetails, setLoanDetails] = useState(loan);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [installmentDetails, setInstallmentDetails] = useState(null);
  const [hasPendingPayment, setHasPendingPayment] = useState(false);
  // const [loanStats, setLoanStats] = useState({
  //   totalPaid: loan.totalPaid || 0,
  //   remainingAmount: loan.remainingAmount || loan.amount || 0,
  // });

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  // Refresh payment history when screen is focused (e.g., returning from payment screen)
  useFocusEffect(
    React.useCallback(() => {
      fetchPaymentHistory();
    }, [loan._id])
  );

  const fetchPaymentHistory = async () => {
    try {
      // Fetch payment history for this loan
      const borrowerId = user?._id || loan.borrowerId || loan.borrower?._id;
      const response = await borrowerLoanAPI.getPaymentHistory(loan._id, borrowerId);
      const paymentData = response.data || {};
      
      // New API structure: payments array (renamed from paymentHistory.allPayments)
      const payments = paymentData.payments || [];
      setPaymentHistory(payments);
      
      // Check for pending payments
      const pending = payments.find(
        payment => payment.paymentStatus?.toLowerCase() === 'pending'
      );
      setHasPendingPayment(!!pending);
      
      // New API structure: installmentDetails (null for one-time loans)
      setInstallmentDetails(paymentData.installmentDetails || null);
      
      // Update loan details with latest totals from API (new structure: loanSummary)
      if (paymentData.loanSummary) {
        setLoanDetails(prev => ({
          ...prev,
          // Ensure amounts are numbers, not strings
          totalPaid: typeof paymentData.loanSummary.totalPaid === 'number' 
            ? paymentData.loanSummary.totalPaid 
            : parseFloat(paymentData.loanSummary.totalPaid) || 0,
          remainingAmount: typeof paymentData.loanSummary.remainingAmount === 'number'
            ? paymentData.loanSummary.remainingAmount
            : parseFloat(paymentData.loanSummary.remainingAmount) || 0,
          paymentStatus: paymentData.loanSummary.paymentStatus,
          paymentType: paymentData.loanSummary.paymentType,
        }));
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: error.response?.data?.message || error.message || 'Failed to fetch payment history',
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return '#10B981';
      case 'part paid': return '#F59E0B';
      case 'pending': return '#6B7280';
      case 'confirmed': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'overdue': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'check-circle';
      case 'part paid': return 'clock';
      case 'pending': return 'clock';
      case 'confirmed': return 'check-circle';
      case 'rejected': return 'x-circle';
      case 'overdue': return 'x-circle';
      default: return 'circle';
    }
  };

  const formatCurrency = (amount) => {
    // Ensure amount is a number before formatting to avoid string concatenation
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    return `₹${numAmount.toLocaleString('en-IN')}`;
  };

  const calculateProgress = () => {
    // Ensure amounts are numbers, not strings
    const totalAmount = typeof loanDetails.amount === 'number' 
      ? loanDetails.amount 
      : parseFloat(loanDetails.amount) || 0;
    const totalPaid = typeof loanDetails.totalPaid === 'number'
      ? loanDetails.totalPaid
      : parseFloat(loanDetails.totalPaid) || 0;
    return totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
  };

  // const isLoanActive = () => {
  //   // Check if loan is paid
  //   if (loanDetails.paymentStatus === 'paid') return false;
    
  //   // Check if remaining amount is greater than 0
  //   if (loanDetails.remainingAmount <= 0) return false;
    
  //   // Check if loan end date has passed
  //   if (loanDetails.loanEndDate) {
  //     const endDate = moment(loanDetails.loanEndDate);
  //     const today = moment();
  //     if (endDate.isBefore(today, 'day')) {
  //       return false; // Loan has expired
  //     }
  //   }
    
  //   return true;
  // };

  const isLoanExpired = () => {
    if (!loanDetails.loanEndDate) return false;
    const endDate = moment(loanDetails.loanEndDate);
    const today = moment();
    return endDate.isBefore(today, 'day');
  };

  const handleMakePayment = () => {
    navigation.navigate('MakePayment', { loan: loanDetails });
  };

  const handleViewPaymentHistory = () => {
    navigation.navigate('PaymentHistory', { loan: loanDetails, paymentHistory });
  };

  const DetailItem = ({ icon, label, value, isStatus = false }) => (
    <View style={styles.detailItem}>
      <View style={styles.detailIconContainer}>
        <Icon name={icon} size={20} color="#3B82F6" />
      </View>
      <View style={styles.detailContent}>
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
        <View style={styles.paymentAmount}>
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
        {/* {item.notes && (
          <Text style={styles.paymentNotes}>
            Note: {item.notes}
          </Text>
        )} */}
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
                    {installmentDetails.totalInstallmentsPaid} Installment{installmentDetails.totalInstallmentsPaid !== 1 ? 's' : ''}
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
              disabled={hasPendingPayment || isLoanExpired()}>
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
            onPress={handleViewPaymentHistory}>
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
  detailContent: {
    flex: 1,
  },
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
  paymentAmount: {
    flex: 1,
  },
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
  rejectedDate: {
    fontSize: m(12),
    color: '#EF4444',
    marginTop: m(4),
  },
  paymentNotes: {
    fontSize: m(12),
    color: '#6B7280',
    marginTop: m(4),
    fontStyle: 'italic',
  },
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
  footer: {
    alignItems: 'center',
    padding: m(16),
  },
  footerText: {
    fontSize: m(12),
    color: '#9CA3AF',
  },
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
});

