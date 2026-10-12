import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { m } from 'walstar-rn-responsive';
import { FontFamily, colors } from '../../../constants';
import lenderFlowService from '../../../Services/lenderFlowService';

export default function LenderIncomingRequests() {
  const navigation = useNavigation();
  const [requests, setRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'accepted' | 'rejected' | 'all'

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

      // Also fetch un-filtered count for tab counters if possible
      if (activeTab === 'all' && !search.trim()) {
        setAllRequests(res.requests || []);
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
      return { text: 'Expired', urgent: true };
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
        Alert.alert('Request Declined', 'Borrower has been notified of the decision.');
        setRejectModalVisible(false);
        setRejectReason('');
        setSelectedRequest(null);
        fetchRequests();
      } else {
        Alert.alert('Action Failed', res?.message || 'Unable to decline request.');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to decline application.';
      Alert.alert('Error', msg);
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
        activeOpacity={0.7}
      >
        {/* Top Header */}
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{borrowerName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, marginRight: m(8) }}>
            <Text style={styles.borrowerName} numberOfLines={1}>
              {borrowerName}
            </Text>
            <Text style={styles.businessType}>
              {item.borrowerSnapshot?.businessType ||
                item.borrowerId?.borrowerProfile?.businessType ||
                'Private Entity'}
            </Text>
          </View>

          {/* Risk Score Pill */}
          <View
            style={[
              styles.riskPill,
              creditScore >= 750 ? styles.riskPillGreen : styles.riskPillAmber,
            ]}
          >
            <Text
              style={[
                styles.riskPillText,
                creditScore >= 750 ? styles.riskTextGreen : styles.riskTextAmber,
              ]}
            >
              Score: {creditScore} ({riskGrade})
            </Text>
          </View>
        </View>

        {/* 48-Hour Countdown Urgency Banner */}
        {countdown && (
          <View
            style={[
              styles.countdownBanner,
              countdown.urgent ? styles.countdownUrgent : styles.countdownNormal,
            ]}
          >
            <Feather
              name="clock"
              size={m(12)}
              color={countdown.urgent ? '#dc2626' : '#d97706'}
            />
            <Text
              style={[
                styles.countdownText,
                countdown.urgent ? styles.countdownTextUrgent : styles.countdownTextNormal,
              ]}
            >
              ⏱ {countdown.text}
            </Text>
          </View>
        )}

        {/* Amount & Terms Metrics */}
        <View style={styles.termsRow}>
          <View>
            <Text style={styles.termLabel}>Requested Capital</Text>
            <Text style={styles.termValLarge}>{formatINR(item.amount)}</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.termLabel}>Tenure / Type</Text>
            <Text style={styles.termVal}>
              {item.tenureMonths || 12} Mo • {item.repaymentType === 'ONE_TIME' || item.repaymentType === 'bullet' ? 'Bullet' : 'EMI'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.termLabel}>Requested Rate</Text>
            <Text style={styles.termVal}>{item.requestedRate || 12}% p.a.</Text>
          </View>
        </View>

        {/* Purpose & Security info */}
        <View style={styles.infoRow}>
          <Text style={styles.infoText} numberOfLines={1}>
            🎯 <Text style={{ fontWeight: '700', color: '#334155' }}>Purpose:</Text>{' '}
            {item.purpose || 'Working Capital'}
          </Text>
          {item.pledgedSecurity ? (
            <Text style={styles.securityText} numberOfLines={1}>
              🛡️ {item.pledgedSecurity}
            </Text>
          ) : null}
        </View>

        {/* Footer & Actions */}
        <View style={styles.cardFooter}>
          <View
            style={[
              styles.statusBadge,
              item.status === 'pending'
                ? styles.badgePending
                : item.status === 'accepted'
                ? styles.badgeAccepted
                : styles.badgeRejected,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                item.status === 'pending'
                  ? styles.badgeTextPending
                  : item.status === 'accepted'
                  ? styles.badgeTextAccepted
                  : styles.badgeTextRejected,
              ]}
            >
              {item.status.toUpperCase()}
            </Text>
          </View>

          <View style={styles.actionButtonsRow}>
            {item.status === 'pending' && (
              <TouchableOpacity
                style={styles.declineBtn}
                onPress={() => {
                  setSelectedRequest(item);
                  setRejectModalVisible(true);
                }}
              >
                <Text style={styles.declineBtnText}>Decline</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.reviewBtn}
              onPress={() =>
                navigation.navigate('LenderRequestDetails', {
                  requestId: item._id,
                  request: item,
                })
              }
            >
              <Text style={styles.reviewBtnText}>Underwrite Deal</Text>
              <Feather name="arrow-right" size={m(13)} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Inward Deal Desk</Text>
          <Text style={styles.subtitle}>Review & Underwrite Commercial Inquiries</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshIconBtn}
          onPress={onRefresh}
          disabled={loading}
        >
          <Feather name="refresh-cw" size={m(16)} color="#0f172a" />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Feather name="search" size={m(18)} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by borrower entity, purpose, or ID..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={fetchRequests}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Feather name="x" size={m(16)} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {[
          { key: 'pending', label: 'Pending Review' },
          { key: 'accepted', label: 'Accepted' },
          { key: 'rejected', label: 'Declined' },
          { key: 'all', label: 'All Requests' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, activeTab === tab.key && styles.activeTabButton]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[styles.tabButtonText, activeTab === tab.key && styles.activeTabButtonText]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={styles.loadingText}>Loading deal inflow...</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f172a']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={m(48)} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Loan Requests Found</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'pending'
                  ? 'All incoming loan applications have been assessed.'
                  : 'No requests match the selected criteria.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Structured Decline Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconWrap, { backgroundColor: '#fee2e2' }]}>
                <Feather name="x-circle" size={m(20)} color="#ef4444" />
              </View>
              <Text style={styles.modalTitle}>Decline Loan Request</Text>
              <TouchableOpacity onPress={() => setRejectModalVisible(false)}>
                <Feather name="x" size={m(20)} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Please select or enter the primary underwriting reason for rejecting this application:
            </Text>

            {/* Quick Reasons Chips */}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: m(16),
    paddingTop: m(16),
    paddingBottom: m(10),
  },
  title: {
    fontSize: m(22),
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FontFamily.primaryBold,
  },
  subtitle: {
    fontSize: m(12),
    color: '#64748b',
    marginTop: m(2),
  },
  refreshIconBtn: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: m(12),
    marginHorizontal: m(16),
    marginBottom: m(10),
    paddingHorizontal: m(12),
    height: m(44),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    marginLeft: m(8),
    fontSize: m(13),
    color: '#0f172a',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: m(16),
    marginBottom: m(12),
  },
  tabButton: {
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(18),
    backgroundColor: '#f1f5f9',
    marginRight: m(6),
  },
  activeTabButton: {
    backgroundColor: '#0f172a',
  },
  tabButtonText: {
    fontSize: m(11),
    fontWeight: '700',
    color: '#64748b',
  },
  activeTabButtonText: {
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: m(16),
    paddingBottom: m(100),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: m(12),
    color: '#64748b',
    marginTop: m(8),
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: m(16),
    padding: m(16),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(10),
  },
  avatar: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(10),
  },
  avatarText: {
    fontSize: m(16),
    fontWeight: '800',
    color: '#2563eb',
  },
  borrowerName: {
    fontSize: m(15),
    fontWeight: '800',
    color: '#0f172a',
  },
  businessType: {
    fontSize: m(11),
    color: '#64748b',
    marginTop: m(1),
  },
  riskPill: {
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(8),
    borderWidth: 1,
  },
  riskPillGreen: {
    backgroundColor: '#ecfdf5',
    borderColor: '#bbf7d0',
  },
  riskTextGreen: {
    color: '#16a34a',
    fontSize: m(10),
    fontWeight: '800',
  },
  riskPillAmber: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
  },
  riskTextAmber: {
    color: '#d97706',
    fontSize: m(10),
    fontWeight: '800',
  },
  countdownBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(10),
    paddingVertical: m(5),
    borderRadius: m(8),
    marginBottom: m(10),
  },
  countdownNormal: {
    backgroundColor: '#fffbeb',
  },
  countdownTextNormal: {
    color: '#b45309',
    fontSize: m(11),
    fontWeight: '700',
    marginLeft: m(6),
  },
  countdownUrgent: {
    backgroundColor: '#fef2f2',
  },
  countdownTextUrgent: {
    color: '#dc2626',
    fontSize: m(11),
    fontWeight: '800',
    marginLeft: m(6),
  },
  termsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    padding: m(12),
    marginBottom: m(10),
  },
  termLabel: {
    fontSize: m(10),
    color: '#64748b',
    fontWeight: '600',
  },
  termValLarge: {
    fontSize: m(16),
    fontWeight: '800',
    color: '#0f172a',
    marginTop: m(2),
  },
  termVal: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#0f172a',
    marginTop: m(2),
  },
  infoRow: {
    marginBottom: m(10),
  },
  infoText: {
    fontSize: m(11),
    color: '#64748b',
  },
  securityText: {
    fontSize: m(11),
    color: '#475569',
    marginTop: m(3),
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
    paddingTop: m(10),
  },
  statusBadge: {
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(6),
  },
  badgePending: {
    backgroundColor: '#fef3c7',
  },
  badgeTextPending: {
    color: '#b45309',
    fontSize: m(10),
    fontWeight: '800',
  },
  badgeAccepted: {
    backgroundColor: '#ecfdf5',
  },
  badgeTextAccepted: {
    color: '#047857',
    fontSize: m(10),
    fontWeight: '800',
  },
  badgeRejected: {
    backgroundColor: '#f1f5f9',
  },
  badgeTextRejected: {
    color: '#64748b',
    fontSize: m(10),
    fontWeight: '800',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  declineBtn: {
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    borderRadius: m(8),
    backgroundColor: '#f1f5f9',
    marginRight: m(8),
  },
  declineBtnText: {
    fontSize: m(11),
    fontWeight: '700',
    color: '#ef4444',
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: m(12),
    paddingVertical: m(7),
    borderRadius: m(8),
  },
  reviewBtnText: {
    fontSize: m(11),
    fontWeight: '700',
    color: '#ffffff',
    marginRight: m(4),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(60),
  },
  emptyTitle: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#0f172a',
    marginTop: m(12),
  },
  emptySubtitle: {
    fontSize: m(12),
    color: '#64748b',
    marginTop: m(4),
    textAlign: 'center',
    paddingHorizontal: m(30),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: m(20),
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: m(20),
    padding: m(20),
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(8),
  },
  modalIconWrap: {
    width: m(36),
    height: m(36),
    borderRadius: m(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(10),
  },
  modalTitle: {
    fontSize: m(16),
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
  },
  modalSubtitle: {
    fontSize: m(12),
    color: '#64748b',
    marginBottom: m(14),
    lineHeight: m(16),
  },
  reasonsChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: m(12),
  },
  reasonChip: {
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    borderRadius: m(10),
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: m(6),
    marginBottom: m(6),
  },
  activeReasonChip: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  reasonChipText: {
    fontSize: m(11),
    color: '#475569',
    fontWeight: '600',
  },
  activeReasonChipText: {
    color: '#b91c1c',
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: m(11),
    fontWeight: '700',
    color: '#475569',
    marginBottom: m(4),
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: m(10),
    padding: m(10),
    fontSize: m(12),
    color: '#0f172a',
    marginBottom: m(14),
    textAlignVertical: 'top',
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: m(12),
    borderRadius: m(10),
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    marginRight: m(8),
  },
  modalCancelText: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#64748b',
  },
  modalRejectBtn: {
    flex: 2,
    paddingVertical: m(12),
    borderRadius: m(10),
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },
  modalRejectText: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#ffffff',
  },
});
