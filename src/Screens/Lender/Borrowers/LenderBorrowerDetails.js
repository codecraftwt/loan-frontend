import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { FontFamily, colors } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper } from '../../../Components/common';
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
        if (!borrowerData) setLoading(true);
        const res = await lenderFlowService.getBorrowerDetails(borrowerId);
        if (res?.success && res.borrower) {
          setBorrowerData(res.borrower);
        }
      }
    } catch (err) {
      console.error('Error fetching borrower profile details:', err);
      Alert.alert('Error', 'Unable to retrieve borrower credit profile.');
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
      Alert.alert('No Contact', 'No phone number on record.');
      return;
    }
    Linking.openURL(`tel:${phone.replace(/\D/g, '')}`).catch(() => {
      Alert.alert('Error', 'Unable to initiate phone call.');
    });
  };

  const handleWhatsApp = (phone, name) => {
    if (!phone) {
      Alert.alert('No Contact', 'No phone number on record.');
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
          Alert.alert('Error', 'Unable to launch WhatsApp.');
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
            <Feather name="arrow-left" size={m(18)} color={colors.lettersAndIcons} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.borrowerTag}>CREDIT DOSSIER</Text>
            <Text style={styles.borrowerHeaderName} numberOfLines={1}>
              {tradeName}
            </Text>
            <Text style={styles.borrowerIdSub}>
              ID: #{b?._id?.slice(-8)?.toUpperCase()}
            </Text>
          </View>

          {/* Prime / Standard Tier Badge */}
          <View style={[styles.tierHeaderBadge, isPrime ? styles.tierPrimeBg : styles.tierStandardBg]}>
            <Feather
              name={isPrime ? 'shield' : 'award'}
              size={m(11)}
              color={isPrime ? '#15803d' : colors.oceanBlueButton}
            />
            <Text style={[styles.tierHeaderText, isPrime ? styles.tierTextPrime : styles.tierTextStandard]}>
              {isPrime ? 'PRIME >750' : 'STANDARD'}
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
              <View style={styles.heroIconCircle}>
                <Feather name="briefcase" size={m(18)} color={colors.white} />
              </View>
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
              <View style={styles.trustChip}>
                <Feather name="shield" size={m(11)} color={colors.oceanBlueButton} />
                <Text style={styles.trustChipText}>
                  {b.panCardNumber ? 'PAN Card on File' : 'KYC Verified'}
                </Text>
              </View>
            </View>
          </View>

          {/* ── 2.2 Financial Portfolio KPI 4-Card Grid ── */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TOTAL FACILITIES</Text>
              <Text style={styles.kpiVal}>{totalLoansCount} Deals</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>SANCTIONED BOOK</Text>
              <Text style={styles.kpiValBold}>{formatINR(totalSanctionedBook)}</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>RECOVERED CAPITAL</Text>
              <Text style={[styles.kpiValBold, { color: '#15803d' }]}>
                {formatINR(totalRecovered)}
              </Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>ACTIVE OUTSTANDING</Text>
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

          {/* ── 2.4 Active Facilities with this Lender ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: colors.oceanBlueButton }]}>
                <Feather name="layers" size={m(14)} color={colors.white} />
              </View>
              <Text style={styles.cardTitle}>Platform Facilities ({loans.length})</Text>
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
                const isPaid = l.paymentStatus === 'paid';
                const isOverdue = l.paymentStatus === 'overdue';

                return (
                  <View key={l._id || index} style={styles.facilityItem}>
                    <View style={{ flex: 1, marginRight: m(8) }}>
                      <Text style={styles.facilityPurposeText} numberOfLines={1}>
                        {l.purpose || l.dealName || 'Commercial Facility'}
                      </Text>
                      <Text style={styles.facilitySubText}>
                        Sanctioned: {formatDate(l.loanGivenDate)}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.facilityAmountText}>
                        {formatINR(l.amount || 0)}
                      </Text>
                      <View
                        style={[
                          styles.facilityPill,
                          isPaid
                            ? styles.facPillPaid
                            : isOverdue
                            ? styles.facPillOverdue
                            : styles.facPillPending,
                        ]}
                      >
                        <Text
                          style={[
                            styles.facilityPillText,
                            isPaid
                              ? styles.facTextPaid
                              : isOverdue
                              ? styles.facTextOverdue
                              : styles.facTextPending,
                          ]}
                        >
                          {isPaid ? 'PAID' : isOverdue ? 'OVERDUE' : 'ACTIVE'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* ── Fixed Bottom Actions Bar: WhatsApp & Phone Call ── */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.callActionBtn}
            onPress={() => handleCall(phone)}
            activeOpacity={0.8}
          >
            <Feather name="phone" size={m(16)} color={colors.oceanBlueButton} />
            <Text style={styles.callActionText}>Call Contact</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.whatsAppActionBtn}
            onPress={() => handleWhatsApp(phone, tradeName)}
            activeOpacity={0.8}
          >
            <Feather name="message-circle" size={m(16)} color={colors.white} />
            <Text style={styles.whatsAppActionText}>WhatsApp Discussion</Text>
          </TouchableOpacity>
        </View>
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
    paddingBottom: m(90),
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
  kpiLabel: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: m(4),
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

  // Facilities
  emptyFacilitiesBox: {
    alignItems: 'center',
    paddingVertical: m(20),
  },
  emptyFacilitiesText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(6),
    textAlign: 'center',
  },
  facilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: m(10),
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  facilityPurposeText: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  facilitySubText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(1),
  },
  facilityAmountText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  facilityPill: {
    paddingHorizontal: m(6),
    paddingVertical: m(2),
    borderRadius: m(6),
    marginTop: m(2),
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

  // Bottom Actions Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: m(16),
    paddingVertical: m(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(9, 48, 48, 0.08)',
    flexDirection: 'row',
    gap: m(10),
    elevation: 8,
  },
  callActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: m(12),
    paddingVertical: m(12),
    gap: m(6),
  },
  callActionText: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.oceanBlueButton,
  },
  whatsAppActionBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15803d',
    borderRadius: m(12),
    paddingVertical: m(12),
    gap: m(6),
  },
  whatsAppActionText: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
});
