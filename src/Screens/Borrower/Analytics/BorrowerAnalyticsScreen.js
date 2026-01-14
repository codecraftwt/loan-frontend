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
import { getBorrowerStatistics } from '../../../Redux/Slices/borrowerLoanSlice';
import DonutChart from '../../../Components/DonutChart';

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
  // Handle percentage as number or string
  const percentageValue = typeof percentage === 'number' 
    ? percentage 
    : parseFloat(percentage) || 0;
  
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowValue}>{formatCurrency(amount)} ₹</Text>
        <Text style={styles.rowPercentage}>{percentageValue.toFixed(2)}%</Text>
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
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Prepare chart data from statistics
  const chartData = React.useMemo(() => {
    if (!borrowerStatistics || !borrowerStatistics.totalLoanAmount || borrowerStatistics.totalLoanAmount <= 0) {
      return [];
    }

    const totalAmount = borrowerStatistics.totalLoanAmount || 0;
    const { percentages } = borrowerStatistics || {};
    const data = [];

    // Get amounts (ensure they're numbers)
    const paidAmount = parseFloat(borrowerStatistics.totalPaidAmount) || 0;
    const pendingAmount = parseFloat(borrowerStatistics.totalPendingAmount) || 0;
    const remainingAmount = parseFloat(borrowerStatistics.totalRemainingAmount) || 0;
    const overdueAmount = parseFloat(borrowerStatistics.totalOverdueAmount) || 0;

    // Calculate percentages from amounts (always calculate from amounts)
    const paidPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
    const pendingPercentage = totalAmount > 0 ? (pendingAmount / totalAmount) * 100 : 0;
    const overduePercentage = totalAmount > 0 ? (overdueAmount / totalAmount) * 100 : 0;
    const remainingPercentage = totalAmount > 0 ? (remainingAmount / totalAmount) * 100 : 0;

    // Add Paid if amount exists and percentage is valid
    if (paidAmount > 0 && paidPercentage > 0) {
      data.push({
        label: 'Paid',
        value: paidPercentage,
        color: '#22c55e',
      });
    }

    // Add Overdue if amount exists and percentage is valid
    if (overdueAmount > 0 && overduePercentage > 0) {
      data.push({
        label: 'Overdue',
        value: overduePercentage,
        color: '#ef4444',
      });
    }

    // Add Pending if amount exists (KEY FIX - always show if pending amount > 0)
    if (pendingAmount > 0) {
      // Use calculated percentage, or default to 100% if calculation fails
      const finalPendingPercentage = pendingPercentage > 0 ? pendingPercentage : 100;
      data.push({
        label: 'Pending',
        value: finalPendingPercentage,
        color: '#f59e0b',
      });
    }

    // Add Remaining if amount exists and no other slices (to avoid duplication)
    if (remainingAmount > 0 && data.length === 0) {
      const finalRemainingPercentage = remainingPercentage > 0 ? remainingPercentage : 100;
      data.push({
        label: 'Remaining Amount',
        value: finalRemainingPercentage,
        color: '#3b82f6',
      });
    }

    // Final fallback: If no slices but we have total loan amount, show Total Loan Amount
    if (data.length === 0 && totalAmount > 0) {
      data.push({
        label: 'Total Loan Amount',
        value: 100,
        color: '#6366f1',
      });
    }

    return data;
  }, [borrowerStatistics]);

  const hasData = borrowerStatistics && borrowerStatistics.totalLoanAmount > 0;

  return (
    <View style={styles.container}>
      <Header title="Analytics" showBackButton />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <Text style={styles.screenTitle}>Loan Statistics</Text>

        {isLoading || statisticsLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading analytics...</Text>
          </View>
        ) : !hasData ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No loan data available</Text>
            <Text style={styles.emptySubtext}>
              Start accepting loans to see statistics here
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
                centerLabel={formatCurrency(borrowerStatistics.totalLoanAmount)}
                centerSubLabel="Total Loans"
              />

              <View style={styles.rowsContainer}>
                <AnalyticsRow
                  label="Total Loan Amount"
                  amount={borrowerStatistics.totalLoanAmount}
                  percentage={borrowerStatistics.percentages.totalLoanAmountPercentage}
                  color="#6366f1"
                />
                <AnalyticsRow
                  label="Paid Amount"
                  amount={borrowerStatistics.totalPaidAmount}
                  percentage={borrowerStatistics.percentages.paidPercentage}
                  color="#22c55e"
                />
                <AnalyticsRow
                  label="Remaining Amount"
                  amount={borrowerStatistics.totalRemainingAmount}
                  percentage={borrowerStatistics.totalLoanAmount > 0 
                    ? ((borrowerStatistics.totalRemainingAmount / borrowerStatistics.totalLoanAmount) * 100)
                    : 0}
                  color="#3b82f6"
                />
                <AnalyticsRow
                  label="Overdue Amount"
                  amount={borrowerStatistics.totalOverdueAmount}
                  percentage={borrowerStatistics.percentages.overduePercentage}
                  color="#ef4444"
                />
                <AnalyticsRow
                  label="Pending Amount"
                  amount={borrowerStatistics.totalPendingAmount}
                  percentage={borrowerStatistics.percentages.pendingPercentage}
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
                    {borrowerStatistics.counts.totalLoans || 0}
                  </Text>
                  <Text style={styles.countLabel}>Total Loans</Text>
                </View>
                <View style={styles.countItem}>
                  <Text style={[styles.countValue, { color: '#3b82f6' }]}>
                    {borrowerStatistics.counts.activeLoans || 0}
                  </Text>
                  <Text style={styles.countLabel}>Active</Text>
                </View>
                <View style={styles.countItem}>
                  <Text style={[styles.countValue, { color: '#22c55e' }]}>
                    {borrowerStatistics.counts.paidLoans || 0}
                  </Text>
                  <Text style={styles.countLabel}>Paid</Text>
                </View>
                <View style={styles.countItem}>
                  <Text style={[styles.countValue, { color: '#ef4444' }]}>
                    {borrowerStatistics.counts.overdueLoans || 0}
                  </Text>
                  <Text style={styles.countLabel}>Overdue</Text>
                </View>
                <View style={styles.countItem}>
                  <Text style={[styles.countValue, { color: '#f59e0b' }]}>
                    {borrowerStatistics.counts.pendingLoans || 0}
                  </Text>
                  <Text style={styles.countLabel}>Pending</Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
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
    paddingBottom: m(100),
  },
  loadingContainer: {
    padding: m(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: m(16),
    fontFamily: 'Poppins-Medium',
    color: '#6b7280',
  },
  emptyContainer: {
    padding: m(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: m(18),
    fontFamily: 'Montserrat-SemiBold',
    color: '#6b7280',
    marginBottom: m(8),
  },
  emptySubtext: {
    fontSize: m(14),
    fontFamily: 'Poppins-Regular',
    color: '#9ca3af',
    textAlign: 'center',
  },
  screenTitle: {
    fontSize: m(22),
    fontFamily: 'Montserrat-Bold',
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
    fontSize: m(18),
    fontFamily: 'Montserrat-SemiBold',
    color: '#111827',
    marginBottom: m(4),
  },
  sectionSubtitle: {
    fontSize: m(12),
    fontFamily: 'Poppins-Regular',
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
    fontSize: m(14),
    fontFamily: 'Poppins-Medium',
    color: '#374151',
    flexShrink: 1,
  },
  rowValue: {
    fontSize: m(14),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: m(2),
  },
  rowPercentage: {
    fontSize: m(12),
    fontFamily: 'Poppins-Regular',
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
    fontSize: m(24),
    fontFamily: 'Montserrat-Bold',
    color: '#111827',
    marginBottom: m(4),
  },
  countLabel: {
    fontSize: m(12),
    fontFamily: 'Poppins-Medium',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

