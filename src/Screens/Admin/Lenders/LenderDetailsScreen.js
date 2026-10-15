import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors, FontFamily } from '../../../constants';
import { m, vms, spacing, radius, typography } from '../../../Utils/responsive';
import { ScreenWrapper } from '../../../Components/common';
import { adminAPI } from '../../../Services/adminService';

/**
 * Format currency value to Indian Rupee format
 */
const formatCurrency = value => {
  if (!value) return '₹0';
  const num = Number(value) || 0;
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

/**
 * Format date string to readable format
 */
const formatDate = dateString => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};

const DetailRow = ({ label, value, icon, iconColor = colors.lettersAndIcons }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailRowLeft}>
      {icon && (
        <View style={styles.detailIconBox}>
          <Feather name={icon} size={m(15)} color={iconColor} />
        </View>
      )}
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
    <Text style={styles.detailValue}>{value || 'N/A'}</Text>
  </View>
);

const PlanCard = ({ plan, planDetails, isExpanded, onToggle, isActive }) => {
  const isPlanActive = planDetails?.isPlanActive || false;

  return (
    <View style={styles.planCard}>
      <TouchableOpacity
        style={styles.planCardHeader}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        <View style={styles.planCardHeaderLeft}>
          <View
            style={[
              styles.planStatusIndicator,
              { backgroundColor: isPlanActive ? colors.primary : '#FF4D4F' },
            ]}
          />
          <Text style={styles.planCardTitle}>{plan?.planName || 'Plan'}</Text>
          <View
            style={[
              styles.planBadge,
              { backgroundColor: isPlanActive ? colors.lightGreen : '#FFEBEB' },
            ]}
          >
            <Text
              style={[
                styles.planBadgeText,
                { color: isPlanActive ? colors.lettersAndIcons : '#E02424' },
              ]}
            >
              {isPlanActive ? 'Active' : 'Expired'}
            </Text>
          </View>
        </View>

        <Feather
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={m(18)}
          color={colors.lettersAndIcons}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.planCardContent}>
          <DetailRow
            label="Plan Price"
            value={`${formatCurrency(plan?.priceMonthly || plan?.price)}/${plan?.duration || 'mo'}`}
            icon="dollar-sign"
            iconColor={colors.blueButton}
          />
          <DetailRow
            label="Purchase Date"
            value={formatDate(planDetails?.planPurchaseDate)}
            icon="calendar"
          />
          <DetailRow
            label="Expiry Date"
            value={formatDate(planDetails?.planExpiryDate)}
            icon="clock"
          />
          {isPlanActive && planDetails?.remainingDays !== undefined && (
            <DetailRow
              label="Remaining Days"
              value={`${planDetails.remainingDays} days left`}
              icon="check-circle"
              iconColor={colors.primary}
            />
          )}
        </View>
      )}
    </View>
  );
};

