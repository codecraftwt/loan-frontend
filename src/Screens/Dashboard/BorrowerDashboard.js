import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import { m } from 'walstar-rn-responsive';
import Header from '../../Components/Header';

export default function BorrowerDashboard() {
  const navigation = useNavigation();
  const user = useSelector(state => state.auth.user);

  // Static data
  const loanPlans = [
    {
      id: 1,
      name: 'Personal Loan Basic',
      interestRate: 12.5,
      minAmount: 10000,
      maxAmount: 500000,
      duration: '12-36 months',
    },
    {
      id: 2,
      name: 'Personal Loan Premium',
      interestRate: 11.5,
      minAmount: 50000,
      maxAmount: 1000000,
      duration: '12-48 months',
    },
    {
      id: 3,
      name: 'Quick Loan',
      interestRate: 13.5,
      minAmount: 5000,
      maxAmount: 100000,
      duration: '6-24 months',
    },
  ];

  const myLoans = [
    {
      id: 1,
      planName: 'Personal Loan Basic',
      amount: 50000,
      status: 'Active',
      dueDate: '2024-07-15',
      remainingAmount: 35000,
    },
    {
      id: 2,
      planName: 'Quick Loan',
      amount: 25000,
      status: 'Pending',
      dueDate: '2024-08-20',
      remainingAmount: 25000,
    },
  ];

  const quickActions = [
    {
      id: 1,
      title: 'Apply for Loan',
      icon: 'file-plus',
      screen: 'LoanRequest',
      color: '#ff6700',
    },
    {
      id: 2,
      title: 'My Loans',
      icon: 'file-text',
      screen: 'MyLoans',
      color: '#2196F3',
    },
    {
      id: 3,
      title: 'Loan History',
      icon: 'clock',
      screen: 'LoanHistory',
      color: '#4CAF50',
    },
  ];

  const renderLoanPlan = ({ item }) => (
    <TouchableOpacity
      style={styles.planCard}
      onPress={() => navigation.navigate('LoanRequest', { plan: item })}>
      <View style={styles.planHeader}>
        <Text style={styles.planName}>{item.name}</Text>
        <View style={styles.interestBadge}>
          <Text style={styles.interestText}>{item.interestRate}%</Text>
        </View>
      </View>
      <View style={styles.planDetails}>
        <View style={styles.planDetailItem}>
          <Icon name="dollar-sign" size={16} color="#666" />
          <Text style={styles.planDetailText}>
            ₹{item.minAmount.toLocaleString()} - ₹{item.maxAmount.toLocaleString()}
          </Text>
        </View>
        <View style={styles.planDetailItem}>
          <Icon name="calendar" size={16} color="#666" />
          <Text style={styles.planDetailText}>{item.duration}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.applyButton}>
        <Text style={styles.applyButtonText}>Apply Now</Text>
        <Icon name="arrow-right" size={16} color="#ff6700" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderMyLoan = ({ item }) => (
    <TouchableOpacity
      style={styles.loanCard}
      onPress={() => navigation.navigate('LoanDetailScreen', { loan: item })}>
      <View style={styles.loanHeader}>
        <View>
          <Text style={styles.loanPlanName}>{item.planName}</Text>
          <Text style={styles.loanAmount}>₹{item.amount.toLocaleString()}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === 'Active' ? '#E8F5E9' : '#FFF3E0',
            },
          ]}>
          <Text
            style={[
              styles.statusText,
              {
                color: item.status === 'Active' ? '#4CAF50' : '#FF9800',
              },
            ]}>
            {item.status}
          </Text>
        </View>
      </View>
      <View style={styles.loanProgress}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${((item.amount - item.remainingAmount) / item.amount) * 100}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          Remaining: ₹{item.remainingAmount.toLocaleString()}
        </Text>
      </View>
      <View style={styles.loanFooter}>
        <View style={styles.loanFooterItem}>
          <Icon name="calendar" size={14} color="#666" />
          <Text style={styles.loanFooterText}>
            Due: {new Date(item.dueDate).toLocaleDateString()}
          </Text>
        </View>
        <Icon name="chevron-right" size={20} color="#666" />
      </View>
    </TouchableOpacity>
  );

  const totalActiveLoans = myLoans.filter(l => l.status === 'Active').length;
  const totalLoanAmount = myLoans.reduce((sum, loan) => sum + loan.amount, 0);

  return (
    <View style={styles.container}>
      <Header title="Borrower Dashboard" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.userName || 'Borrower'}</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map(action => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={() => navigation.navigate(action.screen)}>
                <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                  <Icon name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Loan Overview</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Icon name="file-text" size={24} color="#2196F3" />
              <Text style={styles.statValue}>{totalActiveLoans}</Text>
              <Text style={styles.statLabel}>Active Loans</Text>
            </View>
            <View style={styles.statCard}>
              <Icon name="dollar-sign" size={24} color="#4CAF50" />
              <Text style={styles.statValue}>
                ₹{(totalLoanAmount / 1000).toFixed(0)}K
              </Text>
              <Text style={styles.statLabel}>Total Borrowed</Text>
            </View>
            <View style={styles.statCard}>
              <Icon name="check-circle" size={24} color="#FF9800" />
              <Text style={styles.statValue}>
                ₹{(
                  myLoans.reduce(
                    (sum, loan) => sum + loan.remainingAmount,
                    0,
                  ) / 1000
                ).toFixed(0)}K
              </Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
          </View>
        </View>

        {/* My Loans */}
        {myLoans.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Loans</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MyLoans')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={myLoans}
              renderItem={renderMyLoan}
              keyExtractor={item => item.id.toString()}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Available Loan Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Loan Plans</Text>
          <FlatList
            data={loanPlans}
            renderItem={renderLoanPlan}
            keyExtractor={item => item.id.toString()}
            scrollEnabled={false}
          />
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
    paddingBottom: m(100),
  },
  welcomeSection: {
    padding: m(20),
    backgroundColor: '#FFFFFF',
    marginBottom: m(10),
  },
  welcomeText: {
    fontSize: m(16),
    color: '#666',
  },
  userName: {
    fontSize: m(24),
    fontWeight: '700',
    color: '#ff6700',
    marginTop: m(4),
  },
  section: {
    padding: m(20),
    backgroundColor: '#FFFFFF',
    marginTop: m(10),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(16),
  },
  sectionTitle: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#333',
    marginBottom: m(16),
  },
  viewAllText: {
    fontSize: m(14),
    color: '#ff6700',
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: m(12),
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    padding: m(16),
    backgroundColor: '#F5F5F5',
    borderRadius: m(12),
  },
  actionIcon: {
    width: m(50),
    height: m(50),
    borderRadius: m(25),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: m(8),
  },
  actionTitle: {
    fontSize: m(12),
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: m(12),
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: m(16),
    backgroundColor: '#F5F5F5',
    borderRadius: m(12),
  },
  statValue: {
    fontSize: m(20),
    fontWeight: '700',
    color: '#333',
    marginTop: m(8),
    marginBottom: m(4),
  },
  statLabel: {
    fontSize: m(12),
    color: '#666',
  },
  loanCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: m(12),
    padding: m(16),
    marginBottom: m(12),
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: m(12),
  },
  loanPlanName: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#333',
    marginBottom: m(4),
  },
  loanAmount: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#ff6700',
  },
  statusBadge: {
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(12),
  },
  statusText: {
    fontSize: m(12),
    fontWeight: '600',
  },
  loanProgress: {
    marginBottom: m(12),
  },
  progressBar: {
    height: m(8),
    backgroundColor: '#E0E0E0',
    borderRadius: m(4),
    marginBottom: m(8),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: m(4),
  },
  progressText: {
    fontSize: m(12),
    color: '#666',
  },
  loanFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loanFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  loanFooterText: {
    fontSize: m(12),
    color: '#666',
  },
  planCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: m(12),
    padding: m(16),
    marginBottom: m(12),
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(12),
  },
  planName: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  interestBadge: {
    backgroundColor: '#ff6700',
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(12),
  },
  interestText: {
    fontSize: m(14),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  planDetails: {
    marginBottom: m(12),
  },
  planDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    marginBottom: m(8),
  },
  planDetailText: {
    fontSize: m(14),
    color: '#666',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(12),
    borderWidth: 1,
    borderColor: '#ff6700',
    borderRadius: m(8),
    gap: m(8),
  },
  applyButtonText: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#ff6700',
  },
});

