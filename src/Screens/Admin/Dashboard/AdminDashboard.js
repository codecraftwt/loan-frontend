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
import Header from '../../../Components/Header';

export default function AdminDashboard() {
  const navigation = useNavigation();
  const user = useSelector(state => state.auth.user);

  // Static data for revenue
  const revenueData = [
    { month: 'January', amount: 125000, loans: 45 },
    { month: 'February', amount: 142000, loans: 52 },
    { month: 'March', amount: 158000, loans: 58 },
    { month: 'April', amount: 165000, loans: 61 },
    { month: 'May', amount: 178000, loans: 65 },
    { month: 'June', amount: 192000, loans: 70 },
  ];

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.amount, 0);
  const totalLoans = revenueData.reduce((sum, item) => sum + item.loans, 0);

  const quickActions = [
    {
      id: 1,
      title: 'Add Plan',
      icon: 'plus-circle',
      screen: 'AddPlan',
      color: '#ff6700',
      gradient: ['#ff6700', '#ff7900'],
    },
    {
      id: 2,
      title: 'Edit Plan',
      icon: 'edit',
      screen: 'Plans',
      color: '#4CAF50',
      gradient: ['#4CAF50', '#66BB6A'],
    },
    {
      id: 3,
      title: 'Revenue',
      icon: 'dollar-sign',
      screen: 'Revenue',
      color: '#2196F3',
      gradient: ['#2196F3', '#42A5F5'],
    },
    {
      id: 4,
      title: 'Lender List',
      icon: 'users',
      screen: 'Lenders',
      color: '#9C27B0',
      gradient: ['#9C27B0', '#BA68C8'],
    },
  ];

  const renderQuickAction = ({ item }) => (
    <TouchableOpacity
      style={styles.actionCard}
      onPress={() => navigation.navigate(item.screen)}>
      <LinearGradient
        colors={item.gradient}
        style={styles.actionGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <Icon name={item.icon} size={28} color="#FFFFFF" />
        <Text style={styles.actionTitle}>{item.title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title="Admin Dashboard" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.userName || 'Admin'}</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <FlatList
            data={quickActions}
            renderItem={renderQuickAction}
            keyExtractor={item => item.id.toString()}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={styles.actionsGrid}
          />
        </View>

        {/* Revenue Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Revenue Overview</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Revenue')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.revenueCard}>
            <View style={styles.revenueRow}>
              <View style={styles.revenueItem}>
                <Icon name="dollar-sign" size={24} color="#4CAF50" />
                <Text style={styles.revenueLabel}>Total Revenue</Text>
                <Text style={styles.revenueAmount}>
                  ₹{totalRevenue.toLocaleString()}
                </Text>
              </View>
              <View style={styles.revenueItem}>
                <Icon name="file-text" size={24} color="#2196F3" />
                <Text style={styles.revenueLabel}>Total Loans</Text>
                <Text style={styles.revenueAmount}>{totalLoans}</Text>
              </View>
            </View>
            <View style={styles.revenueRow}>
              <View style={styles.revenueItem}>
                <Icon name="trending-up" size={24} color="#FF9800" />
                <Text style={styles.revenueLabel}>Avg. per Month</Text>
                <Text style={styles.revenueAmount}>
                  ₹{Math.round(totalRevenue / revenueData.length).toLocaleString()}
                </Text>
              </View>
              <View style={styles.revenueItem}>
                <Icon name="percent" size={24} color="#9C27B0" />
                <Text style={styles.revenueLabel}>Growth Rate</Text>
                <Text style={styles.revenueAmount}>+12.5%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Icon name="user-plus" size={20} color="#4CAF50" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>New Lender Added</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#E3F2FD' }]}>
                <Icon name="edit" size={20} color="#2196F3" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Plan Updated</Text>
                <Text style={styles.activityTime}>5 hours ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#FFF3E0' }]}>
                <Icon name="dollar-sign" size={20} color="#FF9800" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Revenue Report Generated</Text>
                <Text style={styles.activityTime}>1 day ago</Text>
              </View>
            </View>
          </View>
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
    gap: m(12),
  },
  actionCard: {
    flex: 1,
    margin: m(6),
    borderRadius: m(12),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionGradient: {
    padding: m(20),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: m(120),
  },
  actionTitle: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: m(8),
    textAlign: 'center',
  },
  revenueCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: m(12),
    padding: m(16),
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: m(16),
  },
  revenueItem: {
    flex: 1,
    alignItems: 'center',
    padding: m(12),
    backgroundColor: '#FFFFFF',
    borderRadius: m(8),
    marginHorizontal: m(4),
  },
  revenueLabel: {
    fontSize: m(12),
    color: '#666',
    marginTop: m(8),
    marginBottom: m(4),
  },
  revenueAmount: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#333',
  },
  activityCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: m(12),
    padding: m(12),
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: m(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  activityIcon: {
    width: m(40),
    height: m(40),
    borderRadius: m(20),
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(12),
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: m(4),
  },
  activityTime: {
    fontSize: m(12),
    color: '#666',
  },
});

