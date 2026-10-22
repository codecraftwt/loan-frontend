import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { colors, FontFamily } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper } from '../../../Components/common';
import borrowerFlowService from '../../../Services/borrowerFlowService';

export default function BorrowerLenderDetails() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params || {};

  const [lender, setLender] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('financial'); // 'financial' | 'profile'

  useEffect(() => {
    const fetchLender = async () => {
      try {
        setLoading(true);
        if (id) {
          const res = await borrowerFlowService.getLenderById(id);
          if (res?.success && res.lender) {
            setLender(res.lender);
          }
        }
      } catch (err) {
        console.error('Error fetching lender details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLender();
  }, [id]);

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

  const formatINR = (val) => {
    if (!val) return '₹0';
    const num = Number(val);
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lakh`;
    return `₹${num.toLocaleString('en-IN')}`;
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
          <Text style={styles.loadingText}>Loading institution details...</Text>
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
          <Text style={styles.notFoundText}>Institution details could not be loaded.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Return to Lenders</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  const lp = lender.lenderProfile || {};
  const maxAmount = lp.maxLoanAmount || 5000000;
  const minRate = lp.minInterestRate || 10.5;
  const maxRate = lp.maxInterestRate || 16.0;
  const maxTenure = lp.maxTenureMonths || 36;
  const isFav = !!lender.isFavorite;

  const companyTitle = lender.companyName || lender.userName || 'Institutional Lender';

  return (
    <ScreenWrapper
      backgroundColor={colors.backgroundGreenWhite}
      topInsetBg={colors.primary}
      statusBarColor={colors.primary}
      statusBarStyle="dark-content"
      includeTabBarClearance={false}
      scrollable={false}
    >
      {/* Top Green Banner */}
      <View style={styles.topBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backCircularBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={m(18)} color={colors.lettersAndIcons} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTag}>INSTITUTIONAL PARTNER</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {companyTitle}
            </Text>
          </View>

          {/* Bookmark Toggle Button */}
          <TouchableOpacity
            style={[styles.favHeaderBtn, isFav && styles.favHeaderBtnActive]}
            onPress={handleToggleFavorite}
            activeOpacity={0.8}
          >
            <Feather
              name="bookmark"
              size={m(17)}
              color={colors.lettersAndIcons}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Curved Sheet */}
      <View style={styles.sheetSection}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Institution Header Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarCircle}>
              <Feather name="briefcase" size={m(28)} color={colors.white} />
            </View>

            <Text style={styles.companyNameText}>{companyTitle}</Text>

            <View style={styles.verifiedRow}>
              <View style={styles.verifiedBadge}>
                <Feather name="check-circle" size={m(12)} color="#059669" />
                <Text style={styles.verifiedText}>Verified Commercial Lender</Text>
              </View>
            </View>

            <Text style={styles.locationSubtitle}>
              {lender.city ? `${lender.city}, ${lender.state || 'India'}` : 'Pan-India Operations'}
            </Text>

            {/* Quick Metrics Strip - Neutral Slate-50 (#F8FAFC) */}
            <View style={styles.metricsBox}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Max Facility</Text>
                <Text style={styles.metricValueBold}>{formatINR(maxAmount)}</Text>
              </View>

              <View style={styles.metricDivider} />

              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Interest Rate</Text>
                <Text style={styles.metricValue}>
                  {minRate}% - {maxRate}%
                </Text>
              </View>

              <View style={styles.metricDivider} />

              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Tenure</Text>
                <Text style={styles.metricValue}>{maxTenure} Mo</Text>
              </View>
            </View>
          </View>

          {/* Tab Switcher Capsule */}
          <View style={styles.tabSwitcher}>
            <TouchableOpacity
              style={[
                styles.switcherBtn,
                activeTab === 'financial' && styles.activeSwitcherBtn,
              ]}
              onPress={() => setActiveTab('financial')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.switcherBtnText,
                  activeTab === 'financial' && styles.activeSwitcherBtnText,
                ]}
              >
                Financing Terms
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.switcherBtn,
                activeTab === 'profile' && styles.activeSwitcherBtn,
              ]}
              onPress={() => setActiveTab('profile')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.switcherBtnText,
                  activeTab === 'profile' && styles.activeSwitcherBtnText,
                ]}
              >
                Institution Profile
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'financial' ? (
            <>
              {/* Card 1: Lending Terms & Parameters */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Lending Terms & Parameters</Text>
                <Text style={styles.sectionSubtitle}>
                  Institutional underwriting guidelines & limits
                </Text>

                <View style={styles.detailsList}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Repayment Mode</Text>
                    <Text style={styles.detailValBold}>Monthly EMI / Amortizing</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Max Ticket Cap</Text>
                    <Text style={styles.detailValBold}>{formatINR(maxAmount)}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Annual Interest Rate</Text>
                    <Text style={styles.detailValBold}>
                      {minRate}% – {maxRate}% p.a.
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Max Facility Tenure</Text>
                    <Text style={styles.detailValBold}>{maxTenure} Months</Text>
                  </View>

                  <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.detailLabel}>Disbursal Verification</Text>
                    <Text style={styles.detailValBold}>Mutual 6-Digit OTP</Text>
                  </View>
                </View>
              </View>

              {/* Card 2: Supported Purposes */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Supported Facility Purposes</Text>
                <Text style={styles.sectionSubtitle}>
                  Eligible commercial loan categories
                </Text>

                <View style={styles.chipsContainer}>
                  {[
                    'Working Capital Line',
                    'Machinery & Equipment',
                    'Business Expansion',
                    'Inventory Financing',
                    'Debt Refinancing',
                  ].map((item) => (
                    <View key={item} style={styles.purposeChip}>
                      <Feather name="check" size={m(12)} color={colors.blueButton} />
                      <Text style={styles.purposeChipText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          ) : (
            <>
              {/* Card 1: Official Contact & Compliance */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Official Contact & Compliance</Text>
                <Text style={styles.sectionSubtitle}>
                  Corporate identity & regulatory information
                </Text>

                <View style={styles.detailsList}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Official Email</Text>
                    <Text style={styles.detailValBold}>
                      {lender.email || 'partner@loanhub.in'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Verified Phone</Text>
                    <Text style={styles.detailValBold}>
                      {lender.mobileNo || '+91-XXXXXXXXXX'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Jurisdiction</Text>
                    <Text style={styles.detailValBold}>
                      {lender.city ? `${lender.city}, ${lender.state || 'India'}` : 'Pan-India Operations'}
                    </Text>
                  </View>

                  {lender.licenseNumber ? (
                    <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                      <Text style={styles.detailLabel}>NBFC / License No</Text>
                      <Text style={styles.detailValMono}>{lender.licenseNumber}</Text>
                    </View>
                  ) : (
                    <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                      <Text style={styles.detailLabel}>Regulatory Status</Text>
                      <Text style={styles.detailValBold}>Verified Institutional Partner</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Card 2: Operational Integrity */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Operational Integrity</Text>
                <Text style={styles.sectionSubtitle}>
                  Overview of capital underwriting scope
                </Text>

                <View style={styles.bioCard}>
                  <Text style={styles.bioText}>
                    {lp.bio ||
                      'Institutional capital provider specializing in credit lines, merchant loans, and structured debt for SMEs.'}
                  </Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>

        {/* Sticky Bottom Apply Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.applyNowBtn}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate('BorrowerApply', { preselectedLender: lender })
            }
          >
            {/* <Feather name="send" size={m(15)} color={colors.white} /> */}
            <Text style={styles.applyNowBtnText}>Apply with this Institution</Text>
          </TouchableOpacity>
        </View>
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

  // Top Green Banner
  topBanner: {
    backgroundColor: colors.primary,
    paddingHorizontal: m(18),
    paddingTop: m(10),
    paddingBottom: m(18),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: m(12),
    marginRight: m(8),
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
    backgroundColor: '#bbf7d0',
  },

  // Main Curved Sheet
  sheetSection: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(32),
    borderTopRightRadius: m(32),
    paddingTop: m(16),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: m(18),
    paddingBottom: m(100),
  },

  // Header Profile Card
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: m(20),
    padding: m(18),
    alignItems: 'center',
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.06)',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  avatarCircle: {
    width: m(58),
    height: m(58),
    borderRadius: m(29),
    backgroundColor: colors.blueButton,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: m(10),
    elevation: 2,
    shadowColor: colors.blueButton,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  companyNameText: {
    fontSize: m(17),
    lineHeight: m(22),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    textAlign: 'center',
  },
  verifiedRow: {
    marginTop: m(4),
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: '#ecfdf5',
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(8),
  },
  verifiedText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryBold,
    color: '#059669',
  },
  locationSubtitle: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(4),
  },

  // Compact Metrics Box inside Card - Neutral Slate-50 (#F8FAFC)
  metricsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    paddingVertical: m(10),
    paddingHorizontal: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: m(14),
    width: '100%',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
    marginBottom: m(2),
  },
  metricValueBold: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  metricValue: {
    fontSize: m(12),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.lettersAndIcons,
  },
  metricDivider: {
    width: 1,
    height: m(24),
    backgroundColor: '#e2e8f0',
  },

  // Tab Switcher
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: m(8),
    padding: m(4),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
  },
  switcherBtn: {
    flex: 1,
    paddingVertical: m(8),
    borderRadius: m(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSwitcherBtn: {
    backgroundColor: colors.primary,
  },
  switcherBtnText: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  activeSwitcherBtnText: {
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  // Section Cards
  sectionCard: {
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
  sectionTitle: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  sectionSubtitle: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(1),
    marginBottom: m(10),
  },

  // Key-Value Rows List - Neutral Slate-50 (#F8FAFC)
  detailsList: {
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: m(9),
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
  },
  detailValBold: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  detailValMono: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  // Purpose Chips
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(8),
  },
  purposeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
    backgroundColor: '#f8fafc',
    borderRadius: m(10),
    paddingHorizontal: m(10),
    paddingVertical: m(7),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  purposeChipText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },

  // Bio Card
  bioCard: {
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    padding: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bioText: {
    fontSize: m(12),
    lineHeight: m(18),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
  },

  // Sticky Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: m(18),
    paddingVertical: m(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(9, 48, 48, 0.08)',
    elevation: 8,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  applyNowBtn: {
    backgroundColor: colors.lettersAndIcons,
    borderRadius: m(14),
    paddingVertical: m(13),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
  },
  applyNowBtnText: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
});