export default function LenderDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { lenderData } = route.params || {};
  const [expandedPlans, setExpandedPlans] = useState({ 0: true });
  const [portfolioData, setPortfolioData] = useState(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);

  // Memoized lender data
  const lenderInfo = useMemo(() => {
    if (!lenderData) return null;
    const lender = lenderData.lender || lenderData || {};
    const currentPlan = lenderData.currentPlan || null;
    const planPurchaseDetails = lenderData.planPurchaseDetails || null;

    const plans = [];
    if (currentPlan && planPurchaseDetails) {
      plans.push({
        plan: currentPlan,
        planDetails: planPurchaseDetails,
        isActive: planPurchaseDetails.isPlanActive,
      });
    }

    return { lender, plans };
  }, [lenderData]);

  const getInitials = useCallback((name) => {
    if (!name) return 'LN';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }, []);

  const togglePlan = useCallback((index) => {
    setExpandedPlans(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  }, []);

  const targetLenderId = useMemo(() => {
    if (!lenderData && !lenderInfo) return '';
    const lender = lenderInfo?.lender || lenderData?.lender || lenderData || {};
    return lender._id || lender.id || lenderData?._id || lenderData?.id || '';
  }, [lenderData, lenderInfo]);

  // Fetch real-time live lending portfolio and borrowers data
  useEffect(() => {
    if (targetLenderId) {
      setPortfolioLoading(true);
      adminAPI
        .getBorrowersByLender(targetLenderId)
        .then(res => {
          if (res && res.success && res.summary) {
            setPortfolioData(res.summary);
          }
        })
        .catch(err => {
          console.log('Error fetching lender portfolio:', err);
        })
        .finally(() => {
          setPortfolioLoading(false);
        });
    }
  }, [targetLenderId]);

  if (!lenderData || !lenderInfo) {
    return (
      <ScreenWrapper
        backgroundColor={colors.backgroundGreenWhite}
        topInsetBg={colors.primary}
        statusBarColor={colors.primary}
      >
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={m(22)} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lender Details</Text>
        </View>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={m(42)} color="#FF4D4F" />
          <Text style={styles.errorText}>Lender details not available</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const { lender, plans } = lenderInfo;
  const lenderName = lender.userName || lender.name || 'Institutional Lender';
  const isActive = Boolean(lenderData?.planPurchaseDetails?.isPlanActive);

  // Compute live portfolio statistics
  const stats = portfolioData || lenderData?.loanStats || lender?.loanStats || {
    totalLoans: 0,
    totalLoanAmount: 0,
    totalPaidAmount: 0,
    totalRemainingAmount: 0,
    activeLoans: 0,
    paidLoans: 0,
    overdueLoans: 0,
  };

  const totalAmount = stats.totalLoanAmount ?? stats.totalAmount ?? 0;
  const totalPaid = stats.totalPaidAmount ?? stats.totalPaid ?? 0;
  const totalRemaining = stats.totalRemainingAmount ?? stats.totalRemaining ?? 0;
  const totalLoans = stats.totalLoans ?? 0;
  const activeLoans = stats.activeLoans ?? 0;
  const paidLoans = stats.paidLoans ?? 0;

  const fullAddress = [
    lender.address,
    lender.city,
    lender.district,
    lender.state
      ? `${lender.state}${lender.pincode ? ` - ${lender.pincode}` : ''}`
      : lender.pincode,
  ]
    .filter(Boolean)
    .join(', ') || lender.address || 'Address on file';

  return (
    <ScreenWrapper
      backgroundColor={colors.backgroundGreenWhite}
      topInsetBg={colors.primary}
      statusBarColor={colors.primary}
      statusBarStyle="dark-content"
      includeTabBarClearance={false}
      scrollable={false}
    >
      <View style={styles.pageGreenWrapper}>
        {/* Top Green Header with Back Button (Fixed, Non-scrolling) */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={m(22)} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lender Details</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Curved Sheet Container (Scrollable Content Below Header) */}
        <View style={styles.sheetSection}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* ======================================================== */}
            {/* 1. Executive Profile & Subscription Ledger Hero Showcase */}
            {/* ======================================================== */}
            <View style={styles.heroProfileCard}>
              <View style={styles.heroProfileTop}>
                <View style={styles.heroAvatarCircle}>
                  {lender.profileImage ? (
                    <Image
                      source={{ uri: lender.profileImage }}
                      style={styles.heroAvatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.heroAvatarText}>{getInitials(lenderName)}</Text>
                  )}
                </View>

                <View style={styles.heroProfileInfo}>
                  <Text style={styles.heroProfileName} numberOfLines={1}>
                    {lenderName}
                  </Text>
                  <Text style={styles.heroProfileContact} numberOfLines={1}>
                    {lender.email || 'No email registered'}
                  </Text>

                  <View style={styles.heroBadgeRow}>
                    <View style={styles.heroRoleBadge}>
                      <Text style={styles.heroRoleBadgeText}>Lender</Text>
                    </View>

                    <View
                      style={[
                        styles.heroStatusBadge,
                        { backgroundColor: isActive ? '#FFFFFF' : '#FFF3CD' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.heroStatusBadgeText,
                          { color: isActive ? '#009B72' : '#D97706' },
                        ]}
                      >
                        {isActive ? '● Active Plan' : '● Inactive / Free'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Integrated Subscription Ledger Bar */}
              <TouchableOpacity
                style={styles.heroLedgerBar}
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('AdminLenderSubscriptionHistory', {
                    lenderId: targetLenderId,
                    lenderName: lenderName,
                  })
                }
              >
                <View style={styles.heroLedgerLeft}>
                  <View style={styles.heroLedgerIconBox}>
                    <Feather name="file-text" size={m(15)} color={colors.oceanBlueButton} />
                  </View>
                  <View style={styles.heroLedgerTexts}>
                    <Text style={styles.heroLedgerTitle}>Subscription Ledger</Text>
                    <Text style={styles.heroLedgerSub}>
                      View plan purchases & billing invoices
                    </Text>
                  </View>
                </View>
                <View style={styles.heroLedgerBtn}>
                  <Feather name="chevron-right" size={m(15)} color={colors.oceanBlueButton} />
                </View>
              </TouchableOpacity>
            </View>

          {/* ======================================================== */}
          {/* Live Lending Portfolio & Activity (Live Real-Time Data)  */}
          {/* ======================================================== */}
          <View style={styles.sectionCard}>
            <View style={styles.portfolioHeaderRow}>
              <View style={styles.portfolioHeaderLeft}>
                <View style={styles.portfolioTrendIconBox}>
                  <Feather name="trending-up" size={m(15)} color="#00D09E" />
                </View>
                <Text style={styles.portfolioSectionTitle}>
                  LIVE LENDING PORTFOLIO & ACTIVITY
                </Text>
              </View>

              <View style={styles.liveDataBadge}>
                <Text style={styles.liveDataBadgeText}>Live Data</Text>
              </View>
            </View>

            {portfolioLoading && !portfolioData ? (
              <View style={styles.portfolioLoadingBox}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.portfolioLoadingText}>Loading portfolio data...</Text>
              </View>
            ) : (
              <View style={styles.portfolioGrid}>
                {/* 1. Capital Disbursed */}
                <View style={styles.portfolioMetricCard}>
                  <View style={styles.portfolioMetricTop}>
                    <Feather name="dollar-sign" size={m(14)} color="#00D09E" />
                    <Text style={styles.portfolioMetricLabel}>CAPITAL DISBURSED</Text>
                  </View>
                  <Text style={styles.portfolioMetricValue}>
                    {formatCurrency(totalAmount)}
                  </Text>
                  <Text style={styles.portfolioMetricSub}>
                    Across {totalLoans} total {totalLoans === 1 ? 'loan' : 'loans'}
                  </Text>
                </View>

                {/* 2-Column Row: Active Deals & Recovered Capital */}
                <View style={styles.portfolioDualRow}>
                  {/* 2. Active Deals */}
                  <View style={[styles.portfolioMetricCard, styles.portfolioDualCol]}>
                    <View style={styles.portfolioMetricTop}>
                      <Feather name="activity" size={m(13)} color={colors.blueButton} />
                      <Text
                        style={styles.portfolioMetricLabel}
                        numberOfLines={1}
                        adjustsFontSizeToFit={true}
                        minimumFontScale={0.75}
                      >
                        ACTIVE DEALS
                      </Text>
                    </View>
                    <Text
                      style={styles.portfolioMetricValue}
                      numberOfLines={1}
                      adjustsFontSizeToFit={true}
                      minimumFontScale={0.8}
                    >
                      {activeLoans} Active
                    </Text>
                    <Text
                      style={[styles.portfolioMetricSub, { color: '#00D09E' }]}
                      numberOfLines={1}
                    >
                      {paidLoans} closed & repaid
                    </Text>
                  </View>

                  {/* 3. Recovered Capital */}
                  <View style={[styles.portfolioMetricCard, styles.portfolioDualCol]}>
                    <View style={styles.portfolioMetricTop}>
                      <Feather name="check-circle" size={m(13)} color="#8B5CF6" />
                      <Text
                        style={styles.portfolioMetricLabel}
                        numberOfLines={1}
                        adjustsFontSizeToFit={true}
                        minimumFontScale={0.75}
                      >
                        RECOVERED CAPITAL
                      </Text>
                    </View>
                    <Text
                      style={styles.portfolioMetricValue}
                      numberOfLines={1}
                      adjustsFontSizeToFit={true}
                      minimumFontScale={0.8}
                    >
                      {formatCurrency(totalPaid)}
                    </Text>
                    <Text
                      style={styles.portfolioMetricSub}
                      numberOfLines={1}
                    >
                      {formatCurrency(totalRemaining)} remaining
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Personal / Institution Information Card */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBox, { backgroundColor: '#E6F2FF' }]}>
                <Feather name="user" size={m(16)} color={colors.blueButton} />
              </View>
              <Text style={styles.sectionTitle}>Contact & Institution</Text>
            </View>

            <DetailRow
              label="Full Name"
              value={lenderName}
              icon="user"
            />
            <DetailRow
              label="Email"
              value={lender.email}
              icon="mail"
            />
            <DetailRow
              label="Phone"
              value={lender.mobileNo || lender.phone}
              icon="phone"
            />
            <DetailRow
              label="Aadhaar"
              value={lender.aadharCardNo}
              icon="credit-card"
            />
            {lender.panCardNumber ? (
              <DetailRow
                label="PAN Card"
                value={lender.panCardNumber}
                icon="file-text"
              />
            ) : null}
            <DetailRow
              label="Registered Office Address"
              value={fullAddress}
              icon="map-pin"
            />

            <View style={styles.detailDivider} />

            <DetailRow
              label="Account State"
              value={lender.isActive ? 'Active' : 'Inactive'}
              icon="check-circle"
              iconColor={lender.isActive ? colors.primary : '#FF4D4F'}
            />
            <DetailRow
              label="Registered On"
              value={formatDate(lender.createdAt)}
              icon="calendar"
            />
            <DetailRow
              label="Last Updated"
              value={formatDate(lender.updatedAt)}
              icon="clock"
            />
          </View>

          {/* Subscription Plans Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBox, { backgroundColor: '#E6F2FF' }]}>
                <Feather name="package" size={m(16)} color={colors.blueButton} />
              </View>
              <Text style={styles.sectionTitle}>
                Assigned Plans {plans.length > 0 ? `(${plans.length})` : ''}
              </Text>
            </View>

            {plans.length > 0 ? (
              plans.map((planData, index) => (
                <PlanCard
                  key={`plan-${index}`}
                  plan={planData.plan}
                  planDetails={planData.planDetails}
                  isExpanded={expandedPlans[index] || false}
                  onToggle={() => togglePlan(index)}
                  isActive={planData.isActive}
                />
              ))
            ) : (
              <View style={styles.noPlansBox}>
                <Feather name="inbox" size={m(32)} color={colors.textSecondary} />
                <Text style={styles.noPlansText}>No active plan assigned</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  </ScreenWrapper>
);
}

const styles = StyleSheet.create({
  pageGreenWrapper: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: m(18),
    paddingTop: m(14),
    paddingBottom: m(18),
  },
  backBtn: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: m(19),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: m(38),
  },

  // Curved Sheet Container
  sheetSection: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(36),
    borderTopRightRadius: m(36),
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: m(18),
    paddingTop: m(20),
    paddingBottom: m(40),
  },

  // Executive Profile & Ledger Hero Card
  heroProfileCard: {
    backgroundColor: colors.oceanBlueButton,
    borderRadius: m(22),
    padding: m(16),
    marginBottom: m(14),
    elevation: 4,
    shadowColor: colors.oceanBlueButton,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  heroProfileTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroAvatarCircle: {
    width: m(54),
    height: m(54),
    borderRadius: m(27),
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(14),
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
  },
  heroAvatarImage: {
    width: m(54),
    height: m(54),
    borderRadius: m(27),
  },
  heroAvatarText: {
    fontSize: m(18),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  heroProfileInfo: {
    flex: 1,
  },
  heroProfileName: {
    fontSize: m(16.5),
    lineHeight: m(22),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  heroProfileContact: {
    fontSize: m(12),
    lineHeight: m(16),
    fontFamily: FontFamily.primaryMedium,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: m(2),
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    marginTop: m(8),
  },
  heroRoleBadge: {
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(8),
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  heroRoleBadgeText: {
    fontSize: m(11),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.white,
  },
  heroStatusBadge: {
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(8),
  },
  heroStatusBadgeText: {
    fontSize: m(11),
    fontFamily: FontFamily.primarySemiBold,
  },

  // Hero Integrated Subscription Ledger Bar
  heroLedgerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: m(14),
    padding: m(10),
    marginTop: m(14),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  heroLedgerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: m(10),
  },
  heroLedgerIconBox: {
    width: m(32),
    height: m(32),
    borderRadius: m(8),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroLedgerTexts: {
    flex: 1,
  },
  heroLedgerTitle: {
    fontSize: m(13),
    lineHeight: m(17),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  heroLedgerSub: {
    fontSize: m(10.5),
    lineHeight: m(14),
    fontFamily: FontFamily.primaryMedium,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: m(1),
  },
  heroLedgerBtn: {
    width: m(28),
    height: m(28),
    borderRadius: m(14),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: m(8),
  },

  detailDivider: {
    height: 1,
    backgroundColor: 'rgba(9, 48, 48, 0.08)',
    marginVertical: m(8),
  },

  // Section Cards
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: m(18),
    padding: m(16),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(14),
  },
  sectionIconBox: {
    width: m(32),
    height: m(32),
    borderRadius: m(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(10),
  },
  sectionTitle: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  // Detail Rows
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: m(9),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(9, 48, 48, 0.05)',
  },
  detailRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailIconBox: {
    marginRight: m(8),
  },
  detailLabel: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: m(13),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.lettersAndIcons,
    maxWidth: '55%',
    textAlign: 'right',
  },

  // Plans Card
  planCard: {
    backgroundColor: colors.backgroundGreenWhite,
    borderRadius: m(14),
    padding: m(12),
    marginBottom: m(8),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
  },
  planStatusIndicator: {
    width: m(8),
    height: m(8),
    borderRadius: m(4),
  },
  planCardTitle: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  planBadge: {
    paddingHorizontal: m(8),
    paddingVertical: m(2),
    borderRadius: m(6),
  },
  planBadgeText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primarySemiBold,
  },
  planCardContent: {
    marginTop: m(10),
    paddingTop: m(8),
    borderTopWidth: 1,
    borderTopColor: 'rgba(9, 48, 48, 0.06)',
  },
  noPlansBox: {
    alignItems: 'center',
    paddingVertical: m(20),
  },
  noPlansText: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(6),
  },

  // Live Lending Portfolio & Activity Styles
  portfolioHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(14),
    paddingBottom: m(10),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(9, 48, 48, 0.06)',
  },
  portfolioHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    flex: 1,
  },
  portfolioTrendIconBox: {
    width: m(30),
    height: m(30),
    borderRadius: m(8),
    backgroundColor: '#E6FAF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  portfolioSectionTitle: {
    fontSize: m(12),
    lineHeight: m(16),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: 0.3,
    flex: 1,
  },
  liveDataBadge: {
    backgroundColor: 'rgba(9, 48, 48, 0.06)',
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(6),
  },
  liveDataBadgeText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  portfolioLoadingBox: {
    paddingVertical: m(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  portfolioLoadingText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(6),
  },
  portfolioGrid: {
    gap: m(10),
  },
  portfolioMetricCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: m(12),
    paddingVertical: m(10),
    paddingHorizontal: m(10),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.06)',
    overflow: 'hidden',
  },
  portfolioMetricTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    marginBottom: m(4),
  },
  portfolioMetricLabel: {
    flex: 1,
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: colors.textSecondary,
    letterSpacing: 0.1,
    includeFontPadding: false,
  },
  portfolioMetricValue: {
    fontSize: m(15),
    lineHeight: m(20),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    includeFontPadding: false,
  },
  portfolioMetricSub: {
    fontSize: m(10),
    lineHeight: m(14),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
    marginTop: m(2),
    includeFontPadding: false,
  },
  portfolioDualRow: {
    flexDirection: 'row',
    gap: m(8),
  },
  portfolioDualCol: {
    flex: 1,
  },

  // Error State
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: m(80),
  },
  errorText: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryMedium,
    color: '#FF4D4F',
    marginTop: m(10),
  },
});
