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
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import { FontFamily, FontSizes } from '../../../constants';
import { getBorrowerLoans } from '../../../Redux/Slices/borrowerLoanSlice';
import { getBorrowerRecentActivities } from '../../../Redux/Slices/borrowerActivitiesSlice';

const getActivityProperties = activity => {
  const activityType = activity.type || '';

  switch (activityType) {
    case 'payment_made':
      return {
        icon: 'dollar-sign',
        color: '#4CAF50',
        gradient: ['#4CAF50', '#66BB6A'],
      };
    case 'loan_paid':
      return {
        icon: 'check-circle',
        color: '#10B981',
        gradient: ['#10B981', '#34D399'],
      };
    case 'loan_accepted':
      return {
        icon: 'check-circle',
        color: '#2196F3',
        gradient: ['#2196F3', '#42A5F5'],
      };
    case 'loan_rejected':
      return {
        icon: 'x-circle',
        color: '#EF4444',
        gradient: ['#EF4444', '#F87171'],
      };
    case 'loan_received':
      return {
        icon: 'arrow-down',
        color: '#FF9800',
        gradient: ['#FF9800', '#FFA726'],
      };
    case 'loan_overdue':
      return {
        icon: 'alert-circle',
        color: '#F44336',
        gradient: ['#F44336', '#EF5350'],
      };
    default:
      return {
        icon: 'activity',
        color: '#666',
        gradient: ['#9E9E9E', '#BDBDBD'],
      };
  }
};

