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
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import Toast from 'react-native-toast-message';
import {
  getBorrowerLoans,
} from '../../../Redux/Slices/borrowerLoanSlice';
import { colors, FontFamily } from '../../../constants';

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

  // Spin animation interpolation
  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Render Functions
  const renderLoanCard = ({ item, index }) => {
    const isOverdue = item.overdueDetails?.isOverdue === true;
    const cardTint = index % 2 === 0 ? colors.sky : colors.mint;
    const loanLabel = `Loan ${String(index + 1).padStart(2, '0')}`;

    return (
      <Animated.View
        style={[
          styles.loanCard,
          { backgroundColor: cardTint },
          isOverdue && styles.overdueCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate('BorrowerLoanDetails', { loan: item })
          }>
          <View style={styles.loanCardTopRow}>
            <View style={styles.loanCardLabelRow}>
              <Text style={styles.loanCardLabel}>{loanLabel}</Text>
              {isOverdue && <View style={styles.overdueDot} />}
            </View>
            <View style={styles.detailsPill}>
              <Text style={styles.detailsPillText}>Details</Text>
            </View>
          </View>

          <View>
            <Text style={styles.loanLender} numberOfLines={1}>
              {item.lenderId?.userName || 'Unknown Lender'}
            </Text>
            <Text style={styles.loanAmount}>
              Rs {item.amount?.toLocaleString('en-IN') || 0}
            </Text>
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
        color: colors.navy,
      },
      {
        id: 'activeLoans',
        value: summary.activeLoans,
        label: 'Active',
        color: colors.goldDark,
      },
      {
        id: 'completedLoans',
        value: summary.completedLoans,
        label: 'Completed',
        color: colors.success,
      },
      {
        id: 'overdueLoans',
        value: overdueCount,
        label: 'Overdue',
        color: overdueCount > 0 ? colors.error : colors.textSecondary,
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
                  { backgroundColor: item.color + '2A' },
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
          <Ionicons name={icon} size={60} color={colors.textMuted} />
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
          <Ionicons name="document-text" size={50} color={colors.gold} />
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

  const renderCardConnector = () => (
    <View style={styles.cardConnector} pointerEvents="none">
      <View style={styles.cardConnectorCircle}>
        <Icon name="target" size={m(18)} color={colors.white} />
      </View>
    </View>
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
                color={colors.textSecondary}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by lender, amount, or status"
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={colors.textMuted}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Icon name="x" size={m(20)} color={colors.textSecondary} />
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
                color={activeTab !== 'all' || showFilterModal ? colors.white : colors.gold}
              />
            </TouchableOpacity>
          </View>

          {activeTab !== 'all' && (
            <TouchableOpacity
              style={styles.activeFilterPill}
              onPress={() => handleFilterSelect('all')}
              activeOpacity={0.75}>
              <Text style={styles.activeFilterText}>{activeFilterLabel}</Text>
              <Icon name="x" size={m(14)} color={colors.gold} />
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
            ItemSeparatorComponent={renderCardConnector}
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
    backgroundColor: colors.navyFaint,
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
    color: colors.textPrimary,
  },
  loadingSubtitle: {
    marginTop: m(8),
    fontSize: m(14),
    color: colors.textSecondary,
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
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: m(20),
  },
  emptyTitle: {
    fontSize: m(18),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.textPrimary,
    marginTop: m(16),
    marginBottom: m(8),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: m(14),
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: m(20),
    paddingHorizontal: m(32),
  },

  // Search
  searchContainer: {
    paddingHorizontal: m(16),
    paddingVertical: m(12),
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    backgroundColor: colors.background,
    borderRadius: m(12),
    paddingHorizontal: m(12),
    paddingVertical: m(10),
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: m(8),
  },
  searchInput: {
    flex: 1,
    fontSize: m(14),
    color: colors.textPrimary,
    paddingVertical: m(4),
  },
  filterIconButton: {
    width: m(46),
    height: m(46),
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: colors.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldTint,
  },
  filterIconButtonActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  filterIconButtonSelected: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
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
    borderColor: colors.goldLight,
    backgroundColor: colors.goldTint,
  },
  activeFilterText: {
    fontSize: m(12),
    fontWeight: '700',
    color: colors.gold,
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
    backgroundColor: colors.surface,
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
    color: colors.textPrimary,
  },
  filterModalCloseText: {
    fontSize: m(13),
    fontWeight: '600',
    color: colors.textSecondary,
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
    backgroundColor: colors.goldTint,
  },
  filterModalOptionText: {
    fontSize: m(14),
    fontWeight: '600',
    color: colors.navy,
  },
  filterModalOptionTextActive: {
    color: colors.gold,
  },
  filterModalCount: {
    minWidth: m(30),
    textAlign: 'right',
    fontSize: m(13),
    fontWeight: '700',
    color: colors.textSecondary,
  },

  // List
  listContainer: {
    paddingHorizontal: m(16),
    paddingTop: m(14),
    paddingBottom: m(170),
  },

  // Loan Card
  loanCard: {
    borderRadius: m(20),
    padding: m(14),
  },
  overdueCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  cardConnector: {
    alignItems: 'center',
    zIndex: 10,
  },
  cardConnectorCircle: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -m(17),
    marginBottom: -m(17),
    borderWidth: 3,
    borderColor: colors.offWhite,
    elevation: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  loanCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(10),
  },
  loanCardLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  loanCardLabel: {
    fontSize: m(13),
    fontFamily: FontFamily.bodySemiBold,
    color: colors.inkSoft,
  },
  overdueDot: {
    width: m(7),
    height: m(7),
    borderRadius: m(4),
    backgroundColor: colors.error,
  },
  detailsPill: {
    backgroundColor: colors.ink,
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(18),
  },
  detailsPillText: {
    fontSize: m(12),
    fontFamily: FontFamily.bodySemiBold,
    color: colors.white,
  },
  loanLender: {
    fontSize: m(12),
    fontFamily: FontFamily.bodyRegular,
    color: colors.inkSoft,
    marginBottom: m(3),
  },
  loanAmount: {
    fontSize: m(20),
    fontFamily: FontFamily.primaryExtraBold,
    color: colors.ink,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: m(16),
    paddingHorizontal: m(16),
    paddingVertical: m(16),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: colors.borderLight,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  summaryTitle: {
    fontSize: m(15),
    lineHeight: m(20),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.textPrimary,
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
    fontFamily: FontFamily.primaryExtraBold,
  },
  summaryLabel: {
    fontSize: m(10),
    lineHeight: m(14),
    fontFamily: FontFamily.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryHighlightLabel: {
    color: colors.error,
    fontFamily: FontFamily.bodySemiBold,
  },
});
