import React, { useState, useEffect, useCallback } from 'react';
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

export default function Revenue() {
  const dispatch = useDispatch();
  const { revenueData, loading, error, filters } = useSelector(
    state => state.adminRevenue,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    startDate: filters.startDate,
    endDate: filters.endDate,
    groupBy: filters.groupBy,
  });

  const loadRevenue = useCallback(async (customFilters = null) => {
    const activeFilters = customFilters || filters;
    await dispatch(getRevenueStatistics(activeFilters));
  }, [dispatch, filters]);

  useEffect(() => {
    loadRevenue();
  }, []);

  useEffect(() => {
    if (showFilters) {
      setTempFilters({
        startDate: filters.startDate,
        endDate: filters.endDate,
        groupBy: filters.groupBy,
      });
    }
  }, [showFilters, filters]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRevenue();
    setRefreshing(false);
  };

  const handleApplyFilters = () => {
    dispatch(setRevenueFilters(tempFilters));
    setShowFilters(false);
    loadRevenue(tempFilters);
  };

  const handleClearFilters = () => {
    dispatch(resetRevenueFilters());
    setTempFilters({
      startDate: null,
      endDate: null,
      groupBy: 'all',
    });
    setShowFilters(false);
    loadRevenue({
      startDate: null,
      endDate: null,
      groupBy: 'all',
    });
  };

  const summary = revenueData?.summary || {};
  const revenueByPlan = revenueData?.revenueByPlan || [];
  const revenueByMonth = revenueData?.revenueByMonth || [];
  const revenueByYear = revenueData?.revenueByYear || [];
  const purchaseDetails = revenueData?.purchaseDetails || [];

  const maxRevenue = Math.max(
    ...revenueByMonth.map(item => item.totalRevenue || 0),
    1
  );

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
            {/* Group By Filter */}
            <View style={styles.filterSection}>
              <View style={styles.filterSectionHeader}>
                <Icon name="filter" size={18} color="#ff6700" />
                <Text style={styles.filterLabel}>Group By</Text>
              </View>
              <View style={styles.filterOptionsContainer}>
                {[
                  { value: 'all', label: 'All Data' },
                  { value: 'plan', label: 'By Plan' },
                  { value: 'month', label: 'By Month' },
                  { value: 'year', label: 'By Year' },
                ].map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      tempFilters.groupBy === option.value &&
                        styles.filterOptionActive,
                    ]}
                    onPress={() =>
                      setTempFilters({ ...tempFilters, groupBy: option.value })
                    }>
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

  return (
    <View style={styles.container}>
      <Header title="Revenue Report" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* Filter Button */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}>
            <Icon name="filter" size={20} color="#ff6700" />
            <Text style={styles.filterButtonText}>
              {filters.groupBy === 'all'
                ? 'All Data'
                : filters.groupBy.charAt(0).toUpperCase() +
                  filters.groupBy.slice(1)}
            </Text>
            {(filters.startDate || filters.endDate || filters.groupBy !== 'all') && (
              <View style={styles.filterBadge} />
            )}
          </TouchableOpacity>
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
              onPress={() => loadRevenue()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Summary Cards */}
        {revenueData && (
          <>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Icon name="dollar-sign" size={24} color="#4CAF50" />
                <Text style={styles.summaryLabel}>Total Revenue</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(summary.totalRevenue)}
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <Icon name="shopping-cart" size={24} color="#2196F3" />
                <Text style={styles.summaryLabel}>Total Purchases</Text>
                <Text style={styles.summaryValue}>
                  {summary.totalPurchases || 0}
                </Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Icon name="trending-up" size={24} color="#FF9800" />
                <Text style={styles.summaryLabel}>Avg. Per Purchase</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(summary.averageRevenuePerPurchase)}
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <Icon name="check-circle" size={24} color="#4CAF50" />
                <Text style={styles.summaryLabel}>Active Plans</Text>
                <Text style={styles.summaryValue}>
                  {summary.activePlansCount || 0}
                </Text>
              </View>
            </View>

            {/* Revenue by Plan */}
            {(filters.groupBy === 'all' || filters.groupBy === 'plan') &&
              revenueByPlan.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Revenue by Plan</Text>
                  {revenueByPlan.map((item, index) => {
                    const percentage =
                      summary.totalRevenue > 0
                        ? (item.totalRevenue / summary.totalRevenue) * 100
                        : 0;
                    return (
                      <View key={index} style={styles.planCard}>
                        <View style={styles.planHeader}>
                          <View style={styles.planHeaderLeft}>
                            <Icon name="package" size={20} color="#ff6700" />
                            <View style={styles.planInfo}>
                              <Text style={styles.planName}>
                                {item.planName}
                              </Text>
                              <Text style={styles.planPrice}>
                                {formatCurrency(item.priceMonthly)}/{item.duration}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.planRevenue}>
                            {formatCurrency(item.totalRevenue)}
                          </Text>
                        </View>
                        <View style={styles.barContainer}>
                          <View
                            style={[
                              styles.bar,
                              { width: `${percentage}%` },
                            ]}
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
                                { color: '#4CAF50' },
                              ]}>
                              {item.activePurchases}
                            </Text>
                          </View>
                          <View style={styles.planStatItem}>
                            <Text style={styles.planStatLabel}>Expired</Text>
                            <Text
                              style={[
                                styles.planStatValue,
                                { color: '#F44336' },
                              ]}>
                              {item.expiredPurchases}
                            </Text>
                          </View>
                          <View style={styles.planStatItem}>
                            <Text style={styles.planStatLabel}>Avg.</Text>
                            <Text style={styles.planStatValue}>
                              {formatCurrency(item.averageRevenuePerPurchase)}
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
              revenueByMonth.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Monthly Revenue</Text>
                  {revenueByMonth.map((item, index) => {
                    const percentage =
                      maxRevenue > 0
                        ? (item.totalRevenue / maxRevenue) * 100
                        : 0;
                    return (
                      <View key={index} style={styles.monthCard}>
                        <View style={styles.monthHeader}>
                          <Text style={styles.monthName}>
                            {item.monthName} {item.year}
                          </Text>
                          <Text style={styles.monthAmount}>
                            {formatCurrency(item.totalRevenue)}
                          </Text>
                        </View>
                        <View style={styles.barContainer}>
                          <View
                            style={[
                              styles.bar,
                              { width: `${percentage}%` },
                            ]}
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
              revenueByYear.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Yearly Revenue</Text>
                  {revenueByYear.map((item, index) => {
                    const totalYearRevenue = revenueByYear.reduce(
                      (sum, y) => sum + (y.totalRevenue || 0),
                      0
                    );
                    const percentage =
                      totalYearRevenue > 0
                        ? (item.totalRevenue / totalYearRevenue) * 100
                        : 0;
                    return (
                      <View key={index} style={styles.yearCard}>
                        <View style={styles.yearHeader}>
                          <Text style={styles.yearName}>{item.year}</Text>
                          <Text style={styles.yearAmount}>
                            {formatCurrency(item.totalRevenue)}
                          </Text>
                        </View>
                        <View style={styles.barContainer}>
                          <View
                            style={[
                              styles.bar,
                              { width: `${percentage}%` },
                            ]}
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
              purchaseDetails.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Recent Purchases ({purchaseDetails.length})
                  </Text>
                  {purchaseDetails.slice(0, 10).map((item, index) => (
                    <View key={index} style={styles.purchaseCard}>
                      <View style={styles.purchaseHeader}>
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
                            <Text style={styles.purchasePlanName}>
                              {item.planName}
                            </Text>
                            <Text style={styles.purchaseDate}>
                              {formatDate(item.purchaseDate)}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.purchasePrice}>
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
                                { color: '#4CAF50' },
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
  filterContainer: {
    marginBottom: m(16),
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: m(12),
    paddingHorizontal: m(16),
    paddingVertical: m(12),
    gap: m(8),
    position: 'relative',
  },
  filterButtonText: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#333',
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
  summaryRow: {
    flexDirection: 'row',
    gap: m(12),
    marginBottom: m(12),
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: m(12),
    padding: m(16),
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryLabel: {
    fontSize: m(12),
    color: '#666',
    marginTop: m(8),
    marginBottom: m(4),
  },
  summaryValue: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#333',
  },
  section: {
    marginTop: m(20),
  },
  sectionTitle: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#333',
    marginBottom: m(16),
  },
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
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(12),
  },
  planHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: m(12),
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
    color: '#ff6700',
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
    backgroundColor: '#ff6700',
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
  },
  planStatValue: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#333',
  },
  monthCard: {
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
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(12),
  },
  monthName: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#333',
  },
  monthAmount: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#ff6700',
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
  yearCard: {
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
  yearHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(12),
  },
  yearName: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#333',
  },
  yearAmount: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#ff6700',
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
  purchaseCard: {
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
  purchaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(12),
  },
  purchaseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: m(12),
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
  purchasePrice: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#ff6700',
  },
  purchaseDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(16),
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
