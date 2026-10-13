import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import {
  getLenderSubscriptionHistory,
  clearSubscriptionHistory,
} from '../../../Redux/Slices/adminLendersSlice';

/**
 * Format currency value
 */
const formatCurrency = value => {
  if (!value) return '₹0';
  const num = Number(value) || 0;
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

/**
 * Format date
 */
const formatDate = dateStr => {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};

export default function AdminLenderSubscriptionHistory() {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { lenderId, lenderName } = route.params || {};

  const { subscriptionHistory, historyLoading } = useSelector(
    (state) => state.adminLenders
  );

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 'active' | 'expired'

  const fetchHistory = useCallback(() => {
    if (lenderId) {
      dispatch(getLenderSubscriptionHistory(lenderId));
    }
  }, [dispatch, lenderId]);

  useEffect(() => {
    fetchHistory();
    return () => {
      dispatch(clearSubscriptionHistory());
    };
  }, [fetchHistory, dispatch]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (lenderId) {
      dispatch(getLenderSubscriptionHistory(lenderId)).finally(() => setRefreshing(false));
    } else {
      setRefreshing(false);
    }
  }, [dispatch, lenderId]);

  // Filtered ledger items
  const filteredHistory = useMemo(() => {
    const list = subscriptionHistory || [];
    return list.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.planName || '').toLowerCase().includes(q) ||
        (item.tag || '').toLowerCase().includes(q) ||
        (item.razorpayPaymentId || '').toLowerCase().includes(q) ||
        (item.razorpayOrderId || '').toLowerCase().includes(q) ||
        String(item.price || item.amount || '').includes(q);

      if (!matchesSearch) return false;

      const isActive = item.status === 'active' || Boolean(item.isActive);
      if (selectedFilter === 'active') return isActive;
      if (selectedFilter === 'expired') return !isActive;
      return true;
    });
  }, [subscriptionHistory, searchQuery, selectedFilter]);

  // Statistics calculation
  const totalPurchases = (subscriptionHistory || []).length;
  const totalSpent = (subscriptionHistory || []).reduce(
    (sum, item) => sum + (Number(item.price || item.amount || item.priceMonthly) || 0),
    0
  );
  const hasActivePlan = (subscriptionHistory || []).some(
    (item) => item.status === 'active' || Boolean(item.isActive)
  );

  const renderHistoryItem = ({ item }) => {
    const isActive = item.status === 'active' || Boolean(item.isActive);
    const planName = item.planName || item.plan?.name || item.name || 'SaaS Plan';
    const amount = item.price || item.amount || item.plan?.price || 0;
    const paymentId = item.razorpayPaymentId || item.paymentId || item.transactionId || 'TXN-DIRECT';
    const orderId = item.razorpayOrderId || item.orderId || null;
    const features = item.planFeatures || item.features || {};

    return (
      <View style={styles.historyCard}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.planInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.planName}>{planName}</Text>
              {item.tag ? (
                <View style={styles.tierTag}>
                  <Text style={styles.tierTagText}>{item.tag}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.refId}>Ref: {paymentId}</Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatCurrency(amount)}</Text>
            <View
              style={[
                styles.statusBadge,
                isActive ? styles.activeBadge : styles.expiredBadge,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isActive ? '#16a34a' : '#64748b' },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  isActive ? styles.activeText : styles.expiredText,
                ]}
              >
                {isActive ? 'Active' : 'Expired'}
              </Text>
            </View>
          </View>
        </View>

        {orderId ? (
          <Text style={styles.orderIdText}>Order: {orderId}</Text>
        ) : null}

        <View style={styles.divider} />

        {/* Validity Dates */}
        <View style={styles.dateRow}>
          <View style={styles.dateCol}>
            <Text style={styles.dateLabel}>Activated On</Text>
            <Text style={styles.dateValue}>
              {formatDate(item.startDate || item.planPurchaseDate || item.createdAt)}
            </Text>
          </View>
          <View style={styles.dateCol}>
            <Text style={styles.dateLabel}>Expires On</Text>
            <Text style={styles.dateValue}>
              {formatDate(item.endDate || item.planExpiryDate || item.expiresAt)}
            </Text>
          </View>
          <View style={styles.dateCol}>
            <Text style={styles.dateLabel}>Payment Method</Text>
            <Text style={styles.dateValue}>{item.paymentMethod || 'Razorpay'}</Text>
          </View>
        </View>

        {/* Quota Highlights */}
        {(features.dealCapacityQuota || features.maxActiveLoans) && (
          <View style={styles.quotaStrip}>
            <Text style={styles.quotaText}>
              Capacity: {features.dealCapacityQuota || features.maxActiveLoans} Deals
              {features.aiReviewCredits ? ` • AI Credits: ${features.aiReviewCredits}` : ''}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Subscription Ledger" />

      {/* Lender Identification Strip */}
      <View style={styles.lenderStrip}>
        <View style={styles.lenderAvatar}>
          <Icon name="briefcase" size={16} color="#1d4ed8" />
        </View>
        <View style={styles.lenderStripInfo}>
          <Text style={styles.lenderNameText} numberOfLines={1}>
            {lenderName || 'Institutional Lender'}
          </Text>
          <Text style={styles.lenderSubText}>Lender ID: {lenderId}</Text>
        </View>
      </View>

      {/* High-Level KPI Summary */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiValue}>{totalPurchases}</Text>
          <Text style={styles.kpiLabel}>Total Invoices</Text>
        </View>
        <View style={styles.kpiBox}>
          <Text style={[styles.kpiValue, { color: '#2563eb' }]}>
            {formatCurrency(totalSpent)}
          </Text>
          <Text style={styles.kpiLabel}>Total Paid</Text>
        </View>
        <View style={styles.kpiBox}>
          <Text
            style={[
              styles.kpiValue,
              { color: hasActivePlan ? '#16a34a' : '#d97706' },
            ]}
          >
            {hasActivePlan ? 'Active' : 'Expired'}
          </Text>
          <Text style={styles.kpiLabel}>Current Status</Text>
        </View>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Icon name="search" size={16} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by plan, transaction ID, price..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="x" size={16} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.pillRow}>
          {[
            { id: 'all', label: 'All Invoices' },
            { id: 'active', label: 'Active Plans' },
            { id: 'expired', label: 'Expired Records' },
          ].map((pill) => (
            <TouchableOpacity
              key={pill.id}
              style={[
                styles.pill,
                selectedFilter === pill.id && styles.activePill,
              ]}
              onPress={() => setSelectedFilter(pill.id)}
            >
              <Text
                style={[
                  styles.pillText,
                  selectedFilter === pill.id && styles.activePillText,
                ]}
              >
                {pill.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Ledger Feed */}
      {historyLoading && !refreshing && (subscriptionHistory || []).length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Fetching subscription ledger...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredHistory}
          renderItem={renderHistoryItem}
          keyExtractor={(item, index) =>
            item._id || item.razorpayPaymentId || item.transactionId || String(index)
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2563eb']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="file-text" size={44} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Subscriptions Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'No invoices matched your search filter.'
                  : 'No subscription purchases have been recorded for this lender yet.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  lenderStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: m(16),
    paddingVertical: m(12),
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: m(12),
  },
  lenderAvatar: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  lenderStripInfo: {
    flex: 1,
  },
  lenderNameText: {
    fontSize: m(14),
    fontWeight: '700',
    color: '#0f172a',
  },
  lenderSubText: {
    fontSize: m(11),
    color: '#64748b',
    marginTop: m(1),
  },
  kpiRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: m(16),
    marginTop: m(12),
    paddingVertical: m(12),
    paddingHorizontal: m(16),
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'space-around',
  },
  kpiBox: {
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: m(16),
    fontWeight: '800',
    color: '#0f172a',
  },
  kpiLabel: {
    fontSize: m(11),
    color: '#64748b',
    marginTop: m(2),
  },
  searchSection: {
    paddingHorizontal: m(16),
    paddingTop: m(12),
    paddingBottom: m(8),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: m(10),
    paddingHorizontal: m(12),
    height: m(40),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: m(8),
  },
  searchInput: {
    flex: 1,
    fontSize: m(12),
    color: '#0f172a',
    paddingVertical: 0,
  },
  pillRow: {
    flexDirection: 'row',
    gap: m(8),
    marginTop: m(10),
  },
  pill: {
    paddingHorizontal: m(12),
    paddingVertical: m(5),
    borderRadius: m(16),
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activePill: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  pillText: {
    fontSize: m(11),
    fontWeight: '600',
    color: '#64748b',
  },
  activePillText: {
    color: '#ffffff',
  },
  listContent: {
    padding: m(16),
    paddingBottom: m(80),
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: m(12),
    padding: m(14),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  planName: {
    fontSize: m(15),
    fontWeight: '700',
    color: '#0f172a',
  },
  tierTag: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: m(6),
    paddingVertical: m(2),
    borderRadius: m(4),
  },
  tierTagText: {
    fontSize: m(10),
    fontWeight: '700',
    color: '#2563eb',
  },
  refId: {
    fontSize: m(11),
    color: '#94a3b8',
    marginTop: m(3),
  },
  orderIdText: {
    fontSize: m(10),
    color: '#94a3b8',
    marginTop: m(2),
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: m(16),
    fontWeight: '800',
    color: '#0f172a',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: m(4),
    paddingHorizontal: m(8),
    paddingVertical: m(2),
    borderRadius: m(6),
    gap: m(4),
  },
  activeBadge: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  expiredBadge: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusDot: {
    width: m(5),
    height: m(5),
    borderRadius: m(2.5),
  },
  statusText: {
    fontSize: m(10),
    fontWeight: '700',
  },
  activeText: {
    color: '#15803d',
  },
  expiredText: {
    color: '#64748b',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: m(10),
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    fontSize: m(10),
    color: '#94a3b8',
    marginBottom: m(2),
  },
  dateValue: {
    fontSize: m(11),
    fontWeight: '600',
    color: '#334155',
  },
  quotaStrip: {
    backgroundColor: '#f8fafc',
    borderRadius: m(6),
    padding: m(6),
    marginTop: m(8),
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  quotaText: {
    fontSize: m(10),
    color: '#64748b',
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: m(8),
    fontSize: m(13),
    color: '#64748b',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: m(60),
  },
  emptyTitle: {
    fontSize: m(15),
    fontWeight: '700',
    color: '#475569',
    marginTop: m(10),
  },
  emptySubtitle: {
    fontSize: m(12),
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: m(4),
    paddingHorizontal: m(30),
  },
});
