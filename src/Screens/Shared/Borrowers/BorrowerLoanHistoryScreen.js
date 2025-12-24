// BorrowerLoanHistoryScreen.js
import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { getBorrowerLoansById } from '../../../Redux/Slices/borrowerLoanSlice';
import Header from '../../../Components/Header';
import moment from 'moment';
import { m } from 'walstar-rn-responsive';

const LoanHistoryCard = ({ loan, onPress }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return '#10B981'; // green
      case 'part paid':
        return '#F59E0B'; // amber
      case 'pending':
        return '#6B7280'; // gray
      default:
        return '#6B7280'; // gray
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'check-circle';
      case 'part paid':
        return 'schedule';
      case 'pending':
        return 'help';
      default:
        return 'help';
    }
  };

  return (
    <TouchableOpacity style={styles.loanCard} onPress={onPress}>
      <View style={styles.loanCardHeader}>
        <View style={styles.loanInfo}>
          <Text style={styles.loanAmount}>₹{loan.amount?.toLocaleString() || '0'}</Text>
          <Text style={styles.loanPurpose}>Loan Amount</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(loan.paymentStatus) + '15' }]}>
          <Icon
            name={getStatusIcon(loan.paymentStatus)}
            size={16}
            color={getStatusColor(loan.paymentStatus)}
          />
          <Text style={[styles.statusText, { color: getStatusColor(loan.paymentStatus) }]}>
            {loan.paymentStatus?.charAt(0).toUpperCase() + loan.paymentStatus?.slice(1) || 'Unknown'}
          </Text>
        </View>
      </View>

      <View style={styles.loanDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Icon name="check-circle" size={14} color="#10B981" />
            <Text style={styles.detailLabel}>Paid:</Text>
            <Text style={styles.detailValue}>
              ₹{loan.totalPaid?.toLocaleString('en-IN') || '0'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="schedule" size={14} color="#F59E0B" />
            <Text style={styles.detailLabel}>Remaining:</Text>
            <Text style={styles.detailValue}>
              ₹{loan.remainingAmount?.toLocaleString('en-IN') || loan.amount}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Icon name="event" size={14} color="#6B7280" />
            <Text style={styles.detailLabel}>Due:</Text>
            <Text style={styles.detailValue}>
              {moment(loan.loanEndDate).format('DD MMM YYYY')}
            </Text>
          </View>
        </View>

        {loan.lenderId && (
          <View style={styles.lenderInfo}>
            <Icon name="person" size={14} color="#3B82F6" />
            <Text style={styles.lenderName} numberOfLines={1}>
              {loan.lenderId.userName || 'N/A'}
            </Text>
          </View>
        )}

        <View style={styles.loanFooter}>
          <Text style={styles.loanDate}>
            {moment(loan.createdAt).fromNow()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const FilterModal = ({ visible, onClose, filters, setFilters, applyFilters }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    applyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      status: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
    };
    setLocalFilters(resetFilters);
    applyFilters(resetFilters);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.filterModalOverlay}
        activeOpacity={1}
        onPress={onClose}>
        <View style={styles.filterModalContent}>
          <View style={styles.filterModalHeader}>
            <Text style={styles.filterModalTitle}>Filter Loans</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterScroll} showsVerticalScrollIndicator={false}>
            {/* Status Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Status</Text>
              <View style={styles.statusFilterOptions}>
                {['', 'part paid', 'paid'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      localFilters.status === status && styles.statusOptionSelected,
                    ]}
                    onPress={() => setLocalFilters({...localFilters, status})}>
                    <Text style={[
                      styles.statusOptionText,
                      localFilters.status === status && styles.statusOptionTextSelected,
                    ]}>
                      {status === '' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Amount Range */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Amount Range</Text>
              <View style={styles.amountInputRow}>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.amountInputLabel}>Min</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="₹0"
                    value={localFilters.minAmount}
                    onChangeText={(text) => setLocalFilters({...localFilters, minAmount: text})}
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <Text style={styles.amountRangeSeparator}>-</Text>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.amountInputLabel}>Max</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="₹0"
                    value={localFilters.maxAmount}
                    onChangeText={(text) => setLocalFilters({...localFilters, maxAmount: text})}
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            </View>

            {/* Date Range */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Date Range</Text>
              <View style={styles.dateInputRow}>
                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateInputLabel}>From</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="YYYY-MM-DD"
                    value={localFilters.startDate}
                    onChangeText={(text) => setLocalFilters({...localFilters, startDate: text})}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateInputLabel}>To</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="YYYY-MM-DD"
                    value={localFilters.endDate}
                    onChangeText={(text) => setLocalFilters({...localFilters, endDate: text})}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.filterModalActions}>
            <TouchableOpacity
              style={[styles.filterButton, styles.resetButton]}
              onPress={handleReset}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, styles.applyButton]}
              onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
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

  const loadHistory = useCallback((page = 1) => {
    if (!borrowerId) return;

    dispatch(getBorrowerLoansById({
      borrowerId,
      params: {
        page,
        limit: 10,
        ...filters,
        search: searchQuery,
      }
    }));
  }, [borrowerId, dispatch, filters, searchQuery]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, [loadHistory]);

  const handleLoanCardPress = (loan) => {
    navigation.navigate('LoanDetailScreen', { loanId: loan._id, loanDetails: loan });
  };

  const applyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  const handleLoadMore = () => {
    if (historyPagination.currentPage < historyPagination.totalPages && !historyLoading) {
      loadHistory(historyPagination.currentPage + 1);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${amount?.toLocaleString('en-IN') || '0'}`;
  };

  if (!borrowerId) {
    return (
      <View style={styles.container}>
        <Header title="Loan History" showBackButton />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Borrower ID is required</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Loan History" showBackButton />
      
      {/* Summary Section */}
      {historySummary && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Loan Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{historySummary.totalLoans || 0}</Text>
              <Text style={styles.summaryLabel}>Total Loans</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryNumber, { color: '#F59E0B' }]}>
                {historySummary.activeLoans || 0}
              </Text>
              <Text style={styles.summaryLabel}>Active</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryNumber, { color: '#10B981' }]}>
                {historySummary.completedLoans || 0}
              </Text>
              <Text style={styles.summaryLabel}>Completed</Text>
            </View>
          </View>
          <View style={styles.amountSummary}>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Total Borrowed:</Text>
              <Text style={[styles.amountValue, { color: '#3B82F6' }]}>
                {formatCurrency(historySummary.totalAmountBorrowed)}
              </Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Total Paid:</Text>
              <Text style={[styles.amountValue, { color: '#10B981' }]}>
                {formatCurrency(historySummary.totalAmountPaid)}
              </Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Remaining:</Text>
              <Text style={[styles.amountValue, { color: '#EF4444' }]}>
                {formatCurrency(historySummary.totalAmountRemaining)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Search and Filter Bar */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search loans..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <TouchableOpacity
          style={styles.filterButtonContainer}
          onPress={() => setFilterModalVisible(true)}>
          <Icon name="filter-list" size={24} color="#3B82F6" />
          {(filters.status || filters.startDate || filters.endDate || filters.minAmount || filters.maxAmount) && (
            <View style={styles.filterIndicator} />
          )}
        </TouchableOpacity>
      </View>

      {/* Loans List */}
      <ScrollView
        style={styles.loansContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        {historyLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading history...</Text>
          </View>
        ) : historyError ? (
          <View style={styles.errorState}>
            <Icon name="error-outline" size={60} color="#EF4444" />
            <Text style={styles.errorStateTitle}>Error Loading History</Text>
            <Text style={styles.errorStateMessage}>{historyError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : borrowerHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="history" size={60} color="#E5E7EB" />
            <Text style={styles.emptyTitle}>No Loan History</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || filters.status ? 'No loans match your criteria' : 'This borrower has no loan history'}
            </Text>
          </View>
        ) : (
          <>
            {borrowerHistory.map((loan, index) => (
              <LoanHistoryCard
                key={loan._id || index}
                loan={loan}
                onPress={() => handleLoanCardPress(loan)}
              />
            ))}
            {historyPagination.currentPage < historyPagination.totalPages && (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={handleLoadMore}
                disabled={historyLoading}>
                {historyLoading ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <Text style={styles.loadMoreText}>Load More</Text>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

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
    backgroundColor: '#F9FAFB',
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    margin: m(16),
    padding: m(16),
    borderRadius: m(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: m(18),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: m(16),
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: m(16),
  },
  summaryCard: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: m(4),
  },
  summaryNumber: {
    fontSize: m(24),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: m(4),
  },
  summaryLabel: {
    fontSize: m(12),
    color: '#6B7280',
    textAlign: 'center',
  },
  amountSummary: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: m(16),
  },
  amountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(8),
  },
  amountLabel: {
    fontSize: m(14),
    color: '#6B7280',
  },
  amountValue: {
    fontSize: m(16),
    fontWeight: '600',
  },
  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(16),
    marginBottom: m(16),
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: m(8),
    paddingHorizontal: m(12),
    marginRight: m(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: m(8),
  },
  searchInput: {
    flex: 1,
    height: m(44),
    fontSize: m(16),
    color: '#1F2937',
  },
  filterButtonContainer: {
    width: m(44),
    height: m(44),
    borderRadius: m(8),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterIndicator: {
    position: 'absolute',
    top: m(8),
    right: m(8),
    width: m(8),
    height: m(8),
    borderRadius: m(4),
    backgroundColor: '#3B82F6',
  },
  loansContainer: {
    flex: 1,
    paddingHorizontal: m(16),
  },
  loanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(12),
    padding: m(16),
    marginBottom: m(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loanCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: m(12),
  },
  loanInfo: {
    flex: 1,
    marginRight: m(8),
  },
  loanAmount: {
    fontSize: m(24),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: m(4),
  },
  loanPurpose: {
    fontSize: m(14),
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(16),
  },
  statusText: {
    fontSize: m(12),
    fontWeight: '600',
    marginLeft: m(4),
  },
  loanDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: m(12),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: m(12),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: m(12),
    color: '#6B7280',
    marginLeft: m(4),
    marginRight: m(4),
  },
  detailValue: {
    fontSize: m(12),
    fontWeight: '500',
    color: '#1F2937',
  },
  lenderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(12),
    padding: m(8),
    backgroundColor: '#F3F4F6',
    borderRadius: m(8),
  },
  lenderName: {
    fontSize: m(14),
    color: '#1F2937',
    marginLeft: m(8),
    flex: 1,
  },
  loanFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loanMode: {
    fontSize: m(12),
    color: '#8B5CF6',
    marginLeft: m(4),
    fontWeight: '500',
  },
  loanDate: {
    fontSize: m(12),
    color: '#9CA3AF',
  },
  loadingContainer: {
    padding: m(40),
    alignItems: 'center',
  },
  loadingText: {
    marginTop: m(12),
    fontSize: m(14),
    color: '#6B7280',
  },
  errorState: {
    padding: m(40),
    alignItems: 'center',
  },
  errorStateTitle: {
    fontSize: m(18),
    fontWeight: '600',
    color: '#1F2937',
    marginTop: m(16),
    marginBottom: m(8),
  },
  errorStateMessage: {
    fontSize: m(14),
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: m(24),
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: m(24),
    paddingVertical: m(12),
    borderRadius: m(8),
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: m(14),
    fontWeight: '600',
  },
  emptyState: {
    padding: m(40),
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: m(18),
    fontWeight: '600',
    color: '#1F2937',
    marginTop: m(16),
    marginBottom: m(8),
  },
  emptySubtitle: {
    fontSize: m(14),
    color: '#6B7280',
    textAlign: 'center',
  },
  loadMoreButton: {
    backgroundColor: '#FFFFFF',
    padding: m(16),
    borderRadius: m(8),
    alignItems: 'center',
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loadMoreText: {
    color: '#3B82F6',
    fontSize: m(14),
    fontWeight: '600',
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: m(20),
    borderTopRightRadius: m(20),
    maxHeight: '80%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: m(16),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterModalTitle: {
    fontSize: m(18),
    fontWeight: '600',
    color: '#1F2937',
  },
  filterScroll: {
    maxHeight: m(400),
  },
  filterSection: {
    padding: m(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterLabel: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: m(12),
  },
  statusFilterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statusOption: {
    paddingHorizontal: m(16),
    paddingVertical: m(8),
    borderRadius: m(20),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: m(8),
    marginBottom: m(8),
  },
  statusOptionSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  statusOptionText: {
    fontSize: m(14),
    color: '#6B7280',
  },
  statusOptionTextSelected: {
    color: '#FFFFFF',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountInputContainer: {
    flex: 1,
  },
  amountInputLabel: {
    fontSize: m(12),
    color: '#6B7280',
    marginBottom: m(4),
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: m(8),
    padding: m(8),
    fontSize: m(14),
    color: '#1F2937',
  },
  amountRangeSeparator: {
    fontSize: m(18),
    color: '#6B7280',
    marginHorizontal: m(8),
  },
  dateInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInputContainer: {
    flex: 1,
    marginRight: m(8),
  },
  dateInputLabel: {
    fontSize: m(12),
    color: '#6B7280',
    marginBottom: m(4),
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: m(8),
    padding: m(8),
    fontSize: m(14),
    color: '#1F2937',
  },
  filterModalActions: {
    flexDirection: 'row',
    padding: m(16),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  filterButton: {
    flex: 1,
    padding: m(12),
    borderRadius: m(8),
    alignItems: 'center',
    marginHorizontal: m(4),
  },
  resetButton: {
    backgroundColor: '#F3F4F6',
  },
  resetButtonText: {
    color: '#6B7280',
    fontSize: m(14),
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: '#3B82F6',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: m(14),
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: m(16),
    color: '#EF4444',
  },
});

export default BorrowerLoanHistoryScreen;