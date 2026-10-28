import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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
 * Format relative / short human-readable timestamp
 */
const formatRelativeTime = (dateStr) => {
  if (!dateStr) return 'Recently';
  try {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return 'Recently';
  }
};

const stripEmojis = (str) => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Maps notification type to visual properties (icon, background, badge, theme color)
 * Replicates the web app notification logic & aesthetics.
 */
const getNotificationVisuals = (notification) => {
  const type = notification?.type || '';
  const title = (notification?.title || '').toLowerCase();

  if (
    type === 'emi_due_tomorrow' ||
    title.includes('due tomorrow')
  ) {
    return {
      icon: 'clock',
      iconColor: '#D97706',
      bgColor: '#FEF3C7',
      badgeLabel: 'DUE TOMORROW',
      badgeBg: '#FEF3C7',
      badgeText: '#B45309',
    };
  }

  if (
    type === 'emi_due_today' ||
    title.includes('due today')
  ) {
    return {
      icon: 'alert-circle',
      iconColor: '#EA580C',
      bgColor: '#FFEDD5',
      badgeLabel: 'DUE TODAY',
      badgeBg: '#FFEDD5',
      badgeText: '#C2410C',
    };
  }

  if (
    type === 'overdue_loan' ||
    title.includes('overdue')
  ) {
    return {
      icon: 'alert-triangle',
      iconColor: '#DC2626',
      bgColor: '#FEE2E2',
      badgeLabel: 'OVERDUE',
      badgeBg: '#FEE2E2',
      badgeText: '#991B1B',
    };
  }

  if (
    type === 'agreement_signed' ||
    type === 'agreement_ready' ||
    title.includes('agreement') ||
    title.includes('signed')
  ) {
    return {
      icon: 'file-text',
      iconColor: '#059669',
      bgColor: '#DCFCE7',
      badgeLabel: 'CONTRACT',
      badgeBg: '#E0F2FE',
      badgeText: '#0284C7',
    };
  }

  if (
    type === 'loan_received' ||
    title.includes('new loan application') ||
    title.includes('application received')
  ) {
    return {
      icon: 'inbox',
      iconColor: '#2563EB',
      bgColor: '#EFF6FF',
      badgeLabel: 'APPLICATION',
      badgeBg: '#EFF6FF',
      badgeText: '#2563EB',
    };
  }

  if (
    type === 'loan_accepted' ||
    type === 'loan_disbursed' ||
    type === 'loan_payment_confirmed' ||
    type === 'loan_given' ||
    type === 'loan_taken'
  ) {
    return {
      icon: 'check-circle',
      iconColor: '#10B981',
      bgColor: '#ECFDF5',
      badgeLabel:
        type === 'loan_payment_confirmed'
          ? 'PAYMENT'
          : type === 'loan_disbursed'
          ? 'DISBURSED'
          : 'SANCTIONED',
      badgeBg: '#DCFCE7',
      badgeText: '#059669',
    };
  }

  if (type === 'disbursal_otp' || title.includes('otp') || title.includes('verification code')) {
    return {
      icon: 'key',
      iconColor: '#D97706',
      bgColor: '#FEF3C7',
      badgeLabel: 'OTP CODE',
      badgeBg: '#FEF3C7',
      badgeText: '#D97706',
    };
  }

  if (type === 'loan_auto_rejected' || type === 'loan_rejected' || title.includes('declined')) {
    return {
      icon: 'x-circle',
      iconColor: '#EF4444',
      bgColor: '#FEE2E2',
      badgeLabel: type === 'loan_auto_rejected' ? 'EXPIRED' : 'DECLINED',
      badgeBg: '#FEE2E2',
      badgeText: '#DC2626',
    };
  }

  if (type === 'subscription_purchased' || title.includes('subscription')) {
    return {
      icon: 'credit-card',
      iconColor: '#7C3AED',
      bgColor: '#EDE9FE',
      badgeLabel: 'SUBSCRIPTION',
      badgeBg: '#EDE9FE',
      badgeText: '#7C3AED',
    };
  }

  return {
    icon: 'bell',
    iconColor: colors.lettersAndIcons,
    bgColor: colors.lightGreen,
    badgeLabel: 'INFO',
    badgeBg: colors.lightGreen,
    badgeText: colors.lettersAndIcons,
  };
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
      // Optimistic state update
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      await service.markAllNotificationsRead();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      // Re-fetch to synchronize in case of error
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
      // Lender Navigation
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
      // General fallbacks for lender
      if (type === 'loan_received') {
        navigation.navigate('LenderIncomingRequests');
        return;
      }
    } else {
      // Borrower Navigation
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

  const renderNotificationCard = ({ item }) => {
    const visuals = getNotificationVisuals(item);
    const cleanTitle = stripEmojis(item.title) || 'Notification';
    const cleanMessage = stripEmojis(item.message);

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          !item.isRead ? styles.notificationCardUnread : styles.notificationCardRead,
        ]}
        activeOpacity={0.82}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.cardHeaderRow}>
          {/* Visual Icon Badge */}
          <View style={[styles.iconContainer, { backgroundColor: visuals.bgColor }]}>
            <Feather name={visuals.icon} size={m(18)} color={visuals.iconColor} />
          </View>

          {/* Title & Message Content */}
          <View style={styles.cardContent}>
            <View style={styles.titleRow}>
              <View style={styles.badgeWrapper}>
                <View style={[styles.typeBadge, { backgroundColor: visuals.badgeBg }]}>
                  <Text style={[styles.typeBadgeText, { color: visuals.badgeText }]}>
                    {visuals.badgeLabel}
                  </Text>
                </View>
                {!item.isRead && <View style={styles.unreadDot} />}
              </View>

              <Text style={styles.timeText}>{formatRelativeTime(item.createdAt)}</Text>
            </View>

            <Text
              style={[
                styles.notificationTitle,
                !item.isRead && styles.notificationTitleUnread,
              ]}
              numberOfLines={2}
            >
              {cleanTitle}
            </Text>

            <Text style={styles.notificationMessage} numberOfLines={3}>
              {cleanMessage}
            </Text>

            {/* Optional Metadata Strip */}
            {(item.metadata?.amount || item.metadata?.otp || item.metadata?.lenderName || item.metadata?.borrowerName) ? (
              <View style={styles.metadataStrip}>
                {item.metadata?.amount ? (
                  <View style={styles.metaChip}>
                    <Feather name="credit-card" size={m(11)} color={colors.lettersAndIcons} />
                    <Text style={styles.metaChipText}>{formatINR(item.metadata.amount)}</Text>
                  </View>
                ) : null}

                {item.metadata?.lenderName ? (
                  <View style={styles.metaChip}>
                    <Feather name="briefcase" size={m(11)} color={colors.lettersAndIcons} />
                    <Text style={styles.metaChipText} numberOfLines={1}>
                      {item.metadata.lenderName}
                    </Text>
                  </View>
                ) : null}

                {item.metadata?.borrowerName ? (
                  <View style={styles.metaChip}>
                    <Feather name="user" size={m(11)} color={colors.lettersAndIcons} />
                    <Text style={styles.metaChipText} numberOfLines={1}>
                      {item.metadata.borrowerName}
                    </Text>
                  </View>
                ) : null}

                {item.metadata?.otp ? (
                  <View style={[styles.metaChip, styles.metaChipOtp]}>
                    <Feather name="key" size={m(11)} color="#D97706" />
                    <Text style={styles.metaChipOtpText}>OTP: {item.metadata.otp}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>

          {/* Right Chevron */}
          <View style={styles.chevronWrapper}>
            <Feather name="chevron-right" size={m(18)} color="#94A3B8" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper
      backgroundColor={colors.backgroundGreenWhite}
      topInsetBg={colors.primary}
      statusBarColor={colors.primary}
      statusBarStyle="dark-content"
      includeTabBarClearance={false}
      scrollable={false}
    >
      {/* ======================================================== */}
      {/* 1. TOP GREEN HEADER BANNER (Consistent with Design Language) */}
      {/* ======================================================== */}
      <View style={styles.topBanner}>
        {/* Top Navigation Row */}
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
          >
            <Feather name="chevron-left" size={m(22)} color={colors.lettersAndIcons} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
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
                  <Feather name="check-circle" size={m(13)} color={colors.lettersAndIcons} />
                  <Text style={styles.markAllBtnText}>Mark read</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={{ width: m(42) }} />
          )}
        </View>
      </View>

      {/* ======================================================== */}
      {/* 2. MAIN BODY SECTION WITH CURVED TOP                     */}
      {/* ======================================================== */}
      <View style={styles.sheetSection}>
        {/* Filter Tabs Row */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]}
            activeOpacity={0.8}
            onPress={() => setActiveTab('all')}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'all' && styles.tabButtonTextActive,
              ]}
            >
              All ({notifications.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'unread' && styles.tabButtonActive]}
            activeOpacity={0.8}
            onPress={() => setActiveTab('unread')}
          >
            <View style={styles.tabContentRow}>
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === 'unread' && styles.tabButtonTextActive,
                ]}
              >
                Unread
              </Text>
              {unreadCount > 0 && (
                <View
                  style={[
                    styles.tabBadge,
                    activeTab === 'unread' && styles.tabBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabBadgeText,
                      activeTab === 'unread' && styles.tabBadgeTextActive,
                    ]}
                  >
                    {unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Notifications List */}
        {loading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.lettersAndIcons} />
            <Text style={styles.loaderText}>Loading notifications...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredNotifications}
            keyExtractor={(item) => item._id || String(Math.random())}
            renderItem={renderNotificationCard}
            contentContainerStyle={styles.listContentContainer}
            showsVerticalScrollIndicator={false}
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
                    : 'Updates about your loan requests, sanctions, disbursal verification codes, and payments will show up here.'}
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
  // ==========================================
  // TOP GREEN BANNER
  // ==========================================
  topBanner: {
    backgroundColor: colors.primary,
    paddingHorizontal: m(18),
    paddingTop: m(12),
    paddingBottom: m(20),
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: m(40),
    height: m(40),
    borderRadius: m(20),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: m(8),
  },
  headerTag: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: 1.2,
    opacity: 0.8,
  },
  headerTitle: {
    fontSize: m(20),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: -0.3,
    marginTop: m(1),
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(5),
    backgroundColor: colors.white,
    paddingHorizontal: m(10),
    paddingVertical: m(8),
    borderRadius: m(16),
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  markAllBtnText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  // ==========================================
  // MAIN BODY SECTION
  // ==========================================
  sheetSection: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(28),
    borderTopRightRadius: m(28),
    marginTop: -m(10),
    paddingTop: m(16),
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: m(16),
    gap: m(10),
    marginBottom: m(14),
  },
  tabButton: {
    paddingHorizontal: m(16),
    paddingVertical: m(8),
    borderRadius: m(20),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabButtonActive: {
    backgroundColor: colors.lettersAndIcons,
    borderColor: colors.lettersAndIcons,
  },
  tabButtonText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  tabButtonTextActive: {
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  tabContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  tabBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: m(6),
    paddingVertical: m(1),
    borderRadius: m(10),
  },
  tabBadgeActive: {
    backgroundColor: colors.primary,
  },
  tabBadgeText: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  tabBadgeTextActive: {
    color: colors.lettersAndIcons,
  },

  // ==========================================
  // NOTIFICATION CARDS
  // ==========================================
  listContentContainer: {
    paddingHorizontal: m(16),
    paddingBottom: m(40),
  },
  notificationCard: {
    borderRadius: m(20),
    padding: m(14),
    marginBottom: m(12),
    borderWidth: 1,
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  notificationCardUnread: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.primary,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  notificationCardRead: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    opacity: 0.92,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: m(42),
    height: m(42),
    borderRadius: m(14),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(12),
  },
  cardContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(4),
  },
  badgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  typeBadge: {
    paddingHorizontal: m(8),
    paddingVertical: m(2),
    borderRadius: m(6),
  },
  typeBadgeText: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    letterSpacing: 0.5,
  },
  unreadDot: {
    width: m(7),
    height: m(7),
    borderRadius: m(3.5),
    backgroundColor: '#EF4444',
  },
  timeText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryMedium,
    color: '#94A3B8',
  },
  notificationTitle: {
    fontSize: m(14),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.lettersAndIcons,
    lineHeight: m(19),
    marginBottom: m(4),
  },
  notificationTitleUnread: {
    fontFamily: FontFamily.primaryBold,
  },
  notificationMessage: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryRegular,
    color: '#4A6563',
    lineHeight: m(17.5),
  },
  metadataStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(6),
    marginTop: m(8),
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: colors.backgroundGreenWhite,
    paddingHorizontal: m(8),
    paddingVertical: m(3.5),
    borderRadius: m(8),
    borderWidth: 1,
    borderColor: colors.lightGreen,
  },
  metaChipText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  metaChipOtp: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  metaChipOtpText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: '#D97706',
  },
  chevronWrapper: {
    paddingLeft: m(8),
    paddingTop: m(2),
  },

  // ==========================================
  // LOADING & EMPTY STATES
  // ==========================================
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: m(60),
  },
  loaderText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
    marginTop: m(12),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(60),
    paddingHorizontal: m(30),
  },
  emptyIconCircle: {
    width: m(68),
    height: m(68),
    borderRadius: m(34),
    backgroundColor: colors.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(16),
  },
  emptyTitle: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(6),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryRegular,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: m(18),
  },
});
