import React, { useEffect, useState, useCallback } from 'react';
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
import FraudStatusBadge from '../../../Components/FraudStatusBadge';
import SubscriptionRestriction from '../../../Components/SubscriptionRestriction';
import { useSubscription } from '../../../hooks/useSubscription';
// getActivePlan is already dispatched in Home screen on app focus
import { useFocusEffect, useRoute } from '@react-navigation/native';
import moment from 'moment';
import LoaderSkeleton from '../../../Components/LoaderSkeleton';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

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
  };

  useFocusEffect(
    useCallback(() => {
      const filters = {};
      if (debouncedSearch) {
        filters.search = debouncedSearch;
      }
      dispatch(getLoanByLender(filters));
      
      // Fetch pending payments for lender
      if (isLender) {
        dispatch(getPendingPayments({ page: 1, limit: 100 }));
      }
    }, [dispatch, debouncedSearch, isLender]),
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
            <Icon name="filter-list" size={24} color="#FF9800"/>
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
      {false ? (
        <LoaderSkeleton />
      ) : (
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
              {lenderLoans?.length === 0 ? (
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
            groupLoansByBorrower(lenderLoans).map((borrowerGroup, groupIndex) => {
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
                    hasOverdue && styles.overdueBorrowerCard,
                    hasFraudRisk && styles.fraudRiskBorrowerCard,
                    borrowerPendingPayments && styles.pendingPaymentBorrowerCard
                  ]}
                  onPress={() => navigation.navigate('BorrowerLoansScreen', {
                    borrower: borrower,
                    loans: loans,
                  })}
                  activeOpacity={0.8}>
                  {borrowerPendingPayments && borrowerPendingPayments.count > 0 && (
                    <View style={styles.pendingPaymentBanner}>
                      <View style={styles.bannerIconContainer}>
                        <Icon name="notifications" size={18} color="#FFFFFF" />
                      </View>
                      <Text style={styles.pendingPaymentBannerText}>
                        {borrowerPendingPayments.count} PENDING PAYMENT{borrowerPendingPayments.count > 1 ? 'S' : ''} - {formatCurrency(borrowerPendingPayments.amount)}
                      </Text>
                    </View>
                  )}
                  
                  {hasOverdue && !borrowerPendingPayments && (
                    <View style={styles.overdueBanner}>
                      <View style={styles.bannerIconContainer}>
                        <Icon name="error" size={18} color="#FFFFFF" />
                      </View>
                      <Text style={styles.overdueBannerText}>
                        {overdueCount} OVERDUE LOAN{overdueCount > 1 ? 'S' : ''}
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
                      <View style={styles.bannerIconContainer}>
                        <Icon name="shield-alert" size={18} color="#FFFFFF" />
                      </View>
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
                            <Icon name="phone" size={14} color="#6B7280" />
                            <Text style={styles.metaText} numberOfLines={1}>
                              {borrower.mobileNumber || 'N/A'}
                            </Text>
                          </View>
                          <View style={styles.metaItem}>
                            <Icon name="badge" size={14} color="#6B7280" />
                            <Text style={styles.metaText} numberOfLines={1}>
                              {borrower.aadhaarNumber || 'N/A'}
                            </Text>
                          </View>
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
                    <Icon name="chevron-right" size={24} color="#9CA3AF" />
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.borrowerSummary}>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryItem}>
                        <View style={[styles.summaryIconContainer, { backgroundColor: '#EFF6FF' }]}>
                          <Icon name="description" size={18} color="#3B82F6" />
                        </View>
                        <Text style={styles.summaryValue} numberOfLines={1}>{loans.length}</Text>
                        <Text style={styles.summaryLabel}>Total Loans</Text>
                      </View>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryItem}>
                        <View style={[styles.summaryIconContainer, { backgroundColor: '#ECFDF5' }]}>
                          <Icon name="account-balance-wallet" size={18} color="#10B981" />
                        </View>
                        <Text style={[styles.summaryValue, { color: '#10B981' }]} numberOfLines={1}>
                          {formatCurrency(totalLoanAmount)}
                        </Text>
                        <Text style={styles.summaryLabel}>Total Given</Text>
                      </View>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryItem}>
                        <View style={[styles.summaryIconContainer, { backgroundColor: hasOverdue ? '#FEE2E2' : '#FFF7ED' }]}>
                          <Icon name="pending" size={18} color={hasOverdue ? '#EF4444' : '#F59E0B'} />
                        </View>
                        <Text style={[styles.summaryValue, { color: hasOverdue ? '#EF4444' : '#F59E0B' }]} numberOfLines={1}>
                          {formatCurrency(totalRemaining)}
                        </Text>
                        <Text style={styles.summaryLabel}>Remaining</Text>
                      </View>
                    </View>
                    
                    {hasOverdue && (
                      <View style={styles.overdueWarning}>
                        <View style={styles.warningIconContainer}>
                          <Icon name="error" size={18} color="#EF4444" />
                        </View>
                        <Text style={styles.overdueWarningText}>
                          {overdueCount} loan{overdueCount > 1 ? 's' : ''} overdue - Action required
                        </Text>
                      </View>
                    )}
                    
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
                        <View style={[styles.warningIconContainer, { 
                          backgroundColor: fraudData.riskLevel === 'critical' ? '#DC2626' + '20' : 
                                          fraudData.riskLevel === 'high' ? '#EA580C' + '20' : 
                                          fraudData.riskLevel === 'medium' ? '#D97706' + '20' : '#059669' + '20' 
                        }]}>
                        <Icon 
                          name="shield-alert" 
                            size={18} 
                          color={fraudData.riskLevel === 'critical' ? '#DC2626' : 
                                fraudData.riskLevel === 'high' ? '#EA580C' : 
                                fraudData.riskLevel === 'medium' ? '#D97706' : '#059669'} 
                        />
                        </View>
                        <Text style={[
                          styles.fraudWarningText,
                          { color: fraudData.riskLevel === 'critical' ? '#DC2626' : 
                                  fraudData.riskLevel === 'high' ? '#EA580C' : 
                                  fraudData.riskLevel === 'medium' ? '#D97706' : '#059669' }
                        ]}>
                          {fraudData.details?.pendingLoansCount || 0} pending loans • {fraudData.details?.overdueLoansCount || 0} overdue loans
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.borrowerCardFooter}>
                    <View style={styles.footerItem}>
                      <Icon name="account-balance-wallet" size={14} color="#6B7280" />
                      <Text style={styles.footerText}>
                        {loans.length} loan{loans.length > 1 ? 's' : ''} • Tap to view all
                      </Text>
                    </View>
                    {borrowerPendingPayments && borrowerPendingPayments.count > 0 && (
                      <View style={styles.pendingPaymentBadge}>
                        <Icon name="clock" size={14} color="#F59E0B" />
                        <Text style={styles.pendingPaymentBadgeText}>
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
      )}

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
    backgroundColor: '#F9FAFB',
  },
  // Search Section
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: m(16),
    paddingVertical: m(12),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
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
    color: '#374151',
  },
  filterButton: {
    padding: m(8),
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
    backgroundColor: '#FFFFFF',
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
    fontWeight: '600',
    color: '#111827',
  },
  filterLabel: {
    fontSize: m(14),
    fontWeight: '500',
    color: '#374151',
    marginBottom: m(8),
  },
  searchFilterContainer: {
    marginBottom: m(20),
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: m(10),
    paddingHorizontal: m(12),
    gap: m(8),
  },
  searchFilterInput: {
    flex: 1,
    height: m(44),
    fontSize: m(14),
    color: '#374151',
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
    backgroundColor: '#FF9800',
  },
  statusButtonInactive: {
    backgroundColor: '#F3F4F6',
  },
  statusButtonText: {
    fontSize: m(14),
    fontWeight: '500',
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
    backgroundColor: '#FF9800',
    marginLeft: m(8),
  },
  applyButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  clearButtonText: {
    color: '#6B7280',
    fontSize: m(16),
    fontWeight: '600',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: m(16),
    fontWeight: '600',
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
    fontWeight: '600',
    color: '#6B7280',
    marginTop: m(12),
    marginBottom: m(4),
  },
  emptySubtitle: {
    fontSize: m(14),
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Borrower Card (Grouped)
  borrowerCard: {
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
    overflow: 'hidden',
  },
  overdueBorrowerCard: {
    borderWidth: 2,
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5',
  },
  fraudRiskBorrowerCard: {
    borderWidth: 2,
    borderColor: '#FED7AA',
    backgroundColor: '#FFFBEB',
  },
  bannerIconContainer: {
    width: m(28),
    height: m(28),
    borderRadius: m(14),
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fraudBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(10),
    paddingHorizontal: m(14),
    marginHorizontal: m(-20),
    marginTop: m(-20),
    marginBottom: m(16),
    gap: m(10),
  },
  fraudBannerText: {
    color: '#FFFFFF',
    fontSize: m(13),
    fontWeight: '700',
    letterSpacing: 0.5,
    flex: 1,
  },
  fraudBadgeContainer: {
    marginTop: m(8),
    alignSelf: 'flex-start',
  },
  fraudWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: m(12),
    padding: m(12),
    marginTop: m(12),
    borderWidth: 1.5,
    gap: m(10),
  },
  fraudWarningText: {
    fontSize: m(13),
    fontWeight: '600',
    flex: 1,
  },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: m(10),
    paddingHorizontal: m(14),
    marginHorizontal: m(-20),
    marginTop: m(-20),
    marginBottom: m(16),
    gap: m(10),
  },
  overdueBannerText: {
    color: '#FFFFFF',
    fontSize: m(13),
    fontWeight: '700',
    letterSpacing: 0.5,
    flex: 1,
  },
  borrowerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(16),
  },
  borrowerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  borrowerAvatar: {
    width: m(64),
    height: m(64),
    borderRadius: m(32),
    marginRight: m(16),
    borderWidth: 3,
    borderColor: '#E5E7EB',
  },
  borrowerAvatarPlaceholder: {
    width: m(64),
    height: m(64),
    borderRadius: m(32),
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(16),
    borderWidth: 3,
    borderColor: '#DBEAFE',
  },
  borrowerAvatarText: {
    fontSize: m(24),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  borrowerDetails: {
    flex: 1,
  },
  borrowerName: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(8),
  },
  borrowerMeta: {
    gap: m(8),
    marginBottom: m(8),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
  },
  metaText: {
    fontSize: m(13),
    color: '#6B7280',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: m(16),
  },
  borrowerSummary: {
    marginBottom: m(12),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: m(6),
  },
  summaryIconContainer: {
    width: m(44),
    height: m(44),
    borderRadius: m(14),
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: m(11),
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    height: m(70),
    backgroundColor: '#E5E7EB',
    marginTop: m(4),
  },
  overdueWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: m(12),
    padding: m(12),
    marginTop: m(12),
    borderWidth: 1,
    borderColor: '#FCA5A5',
    gap: m(10),
  },
  overdueWarningText: {
    fontSize: m(13),
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
  },
  borrowerCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: m(16),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
  },
  footerText: {
    fontSize: m(13),
    color: '#6B7280',
    fontWeight: '500',
  },
  pendingPaymentBorrowerCard: {
    borderWidth: 2,
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBF5',
  },
  pendingPaymentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: m(8),
    paddingHorizontal: m(12),
    marginHorizontal: m(-20),
    marginTop: m(-20),
    marginBottom: m(16),
    gap: m(6),
    borderTopLeftRadius: m(17),
    borderTopRightRadius: m(17),
  },
  pendingPaymentBannerText: {
    color: '#FFFFFF',
    fontSize: m(12),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pendingPaymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: m(8),
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    gap: m(6),
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingPaymentBadgeText: {
    fontSize: m(11),
    fontWeight: '600',
    color: '#92400E',
  },

  // Input Styles
  input: {
    fontSize: m(14),
    color: '#374151',
    height: m(44),
  },
});