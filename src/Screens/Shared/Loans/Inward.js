import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  RefreshControl,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import {
  getLoanByLender,
  checkFraudStatus,
} from '../../../Redux/Slices/loanSlice';
import { getPendingPayments } from '../../../Redux/Slices/lenderPaymentSlice';
import { database } from '../../../database';
import { Q } from '@nozbe/watermelondb';
import FraudStatusBadge from '../../../Components/FraudStatusBadge';
import SubscriptionRestriction from '../../../Components/SubscriptionRestriction';
import { useSubscription } from '../../../hooks/useSubscription';
// getActivePlan is already dispatched in Home screen on app focus
import { useFocusEffect, useRoute } from '@react-navigation/native';
import moment from 'moment';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { colors, FontFamily } from '../../../constants';

export default function Inward({ navigation }) {
  const dispatch = useDispatch();
  const route = useRoute();
  const user = useSelector(state => state.auth.user);
  const { lenderLoans, loading } = useSelector(
    state => state.loans,
  );
  const { pendingPayments } = useSelector(state => state.lenderPayments);
  const isLender = user?.roleId === 1;
  const { hasActivePlan } = useSubscription();
  const { loading: planLoading } = useSelector(state => state.planPurchase);
  
  // Get highlightLoanId from route params
  const highlightLoanId = route.params?.highlightLoanId;
  const scrollViewRef = React.useRef(null);
  const loanCardRefs = React.useRef({});

  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [startDateFilter, setStartDateFilter] = useState(null);
  const [endDateFilter, setEndDateFilter] = useState(null);
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [currentDateType, setCurrentDateType] = useState('start');
  const [tempDate, setTempDate] = useState(new Date());

  // Add debounced search state
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Fraud status state for borrowers
  const [borrowerFraudStatus, setBorrowerFraudStatus] = useState({});

  const [localPendingLoans, setLocalPendingLoans] = useState([]);

  const fetchLocalLoans = useCallback(async () => {
    try {
      const pendingLoans = await database.get('loans').query(
        Q.where('sync_status', 'pending')
      ).fetch();

      const standardLoans = pendingLoans.map(loan => ({
        _id: loan.id,
        name: loan.name,
        mobileNumber: loan.mobileNumber,
        aadhaarNumber: loan.aadhaarNumber,
        address: loan.address,
        amount: loan.amount,
        purpose: loan.purpose,
        loanMode: loan.loanMode,
        loanStartDate: loan.loanStartDate,
        loanEndDate: loan.loanEndDate,
        syncStatus: 'pending',
        remainingAmount: loan.amount,
        borrowerAcceptanceStatus: 'pending',
        paymentStatus: 'pending',
        isOffline: true,
      }));

      setLocalPendingLoans(standardLoans);
    } catch (error) {
      console.error('Error fetching local pending loans:', error);
    }
  }, []);

  const displayLoans = useMemo(() => {
    // Combine local pending loans and API loans
    return [...localPendingLoans, ...(lenderLoans || [])];
  }, [localPendingLoans, lenderLoans]);

  const formatDate = date => moment(date).format('DD MMM, YYYY');

  // Helper function to get pending payments for a borrower
  const getBorrowerPendingPayments = (borrower) => {
    if (!isLender || !pendingPayments || !Array.isArray(pendingPayments) || pendingPayments.length === 0) {
      return null;
    }
    
    // Try multiple matching strategies
    const borrowerLoans = pendingPayments.filter(loan => {
      // Match by name
      const nameMatch = (
        (loan.loanName && borrower.name && 
         loan.loanName.toLowerCase() === borrower.name.toLowerCase()) ||
        (loan.borrowerName && borrower.name && 
         loan.borrowerName.toLowerCase() === borrower.name.toLowerCase())
      );
      
      // Match by mobile
      const mobileMatch = loan.borrowerMobile && borrower.mobileNumber && (
        loan.borrowerMobile === borrower.mobileNumber ||
        loan.borrowerMobile === borrower.mobileNumber.replace(/^\+91/, '') ||
        loan.borrowerMobile.replace(/^\+91/, '') === borrower.mobileNumber
      );
      
      // Match by Aadhaar
      const aadhaarMatch = loan.borrowerAadhaar && borrower.aadhaarNumber && 
        loan.borrowerAadhaar === borrower.aadhaarNumber;
      return nameMatch || mobileMatch || aadhaarMatch;
    });
    
    if (borrowerLoans.length === 0) return null;
    
    // Aggregate all pending payments for this borrower
    let totalPendingCount = 0;
    let totalPendingAmount = 0;
    
    borrowerLoans.forEach(loan => {
      if (loan.pendingPayments && Array.isArray(loan.pendingPayments) && loan.pendingPayments.length > 0) {
        totalPendingCount += loan.pendingPayments.length;
        loan.pendingPayments.forEach(payment => {
          const amount = typeof payment.amount === 'number' 
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
  };

  // Add debouncing effect for search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch given loans when debounced search changes
  useEffect(() => {
    const filters = {};
    if (debouncedSearch) {
      filters.search = debouncedSearch;
    }
    dispatch(getLoanByLender(filters));
  }, [debouncedSearch, dispatch]);

  // Check if any filter has a value
  const hasActiveFilters = Boolean(
    startDateFilter ||
    endDateFilter ||
    minAmount ||
    maxAmount ||
    statusFilter ||
    searchQuery
  );

  const handleResetOrClose = () => {
    if (hasActiveFilters) {
      setStartDateFilter(null);
      setEndDateFilter(null);
      setMinAmount('');
      setMaxAmount('');
      setStatusFilter(null);
      setSearchQuery('');
      setDebouncedSearch('');
    } else {
      setIsFilterModalVisible(false);
    }
  };

  const handleSubmitFilters = async () => {
    const filters = {
      startDate: startDateFilter
        ? moment(startDateFilter).format('YYYY-MM-DD')
        : null,
      endDate: endDateFilter
        ? moment(endDateFilter).format('YYYY-MM-DD')
        : null,
      minAmount: minAmount || null,
      maxAmount: maxAmount || null,
      status: statusFilter || null,
      // Include search query in filters if it exists
      ...(debouncedSearch && { search: debouncedSearch }),
    };
    setIsFilterModalVisible(false);
    await dispatch(getLoanByLender(filters));
  };

  const onRefresh = async () => {
    const filters = {};
    if (debouncedSearch) {
      filters.search = debouncedSearch;
    }
    await dispatch(getLoanByLender(filters));
    await fetchLocalLoans();
  };

  useFocusEffect(
    useCallback(() => {
      const filters = {};
      if (debouncedSearch) {
        filters.search = debouncedSearch;
      }
      dispatch(getLoanByLender(filters));
      fetchLocalLoans();
      
      // Fetch pending payments for lender
      if (isLender) {
        dispatch(getPendingPayments({ page: 1, limit: 100 }));
      }
    }, [dispatch, debouncedSearch, isLender, fetchLocalLoans]),
  );

  // Effect to scroll to and highlight loan when highlightLoanId is provided
  useEffect(() => {
    if (highlightLoanId && lenderLoans?.length > 0 && scrollViewRef.current) {
      const loanIndex = lenderLoans.findIndex(loan => loan._id === highlightLoanId);
      if (loanIndex !== -1) {
        setTimeout(() => {
          const cardRef = loanCardRefs.current[highlightLoanId];
          if (cardRef && scrollViewRef.current) {
            cardRef.measureLayout(
              scrollViewRef.current.getInnerViewNode?.() || scrollViewRef.current,
              (x, y) => {
                scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 100), animated: true });
              },
              () => {
                const estimatedY = loanIndex * 200;
                scrollViewRef.current?.scrollTo({ y: Math.max(0, estimatedY - 100), animated: true });
              }
            );
          }
        }, 800);
      }
    }
  }, [highlightLoanId, lenderLoans]);

  const formatCurrency = (amount) => {
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    return `₹${numAmount.toLocaleString('en-IN')}`;
  };

  // Fetch fraud status for a borrower
  const fetchFraudStatus = async (aadhaarNumber) => {
    if (!aadhaarNumber || aadhaarNumber.length !== 12) return;
    
    // Check if we already have fraud status for this borrower
    if (borrowerFraudStatus[aadhaarNumber]) return;
    
      try {
        const result = await dispatch(checkFraudStatus(aadhaarNumber));
        if (checkFraudStatus.fulfilled.match(result)) {
          setBorrowerFraudStatus(prev => ({
            ...prev,
            [aadhaarNumber]: result.payload,
          }));
        }
      } catch (error) {
        console.error('Error fetching fraud status:', error);
      }
  };

  // Group loans by borrower (using aadhaarNumber or name as identifier)
  const groupLoansByBorrower = (loans) => {
    if (!loans || loans.length === 0) return [];
    
    const grouped = {};
    loans.forEach(loan => {
      // Use aadhaarNumber as primary identifier, fallback to name
      const borrowerId = loan.aadhaarNumber || loan.aadharCardNo || loan.name || 'unknown';
      const aadhaarNumber = loan.aadhaarNumber || loan.aadharCardNo;
      
      if (!grouped[borrowerId]) {
        grouped[borrowerId] = {
          borrower: {
            name: loan.name,
            mobileNumber: loan.mobileNumber,
            aadhaarNumber: aadhaarNumber,
            profileImage: loan.profileImage,
            address: loan.address,
          },
          loans: [],
        };
      }
      grouped[borrowerId].loans.push(loan);
    });
    
    // Sort by borrower name for consistent display
    return Object.values(grouped).sort((a, b) => 
      (a.borrower.name || '').localeCompare(b.borrower.name || '')
    );
  };

  // Fetch fraud status for all unique borrowers when loans change
  useEffect(() => {
    if (!lenderLoans || lenderLoans.length === 0) return;
    
    // Get unique aadhaar numbers from all loans
    const uniqueAadhaarNumbers = new Set();
    lenderLoans.forEach(loan => {
      const aadhaarNumber = loan.aadhaarNumber || loan.aadharCardNo;
      if (aadhaarNumber && aadhaarNumber.length === 12) {
        uniqueAadhaarNumbers.add(aadhaarNumber);
      }
    });
    
    // Fetch fraud status for each unique aadhaar number
    uniqueAadhaarNumbers.forEach(aadhaarNumber => {
      if (!borrowerFraudStatus[aadhaarNumber]) {
        fetchFraudStatus(aadhaarNumber);
      }
    });
  }, [lenderLoans]);

  return (
    <View style={styles.container}>
      <Header title="Given Loans"/>

      {/* Search and Filter Section */}
      <View style={[
        styles.searchSection,
        isLender && !planLoading && !hasActivePlan && { opacity: 0.5 }
      ]}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#6B7280" style={styles.searchIcon}/>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by borrower name"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
            editable={isLender ? (planLoading || hasActivePlan) : true}
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setIsFilterModalVisible(true)}>
          <Icon name="filter-list" size={24} color="#FFFFFF"/>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={isFilterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsFilterModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsFilterModalVisible(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Loans</Text>
              <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}>
              {/* Search in Filter Modal */}
              <View style={styles.searchFilterContainer}>
                <Text style={styles.filterLabel}>Search by Borrower</Text>
                <View style={styles.searchInputContainer}>
                  <Icon name="search" size={18} color="#6B7280" />
                  <TextInput
                    style={styles.searchFilterInput}
                    placeholder="Search by name, email or mobile"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* Date Filters */}
              <View style={styles.dateFilterContainer}>
                <Text style={styles.filterLabel}>Date Range</Text>
                <View style={styles.dateRow}>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => {
                      setCurrentDateType('start');
                      setTempDate(startDateFilter || new Date());
                      setDatePickerOpen(true);
                    }}>
                    <Icon name="calendar-today" size={18} color="#6B7280" />
                    <Text style={styles.dateText}>
                      {startDateFilter
                        ? formatDate(startDateFilter)
                        : 'Start Date'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => {
                      setCurrentDateType('end');
                      setTempDate(endDateFilter || new Date());
                      setDatePickerOpen(true);
                    }}>
                    <Icon name="calendar-today" size={18} color="#6B7280" />
                    <Text style={styles.dateText}>
                      {endDateFilter
                        ? formatDate(endDateFilter)
                        : 'End Date'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Amount Filters */}
              <View style={styles.amountFilterContainer}>
                <Text style={styles.filterLabel}>Amount Range</Text>
                <View style={styles.amountRow}>
                  <View style={styles.amountInputContainer}>
                    <Text style={styles.amountPrefix}>₹</Text>
                    <TextInput
                      style={[styles.input, styles.amountInput]}
                      placeholder="Min"
                      value={minAmount}
                      onChangeText={text => setMinAmount(text.replace(/[^0-9]/g, ''))}
                      keyboardType="numeric"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  <Text style={styles.amountSeparator}>-</Text>
                  <View style={styles.amountInputContainer}>
                    <Text style={styles.amountPrefix}>₹</Text>
                    <TextInput
                      style={[styles.input, styles.amountInput]}
                      placeholder="Max"
                      value={maxAmount}
                      onChangeText={text => setMaxAmount(text.replace(/[^0-9]/g, ''))}
                      keyboardType="numeric"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              </View>

              {/* Status Filter */}
              <View style={styles.statusFilterContainer}>
                <Text style={styles.filterLabel}>Status</Text>
                <View style={styles.statusButtons}>
                  {['all', 'pending', 'paid'].map(status => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusButton,
                        statusFilter === status || (status === 'all' && !statusFilter)
                          ? styles.statusButtonActive
                          : styles.statusButtonInactive,
                      ]}
                      onPress={() => setStatusFilter(status === 'all' ? null : status)}>
                      <Text style={[
                        styles.statusButtonText,
                        statusFilter === status || (status === 'all' && !statusFilter)
                          ? styles.statusButtonTextActive
                          : styles.statusButtonTextInactive,
                      ]}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Modal Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.clearButton]}
                onPress={handleResetOrClose}>
                <Icon 
                  name={hasActiveFilters ? "refresh" : "close"} 
                  size={18} 
                  color="#6B7280" 
                  style={styles.buttonIcon}
                />
                <Text style={styles.clearButtonText}>
                  {hasActiveFilters ? "Reset" : "Close"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.applyButton,
                  !hasActiveFilters && styles.applyButtonDisabled
                ]}
                onPress={handleSubmitFilters}
                disabled={!hasActiveFilters}>
                <Icon 
                  name="check" 
                  size={18} 
                  color={hasActiveFilters ? "#FFFFFF" : "#9CA3AF"} 
                  style={styles.buttonIcon}
                />
                <Text style={[
                  styles.applyButtonText,
                  !hasActiveFilters && styles.applyButtonTextDisabled
                ]}>
                  Apply Filters
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      <DateTimePickerModal
        isVisible={datePickerOpen}
        mode="date"
        date={tempDate}
        onConfirm={date => {
          if (currentDateType === 'start') {
            setStartDateFilter(date);
          } else {
            setEndDateFilter(date);
          }
          setDatePickerOpen(false);
        }}
        onCancel={() => setDatePickerOpen(false)}
      />

      {/* Loan List */}
      <ScrollView
        ref={scrollViewRef}
        style={[
          styles.loanListContainer,
          isLender && !planLoading && !hasActivePlan && { opacity: 0.5 }
        ]}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            enabled={isLender ? (planLoading || hasActivePlan) : true}
          />
        }
        showsVerticalScrollIndicator={false}
        scrollEnabled={isLender ? (planLoading || hasActivePlan) : true}>
        {displayLoans?.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon 
                name="account-balance-wallet" 
                size={60} 
                color="#E5E7EB" 
              />
              <Text style={styles.emptyTitle}>No loans given</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery 
                  ? 'Try a different search term' 
                  : 'No loans given yet'}
              </Text>
            </View>
          ) : (
            groupLoansByBorrower(displayLoans).map((borrowerGroup, groupIndex) => {
              const borrower = borrowerGroup.borrower;
              const loans = borrowerGroup.loans;
              
              // Calculate totals for this borrower
              const totalLoanAmount = loans.reduce((sum, loan) => {
                const amount = typeof loan.amount === 'number' ? loan.amount : parseFloat(loan.amount) || 0;
                return sum + amount;
              }, 0);
              
              const totalRemaining = loans.reduce((sum, loan) => {
                const remaining = typeof loan.remainingAmount === 'number' ? loan.remainingAmount : parseFloat(loan.remainingAmount) || 0;
                return sum + remaining;
              }, 0);
              
              const overdueCount = loans.filter(loan => {
                const remaining = typeof loan.remainingAmount === 'number' ? loan.remainingAmount : parseFloat(loan.remainingAmount) || 0;
                return loan.loanEndDate && 
                  moment(loan.loanEndDate).isBefore(moment(), 'day') && 
                  remaining > 0;
              }).length;
              
              const hasOverdue = overdueCount > 0;
              const hasOffline = loans.some(loan => loan.isOffline);
              
              // Get fraud status for this borrower
              const fraudData = borrower.aadhaarNumber ? borrowerFraudStatus[borrower.aadhaarNumber] : null;
              const hasFraudRisk = fraudData && fraudData.success && fraudData.riskLevel && fraudData.riskLevel !== 'low';
              
              // Get pending payments for this borrower
              const borrowerPendingPayments = getBorrowerPendingPayments(borrower);
              
              return (
                <TouchableOpacity
                  key={`borrower-${borrower.aadhaarNumber || borrower.name || 'unknown'}-${groupIndex}`}
                  style={[
                    styles.borrowerCard,
                    { borderLeftColor: groupIndex % 2 === 0 ? colors.skyText : colors.mintText },
                    hasOverdue && styles.overdueBorrowerCard,
                    hasFraudRisk && styles.fraudRiskBorrowerCard,
                    borrowerPendingPayments && styles.pendingPaymentBorrowerCard,
                    hasOffline && styles.offlineBorrowerCard,
                  ]}
                  onPress={() => navigation.navigate('BorrowerLoansScreen', {
                    borrower: borrower,
                    loans: loans,
                  })}
                  activeOpacity={0.8}>
                  {borrowerPendingPayments && borrowerPendingPayments.count > 0 && (
                    <View style={styles.pendingPaymentBanner}>
                      <Icon name="notifications" size={14} color="#FFFFFF" />
                      <Text style={styles.pendingPaymentBannerText} numberOfLines={1}>
                        {borrowerPendingPayments.count} PENDING - {formatCurrency(borrowerPendingPayments.amount)}
                      </Text>
                    </View>
                  )}

                  {hasFraudRisk && !hasOverdue && !borrowerPendingPayments && (
                    <View style={[
                      styles.fraudBanner,
                      { backgroundColor: fraudData.riskLevel === 'critical' ? '#DC2626' :
                                       fraudData.riskLevel === 'high' ? '#EA580C' :
                                       fraudData.riskLevel === 'medium' ? '#D97706' : '#059669' }
                    ]}>
                      <Icon name="shield-alert" size={14} color="#FFFFFF" />
                      <Text style={styles.fraudBannerText}>
                        {fraudData.riskLevel?.toUpperCase()} FRAUD RISK
                      </Text>
                    </View>
                  )}

                  <View style={styles.borrowerCardHeader}>
                    <View style={styles.borrowerInfo}>
                      {borrower.profileImage ? (
                        <Image
                          source={{ uri: borrower.profileImage }}
                          style={styles.borrowerAvatar}
                        />
                      ) : (
                        <View style={styles.borrowerAvatarPlaceholder}>
                          <Text style={styles.borrowerAvatarText}>
                            {(borrower.name || 'B')?.charAt(0)?.toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.borrowerDetails}>
                        <Text style={styles.borrowerName} numberOfLines={1}>
                          {borrower.name || 'Unknown Borrower'}
                        </Text>
                        <View style={styles.borrowerMeta}>
                          <View style={styles.metaItem}>
                            <Icon name="phone" size={12} color="#6B7280" />
                            <Text style={styles.metaText} numberOfLines={1}>
                              {borrower.mobileNumber || 'N/A'}
                            </Text>
                          </View>
                          <View style={styles.metaItem}>
                            <Icon name="badge" size={12} color="#6B7280" />
                            <Text style={styles.metaText} numberOfLines={1}>
                              {borrower.aadhaarNumber || 'N/A'}
                            </Text>
                          </View>
                          {hasOverdue && (
                            <View style={styles.metaItem}>
                              <Icon name="error" size={12} color="#EF4444" />
                              <Text style={[styles.metaText, styles.metaOverdueText]} numberOfLines={1}>
                                {overdueCount} loan{overdueCount > 1 ? 's' : ''} overdue
                              </Text>
                            </View>
                          )}
                        </View>
                        {hasFraudRisk && (
                          <View style={styles.fraudBadgeContainer}>
                            <FraudStatusBadge
                              fraudScore={fraudData.fraudScore}
                              riskLevel={fraudData.riskLevel}
                            />
                          </View>
                        )}
                      </View>
                    </View>
                    <Icon name="chevron-right" size={20} color="#9CA3AF" />
                  </View>

                  {/* <View style={styles.borrowerSummary}>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryItem}>
                        <View style={[styles.summaryIconContainer, { backgroundColor: '#EFF6FF' }]}>
                      <Icon name="description" size={13} color="#1B6E8C" />
                        </View>
                        <Text style={styles.summaryValue} numberOfLines={1}>{loans.length}</Text>
                        <Text style={styles.summaryLabel}>Loans</Text>
                      </View>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryItem}>
                        <View style={[styles.summaryIconContainer, { backgroundColor: '#ECFDF5' }]}>
                      <Icon name="account-balance-wallet" size={13} color="#1F7A3D" />
                        </View>
                        <Text style={[styles.summaryValue, { color: '#1F7A3D' }]} numberOfLines={1}>
                          {formatCurrency(totalLoanAmount)}
                        </Text>
                        <Text style={styles.summaryLabel}>Given</Text>
                      </View>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryItem}>
                        <View style={[styles.summaryIconContainer, { backgroundColor: hasOverdue ? '#FEE2E2' : '#FFF7ED' }]}>
                          <Icon name="pending" size={13} color={hasOverdue ? '#EF4444' : '#F59E0B'} />
                        </View>
                        <Text style={[styles.summaryValue, { color: hasOverdue ? '#EF4444' : '#F59E0B' }]} numberOfLines={1}>
                          {formatCurrency(totalRemaining)}
                        </Text>
                        <Text style={styles.summaryLabel}>Due</Text>
                      </View>
                    </View>

                    {hasFraudRisk && !hasOverdue && (
                      <View style={[
                        styles.fraudWarning,
                        { backgroundColor: fraudData.riskLevel === 'critical' ? '#FEE2E2' :
                                         fraudData.riskLevel === 'high' ? '#FED7AA' :
                                         fraudData.riskLevel === 'medium' ? '#FEF3C7' : '#D1FAE5',
                          borderColor: fraudData.riskLevel === 'critical' ? '#DC2626' :
                                      fraudData.riskLevel === 'high' ? '#EA580C' :
                                      fraudData.riskLevel === 'medium' ? '#D97706' : '#059669' }
                      ]}>
                        <Icon
                          name="shield-alert"
                          size={14}
                          color={fraudData.riskLevel === 'critical' ? '#DC2626' :
                                fraudData.riskLevel === 'high' ? '#EA580C' :
                                fraudData.riskLevel === 'medium' ? '#D97706' : '#059669'}
                        />
                        <Text style={[
                          styles.fraudWarningText,
                          { color: fraudData.riskLevel === 'critical' ? '#DC2626' :
                                  fraudData.riskLevel === 'high' ? '#EA580C' :
                                  fraudData.riskLevel === 'medium' ? '#D97706' : '#059669' }
                        ]} numberOfLines={1}>
                          {fraudData.details?.pendingLoansCount || 0} pending • {fraudData.details?.overdueLoansCount || 0} overdue
                        </Text>
                      </View>
                    )}
                  </View> */}

                  <View style={styles.borrowerCardFooter}>
                    <View style={styles.footerItem}>
                      <Icon name="account-balance-wallet" size={13} color="#9CA3AF" />
                      <Text style={styles.footerText}>
                        {loans.length} loan{loans.length > 1 ? 's' : ''} • Tap to view all
                      </Text>
                    </View>
                    {borrowerPendingPayments && borrowerPendingPayments.count > 0 && (
                      <View style={styles.pendingPaymentBadge}>
                        <Icon name="schedule" size={12} color="#F59E0B" />
                        <Text style={styles.pendingPaymentBadgeText} numberOfLines={1}>
                          {borrowerPendingPayments.count} pending • {formatCurrency(borrowerPendingPayments.amount)}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
        )}
      </ScrollView>

      {/* Subscription Restriction Overlay */}
      {isLender && !planLoading && !hasActivePlan && (
        <SubscriptionRestriction 
          message="Purchase a plan to view and search your loans"
          asOverlay={true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navyFaint,
  },
  // Search Section
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: m(16),
    paddingVertical: m(12),
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: m(12),
    paddingHorizontal: m(12),
  },
  searchIcon: {
    marginRight: m(8),
  },
  searchInput: {
    flex: 1,
    height: m(44),
    fontSize: m(16),
    color: colors.textPrimary,
    fontFamily: FontFamily.bodyRegular,
  },
  filterButton: {
    padding: m(8),
    backgroundColor: colors.ink,
    borderRadius: m(12),
  },

  // Filter Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: m(20),
    borderTopRightRadius: m(20),
    padding: m(24),
    paddingBottom: m(16),
    maxHeight: '80%',
  },
  modalScrollContent: {
    flexGrow: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(24),
  },
  modalTitle: {
    fontSize: m(20),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.textPrimary,
  },
  filterLabel: {
    fontSize: m(14),
    fontFamily: FontFamily.bodyMedium,
    color: colors.textPrimary,
    marginBottom: m(8),
  },
  searchFilterContainer: {
    marginBottom: m(20),
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: m(10),
    paddingHorizontal: m(12),
    gap: m(8),
  },
  searchFilterInput: {
    flex: 1,
    height: m(44),
    fontSize: m(14),
    color: colors.textPrimary,
    fontFamily: FontFamily.bodyRegular,
  },
  dateFilterContainer: {
    marginBottom: m(20),
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: m(10),
    padding: m(12),
    marginRight: m(8),
  },
  dateText: {
    marginLeft: m(8),
    fontSize: m(14),
    fontFamily: FontFamily.bodyRegular,
    color: '#374151',
  },
  amountFilterContainer: {
    marginBottom: m(16),
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: m(10),
  },
  amountPrefix: {
    paddingHorizontal: m(12),
    fontSize: m(14),
    fontFamily: FontFamily.bodyRegular,
    color: '#6B7280',
  },
  amountInput: {
    flex: 1,
    borderWidth: 0,
    paddingLeft: 0,
  },
  amountSeparator: {
    marginHorizontal: m(8),
    fontSize: m(16),
    fontFamily: FontFamily.bodyMedium,
    color: '#6B7280',
  },
  statusFilterContainer: {
    marginBottom: m(20),
  },
  statusButtons: {
    flexDirection: 'row',
  },
  statusButton: {
    flex: 1,
    paddingVertical: m(10),
    paddingHorizontal: m(12),
    borderRadius: m(8),
    marginRight: m(8),
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: colors.ink,
  },
  statusButtonInactive: {
    backgroundColor: '#F3F4F6',
  },
  statusButtonText: {
    fontSize: m(14),
    fontFamily: FontFamily.bodyMedium,
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
  },
  statusButtonTextInactive: {
    color: '#6B7280',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: m(14),
    borderRadius: m(12),
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
  },
  buttonIcon: {
    marginRight: m(4),
  },
  clearButton: {
    backgroundColor: '#F3F4F6',
    marginRight: m(8),
  },
  applyButton: {
    backgroundColor: colors.ink,
    marginLeft: m(8),
  },
  applyButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  clearButtonText: {
    color: '#6B7280',
    fontSize: m(16),
    fontFamily: FontFamily.bodySemiBold,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: m(16),
    fontFamily: FontFamily.bodySemiBold,
  },
  applyButtonTextDisabled: {
    color: '#9CA3AF',
  },

  // Loan List
  loanListContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: m(16),
    paddingTop: m(8),
    paddingBottom: m(130),
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(60),
  },
  emptyTitle: {
    fontSize: m(18),
    fontFamily: FontFamily.primarySemiBold,
    color: '#6B7280',
    marginTop: m(12),
    marginBottom: m(4),
  },
  emptySubtitle: {
    fontSize: m(14),
    fontFamily: FontFamily.bodyRegular,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Borrower Card (Grouped)
  borrowerCard: {
    backgroundColor: colors.surface,
    borderRadius: m(18),
    padding: m(14),
    marginBottom: m(14),
    overflow: 'hidden',
    borderWidth: 1,
    borderLeftWidth: m(4),
    borderColor: colors.borderLight,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  overdueBorrowerCard: {
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
  },
  fraudRiskBorrowerCard: {
    borderWidth: 1.5,
    borderColor: '#FED7AA',
  },
  fraudBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(6),
    paddingHorizontal: m(12),
    marginHorizontal: m(-14),
    marginTop: m(-14),
    marginBottom: m(12),
    gap: m(6),
  },
  fraudBannerText: {
    color: '#FFFFFF',
    fontSize: m(11.5),
    fontFamily: FontFamily.bodyBold,
    letterSpacing: 0.4,
  },
  fraudBadgeContainer: {
    marginTop: m(6),
    alignSelf: 'flex-start',
  },
  fraudWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: m(10),
    paddingVertical: m(8),
    paddingHorizontal: m(10),
    marginTop: m(8),
    borderWidth: 1,
    gap: m(8),
  },
  fraudWarningText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.bodySemiBold,
    flex: 1,
  },
  borrowerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(10),
  },
  borrowerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  borrowerAvatar: {
    width: m(40),
    height: m(40),
    borderRadius: m(20),
    marginRight: m(10),
    backgroundColor: colors.navyTint,
  },
  borrowerAvatarPlaceholder: {
    width: m(40),
    height: m(40),
    borderRadius: m(20),
    backgroundColor: colors.navyTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(10),
  },
  borrowerAvatarText: {
    fontSize: m(15),
    color: colors.ink,
    fontFamily: FontFamily.primaryExtraBold,
  },
  borrowerDetails: {
    flex: 1,
  },
  borrowerName: {
    fontSize: m(14.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.ink,
    marginBottom: m(4),
  },
  borrowerMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(10),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
  },
  metaText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.bodyRegular,
    color: colors.inkSoft,
  },
  metaOverdueText: {
    fontFamily: FontFamily.bodySemiBold,
    color: '#EF4444',
  },
  borrowerSummary: {
    backgroundColor: colors.background,
    borderRadius: m(9),
    paddingVertical: m(7),
    paddingHorizontal: m(6),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: m(4),
  },
  summaryIconContainer: {
    width: m(26),
    height: m(26),
    borderRadius: m(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryExtraBold,
    color: colors.ink,
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: m(9.5),
    fontFamily: FontFamily.bodySemiBold,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(17, 24, 39, 0.12)',
  },
  overdueWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: m(10),
    paddingVertical: m(8),
    paddingHorizontal: m(10),
    marginTop: m(8),
    borderWidth: 1,
    borderColor: '#FCA5A5',
    gap: m(8),
  },
  overdueWarningText: {
    fontSize: m(11.5),
    color: '#DC2626',
    fontFamily: FontFamily.bodySemiBold,
    flex: 1,
  },
  borrowerCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: m(8),
    paddingTop: m(8),
    borderTopWidth: 1,
    borderTopColor: 'rgba(17, 24, 39, 0.12)',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  footerText: {
    fontSize: m(11.5),
    color: colors.inkSoft,
    fontFamily: FontFamily.bodyRegular,
  },
  pendingPaymentBorrowerCard: {
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  pendingPaymentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: m(6),
    paddingHorizontal: m(12),
    marginHorizontal: m(-14),
    marginTop: m(-14),
    marginBottom: m(12),
    gap: m(6),
  },
  pendingPaymentBannerText: {
    color: '#FFFFFF',
    fontSize: m(11),
    fontFamily: FontFamily.bodyBold,
    letterSpacing: 0.4,
  },
  pendingPaymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: m(8),
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    gap: m(4),
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingPaymentBadgeText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.bodySemiBold,
    color: '#92400E',
  },

  // Input Styles
  input: {
    fontSize: m(14),
    fontFamily: FontFamily.bodyRegular,
    color: '#374151',
    height: m(44),
  },
});
