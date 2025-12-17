import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';

const { width } = Dimensions.get('window');

export default function Revenue() {
  // Static revenue data
  const revenueData = [
    { month: 'January', amount: 125000, loans: 45, growth: '+8%' },
    { month: 'February', amount: 142000, loans: 52, growth: '+13.6%' },
    { month: 'March', amount: 158000, loans: 58, growth: '+11.3%' },
    { month: 'April', amount: 165000, loans: 61, growth: '+4.4%' },
    { month: 'May', amount: 178000, loans: 65, growth: '+7.9%' },
    { month: 'June', amount: 192000, loans: 70, growth: '+7.9%' },
  ];

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.amount, 0);
  const totalLoans = revenueData.reduce((sum, item) => sum + item.loans, 0);
  const avgRevenue = Math.round(totalRevenue / revenueData.length);
  const maxAmount = Math.max(...revenueData.map(item => item.amount));

  return (
    <View style={styles.container}>
      <Header title="Revenue Report" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Icon name="dollar-sign" size={24} color="#4CAF50" />
            <Text style={styles.summaryLabel}>Total Revenue</Text>
            <Text style={styles.summaryValue}>
              ₹{totalRevenue.toLocaleString()}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Icon name="file-text" size={24} color="#2196F3" />
            <Text style={styles.summaryLabel}>Total Loans</Text>
            <Text style={styles.summaryValue}>{totalLoans}</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Icon name="trending-up" size={24} color="#FF9800" />
            <Text style={styles.summaryLabel}>Avg. Revenue</Text>
            <Text style={styles.summaryValue}>₹{avgRevenue.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Icon name="bar-chart-2" size={24} color="#9C27B0" />
            <Text style={styles.summaryLabel}>Peak Month</Text>
            <Text style={styles.summaryValue}>₹{maxAmount.toLocaleString()}</Text>
          </View>
        </View>

        {/* Monthly Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
          {revenueData.map((item, index) => {
            const percentage = (item.amount / maxAmount) * 100;
            return (
              <View key={index} style={styles.monthCard}>
                <View style={styles.monthHeader}>
                  <Text style={styles.monthName}>{item.month}</Text>
                  <View style={styles.growthBadge}>
                    <Text style={styles.growthText}>{item.growth}</Text>
                  </View>
                </View>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        width: `${percentage}%`,
                        backgroundColor: '#ff6700',
                      },
                    ]}
                  />
                </View>
                <View style={styles.monthDetails}>
                  <View style={styles.monthDetailItem}>
                    <Icon name="dollar-sign" size={16} color="#4CAF50" />
                    <Text style={styles.monthAmount}>
                      ₹{item.amount.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.monthDetailItem}>
                    <Icon name="file-text" size={16} color="#2196F3" />
                    <Text style={styles.monthLoans}>{item.loans} Loans</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: m(20),
    paddingBottom: m(100),
  },
  summaryRow: {
    flexDirection: 'row',
    gap: m(12),
    marginBottom: m(12),
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: m(12),
    padding: m(16),
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryLabel: {
    fontSize: m(12),
    color: '#666',
    marginTop: m(8),
    marginBottom: m(4),
  },
  summaryValue: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#333',
  },
  section: {
    marginTop: m(20),
  },
  sectionTitle: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#333',
    marginBottom: m(16),
  },
  monthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(12),
    padding: m(16),
    marginBottom: m(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(12),
  },
  monthName: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#333',
  },
  growthBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(8),
  },
  growthText: {
    fontSize: m(12),
    fontWeight: '600',
    color: '#4CAF50',
  },
  barContainer: {
    height: m(8),
    backgroundColor: '#F5F5F5',
    borderRadius: m(4),
    marginBottom: m(12),
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: m(4),
  },
  monthDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  monthAmount: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#333',
  },
  monthLoans: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#333',
  },
});



