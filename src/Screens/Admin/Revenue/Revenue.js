import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { m } from 'walstar-rn-responsive';
import { useDispatch, useSelector } from 'react-redux';
import Header from '../../../Components/Header';
import {
  getRevenueStatistics,
  setRevenueFilters,
  resetRevenueFilters,
} from '../../../Redux/Slices/adminRevenueSlice';

/**
 * Format currency value to Indian Rupee format
 * @param {number} value - The amount to format
 * @returns {string} Formatted currency string
 */
const formatCurrency = value => {
  if (!value) return '₹0';
  const num = Number(value) || 0;
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

/**
 * Format date string to readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
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

// Group by filter options
const GROUP_BY_OPTIONS = [
  { value: 'all', label: 'All Data' },
  { value: 'plan', label: 'By Plan' },
  { value: 'month', label: 'By Month' },
  { value: 'year', label: 'By Year' },
];

/**
 * Revenue Component
 * Displays revenue statistics with filtering and grouping options
 */
export default function Revenue() {
  const dispatch = useDispatch();
  const { revenueData, loading, error, filters } = useSelector(
    state => state.adminRevenue,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [tempFilters, setTempFilters] = useState({
    startDate: filters.startDate,
    endDate: filters.endDate,
    groupBy: filters.groupBy,
  });

  // Load revenue data
  const loadRevenue = useCallback(
    async (customFilters = null) => {
      const activeFilters = customFilters || filters;
      await dispatch(getRevenueStatistics(activeFilters));
    },
    [dispatch, filters],
  );

  // Initial load
  useEffect(() => {
    loadRevenue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update temp filters when modal opens
  useEffect(() => {
    if (showFilters) {
      setTempFilters({
        startDate: filters.startDate,
        endDate: filters.endDate,
        groupBy: filters.groupBy,
      });
    }
  }, [showFilters, filters]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRevenue();
    setRefreshing(false);
  }, [loadRevenue]);

  // Handle filter application
  const handleApplyFilters = useCallback(() => {
    dispatch(setRevenueFilters(tempFilters));
    setShowFilters(false);
    loadRevenue(tempFilters);
  }, [dispatch, tempFilters, loadRevenue]);

  // Handle filter clearing
  const handleClearFilters = useCallback(() => {
    const resetFilters = {
      startDate: null,
      endDate: null,
      groupBy: 'all',
    };
    dispatch(resetRevenueFilters());
    setTempFilters(resetFilters);
    setShowFilters(false);
    loadRevenue(resetFilters);
  }, [dispatch, loadRevenue]);

  // Check if temp filters have changes
  const hasTempFilterChanges = useMemo(() => {
    return (
      tempFilters.startDate !== filters.startDate ||
      tempFilters.endDate !== filters.endDate ||
      tempFilters.groupBy !== filters.groupBy
    );
  }, [tempFilters, filters]);

  // Memoized revenue data
  const revenueSummary = useMemo(() => {
    const summary = revenueData?.summary || {};
    const revenueByPlan = revenueData?.revenueByPlan || [];
    const revenueByMonth = revenueData?.revenueByMonth || [];
    const revenueByYear = revenueData?.revenueByYear || [];
    const purchaseDetails = revenueData?.purchaseDetails || [];

    const maxRevenue = Math.max(
      ...revenueByMonth.map(item => item.totalRevenue || 0),
      1,
    );

    return {
      summary,
      revenueByPlan,
      revenueByMonth,
      revenueByYear,
      purchaseDetails,
      maxRevenue,
    };
  }, [revenueData]);

  // Summary cards data
  const summaryCards = useMemo(() => {
    const summary = revenueSummary?.summary || {};
    return [
      {
        id: 'totalRevenue',
        icon: 'dollar-sign',
        iconColor: '#4CAF50',
        iconBg: 'rgba(76, 175, 80, 0.15)',
        label: 'Total Revenue',
        value: formatCurrency(summary.totalRevenue || 0),
        description: 'Total revenue generated from all plan purchases',
      },
      {
        id: 'totalPurchases',
        icon: 'shopping-cart',
        iconColor: '#2196F3',
        iconBg: 'rgba(33, 150, 243, 0.15)',
        label: 'Total Purchases',
        value: (summary.totalPurchases || 0).toLocaleString('en-IN'),
        description: 'Total number of plan purchases made',
      },
      {
        id: 'avgPurchase',
        icon: 'trending-up',
        iconColor: '#FF9800',
        iconBg: 'rgba(255, 152, 0, 0.15)',
        label: 'Avg. Per Purchase',
        value: formatCurrency(summary.averageRevenuePerPurchase || 0),
        description: 'Average revenue per purchase transaction',
      },
      {
        id: 'activePlans',
        icon: 'check-circle',
        iconColor: '#4CAF50',
        iconBg: 'rgba(76, 175, 80, 0.15)',
        label: 'Active Plans',
        value: (summary.activePlansCount || 0).toLocaleString('en-IN'),
        description: 'Number of currently active subscription plans',
      },
    ];
  }, [revenueSummary]);

  // Handle summary card click
  const handleSummaryClick = useCallback((card) => {
    setSelectedSummary(card);
    setShowDetailModal(true);
  }, []);

  // Memoized filter button text
  const filterButtonText = useMemo(() => {
    if (filters.groupBy === 'all') return 'All Data';
    return filters.groupBy.charAt(0).toUpperCase() + filters.groupBy.slice(1);
  }, [filters.groupBy]);

  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.startDate || filters.endDate || filters.groupBy !== 'all'
    );
  }, [filters]);

  // Render detail modal
  const renderDetailModal = useCallback(
    () => (
      <Modal
        visible={showDetailModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDetailModal(false)}>
        <View style={styles.detailModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowDetailModal(false)}
          />
          <View style={styles.detailModalContent}>
            {selectedSummary ? (
              <>
                <View style={styles.detailModalHeader}>
                  <View
                    style={[
                      styles.detailIconContainer,
                      { backgroundColor: selectedSummary.iconBg },
                    ]}>
                    <Icon
                      name={selectedSummary.icon}
                      size={32}
                      color={selectedSummary.iconColor}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.detailCloseButton}
                    onPress={() => setShowDetailModal(false)}
                    activeOpacity={0.7}>
                    <Icon name="x" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                <View style={styles.detailModalBody}>
                  <Text style={styles.detailLabel}>{selectedSummary.label}</Text>
                  <Text style={styles.detailValue} numberOfLines={2}>
                    {selectedSummary.value || '0'}
                  </Text>
                  <Text style={styles.detailDescription}>
                    {selectedSummary.description}
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.detailModalBody}>
                <Text style={styles.detailLabel}>Loading...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    ),
    [showDetailModal, selectedSummary],
  );

  // Render filter modal
  const renderFilterModal = useCallback(
    () => (
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
              <TouchableOpacity
                onPress={() => setShowFilters(false)}
                activeOpacity={0.7}>
                <Icon name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}>
              {/* Group By Filter */}
              <View style={styles.filterSection}>
                <View style={styles.filterSectionHeader}>
                  <Icon name="filter" size={18} color="#ff6700" />
                  <Text style={styles.filterLabel}>Group By</Text>
                </View>
                <View style={styles.filterOptionsContainer}>
                  {GROUP_BY_OPTIONS.map(option => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.filterOption,
                        tempFilters.groupBy === option.value &&
                          styles.filterOptionActive,
                      ]}
                      onPress={() =>
                        setTempFilters({ ...tempFilters, groupBy: option.value })
                      }
                      activeOpacity={0.7}>
                      <View style={styles.filterOptionContent}>
                        <View
                          style={[
                            styles.radioButton,
                            tempFilters.groupBy === option.value &&
                              styles.radioButtonActive,
                          ]}>
                          {tempFilters.groupBy === option.value && (
                            <View style={styles.radioButtonInner} />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.filterOptionText,
                            tempFilters.groupBy === option.value &&
                              styles.filterOptionTextActive,
                          ]}>
                          {option.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.clearButton,
                  !hasActiveFilters && styles.clearButtonDisabled,
                ]}
                onPress={handleClearFilters}
                disabled={!hasActiveFilters}
                activeOpacity={0.7}>
                <Icon
                  name="x-circle"
                  size={18}
                  color={hasActiveFilters ? '#F44336' : '#CCC'}
                />
                <Text
                  style={[
                    styles.clearButtonText,
                    !hasActiveFilters && styles.clearButtonTextDisabled,
                  ]}>
                  Clear All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.applyButton,
                  !hasTempFilterChanges && styles.applyButtonDisabled,
                ]}
                onPress={handleApplyFilters}
                disabled={!hasTempFilterChanges}
                activeOpacity={0.8}>
                <Text style={styles.applyButtonText}>Apply Filters</Text>
                <Icon name="check" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    ),
    [
      showFilters,
      tempFilters,
      handleApplyFilters,
      handleClearFilters,
      hasActiveFilters,
      hasTempFilterChanges,
    ],
  );

  return (
    <View style={styles.container}>
      <Header title="Revenue Report" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* Filter Button and Clear Filter */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              hasActiveFilters && styles.filterButtonActive,
            ]}
            onPress={() => setShowFilters(true)}
            activeOpacity={0.7}>
            <Icon name="filter" size={20} color={hasActiveFilters ? '#FFFFFF' : '#ff6700'} />
            <Text
              style={[
                styles.filterButtonText,
                hasActiveFilters && styles.filterButtonTextActive,
              ]}>
              {filterButtonText}
            </Text>
            {hasActiveFilters && <View style={styles.filterBadge} />}
          </TouchableOpacity>
          {hasActiveFilters && (
            <TouchableOpacity
              style={styles.clearFilterButton}
              onPress={handleClearFilters}
              activeOpacity={0.7}>
              <Icon name="x-circle" size={18} color="#F44336" />
              <Text style={styles.clearFilterButtonText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Loading State */}
        {loading && !revenueData && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ff6700" />
            <Text style={styles.loadingText}>Loading revenue data...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !revenueData && (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={48} color="#F44336" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => loadRevenue()}
              activeOpacity={0.8}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Summary Cards - Circular */}
        {revenueData && (
          <>
            <View style={styles.summaryRow}>
              {summaryCards.map((card) => (
                <TouchableOpacity
                  key={card.id}
                  style={styles.summaryCardContainer}
                  onPress={() => handleSummaryClick(card)}
                  activeOpacity={0.8}>
                  <View style={[styles.summaryCircle, { backgroundColor: card.iconBg }]}>
                    <Icon name={card.icon} size={28} color={card.iconColor} />
                  </View>
                  <Text style={styles.summaryCircleLabel} numberOfLines={2}>
                    {card.label}
                  </Text>
                </TouchableOpacity>
              ))}
        </View>

            {/* Revenue by Plan */}
            {(filters.groupBy === 'all' || filters.groupBy === 'plan') &&
              revenueSummary.revenueByPlan.length > 0 && (
        <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Revenue by Plan</Text>
                  {revenueSummary.revenueByPlan.map((item, index) => {
                    const percentage =
                      revenueSummary.summary.totalRevenue > 0
                        ? (item.totalRevenue /
                            revenueSummary.summary.totalRevenue) *
                          100
                        : 0;
            return (
                      <View key={`plan-${index}`} style={styles.planCard}>
                        <View style={[styles.detailModalHeader, {marginBottom:m(12)}]}>
                          <View style={styles.planHeaderLeft}>
                            <Icon name="package" size={20} color="#ff9900ff" />
                            <View style={styles.planInfo}>
                              <Text style={styles.planName} numberOfLines={1}>
                                {item.planName}
                              </Text>
                              <Text style={styles.planPrice}>
                                {formatCurrency(item.priceMonthly)}/
                                {item.duration}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.planRevenue}>
                            {formatCurrency(item.totalRevenue)}
                          </Text>
                        </View>
                        <View style={styles.barContainer}>
                          <View
                            style={[styles.bar, { width: `${percentage}%` }]}
                          />
                        </View>
                        <View style={styles.planStats}>
                          <View style={styles.planStatItem}>
                            <Text style={styles.planStatLabel}>Purchases</Text>
                            <Text style={styles.planStatValue}>
                              {item.totalPurchases}
                            </Text>
                          </View>
                          <View style={styles.planStatItem}>
                            <Text style={styles.planStatLabel}>Active</Text>
                            <Text
                              style={[
                                styles.planStatValue,
                                styles.activeText,
                              ]}>
                              {item.activePurchases}
                            </Text>
                          </View>
                          <View style={styles.planStatItem}>
                            <Text style={styles.planStatLabel}>Expired</Text>
                            <Text
                              style={[
                                styles.planStatValue,
                                styles.expiredText,
                              ]}>
                              {item.expiredPurchases}
                            </Text>
                          </View>
                          <View style={styles.planStatItem}>
                            <Text style={styles.planStatLabel}>Avg.</Text>
                            <Text style={styles.planStatValue}>
                              {formatCurrency(
                                item.averageRevenuePerPurchase,
                              )}
                            </Text>
                          </View>
                        </View>
                  </View>
                    );
                  })}
                </View>
              )}

            {/* Revenue by Month */}
            {(filters.groupBy === 'all' || filters.groupBy === 'month') &&
              revenueSummary.revenueByMonth.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Monthly Revenue</Text>
                  {revenueSummary.revenueByMonth.map((item, index) => {
                    const percentage =
                      revenueSummary.maxRevenue > 0
                        ? (item.totalRevenue / revenueSummary.maxRevenue) * 100
                        : 0;
                    return (
                      <View key={`month-${index}`} style={styles.planCard}>
                        <View style={[styles.detailModalHeader,{marginBottom: m(12)}]}>
                          <Text style={styles.monthName}>
                            {item.monthName} {item.year}
                          </Text>
                          <Text style={styles.planRevenue}>
                            {formatCurrency(item.totalRevenue)}
                          </Text>
                </View>
                <View style={styles.barContainer}>
                  <View
                            style={[styles.bar, { width: `${percentage}%` }]}
                  />
                </View>
                <View style={styles.monthDetails}>
                  <View style={styles.monthDetailItem}>
                            <Icon name="shopping-cart" size={16} color="#2196F3" />
                            <Text style={styles.monthPurchases}>
                              {item.totalPurchases} purchases
                    </Text>
                  </View>
                        </View>
                  </View>
                    );
                  })}
                </View>
              )}

            {/* Revenue by Year */}
            {(filters.groupBy === 'all' || filters.groupBy === 'year') &&
              revenueSummary.revenueByYear.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Yearly Revenue</Text>
                  {revenueSummary.revenueByYear.map((item, index) => {
                    const totalYearRevenue = revenueSummary.revenueByYear.reduce(
                      (sum, y) => sum + (y.totalRevenue || 0),
                      0,
                    );
                    const percentage =
                      totalYearRevenue > 0
                        ? (item.totalRevenue / totalYearRevenue) * 100
                        : 0;
                    return (
                      <View key={`year-${index}`} style={styles.planCard}>
                        <View style={[styles.detailModalHeader,{marginBottom: m(12)}]}>
                          <Text style={styles.yearName}>{item.year}</Text>
                          <Text style={styles.planRevenue}>
                            {formatCurrency(item.totalRevenue)}
                          </Text>
                        </View>
                        <View style={styles.barContainer}>
                          <View
                            style={[styles.bar, { width: `${percentage}%` }]}
                          />
                        </View>
                        <View style={styles.yearDetails}>
                          <Icon name="shopping-cart" size={16} color="#2196F3" />
                          <Text style={styles.yearPurchases}>
                            {item.totalPurchases} purchases
                          </Text>
                </View>
              </View>
            );
          })}
        </View>
              )}

            {/* Purchase Details */}
            {filters.groupBy === 'all' &&
              revenueSummary.purchaseDetails.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Recent Purchases ({revenueSummary.purchaseDetails.length})
                  </Text>
                  {revenueSummary.purchaseDetails.slice(0, 10).map((item, index) => (
                    <View key={`purchase-${index}`} style={styles.planCard}>
                      <View style={[styles.detailModalHeader,{marginBottom: m(12)}]}>
                        <View style={styles.purchaseHeaderLeft}>
                          <View
                            style={[
                              styles.purchaseStatusIndicator,
                              item.isActive
                                ? styles.purchaseStatusActive
                                : styles.purchaseStatusExpired,
                            ]}
                          />
                          <View style={styles.purchaseInfo}>
                            <Text style={styles.purchasePlanName} numberOfLines={1}>
                              {item.planName}
                            </Text>
                            <Text style={styles.purchaseDate}>
                              {formatDate(item.purchaseDate)}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.planRevenue}>
                          {formatCurrency(item.price)}
                        </Text>
                      </View>
                      <View style={styles.purchaseDetails}>
                        <View style={styles.purchaseDetailItem}>
                          <Icon name="clock" size={14} color="#666" />
                          <Text style={styles.purchaseDetailText}>
                            Expires: {formatDate(item.expiryDate)}
                          </Text>
                        </View>
                        {item.isActive && item.remainingDays !== undefined && (
                          <View style={styles.purchaseDetailItem}>
                            <Icon name="calendar" size={14} color="#4CAF50" />
                            <Text
                              style={[
                                styles.purchaseDetailText,
                                styles.remainingDaysText,
                              ]}>
                              {item.remainingDays} days remaining
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
          </>
        )}
      </ScrollView>
      {renderFilterModal()}
      {renderDetailModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  // ==================== Container & Layout ====================
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

  // ==================== Filter Section ====================
  filterContainer: {
    flexDirection: 'row',
    gap: m(12),
    marginBottom: m(16),
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: m(12),
    paddingHorizontal: m(16),
    paddingVertical: m(12),
    gap: m(8),
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterButtonActive: {
    backgroundColor: '#ff6700',
    borderColor: '#ff6700',
  },
  filterButtonText: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#333',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  filterBadge: {
    position: 'absolute',
    top: m(8),
    right: m(8),
    width: m(8),
    height: m(8),
    borderRadius: m(4),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ff6700',
  },
  clearFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: m(12),
    paddingHorizontal: m(16),
    paddingVertical: m(12),
    gap: m(6),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#FFEBEE',
    minWidth: m(120),
  },
  clearFilterButtonText: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#F44336',
  },

  // ==================== Loading & Error States ====================
  loadingContainer: {
    padding: m(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: m(12),
    fontSize: m(16),
    color: '#666',
    fontWeight: '500',
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
    fontWeight: '500',
  },
  retryButton: {
    marginTop: m(16),
    paddingHorizontal: m(24),
    paddingVertical: m(12),
    backgroundColor: '#ff6700',
    borderRadius: m(8),
    elevation: 2,
    shadowColor: '#ff6700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: m(14),
  },

  // ==================== Summary Cards (Circular) ====================
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: m(4),
    marginBottom: m(20),
    paddingHorizontal: m(0),
    flexWrap: 'nowrap',
  },
  summaryCardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    minWidth: 0,
    maxWidth: '25%',
  },
  summaryCircle: {
    width: m(60),
    height: m(60),
    borderRadius: m(30),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: m(8),
  },
  summaryCircleLabel: {
    fontSize: m(11),
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: m(14),
    maxWidth: m(80),
  },

  // ==================== Detail Modal ====================
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: m(20),
  },
  detailModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(20),
    width: '100%',
    maxWidth: m(320),
    padding: m(24),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    zIndex: 1000,
  },
  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(20),
  },
  detailIconContainer: {
    width: m(64),
    height: m(64),
    borderRadius: m(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCloseButton: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailModalBody: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: m(16),
    color: '#64748b',
    fontWeight: '600',
    marginBottom: m(12),
    textAlign: 'center',
  },
  detailValue: {
    fontSize: m(32),
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: m(16),
    textAlign: 'center',
  },
  detailDescription: {
    fontSize: m(14),
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: m(20),
  },

  // ==================== Section Styles ====================
  section: {
    marginTop: m(14),
  },
  sectionTitle: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#333',
    marginBottom: m(16),
    letterSpacing: 0.3,
  },

  // ==================== Plan Card Styles ====================
  planCard: {
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
  planHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: m(12),
    marginRight: m(12),
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#333',
    marginBottom: m(4),
  },
  planPrice: {
    fontSize: m(12),
    color: '#666',
  },
  planRevenue: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#74C365',
  },
  barContainer: {
    height: m(8),
    backgroundColor: '#F5F5F5',
    borderRadius: m(4),
    marginBottom: m(12),
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: '#ff9900ff',
    borderRadius: m(4),
  },
  planStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  planStatItem: {
    alignItems: 'center',
  },
  planStatLabel: {
    fontSize: m(11),
    color: '#666',
    marginBottom: m(4),
    fontWeight: '500',
  },
  planStatValue: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#333',
  },
  activeText: {
    color: '#4CAF50',
  },
  expiredText: {
    color: '#F44336',
  },

  // ==================== Month Card Styles ====================
  monthName: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#333',
  },
  monthDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  monthDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  monthPurchases: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#333',
  },

  // ==================== Year Card Styles ====================
  yearName: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#333',
  },
  yearDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  yearPurchases: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#333',
  },

  // ==================== Purchase Card Styles ====================
  purchaseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: m(12),
    marginRight: m(12),
  },
  purchaseStatusIndicator: {
    width: m(12),
    height: m(12),
    borderRadius: m(6),
  },
  purchaseStatusActive: {
    backgroundColor: '#4CAF50',
  },
  purchaseStatusExpired: {
    backgroundColor: '#CCC',
  },
  purchaseInfo: {
    flex: 1,
  },
  purchasePlanName: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#333',
    marginBottom: m(4),
  },
  purchaseDate: {
    fontSize: m(12),
    color: '#666',
  },
  purchaseDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(16),
    flexWrap: 'wrap',
  },
  purchaseDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  purchaseDetailText: {
    fontSize: m(12),
    color: '#666',
  },
  remainingDaysText: {
    color: '#4CAF50',
    fontWeight: '600',
  },

  // ==================== Filter Modal Styles ====================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: m(24),
    borderTopRightRadius: m(24),
    maxHeight: '85%',
    width: '100%',
    paddingHorizontal: m(20),
    paddingTop: m(24),
    paddingBottom: m(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(24),
    paddingBottom: m(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: m(22),
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: 0.3,
  },
  modalBody: {
    width: '100%',
    flexGrow: 1,
  },
  modalBodyContent: {
    paddingBottom: m(10),
  },
  filterSection: {
    marginBottom: m(24),
  },
  filterSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(16),
    gap: m(10),
    paddingBottom: m(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  filterLabel: {
    fontSize: m(17),
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: 0.3,
  },
  filterOptionsContainer: {
    gap: m(12),
  },
  filterOption: {
    padding: m(16),
    backgroundColor: '#F8F9FA',
    borderRadius: m(14),
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  filterOptionActive: {
    backgroundColor: '#FFF8F0',
    borderWidth: 2,
    borderColor: '#ff6700',
    elevation: 2,
    shadowColor: '#ff6700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(12),
  },
  radioButton: {
    width: m(22),
    height: m(22),
    borderRadius: m(11),
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioButtonActive: {
    borderColor: '#ff6700',
    backgroundColor: '#FFF8F0',
  },
  radioButtonInner: {
    width: m(12),
    height: m(12),
    borderRadius: m(6),
    backgroundColor: '#ff6700',
  },
  filterOptionText: {
    fontSize: m(15),
    color: '#64748b',
    flex: 1,
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#ff6700',
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingTop: m(20),
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: m(12),
    backgroundColor: '#FFFFFF',
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(16),
    backgroundColor: '#F5F5F5',
    borderRadius: m(14),
    gap: m(8),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  clearButtonDisabled: {
    opacity: 0.5,
  },
  clearButtonText: {
    fontSize: m(15),
    fontWeight: '600',
    color: '#F44336',
  },
  clearButtonTextDisabled: {
    color: '#9CA3AF',
  },
  applyButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(16),
    backgroundColor: '#ff6700',
    borderRadius: m(14),
    gap: m(8),
    elevation: 3,
    shadowColor: '#ff6700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  applyButtonDisabled: {
    backgroundColor: '#D1D5DB',
    elevation: 0,
    shadowOpacity: 0,
  },
  applyButtonText: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
