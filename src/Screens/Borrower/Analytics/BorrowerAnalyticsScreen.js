import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Animated,
  Easing,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { m } from 'walstar-rn-responsive';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Header from '../../../Components/Header';
import { getBorrowerStatistics } from '../../../Redux/Slices/borrowerLoanSlice';
import DonutChart from '../../../Components/DonutChart';
import { FontFamily, FontSizes, colors } from '../../../constants';

const formatCurrency = value => {
  if (!value) return '0';
  const num = Number(value) || 0;
  return num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

// Modern Analytics Row Component
const AnalyticsRow = ({ label, amount, percentage, color, icon, isLast }) => {
  const percentageValue = typeof percentage === 'number'
    ? percentage
    : parseFloat(percentage) || 0;

  return (
    <View style={[styles.analyticsRow, isLast && styles.analyticsRowLast]}>
      <View style={styles.analyticsRowLeft}>
        <LinearGradient
          colors={[color, color + 'CC']}
          style={styles.analyticsRowIcon}>
          <Icon name={icon} size={16} color={colors.white} />
        </LinearGradient>
        <View style={styles.analyticsRowInfo}>
          <Text style={styles.analyticsRowLabel}>{label}</Text>
          <Text style={styles.analyticsRowPercentage}>
            {percentageValue.toFixed(1)}% of total
          </Text>
        </View>
      </View>
      <View style={styles.analyticsRowRight}>
        <Text style={[styles.analyticsRowValue, { color }]}>
          ₹{formatCurrency(amount)}
        </Text>
      </View>
    </View>
  );
};

// Progress Bar Component
const ProgressBar = ({ label, value, maxValue, color }) => {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: percentage,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  return (
    <View style={styles.progressBarItem}>
      <View style={styles.progressBarHeader}>
        <View style={styles.progressBarLabelContainer}>
          <View style={[styles.progressBarDot, { backgroundColor: color }]} />
          <Text style={styles.progressBarLabel}>{label}</Text>
        </View>
        <Text style={[styles.progressBarValue, { color }]}>
          ₹{formatCurrency(value)}
        </Text>
      </View>
      <View style={styles.progressBarTrack}>
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              backgroundColor: color,
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
};

export default function BorrowerAnalyticsScreen() {
  const dispatch = useDispatch();
  const { borrowerStatistics } = useSelector(state => state.borrowerLoans);
  const statisticsLoading = useSelector(state => state.borrowerLoans.statisticsLoading);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const loadData = async () => {
    try {
      setIsLoading(true);
      await dispatch(getBorrowerStatistics());
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Prepare chart data from statistics
  // Chart shows Paid vs Remaining (these add up to Total correctly)
  const chartData = React.useMemo(() => {
    if (!borrowerStatistics || !borrowerStatistics.totalLoanAmount || borrowerStatistics.totalLoanAmount <= 0) {
      return [];
    }

    const totalAmount = borrowerStatistics.totalLoanAmount || 0;
    const data = [];

    const paidAmount = parseFloat(borrowerStatistics.totalPaidAmount) || 0;
    const remainingAmount = parseFloat(borrowerStatistics.totalRemainingAmount) || 0;

    // Calculate percentages based on total loan amount
    const paidPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
    const remainingPercentage = totalAmount > 0 ? (remainingAmount / totalAmount) * 100 : 0;

    // Add Paid (green) - what has been repaid
    if (paidAmount > 0) {
      data.push({
        label: 'Paid',
        value: paidPercentage,
        color: colors.success,
        amount: paidAmount
      });
    }

    // Add Remaining (blue) - what's left to pay
    if (remainingAmount > 0) {
      data.push({
        label: 'Remaining',
        value: remainingPercentage,
        color: colors.info,
        amount: remainingAmount
      });
    }

    // Fallback: If fully paid or no data
    if (data.length === 0 && totalAmount > 0) {
      data.push({
        label: 'Fully Paid',
        value: 100,
        color: colors.success,
        amount: totalAmount
      });
    }

    return data;
  }, [borrowerStatistics]);

  const hasData = borrowerStatistics && borrowerStatistics.totalLoanAmount > 0;

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Header title="Analytics" showBackButton />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.ink]}
            tintColor={colors.ink}
          />
        }>

        {isLoading || statisticsLoading ? (
          <View style={styles.loadingContainer}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons name="analytics" size={50} color={colors.ink} />
            </Animated.View>
            <Text style={styles.loadingText}>Loading analytics...</Text>
            <Text style={styles.loadingSubtext}>Please wait while we fetch your data</Text>
          </View>
        ) : !hasData ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="pie-chart-outline" size={60} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No Loan Data Yet</Text>
            <Text style={styles.emptySubtext}>
              Start accepting loans to see your analytics and insights here
            </Text>
          </View>
        ) : (
          <>
            {/* Hero Tiles - Total Borrowed / Amount Paid */}
            <Animated.View
              style={[
                styles.heroTilesRow,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}>
              <View style={[styles.heroTile, { backgroundColor: colors.sky }]}>
                <View style={styles.heroTileIcon}>
                  <Icon name="briefcase" size={18} color={colors.ink} />
                </View>
                <Text style={styles.heroTileLabel}>Total Borrowed</Text>
                <Text style={styles.heroTileValue}>
                  ₹{formatCurrency(borrowerStatistics.totalLoanAmount)}
                </Text>
              </View>
              <View style={[styles.heroTile, { backgroundColor: colors.mint }]}>
                <View style={styles.heroTileIcon}>
                  <Icon name="file-text" size={18} color={colors.ink} />
                </View>
                <Text style={styles.heroTileLabel}>Amount Paid</Text>
                <Text style={styles.heroTileValue}>
                  ₹{formatCurrency(borrowerStatistics.totalPaidAmount)}
                </Text>
              </View>
            </Animated.View>

            {/* Loan Counts Row */}
            <Animated.View
              style={[
                styles.statsRowCard,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}>
              <View style={styles.statsRow}>
                <View style={styles.statsRowItem}>
                  <View style={[styles.statsRowIcon, { backgroundColor: colors.skySoft }]}>
                    <Icon name="file-text" size={16} color={colors.info} />
                  </View>
                  <Text style={styles.statsRowValue}>
                    {borrowerStatistics.counts?.totalLoans || 0}
                  </Text>
                  <Text style={styles.statsRowLabel}>Total</Text>
                </View>
                <View style={styles.statsRowItem}>
                  <View style={[styles.statsRowIcon, { backgroundColor: colors.mintSoft }]}>
                    <Icon name="check-circle" size={16} color={colors.success} />
                  </View>
                  <Text style={styles.statsRowValue}>
                    {borrowerStatistics.counts?.paidLoans || 0}
                  </Text>
                  <Text style={styles.statsRowLabel}>Completed</Text>
                </View>
                <View style={styles.statsRowItem}>
                  <View style={[styles.statsRowIcon, { backgroundColor: colors.butterSoft }]}>
                    <Icon name="activity" size={16} color={colors.butterDark} />
                  </View>
                  <Text style={styles.statsRowValue}>
                    {borrowerStatistics.counts?.activeLoans || 0}
                  </Text>
                  <Text style={styles.statsRowLabel}>Active</Text>
                </View>
                <View style={styles.statsRowItem}>
                  <View style={[styles.statsRowIcon, { backgroundColor: colors.error + '1A' }]}>
                    <Icon name="alert-circle" size={16} color={colors.error} />
                  </View>
                  <Text style={styles.statsRowValue}>
                    {borrowerStatistics.counts?.overdueLoans || 0}
                  </Text>
                  <Text style={styles.statsRowLabel}>Overdue</Text>
                </View>
              </View>
            </Animated.View>

            <Text style={styles.sectionTitle}>Loan Distribution</Text>

            {/* Chart Section */}
            <Animated.View
              style={[
                styles.chartCard,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}>
              <View style={styles.chartHeader}>
                <View style={styles.chartTitleContainer}>
                  <View style={styles.chartIconContainer}>
                    <Ionicons name="pie-chart" size={20} color={colors.butterDark} />
                  </View>
                  <View>
                    <Text style={styles.chartTitle}>Visual breakdown</Text>
                    <Text style={styles.chartSubtitle}>Of your total borrowed amount</Text>
                  </View>
                </View>
              </View>

              <View style={styles.chartContainer}>
                <DonutChart
                  data={chartData}
                  radius={m(90)}
                  innerRadius={m(55)}
                  centerLabel={formatCurrency(borrowerStatistics.totalLoanAmount)}
                  centerSubLabel="Total Amount"
                />
              </View>

              {/* Chart Legend */}
              <View style={styles.legendContainer}>
                {chartData.map((item, index) => (
                  <View key={index} style={styles.legendItem}>
                    <View style={styles.legendLeft}>
                      <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                      <Text style={styles.legendLabel}>{item.label}</Text>
                    </View>
                    <View style={styles.legendRight}>
                      <Text style={[styles.legendAmount, { color: item.color }]}>
                        ₹{formatCurrency(item.amount)}
                      </Text>
                      <Text style={styles.legendPercentage}>
                        {item.value.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* Progress Breakdown */}
            <Animated.View
              style={[
                styles.breakdownCard,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}>
              <View style={styles.breakdownHeader}>
                <View style={styles.breakdownTitleContainer}>
                  <View style={styles.breakdownIconContainer}>
                    <Icon name="trending-up" size={18} color={colors.success} />
                  </View>
                  <Text style={styles.breakdownTitle}>Payment Progress</Text>
                </View>
                <View style={styles.breakdownBadge}>
                  <Text style={styles.breakdownBadgeText}>
                    {borrowerStatistics.totalLoanAmount > 0
                      ? ((borrowerStatistics.totalPaidAmount / borrowerStatistics.totalLoanAmount) * 100).toFixed(0)
                      : 0}% Complete
                  </Text>
                </View>
              </View>

              <ProgressBar
                label="Amount Paid"
                value={borrowerStatistics.totalPaidAmount}
                maxValue={borrowerStatistics.totalLoanAmount}
                color={colors.success}
              />
              <ProgressBar
                label="Amount Remaining"
                value={borrowerStatistics.totalRemainingAmount}
                maxValue={borrowerStatistics.totalLoanAmount}
                color={colors.info}
              />
            </Animated.View>

            {/* Detailed Analytics */}
            <Animated.View
              style={[
                styles.detailsCard,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}>
              <View style={styles.detailsHeader}>
                <View style={styles.detailsTitleContainer}>
                  <View style={styles.detailsIconContainer}>
                    <Icon name="list" size={18} color={colors.ink} />
                  </View>
                  <Text style={styles.detailsTitle}>Detailed Breakdown</Text>
                </View>
              </View>

              <AnalyticsRow
                label="Total Borrowed"
                amount={borrowerStatistics.totalLoanAmount}
                percentage={100}
                color={colors.info}
                icon="credit-card"
              />
              <AnalyticsRow
                label="Amount Paid"
                amount={borrowerStatistics.totalPaidAmount}
                percentage={borrowerStatistics.percentages?.paidPercentage || 0}
                color={colors.success}
                icon="check"
              />
              <AnalyticsRow
                label="Balance Due"
                amount={borrowerStatistics.totalRemainingAmount}
                percentage={
                  borrowerStatistics.totalLoanAmount > 0
                    ? (borrowerStatistics.totalRemainingAmount / borrowerStatistics.totalLoanAmount) * 100
                    : 0
                }
                color={colors.goldDark}
                icon="clock"
                isLast
              />
            </Animated.View>

            {/* Tips Card */}
            <Animated.View
              style={[
                styles.tipsCard,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}>
              <LinearGradient
                colors={[colors.butterSoft, colors.butter]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tipsGradient}>
                <View style={styles.tipsIconContainer}>
                  <Ionicons name="bulb" size={24} color={colors.ink} />
                </View>
                <View style={styles.tipsContent}>
                  <Text style={styles.tipsTitle}>Pro Tip</Text>
                  <Text style={styles.tipsText}>
                    Pay your loans on time to maintain a good credit score and unlock better loan offers.
                  </Text>
                </View>
              </LinearGradient>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  content: {
    padding: m(16),
    paddingBottom: m(100),
  },

  // LOADING & EMPTY STATES
  loadingContainer: {
    paddingVertical: m(80),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.secondaryBold,
    color: colors.ink,
    marginTop: m(20),
  },
  loadingSubtext: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: colors.textMuted,
    marginTop: m(8),
  },
  emptyContainer: {
    paddingVertical: m(60),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: m(24),
    marginTop: m(20),
  },
  emptyIconContainer: {
    width: m(100),
    height: m(100),
    borderRadius: m(50),
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: m(20),
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontFamily: FontFamily.secondaryBold,
    color: colors.ink,
    marginBottom: m(10),
  },
  emptySubtext: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primaryRegular,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: m(40),
    lineHeight: m(22),
  },

  // SECTION TITLE
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.primarySemiBold,
    color: colors.ink,
    marginBottom: m(14),
  },

  // HERO TILES - Total Borrowed / Amount Paid
  heroTilesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: m(16),
  },
  heroTile: {
    width: '48%',
    borderRadius: m(18),
    padding: m(14),
  },
  heroTileIcon: {
    width: m(32),
    height: m(32),
    borderRadius: m(16),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(10),
  },
  heroTileLabel: {
    fontSize: m(11),
    fontFamily: FontFamily.bodyMedium,
    color: colors.inkSoft,
    marginBottom: m(4),
  },
  heroTileValue: {
    fontSize: m(17),
    fontFamily: FontFamily.primaryExtraBold,
    color: colors.ink,
  },

  // LOAN COUNTS ROW
  statsRowCard: {
    backgroundColor: colors.surface,
    borderRadius: m(20),
    padding: m(16),
    marginBottom: m(20),
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsRowItem: {
    flex: 1,
    alignItems: 'center',
  },
  statsRowIcon: {
    width: m(36),
    height: m(36),
    borderRadius: m(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: m(8),
  },
  statsRowValue: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.primaryBold,
    color: colors.ink,
  },
  statsRowLabel: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(2),
    textTransform: 'uppercase',
  },

  // CHART CARD
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: m(24),
    padding: m(20),
    marginBottom: m(20),
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  chartHeader: {
    marginBottom: m(16),
  },
  chartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartIconContainer: {
    width: m(40),
    height: m(40),
    borderRadius: m(12),
    backgroundColor: colors.butterSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(14),
  },
  chartTitle: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.secondaryBold,
    color: colors.ink,
  },
  chartSubtitle: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: colors.textMuted,
    marginTop: m(2),
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: m(10),
  },
  legendContainer: {
    marginTop: m(20),
    gap: m(10),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.offWhite,
    paddingHorizontal: m(16),
    paddingVertical: m(14),
    borderRadius: m(12),
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  legendRight: {
    alignItems: 'flex-end',
  },
  legendDot: {
    width: m(12),
    height: m(12),
    borderRadius: m(6),
    marginRight: m(10),
  },
  legendLabel: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primaryMedium,
    color: colors.ink,
  },
  legendAmount: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primaryBold,
  },
  legendPercentage: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.primaryRegular,
    color: colors.textMuted,
    marginTop: m(2),
  },

  // BREAKDOWN CARD
  breakdownCard: {
    backgroundColor: colors.surface,
    borderRadius: m(24),
    padding: m(20),
    marginBottom: m(20),
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(20),
  },
  breakdownTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownIconContainer: {
    width: m(40),
    height: m(40),
    borderRadius: m(12),
    backgroundColor: colors.mintSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(14),
  },
  breakdownTitle: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.secondaryBold,
    color: colors.ink,
  },
  breakdownBadge: {
    backgroundColor: colors.mintSoft,
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(20),
  },
  breakdownBadgeText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryBold,
    color: colors.mintText,
  },
  progressBarItem: {
    marginBottom: m(18),
  },
  progressBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(8),
  },
  progressBarLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarDot: {
    width: m(10),
    height: m(10),
    borderRadius: m(5),
    marginRight: m(10),
  },
  progressBarLabel: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primaryMedium,
    color: colors.ink,
  },
  progressBarValue: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primaryBold,
  },
  progressBarTrack: {
    height: m(10),
    backgroundColor: colors.borderLight,
    borderRadius: m(5),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: m(5),
  },

  // DETAILS CARD
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: m(24),
    padding: m(20),
    marginBottom: m(20),
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  detailsHeader: {
    marginBottom: m(16),
  },
  detailsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsIconContainer: {
    width: m(40),
    height: m(40),
    borderRadius: m(12),
    backgroundColor: colors.skySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(14),
  },
  detailsTitle: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.secondaryBold,
    color: colors.ink,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: m(14),
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  analyticsRowLast: {
    borderBottomWidth: 0,
  },
  analyticsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  analyticsRowIcon: {
    width: m(38),
    height: m(38),
    borderRadius: m(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(12),
  },
  analyticsRowInfo: {
    flex: 1,
  },
  analyticsRowLabel: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: colors.ink,
    marginBottom: m(2),
  },
  analyticsRowPercentage: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.primaryRegular,
    color: colors.textMuted,
  },
  analyticsRowRight: {
    alignItems: 'flex-end',
  },
  analyticsRowValue: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.primaryBold,
  },

  // TIPS CARD
  tipsCard: {
    borderRadius: m(20),
    overflow: 'hidden',
    marginBottom: m(20),
  },
  tipsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: m(16),
  },
  tipsIconContainer: {
    width: m(44),
    height: m(44),
    borderRadius: m(22),
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(14),
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.secondaryBold,
    color: colors.ink,
    marginBottom: m(4),
  },
  tipsText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: colors.inkSoft,
    lineHeight: m(20),
  },
});
