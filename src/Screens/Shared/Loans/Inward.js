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
} from '../../../Redux/Slices/loanSlice';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import moment from 'moment';
import LoaderSkeleton from '../../../Components/LoaderSkeleton';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import DatePicker from 'react-native-date-picker';

export default function Inward({ navigation }) {
  const dispatch = useDispatch();
  const route = useRoute();
  const user = useSelector(state => state.auth.user);
  const { lenderLoans, loading } = useSelector(
    state => state.loans,
  );
  
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

  const formatDate = date => moment(date).format('DD MMM, YYYY');

  // Add debouncing effect for search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500); // 500ms delay

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

  const handleClearFilters = () => {
    setStartDateFilter(null);
    setEndDateFilter(null);
    setMinAmount('');
    setMaxAmount('');
    setStatusFilter(null);
    setSearchQuery(''); // Clear search query
    setDebouncedSearch(''); // Clear debounced search
    dispatch(getLoanByLender());
    setIsFilterModalVisible(false);
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
    }, [dispatch, debouncedSearch]),
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
                // Fallback: scroll to approximate position
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

  // Group loans by borrower (using aadhaarNumber or name as identifier)
  const groupLoansByBorrower = (loans) => {
    if (!loans || loans.length === 0) return [];
    
    const grouped = {};
    loans.forEach(loan => {
      // Use aadhaarNumber as primary identifier, fallback to name
      const borrowerId = loan.aadhaarNumber || loan.aadharCardNo || loan.name || 'unknown';
      
      if (!grouped[borrowerId]) {
        grouped[borrowerId] = {
          borrower: {
            name: loan.name,
            mobileNumber: loan.mobileNumber,
            aadhaarNumber: loan.aadhaarNumber || loan.aadharCardNo,
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

  const getLoanStatus = (loan) => {
    const loanAmount = typeof loan.amount === 'number' ? loan.amount : parseFloat(loan.amount) || 0;
    const totalPaid = typeof loan.totalPaid === 'number' ? loan.totalPaid : parseFloat(loan.totalPaid) || 0;
    const remainingAmount = typeof loan.remainingAmount === 'number' ? loan.remainingAmount : parseFloat(loan.remainingAmount) || loanAmount;
    
    if (remainingAmount <= 0 && totalPaid > 0) {
      return 'closed';
    }
    
    // Check if overdue
    if (loan.loanEndDate && 
        moment(loan.loanEndDate).isBefore(moment(), 'day') && 
        remainingAmount > 0) {
      return 'overdue';
    }
    
    return loan?.paymentStatus?.toLowerCase() || loan?.status?.toLowerCase();
  };

  const getStatusColor = (loan) => {
    const status = getLoanStatus(loan);
    switch (status) {
      case 'accepted': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'pending': return '#F59E0B';
      case 'paid': return '#10B981';
      case 'closed': return '#10B981';
      case 'part paid': return '#F59E0B';
      case 'overdue': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (loan) => {
    const status = getLoanStatus(loan);
    switch (status) {
      case 'accepted': return 'check-circle';
      case 'rejected': return 'cancel';
      case 'paid': return 'check-circle';
      case 'closed': return 'check-circle';
      case 'part paid': return 'pending';
      case 'overdue': return 'error';
      default: return 'pending';
    }
  };

  const getStatusText = (loan) => {
    const status = getLoanStatus(loan);
    if (status === 'closed') {
      return 'Closed';
    }
    return (loan?.paymentStatus || loan?.status)?.charAt(0).toUpperCase() + (loan?.paymentStatus || loan?.status)?.slice(1);
  };

  return (
    <View style={styles.container}>
      <Header title="Given Loans" />

      {/* Search and Filter Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by borrower name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setIsFilterModalVisible(true)}>
            <Icon name="filter-alt" size={22} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={isFilterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsFilterModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsFilterModalVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Loans</Text>
              <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Search in Filter Modal */}
            <View style={styles.searchFilterContainer}>
              <Text style={styles.filterLabel}>Search by Borrower</Text>
              <View style={styles.searchInputContainer}>
                <Icon name="search" size={18} color="#6B7280" />
                <TextInput
                  style={styles.searchFilterInput}
                  placeholder="Search by name, email or mobile..."
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

            {/* Modal Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.clearButton]}
                onPress={handleClearFilters}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.applyButton]}
                onPress={handleSubmitFilters}>
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Picker */}
      <DatePicker
        modal
        open={datePickerOpen}
        date={tempDate}
        mode="date"
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
      {loading ? (
        <LoaderSkeleton />
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.loanListContainer}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}>
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
              
              const totalPaid = loans.reduce((sum, loan) => {
                const paid = typeof loan.totalPaid === 'number' ? loan.totalPaid : parseFloat(loan.totalPaid) || 0;
                return sum + paid;
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
              
              return (
                <TouchableOpacity
                  key={borrower.aadhaarNumber || borrower.name || groupIndex}
                  style={[
                    styles.borrowerCard,
                    hasOverdue && styles.overdueBorrowerCard
                  ]}
                  onPress={() => navigation.navigate('BorrowerLoansScreen', {
                    borrower: borrower,
                    loans: loans,
                  })}
                  activeOpacity={0.8}>
                  {hasOverdue && (
                    <View style={styles.overdueBanner}>
                      <Icon name="error" size={16} color="#FFFFFF" />
                      <Text style={styles.overdueBannerText}>
                        {overdueCount} OVERDUE LOAN{overdueCount > 1 ? 'S' : ''}
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
                            <Text style={styles.metaText}>
                              {borrower.mobileNumber || 'N/A'}
                            </Text>
                          </View>
                          <View style={styles.metaItem}>
                            <Icon name="badge" size={14} color="#6B7280" />
                            <Text style={styles.metaText}>
                              {borrower.aadhaarNumber || 'N/A'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <Icon name="chevron-right" size={24} color="#9CA3AF" />
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.borrowerSummary}>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Total Loans</Text>
                        <Text style={styles.summaryValue}>{loans.length}</Text>
                      </View>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Total Given</Text>
                        <Text style={[styles.summaryValue, { color: '#3B82F6' }]}>
                          {formatCurrency(totalLoanAmount)}
                        </Text>
                      </View>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Remaining</Text>
                        <Text style={[styles.summaryValue, { color: hasOverdue ? '#EF4444' : '#F59E0B' }]}>
                          {formatCurrency(totalRemaining)}
                        </Text>
                      </View>
                    </View>
                    
                    {hasOverdue && (
                      <View style={styles.overdueWarning}>
                        <Icon name="error" size={16} color="#EF4444" />
                        <Text style={styles.overdueWarningText}>
                          {overdueCount} loan{overdueCount > 1 ? 's' : ''} overdue
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
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
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
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: m(20),
    borderTopRightRadius: m(20),
    padding: m(24),
    maxHeight: '80%',
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
    backgroundColor: 'black',
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
    paddingVertical: m(14),
    borderRadius: m(12),
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#F3F4F6',
    marginRight: m(8),
  },
  applyButton: {
    backgroundColor: 'black',
    marginLeft: m(8),
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
    elevation: 4,
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
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: m(8),
    paddingHorizontal: m(12),
    marginHorizontal: m(-20),
    marginTop: m(-20),
    marginBottom: m(16),
    gap: m(6),
  },
  overdueBannerText: {
    color: '#FFFFFF',
    fontSize: m(12),
    fontWeight: '700',
    letterSpacing: 1,
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
    width: m(56),
    height: m(56),
    borderRadius: m(28),
    marginRight: m(14),
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  borrowerAvatarPlaceholder: {
    width: m(56),
    height: m(56),
    borderRadius: m(28),
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(14),
    borderWidth: 2,
    borderColor: '#FFF3E0',
  },
  borrowerAvatarText: {
    fontSize: m(22),
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
    gap: m(6),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  metaText: {
    fontSize: m(13),
    color: '#6B7280',
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
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: m(11),
    color: '#9CA3AF',
    marginBottom: m(4),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#111827',
  },
  summaryDivider: {
    width: 1,
    height: m(40),
    backgroundColor: '#E5E7EB',
  },
  overdueWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: m(8),
    padding: m(10),
    marginTop: m(12),
    gap: m(6),
  },
  overdueWarningText: {
    fontSize: m(13),
    color: '#DC2626',
    fontWeight: '600',
  },
  borrowerCardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: m(12),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  footerText: {
    fontSize: m(13),
    color: '#6B7280',
    fontWeight: '500',
  },

  // Input Styles
  input: {
    fontSize: m(14),
    color: '#374151',
    height: m(44),
  },

  // Payment Summary
  paymentSummary: {
    backgroundColor: '#F9FAFB',
    borderRadius: m(12),
    padding: m(12),
    marginTop: m(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paymentSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: m(12),
  },
  paymentItem: {
    flex: 1,
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: m(11),
    color: '#6B7280',
    marginBottom: m(4),
  },
  paymentValue: {
    fontSize: m(14),
    fontWeight: '700',
    color: '#111827',
  },
  paidAmount: {
    color: '#10B981',
  },
  remainingAmount: {
    color: '#EF4444',
  },
  closedAmount: {
    color: '#10B981',
  },
  paymentDivider: {
    width: 1,
    height: m(40),
    backgroundColor: '#E5E7EB',
  },
  paymentProgressBar: {
    height: m(6),
    backgroundColor: '#E5E7EB',
    borderRadius: m(3),
    overflow: 'hidden',
    marginBottom: m(6),
  },
  paymentProgressFill: {
    height: '100%',
    borderRadius: m(3),
    backgroundColor: '#3B82F6',
  },
  paymentProgressText: {
    fontSize: m(11),
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
});