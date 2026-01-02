import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons'; import LinearGradient from 'react-native-linear-gradient';
import { getLenderStatistics } from '../../../Redux/Slices/loanSlice';
import { getPendingPayments } from '../../../Redux/Slices/lenderPaymentSlice';
import { getLenderRecentActivities } from '../../../Redux/Slices/lenderActivitiesSlice';
import { useDispatch, useSelector } from 'react-redux';
import useFetchUserFromStorage from '../../../Redux/hooks/useFetchUserFromStorage';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';

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
  const { activities: recentActivities, loading: activitiesLoading } = useSelector(
    state => state.lenderActivities,
  );
  const { pendingPayments} = useSelector(state => state.lenderPayments);

  // Unused: Calculate total pending payments (commented out as not used)
  // useEffect(() => {
  //   if (pendingPayments && pendingPayments.length > 0) {
  //     const totalPending = pendingPayments.reduce((total, loan) => total + (loan.pendingPayments?.length || 0), 0);
  //   }
  // }, [pendingPayments]);

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
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      dispatch(getLenderStatistics());
      dispatch(getLenderRecentActivities({ limit: 10 }));
      // Fetch pending payments for lender
      dispatch(getPendingPayments({ page: 1, limit: 10 }));

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

    }, [dispatch, user]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(getLenderStatistics()),
      dispatch(getLenderRecentActivities({ limit: 10 })),
      dispatch(getPendingPayments({ page: 1, limit: 10 })),
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
  
  // Calculate remaining amount (pending + overdue)
  // const remainingAmount = (lenderStatistics?.totalPendingAmount || 0) + 
  //                         (lenderStatistics?.totalOverdueAmount || 0);

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

  // Handle activity card press
  const handleActivityPress = (activity) => {
    if (activity.loanId) {
      // Navigate to Outward (Given) tab screen for loan-related activities
      navigation.navigate('Given', { highlightLoanId: activity.loanId });
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
            colors={['#ff6700']}
            tintColor="#ff6700"
          />
        }>

        {/* Welcome Section */}
        <View style={styles.welcomeContent}>
          <View style={styles.welcomeText}>
            <Text style={styles.greeting}>Hello, {user?.userName || 'User'} 👋</Text>
            <Text style={styles.subtitle}>Manage your loans efficiently</Text>
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

        {/* Pending Payments Notification */}
        {pendingPayments && Array.isArray(pendingPayments) && pendingPayments.length > 0 && pendingPayments.some(loan => loan.pendingPayments && loan.pendingPayments.length > 0) && (
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
                colors={['#F59E0B', '#F97316']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.pendingPaymentGradient}>
                <View style={styles.pendingPaymentContent}>
                  <View style={styles.pendingPaymentIcon}>
                    <Ionicons name="notifications" size={24} color="#FFFFFF" />
                    {pendingPayments.reduce((total, loan) => total + (loan.pendingPayments?.length || 0), 0) > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {pendingPayments.reduce((total, loan) => total + (loan.pendingPayments?.length || 0), 0)}
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
                        const totalPending = pendingPayments.reduce((total, loan) => total + (loan.pendingPayments?.length || 0), 0);
                        if (totalPending === 0) return '';
                        const firstLoan = pendingPayments.find(loan => loan.pendingPayments && loan.pendingPayments.length > 0);
                        if (firstLoan && firstLoan.pendingPayments && firstLoan.pendingPayments.length > 0) {
                          const firstPayment = firstLoan.pendingPayments[0];
                          const borrowerName = firstLoan.loanName || 'Borrower';
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
              colors={['#1a1a1a', '#2c3e50', '#34495e', '#2c3e50']}
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
                    colors={['#ffd900e8', '#ffed4edc', '#ffd900d9']}
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
                gradient: ['#ff8a00', '#ff6700'],
                description: 'Create new loan',
                lightColor: '#F4CDA6'
              },
              {
                icon: 'bar-chart',
                text: 'Analytics',
                screen: 'AnalyticsScreen',
                gradient: ['#2c3e50', '#34495e'],
                description: 'View insights',
                lightColor: '#ACB5AF'
              },
              {
                icon: 'users',
                text: 'Contacts',
                screen: 'ContactsScreen',
                gradient: ['#27ae60', '#2ecc71'],
                description: 'Manage contacts',
                lightColor: '#C0ECCC'
              },
              {
                icon: 'settings',
                text: 'Settings',
                screen: 'SettingsScreen',
                gradient: ['#a09240ff', '#a3964aff'],
                // ffec7f
                description: 'App settings',
                lightColor: '#ffec7f'
              },
            ].map((action, index) => (
              <TouchableOpacity
                key={action.text}
                style={styles.actionItem}
                onPress={() => navigation.navigate(action.screen)}>
                {/* Background Light Shade */}
                <View style={[styles.actionBackground, { backgroundColor: action.lightColor }]} />

                {/* Content */}
                <View style={styles.actionContent}>
                  <View style={styles.actionTextContent}>
                    <Text style={styles.actionText}>{action.text}</Text>
                    <Text style={styles.actionDescription}>{action.description}</Text>
                  </View>

                  {/* Icon in Bottom Right Corner */}
                  <Animated.View
                    style={[
                      styles.actionIconWrapper,
                      {
                        transform: [{ scale: scaleAnim }]
                      }
                    ]}>
                    <LinearGradient
                      colors={action.gradient}
                      style={styles.actionIcon}
                    >
                      <Icon name={action.icon} size={19} color="#fff" />
                    </LinearGradient>
                  </Animated.View>
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
                gradient: ['#BBDEFB', '#90CAF9'],
                textColor: '#1565C0',
                tabName: 'Given'
              },
              {
                icon: 'check-circle',
                value: lenderStatistics?.counts?.paidLoans || 0,
                label: 'Paid',
                gradient: ['#C8E6C9', '#A5D6A7'],
                textColor: '#2E7D32'
              },
              {
                icon: 'clock',
                value: lenderStatistics?.counts?.pendingLoans || 0,
                label: 'Pending',
                gradient: ['#E1BEE7', '#e6d6e9ff'],
                textColor: '#7B1FA2'
              },
              {
                icon: 'alert-circle',
                value: lenderStatistics?.counts?.overdueLoans || 0,
                label: 'Overdue',
                gradient: ['#FFCDD2', '#EF9A9A'],
                textColor: '#C62828'
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
                  <LinearGradient
                    colors={stat.gradient}
                    style={styles.statIcon}
                  >
                    <Text style={[styles.statValue, { color: stat.textColor }]}>{stat.value}</Text>
                  </LinearGradient>
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
          {/* Background Pattern */}
          <View style={styles.progressPattern} />

          <LinearGradient
            colors={['#667eea', '#764ba2', '#667eea']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.progressGradient}
          >
            {/* Progress Circle */}
            <View style={styles.progressCircleContainer}>
              <View style={styles.progressCircleBackground}>
                <Animated.View style={[styles.progressCircleFill, {
                  transform: [{
                    rotate: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg']
                    })
                  }]
                }]} />
              </View>
              <Text style={styles.progressCircleText}>{Math.round(completionRate)}%</Text>
            </View>

            <View style={styles.progressContent}>
              <View style={styles.progressHeader}>
                <View>
                  <Text style={styles.progressTitle}>Loan Completion</Text>
                  <Text style={styles.progressText}>
                    {lenderStatistics?.counts?.paidLoans || 0} of {lenderStatistics?.counts?.totalLoans || 1} loans completed
                  </Text>
                  <Text style={styles.progressAmountText}>
                    ₹{formatCurrency(lenderStatistics?.totalPaidAmount || 0)} of ₹{formatCurrency(lenderStatistics?.totalLoanAmount || 0)}
                  </Text>
                </View>
                <View style={styles.progressStats}>
                  <View style={styles.statRow}>
                    <View style={[styles.statDot, { backgroundColor: '#ffd700' }]} />
                    <Text style={styles.statText}>
                      Completed ({lenderStatistics?.counts?.paidLoans || 0})
                    </Text>
                  </View>
                  <View style={styles.statRow}>
                    <View style={[styles.statDot, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
                    <Text style={styles.statText}>
                      Remaining ({remainingLoans})
                    </Text>
                  </View>
                </View>
              </View>

              {/* Enhanced Progress Bar */}
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: `${completionRate}%`,
                      }
                    ]}
                  >
                    <View style={styles.progressGlow} />
                  </Animated.View>
                </View>
                <View style={styles.progressLabels}>
                  <Text style={styles.progressLabel}>0%</Text>
                  <Text style={styles.progressLabel}>100%</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Recent Activity */}
        <Animated.View
          style={[
            styles.activitySection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }]
            }
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

          {(showAllActivity ? recentActivities : recentActivities.slice(0, 1)).map(
            (activity, index) => {
              const activityProps = getActivityProperties(activity);
              // Ensure unique key by combining multiple identifiers with index
              const uniqueKey = activity._id 
                ? `activity-${activity._id}-${index}` 
                : activity.loanId 
                ? `activity-${activity.loanId}-${index}` 
                : activity.timestamp 
                ? `activity-${activity.timestamp}-${index}` 
                : `activity-${index}`;
              return (
                <TouchableOpacity
                  key={uniqueKey}
                  activeOpacity={0.7}
                  onPress={() => handleActivityPress(activity)}>
                  <Animated.View
                    style={[
                      styles.activityItem,
                      {
                        transform: [{ translateX: slideUpAnim }],
                        opacity: fadeAnim
                      }
                    ]}>

                    {/* Timeline Indicator */}
                    <View style={styles.timeline}>
                      <View style={[styles.timelineDot, { backgroundColor: activityProps.color }]} />
                      {index < (showAllActivity ? recentActivities.length - 1 : 0) && <View style={styles.timelineLine} />}
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
                        <View style={[styles.statusBadge, { backgroundColor: `${activityProps.color}15` }]}>
                          <Text style={[styles.statusText, { color: activityProps.color }]}>
                            {activity.type === 'loan_given' ? 'Given' : 'Taken'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                </TouchableOpacity>
              );
            })}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingBottom: m(40),
  },
  content: {
    paddingBottom: m(80),
  },
  // Welcome Section
  welcomeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: m(24),
    backgroundColor: 'white',
    marginHorizontal: m(16),
    borderRadius: 20,
    marginTop: m(20),
    borderWidth: 0.4,
    borderColor: 'lightgrey'
  },
  welcomeText: {
    flex: 1,
  },
  greeting: {
    fontSize: m(24),
    fontFamily: 'Montserrat-Bold',
    color: 'black',
    marginBottom: m(6),
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: m(14),
    color: 'black',
    fontFamily: 'Poppins-Regular',
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
    backgroundColor: 'black'
  },
  avatarText: {
    color: '#fff',
    fontSize: m(20),
    fontFamily: 'Montserrat-Bold',
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
  // Premium Section
  premiumSection: {
    marginHorizontal: m(16),
    marginVertical: m(16),
    borderRadius: m(25),
    overflow: 'hidden',
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
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
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  premiumOrnamentBottom: {
    position: 'absolute',
    bottom: -15,
    left: -15,
    width: m(48),
    height: m(48),
    borderRadius: m(25),
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
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
    shadowColor: '#ffd700',
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
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    zIndex: -1,
  },
  premiumText: {
    flex: 1,
    zIndex: 2,
    marginLeft: 10
  },
  premiumTitle: {
    fontSize: m(20),
    fontFamily: 'Montserrat-Bold',
    color: '#fff',
    marginBottom: m(6),
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: 0.5,
  },
  premiumSubtitle: {
    fontSize: m(13),
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: 'Poppins-Light',
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
    fontSize: m(18),
    fontFamily: 'Montserrat-Bold',
    color: '#2c3e50',
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
    fontSize: m(20),
    fontFamily: 'Poppins-Bold',
    color: '#2c3e50',
  },
  statLabel: {
    fontSize: m(12),
    color: 'black',
    fontFamily: 'Poppins-Medium',
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
    fontSize: m(15),
    color: '#2c3e50',
    fontFamily: 'Montserrat-Bold',
    marginBottom: m(3),
  },
  actionDescription: {
    fontSize: m(12),
    color: '#7f8c8d',
    fontFamily: 'Poppins-Regular',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  // Progress Card
  progressCard: {
    marginHorizontal: m(16),
    marginBottom: m(16),
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
  // Progress Circle
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
    fontSize: m(18),
    fontFamily: 'Montserrat-Bold',
    color: '#ffd700',
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  // Progress Content
  progressContent: {
    flex: 1,
  },
  progressHeader: {
    marginBottom: m(16),
  },
  progressTitle: {
    fontSize: m(18),
    fontFamily: 'Montserrat-Bold',
    color: '#fff',
    marginBottom: m(4),
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  progressText: {
    fontSize: m(12),
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Poppins-Regular',
    marginBottom: m(4),
  },
  progressAmountText: {
    fontSize: m(11),
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Poppins-SemiBold',
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
    fontSize: m(10),
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Poppins-Regular',
  },
  // Enhanced Progress Bar
  progressBarContainer: {
    marginTop: m(8),
  },
  progressBar: {
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
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: m(10),
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'Poppins-Regular',
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
    fontSize: m(13),
    color: '#ff6700',
    fontFamily: 'Poppins-SemiBold',
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
    fontSize: m(16),
    fontFamily: 'Poppins-SemiBold',
    color: '#2c3e50',
    marginBottom: m(2),
  },
  activityPerson: {
    fontSize: m(12),
    color: '#7f8c8d',
    fontFamily: 'Poppins-Regular',
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
    fontSize: m(15),
    fontFamily: 'Poppins-Bold',
    fontWeight: '700',
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
    fontSize: m(11),
    color: '#7f8c8d',
    fontFamily: 'Poppins-Regular',
    marginLeft: m(4),
  },
  statusBadge: {
    paddingHorizontal: m(10),
    paddingVertical: m(4),
    borderRadius: m(12),
  },
  statusText: {
    fontSize: m(10),
    fontFamily: 'Poppins-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Pending Payments Notification Card
  pendingPaymentCard: {
    marginHorizontal: m(16),
    marginBottom: m(13),
    borderRadius: m(16),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#F59E0B',
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
    backgroundColor: '#EF4444',
    borderRadius: m(10),
    minWidth: m(20),
    height: m(20),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: m(4),
    borderWidth: 2,
    borderColor: '#FFFFFF',
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