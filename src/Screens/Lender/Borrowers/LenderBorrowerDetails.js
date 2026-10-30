import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { FontFamily, colors } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper, showAlert } from '../../../Components/common';
import lenderFlowService from '../../../Services/lenderFlowService';

export default function LenderBorrowerDetails() {
  const route = useRoute();
  const navigation = useNavigation();
  const { borrowerId, borrower: initialBorrower } = route.params || {};

  const [borrowerData, setBorrowerData] = useState(initialBorrower || null);
  const [loading, setLoading] = useState(!initialBorrower);

  const fetchBorrowerProfile = useCallback(async () => {
    try {
      if (borrowerId) {
        const res = await lenderFlowService.getBorrowerDetails(borrowerId);
        if (res?.success) {
          const borrowerObj = res.borrower || {};
          const loansList = res.loans || borrowerObj.loans || [];
          setBorrowerData({
            ...borrowerObj,
            loans: loansList,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching borrower profile details:', err);
      showAlert('Error', 'Unable to retrieve borrower credit profile.');
    } finally {
      setLoading(false);
    }
  }, [borrowerId, borrowerData]);

  useEffect(() => {
    fetchBorrowerProfile();
  }, [borrowerId]);

  const formatINR = (val) => {
    if (!val && val !== 0) return '₹0';
    const num = Number(val) || 0;
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
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

  // Contact actions
  const handleCall = (phone) => {
    if (!phone) {
      showAlert('No Contact', 'No phone number on record.');
      return;
    }
    Linking.openURL(`tel:${phone.replace(/\D/g, '')}`).catch(() => {
      showAlert('Error', 'Unable to initiate phone call.');
    });
  };

  const handleWhatsApp = (phone, name) => {
    if (!phone) {
      showAlert('No Contact', 'No phone number on record.');
      return;
    }
    const cleanNumber = phone.replace(/\D/g, '');
    const phoneWithCountry = cleanNumber.startsWith('91') ? cleanNumber : `91${cleanNumber}`;
    const textMsg = encodeURIComponent(
      `Hello ${name}, this is regarding our commercial lending partnership.`
    );
    const waUrl = `whatsapp://send?phone=${phoneWithCountry}&text=${textMsg}`;
    const webWaUrl = `https://wa.me/${phoneWithCountry}?text=${textMsg}`;

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
          showAlert('Error', 'Unable to launch WhatsApp.');
        });
      });
  };

  if (loading && !borrowerData) {
    return (
      <ScreenWrapper
        backgroundColor={colors.backgroundGreenWhite}
        topInsetBg={colors.primary}
        statusBarColor={colors.primary}
        statusBarStyle="dark-content"
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.lettersAndIcons} />
          <Text style={styles.loadingText}>Loading borrower credit dossier & financial telemetry...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const b = borrowerData || {};
  const bProfile = b.borrowerProfile || {};
  const tradeName = bProfile.businessName || b.companyName || b.userName || 'Corporate Enterprise';
  const contactPerson = b.userName || 'Authorized Representative';
  const phone = b.mobileNo || '';
  const email = b.email || '';
  const creditScore = Number(bProfile.creditScore || 750);
  const isPrime = creditScore >= 750;
  const riskGrade = bProfile.riskGrade || (isPrime ? 'A' : creditScore >= 680 ? 'B' : 'C');
  const annualRevenue = Number(bProfile.annualRevenue || 0);
  const monthlyIncome = Number(bProfile.monthlyIncome || 0);

  const loans = b.loans || [];
  const totalLoansCount = b.totalLoansCount ?? loans.length;
  const totalSanctionedBook = b.totalLoanAmount ?? loans.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const totalRecovered = b.totalPaidAmount ?? loans.reduce((s, l) => s + (Number(l.totalPaid) || 0), 0);
  const totalOutstanding = b.totalRemainingAmount ?? loans.reduce((s, l) => s + (Number(l.remainingAmount || l.amount) || 0), 0);

  return (
    <ScreenWrapper
      backgroundColor={colors.backgroundGreenWhite}
      topInsetBg={colors.primary}
      statusBarColor={colors.primary}
      statusBarStyle="dark-content"
      includeTabBarClearance={false}
      scrollable={false}
    >
      {/* ── 1. Top Green Header Banner ── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <Feather name="chevron-left" size={m(22)} color={colors.lettersAndIcons} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.borrowerHeaderName} numberOfLines={1}>
              History
            </Text>
          </View>

        </View>
      </View>

      {/* ── 2. Curved Main Body Section ── */}
      <View style={styles.curvedSheet}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── 2.1 Hero CIBIL Credit Assessment Card ── */}
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              {b.profileImage ? (
                <Image source={{ uri: b.profileImage }} style={styles.heroProfileImg} />
              ) : (
                <View style={styles.heroIconCircle}>
                  <Feather name="briefcase" size={m(18)} color={colors.white} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTradeName} numberOfLines={1}>
                  {tradeName}
                </Text>
                <Text style={styles.heroContactText}>Contact: {contactPerson}</Text>
                <Text style={styles.heroJoinedText}>Member since {formatDate(b.createdAt)}</Text>
              </View>
            </View>

            {/* CIBIL Rating Box */}
            <View style={styles.cibilRatingBox}>
              <View>
                <Text style={styles.cibilRatingLabel}>CIBIL CREDIT ASSESSMENT</Text>
                <Text style={styles.cibilScoreText}>
                  {creditScore} / 900{' '}
                  <Text style={styles.cibilGradeText}>({riskGrade} Grade)</Text>
                </Text>
              </View>
              <View style={[styles.riskBadge, isPrime ? styles.riskPrime : styles.riskStandard]}>
                <Feather
                  name={isPrime ? 'shield' : 'check-circle'}
                  size={m(12)}
                  color={isPrime ? '#15803d' : colors.oceanBlueButton}
                />
                <Text style={[styles.riskBadgeText, isPrime ? styles.riskTextPrime : styles.riskTextStandard]}>
                  {isPrime ? 'Prime Risk Tier' : 'Standard Risk'}
                </Text>
              </View>
            </View>

            {/* Verification Badges */}
            <View style={styles.trustRow}>
              <View style={styles.trustChip}>
                <Feather name="check-circle" size={m(11)} color="#15803d" />
                <Text style={styles.trustChipText}>DigiLocker KYC Verified</Text>
              </View>
            </View>

            {/* Direct Contact & Statutory Identity Section (2 Lines Matching Web) */}
            <View style={styles.heroContactDivider} />
            <View style={styles.heroContactTwoLinesBox}>
              {/* Line 1: Phone & Aadhaar with ample spacing */}
              <View style={styles.heroContactLine1}>
                <View style={styles.heroInlineItem}>
                  <Feather name="phone" size={m(13)} color="#2563eb" style={{ marginRight: m(6) }} />
                  <Text style={styles.heroInlineText}>{phone || b.mobileNo || 'N/A'}</Text>
                </View>

                <View style={styles.heroInlineItem}>
                  <Feather name="credit-card" size={m(13)} color="#2563eb" style={{ marginRight: m(6) }} />
                  <Text style={styles.heroInlineText}>
                    Aadhaar: {b.aadharCardNo || 'N/A'}
                  </Text>
                </View>
              </View>

              {/* Line 2: Email */}
              <View style={styles.heroContactLine2}>
                <View style={styles.heroInlineItem}>
                  <Feather name="mail" size={m(13)} color="#2563eb" style={{ marginRight: m(6) }} />
                  <Text style={styles.heroInlineText} numberOfLines={1}>
                    {email || b.email || 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── 2.2 Financial Portfolio KPI 4-Card Grid ── */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <View style={styles.kpiHeaderRow}>
                <Text style={styles.kpiLabel}>TOTAL FACILITIES</Text>
                <View style={[styles.kpiMiniIcon, { backgroundColor: '#f1f5f9' }]}>
                  <Feather name="layers" size={m(11)} color={colors.textSecondary} />
                </View>
              </View>
              <Text style={styles.kpiVal}>{totalLoansCount} Deals</Text>
            </View>

            <View style={styles.kpiCard}>
              <View style={styles.kpiHeaderRow}>
                <Text style={styles.kpiLabel}>SANCTIONED BOOK</Text>
                <View style={[styles.kpiMiniIcon, { backgroundColor: '#eff6ff' }]}>
                  <Feather name="trending-up" size={m(11)} color="#2563eb" />
                </View>
              </View>
              <Text style={styles.kpiValBold}>{formatINR(totalSanctionedBook)}</Text>
            </View>

            <View style={styles.kpiCard}>
              <View style={styles.kpiHeaderRow}>
                <Text style={styles.kpiLabel}>RECOVERED CAPITAL</Text>
                <View style={[styles.kpiMiniIcon, { backgroundColor: '#dcfce7' }]}>
                  <Feather name="check-circle" size={m(11)} color="#15803d" />
                </View>
              </View>
              <Text style={[styles.kpiValBold, { color: '#15803d' }]}>
                {formatINR(totalRecovered)}
              </Text>
            </View>

            <View style={styles.kpiCard}>
              <View style={styles.kpiHeaderRow}>
                <Text style={styles.kpiLabel}>ACTIVE OUTSTANDING</Text>
                <View style={[styles.kpiMiniIcon, { backgroundColor: '#fef3c7' }]}>
                  <Feather name="clock" size={m(11)} color="#b45309" />
                </View>
              </View>
              <Text style={[styles.kpiValBold, { color: colors.oceanBlueButton }]}>
                {formatINR(totalOutstanding)}
              </Text>
            </View>
          </View>

          {/* ── 2.3 Enterprise & Statutory Details Card ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconCircle}>
                <Feather name="file-text" size={m(14)} color={colors.white} />
              </View>
              <Text style={styles.cardTitle}>Enterprise Statutory & Turnover</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Trade / Entity Name</Text>
              <Text style={styles.detailValBold}>{tradeName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Constitution</Text>
              <Text style={styles.detailVal}>{bProfile.businessType || 'Private Limited Entity'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Industry / Employment</Text>
              <Text style={styles.detailVal}>
                {bProfile.employmentType || bProfile.businessType || 'Commercial Enterprise'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Years in Business</Text>
              <Text style={styles.detailVal}>{bProfile.yearsInBusiness || 4} Years</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>PAN Card Number</Text>
              <Text style={styles.detailValMono}>{b.panCardNumber || 'Disclosed on File'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Aadhaar Card Number</Text>
              <Text style={styles.detailValMono}>{b.aadharCardNo || 'Disclosed on File'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email Address</Text>
              <Text style={styles.detailValMono}>{email || b.email || 'Disclosed on File'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mobile Phone</Text>
              <Text style={styles.detailValMono}>{phone || b.mobileNo || 'Disclosed on File'}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>GSTIN Registration</Text>
              <Text style={styles.detailValMono}>
                {bProfile.gstNumber || 'Active GST Registered'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Annual Turnover</Text>
              <Text style={[styles.detailValBold, { color: colors.oceanBlueButton }]}>
                {annualRevenue > 0 ? formatINR(annualRevenue) : 'Disclosed'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Net Monthly Cashflow</Text>
              <Text style={styles.detailValBold}>
                {monthlyIncome > 0 ? formatINR(monthlyIncome) : 'Disclosed'}
              </Text>
            </View>

            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.detailLabel}>Registered City / Address</Text>
              <Text style={[styles.detailVal, { flex: 1, textAlign: 'right', marginLeft: m(10) }]}>
                {bProfile.businessAddress || b.address || 'India'}
              </Text>
            </View>
          </View>

          {/* ── 2.4 Loan Facilities & Underwriting History Section ── */}
          <View style={styles.facilitiesSection}>
            <View style={styles.facilitiesSectionHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: colors.oceanBlueButton }]}>
                <Feather name="layers" size={m(14)} color={colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.facilitiesSectionTitle}>
                  Loan Facilities & Underwriting History
                </Text>
                <Text style={styles.facilitiesCountSubText}>
                  {loans.length} Records
                </Text>
              </View>
            </View>

            {loans.length === 0 ? (
              <View style={styles.emptyFacilitiesBox}>
                <Feather name="credit-card" size={m(28)} color={colors.textMuted} />
                <Text style={styles.emptyFacilitiesText}>
                  No active loan facilities on record for this borrower yet.
                </Text>
              </View>
            ) : (
              loans.map((l, index) => {
                const statusStr = String(l.paymentStatus || l.status || '').toLowerCase().trim();
                const amt = Number(l.amount) || 0;
                const totalPaidVal = Number(l.totalPaid) || 0;
                const remainingVal = Number(
                  l.remainingAmount !== undefined
                    ? l.remainingAmount
                    : l.remainigAmount !== undefined
                    ? l.remainigAmount
                    : Math.max(0, amt - totalPaidVal)
                ) || 0;

                const isPaid =
                  statusStr === 'paid' ||
                  statusStr === 'closed' ||
                  (remainingVal <= 0 && totalPaidVal > 0);
                const isOverdue = statusStr === 'overdue';
                const isPartPaid = statusStr === 'part paid' || statusStr === 'part_paid';

                const statusLabel = isPaid
                  ? 'PAID'
                  : isOverdue
                  ? 'OVERDUE'
                  : isPartPaid
                  ? 'PART PAID'
                  : (statusStr === 'pending' ? 'PENDING' : (l.paymentStatus ? String(l.paymentStatus).toUpperCase() : 'PENDING'));

                const pillStyle = isPaid
                  ? styles.facPillPaid
                  : isOverdue
                  ? styles.facPillOverdue
                  : isPartPaid
                  ? styles.facPillPartPaid
                  : styles.facPillPending;

                const textStyle = isPaid
                  ? styles.facTextPaid
                  : isOverdue
                  ? styles.facTextOverdue
                  : isPartPaid
                  ? styles.facTextPartPaid
                  : styles.facTextPending;

                const dotColor = isPaid
                  ? '#16a34a'
                  : isOverdue
                  ? '#dc2626'
                  : isPartPaid
                  ? '#d97706'
                  : colors.oceanBlueButton;

                const loanIdStr = String(l.loanId || l._id || '');
                const shortId = loanIdStr ? `#${loanIdStr.slice(-6).toUpperCase()}` : `#${index + 1}`;

                return (
                  <View key={l._id || index} style={styles.facilityCard}>
                    {/* Facility Top Header */}
                    <View style={styles.facilityCardHeader}>
                      <View style={styles.facilityIconCircle}>
                        <Feather name="credit-card" size={m(15)} color={colors.oceanBlueButton} />
                      </View>

                      <View style={styles.facilityHeaderInfo}>
                        <Text style={styles.facilityPurposeText} numberOfLines={1}>
                          {l.purpose || l.dealName || 'Commercial Facility'}
                        </Text>
                        <Text style={styles.facilitySubText} numberOfLines={1}>
                          Facility {shortId}{l.lenderName ? ` • ${l.lenderName}` : ''}
                        </Text>
                      </View>

                      {/* Status Pill Badge with Dot */}
                      <View style={[styles.facilityPill, pillStyle]}>
                        <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
                        <Text style={[styles.facilityPillText, textStyle]}>
                          {statusLabel}
                        </Text>
                      </View>
                    </View>

                    {/* Collateral Pledged Banner (if present) */}
                    {l.pledgedSecurity ? (
                      <View style={styles.facilityPledgedChip}>
                        <Feather name="shield" size={m(11)} color="#b45309" style={{ marginRight: m(4) }} />
                        <Text style={styles.facilityPledgedText} numberOfLines={1}>
                          Pledged Collateral: {l.pledgedSecurity}
                        </Text>
                      </View>
                    ) : null}

                    {/* Key Financial Metrics Strip */}
                    <View style={styles.facilityMetricsStrip}>
                      <View style={styles.facilityMetricCol}>
                        <Text style={styles.facilityMetricLabel}>Sanctioned</Text>
                        <Text style={styles.facilityAmountText}>{formatINR(amt)}</Text>
                      </View>

                      <View style={styles.facilityMetricCol}>
                        <Text style={styles.facilityMetricLabel}>Total Paid</Text>
                        <Text style={[styles.facilityMetricVal, { color: '#16a34a' }]}>
                          {formatINR(totalPaidVal)}
                        </Text>
                      </View>

                      <View style={styles.facilityMetricCol}>
                        <Text style={styles.facilityMetricLabel}>Remaining</Text>
                        <Text style={[styles.facilityMetricVal, { color: remainingVal > 0 ? '#d97706' : '#64748b' }]}>
                          {formatINR(remainingVal)}
                        </Text>
                      </View>
                    </View>

                    {/* Facility Due Date Footer */}
                    <View style={styles.facilityFooterRow}>
                      <Text style={styles.facilityFooterDate}>
                        Due: {formatDate(l.loanEndDate || l.loanGivenDate)}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: m(20),
  },
  loadingText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
    marginTop: m(10),
    textAlign: 'center',
  },

  // Header Banner
  headerBanner: {
    backgroundColor: colors.primary,
    paddingHorizontal: m(16),
    paddingTop: m(10),
    paddingBottom: m(18),
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
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
  borrowerTag: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: 0.8,
    opacity: 0.85,
  },
  borrowerHeaderName: {
    fontSize: m(17),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginTop: m(1),
  },
  borrowerIdSub: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
    opacity: 0.8,
  },
  tierHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(8),
    gap: m(4),
  },
  tierPrimeBg: {
    backgroundColor: '#dcfce7',
  },
  tierStandardBg: {
    backgroundColor: '#eff6ff',
  },
  tierHeaderText: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
  },
  tierTextPrime: {
    color: '#15803d',
  },
  tierTextStandard: {
    color: colors.oceanBlueButton,
  },

  // Curved Main Sheet
  curvedSheet: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(28),
    borderTopRightRadius: m(28),
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: m(16),
    paddingBottom: m(24),
  },

  // Hero Card
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: m(18),
    padding: m(16),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.06)',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(12),
  },
  heroIconCircle: {
    width: m(44),
    height: m(44),
    borderRadius: m(22),
    backgroundColor: colors.blueButton,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(12),
  },
  heroTradeName: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  heroContactText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
    marginTop: m(1),
  },
  heroJoinedText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textMuted,
    marginTop: m(1),
  },
  cibilRatingBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundGreenWhite,
    borderRadius: m(12),
    padding: m(12),
    marginBottom: m(10),
  },
  cibilRatingLabel: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  cibilScoreText: {
    fontSize: m(18),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginTop: m(2),
  },
  cibilGradeText: {
    fontSize: m(13),
    color: colors.textSecondary,
    fontFamily: FontFamily.primaryMedium,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(8),
    gap: m(4),
  },
  riskPrime: {
    backgroundColor: '#dcfce7',
  },
  riskStandard: {
    backgroundColor: '#eff6ff',
  },
  riskBadgeText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryBold,
  },
  riskTextPrime: {
    color: '#15803d',
  },
  riskTextStandard: {
    color: colors.oceanBlueButton,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
  },
  trustChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(6),
    gap: m(4),
  },
  trustChipText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  heroProfileImg: {
    width: m(44),
    height: m(44),
    borderRadius: m(22),
    marginRight: m(12),
    backgroundColor: '#e2e8f0',
  },
  heroContactDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginTop: m(12),
    marginBottom: m(10),
  },
  heroContactTwoLinesBox: {
    marginTop: m(2),
  },
  heroContactLine1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: m(4),
  },
  heroContactLine2: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: m(8),
  },
  heroInlineItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroInlineText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },

  // KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(8),
    marginBottom: m(12),
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: colors.white,
    borderRadius: m(14),
    padding: m(12),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.06)',
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(4),
  },
  kpiMiniIcon: {
    width: m(20),
    height: m(20),
    borderRadius: m(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiLabel: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  kpiVal: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  kpiValBold: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  // Statutory Details Card
  card: {
    backgroundColor: colors.white,
    borderRadius: m(18),
    padding: m(16),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.06)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(12),
  },
  cardIconCircle: {
    width: m(28),
    height: m(28),
    borderRadius: m(14),
    backgroundColor: colors.lettersAndIcons,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(8),
  },
  cardTitle: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: 0.3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: m(7),
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  detailLabel: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
  },
  detailVal: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  detailValBold: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  detailValMono: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.lettersAndIcons,
    letterSpacing: 0.5,
  },

  // Facilities Section & Dedicated Cards
  facilitiesSection: {
    marginBottom: m(16),
  },
  facilitiesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(12),
    paddingHorizontal: m(2),
  },
  facilitiesSectionTitle: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: 0.2,
  },
  facilitiesCountSubText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
  },
  emptyFacilitiesBox: {
    alignItems: 'center',
    paddingVertical: m(20),
    backgroundColor: colors.white,
    borderRadius: m(16),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.06)',
  },
  emptyFacilitiesText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(6),
    textAlign: 'center',
  },
  facilityCard: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(14),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  facilityCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  facilityIconCircle: {
    width: m(32),
    height: m(32),
    borderRadius: m(16),
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(10),
  },
  facilityHeaderInfo: {
    flex: 1,
    marginRight: m(8),
  },
  facilityPurposeText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  facilitySubText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(2),
  },
  facilityPledgedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: m(6),
    paddingHorizontal: m(8),
    paddingVertical: m(3.5),
    marginTop: m(8),
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  facilityPledgedText: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryMedium,
    color: '#b45309',
  },
  facilityMetricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: m(10),
    paddingHorizontal: m(12),
    paddingVertical: m(8),
    marginTop: m(10),
  },
  facilityMetricCol: {
    alignItems: 'flex-start',
  },
  facilityMetricLabel: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginBottom: m(2),
  },
  facilityAmountText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  facilityMetricVal: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  facilityFooterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: m(8),
  },
  facilityFooterDate: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
  },
  facilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(7),
    paddingVertical: m(3),
    borderRadius: m(6),
  },
  statusDot: {
    width: m(5),
    height: m(5),
    borderRadius: m(2.5),
    marginRight: m(4),
  },
  facPillPaid: {
    backgroundColor: '#dcfce7',
  },
  facTextPaid: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: '#15803d',
  },
  facPillOverdue: {
    backgroundColor: '#fee2e2',
  },
  facTextOverdue: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: '#dc2626',
  },
  facPillPending: {
    backgroundColor: '#eff6ff',
  },
  facTextPending: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: colors.oceanBlueButton,
  },
  facPillPartPaid: {
    backgroundColor: '#fef3c7',
  },
  facTextPartPaid: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: '#b45309',
  },
});
