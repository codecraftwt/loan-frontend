import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Animated,
  Easing,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import Toast from 'react-native-toast-message';
import {
  getBorrowerLoans,
} from '../../../Redux/Slices/borrowerLoanSlice';

const FETCH_LOANS_LIMIT = 1000;

export default function MyLoans() {
  // Navigation & Redux
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { borrowerId: cachedBorrowerId, loans, summary, loading, error } = useSelector(
    state => state.borrowerLoans,
  );
  const user = useSelector(state => state.auth.user);

  // State Management
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  // Animations 
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinLoopRef = useRef(null); // Store the loop animation reference

  // API Functions
  const fetchMyLoans = useCallback(async (params = {}, options = {}) => {
    const { showInitialLoader = true } = options;

    if (!user?._id) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: 'User information not available',
      });
      setIsInitialLoading(false);
      return;
    }

    try {
      if (showInitialLoader) {
        setIsInitialLoading(true);
      }
      await dispatch(
        getBorrowerLoans({
          borrowerId: user._id,
          limit: FETCH_LOANS_LIMIT,
          ...params,
        }),
      );
    } catch (err) {
      console.error('Error fetching loans:', err);
    } finally {
      if (showInitialLoader) {
        setIsInitialLoading(false);
      }
    }
  }, [dispatch, user?._id]);

  // Utility Functions
  const filterLoans = useCallback(() => {
    const loansArray = loans || [];
    let filtered = loansArray;

    // Filter by tab first
    if (activeTab === 'pending') {
      filtered = loansArray.filter(loan => loan.paymentStatus !== 'paid');
    } else if (activeTab === 'paid') {
      filtered = loansArray.filter(loan => loan.paymentStatus === 'paid');
    } else if (activeTab === 'overdue') {
      filtered = loansArray.filter(loan => loan.overdueDetails?.isOverdue === true);
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
  }, [activeTab, loans, searchQuery]);

  // Effects
  useEffect(() => {
    const shouldFetchLoans =
      user?._id && (loans.length === 0 || cachedBorrowerId !== user._id);

    if (shouldFetchLoans) {
      fetchMyLoans();
    } else {
      setIsInitialLoading(false);
    }
  }, [cachedBorrowerId, fetchMyLoans, loans.length, user?._id]);

  useEffect(() => {
    return () => {
      // Stop spin animation on unmount
      if (spinLoopRef.current) {
        spinLoopRef.current.stop();
        spinLoopRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    filterLoans();
  }, [filterLoans]);

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

  // Control spin animation based on loading state
  useEffect(() => {
    if (isInitialLoading || loading) {
      // Start spinning animation if not already spinning
      if (!spinLoopRef.current) {
        spinLoopRef.current = Animated.loop(
          Animated.timing(spinAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        );
        spinLoopRef.current.start();
      }
    } else {
      // Stop spinning animation and reset
      if (spinLoopRef.current) {
        spinLoopRef.current.stop();
        spinLoopRef.current = null;
        spinAnim.setValue(0); // Reset to original position
      }
    }
  }, [isInitialLoading, loading, spinAnim]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyLoans({
      search: searchQuery || undefined,
      status: getStatusParamForTab(activeTab),
    }, { showInitialLoader: false });
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

  // Get initials for the lender avatar
  const getInitials = name => {
    if (!name || !name.trim()) return '?';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Days remaining until due date (only meaningful when not overdue / not paid)
  const getDaysRemainingLabel = (loanEndDate, paymentStatus, isOverdue) => {
    if (!loanEndDate || isOverdue || paymentStatus?.toLowerCase() === 'paid') {
      return null;
    }
    const daysLeft = moment(loanEndDate).startOf('day').diff(moment().startOf('day'), 'days');
    if (daysLeft < 0) return null; // handled by overdue banner instead
    if (daysLeft === 0) return 'Due today';
    if (daysLeft === 1) return 'Due tomorrow';
    if (daysLeft <= 7) return `Due in ${daysLeft} days`;
    return null;
  };

  // Spin animation interpolation
  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Render Functions
  const renderLoanCard = ({ item }) => {
    const isOverdue = item.overdueDetails?.isOverdue === true;
    const displayStatus = getDisplayStatus(item.paymentStatus, isOverdue);
    const statusColor = getStatusColor(item.paymentStatus, isOverdue);
    const statusIcon = getStatusIcon(item.paymentStatus, isOverdue);
    const dueSoonLabel = getDaysRemainingLabel(item.loanEndDate, item.paymentStatus, isOverdue);
    const paidAmount = item.totalPaid || 0;
    const remainingAmount = item.remainingAmount ?? item.amount ?? 0;
    const paidPercent = item.amount > 0 ? Math.min(100, Math.round((paidAmount / item.amount) * 100)) : 0;

    return (
      <Animated.View
        style={[
          styles.loanCard,
          isOverdue && styles.overdueCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}>
        <TouchableOpacity
          activeOpacity={0.78}
          onPress={() =>
            navigation.navigate('BorrowerLoanDetails', { loan: item })
          }>
          <View style={styles.loanHeader}>
            <View style={styles.loanHeaderLeft}>
              <View
                style={[
                  styles.avatarCircle,
                  { backgroundColor: statusColor + '18' },
                ]}>
                <Text style={[styles.avatarText, { color: statusColor }]}>
                  {getInitials(item.lenderId?.userName)}
                </Text>
              </View>
              <View style={styles.loanInfo}>
                <Text style={styles.loanLender} numberOfLines={1}>
                  {item.lenderId?.userName || 'Unknown Lender'}
                </Text>
                <View style={styles.loanContactRow}>
                  <Icon name="phone" size={m(12)} color="#9CA3AF" />
                  <Text style={styles.loanContactText} numberOfLines={1}>
                    {item.lenderId?.mobileNo || 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor + '20' },
              ]}>
              <Icon name={statusIcon} size={m(13)} color={statusColor} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {displayStatus}
              </Text>
            </View>
          </View>

          <View style={styles.amountPanel}>
            <View style={styles.amountBlockPrimary}>
              <Text style={styles.amountLabel}>Loan Amount</Text>
              <Text style={styles.loanAmount}>
                Rs {item.amount?.toLocaleString('en-IN') || 0}
              </Text>
            </View>
            <View style={styles.amountDivider} />
            <View style={styles.amountBlock}>
              <Text style={styles.amountLabel}>Paid</Text>
              <Text style={styles.paidAmountText}>
                Rs {paidAmount.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.amountBlock}>
              <Text style={styles.amountLabel}>Remaining</Text>
              <Text style={styles.remainingAmountText}>
                Rs {remainingAmount.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

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

          {!isOverdue && dueSoonLabel && (
            <View style={styles.dueSoonBanner}>
              <Icon name="clock" size={m(14)} color="#B45309" />
              <Text style={styles.dueSoonBannerText}>{dueSoonLabel}</Text>
            </View>
          )}

          <View style={styles.loanDetails}>
            <View style={styles.detailPill}>
              <Icon name="calendar" size={m(14)} color="#6B7280" />
              <Text style={[styles.detailText, isOverdue && styles.overdueText]}>
                Due: {item.loanEndDate ? moment(item.loanEndDate).format('DD MMM YYYY') : 'N/A'}
              </Text>
            </View>
            <View style={styles.detailPill}>
              <Icon name="trending-up" size={m(14)} color="#6B7280" />
              <Text style={styles.detailText}>{paidPercent}% paid</Text>
            </View>
          </View>

          {/* <View style={styles.loanProgress}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>Repayment progress</Text>
              <Text style={styles.progressPercentLabel}>{paidPercent}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${paidPercent}%`,
                    backgroundColor: statusColor,
                  },
                ]}
              />
            </View>
          </View> */}

          <View style={styles.loanActions}>
            <View style={styles.actionButton}>
              <Text style={styles.actionButtonText}>View Details</Text>
              <Icon name="chevron-right" size={m(16)} color="#3B82F6" />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  const renderSummary = () => {
    const loansArray = loans || [];
    // Calculate overdue count
    const overdueCount = loansArray.filter(
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
      <Animated.View
        style={[
          styles.summaryCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}>
        <Text style={styles.summaryTitle}>Loan Summary</Text>
        <View style={styles.summaryGrid}>
          {summaryData.map(item => (
            <View key={item.id} style={styles.summaryItem}>
              <View
                style={[
                  styles.summaryValueBubble,
                  { backgroundColor: item.color + '18' },
                ]}>
                <Text style={[styles.summaryValue, { color: item.color }]}>
                  {item.value}
                </Text>
              </View>
              <Text
                style={[
                  styles.summaryLabel,
                  item.highlight && styles.summaryHighlightLabel,
                ]}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>
    );
  };

  const renderEmptyState = () => {
    // Only show empty state when not loading and no loans exist
    if (isInitialLoading || loading) return null;
    
    const hasNoLoans = !loans || loans.length === 0;
    const hasLoansButNoSearchResults = loans && loans.length > 0 && filteredLoans.length === 0;
    
    if (!hasNoLoans && !hasLoansButNoSearchResults) return null;

    let message = "";
    let icon = "document-text-outline";
    
    if (searchQuery && hasLoansButNoSearchResults) {
      message = `No loans found matching "${searchQuery}"`;
      icon = "search-outline";
    } else if (activeTab === 'pending') {
      message = "No pending loans at the moment";
    } else if (activeTab === 'paid') {
      message = "No paid loans yet";
    } else if (activeTab === 'overdue') {
      message = "No overdue loans. Great job!";
    } else {
      message = "You haven't taken any loans yet";
    }

    return (
      <Animated.View
        style={[
          styles.emptyState,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name={icon} size={60} color="#D1D5DB" />
        </View>
        <Text style={styles.emptyTitle}>No Loans Found</Text>
        <Text style={styles.emptySubtitle}>{message}</Text>
      </Animated.View>
    );
  };

  const renderLoadingState = () => {
    if (!isInitialLoading && !loading) return null;
    
    return (
      <View style={styles.loadingContainer}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Ionicons name="document-text" size={50} color="#FF9800" />
        </Animated.View>
        <Text style={styles.loadingTitle}>Fetching Your Loans</Text>
        <Text style={styles.loadingSubtitle}>
          Please wait while we load your loan details...
        </Text>
      </View>
    );
  };

  // Calculate counts for tabs
  const loansArray = loans || [];
  const overdueCount = loansArray.filter(
    loan => loan.overdueDetails?.isOverdue === true,
  ).length;
  const paidCount = loansArray.filter(loan => loan.paymentStatus === 'paid').length;
  const pendingCount = loansArray.filter(
    loan => loan.paymentStatus !== 'paid',
  ).length;

  // Tab data - ALWAYS SHOW ALL TABS (including Overdue even if count is 0)
  const tabsData = [
    { id: 'all', label: 'All', count: loans.length },
    { id: 'paid', label: 'Paid', count: paidCount },
    { id: 'pending', label: 'Pending', count: pendingCount },
    { id: 'overdue', label: 'Overdue', count: overdueCount },
  ];

  const hasData = filteredLoans && filteredLoans.length > 0;
  const activeFilterLabel = tabsData.find(tab => tab.id === activeTab)?.label || 'All';

  const getStatusParamForTab = tabId => {
    if (tabId === 'all') return undefined;
    return tabId;
  };

  const handleFilterSelect = async tabId => {
    setActiveTab(tabId);
    setShowFilterModal(false);
    await fetchMyLoans({
      search: searchQuery || undefined,
      status: getStatusParamForTab(tabId),
    }, { showInitialLoader: false });
  };

  const renderListHeader = () => (
    <>
      {summary.totalLoans > 0 ? renderSummary() : null}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="My Loans" />

      {/* Search Bar - Hide during initial loading */}
      {!isInitialLoading && (
        <Animated.View
          style={[
            styles.searchContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}>
          <View style={styles.searchRow}>
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

            <TouchableOpacity
              style={[
                styles.filterIconButton,
                showFilterModal && styles.filterIconButtonActive,
                activeTab !== 'all' && styles.filterIconButtonSelected,
              ]}
              onPress={() => setShowFilterModal(true)}
              activeOpacity={0.75}>
              <Icon
                name="sliders"
                size={m(19)}
                color={activeTab !== 'all' || showFilterModal ? '#FFFFFF' : '#FF8A00'}
              />
            </TouchableOpacity>
          </View>

          {activeTab !== 'all' && (
            <TouchableOpacity
              style={styles.activeFilterPill}
              onPress={() => handleFilterSelect('all')}
              activeOpacity={0.75}>
              <Text style={styles.activeFilterText}>{activeFilterLabel}</Text>
              <Icon name="x" size={m(14)} color="#FF8A00" />
            </TouchableOpacity>
          )}
        </Animated.View>
      )}

      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}>
          <TouchableOpacity
            style={styles.filterModal}
            activeOpacity={1}
            onPress={() => {}}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filter Loans</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                activeOpacity={0.75}>
                <Text style={styles.filterModalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>

            {tabsData.map(tab => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.filterModalOption,
                  activeTab === tab.id && styles.filterModalOptionActive,
                ]}
                onPress={() => handleFilterSelect(tab.id)}
                activeOpacity={0.75}>
                <Text
                  style={[
                    styles.filterModalOptionText,
                    activeTab === tab.id && styles.filterModalOptionTextActive,
                  ]}>
                  {tab.label}
                </Text>
                <Text style={styles.filterModalCount}>{tab.count}</Text>
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Content Area */}
      <View style={styles.contentContainer}>
        {isInitialLoading || loading ? (
          renderLoadingState()
        ) : !hasData ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={filteredLoans}
            renderItem={renderLoanCard}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListHeaderComponent={renderListHeader}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  
  // Content Container - This ensures proper flex behavior
  contentContainer: {
    flex: 1,
  },
  
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: m(80),
  },
  loadingTitle: {
    marginTop: m(24),
    fontSize: m(18),
    fontWeight: '600',
    color: '#111827',
  },
  loadingSubtitle: {
    marginTop: m(8),
    fontSize: m(14),
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: m(32),
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: m(80),
    paddingHorizontal: m(16),
  },
  emptyIconContainer: {
    width: m(100),
    height: m(100),
    borderRadius: m(50),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: m(20),
  },
  emptyTitle: {
    fontSize: m(18),
    fontWeight: '600',
    color: '#111827',
    marginTop: m(16),
    marginBottom: m(8),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: m(14),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: m(20),
    paddingHorizontal: m(32),
  },

  // Search
  searchContainer: {
    paddingHorizontal: m(16),
    paddingVertical: m(12),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(10),
  },
  searchInputContainer: {
    flex: 1,
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
  filterIconButton: {
    width: m(46),
    height: m(46),
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#FFB15C',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7ED',
  },
  filterIconButtonActive: {
    backgroundColor: '#FF8A00',
    borderColor: '#FF8A00',
  },
  filterIconButtonSelected: {
    backgroundColor: '#FF8A00',
    borderColor: '#FF8A00',
  },
  activeFilterPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
    marginTop: m(10),
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    borderRadius: m(999),
    borderWidth: 1,
    borderColor: '#FED7AA',
    backgroundColor: '#FFF7ED',
  },
  activeFilterText: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#FF8A00',
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: m(24),
    backgroundColor: 'rgba(17, 24, 39, 0.35)',
  },
  filterModal: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: m(12),
    padding: m(16),
  },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(8),
  },
  filterModalTitle: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#111827',
  },
  filterModalCloseText: {
    fontSize: m(13),
    fontWeight: '600',
    color: '#6B7280',
  },
  filterModalOption: {
    minHeight: m(44),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: m(10),
    paddingVertical: m(8),
    borderRadius: m(8),
    marginTop: m(6),
  },
  filterModalOptionActive: {
    backgroundColor: '#FFF7ED',
  },
  filterModalOptionText: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#374151',
  },
  filterModalOptionTextActive: {
    color: '#FF8A00',
  },
  filterModalCount: {
    minWidth: m(30),
    textAlign: 'right',
    fontSize: m(13),
    fontWeight: '700',
    color: '#6B7280',
  },

  // List
  listContainer: {
    paddingHorizontal: m(16),
    paddingTop: m(14),
    paddingBottom: m(170),
  },

  // Loan Card
  loanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(18),
    padding: m(16),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: '#EEF0F3',
    elevation: 3,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
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
  loanHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: m(10),
  },
  avatarCircle: {
    width: m(44),
    height: m(44),
    borderRadius: m(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: m(15),
    fontWeight: '700',
  },
  loanInfo: {
    flex: 1,
  },
  loanAmount: {
    fontSize: m(17),
    fontWeight: '700',
    color: '#111827',
    marginTop: m(2),
  },
  loanLender: {
    fontSize: m(14),
    fontWeight: '700',
    color: '#111827',
  },
  loanContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: m(4),
    gap: m(5),
  },
  loanContactText: {
    flex: 1,
    fontSize: m(12),
    color: '#9CA3AF',
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
  dueSoonBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: m(12),
    paddingVertical: m(8),
    borderRadius: m(8),
    marginBottom: m(12),
    gap: m(8),
  },
  dueSoonBannerText: {
    fontSize: m(12),
    fontWeight: '600',
    color: '#B45309',
    flex: 1,
  },
  loanDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: m(8),
    marginBottom: m(12),
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#EEF2F7',
    borderRadius: m(999),
    paddingHorizontal: m(10),
    paddingVertical: m(7),
    gap: m(6),
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
    alignItems: 'center',
    marginBottom: m(8),
    gap: m(8),
  },
  progressLabel: {
    fontSize: m(12),
    color: '#6B7280',
  },
  progressPercentLabel: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#111827',
  },
  progressBar: {
    height: m(8),
    backgroundColor: '#E5E7EB',
    borderRadius: m(999),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: m(999),
  },
  loanActions: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: m(10),
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
  amountPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: m(14),
    padding: m(12),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  amountBlockPrimary: {
    flex: 1.25,
  },
  amountBlock: {
    flex: 1,
    alignItems: 'flex-end',
  },
  amountDivider: {
    width: 1,
    height: m(34),
    backgroundColor: '#E5E7EB',
    marginHorizontal: m(10),
  },
  amountLabel: {
    fontSize: m(11),
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: m(4),
  },
  paidAmountText: {
    fontSize: m(13),
    fontWeight: '800',
    color: '#10B981',
  },
  remainingAmountText: {
    fontSize: m(13),
    fontWeight: '800',
    color: '#EF4444',
  },

  // Summary Card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    paddingHorizontal: m(16),
    paddingVertical: m(16),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#EEF0F3',
    elevation: 2,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  summaryTitle: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(12),
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: m(8),
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValueBubble: {
    width: m(40),
    height: m(40),
    borderRadius: m(20),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: m(6),
  },
  summaryValue: {
    fontSize: m(15),
    fontWeight: '700',
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
});
