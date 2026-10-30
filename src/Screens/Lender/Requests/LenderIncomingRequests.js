import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { colors, FontFamily } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper, showAlert } from '../../../Components/common';
import lenderFlowService from '../../../Services/lenderFlowService';

// Filter options for modal
const FILTER_TABS = [
  {
    key: 'pending',
    label: 'Pending',
    icon: 'clock',
    iconColor: '#d97706',
    iconBg: '#fef3c7',
  },
  {
    key: 'accepted',
    label: 'Accepted',
    icon: 'check-circle',
    iconColor: '#059669',
    iconBg: '#ecfdf5',
  },
  {
    key: 'rejected',
    label: 'Declined',
    icon: 'x-circle',
    iconColor: '#dc2626',
    iconBg: '#fee2e2',
  },
  {
    key: 'all',
    label: 'All Requests',
    icon: 'inbox',
    iconColor: '#2563eb',
    iconBg: '#eff6ff',
  },
];

export default function LenderIncomingRequests() {
  const navigation = useNavigation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'accepted' | 'rejected' | 'all'
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Quick Reject Modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await lenderFlowService.getIncomingRequests({
        status: activeTab === 'all' ? undefined : activeTab,
        search: search.trim() || undefined,
      });

      if (res?.success && res.requests) {
        setRequests(res.requests);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error('Error fetching incoming requests:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, search]);

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, [fetchRequests])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const formatINR = (val) => {
    if (!val && val !== 0) return '₹0';
    const num = Number(val) || 0;
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lakh`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  // 48-Hour Countdown Calculation
  const calculateCountdown = (createdAt) => {
    if (!createdAt) return null;
    const created = new Date(createdAt).getTime();
    const expiresAt = created + 48 * 60 * 60 * 1000;
    const diff = expiresAt - Date.now();

    if (diff <= 0) {
      return { text: 'Review Window Expired', urgent: true };
    }
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const urgent = hours < 12;

    return {
      text: `${hours}h ${mins}m left to review`,
      urgent,
    };
  };

  // Quick Reject
  const handleConfirmReject = async () => {
    if (!selectedRequest) return;
    try {
      setActionLoading(true);
      const res = await lenderFlowService.rejectLoanRequest(
        selectedRequest._id,
        rejectReason.trim() || 'Credit requirements not satisfied'
      );
      if (res?.success) {
        showAlert('Request Declined', 'Borrower has been notified of the decision.');
        setRejectModalVisible(false);
        setRejectReason('');
        setSelectedRequest(null);
        fetchRequests();
      } else {
        showAlert('Action Failed', res?.message || 'Unable to decline request.');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to decline application.';
      showAlert('Error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const borrowerName =
      item.borrowerSnapshot?.businessName ||
      item.borrowerSnapshot?.userName ||
      item.borrowerId?.companyName ||
      item.borrowerId?.userName ||
      'Commercial Borrower';

    const creditScore =
      item.borrowerSnapshot?.creditScore ||
      item.borrowerId?.borrowerProfile?.creditScore ||
      750;

    const riskGrade =
      item.borrowerSnapshot?.riskGrade ||
      item.borrowerId?.borrowerProfile?.riskGrade ||
      (creditScore >= 750 ? 'A+' : creditScore >= 680 ? 'A' : 'B');

    const countdown = item.status === 'pending' ? calculateCountdown(item.createdAt) : null;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('LenderRequestDetails', {
            requestId: item._id,
            request: item,
          })
        }
        activeOpacity={0.8}
      >
        {/* Top Header Row */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.activityIconCircle}>
            <Feather name="briefcase" size={m(16)} color={colors.white} />
          </View>

          <View style={styles.headerInfoCol}>
            <Text style={styles.borrowerNameText} numberOfLines={1}>
              {borrowerName}
            </Text>
            <Text style={styles.purposeText} numberOfLines={1}>
              {item.purpose || 'Working Capital'} • {item.tenureMonths || 12} Mo
            </Text>
            {item.pledgedSecurity ? (
              <View style={styles.pledgedSecurityBadge}>
                <Feather name="shield" size={m(10)} color="#b45309" />
                <Text style={styles.pledgedSecurityBadgeText} numberOfLines={1}>
                  {item.pledgedSecurity}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Status Badge */}
          <View
            style={[
              styles.statusPill,
              item.status === 'pending'
                ? styles.pillPending
                : item.status === 'accepted'
                ? styles.pillAccepted
                : styles.pillRejected,
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                item.status === 'pending'
                  ? styles.pillTextPending
                  : item.status === 'accepted'
                  ? styles.pillTextAccepted
                  : styles.pillTextRejected,
              ]}
            >
              {item.status === 'pending'
                ? 'IN REVIEW'
                : item.status === 'accepted'
                ? 'ACCEPTED'
                : 'DECLINED'}
            </Text>
          </View>
        </View>

        {/* Compact Metrics Row */}
        <View style={styles.metricsBox}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Facility Amount</Text>
            <Text style={styles.metricValueBold}>{formatINR(item.amount)}</Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Tenure / Rate</Text>
            <Text style={styles.metricValue}>
              {item.tenureMonths || 12} Mo • {item.requestedRate || 12}%
            </Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Credit Score</Text>
            <Text
              style={[
                styles.metricScoreValue,
                creditScore >= 750 ? styles.scoreTextGreen : styles.scoreTextAmber,
              ]}
              numberOfLines={1}
            >
              {creditScore} ({riskGrade})
            </Text>
            {countdown && item.status === 'pending' && (
              <Text
                style={[
                  styles.metricCountdownSub,
                  countdown.urgent && styles.metricCountdownUrgent,
                ]}
                numberOfLines={1}
              >
                ⏱ {countdown.text}
              </Text>
            )}
          </View>

          <View style={styles.chevronWrap}>
            <Feather name="chevron-right" size={m(16)} color={colors.textSecondary} />
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
      includeTabBarClearance={true}
      scrollable={false}
    >
      {/* Top Green Banner Section (Matching Figma Admin & Dashboard) */}
      <View style={styles.topBanner}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Incoming Loan Requests</Text>
          </View>
        </View>
      </View>

      {/* Main Curved Body Section */}
      <View style={styles.sheetSection}>
        {/* Search & Filter Button Row */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Feather name="search" size={m(16)} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search borrower entity, purpose, or ID..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={fetchRequests}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} style={{ padding: m(4) }}>
                <Feather name="x" size={m(15)} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.filterBtn,
              activeTab !== 'all' && styles.filterBtnActive,
            ]}
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.8}
          >
            <Feather
              name="sliders"
              size={m(17)}
              color={activeTab !== 'all' ? colors.lettersAndIcons : colors.textSecondary}
            />
            {activeTab !== 'all' && <View style={styles.filterActiveDot} />}
          </TouchableOpacity>
        </View>

        {/* Active Filter Pill Row */}
        {activeTab !== 'all' && (
          <View style={styles.activeFilterPillRow}>
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterChipLabel}>Status:</Text>
              <Text style={styles.activeFilterChipValue}>
                {FILTER_TABS.find((o) => o.key === activeTab)?.label || activeTab}
              </Text>
              <TouchableOpacity
                onPress={() => setActiveTab('all')}
                style={styles.clearFilterChipBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={m(12)} color={colors.lettersAndIcons} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* List Content */}
        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.lettersAndIcons} />
            <Text style={styles.loadingText}>Syncing deal inflow...</Text>
          </View>
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
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
                <Feather name="inbox" size={m(42)} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Loan Requests Found</Text>
                <Text style={styles.emptySubtitle}>
                  {activeTab === 'pending'
                    ? 'All incoming loan applications have been reviewed.'
                    : 'No requests match the selected filter.'}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Decline Underwriting Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}>
                <Feather name="x-circle" size={m(18)} color="#ef4444" />
              </View>
              <Text style={styles.modalTitle}>Decline Loan Request</Text>
              <TouchableOpacity onPress={() => setRejectModalVisible(false)}>
                <Feather name="x" size={m(20)} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Select or specify the primary reason for declining this borrower's inquiry:
            </Text>

            {/* Reason Chips */}
            <View style={styles.reasonsChipGrid}>
              {[
                'Credit score below policy cut-off',
                'High Debt-Service Coverage (DSCR)',
                'Insufficient business vintage',
                'Unverified statutory documents',
              ].map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonChip,
                    rejectReason === reason && styles.activeReasonChip,
                  ]}
                  onPress={() => setRejectReason(reason)}
                >
                  <Text
                    style={[
                      styles.reasonChipText,
                      rejectReason === reason && styles.activeReasonChipText,
                    ]}
                  >
                    {reason}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Custom Reason (Optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Risk parameters exceed portfolio limits"
              placeholderTextColor="#94a3b8"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalRejectBtn}
                onPress={handleConfirmReject}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalRejectText}>Confirm Decline</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Filter Options Modal (Moved from pinned screen bar) ── */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.filterModalOverlay}
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.filterModalCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.filterModalHandle} />

            {/* Modal Header */}
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filter Requests</Text>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                style={styles.filterModalCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={m(16)} color={colors.lettersAndIcons} />
              </TouchableOpacity>
            </View>

            {/* Filter Options List */}
            <View style={styles.filterOptionsContainer}>
              {FILTER_TABS.map((opt) => {
                const isSelected = activeTab === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.filterOptionItem,
                      isSelected && styles.filterOptionItemSelected,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setActiveTab(opt.key);
                      setFilterModalVisible(false);
                    }}
                  >
                    <View style={styles.filterOptionLeft}>
                      <View style={[styles.filterOptionIconWrap, { backgroundColor: opt.iconBg }]}>
                        <Feather name={opt.icon} size={m(15)} color={opt.iconColor} />
                      </View>
                      <Text
                        style={[
                          styles.filterOptionLabel,
                          isSelected && styles.filterOptionLabelSelected,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </View>

                    {isSelected ? (
                      <View style={styles.filterSelectedCircle}>
                        <Feather name="check" size={m(12)} color={colors.white} />
                      </View>
                    ) : (
                      <View style={styles.filterUnselectedCircle} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Subtle Reset Action when not 'all' */}
            {activeTab !== 'all' && (
              <TouchableOpacity
                style={styles.filterResetRow}
                onPress={() => {
                  setActiveTab('all');
                  setFilterModalVisible(false);
                }}
                activeOpacity={0.7}
              >
                <Feather name="rotate-ccw" size={m(13)} color={colors.textSecondary} />
                <Text style={styles.filterResetRowText}>Reset to All Requests</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  // Top Green Banner
  topBanner: {
    backgroundColor: colors.primary,
    paddingHorizontal: m(20),
    paddingTop: m(12),
    paddingBottom: m(20),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTag: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: 0.8,
    opacity: 0.85,
    marginBottom: m(2),
  },
  headerTitle: {
    fontSize: m(22),
    lineHeight: m(28),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  headerSubtitle: {
    fontSize: m(12),
    lineHeight: m(16),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
    opacity: 0.9,
    marginTop: m(2),
  },
  refreshBtn: {
    width: m(42),
    height: m(42),
    borderRadius: m(21),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // Main Curved Sheet
  sheetSection: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(32),
    borderTopRightRadius: m(32),
    paddingTop: m(16),
  },

  // Search & Filter Bar
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: m(18),
    marginBottom: m(12),
    gap: m(8),
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: m(16),
    paddingHorizontal: m(14),
    height: m(44),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
  },
  searchInput: {
    flex: 1,
    marginLeft: m(8),
    fontSize: m(13),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
  },
  filterBtn: {
    width: m(44),
    height: m(44),
    borderRadius: m(14),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterActiveDot: {
    position: 'absolute',
    top: m(8),
    right: m(8),
    width: m(7),
    height: m(7),
    borderRadius: m(3.5),
    backgroundColor: colors.lettersAndIcons,
  },
  activeFilterPillRow: {
    marginHorizontal: m(18),
    marginBottom: m(10),
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: m(16),
    paddingHorizontal: m(10),
    paddingVertical: m(4),
    gap: m(5),
  },
  activeFilterChipLabel: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
  },
  activeFilterChipValue: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: '#1d4ed8',
  },
  clearFilterChipBtn: {
    marginLeft: m(2),
  },

  // Filter Modal
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 48, 48, 0.45)',
    justifyContent: 'flex-end',
  },
  filterModalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: m(24),
    borderTopRightRadius: m(24),
    paddingTop: m(10),
    paddingHorizontal: m(20),
    paddingBottom: m(26),
    elevation: 20,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  filterModalHandle: {
    width: m(36),
    height: m(4),
    borderRadius: m(2),
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginBottom: m(12),
  },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: m(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(9, 48, 48, 0.06)',
    marginBottom: m(8),
  },
  filterModalTitle: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  filterModalCloseBtn: {
    width: m(30),
    height: m(30),
    borderRadius: m(15),
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterOptionsContainer: {
    gap: m(6),
    paddingVertical: m(2),
  },
  filterOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    paddingVertical: m(11),
    paddingHorizontal: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterOptionItemSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  filterOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(10),
  },
  filterOptionIconWrap: {
    width: m(30),
    height: m(30),
    borderRadius: m(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterOptionLabel: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  filterOptionLabelSelected: {
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  filterSelectedCircle: {
    width: m(20),
    height: m(20),
    borderRadius: m(10),
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterUnselectedCircle: {
    width: m(18),
    height: m(18),
    borderRadius: m(9),
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  filterResetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(6),
    marginTop: m(10),
    paddingVertical: m(8),
  },
  filterResetRowText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
  },

  listContent: {
    paddingHorizontal: m(18),
    paddingBottom: m(30),
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(8),
  },

  // Short Compact Deal Card
  card: {
    backgroundColor: colors.white,
    borderRadius: m(14),
    padding: m(12),
    marginBottom: m(10),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.06)',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(8),
  },
  activityIconCircle: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    backgroundColor: colors.blueButton,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(10),
  },
  headerInfoCol: {
    flex: 1,
    marginRight: m(8),
  },
  borrowerNameText: {
    fontSize: m(14),
    lineHeight: m(18),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  purposeText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.blueButton,
    marginTop: m(1),
  },
  pledgedSecurityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#fef3c7',
    paddingHorizontal: m(5),
    paddingVertical: m(1.5),
    borderRadius: m(5),
    marginTop: m(3),
    borderWidth: 0.5,
    borderColor: '#fde68a',
    maxWidth: '100%',
  },
  pledgedSecurityBadgeText: {
    fontFamily: FontFamily.primaryMedium,
    fontSize: m(10),
    color: '#92400e',
    marginLeft: m(3),
  },
  statusPill: {
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(6),
  },
  pillPending: {
    backgroundColor: '#fef3c7',
  },
  pillAccepted: {
    backgroundColor: '#ecfdf5',
  },
  pillRejected: {
    backgroundColor: '#fee2e2',
  },
  statusPillText: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
  },
  pillTextPending: {
    color: '#d97706',
  },
  pillTextAccepted: {
    color: '#059669',
  },
  pillTextRejected: {
    color: '#dc2626',
  },

  // Compact Metrics Box
  metricsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: m(10),
    paddingVertical: m(8),
    paddingHorizontal: m(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
    marginBottom: m(1),
  },
  metricValueBold: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  metricValue: {
    fontSize: m(11),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.lettersAndIcons,
  },
  metricScoreValue: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
  },
  scoreTextGreen: {
    color: '#059669',
  },
  scoreTextAmber: {
    color: '#d97706',
  },
  metricCountdownSub: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryMedium,
    color: '#d97706',
    marginTop: m(1),
  },
  metricCountdownUrgent: {
    color: '#dc2626',
  },
  metricDivider: {
    width: 1,
    height: m(20),
    backgroundColor: '#e2e8f0',
  },
  chevronWrap: {
    marginLeft: m(6),
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyContainer: {
    paddingVertical: m(50),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginTop: m(10),
  },
  emptySubtitle: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: m(4),
    paddingHorizontal: m(20),
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 48, 48, 0.65)',
    justifyContent: 'center',
    padding: m(20),
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: m(24),
    padding: m(20),
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(8),
  },
  modalIconWrap: {
    width: m(34),
    height: m(34),
    borderRadius: m(17),
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    flex: 1,
    marginLeft: m(10),
  },
  modalSubtitle: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginBottom: m(12),
    lineHeight: m(16),
  },
  reasonsChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(6),
    marginBottom: m(12),
  },
  reasonChip: {
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    borderRadius: m(8),
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeReasonChip: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  reasonChipText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
  },
  activeReasonChipText: {
    color: '#dc2626',
    fontFamily: FontFamily.primaryBold,
  },
  inputLabel: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.lettersAndIcons,
    marginBottom: m(6),
  },
  modalInput: {
    backgroundColor: colors.backgroundGreenWhite,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: m(12),
    padding: m(10),
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
    textAlignVertical: 'top',
    height: m(70),
    marginBottom: m(14),
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: m(8),
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: m(12),
    borderRadius: m(12),
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  modalCancelText: {
    fontSize: m(13),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.textSecondary,
  },
  modalRejectBtn: {
    flex: 2,
    paddingVertical: m(12),
    borderRadius: m(12),
    alignItems: 'center',
    backgroundColor: '#ef4444',
  },
  modalRejectText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
});
