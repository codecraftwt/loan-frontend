import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import moment from 'moment';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import Toast from 'react-native-toast-message';
import borrowerLoanAPI from '../../../Services/borrowerLoanService';
import { useSelector } from 'react-redux';

export default function PaymentHistory() {
  const navigation = useNavigation();
  const route = useRoute();
  const { loan, paymentHistory: initialPaymentHistory } = route.params;
  const user = useSelector(state => state.auth.user);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState(initialPaymentHistory || []);
  const [loanSummary, setLoanSummary] = useState(null);
  const [installmentDetails, setInstallmentDetails] = useState(null);
  const [paymentStats, setPaymentStats] = useState({
    totalPayments: 0,
    confirmedPayments: 0,
    pendingPayments: 0,
    pendingAmount: 0,
  });

  useEffect(() => {
    if (!initialPaymentHistory) {
      fetchPaymentHistory();
    } else {
      // If initial data is provided, we still need to fetch full details
      fetchPaymentHistory();
    }
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      
      // Validate loan ID
      if (!loan?._id) {
        throw new Error('Loan ID is required');
      }
      
      // Get borrower ID from user or loan object
      const borrowerId = user?._id || loan.borrowerId || loan.borrower?._id;
      if (!borrowerId) {
        throw new Error('Borrower ID is required');
      }
      
      const response = await borrowerLoanAPI.getPaymentHistory(loan._id, borrowerId);
      
      // Service returns the data object directly: { loanId, loanSummary, installmentDetails, payments, paymentStats, lenderInfo }
      const data = response || {};
      
      // Extract payments array
      setPaymentHistory(data.payments || []);
      
      // Extract paymentStats object
      setPaymentStats(data.paymentStats || {
        totalPayments: 0,
        confirmedPayments: 0,
        pendingPayments: 0,
        pendingAmount: 0,
      });
      
      // Extract loanSummary object
      setLoanSummary(data.loanSummary || null);
      
      // Extract installmentDetails (null for one-time loans)
      setInstallmentDetails(data.installmentDetails || null);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        loanId: loan?._id,
      });
      
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
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPaymentHistory();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'rejected': return '#EF4444';
       case 'part paid': return '#F59E0B';
       case 'paid': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'check-circle';
      case 'pending': return 'clock';
      case 'rejected': return 'x-circle';
       case 'part paid': return 'clock';
       case 'paid': return 'check-circle';
      default: return 'circle';
    }
  };

  const formatCurrency = (amount) => {
    // Ensure amount is a number before formatting to avoid string concatenation
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    return `₹${numAmount.toLocaleString('en-IN')}`;
  };

  const calculateProgress = () => {
    if (!loanSummary || loanSummary.totalLoanAmount === 0) return 0;
    return (loanSummary.totalPaid / loanSummary.totalLoanAmount) * 100;
  };

  const renderPaymentItem = ({ item, index }) => {
    const statusColor = getStatusColor(item.paymentStatus);
    const statusIcon = getStatusIcon(item.paymentStatus);
    
    return (
      <View style={styles.paymentCard}>
        <View style={styles.paymentCardHeader}>
          <View style={styles.paymentLeftSection}>
            <View style={[styles.paymentIconContainer, { backgroundColor: statusColor + '15' }]}>
              <Icon name={item.paymentMode === 'online' ? 'credit-card' : 'dollar-sign'} size={20} color={statusColor} />
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentAmount}>{formatCurrency(item.amount)}</Text>
              <View style={styles.paymentMetaRow}>
                <View style={styles.paymentModeBadge}>
                  <Text style={styles.paymentModeText}>
                    {item.paymentMode?.charAt(0).toUpperCase() + item.paymentMode?.slice(1) || 'N/A'}
                  </Text>
                </View>
                {item.installmentNumber && (
                  <>
                    <View style={styles.metaDivider} />
                    <Text style={styles.installmentNumberText}>
                      Installment #{item.installmentNumber}
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Icon name={statusIcon} size={14} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.paymentStatus?.charAt(0).toUpperCase() + item.paymentStatus?.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.paymentCardBody}>
          <View style={styles.paymentDetailRow}>
            <Icon name="calendar" size={14} color="#6B7280" />
            <Text style={styles.detailText}>
              {moment(item.paymentDate).format('DD MMM YYYY, hh:mm A')}
            </Text>
          </View>

          {item.confirmedAt && (
            <View style={styles.paymentDetailRow}>
              <Icon name="check-circle" size={14} color="#10B981" />
              <Text style={styles.confirmedText}>
                Confirmed on {moment(item.confirmedAt).format('DD MMM YYYY, hh:mm A')}
              </Text>
            </View>
          )}

          {item.paymentStatus === 'rejected' && (
            <View style={styles.paymentDetailRow}>
              <Icon name="x-circle" size={14} color="#EF4444" />
              <Text style={styles.rejectedText}>
                Payment was rejected
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderLoanHeader = () => {
    if (!loanSummary) return null;
    
    const progress = calculateProgress();
    
    return (
      <View style={styles.loanHeader}>
        <View style={styles.loanHeaderTop}>
          <View>
            <Text style={styles.lenderName}>{loan.lenderId?.userName || 'Unknown Lender'}</Text>
            <Text style={styles.loanType}>
              {loanSummary.paymentType === 'installment' ? 'Installment Loan' : 'One-time Payment'}
            </Text>
          </View>
          <View style={[styles.loanStatusBadge, { backgroundColor: getStatusColor(loanSummary.paymentStatus) + '20' }]}>
            <Icon name={getStatusIcon(loanSummary.paymentStatus)} size={14} color={getStatusColor(loanSummary.paymentStatus)} />
            <Text style={[styles.loanStatusText, { color: getStatusColor(loanSummary.paymentStatus) }]}>
              {loanSummary.paymentStatus?.charAt(0).toUpperCase() + loanSummary.paymentStatus?.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.loanAmountSection}>
          <View style={styles.loanAmountRow}>
            <View style={styles.amountBlock}>
              <Text style={styles.amountLabel}>Total Loan</Text>
              <Text style={styles.totalAmount}>{formatCurrency(loanSummary.totalLoanAmount)}</Text>
            </View>
            <View style={styles.amountDivider} />
            <View style={styles.amountBlock}>
              <Text style={styles.amountLabel}>Paid</Text>
              <Text style={[styles.paidAmount, { color: '#10B981' }]}>
                {formatCurrency(loanSummary.totalPaid)}
              </Text>
            </View>
            <View style={styles.amountDivider} />
            <View style={styles.amountBlock}>
              <Text style={styles.amountLabel}>Remaining</Text>
              <Text style={[styles.remainingAmount, { color: '#EF4444' }]}>
                {formatCurrency(loanSummary.remainingAmount)}
              </Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: '#10B981' }]} />
            </View>
            <Text style={styles.progressText}>{progress.toFixed(1)}% Paid</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderStatsCard = () => (
    <View style={styles.statsCard}>
      <View style={styles.statsHeader}>
        <Icon name="bar-chart-2" size={20} color="#3B82F6" />
        <Text style={styles.statsTitle}>Payment Statistics</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: '#EFF6FF' }]}>
            <Icon name="list" size={18} color="#3B82F6" />
          </View>
          <Text style={styles.statValue}>{paymentStats.totalPayments}</Text>
          <Text style={styles.statLabel}>Total Payments</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: '#D1FAE5' }]}>
            <Icon name="check-circle" size={18} color="#10B981" />
          </View>
          <Text style={[styles.statValue, { color: '#10B981' }]}>{paymentStats.confirmedPayments}</Text>
          <Text style={styles.statLabel}>Confirmed</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: '#FEF3C7' }]}>
            <Icon name="clock" size={18} color="#F59E0B" />
          </View>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>{paymentStats.pendingPayments}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {paymentStats.pendingAmount > 0 && (
        <View style={styles.pendingAmountCard}>
          <View style={styles.pendingAmountHeader}>
            <Icon name="alert-circle" size={16} color="#F59E0B" />
            <Text style={styles.pendingAmountLabel}>Pending Amount</Text>
          </View>
          <Text style={styles.pendingAmountValue}>{formatCurrency(paymentStats.pendingAmount)}</Text>
        </View>
      )}

      {installmentDetails && (
        <View style={styles.installmentCard}>
          <View style={styles.installmentHeader}>
            <Icon name="repeat" size={18} color="#6366F1" />
            <Text style={styles.installmentTitle}>Installment Details</Text>
          </View>
          <View style={styles.installmentInfo}>
            <View style={styles.installmentRow}>
              <View style={styles.installmentIconWrapper}>
                <Icon name="check-circle" size={16} color="#10B981" />
              </View>
              <Text style={styles.installmentText}>
                <Text style={styles.installmentBold}>{installmentDetails.totalInstallmentsPaid}</Text> Installment{installmentDetails.totalInstallmentsPaid !== 1 ? 's' : ''} Paid
              </Text>
            </View>
            {installmentDetails.nextDueDate && (
              <View style={styles.installmentRow}>
                <View style={styles.installmentIconWrapper}>
                  <Icon name="calendar" size={16} color="#3B82F6" />
                </View>
                <Text style={styles.installmentText}>
                  Next Due: <Text style={styles.installmentBold}>{moment(installmentDetails.nextDueDate).format('DD MMM YYYY')}</Text>
                </Text>
              </View>
            )}
            {installmentDetails.frequency && (
              <View style={styles.installmentRow}>
                <View style={styles.installmentIconWrapper}>
                  <Icon name="refresh-cw" size={16} color="#6B7280" />
                </View>
                <Text style={styles.installmentText}>
                  Frequency: <Text style={styles.installmentBold}>{installmentDetails.frequency.charAt(0).toUpperCase() + installmentDetails.frequency.slice(1)}</Text>
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="receipt-outline" size={72} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>No Payment History</Text>
      <Text style={styles.emptySubtitle}>
        You haven't made any payments for this loan yet.{'\n'}Start by making your first payment.
      </Text>
      <TouchableOpacity
        style={styles.makePaymentButton}
        onPress={() => navigation.navigate('MakePayment', { loan })}
      >
        <Ionicons name="cash-outline" size={20} color="#FFFFFF" />
        <Text style={styles.makePaymentButtonText}>Make First Payment</Text>
      </TouchableOpacity>
    </View>
  );

  // Unused loading state (commented out)
  // if (false) {
  //   return (
  //     <View style={styles.container}>
  //       <Header title="Payment History" showBackButton />
  //       <View style={styles.loadingContainer}>
  //         <ActivityIndicator size="large" color="#3B82F6" />
  //         <Text style={styles.loadingText}>Loading payment history...</Text>
  //       </View>
  //     </View>
  //   );
  // }

  return (
    <View style={styles.container}>
      <Header title="Payment History" showBackButton />
      
      <FlatList
        data={paymentHistory}
        renderItem={renderPaymentItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <>
            {renderLoanHeader()}
            {renderStatsCard()}
            <View style={styles.paymentsHeader}>
              <Icon name="clock" size={20} color="#111827" />
              <Text style={styles.paymentsTitle}>Payment History</Text>
              <Text style={styles.paymentsCount}>({paymentHistory.length})</Text>
            </View>
          </>
        }
        ListEmptyComponent={renderEmptyState}
      />
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
    fontWeight: '500',
  },
  listContainer: {
    padding: m(16),
    paddingBottom: m(100),
  },
  // Loan Header
  loanHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(20),
    padding: m(20),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  loanHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: m(20),
  },
  lenderName: {
    fontSize: m(20),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(4),
  },
  loanType: {
    fontSize: m(13),
    color: '#6B7280',
    fontWeight: '500',
  },
  loanStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(20),
    gap: m(6),
  },
  loanStatusText: {
    fontSize: m(12),
    fontWeight: '600',
  },
  loanAmountSection: {
    marginTop: m(4),
  },
  loanAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(16),
  },
  amountBlock: {
    flex: 1,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: m(12),
    color: '#6B7280',
    marginBottom: m(6),
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#111827',
  },
  paidAmount: {
    fontSize: m(18),
    fontWeight: '700',
  },
  remainingAmount: {
    fontSize: m(18),
    fontWeight: '700',
  },
  amountDivider: {
    width: 1,
    height: m(40),
    backgroundColor: '#E5E7EB',
    marginHorizontal: m(8),
  },
  progressContainer: {
    marginTop: m(8),
  },
  progressBar: {
    height: m(8),
    backgroundColor: '#E5E7EB',
    borderRadius: m(10),
    overflow: 'hidden',
    marginBottom: m(8),
  },
  progressFill: {
    height: '100%',
    borderRadius: m(10),
  },
  progressText: {
    fontSize: m(12),
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  // Stats Card
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(20),
    padding: m(20),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(20),
    gap: m(10),
  },
  statsTitle: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#111827',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: m(16),
    gap: m(12),
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: m(16),
    padding: m(16),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statIconContainer: {
    width: m(40),
    height: m(40),
    borderRadius: m(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(10),
  },
  statValue: {
    fontSize: m(20),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(4),
  },
  statLabel: {
    fontSize: m(11),
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  pendingAmountCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: m(12),
    padding: m(16),
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: m(12),
  },
  pendingAmountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(8),
    gap: m(8),
  },
  pendingAmountLabel: {
    fontSize: m(13),
    color: '#92400E',
    fontWeight: '600',
  },
  pendingAmountValue: {
    fontSize: m(20),
    fontWeight: '700',
    color: '#F59E0B',
  },
  installmentCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: m(16),
    padding: m(16),
    marginTop: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  installmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(14),
    gap: m(10),
  },
  installmentTitle: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#111827',
  },
  installmentInfo: {
    gap: m(12),
  },
  installmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(12),
  },
  installmentIconWrapper: {
    width: m(28),
    height: m(28),
    borderRadius: m(14),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  installmentText: {
    fontSize: m(14),
    color: '#374151',
    flex: 1,
  },
  installmentBold: {
    fontWeight: '600',
    color: '#111827',
  },
  // Payments Header
  paymentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(16),
    marginTop: m(8),
    gap: m(10),
  },
  paymentsTitle: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  paymentsCount: {
    fontSize: m(14),
    color: '#6B7280',
    fontWeight: '500',
  },
  // Payment Card
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    padding: m(18),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  paymentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: m(14),
  },
  paymentLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: m(12),
  },
  paymentIconContainer: {
    width: m(48),
    height: m(48),
    borderRadius: m(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: m(22),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(6),
  },
  paymentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
  },
  paymentModeBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: m(10),
    paddingVertical: m(4),
    borderRadius: m(8),
  },
  paymentModeText: {
    fontSize: m(12),
    color: '#374151',
    fontWeight: '600',
  },
  metaDivider: {
    width: 1,
    height: m(12),
    backgroundColor: '#D1D5DB',
  },
  installmentNumberText: {
    fontSize: m(12),
    color: '#6B7280',
    fontWeight: '500',
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
  paymentCardBody: {
    paddingTop: m(14),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: m(10),
  },
  paymentDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(10),
  },
  detailText: {
    fontSize: m(13),
    color: '#6B7280',
    flex: 1,
  },
  confirmedText: {
    fontSize: m(13),
    color: '#10B981',
    fontWeight: '500',
    flex: 1,
  },
  rejectedText: {
    fontSize: m(13),
    color: '#EF4444',
    fontWeight: '500',
    flex: 1,
  },
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: m(40),
    minHeight: m(400),
  },
  emptyIconContainer: {
    width: m(120),
    height: m(120),
    borderRadius: m(60),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(24),
  },
  emptyTitle: {
    fontSize: m(20),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(12),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: m(15),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: m(22),
    marginBottom: m(32),
  },
  makePaymentButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(28),
    paddingVertical: m(14),
    borderRadius: m(14),
    gap: m(8),
    elevation: 2,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  makePaymentButtonText: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
