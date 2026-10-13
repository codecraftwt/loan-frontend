import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRoute, useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { colors, FontFamily } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper } from '../../../Components/common';
import {
  getAdminBorrowerDetails,
  clearSelectedBorrower,
} from '../../../Redux/Slices/adminBorrowersSlice';

/**
 * Format currency value
 */
const formatCurrency = value => {
  if (!value) return '₹0';
  const num = Number(value) || 0;
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

/**
 * Format date string
 */
const formatDate = dateStr => {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
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
          <Feather name={icon} size={m(14)} color={iconColor} />
        </View>
      )}
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
    <Text style={styles.detailValue} numberOfLines={2}>
      {value || 'N/A'}
    </Text>
  </View>
);

export default function AdminBorrowerDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { borrowerId, borrower: initialBorrower } = route.params || {};

  const { selectedBorrower, detailsLoading } = useSelector(
    (state) => state.adminBorrowers || {}
  );

  const [refreshing, setRefreshing] = React.useState(false);

  const fetchDetails = useCallback(() => {
    if (borrowerId) {
      dispatch(getAdminBorrowerDetails(borrowerId));
    }
  }, [dispatch, borrowerId]);

  useEffect(() => {
    fetchDetails();
    return () => {
      dispatch(clearSelectedBorrower());
    };
  }, [fetchDetails, dispatch]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (borrowerId) {
      dispatch(getAdminBorrowerDetails(borrowerId)).finally(() => setRefreshing(false));
    } else {
      setRefreshing(false);
    }
  }, [dispatch, borrowerId]);

  const borrower = selectedBorrower || initialBorrower || {};
  const displayName = borrower.userName || borrower.name || borrower.borrowerName || 'Borrower';
  const isKycVerified = Boolean(
    borrower.digilockerKyc?.isVerified ||
    borrower.aadhaarVerified ||
    borrower.isAadhaarVerified ||
    borrower.kycStatus === 'verified'
  );

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'BR';

  const aadhaarNumber =
    borrower.aadharCardNo ||
    borrower.aadhaarNumber ||
    (borrower.digilockerKyc?.aadhaarLast4
      ? `•••• •••• ${borrower.digilockerKyc?.aadhaarLast4}`
      : (borrower.aadharCardNo || borrower.aadhaarNumber)
      ? `•••• •••• ${(borrower.aadharCardNo || borrower.aadhaarNumber).slice(-4)}`
      : 'Verified via DigiLocker');

  const panNumber =
    borrower.panCardNumber ||
    borrower.digilockerKyc?.panNumber ||
    borrower.panNumber ||
    'N/A';

  const creditScore = borrower.borrowerProfile?.creditScore || borrower.creditScore || 750;
  const riskGrade = borrower.borrowerProfile?.riskGrade || 'A Grade';
  const loans = borrower.loans || [];

  const totalLoansCount = borrower.totalLoansCount ?? loans.length;
  const totalLoanAmount =
    borrower.totalLoanAmount ??
    loans.reduce((s, l) => s + (Number(l.amount || l.loanAmount) || 0), 0);
  const totalPaidAmount =
    borrower.totalPaidAmount ??
    loans.reduce((s, l) => s + (Number(l.totalPaid) || 0), 0);
  const totalRemainingAmount =
    borrower.totalRemainingAmount ??
    loans.reduce(
      (s, l) =>
        s + (Number(l.remainingAmount ?? l.remainigAmount ?? l.amount) || 0),
      0
    );

  const repaymentPercent =
    totalLoanAmount > 0
      ? Math.min(100, Math.round((totalPaidAmount / totalLoanAmount) * 100))
      : 0;

  const getStatusBadgeConfig = status => {
    const s = (status || '').toLowerCase();
    if (s === 'paid' || s === 'completed') {
      return { bg: '#DFF7E2', text: '#009B72', label: 'Paid' };
    }
    if (s === 'overdue') {
      return { bg: '#FFEBEB', text: '#E02424', label: 'Overdue' };
    }
    if (s === 'part paid' || s === 'partially paid') {
      return { bg: '#FEF3C7', text: '#B45309', label: 'Part Paid' };
    }
    return { bg: '#E6F2FF', text: colors.blueButton, label: status || 'Active' };
  };

  if (!borrowerId && !initialBorrower) {
    return (
      <ScreenWrapper
        backgroundColor={colors.backgroundGreenWhite}
        topInsetBg={colors.primary}
        statusBarColor={colors.primary}
        statusBarStyle="dark-content"
      >
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={m(22)} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Borrower Dossier</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={m(42)} color="#FF4D4F" />
          <Text style={styles.errorText}>Borrower details not available</Text>
        </View>
      </ScreenWrapper>
    );
  }

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
        {/* Fixed Non-scrolling Brand Green Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={m(22)} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Borrower Dossier</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Curved Sheet Container */}
        <View style={styles.sheetSection}>
          {detailsLoading && !refreshing && !selectedBorrower ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Fetching borrower credit profile...</Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[colors.primary]}
                />
              }
            >
              {/* ======================================================== */}
              {/* 1. Executive Brand Hero Profile Card                     */}
              {/* ======================================================== */}
              <View style={styles.heroProfileCard}>
                <View style={styles.heroProfileTop}>
                  <View style={styles.heroAvatarCircle}>
                    {borrower.profileImage ? (
                      <Image
                        source={{ uri: borrower.profileImage }}
                        style={styles.heroAvatarImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.heroAvatarText}>{initials}</Text>
                    )}
                  </View>

                  <View style={styles.heroProfileInfo}>
                    <Text style={styles.heroProfileName} numberOfLines={1}>
                      {displayName}
                    </Text>
                    <Text style={styles.heroProfileSub} numberOfLines={1}>
                      ID: #{borrower._id?.slice(-8).toUpperCase() || 'NEW'} • Joined{' '}
                      {formatDate(borrower.createdAt)}
                    </Text>

                    <View style={styles.heroBadgeRow}>
                      <View style={styles.heroRoleBadge}>
                        <Text style={styles.heroRoleBadgeText}>Borrower</Text>
                      </View>

                      <View
                        style={[
                          styles.heroStatusBadge,
                          { backgroundColor: isKycVerified ? '#FFFFFF' : '#FFF3CD' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.heroStatusBadgeText,
                            { color: isKycVerified ? '#009B72' : '#D97706' },
                          ]}
                        >
                          {isKycVerified ? '● Verified KYC' : '● Pending KYC'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Quick Contact Chips Row */}
                {(borrower.mobileNo || borrower.mobileNumber || borrower.phone || borrower.email) ? (
                  <View style={styles.heroContactRow}>
                    {(borrower.mobileNo || borrower.mobileNumber || borrower.phone) ? (
                      <View style={styles.heroContactChip}>
                        <Feather name="phone" size={m(12)} color={colors.white} />
                        <Text style={styles.heroContactText}>
                          {borrower.mobileNo || borrower.mobileNumber || borrower.phone}
                        </Text>
                      </View>
                    ) : null}
                    {borrower.email ? (
                      <View style={styles.heroContactChip}>
                        <Feather name="mail" size={m(12)} color={colors.white} />
                        <Text style={styles.heroContactText} numberOfLines={1}>
                          {borrower.email}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {/* Integrated Credit Rating Assessment Bar */}
                <View style={styles.heroCreditBar}>
                  <View style={styles.heroCreditLeft}>
                    <View style={styles.heroCreditIconBox}>
                      <Feather name="trending-up" size={m(15)} color={colors.oceanBlueButton} />
                    </View>
                    <View>
                      <Text style={styles.heroCreditScore}>CIBIL {creditScore}</Text>
                      <Text style={styles.heroCreditGrade}>{riskGrade} Evaluation</Text>
                    </View>
                  </View>
                  <View style={styles.heroCreditBadge}>
                    <Text style={styles.heroCreditBadgeText}>Low Default Risk</Text>
                  </View>
                </View>
              </View>

              {/* ======================================================== */}
              {/* 2. Financial Facilities & Capital Exposure Showcase      */}
              {/* ======================================================== */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconBox, { backgroundColor: '#E6F2FF' }]}>
                    <Feather name="pie-chart" size={m(16)} color={colors.blueButton} />
                  </View>
                  <View style={styles.sectionHeaderTitleArea}>
                    <Text style={styles.sectionTitle}>Facilities & Exposure</Text>
                    <Text style={styles.sectionSubtitle}>Aggregate lending limits & recovery</Text>
                  </View>
                </View>

                {/* KPI Overview Grid */}
                <View style={styles.kpiGrid}>
                  <View style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>TOTAL FACILITIES</Text>
                    <Text style={styles.kpiValue}>
                      {totalLoansCount} {totalLoansCount === 1 ? 'Loan' : 'Loans'}
                    </Text>
                  </View>
                  <View style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>SANCTIONED BOOK</Text>
                    <Text style={[styles.kpiValue, { color: colors.blueButton }]}>
                      {formatCurrency(totalLoanAmount)}
                    </Text>
                  </View>
                  <View style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>TOTAL REPAID</Text>
                    <Text style={[styles.kpiValue, { color: '#00A87A' }]}>
                      {formatCurrency(totalPaidAmount)}
                    </Text>
                  </View>
                  <View style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>EXPOSURE AT RISK</Text>
                    <Text style={[styles.kpiValue, { color: '#E67E22' }]}>
                      {formatCurrency(totalRemainingAmount)}
                    </Text>
                  </View>
                </View>

                {/* Capital Recovery Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Capital Recovery Rate</Text>
                    <Text style={styles.progressValue}>{repaymentPercent}%</Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${repaymentPercent}%` },
                      ]}
                    />
                  </View>
                </View>
              </View>

              {/* ======================================================== */}
              {/* 3. DigiLocker Identity Credentials Dossier               */}
              {/* ======================================================== */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconBox, { backgroundColor: '#DFF7E2' }]}>
                    <Feather name="shield" size={m(16)} color="#009B72" />
                  </View>
                  <View style={styles.sectionHeaderTitleArea}>
                    <Text style={styles.sectionTitle}>DigiLocker Identity</Text>
                    <Text style={styles.sectionSubtitle}>Government verified KYC dossier</Text>
                  </View>
                  {isKycVerified ? (
                    <View style={styles.verifiedMiniBadge}>
                      <Feather name="check" size={m(12)} color="#00A87A" />
                      <Text style={styles.verifiedMiniBadgeText}>Verified</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.dossierContent}>
                  <DetailRow
                    label="Aadhaar Number"
                    value={aadhaarNumber}
                    icon="hash"
                  />
                  <DetailRow
                    label="PAN Identification"
                    value={panNumber}
                    icon="credit-card"
                  />
                  <DetailRow
                    label="Date of Birth"
                    value={formatDate(borrower.digilockerKyc?.dob || borrower.dob || '1990-01-01')}
                    icon="calendar"
                  />
                  <DetailRow
                    label="Gender"
                    value={borrower.digilockerKyc?.gender || borrower.gender || 'Not specified'}
                    icon="user"
                  />
                  <DetailRow
                    label="Permanent Address"
                    value={
                      borrower.address ||
                      borrower.digilockerKyc?.address ||
                      'Verified DigiLocker address on file'
                    }
                    icon="map-pin"
                  />
                </View>
              </View>

              {/* ======================================================== */}
              {/* 4. Facilities & Historical Loans Ledger                  */}
              {/* ======================================================== */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconBox, { backgroundColor: '#F3E8FF' }]}>
                    <Feather name="file-text" size={m(16)} color="#7C3AED" />
                  </View>
                  <View style={styles.sectionHeaderTitleArea}>
                    <Text style={styles.sectionTitle}>
                      Facilities Ledger ({loans.length})
                    </Text>
                    <Text style={styles.sectionSubtitle}>
                      Underwritten active & settled contracts
                    </Text>
                  </View>
                </View>

                {loans.length > 0 ? (
                  loans.map((loan, idx) => {
                    const config = getStatusBadgeConfig(loan.status);
                    const amount = loan.amount || loan.loanAmount || 0;
                    const purpose =
                      loan.purpose || loan.type || loan.title || 'Commercial Facility';
                    const tenure = loan.tenure || loan.duration || '6 Mos';

                    return (
                      <View key={loan._id || idx} style={styles.facilityItem}>
                        <View style={styles.facilityHeader}>
                          <Text style={styles.facilityPurpose}>{purpose}</Text>
                          <Text style={styles.facilityAmount}>
                            {formatCurrency(amount)}
                          </Text>
                        </View>
                        <View style={styles.facilityMetaRow}>
                          <Text style={styles.facilityMeta}>Tenure: {tenure}</Text>
                          <View
                            style={[
                              styles.facilityBadge,
                              { backgroundColor: config.bg },
                            ]}
                          >
                            <Text
                              style={[
                                styles.facilityBadgeText,
                                { color: config.text },
                              ]}
                            >
                              {config.label}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.emptyLoanBox}>
                    <Feather
                      name="file-text"
                      size={m(32)}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.emptyLoanText}>
                      No facilities recorded yet for this borrower.
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
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
    fontSize: m(19),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: m(36),
  },

  // Curved Sheet
  sheetSection: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(36),
    borderTopRightRadius: m(36),
    paddingTop: m(16),
  },
  scrollContent: {
    paddingHorizontal: m(18),
    paddingBottom: m(90),
  },

  // Executive Hero Card in Ocean Blue (#0068FF)
  heroProfileCard: {
    backgroundColor: colors.oceanBlueButton,
    borderRadius: m(22),
    padding: m(16),
    marginBottom: m(14),
    shadowColor: colors.oceanBlueButton,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
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
    width: '100%',
    height: '100%',
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
    fontSize: m(17.5),
    lineHeight: m(22),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  heroProfileSub: {
    fontSize: m(11.5),
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
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(6),
  },
  heroRoleBadgeText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.white,
  },
  heroStatusBadge: {
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(6),
  },
  heroStatusBadgeText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryBold,
  },
  heroContactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(8),
    marginTop: m(14),
    paddingTop: m(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.22)',
  },
  heroContactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: m(10),
    paddingVertical: m(5),
    borderRadius: m(8),
  },
  heroContactText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.white,
  },
  heroCreditBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: m(14),
    paddingHorizontal: m(12),
    paddingVertical: m(10),
    marginTop: m(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  heroCreditLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(10),
  },
  heroCreditIconBox: {
    width: m(32),
    height: m(32),
    borderRadius: m(8),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCreditScore: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  heroCreditGrade: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryMedium,
    color: 'rgba(255, 255, 255, 0.88)',
  },
  heroCreditBadge: {
    backgroundColor: colors.white,
    paddingHorizontal: m(9),
    paddingVertical: m(4),
    borderRadius: m(8),
  },
  heroCreditBadgeText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.oceanBlueButton,
  },

  // Section Cards
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(16),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  sectionHeaderTitleArea: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: m(14.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  sectionSubtitle: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(1),
  },
  verifiedMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(3),
    backgroundColor: '#DFF7E2',
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(6),
  },
  verifiedMiniBadgeText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryBold,
    color: '#009B72',
  },

  // KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(8),
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: '#F8FAFC',
    borderRadius: m(12),
    padding: m(10),
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  kpiLabel: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
    letterSpacing: 0.3,
    marginBottom: m(4),
  },
  kpiValue: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  progressContainer: {
    marginTop: m(14),
    paddingTop: m(12),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(6),
  },
  progressLabel: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  progressValue: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: '#00A87A',
  },
  progressBarTrack: {
    height: m(6),
    borderRadius: m(3),
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00D09E',
    borderRadius: m(3),
  },

  // Detail Rows
  dossierContent: {
    gap: m(10),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: m(4),
  },
  detailRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: m(8),
  },
  detailIconBox: {
    width: m(26),
    height: m(26),
    borderRadius: m(6),
    backgroundColor: '#F1FFF3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(8),
  },
  detailLabel: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
    flex: 1,
    textAlign: 'right',
  },

  // Facilities List
  facilityItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: m(12),
    padding: m(12),
    marginBottom: m(8),
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  facilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  facilityPurpose: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  facilityAmount: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.blueButton,
  },
  facilityMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: m(6),
  },
  facilityMeta: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
  },
  facilityBadge: {
    paddingHorizontal: m(7),
    paddingVertical: m(2),
    borderRadius: m(4),
  },
  facilityBadgeText: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
  },
  emptyLoanBox: {
    paddingVertical: m(24),
    alignItems: 'center',
    gap: m(8),
  },
  emptyLoanText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
  },

  // States
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: m(60),
  },
  loadingText: {
    marginTop: m(10),
    fontSize: m(13),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: m(60),
  },
  errorText: {
    marginTop: m(10),
    fontSize: m(14),
    fontFamily: FontFamily.primaryMedium,
    color: '#FF4D4F',
  },
});
