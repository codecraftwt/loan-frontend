import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import { getBorrowerLoans, clearLoans } from '../../../Redux/Slices/borrowerLoanSlice';
import { getBorrowerRecentActivities } from '../../../Redux/Slices/borrowerActivitiesSlice';
import { FontFamily, FontSizes } from '../../../constants';

const formatCurrency = value => {
  if (!value) return '0';
  const num = Number(value) || 0;
  return num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

export default function BorrowerDashboard() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const { loans, summary } = useSelector(state => state.borrowerLoans);
  const { activities: recentActivities, loading: activitiesLoading } = useSelector(
    state => state.borrowerActivities,
  );

  const [showAllActivities, setShowAllActivities] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for cards
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 2000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (user?._id) {
        dispatch(getBorrowerLoans({ borrowerId: user._id }));
        dispatch(getBorrowerRecentActivities({ limit: 5 }));
      }

      // Reset animations
      fadeAnim.setValue(0);
      slideUpAnim.setValue(50);
      scaleAnim.setValue(0.9);

      // Staggered animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideUpAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      return () => {
        dispatch(clearLoans());
      };
    }, [dispatch, user?._id]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    if (user?._id) {
      await Promise.all([
        dispatch(getBorrowerLoans({ borrowerId: user._id })),
        dispatch(getBorrowerRecentActivities({ limit: 5 })),
      ]);
    }
    setRefreshing(false);
  };

  const myLoans = loans.slice(0, 2);

  const quickActions = [
    {
      id: 1,
      title: 'My Loans',
      icon: 'file-text',
      screen: 'MyLoans',
      gradient: ['#2196F3', '#1976D2'],
      description: 'View all loans',
      lightColor: '#BBDEFB',
    },
    {
      id: 2,
      title: 'History',
      icon: 'clock',
      screen: 'BorrowerLoanHistoryScreen',
      gradient: ['#4CAF50', '#388E3C'],
      description: 'Payment history',
      lightColor: '#C8E6C9',
    },
    {
      id: 3,
      title: 'Analytics',
      icon: 'bar-chart-2',
      screen: 'BorrowerAnalyticsScreen',
      gradient: ['#9C27B0', '#7B1FA2'],
      description: 'View insights',
      lightColor: '#E1BEE7',
    },
    {
      id: 4,
      title: 'Settings',
      icon: 'settings',
      screen: 'Settings',
      gradient: ['#FF9800', '#F57C00'],
      description: 'App settings',
      lightColor: '#FFE0B2',
    },
  ];

  // Helper function to get activity icon and color
  const getActivityProperties = (activity) => {
    const activityType = activity.type || '';
    let icon = 'clock';
    let color = '#34495e';
    let gradient = ['#2c3e50', '#34495e'];

    switch (activityType) {
      case 'payment_made':
        icon = 'dollar-sign';
        color = '#4CAF50';
        gradient = ['#4CAF50', '#66BB6A'];
        break;
      case 'loan_paid':
        icon = 'check-circle';
        color = '#10B981';
        gradient = ['#10B981', '#34D399'];
        break;
      case 'loan_accepted':
        icon = 'check-circle';
        color = '#2196F3';
        gradient = ['#2196F3', '#42A5F5'];
        break;
      case 'loan_rejected':
        icon = 'x-circle';
        color = '#EF4444';
        gradient = ['#EF4444', '#F87171'];
        break;
      case 'loan_received':
        icon = 'arrow-down';
        color = '#FF9800';
        gradient = ['#FF9800', '#FFA726'];
        break;
      case 'loan_overdue':
        icon = 'alert-circle';
        color = '#F44336';
        gradient = ['#F44336', '#EF5350'];
        break;
      default:
        icon = 'activity';
        color = '#666';
        gradient = ['#9E9E9E', '#BDBDBD'];
    }
    return { icon, color, gradient };
  };

  const totalActiveLoans = summary.activeLoans || 0;
  const totalLoanAmount = summary.totalAmountBorrowed || 0;
  const totalRemaining = loans
    .filter(loan => loan.paymentStatus !== 'paid')
    .reduce((sum, loan) => sum + (loan.remainingAmount || 0), 0);
  const totalPaid = loans.reduce((sum, loan) => sum + (loan.totalPaid || 0), 0);

  // Calculate completion rate
  const completionRate = totalLoanAmount > 0
    ? Math.min((totalPaid / totalLoanAmount) * 100, 100)
    : 0;

  const renderMyLoan = ({ item }) => (
    <TouchableOpacity
      style={styles.loanCard}
      onPress={() => navigation.navigate('BorrowerLoanDetails', { loan: item })}
      activeOpacity={0.8}>
      <View style={styles.loanCardHeader}>
        <View style={styles.loanCardLeft}>
          <View style={styles.lenderAvatar}>
            <Text style={styles.lenderAvatarText}>
              {(item.lenderId?.userName || 'L').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.welcomeText}>
            <Text style={styles.loanLenderName} numberOfLines={1}>
              {item.lenderId?.userName || 'Unknown Lender'}
            </Text>
            <Text style={styles.loanAmountText}>
              ₹{formatCurrency(item.amount)}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.paymentStatus === 'paid' ? '#ECFDF5' :
                item.paymentStatus === 'part paid' ? '#FFF7ED' : '#FEF3C7',
            },
          ]}>
          <Text
            style={[
              styles.statusBadgeText,
              {
                color:
                  item.paymentStatus === 'paid' ? '#10B981' :
                  item.paymentStatus === 'part paid' ? '#F59E0B' : '#D97706',
              },
            ]}>
            {item.paymentStatus?.charAt(0).toUpperCase() + item.paymentStatus?.slice(1)}
          </Text>
        </View>
      </View>

      {/* Progress Section */}
      <View style={styles.loanProgressSection}>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBg}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: item.amount > 0 ? `${((item.totalPaid || 0) / item.amount) * 100}%` : '0%',
                  backgroundColor: item.paymentStatus === 'paid' ? '#10B981' : '#FF9800',
                },
              ]}
            />
          </View>
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabelText}>
            Paid: ₹{formatCurrency(item.totalPaid || 0)}
          </Text>
          <Text style={styles.progressLabelText}>
            Remaining: ₹{formatCurrency(item.remainingAmount || item.amount)}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.loanCardFooter}>
        <View style={styles.loanFooterItem}>
          <Icon name="calendar" size={14} color="#6B7280" />
          <Text style={styles.loanFooterText}>
            Due: {item.loanEndDate ? new Date(item.loanEndDate).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
        <View style={styles.viewDetailsBtn}>
          <Text style={styles.viewDetailsText}>View Details</Text>
          <Icon name="chevron-right" size={16} color="#FF9800" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title="Dashboard" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#ff6700']}
            tintColor="#ff6700"
          />
        }>

        {/* Welcome Section */}
        <Animated.View
          style={[
            styles.welcomeCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}>
          <View style={styles.welcomeContent}>
            <View style={styles.welcomeText}>
              <Text style={styles.greeting}>Hello, {user?.userName || 'User'} 👋</Text>
              <Text style={styles.subtitle}>Track your loans easily</Text>
            </View>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={() => navigation.navigate('ProfileDetails')}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user?.userName || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.onlineIndicator} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionItem}
                activeOpacity={0.7}
                onPress={() => {
                  if (action.screen === 'BorrowerLoanHistoryScreen' && user?._id) {
                    navigation.navigate(action.screen, { borrowerId: user._id });
                  } else {
                    navigation.navigate(action.screen);
                  }
                }}>
                <View style={[styles.actionBackground, { backgroundColor: action.lightColor }]} />
                <View style={styles.actionContent}>
                  <View style={styles.actionTextContent}>
                    <Text style={styles.actionText}>{action.title}</Text>
                    <Text style={styles.actionDescription}>{action.description}</Text>
                  </View>
                  <View style={styles.actionIconWrapper}>
                    <LinearGradient
                      colors={action.gradient}
                      style={styles.actionIcon}>
                      <Icon name={action.icon} size={19} color="#fff" />
                    </LinearGradient>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Loan Overview</Text>
          <View style={styles.statsGrid}>
            {[
              {
                icon: 'file-text',
                value: totalActiveLoans,
                label: 'Active',
                gradient: ['#BBDEFB', '#90CAF9'],
                textColor: '#1565C0',
              },
              {
                icon: 'trending-up',
                value: `₹${(totalLoanAmount / 1000).toFixed(0)}K`,
                label: 'Borrowed',
                gradient: ['#C8E6C9', '#A5D6A7'],
                textColor: '#2E7D32',
              },
              {
                icon: 'check-circle',
                value: `₹${(totalPaid / 1000).toFixed(0)}K`,
                label: 'Paid',
                gradient: ['#E1BEE7', '#CE93D8'],
                textColor: '#7B1FA2',
              },
              {
                icon: 'clock',
                value: `₹${(totalRemaining / 1000).toFixed(0)}K`,
                label: 'Remaining',
                gradient: ['#FFCDD2', '#EF9A9A'],
                textColor: '#C62828',
              },
            ].map((stat) => (
              <View key={stat.label} style={styles.statItem}>
                <LinearGradient
                  colors={stat.gradient}
                  style={styles.statIcon}>
                  <Text style={[styles.statValue, { color: stat.textColor }]}>
                    {stat.value}
                  </Text>
                </LinearGradient>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Progress Card */}
        <Animated.View
          style={[
            styles.progressCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}>
          <View style={styles.progressPattern} />
          <LinearGradient
            colors={['#667eea', '#764ba2', '#667eea']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.progressGradient}>
            {/* Progress Circle */}
            <View style={styles.progressCircleContainer}>
              <View style={styles.progressCircleBackground}>
                <Animated.View
                  style={[
                    styles.progressCircleFill,
                    {
                      transform: [
                        {
                          rotate: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '360deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressCircleText}>{Math.round(completionRate)}%</Text>
            </View>

            <View style={styles.welcomeText}>
              <View style={styles.progressHeader}>
                <View>
                  <Text style={styles.progressTitle}>Repayment Progress</Text>
                  <Text style={styles.progressText}>
                    ₹{formatCurrency(totalPaid)} of ₹{formatCurrency(totalLoanAmount)} paid
                  </Text>
                </View>
                <View style={styles.progressStats}>
                  <View style={styles.statRow}>
                    <View style={[styles.statDot, { backgroundColor: '#ffd700' }]} />
                    <Text style={styles.statText}>Paid ({loans.filter(l => l.paymentStatus === 'paid').length})</Text>
                  </View>
                  <View style={styles.statRow}>
                    <View style={[styles.statDot, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
                    <Text style={styles.statText}>Pending ({totalActiveLoans})</Text>
                  </View>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarWrapper}>
                <View style={styles.progressBarMain}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      { width: `${completionRate}%` },
                    ]}>
                    <View style={styles.progressGlow} />
                  </Animated.View>
                </View>
                <View style={styles.progressBarLabels}>
                  <Text style={styles.progressLabel}>0%</Text>
                  <Text style={styles.progressLabel}>100%</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* My Loans */}
        {myLoans.length > 0 && (
          <View style={styles.loansSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>My Loans</Text>
                <View style={styles.loanCountBadge}>
                  <Text style={styles.loanCountText}>{loans.length}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.seeAllButton}
                onPress={() => navigation.navigate('MyLoans')}>
                <Text style={styles.seeAllText}>View All</Text>
                <Icon name="chevron-right" size={16} color="#ff6700" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={myLoans}
              renderItem={renderMyLoan}
              keyExtractor={item => item._id}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Recent Activities */}
        <Animated.View
          style={[
            styles.activitySection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <View style={styles.activityIndicator} />
            </View>
            {recentActivities.length > 3 && (
              <TouchableOpacity
                style={styles.seeAllButton}
                onPress={() => setShowAllActivities(!showAllActivities)}>
                <Text style={styles.seeAllText}>
                  {showAllActivities ? 'Show Less' : 'See All'}
                </Text>
                <Icon
                  name={showAllActivities ? 'chevron-up' : 'chevron-right'}
                  size={16}
                  color="#ff6700"
                />
              </TouchableOpacity>
            )}
          </View>

          {activitiesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#ff6700" />
              <Text style={styles.loadingText}>Loading activities...</Text>
            </View>
          ) : recentActivities.length > 0 ? (
            <FlatList
              data={
                showAllActivities
                  ? recentActivities
                  : recentActivities.slice(0, 3)
              }
              keyExtractor={(activity, index) => {
                if (activity._id) {
                  return `${activity._id}-${index}`;
                }
                if (activity.loanId) {
                  return `${activity.loanId}-${index}`;
                }
                return `activity-${index}-${activity.type || 'unknown'}`;
              }}
              scrollEnabled={false}
              renderItem={({ item, index }) => {
                const activityProps = getActivityProperties(item);
                const isLast =
                  index ===
                  ((showAllActivities
                    ? recentActivities.length
                    : Math.min(recentActivities.length, 3)) - 1);

                const handleActivityPress = () => {
                  if (item.loanId) {
                    const loan = loans.find(l => l._id === item.loanId);
                    if (loan) {
                      navigation.navigate('BorrowerLoanDetails', { loan });
                    } else {
                      navigation.navigate('MyLoans');
                    }
                  } else {
                    navigation.navigate('MyLoans');
                  }
                };

                return (
                  <BorrowerActivityItem
                    activity={item}
                    activityProps={activityProps}
                    isLast={isLast}
                    onPress={handleActivityPress}
                  />
                );
              }}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="inbox" size={40} color="#E5E7EB" />
              <Text style={styles.emptyText}>No recent activities</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const BorrowerActivityItem = memo(
  ({ activity, activityProps, isLast, onPress }) => {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        <View style={styles.activityItem}>
          {/* Timeline */}
          <View style={styles.timeline}>
            <View
              style={[
                styles.timelineDot,
                { backgroundColor: activityProps.color },
              ]}
            />
            {!isLast && <View style={styles.timelineLine} />}
          </View>

          {/* Activity Content */}
          <View style={styles.activityContent}>
            <View style={styles.activityHeader}>
              <LinearGradient
                colors={activityProps.gradient}
                style={styles.activityIcon}>
                <Icon name={activityProps.icon} size={16} color="#fff" />
              </LinearGradient>
              <View style={styles.welcomeText}>
                <Text style={styles.activityTitle}>
                  {activity.shortMessage || activity.type}
                </Text>
                <Text style={styles.activityDescription} numberOfLines={2}>
                  {activity.message || ''}
                </Text>
              </View>
              {activity.amount && (
                <View style={styles.activityAmountContainer}>
                  <Text
                    style={[
                      styles.activityAmount,
                      { color: activityProps.color },
                    ]}>
                    ₹{activity.amount.toLocaleString('en-IN')}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.activityFooter}>
              <View style={styles.timeContainer}>
                <Icon name="clock" size={12} color="#7f8c8d" />
                <Text style={styles.activityTime}>
                  {activity.relativeTime || 'Recently'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: m(100),
  },

  // WELCOME SECTION STYLES
  welcomeCard: {
    marginHorizontal: m(16),
    marginTop: m(20),
    backgroundColor: 'white',
    borderRadius: m(20),
    borderWidth: 0.4,
    borderColor: 'lightgrey',
  },
  welcomeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: m(24),
  },
  welcomeText: {
    flex: 1,
  },
  greeting: {
    fontSize: FontSizes['2xl'],
    fontFamily: FontFamily.secondaryBold,
    color: 'black',
    marginBottom: m(6),
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSizes.base,
    color: '#6B7280',
    fontFamily: FontFamily.primaryRegular,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: m(60),
    height: m(60),
    borderRadius: m(30),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF9800',
  },
  avatarText: {
    color: '#fff',
    fontSize: FontSizes.xl,
    fontFamily: FontFamily.secondaryBold,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: m(14),
    height: m(14),
    borderRadius: m(7),
    backgroundColor: '#27ae60',
    borderWidth: 2,
    borderColor: '#fff',
  },

  // ============================================
  // QUICK ACTIONS SECTION STYLES
  // ============================================
  actionsSection: {
    paddingHorizontal: m(16),
    marginTop: m(20),
    marginBottom: m(16),
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.secondaryBold,
    color: '#2c3e50',
    marginBottom: m(16),
    letterSpacing: -0.3,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  actionItem: {
    width: '48%',
    marginBottom: m(16),
    backgroundColor: '#fff',
    padding: m(18),
    borderRadius: m(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
    minHeight: m(120),
  },
  actionBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.6,
  },
  actionContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  actionTextContent: {
    flex: 1,
    paddingRight: m(10),
  },
  actionText: {
    fontSize: FontSizes.base,
    color: '#2c3e50',
    fontFamily: FontFamily.secondaryBold,
    marginBottom: m(3),
  },
  actionDescription: {
    fontSize: FontSizes.sm,
    color: '#7f8c8d',
    fontFamily: FontFamily.primaryRegular,
    lineHeight: m(16),
    marginBottom: 10,
  },
  actionIconWrapper: {
    position: 'absolute',
    bottom: m(-8),
    right: m(-8),
  },
  actionIcon: {
    width: m(48),
    height: m(48),
    borderRadius: m(16),
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ============================================
  // STATS SECTION STYLES
  // ============================================
  statsSection: {
    paddingHorizontal: m(16),
    marginBottom: m(16),
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
    width: '23%',
    marginBottom: m(16),
  },
  statIcon: {
    width: m(60),
    height: m(60),
    borderRadius: m(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(8),
  },
  statValue: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.primaryBold,
  },
  statLabel: {
    fontSize: FontSizes.sm,
    color: 'black',
    fontFamily: FontFamily.primaryMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textAlign: 'center',
  },

  // ============================================
  // PROGRESS CARD STYLES
  // ============================================
  progressCard: {
    marginHorizontal: m(16),
    marginBottom: m(20),
    borderRadius: m(24),
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  progressPattern: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    zIndex: 1,
  },
  progressGradient: {
    padding: m(20),
    flexDirection: Platform.OS === 'ios' ? 'column' : 'row',
    alignItems: Platform.OS === 'ios' ? 'flex-start' : 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  progressCircleContainer: {
    alignItems: 'center',
    marginRight: Platform.OS === 'ios' ? 0 : m(20),
    marginBottom: Platform.OS === 'ios' ? m(16) : 0,
    position: 'relative',
  },
  progressCircleBackground: {
    width: m(80),
    height: m(80),
    borderRadius: m(40),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressCircleFill: {
    position: 'absolute',
    width: m(70),
    height: m(70),
    borderRadius: m(35),
    borderWidth: 3,
    borderColor: '#ffd700',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  progressCircleText: {
    position: 'absolute',
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.secondaryBold,
    color: '#ffd700',
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  // progressContent: {
  //   flex: 1,
  // },
  progressHeader: {
    marginBottom: m(16),
  },
  progressTitle: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.secondaryBold,
    color: '#fff',
    marginBottom: m(4),
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  progressText: {
    fontSize: FontSizes.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: FontFamily.primaryRegular,
    marginBottom: m(12),
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statDot: {
    width: m(8),
    height: m(8),
    borderRadius: m(4),
    marginRight: m(6),
  },
  statText: {
    fontSize: FontSizes.xs,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: FontFamily.primaryRegular,
  },
  progressBarWrapper: {
    marginTop: m(8),
  },
  progressBarMain: {
    height: m(12),
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: m(6),
    overflow: 'hidden',
    marginBottom: m(6),
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffd700',
    borderRadius: m(6),
    position: 'relative',
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  progressGlow: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: m(20),
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    transform: [{ skewX: '-20deg' }],
  },
  progressBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: FontSizes.xs,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: FontFamily.primaryRegular,
  },

  // MY LOANS SECTION STYLES
  loansSection: {
    paddingHorizontal: m(16),
    marginBottom: m(16),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(16),
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loanCountBadge: {
    backgroundColor: '#FF9800',
    borderRadius: m(10),
    paddingHorizontal: m(8),
    paddingVertical: m(2),
    marginLeft: m(8),
  },
  loanCountText: {
    fontSize: FontSizes.xs,
    color: '#fff',
    fontFamily: FontFamily.primaryBold,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 103, 0, 0.1)',
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(20),
  },
  seeAllText: {
    fontSize: FontSizes.sm,
    color: '#ff6700',
    fontFamily: FontFamily.primarySemiBold,
    marginRight: m(4),
  },
  loanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(20),
    padding: m(18),
    marginBottom: m(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  loanCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(16),
  },
  loanCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  lenderAvatar: {
    width: m(44),
    height: m(44),
    borderRadius: m(22),
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(12),
  },
  lenderAvatarText: {
    fontSize: FontSizes.lg,
    color: '#fff',
    fontFamily: FontFamily.primaryBold,
  },
  // loanCardInfo: {
  //   flex: 1,
  // },
  loanLenderName: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: '#111827',
    marginBottom: m(2),
  },
  loanAmountText: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.primaryBold,
    color: '#FF9800',
  },
  statusBadge: {
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(20),
  },
  statusBadgeText: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.primarySemiBold,
    textTransform: 'uppercase',
  },
  loanProgressSection: {
    marginBottom: m(14),
  },
  progressBarContainer: {
    marginBottom: m(8),
  },
  progressBarBg: {
    height: m(8),
    backgroundColor: '#E5E7EB',
    borderRadius: m(4),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: m(4),
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabelText: {
    fontSize: FontSizes.xs,
    color: '#6B7280',
    fontFamily: FontFamily.primaryRegular,
  },
  loanCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: m(14),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  loanFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  loanFooterText: {
    fontSize: FontSizes.sm,
    color: '#6B7280',
    fontFamily: FontFamily.primaryRegular,
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
  },
  viewDetailsText: {
    fontSize: FontSizes.sm,
    color: '#FF9800',
    fontFamily: FontFamily.primarySemiBold,
  },

  // ACTIVITY SECTION STYLES
  activitySection: {
    paddingHorizontal: m(16),
    marginBottom: m(24),
  },
  activityIndicator: {
    width: m(8),
    height: m(8),
    borderRadius: m(4),
    backgroundColor: '#ff6700',
    marginLeft: m(8),
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: m(20),
    marginBottom: m(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderLeftWidth: m(4),
    borderLeftColor: 'transparent',
    overflow: 'hidden',
  },
  timeline: {
    width: m(40),
    alignItems: 'center',
    paddingTop: m(20),
  },
  timelineDot: {
    width: m(12),
    height: m(12),
    borderRadius: m(6),
    zIndex: 2,
  },
  timelineLine: {
    width: m(2),
    flex: 1,
    backgroundColor: '#e0e0e0',
    marginTop: m(4),
  },
  activityContent: {
    flex: 1,
    padding: m(16),
    paddingLeft: m(8),
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(12),
  },
  activityIcon: {
    width: m(40),
    height: m(40),
    borderRadius: m(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  // activityText: {
  //   flex: 1,
  // },
  activityTitle: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.primarySemiBold,
    color: '#2c3e50',
    marginBottom: m(2),
  },
  activityDescription: {
    fontSize: FontSizes.sm,
    color: '#7f8c8d',
    fontFamily: FontFamily.primaryRegular,
  },
  activityAmountContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  activityAmount: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primaryBold,
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityTime: {
    fontSize: FontSizes.xs,
    color: '#7f8c8d',
    fontFamily: FontFamily.primaryRegular,
    marginLeft: m(4),
  },

  // LOADING & EMPTY STATES
  loadingContainer: {
    padding: m(30),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: m(16),
  },
  loadingText: {
    marginTop: m(10),
    fontSize: FontSizes.sm,
    color: '#6B7280',
    fontFamily: FontFamily.primaryRegular,
  },
  emptyContainer: {
    padding: m(40),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: m(16),
  },
  emptyText: {
    marginTop: m(12),
    fontSize: FontSizes.base,
    color: '#9CA3AF',
    fontFamily: FontFamily.primaryRegular,
  },
});
