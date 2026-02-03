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
import { FontFamily, FontSizes } from '../../../constants';

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
          <Icon name={icon} size={16} color="#fff" />
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
        color: '#10B981',
        amount: paidAmount 
      });
    }

    // Add Remaining (blue) - what's left to pay
    if (remainingAmount > 0) {
      data.push({ 
        label: 'Remaining', 
        value: remainingPercentage, 
        color: '#3B82F6',
        amount: remainingAmount 
      });
    }

    // Fallback: If fully paid or no data
    if (data.length === 0 && totalAmount > 0) {
      data.push({ 
        label: 'Fully Paid', 
        value: 100, 
        color: '#10B981',
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
            colors={['#FF9800']}
            tintColor="#FF9800"
          />
        }>

        {isLoading || statisticsLoading ? (
          <View style={styles.loadingContainer}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons name="analytics" size={50} color="#FF9800" />
            </Animated.View>
            <Text style={styles.loadingText}>Loading analytics...</Text>
            <Text style={styles.loadingSubtext}>Please wait while we fetch your data</Text>
          </View>
        ) : !hasData ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="pie-chart-outline" size={60} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>No Loan Data Yet</Text>
            <Text style={styles.emptySubtext}>
              Start accepting loans to see your analytics and insights here
            </Text>
          </View>
        ) : (
          <>
            {/* Combined Summary Card */}
            <Animated.View
              style={[
                styles.summaryCard,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.summaryGradient}>
                <View style={styles.summaryPattern} />
                
                {/* Main Amount */}
                <View style={styles.summaryHeader}>
                  <View style={styles.summaryIconContainer}>
                    <Ionicons name="wallet" size={24} color="#fff" />
                  </View>
                  <View style={styles.summaryTitleContainer}>
                    <Text style={styles.summaryLabel}>Total Borrowed</Text>
                    <Text style={styles.summaryValue}>
                      ₹{formatCurrency(borrowerStatistics.totalLoanAmount)}
                    </Text>
                  </View>
                </View>

                {/* Stats Row - Simplified Loan Counts */}
                <View style={styles.integratedStats}>
                  <View style={styles.integratedStatItem}>
                    <View style={[styles.integratedStatIcon, { backgroundColor: 'rgba(139, 92, 246, 0.3)' }]}>
                      <Icon name="file-text" size={16} color="#A78BFA" />
                    </View>
                    <Text style={styles.integratedStatValue}>
                      {borrowerStatistics.counts?.totalLoans || 0}
                    </Text>
                    <Text style={styles.integratedStatLabel}>Total</Text>
                  </View>
                  <View style={styles.integratedStatDivider} />
                  <View style={styles.integratedStatItem}>
                    <View style={[styles.integratedStatIcon, { backgroundColor: 'rgba(16, 185, 129, 0.3)' }]}>
                      <Icon name="check-circle" size={16} color="#10B981" />
                    </View>
                    <Text style={styles.integratedStatValue}>
                      {borrowerStatistics.counts?.paidLoans || 0}
                    </Text>
                    <Text style={styles.integratedStatLabel}>Completed</Text>
                  </View>
                  <View style={styles.integratedStatDivider} />
                  <View style={styles.integratedStatItem}>
                    <View style={[styles.integratedStatIcon, { backgroundColor: 'rgba(59, 130, 246, 0.3)' }]}>
                      <Icon name="activity" size={16} color="#60A5FA" />
                    </View>
                    <Text style={styles.integratedStatValue}>
                      {borrowerStatistics.counts?.activeLoans || 0}
                    </Text>
                    <Text style={styles.integratedStatLabel}>Active</Text>
                  </View>
                  <View style={styles.integratedStatDivider} />
                  <View style={styles.integratedStatItem}>
                    <View style={[styles.integratedStatIcon, { backgroundColor: 'rgba(239, 68, 68, 0.3)' }]}>
                      <Icon name="alert-circle" size={16} color="#F87171" />
                    </View>
                    <Text style={styles.integratedStatValue}>
                      {borrowerStatistics.counts?.overdueLoans || 0}
                    </Text>
                    <Text style={styles.integratedStatLabel}>Overdue</Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>

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
                    <Ionicons name="pie-chart" size={20} color="#FF9800" />
                  </View>
                  <View>
                    <Text style={styles.chartTitle}>Loan Distribution</Text>
                    <Text style={styles.chartSubtitle}>Visual breakdown of your loans</Text>
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
                    <Icon name="trending-up" size={18} color="#10B981" />
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
                color="#10B981"
              />
              <ProgressBar
                label="Amount Remaining"
                value={borrowerStatistics.totalRemainingAmount}
                maxValue={borrowerStatistics.totalLoanAmount}
                color="#3B82F6"
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
                    <Icon name="list" size={18} color="#8B5CF6" />
                  </View>
                  <Text style={styles.detailsTitle}>Detailed Breakdown</Text>
                </View>
              </View>

              <AnalyticsRow
                label="Total Borrowed"
                amount={borrowerStatistics.totalLoanAmount}
                percentage={100}
                color="#8B5CF6"
                icon="credit-card"
              />
              <AnalyticsRow
                label="Amount Paid"
                amount={borrowerStatistics.totalPaidAmount}
                percentage={borrowerStatistics.percentages?.paidPercentage || 0}
                color="#10B981"
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
                color="#3B82F6"
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
                colors={['#FEF3C7', '#FDE68A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tipsGradient}>
                <View style={styles.tipsIconContainer}>
                  <Ionicons name="bulb" size={24} color="#D97706" />
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
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: m(16),
    paddingBottom: m(100),
  },

  // ============================================
  // LOADING & EMPTY STATES
  // ============================================
  loadingContainer: {
    paddingVertical: m(80),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.secondaryBold,
    color: '#374151',
    marginTop: m(20),
  },
  loadingSubtext: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#9CA3AF',
    marginTop: m(8),
  },
  emptyContainer: {
    paddingVertical: m(60),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: m(24),
    marginTop: m(20),
  },
  emptyIconContainer: {
    width: m(100),
    height: m(100),
    borderRadius: m(50),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: m(20),
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontFamily: FontFamily.secondaryBold,
    color: '#374151',
    marginBottom: m(10),
  },
  emptySubtext: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primaryRegular,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: m(40),
    lineHeight: m(22),
  },

  // ============================================
  // COMBINED SUMMARY CARD
  // ============================================
  summaryCard: {
    borderRadius: m(24),
    overflow: 'hidden',
    marginBottom: m(20),
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  summaryGradient: {
    padding: m(20),
    position: 'relative',
    overflow: 'hidden',
  },
  summaryPattern: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: m(100),
    height: m(100),
    borderRadius: m(50),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(20),
  },
  summaryIconContainer: {
    width: m(50),
    height: m(50),
    borderRadius: m(14),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(14),
  },
  summaryTitleContainer: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: m(2),
  },
  summaryValue: {
    fontSize: m(26),
    fontFamily: FontFamily.secondaryBold,
    color: '#FFFFFF',
  },
  // Integrated Stats in Summary Card
  integratedStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: m(16),
    padding: m(14),
  },
  integratedStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  integratedStatIcon: {
    width: m(32),
    height: m(32),
    borderRadius: m(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: m(6),
  },
  integratedStatValue: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.primaryBold,
    color: '#FFFFFF',
  },
  integratedStatLabel: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.primaryRegular,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: m(2),
  },
  integratedStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: m(8),
  },

  // ============================================
  // CHART CARD
  // ============================================
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(24),
    padding: m(20),
    marginBottom: m(20),
    shadowColor: '#000',
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
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(14),
  },
  chartTitle: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.secondaryBold,
    color: '#111827',
  },
  chartSubtitle: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#9CA3AF',
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
    backgroundColor: '#F9FAFB',
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
    color: '#374151',
  },
  legendAmount: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primaryBold,
  },
  legendPercentage: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.primaryRegular,
    color: '#9CA3AF',
    marginTop: m(2),
  },

  // ============================================
  // BREAKDOWN CARD
  // ============================================
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(24),
    padding: m(20),
    marginBottom: m(20),
    shadowColor: '#000',
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
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(14),
  },
  breakdownTitle: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.secondaryBold,
    color: '#111827',
  },
  breakdownBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(20),
  },
  breakdownBadgeText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryBold,
    color: '#059669',
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
    color: '#374151',
  },
  progressBarValue: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primaryBold,
  },
  progressBarTrack: {
    height: m(10),
    backgroundColor: '#F3F4F6',
    borderRadius: m(5),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: m(5),
  },

  // ============================================
  // DETAILS CARD
  // ============================================
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(24),
    padding: m(20),
    marginBottom: m(20),
    shadowColor: '#000',
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
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(14),
  },
  detailsTitle: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.secondaryBold,
    color: '#111827',
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: m(14),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
    color: '#374151',
    marginBottom: m(2),
  },
  analyticsRowPercentage: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.primaryRegular,
    color: '#9CA3AF',
  },
  analyticsRowRight: {
    alignItems: 'flex-end',
  },
  analyticsRowValue: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.primaryBold,
  },

  // ============================================
  // TIPS CARD
  // ============================================
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
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
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
    color: '#92400E',
    marginBottom: m(4),
  },
  tipsText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#B45309',
    lineHeight: m(20),
  },
});
