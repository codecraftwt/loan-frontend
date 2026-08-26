import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Animated,
  Easing,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import { getBorrowerLoans, clearLoans } from '../../../Redux/Slices/borrowerLoanSlice';
import { FontFamily, FontSizes, colors } from '../../../constants';
import borrowerLoanAPI from '../../../Services/borrowerLoanService';

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

  const [refreshing, setRefreshing] = useState(false);
  const [pendingLoanOffers, setPendingLoanOffers] = useState([]);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const notificationFadeAnim = useRef(new Animated.Value(0)).current;
  const notificationSlideAnim = useRef(new Animated.Value(50)).current;

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
  }, [pulseAnim]);

  // Animation for notification
  useEffect(() => {
    if (pendingLoanOffers.length > 0) {
      Animated.parallel([
        Animated.timing(notificationFadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(notificationSlideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [notificationFadeAnim, notificationSlideAnim, pendingLoanOffers.length]);

  // Fetch pending loan offers
  const fetchPendingLoanOffers = useCallback(async () => {
    try {
      const response = await borrowerLoanAPI.getPendingLoanOffers(user?._id);
      const offers =
        Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.data?.loans)
              ? response.data.loans
              : Array.isArray(response?.loans)
                ? response.loans
                : [];

      setPendingLoanOffers(offers);
    } catch (error) {
      console.error('Error fetching pending loan offers:', error);
    }
  }, [user?._id]);

  const handleReviewLoanOffers = () => {
    navigation.navigate('PendingLoanOffers');
  };

  useFocusEffect(
    React.useCallback(() => {
      if (user?._id) {
        dispatch(getBorrowerLoans({ borrowerId: user._id }));
        fetchPendingLoanOffers();
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
    }, [
      dispatch,
      fadeAnim,
      scaleAnim,
      slideUpAnim,
      user?._id,
      fetchPendingLoanOffers,
    ]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    if (user?._id) {
      await Promise.all([
        dispatch(getBorrowerLoans({ borrowerId: user._id })),
        fetchPendingLoanOffers(),
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
      description: 'View all loans',
      tint: colors.sky,
    },
    {
      id: 2,
      title: 'History',
      icon: 'clock',
      screen: 'BorrowerLoanHistoryScreen',
      description: 'Payment history',
      tint: colors.mint,
    },
    {
      id: 3,
      title: 'Analytics',
      icon: 'bar-chart-2',
      screen: 'BorrowerAnalyticsScreen',
      description: 'View insights',
      tint: colors.butter,
    },
    {
      id: 5,
      title: 'Activity',
      icon: 'activity',
      screen: 'BorrowerRecentActivity',
      description: 'Recent updates',
      tint: colors.offWhite,
    },
  ];

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

  const renderMyLoan = ({ item, index }) => {
    const cardTint = index % 2 === 0 ? colors.sky : colors.mint;
    return (
      <TouchableOpacity
        style={[styles.loanCard, { backgroundColor: cardTint }]}
        onPress={() => navigation.navigate('BorrowerLoanDetails', { loan: item })}
        activeOpacity={0.85}>
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
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>
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
            <Icon name="calendar" size={14} color={colors.inkSoft} />
            <Text style={styles.loanFooterText}>
              Due: {item.loanEndDate ? new Date(item.loanEndDate).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
          <View style={styles.viewDetailsBtn}>
            <Text style={styles.viewDetailsText}>Details</Text>
            <Icon name="chevron-right" size={14} color={colors.white} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
            <Text style={styles.greetingSmall}>Hello, {user?.userName || 'User'} 👋</Text>
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

          <Text style={styles.heroTitle}>Manage Your{'\n'}Loans Easily</Text>
          <Text style={styles.heroSubtitle}>
            Currently you have {loans.length} loan{loans.length !== 1 ? 's' : ''}
          </Text>

          <View style={styles.heroTilesRow}>
            <View style={[styles.heroTile, { backgroundColor: colors.mint }]}>
              <View style={styles.heroTileIcon}>
                <Icon name="dollar-sign" size={16} color={colors.ink} />
              </View>
              <Text style={styles.heroTileLabel}>Total Borrowed</Text>
              <Text style={styles.heroTileValue}>₹{formatCurrency(totalLoanAmount)}</Text>
            </View>
            <View style={[styles.heroTile, { backgroundColor: colors.sky }]}>
              <View style={styles.heroTileIcon}>
                <Icon name="clock" size={16} color={colors.ink} />
              </View>
              <Text style={styles.heroTileLabel}>Remaining</Text>
              <Text style={styles.heroTileValue}>₹{formatCurrency(totalRemaining)}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Loan Offer Notification - Opens Review Modal */}
        {pendingLoanOffers.length > 0 && (
          <Animated.View
            style={[
              styles.loanOfferNotificationCard,
              {
                opacity: notificationFadeAnim,
                transform: [{ translateY: notificationSlideAnim }],
              },
            ]}>
            <TouchableOpacity
              onPress={handleReviewLoanOffers}
              activeOpacity={0.8}>
              <LinearGradient
                colors={[colors.ink, colors.inkSoft]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loanOfferNotificationGradient}>
                <View style={styles.loanOfferNotificationContent}>
                  <View style={styles.loanOfferNotificationIcon}>
                    <Ionicons name="notifications" size={24} color={colors.white} />
                    <View style={styles.loanOfferBadge}>
                      <Text style={styles.loanOfferBadgeText}>
                        {pendingLoanOffers.length > 9 ? '9+' : pendingLoanOffers.length}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.loanOfferNotificationText}>
                    <Text style={styles.loanOfferNotificationTitle}>
                      New Loan Offer{pendingLoanOffers.length !== 1 ? 's' : ''}
                    </Text>
                    <Text style={styles.loanOfferNotificationSubtitle} numberOfLines={2}>
                      {pendingLoanOffers.length === 1
                        ? `${pendingLoanOffers[0]?.lenderName || pendingLoanOffers[0]?.lenderId?.userName || 'A lender'} offered Rs ${formatCurrency(pendingLoanOffers[0]?.amount)}. Tap to review details`
                        : `You have ${pendingLoanOffers.length} pending loan offers. Tap to review details`}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={24} color={colors.white} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.actionItem, { backgroundColor: action.tint }]}
                activeOpacity={0.7}
                onPress={() => {
                  if (action.screen === 'PendingLoanOffers') {
                    handleReviewLoanOffers();
                  } else if (action.screen === 'BorrowerLoanHistoryScreen' && user?._id) {
                    navigation.navigate(action.screen, { borrowerId: user._id });
                  } else {
                    navigation.navigate(action.screen);
                  }
                }}>
                <View style={styles.actionContent}>
                  <View style={styles.actionTextContent}>
                    <Text style={styles.actionText}>{action.title}</Text>
                    <Text style={styles.actionDescription}>{action.description}</Text>
                  </View>
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
          <Text style={styles.sectionTitle}>Loan Overview</Text>
          <View style={styles.statsGrid}>
            {[
              {
                icon: 'file-text',
                value: totalActiveLoans,
                label: 'Active',
                tint: colors.sky,
              },
              {
                icon: 'trending-up',
                value: `₹${(totalLoanAmount / 1000).toFixed(0)}K`,
                label: 'Borrowed',
                tint: colors.mint,
              },
              {
                icon: 'check-circle',
                value: `₹${(totalPaid / 1000).toFixed(0)}K`,
                label: 'Paid',
                tint: colors.butter,
              },
              {
                icon: 'clock',
                value: `₹${(totalRemaining / 1000).toFixed(0)}K`,
                label: 'Remaining',
                tint: colors.offWhite,
              },
            ].map((stat) => (
              <View key={stat.label} style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: stat.tint }]}>
                  <Text style={styles.statValue}>
                    {stat.value}
                  </Text>
                </View>
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
          <View style={styles.progressTopRow}>
            <View style={styles.welcomeText}>
              <Text style={styles.progressTitle}>Repayment Progress</Text>
              <Text style={styles.progressText}>
                ₹{formatCurrency(totalPaid)} of ₹{formatCurrency(totalLoanAmount)} paid
              </Text>
            </View>
            <View style={styles.progressPercentPill}>
              <Text style={styles.progressPercentText}>{Math.round(completionRate)}%</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarWrapper}>
            <View style={styles.progressBarMain}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { width: `${completionRate}%` },
                ]}
              />
            </View>
            <View style={styles.progressBarLabels}>
              <Text style={styles.progressLabel}>0%</Text>
              <Text style={styles.progressLabel}>100%</Text>
            </View>
          </View>

          <View style={styles.progressStats}>
            <View style={styles.statRow}>
              <View style={[styles.statDot, { backgroundColor: colors.butterDark }]} />
              <Text style={styles.statText}>Paid ({loans.filter(l => l.paymentStatus === 'paid').length})</Text>
            </View>
            <View style={styles.statRow}>
              <View style={[styles.statDot, { backgroundColor: colors.border }]} />
              <Text style={styles.statText}>Pending ({totalActiveLoans})</Text>
            </View>
          </View>
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
                <Icon name="chevron-right" size={14} color={colors.white} />
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: m(100),
  },

  // HERO SECTION STYLES
  heroCard: {
    marginHorizontal: m(16),
    marginTop: m(20),
    backgroundColor: colors.surface,
    borderRadius: m(24),
    padding: m(20),
  },
  welcomeText: {
    flex: 1,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(18),
  },
  greetingSmall: {
    fontSize: m(13),
    lineHeight: m(18),
    color: colors.textSecondary,
    fontFamily: FontFamily.bodyRegular,
  },
  heroTitle: {
    fontSize: m(26),
    lineHeight: m(32),
    fontFamily: FontFamily.primaryExtraBold,
    color: colors.ink,
    marginBottom: m(6),
  },
  heroSubtitle: {
    fontSize: m(13),
    lineHeight: m(18),
    color: colors.textSecondary,
    fontFamily: FontFamily.bodyRegular,
    marginBottom: m(20),
  },
  heroTilesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroTile: {
    width: '48%',
    borderRadius: m(18),
    padding: m(14),
  },
  heroTileIcon: {
    width: m(30),
    height: m(30),
    borderRadius: m(15),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(10),
  },
  heroTileLabel: {
    fontSize: m(11),
    color: colors.inkSoft,
    fontFamily: FontFamily.bodyMedium,
    marginBottom: m(4),
  },
  heroTileValue: {
    fontSize: m(16),
    lineHeight: m(20),
    color: colors.ink,
    fontFamily: FontFamily.primaryExtraBold,
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
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.secondaryBold,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: m(12),
    height: m(12),
    borderRadius: m(6),
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },

  // Loan Offer Notification Card
  loanOfferNotificationCard: {
    marginHorizontal: m(16),
    marginBottom: m(16),
    borderRadius: m(16),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: colors.navyDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginVertical:14
  },
  loanOfferNotificationGradient: {
    borderRadius: m(16),
    padding: m(16),
  },
  loanOfferNotificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loanOfferNotificationIcon: {
    position: 'relative',
    marginRight: m(12),
  },
  loanOfferBadge: {
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
  loanOfferBadgeText: {
    color: colors.white,
    fontSize: m(10),
    fontWeight: '700',
  },
  loanOfferNotificationText: {
    flex: 1,
  },
  loanOfferNotificationTitle: {
    fontSize: m(16),
    fontWeight: '700',
    color: colors.white,
    marginBottom: m(4),
  },
  loanOfferNotificationSubtitle: {
    fontSize: m(12),
    color: colors.white,
    opacity: 0.9,
  },
  // ============================================
  // QUICK ACTIONS SECTION STYLES
  // ============================================
  actionsSection: {
    paddingHorizontal: m(16),
    marginTop: m(14),
    marginBottom: m(16),
  },
  sectionTitle: {
    fontSize: m(16),
    lineHeight: m(22),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.ink,
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
    fontSize: m(15),
    lineHeight: m(20),
    color: colors.ink,
    fontFamily: FontFamily.primarySemiBold,
    marginBottom: m(3),
  },
  actionDescription: {
    fontSize: m(12),
    color: colors.inkSoft,
    fontFamily: FontFamily.bodyRegular,
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
    backgroundColor: colors.white,
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
    color: colors.ink,
    fontFamily: FontFamily.primaryExtraBold,
  },
  statLabel: {
    fontSize: m(10),
    lineHeight: m(14),
    color: colors.ink,
    fontFamily: FontFamily.bodyMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  // ============================================
  // PROGRESS CARD STYLES
  // ============================================
  progressCard: {
    marginHorizontal: m(16),
    marginBottom: m(20),
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
  progressTitle: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.primarySemiBold,
    color: colors.ink,
    marginBottom: m(4),
  },
  progressText: {
    fontSize: FontSizes.sm,
    color: colors.textSecondary,
    fontFamily: FontFamily.primaryRegular,
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
  progressBarWrapper: {
    marginTop: m(4),
  },
  progressBarMain: {
    height: m(12),
    backgroundColor: colors.borderLight,
    borderRadius: m(6),
    overflow: 'hidden',
    marginBottom: m(6),
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.butterDark,
    borderRadius: m(6),
  },
  progressBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: FontSizes.xs,
    color: colors.textMuted,
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
    backgroundColor: colors.butter,
    borderRadius: m(10),
    paddingHorizontal: m(8),
    paddingVertical: m(2),
    marginLeft: m(8),
    marginBottom: m(12),
  },
  loanCountText: {
    fontSize: FontSizes.xs,
    color: colors.ink,
    fontFamily: FontFamily.primaryBold,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ink,
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(20),
  },
  seeAllText: {
    fontSize: FontSizes.sm,
    color: colors.white,
    fontFamily: FontFamily.primarySemiBold,
    marginRight: m(4),
  },
  loanCard: {
    borderRadius: m(22),
    padding: m(18),
    marginBottom: m(12),
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
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(12),
  },
  lenderAvatarText: {
    fontSize: FontSizes.lg,
    color: colors.ink,
    fontFamily: FontFamily.primaryBold,
  },
  loanLenderName: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: colors.inkSoft,
    marginBottom: m(2),
  },
  loanAmountText: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.primaryBold,
    color: colors.ink,
  },
  statusBadge: {
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(20),
    backgroundColor: colors.ink,
  },
  statusBadgeText: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.primarySemiBold,
    textTransform: 'uppercase',
    color: colors.white,
  },
  loanProgressSection: {
    marginBottom: m(14),
  },
  progressBarContainer: {
    marginBottom: m(8),
  },
  progressBarBg: {
    height: m(8),
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: m(4),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: m(4),
    backgroundColor: colors.ink,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabelText: {
    fontSize: FontSizes.xs,
    color: colors.inkSoft,
    fontFamily: FontFamily.primaryRegular,
  },
  loanCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: m(14),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  loanFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  loanFooterText: {
    fontSize: FontSizes.sm,
    color: colors.inkSoft,
    fontFamily: FontFamily.primaryRegular,
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: colors.ink,
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(20),
  },
  viewDetailsText: {
    fontSize: FontSizes.sm,
    color: colors.white,
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
    backgroundColor: colors.gold,
    marginLeft: m(8),
    marginBottom: m(10),
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: m(20),
    marginBottom: m(12),
    shadowColor: colors.black,
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
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  activityTitle: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.primarySemiBold,
    color: colors.navy,
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
    backgroundColor: colors.surface,
    borderRadius: m(16),
  },
  loadingText: {
    marginTop: m(10),
    fontSize: FontSizes.sm,
    color: colors.textSecondary,
    fontFamily: FontFamily.primaryRegular,
  },
  emptyContainer: {
    padding: m(40),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: m(16),
  },
  emptyText: {
    marginTop: m(12),
    fontSize: FontSizes.base,
    color: colors.textMuted,
    fontFamily: FontFamily.primaryRegular,
  },
});

