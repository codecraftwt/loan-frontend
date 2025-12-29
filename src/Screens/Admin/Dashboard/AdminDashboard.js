import React from 'react';
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
  const avgRevenue = Math.round(totalRevenue / revenueData.length);
  const growthRate = '+12.5%';

  const quickActions = [
    {
      id: 1,
      title: 'Add Plan',
      icon: 'plus-circle',
      screen: 'CreateEditPlan',
      gradient: ['#FF6B6B', '#FF8E8E'],
      iconBg: 'rgba(255, 107, 107, 0.15)',
    },
    {
      id: 2,
      title: 'Edit Plan',
      icon: 'edit-2',
      screen: 'Plans',
      gradient: ['#4ECDC4', '#6AE0D8'],
      iconBg: 'rgba(78, 205, 196, 0.15)',
    },
    {
      id: 3,
      title: 'Revenue',
      icon: 'bar-chart-2',
      screen: 'Revenue',
      gradient: ['#45B7D1', '#67C9E0'],
      iconBg: 'rgba(69, 183, 209, 0.15)',
    },
    {
      id: 4,
      title: 'Lender List',
      icon: 'users',
      screen: 'Lenders',
      gradient: ['#96CEB4', '#AEDCC1'],
      iconBg: 'rgba(150, 206, 180, 0.15)',
    },
  ];

  const recentActivities = [
    {
      id: 1,
      title: 'New Lender Added',
      description: 'John Doe joined as new lender',
      time: '2 hours ago',
      icon: 'user-plus',
      iconColor: '#4CAF50',
      iconBg: 'rgba(76, 175, 80, 0.15)',
    },
    {
      id: 2,
      title: 'Plan Updated',
      description: 'Business Loan plan modified',
      time: '5 hours ago',
      icon: 'edit',
      iconColor: '#2196F3',
      iconBg: 'rgba(33, 150, 243, 0.15)',
    },
    {
      id: 3,
      title: 'Revenue Report',
      description: 'June revenue report generated',
      time: '1 day ago',
      icon: 'dollar-sign',
      iconColor: '#FF9800',
      iconBg: 'rgba(255, 152, 0, 0.15)',
    },
  ];

  const renderQuickAction = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.actionCard,
        index % 2 === 0 ? { marginRight: m(8) } : { marginLeft: m(8) },
      ]}
      onPress={() => navigation.navigate(item.screen)}
      activeOpacity={0.9}>
      <LinearGradient
        colors={item.gradient}
        style={styles.actionGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <View style={[styles.actionIconContainer, { backgroundColor: item.iconBg }]}>
          <Icon name={item.icon} size={28} color="#FFFFFF" />
        </View>
        <Text style={styles.actionTitle}>{item.title}</Text>
        <View style={styles.actionArrow}>
          <Icon name="arrow-right" size={16} color="#FFFFFF" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderActivityItem = ({ item }) => (
    <View style={styles.activityItem}>
      <View style={[styles.activityIcon, { backgroundColor: item.iconBg }]}>
        <Icon name={item.icon} size={18} color={item.iconColor} />
      </View>
      <View style={styles.activityContent}>
        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle}>{item.title}</Text>
          <Text style={styles.activityTime}>{item.time}</Text>
        </View>
        <Text style={styles.activityDescription}>{item.description}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Admin Dashboard" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Welcome Section */}
        <LinearGradient
          colors={['#000000', '#696666ff']}
          style={styles.welcomeSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}>
          <View style={styles.welcomeContent}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.userName || 'Admin'}</Text>
            </View>
            <View style={styles.avatarContainer}>
              <Icon name="user" size={24} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.welcomeSubtitle}>Manage your Subscriptions</Text>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <TouchableOpacity>
              <Text style={styles.sectionSubtitle}>Manage everything</Text>
            </TouchableOpacity>
          </View>
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
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('Revenue')}>
              <Text style={styles.viewAllText}>View Details</Text>
              <Icon name="chevron-right" size={16} color="#667eea" />
            </TouchableOpacity>
          </View>
          <LinearGradient
            colors={['#f8f9ff', '#ffffff']}
            style={styles.revenueCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <View style={styles.revenueHeader}>
              <View>
                <Text style={styles.revenueTotalLabel}>Total Revenue</Text>
                <Text style={styles.revenueTotalAmount}>₹{totalRevenue.toLocaleString()}</Text>
              </View>
              <View style={styles.growthBadge}>
                <Icon name="trending-up" size={14} color="#4CAF50" />
                <Text style={styles.growthText}>{growthRate}</Text>
              </View>
            </View>
            <View style={styles.revenueDetails}>
              <View style={styles.revenueDetailItem}>
                <Text style={styles.revenueDetailLabel}>Monthly Average</Text>
                <Text style={styles.revenueDetailValue}>₹{avgRevenue.toLocaleString()}</Text>
              </View>
              <View style={styles.revenueDivider} />
            </View>
          </LinearGradient>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.activityCard}>
            <FlatList
              data={recentActivities}
              renderItem={renderActivityItem}
              keyExtractor={item => item.id.toString()}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: m(120),
  },
  welcomeSection: {
    padding: m(24),
    marginHorizontal: m(16),
    marginTop: m(16),
    borderRadius: m(20),
    elevation: 8,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  welcomeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(8),
  },
  welcomeText: {
    fontSize: m(14),
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'System',
  },
  userName: {
    fontSize: m(24),
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: m(2),
  },
  welcomeSubtitle: {
    fontSize: m(13),
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'System',
  },
  avatarContainer: {
    width: m(48),
    height: m(48),
    borderRadius: m(24),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  section: {
    paddingHorizontal: m(16),
    marginTop: m(24),
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
    color: '#1e293b',
    fontFamily: 'System',
  },
  sectionSubtitle: {
    fontSize: m(13),
    color: '#64748b',
    fontWeight: '500',
  },
  actionsGrid: {
    gap: m(16),
  },
  actionCard: {
    flex: 1,
    height: m(120),
    borderRadius: m(20),
    overflow: 'hidden',
  },
  actionGradient: {
    flex: 1,
    padding: m(20),
    justifyContent: 'space-between',
  },
  actionIconContainer: {
    width: m(48),
    height: m(48),
    borderRadius: m(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: m(12),
  },
  actionTitle: {
    fontSize: m(15),
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  actionArrow: {
    position: 'absolute',
    bottom: m(16),
    right: m(16),
    width: m(28),
    height: m(28),
    borderRadius: m(14),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  revenueCard: {
    borderRadius: m(20),
    padding: m(20),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderWidth: m(1),
    borderColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: m(14),
  },
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: m(20),
  },
  revenueTotalLabel: {
    fontSize: m(13),
    color: '#64748b',
    fontWeight: '500',
    marginBottom: m(4),
  },
  revenueTotalAmount: {
    fontSize: m(28),
    fontWeight: '800',
    color: '#1e293b',
    fontFamily: 'System',
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    borderRadius: m(20),
  },
  growthText: {
    fontSize: m(12),
    color: '#4CAF50',
    fontWeight: '700',
    marginLeft: m(4),
  },
  revenueDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  revenueDetailItem: {
    flex: 1,
  },
  revenueDetailLabel: {
    fontSize: m(12),
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: m(4),
  },
  revenueDetailValue: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#1e293b',
  },
  revenueDivider: {
    width: 1,
    height: m(40),
    backgroundColor: '#e2e8f0',
    marginHorizontal: m(20),
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: m(13),
    color: '#667eea',
    fontWeight: '600',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(20),
    padding: m(4),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: m(16),
  },
  activityIcon: {
    width: m(40),
    height: m(40),
    borderRadius: m(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(16),
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(4),
  },
  activityTitle: {
    fontSize: m(15),
    fontWeight: '600',
    color: '#1e293b',
  },
  activityTime: {
    fontSize: m(12),
    color: '#94a3b8',
    fontWeight: '500',
  },
  activityDescription: {
    fontSize: m(13),
    color: '#64748b',
  },
  separator: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: m(16),
  },
});