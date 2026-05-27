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
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import Toast from 'react-native-toast-message';
import {
  getBorrowerLoans,
  clearLoans,
} from '../../../Redux/Slices/borrowerLoanSlice';

export default function MyLoans() {
  // Navigation & Redux
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { loans, summary, loading, error } = useSelector(
    state => state.borrowerLoans,
  );
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
    }, [user?._id]),
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
    } else if (activeTab === 'overdue') {
      filtered = loans.filter(loan => loan.overdueDetails?.isOverdue === true);
    }

    // Apply search query filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        loan =>
          loan.lenderId?.userName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          loan.amount?.toString().includes(searchQuery) ||
          loan.paymentStatus?.toLowerCase().includes(searchQuery.toLowerCase()),
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

  // Updated status color function to handle overdue
  const getStatusColor = (status, isOverdue) => {
    // Override if loan is overdue
    if (isOverdue) return '#DC2626';

    switch (status?.toLowerCase()) {
      case 'paid':
        return '#10B981';
      case 'part paid':
        return '#F59E0B';
      case 'pending':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  // Updated status icon function to handle overdue
  const getStatusIcon = (status, isOverdue) => {
    // Override if loan is overdue
    if (isOverdue) return 'alert-triangle';

    switch (status?.toLowerCase()) {
      case 'paid':
        return 'check-circle';
      case 'part paid':
        return 'clock';
      case 'pending':
        return 'circle';
      default:
        return 'circle';
    }
  };

  // Get display status text
  const getDisplayStatus = (paymentStatus, isOverdue) => {
    if (isOverdue) return 'Overdue';
    return (
      paymentStatus?.charAt(0).toUpperCase() + paymentStatus?.slice(1) ||
      'Pending'
    );
  };

  // Render Functions
  const renderLoanCard = ({ item }) => {
    const isOverdue = item.overdueDetails?.isOverdue === true;
    const displayStatus = getDisplayStatus(item.paymentStatus, isOverdue);
    const statusColor = getStatusColor(item.paymentStatus, isOverdue);
    const statusIcon = getStatusIcon(item.paymentStatus, isOverdue);

    return (
      <TouchableOpacity
        style={[styles.loanCard, isOverdue && styles.overdueCard]}
        onPress={() =>
          navigation.navigate('BorrowerLoanDetails', { loan: item })
        }
      >
        <View style={styles.loanHeader}>
          <View style={styles.loanInfo}>
            <Text style={styles.loanAmount}>
              ₹{item.amount?.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.loanLender} numberOfLines={1}>
              {item.lenderId?.userName || 'Unknown Lender'}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + '20' },
            ]}
          >
            <Icon name={statusIcon} size={m(14)} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {displayStatus}
            </Text>
          </View>
        </View>

        {/* Overdue Warning Banner */}
        {isOverdue && (
          <View style={styles.overdueBanner}>
            <Icon name="alert-circle" size={m(16)} color="#DC2626" />
            <Text style={styles.overdueBannerText}>
              {item.overdueDetails?.overdueDays > 0
                ? `Overdue by ${item.overdueDetails.overdueDays} day${
                    item.overdueDetails.overdueDays > 1 ? 's' : ''
                  }`
                : 'Payment Overdue'}
            </Text>
          </View>
        )}

        <View style={styles.loanDetails}>
          <View style={styles.detailRow}>
            <Icon name="phone" size={m(14)} color="#6B7280" />
            <Text style={styles.detailText}>
              {item.lenderId?.mobileNo || 'N/A'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="calendar" size={m(14)} color="#6B7280" />
            <Text style={[styles.detailText, isOverdue && styles.overdueText]}>
              Due:{' '}
              {item.loanEndDate
                ? moment(item.loanEndDate).format('DD MMM YYYY')
                : 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.loanProgress}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressLabel}>
              Paid: ₹{item.totalPaid?.toLocaleString('en-IN') || 0}
            </Text>
            <Text style={styles.progressLabel}>
              Remaining: ₹
              {item.remainingAmount?.toLocaleString('en-IN') || item.amount}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width:
                    item.amount > 0
                      ? `${((item.totalPaid || 0) / item.amount) * 100}%`
                      : '0%',
                  backgroundColor: statusColor,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.loanActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate('BorrowerLoanDetails', { loan: item })
            }
          >
            <Text style={styles.actionButtonText}>View Details</Text>
            <Icon name="chevron-right" size={m(16)} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSummary = () => {
    // Calculate overdue count
    const overdueCount = loans.filter(
      loan => loan.overdueDetails?.isOverdue === true,
    ).length;

    const summaryData = [
      {
        id: 'totalLoans',
        value: summary.totalLoans,
        label: 'Total Loans',
        color: '#3B82F6',
      },
      {
        id: 'activeLoans',
        value: summary.activeLoans,
        label: 'Active',
        color: '#8B5CF6',
      },
      {
        id: 'completedLoans',
        value: summary.completedLoans,
        label: 'Completed',
        color: '#10B981',
      },
      {
        id: 'overdueLoans',
        value: overdueCount,
        label: 'Overdue',
        color: overdueCount > 0 ? '#DC2626' : '#6B7280',
        highlight: overdueCount > 0,
      },
    ];

    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Loan Summary</Text>
        <View style={styles.summaryGrid}>
          {summaryData.map((item, index) => (
            <React.Fragment key={item.id}>
              <View style={styles.summaryItem}>
                <Text
                  style={[
                    styles.summaryValue,
                    item.highlight && styles.summaryHighlightValue,
                  ]}
                >
                  {item.value}
                </Text>
                <Text
                  style={[
                    styles.summaryLabel,
                    item.highlight && styles.summaryHighlightLabel,
                  ]}
                >
                  {item.label}
                </Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="document" size={m(64)} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No Loans Found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? 'Try adjusting your search criteria'
          : activeTab === 'pending'
          ? 'No pending loans at the moment'
          : activeTab === 'paid'
          ? 'No paid loans yet'
          : activeTab === 'overdue'
          ? 'No overdue loans. Great job!'
          : "You haven't taken any loans yet"}
      </Text>
    </View>
  );

  // Loading State
  if (false) {
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

  // Calculate counts for tabs
  const overdueCount = loans.filter(
    loan => loan.overdueDetails?.isOverdue === true,
  ).length;
  const paidCount = loans.filter(loan => loan.paymentStatus === 'paid').length;
  const pendingCount = loans.filter(
    loan => loan.paymentStatus !== 'paid',
  ).length;

  // Tab data - ALWAYS SHOW ALL TABS (including Overdue even if count is 0)
  const tabsData = [
    { id: 'all', label: 'All', count: loans.length },
    { id: 'paid', label: 'Paid', count: paidCount },
    { id: 'pending', label: 'Pending', count: pendingCount },
    { id: 'overdue', label: 'Overdue', count: overdueCount }, // Always show Overdue tab
  ];

  return (
    <View style={styles.container}>
      <Header title="My Loans" />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon
            name="search"
            size={m(20)}
            color="#6B7280"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by lender, amount, or status"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="x" size={m(20)} color="#6B7280" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Responsive Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContentContainer}
          scrollEventThrottle={16}
        >
          {tabsData.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.activeTab,
                tab.id === 'overdue' &&
                  activeTab === tab.id &&
                  styles.overdueActiveTab,
              ]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.id && styles.activeTabText,
                  tab.id === 'overdue' &&
                    activeTab === tab.id &&
                    styles.overdueTabText,
                  tab.id === 'overdue' &&
                    overdueCount === 0 &&
                    styles.zeroOverdueTabText,
                ]}
                numberOfLines={1}
              >
                {tab.label} ({tab.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Loans List */}
      <FlatList
        data={filteredLoans}
        renderItem={renderLoanCard}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
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
    paddingHorizontal: m(16),
    paddingVertical: m(12),
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
    paddingVertical: m(10),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: m(8),
  },
  searchInput: {
    flex: 1,
    fontSize: m(14),
    color: '#111827',
    paddingVertical: m(4),
  },

  // Tabs
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexGrow: 0,
    height: m(56),
  },
  tabsContentContainer: {
    paddingHorizontal: m(8),
    paddingVertical: 0,
    alignItems: 'center',
    justifyContent: 'center',
    height: m(56),
  },
  tab: {
    paddingHorizontal: m(13),
    paddingVertical: 0,
    marginHorizontal: m(4),
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    height: m(50),
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
  },
  overdueActiveTab: {
    borderBottomColor: '#DC2626',
  },
  tabText: {
    fontSize: m(13),
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
  },
  overdueTabText: {
    color: '#DC2626',
  },
  zeroOverdueTabText: {
    color: '#9CA3AF', // Lighter color when count is 0
  },

  // List
  listContainer: {
    paddingHorizontal: m(16),
    paddingVertical: m(16),
    paddingBottom: m(100),
  },

  // Loan Card
  loanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(12),
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
  overdueCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: m(12),
    gap: m(8),
  },
  loanInfo: {
    flex: 1,
  },
  loanAmount: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(4),
  },
  loanLender: {
    fontSize: m(13),
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(8),
    paddingVertical: m(6),
    borderRadius: m(8),
    gap: m(4),
  },
  statusText: {
    fontSize: m(11),
    fontWeight: '600',
  },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: m(12),
    paddingVertical: m(8),
    borderRadius: m(8),
    marginBottom: m(12),
    gap: m(8),
  },
  overdueBannerText: {
    fontSize: m(12),
    fontWeight: '600',
    color: '#DC2626',
    flex: 1,
  },
  loanDetails: {
    marginBottom: m(12),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(8),
    gap: m(8),
  },
  detailText: {
    fontSize: m(13),
    color: '#6B7280',
  },
  overdueText: {
    color: '#DC2626',
    fontWeight: '600',
  },
  loanProgress: {
    marginBottom: m(12),
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: m(8),
    gap: m(8),
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
    borderRadius: m(12),
    paddingHorizontal: m(16),
    paddingVertical: m(16),
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
    fontSize: m(16),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(10),
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: m(8),
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(8),
  },
  summaryValue: {
    fontSize: m(14),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(4),
    backgroundColor: '#FFE0B2',
    height: m(30),
    width: m(30),
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: m(22),
    borderRadius: m(15),
  },
  summaryHighlightValue: {
    color: '#DC2626',
  },
  summaryLabel: {
    fontSize: m(11),
    color: '#6B7280',
    textAlign: 'center',
  },
  summaryHighlightLabel: {
    color: '#DC2626',
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: m(64),
    paddingHorizontal: m(16),
  },
  emptyTitle: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#111827',
    marginTop: m(16),
    marginBottom: m(8),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: m(13),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: m(20),
  },
});
