import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { useDispatch, useSelector } from 'react-redux';
import { colors, FontFamily } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper } from '../../../Components/common';
import { getBorrowerLoans } from '../../../Redux/Slices/borrowerLoanSlice';
import { getBorrowerRecentActivities } from '../../../Redux/Slices/borrowerActivitiesSlice';

const getActivityProperties = activity => {
  const activityType = activity.type || '';

  switch (activityType) {
    case 'payment_made':
      return {
        icon: 'dollar-sign',
        color: '#059669',
        bgColor: '#DCFCE7',
      };
    case 'loan_paid':
      return {
        icon: 'check-circle',
        color: '#059669',
        bgColor: '#DCFCE7',
      };
    case 'loan_accepted':
      return {
        icon: 'check-circle',
        color: '#0284C7',
        bgColor: '#E0F2FE',
      };
    case 'loan_rejected':
      return {
        icon: 'x-circle',
        color: '#DC2626',
        bgColor: '#FEE2E2',
      };
    case 'loan_received':
      return {
        icon: 'arrow-down',
        color: '#D97706',
        bgColor: '#FEF3C7',
      };
    case 'loan_overdue':
      return {
        icon: 'alert-circle',
        color: '#DC2626',
        bgColor: '#FEE2E2',
      };
    default:
      return {
        icon: 'bell',
        color: colors.lettersAndIcons,
        bgColor: '#F1F5F9',
      };
  }
};

export default function BorrowerRecentActivity() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const { loans } = useSelector(state => state.borrowerLoans);
  const {
    activities: recentActivities = [],
    loading,
    error,
  } = useSelector(state => state.borrowerActivities);
  const [refreshing, setRefreshing] = useState(false);

  const loadActivities = useCallback(async () => {
    if (!user?._id) return;
    await Promise.all([
      dispatch(getBorrowerLoans({ borrowerId: user._id })),
      dispatch(getBorrowerRecentActivities({ limit: 50 })),
    ]);
  }, [dispatch, user?._id]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadActivities();
    setRefreshing(false);
  };

  const handleActivityPress = activity => {
    if (activity.loanId) {
      const loan = loans.find(item => item._id === activity.loanId);
      if (loan) {
        navigation.navigate('BorrowerLoanDetails', { loan });
        return;
      }
    }
    navigation.navigate('BorrowerLoansPortfolio');
  };

  const totalAmount = recentActivities.reduce(
    (sum, activity) => sum + (Number(activity.amount) || 0),
    0,
  );
  const loanLinkedCount = recentActivities.filter(activity => activity.loanId).length;

  const renderActivity = ({ item }) => (
    <BorrowerActivityItem
      activity={item}
      activityProps={getActivityProperties(item)}
      onPress={() => handleActivityPress(item)}
    />
  );

  return (
    <ScreenWrapper
      backgroundColor={colors.backgroundGreenWhite}
      topInsetBg={colors.primary}
      statusBarColor={colors.primary}
      statusBarStyle="dark-content"
      scrollable={false}
    >
      {/* Top Green Banner */}
      <View style={styles.topBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backCircularBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Feather name="chevron-left" size={m(22)} color={colors.lettersAndIcons} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTag}>NOTIFICATIONS & EVENT TRAIL</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Recent Activity
            </Text>
          </View>

          <View style={{ width: m(38) }} />
        </View>
      </View>

      {/* Main Curved Body Section */}
      <View style={styles.sheetSection}>
        <FlatList
          data={recentActivities}
          renderItem={renderActivity}
          keyExtractor={(activity, index) => {
            if (activity._id) return `${activity._id}-${index}`;
            if (activity.loanId) return `${activity.loanId}-${index}`;
            return `activity-${index}-${activity.type || 'unknown'}`;
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.lettersAndIcons]}
              tintColor={colors.lettersAndIcons}
            />
          }
          ListHeaderComponent={
            <>
              {/* Neutral #F8FAFC Telemetry Box (No Green Overload) */}
              <View style={styles.metricsBox}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Total Updates</Text>
                  <Text style={styles.metricValue}>{recentActivities.length}</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Linked Deals</Text>
                  <Text style={styles.metricValue}>{loanLinkedCount}</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Volume</Text>
                  <Text style={[styles.metricValue, { color: '#059669' }]}>
                    ₹{totalAmount >= 100000 ? `${(totalAmount / 100000).toFixed(1)}L` : totalAmount.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </>
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.lettersAndIcons} />
                <Text style={styles.loadingText}>Fetching notification trail...</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Feather name={error ? 'alert-circle' : 'bell'} size={m(28)} color="#94A3B8" />
                </View>
                <Text style={styles.emptyTitle}>
                  {error ? 'Unable to Load Updates' : 'All Caught Up!'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {error || 'No pending notifications, repayment alerts, or facility events at this time.'}
                </Text>
              </View>
            )
          }
        />
      </View>
    </ScreenWrapper>
  );
}

