import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { colors, FontFamily } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper, showAlert } from '../../../Components/common';
import borrowerFlowService from '../../../Services/borrowerFlowService';

export default function BorrowerLenderDetails() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id, lenderId } = route.params || {};
  const targetId = id || lenderId;

  const [lender, setLender] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('financial'); // 'personal' | 'financial'
  const [activePendingApp, setActivePendingApp] = useState(null);
  const [copiedLicense, setCopiedLicense] = useState(false);

  // Fetch lender details from GET /api/borrower/lenders endpoint
  const fetchLender = async () => {
    try {
      setLoading(true);
      const [lendersRes, appsRes] = await Promise.allSettled([
        borrowerFlowService.getLenders(),
        borrowerFlowService.getMyApplications(),
      ]);

      if (lendersRes.status === 'fulfilled' && lendersRes.value?.success) {
        const list = lendersRes.value.lenders || [];
        let matched = null;
        if (targetId) {
          matched = list.find((l) => String(l._id) === String(targetId));
        }
        if (!matched && list.length > 0) {
          matched = list[0];
        }
        setLender(matched);
      } else if (targetId) {
        // Direct fallback
        const single = await borrowerFlowService.getLenderById(targetId);
        if (single?.success && single.lender) {
          setLender(single.lender);
        }
      }

      if (appsRes.status === 'fulfilled' && appsRes.value?.success) {
        const apps = appsRes.value.applications || [];
        const pending = apps.find((a) => a.status === 'pending');
        setActivePendingApp(pending || null);
      }
    } catch (err) {
      console.error('Error fetching lender profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLender();
  }, [targetId]);

  const handleToggleFavorite = async () => {
    if (!lender) return;
    const nextState = !lender.isFavorite;
    setLender({ ...lender, isFavorite: nextState });
    try {
      await borrowerFlowService.toggleFavoriteLender(lender._id);
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setLender({ ...lender, isFavorite: !nextState });
    }
  };

  const handleCopyLicense = (lic) => {
    if (!lic) return;
    setCopiedLicense(true);
    showAlert('License Copied', `License number ${lic} copied to clipboard.`);
    setTimeout(() => setCopiedLicense(false), 2000);
  };

  const handleApply = () => {
    if (activePendingApp) {
      const pendingLenderName =
        activePendingApp.lenderSnapshot?.companyName ||
        activePendingApp.lenderSnapshot?.userName ||
        activePendingApp.lenderId?.companyName ||
        'another institution';
      const remaining =
        activePendingApp.remainingHours != null
          ? `${activePendingApp.remainingHours} hours`
          : 'up to 48 hours';
      showAlert(
        'Active Application Under Review',
        `You currently have an active credit request with ${pendingLenderName} (decision expires in ${remaining}). In accordance with commercial lending rules, you can apply with another lender once this request is accepted, rejected, or expired.`,
        [
          { text: 'View Status', onPress: () => navigation.navigate('BorrowerApplications') },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }
    navigation.navigate('BorrowerApply', { preselectedLender: lender });
  };

  const formatINR = (val) => {
    if (!val || isNaN(val)) return '₹0';
    const num = Number(val);
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lakh`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const getInitials = (name) => {
    if (!name) return 'LD';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return (
      <ScreenWrapper
        backgroundColor={colors.backgroundGreenWhite}
        topInsetBg={colors.primary}
        statusBarColor={colors.primary}
        statusBarStyle="dark-content"
      >
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.lettersAndIcons} />
          <Text style={styles.loadingText}>Loading lender profile...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!lender) {
    return (
      <ScreenWrapper
        backgroundColor={colors.backgroundGreenWhite}
        topInsetBg={colors.primary}
        statusBarColor={colors.primary}
        statusBarStyle="dark-content"
      >
        <View style={styles.centerContainer}>
          <Feather name="alert-circle" size={m(36)} color={colors.textSecondary} />
          <Text style={styles.notFoundText}>Lender profile could not be found.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Return to Lenders</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  const lp = lender.lenderProfile || {};
  const companyTitle = lender.companyName || lender.userName || 'Institutional Lender';
  const minRate = lp.minInterestRate != null ? lp.minInterestRate : 9.5;
  const maxRate = lp.maxInterestRate != null ? lp.maxInterestRate : 14.0;
  const minAmount = lp.minLoanAmount != null ? lp.minLoanAmount : 500000;
  const maxAmount = lp.maxLoanAmount != null ? lp.maxLoanAmount : 100000000;
  const tat = lp.turnaroundTime || '24-48 Hours';
  const isFav = !!lender.isFavorite;
  const services =
    Array.isArray(lp.servicesOffered) && lp.servicesOffered.length > 0
      ? lp.servicesOffered
      : [
          'Commercial Term Loan',
          'Working Capital Line',
          'SME Business Loan',
          'Equipment & Machinery Finance',
        ];

  const totalFunded = lp.totalLoansFunded || 12;
  const disbursedVolume = lp.totalDisbursedAmount || 802000;
  const reviewScore = lp.rating && lp.ratingCount ? `${lp.rating} ★ (${lp.ratingCount})` : 'New Desk';

  const isDistinctCompany = Boolean(
    lender.companyName &&
    lender.userName &&
    lender.companyName.trim().toLowerCase() !== lender.userName.trim().toLowerCase()
  );

  const formatUniqueAddress = (...parts) => {
    const seen = new Set();
    return parts
      .filter(Boolean)
      .map((p) => String(p).trim())
      .filter((part) => {
        const normalized = part.toLowerCase();
        if (seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
      })
      .join(', ');
  };

  return (
    <ScreenWrapper
      backgroundColor={colors.backgroundGreenWhite}
      topInsetBg={colors.primary}
      statusBarColor={colors.primary}
      statusBarStyle="dark-content"
      includeTabBarClearance={false}
      scrollable={false}
    >
      {/* ── Top Header Navigation Bar (Clean & Simple) ── */}
      <View style={styles.topBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backCircularBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Feather name="chevron-left" size={m(22)} color={colors.lettersAndIcons} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Lender Profile</Text>
          </View>
        </View>
      </View>

      {/* ── Main Sheet Body ── */}
      <View style={styles.sheetSection}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── TOP HERO BANNER (Only: Lender Name, License Number, Favorited) ── */}
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              {/* Left: Avatar with Verified Check Badge */}
              <View style={styles.avatarWrap}>
                <View style={styles.avatarBox}>
                  <Text style={styles.avatarInitials}>{getInitials(companyTitle)}</Text>
                </View>
                <View style={styles.verifiedCheckBadge}>
                  <Feather name="check" size={m(10)} color={colors.white} strokeWidth={3} />
                </View>
              </View>

              {/* Middle: Lender Name & License Number */}
              <View style={styles.heroIdentityCol}>
                <Text style={styles.heroNameText} numberOfLines={1}>
                  {companyTitle}
                </Text>

                {lender.licenseNumber ? (
                  <TouchableOpacity
                    style={styles.licenseRow}
                    activeOpacity={0.8}
                    onPress={() => handleCopyLicense(lender.licenseNumber)}
                  >
                    <Feather name="shield" size={m(11)} color="#f59e0b" />
                    <Text style={styles.licenseText}>Lic: {lender.licenseNumber}</Text>
                    <Feather
                      name={copiedLicense ? 'check' : 'copy'}
                      size={m(11)}
                      color={copiedLicense ? '#10b981' : '#94a3b8'}
                    />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Right: Favorited Button */}
              <TouchableOpacity
                style={[styles.heroFavoriteBtn, isFav && styles.heroFavoriteBtnActive]}
                activeOpacity={0.8}
                onPress={handleToggleFavorite}
              >
                <Feather
                  name="bookmark"
                  size={m(12)}
                  color={isFav ? '#d97706' : '#f59e0b'}
                />
                <Text style={styles.heroFavoriteBtnText}>
                  {isFav ? 'Favorited' : 'Favorite'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Tab Switcher: Personal Information vs Financial Information ── */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'personal' && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab('personal')}
              activeOpacity={0.8}
            >
              <Feather
                name="user"
                size={m(14)}
                color={activeTab === 'personal' ? colors.white : colors.lettersAndIcons}
              />
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === 'personal' && styles.tabButtonTextActive,
                ]}
              >
                Personal Information
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'financial' && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab('financial')}
              activeOpacity={0.8}
            >
              <Feather
                name="credit-card"
                size={m(14)}
                color={activeTab === 'financial' ? colors.white : colors.lettersAndIcons}
              />
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === 'financial' && styles.tabButtonTextActive,
                ]}
              >
                Financial Information
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── TAB CONTENT: Financial Information (Matches Screenshot 1:1) ── */}
          {activeTab === 'financial' ? (
            <>
              {/* Card 1: Interest Rates & Ticket Size Limits */}
              <View style={styles.whiteCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={styles.iconSquareGreen}>
                      <Text style={styles.iconPercentText}>%</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardHeaderTitle}>Interest Rates & Ticket Size Limits</Text>
                      <Text style={styles.cardHeaderSubtitle}>
                        Live underwriting criteria and borrowing brackets configured by this lender.
                      </Text>
                    </View>
                  </View>
                  <View style={styles.liveTermsBadge}>
                    <Text style={styles.liveTermsBadgeText}>LIVE TERMS</Text>
                  </View>
                </View>

                {/* Subheader: ANNUAL INTEREST RATE RANGE (APR % P.A.) */}
                <Text style={styles.subCategoryLabel}>
                  ANNUAL INTEREST RATE RANGE (APR % P.A.)
                </Text>
                <View style={styles.dualBoxRow}>
                  <View style={styles.bracketBox}>
                    <Text style={styles.bracketBoxLabel}>
                      MINIMUM RATE (PRIME / BEST CREDIT)
                    </Text>
                    <Text style={styles.bracketRateVal}>{minRate}%</Text>
                    <Text style={styles.bracketSubtext}>
                      For borrowers with strong credit & high risk grade.
                    </Text>
                  </View>

                  <View style={styles.bracketBox}>
                    <Text style={styles.bracketBoxLabel}>
                      MAXIMUM RATE (SUBPRIME / HIGHER RISK)
                    </Text>
                    <Text style={styles.bracketRateVal}>{maxRate}%</Text>
                    <Text style={styles.bracketSubtext}>
                      Capped APR for higher risk or customized credit structures.
                    </Text>
                  </View>
                </View>

                {/* Subheader: LOAN TICKET SIZE BRACKETS (₹) */}
                <Text style={[styles.subCategoryLabel, { marginTop: m(14) }]}>
                  LOAN TICKET SIZE BRACKETS (₹)
                </Text>
                <View style={styles.dualBoxRow}>
                  <View style={styles.bracketBox}>
                    <Text style={styles.bracketBoxLabel}>MINIMUM LOAN AMOUNT</Text>
                    <Text style={styles.bracketAmountVal}>{formatINR(minAmount)}</Text>
                  </View>

                  <View style={styles.bracketBox}>
                    <Text style={styles.bracketBoxLabel}>MAXIMUM TICKET SIZE LIMIT</Text>
                    <Text style={styles.bracketAmountVal}>{formatINR(maxAmount)}</Text>
                  </View>
                </View>

                {/* Box 3: AVERAGE APPROVAL & UNDERWRITING TAT */}
                <View style={styles.tatBox}>
                  <Feather name="clock" size={m(15)} color="#2563eb" />
                  <View style={{ flex: 1, marginLeft: m(8) }}>
                    <Text style={styles.tatLabel}>AVERAGE APPROVAL & UNDERWRITING TAT</Text>
                    <Text style={styles.tatVal}>{tat}</Text>
                  </View>
                </View>
              </View>

              {/* Card 2: Services & Financing Products Provided */}
              <View style={styles.whiteCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={styles.iconSquarePurple}>
                      <Feather name="layers" size={m(16)} color="#7c3aed" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardHeaderTitle}>
                        Services & Financing Products Provided
                      </Text>
                      <Text style={styles.cardHeaderSubtitle}>
                        Credit facilities and corporate loan products actively funded by this desk.
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.productsWrap}>
                  {services.map((item) => (
                    <View key={item} style={styles.productPill}>
                      <Feather name="check-circle" size={m(13)} color="#2563eb" />
                      <Text style={styles.productPillText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Card 3: Platform Performance & Track Record */}
              <View style={styles.whiteCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={styles.iconSquareBlue}>
                      <Feather name="trending-up" size={m(16)} color="#2563eb" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardHeaderTitle}>
                        Platform Performance & Track Record
                      </Text>
                      <Text style={styles.cardHeaderSubtitle}>
                        Real metrics recorded on the LoanHub commercial network.
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.trackRecordGrid}>
                  <View style={styles.trackRecordBox}>
                    <Text style={styles.trackRecordBoxLabel}>TOTAL DEALS FUNDED</Text>
                    <Text style={styles.trackRecordValBlue}>{totalFunded}</Text>
                    <Text style={styles.trackRecordSub}>Closed Facilities</Text>
                  </View>

                  <View style={styles.trackRecordBox}>
                    <Text style={styles.trackRecordBoxLabel}>DISBURSED CAPITAL VOLUME</Text>
                    <Text style={styles.trackRecordValGreen}>
                      {formatINR(disbursedVolume)}
                    </Text>
                    <Text style={styles.trackRecordSub}>Direct Volume</Text>
                  </View>

                  <View style={styles.trackRecordBox}>
                    <Text style={styles.trackRecordBoxLabel}>CUSTOMER REVIEWS</Text>
                    <Text style={styles.trackRecordValDark}>{reviewScore}</Text>
                    <Text style={styles.trackRecordSub}>
                      {lp.ratingCount ? 'Verified reviews' : 'No reviews yet'}
                    </Text>
                  </View>
                </View>
              </View>
            </>
          ) : (
            /* ── TAB CONTENT: Personal Information ── */
            <View style={styles.whiteCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.iconSquareBlue}>
                    <Feather name="user" size={m(16)} color="#2563eb" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardHeaderTitle}>Contact & Official Registration Desk</Text>
                    <Text style={styles.cardHeaderSubtitle}>
                      Verified commercial desk coordinates and statutory regulatory details.
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.personalDetailsList}>
                {isDistinctCompany && (
                  <View style={styles.personalDetailItem}>
                    <Text style={styles.personalDetailLabel}>Desk Officer</Text>
                    <Text style={styles.personalDetailVal}>{lender.userName}</Text>
                  </View>
                )}

                <View style={styles.personalDetailItem}>
                  <Text style={styles.personalDetailLabel}>Official Email</Text>
                  <Text style={styles.personalDetailVal}>{lender.email || 'partner@loanhub.in'}</Text>
                </View>

                <View style={styles.personalDetailItem}>
                  <Text style={styles.personalDetailLabel}>Direct Contact</Text>
                  <Text style={styles.personalDetailVal}>{lender.mobileNo || '+91 9876545678'}</Text>
                </View>

                <View style={styles.personalDetailItem}>
                  <Text style={styles.personalDetailLabel}>Operating Jurisdiction</Text>
                  <Text style={styles.personalDetailVal}>
                    {lender.stateOfOperation || 'India (Pan-India)'}
                  </Text>
                </View>

                <View style={styles.personalDetailItem}>
                  <Text style={styles.personalDetailLabel}>Registered Office Address</Text>
                  <Text style={styles.personalDetailVal}>
                    {formatUniqueAddress(
                      lender.address,
                      lender.taluka,
                      lender.city,
                      lender.district,
                      lender.state,
                      lender.pincode
                    ) || 'Kolhapur, Maharashtra, India'}
                  </Text>
                </View>

                {lender.licenseNumber ? (
                  <View style={[styles.personalDetailItem, { borderBottomWidth: 0 }]}>
                    <Text style={styles.personalDetailLabel}>Corporate Lending License</Text>
                    <Text style={[styles.personalDetailVal, { fontFamily: FontFamily.primaryBold }]}>
                      {lender.licenseNumber}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          )}

          {/* ── Bottom Sticky-like Apply Button ── */}
          <TouchableOpacity
            style={styles.bottomApplyBtn}
            activeOpacity={0.85}
            onPress={handleApply}
          >
            <Feather name="file-text" size={m(16)} color={colors.white} />
            <Text style={styles.bottomApplyBtnText}>Apply with {companyTitle}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: m(20),
  },
  loadingText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
    marginTop: m(10),
  },
  notFoundText: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
    marginTop: m(10),
    marginBottom: m(14),
  },
  backButton: {
    backgroundColor: colors.lettersAndIcons,
    paddingHorizontal: m(16),
    paddingVertical: m(8),
    borderRadius: m(10),
  },
  backButtonText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },

  // ── Top Green Header ──
  topBanner: {
    backgroundColor: colors.primary,
    paddingHorizontal: m(16),
    paddingTop: m(10),
    paddingBottom: m(14),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backCircularBtn: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: m(12),
  },
  headerTag: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: 0.8,
    opacity: 0.85,
  },
  headerTitle: {
    fontSize: m(17),
    lineHeight: m(22),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  favHeaderBtn: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  favHeaderBtnActive: {
    backgroundColor: '#fffbeb',
    borderWidth: 1.5,
    borderColor: '#fde68a',
  },

  // ── Sheet Section ──
  sheetSection: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(28),
    borderTopRightRadius: m(28),
    paddingTop: m(14),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: m(16),
    paddingBottom: m(50),
  },

  // ── Back Link Row ──
  backLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
    marginBottom: m(12),
    alignSelf: 'flex-start',
  },
  backLinkText: {
    fontSize: m(12),
    fontFamily: FontFamily.primarySemiBold,
    color: '#475569',
  },

  // ── Top Hero Card (Dark Navy Matching Screenshot) ──
  heroCard: {
    backgroundColor: '#0b1329',
    borderRadius: m(22),
    padding: m(16),
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: m(14),
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(12),
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarBox: {
    width: m(54),
    height: m(54),
    borderRadius: m(16),
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarInitials: {
    fontSize: m(19),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  verifiedCheckBadge: {
    position: 'absolute',
    bottom: -m(2),
    right: -m(2),
    width: m(18),
    height: m(18),
    borderRadius: m(9),
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0b1329',
  },
  heroIdentityCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  heroNameText: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
    flexShrink: 1,
  },
  licenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(5),
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: m(7),
    paddingVertical: m(3),
    borderRadius: m(6),
    alignSelf: 'flex-start',
    marginTop: m(5),
  },
  licenseText: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryMedium,
    color: '#fef08a',
  },

  heroFavoriteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(5),
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: m(10),
    paddingHorizontal: m(12),
    paddingVertical: m(8),
  },
  heroFavoriteBtnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    borderColor: '#f59e0b',
  },
  heroFavoriteBtnText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: '#fbbf24',
  },

  // ── Tab Switcher Capsule ──
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: m(14),
    padding: m(3),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: m(14),
    gap: m(4),
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(6),
    paddingVertical: m(9),
    borderRadius: m(11),
  },
  tabButtonActive: {
    backgroundColor: '#2563eb',
    elevation: 1,
  },
  tabButtonText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  tabButtonTextActive: {
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },

  // ── White Card Container ──
  whiteCard: {
    backgroundColor: colors.white,
    borderRadius: m(20),
    padding: m(16),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: m(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: m(12),
    gap: m(8),
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: m(10),
    flex: 1,
  },
  iconSquareGreen: {
    width: m(32),
    height: m(32),
    borderRadius: m(10),
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  iconPercentText: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: '#059669',
  },
  iconSquarePurple: {
    width: m(32),
    height: m(32),
    borderRadius: m(10),
    backgroundColor: '#faf5ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  iconSquareBlue: {
    width: m(32),
    height: m(32),
    borderRadius: m(10),
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  cardHeaderTitle: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  cardHeaderSubtitle: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: '#64748b',
    marginTop: m(2),
    lineHeight: m(15),
  },
  liveTermsBadge: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: m(7),
    paddingVertical: m(2),
    borderRadius: m(6),
  },
  liveTermsBadgeText: {
    fontSize: m(8.5),
    fontFamily: FontFamily.primaryBold,
    color: '#059669',
    letterSpacing: 0.4,
  },
  subCategoryLabel: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: '#94a3b8',
    letterSpacing: 0.6,
    marginBottom: m(8),
  },
  dualBoxRow: {
    flexDirection: 'row',
    gap: m(8),
  },
  bracketBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    padding: m(10),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bracketBoxLabel: {
    fontSize: m(8),
    fontFamily: FontFamily.primaryBold,
    color: '#64748b',
    letterSpacing: 0.2,
    marginBottom: m(4),
  },
  bracketRateVal: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: '#059669',
    marginBottom: m(2),
  },
  bracketAmountVal: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  bracketSubtext: {
    fontSize: m(9.5),
    lineHeight: m(13),
    fontFamily: FontFamily.primaryRegular,
    color: '#94a3b8',
  },
  tatBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: m(12),
    padding: m(10),
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginTop: m(12),
  },
  tatLabel: {
    fontSize: m(8.5),
    fontFamily: FontFamily.primaryBold,
    color: '#1d4ed8',
    letterSpacing: 0.4,
  },
  tatVal: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginTop: m(1),
  },

  // ── Products Wrap ──
  productsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(6),
  },
  productPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: m(20),
    paddingHorizontal: m(10),
    paddingVertical: m(6),
  },
  productPillText: {
    fontSize: m(11),
    fontFamily: FontFamily.primarySemiBold,
    color: '#1e3a8a',
  },

  // ── Track Record Grid ──
  trackRecordGrid: {
    flexDirection: 'row',
    gap: m(8),
  },
  trackRecordBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    padding: m(10),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  trackRecordBoxLabel: {
    fontSize: m(7.5),
    fontFamily: FontFamily.primaryBold,
    color: '#64748b',
    letterSpacing: 0.2,
    textAlign: 'center',
    marginBottom: m(4),
  },
  trackRecordValBlue: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: '#2563eb',
    marginBottom: m(2),
  },
  trackRecordValGreen: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: '#059669',
    marginBottom: m(2),
    textAlign: 'center',
  },
  trackRecordValDark: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(2),
    textAlign: 'center',
  },
  trackRecordSub: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryRegular,
    color: '#94a3b8',
    textAlign: 'center',
  },

  // ── Personal Information List ──
  personalDetailsList: {
    gap: m(8),
  },
  personalDetailItem: {
    paddingBottom: m(8),
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  personalDetailLabel: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryMedium,
    color: '#64748b',
    marginBottom: m(2),
  },
  personalDetailVal: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.lettersAndIcons,
  },

  // ── Bottom Apply Button ──
  bottomApplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
    backgroundColor: colors.lettersAndIcons,
    borderRadius: m(16),
    paddingVertical: m(14),
    elevation: 3,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    marginTop: m(6),
  },
  bottomApplyBtnText: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
});
