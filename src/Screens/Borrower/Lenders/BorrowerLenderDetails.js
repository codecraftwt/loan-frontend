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
import Clipboard from '@react-native-clipboard/clipboard';
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

  // Fetch lender details from GET /api/borrower/lenders/:id endpoint
  const fetchLender = async () => {
    if (!targetId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [lenderRes, appsRes] = await Promise.allSettled([
        borrowerFlowService.getLenderById(targetId),
        borrowerFlowService.getMyApplications(),
      ]);

      if (lenderRes.status === 'fulfilled' && lenderRes.value?.success && lenderRes.value?.lender) {
        setLender(lenderRes.value.lender);
      } else {
        // Fallback to marketplace list in case single fetch fails
        const lendersRes = await borrowerFlowService.getLenders();
        if (lendersRes?.success && lendersRes.lenders) {
          const matched = lendersRes.lenders.find((l) => String(l._id) === String(targetId));
          setLender(matched || null);
        } else {
          setLender(null);
        }
      }

      if (appsRes.status === 'fulfilled' && appsRes.value?.success) {
        const apps = appsRes.value.applications || [];
        const pending = apps.find((a) => a.status === 'pending');
        setActivePendingApp(pending || null);
      }
    } catch (err) {
      console.error('Error fetching lender profile:', err);
      setLender(null);
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
    try {
      Clipboard.setString(String(lic));
    } catch (err) {
      console.log('Clipboard copy error:', err);
    }
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
        backgroundColor="#F8FAFC"
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
        backgroundColor="#F8FAFC"
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
  const minRateText = lp.minInterestRate != null ? `${lp.minInterestRate}%` : 'On Request';
  const maxRateText = lp.maxInterestRate != null ? `${lp.maxInterestRate}%` : 'On Request';
  const minAmountText = lp.minLoanAmount && Number(lp.minLoanAmount) > 0 ? formatINR(lp.minLoanAmount) : 'Flexible';
  const maxAmountText = lp.maxLoanAmount && Number(lp.maxLoanAmount) > 0 ? formatINR(lp.maxLoanAmount) : 'Flexible Limits';
  const tat = lp.turnaroundTime || '24-48 Hours (Standard Verification)';
  const isFav = !!lender.isFavorite;
  const services = Array.isArray(lp.servicesOffered) ? lp.servicesOffered : [];

  const totalFunded = lp.totalLoansFunded != null ? lp.totalLoansFunded : 0;
  const disbursedVolume = lp.totalDisbursedAmount != null ? lp.totalDisbursedAmount : 0;
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
      backgroundColor="#F8FAFC"
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
          {/* ── TOP HERO BANNER (Lender Name, License Number, Favorited) ── */}
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

              {/* Middle: Lender Name & Status */}
              <View style={styles.heroIdentityCol}>
                <Text style={styles.heroNameText} numberOfLines={1}>
                  {companyTitle}
                </Text>
                <View style={styles.verifiedBadgeRow}>
                  <Feather name="check-circle" size={m(11)} color="#10b981" />
                  <Text style={styles.verifiedBadgeText}>Verified Lender</Text>
                </View>
              </View>

              {/* Right: Favorited Button */}
              <TouchableOpacity
                style={[styles.heroFavoriteBtn, isFav && styles.heroFavoriteBtnActive]}
                activeOpacity={0.8}
                onPress={handleToggleFavorite}
              >
                <Feather
                  name="bookmark"
                  size={m(13)}
                  color={isFav ? colors.oceanBlueButton : colors.textSecondary}
                />
                <Text style={[styles.heroFavoriteBtnText, isFav && styles.heroFavoriteBtnTextActive]}>
                  {isFav ? 'Favorited' : 'Favorite'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Row: Full-width License & Copy Button */}
            {lender.licenseNumber ? (
              <View style={styles.licenseBanner}>
                <View style={styles.licenseLeftGroup}>
                  <Feather name="shield" size={m(13)} color={colors.oceanBlueButton} />
                  <Text style={styles.licenseText} numberOfLines={1}>
                    Lic: {lender.licenseNumber}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.copyBtn}
                  activeOpacity={0.7}
                  onPress={() => handleCopyLicense(lender.licenseNumber)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather
                    name={copiedLicense ? 'check' : 'copy'}
                    size={m(12)}
                    color={copiedLicense ? '#059669' : colors.oceanBlueButton}
                  />
                  <Text style={[styles.copyBtnText, copiedLicense && { color: '#059669' }]}>
                    {copiedLicense ? 'Copied' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
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
                color={activeTab === 'personal' ? colors.lettersAndIcons : colors.textSecondary}
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
                color={activeTab === 'financial' ? colors.lettersAndIcons : colors.textSecondary}
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
                    <View style={styles.headerIconBox}>
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
                    <Text style={styles.bracketRateVal}>{minRateText}</Text>
                    <Text style={styles.bracketSubtext}>
                      For borrowers with strong credit & high risk grade.
                    </Text>
                  </View>

                  <View style={styles.bracketBox}>
                    <Text style={styles.bracketBoxLabel}>
                      MAXIMUM RATE (SUBPRIME / HIGHER RISK)
                    </Text>
                    <Text style={styles.bracketRateVal}>{maxRateText}</Text>
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
                    <Text style={styles.bracketAmountVal}>{minAmountText}</Text>
                  </View>

                  <View style={styles.bracketBox}>
                    <Text style={styles.bracketBoxLabel}>MAXIMUM TICKET SIZE LIMIT</Text>
                    <Text style={styles.bracketAmountVal}>{maxAmountText}</Text>
                  </View>
                </View>

                {/* Box 3: AVERAGE APPROVAL & UNDERWRITING TAT */}
                <View style={styles.tatBox}>
                  <Feather name="clock" size={m(15)} color={colors.oceanBlueButton} />
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
                    <View style={styles.headerIconBox}>
                      <Feather name="layers" size={m(16)} color={colors.white} />
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
                  {services.length > 0 ? (
                    services.map((item, idx) => (
                      <View key={`${item}-${idx}`} style={styles.productPill}>
                        <Feather name="check-circle" size={m(13)} color={colors.oceanBlueButton} />
                        <Text style={styles.productPillText}>{item}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyServicesText}>
                      Offers comprehensive commercial & business loan financing on request.
                    </Text>
                  )}
                </View>
              </View>

              {/* Card 3: Platform Performance & Track Record */}
              <View style={styles.whiteCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={styles.headerIconBox}>
                      <Feather name="trending-up" size={m(16)} color={colors.white} />
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
                  <View style={styles.headerIconBox}>
                    <Feather name="user" size={m(16)} color={colors.white} />
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
                  <Text style={styles.personalDetailVal}>{lender.email || 'Not Specified'}</Text>
                </View>

                <View style={styles.personalDetailItem}>
                  <Text style={styles.personalDetailLabel}>Direct Contact</Text>
                  <Text style={styles.personalDetailVal}>{lender.mobileNo || 'Not Specified'}</Text>
                </View>

                <View style={styles.personalDetailItem}>
                  <Text style={styles.personalDetailLabel}>Operating Jurisdiction</Text>
                  <Text style={styles.personalDetailVal}>
                    {lender.stateOfOperation || lender.state || 'Pan India Coverage'}
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
                    ) || 'Address available on request.'}
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
            <Feather name="file-text" size={m(16)} color={colors.lettersAndIcons} />
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
    backgroundColor: '#F8FAFC',
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

  // ── Top Hero Card (Clean FinWise Light Aesthetic) ──
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: m(20),
    padding: m(16),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
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
    width: m(52),
    height: m(52),
    borderRadius: m(16),
    backgroundColor: colors.oceanBlueButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: m(18),
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
    backgroundColor: '#00D09E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  heroIdentityCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  heroNameText: {
    fontSize: m(17),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    flexShrink: 1,
  },
  verifiedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    marginTop: m(3),
  },
  verifiedBadgeText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryMedium,
    color: '#059669',
  },
  licenseBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: m(10),
    paddingHorizontal: m(12),
    paddingVertical: m(8),
    marginTop: m(12),
  },
  licenseLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
    flex: 1,
    marginRight: m(8),
  },
  licenseText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
    flexShrink: 1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: m(6),
    paddingHorizontal: m(8),
    paddingVertical: m(4),
  },
  copyBtnText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.oceanBlueButton,
  },

  heroFavoriteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(5),
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: m(10),
    paddingHorizontal: m(12),
    paddingVertical: m(8),
  },
  heroFavoriteBtnActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  heroFavoriteBtnText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  heroFavoriteBtnTextActive: {
    color: colors.oceanBlueButton,
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
    backgroundColor: colors.primary,
    elevation: 1,
  },
  tabButtonText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
  },
  tabButtonTextActive: {
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
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
  headerIconBox: {
    width: m(34),
    height: m(34),
    borderRadius: m(11),
    backgroundColor: colors.oceanBlueButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPercentText: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
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
    color: colors.oceanBlueButton,
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
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: m(20),
    paddingHorizontal: m(10),
    paddingVertical: m(6),
  },
  productPillText: {
    fontSize: m(11),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.lettersAndIcons,
  },
  emptyServicesText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryRegular,
    color: '#94a3b8',
    fontStyle: 'italic',
    paddingVertical: m(6),
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
    color: colors.oceanBlueButton,
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
    backgroundColor: colors.primary,
    borderRadius: m(16),
    paddingVertical: m(14),
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    marginTop: m(6),
  },
  bottomApplyBtnText: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
});
