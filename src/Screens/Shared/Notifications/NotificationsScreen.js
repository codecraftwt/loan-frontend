import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { useSelector } from 'react-redux';
import { colors, FontFamily } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper, showAlert } from '../../../Components/common';
import lenderFlowService from '../../../Services/lenderFlowService';
import borrowerFlowService from '../../../Services/borrowerFlowService';
import NotificationService from '../../../Services/NotificationService';

/**
 * Format currency to Indian Rupee (INR) representation
 */
const formatINR = (val) => {
  if (!val && val !== 0) return '₹0';
  const num = Number(val) || 0;
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lakh`;
  return `₹${num.toLocaleString('en-IN')}`;
};

/**
 * Format timestamp matching design screenshot: "17:00 - April 24"
 */
const formatNotificationTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const month = d.toLocaleDateString('en-US', { month: 'long' });
    const day = d.getDate();
    return `${hours}:${mins} - ${month} ${day}`;
  } catch {
    return '';
  }
};

/**
 * Strips unwanted emoji symbols from backend titles/messages
 */
const stripEmojis = (str) => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{FE00}-\u{FE0F}\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Computes section group label: Today, Yesterday, This Weekend, This Week, Earlier
 */
const getGroupLabel = (dateStr) => {
  if (!dateStr) return 'Earlier';
  try {
    const now = new Date();
    const d = new Date(dateStr);

    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    if (isToday) return 'Today';

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();
    if (isYesterday) return 'Yesterday';

    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return 'This Weekend';
      }
      return 'This Week';
    }

    return 'Earlier';
  } catch {
    return 'Earlier';
  }
};

/**
 * Maps notification content to matching line-art icon (Bell, Star, Dollar, Arrow, Inbox, File)
 */
const getNotificationIcon = (notification) => {
  const type = notification?.type || '';
  const title = (notification?.title || '').toLowerCase();

  if (
    type === 'loan_payment_confirmed' ||
    title.includes('transaction') ||
    title.includes('payment') ||
    title.includes('paid')
  ) {
    return 'dollar-sign';
  }

  if (
    type === 'disbursal_otp' ||
    type === 'loan_disbursed' ||
    title.includes('expense') ||
    title.includes('disburs')
  ) {
    return 'arrow-down-left';
  }

  if (
    title.includes('update') ||
    title.includes('new update') ||
    title.includes('feature') ||
    type === 'subscription_purchased'
  ) {
    return 'star';
  }

  if (
    type === 'agreement_signed' ||
    type === 'agreement_ready' ||
    title.includes('agreement') ||
    title.includes('contract')
  ) {
    return 'file-text';
  }

  if (
    type === 'loan_accepted' ||
    title.includes('approved') ||
    title.includes('sanctioned')
  ) {
    return 'check-circle';
  }

  if (
    type === 'loan_received' ||
    title.includes('application') ||
    title.includes('inquiry')
  ) {
    return 'inbox';
  }

  return 'bell';
};

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const user = useSelector((state) => state.auth?.user);
  const isLender = Number(user?.roleId) === 1 || user?.role === 'lender';

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const [markingAll, setMarkingAll] = useState(false);

  // Dynamic Service Selection based on user role (Lender or Borrower)
  const service = useMemo(() => {
    return isLender ? lenderFlowService : borrowerFlowService;
  }, [isLender]);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await service.getNotifications();
      if (res?.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      if (err?.response?.status !== 401) {
        console.error('Error fetching notifications:', err);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [service]);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  // Real-time foreground notification listener to refresh list immediately
  React.useEffect(() => {
    const unsubscribe = NotificationService.addListener(() => {
      fetchNotifications(true);
    });
    return unsubscribe;
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(true);
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || markingAll) return;
    try {
      setMarkingAll(true);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      await service.markAllNotificationsRead();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      fetchNotifications(true);
    } finally {
      setMarkingAll(false);
    }
  };

  // Handle single notification press
  const handleNotificationPress = async (item) => {
    // 1. Mark as read optimistically if unread
    if (!item.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      service.markNotificationRead(item._id).catch((err) => {
        console.error(`Error marking notification read ${item._id}:`, err);
      });
    }

    const { metadata = {}, type } = item;

    // 2. Disbursal OTP popup
    if (type === 'disbursal_otp' && metadata.otp) {
      showAlert(
        'Disbursal Verification Code',
        `Your 6-digit loan verification code is:\n\n${metadata.otp}\n\nShare this code with your lender to authorize and confirm instant disbursal.`,
        [{ text: 'Close', style: 'cancel' }]
      );
      return;
    }

    // 3. Navigation routing based on metadata & role
    if (isLender) {
      if (metadata.applicationId) {
        navigation.navigate('LenderRequestDetails', {
          requestId: metadata.applicationId,
        });
        return;
      }
      if (metadata.loanId) {
        navigation.navigate('LenderLoanDetails', {
          loanId: metadata.loanId,
        });
        return;
      }
      if (type === 'loan_received') {
        navigation.navigate('LenderIncomingRequests');
        return;
      }
    } else {
      if (metadata.applicationId) {
        navigation.navigate('BorrowerApplications');
        return;
      }
      if (metadata.loanId) {
        navigation.navigate('BorrowerLoanDetails', {
          id: metadata.loanId,
          loan: { _id: metadata.loanId },
        });
        return;
      }
      if (type === 'loan_accepted' || type === 'agreement_signed') {
        navigation.navigate('BorrowerApplications');
        return;
      }
      if (type === 'loan_disbursed' || type === 'loan_payment_confirmed') {
        navigation.navigate('BorrowerLoansPortfolio');
        return;
      }
    }
  };

  // Filtered notifications based on active tab
  const filteredNotifications = useMemo(() => {
    if (activeTab === 'unread') {
      return notifications.filter((n) => !n.isRead);
    }
    return notifications;
  }, [notifications, activeTab]);

  // Grouped by time section: Today, Yesterday, This Weekend, This Week, Earlier
  const groupedSections = useMemo(() => {
    const groups = {};
    const order = ['Today', 'Yesterday', 'This Weekend', 'This Week', 'Earlier'];

    filteredNotifications.forEach((item) => {
      const label = getGroupLabel(item.createdAt);
      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    });

    return order
      .filter((key) => groups[key] && groups[key].length > 0)
      .map((key) => ({
        title: key,
        data: groups[key],
      }));
  }, [filteredNotifications]);

  // Render individual notification row matching the design screenshot
  const renderNotificationRow = ({ item }) => {
    const iconName = getNotificationIcon(item);
    const cleanTitle = stripEmojis(item.title) || 'Notification';
    const cleanMessage = stripEmojis(item.message);
    const formattedTime = formatNotificationTime(item.createdAt);

    // Build blue metadata tag if details exist
    const metaParts = [];
    if (item.metadata?.purpose) metaParts.push(item.metadata.purpose);
    if (item.metadata?.borrowerName) metaParts.push(item.metadata.borrowerName);
    if (item.metadata?.lenderName) metaParts.push(item.metadata.lenderName);
    if (item.metadata?.amount) metaParts.push(formatINR(item.metadata.amount));
    if (item.metadata?.otp) metaParts.push(`OTP: ${item.metadata.otp}`);
    const metaString = metaParts.join(' | ');

    return (
      <TouchableOpacity
        style={styles.notificationItem}
        activeOpacity={0.75}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.itemRow}>
          {/* Mint-Green Rounded Square Icon */}
          <View style={styles.iconSquare}>
            <Feather name={iconName} size={m(21)} color={colors.lettersAndIcons} />
          </View>

          {/* Text Content */}
          <View style={styles.contentCol}>
            {/* Title & Unread Indicator */}
            <View style={styles.titleRow}>
              <Text style={styles.itemTitle} numberOfLines={1}>
                {cleanTitle}
              </Text>
              {!item.isRead && <View style={styles.unreadDot} />}
            </View>

            {/* Description Subtitle */}
            {cleanMessage ? (
              <Text style={styles.itemMessage} numberOfLines={2}>
                {cleanMessage}
              </Text>
            ) : null}

            {/* Blue Details Tag Strip */}
            {metaString ? (
              <Text style={styles.metaText} numberOfLines={1}>
                {metaString}
              </Text>
            ) : null}

            {/* Bottom Right Sky-Blue Timestamp */}
            {formattedTime ? (
              <Text style={styles.timestampText}>{formattedTime}</Text>
            ) : null}
          </View>
        </View>

        {/* Mint Horizontal Divider Line */}
        <View style={styles.dividerLine} />
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper
      backgroundColor={colors.primary}
      topInsetBg={colors.primary}
      statusBarColor={colors.primary}
      statusBarStyle="dark-content"
      includeTabBarClearance={false}
      scrollable={false}
    >
      {/* ── 1. Top Green Header Bar ── */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <Feather name="chevron-left" size={m(22)} color={colors.lettersAndIcons} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>

        {unreadCount > 0 ? (
          <TouchableOpacity
            style={styles.markAllBtn}
            activeOpacity={0.8}
            onPress={handleMarkAllRead}
            disabled={markingAll}
          >
            {markingAll ? (
              <ActivityIndicator size="small" color={colors.lettersAndIcons} />
            ) : (
              <>
                <Feather name="check" size={m(13)} color={colors.lettersAndIcons} />
                <Text style={styles.markAllBtnText}>Mark read</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={{ width: m(38) }} />
        )}
      </View>

      {/* ── 2. Curved Main Mint-White Sheet ── */}
      <View style={styles.sheetSection}>
        {/* Filter Pills: All / Unread */}
        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            style={[styles.filterPill, activeTab === 'all' && styles.filterPillActive]}
            activeOpacity={0.8}
            onPress={() => setActiveTab('all')}
          >
            <Text
              style={[
                styles.filterPillText,
                activeTab === 'all' && styles.filterPillTextActive,
              ]}
            >
              All ({notifications.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, activeTab === 'unread' && styles.filterPillActive]}
            activeOpacity={0.8}
            onPress={() => setActiveTab('unread')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text
                style={[
                  styles.filterPillText,
                  activeTab === 'unread' && styles.filterPillTextActive,
                ]}
              >
                Unread
              </Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadgePill}>
                  <Text style={styles.unreadBadgePillText}>{unreadCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Notifications Grouped SectionList */}
        {loading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.lettersAndIcons} />
            <Text style={styles.loaderText}>Loading notifications...</Text>
          </View>
        ) : (
          <SectionList
            sections={groupedSections}
            keyExtractor={(item, index) => item._id || String(index)}
            renderItem={renderNotificationRow}
            renderSectionHeader={({ section: { title } }) => (
              <Text style={styles.sectionHeaderTitle}>{title}</Text>
            )}
            contentContainerStyle={styles.listContentContainer}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.lettersAndIcons]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Feather name="bell-off" size={m(32)} color={colors.lettersAndIcons} />
                </View>
                <Text style={styles.emptyTitle}>
                  {activeTab === 'unread' ? 'No Unread Notifications' : 'No Notifications Yet'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {activeTab === 'unread'
                    ? 'All your alerts have been marked as read.'
                    : 'Updates about your loans, sanctions, repayments, and deals will appear here.'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  // ── 1. Top Green Header Bar ──
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: m(16),
    paddingTop: m(10),
    paddingBottom: m(14),
    backgroundColor: colors.primary,
  },
  backBtn: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: m(12),
  },
  headerTitle: {
    fontSize: m(18),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: colors.white,
    paddingHorizontal: m(10),
    paddingVertical: m(7),
    borderRadius: m(16),
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  markAllBtnText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  // ── 2. Curved Main Body Section ──
  sheetSection: {
    flex: 1,
    backgroundColor: '#F1FAF6', // Soft mint-green tinted background from screenshot
    borderTopLeftRadius: m(32),
    borderTopRightRadius: m(32),
    paddingTop: m(16),
  },
  filterPillsRow: {
    flexDirection: 'row',
    paddingHorizontal: m(18),
    gap: m(8),
    marginBottom: m(6),
  },
  filterPill: {
    paddingHorizontal: m(14),
    paddingVertical: m(6),
    borderRadius: m(16),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 158, 0.35)',
  },
  filterPillActive: {
    backgroundColor: colors.lettersAndIcons,
    borderColor: colors.lettersAndIcons,
  },
  filterPillText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  filterPillTextActive: {
    color: colors.white,
    fontFamily: FontFamily.primaryBold,
  },
  unreadBadgePill: {
    backgroundColor: '#EF4444',
    paddingHorizontal: m(5),
    paddingVertical: m(1),
    borderRadius: m(8),
    marginLeft: m(5),
  },
  unreadBadgePillText: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },

  // ── Section Headers (Today, Yesterday, This Weekend, etc.) ──
  sectionHeaderTitle: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: '#334155',
    marginTop: m(16),
    marginBottom: m(8),
    paddingHorizontal: m(18),
  },

  // ── Notification Items Matching Design Screenshot ──
  listContentContainer: {
    paddingBottom: m(40),
  },
  notificationItem: {
    paddingHorizontal: m(18),
    paddingTop: m(4),
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconSquare: {
    width: m(46),
    height: m(46),
    borderRadius: m(14),
    backgroundColor: '#00D09E', // Vibrant mint green from screenshot
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(12),
    marginTop: m(2),
  },
  contentCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(2),
  },
  itemTitle: {
    fontSize: m(14.5),
    fontFamily: FontFamily.primaryBold,
    color: '#1E293B',
    flex: 1,
  },
  unreadDot: {
    width: m(6.5),
    height: m(6.5),
    borderRadius: m(3.5),
    backgroundColor: '#00D09E',
    marginLeft: m(6),
  },
  itemMessage: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: '#475569',
    lineHeight: m(17),
  },
  metaText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryBold,
    color: '#0284C7', // Sky-blue tag from screenshot
    marginTop: m(3),
  },
  timestampText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryMedium,
    color: '#38BDF8', // Timestamp sky-blue from screenshot
    alignSelf: 'flex-end',
    marginTop: m(4),
  },
  dividerLine: {
    height: 1,
    backgroundColor: 'rgba(0, 208, 158, 0.45)', // Thin mint divider line from screenshot
    marginTop: m(8),
    marginBottom: m(6),
  },

  // ── Empty & Loading States ──
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: m(60),
  },
  loaderText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
    marginTop: m(10),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(60),
    paddingHorizontal: m(32),
  },
  emptyIconCircle: {
    width: m(64),
    height: m(64),
    borderRadius: m(32),
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: m(14),
  },
  emptyTitle: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(6),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: m(17),
  },
});
