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
import axiosInstance from '../../../Utils/AxiosInstance';

export default function PaymentHistory() {
  const navigation = useNavigation();
  const route = useRoute();
  const { loan, paymentHistory: initialPaymentHistory } = route.params;

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState(initialPaymentHistory || []);
  const [stats, setStats] = useState({
    totalPaid: 0,
    pendingPayments: 0,
    confirmedPayments: 0,
    rejectedPayments: 0,
  });

  useEffect(() => {
    if (!initialPaymentHistory) {
      fetchPaymentHistory();
    } else {
      calculateStats(initialPaymentHistory);
    }
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/borrower/loans/payment-history/${loan._id}`);
      const payments = response.data.data.paymentHistory || [];
      setPaymentHistory(payments);
      calculateStats(payments);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to fetch payment history',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (payments) => {
    const stats = payments.reduce(
      (acc, payment) => {
        acc.totalPaid += payment.amount || 0;
        switch (payment.paymentStatus?.toLowerCase()) {
          case 'pending':
            acc.pendingPayments += 1;
            break;
          case 'confirmed':
            acc.confirmedPayments += 1;
            break;
          case 'rejected':
            acc.rejectedPayments += 1;
            break;
        }
        return acc;
      },
      { totalPaid: 0, pendingPayments: 0, confirmedPayments: 0, rejectedPayments: 0 }
    );
    setStats(stats);
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
    return `₹${amount?.toLocaleString('en-IN') || 0}`;
  };

  const renderPaymentItem = ({ item }) => (
    <TouchableOpacity style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentMainInfo}>
          <View style={styles.amountContainer}>
            <Text style={styles.paymentAmount}>{formatCurrency(item.amount)}</Text>
            <View style={styles.paymentMeta}>
              <Text style={styles.paymentMode}>
                {item.paymentMode?.charAt(0).toUpperCase() + item.paymentMode?.slice(1)} • {item.paymentType?.charAt(0).toUpperCase() + item.paymentType?.slice(1)}
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
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatCurrency(stats.totalPaid)}</Text>
          <Text style={styles.statLabel}>Total Paid</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.confirmedPayments}</Text>
          <Text style={styles.statLabel}>Confirmed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.pendingPayments}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.rejectedPayments}</Text>
          <Text style={styles.statLabel}>Rejected</Text>
        </View>
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
      <View style={styles.loanSummary}>
        <Text style={styles.loanTitle} numberOfLines={1}>{loan.lenderId?.userName || 'Unknown Lender'}</Text>
        <Text style={styles.loanAmount}>{formatCurrency(loan.amount)}</Text>
        <Text style={styles.loanRemaining}>
          Remaining: {formatCurrency(loan.remainingAmount)}
        </Text>
      </View>

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

