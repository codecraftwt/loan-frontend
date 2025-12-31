import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { m } from 'walstar-rn-responsive';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Header from '../../../Components/Header';
import {
  getLendersWithPlans,
  setFilters,
  setLimit,
  resetFilters,
} from '../../../Redux/Slices/adminLendersSlice';

const formatCurrency = value => {
  if (!value) return '₹0';
  const num = Number(value) || 0;
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const formatDate = dateString => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};

export default function LenderList() {
  const dispatch = useDispatch();
  const { lenders, loading, error, pagination, filters, limit } = useSelector(
    state => state.adminLenders,
  );
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Temporary filter state for modal
  const [tempFilters, setTempFilters] = useState({
    planStatus: filters.planStatus,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });
  const [tempLimit, setTempLimit] = useState(limit);

  const loadLenders = useCallback(
    async (customFilters = null, customPage = null) => {
      const activeFilters = customFilters || filters;
      const params = {
        page: customPage || pagination.currentPage,
        limit: limit,
        ...activeFilters,
      };
      await dispatch(getLendersWithPlans(params));
    },
    [dispatch, filters, pagination.currentPage, limit],
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== filters.search) {
        const newFilters = { ...filters, search: searchQuery };
        dispatch(setFilters({ search: searchQuery }));
        dispatch(getLendersWithPlans({ ...newFilters, page: 1, limit }));
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  useEffect(() => {
    loadLenders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.planStatus, filters.sortBy, filters.sortOrder, limit]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLenders();
    setRefreshing(false);
  };

  // const handlePageChange = newPage => {
  //   if (newPage >= 1 && newPage <= pagination.totalPages) {
  //     dispatch(getLendersWithPlans({ ...filters, page: newPage, limit }));
  //   }
  // };

  const handleTempFilterChange = (key, value) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  };

  // const handleTempLimitChange = newLimit => {
  //   setTempLimit(newLimit);
  // };

  const handleApplyFilters = () => {
    dispatch(setFilters(tempFilters));
    dispatch(setLimit(tempLimit));
    setShowFilters(false);
    // Reset to page 1 when filters change
    dispatch(getLendersWithPlans({ ...tempFilters, limit: tempLimit, page: 1 }));
  };

  const handleClearFilters = () => {
    dispatch(resetFilters());
    dispatch(setLimit(10));
    setTempFilters({
      planStatus: 'all',
      sortBy: 'planPurchaseDate',
      sortOrder: 'desc',
    });
    setTempLimit(10);
    setShowFilters(false);
    dispatch(getLendersWithPlans({ 
      planStatus: 'all',
      sortBy: 'planPurchaseDate',
      sortOrder: 'desc',
      search: filters.search,
      limit: 10,
      page: 1 
    }));
  };

  const handleClearAllFilters = () => {
    dispatch(resetFilters());
    dispatch(setLimit(10));
    setSearchQuery('');
    setTempFilters({
      planStatus: 'all',
      sortBy: 'planPurchaseDate',
      sortOrder: 'desc',
    });
    setTempLimit(10);
    dispatch(getLendersWithPlans({ 
      planStatus: 'all',
      sortBy: 'planPurchaseDate',
      sortOrder: 'desc',
      search: '',
      limit: 10,
      page: 1 
    }));
  };

  // Update temp filters when modal opens
  useEffect(() => {
    if (showFilters) {
      setTempFilters({
        planStatus: filters.planStatus,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });
      setTempLimit(limit);
    }
  }, [showFilters, filters, limit]);

  const handleViewDetails = lender => {
    navigation.navigate('LenderDetailsScreen', {
      lenderData: lender,
    });
  };

  const renderLenderItem = ({ item }) => {
    const lender = item.lender || {};
    const plan = item.currentPlan || {};
    const planDetails = item.planPurchaseDetails || {};
    const planStatus = planDetails.planStatus || 'expired';
    const isPlanActive = planDetails.isPlanActive || false;

    return (
      <View style={styles.lenderCard}>
        <View style={styles.lenderHeader}>
          <View style={styles.lenderAvatar}>
            {lender.profileImage ? (
              <Text style={styles.avatarText}>IMG</Text>
            ) : (
              <Text style={styles.avatarText}>
                {lender.userName
                  ?.split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .substring(0, 2) || 'L'}
              </Text>
            )}
          </View>
          <View style={styles.lenderInfo}>
            <Text style={styles.lenderName}>{lender.userName || 'N/A'}</Text>
            <Text style={styles.lenderEmail}>{lender.email || 'N/A'}</Text>
            <Text style={styles.lenderMobile}>
              {lender.mobileNo || 'N/A'}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isPlanActive ? '#E8F5E9' : '#FFEBEE',
              },
            ]}>
            <Text
              style={[
                styles.statusText,
                { color: isPlanActive ? '#4CAF50' : '#F44336' },
              ]}>
              {planStatus === 'active' ? 'Active Plan' : 'Expired'}
            </Text>
          </View>
        </View>

        {/* Plan Details Section */}
        {plan.planName && (
          <View style={styles.planSection}>
            <View style={styles.planHeader}>
              <Icon name="package" size={16} color="#ff6700" />
              <Text style={styles.planTitle}>Current Plan</Text>
            </View>
            <View style={styles.planDetails}>
              <View style={styles.planRow}>
                <Text style={styles.planLabel}>Plan:</Text>
                <Text style={styles.planValue}>{plan.planName}</Text>
              </View>
              <View style={styles.planRow}>
                <Text style={styles.planLabel}>Price:</Text>
                <Text style={styles.planValue}>
                  {formatCurrency(plan.priceMonthly)}/{plan.duration}
                </Text>
              </View>
              {planDetails.planPurchaseDate && (
                <View style={styles.planRow}>
                  <Text style={styles.planLabel}>Purchased:</Text>
                  <Text style={styles.planValue}>
                    {formatDate(planDetails.planPurchaseDate)}
                  </Text>
                </View>
              )}
              {planDetails.planExpiryDate && (
                <View style={styles.planRow}>
                  <Text style={styles.planLabel}>Expires:</Text>
                  <Text
                    style={[
                      styles.planValue,
                      !isPlanActive && styles.expiredText,
                    ]}>
                    {formatDate(planDetails.planExpiryDate)}
                  </Text>
                </View>
              )}
              {isPlanActive && planDetails.remainingDays !== undefined && (
                <View style={styles.planRow}>
                  <Text style={styles.planLabel}>Remaining:</Text>
                  <Text style={[styles.planValue, styles.remainingDays]}>
                    {planDetails.remainingDays} days
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.lenderFooter}>
          <Text style={styles.joinDate}>
            Joined: {formatDate(lender.createdAt)}
          </Text>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => handleViewDetails(item)}>
            <Text style={styles.viewButtonText}>View Details</Text>
            <Icon name="chevron-right" size={16} color="#ff6700" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowFilters(false)}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => setShowFilters(false)}
        />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Icon name="x" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalBody}
            contentContainerStyle={styles.modalBodyContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}>
            {/* Plan Status Filter */}
            <View style={styles.filterSection}>
              <View style={styles.filterSectionHeader}>
                <Icon name="filter" size={18} color="#ff6700" />
                <Text style={styles.filterLabel}>Plan Status</Text>
              </View>
              <View style={styles.filterOptionsContainer}>
                {['all', 'active', 'expired'].map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterOption,
                      tempFilters.planStatus === status && styles.filterOptionActive,
                    ]}
                    onPress={() => handleTempFilterChange('planStatus', status)}>
                    <View style={styles.filterOptionContent}>
                      <View style={[
                        styles.radioButton,
                        tempFilters.planStatus === status && styles.radioButtonActive
                      ]}>
                        {tempFilters.planStatus === status && (
                          <View style={styles.radioButtonInner} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.filterOptionText,
                          tempFilters.planStatus === status &&
                            styles.filterOptionTextActive,
                        ]}>
                        {status === 'all' ? 'All Plans' : status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Modal Footer with Buttons */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearFilters}>
              <Icon name="x-circle" size={18} color="#666" />
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApplyFilters}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
              <Icon name="check" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );


  const activeLenders = lenders.filter(
    l => l.planPurchaseDetails?.planStatus === 'active',
  );
  const expiredLenders = lenders.filter(
    l => l.planPurchaseDetails?.planStatus === 'expired',
  );

  return (
    <View style={styles.container}>
      <Header title="Lenders with Plans" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* Search and Filter Bar */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, or mobile..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="x" size={20} color="#666" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}>
            <Icon name="filter" size={20} color="#ff6700" />
            {(filters.planStatus !== 'all' ||
              filters.sortBy !== 'planPurchaseDate' ||
              filters.sortOrder !== 'desc' ||
              limit !== 10) && (
              <View style={styles.filterBadge} />
            )}
          </TouchableOpacity>
        </View>

        {/* Active Filters Indicator */}
        {(filters.planStatus !== 'all' ||
          filters.sortBy !== 'planPurchaseDate' ||
          filters.sortOrder !== 'desc' ||
          limit !== 10 ||
          searchQuery.length > 0) && (
          <View style={styles.activeFiltersContainer}>
            <View style={styles.activeFiltersContent}>
              <Icon name="filter" size={16} color="#ff6700" />
              <Text style={styles.activeFiltersText}>Filters Active</Text>
              <TouchableOpacity
                style={styles.clearAllFiltersButton}
                onPress={handleClearAllFilters}>
                <Icon name="x" size={14} color="#ff6700" />
                <Text style={styles.clearAllFiltersText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Lenders</Text>
            <Text style={styles.summaryValue}>
              {pagination.totalDocuments || 0}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Active Plans</Text>
            <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
              {activeLenders.length}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Expired Plans</Text>
            <Text style={[styles.summaryValue, { color: '#F44336' }]}>
              {expiredLenders.length}
            </Text>
          </View>
        </View>

        {/* Loading State */}
        {loading && lenders.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ff6700" />
            <Text style={styles.loadingText}>Loading lenders...</Text>
          </View>
        )}

        {/* Error State */}
        {error && lenders.length === 0 && (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={48} color="#F44336" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => loadLenders()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Lender List */}
        {!loading && !error && (
          <FlatList
            data={lenders}
            renderItem={renderLenderItem}
            keyExtractor={item => item.lender?._id || Math.random().toString()}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="users" size={48} color="#CCC" />
                <Text style={styles.emptyText}>No lenders found</Text>
                {filters.search && (
                  <Text style={styles.emptySubtext}>
                    Try adjusting your search or filters
                  </Text>
                )}
              </View>
            }
          />
        )}

        {/* Pagination */}
        {/* {pagination.totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[
                styles.paginationButton,
                pagination.currentPage === 1 && styles.paginationButtonDisabled,
              ]}
              onPress={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}>
              <Icon name="chevron-left" size={20} color="#ff6700" />
            </TouchableOpacity>

            <Text style={styles.paginationText}>
              Page {pagination.currentPage} of {pagination.totalPages}
            </Text>

            <TouchableOpacity
              style={[
                styles.paginationButton,
                pagination.currentPage === pagination.totalPages &&
                  styles.paginationButtonDisabled,
              ]}
              onPress={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}>
              <Icon name="chevron-right" size={20} color="#ff6700" />
            </TouchableOpacity>
          </View>
        )} */}
      </ScrollView>

      {renderFilterModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: m(20),
    paddingBottom: m(100),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: m(12),
    paddingHorizontal: m(16),
    paddingVertical: m(12),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: m(12),
  },
  searchInput: {
    flex: 1,
    fontSize: m(16),
    color: '#333',
  },
  filterButton: {
    marginLeft: m(12),
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff6700',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: m(12),
    padding: m(16),
    marginBottom: m(16),
    justifyContent: 'space-around',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: m(12),
    color: '#666',
    marginBottom: m(4),
  },
  summaryValue: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#ff6700',
  },
  loadingContainer: {
    padding: m(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: m(12),
    fontSize: m(16),
    color: '#666',
  },
  errorContainer: {
    padding: m(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: m(12),
    fontSize: m(16),
    color: '#F44336',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: m(16),
    paddingHorizontal: m(24),
    paddingVertical: m(12),
    backgroundColor: '#ff6700',
    borderRadius: m(8),
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  lenderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(12),
    padding: m(16),
    marginBottom: m(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  lenderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(16),
  },
  lenderAvatar: {
    width: m(50),
    height: m(50),
    borderRadius: m(25),
    backgroundColor: '#ff6700',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(12),
  },
  avatarText: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  lenderInfo: {
    flex: 1,
  },
  lenderName: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#333',
    marginBottom: m(4),
  },
  lenderEmail: {
    fontSize: m(12),
    color: '#666',
    marginBottom: m(2),
  },
  lenderMobile: {
    fontSize: m(12),
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(12),
  },
  statusText: {
    fontSize: m(12),
    fontWeight: '600',
  },
  planSection: {
    backgroundColor: '#FFF3E0',
    borderRadius: m(8),
    padding: m(12),
    marginBottom: m(12),
    borderLeftWidth: 3,
    borderLeftColor: '#ff6700',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(8),
  },
  planTitle: {
    fontSize: m(14),
    fontWeight: '700',
    color: '#333',
    marginLeft: m(8),
  },
  planDetails: {
    gap: m(4),
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: m(4),
  },
  planLabel: {
    fontSize: m(12),
    color: '#666',
  },
  planValue: {
    fontSize: m(12),
    fontWeight: '600',
    color: '#333',
  },
  expiredText: {
    color: '#F44336',
  },
  remainingDays: {
    color: '#4CAF50',
    fontWeight: '700',
  },
  lenderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  joinDate: {
    fontSize: m(12),
    color: '#666',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
  },
  viewButtonText: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#ff6700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(40),
  },
  emptyText: {
    fontSize: m(16),
    color: '#999',
    marginTop: m(12),
  },
  emptySubtext: {
    fontSize: m(14),
    color: '#999',
    marginTop: m(4),
  },
  // paginationContainer: {
  //   flexDirection: 'row',
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   marginTop: m(20),
  //   gap: m(16),
  // },
  // paginationButton: {
  //   padding: m(8),
  // },
  // paginationButtonDisabled: {
  //   opacity: 0.3,
  // },
  // paginationText: {
  //   fontSize: m(14),
  //   color: '#666',
  //   fontWeight: '600',
  // },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: m(20),
    borderTopRightRadius: m(20),
    maxHeight: '85%',
    width: '100%',
    paddingHorizontal: m(20),
    paddingTop: m(20),
    paddingBottom: m(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(20),
    paddingBottom: m(16),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: m(20),
    fontWeight: '700',
    color: '#333',
  },
  modalBody: {
    width: '100%',
    flexGrow: 1,
  },
  modalBodyContent: {
    paddingBottom: m(10),
  },
  activeFiltersContainer: {
    backgroundColor: '#FFF3E0',
    borderRadius: m(12),
    padding: m(12),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#ff6700',
  },
  activeFiltersContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeFiltersText: {
    flex: 1,
    fontSize: m(14),
    fontWeight: '600',
    color: '#ff6700',
    marginLeft: m(8),
  },
  clearAllFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    backgroundColor: '#FFFFFF',
    borderRadius: m(8),
    borderWidth: 1,
    borderColor: '#ff6700',
    gap: m(4),
  },
  clearAllFiltersText: {
    fontSize: m(12),
    fontWeight: '600',
    color: '#ff6700',
  },
  filterSection: {
    marginBottom: m(24),
  },
  filterSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(12),
    gap: m(8),
  },
  filterLabel: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#333',
  },
  filterOptionsContainer: {
    gap: m(8),
  },
  filterOption: {
    padding: m(14),
    backgroundColor: '#F8F8F8',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterOptionActive: {
    backgroundColor: '#FFF3E0',
    borderWidth: 2,
    borderColor: '#ff6700',
  },
  filterOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(12),
  },
  radioButton: {
    width: m(20),
    height: m(20),
    borderRadius: m(10),
    borderWidth: 2,
    borderColor: '#CCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonActive: {
    borderColor: '#ff6700',
  },
  radioButtonInner: {
    width: m(10),
    height: m(10),
    borderRadius: m(5),
    backgroundColor: '#ff6700',
  },
  filterOptionText: {
    fontSize: m(14),
    color: '#666',
    flex: 1,
  },
  filterOptionTextActive: {
    color: '#ff6700',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingTop: m(16),
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: m(12),
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(14),
    backgroundColor: '#F5F5F5',
    borderRadius: m(12),
    gap: m(8),
  },
  clearButtonText: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#666',
  },
  applyButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(14),
    backgroundColor: '#ff6700',
    borderRadius: m(12),
    gap: m(8),
  },
  applyButtonText: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
