import React, { useState, useRef, useEffect, memo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Animated,
  Easing,
  Platform,
  FlatList,
  BackHandler,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { getLenderStatistics } from '../../../Redux/Slices/loanSlice';
import { getPendingPayments } from '../../../Redux/Slices/lenderPaymentSlice';
import { getLenderRecentActivities } from '../../../Redux/Slices/lenderActivitiesSlice';
import { getActivePlan } from '../../../Redux/Slices/planPurchaseSlice';
import { useDispatch, useSelector } from 'react-redux';
import useFetchUserFromStorage from '../../../Redux/hooks/useFetchUserFromStorage';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import { FontFamily, FontSizes, colors } from '../../../constants';

const formatCurrency = value => {
  if (!value) {
    return '0';
  }
  const num = Number(value) || 0;
  return num.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  });
};

export default function Home() {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const user = useSelector(state => state.auth.user);
  const lenderStatistics = useSelector(state => state.loans.lenderStatistics);
  const { activities: recentActivities } = useSelector(
    state => state.lenderActivities,
  );
  const { pendingPayments } = useSelector(state => state.lenderPayments);
  const { isActive: isSubscriptionActive } = useSelector(state => state.planPurchase);

  const [refreshing, setRefreshing] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);

  // Enhanced Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useFetchUserFromStorage();

  // Enhanced animations
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

    return () => {
      pulse.stop();
    };
  }, [pulseAnim]);

  useFocusEffect(
    React.useCallback(() => {
      dispatch(getLenderStatistics());
      dispatch(getLenderRecentActivities({ limit: 5 }));
      // Fetch pending payments for lender
      dispatch(getPendingPayments({ page: 1, limit: 10 }));
      // Fetch subscription status for lender
      dispatch(getActivePlan());

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

      // Handle Android hardware back button: confirm before exiting app
      const onBackPress = () => {
        if (Platform.OS === 'android') {
          Alert.alert(
            'Exit App',
            'Do you want to exit the app?',
            [
              {
                text: 'No',
                style: 'cancel',
              },
              {
                text: 'Yes',
                onPress: () => BackHandler.exitApp(),
              },
            ],
            { cancelable: true },
          );
          // Return true to prevent default navigation (e.g., going to Login)
          return true;
        }
        return false;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      // Cleanup when screen loses focus
      return () => {
        backHandler.remove();
      };
    }, [dispatch, fadeAnim, slideUpAnim, scaleAnim]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(getLenderStatistics()),
      dispatch(getLenderRecentActivities({ limit: 5 })),
      dispatch(getPendingPayments({ page: 1, limit: 10 })),
      dispatch(getActivePlan()),
    ]);
    setRefreshing(false);
  };

  const completionRate = Math.min(
    lenderStatistics?.percentages?.paidPercentage || 0,
    100
  );

  // Calculate remaining loans (pending + overdue)
  const remainingLoans = (lenderStatistics?.counts?.pendingLoans || 0) +
    (lenderStatistics?.counts?.overdueLoans || 0);

  // Helper function to map activity type to UI properties
  const getActivityProperties = (activity) => {
    const activityType = activity.type || '';

    let icon = 'clock';
    let color = '#34495e';
    let gradient = ['#2c3e50', '#34495e'];

    switch (activityType) {
      case 'payment_received':
        icon = 'dollar-sign';
        color = '#27ae60';
        gradient = ['#27ae60', '#2ecc71'];
        break;
      case 'loan_paid':
        icon = 'check-circle';
        color = '#10B981';
        gradient = ['#10B981', '#34D399'];
        break;
      case 'loan_accepted':
        icon = 'check-circle';
        color = '#10B981';
        gradient = ['#10B981', '#34D399'];
        break;
      case 'loan_rejected':
        icon = 'x-circle';
        color = '#EF4444';
        gradient = ['#EF4444', '#F87171'];
        break;
      case 'loan_created':
        icon = 'arrow-up-right';
        color = '#ff6700';
        gradient = ['#ff8a00', '#ff6700'];
        break;
      case 'loan_overdue':
        icon = 'alert-circle';
        color = '#F59E0B';
        gradient = ['#F59E0B', '#F97316'];
        break;
      default:
        icon = 'clock';
        color = '#34495e';
        gradient = ['#2c3e50', '#34495e'];
    }

    return { icon, color, gradient };
  };

  const handleActivityPress = (activity) => {
    if (!isSubscriptionActive) {
      Alert.alert(
        'Subscription Required',
        'Purchase a plan to view recent activities.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'View Plans',
            onPress: () => navigation.navigate('SubscriptionScreen'),
          },
        ],
      );
      return;
    }
    if (activity.loanId) {
      navigation.navigate('LoanDetailScreen', {
        loanId: activity.loanId,
        isEdit: false,
      });
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Home" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.ink]}
            tintColor={colors.ink}
          />
        }>

        {/* Welcome Section */}
        <Animated.View
          style={[
            styles.heroCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}>
          <View style={styles.heroTopRow}>
            <Text style={styles.greeting}>Hello, {user?.userName || 'User'} 👋</Text>
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
          <Text style={styles.subtitle}>Manage your loans efficiently</Text>
        </Animated.View>

        {/* Pending Payments Notification */}
        {(() => {
          // Calculate total pending payments
          if (!pendingPayments || !Array.isArray(pendingPayments) || pendingPayments.length === 0) {
            return false;
          }

          const hasPendingPayments = pendingPayments.some(loan =>
            loan.pendingPayments &&
            Array.isArray(loan.pendingPayments) &&
            loan.pendingPayments.length > 0
          );

          if (!hasPendingPayments) return false;

          const totalPendingCount = pendingPayments.reduce((total, loan) =>
            total + (Array.isArray(loan.pendingPayments) ? loan.pendingPayments.length : 0), 0
          );

          return totalPendingCount > 0;
        })() && (
            <Animated.View
              style={[
                styles.pendingPaymentCard,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideUpAnim }],
                },
              ]}>
              <TouchableOpacity
                onPress={() => navigation.navigate('PendingPayments')}
                activeOpacity={0.8}>
                <LinearGradient
                  colors={[colors.ink, colors.inkSoft]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.pendingPaymentGradient}>
                  <View style={styles.pendingPaymentContent}>
                    <View style={styles.pendingPaymentIcon}>
                      <Ionicons name="notifications" size={24} color="#FFFFFF" />
                      {(() => {
                        const totalPending = pendingPayments.reduce((total, loan) =>
                          total + (Array.isArray(loan.pendingPayments) ? loan.pendingPayments.length : 0), 0
                        );
                        return totalPending > 0;
                      })() && (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                              {pendingPayments.reduce((total, loan) =>
                                total + (Array.isArray(loan.pendingPayments) ? loan.pendingPayments.length : 0), 0
                              )}
                            </Text>
                          </View>
                        )}
                    </View>
                    <View style={styles.pendingPaymentText}>
                      <Text style={styles.pendingPaymentTitle}>
                        Pending Payments
                      </Text>
                      <Text style={styles.pendingPaymentSubtitle} numberOfLines={2}>
                        {(() => {
                          const totalPending = pendingPayments.reduce((total, loan) =>
                            total + (Array.isArray(loan.pendingPayments) ? loan.pendingPayments.length : 0), 0
                          );
                          if (totalPending === 0) return '';
                          const firstLoan = pendingPayments.find(loan =>
                            Array.isArray(loan.pendingPayments) && loan.pendingPayments.length > 0
                          );
                          if (firstLoan && firstLoan.pendingPayments && firstLoan.pendingPayments.length > 0) {
                            const firstPayment = firstLoan.pendingPayments[0];
                            const borrowerName = firstLoan.borrowerName || firstLoan.loanName || 'Borrower';
                            const amount = typeof firstPayment.amount === 'number'
                              ? firstPayment.amount
                              : parseFloat(firstPayment.amount) || 0;
                            const formattedAmount = `₹${amount.toLocaleString('en-IN')}`;
                            if (totalPending === 1) {
                              return `${borrowerName} paid ${formattedAmount}. Please check`;
                            } else {
                              return `${borrowerName} paid ${formattedAmount} and ${totalPending - 1} more payment${totalPending - 1 !== 1 ? 's' : ''} awaiting review`;
                            }
                          }
                          return `${totalPending} payment${totalPending !== 1 ? 's' : ''} awaiting your review`;
                        })()}
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={24} color="#FFFFFF" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

        {/* Premium CTA with Simplified Animation */}
        <Animated.View
          style={[
            styles.premiumSection,
            {
              transform: [{ scale: pulseAnim }]
            }
          ]}>
          <TouchableOpacity
            onPress={() => navigation.navigate('SubscriptionScreen')}
            activeOpacity={0.9}>
            {/* Shiny Overlay Effect */}
            <Animated.View style={[styles.shinyOverlay, {
              transform: [{
                translateX: pulseAnim.interpolate({
                  inputRange: [1, 1.02],
                  outputRange: [-100, 300]
                })
              }]
            }]} />

            <LinearGradient
              colors={[colors.ink, colors.inkSoft, colors.ink]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            // style={styles.premiumContent}
            >
              <View style={styles.premiumContent}>
                {/* Decorative Elements */}
                <View style={styles.premiumOrnamentTop} />
                <View style={styles.premiumOrnamentBottom} />

                <View style={styles.premiumIcon}>
                  <LinearGradient
                    colors={[colors.goldLight, colors.gold, colors.goldDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.premiumIconBackground}
                  >
                    <Ionicons name="sparkles-sharp" color="white" size={26} />
                  </LinearGradient>
                  <View style={styles.iconGlow} />
                </View>

                <View style={styles.premiumText}>
                  <Text style={styles.premiumTitle}>Go Premium</Text>
                  <Text style={styles.premiumSubtitle}>Unlock advanced features & insights</Text>
                </View>

                <View style={styles.premiumArrow}>
                  <Icon name="chevron-right" size={24} color="white" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {[
              {
                icon: 'plus-circle',
                text: 'New Loan',
                screen: 'AddDetails',
                description: 'Create new loan',
                tint: colors.sky,
              },
              {
                icon: 'bar-chart',
                text: 'Analytics',
                screen: 'AnalyticsScreen',
                description: 'View insights',
                tint: colors.mint,
              },
              {
                icon: 'users',
                text: 'Contacts',
                screen: 'ContactsScreen',
                description: 'Manage contacts',
                tint: colors.butter,
              },
              {
                icon: 'activity',
                text: 'Activity',
                screen: 'LenderRecentActivity',
                description: 'Recent updates',
                tint: colors.offWhite,
              },

            ].map((action) => (
              <TouchableOpacity
                key={action.text}
                style={[styles.actionItem, { backgroundColor: action.tint }]}
                activeOpacity={action.screen ? 0.7 : 1}
                onPress={() => action.screen && navigation.navigate(action.screen)}>
                <View style={styles.actionContent}>
                  <View style={styles.actionTextContent}>
                    <Text style={styles.actionText}>{action.text}</Text>
                    <Text style={styles.actionDescription}>{action.description}</Text>
                  </View>

                  {/* Icon in Bottom Right Corner */}
                  <View style={styles.actionIconWrapper}>
                    <View style={styles.actionIcon}>
                      <Icon name={action.icon} size={19} color={colors.ink} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Loan Statistics</Text>
          <View style={styles.statsGrid}>
            {[
              {
                icon: 'arrow-up-circle',
                value: lenderStatistics?.counts?.totalLoans || 0,
                label: 'Given',
                tint: colors.sky,
                tabName: 'Given'
              },
              {
                icon: 'check-circle',
                value: lenderStatistics?.counts?.paidLoans || 0,
                label: 'Paid',
                tint: colors.mint,
              },
              {
                icon: 'clock',
                value: lenderStatistics?.counts?.pendingLoans || 0,
                label: 'Pending',
                tint: colors.butter,
              },
              {
                icon: 'alert-circle',
                value: lenderStatistics?.counts?.overdueLoans || 0,
                label: 'Overdue',
                tint: colors.offWhite,
              },
            ].map((stat) => {
              const StatContainer = stat.tabName ? TouchableOpacity : View;
              const statProps = stat.tabName
                ? {
                  onPress: () => {
                    // Use jumpTo to navigate between tabs
                    navigation.jumpTo(stat.tabName);
                  },
                  activeOpacity: 0.7
                }
                : {};

              return (
                <StatContainer
                  key={stat.label}
                  style={styles.statItem}
                  {...statProps}
                >
                  <View style={[styles.statIcon, { backgroundColor: stat.tint }]}>
                    <Text style={styles.statValue}>{stat.value}</Text>
                  </View>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </StatContainer>
              );
            })}
          </View>
        </View>
        {/* Progress Card */}
        <Animated.View
          style={[
            styles.progressCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }]
            }
          ]}>
          <View style={styles.progressTopRow}>
            <View style={styles.progressHeaderText}>
              <Text style={styles.progressTitle}>Loan Completion</Text>
              <Text style={styles.progressText} numberOfLines={2}>
                {lenderStatistics?.counts?.paidLoans || 0} of {lenderStatistics?.counts?.totalLoans || 1} loans completed
              </Text>
              <Text style={styles.progressAmountText} numberOfLines={1}>
                ₹{formatCurrency(lenderStatistics?.totalPaidAmount || 0)} of ₹{formatCurrency(lenderStatistics?.totalLoanAmount || 0)}
              </Text>
            </View>
            <View style={styles.progressPercentPill}>
              <Text style={styles.progressPercentText}>{Math.round(completionRate)}%</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(completionRate, 100)}%`,
                  }
                ]}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>0%</Text>
              <Text style={styles.progressLabel}>100%</Text>
            </View>
          </View>

          <View style={styles.progressStats}>
            <View style={styles.statRow}>
              <View style={[styles.statDot, { backgroundColor: colors.butterDark }]} />
              <Text style={styles.statText} numberOfLines={1}>
                Completed ({lenderStatistics?.counts?.paidLoans || 0})
              </Text>
            </View>
            <View style={styles.statRow}>
              <View style={[styles.statDot, { backgroundColor: colors.border }]} />
              <Text style={styles.statText} numberOfLines={1}>
                Remaining ({remainingLoans})
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Recent Activity */}
        {/* <Animated.View
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
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => setShowAllActivity(prev => !prev)}>
              <Text style={styles.seeAllText}>
                {showAllActivity ? 'Show Less' : 'See All'}
              </Text>
              <Icon
                name={showAllActivity ? 'chevron-up' : 'chevron-right'}
                size={16}
                color="#ff6700"
              />
            </TouchableOpacity>
          </View>

          <FlatList
            data={showAllActivity ? recentActivities : recentActivities.slice(0, 1)}
            keyExtractor={(activity, index) => {
              if (activity._id) {
                return `activity-${activity._id}-${index}`;
              }
              if (activity.loanId) {
                return `activity-${activity.loanId}-${index}`;
              }
              if (activity.timestamp) {
                return `activity-${activity.timestamp}-${index}`;
              }
              return `activity-${index}`;
            }}
            scrollEnabled={false}
            renderItem={({ item, index }) => {
              const activityProps = getActivityProperties(item);
              const isLast =
                index <
                ((showAllActivity ? recentActivities.length : 1) - 1);

              return (
                <LenderActivityItem
                  activity={item}
                  activityProps={activityProps}
                  showLine={isLast}
                  onPress={() => handleActivityPress(item)}
                  slideUpAnim={slideUpAnim}
                  fadeAnim={fadeAnim}
                />
              );
            }}
          />
        </Animated.View> */}
      </ScrollView>
    </View>
  );
}

const LenderActivityItem = memo(
  ({
    activity,
    activityProps,
    showLine,
    onPress,
    slideUpAnim,
    fadeAnim,
  }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}>
        <Animated.View
          style={[
            styles.activityItem,
            {
              transform: [{ translateX: slideUpAnim }],
              opacity: fadeAnim,
            },
          ]}>

                    {/* Timeline Indicator */}
                    <View style={styles.timeline}>
                      <View style={[styles.timelineDot, { backgroundColor: activityProps.color }]} />
                      {showLine && <View style={styles.timelineLine} />}
                    </View>

                    {/* Activity Content */}
                    <View style={styles.activityContent}>
                      <View style={styles.activityHeader}>
                        <LinearGradient
                          colors={activityProps.gradient}
                          style={styles.activityIcon}
                        >
                          <Icon name={activityProps.icon} size={16} color="#fff" />
                        </LinearGradient>
                        <View style={styles.activityText}>
                          <Text style={styles.activityTitle}>{activity.shortMessage || 'Activity'}</Text>
                          <Text style={styles.activityPerson} numberOfLines={2}>
                            {activity.message || ''}
                          </Text>
                        </View>
                        <View style={styles.activityAmountContainer}>
                          <Text style={[styles.activityAmount, { color: activityProps.color }]}>
                            ₹{activity.amount?.toLocaleString('en-IN') || '0'}
                          </Text>
                        </View>
                      </View>

            <View style={styles.activityFooter}>
              <View style={styles.timeContainer}>
                <Icon name="clock" size={12} color="#7f8c8d" />
                <Text style={styles.activityTime}>
                  {activity.relativeTime || 'Recently'}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: `${activityProps.color}15` },
                ]}>
                <Text
                  style={[
                    styles.statusText,
                    { color: activityProps.color },
                  ]}>
                  {activity.type === 'loan_given' ? 'Given' : 'Taken'}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
    paddingBottom: m(40),
  },
  content: {
    paddingBottom: m(80),
  },
  // Welcome Section
  heroCard: {
    marginHorizontal: m(16),
    marginTop: m(20),
    backgroundColor: colors.surface,
    borderRadius: m(24),
    padding: m(20),
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    flex: 1,
  },
  greeting: {
    fontSize: FontSizes['2xl'],
    fontFamily: FontFamily.secondaryBold,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSizes.base,
    color: colors.textSecondary,
    fontFamily: FontFamily.primaryRegular,
    marginTop: m(6),
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: m(48),
    height: m(48),
    borderRadius: m(24),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.ink,
  },
  avatarText: {
    color: colors.white,
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
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },
  // Premium Section
  premiumSection: {
    marginHorizontal: m(16),
    marginVertical: m(16),
    borderRadius: m(25),
    overflow: 'hidden',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 1,
    borderColor: `${colors.gold}33`,
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Platform.OS === 'android' ? m(28) : m(10),
    paddingVertical: Platform.OS === 'android' ? m(26) : m(26),
    position: 'relative',
    overflow: 'hidden',
  },
  // Shiny Overlay Effect
  shinyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '30%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ skewX: '-20deg' }],
    zIndex: 1,
  },
  // Decorative Ornaments
  premiumOrnamentTop: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: m(40),
    height: m(40),
    borderRadius: m(20),
    backgroundColor: `${colors.gold}1a`,
  },
  premiumOrnamentBottom: {
    position: 'absolute',
    bottom: -15,
    left: -15,
    width: m(48),
    height: m(48),
    borderRadius: m(25),
    backgroundColor: `${colors.gold}0d`,
  },
  premiumIcon: {
    marginRight: m(16),
    position: 'relative',
    zIndex: 2,
  },
  premiumIconBackground: {
    width: m(54),
    height: m(54),
    borderRadius: m(28),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  iconGlow: {
    position: 'absolute',
    width: m(68),
    height: m(68),
    borderRadius: m(35),
    backgroundColor: `${colors.gold}33`,
    zIndex: -1,
  },
  premiumText: {
    flex: 1,
    zIndex: 2,
    marginLeft: 10
  },
  premiumTitle: {
    fontSize: FontSizes.xl,
    fontFamily: FontFamily.secondaryBold,
    color: colors.white,
    marginBottom: m(6),
    textShadowColor: `${colors.gold}80`,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: 0.5,
  },
  premiumSubtitle: {
    fontSize: FontSizes.sm,
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: FontFamily.primaryRegular,
    letterSpacing: 0.3,
  },
  premiumArrow: {
    zIndex: 2,
  },
  // Stats Section
  statsSection: {
    paddingHorizontal: m(16),
    marginBottom: m(16),
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.secondaryBold,
    color: colors.ink,
    marginBottom: m(16),
    letterSpacing: -0.3,
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
    fontSize: FontSizes.xl,
    fontFamily: FontFamily.primaryBold,
    color: colors.ink,
  },
  statLabel: {
    fontSize: FontSizes.sm,
    color: colors.ink,
    fontFamily: FontFamily.primaryMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  // Actions Section
  actionsSection: {
    paddingHorizontal: m(16),
    marginBottom: m(16),
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  actionItem: {
    width: '48%',
    marginBottom: m(16),
    padding: m(18),
    borderRadius: m(20),
    position: 'relative',
    overflow: 'hidden',
    minHeight: m(120),
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
    color: colors.ink,
    fontFamily: FontFamily.secondaryBold,
    marginBottom: m(3),
  },
  actionDescription: {
    fontSize: FontSizes.sm,
    color: colors.inkSoft,
    fontFamily: FontFamily.primaryRegular,
    lineHeight: m(16),
    marginBottom: 10
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
    backgroundColor: colors.white,
  },
  // Progress Card
  progressCard: {
    marginHorizontal: m(16),
    marginBottom: m(16),
    borderRadius: m(24),
    padding: m(20),
    backgroundColor: colors.surface,
  },
  progressTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: m(16),
  },
  progressPercentPill: {
    backgroundColor: colors.sky,
    borderRadius: m(20),
    paddingHorizontal: m(14),
    paddingVertical: m(8),
  },
  progressPercentText: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primaryExtraBold,
    color: colors.skyText,
  },
  // Progress Content
  progressHeaderText: {
    flex: 1,
    marginRight: m(12),
  },
  progressTitle: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.secondaryBold,
    color: colors.ink,
    marginBottom: m(4),
  },
  progressText: {
    fontSize: FontSizes.sm,
    color: colors.textSecondary,
    fontFamily: FontFamily.primaryRegular,
    marginBottom: m(4),
  },
  progressAmountText: {
    fontSize: FontSizes.xs,
    color: colors.textSecondary,
    fontFamily: FontFamily.primarySemiBold,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: m(14),
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
    color: colors.textSecondary,
    fontFamily: FontFamily.primaryRegular,
  },
  // Progress Bar
  progressBarContainer: {
    marginTop: m(4),
  },
  progressBar: {
    height: m(12),
    backgroundColor: colors.borderLight,
    borderRadius: m(6),
    overflow: 'hidden',
    marginBottom: m(6),
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.butterDark,
    borderRadius: m(6),
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: FontSizes.xs,
    color: colors.textMuted,
    fontFamily: FontFamily.primaryRegular,
  },
  // Activity Section
  activitySection: {
    paddingHorizontal: m(16),
    marginBottom: m(24),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(20),
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIndicator: {
    width: m(8),
    height: m(8),
    borderRadius: m(4),
    backgroundColor: '#ff6700',
    marginLeft: m(8),
    marginBottom:m(11)
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
  activityItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: m(20),
    marginBottom: m(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderLeftWidth: m(4),
    borderLeftColor: 'transparent',
    overflow: 'hidden',
  },
  // Timeline
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
  // Activity Content
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
  activityText: {
    flex: 1,
  },
  activityTitle: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.primarySemiBold,
    color: '#2c3e50',
    marginBottom: m(2),
  },
  activityPerson: {
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
  // Activity Footer
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
  statusBadge: {
    paddingHorizontal: m(10),
    paddingVertical: m(4),
    borderRadius: m(12),
  },
  statusText: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.primarySemiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Activity Loading State
  activityItemLoading: {
    position: 'relative',
  },
  activityLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: m(20),
    flexDirection: 'row',
    gap: m(8),
  },
  activityLoadingText: {
    fontSize: FontSizes.sm,
    color: '#ff6700',
    fontFamily: FontFamily.primarySemiBold,
  },
  fullscreenLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  fullscreenLoaderText: {
    marginTop: m(8),
    fontSize: FontSizes.sm,
    color: '#ff6700',
    fontFamily: FontFamily.primarySemiBold,
  },
  // Pending Payments Notification Card
  pendingPaymentCard: {
    marginHorizontal: m(16),
    marginBottom: m(13),
    borderRadius: m(16),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: colors.navyDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginTop: m(16),
  },
  pendingPaymentGradient: {
    borderRadius: m(16),
    padding: m(16),
  },
  pendingPaymentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pendingPaymentIcon: {
    position: 'relative',
    marginRight: m(12),
  },
  badge: {
    position: 'absolute',
    top: -m(6),
    right: -m(6),
    backgroundColor: colors.error,
    borderRadius: m(10),
    minWidth: m(20),
    height: m(20),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: m(4),
    borderWidth: 2,
    borderColor: colors.white,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: m(10),
    fontWeight: '700',
  },
  pendingPaymentText: {
    flex: 1,
  },
  pendingPaymentTitle: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: m(4),
  },
  pendingPaymentSubtitle: {
    fontSize: m(12),
    color: '#FFFFFF',
    opacity: 0.9,
  },
});