export default function BorrowerRecentActivity() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const { loans } = useSelector(state => state.borrowerLoans);
  const {
    activities: recentActivities,
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

    navigation.navigate('MyLoans');
  };

  const totalAmount = recentActivities.reduce(
    (sum, activity) => sum + (Number(activity.amount) || 0),
    0,
  );
  const loanLinkedCount = recentActivities.filter(activity => activity.loanId).length;

  const renderActivity = ({ item, index }) => (
    <BorrowerActivityItem
      activity={item}
      activityProps={getActivityProperties(item)}
      isLast={index === recentActivities.length - 1}
      onPress={() => handleActivityPress(item)}
    />
  );

  return (
    <View style={styles.container}>
      <Header title="Recent Activity" showBackButton />

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
            colors={['#ff6700']}
            tintColor="#ff6700"
          />
        }
        ListHeaderComponent={
          <>
            <LinearGradient
              colors={['#FF9800', '#F97316']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.screenIntro}>
              <View style={styles.introIconWrap}>
                <Icon name="activity" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.introText}>
                <Text style={styles.screenTitle}>Recent Activity</Text>
                <Text style={styles.screenSubtitle}>
                  Track loan offers, payments, overdue updates, and repayment events.
                </Text>
              </View>
            </LinearGradient>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{recentActivities.length}</Text>
                <Text style={styles.summaryLabel}>Updates</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{loanLinkedCount}</Text>
                <Text style={styles.summaryLabel}>Linked Loans</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  Rs {totalAmount.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.summaryLabel}>Activity Amount</Text>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#ff6700" />
              <Text style={styles.loadingText}>Loading activities...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name={error ? 'alert-circle' : 'inbox'} size={42} color="#E5E7EB" />
              <Text style={styles.emptyText}>
                {error || 'No recent activities'}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const BorrowerActivityItem = memo(
  ({ activity, activityProps, isLast, onPress }) => {
    const activityLabel = (activity.type || 'activity')
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <View
        style={[
          styles.activityItem,
          { borderLeftColor: activityProps.color },
        ]}>
        <View style={styles.activityTopRow}>
          <View
            style={[
              styles.activityIconShell,
              { backgroundColor: `${activityProps.color}18` },
            ]}>
            <Icon name={activityProps.icon} size={18} color={activityProps.color} />
          </View>
          <View style={styles.activityText}>
            <View style={styles.activityTitleRow}>
              <Text style={styles.activityTitle} numberOfLines={1}>
                {activity.shortMessage || activityLabel}
              </Text>
              <View
                style={[
                  styles.typePill,
                  { backgroundColor: `${activityProps.color}15` },
                ]}>
                <Text style={[styles.typePillText, { color: activityProps.color }]}>
                  {activityLabel}
                </Text>
              </View>
            </View>
            <Text style={styles.activityDescription} numberOfLines={2}>
              {activity.message || ''}
            </Text>
          </View>
        </View>

        <View style={styles.activityMetaRow}>
          <View style={styles.timeContainer}>
            <Icon name="clock" size={12} color="#7f8c8d" />
            <Text style={styles.activityTime}>
              {activity.relativeTime || 'Recently'}
            </Text>
          </View>

          {activity.amount ? (
            <View style={styles.activityAmountContainer}>
              <Text
                style={[
                  styles.activityAmount,
                  { color: activityProps.color },
                ]}>
                Rs {activity.amount.toLocaleString('en-IN')}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.activityBottomRow}>
          <View style={styles.timelinePreview}>
            <View
              style={[
                styles.timelineDot,
                { backgroundColor: activityProps.color },
              ]}
            />
            {!isLast && <View style={styles.timelineLine} />}
          </View>
          <View style={styles.openDetailsHint}>
            <Text style={styles.openDetailsText}>
              {activity.loanId ? 'View loan' : 'View loans'}
            </Text>
            <Icon name="chevron-right" size={14} color="#ff6700" />
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
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    padding: m(16),
    paddingBottom: m(100),
  },
  screenIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: m(18),
    padding: m(18),
    marginBottom: m(16),
    elevation: 4,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
  },
  introIconWrap: {
    width: m(52),
    height: m(52),
    borderRadius: m(16),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginRight: m(14),
  },
  introText: {
    flex: 1,
  },
  screenTitle: {
    fontSize: FontSizes.xl,
    fontFamily: FontFamily.secondaryBold,
    color: '#FFFFFF',
    marginBottom: m(4),
  },
  screenSubtitle: {
    fontSize: FontSizes.sm,
    color: '#FFF7ED',
    fontFamily: FontFamily.primaryRegular,
    lineHeight: m(19),
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    paddingVertical: m(14),
    paddingHorizontal: m(10),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primaryBold,
    color: '#111827',
    marginBottom: m(3),
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.primaryRegular,
    color: '#6B7280',
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    height: m(34),
    backgroundColor: '#E5E7EB',
  },
  activityItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    marginBottom: m(14),
    padding: m(14),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    borderLeftWidth: m(4),
  },
  activityTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: m(12),
  },
  activityIconShell: {
    width: m(44),
    height: m(44),
    borderRadius: m(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(12),
  },
  activityText: {
    flex: 1,
  },
  activityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(5),
    gap: m(8),
  },
  activityTitle: {
    flex: 1,
    fontSize: FontSizes.md,
    fontFamily: FontFamily.primarySemiBold,
    color: '#111827',
  },
  typePill: {
    maxWidth: m(116),
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(999),
  },
  typePillText: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.primarySemiBold,
  },
  activityDescription: {
    fontSize: FontSizes.sm,
    color: '#6B7280',
    fontFamily: FontFamily.primaryRegular,
    lineHeight: m(18),
  },
  activityMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(12),
    gap: m(8),
  },
  activityAmountContainer: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  activityAmount: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryBold,
  },
  activityBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: m(5),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  timelinePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: m(12),
  },
  timelineDot: {
    width: m(8),
    height: m(8),
    borderRadius: m(4),
    marginRight: m(8),
  },
  timelineLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
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
  openDetailsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: m(9),
    paddingVertical: m(5),
    borderRadius: m(10),
  },
  openDetailsText: {
    fontSize: FontSizes.xs,
    color: '#ff6700',
    fontFamily: FontFamily.primarySemiBold,
    marginRight: m(2),
  },
  loadingContainer: {
    padding: m(34),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loadingText: {
    marginTop: m(10),
    fontSize: FontSizes.sm,
    color: '#6B7280',
    fontFamily: FontFamily.primaryRegular,
  },
  emptyContainer: {
    padding: m(42),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyText: {
    marginTop: m(12),
    fontSize: FontSizes.base,
    color: '#9CA3AF',
    fontFamily: FontFamily.primaryRegular,
    textAlign: 'center',
  },
});
