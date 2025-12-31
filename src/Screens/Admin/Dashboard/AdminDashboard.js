import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import { getRevenueStatistics } from '../../../Redux/Slices/adminRevenueSlice';
import { getAdminRecentActivities } from '../../../Redux/Slices/adminActivitiesSlice';

const formatCurrency = value => {
  if (!value) return '₹0';
  const num = Number(value) || 0;
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export default function AdminDashboard() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const { revenueData, loading: revenueLoading } = useSelector(
    state => state.adminRevenue,
  );
  const { activities: recentActivities, loading: activitiesLoading } = useSelector(
    state => state.adminActivities,
  );

  useEffect(() => {
    // Fetch revenue statistics for dashboard (summary only)
    dispatch(getRevenueStatistics({ groupBy: 'all' }));
    // Fetch recent activities
    dispatch(getAdminRecentActivities({ limit: 10 }));
  }, [dispatch]);

  const summary = revenueData?.summary || {};
  const revenueByMonth = revenueData?.revenueByMonth || [];

  // Calculate growth rate (compare last 2 months if available)
  const calculateGrowthRate = () => {
    if (revenueByMonth.length < 2) return null;
    const lastMonth = revenueByMonth[revenueByMonth.length - 1]?.totalRevenue || 0;
    const prevMonth = revenueByMonth[revenueByMonth.length - 2]?.totalRevenue || 0;
    if (prevMonth === 0) return null;
    const growth = ((lastMonth - prevMonth) / prevMonth) * 100;
    return growth > 0 ? `+${growth.toFixed(1)}%` : `${growth.toFixed(1)}%`;
  };

  const growthRate = calculateGrowthRate();
  const totalRevenue = summary.totalRevenue || 0;
  const avgRevenue = summary.averageRevenuePerPurchase || 0;

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
      title: 'Lender List',
      icon: 'users',
      screen: 'Lenders',
      gradient: ['#96CEB4', '#AEDCC1'],
      iconBg: 'rgba(150, 206, 180, 0.15)',
    },
  ];

  // Helper function to get activity icon and colors based on type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'subscription_purchased':
        return { name: 'shopping-cart', color: '#4CAF50', bg: 'rgba(76, 175, 80, 0.15)' };
      case 'plan_updated':
        return { name: 'edit', color: '#2196F3', bg: 'rgba(33, 150, 243, 0.15)' };
      case 'plan_created':
        return { name: 'plus-circle', color: '#FF9800', bg: 'rgba(255, 152, 0, 0.15)' };
      default:
        return { name: 'activity', color: '#666', bg: 'rgba(102, 102, 102, 0.15)' };
    }
  };

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

  const renderActivityItem = ({ item }) => {
    const iconInfo = getActivityIcon(item.type);
    return (
      <View style={styles.activityItem}>
        <View style={[styles.activityIcon, { backgroundColor: iconInfo.bg }]}>
          <Icon name={iconInfo.name} size={18} color={iconInfo.color} />
        </View>
        <View style={styles.activityContent}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>{item.shortMessage || item.type}</Text>
            <Text style={styles.activityTime}>{item.relativeTime || 'N/A'}</Text>
          </View>
          <Text style={styles.activityDescription}>{item.message || ''}</Text>
        </View>
      </View>
    );
  };

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
              <Image
                source={{ uri: user?.profileImage }}
                style={{ height: 55, width: 55, borderRadius: 28 }}
              />
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
          {false ? (
            <View style={[styles.revenueCard, styles.loadingCard]}>
              <ActivityIndicator size="large" color="#ff6700" />
              <Text style={styles.loadingText}>Loading revenue data...</Text>
            </View>
          ) : (
            <LinearGradient
              colors={['#f8f9ff', '#ffffff']}
              style={styles.revenueCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              <View style={styles.revenueHeader}>
                <View>
                  <Text style={styles.revenueTotalLabel}>Total Revenue</Text>
                  <Text style={styles.revenueTotalAmount}>
                    {formatCurrency(totalRevenue)}
                  </Text>
                </View>
                {growthRate && (
                  <View
                    style={[
                      styles.growthBadge,
                      growthRate.startsWith('-') && styles.growthBadgeNegative,
                    ]}>
                    <Icon
                      name={growthRate.startsWith('+') ? 'trending-up' : 'trending-down'}
                      size={14}
                      color={growthRate.startsWith('+') ? '#4CAF50' : '#F44336'}
                    />
                    <Text
                      style={[
                        styles.growthText,
                        growthRate.startsWith('-') && styles.growthTextNegative,
                      ]}>
                      {growthRate}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.revenueDetails}>
                <View style={styles.revenueDetailItem}>
                  <Text style={styles.revenueDetailLabel}>Total Purchases</Text>
                  <Text style={styles.revenueDetailValue}>
                    {summary.totalPurchases || 0}
                  </Text>
                </View>
                <View style={styles.revenueDivider} />
                <View style={styles.revenueDetailItem}>
                  <Text style={styles.revenueDetailLabel}>Avg. Per Purchase</Text>
                  <Text style={styles.revenueDetailValue}>
                    {formatCurrency(avgRevenue)}
                  </Text>
                </View>
                <View style={styles.revenueDivider} />
                <View style={styles.revenueDetailItem}>
                  <Text style={styles.revenueDetailLabel}>Active Plans</Text>
                  <Text style={[styles.revenueDetailValue, { color: '#4CAF50' }]}>
                    {summary.activePlansCount || 0}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          )}
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
            {activitiesLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#ff6700" />
                <Text style={styles.loadingText}>Loading activities...</Text>
              </View>
            ) : recentActivities.length > 0 ? (
              <FlatList
                data={recentActivities}
                renderItem={renderActivityItem}
                keyExtractor={(item, index) => item._id || item.id || index.toString()}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No recent activities</Text>
              </View>
            )}
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
    width: m(55),
    height: m(55),
    borderRadius: m(28),
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
    elevation: 2,
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
  growthBadgeNegative: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  growthText: {
    fontSize: m(12),
    color: '#4CAF50',
    fontWeight: '700',
    marginLeft: m(4),
  },
  growthTextNegative: {
    color: '#F44336',
  },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(40),
  },
  loadingText: {
    marginTop: m(12),
    fontSize: m(14),
    color: '#666',
    textAlign: 'center',
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
  loadingContainer: {
    padding: m(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: m(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: m(14),
    color: '#94a3b8',
  },
});