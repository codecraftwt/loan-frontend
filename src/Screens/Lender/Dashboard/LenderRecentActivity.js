import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { useDispatch, useSelector } from 'react-redux';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import { colors, FontFamily, FontSizes } from '../../../constants';
import { getLenderRecentActivities } from '../../../Redux/Slices/lenderActivitiesSlice';
import { getLenderStatistics } from '../../../Redux/Slices/loanSlice';
import { getActivePlan } from '../../../Redux/Slices/planPurchaseSlice';

const getActivityProperties = activity => {
  const activityType = activity.type || '';

  switch (activityType) {
    case 'payment_received':
      return {
        icon: 'dollar-sign',
        color: '#27ae60',
        gradient: ['#27ae60', '#2ecc71'],
      };
    case 'loan_paid':
    case 'loan_accepted':
      return {
        icon: 'check-circle',
        color: '#10B981',
        gradient: ['#10B981', '#34D399'],
      };
    case 'loan_rejected':
      return {
        icon: 'x-circle',
        color: '#EF4444',
        gradient: ['#EF4444', '#F87171'],
      };
    case 'loan_created':
      return {
        icon: 'arrow-up-right',
        color: '#ff6700',
        gradient: ['#ff8a00', '#ff6700'],
      };
    case 'loan_overdue':
      return {
        icon: 'alert-circle',
        color: '#F59E0B',
        gradient: ['#F59E0B', '#F97316'],
      };
    default:
      return {
        icon: 'activity',
        color: '#64748B',
        gradient: ['#64748B', '#94A3B8'],
      };
  }
};

const getActivityLabel = activity => (
  (activity.type || 'activity')
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
);

export default function LenderRecentActivity() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {
    activities: recentActivities,
    loading,
    error,
  } = useSelector(state => state.lenderActivities);
  const { isActive: isSubscriptionActive } = useSelector(state => state.planPurchase);
  const [refreshing, setRefreshing] = useState(false);

  const loadActivities = useCallback(async () => {
    await Promise.all([
      dispatch(getLenderRecentActivities({ limit: 50 })),
      dispatch(getLenderStatistics()),
      dispatch(getActivePlan()),
    ]);
  }, [dispatch]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadActivities();
    setRefreshing(false);
  };

  const handleActivityPress = activity => {
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

  const totalAmount = recentActivities.reduce(
    (sum, activity) => sum + (Number(activity.amount) || 0),
    0,
  );
  const loanLinkedCount = recentActivities.filter(activity => activity.loanId).length;

  const renderActivity = ({ item }) => (
    <LenderActivityItem
      activity={item}
      activityProps={getActivityProperties(item)}
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
          if (activity.timestamp) return `${activity.timestamp}-${index}`;
          return `activity-${index}-${activity.type || 'unknown'}`;
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.ink]}
            tintColor={colors.ink}
          />
        }
        ListHeaderComponent={
          <>
            <View style={styles.screenIntro}>
              <View style={styles.introIconWrap}>
                <Icon name="activity" size={22} color={colors.ink} />
              </View>
              <View style={styles.introText}>
                <Text style={styles.screenTitle}>Recent Activity</Text>
                <Text style={styles.screenSubtitle}>
                  Track loan creation, borrower decisions, payments, and overdue updates.
                </Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <View style={[styles.summaryItem, { backgroundColor: colors.sky }]}>
                <Text style={styles.summaryValue}>{recentActivities.length}</Text>
                <Text style={styles.summaryLabel}>Updates</Text>
              </View>
              <View style={[styles.summaryItem, { backgroundColor: colors.mint }]}>
                <Text style={styles.summaryValue}>{loanLinkedCount}</Text>
                <Text style={styles.summaryLabel}>Linked Loans</Text>
              </View>
              <View style={[styles.summaryItem, { backgroundColor: colors.butter }]}>
                <Text style={styles.summaryValue}>
                  Rs {totalAmount.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.summaryLabel}>Amount</Text>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.ink} />
              <Text style={styles.loadingText}>Loading activities...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name={error ? 'alert-circle' : 'inbox'} size={42} color={colors.border} />
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

