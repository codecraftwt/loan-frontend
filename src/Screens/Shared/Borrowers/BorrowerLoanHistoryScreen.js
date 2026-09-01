import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  ActivityIndicator,
  Animated,
  Pressable,
  StatusBar,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { getBorrowerLoansById } from '../../../Redux/Slices/borrowerLoanSlice';
import { getPendingPayments } from '../../../Redux/Slices/lenderPaymentSlice';
import BorrowerReputationCard from '../../../Components/BorrowerReputationCard';
import SubscriptionRestriction from '../../../Components/SubscriptionRestriction';
import { useSubscription } from '../../../hooks/useSubscription';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import moment from 'moment';
import { m } from 'walstar-rn-responsive';
import { colors, FontFamily } from '../../../constants';

const ORANGE_THEME = {
  primary: colors.navy,
  primaryLight: colors.navyTint,
  primaryDark: colors.navyDark,
  secondary: colors.skySoft,
  accent: colors.butter,
  background: colors.offWhite,
  card: '#FFFFFF',
  text: colors.ink,
  textLight: colors.textSecondary,
  border: '#E2DED4',
  success: colors.success,
  warning: colors.goldDark,
  error: colors.error,
  info: colors.skyText,
  sky: colors.sky,
  mint: colors.mint,
  ink: colors.navyDark,
};

const HEADER_TOP_PADDING =
  Platform.OS === 'android'
    ? (StatusBar.currentHeight || m(24)) + m(16)
    : m(50);

