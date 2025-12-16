import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { m } from 'walstar-rn-responsive';
import Header from '../../Components/Header';
import {
  getLoanByAadhar,
  getLoanByLender,
} from '../../Redux/Slices/loanSlice';
import DonutChart from '../../Components/DonutChart';

const formatCurrency = value => {
  if (!value) {
    return '0';
  }
  const num = Number(value) || 0;
  return num.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  });
};

const AnalyticsRow = ({ label, amount, color }) => {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={styles.rowValue}>{formatCurrency(amount)} Rs</Text>
    </View>
  );
};

const AnalyticsProgressBar = ({ data }) => {
  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);

  if (!total) {
    return (
      <View style={styles.progressBarEmpty}>
        <Text style={styles.progressBarEmptyText}>No data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.progressBarContainer}>
      {data.map(item => {
        const widthPercent = (item.value / total) * 100;
        if (!widthPercent) {
          return null;
        }
        return (
          <View
            key={item.label}
            style={[
              styles.progressSegment,
              {
                width: `${widthPercent}%`,
                backgroundColor: item.color,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

export default function AnalyticsScreen() {
  const dispatch = useDispatch();
  const { loans, lenderLoans } = useSelector(state => state.loans);
  const user = useSelector(state => state.auth.user);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0); // 0 = Outward, 1 = Inward
  const [isLoading, setIsLoading] = useState(true); // Local loading state

  const aadhaarNumber = user?.aadhaarNumber || user?.aadharCardNo;

  const loadData = async () => {
    try {
      // Use higher limit so analytics consider more data
      const commonFilters = { page: 1, limit: 1000 };
      
      // Create promises for both dispatches
      const promises = [];
      
      if (aadhaarNumber) {
        promises.push(dispatch(getLoanByAadhar({ aadhaarNumber, filters: commonFilters })));
      }
      promises.push(dispatch(getLoanByLender(commonFilters)));
      
      // Wait for all data to be fetched
      await Promise.all(promises);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const initializeData = async () => {
      if (mounted) {
        setIsLoading(true);
        await loadData();
      }
    };
    
    initializeData();
    
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aadhaarNumber]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const outwardStats = useMemo(() => {
    const totalGiven = lenderLoans?.reduce(
      (sum, loan) => sum + (Number(loan.amount) || 0),
      0,
    );

    const acceptedAmount = lenderLoans?.reduce(
      (sum, loan) =>
        loan?.borrowerAcceptanceStatus === 'accepted'
          ? sum + (Number(loan.amount) || 0)
          : sum,
      0,
    );

    const rejectedAmount = lenderLoans?.reduce(
      (sum, loan) =>
        loan?.borrowerAcceptanceStatus === 'rejected'
          ? sum + (Number(loan.amount) || 0)
          : sum,
      0,
    );

    const pendingAcceptanceAmount = lenderLoans?.reduce(
      (sum, loan) =>
        !loan?.borrowerAcceptanceStatus ||
          loan?.borrowerAcceptanceStatus === 'pending'
          ? sum + (Number(loan.amount) || 0)
          : sum,
      0,
    );

    const paidBackAmount = lenderLoans?.reduce(
      (sum, loan) =>
        loan?.status === 'paid' ? sum + (Number(loan.amount) || 0) : sum,
      0,
    );

    const notPaidAmount = lenderLoans?.reduce(
      (sum, loan) =>
        loan?.status === 'pending' ? sum + (Number(loan.amount) || 0) : sum,
      0,
    );

    return {
      totalGiven,
      acceptedAmount,
      rejectedAmount,
      pendingAcceptanceAmount,
      paidBackAmount,
      notPaidAmount,
    };
  }, [lenderLoans]);

  const inwardStats = useMemo(() => {
    const totalTaken = loans?.reduce(
      (sum, loan) => sum + (Number(loan.amount) || 0),
      0,
    );

    const acceptedAmount = loans?.reduce(
      (sum, loan) =>
        loan?.borrowerAcceptanceStatus === 'accepted'
          ? sum + (Number(loan.amount) || 0)
          : sum,
      0,
    );

    const rejectedAmount = loans?.reduce(
      (sum, loan) =>
        loan?.borrowerAcceptanceStatus === 'rejected'
          ? sum + (Number(loan.amount) || 0)
          : sum,
      0,
    );

    const pendingAcceptanceAmount = loans?.reduce(
      (sum, loan) =>
        !loan?.borrowerAcceptanceStatus ||
          loan?.borrowerAcceptanceStatus === 'pending'
          ? sum + (Number(loan.amount) || 0)
          : sum,
      0,
    );

    const paidAmount = loans?.reduce(
      (sum, loan) =>
        loan?.status === 'paid' ? sum + (Number(loan.amount) || 0) : sum,
      0,
    );

    const pendingRepayAmount = loans?.reduce(
      (sum, loan) =>
        loan?.status === 'pending' ? sum + (Number(loan.amount) || 0) : sum,
      0,
    );

    return {
      totalTaken,
      acceptedAmount,
      rejectedAmount,
      pendingAcceptanceAmount,
      paidAmount,
      pendingRepayAmount,
    };
  }, [loans]);

  return (
    <View style={styles.container}>
      <Header title="Profile" showBackButton />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
          />
        }>
        {/* Tabs for Outward / Inward */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              page === 0 && styles.tabButtonActive,
            ]}
            onPress={() => setPage(0)}>
            <Text
              style={[
                styles.tabText,
                page === 0 && styles.tabTextActive,
              ]}>
              Outward
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              page === 1 && styles.tabButtonActive,
            ]}
            onPress={() => setPage(1)}>
            <Text
              style={[
                styles.tabText,
                page === 1 && styles.tabTextActive,
              ]}>
              Inward
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.screenTitle}>Loan Overview</Text>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading analytics...</Text>
          </View>
        ) : page === 0 ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Outward - Loans Given</Text>
            <Text style={styles.sectionSubtitle}>
              Summary of all loans you have given to others
            </Text>

            <DonutChart
              data={[
                {
                  label: 'Accepted',
                  value: outwardStats.acceptedAmount,
                  color: '#22c55e',
                },
                {
                  label: 'Rejected',
                  value: outwardStats.rejectedAmount,
                  color: '#ef4444',
                },
                {
                  label: 'Pending',
                  value: outwardStats.pendingAcceptanceAmount,
                  color: '#f59e0b',
                },
              ]}
              radius={m(70)}
              innerRadius={m(45)}
              centerLabel={formatCurrency(outwardStats.totalGiven)}
              centerSubLabel="Total Given"
            />

            <View style={styles.rowsContainer}>
              <AnalyticsRow
                label="Total amount offered (all statuses)"
                amount={outwardStats.totalGiven}
                color="#6366f1"
              />
              <AnalyticsRow
                label="Accepted amount"
                amount={outwardStats.acceptedAmount}
                color="#22c55e"
              />
              <AnalyticsRow
                label="Rejected amount"
                amount={outwardStats.rejectedAmount}
                color="#ef4444"
              />
              <AnalyticsRow
                label="Pending approval amount"
                amount={outwardStats.pendingAcceptanceAmount}
                color="#f59e0b"
              />
            </View>

            <View style={styles.subSectionDivider} />

            <Text style={styles.subSectionTitle}>Repayment status</Text>
            <DonutChart
              data={[
                {
                  label: 'Paid back',
                  value: outwardStats.paidBackAmount,
                  color: '#22c55e',
                },
                {
                  label: 'Not yet paid',
                  value: outwardStats.notPaidAmount,
                  color: '#f97316',
                },
              ]}
              radius={m(60)}
              innerRadius={m(40)}
              centerLabel={formatCurrency(outwardStats.paidBackAmount)}
              centerSubLabel="Paid back"
            />
            <View style={styles.rowsContainer}>
              <AnalyticsRow
                label="Paid back amount"
                amount={outwardStats.paidBackAmount}
                color="#22c55e"
              />
              <AnalyticsRow
                label="Not yet paid amount"
                amount={outwardStats.notPaidAmount}
                color="#f97316"
              />
            </View>
          </View>
        ) : (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Inward - Loans Taken</Text>
            <Text style={styles.sectionSubtitle}>
              Summary of all loans you have taken from others
            </Text>

            <DonutChart
              data={[
                {
                  label: 'Accepted',
                  value: inwardStats.acceptedAmount,
                  color: '#22c55e',
                },
                {
                  label: 'Rejected',
                  value: inwardStats.rejectedAmount,
                  color: '#ef4444',
                },
                {
                  label: 'Pending',
                  value: inwardStats.pendingAcceptanceAmount,
                  color: '#f59e0b',
                },
              ]}
              radius={m(70)}
              innerRadius={m(45)}
              centerLabel={formatCurrency(inwardStats.totalTaken)}
              centerSubLabel="Total Taken"
            />

            <View style={styles.rowsContainer}>
              <AnalyticsRow
                label="Total amount requested (all statuses)"
                amount={inwardStats.totalTaken}
                color="#6366f1"
              />
              <AnalyticsRow
                label="Accepted amount"
                amount={inwardStats.acceptedAmount}
                color="#22c55e"
              />
              <AnalyticsRow
                label="Rejected amount"
                amount={inwardStats.rejectedAmount}
                color="#ef4444"
              />
              <AnalyticsRow
                label="Pending approval amount"
                amount={inwardStats.pendingAcceptanceAmount}
                color="#f59e0b"
              />
            </View>

            <View style={styles.subSectionDivider} />

            <Text style={styles.subSectionTitle}>Repayment status</Text>
            <DonutChart
              data={[
                {
                  label: 'Paid amount',
                  value: inwardStats.paidAmount,
                  color: '#22c55e',
                },
                {
                  label: 'Pending to pay',
                  value: inwardStats.pendingRepayAmount,
                  color: '#f97316',
                },
              ]}
              radius={m(60)}
              innerRadius={m(40)}
              centerLabel={formatCurrency(inwardStats.paidAmount)}
              centerSubLabel="Paid"
            />
            <View style={styles.rowsContainer}>
              <AnalyticsRow
                label="Paid amount"
                amount={inwardStats.paidAmount}
                color="#22c55e"
              />
              <AnalyticsRow
                label="Pending amount to give back"
                amount={inwardStats.pendingRepayAmount}
                color="#f97316"
              />
            </View>
          </View>
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
    paddingBottom: m(24),
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: m(20),
    padding: m(4),
    marginTop: m(16),
    alignSelf: 'center',
  },
  tabButton: {
    flex: 1,
    paddingVertical: m(8),
    borderRadius: m(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#ff7900',
  },
  tabText: {
    fontSize: m(13),
    fontFamily: 'Poppins-SemiBold',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#ffffff',
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
    padding: m(16),
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
    marginBottom: m(12),
  },
  rowsContainer: {
    marginTop: m(10),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: m(6),
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: m(8),
  },
  dot: {
    width: m(8),
    height: m(8),
    borderRadius: m(4),
    marginRight: m(8),
  },
  rowLabel: {
    fontSize: m(13),
    fontFamily: 'Poppins-Medium',
    color: '#374151',
    flexShrink: 1,
  },
  rowValue: {
    fontSize: m(13),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
  },
  progressBarContainer: {
    flexDirection: 'row',
    height: m(12),
    borderRadius: m(8),
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
    marginTop: m(10),
  },
  progressSegment: {
    height: '100%',
  },
  progressBarEmpty: {
    height: m(32),
    borderRadius: m(8),
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: m(10),
  },
  progressBarEmptyText: {
    fontSize: m(12),
    fontFamily: 'Poppins-Regular',
    color: '#9ca3af',
  },
  subSectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e7eb',
    marginVertical: m(12),
  },
  subSectionTitle: {
    fontSize: m(14),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: m(4),
  },
});