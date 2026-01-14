import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import SubscriptionRestriction from '../../../Components/SubscriptionRestriction';
import { useSubscription } from '../../../hooks/useSubscription';
import { getActivePlan } from '../../../Redux/Slices/planPurchaseSlice';
import { getLenderStatistics } from '../../../Redux/Slices/loanSlice';
import DonutChart from '../../../Components/DonutChart';
import { FontFamily, FontSizes } from '../../../constants';

const formatCurrency = value => {
  if (!value) {
    return '0';
  }
  const num = Number(value) || 0;
  return num.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  });
};

const AnalyticsRow = ({ label, amount, percentage, color }) => {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowValue}>{formatCurrency(amount)} ₹</Text>
        <Text style={styles.rowPercentage}>{percentage.toFixed(2)}%</Text>
      </View>
    </View>
  );
};

export default function AnalyticsScreen() {
  const dispatch = useDispatch();
  const { lenderStatistics } = useSelector(state => state.loans);
  const user = useSelector(state => state.auth.user);
  const isLender = user?.roleId === 1;
  const { hasActivePlan } = useSubscription();
  const { loading: planLoading } = useSelector(state => state.planPurchase);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await dispatch(getLenderStatistics());
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Prepare chart data from statistics
  const chartData = React.useMemo(() => {
    if (!lenderStatistics || !lenderStatistics.totalLoanAmount || lenderStatistics.totalLoanAmount <= 0) {
      return [];
    }

    const totalAmount = lenderStatistics.totalLoanAmount || 0;
    const { percentages } = lenderStatistics;
    const data = [];

    // Calculate percentages from amounts if percentages are missing or zero
    const paidAmount = lenderStatistics.totalPaidAmount || 0;
    const pendingAmount = lenderStatistics.totalPendingAmount || 0;
    const overdueAmount = lenderStatistics.totalOverdueAmount || 0;

    // Use percentages if available and > 0, otherwise calculate from amounts
    const paidPercentage = (percentages?.paidPercentage > 0) 
      ? percentages.paidPercentage 
      : (totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0);
    
    const pendingPercentage = (percentages?.pendingPercentage > 0)
      ? percentages.pendingPercentage
      : (totalAmount > 0 ? (pendingAmount / totalAmount) * 100 : 0);
    
    const overduePercentage = (percentages?.overduePercentage > 0)
      ? percentages.overduePercentage
      : (totalAmount > 0 ? (overdueAmount / totalAmount) * 100 : 0);

    // Add Paid
    if (paidPercentage > 0) {
      data.push({
        label: 'Paid',
        value: paidPercentage,
        color: '#22c55e',
      });
    }

    // Add Overdue
    if (overduePercentage > 0) {
      data.push({
        label: 'Overdue',
        value: overduePercentage,
        color: '#ef4444',
      });
    }

    // Add Pending
    if (pendingPercentage > 0) {
      data.push({
        label: 'Pending',
        value: pendingPercentage,
        color: '#f59e0b',
      });
    }

    // Fallback: If no slices but we have total loan amount, show Total Loan Amount or Pending
    if (data.length === 0 && totalAmount > 0) {
      // If there's pending amount, show that, otherwise show total
      if (pendingAmount > 0) {
        const pendingPercentage = (pendingAmount / totalAmount) * 100;
        data.push({
          label: 'Pending',
          value: pendingPercentage,
          color: '#f59e0b',
        });
      } else {
        data.push({
          label: 'Total Loan Amount',
          value: 100,
          color: '#6366f1',
        });
      }
    }

    return data;
  }, [lenderStatistics]);

  const hasData = lenderStatistics && lenderStatistics.totalLoanAmount > 0;

  return (
    <View style={styles.container}>
      <Header title="Analytics" showBackButton />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          isLender && !hasActivePlan && { opacity: 0.5 }
        ]}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            enabled={isLender ? hasActivePlan : true}
          />
        }
        scrollEnabled={isLender ? hasActivePlan : true}>
        <Text style={styles.screenTitle}>Loan Statistics</Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading analytics...</Text>
          </View>
        ) : !hasData ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No loan data available</Text>
            <Text style={styles.emptySubtext}>
              Start creating loans to see statistics here
            </Text>
          </View>
        ) : (
          <>
            {/* Main Statistics Card */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Loan Overview</Text>
              <Text style={styles.sectionSubtitle}>
                Distribution of your loan portfolio
              </Text>

              <DonutChart
                data={chartData}
                radius={m(80)}
                innerRadius={m(50)}
                centerLabel={formatCurrency(lenderStatistics.totalLoanAmount)}
                centerSubLabel="Total Loans"
              />

              <View style={styles.rowsContainer}>
                <AnalyticsRow
                  label="Total Loan Amount"
                  amount={lenderStatistics.totalLoanAmount}
                  percentage={lenderStatistics.percentages.totalLoanAmountPercentage}
                  color="#6366f1"
                />
                <AnalyticsRow
                  label="Paid Amount"
                  amount={lenderStatistics.totalPaidAmount}
                  percentage={lenderStatistics.percentages.paidPercentage}
                  color="#22c55e"
                />
                <AnalyticsRow
                  label="Overdue Amount"
                  amount={lenderStatistics.totalOverdueAmount}
                  percentage={lenderStatistics.percentages.overduePercentage}
                  color="#ef4444"
                />
                <AnalyticsRow
                  label="Pending Amount"
                  amount={lenderStatistics.totalPendingAmount}
                  percentage={lenderStatistics.percentages.pendingPercentage}
                  color="#f59e0b"
                />
              </View>
            </View>

            {/* Loan Counts Card */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Loan Counts</Text>
              <Text style={styles.sectionSubtitle}>
                Number of loans by status
              </Text>

              <View style={styles.countsContainer}>
                <View style={styles.countItem}>
                  <Text style={styles.countValue}>
                    {lenderStatistics.counts.totalLoans || 0}
                  </Text>
                  <Text style={styles.countLabel}>Total Loans</Text>
                </View>
                <View style={styles.countItem}>
                  <Text style={[styles.countValue, { color: '#22c55e' }]}>
                    {lenderStatistics.counts.paidLoans || 0}
                  </Text>
                  <Text style={styles.countLabel}>Paid</Text>
                </View>
                <View style={styles.countItem}>
                  <Text style={[styles.countValue, { color: '#ef4444' }]}>
                    {lenderStatistics.counts.overdueLoans || 0}
                  </Text>
                  <Text style={styles.countLabel}>Overdue</Text>
                </View>
                <View style={styles.countItem}>
                  <Text style={[styles.countValue, { color: '#f59e0b' }]}>
                    {lenderStatistics.counts.pendingLoans || 0}
                  </Text>
                  <Text style={styles.countLabel}>Pending</Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Subscription Restriction Overlay */}
      {isLender && !planLoading && !hasActivePlan && (
        <SubscriptionRestriction 
          message="Purchase a plan to view analytics"
          asOverlay={true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    paddingHorizontal: m(16),
    paddingBottom: m(24),
  },
  loadingContainer: {
    padding: m(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.primaryMedium,
    color: '#6b7280',
  },
  emptyContainer: {
    padding: m(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.secondarySemiBold,
    color: '#6b7280',
    marginBottom: m(8),
  },
  emptySubtext: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primaryRegular,
    color: '#9ca3af',
    textAlign: 'center',
  },
  screenTitle: {
    fontSize: FontSizes.xl,
    fontFamily: FontFamily.secondaryBold,
    color: '#111827',
    marginTop: m(20),
    marginBottom: m(12),
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: m(18),
    padding: m(20),
    marginBottom: m(18),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.secondarySemiBold,
    color: '#111827',
    marginBottom: m(4),
  },
  sectionSubtitle: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#6b7280',
    marginBottom: m(16),
  },
  rowsContainer: {
    marginTop: m(20),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: m(10),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: m(8),
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  dot: {
    width: m(10),
    height: m(10),
    borderRadius: m(5),
    marginRight: m(10),
  },
  rowLabel: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primaryMedium,
    color: '#374151',
    flexShrink: 1,
  },
  rowValue: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: '#111827',
    marginBottom: m(2),
  },
  rowPercentage: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#6b7280',
  },
  countsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    marginTop: m(10),
  },
  countItem: {
    alignItems: 'center',
    width: '48%',
    paddingVertical: m(16),
    marginBottom: m(12),
    backgroundColor: '#f9fafb',
    borderRadius: m(12),
  },
  countValue: {
    fontSize: FontSizes['2xl'],
    fontFamily: FontFamily.secondaryBold,
    color: '#111827',
    marginBottom: m(4),
  },
  countLabel: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryMedium,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