const LenderActivityItem = memo(
  ({ activity, activityProps, onPress }) => {
    const activityLabel = getActivityLabel(activity);

    return (
      <TouchableOpacity activeOpacity={0.78} onPress={onPress}>
        <View style={styles.activityItem}>
          <View style={styles.activityTopRow}>
            <View
              style={[
                styles.activityIconShell,
                { backgroundColor: `${activityProps.color}18` },
              ]}>
              <Icon name={activityProps.icon} size={18} color={activityProps.color} />
            </View>
            <View style={styles.activityText}>
              <Text style={styles.activityTitle} numberOfLines={1}>
                {activity.shortMessage || activityLabel}
              </Text>
              <Text style={styles.activityDescription} numberOfLines={2}>
                {activity.message || ''}
              </Text>
            </View>
            <Icon name="chevron-right" size={18} color={colors.textMuted} />
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
        </View>
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F0ED',
  },
  listContent: {
    padding: m(16),
    paddingBottom: m(100),
  },
  screenIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: m(20),
    padding: m(16),
    marginBottom: m(16),
    backgroundColor: colors.navyFaint,
    borderWidth: 1,
    borderColor: colors.navyBorder,
  },
  introIconWrap: {
    width: m(48),
    height: m(48),
    borderRadius: m(15),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.mint,
    marginRight: m(12),
  },
  introText: {
    flex: 1,
  },
  screenTitle: {
    fontSize: m(20),
    lineHeight: m(26),
    fontFamily: FontFamily.primaryExtraBold,
    color: colors.ink,
    marginBottom: m(4),
  },
  screenSubtitle: {
    fontSize: m(12),
    color: colors.textSecondary,
    fontFamily: FontFamily.primaryRegular,
    lineHeight: m(17),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: m(16),
    gap: m(10),
  },
  summaryItem: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    minHeight: m(78),
    borderRadius: m(16),
    padding: m(12),
  },
  summaryValue: {
    fontSize: m(15),
    lineHeight: m(20),
    fontFamily: FontFamily.primaryExtraBold,
    color: colors.ink,
    marginBottom: m(4),
  },
  summaryLabel: {
    fontSize: m(10),
    lineHeight: m(14),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.inkSoft,
    textTransform: 'uppercase',
  },
  activityItem: {
    backgroundColor: colors.surface,
    borderRadius: m(18),
    marginBottom: m(12),
    padding: m(14),
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  activityTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(10),
  },
  activityIconShell: {
    width: m(42),
    height: m(42),
    borderRadius: m(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(12),
  },
  activityText: {
    flex: 1,
  },
  activityTitle: {
    fontSize: m(14),
    lineHeight: m(19),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.ink,
    marginBottom: m(3),
  },
  activityDescription: {
    fontSize: m(12),
    color: colors.textSecondary,
    fontFamily: FontFamily.primaryRegular,
    lineHeight: m(17),
  },
  activityMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: m(8),
  },
  activityAmountContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: m(9),
    paddingVertical: m(5),
    borderRadius: m(999),
  },
  activityAmount: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityTime: {
    fontSize: m(11),
    color: colors.textMuted,
    fontFamily: FontFamily.primaryRegular,
    marginLeft: m(4),
  },
  loadingContainer: {
    padding: m(34),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: m(16),
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  loadingText: {
    marginTop: m(10),
    fontSize: FontSizes.sm,
    color: colors.textSecondary,
    fontFamily: FontFamily.primaryRegular,
  },
  emptyContainer: {
    padding: m(42),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: m(16),
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyText: {
    marginTop: m(12),
    fontSize: FontSizes.base,
    color: colors.textMuted,
    fontFamily: FontFamily.primaryRegular,
    textAlign: 'center',
  },
});
