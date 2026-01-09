import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import Toast from 'react-native-toast-message';
import { getBorrowerLoans, clearLoans } from '../../../Redux/Slices/borrowerLoanSlice';

export default function MyLoans() {
  // Navigation & Redux
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { loans, summary, loading, error, } = useSelector(state => state.borrowerLoans);
  const user = useSelector(state => state.auth.user);

  // State Management
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
  });

  // Effects
  useEffect(() => {
    if (user?._id) {
      fetchMyLoans();
    }
    return () => {
      dispatch(clearLoans());
    };
  }, [user?._id]);

  useFocusEffect(
    React.useCallback(() => {
      if (user?._id) {
        fetchMyLoans();
      }
    }, [user?._id])
  );

  useEffect(() => {
    filterLoans();
  }, [searchQuery, loans, activeTab]);

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

  // API Functions
  const fetchMyLoans = (params = {}) => {
    if (!user?._id) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: 'User information not available',
      });
      return;
    }
    dispatch(getBorrowerLoans({ borrowerId: user._id, ...params }));
  };

  // Utility Functions
  const filterLoans = () => {
    let filtered = loans;

    // Filter by tab first
    if (activeTab === 'pending') {
      filtered = loans.filter(loan => loan.paymentStatus !== 'paid');
    } else if (activeTab === 'paid') {
      filtered = loans.filter(loan => loan.paymentStatus === 'paid');
    }

    // Apply search query filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(loan =>
        loan.lenderId?.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.amount?.toString().includes(searchQuery) ||
        loan.paymentStatus?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredLoans(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyLoans({
      search: searchQuery || undefined,
      status: filters.status || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      minAmount: filters.minAmount || undefined,
      maxAmount: filters.maxAmount || undefined,
    });
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return '#10B981';
      case 'part paid': return '#F59E0B';
      case 'pending': return '#6B7280';
      case 'overdue': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'check-circle';
      case 'part paid': return 'clock';
      case 'pending': return 'circle';
      case 'overdue': return 'x-circle';
      default: return 'circle';
    }
  };

  // Render Functions
  const renderLoanCard = ({ item }) => (
    <TouchableOpacity
      style={styles.loanCard}
      onPress={() => navigation.navigate('BorrowerLoanDetails', { loan: item })}
    >
      <View style={styles.loanHeader}>
        <View style={styles.loanInfo}>
          <Text style={styles.loanAmount}>₹{item.amount?.toLocaleString('en-IN')}</Text>
          <Text style={styles.loanLender} numberOfLines={1}>{item.lenderId?.userName || 'Unknown Lender'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.paymentStatus) + '20' }]}>
          <Icon name={getStatusIcon(item.paymentStatus)} size={14} color={getStatusColor(item.paymentStatus)} />
          <Text style={[styles.statusText, { color: getStatusColor(item.paymentStatus) }]}>
            {item.paymentStatus?.charAt(0).toUpperCase() + item.paymentStatus?.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.loanDetails}>
        <View style={styles.detailRow}>
          <Icon name="phone" size={14} color="#6B7280" />
          <Text style={styles.detailText}>{item.lenderId?.mobileNo || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="calendar" size={14} color="#6B7280" />
          <Text style={styles.detailText}>
            Due: {item.loanEndDate ? moment(item.loanEndDate).format('DD MMM YYYY') : 'N/A'}
          </Text>
        </View>
      </View>

      <View style={styles.loanProgress}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressLabel}>Paid: ₹{item.totalPaid?.toLocaleString('en-IN') || 0}</Text>
          <Text style={styles.progressLabel}>Remaining: ₹{item.remainingAmount?.toLocaleString('en-IN') || item.amount}</Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: item.amount > 0 ? `${((item.totalPaid || 0) / item.amount) * 100}%` : '0%',
                backgroundColor: getStatusColor(item.paymentStatus),
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.loanActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('BorrowerLoanDetails', { loan: item })}
        >
          <Text style={styles.actionButtonText}>View Details</Text>
          <Icon name="chevron-right" size={16} color="#3B82F6" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderSummary = () => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Loan Summary</Text>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{summary.totalLoans}</Text>
          <Text style={styles.summaryLabel}>Total Loans</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{summary.activeLoans}</Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{summary.completedLoans}</Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>₹{(summary.totalAmountBorrowed / 1000).toFixed(0)}K</Text>
          <Text style={styles.summaryLabel}>Borrowed</Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="document" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No Loans Found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? 'Try adjusting your search criteria'
          : activeTab === 'pending'
            ? 'No pending loans at the moment'
            : activeTab === 'paid'
              ? 'No paid loans yet'
              : 'You haven\'t taken any loans yet'}
      </Text>
    </View>
  );

  // Loading State
  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="My Loans" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading your loans...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="My Loans" />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by lender, amount, or status"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="x" size={20} color="#6B7280" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All ({loans.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'paid' && styles.activeTab]}
          onPress={() => setActiveTab('paid')}
        >
          <Text style={[styles.tabText, activeTab === 'paid' && styles.activeTabText]}>
            Paid ({loans.filter(loan => loan.paymentStatus === 'paid').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Pending ({loans.filter(loan => loan.paymentStatus !== 'paid').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loans List */}
      <FlatList
        data={filteredLoans}
        renderItem={renderLoanCard}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={summary.totalLoans > 0 ? renderSummary : null}
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
  
  // Search
  searchContainer: {
    padding: m(16),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: m(12),
    paddingHorizontal: m(12),
    paddingVertical: m(8),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: m(8),
  },
  searchInput: {
    flex: 1,
    fontSize: m(16),
    color: '#111827',
    paddingVertical: m(4),
  },
  
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: m(12),
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
  },
  
  // List
  listContainer: {
    padding: m(16),
    paddingBottom: m(100),
  },
  
  // Loan Card
  loanCard: {
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
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: m(12),
  },
  loanInfo: {
    flex: 1,
  },
  loanAmount: {
    fontSize: m(20),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(4),
  },
  loanLender: {
    fontSize: m(14),
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(12),
    gap: m(4),
  },
  statusText: {
    fontSize: m(12),
    fontWeight: '600',
  },
  loanDetails: {
    marginBottom: m(12),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(6),
    gap: m(6),
  },
  detailText: {
    fontSize: m(14),
    color: '#6B7280',
  },
  loanProgress: {
    marginBottom: m(12),
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: m(8),
  },
  progressLabel: {
    fontSize: m(12),
    color: '#6B7280',
  },
  progressBar: {
    height: m(6),
    backgroundColor: '#E5E7EB',
    borderRadius: m(3),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: m(3),
  },
  loanActions: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: m(12),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: m(8),
  },
  actionButtonText: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#3B82F6',
  },
  
  // Summary Card
  summaryCard: {
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
  summaryTitle: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(16),
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(4),
  },
  summaryLabel: {
    fontSize: m(12),
    color: '#6B7280',
  },
  summaryDivider: {
    width: 1,
    height: m(40),
    backgroundColor: '#E5E7EB',
    marginHorizontal: m(12),
  },
  
  // Empty State
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
});