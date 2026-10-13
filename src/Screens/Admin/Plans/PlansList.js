import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Feather from 'react-native-vector-icons/Feather';
import { colors, FontFamily } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper } from '../../../Components/common';
import { getAdminPlans } from '../../../Redux/Slices/adminPlanSlice';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM_WIDTH = Math.floor((SCREEN_WIDTH - m(36) - m(14)) / 2);

/**
 * Format currency value
 */
const formatCurrency = value => {
  if (!value) return '₹0';
  const num = Number(value) || 0;
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

/**
 * Map plan tier name to matching Figma/fintech icon
 */
const getPlanIcon = (name = '', tag = '') => {
  const combined = `${name} ${tag}`.toLowerCase();
  if (combined.includes('basic') || combined.includes('starter')) return 'package';
  if (combined.includes('plus') || combined.includes('standard')) return 'zap';
  if (combined.includes('pro') || combined.includes('professional')) return 'star';
  if (combined.includes('premium') || combined.includes('gold') || combined.includes('elite')) return 'award';
  if (combined.includes('enterprise') || combined.includes('corporate')) return 'shield';
  if (combined.includes('annual') || combined.includes('year')) return 'calendar';
  return 'layers';
};

export default function PlansList() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { plans = [], loading } = useSelector(state => state.adminPlans || {});

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'

  // Fetch plans
  const loadPlans = useCallback(() => {
    dispatch(getAdminPlans());
  }, [dispatch]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  useFocusEffect(
    useCallback(() => {
      loadPlans();
    }, [loadPlans])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(getAdminPlans()).finally(() => setRefreshing(false));
  }, [dispatch]);

  // Local filter
  const filteredPlans = useMemo(() => {
    return (plans || []).filter(plan => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (plan.planName || '').toLowerCase().includes(q) ||
        (plan.tag || '').toLowerCase().includes(q) ||
        (plan.duration || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const isActive = plan.isActive ?? true;
      if (statusFilter === 'active') return isActive;
      if (statusFilter === 'inactive') return !isActive;
      return true;
    });
  }, [plans, searchQuery, statusFilter]);

  const totalPlansCount = (plans || []).length;
  const activePlansCount = (plans || []).filter(p => p.isActive ?? true).length;
  const inactivePlansCount = totalPlansCount - activePlansCount;
  const activePercent = totalPlansCount > 0 ? Math.round((activePlansCount / totalPlansCount) * 100) : 0;

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
        {/* ======================================================== */}
        {/* Top Mint Green Section with Summary & Progress Widget   */}
        {/* ======================================================== */}
        <View style={styles.topSection}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <Text style={styles.headerTitle}>Subscription Plans</Text>

            <TouchableOpacity
              style={styles.addPlanHeaderBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('CreateEditPlan', { mode: 'create' })}
            >
              <Feather name="plus" size={m(18)} color={colors.white} />
            </TouchableOpacity>
          </View>

          {/* Metric Overview Row (Figma 9.4.9 Pattern) */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <View style={styles.summaryLabelRow}>
                <Feather name="layers" size={m(12)} color={colors.lettersAndIcons} />
                <Text style={styles.summaryLabel}>Total Tiers</Text>
              </View>
              <Text style={styles.summaryValue}>{totalPlansCount} Plans</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryCol}>
              <View style={styles.summaryLabelRow}>
                <Feather name="check-circle" size={m(12)} color={colors.white} />
                <Text style={styles.summaryLabel}>Active Pricing</Text>
              </View>
              <Text style={[styles.summaryValue, { color: colors.white }]}>
                {activePlansCount} Active
              </Text>
            </View>
          </View>

          {/* Signature Progress Bar (Figma Categories Widget) */}
          <View style={styles.progressSection}>
            <View style={styles.progressBarWrapper}>
              <View style={styles.percentPill}>
                <Text style={styles.percentPillText}>{activePercent}%</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.trackFill, { width: `${activePercent}%` }]} />
              </View>
            </View>
            <View style={styles.progressNoteRow}>
              <Feather name="check-square" size={m(13)} color={colors.lettersAndIcons} />
              <Text style={styles.progressNoteText}>
                {activePlansCount} of {totalPlansCount} Tiers Active & Available for Lenders
              </Text>
            </View>
          </View>
        </View>

        {/* ======================================================== */}
        {/* Curved Sheet Container with Categories Squircle Grid     */}
        {/* ======================================================== */}
        <View style={styles.sheetSection}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
              />
            }
          >
            {/* Search Pill Bar */}
            <View style={styles.searchBar}>
              <Feather
                name="search"
                size={m(18)}
                color={colors.lettersAndIcons}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search plans by name, tier, duration..."
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

            {/* Filter Pills with Counts */}
            <View style={styles.filterTabsRow}>
              {[
                { id: 'all', label: `All (${totalPlansCount})` },
                { id: 'active', label: `Active (${activePlansCount})` },
                { id: 'inactive', label: `Archived (${inactivePlansCount})` },
              ].map(tab => {
                const isSelected = statusFilter === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[
                      styles.filterTab,
                      isSelected && styles.filterTabActive,
                    ]}
                    onPress={() => setStatusFilter(tab.id)}
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
            {loading && !refreshing && (plans || []).length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading SaaS subscription tiers...</Text>
              </View>
            ) : (
              <>
                {/* ======================================================== */}
                {/* 3-Column Categories Squircle Grid (Figma 9.4.9 Style)   */}
                {/* ======================================================== */}
                <View style={styles.squircleGrid}>
                  {filteredPlans.map((plan, index) => {
                    const planId = plan._id || plan.id;
                    const isActive = plan.isActive ?? true;
                    const iconName = getPlanIcon(plan.planName, plan.tag);
                    const packPrice = Number(plan.price || plan.priceMonthly || 0);

                    // Uniform Ocean Blue for all active cards
                    const squircleBg = !isActive
                      ? '#94A3B8'
                      : colors.oceanBlueButton;

                    return (
                      <TouchableOpacity
                        key={planId || `plan-${index}`}
                        style={styles.gridItemContainer}
                        activeOpacity={0.75}
                        onPress={() => navigation.navigate('PlanDetailsScreen', { plan })}
                      >
                        {/* Squircle Tile Box */}
                        <View
                          style={[
                            styles.squircleTile,
                            { backgroundColor: squircleBg },
                          ]}
                        >
                          <Feather name={iconName} size={m(40)} color={colors.white} />

                          {/* Top-Right Price Pill Badge */}
                          <View style={styles.tilePriceBadge}>
                            <Text style={styles.tilePriceText}>
                              {formatCurrency(packPrice)}
                            </Text>
                          </View>
                        </View>

                        {/* Label Underneath Squircle */}
                        <Text style={styles.gridItemTitle} numberOfLines={1}>
                          {plan.planName}
                        </Text>
                        <Text style={styles.gridItemSubtitle} numberOfLines={1}>
                          {plan.duration || 'Monthly'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Empty State */}
                {filteredPlans.length === 0 && (
                  <View style={styles.emptyContainer}>
                    <Feather name="layers" size={m(42)} color={colors.textSecondary} />
                    <Text style={styles.emptyTitle}>No Plans Match Filter</Text>
                    <Text style={styles.emptyDesc}>
                      {searchQuery
                        ? 'Try adjusting your search keywords.'
                        : 'No subscription tiers configured in this category.'}
                    </Text>
                  </View>
                )}

              </>
            )}
          </ScrollView>
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

  // ==========================================
  // Top Mint Section
  // ==========================================
  topSection: {
    backgroundColor: colors.primary,
    paddingHorizontal: m(18),
    paddingTop: m(12),
    paddingBottom: m(16),
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(14),
  },
  headerTitle: {
    fontSize: m(21),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    textAlign: 'left',
  },
  addPlanHeaderBtn: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    backgroundColor: 'rgba(9, 48, 48, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Metric Overview Row
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(12),
  },
  summaryCol: {
    flex: 1,
  },
  summaryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(5),
    marginBottom: m(3),
  },
  summaryLabel: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  summaryValue: {
    fontSize: m(20),
    lineHeight: m(26),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  summaryDivider: {
    width: 1,
    height: m(32),
    backgroundColor: 'rgba(9, 48, 48, 0.15)',
    marginHorizontal: m(14),
  },

  // Signature Progress Bar
  progressSection: {
    marginTop: m(2),
  },
  progressBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    marginBottom: m(6),
  },
  percentPill: {
    backgroundColor: colors.lettersAndIcons,
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(10),
  },
  percentPillText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  track: {
    flex: 1,
    height: m(12),
    borderRadius: m(6),
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: colors.oceanBlueButton,
    borderRadius: m(6),
  },
  progressNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(5),
  },
  progressNoteText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },

  // ==========================================
  // Curved Sheet
  // ==========================================
  sheetSection: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(36),
    borderTopRightRadius: m(36),
    paddingTop: m(16),
  },
  scrollContent: {
    paddingHorizontal: m(18),
    paddingBottom: m(110),
  },

  // Search & Filters
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGreen,
    borderRadius: m(24),
    height: m(46),
    paddingHorizontal: m(16),
    marginBottom: m(12),
  },
  searchIcon: {
    marginRight: m(10),
  },
  searchInput: {
    flex: 1,
    fontSize: m(14),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
    padding: 0,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: m(8),
    marginBottom: m(16),
  },
  filterTab: {
    paddingHorizontal: m(14),
    paddingVertical: m(6),
    borderRadius: m(18),
    backgroundColor: 'rgba(9, 48, 48, 0.08)',
  },
  filterTabActive: {
    backgroundColor: colors.lettersAndIcons,
  },
  filterTabText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  filterTabTextActive: {
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },

  // ==========================================
  // 3-Column Categories Squircle Grid
  // ==========================================
  squircleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(14),
    marginBottom: m(18),
  },
  gridItemContainer: {
    width: GRID_ITEM_WIDTH,
    alignItems: 'center',
    marginBottom: m(8),
  },
  squircleTile: {
    width: GRID_ITEM_WIDTH,
    height: m(120),
    borderRadius: m(24),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.oceanBlueButton,
    overflow: 'hidden',
    position: 'relative',
  },
  tilePriceBadge: {
    position: 'absolute',
    top: m(8),
    right: m(8),
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(8),
  },
  tilePriceText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  gridItemTitle: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    textAlign: 'center',
    marginTop: m(8),
  },
  gridItemSubtitle: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: m(2),
  },



  // States
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: m(60),
  },
  loadingText: {
    marginTop: m(10),
    fontSize: m(13),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(40),
    paddingHorizontal: m(30),
  },
  emptyTitle: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginTop: m(10),
  },
  emptyDesc: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: m(4),
  },
});
