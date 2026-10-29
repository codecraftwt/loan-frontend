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
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { colors, FontFamily } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper, showAlert } from '../../../Components/common';
import borrowerFlowService from '../../../Services/borrowerFlowService';
export default function BorrowerApplications() {
  const navigation = useNavigation();
  const route = useRoute();
  const parentNav = navigation.getParent();
  const isInsideBottomTab =
    parentNav?.getState()?.type === 'tab' || navigation.getState()?.type === 'tab';
  const showBackButton =
    route?.params?.showBack === true || (!isInsideBottomTab && navigation.canGoBack());
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'accepted' | 'closed'
  const [filterModalVisible, setFilterModalVisible] = useState(false);
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
      else if (['auto_rejected', 'rejected', 'declined'].includes(a.status)) closed++;
    });
    return { all: applications.length, pending, accepted, closed };
  }, [applications]);

  const filterTabs = [
    { key: 'all', label: 'All Applications', shortLabel: 'All', count: counts.all },
    { key: 'pending', label: 'Pending Review', shortLabel: 'Pending', count: counts.pending },
    { key: 'accepted', label: 'Accepted', shortLabel: 'Accepted', count: counts.accepted },
    { key: 'closed', label: 'Closed / Declined', shortLabel: 'Closed', count: counts.closed },
  ];

  const activeFilterInfo = filterTabs.find((t) => t.key === activeTab) || filterTabs[0];

  // Filtered applications
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      if (activeTab === 'pending' && app.status !== 'pending') return false;
      if (activeTab === 'accepted' && app.status !== 'accepted') return false;
      if (activeTab === 'closed' && !['auto_rejected', 'rejected', 'declined'].includes(app.status))
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

  const openLenderChat = (mobileNo, lenderName, app) => {
    const rawNumber =
      mobileNo ||
      app?.lenderSnapshot?.mobileNo ||
      app?.lenderId?.mobileNo ||
      app?.lenderSnapshot?.phone ||
      app?.lenderId?.phone;

    if (!rawNumber) {
      showAlert('Contact', 'Lender phone number is not listed.');
      return;
    }

    const cleanDigits = String(rawNumber).replace(/\D/g, '');
    const phoneWithCountry = `91${cleanDigits.slice(-10)}`;

    const waUrl = `whatsapp://send?phone=${phoneWithCountry}`;
    const webWaUrl = `https://wa.me/${phoneWithCountry}`;

    Linking.canOpenURL(waUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(waUrl);
        } else {
          return Linking.openURL(webWaUrl);
        }
      })
      .catch(() => {
        Linking.openURL(webWaUrl).catch(() => {
          showAlert('WhatsApp', 'Unable to launch WhatsApp on this device.');
        });
      });
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
    const isClosed = ['auto_rejected', 'rejected', 'declined'].includes(item.status);

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
      <View style={styles.card}>
        {/* Card Header Row */}
        <View style={styles.cardHeaderRow}>
          <View
            style={[
              styles.activityIconTile,
              isAccepted
                ? styles.iconTileAccepted
                : isPending
                ? styles.iconTilePending
                : isLenderSigned
                ? styles.iconTileSign
                : styles.iconTileClosed,
            ]}
          >
            <Feather
              name={
                isAccepted
                  ? 'check-circle'
                  : isPending
                  ? 'clock'
                  : isLenderSigned
                  ? 'file-text'
                  : 'x-circle'
              }
              size={m(17)}
              color={
                isAccepted
                  ? '#059669'
                  : isPending
                  ? '#D97706'
                  : isLenderSigned
                  ? '#2563EB'
                  : '#DC2626'
              }
            />
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
              <Feather name="clock" size={m(10)} color="#D97706" />
              <Text style={styles.pillTextPending}>
                {item.remainingHours != null ? `${item.remainingHours}h left` : 'IN REVIEW'}
              </Text>
            </View>
          ) : isLenderSigned ? (
            <View style={styles.pillSign}>
              <Feather name="edit-3" size={m(10)} color="#2563EB" />
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

        {/* Compact Metrics Strip */}
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
                <Feather name="file-text" size={m(14)} color="#1D4ED8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.signActionTitle}>Facility Contract Ready</Text>
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
          </View>
        ) : null}

        {/* Actions for Accepted & Active Applications */}
        {isAccepted ? (
          <View style={styles.acceptedFooterStrip}>
            {/* 1. Agreement / E-Sign */}
            <TouchableOpacity
              style={styles.footerActionBtn}
              activeOpacity={0.8}
              onPress={() => {
                navigation.navigate('BorrowerContractTermsScreen', { application: item });
              }}
            >
              <Feather
                name={isLenderSigned ? 'edit-3' : 'file-text'}
                size={m(12)}
                color={isLenderSigned ? '#2563EB' : colors.lettersAndIcons}
              />
              <Text
                style={[
                  styles.footerActionBtnText,
                  isLenderSigned && { color: '#2563EB', fontFamily: FontFamily.primaryBold },
                ]}
              >
                {isLenderSigned ? 'E-Sign' : 'Agreement'}
              </Text>
            </TouchableOpacity>

            {/* 2. Schedule (if connected active loan exists) */}
            {item.activeLoan ? (
              <TouchableOpacity
                style={styles.footerActionBtn}
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('BorrowerLoanDetails', {
                    id: item.activeLoan._id,
                    loan: item.activeLoan,
                  })
                }
              >
                <Feather name="calendar" size={m(12)} color="#2563EB" />
                <Text style={[styles.footerActionBtnText, { color: '#2563EB' }]}>
                  Schedule
                </Text>
              </TouchableOpacity>
            ) : null}

            {/* 3. Chat (WhatsApp) */}
            <TouchableOpacity
              style={[styles.footerActionBtn, styles.chatActionBtn]}
              activeOpacity={0.8}
              onPress={() => {
                const phone =
                  item.lenderSnapshot?.mobileNo || item.lenderId?.mobileNo;
                openLenderChat(phone, lenderName, item);
              }}
            >
              <Feather name="message-circle" size={m(12)} color="#059669" />
              <Text style={[styles.footerActionBtnText, { color: '#059669', fontFamily: FontFamily.primaryBold }]}>
                Chat
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Rejection / Expiration Notice */}
        {item.rejectionReason ? (
          <View style={styles.reasonBox}>
            <Feather name="alert-circle" size={m(13)} color="#DC2626" style={{ marginTop: m(1) }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.reasonTitle}>Decision Note</Text>
              <Text style={styles.reasonText}>{item.rejectionReason}</Text>
            </View>
          </View>
        ) : null}

        {/* Apply with Other Lender Option */}
        {isClosed ? (
          <TouchableOpacity
            style={styles.applyOtherBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('BorrowerExploreLenders')}
          >
            <Feather name="refresh-cw" size={m(12)} color={colors.primary} />
            <Text style={styles.applyOtherBtnText}>Apply with Another Lender</Text>
            <Feather name="chevron-right" size={m(13)} color={colors.primary} />
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <ScreenWrapper
      backgroundColor={colors.backgroundGreenWhite}
      topInsetBg={colors.primary}
      statusBarColor={colors.primary}
      statusBarStyle="dark-content"
      includeTabBarClearance={isInsideBottomTab}
      scrollable={false}
    >
      {/* Top Green Banner */}
      <View style={styles.topBanner}>
        <View style={styles.headerRow}>
          {showBackButton ? (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('BorrowerHome'))}
              activeOpacity={0.8}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="chevron-left" size={m(22)} color={colors.lettersAndIcons} />
            </TouchableOpacity>
          ) : null}

          <View style={{ flex: 1, marginLeft: showBackButton ? m(10) : 0 }}>
            <Text style={styles.headerTitle}>My Loan Applications</Text>
          </View>
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

        {/* Search Row: Search Input + Beside Filter Button */}
        <View style={styles.searchRow}>
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

          {/* Filter Icon Button Beside Search */}
          <TouchableOpacity
            style={[
              styles.filterBtn,
              activeTab !== 'all' && styles.filterBtnActive,
            ]}
            activeOpacity={0.8}
            onPress={() => setFilterModalVisible(true)}
          >
            <Feather
              name="sliders"
              size={m(17)}
              color={colors.lettersAndIcons}
            />
            {activeTab !== 'all' && <View style={styles.filterActiveBadge} />}
          </TouchableOpacity>
        </View>

        {/* Active Filter Pill (shown when filter is applied, with quick reset) */}
        {activeTab !== 'all' && (
          <View style={styles.activeFilterRow}>
            <View style={styles.activeFilterPill}>
              <Text style={styles.activeFilterText}>
                Filter: <Text style={styles.activeFilterBold}>{activeFilterInfo.shortLabel} ({activeFilterInfo.count})</Text>
              </Text>
              <TouchableOpacity
                onPress={() => setActiveTab('all')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={m(13)} color={colors.lettersAndIcons} />
              </TouchableOpacity>
            </View>
          </View>
        )}

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

      {/* Simple Center Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent={true}
        statusBarTranslucent={true}
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.filterModalOverlay}
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.simpleFilterContainer}
            activeOpacity={1}
            onPress={(e) => e?.stopPropagation?.()}
          >
            <View style={styles.simpleFilterHeader}>
              <Text style={styles.simpleFilterTitle}>Filter Applications</Text>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                style={styles.simpleFilterCloseBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Feather name="x" size={m(16)} color={colors.lettersAndIcons} />
              </TouchableOpacity>
            </View>

            <View style={styles.simpleFilterDivider} />

            {/* Vertical Options List (No background color, clean checkmark selection) */}
            <View style={styles.simpleOptionsList}>
              {filterTabs.map((tab, index) => {
                const isSelected = activeTab === tab.key;
                const isLast = index === filterTabs.length - 1;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={[
                      styles.simpleOptionItem,
                      !isLast && styles.simpleOptionItemBorder,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setActiveTab(tab.key);
                      setFilterModalVisible(false);
                    }}
                  >
                    <View style={styles.simpleOptionLeft}>
                      <Text
                        style={[
                          styles.simpleOptionText,
                          isSelected && styles.simpleOptionTextSelected,
                        ]}
                      >
                        {tab.label}
                      </Text>
                      <Text
                        style={[
                          styles.simpleOptionCount,
                          isSelected && styles.simpleOptionCountSelected,
                        ]}
                      >
                        ({tab.count})
                      </Text>
                    </View>

                    {isSelected ? (
                      <Feather name="check" size={m(18)} color="#2563eb" />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

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

            {/* 5. Apply with Other Lender (If rejected, declined or expired) */}
            {['auto_rejected', 'rejected', 'declined'].includes(selectedAppForMenu?.status) ? (
              <TouchableOpacity
                style={styles.actionCard}
                activeOpacity={0.75}
                onPress={() => {
                  setSelectedAppForMenu(null);
                  navigation.navigate('BorrowerExploreLenders');
                }}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#eff6ff' }]}>
                  <Feather name="refresh-cw" size={m(16)} color="#2563eb" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionItemTitle, { color: '#2563eb' }]}>
                    Apply with Other Lender
                  </Text>
                  <Text style={styles.actionItemDesc}>
                    Explore and apply with another verified lender
                  </Text>
                </View>
                <Feather name="chevron-right" size={m(16)} color="#2563eb" />
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
  backBtn: {
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

  // Search Row: Search Input Container + Beside Filter Button
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: m(18),
    marginBottom: m(12),
    gap: m(10),
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
    borderRadius: m(16),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    elevation: 1,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  filterBtnActive: {
    backgroundColor: colors.lightGreen,
    borderColor: colors.primary,
  },
  filterActiveBadge: {
    position: 'absolute',
    top: m(8),
    right: m(8),
    width: m(8),
    height: m(8),
    borderRadius: m(4),
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.white,
  },

  // Active Filter Pill
  activeFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: m(18),
    marginBottom: m(12),
  },
  activeFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: m(20),
    paddingVertical: m(5),
    paddingHorizontal: m(12),
    gap: m(6),
  },
  activeFilterText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
  },
  activeFilterBold: {
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  // Simple Compact Center Filter Modal
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 48, 48, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: m(24),
  },
  simpleFilterContainer: {
    backgroundColor: colors.white,
    borderRadius: m(20),
    width: '100%',
    maxWidth: m(320),
    paddingHorizontal: m(18),
    paddingTop: m(16),
    paddingBottom: m(10),
    elevation: 25,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },
  simpleFilterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: m(12),
  },
  simpleFilterTitle: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  simpleFilterCloseBtn: {
    width: m(30),
    height: m(30),
    borderRadius: m(15),
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  simpleFilterDivider: {
    height: 1,
    backgroundColor: 'rgba(9, 48, 48, 0.08)',
  },
  simpleOptionsList: {
    paddingVertical: m(2),
  },
  simpleOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: m(13),
    paddingHorizontal: m(4),
  },
  simpleOptionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(9, 48, 48, 0.06)',
  },
  simpleOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  simpleOptionText: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  simpleOptionTextSelected: {
    fontFamily: FontFamily.primaryBold,
    color: '#2563eb',
  },
  simpleOptionCount: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
  },
  simpleOptionCountSelected: {
    fontFamily: FontFamily.primaryBold,
    color: '#2563eb',
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
    borderRadius: m(18),
    padding: m(16),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.07)',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(12),
  },
  activityIconTile: {
    width: m(38),
    height: m(38),
    borderRadius: m(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(10),
    borderWidth: 1,
  },
  iconTileAccepted: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  iconTilePending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  iconTileSign: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  iconTileClosed: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  headerInfoCol: {
    flex: 1,
    marginRight: m(8),
  },
  lenderNameText: {
    fontSize: m(14.5),
    lineHeight: m(19),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  purposeSubText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(2),
  },

  // Status Badges
  pillPending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(20),
  },
  pillTextPending: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: '#D97706',
    letterSpacing: 0.3,
  },
  pillSign: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(20),
  },
  pillTextSign: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: '#2563EB',
    letterSpacing: 0.3,
  },
  pillAccepted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(20),
  },
  pillTextAccepted: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: '#059669',
    letterSpacing: 0.3,
  },
  pillRejected: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(20),
  },
  pillTextRejected: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: '#DC2626',
    letterSpacing: 0.3,
  },

  // Compact Metrics Box
  metricsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: m(12),
    paddingVertical: m(10),
    paddingHorizontal: m(12),
    borderWidth: 1,
    borderColor: '#EEF2F6',
    marginBottom: m(12),
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryMedium,
    color: '#64748B',
    marginBottom: m(2),
    letterSpacing: 0.2,
  },
  metricValueBold: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  metricValue: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.lettersAndIcons,
  },
  metricDivider: {
    width: 1,
    height: m(22),
    backgroundColor: '#E2E8F0',
  },

  // Sign Action Box
  signActionBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: m(14),
    padding: m(12),
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: m(12),
    gap: m(10),
  },
  signActionLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: m(10),
  },
  signIconCircle: {
    width: m(32),
    height: m(32),
    borderRadius: m(10),
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signActionTitle: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryBold,
    color: '#1E3A8A',
  },
  signActionSub: {
    fontSize: m(10.5),
    lineHeight: m(15),
    fontFamily: FontFamily.primaryRegular,
    color: '#3B82F6',
    marginTop: m(2),
  },
  reviewSignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(6),
    backgroundColor: colors.lettersAndIcons,
    paddingVertical: m(9),
    paddingHorizontal: m(14),
    borderRadius: m(10),
    alignSelf: 'stretch',
  },
  reviewSignBtnText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },

  // Disbursal OTP Card
  otpCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: m(14),
    padding: m(12),
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: m(12),
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
    color: '#92400E',
    letterSpacing: 0.5,
  },
  otpShareNotice: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryMedium,
    color: '#B45309',
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
    borderColor: '#FDE68A',
    marginBottom: m(6),
  },
  otpCodeText: {
    fontSize: m(20),
    fontFamily: FontFamily.primaryBold,
    color: '#92400E',
    letterSpacing: 5,
  },
  copyOtpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: '#FEF3C7',
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    borderRadius: m(8),
  },
  copyOtpBtnText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: '#92400E',
  },
  otpFooterText: {
    fontSize: m(10.5),
    lineHeight: m(14),
    fontFamily: FontFamily.primaryRegular,
    color: '#78350F',
  },

  // Connected Active Loan
  activeLoanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderRadius: m(12),
    paddingVertical: m(10),
    paddingHorizontal: m(12),
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: m(12),
  },
  activeLoanText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryBold,
    color: '#065F46',
  },
  viewScheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(2),
  },
  viewScheduleBtnText: {
    fontSize: m(11),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.primary,
  },

  // Reason Box (Decision Note)
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: m(8),
    backgroundColor: '#FEF2F2',
    paddingVertical: m(10),
    paddingHorizontal: m(12),
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginBottom: m(12),
  },
  reasonTitle: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: '#991B1B',
    marginBottom: m(1),
  },
  reasonText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: '#B91C1C',
    lineHeight: m(15),
  },

  // Apply with Other Lender (Clean full-width CTA)
  applyOtherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
    backgroundColor: 'rgba(0, 209, 146, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 209, 146, 0.25)',
    paddingVertical: m(10),
    paddingHorizontal: m(14),
    borderRadius: m(12),
    marginTop: m(2),
  },
  applyOtherBtnText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  // Accepted Actions Strip
  acceptedFooterStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: m(8),
    paddingTop: m(10),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: m(2),
    flexWrap: 'wrap',
  },
  footerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(5),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: m(11),
    paddingVertical: m(6),
    borderRadius: m(8),
  },
  chatActionBtn: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  footerActionBtnText: {
    fontSize: m(11),
    fontFamily: FontFamily.primarySemiBold,
    color: '#334155',
  },

  // Pending Countdown Badge (Matching Web App: 48h left)
  pendingFooterStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: m(6),
    marginTop: m(2),
  },
  pendingCountdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(6),
  },
  pendingCountdownText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryBold,
    color: '#d97706',
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