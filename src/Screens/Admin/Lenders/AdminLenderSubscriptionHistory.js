import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRoute, useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { colors, FontFamily } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper } from '../../../Components/common';
import {
  getLenderSubscriptionHistory,
  clearSubscriptionHistory,
} from '../../../Redux/Slices/adminLendersSlice';

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
const formatDate = dateStr => {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};

export default function AdminLenderSubscriptionHistory() {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { lenderId, lenderName = 'Institutional Lender' } = route.params || {};

  const { subscriptionHistory = [], historyLoading } = useSelector(
    (state) => state.adminLenders || {}
  );

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 'active' | 'expired'

  const fetchHistory = useCallback(() => {
    if (lenderId) {
      dispatch(getLenderSubscriptionHistory(lenderId));
    }
  }, [dispatch, lenderId]);

  useEffect(() => {
    fetchHistory();
    return () => {
      dispatch(clearSubscriptionHistory());
    };
  }, [fetchHistory, dispatch]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (lenderId) {
      dispatch(getLenderSubscriptionHistory(lenderId)).finally(() =>
        setRefreshing(false)
      );
    } else {
      setRefreshing(false);
    }
  }, [dispatch, lenderId]);

  // Filtered ledger items
  const filteredHistory = useMemo(() => {
    const list = subscriptionHistory || [];
    return list.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.planName || '').toLowerCase().includes(q) ||
        (item.tag || '').toLowerCase().includes(q) ||
        (item.razorpayPaymentId || '').toLowerCase().includes(q) ||
        (item.razorpayOrderId || '').toLowerCase().includes(q) ||
        String(item.price || item.amount || '').includes(q);

      if (!matchesSearch) return false;

      const isActive = item.status === 'active' || Boolean(item.isActive);
      if (selectedFilter === 'active') return isActive;
      if (selectedFilter === 'expired') return !isActive;
      return true;
    });
  }, [subscriptionHistory, searchQuery, selectedFilter]);

  // Statistics calculation
  const totalPurchases = (subscriptionHistory || []).length;
  const totalSpent = (subscriptionHistory || []).reduce(
    (sum, item) => sum + (Number(item.price || item.amount || item.priceMonthly) || 0),
    0
  );
  const hasActivePlan = (subscriptionHistory || []).some(
    (item) => item.status === 'active' || Boolean(item.isActive)
  );

  const initials = (lenderName || 'LN')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  // Render individual history item card
  const renderHistoryItem = ({ item }) => {
    const isActive = item.status === 'active' || Boolean(item.isActive);
    const planName = item.planName || item.plan?.name || item.name || 'SaaS Plan';
    const amount = item.price || item.amount || item.plan?.price || 0;
    const paymentId =
      item.razorpayPaymentId || item.paymentId || item.transactionId || 'TXN-DIRECT';
    const orderId = item.razorpayOrderId || item.orderId || null;
    const features = item.planFeatures || item.features || {};

    return (
      <View style={styles.historyCard}>
        {/* Header row: Plan title + Price + Status */}
        <View style={styles.cardHeader}>
          <View style={styles.planInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.planName}>{planName}</Text>
              {item.tag ? (
                <View style={styles.tierTag}>
                  <Text style={styles.tierTagText}>{item.tag}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.refId}>Ref: {paymentId}</Text>
            {orderId ? (
              <Text style={styles.orderIdText}>Order: {orderId}</Text>
            ) : null}
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatCurrency(amount)}</Text>
            <View
              style={[
                styles.statusBadge,
                isActive ? styles.activeBadge : styles.expiredBadge,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isActive ? '#00D09E' : '#FF4D4F' },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  isActive ? styles.activeText : styles.expiredText,
                ]}
              >
                {isActive ? 'Active' : 'Expired'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardDivider} />

        {/* Validity Dates 3-column row */}
        <View style={styles.dateRow}>
          <View style={styles.dateCol}>
            <Text style={styles.dateLabel}>Activated On</Text>
            <Text style={styles.dateValue}>
              {formatDate(item.startDate || item.planPurchaseDate || item.createdAt)}
            </Text>
          </View>
          <View style={styles.dateCol}>
            <Text style={styles.dateLabel}>Expires On</Text>
            <Text style={styles.dateValue}>
              {formatDate(item.endDate || item.planExpiryDate || item.expiresAt)}
            </Text>
          </View>
          <View style={styles.dateCol}>
            <Text style={styles.dateLabel}>Payment Method</Text>
            <Text style={styles.dateValue}>{item.paymentMethod || 'Razorpay'}</Text>
          </View>
        </View>

        {/* Quota Highlights */}
        {(features.dealCapacityQuota || features.maxActiveLoans) ? (
          <View style={styles.quotaStrip}>
            <Feather name="info" size={m(12)} color={colors.blueButton} />
            <Text style={styles.quotaText}>
              Capacity: {features.dealCapacityQuota || features.maxActiveLoans} Deals
              {features.aiReviewCredits ? ` • AI Credits: ${features.aiReviewCredits}` : ''}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <ScreenWrapper
      backgroundColor={colors.backgroundGreenWhite}
      topInsetBg={colors.primary}
      statusBarColor={colors.primary}
      statusBarStyle="dark-content"
      includeTabBarClearance={false}
      scrollable={false}
    >
      <View style={styles.pageGreenWrapper}>
        {/* Top Green Banner */}
        <View style={styles.topSection}>
          {/* Header Row with Back Button */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Feather name="chevron-left" size={m(22)} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Subscription Ledger</Text>
            <View style={styles.headerPlaceholder} />
          </View>

          {/* Lender Identification Strip */}
          <View style={styles.lenderStrip}>
            <View style={styles.lenderAvatar}>
              <Text style={styles.lenderAvatarText}>{initials || 'LN'}</Text>
            </View>
            <View style={styles.lenderStripInfo}>
              <Text style={styles.lenderNameText} numberOfLines={1}>
                {lenderName}
              </Text>
              <Text style={styles.lenderSubText} numberOfLines={1}>
                ID: {lenderId || 'N/A'}
              </Text>
            </View>
          </View>

          {/* High-Level KPI Summary Strip */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiValue}>{totalPurchases}</Text>
              <Text style={styles.kpiLabel}>Total Invoices</Text>
            </View>
            <View style={styles.kpiSep} />
            <View style={styles.kpiBox}>
              <Text style={[styles.kpiValue, { color: colors.blueButton }]}>
                {formatCurrency(totalSpent)}
              </Text>
              <Text style={styles.kpiLabel}>Total Paid</Text>
            </View>
            <View style={styles.kpiSep} />
            <View style={styles.kpiBox}>
              <Text
                style={[
                  styles.kpiValue,
                  { color: hasActivePlan ? '#00D09E' : '#FF4D4F' },
                ]}
              >
                {hasActivePlan ? 'Active' : 'Expired'}
              </Text>
              <Text style={styles.kpiLabel}>Current Status</Text>
            </View>
          </View>
        </View>

        {/* Curved Sheet Container */}
        <View style={styles.sheetSection}>
          {/* Search Pill Bar */}
          <View style={styles.searchBar}>
            <Feather
              name="search"
              size={m(17)}
              color={colors.lettersAndIcons}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by plan, ref ID, amount..."
              placeholderTextColor="#7E9D86"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={m(16)} color={colors.lettersAndIcons} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Filter Pill Tabs */}
          <View style={styles.pillRow}>
            {[
              { id: 'all', label: `All (${totalPurchases})` },
              { id: 'active', label: 'Active Plans' },
              { id: 'expired', label: 'Expired Records' },
            ].map((pill) => {
              const isSelected = selectedFilter === pill.id;
              return (
                <TouchableOpacity
                  key={pill.id}
                  style={[styles.pill, isSelected && styles.activePill]}
                  onPress={() => setSelectedFilter(pill.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.pillText,
                      isSelected && styles.activePillText,
                    ]}
                  >
                    {pill.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Ledger Invoices Feed */}
          {historyLoading && !refreshing && (subscriptionHistory || []).length === 0 ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Fetching subscription ledger...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredHistory}
              renderItem={renderHistoryItem}
              keyExtractor={(item, index) =>
                item._id || item.razorpayPaymentId || item.transactionId || String(index)
              }
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[colors.primary]}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Feather name="file-text" size={m(40)} color={colors.textSecondary} />
                  <Text style={styles.emptyTitle}>No Invoices Found</Text>
                  <Text style={styles.emptySubtitle}>
                    {searchQuery
                      ? 'No invoices matched your search filter.'
                      : 'No subscription purchases have been recorded for this lender yet.'}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  pageGreenWrapper: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  topSection: {
    backgroundColor: colors.primary,
    paddingHorizontal: m(18),
    paddingTop: m(14),
    paddingBottom: m(18),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(14),
  },
  backBtn: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: m(19),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: m(38),
  },

  // Lender Identification Strip
  lenderStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: m(16),
    paddingHorizontal: m(12),
    paddingVertical: m(8),
    marginBottom: m(12),
  },
  lenderAvatar: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    backgroundColor: '#E6F2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(10),
    borderWidth: 1.5,
    borderColor: 'rgba(50, 153, 255, 0.3)',
  },
  lenderAvatarText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.blueButton,
  },
  lenderStripInfo: {
    flex: 1,
  },
  lenderNameText: {
    fontSize: m(14.5),
    lineHeight: m(18),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  lenderSubText: {
    fontSize: m(11),
    lineHeight: m(14),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
    opacity: 0.75,
    marginTop: m(1),
  },

  // High-Level KPI Summary Strip
  kpiRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: m(16),
    paddingVertical: m(10),
    paddingHorizontal: m(12),
    alignItems: 'center',
    justifyContent: 'space-around',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  kpiBox: {
    alignItems: 'center',
    flex: 1,
  },
  kpiValue: {
    fontSize: m(15),
    lineHeight: m(19),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  kpiLabel: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(2),
  },
  kpiSep: {
    width: 1,
    height: m(22),
    backgroundColor: 'rgba(9, 48, 48, 0.1)',
  },

  // Curved Sheet Container
  sheetSection: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(36),
    borderTopRightRadius: m(36),
    paddingTop: m(18),
    paddingHorizontal: m(18),
  },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: m(22),
    paddingHorizontal: m(14),
    height: m(44),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    marginBottom: m(10),
  },
  searchIcon: {
    marginRight: m(8),
  },
  searchInput: {
    flex: 1,
    fontSize: m(13),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
    paddingVertical: 0,
  },

  // Filter Pills
  pillRow: {
    flexDirection: 'row',
    gap: m(8),
    marginBottom: m(14),
  },
  pill: {
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(16),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
  },
  activePill: {
    backgroundColor: colors.lettersAndIcons,
    borderColor: colors.lettersAndIcons,
  },
  pillText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  activePillText: {
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },

  // List Feed
  listContent: {
    paddingBottom: m(40),
  },

  // History Card
  historyCard: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(14),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planInfo: {
    flex: 1,
    paddingRight: m(10),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  planName: {
    fontSize: m(15.5),
    lineHeight: m(20),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  tierTag: {
    backgroundColor: '#E6F2FF',
    paddingHorizontal: m(6),
    paddingVertical: m(2),
    borderRadius: m(6),
  },
  tierTagText: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: colors.blueButton,
  },
  refId: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(3),
  },
  orderIdText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(2),
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: m(16),
    lineHeight: m(20),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: m(5),
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(8),
    gap: m(4),
  },
  activeBadge: {
    backgroundColor: colors.lightGreen,
  },
  expiredBadge: {
    backgroundColor: '#FFEBEB',
  },
  statusDot: {
    width: m(6),
    height: m(6),
    borderRadius: m(3),
  },
  statusText: {
    fontSize: m(11),
    fontFamily: FontFamily.primarySemiBold,
  },
  activeText: {
    color: colors.lettersAndIcons,
  },
  expiredText: {
    color: '#E02424',
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(9, 48, 48, 0.08)',
    marginVertical: m(10),
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginBottom: m(2),
  },
  dateValue: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.lettersAndIcons,
  },
  quotaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F2FF',
    borderRadius: m(8),
    paddingHorizontal: m(8),
    paddingVertical: m(6),
    marginTop: m(10),
    gap: m(6),
  },
  quotaText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },

  // Loading & Empty States
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: m(60),
  },
  loadingText: {
    marginTop: m(8),
    fontSize: m(13),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: m(60),
    paddingHorizontal: m(20),
  },
  emptyTitle: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginTop: m(10),
  },
  emptySubtitle: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: m(4),
  },
});
