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
    if (!borrowerStatistics?.percentages) {
      return [];
    }

    const { percentages } = borrowerStatistics;
    const data = [];

    // Add Paid
    if (percentages.paidPercentage > 0) {
      data.push({
        label: 'Paid',
        value: percentages.paidPercentage,
        color: '#22c55e',
      });
    }

    // Add Overdue
    if (percentages.overduePercentage > 0) {
      data.push({
        label: 'Overdue',
        value: percentages.overduePercentage,
        color: '#ef4444',
      });
    }

    // Add Pending
    if (percentages.pendingPercentage > 0) {
      data.push({
        label: 'Pending',
        value: percentages.pendingPercentage,
        color: '#f59e0b',
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

