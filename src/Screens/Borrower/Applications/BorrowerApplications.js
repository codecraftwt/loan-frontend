import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { m } from 'walstar-rn-responsive';
import { colors } from '../../../constants';
import borrowerFlowService from '../../../Services/borrowerFlowService';
import DigitalAgreementModal from './DigitalAgreementModal';

export default function BorrowerApplications() {
  const navigation = useNavigation();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'accepted' | 'closed'
  const [searchQuery, setSearchQuery] = useState('');

  // Agreement modal state
  const [selectedAppForAgreement, setSelectedAppForAgreement] = useState(null);
  const [agreementModalVisible, setAgreementModalVisible] = useState(false);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await borrowerFlowService.getMyApplications();
      if (res?.success) {
        setApplications(res.applications || []);
      }
    } catch (err) {
      console.error('Error fetching borrower applications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchApplications();
    }, [fetchApplications])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchApplications();
  };

  const formatINR = (val) => {
    if (!val) return '₹0';
    const num = Number(val);
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lakh`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const formatDate = (iso) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Tab counts
  const counts = useMemo(() => {
    let pending = 0;
    let accepted = 0;
    let closed = 0;
    applications.forEach((a) => {
      if (a.status === 'pending') pending++;
      else if (a.status === 'accepted') accepted++;
      else if (['auto_rejected', 'rejected'].includes(a.status)) closed++;
    });
    return { all: applications.length, pending, accepted, closed };
  }, [applications]);

  // Filtered applications
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      if (activeTab === 'pending' && app.status !== 'pending') return false;
      if (activeTab === 'accepted' && app.status !== 'accepted') return false;
      if (activeTab === 'closed' && !['auto_rejected', 'rejected'].includes(app.status))
        return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const lenderName = (
          app.lenderSnapshot?.companyName ||
          app.lenderSnapshot?.userName ||
          app.lenderId?.companyName ||
          app.lenderId?.userName ||
          ''
        ).toLowerCase();
        const purpose = (app.purpose || '').toLowerCase();
        return lenderName.includes(q) || purpose.includes(q);
      }
      return true;
    });
  }, [applications, activeTab, searchQuery]);

  const copyOtpToClipboard = (otp) => {
    Alert.alert(
      'Disbursal OTP',
      `Your 6-digit Disbursal Verification Code is:\n\n${otp}\n\nShare this code with your lender to execute fund transfer.`,
      [{ text: 'Got it' }]
    );
  };

  const openLenderChat = (mobileNo) => {
    if (!mobileNo) {
      Alert.alert('Contact', 'Lender phone number is not listed.');
      return;
    }
    const cleanNumber = mobileNo.replace(/\D/g, '');
    const url = `whatsapp://send?phone=91${cleanNumber}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(`tel:${cleanNumber}`);
        }
      })
      .catch(() => Linking.openURL(`tel:${cleanNumber}`));
  };

  const renderApplicationCard = ({ item }) => {
    const isAccepted = item.status === 'accepted';
    const isPending = item.status === 'pending';
    const isClosed = ['auto_rejected', 'rejected'].includes(item.status);

    const lenderName =
      item.lenderSnapshot?.companyName ||
      item.lenderSnapshot?.userName ||
      item.lenderId?.companyName ||
      item.lenderId?.userName ||
      'Institutional Lender';

    const agreement = item.agreement || {};
    const isLenderSigned = isAccepted && agreement.status === 'lender_signed';
    const otp =
      item.disbursalVerification?.otp || item.activeLoan?.disbursalVerification?.otp;
    const isDisbursed =
      item.disbursalVerification?.isVerified ||
      item.activeLoan?.disbursalVerification?.isVerified;

    return (
      <View style={[styles.card, isAccepted && styles.acceptedCard, isPending && styles.pendingCard]}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.headerInfo}>
            <View style={styles.lenderRow}>
              <View
                style={[
                  styles.lenderIconBox,
                  isAccepted && { backgroundColor: '#DCFCE7' },
                  isPending && { backgroundColor: '#FEF3C7' },
                ]}
              >
                <Feather
                  name={isAccepted ? 'check-circle' : isPending ? 'clock' : 'x-circle'}
                  size={m(16)}
                  color={isAccepted ? '#16A34A' : isPending ? '#D97706' : '#64748B'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.lenderName} numberOfLines={1}>
                  {lenderName}
                </Text>
                <Text style={styles.dateSub}>Submitted {formatDate(item.createdAt)}</Text>
              </View>
            </View>
          </View>

          {/* Status Badge */}
          {isPending ? (
            <View style={styles.pendingBadge}>
              <Feather name="clock" size={m(10)} color="#D97706" />
              <Text style={styles.pendingBadgeText}>
                {item.remainingHours != null ? `${item.remainingHours}h left` : 'Reviewing'}
              </Text>
            </View>
          ) : isLenderSigned ? (
            <View style={styles.signBadge}>
              <Feather name="edit-3" size={m(10)} color="#2563EB" />
              <Text style={styles.signBadgeText}>Sign Contract</Text>
            </View>
          ) : isAccepted ? (
            <View style={styles.acceptedBadge}>
              <Feather name="check" size={m(10)} color="#16A34A" />
              <Text style={styles.acceptedBadgeText}>Sanctioned</Text>
            </View>
          ) : (
            <View style={styles.closedBadge}>
              <Text style={styles.closedBadgeText}>
                {item.status === 'auto_rejected' ? 'Auto-Expired' : 'Declined'}
              </Text>
            </View>
          )}
        </View>

        {/* 4-Column Metric Strip */}
        <View style={styles.metricStrip}>
          <View style={styles.metricItem}>
            <Text style={styles.mLabel}>Amount</Text>
            <Text style={styles.mVal}>{formatINR(item.amount)}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.mLabel}>Type</Text>
            <Text style={styles.mVal}>{item.repaymentType === 'ONE_TIME' ? 'Bullet' : 'EMI'}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.mLabel}>Tenure</Text>
            <Text style={styles.mVal}>{item.tenureMonths || 24} Mo</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.mLabel}>Purpose</Text>
            <Text style={styles.mVal} numberOfLines={1}>{item.purpose || 'Working Cap'}</Text>
          </View>
        </View>

        {/* Action Prompt: If Lender Signed & Awaiting Borrower Countersignature */}
        {isLenderSigned ? (
          <View style={styles.signActionBox}>
            <View style={styles.signActionLeft}>
              <Feather name="file-text" size={m(16)} color="#2563EB" />
              <View style={{ flex: 1 }}>
                <Text style={styles.signActionTitle}>Facility Contract Ready to Sign</Text>
                <Text style={styles.signActionSub}>
                  Lender has approved terms. Review and countersign to unlock disbursal.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.reviewSignBtn}
              onPress={() => {
                setSelectedAppForAgreement(item);
                setAgreementModalVisible(true);
              }}
            >
              <Text style={styles.reviewSignBtnText}>Review & E-Sign</Text>
              <Feather name="arrow-right" size={m(12)} color={colors.white} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Disbursal OTP Reveal Card (if accepted & OTP active) */}
        {isAccepted && otp && !isDisbursed ? (
          <View style={styles.otpCard}>
            <View style={styles.otpHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: m(4) }}>
                <Feather name="lock" size={m(12)} color="#D97706" />
                <Text style={styles.otpTitle}>DISBURSAL VERIFICATION OTP</Text>
              </View>
              <Text style={styles.otpShareNotice}>Share with Lender</Text>
            </View>

            <View style={styles.otpCodeRow}>
              <Text style={styles.otpCodeText}>{otp}</Text>
              <TouchableOpacity
                style={styles.copyOtpBtn}
                onPress={() => copyOtpToClipboard(otp)}
              >
                <Feather name="copy" size={m(12)} color="#D97706" />
                <Text style={styles.copyOtpBtnText}>View / Copy</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.otpFooterText}>
              Provide this 6-digit code to your lender representative to authorize instant RTGS disbursal.
            </Text>
          </View>
        ) : null}

        {/* Active Facility Footer Details */}
        {isAccepted && item.activeLoan ? (
          <View style={styles.activeLoanRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: m(4) }}>
              <Feather name="credit-card" size={m(12)} color="#16A34A" />
              <Text style={styles.activeLoanText}>
                Active Loan · EMI: {formatINR(item.activeLoan.monthlyEmi)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.viewScheduleBtn}
              onPress={() =>
                navigation.navigate('BorrowerLoanDetails', { id: item.activeLoan._id })
              }
            >
              <Text style={styles.viewScheduleBtnText}>Repayment Schedule</Text>
              <Feather name="chevron-right" size={m(12)} color="#2563EB" />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Rejection / Expiration note */}
        {item.rejectionReason ? (
          <View style={styles.reasonBox}>
            <Text style={styles.reasonText}>
              <Text style={{ fontWeight: '700' }}>Reason: </Text>
              {item.rejectionReason}
            </Text>
          </View>
        ) : null}

        {/* Card Footer Actions */}
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.agreementBtn}
            onPress={() => {
              setSelectedAppForAgreement(item);
              setAgreementModalVisible(true);
            }}
          >
            <Feather name="file-text" size={m(12)} color="#334155" />
            <Text style={styles.agreementBtnText}>Contract Terms</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => openLenderChat(item.lenderSnapshot?.mobileNo)}
          >
            <Feather name="message-square" size={m(12)} color={colors.white} />
            <Text style={styles.chatBtnText}>Chat Lender</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Loan Applications</Text>
          <Text style={styles.headerSubtitle}>
            Track review status, 48-hour countdowns, and active facilities.
          </Text>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={m(16)} color="#94A3B8" style={{ marginRight: m(8) }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by institution name or purpose..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Feather name="x" size={m(16)} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Status Filter Tabs */}
      <View style={styles.tabsContainer}>
        {[
          { key: 'all', label: `All (${counts.all})` },
          { key: 'pending', label: `Pending (${counts.pending})` },
          { key: 'accepted', label: `Accepted (${counts.accepted})` },
          { key: 'closed', label: `Closed (${counts.closed})` },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && styles.activeTabBtn]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabBtnText, activeTab === tab.key && styles.activeTabBtnText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={filteredApps}
          keyExtractor={(item) => item._id}
          renderItem={renderApplicationCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={m(42)} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Applications</Text>
              <Text style={styles.emptyText}>
                {activeTab === 'pending'
                  ? 'No applications currently awaiting lender review.'
                  : activeTab === 'accepted'
                  ? 'No approved loan facilities yet.'
                  : 'You have not submitted any applications yet.'}
              </Text>
              <TouchableOpacity
                style={styles.applyPromptBtn}
                onPress={() => navigation.navigate('BorrowerApply')}
              >
                <Feather name="send" size={m(14)} color={colors.white} />
                <Text style={styles.applyPromptBtnText}>Apply for New Loan</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Digital Agreement Modal */}
      <DigitalAgreementModal
        visible={agreementModalVisible}
        onClose={() => setAgreementModalVisible(false)}
        application={selectedAppForAgreement}
        onSignedSuccess={fetchApplications}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: m(16),
    paddingTop: m(14),
    paddingBottom: m(8),
  },
  headerTitle: {
    fontSize: m(18),
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: m(12),
    color: '#64748B',
    marginTop: m(2),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: m(16),
    marginTop: m(6),
    paddingHorizontal: m(12),
    paddingVertical: m(8),
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: m(13),
    color: '#0F172A',
    padding: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: m(16),
    marginTop: m(10),
    gap: m(6),
  },
  tabBtn: {
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    borderRadius: m(16),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeTabBtn: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  tabBtnText: {
    fontSize: m(11),
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabBtnText: {
    color: colors.white,
  },
  listContent: {
    padding: m(16),
    gap: m(12),
    paddingBottom: m(90),
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: m(12),
  },
  acceptedCard: {
    borderColor: '#BBF7D0',
    borderLeftWidth: 3,
    borderLeftColor: '#16A34A',
  },
  pendingCard: {
    borderColor: '#FDE68A',
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerInfo: {
    flex: 1,
  },
  lenderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
  },
  lenderIconBox: {
    width: m(34),
    height: m(34),
    borderRadius: m(10),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lenderName: {
    fontSize: m(14),
    fontWeight: '700',
    color: '#0F172A',
  },
  dateSub: {
    fontSize: m(10),
    color: '#94A3B8',
    marginTop: m(1),
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: '#FEF3C7',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(8),
  },
  pendingBadgeText: {
    fontSize: m(10),
    fontWeight: '700',
    color: '#D97706',
  },
  signBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: '#EFF6FF',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(8),
  },
  signBadgeText: {
    fontSize: m(10),
    fontWeight: '700',
    color: '#2563EB',
  },
  acceptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: '#DCFCE7',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(8),
  },
  acceptedBadgeText: {
    fontSize: m(10),
    fontWeight: '700',
    color: '#16A34A',
  },
  closedBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(8),
  },
  closedBadgeText: {
    fontSize: m(10),
    fontWeight: '600',
    color: '#64748B',
  },
  metricStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: m(12),
    padding: m(10),
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  metricItem: {
    alignItems: 'center',
  },
  mLabel: {
    fontSize: m(9),
    color: '#64748B',
    textTransform: 'uppercase',
  },
  mVal: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#0F172A',
    marginTop: m(2),
  },
  signActionBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: m(12),
    padding: m(12),
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: m(8),
  },
  signActionLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: m(8),
  },
  signActionTitle: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#1E40AF',
  },
  signActionSub: {
    fontSize: m(10),
    color: '#3B82F6',
    marginTop: m(2),
  },
  reviewSignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(6),
    backgroundColor: '#2563EB',
    paddingVertical: m(8),
    borderRadius: m(10),
  },
  reviewSignBtnText: {
    fontSize: m(12),
    fontWeight: '700',
    color: colors.white,
  },
  otpCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: m(12),
    padding: m(12),
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: m(8),
  },
  otpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  otpTitle: {
    fontSize: m(9),
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.5,
  },
  otpShareNotice: {
    fontSize: m(9),
    fontWeight: '700',
    color: '#B45309',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: m(6),
    paddingVertical: m(2),
    borderRadius: m(4),
  },
  otpCodeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: m(12),
    paddingVertical: m(8),
    borderRadius: m(8),
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  otpCodeText: {
    fontSize: m(18),
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 4,
    fontFamily: 'monospace',
  },
  copyOtpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: '#FEF3C7',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(6),
  },
  copyOtpBtnText: {
    fontSize: m(10),
    fontWeight: '700',
    color: '#D97706',
  },
  otpFooterText: {
    fontSize: m(10),
    color: '#78350F',
    lineHeight: m(14),
  },
  activeLoanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: m(10),
    borderRadius: m(10),
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  activeLoanText: {
    fontSize: m(11),
    fontWeight: '700',
    color: '#16A34A',
  },
  viewScheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(2),
  },
  viewScheduleBtnText: {
    fontSize: m(11),
    fontWeight: '700',
    color: '#2563EB',
  },
  reasonBox: {
    backgroundColor: '#F8FAFC',
    padding: m(8),
    borderRadius: m(8),
  },
  reasonText: {
    fontSize: m(10),
    color: '#64748B',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: m(8),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: m(10),
  },
  agreementBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(8),
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: colors.white,
  },
  agreementBtnText: {
    fontSize: m(11),
    fontWeight: '600',
    color: '#334155',
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(8),
    backgroundColor: '#16A34A',
  },
  chatBtnText: {
    fontSize: m(11),
    fontWeight: '700',
    color: colors.white,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(60),
    gap: m(8),
  },
  emptyTitle: {
    fontSize: m(15),
    fontWeight: '700',
    color: '#0F172A',
  },
  emptyText: {
    fontSize: m(12),
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: m(30),
  },
  applyPromptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
    backgroundColor: '#2563EB',
    paddingHorizontal: m(16),
    paddingVertical: m(10),
    borderRadius: m(12),
    marginTop: m(10),
  },
  applyPromptBtnText: {
    fontSize: m(13),
    fontWeight: '700',
    color: colors.white,
  },
});
