import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { m } from '../../../Utils/responsive';
import { colors, FontFamily } from '../../../constants';
import { ScreenWrapper } from '../../../Components/common';
import { getAdminRecentActivities } from '../../../Redux/Slices/adminActivitiesSlice';

export default function AdminActivityDetailsScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { activities = [], loading } = useSelector(state => state.adminActivities);
  const [refreshing, setRefreshing] = useState(false);

  const loadActivities = useCallback(() => {
    dispatch(getAdminRecentActivities({ limit: 50 }));
  }, [dispatch]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(getAdminRecentActivities({ limit: 50 })).finally(() =>
      setRefreshing(false),
    );
  }, [dispatch]);

  // Format time and date like "17:00 - April 24"
  const formatTimeDate = dateStr => {
    if (!dateStr) return 'Recent';
    try {
      const date = new Date(dateStr);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const monthNames = [
        'Jan', 'Feb', 'March', 'April', 'May', 'June',
        'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec',
      ];
      const month = monthNames[date.getMonth()];
      const day = date.getDate();
      return `${hours}:${minutes} - ${month} ${day}`;
    } catch {
      return 'Recent';
    }
  };

  // Map activity type to appropriate icon, title, and metadata
  const getActivityConfig = item => {
    const type = item.type || item.action || '';
    switch (type.toLowerCase()) {
      case 'subscription_purchased':
      case 'subscription':
      case 'payment':
        return {
          icon: 'dollar-sign',
          title: item.title || 'Transactions',
          defaultDesc: 'A new transaction has been registered',
          category: 'Subscription | Billing',
        };
      case 'plan_updated':
      case 'plan_created':
      case 'plan':
        return {
          icon: 'star',
          title: item.title || 'New Update',
          defaultDesc: 'Plan tier configuration updated successfully',
          category: 'Platform Settings',
        };
      case 'lender_registered':
      case 'user_created':
      case 'onboarding':
        return {
          icon: 'bell',
          title: item.title || 'Reminder!',
          defaultDesc: 'New institution registered and pending verification',
          category: 'User Management',
        };
      case 'expense':
      case 'payout':
        return {
          icon: 'arrow-down-left',
          title: item.title || 'Expense Record',
          defaultDesc: 'Disbursement operation completed',
          category: 'Payouts | Direct',
        };
      default:
        return {
          icon: 'bell',
          title: item.title || item.action || 'Platform Event',
          defaultDesc: 'System operation logged successfully',
          category: 'Audit Log',
        };
    }
  };

  // Group activities chronologically: Today, Yesterday, This Weekend / Earlier
  const sections = useMemo(() => {
    if (!activities || activities.length === 0) return [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const groups = {
      Today: [],
      Yesterday: [],
      'This Weekend': [],
      Earlier: [],
    };

    activities.forEach(item => {
      const itemDate = new Date(item.createdAt || item.timestamp || Date.now());
      const itemDay = new Date(
        itemDate.getFullYear(),
        itemDate.getMonth(),
        itemDate.getDate(),
      );

      if (itemDay.getTime() === today.getTime()) {
        groups.Today.push(item);
      } else if (itemDay.getTime() === yesterday.getTime()) {
        groups.Yesterday.push(item);
      } else if (itemDay >= sevenDaysAgo) {
        groups['This Weekend'].push(item);
      } else {
        groups.Earlier.push(item);
      }
    });

    return Object.keys(groups)
      .filter(key => groups[key].length > 0)
      .map(key => ({
        title: key,
        data: groups[key],
      }));
  }, [activities]);

  const renderItem = ({ item }) => {
    const config = getActivityConfig(item);
    const timeFormatted = formatTimeDate(item.createdAt || item.timestamp);
    const desc = item.description || item.details || config.defaultDesc;

    return (
      <View style={styles.activityRow}>
        {/* Mint Green Squircle Icon */}
        <View style={styles.iconBox}>
          <Feather name={config.icon} size={m(20)} color={colors.lettersAndIcons} />
        </View>

        {/* Content Section */}
        <View style={styles.contentCol}>
          <Text style={styles.itemTitle}>{config.title}</Text>
          <Text style={styles.itemDesc} numberOfLines={2}>
            {desc}
          </Text>

          {config.category ? (
            <Text style={styles.categoryTag} numberOfLines={1}>
              {config.category}
            </Text>
          ) : null}

          {/* Time & Date - Soft Blue */}
          <Text style={styles.timestampText}>{timeFormatted}</Text>
        </View>
      </View>
    );
  };

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  return (
    <ScreenWrapper
      backgroundColor={colors.backgroundGreenWhite}
      topInsetBg={colors.primary}
      statusBarColor={colors.primary}
      statusBarStyle="dark-content"
      includeTabBarClearance={false}
      scrollable={false}
    >
      <View style={styles.pageWrapper}>
        {/* Fixed Top Mint Green Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={m(22)} color={colors.white} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Platform Activity Log</Text>

          <View style={styles.headerPlaceholder} />
        </View>

        {/* Curved Sheet Container */}
        <View style={styles.sheetSection}>
          {loading && !refreshing && activities.length === 0 ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Fetching activity audit trail...</Text>
            </View>
          ) : (
            <SectionList
              sections={sections}
              keyExtractor={(item, index) => item._id || item.id || String(index)}
              renderItem={renderItem}
              renderSectionHeader={renderSectionHeader}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[colors.primary]}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <Feather name="activity" size={m(28)} color={colors.lettersAndIcons} />
                  </View>
                  <Text style={styles.emptyTitle}>No Activities Recorded</Text>
                  <Text style={styles.emptySubtitle}>
                    Live events, subscriptions, and audit logs will appear here.
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  pageWrapper: {
    flex: 1,
    backgroundColor: colors.primary,
  },

  // Fixed Top Mint Green Header
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: m(18),
    paddingTop: m(12),
    paddingBottom: m(16),
  },
  backBtn: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    backgroundColor: 'rgba(9, 48, 48, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: m(18),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: m(36),
  },

  // Curved Sheet Container
  sheetSection: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(36),
    borderTopRightRadius: m(36),
    paddingTop: m(8),
  },
  listContent: {
    paddingHorizontal: m(20),
    paddingBottom: m(60),
  },

  // Section Headers (Today, Yesterday, This Weekend)
  sectionHeaderRow: {
    paddingTop: m(16),
    paddingBottom: m(6),
  },
  sectionHeaderText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryMedium,
    color: '#5A7A71',
  },

  // Activity Row Item
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: m(14),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 208, 158, 0.22)',
  },
  iconBox: {
    width: m(42),
    height: m(42),
    borderRadius: m(14),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(14),
    marginTop: m(2),
  },
  contentCol: {
    flex: 1,
  },
  itemTitle: {
    fontSize: m(14.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    lineHeight: m(19),
  },
  itemDesc: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: '#4A6563',
    lineHeight: m(17),
    marginTop: m(3),
  },
  categoryTag: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryMedium,
    color: '#3299FF',
    marginTop: m(4),
  },
  timestampText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryMedium,
    color: '#3299FF',
    alignSelf: 'flex-end',
    marginTop: m(4),
  },

  // Loading & Empty States
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: m(60),
  },
  loadingText: {
    marginTop: m(10),
    fontSize: m(13),
    fontFamily: FontFamily.primaryMedium,
    color: '#5A7A71',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: m(80),
  },
  emptyIconCircle: {
    width: m(54),
    height: m(54),
    borderRadius: m(27),
    backgroundColor: colors.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(12),
  },
  emptyTitle: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginTop: m(4),
  },
  emptySubtitle: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: '#7E9D86',
    textAlign: 'center',
    marginTop: m(4),
    paddingHorizontal: m(30),
    lineHeight: m(18),
  },
});
