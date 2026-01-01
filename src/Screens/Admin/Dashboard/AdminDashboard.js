import React, { useEffect, useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import { getRevenueStatistics } from '../../../Redux/Slices/adminRevenueSlice';
import { getAdminRecentActivities } from '../../../Redux/Slices/adminActivitiesSlice';

/**
 * Format currency value to Indian Rupee format
 * @param {number} value - The amount to format
 * @returns {string} Formatted currency string
 */
const formatCurrency = value => {
  if (!value) return '₹0';
  const num = Number(value) || 0;
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export default function AdminDashboard() {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  // Redux state selectors
  const user = useSelector(state => state.auth.user);
  const { revenueData, loading: revenueLoading } = useSelector(
    state => state.adminRevenue,
  );
  const { activities: recentActivities, loading: activitiesLoading } = useSelector(
    state => state.adminActivities,
  );

  // State for avatar image error handling
  const [avatarError, setAvatarError] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    dispatch(getRevenueStatistics({ groupBy: 'all' }));
    dispatch(getAdminRecentActivities({ limit: 10 }));
  }, [dispatch]);

  // Reset avatar error when profile image changes
  useEffect(() => {
    setAvatarError(false);
  }, [user?.profileImage]);

  // Memoized revenue calculations
  const revenueSummary = useMemo(() => {
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

    return {
      totalRevenue: summary.totalRevenue || 0,
      avgRevenue: summary.averageRevenuePerPurchase || 0,
      totalPurchases: summary.totalPurchases || 0,
      activePlans: summary.activePlansCount || 0,
      growthRate: calculateGrowthRate(),
    };
  }, [revenueData]);

  // Quick actions configuration
  const quickActions = useMemo(
    () => [
      {
        id: 1,
        title: 'Add Plan',
        icon: 'plus-circle',
        screen: 'CreateEditPlan',
        gradient: ['#96CEB4', '#AEDCC1'],
        iconBg: 'rgba(255, 255, 255, 0.22)',
      },
      {
        id: 2,
        title: 'Lender List',
        icon: 'users',
        screen: 'Lenders',
        gradient: ['#FF6B6B', '#FF8E8E'],
        iconBg: 'rgba(255, 255, 255, 0.22)',
      },
    ],
    [],
  );

  /**
   * Get activity icon and colors based on activity type
   * @param {string} type - Activity type
   * @returns {Object} Icon configuration with name, color, and background
   */
  const getActivityIcon = useCallback((type) => {
    const iconMap = {
      subscription_purchased: {
        name: 'shopping-cart',
        color: '#4CAF50',
        bg: 'rgba(76, 175, 80, 0.15)',
      },
      plan_updated: {
        name: 'edit',
        color: '#2196F3',
        bg: 'rgba(33, 150, 243, 0.15)',
      },
      plan_created: {
        name: 'plus-circle',
        color: '#FF9800',
        bg: 'rgba(255, 152, 0, 0.15)',
      },
    };

    return iconMap[type] || {
      name: 'activity',
      color: '#666',
      bg: 'rgba(102, 102, 102, 0.15)',
    };
  }, []);

  /**
   * Render quick action card
   */
  const renderQuickAction = useCallback(
    ({ item, index }) => (
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
    ),
    [navigation],
  );

  // Render activity item

  const renderActivityItem = useCallback(
    ({ item }) => {
      const iconInfo = getActivityIcon(item.type);
      return (
        <View style={styles.activityItem}>
          <View style={[styles.activityIcon, { backgroundColor: iconInfo.bg }]}>
            <Icon name={iconInfo.name} size={18} color={iconInfo.color} />
          </View>
          <View style={styles.activityContent}>
            <View style={styles.activityHeader}>
              <Text style={styles.activityTitle} numberOfLines={1}>
                {item.shortMessage || item.type}
              </Text>
              <Text style={styles.activityTime}>{item.relativeTime || 'N/A'}</Text>
            </View>
            <Text style={styles.activityDescription} numberOfLines={2}>
              {item.message || ''}
            </Text>
          </View>
        </View>
      );
    },
    [getActivityIcon],
  );


  // Get user avatar - fallback to icon if no image or image fails to load
  const renderAvatar = useCallback(() => {
    if (user?.profileImage && !avatarError) {
      return (
        <Image
          source={{ uri: user.profileImage }}
          style={styles.avatarImage}
          resizeMode="cover"
          onError={() => {
            setAvatarError(true);
          }}
        />
      );
    }
    return (
      <View style={styles.avatarPlaceholder}>
        <Icon name="user" size={24} color="#FFFFFF" />
      </View>
    );
  }, [user?.profileImage, avatarError]);

  return (
    <View style={styles.container}>
      <Header title="Admin Dashboard" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={styles.welcomeSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}>
          <View style={styles.welcomeContent}>
            <View style={styles.welcomeTextContainer}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.userName || 'Admin'}</Text>
            </View>
            <View style={styles.avatarContainer}>{renderAvatar()}</View>
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
              onPress={() => navigation.navigate('Revenue')}
              activeOpacity={0.7}>
              <Text style={styles.viewAllText}>View Details</Text>
              <Icon name="chevron-right" size={16} color="#667eea" />
            </TouchableOpacity>
          </View>
          {revenueLoading ? (
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
                <View style={styles.container1}>
                  <View style={styles.labelContainer}>
                    <Text style={styles.revenueTotalLabel}>Total Revenue</Text>
                    <Text style={styles.revenueTotalAmount}>
                      {formatCurrency(revenueSummary.totalRevenue)}
                    </Text>
                  </View>
                  <Icon name="trending-up" size={30} color="orange" style={styles.icon} />
                </View>

                {revenueSummary.growthRate && (
                  <View
                    style={[
                      styles.growthBadge,
                      revenueSummary.growthRate.startsWith('-') &&
                      styles.growthBadgeNegative,
                    ]}>
                    <Icon
                      name={
                        revenueSummary.growthRate.startsWith('+')
                          ? 'trending-up'
                          : 'trending-down'
                      }
                      size={14}
                      color={
                        revenueSummary.growthRate.startsWith('+')
                          ? '#4CAF50'
                          : '#F44336'
                      }
                    />
                    <Text
                      style={[
                        styles.growthText,
                        revenueSummary.growthRate.startsWith('-') &&
                        styles.growthTextNegative,
                      ]}>
                      {revenueSummary.growthRate}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.revenueDetails}>
                <View style={styles.revenueDetailItem}>
                  <Text style={styles.revenueDetailLabel}>Total Purchases</Text>
                  <Text style={styles.revenueDetailValue}>
                    {revenueSummary.totalPurchases}
                  </Text>
                </View>
                <View style={styles.revenueDivider} />
                <View style={styles.revenueDetailItem}>
                  <Text style={styles.revenueDetailLabel}>Avg. Per Purchase</Text>
                  <Text style={styles.revenueDetailValue}>
                    {formatCurrency(revenueSummary.avgRevenue)}
                  </Text>
                </View>
                <View style={styles.revenueDivider} />
                <View style={styles.revenueDetailItem}>
                  <Text style={styles.revenueDetailLabel}>Active Plans</Text>
                  <Text style={[styles.revenueDetailValue, styles.activePlansText]}>
                    {revenueSummary.activePlans}
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
            <TouchableOpacity activeOpacity={0.7}>
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
                keyExtractor={(item, index) =>
                  item._id || item.id || `activity-${index}`
                }
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="inbox" size={48} color="#cbd5e1" />
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
  // Welcome Section Styles
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
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: m(14),
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'System',
    fontWeight: '500',
  },
  userName: {
    fontSize: m(24),
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: m(2),
    letterSpacing: 0.5,
  },
  welcomeSubtitle: {
    fontSize: m(13),
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'System',
    fontWeight: '400',
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: m(28),
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Section Styles
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
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: m(13),
    color: '#64748b',
    fontWeight: '500',
  },
  // Quick Actions Styles
  actionsGrid: {
    gap: m(16),
  },
  actionCard: {
    flex: 1,
    height: m(120),
    borderRadius: m(20),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000000ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
    letterSpacing: 0.3,
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
  // Revenue Card Styles
  revenueCard: {
    borderRadius: m(20),
    padding: m(20),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    borderWidth: m(1),
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: m(20),
  },
  container1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelContainer: {
    flexDirection: 'column',
    marginRight: m(10),
  },
  revenueTotalLabel: {
    fontSize: m(13),
    color: '#64748b',
    fontWeight: '500',
    marginBottom: m(4),
    letterSpacing: 0.2,
  },
  revenueTotalAmount: {
    fontSize: m(28),
    fontWeight: '800',
    color: '#1e293b',
    fontFamily: 'System',
    letterSpacing: 0.5,
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
    letterSpacing: 0.2,
  },
  revenueDetailValue: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#1e293b',
  },
  activePlansText: {
    color: '#4CAF50',
  },
  revenueDivider: {
    width: 1,
    height: m(40),
    backgroundColor: '#e2e8f0',
    marginHorizontal: m(20),
  },
  // Activity Card Styles
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
    flex: 1,
    marginRight: m(8),
  },
  activityTime: {
    fontSize: m(12),
    color: '#94a3b8',
    fontWeight: '500',
  },
  activityDescription: {
    fontSize: m(13),
    color: '#64748b',
    lineHeight: m(18),
  },
  separator: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: m(16),
  },
  // Common Styles
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
  },
  viewAllText: {
    fontSize: m(13),
    color: '#667eea',
    fontWeight: '600',
  },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(40),
    backgroundColor: '#FFFFFF',
    borderRadius: m(20),
  },
  loadingContainer: {
    padding: m(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: m(12),
    fontSize: m(14),
    color: '#666',
    textAlign: 'center',
  },
  emptyContainer: {
    padding: m(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: m(14),
    color: '#94a3b8',
    marginTop: m(12),
    fontWeight: '500',
  },
});
