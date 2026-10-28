import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { colors, FontFamily } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper } from '../../../Components/common';
import borrowerFlowService from '../../../Services/borrowerFlowService';

export default function BorrowerLoansPortfolio() {
  const navigation = useNavigation();
  const [loans, setLoans] = useState([]);
  const [metrics, setMetrics] = useState({
    totalBorrowed: 0,
    totalRepaid: 0,
    totalOutstanding: 0,
    totalLoans: 0,
    activeLoansCount: 0,
    closedLoansCount: 0,
    nextEmi: null,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'active' | 'closed'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const fetchPortfolio = useCallback(async () => {
    try {
      setLoading(true);
      const res = await borrowerFlowService.getLoansPortfolio({
        status: activeTab,
        search: searchQuery,
      });
      if (res?.success) {
        setLoans(res.loans || []);
        if (res.metrics) {
          setMetrics(res.metrics);
        }
      }
    } catch (err) {
      console.error('Error fetching borrower loans portfolio:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, searchQuery]);

  useFocusEffect(
    useCallback(() => {
      fetchPortfolio();
    }, [fetchPortfolio])
  );

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const filterTabs = useMemo(() => [
    {
      key: 'all',
      label: 'All Loans',
      count: metrics.totalLoans || loans.length,
    },
    {
      key: 'active',
      label: 'Active',
      count: metrics.activeLoansCount || 0,
    },
    {
      key: 'closed',
      label: 'Repaid',
      count: metrics.closedLoansCount || 0,
    },
  ], [metrics, loans]);

  const activeFilterInfo = useMemo(() => {
    return filterTabs.find((t) => t.key === activeTab) || filterTabs[0];
  }, [filterTabs, activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPortfolio();
  };

  const formatINR = (val) => {
    if (!val && val !== 0) return '₹0';
    const num = Number(val) || 0;
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lakh`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const formatDate = (iso) => {
    if (!iso) return 'Recently';
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (loan) => {
    if (
      loan.status === 'pending_disbursal' ||
      (loan.disbursalVerification && !loan.disbursalVerification.isVerified)
    ) {
      return {
        label: 'OTP PENDING',
        bg: '#fef3c7',
        text: '#d97706',
        icon: 'lock',
      };
    }
    const isOverdue = loan.installments?.some((i) => i.status === 'overdue');
    if (isOverdue) {
      return {
        label: 'EMI OVERDUE',
        bg: '#fee2e2',
        text: '#dc2626',
        icon: 'alert-circle',
      };
    }
    if (loan.status === 'closed' || loan.remainingAmount <= 0) {
      return {
        label: 'SETTLED',
        bg: '#f1f5f9',
        text: '#64748b',
        icon: 'check-circle',
      };
    }
    return {
      label: 'ACTIVE',
      bg: '#ecfdf5',
      text: '#059669',
      icon: 'check-circle',
    };
  };

  const nextEmiAmount =
    typeof metrics.nextEmi === 'object'
      ? metrics.nextEmi?.amount || 0
      : Number(metrics.nextEmi) || 0;

  const renderLoanCard = ({ item }) => {
    const statusMeta = getStatusBadge(item);
    const lenderName =
      item.lenderSnapshot?.companyName ||
      item.lenderSnapshot?.userName ||
      item.lenderId?.companyName ||
      item.lenderId?.userName ||
      'Institutional Lender';

    const principal = Number(item.amount || item.principal || 0);
    const repaid = Number(item.totalPaid || 0);
    const totalExpected = Number(item.totalRepaymentExpected || principal);
    const progressPercent =
      totalExpected > 0 ? Math.min(100, Math.round((repaid / totalExpected) * 100)) : 0;
    const isClosed = item.status === 'closed' || item.remainingAmount <= 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.75}
        onPress={() => navigation.navigate('BorrowerLoanDetails', { id: item._id, loan: item })}
      >
        {/* Top Header Row */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.activityIconCircle}>
            <Feather name="credit-card" size={m(16)} color={colors.white} />
          </View>

          <View style={styles.headerInfoCol}>
            <Text style={styles.lenderNameText} numberOfLines={1}>
              {lenderName}
            </Text>
            <Text style={styles.purposeSubText} numberOfLines={1}>
              {item.purpose || item.dealName || 'Commercial Facility'} • {formatDate(item.loanStartDate || item.createdAt)}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}>
            <Feather name={statusMeta.icon} size={m(10)} color={statusMeta.text} />
            <Text style={[styles.statusBadgeText, { color: statusMeta.text }]}>
              {statusMeta.label}
            </Text>
          </View>
        </View>

        {/* Compact Metrics Strip - Neutral Slate-50 (#F8FAFC) */}
        <View style={styles.metricsBox}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Principal</Text>
            <Text style={styles.metricValueBold}>{formatINR(principal)}</Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Monthly EMI</Text>
            <Text style={styles.metricValue}>{formatINR(item.monthlyEmi || 0)}</Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Interest Rate</Text>
            <Text style={styles.metricValue}>{item.interestRate || 10.5}% p.a.</Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Tenure</Text>
            <Text style={styles.metricValue}>{item.tenureMonths || 24} Mo</Text>
          </View>
        </View>

        {/* Repayment Progress Track */}
        <View style={styles.progressWrap}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabelText}>
              Cleared {formatINR(repaid)} of {formatINR(totalExpected)}
            </Text>
            <Text style={styles.progressPercentText}>{progressPercent}%</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper
      backgroundColor={colors.backgroundGreenWhite}
      topInsetBg={colors.primary}
      statusBarColor={colors.primary}
      statusBarStyle="dark-content"
      includeTabBarClearance={true}
      scrollable={false}
    >
      {/* Top Green Banner */}
      <View style={styles.topBanner}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>My Loans & EMI Schedule</Text>
          </View>
        </View>
      </View>

      {/* Main Curved Body Section */}
      <View style={styles.sheetSection}>
        {/* Header Subtitle moved down below header */}
        <View style={styles.sheetSubtitleWrap}>
          <Text style={styles.sheetSubtitleText}>
            Outstanding balances, amortization schedule & repayments
          </Text>
        </View>

        {/* Restyled 3-Column Summary Stats Box */}
        <View style={styles.summaryMetricsCard}>
          {/* 1. Total Sanctioned */}
          <View style={styles.metricColumn}>
            <View style={styles.metricLabelRow}>
              <View style={[styles.metricDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.summaryMetricLabel} numberOfLines={1}>
                Total Sanctioned
              </Text>
            </View>
            <Text style={styles.summaryMetricVal} numberOfLines={1}>
              {formatINR(metrics.totalBorrowed)}
            </Text>
          </View>

          <View style={styles.summaryMetricDivider} />

          {/* 2. Total Repaid */}
          <View style={styles.metricColumn}>
            <View style={styles.metricLabelRow}>
              <View style={[styles.metricDot, { backgroundColor: '#059669' }]} />
              <Text style={styles.summaryMetricLabel} numberOfLines={1}>
                Total Repaid
              </Text>
            </View>
            <Text style={[styles.summaryMetricVal, { color: '#059669' }]} numberOfLines={1}>
              {formatINR(metrics.totalRepaid)}
            </Text>
          </View>

          <View style={styles.summaryMetricDivider} />

          {/* 3. Remaining Balance */}
          <View style={styles.metricColumn}>
            <View style={styles.metricLabelRow}>
              <View style={[styles.metricDot, { backgroundColor: '#0284c7' }]} />
              <Text style={styles.summaryMetricLabel} numberOfLines={1}>
                Remaining Balance
              </Text>
            </View>
            <Text style={[styles.summaryMetricVal, { color: '#0369a1' }]} numberOfLines={1}>
              {formatINR(metrics.totalOutstanding)}
            </Text>
          </View>
        </View>
        {/* Search Row: Search Input + Filter Icon Button */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Feather name="search" size={m(16)} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search facilities or lenders..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={m(16)} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            style={[
              styles.filterBtn,
              activeTab !== 'all' && styles.filterBtnActive,
            ]}
            activeOpacity={0.8}
            onPress={() => setFilterModalVisible(true)}
          >
            <Feather
              name="sliders"
              size={m(17)}
              color={activeTab !== 'all' ? colors.lettersAndIcons : colors.lettersAndIcons}
            />
            {activeTab !== 'all' && <View style={styles.filterActiveBadge} />}
          </TouchableOpacity>
        </View>

        {/* Active Filter Pill (shown when filter is applied, with quick reset) */}
        {activeTab !== 'all' && (
          <View style={styles.activeFilterRow}>
            <View style={styles.activeFilterPill}>
              <Text style={styles.activeFilterText}>
                Filter: <Text style={styles.activeFilterBold}>{activeFilterInfo.label} ({activeFilterInfo.count})</Text>
              </Text>
              <TouchableOpacity
                onPress={() => setActiveTab('all')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={m(13)} color={colors.lettersAndIcons} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Facilities List */}
        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.lettersAndIcons} />
            <Text style={styles.loadingText}>Loading facility portfolio...</Text>
          </View>
        ) : (
          <FlatList
            data={loans}
            keyExtractor={(item) => item._id}
            renderItem={renderLoanCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.lettersAndIcons]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="credit-card" size={m(36)} color={colors.primary} />
                <Text style={styles.emptyTitle}>No Loan Facilities Found</Text>
                <Text style={styles.emptySubtitle}>
                  {activeTab === 'active'
                    ? 'No active loan facilities in your portfolio.'
                    : activeTab === 'closed'
                    ? 'No settled credit facilities.'
                    : 'You currently have no loan facilities.'}
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('BorrowerApply')}
                >
                  <Text style={styles.emptyActionText}>Explore Financing</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>

      {/* Simple Compact Center Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent={true}
        statusBarTranslucent={true}
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.simpleFilterContainer}
            activeOpacity={1}
            onPress={(e) => e?.stopPropagation?.()}
          >
            <View style={styles.simpleFilterHeader}>
              <Text style={styles.simpleFilterTitle}>Filter Loans</Text>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                style={styles.simpleFilterCloseBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Feather name="x" size={m(16)} color={colors.lettersAndIcons} />
              </TouchableOpacity>
            </View>

            <View style={styles.simpleFilterDivider} />

            {/* 3 Simple Options (No background color, clean checkmark selection) */}
            <View style={styles.simpleOptionsList}>
              {filterTabs.map((tab, index) => {
                const isSelected = activeTab === tab.key;
                const isLast = index === filterTabs.length - 1;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={[
                      styles.simpleOptionItem,
                      !isLast && styles.simpleOptionItemBorder,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setActiveTab(tab.key);
                      setFilterModalVisible(false);
                    }}
                  >
                    <View style={styles.simpleOptionLeft}>
                      <Text
                        style={[
                          styles.simpleOptionText,
                          isSelected && styles.simpleOptionTextSelected,
                        ]}
                      >
                        {tab.label}
                      </Text>
                      <Text
                        style={[
                          styles.simpleOptionCount,
                          isSelected && styles.simpleOptionCountSelected,
                        ]}
                      >
                        ({tab.count})
                      </Text>
                    </View>

                    {isSelected ? (
                      <Feather name="check" size={m(18)} color="#2563eb" />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  // Top Green Banner
  topBanner: {
    backgroundColor: colors.primary,
    paddingHorizontal: m(20),
    paddingTop: m(12),
    paddingBottom: m(14),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTag: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: 0.8,
    opacity: 0.85,
    marginBottom: m(2),
  },
  headerTitle: {
    fontSize: m(22),
    lineHeight: m(28),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  refreshBtn: {
    width: m(42),
    height: m(42),
    borderRadius: m(21),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // Sheet Subtitle (Moved down from header)
  sheetSubtitleWrap: {
    paddingHorizontal: m(20),
    marginBottom: m(10),
  },
  sheetSubtitleText: {
    fontSize: m(12),
    lineHeight: m(17),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
  },

  // Restyled 3-Column Summary Stats Box
  summaryMetricsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: m(18),
    marginHorizontal: m(18),
    marginBottom: m(14),
    paddingVertical: m(12),
    paddingHorizontal: m(8),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
  },
  metricColumn: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: m(2),
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(3),
    marginBottom: m(3),
  },
  metricDot: {
    width: m(5.5),
    height: m(5.5),
    borderRadius: m(3),
  },
  summaryMetricLabel: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
  },
  summaryMetricVal: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: -0.2,
  },
  summaryMetricDivider: {
    width: 1,
    height: m(28),
    backgroundColor: 'rgba(9, 48, 48, 0.08)',
  },

  // Main Curved Sheet
  sheetSection: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(32),
    borderTopRightRadius: m(32),
    paddingTop: m(16),
  },

  // Search Input Container & Filter Row
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: m(18),
    marginBottom: m(12),
    gap: m(10),
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: m(16),
    paddingHorizontal: m(14),
    height: m(44),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
  },
  searchInput: {
    flex: 1,
    marginLeft: m(8),
    fontSize: m(13),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
  },
  filterBtn: {
    width: m(44),
    height: m(44),
    borderRadius: m(16),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    elevation: 1,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  filterBtnActive: {
    backgroundColor: colors.lightGreen,
    borderColor: colors.primary,
  },
  filterActiveBadge: {
    position: 'absolute',
    top: m(8),
    right: m(8),
    width: m(8),
    height: m(8),
    borderRadius: m(4),
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.white,
  },

  // Active Filter Pill
  activeFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: m(18),
    marginBottom: m(12),
  },
  activeFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: m(20),
    paddingVertical: m(5),
    paddingHorizontal: m(12),
    gap: m(6),
  },
  activeFilterDot: {
    width: m(6),
    height: m(6),
    borderRadius: m(3),
  },
  activeFilterText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
  },
  activeFilterBold: {
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  // Simple Compact Center Filter Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 48, 48, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: m(24),
  },
  simpleFilterContainer: {
    backgroundColor: colors.white,
    borderRadius: m(20),
    width: '100%',
    maxWidth: m(320),
    paddingHorizontal: m(18),
    paddingTop: m(16),
    paddingBottom: m(10),
    elevation: 25,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },
  simpleFilterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: m(12),
  },
  simpleFilterTitle: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  simpleFilterCloseBtn: {
    width: m(30),
    height: m(30),
    borderRadius: m(15),
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  simpleFilterDivider: {
    height: 1,
    backgroundColor: 'rgba(9, 48, 48, 0.08)',
  },
  simpleOptionsList: {
    paddingVertical: m(2),
  },
  simpleOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: m(13),
    paddingHorizontal: m(4),
  },
  simpleOptionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(9, 48, 48, 0.06)',
  },
  simpleOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  simpleOptionText: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  simpleOptionTextSelected: {
    fontFamily: FontFamily.primaryBold,
    color: '#2563eb',
  },
  simpleOptionCount: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
  },
  simpleOptionCountSelected: {
    fontFamily: FontFamily.primaryBold,
    color: '#2563eb',
  },

  listContent: {
    paddingHorizontal: m(18),
    paddingBottom: m(30),
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: m(60),
  },
  loadingText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(8),
  },

  // Card
  card: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(14),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.06)',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(10),
  },
  activityIconCircle: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    backgroundColor: colors.blueButton,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(10),
  },
  headerInfoCol: {
    flex: 1,
    marginRight: m(6),
  },
  lenderNameText: {
    fontSize: m(14),
    lineHeight: m(18),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  purposeSubText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.blueButton,
    marginTop: m(1),
  },

  // Status Badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(6),
  },
  statusBadgeText: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
  },

  // Compact Metrics Box - Clean Neutral Slate-50 (#F8FAFC)
  metricsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: m(10),
    paddingVertical: m(8),
    paddingHorizontal: m(8),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: m(10),
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
    marginBottom: m(1),
  },
  metricValueBold: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  metricValue: {
    fontSize: m(11),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.lettersAndIcons,
  },
  metricDivider: {
    width: 1,
    height: m(20),
    backgroundColor: '#e2e8f0',
  },

  // Progress Bar
  progressWrap: {
    marginBottom: m(2),
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(4),
  },
  progressLabelText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
  },
  progressPercentText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: '#059669',
  },
  progressBarTrack: {
    height: m(6),
    backgroundColor: '#e2e8f0',
    borderRadius: m(3),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: m(3),
  },

  // Actions
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
  },
  scheduleBtn: {
    flex: 1.3,
    backgroundColor: colors.white,
    paddingVertical: m(8),
    borderRadius: m(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(4),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.12)',
  },
  scheduleBtnText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.lettersAndIcons,
  },
  payBtn: {
    flex: 1,
    backgroundColor: colors.lettersAndIcons,
    paddingVertical: m(8),
    borderRadius: m(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(4),
  },
  payBtnText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  settledPill: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: m(8),
    borderRadius: m(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(4),
  },
  settledPillText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryMedium,
    color: '#64748b',
  },

  // Empty State
  emptyContainer: {
    paddingVertical: m(50),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginTop: m(10),
  },
  emptySubtitle: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: m(4),
    paddingHorizontal: m(20),
    lineHeight: m(16),
  },
  emptyActionBtn: {
    marginTop: m(14),
    backgroundColor: colors.primary,
    paddingHorizontal: m(16),
    paddingVertical: m(8),
    borderRadius: m(12),
  },
  emptyActionText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
});
