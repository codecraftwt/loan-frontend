import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  KeyboardAvoidingView,
  RefreshControl,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { getLoanByLender, updateLoanStatus } from '../../Redux/Slices/loanSlice';
import moment from 'moment';
import DatePicker from 'react-native-date-picker';
import PromptBox from '../PromptBox/Prompt';
import Toast from 'react-native-toast-message';
import LoaderSkeleton from '../../Components/LoaderSkeleton';
import { m } from 'walstar-rn-responsive';
import Header from '../../Components/Header';
import { useRoute } from '@react-navigation/native';

const Outward = ({ navigation }) => {
  const dispatch = useDispatch();
  const route = useRoute();
  const [searchQuery, setSearchQuery] = useState('');
  const { lenderLoans, loading, error } = useSelector(state => state.loans);
  const [isPromptVisible, setIsPromptVisible] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [startDateFilter, setStartDateFilter] = useState(null);
  const [endDateFilter, setEndDateFilter] = useState(null);
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [currentDateType, setCurrentDateType] = useState('start');
  const [tempDate, setTempDate] = useState(new Date());
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Get highlightLoanId from route params
  const highlightLoanId = route.params?.highlightLoanId;
  const scrollViewRef = React.useRef(null);
  const loanCardRefs = React.useRef({});

  // Use lenderLoans directly (now filtered by backend)
  const displayLoans = lenderLoans;

  const formatDate = date => moment(date).format('DD-MM-YYYY');

  // Add debouncing effect for search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch loans when debounced search changes
  useEffect(() => {
    const filters = {};
    if (debouncedSearch) {
      filters.search = debouncedSearch;
    }
    dispatch(getLoanByLender(filters));
  }, [debouncedSearch, dispatch]);

  // Also fetch loans on initial mount
  useEffect(() => {
    dispatch(getLoanByLender());
  }, [dispatch]);

  // Effect to scroll to and highlight loan when highlightLoanId is provided
  useEffect(() => {
    if (highlightLoanId && displayLoans?.length > 0 && scrollViewRef.current) {
      const loanIndex = displayLoans.findIndex(loan => loan._id === highlightLoanId);
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
  }, [highlightLoanId, displayLoans]);

  const handleConfirm = useCallback(async () => {
    const newStatus = selectedLoan?.status === 'pending' ? 'paid' : 'pending';
    try {
      setIsPromptVisible(false);
      await dispatch(
        updateLoanStatus({ loanId: selectedLoan._id, status: newStatus }),
      ).unwrap();
      Toast.show({
        type: 'success',
        position: 'top',
        text1: 'Loan status updated successfully',
      });
      // Refresh the list after status update
      const filters = {};
      if (debouncedSearch) {
        filters.search = debouncedSearch;
      }
      dispatch(getLoanByLender(filters));
    } catch (err) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: err.message || 'Error updating loan status',
      });
    } finally {
      setIsPromptVisible(false);
    }
  }, [dispatch, selectedLoan, debouncedSearch]);

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

  const handleCancel = useCallback(() => {
    setSelectedLoan(null);
    setIsPromptVisible(false);
  }, []);

  const onRefresh = useCallback(async () => {
    const filters = {};
    if (debouncedSearch) {
      filters.search = debouncedSearch;
    }
    await dispatch(getLoanByLender(filters));
  }, [dispatch, debouncedSearch]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title="My Given Loans" />

      {/* Search and Filter Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name..."
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

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddDetails')}>
          <Icon name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
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
              <Text style={styles.filterLabel}>Search by Name</Text>
              <View style={styles.searchInputContainer}>
                <Icon name="search" size={18} color="#6B7280" />
                <TextInput
                  style={styles.searchFilterInput}
                  placeholder="Enter name to search..."
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
          {displayLoans?.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="inventory" size={60} color="#E5E7EB" />
              <Text style={styles.emptyTitle}>No loans found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Try a different search term' : 'Start by adding a new loan'}
              </Text>
            </View>
          ) : (
            displayLoans?.map((loan, index) => {
              const isHighlighted = highlightLoanId === loan._id;
              return (
                <View
                  key={index}
                  ref={ref => {
                    if (ref && loan._id) {
                      loanCardRefs.current[loan._id] = ref;
                    }
                  }}>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('LoanDetailScreen', {
                        loanDetails: loan,
                        isEdit: true,
                      })
                    }
                    activeOpacity={0.9}>
                    <View style={[
                      styles.loanCard,
                      isHighlighted && styles.highlightedLoanCard
                    ]}>
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.userInfo}>
                      {loan?.profileImage ? (
                        <Image
                          source={{ uri: loan?.profileImage }}
                          style={styles.userAvatar}
                        />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarText}>
                            {loan?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </Text>
                        </View>
                      )}
                      <View style={styles.userDetails}>
                        <Text style={styles.userName} numberOfLines={1}>
                          {loan.name}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.amountContainer}>
                      <Text style={styles.amountText}>
                        ₹{loan.amount?.toLocaleString('en-IN')}
                      </Text>
                      <Text style={styles.amountLabel}>Loan Amount</Text>
                    </View>
                  </View>

                  {/* Loan Details */}
                  <View style={styles.loanDetails}>
                    <View style={styles.detailItem}>
                      <Icon name="calendar-today" size={16} color="#6B7280" />
                      <Text style={styles.detailLabel}>Start Date</Text>
                      <Text style={styles.detailValue}>
                        {loan.loanStartDate ? formatDate(loan.loanStartDate) : 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Icon name="event" size={16} color="#6B7280" />
                      <Text style={styles.detailLabel}>Due Date</Text>
                      <Text style={styles.detailValue}>
                        {formatDate(loan.loanEndDate)}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Icon name="phone" size={16} color="#6B7280" />
                      <Text style={styles.detailLabel}>Contact</Text>
                      <Text style={styles.detailValue}>
                        {loan.mobileNumber || 'N/A'}
                      </Text>
                    </View>
                  </View>

                  {/* Card Footer with Status */}
                  <View style={styles.cardFooter}>
                    <View style={styles.footerLeft}>
                      <Icon name="access-time" size={16} color="#6B7280" />
                      <Text style={styles.timeText}>
                        Added {moment(loan.createdAt).fromNow()}
                      </Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      loan.status === 'paid'
                        ? styles.statusPaid
                        : styles.statusPending
                    ]}>
                      <Icon
                        name={loan.status === 'paid' ? 'check-circle' : 'pending'}
                        size={14}
                        color="#FFFFFF"
                      />
                      <Text style={styles.statusText}>
                        {loan.status?.charAt(0).toUpperCase() + loan.status?.slice(1)}
                      </Text>
                    </View>
                    </View>
                  </View>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      <PromptBox
        visible={isPromptVisible}
        message={`Are you sure you want to change the status to ${selectedLoan?.status === 'pending' ? 'paid' : 'pending'}?`}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </KeyboardAvoidingView>
  );
};

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
    marginRight: m(12),
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
  addButton: {
    width: m(44),
    height: m(44),
    borderRadius: m(12),
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: m(20),
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
    marginBottom: m(24),
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
    padding: m(16),
  },
   scrollContent: {
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
  highlightedLoanCard: {
    borderWidth: 3,
    borderColor: '#ff6700',
    backgroundColor: '#FFF5E6',
    elevation: 8,
    shadowColor: '#ff6700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: m(6),
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: m(46),
    height: m(46),
    borderRadius: m(24),
    marginRight: m(12),
  },
  avatarPlaceholder: {
    width: m(46),
    height: m(46),
    borderRadius: m(24),
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(12),
  },
  avatarText: {
    fontSize: m(18),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: m(17),
    fontWeight: '600',
    color: '#111827',
    marginBottom: m(2),
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#111827',
  },
  amountLabel: {
    fontSize: m(11.6),
    color: '#6B7280',
    marginTop: m(2),
  },
  loanDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: m(12),
    padding: m(12),
    marginBottom: m(10),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(6),
  },
  detailLabel: {
    fontSize: m(12),
    color: '#6B7280',
    marginLeft: m(8),
    marginRight: m(4),
    width: m(60),
  },
  detailValue: {
    fontSize: m(14),
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: m(10),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: m(12),
    color: '#6B7280',
    marginLeft: m(4),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(20),
  },
  statusPaid: {
    backgroundColor: '#10B981',
  },
  statusPending: {
    backgroundColor: '#F59E0B',
  },
  statusText: {
    fontSize: m(12),
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: m(4),
  },

  // Input Styles
  input: {
    fontSize: m(14),
    color: '#374151',
    height: m(44),
  },
});

export default Outward;