import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
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
      const response = await borrowerLoanAPI.getPaymentHistory(loan._id, user?._id);
      const data = response.data || {};
      
      // New API structure: payments array (renamed from paymentHistory.allPayments)
      setPaymentHistory(data.payments || []);
      
      // New API structure: paymentStats object
      setPaymentStats(data.paymentStats || {
        totalPayments: 0,
        confirmedPayments: 0,
        pendingPayments: 0,
        pendingAmount: 0,
      });
      
      // New API structure: loanSummary object
      setLoanSummary(data.loanSummary || null);
      
      // New API structure: installmentDetails (null for one-time loans)
      setInstallmentDetails(data.installmentDetails || null);
      
    } catch (error) {
      console.error('Error fetching payment history:', error);
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: error.response?.data?.message || error.message || 'Failed to fetch payment history',
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
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'check-circle';
      case 'pending': return 'clock';
      case 'rejected': return 'x-circle';
      default: return 'circle';
    }
  };

  const formatCurrency = (amount) => {
    // Ensure amount is a number before formatting to avoid string concatenation
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    return `₹${numAmount.toLocaleString('en-IN')}`;
  };

  const renderPaymentItem = ({ item }) => (
    <TouchableOpacity style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentMainInfo}>
          <View style={styles.amountContainer}>
            <Text style={styles.paymentAmount}>{formatCurrency(item.amount)}</Text>
            <View style={styles.paymentMeta}>
              <Text style={styles.paymentMode}>
                {item.paymentMode?.charAt(0).toUpperCase() + item.paymentMode?.slice(1) || 'N/A'}
                {item.installmentLabel && ` • ${item.installmentLabel}`}
                {!item.installmentLabel && item.installmentNumber && ` • Installment ${item.installmentNumber}`}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.paymentStatus) + '20' }]}>
            <Icon name={getStatusIcon(item.paymentStatus)} size={14} color={getStatusColor(item.paymentStatus)} />
            <Text style={[styles.statusText, { color: getStatusColor(item.paymentStatus) }]}>
              {item.paymentStatus?.charAt(0).toUpperCase() + item.paymentStatus?.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.paymentDetails}>
          <View style={styles.detailRow}>
            <Icon name="calendar" size={14} color="#6B7280" />
            <Text style={styles.detailText}>
              {moment(item.paymentDate).format('DD MMM YYYY, hh:mm A')}
            </Text>
          </View>

          {item.confirmedAt && (
            <View style={styles.detailRow}>
              <Icon name="check-circle" size={14} color="#10B981" />
              <Text style={styles.confirmedText}>
                Confirmed: {moment(item.confirmedAt).format('DD MMM YYYY, hh:mm A')}
              </Text>
            </View>
          )}

          {item.transactionId && (
            <View style={styles.detailRow}>
              <Icon name="hash" size={14} color="#6B7280" />
              <Text style={styles.detailText}>Txn ID: {item.transactionId}</Text>
            </View>
          )}
        </View>

        {item.notes && (
          <View style={styles.notesContainer}>
            <Icon name="file-text" size={14} color="#6B7280" />
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}

        {item.paymentProof && (
          <TouchableOpacity style={styles.proofContainer}>
            <Ionicons name="document-outline" size={16} color="#3B82F6" />
            <Text style={styles.proofText}>View Payment Proof</Text>
            <Icon name="external-link" size={14} color="#3B82F6" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderStatsCard = () => (
    <View style={styles.statsCard}>
      <Text style={styles.statsTitle}>Payment Summary</Text>
      {loanSummary && (
        <View style={styles.loanSummarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Loan:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(loanSummary.totalLoanAmount)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Paid:</Text>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>
              {formatCurrency(loanSummary.totalPaid)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Remaining:</Text>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
              {formatCurrency(loanSummary.remainingAmount)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Status:</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(loanSummary.paymentStatus) + '20' }]}>
              <Icon name={getStatusIcon(loanSummary.paymentStatus)} size={12} color={getStatusColor(loanSummary.paymentStatus)} />
              <Text style={[styles.statusText, { color: getStatusColor(loanSummary.paymentStatus) }]}>
                {loanSummary.paymentStatus?.charAt(0).toUpperCase() + loanSummary.paymentStatus?.slice(1)}
              </Text>
            </View>
          </View>
        </View>
      )}
      
      {installmentDetails && (
        <View style={styles.installmentSection}>
          <Text style={styles.installmentTitle}>Installment Details</Text>
          <View style={styles.installmentInfo}>
            <View style={styles.installmentRow}>
              <Icon name="check-circle" size={16} color="#10B981" />
              <Text style={styles.installmentText}>
                {installmentDetails.totalInstallmentsPaid} Installment{installmentDetails.totalInstallmentsPaid !== 1 ? 's' : ''} Paid
              </Text>
            </View>
            {installmentDetails.nextDueDate && (
              <View style={styles.installmentRow}>
                <Icon name="calendar" size={16} color="#3B82F6" />
                <Text style={styles.installmentText}>
                  Next Due: {moment(installmentDetails.nextDueDate).format('DD MMM YYYY')}
                </Text>
              </View>
            )}
            {installmentDetails.frequency && (
              <View style={styles.installmentRow}>
                <Icon name="repeat" size={16} color="#6B7280" />
                <Text style={styles.installmentText}>
                  Frequency: {installmentDetails.frequency.charAt(0).toUpperCase() + installmentDetails.frequency.slice(1)}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{paymentStats.totalPayments}</Text>
          <Text style={styles.statLabel}>Total Payments</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#10B981' }]}>{paymentStats.confirmedPayments}</Text>
          <Text style={styles.statLabel}>Confirmed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>{paymentStats.pendingPayments}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        {paymentStats.pendingAmount > 0 && (
          <>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#EF4444' }]}>
                {formatCurrency(paymentStats.pendingAmount)}
              </Text>
              <Text style={styles.statLabel}>Pending Amount</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No Payment History</Text>
      <Text style={styles.emptySubtitle}>
        You haven't made any payments for this loan yet
      </Text>
      <TouchableOpacity
        style={styles.makePaymentButton}
        onPress={() => navigation.navigate('MakePayment', { loan })}
      >
        <Text style={styles.makePaymentButtonText}>Make First Payment</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Payment History" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading payment history...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Payment History" showBackButton />

      {/* Loan Summary */}
      {loanSummary && (
        <View style={styles.loanSummary}>
          <Text style={styles.loanTitle} numberOfLines={1}>{loan.lenderId?.userName || 'Unknown Lender'}</Text>
          <Text style={styles.loanAmount}>{formatCurrency(loanSummary.totalLoanAmount)}</Text>
          <Text style={styles.loanRemaining}>
            Remaining: {formatCurrency(loanSummary.remainingAmount)}
          </Text>
          {loanSummary.paymentType && (
            <Text style={styles.paymentType}>
              {loanSummary.paymentType === 'installment' ? 'Installment Loan' : 'One-time Payment'}
            </Text>
          )}
        </View>
      )}

      <FlatList
        data={paymentHistory}
        renderItem={renderPaymentItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={renderStatsCard}
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
  },
  loanSummary: {
    backgroundColor: '#FFFFFF',
    padding: m(16),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  loanTitle: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#111827',
    marginBottom: m(4),
  },
  loanAmount: {
    fontSize: m(20),
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: m(2),
  },
  loanRemaining: {
    fontSize: m(14),
    color: '#6B7280',
  },
  paymentType: {
    fontSize: m(12),
    color: '#9CA3AF',
    marginTop: m(4),
    fontStyle: 'italic',
  },
  loanSummarySection: {
    marginBottom: m(16),
    paddingBottom: m(16),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(8),
  },
  summaryLabel: {
    fontSize: m(14),
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#111827',
  },
  installmentSection: {
    marginBottom: m(16),
    paddingBottom: m(16),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  installmentTitle: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#111827',
    marginBottom: m(12),
  },
  installmentInfo: {
    gap: m(8),
  },
  installmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
  },
  installmentText: {
    fontSize: m(14),
    color: '#374151',
  },
  listContainer: {
    padding: m(16),
    paddingBottom: m(100),
  },
  statsCard: {
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
  statsTitle: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(16),
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(4),
  },
  statLabel: {
    fontSize: m(12),
    color: '#6B7280',
  },
  statDivider: {
    width: 1,
    height: m(40),
    backgroundColor: '#E5E7EB',
    marginHorizontal: m(8),
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    padding: m(16),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  paymentHeader: {
    flex: 1,
  },
  paymentMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: m(12),
  },
  amountContainer: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: m(20),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(4),
  },
  paymentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMode: {
    fontSize: m(14),
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    borderRadius: m(20),
    gap: m(6),
  },
  statusText: {
    fontSize: m(12),
    fontWeight: '600',
  },
  paymentDetails: {
    marginBottom: m(12),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(6),
    gap: m(8),
  },
  detailText: {
    fontSize: m(14),
    color: '#6B7280',
  },
  confirmedText: {
    fontSize: m(14),
    color: '#10B981',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    borderRadius: m(8),
    padding: m(12),
    gap: m(8),
  },
  notesText: {
    flex: 1,
    fontSize: m(14),
    color: '#374151',
    lineHeight: m(20),
  },
  proofContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: m(8),
    padding: m(12),
    gap: m(8),
  },
  proofText: {
    flex: 1,
    fontSize: m(14),
    color: '#3B82F6',
    fontWeight: '500',
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
    marginBottom: m(24),
  },
  makePaymentButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: m(24),
    paddingVertical: m(12),
    borderRadius: m(12),
  },
  makePaymentButtonText: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

