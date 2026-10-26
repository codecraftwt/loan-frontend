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
  Linking,
  Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { colors, FontFamily } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper, showAlert } from '../../../Components/common';
import borrowerFlowService from '../../../Services/borrowerFlowService';
export default function BorrowerApplications() {
  const navigation = useNavigation();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'accepted' | 'closed'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppForMenu, setSelectedAppForMenu] = useState(null);

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
    if (!iso) return 'Recently';
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
    showAlert(
      'Disbursal OTP',
      `Your 6-digit Disbursal Verification Code is:\n\n${otp}\n\nShare this code with your lender representative to authorize instant RTGS funds release.`,
      [{ text: 'Got it' }]
    );
  };

  const openLenderChat = (mobileNo) => {
    if (!mobileNo) {
      showAlert('Contact', 'Lender phone number is not listed.');
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

  
  const callLender = (mobileNo) => {
    if (!mobileNo) {
      showAlert('Contact', 'Lender phone number is not listed.');
      return;
    }
    const cleanNumber = mobileNo.replace(/\D/g, '');
    Linking.openURL(`tel:${cleanNumber}`).catch(() => {
      showAlert('Error', 'Unable to open phone dialer.');
    });
  };

  
  const handleOpenMenu = (item) => {
    setSelectedAppForMenu(item);
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
    const isBorrowerSigned = Boolean(
      agreement.borrowerSignature?.signedAt ||
      agreement.status === 'both_signed' ||
      (item.disbursalVerification?.otp || item.activeLoan?.disbursalVerification?.otp)
    );
    const isLenderSigned = isAccepted && agreement.status === 'lender_signed' && !isBorrowerSigned;
    const otp =
      item.disbursalVerification?.otp || item.activeLoan?.disbursalVerification?.otp;
    const isDisbursed =
      item.disbursalVerification?.isVerified ||
      item.activeLoan?.disbursalVerification?.isVerified;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('BorrowerContractTermsScreen', { application: item })}
      >
        {/* Card Header Row */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.activityIconCircle}>
            <Feather name="briefcase" size={m(16)} color={colors.white} />
          </View>

          <View style={styles.headerInfoCol}>
            <Text style={styles.lenderNameText} numberOfLines={1}>
              {lenderName}
            </Text>
            <Text style={styles.purposeSubText} numberOfLines={1}>
              {item.purpose || 'Working Capital Line'} • {formatDate(item.createdAt)}
            </Text>
          </View>

          {/* Status Badge */}
          {isPending ? (
            <View style={styles.pillPending}>
              <Feather name="clock" size={m(10)} color="#d97706" />
              <Text style={styles.pillTextPending}>
                {item.remainingHours != null ? `${item.remainingHours}h left` : 'IN REVIEW'}
              </Text>
            </View>
          ) : isLenderSigned ? (
            <View style={styles.pillSign}>
              <Feather name="edit-3" size={m(10)} color={colors.lettersAndIcons} />
              <Text style={styles.pillTextSign}>SIGN CONTRACT</Text>
            </View>
          ) : isAccepted ? (
            <View style={styles.pillAccepted}>
              <Feather name="check" size={m(10)} color="#059669" />
              <Text style={styles.pillTextAccepted}>SANCTIONED</Text>
            </View>
          ) : (
            <View style={styles.pillRejected}>
              <Text style={styles.pillTextRejected}>
                {item.status === 'auto_rejected' ? 'EXPIRED' : 'DECLINED'}
              </Text>
            </View>
          )}

          {/* 3-Dots Action Button */}
          <TouchableOpacity
            style={styles.moreDotsBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            onPress={() => handleOpenMenu(item)}
          >
            <Feather name="more-vertical" size={m(18)} color={colors.lettersAndIcons} />
          </TouchableOpacity>
        </View>

        {/* Compact Metrics Strip - Neutral Slate-50 (#F8FAFC) */}
        <View style={styles.metricsBox}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Facility Amount</Text>
            <Text style={styles.metricValueBold}>{formatINR(item.amount)}</Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Tenure / Rate</Text>
            <Text style={styles.metricValue}>
              {item.tenureMonths || 24} Mo • {item.requestedRate || 10.5}%
            </Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Repayment</Text>
            <Text style={styles.metricValue}>
              {item.repaymentType === 'ONE_TIME' ? 'Bullet' : 'Monthly EMI'}
            </Text>
          </View>
        </View>

        {/* Action Prompt: If Lender Signed & Awaiting Borrower Countersignature */}
        {isLenderSigned ? (
          <View style={styles.signActionBox}>
            <View style={styles.signActionLeft}>
              <View style={styles.signIconCircle}>
                <Feather name="file-text" size={m(14)} color={colors.lettersAndIcons} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.signActionTitle}>Facility Contract Ready to Sign</Text>
                <Text style={styles.signActionSub}>
                  Lender has approved facility terms. Review and countersign to unlock disbursal.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.reviewSignBtn}
              activeOpacity={0.85}
              onPress={() => {
                navigation.navigate('BorrowerContractTermsScreen', { application: item });
              }}
            >
              <Text style={styles.reviewSignBtnText}>Review & E-Sign</Text>
              <Feather name="arrow-right" size={m(12)} color={colors.white} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Disbursal OTP Card (if accepted & OTP active) */}
        {isAccepted && otp && !isDisbursed ? (
          <View style={styles.otpCard}>
            <View style={styles.otpHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: m(4) }}>
                <Feather name="key" size={m(13)} color={colors.lettersAndIcons} />
                <Text style={styles.otpTitle}>DISBURSAL VERIFICATION OTP</Text>
              </View>
              <Text style={styles.otpShareNotice}>Share with Lender</Text>
            </View>

            <View style={styles.otpCodeRow}>
              <Text style={styles.otpCodeText}>{otp}</Text>
              <TouchableOpacity
                style={styles.copyOtpBtn}
                activeOpacity={0.8}
                onPress={() => copyOtpToClipboard(otp)}
              >
                <Feather name="copy" size={m(12)} color={colors.lettersAndIcons} />
                <Text style={styles.copyOtpBtnText}>View / Copy</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.otpFooterText}>
              Provide this 6-digit code to your lender representative to authorize instant RTGS disbursal.
            </Text>
          </View>
        ) : null}

        {/* Active Facility Connected Loan */}
        {isAccepted && item.activeLoan ? (
          <View style={styles.activeLoanRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: m(6) }}>
              <Feather name="credit-card" size={m(13)} color="#059669" />
              <Text style={styles.activeLoanText}>
                Active Facility · EMI: {formatINR(item.activeLoan.monthlyEmi || 0)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.viewScheduleBtn}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('BorrowerLoanDetails', { id: item.activeLoan._id })
              }
            >
              <Text style={styles.viewScheduleBtnText}>Repayment Schedule</Text>
              <Feather name="chevron-right" size={m(13)} color={colors.blueButton} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Rejection / Expiration Notice */}
        {item.rejectionReason ? (
          <View style={styles.reasonBox}>
            <Text style={styles.reasonText}>
              <Text style={{ fontFamily: FontFamily.primaryBold }}>Decision Note: </Text>
              {item.rejectionReason}
            </Text>
          </View>
        ) : null}

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
      {/* Top Green Banner */}
      <View style={styles.topBanner}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTag}>APPLICATION PIPELINE</Text>
            <Text style={styles.headerTitle}>Track Inquiries</Text>
            <Text style={styles.headerSubtitle}>
              Review status, 48-hour countdowns & active term sheets
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={onRefresh}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Feather name="refresh-cw" size={m(17)} color={colors.lettersAndIcons} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Curved Body Section */}
      <View style={styles.sheetSection}>
        {/* Unsigned Agreement Action Banner (matching webapp) */}
        {(() => {
          const unsignedApp = applications.find(
            a =>
              a.status === 'accepted' &&
              (a.agreement?.status === 'lender_signed' ||
                (!a.agreement?.borrowerSignature?.signedAt &&
                  a.agreement?.lenderSignature?.signedAt))
          );
          if (!unsignedApp) return null;
          return (
            <View style={styles.signingAlertBanner}>
              <View style={styles.signingAlertLeft}>
                <View style={styles.signingAlertIconCircle}>
                  <Feather name="file-text" size={m(15)} color={colors.white} />
                </View>
                <View style={{ flex: 1, marginLeft: m(10) }}>
                  <Text style={styles.signingAlertTitle} numberOfLines={1}>
                    Contract Ready for Signature
                  </Text>
                  <Text style={styles.signingAlertSubtitle} numberOfLines={2}>
                    {unsignedApp.lenderSnapshot?.companyName ||
                      unsignedApp.lenderSnapshot?.userName ||
                      'Institutional Lender'}{' '}
                    has approved facility terms. Review & countersign to unlock disbursal.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.signingAlertBtn}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate('BorrowerContractTermsScreen', { application: unsignedApp })
                }
              >
                <Text style={styles.signingAlertBtnText}>Review & Sign</Text>
                <Feather name="arrow-right" size={m(11)} color={colors.white} />
              </TouchableOpacity>
            </View>
          );
        })()}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={m(16)} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by institution name or purpose..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={m(16)} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Capsule Filter Tabs */}
        <View style={styles.periodCapsuleRow}>
          {[
            { key: 'all', label: `All (${counts.all})` },
            { key: 'pending', label: `Pending (${counts.pending})` },
            { key: 'accepted', label: `Accepted (${counts.accepted})` },
            { key: 'closed', label: `Closed (${counts.closed})` },
          ].map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.periodTab, isSelected && styles.periodTabActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.periodTabText,
                    isSelected && styles.periodTabTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Applications List */}
        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.lettersAndIcons} />
            <Text style={styles.loadingText}>Fetching active pipeline...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredApps}
            keyExtractor={(item) => item._id}
            renderItem={renderApplicationCard}
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
                <Feather name="inbox" size={m(36)} color={colors.primary} />
                <Text style={styles.emptyTitle}>No Applications Found</Text>
                <Text style={styles.emptySubtitle}>
                  {activeTab === 'pending'
                    ? 'No facility inquiries currently awaiting lender underwriting.'
                    : activeTab === 'accepted'
                    ? 'No accepted loan facilities yet.'
                    : 'You have not submitted any commercial applications yet.'}
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('BorrowerApply')}
                >
                  <Text style={styles.emptyActionText}>Apply for New Loan</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
            </View>

      {/* 3-Dots Action Sheet Modal */}
    <Modal
      visible={Boolean(selectedAppForMenu)}
      transparent={true}
      statusBarTranslucent={true}
      animationType="slide"
      onRequestClose={() => setSelectedAppForMenu(null)}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={() => setSelectedAppForMenu(null)}
        />
        <View style={styles.actionSheetContainer}>
          {/* Top Pill Handle */}
          <View style={styles.sheetHandle} />

          {/* Header Row */}
          <View style={styles.actionSheetHeader}>
            <View style={styles.sheetIconCircle}>
              <Feather name="briefcase" size={m(16)} color={colors.white} />
            </View>
            <View style={{ flex: 1, marginRight: m(10) }}>
              <Text style={styles.actionSheetTitle} numberOfLines={1}>
                {selectedAppForMenu?.lenderSnapshot?.companyName ||
                  selectedAppForMenu?.lenderSnapshot?.userName ||
                  selectedAppForMenu?.lenderId?.companyName ||
                  selectedAppForMenu?.lenderId?.userName ||
                  'Lender Actions'}
              </Text>
              <Text style={styles.actionSheetSub} numberOfLines={1}>
                {selectedAppForMenu?.purpose || 'Working Capital Line'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedAppForMenu(null)}
              style={styles.actionSheetCloseBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Feather name="x" size={m(16)} color={colors.lettersAndIcons} />
            </TouchableOpacity>
          </View>

          <View style={styles.actionSheetDivider} />

          {/* Options Container */}
          <View style={styles.optionsList}>
            {/* 1. Chat Lender */}
            <TouchableOpacity
              style={styles.actionCard}
              activeOpacity={0.75}
              onPress={() => {
                const phone =
                  selectedAppForMenu?.lenderSnapshot?.mobileNo ||
                  selectedAppForMenu?.lenderId?.mobileNo;
                setSelectedAppForMenu(null);
                openLenderChat(phone);
              }}
            >
              <View style={styles.actionIconBox}>
                <Feather name="message-square" size={m(16)} color={colors.lettersAndIcons} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionItemTitle}>Chat Lender (WhatsApp)</Text>
                <Text style={styles.actionItemDesc}>Direct message regarding this inquiry</Text>
              </View>
              <Feather name="chevron-right" size={m(16)} color="#94a3b8" />
            </TouchableOpacity>

            {/* 2. Call / Contact Lender */}
            <TouchableOpacity
              style={styles.actionCard}
              activeOpacity={0.75}
              onPress={() => {
                const phone =
                  selectedAppForMenu?.lenderSnapshot?.mobileNo ||
                  selectedAppForMenu?.lenderId?.mobileNo;
                setSelectedAppForMenu(null);
                callLender(phone);
              }}
            >
              <View style={styles.actionIconBox}>
                <Feather name="phone" size={m(16)} color={colors.lettersAndIcons} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionItemTitle}>Call Lender</Text>
                <Text style={styles.actionItemDesc}>Contact directly via phone call</Text>
              </View>
              <Feather name="chevron-right" size={m(16)} color="#94a3b8" />
            </TouchableOpacity>

            {/* 3. Contract Terms - ONLY IF ACCEPTED / SANCTIONED */}
            {selectedAppForMenu?.status === 'accepted' ? (
              <TouchableOpacity
                style={styles.actionCard}
                activeOpacity={0.75}
                onPress={() => {
                  const app = selectedAppForMenu;
                  setSelectedAppForMenu(null);
                  navigation.navigate('BorrowerContractTermsScreen', { application: app });
                }}
              >
                <View style={styles.actionIconBox}>
                <Feather name="file-text" size={m(16)} color={colors.lettersAndIcons} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionItemTitle}>Contract Terms</Text>
                  <Text style={styles.actionItemDesc}>View accepted facility agreement</Text>
                </View>
                <Feather name="chevron-right" size={m(16)} color="#94a3b8" />
              </TouchableOpacity>
            ) : null}

            {/* 4. Repayment Schedule (If active loan exists) */}
            {selectedAppForMenu?.activeLoan ? (
              <TouchableOpacity
                style={styles.actionCard}
                activeOpacity={0.75}
                onPress={() => {
                  const loanId = selectedAppForMenu.activeLoan._id;
                  setSelectedAppForMenu(null);
                  navigation.navigate('BorrowerLoanDetails', { id: loanId });
                }}
              >
                <View style={styles.actionIconBox}>
                <Feather name="calendar" size={m(16)} color={colors.lettersAndIcons} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionItemTitle}>Repayment Schedule</Text>
                  <Text style={styles.actionItemDesc}>Track EMIs and amortization</Text>
                </View>
                <Feather name="chevron-right" size={m(16)} color="#94a3b8" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.sheetCancelBtn}
            activeOpacity={0.8}
            onPress={() => setSelectedAppForMenu(null)}
          >
            <Text style={styles.sheetCancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
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

  // Search Input Container
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: m(16),
    marginHorizontal: m(18),
    marginBottom: m(12),
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

  // Capsule Filter Tabs
  periodCapsuleRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: m(24),
    padding: m(3),
    marginHorizontal: m(18),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
  },
  periodTab: {
    flex: 1,
    paddingVertical: m(7),
    borderRadius: m(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodTabActive: {
    backgroundColor: colors.primary,
  },
  periodTabText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  periodTabTextActive: {
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  listContent: {
    paddingHorizontal: m(18),
    paddingBottom: m(30),
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: m(60),
  },
  loadingText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(8),
  },

  // Card
  card: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(14),
    marginBottom: m(12),
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
    marginBottom: m(10),
  },
  activityIconCircle: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    backgroundColor: colors.blueButton,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(10),
  },
  headerInfoCol: {
    flex: 1,
    marginRight: m(6),
  },
  lenderNameText: {
    fontSize: m(14),
    lineHeight: m(18),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  purposeSubText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.blueButton,
    marginTop: m(1),
  },

  // Status Badges
  pillPending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: '#fef3c7',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(6),
  },
  pillTextPending: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: '#d97706',
  },
  pillSign: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: 'rgba(9, 48, 48, 0.08)',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(6),
  },
  pillTextSign: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  pillAccepted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: '#ecfdf5',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(6),
  },
  pillTextAccepted: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: '#059669',
  },
  pillRejected: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(6),
  },
  pillTextRejected: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: '#dc2626',
  },

  // Compact Metrics Box - Clean Neutral Slate-50 (#F8FAFC)
  metricsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: m(10),
    paddingVertical: m(8),
    paddingHorizontal: m(10),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: m(10),
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
  metricDivider: {
    width: 1,
    height: m(20),
    backgroundColor: '#e2e8f0',
  },

  // Sign Action Box
  signActionBox: {
    backgroundColor: '#f8fafc',
    borderRadius: m(14),
    padding: m(12),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    marginBottom: m(10),
    gap: m(8),
  },
  signActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(10),
  },
  signIconCircle: {
    width: m(32),
    height: m(32),
    borderRadius: m(16),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signActionTitle: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  signActionSub: {
    fontSize: m(10.5),
    lineHeight: m(14),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(1),
  },
  reviewSignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(6),
    backgroundColor: colors.lettersAndIcons,
    paddingVertical: m(8),
    paddingHorizontal: m(14),
    borderRadius: m(10),
    alignSelf: 'flex-start',
  },
  reviewSignBtnText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },

  // Disbursal OTP Card
  otpCard: {
    backgroundColor: '#f8fafc',
    borderRadius: m(14),
    padding: m(12),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    marginBottom: m(10),
  },
  otpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(8),
  },
  otpTitle: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: 0.5,
  },
  otpShareNotice: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
  },
  otpCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: m(10),
    paddingVertical: m(8),
    paddingHorizontal: m(14),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    marginBottom: m(6),
  },
  otpCodeText: {
    fontSize: m(20),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: 5,
  },
  copyOtpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: 'rgba(9, 48, 48, 0.06)',
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    borderRadius: m(8),
  },
  copyOtpBtnText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  otpFooterText: {
    fontSize: m(10.5),
    lineHeight: m(14),
    fontFamily: FontFamily.primaryRegular,
    color: '#78350f',
  },

  // Connected Active Loan
  activeLoanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    paddingVertical: m(10),
    paddingHorizontal: m(12),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    marginBottom: m(10),
  },
  activeLoanText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: '#166534',
  },
  viewScheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(2),
  },
  viewScheduleBtnText: {
    fontSize: m(11),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.blueButton,
  },

  // Reason Box
  reasonBox: {
    backgroundColor: '#fef2f2',
    padding: m(8),
    borderRadius: m(8),
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: m(10),
  },
  reasonText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: '#991b1b',
  },

  // Card Actions Row
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    marginTop: m(2),
  },
  agreementBtn: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: m(8),
    borderRadius: m(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(4),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.12)',
  },
  agreementBtnText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.lettersAndIcons,
  },
  chatBtn: {
    flex: 1,
    backgroundColor: colors.lettersAndIcons,
    paddingVertical: m(8),
    borderRadius: m(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(4),
  },
  chatBtnText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },

  // Empty State
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
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: m(4),
    paddingHorizontal: m(20),
    lineHeight: m(16),
  },
  emptyActionBtn: {
    marginTop: m(14),
    backgroundColor: colors.primary,
    paddingHorizontal: m(16),
    paddingVertical: m(8),
    borderRadius: m(12),
  },
  emptyActionText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  moreDotsBtn: {
    width: m(34),
    height: m(34),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: m(6),
    zIndex: 10,
  },

  // 3-Dots Action Sheet Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 48, 48, 0.45)',
    justifyContent: 'flex-end',
    width: '100%',
    height: '100%',
  },
  actionSheetContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: m(28),
    borderTopRightRadius: m(28),
    width: '100%',
    paddingHorizontal: m(20),
    paddingTop: m(12),
    paddingBottom: m(28),
    elevation: 25,
    zIndex: 9999,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  sheetHandle: {
    width: m(42),
    height: m(4),
    backgroundColor: 'rgba(9, 48, 48, 0.15)',
    borderRadius: m(2),
    alignSelf: 'center',
    marginBottom: m(14),
  },
  actionSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sheetIconCircle: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    backgroundColor: colors.lettersAndIcons,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(12),
  },
  actionSheetTitle: {
    fontSize: m(15.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  actionSheetSub: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(2),
  },
  actionSheetCloseBtn: {
    width: m(32),
    height: m(32),
    borderRadius: m(16),
    backgroundColor: 'rgba(9, 48, 48, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSheetDivider: {
    height: 1,
    backgroundColor: 'rgba(9, 48, 48, 0.06)',
    marginTop: m(12),
    marginBottom: m(12),
  },
  optionsList: {
    gap: m(8),
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: m(14),
    paddingVertical: m(10),
    paddingHorizontal: m(12),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.06)',
    gap: m(12),
  },
  actionIconBox: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionItemTitle: {
    fontSize: m(13),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.lettersAndIcons,
  },
  actionItemDesc: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(1),
  },
  sheetCancelBtn: {
    marginTop: m(14),
    backgroundColor: 'rgba(9, 48, 48, 0.06)',
    paddingVertical: m(11),
    borderRadius: m(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCancelBtnText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  // Signing Alert Banner
  signingAlertBanner: {
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderRadius: m(16),
    padding: m(13),
    marginBottom: m(14),
  },
  signingAlertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(10),
  },
  signingAlertIconCircle: {
    width: m(34),
    height: m(34),
    borderRadius: m(17),
    backgroundColor: colors.oceanBlueButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signingAlertTitle: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryBold,
    color: '#1e3a8a',
  },
  signingAlertSubtitle: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: '#3b82f6',
    lineHeight: m(15),
    marginTop: m(1),
  },
  signingAlertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(5),
    backgroundColor: colors.oceanBlueButton,
    paddingVertical: m(8),
    borderRadius: m(10),
  },
  signingAlertBtnText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
});