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
  Alert,
  Linking,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { colors, FontFamily } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper } from '../../../Components/common';
import borrowerFlowService from '../../../Services/borrowerFlowService';
export default function BorrowerApplications() {
  const navigation = useNavigation();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'accepted' | 'closed'
  const [searchQuery, setSearchQuery] = useState('');

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
    Alert.alert(
      'Disbursal OTP',
      `Your 6-digit Disbursal Verification Code is:\n\n${otp}\n\nShare this code with your lender representative to authorize instant RTGS funds release.`,
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
      <View style={styles.card}>
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
              <Feather name="edit-3" size={m(10)} color={colors.blueButton} />
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
                <Feather name="file-text" size={m(15)} color={colors.blueButton} />
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
                <Feather name="key" size={m(13)} color="#d97706" />
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
                <Feather name="copy" size={m(12)} color="#b45309" />
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

        {/* Card Actions Row */}
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={styles.agreementBtn}
            activeOpacity={0.8}
            onPress={() => {
              navigation.navigate('BorrowerContractTermsScreen', { application: item });
            }}
          >
            <Feather name="file-text" size={m(13)} color={colors.lettersAndIcons} />
            <Text style={styles.agreementBtnText}>Contract Terms</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.chatBtn}
            activeOpacity={0.85}
            onPress={() => openLenderChat(item.lenderSnapshot?.mobileNo || item.lenderId?.mobileNo)}
          >
            <Feather name="message-square" size={m(13)} color={colors.white} />
            <Text style={styles.chatBtnText}>Chat Lender</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    backgroundColor: '#eff6ff',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(6),
  },
  pillTextSign: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.blueButton,
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
    backgroundColor: '#eff6ff',
    borderRadius: m(12),
    padding: m(12),
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: m(10),
    gap: m(8),
  },
  signActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
  },
  signIconCircle: {
    width: m(30),
    height: m(30),
    borderRadius: m(15),
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signActionTitle: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: '#1e40af',
  },
  signActionSub: {
    fontSize: m(10.5),
    lineHeight: m(14),
    fontFamily: FontFamily.primaryRegular,
    color: '#3b82f6',
    marginTop: m(1),
  },
  reviewSignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(6),
    backgroundColor: colors.blueButton,
    paddingVertical: m(8),
    paddingHorizontal: m(12),
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
    backgroundColor: '#fffbeb',
    borderRadius: m(12),
    padding: m(12),
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: m(10),
  },
  otpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(6),
  },
  otpTitle: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: '#92400e',
    letterSpacing: 0.5,
  },
  otpShareNotice: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: '#b45309',
  },
  otpCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: m(10),
    paddingVertical: m(8),
    paddingHorizontal: m(12),
    borderWidth: 1,
    borderColor: '#fef08a',
    marginBottom: m(6),
  },
  otpCodeText: {
    fontSize: m(20),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: 4,
  },
  copyOtpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: '#fef3c7',
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    borderRadius: m(8),
  },
  copyOtpBtnText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: '#92400e',
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
    backgroundColor: '#f0fdf4',
    padding: m(10),
    borderRadius: m(10),
    borderWidth: 1,
    borderColor: '#bbf7d0',
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
});
