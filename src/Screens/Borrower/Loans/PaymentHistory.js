import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
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

// Constants
const INITIAL_PAYMENT_COUNT = 3;

export default function PaymentHistory() {
  // Navigation & Route
  const navigation = useNavigation();
  const route = useRoute();
  const { loan, paymentHistory: initialPaymentHistory } = route.params;
  const user = useSelector(state => state.auth.user);

  // State Management
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState(initialPaymentHistory || []);
  const [showAllPayments, setShowAllPayments] = useState(false);
  const [loanSummary, setLoanSummary] = useState(null);
  const [installmentDetails, setInstallmentDetails] = useState(null);
  const [paymentStats, setPaymentStats] = useState({
    totalPayments: 0,
    confirmedPayments: 0,
    pendingPayments: 0,
    rejectedPayments: 0,
    pendingAmount: 0,
  });

  // Effects
  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  // API Functions
  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      
      if (!loan?._id) {
        throw new Error('Loan ID is required');
      }
      
      const borrowerId = user?._id || loan.borrowerId || loan.borrower?._id;
      if (!borrowerId) {
        throw new Error('Borrower ID is required');
      }
      
      const response = await borrowerLoanAPI.getPaymentHistory(loan._id, borrowerId);
      const data = response || {};
      
      // Extract payments array - API returns payments in paymentHistory.allPayments
      const payments = data.paymentHistory?.allPayments || data.payments || [];
      setPaymentHistory(payments);
      
      // Extract paymentStats from paymentHistory object
      const paymentHistoryData = data.paymentHistory || {};
      setPaymentStats({
        totalPayments: payments.length,
        confirmedPayments: paymentHistoryData.confirmedPayments || payments.filter(p => p.paymentStatus?.toLowerCase() === 'confirmed').length,
        pendingPayments: paymentHistoryData.pendingPayments || payments.filter(p => p.paymentStatus?.toLowerCase() === 'pending').length,
        rejectedPayments: payments.filter(p => p.paymentStatus?.toLowerCase() === 'rejected').length,
        pendingAmount: paymentHistoryData.pendingAmount || 0,
      });
      
      setLoanSummary(data.loanSummary || null);
      setInstallmentDetails(data.installmentDetails || null);
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
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPaymentHistory();
    setRefreshing(false);
  };

  // Utility Functions
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'paid': return '#10B981';
      case 'pending':
      case 'part paid': return '#F59E0B';
      case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'paid': return 'check-circle';
      case 'pending':
      case 'part paid': return 'clock';
      case 'rejected': return 'x-circle';
      default: return 'circle';
    }
  };

  const formatCurrency = (amount) => {
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    return `₹${numAmount.toLocaleString('en-IN')}`;
  };

  const calculateProgress = () => {
    if (!loanSummary || loanSummary.totalLoanAmount === 0) return 0;
    const totalPaid = loanSummary.totalPaidAmount ?? loanSummary.totalPaid ?? 0;
    return (totalPaid / loanSummary.totalLoanAmount) * 100;
  };

  // Render Functions
  const renderPaymentItem = ({ item }) => {
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
              {loanSummary.loanType === 'installment' || loanSummary.paymentType === 'installment' 
                ? 'Installment Loan' 
                : 'One-time Payment'}
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
                {formatCurrency(loanSummary.totalPaidAmount ?? loanSummary.totalPaid ?? 0)}
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

        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: '#FEE2E2' }]}>
            <Icon name="x-circle" size={18} color="#EF4444" />
          </View>
          <Text style={[styles.statValue, { color: '#EF4444' }]}>{paymentStats.rejectedPayments}</Text>
          <Text style={styles.statLabel}>Rejected</Text>
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

  // Computed Values
  const displayedPayments = showAllPayments 
    ? paymentHistory 
    : paymentHistory.slice(0, INITIAL_PAYMENT_COUNT);
  const hasMorePayments = paymentHistory.length > INITIAL_PAYMENT_COUNT;

  return (
    <View style={styles.container}>
      <Header title="Payment History" showBackButton />
      
      <FlatList
        data={displayedPayments}
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
              <View style={styles.paymentsHeaderLeft}>
                <Icon name="clock" size={20} color="#111827" />
                <Text style={styles.paymentsTitle}>Payment History</Text>
                <Text style={styles.paymentsCount}>({paymentHistory.length})</Text>
              </View>
              {hasMorePayments && (
                <TouchableOpacity
                  style={styles.toggleButtonHeader}
                  onPress={() => setShowAllPayments(!showAllPayments)}
                >
                  <Text style={styles.toggleButtonTextHeader}>
                    {showAllPayments ? 'See Less' : 'See All'}
                  </Text>
                  <Icon 
                    name={showAllPayments ? 'chevron-up' : 'chevron-down'} 
                    size={16} 
                    color="#3B82F6" 
                  />
                </TouchableOpacity>
              )}
            </View>
          </>
        }
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    gap: m(8),
  },
  statCard: {
    width: '23%',
    backgroundColor: '#F9FAFB',
    borderRadius: m(16),
    padding: m(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statIconContainer: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(8),
  },
  statValue: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(4),
  },
  statLabel: {
    fontSize: m(10),
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
  
  // Payments Header
  paymentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(16),
    marginTop: m(8),
  },
  paymentsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(10),
    flex: 1,
  },
  paymentsTitle: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#111827',
  },
  paymentsCount: {
    fontSize: m(14),
    color: '#6B7280',
    fontWeight: '500',
  },
  toggleButtonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: m(6),
    paddingHorizontal: m(12),
    borderRadius: m(8),
    backgroundColor: '#EFF6FF',
    gap: m(6),
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  toggleButtonTextHeader: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#3B82F6',
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