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
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { m } from '../../../Utils/responsive';
import { colors, FontFamily } from '../../../constants';
import { ScreenWrapper } from '../../../Components/common';
import {
  getRevenueStatistics,
  setRevenueFilters,
  resetRevenueFilters,
} from '../../../Redux/Slices/adminRevenueSlice';

/**
 * Format currency value to Indian Rupee format
 */
const formatCurrency = value => {
  if (!value) return '₹0';
  const num = Number(value) || 0;
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

/**
 * Format date string to readable format
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

export default function Revenue() {
  const navigation = useNavigation();
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

  // Handle direct tab switch
  const handleTabSwitch = useCallback(
    groupByValue => {
      const updated = { ...filters, groupBy: groupByValue };
      dispatch(setRevenueFilters(updated));
      loadRevenue(updated);
    },
    [dispatch, filters, loadRevenue],
  );

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
        iconColor: '#0068FF',
        iconBg: '#E6F0FF',
        label: 'Total Revenue',
        value: formatCurrency(summary.totalRevenue || 0),
        description: 'Total revenue generated from all plan purchases',
      },
      {
        id: 'totalPurchases',
        icon: 'shopping-bag',
        iconColor: '#00D09E',
        iconBg: '#DFF7E2',
        label: 'Total Purchases',
        value: (summary.totalPurchases || 0).toLocaleString('en-IN'),
        description: 'Total number of plan purchases made across all lenders',
      },
      {
        id: 'avgPurchase',
        icon: 'trending-up',
        iconColor: '#7C3AED',
        iconBg: '#F3E8FF',
        label: 'Avg. Per Purchase',
        value: formatCurrency(summary.averageRevenuePerPurchase || 0),
        description: 'Average revenue generated per purchase transaction',
      },
      {
        id: 'activePlans',
        icon: 'check-circle',
        iconColor: '#0068FF',
        iconBg: '#E6F0FF',
        label: 'Active Plans',
        value: (summary.activePlansCount || 0).toLocaleString('en-IN'),
        description: 'Number of currently active subscription tiers',
      },
    ];
  }, [revenueSummary]);

  const handleSummaryClick = useCallback(card => {
    setSelectedSummary(card);
    setShowDetailModal(true);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return filters.startDate || filters.endDate || filters.groupBy !== 'all';
  }, [filters]);

  // Detail Modal
  const renderDetailModal = useCallback(
    () => (
      <Modal
        visible={showDetailModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDetailModal(false)}
      >
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
                    ]}
                  >
                    <Feather
                      name={selectedSummary.icon}
                      size={m(24)}
                      color={selectedSummary.iconColor}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.detailCloseButton}
                    onPress={() => setShowDetailModal(false)}
                    activeOpacity={0.7}
                  >
                    <Feather name="x" size={m(18)} color={colors.lettersAndIcons} />
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

  // Filter Modal
  const renderFilterModal = useCallback(
    () => (
      <Modal
        visible={showFilters}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowFilters(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Revenue Filters</Text>
              <TouchableOpacity
                onPress={() => setShowFilters(false)}
                activeOpacity={0.7}
              >
                <Feather name="x" size={m(22)} color={colors.lettersAndIcons} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.filterSection}>
                <View style={styles.filterSectionHeader}>
                  <Feather name="filter" size={m(16)} color={colors.primary} />
                  <Text style={styles.filterLabel}>Group Aggregation</Text>
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
                      activeOpacity={0.7}
                    >
                      <View style={styles.filterOptionContent}>
                        <View
                          style={[
                            styles.radioButton,
                            tempFilters.groupBy === option.value &&
                              styles.radioButtonActive,
                          ]}
                        >
                          {tempFilters.groupBy === option.value && (
                            <View style={styles.radioButtonInner} />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.filterOptionText,
                            tempFilters.groupBy === option.value &&
                              styles.filterOptionTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.clearButton,
                  !hasActiveFilters && styles.clearButtonDisabled,
                ]}
                onPress={handleClearFilters}
                disabled={!hasActiveFilters}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.clearButtonText,
                    !hasActiveFilters && styles.clearButtonTextDisabled,
                  ]}
                >
                  Reset
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.applyButton,
                  !hasTempFilterChanges && styles.applyButtonDisabled,
                ]}
                onPress={handleApplyFilters}
                disabled={!hasTempFilterChanges}
                activeOpacity={0.8}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
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
    <ScreenWrapper
      backgroundColor={colors.backgroundGreenWhite}
      topInsetBg={colors.primary}
      statusBarColor={colors.primary}
      statusBarStyle="dark-content"
      includeTabBarClearance={false}
      scrollable={false}
    >
      <View style={styles.pageWrapper}>
        {/* Fixed Top Mint Green Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={m(22)} color={colors.white} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Revenue Report</Text>

          <TouchableOpacity
            style={[
              styles.filterHeaderBtn,
              hasActiveFilters && styles.filterHeaderBtnActive,
            ]}
            activeOpacity={0.8}
            onPress={() => setShowFilters(true)}
          >
            <Feather
              name="filter"
              size={m(16)}
              color={hasActiveFilters ? colors.white : colors.lettersAndIcons}
            />
            {hasActiveFilters && <View style={styles.filterBadgeDot} />}
          </TouchableOpacity>
        </View>

        {/* Curved Sheet Container */}
        <View style={styles.sheetSection}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
              />
            }
          >
            {/* Ocean Blue Hero Revenue Card */}
            <View style={styles.heroBanner}>
              <View style={styles.heroHeaderRow}>
                <View>
                  <Text style={styles.heroSubLabel}>GROSS SAAS REVENUE</Text>
                  <Text style={styles.heroTotalValue}>
                    {formatCurrency(revenueSummary.summary.totalRevenue || 0)}
                  </Text>
                </View>
                <View style={styles.heroIconBox}>
                  <Feather name="trending-up" size={m(22)} color={colors.white} />
                </View>
              </View>

              {/* 3-Metric Strip inside Hero Banner */}
              <View style={styles.heroMetricsStrip}>
                <View style={styles.heroMetricCol}>
                  <Text style={styles.heroMetricLabel}>Purchases</Text>
                  <Text style={styles.heroMetricVal}>
                    {revenueSummary.summary.totalPurchases || 0}
                  </Text>
                </View>
                <View style={styles.heroMetricDivider} />
                <View style={styles.heroMetricCol}>
                  <Text style={styles.heroMetricLabel}>Avg / Deal</Text>
                  <Text style={styles.heroMetricVal}>
                    {formatCurrency(revenueSummary.summary.averageRevenuePerPurchase || 0)}
                  </Text>
                </View>
                <View style={styles.heroMetricDivider} />
                <View style={styles.heroMetricCol}>
                  <Text style={styles.heroMetricLabel}>Active Tiers</Text>
                  <Text style={styles.heroMetricVal}>
                    {revenueSummary.summary.activePlansCount || 0}
                  </Text>
                </View>
              </View>
            </View>

            {/* 4 Interactive KPI Summary Cards (2x2 Grid) */}
            <View style={styles.kpiGrid}>
              {summaryCards.map(card => (
                <TouchableOpacity
                  key={card.id}
                  style={styles.kpiCard}
                  activeOpacity={0.75}
                  onPress={() => handleSummaryClick(card)}
                >
                  <View style={styles.kpiTopRow}>
                    <View style={[styles.kpiIconBox, { backgroundColor: card.iconBg }]}>
                      <Feather name={card.icon} size={m(15)} color={card.iconColor} />
                    </View>
                    <Feather name="info" size={m(13)} color="#7E9D86" />
                  </View>
                  <Text style={styles.kpiValue} numberOfLines={1}>
                    {card.value}
                  </Text>
                  <Text style={styles.kpiLabel} numberOfLines={1}>
                    {card.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quick Grouping Filter Tabs */}
            <View style={styles.filterTabsRow}>
              {GROUP_BY_OPTIONS.map(tab => {
                const isSelected = filters.groupBy === tab.value;
                return (
                  <TouchableOpacity
                    key={tab.value}
                    style={[
                      styles.filterTab,
                      isSelected && styles.filterTabActive,
                    ]}
                    onPress={() => handleTabSwitch(tab.value)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.filterTabText,
                        isSelected && styles.filterTabTextActive,
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Loading State */}
            {loading && !revenueData && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Fetching revenue analytics...</Text>
              </View>
            )}

            {/* Error State */}
            {error && !revenueData && (
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={m(36)} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => loadRevenue()}
                  activeOpacity={0.8}
                >
                  <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Content Sections */}
            {revenueData && (
              <>
                {/* 1. Revenue by Plan */}
                {(filters.groupBy === 'all' || filters.groupBy === 'plan') &&
                  revenueSummary.revenueByPlan.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Revenue by Plan Tier</Text>
                      {revenueSummary.revenueByPlan.map((item, index) => {
                        const percentage =
                          revenueSummary.summary.totalRevenue > 0
                            ? (item.totalRevenue /
                                revenueSummary.summary.totalRevenue) *
                              100
                            : 0;
                        return (
                          <View key={`plan-${index}`} style={styles.planCard}>
                            <View style={styles.cardHeaderRow}>
                              <View style={styles.planHeaderLeft}>
                                <View style={styles.planIconBox}>
                                  <Feather name="layers" size={m(16)} color={colors.white} />
                                </View>
                                <View style={styles.planInfo}>
                                  <Text style={styles.planName} numberOfLines={1}>
                                    {item.planName}
                                  </Text>
                                  <Text style={styles.planPrice}>
                                    {formatCurrency(item.priceMonthly)} / {item.duration}
                                  </Text>
                                </View>
                              </View>
                              <Text style={styles.planRevenue}>
                                {formatCurrency(item.totalRevenue)}
                              </Text>
                            </View>

                            {/* Progress Bar */}
                            <View style={styles.barContainer}>
                              <View
                                style={[
                                  styles.bar,
                                  { width: `${Math.min(percentage, 100)}%` },
                                ]}
                              />
                            </View>

                            {/* Plan Stats Strip */}
                            <View style={styles.planStatsStrip}>
                              <View style={styles.planStatItem}>
                                <Text style={styles.planStatLabel}>Purchases</Text>
                                <Text style={styles.planStatValue}>
                                  {item.totalPurchases}
                                </Text>
                              </View>
                              <View style={styles.planStatItem}>
                                <Text style={styles.planStatLabel}>Active</Text>
                                <Text style={[styles.planStatValue, styles.activeText]}>
                                  {item.activePurchases}
                                </Text>
                              </View>
                              <View style={styles.planStatItem}>
                                <Text style={styles.planStatLabel}>Expired</Text>
                                <Text style={[styles.planStatValue, styles.expiredText]}>
                                  {item.expiredPurchases}
                                </Text>
                              </View>
                              <View style={styles.planStatItem}>
                                <Text style={styles.planStatLabel}>Avg Value</Text>
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

                {/* 2. Revenue by Month */}
                {(filters.groupBy === 'all' || filters.groupBy === 'month') &&
                  revenueSummary.revenueByMonth.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Monthly Distribution</Text>
                      {revenueSummary.revenueByMonth.map((item, index) => {
                        const percentage =
                          revenueSummary.maxRevenue > 0
                            ? (item.totalRevenue / revenueSummary.maxRevenue) * 100
                            : 0;
                        return (
                          <View key={`month-${index}`} style={styles.planCard}>
                            <View style={styles.cardHeaderRow}>
                              <View style={styles.monthHeaderLeft}>
                                <View style={styles.monthIconBox}>
                                  <Feather name="calendar" size={m(15)} color={colors.white} />
                                </View>
                                <Text style={styles.monthName}>
                                  {item.monthName} {item.year}
                                </Text>
                              </View>
                              <Text style={styles.planRevenue}>
                                {formatCurrency(item.totalRevenue)}
                              </Text>
                            </View>

                            <View style={styles.barContainer}>
                              <View
                                style={[
                                  styles.bar,
                                  { width: `${Math.min(percentage, 100)}%` },
                                ]}
                              />
                            </View>

                            <View style={styles.monthBottomRow}>
                              <View style={styles.purchaseCountRow}>
                                <Feather name="shopping-bag" size={m(13)} color="#0068FF" />
                                <Text style={styles.monthPurchases}>
                                  {item.totalPurchases} completed subscriptions
                                </Text>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}

                {/* 3. Revenue by Year */}
                {(filters.groupBy === 'all' || filters.groupBy === 'year') &&
                  revenueSummary.revenueByYear.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Annual Overview</Text>
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
                            <View style={styles.cardHeaderRow}>
                              <View style={styles.monthHeaderLeft}>
                                <View style={styles.monthIconBox}>
                                  <Feather name="bar-chart-2" size={m(15)} color={colors.white} />
                                </View>
                                <Text style={styles.yearName}>Year {item.year}</Text>
                              </View>
                              <Text style={styles.planRevenue}>
                                {formatCurrency(item.totalRevenue)}
                              </Text>
                            </View>

                            <View style={styles.barContainer}>
                              <View
                                style={[
                                  styles.bar,
                                  { width: `${Math.min(percentage, 100)}%` },
                                ]}
                              />
                            </View>

                            <View style={styles.monthBottomRow}>
                              <View style={styles.purchaseCountRow}>
                                <Feather name="shopping-bag" size={m(13)} color="#0068FF" />
                                <Text style={styles.yearPurchases}>
                                  {item.totalPurchases} subscriptions
                                </Text>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}

                {/* 4. Recent Purchases */}
                {filters.groupBy === 'all' &&
                  revenueSummary.purchaseDetails.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>
                        Recent Subscriptions ({revenueSummary.purchaseDetails.length})
                      </Text>
                      {revenueSummary.purchaseDetails.slice(0, 10).map((item, index) => (
                        <View key={`purchase-${index}`} style={styles.purchaseCard}>
                          <View style={styles.cardHeaderRow}>
                            <View style={styles.purchaseHeaderLeft}>
                              <View
                                style={[
                                  styles.purchaseStatusDot,
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
                            <Text style={styles.purchasePrice}>
                              {formatCurrency(item.price)}
                            </Text>
                          </View>

                          <View style={styles.purchaseMetaRow}>
                            <View style={styles.purchaseMetaItem}>
                              <Feather name="clock" size={m(12)} color="#5A7A71" />
                              <Text style={styles.purchaseMetaText}>
                                Valid until: {formatDate(item.expiryDate)}
                              </Text>
                            </View>

                            {item.isActive && item.remainingDays !== undefined && (
                              <View style={styles.daysRemainingBadge}>
                                <Text style={styles.daysRemainingText}>
                                  {item.remainingDays}d active
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                {/* Empty State for By Plan */}
                {filters.groupBy === 'plan' &&
                  revenueSummary.revenueByPlan.length === 0 && (
                    <View style={styles.emptyCard}>
                      <Feather name="layers" size={m(28)} color="#8EABA3" />
                      <Text style={styles.emptyCardText}>
                        No plan revenue recorded yet
                      </Text>
                    </View>
                  )}

                {/* Empty State for By Month */}
                {filters.groupBy === 'month' &&
                  revenueSummary.revenueByMonth.length === 0 && (
                    <View style={styles.emptyCard}>
                      <Feather name="calendar" size={m(28)} color="#8EABA3" />
                      <Text style={styles.emptyCardText}>
                        No monthly revenue recorded yet
                      </Text>
                    </View>
                  )}

                {/* Empty State for By Year */}
                {filters.groupBy === 'year' &&
                  revenueSummary.revenueByYear.length === 0 && (
                    <View style={styles.emptyCard}>
                      <Feather name="bar-chart-2" size={m(28)} color="#8EABA3" />
                      <Text style={styles.emptyCardText}>
                        No annual revenue recorded yet
                      </Text>
                    </View>
                  )}

                {/* Empty State for All Data */}
                {filters.groupBy === 'all' &&
                  revenueSummary.revenueByPlan.length === 0 &&
                  revenueSummary.revenueByMonth.length === 0 &&
                  revenueSummary.revenueByYear.length === 0 &&
                  revenueSummary.purchaseDetails.length === 0 && (
                    <View style={styles.emptyCard}>
                      <Feather name="inbox" size={m(32)} color="#8EABA3" />
                      <Text style={styles.emptyCardText}>
                        No revenue transactions recorded yet
                      </Text>
                    </View>
                  )}
              </>
            )}
          </ScrollView>
        </View>
      </View>

      {renderFilterModal()}
      {renderDetailModal()}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  pageWrapper: {
    flex: 1,
    backgroundColor: colors.primary,
  },

  // Fixed Top Mint Green Header
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: m(18),
    paddingTop: m(12),
    paddingBottom: m(16),
  },
  backBtn: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    backgroundColor: 'rgba(9, 48, 48, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: m(19),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    textAlign: 'center',
  },
  filterHeaderBtn: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterHeaderBtnActive: {
    backgroundColor: colors.lettersAndIcons,
  },
  filterBadgeDot: {
    position: 'absolute',
    top: m(6),
    right: m(6),
    width: m(7),
    height: m(7),
    borderRadius: m(3.5),
    backgroundColor: '#00D09E',
  },

  // Curved Sheet
  sheetSection: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(36),
    borderTopRightRadius: m(36),
    paddingTop: m(18),
  },
  scrollContent: {
    paddingHorizontal: m(18),
    paddingBottom: m(80),
  },

  // Ocean Blue Hero Banner
  heroBanner: {
    backgroundColor: colors.oceanBlueButton,
    borderRadius: m(22),
    padding: m(18),
    marginBottom: m(14),
    shadowColor: colors.oceanBlueButton,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroSubLabel: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryBold,
    color: 'rgba(255, 255, 255, 0.82)',
    letterSpacing: 0.5,
  },
  heroTotalValue: {
    fontSize: m(28),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
    marginTop: m(2),
  },
  heroIconBox: {
    width: m(42),
    height: m(42),
    borderRadius: m(14),
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroMetricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: m(14),
    paddingVertical: m(10),
    paddingHorizontal: m(12),
    marginTop: m(14),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  heroMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  heroMetricLabel: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryMedium,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  heroMetricVal: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
    marginTop: m(2),
  },
  heroMetricDivider: {
    width: 1,
    height: m(22),
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },

  // 2x2 Interactive KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: m(10),
    marginBottom: m(16),
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: colors.white,
    borderRadius: m(18),
    padding: m(14),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  kpiTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(10),
  },
  kpiIconBox: {
    width: m(34),
    height: m(34),
    borderRadius: m(17),
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: m(17),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(2),
  },
  kpiLabel: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryMedium,
    color: '#5A7A71',
  },

  // Filter Tabs
  filterTabsRow: {
    flexDirection: 'row',
    gap: m(8),
    marginBottom: m(16),
  },
  filterTab: {
    flex: 1,
    backgroundColor: colors.lightGreen,
    paddingVertical: m(8),
    borderRadius: m(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabActive: {
    backgroundColor: colors.lettersAndIcons,
  },
  filterTabText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  filterTabTextActive: {
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },

  // Loading & Error States
  loadingContainer: {
    paddingVertical: m(40),
    alignItems: 'center',
    gap: m(8),
  },
  loadingText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryMedium,
    color: '#5A7A71',
  },
  errorContainer: {
    paddingVertical: m(30),
    alignItems: 'center',
    gap: m(8),
  },
  errorText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryMedium,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: m(18),
    paddingVertical: m(8),
    borderRadius: m(16),
    marginTop: m(8),
  },
  retryBtnText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: m(18),
    paddingVertical: m(32),
    paddingHorizontal: m(20),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    marginBottom: m(16),
    gap: m(8),
  },
  emptyCardText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryMedium,
    color: '#5A7A71',
    textAlign: 'center',
  },

  // Sections
  section: {
    marginBottom: m(16),
  },
  sectionTitle: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(10),
    marginLeft: m(2),
  },

  // Plan Cards
  planCard: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(15),
    marginBottom: m(10),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(10),
  },
  planHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: m(10),
    marginRight: m(8),
  },
  planIconBox: {
    width: m(34),
    height: m(34),
    borderRadius: m(10),
    backgroundColor: '#0068FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: m(14.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  planPrice: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: '#5A7A71',
    marginTop: m(1),
  },
  planRevenue: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: '#00A87A',
  },
  barContainer: {
    height: m(6),
    backgroundColor: '#E8F5E9',
    borderRadius: m(3),
    marginBottom: m(10),
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: m(3),
  },
  planStatsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FCF9',
    borderRadius: m(10),
    paddingVertical: m(6),
    paddingHorizontal: m(8),
  },
  planStatItem: {
    alignItems: 'center',
  },
  planStatLabel: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryRegular,
    color: '#5A7A71',
  },
  planStatValue: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginTop: m(1),
  },
  activeText: {
    color: '#00A87A',
  },
  expiredText: {
    color: '#EF4444',
  },

  // Monthly / Yearly
  monthHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(10),
  },
  monthIconBox: {
    width: m(32),
    height: m(32),
    borderRadius: m(10),
    backgroundColor: '#52A6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthName: {
    fontSize: m(14.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  yearName: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  monthBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  purchaseCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  monthPurchases: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryMedium,
    color: '#5A7A71',
  },
  yearPurchases: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryMedium,
    color: '#5A7A71',
  },

  // Purchase Cards
  purchaseCard: {
    backgroundColor: colors.white,
    borderRadius: m(14),
    padding: m(13),
    marginBottom: m(8),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
  },
  purchaseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(10),
    flex: 1,
  },
  purchaseStatusDot: {
    width: m(10),
    height: m(10),
    borderRadius: m(5),
  },
  purchaseStatusActive: {
    backgroundColor: '#00D09E',
  },
  purchaseStatusExpired: {
    backgroundColor: '#CBD5E1',
  },
  purchaseInfo: {
    flex: 1,
  },
  purchasePlanName: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  purchaseDate: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: '#5A7A71',
    marginTop: m(1),
  },
  purchasePrice: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: '#00A87A',
  },
  purchaseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: m(8),
    paddingTop: m(6),
    borderTopWidth: 1,
    borderTopColor: '#F1F7F3',
  },
  purchaseMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  purchaseMetaText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: '#5A7A71',
  },
  daysRemainingBadge: {
    backgroundColor: '#DFF7E2',
    paddingHorizontal: m(8),
    paddingVertical: m(2),
    borderRadius: m(8),
  },
  daysRemainingText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryBold,
    color: '#009B72',
  },

  // Modals
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: m(20),
  },
  detailModalContent: {
    backgroundColor: colors.white,
    borderRadius: m(20),
    width: '100%',
    maxWidth: m(320),
    padding: m(22),
    elevation: 8,
  },
  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(16),
  },
  detailIconContainer: {
    width: m(54),
    height: m(54),
    borderRadius: m(27),
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCloseButton: {
    width: m(32),
    height: m(32),
    borderRadius: m(16),
    backgroundColor: '#F1FFF3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailModalBody: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryMedium,
    color: '#5A7A71',
    marginBottom: m(6),
  },
  detailValue: {
    fontSize: m(26),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(8),
  },
  detailDescription: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: '#5A7A71',
    textAlign: 'center',
    lineHeight: m(17),
  },

  // Filter Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: m(28),
    borderTopRightRadius: m(28),
    paddingHorizontal: m(20),
    paddingTop: m(20),
    paddingBottom: m(24),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(18),
    paddingBottom: m(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F7F3',
  },
  modalTitle: {
    fontSize: m(18),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  modalBody: {
    width: '100%',
  },
  modalBodyContent: {
    paddingBottom: m(10),
  },
  filterSection: {
    marginBottom: m(18),
  },
  filterSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    marginBottom: m(12),
  },
  filterLabel: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  filterOptionsContainer: {
    gap: m(8),
  },
  filterOption: {
    padding: m(14),
    backgroundColor: '#F8FCF9',
    borderRadius: m(14),
    borderWidth: 1.5,
    borderColor: '#E8F5E9',
  },
  filterOptionActive: {
    backgroundColor: '#F1FFF3',
    borderColor: colors.primary,
  },
  filterOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(10),
  },
  radioButton: {
    width: m(18),
    height: m(18),
    borderRadius: m(9),
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonActive: {
    borderColor: colors.primary,
  },
  radioButtonInner: {
    width: m(10),
    height: m(10),
    borderRadius: m(5),
    backgroundColor: colors.primary,
  },
  filterOptionText: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  filterOptionTextActive: {
    fontFamily: FontFamily.primaryBold,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingTop: m(16),
    borderTopWidth: 1,
    borderTopColor: '#F1F7F3',
    gap: m(10),
  },
  clearButton: {
    flex: 1,
    height: m(48),
    borderRadius: m(24),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(9, 48, 48, 0.15)',
  },
  clearButtonDisabled: {
    opacity: 0.5,
  },
  clearButtonText: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  clearButtonTextDisabled: {
    color: '#94A3B8',
  },
  applyButton: {
    flex: 2,
    height: m(48),
    borderRadius: m(24),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  applyButtonText: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
});