const LoanHistoryCard = ({ loan, onPress, index = 0 }) => {
  const [scaleAnim] = useState(new Animated.Value(1));

  // Check if loan is overdue
  const isOverdue =
    loan.loanEndDate &&
    moment(loan.loanEndDate).isBefore(moment(), 'day') &&
    loan.remainingAmount > 0;

  // Get effective status
  const effectiveStatus = isOverdue
    ? 'overdue'
    : loan.paymentStatus || 'pending';

  const getStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return ORANGE_THEME.success;
      case 'part paid':
        return ORANGE_THEME.warning;
      case 'pending':
        return ORANGE_THEME.accent;
      case 'overdue':
        return ORANGE_THEME.error;
      default:
        return ORANGE_THEME.textLight;
    }
  };

  const getStatusIcon = status => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'check-circle';
      case 'part paid':
        return 'schedule';
      case 'pending':
        return 'hourglass-empty';
      case 'overdue':
        return 'error';
      default:
        return 'help';
    }
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const paymentPercent =
    loan.amount > 0 ? ((loan.totalPaid || 0) / loan.amount) * 100 : 0;
  const cardTint = colors.navyDark;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.loanCard,
          { borderLeftColor: cardTint },
          isOverdue && styles.overdueCard,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        {/* Overdue Banner */}
        {isOverdue && (
          <View style={styles.overdueBanner}>
            <Icon name="error" size={13} color={ORANGE_THEME.error} />
            <Text style={styles.overdueBannerText}>OVERDUE</Text>
            <Text style={styles.overdueDays}>
              {moment(loan.loanEndDate).fromNow()}
            </Text>
          </View>
        )}

        <View style={styles.loanCardHeader}>
          <View style={styles.loanInfo}>
            <Text style={styles.loanAmount}>
              ₹{loan.amount?.toLocaleString() || '0'}
            </Text>
            <Text style={styles.loanPurpose} numberOfLines={1}>
              {loan.purpose || 'Loan Amount'}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(effectiveStatus) + '15' },
            ]}
          >
            <Icon
              name={getStatusIcon(effectiveStatus)}
              size={12}
              color={getStatusColor(effectiveStatus)}
            />
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(effectiveStatus) },
              ]}
            >
              {effectiveStatus?.charAt(0).toUpperCase() +
                effectiveStatus?.slice(1) || 'Unknown'}
            </Text>
          </View>
        </View>

        <View style={styles.progressRow}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${paymentPercent}%`,
                  backgroundColor: getStatusColor(effectiveStatus),
                },
              ]}
            />
          </View>
          <Text style={styles.progressPercentText}>
            {paymentPercent.toFixed(0)}%
          </Text>
        </View>
        <View style={styles.progressLabels}>
          <Text style={[styles.progressLabel, { color: ORANGE_THEME.success }]}>
            Paid ₹{loan.totalPaid?.toLocaleString('en-IN') || '0'}
          </Text>
          <Text
            style={[
              styles.progressLabel,
              { color: isOverdue ? ORANGE_THEME.error : ORANGE_THEME.warning },
            ]}
          >
            Due ₹{loan.remainingAmount?.toLocaleString('en-IN') || loan.amount}
          </Text>
        </View>

        <View style={styles.loanDetails}>
          <View style={styles.detailItem}>
            <Icon
              name="event"
              size={12}
              color={isOverdue ? ORANGE_THEME.error : ORANGE_THEME.textLight}
            />
            <Text
              style={[
                styles.detailValue,
                { color: isOverdue ? ORANGE_THEME.error : ORANGE_THEME.text },
              ]}
              numberOfLines={1}
            >
              {moment(loan.loanEndDate).format('DD MMM YYYY')}
            </Text>
          </View>

          {loan.lenderId && (
            <View style={styles.detailItem}>
              <Icon name="person" size={12} color={ORANGE_THEME.info} />
              <Text style={styles.detailValue} numberOfLines={1}>
                {loan.lenderId.userName || 'N/A'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.loanFooter}>
          <View style={styles.dateContainer}>
            <Icon name="access-time" size={11} color={ORANGE_THEME.textLight} />
            <Text style={styles.loanDate}>
              {moment(loan.createdAt).format('DD MMM YYYY')}
            </Text>
          </View>
          <View style={styles.viewButton}>
            <Icon
              name="chevron-right"
              size={18}
              color={ORANGE_THEME.textLight}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const FilterModal = ({
  visible,
  onClose,
  filters,
  setFilters,
  applyFilters,
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [isStartDatePickerVisible, setStartDatePickerVisible] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);

  // Reset local filters when modal opens
  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  // Check if any filter has a value
  const hasActiveFilters = Boolean(
    localFilters.status ||
      localFilters.startDate ||
      localFilters.endDate ||
      localFilters.minAmount ||
      localFilters.maxAmount,
  );

  const handleApply = () => {
    applyFilters(localFilters);
    onClose();
  };

  const handleResetOrClose = () => {
    if (hasActiveFilters) {
      // Reset filters only - don't close modal
      const resetFilters = {
        status: '',
        startDate: '',
        endDate: '',
        minAmount: '',
        maxAmount: '',
      };
      setLocalFilters(resetFilters);
    } else {
      onClose();
    }
  };

  const handleStartDateConfirm = date => {
    setLocalFilters({
      ...localFilters,
      startDate: moment(date).format('YYYY-MM-DD'),
    });
    setStartDatePickerVisible(false);
  };

  const handleEndDateConfirm = date => {
    setLocalFilters({
      ...localFilters,
      endDate: moment(date).format('YYYY-MM-DD'),
    });
    setEndDatePickerVisible(false);
  };

  const statusOptions = [
    { label: 'All', value: '' },
    { label: 'Part Paid', value: 'part paid' },
    { label: 'Paid', value: 'paid' },
    { label: 'Pending', value: 'pending' },
    { label: 'Overdue', value: 'overdue' },
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.filterModalOverlay}>
        {/* Backdrop - closes modal when pressed */}
        <Pressable style={styles.filterModalBackdrop} onPress={onClose} />

        {/* Modal Content - doesn't close when interacting */}
        <View style={styles.filterModalContent}>
          <View style={styles.filterModalHandle} />

          <View style={styles.filterModalHeader}>
            <View style={styles.filterHeaderLeft}>
              <Icon name="filter-list" size={24} color={ORANGE_THEME.primary} />
              <Text style={styles.filterModalTitle}>Filter Loans</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} color={ORANGE_THEME.textLight} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.filterScroll}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            {/* Status Filter */}
            <View style={styles.filterSection}>
              <View style={styles.sectionHeader}>
                <Icon name="label" size={18} color={ORANGE_THEME.primary} />
                <Text style={styles.filterLabel}>Status</Text>
              </View>
              <View style={styles.statusFilterGrid}>
                {statusOptions.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.statusOption,
                      localFilters.status === option.value &&
                        styles.statusOptionSelected,
                    ]}
                    onPress={() =>
                      setLocalFilters({ ...localFilters, status: option.value })
                    }
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        localFilters.status === option.value &&
                          styles.statusOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Amount Range */}
            <View style={styles.filterSection}>
              <View style={styles.sectionHeader}>
                <Icon
                  name="attach-money"
                  size={18}
                  color={ORANGE_THEME.primary}
                />
                <Text style={styles.filterLabel}>Amount Range</Text>
              </View>
              <View style={styles.amountInputRow}>
                <View style={styles.amountInputContainer}>
                  <View style={styles.inputWithIcon}>
                    <Icon
                      name="arrow-downward"
                      size={16}
                      color={ORANGE_THEME.textLight}
                    />
                    <TextInput
                      style={styles.amountInput}
                      placeholder="Min"
                      value={localFilters.minAmount}
                      onChangeText={text =>
                        setLocalFilters({ ...localFilters, minAmount: text })
                      }
                      keyboardType="numeric"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
                <Icon
                  name="remove"
                  size={20}
                  color={ORANGE_THEME.primary}
                  style={styles.rangeSeparator}
                />
                <View style={styles.amountInputContainer}>
                  <View style={styles.inputWithIcon}>
                    <Icon
                      name="arrow-upward"
                      size={16}
                      color={ORANGE_THEME.textLight}
                    />
                    <TextInput
                      style={styles.amountInput}
                      placeholder="Max"
                      value={localFilters.maxAmount}
                      onChangeText={text =>
                        setLocalFilters({ ...localFilters, maxAmount: text })
                      }
                      keyboardType="numeric"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Date Range */}
            <View style={[styles.filterSection, { borderBottomWidth: 0 }]}>
              <View style={styles.sectionHeader}>
                <Icon
                  name="calendar-today"
                  size={18}
                  color={ORANGE_THEME.primary}
                />
                <Text style={styles.filterLabel}>Date Range</Text>
              </View>
              <View style={styles.dateInputRow}>
                <TouchableOpacity
                  style={styles.dateInputContainer}
                  onPress={() => setStartDatePickerVisible(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.inputWithIcon}>
                    <Icon
                      name="event"
                      size={16}
                      color={ORANGE_THEME.textLight}
                    />
                    <Text
                      style={[
                        styles.dateInputText,
                        !localFilters.startDate && styles.dateInputPlaceholder,
                      ]}
                    >
                      {localFilters.startDate
                        ? moment(localFilters.startDate).format('DD MMM YYYY')
                        : 'Start Date'}
                    </Text>
                  </View>
                </TouchableOpacity>
                <Icon
                  name="arrow-right-alt"
                  size={20}
                  color={ORANGE_THEME.primary}
                  style={styles.rangeSeparator}
                />
                <TouchableOpacity
                  style={styles.dateInputContainer}
                  onPress={() => setEndDatePickerVisible(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.inputWithIcon}>
                    <Icon
                      name="event"
                      size={16}
                      color={ORANGE_THEME.textLight}
                    />
                    <Text
                      style={[
                        styles.dateInputText,
                        !localFilters.endDate && styles.dateInputPlaceholder,
                      ]}
                    >
                      {localFilters.endDate
                        ? moment(localFilters.endDate).format('DD MMM YYYY')
                        : 'End Date'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.filterModalActions}>
            <TouchableOpacity
              style={[styles.filterButton, styles.resetButton]}
              onPress={handleResetOrClose}
            >
              <Icon
                name={hasActiveFilters ? 'refresh' : 'close'}
                size={18}
                color={ORANGE_THEME.textLight}
              />
              <Text style={styles.resetButtonText}>
                {hasActiveFilters ? 'Reset' : 'Close'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                styles.applyButton,
                !hasActiveFilters && styles.applyButtonDisabled,
              ]}
              onPress={handleApply}
              disabled={!hasActiveFilters}
            >
              <Icon
                name="check"
                size={18}
                color={hasActiveFilters ? '#FFFFFF' : '#9CA3AF'}
              />
              <Text
                style={[
                  styles.applyButtonText,
                  !hasActiveFilters && styles.applyButtonTextDisabled,
                ]}
              >
                Apply Filters
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Date Pickers */}
      <DateTimePickerModal
        isVisible={isStartDatePickerVisible}
        mode="date"
        onConfirm={handleStartDateConfirm}
        onCancel={() => setStartDatePickerVisible(false)}
        date={
          localFilters.startDate ? new Date(localFilters.startDate) : new Date()
        }
        maximumDate={
          localFilters.endDate ? new Date(localFilters.endDate) : new Date()
        }
      />
      <DateTimePickerModal
        isVisible={isEndDatePickerVisible}
        mode="date"
        onConfirm={handleEndDateConfirm}
        onCancel={() => setEndDatePickerVisible(false)}
        date={
          localFilters.endDate ? new Date(localFilters.endDate) : new Date()
        }
        minimumDate={
          localFilters.startDate ? new Date(localFilters.startDate) : undefined
        }
      />
    </Modal>
  );
};

const BorrowerLoanHistoryScreen = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const { borrowerId, borrowerDetails } = route.params || {};

  const {
    loans: borrowerHistory,
    loading: historyLoading,
    error: historyError,
    summary: historySummary,
    pagination: historyPagination,
  } = useSelector(state => state.borrowerLoans);

  const { pendingPayments } = useSelector(state => state.lenderPayments);
  const user = useSelector(state => state.auth.user);
  const isLender = user?.roleId === 1;
  const { hasActivePlan } = useSubscription();
  const { loading: planLoading } = useSelector(state => state.planPurchase);

  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
  });
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showReputation, setShowReputation] = useState(false);

  const aadhaarNumber =
    borrowerDetails?.aadharCardNo ||
    borrowerDetails?.aadhaarNumber ||
    (borrowerHistory && borrowerHistory.length > 0
      ? borrowerHistory[0].aadhaarNumber || borrowerHistory[0].aadharCardNo
      : null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadHistory = useCallback(
    (page = 1) => {
      if (!borrowerId) return;

      const params = {
        page,
        limit: 100,
        ...filters,
      };

      dispatch(
        getBorrowerLoansById({
          borrowerId,
          params,
        }),
      );
    },
    [borrowerId, dispatch, filters],
  );

  useEffect(() => {
    loadHistory(1);
  }, [loadHistory]);

  // Client-side search filtering by lender name and amount
  const filteredLoans = useMemo(() => {
    if (!borrowerHistory || borrowerHistory.length === 0) {
      return [];
    }

    if (!debouncedSearchQuery || !debouncedSearchQuery.trim()) {
      return borrowerHistory;
    }

    const query = debouncedSearchQuery.trim().toLowerCase();

    return borrowerHistory.filter(loan => {
      // Search by lender name
      const lenderName = loan.lenderId?.userName?.toLowerCase() || '';
      if (lenderName.includes(query)) {
        return true;
      }

      // Search by amount (convert to string for partial matching)
      const amount = loan.amount?.toString() || '';
      if (amount.includes(query)) {
        return true;
      }

      return false;
    });
  }, [borrowerHistory, debouncedSearchQuery]);

  // Fetch pending payments for lender
  useFocusEffect(
    useCallback(() => {
      if (isLender) {
        dispatch(getPendingPayments({ page: 1, limit: 100 }));
      }
    }, [dispatch, isLender]),
  );

  // Helper function to get pending payments for this borrower
  const getBorrowerPendingPayments = useCallback(() => {
    if (
      !isLender ||
      !pendingPayments ||
      !Array.isArray(pendingPayments) ||
      pendingPayments.length === 0
    ) {
      return null;
    }

    // Get borrower identifier
    const borrowerName = borrowerDetails?.userName || borrowerDetails?.name;
    const borrowerMobile = borrowerDetails?.mobileNo;
    const borrowerAadhaar =
      borrowerDetails?.aadharCardNo || borrowerDetails?.aadhaarNumber;

    if (!borrowerName && !borrowerMobile && !borrowerAadhaar) {
      return null;
    }

    // Find loans with pending payments for this borrower
    const borrowerLoans = pendingPayments.filter(loan => {
      // Match by name
      const nameMatch =
        (loan.loanName &&
          borrowerName &&
          loan.loanName.toLowerCase() === borrowerName.toLowerCase()) ||
        (loan.borrowerName &&
          borrowerName &&
          loan.borrowerName.toLowerCase() === borrowerName.toLowerCase());

      // Match by mobile
      const mobileMatch =
        loan.borrowerMobile &&
        borrowerMobile &&
        (loan.borrowerMobile === borrowerMobile ||
          loan.borrowerMobile === borrowerMobile.replace(/^\+91/, '') ||
          loan.borrowerMobile.replace(/^\+91/, '') === borrowerMobile);

      // Match by Aadhaar
      const aadhaarMatch =
        loan.borrowerAadhaar &&
        borrowerAadhaar &&
        loan.borrowerAadhaar === borrowerAadhaar;

      return nameMatch || mobileMatch || aadhaarMatch;
    });

    if (borrowerLoans.length === 0) return null;

    // Aggregate all pending payments
    let totalPendingCount = 0;
    let totalPendingAmount = 0;

    borrowerLoans.forEach(loan => {
      if (
        loan.pendingPayments &&
        Array.isArray(loan.pendingPayments) &&
        loan.pendingPayments.length > 0
      ) {
        totalPendingCount += loan.pendingPayments.length;
        loan.pendingPayments.forEach(payment => {
          const amount =
            typeof payment.amount === 'number'
              ? payment.amount
              : parseFloat(payment.amount) || 0;
          totalPendingAmount += amount;
        });
      }
    });

    if (totalPendingCount === 0) return null;

    return {
      count: totalPendingCount,
      amount: totalPendingAmount,
    };
  }, [isLender, pendingPayments, borrowerDetails]);

  const borrowerPendingPayments = getBorrowerPendingPayments();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, [loadHistory]);

  const handleLoanCardPress = loan => {
    if (isLender && !hasActivePlan) {
      return;
    }
    navigation.navigate('LoanDetailScreen', {
      loanId: loan._id,
      loanDetails: loan,
    });
  };

  const applyFilters = newFilters => {
    setFilters(newFilters);
  };

  const handleLoadMore = () => {
    if (
      historyPagination.currentPage < historyPagination.totalPages &&
      !historyLoading
    ) {
      loadHistory(historyPagination.currentPage + 1);
    }
  };

  const formatCurrency = amount => {
    return `₹${amount?.toLocaleString('en-IN') || '0'}`;
  };

  if (!borrowerId) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.navyDark} />
        <LinearGradient
          colors={[colors.navyDark, colors.navy]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.topHeader}
        >
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Icon name="chevron-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerTextBlock}>
            <Text style={styles.screenTitle}>Loan History</Text>
            <Text style={styles.screenSubtitle}>
              Track every loan you've extended
            </Text>
          </View>
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={60} color={ORANGE_THEME.error} />
          <Text style={styles.errorText}>Borrower ID is required</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navyDark} />
      <LinearGradient
        colors={[colors.navyDark, colors.navy]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.topHeader}
      >
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Icon name="chevron-left" size={24} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerTextBlock}>
          <Text style={styles.screenTitle}>Loan History</Text>
          <Text style={styles.screenSubtitle}>
            Track every loan you've extended
          </Text>
        </View>
      </LinearGradient>

      {/* Search and Filter Bar */}
      <View
        style={[
          styles.searchFilterContainer,
          isLender && !hasActivePlan && { opacity: 0.5 },
        ]}
      >
        <View style={styles.searchContainer}>
          <Icon
            name="search"
            size={22}
            color={ORANGE_THEME.primary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by lender or amount..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={ORANGE_THEME.textLight}
            editable={isLender ? hasActivePlan : true}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close" size={20} color={ORANGE_THEME.textLight} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.filterButtonContainer}
          onPress={() => setFilterModalVisible(true)}
        >
          <Icon name="tune" size={24} color="#FFFFFF" />
          {(filters.status ||
            filters.startDate ||
            filters.endDate ||
            filters.minAmount ||
            filters.maxAmount) && (
            <View style={styles.filterIndicator}>
              <Icon name="circle" size={8} color={ORANGE_THEME.accent} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={[
          styles.scrollContainer,
          isLender && !hasActivePlan && { opacity: 0.5 },
        ]}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[ORANGE_THEME.primary]}
            tintColor={ORANGE_THEME.primary}
            enabled={isLender ? hasActivePlan : true}
          />
        }
        showsVerticalScrollIndicator={false}
        scrollEnabled={isLender ? hasActivePlan : true}
      >
        {/* Pending Payments Badge for Lender */}
        {isLender &&
          borrowerPendingPayments &&
          borrowerPendingPayments.count > 0 && (
            <View style={styles.pendingPaymentBanner}>
              <Icon name="notifications" size={20} color="#FFFFFF" />
              <View style={styles.pendingPaymentBannerContent}>
                <Text style={styles.pendingPaymentBannerTitle}>
                  {borrowerPendingPayments.count} Pending Payment
                  {borrowerPendingPayments.count !== 1 ? 's' : ''}
                </Text>
                <Text style={styles.pendingPaymentBannerSubtitle}>
                  Total: {formatCurrency(borrowerPendingPayments.amount)}{' '}
                  awaiting your review
                </Text>
              </View>
              <TouchableOpacity
                style={styles.pendingPaymentButton}
                onPress={() => navigation.navigate('PendingPayments')}
              >
                <Text style={styles.pendingPaymentButtonText}>Review</Text>
                <Icon name="arrow-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

        {/* Summary Section - Hide when searching */}
        {historySummary && !debouncedSearchQuery && (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryHeader}>
              <View style={styles.summaryTitleContainer}>
                <Icon name="analytics" size={24} color={ORANGE_THEME.primary} />
                <Text style={styles.summaryTitle}>Loan Overview</Text>
              </View>
            </View>

            <View style={styles.summaryCards}>
              <View
                style={[
                  styles.summaryCard,
                  { backgroundColor: ORANGE_THEME.primaryLight },
                ]}
              >
                <View
                  style={[
                    styles.summaryIconContainer,
                    { backgroundColor: ORANGE_THEME.primary + '20' },
                  ]}
                >
                  <Icon name="receipt" size={15} color={ORANGE_THEME.primary} />
                </View>
                <Text style={styles.summaryNumber}>
                  {historySummary.totalLoans || 0}
                </Text>
                <Text style={styles.summaryLabel}>Total Loans</Text>
              </View>

              <View
                style={[styles.summaryCard, { backgroundColor: '#EFF6FF' }]}
              >
                <View
                  style={[
                    styles.summaryIconContainer,
                    { backgroundColor: ORANGE_THEME.info + '20' },
                  ]}
                >
                  <Icon
                    name="trending-up"
                    size={15}
                    color={ORANGE_THEME.info}
                  />
                </View>
                <Text
                  style={[styles.summaryNumber, { color: ORANGE_THEME.info }]}
                >
                  {historySummary.activeLoans || 0}
                </Text>
                <Text style={styles.summaryLabel}>Active</Text>
              </View>

              <View
                style={[styles.summaryCard, { backgroundColor: '#FEF3C7' }]}
              >
                <View
                  style={[
                    styles.summaryIconContainer,
                    { backgroundColor: ORANGE_THEME.warning + '20' },
                  ]}
                >
                  <Icon
                    name="check-circle"
                    size={15}
                    color={ORANGE_THEME.warning}
                  />
                </View>
                <Text
                  style={[
                    styles.summaryNumber,
                    { color: ORANGE_THEME.warning },
                  ]}
                >
                  {historySummary.completedLoans || 0}
                </Text>
                <Text style={styles.summaryLabel}>Completed</Text>
              </View>
            </View>

            <View style={styles.amountSummary}>
              <View style={styles.amountSummaryCard}>
                <View style={styles.amountHeader}>
                  <Icon
                    name="account-balance"
                    size={18}
                    color={ORANGE_THEME.info}
                  />
                  <Text style={styles.amountLabel}>Total Borrowed</Text>
                </View>
                <Text
                  style={[styles.amountValue, { color: ORANGE_THEME.info }]}
                >
                  {formatCurrency(historySummary.totalAmountBorrowed)}
                </Text>
              </View>

              <View style={styles.amountSummaryCard}>
                <View style={styles.amountHeader}>
                  <Icon
                    name="payments"
                    size={18}
                    color={ORANGE_THEME.success}
                  />
                  <Text style={styles.amountLabel}>Total Paid</Text>
                </View>
                <Text
                  style={[styles.amountValue, { color: ORANGE_THEME.success }]}
                >
                  {formatCurrency(historySummary.totalAmountPaid)}
                </Text>
              </View>

              <View style={styles.amountSummaryCard}>
                <View style={styles.amountHeader}>
                  <Icon
                    name="pending-actions"
                    size={18}
                    color={ORANGE_THEME.error}
                  />
                  <Text style={styles.amountLabel}>Remaining</Text>
                </View>
                <Text
                  style={[styles.amountValue, { color: ORANGE_THEME.error }]}
                >
                  {formatCurrency(historySummary.totalAmountRemaining)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Reputation Score Section - Hide when searching */}
        {/* In the BorrowerLoanHistoryScreen component, update the reputation section: */}

        {/* Reputation Score Section - Only for lenders */}
        {isLender &&
          aadhaarNumber &&
          aadhaarNumber.length === 12 &&
          !debouncedSearchQuery && (
            <View style={styles.reputationContainer}>
              <TouchableOpacity
                style={styles.reputationToggle}
                onPress={() => setShowReputation(!showReputation)}
                activeOpacity={0.8}
              >
                <View style={styles.reputationHeader}>
                  <View style={styles.reputationTitleContainer}>
                    <View style={styles.reputationIconContainer}>
                      <Icon name="shield" size={17} color={colors.goldDarker} />
                    </View>
                    <View>
                      <Text style={styles.reputationTitle}>
                        Credit Reputation
                      </Text>
                      <Text style={styles.reputationSubtitle}>
                        View reliability score & insights
                      </Text>
                    </View>
                  </View>
                  <Icon
                    name={
                      showReputation
                        ? 'keyboard-arrow-up'
                        : 'keyboard-arrow-down'
                    }
                    size={28}
                    color={ORANGE_THEME.textLight}
                  />
                </View>
              </TouchableOpacity>

              {showReputation && (
                <View style={styles.reputationCardWrapper}>
                  <BorrowerReputationCard
                    aadhaarNumber={aadhaarNumber}
                    compact={false}
                  />
                </View>
              )}
            </View>
          )}

        {/* Loans List Header */}
        <View style={styles.loansHeader}>
          <Text style={styles.loansTitle}>
            {debouncedSearchQuery ? 'Search Results' : 'Loan History'}
          </Text>
          <Text style={styles.loansCount}>
            {filteredLoans.length}{' '}
            {filteredLoans.length === 1 ? 'loan' : 'loans'}
            {debouncedSearchQuery && ` for "${debouncedSearchQuery}"`}
          </Text>
        </View>

        {/* Loans List */}
        {false && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={ORANGE_THEME.primary} />
            <Text style={styles.loadingText}>Loading loan history...</Text>
          </View>
        ) : historyError ? (
          <View style={styles.errorState}>
            <View style={styles.errorIconContainer}>
              <Icon name="error-outline" size={50} color={ORANGE_THEME.error} />
            </View>
            <Text style={styles.errorStateTitle}>Unable to Load History</Text>
            <Text style={styles.errorStateMessage}>{historyError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Icon name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredLoans.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Icon name="history" size={60} color={ORANGE_THEME.border} />
            </View>
            <Text style={styles.emptyTitle}>No Loan History Found</Text>
            <Text style={styles.emptySubtitle}>
              {debouncedSearchQuery ||
              filters.status ||
              filters.startDate ||
              filters.endDate ||
              filters.minAmount ||
              filters.maxAmount
                ? 'No loans match your search criteria. Try adjusting your filters.'
                : 'This borrower has no loan history yet'}
            </Text>
            {(debouncedSearchQuery ||
              filters.status ||
              filters.startDate ||
              filters.endDate ||
              filters.minAmount ||
              filters.maxAmount) && (
              <TouchableOpacity
                style={styles.clearFilterButton}
                onPress={() => {
                  setSearchQuery('');
                  setDebouncedSearchQuery('');
                  applyFilters({
                    status: '',
                    startDate: '',
                    endDate: '',
                    minAmount: '',
                    maxAmount: '',
                  });
                }}
              >
                <Icon name="clear" size={16} color={ORANGE_THEME.primary} />
                <Text style={styles.clearFilterText}>Clear All Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {filteredLoans.map((loan, index) => (
              <LoanHistoryCard
                key={loan._id || index}
                loan={loan}
                index={index}
                onPress={() => handleLoanCardPress(loan)}
              />
            ))}
            {!debouncedSearchQuery &&
              historyPagination.currentPage < historyPagination.totalPages && (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={handleLoadMore}
                  disabled={historyLoading}
                >
                  {historyLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={ORANGE_THEME.primary}
                    />
                  ) : (
                    <>
                      <Text style={styles.loadMoreText}>Load More Loans</Text>
                      <Icon
                        name="expand-more"
                        size={20}
                        color={ORANGE_THEME.primary}
                      />
                    </>
                  )}
                </TouchableOpacity>
              )}
          </>
        )}
      </ScrollView>

      {/* Subscription Restriction Overlay */}
      {isLender && !planLoading && !hasActivePlan && (
        <SubscriptionRestriction
          message="Purchase a plan to view borrower loan history"
          asOverlay={true}
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={filters}
        setFilters={setFilters}
        applyFilters={applyFilters}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: m(118),
    paddingTop: HEADER_TOP_PADDING,
    paddingHorizontal: m(18),
    paddingBottom: m(18),
    borderBottomLeftRadius: m(24),
    borderBottomRightRadius: m(24),
  },
  headerBackButton: {
    width: m(34),
    height: m(34),
    borderRadius: m(17),
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(12),
  },
  headerTextBlock: {
    flex: 1,
  },
  screenTitle: {
    fontSize: m(17),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  screenSubtitle: {
    marginTop: m(2),
    fontSize: m(10),
    fontFamily: FontFamily.bodyMedium,
    color: 'rgba(255, 255, 255, 0.82)',
  },
  // Summary Section
  summaryContainer: {
    backgroundColor: ORANGE_THEME.card,
    marginHorizontal: m(16),
    marginTop: m(12),
    marginBottom: m(12),
    padding: m(12),
    borderRadius: m(14),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: ORANGE_THEME.border,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(12),
  },
  summaryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
  },
  summaryTitle: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: ORANGE_THEME.text,
  },
  refreshButton: {
    width: m(32),
    height: m(32),
    borderRadius: m(16),
    backgroundColor: ORANGE_THEME.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: m(11),
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: m(10),
    borderRadius: m(9),
    marginHorizontal: m(4),
  },
  summaryIconContainer: {
    width: m(28),
    height: m(28),
    borderRadius: m(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(3),
  },
  summaryNumber: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryExtraBold,
    color: ORANGE_THEME.primary,
    marginBottom: m(1),
  },
  summaryLabel: {
    fontSize: m(9),
    color: ORANGE_THEME.textLight,
    fontFamily: FontFamily.primaryMedium,
  },
  amountSummary: {
    backgroundColor: '#F7F5EF',
    borderRadius: m(10),
    paddingHorizontal: m(10),
    paddingVertical: m(8),
  },
  amountSummaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: m(6),
    borderBottomWidth: 1,
    borderBottomColor: '#E2DED4',
  },
  amountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  amountLabel: {
    fontSize: m(12),
    color: ORANGE_THEME.textLight,
    fontFamily: FontFamily.primaryMedium,
  },
  amountValue: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
  },
  // Search and Filter
  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(16),
    paddingTop: m(12),
    paddingBottom: m(2),
    backgroundColor: colors.offWhite,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: m(10),
    paddingHorizontal: m(12),
    marginRight: m(10),
    borderWidth: 1,
    borderColor: ORANGE_THEME.border,
  },
  searchIcon: {
    marginRight: m(10),
  },
  searchInput: {
    flex: 1,
    height: m(42),
    fontSize: m(12),
    color: ORANGE_THEME.text,
    fontFamily: FontFamily.primaryMedium,
  },
  clearSearchButton: {
    padding: m(4),
    marginLeft: m(4),
  },
  filterButtonContainer: {
    width: m(42),
    height: m(42),
    borderRadius: m(10),
    backgroundColor: ORANGE_THEME.ink,
    borderWidth: 1,
    borderColor: ORANGE_THEME.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterIndicator: {
    position: 'absolute',
    top: m(6),
    right: m(6),
  },
  // Scroll Content
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: m(24),
  },
  // Loan Card
  loanCard: {
    backgroundColor: ORANGE_THEME.card,
    borderRadius: m(12),
    padding: m(12),
    paddingLeft: m(12),
    marginHorizontal: m(16),
    marginBottom: m(10),
    borderWidth: 1,
    borderLeftWidth: m(3),
    borderColor: ORANGE_THEME.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  overdueCard: {
    borderWidth: 1.5,
    borderColor: ORANGE_THEME.error + '80',
  },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ORANGE_THEME.error + '12',
    paddingVertical: m(4),
    paddingHorizontal: m(10),
    marginLeft: m(-15),
    marginRight: m(-12),
    marginTop: m(-12),
    marginBottom: m(6),
    gap: m(5),
    borderBottomWidth: 1,
    borderBottomColor: ORANGE_THEME.error + '20',
  },
  overdueBannerText: {
    color: ORANGE_THEME.error,
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryBold,
    letterSpacing: 0.5,
  },
  overdueDays: {
    color: ORANGE_THEME.error,
    fontSize: m(10),
    fontFamily: FontFamily.primarySemiBold,
    marginLeft: 'auto',
  },
  loanCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: m(8),
  },
  loanInfo: {
    flex: 1,
    marginRight: m(8),
  },
  loanAmount: {
    fontSize: m(18),
    fontFamily: FontFamily.primaryBold,
    color: ORANGE_THEME.text,
    marginBottom: m(1),
    letterSpacing: -0.3,
  },
  loanPurpose: {
    fontSize: m(11),
    color: ORANGE_THEME.textLight,
    fontFamily: FontFamily.primaryMedium,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(7),
    paddingVertical: m(3),
    borderRadius: m(16),
    gap: m(3),
  },
  statusText: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  loanDetails: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: m(8),
    paddingVertical: m(7),
    paddingHorizontal: m(8),
    gap: m(12),
    marginTop: m(5),
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  progressBar: {
    flex: 1,
    height: m(3),
    backgroundColor: 'rgba(255, 255, 255, 0.62)',
    borderRadius: m(2),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: m(2),
  },
  progressPercentText: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: ORANGE_THEME.text,
    width: m(28),
    textAlign: 'right',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: m(5),
  },
  progressLabel: {
    fontSize: m(10),
    fontFamily: FontFamily.primarySemiBold,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(5),
    flexShrink: 1,
  },
  detailValue: {
    fontSize: m(11),
    fontFamily: FontFamily.primarySemiBold,
    color: ORANGE_THEME.text,
  },
  loanFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: m(8),
    paddingTop: m(9),
    borderTopWidth: 1,
    borderTopColor: 'rgba(17, 24, 39, 0.12)',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
  },
  loanDate: {
    fontSize: m(10),
    color: ORANGE_THEME.textLight,
    fontFamily: FontFamily.primaryMedium,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1EFE8',
    borderRadius: m(18),
    paddingHorizontal: m(8),
    paddingVertical: m(5),
    gap: m(3),
    justifyContent: 'center',
  },
  viewButtonText: {
    fontSize: m(11),
    color: '#FFFFFF',
    fontFamily: FontFamily.primaryBold,
  },
  // Loans Header
  loansHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: m(16),
    marginTop: m(4),
    marginBottom: m(8),
  },
  loansTitle: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: ORANGE_THEME.text,
  },
  loansCount: {
    fontSize: m(12),
    color: '#FFFFFF',
    fontFamily: FontFamily.primarySemiBold,
    backgroundColor: colors.navyDark,
    paddingHorizontal: m(10),
    paddingVertical: m(3),
    borderRadius: m(12),
  },
  // Loading States
  loadingContainer: {
    padding: m(60),
    alignItems: 'center',
  },
  loadingText: {
    marginTop: m(16),
    fontSize: m(14),
    color: ORANGE_THEME.textLight,
    fontFamily: FontFamily.primaryMedium,
  },
  errorState: {
    padding: m(40),
    alignItems: 'center',
  },
  errorIconContainer: {
    width: m(80),
    height: m(80),
    borderRadius: m(40),
    backgroundColor: ORANGE_THEME.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(16),
  },
  errorStateTitle: {
    fontSize: m(18),
    fontFamily: FontFamily.primaryBold,
    color: ORANGE_THEME.text,
    marginBottom: m(8),
  },
  errorStateMessage: {
    fontSize: m(14),
    color: ORANGE_THEME.textLight,
    textAlign: 'center',
    marginBottom: m(24),
    lineHeight: m(20),
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    backgroundColor: ORANGE_THEME.primary,
    paddingHorizontal: m(24),
    paddingVertical: m(12),
    borderRadius: m(12),
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: m(14),
    fontFamily: FontFamily.primarySemiBold,
  },
  emptyState: {
    padding: m(40),
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: m(100),
    height: m(100),
    borderRadius: m(50),
    backgroundColor: ORANGE_THEME.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(20),
  },
  emptyTitle: {
    fontSize: m(18),
    fontFamily: FontFamily.primaryBold,
    color: ORANGE_THEME.text,
    marginBottom: m(8),
  },
  emptySubtitle: {
    fontSize: m(14),
    color: ORANGE_THEME.textLight,
    textAlign: 'center',
    marginBottom: m(20),
    lineHeight: m(20),
  },
  clearFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    backgroundColor: ORANGE_THEME.primaryLight,
    paddingHorizontal: m(20),
    paddingVertical: m(12),
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: ORANGE_THEME.border,
  },
  clearFilterText: {
    color: ORANGE_THEME.primary,
    fontSize: m(14),
    fontFamily: FontFamily.primarySemiBold,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
    backgroundColor: ORANGE_THEME.card,
    padding: m(16),
    borderRadius: m(12),
    marginHorizontal: m(16),
    marginTop: m(8),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: ORANGE_THEME.border,
  },
  loadMoreText: {
    color: ORANGE_THEME.primary,
    fontSize: m(14),
    fontFamily: FontFamily.primarySemiBold,
  },
  // Reputation Section
  reputationContainer: {
    backgroundColor: ORANGE_THEME.card,
    marginHorizontal: m(16),
    marginBottom: m(12),
    borderRadius: m(14),
    borderWidth: 1,
    borderColor: ORANGE_THEME.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  reputationToggle: {
    paddingVertical: m(12),
    paddingHorizontal: m(14),
  },
  reputationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reputationTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(9),
  },
  reputationIconContainer: {
    width: m(34),
    height: m(34),
    borderRadius: m(10),
    backgroundColor: colors.goldFaint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reputationTitle: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: ORANGE_THEME.text,
    marginBottom: m(2),
  },
  reputationSubtitle: {
    fontSize: m(10),
    color: ORANGE_THEME.textLight,
    fontFamily: FontFamily.primaryRegular,
  },
  reputationCardWrapper: {
    paddingHorizontal: m(12),
    paddingBottom: m(12),
  },
  // Filter Modal
  filterModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  filterModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  filterModalContent: {
    backgroundColor: ORANGE_THEME.card,
    borderTopLeftRadius: m(24),
    borderTopRightRadius: m(24),
    paddingBottom: m(20),
  },
  filterModalHandle: {
    width: m(40),
    height: m(4),
    backgroundColor: ORANGE_THEME.border,
    borderRadius: m(2),
    alignSelf: 'center',
    marginTop: m(12),
    marginBottom: m(8),
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: m(20),
    borderBottomWidth: 1,
    borderBottomColor: ORANGE_THEME.border,
  },
  filterHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(10),
  },
  filterModalTitle: {
    fontSize: m(20),
    fontFamily: FontFamily.primaryBold,
    color: ORANGE_THEME.text,
  },
  closeButton: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    backgroundColor: ORANGE_THEME.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterScroll: {
    paddingHorizontal: m(20),
    maxHeight: m(400),
  },
  filterSection: {
    paddingVertical: m(10),
    borderBottomWidth: 1,
    borderBottomColor: ORANGE_THEME.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    marginBottom: m(16),
    // margin
  },
  filterLabel: {
    fontSize: m(16),
    fontFamily: FontFamily.primarySemiBold,
    color: ORANGE_THEME.text,
  },
  statusFilterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(8),
  },
  statusOption: {
    paddingHorizontal: m(16),
    paddingVertical: m(10),
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: ORANGE_THEME.border,
    backgroundColor: ORANGE_THEME.primaryLight,
  },
  statusOptionSelected: {
    backgroundColor: ORANGE_THEME.primary,
    borderColor: ORANGE_THEME.primary,
  },
  statusOptionText: {
    fontSize: m(14),
    color: ORANGE_THEME.text,
    fontFamily: FontFamily.primaryMedium,
  },
  statusOptionTextSelected: {
    color: '#FFFFFF',
    fontFamily: FontFamily.primarySemiBold,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountInputContainer: {
    flex: 1,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ORANGE_THEME.primaryLight,
    borderRadius: m(12),
    paddingHorizontal: m(12),
    borderWidth: 1,
    borderColor: ORANGE_THEME.border,
  },
  amountInput: {
    flex: 1,
    height: m(48),
    fontSize: m(15),
    color: ORANGE_THEME.text,
    fontFamily: FontFamily.primaryMedium,
    paddingHorizontal: m(8),
  },
  rangeSeparator: {
    marginHorizontal: m(12),
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateInputContainer: {
    flex: 1,
  },
  dateInput: {
    flex: 1,
    height: m(48),
    fontSize: m(15),
    color: ORANGE_THEME.text,
    paddingHorizontal: m(8),
  },
  dateInputText: {
    flex: 1,
    fontSize: m(14),
    color: ORANGE_THEME.text,
    paddingHorizontal: m(8),
    paddingVertical: m(14),
    fontFamily: FontFamily.primaryMedium,
  },
  dateInputPlaceholder: {
    color: '#9CA3AF',
  },
  filterModalActions: {
    flexDirection: 'row',
    paddingHorizontal: m(20),
    paddingTop: m(16),
    paddingBottom: m(10),
    borderTopWidth: 1,
    borderTopColor: ORANGE_THEME.border,
    gap: m(12),
    backgroundColor: ORANGE_THEME.card,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
    paddingVertical: m(14),
    paddingHorizontal: m(16),
    borderRadius: m(12),
    minHeight: m(50),
  },
  resetButton: {
    backgroundColor: ORANGE_THEME.primaryLight,
    borderWidth: 1,
    borderColor: ORANGE_THEME.border,
  },
  resetButtonText: {
    color: ORANGE_THEME.text,
    fontSize: m(15),
    fontFamily: FontFamily.primarySemiBold,
  },
  applyButton: {
    backgroundColor: ORANGE_THEME.primary,
  },
  applyButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: m(15),
    fontFamily: FontFamily.primarySemiBold,
  },
  applyButtonTextDisabled: {
    color: '#9CA3AF',
  },
  // Error Container
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: m(40),
  },
  errorText: {
    fontSize: m(16),
    color: ORANGE_THEME.error,
    fontFamily: FontFamily.primarySemiBold,
    marginTop: m(16),
  },
  // Pending Payment Banner
  pendingPaymentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ORANGE_THEME.warning,
    marginHorizontal: m(16),
    marginTop: m(12),
    marginBottom: m(16),
    padding: m(16),
    borderRadius: m(16),
    gap: m(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  pendingPaymentBannerContent: {
    flex: 1,
  },
  pendingPaymentBannerTitle: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: '#FFFFFF',
    marginBottom: m(4),
  },
  pendingPaymentBannerSubtitle: {
    fontSize: m(12),
    color: '#FFFFFF',
    fontFamily: FontFamily.primaryRegular,
    opacity: 0.9,
  },
  pendingPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: m(12),
    paddingVertical: m(8),
    borderRadius: m(8),
    gap: m(4),
  },
  pendingPaymentButtonText: {
    fontSize: m(13),
    fontFamily: FontFamily.primarySemiBold,
    color: '#FFFFFF',
  },
});

export default BorrowerLoanHistoryScreen;