const BorrowerActivityItem = memo(({ activity, activityProps, onPress }) => {
  const activityLabel = (activity.type || 'activity')
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.activityCard}>
      <View style={styles.activityTopRow}>
        <View style={[styles.activityIconBox, { backgroundColor: activityProps.bgColor }]}>
          <Feather name={activityProps.icon} size={m(18)} color={activityProps.color} />
        </View>
        <View style={styles.activityContentCol}>
          <Text style={styles.activityTitle} numberOfLines={1}>
            {activity.shortMessage || activityLabel}
          </Text>
          <Text style={styles.activityDescription} numberOfLines={2}>
            {activity.message || ''}
          </Text>
        </View>
        <Feather name="chevron-right" size={m(16)} color="#CBD5E1" />
      </View>

      <View style={styles.activityFooterRow}>
        <View style={styles.timeTag}>
          <Feather name="clock" size={m(11)} color="#64748B" />
          <Text style={styles.timeText}>
            {activity.relativeTime || 'Recently'}
          </Text>
        </View>

        {activity.amount ? (
          <View style={styles.amountPill}>
            <Text style={[styles.amountPillText, { color: activityProps.color }]}>
              ₹{Number(activity.amount).toLocaleString('en-IN')}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  topBanner: {
    backgroundColor: colors.primary,
    paddingHorizontal: m(16),
    paddingTop: m(8),
    paddingBottom: m(22),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backCircularBtn: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: m(12),
  },
  headerTag: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: m(18),
    fontFamily: FontFamily.primaryExtraBold,
    color: colors.lettersAndIcons,
  },
  sheetSection: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(26),
    borderTopRightRadius: m(26),
    marginTop: -m(12),
    overflow: 'hidden',
  },
  listContent: {
    padding: m(16),
    paddingBottom: m(80),
  },

  // Neutral #F8FAFC Telemetry Box (No Green Overload)
  metricsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: m(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: m(14),
    paddingHorizontal: m(12),
    marginBottom: m(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: m(10),
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
    marginBottom: m(2),
  },
  metricValue: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  metricDivider: {
    width: 1,
    height: m(24),
    backgroundColor: '#E2E8F0',
  },

  // Activity Cards
  activityCard: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    marginBottom: m(12),
    padding: m(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  activityTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(10),
  },
  activityIconBox: {
    width: m(38),
    height: m(38),
    borderRadius: m(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(12),
  },
  activityContentCol: {
    flex: 1,
    marginRight: m(8),
  },
  activityTitle: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(2),
  },
  activityDescription: {
    fontSize: m(11),
    color: '#64748B',
    fontFamily: FontFamily.bodyRegular,
    lineHeight: m(16),
  },
  activityFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: m(8),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
  },
  timeText: {
    fontSize: m(11),
    color: '#64748B',
    fontFamily: FontFamily.bodyRegular,
  },
  amountPill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(6),
  },
  amountPillText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
  },

  // Empty & Loading
  loadingContainer: {
    padding: m(32),
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(10),
  },
  loadingText: {
    fontSize: m(12),
    color: '#64748B',
    fontFamily: FontFamily.bodyRegular,
  },
  emptyContainer: {
    padding: m(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: m(54),
    height: m(54),
    borderRadius: m(27),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: m(12),
  },
  emptyTitle: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(4),
  },
  emptySubtitle: {
    fontSize: m(12),
    color: '#64748B',
    fontFamily: FontFamily.bodyRegular,
    textAlign: 'center',
    lineHeight: m(17),
  },
});
