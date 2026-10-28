import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { colors, FontFamily } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper } from '../../../Components/common';

/**
 * Format currency
 */
const formatCurrency = value => {
  if (!value) return '₹0';
  const num = Number(value) || 0;
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

/**
 * Format date
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
  <View style={styles.specRow}>
    <View style={styles.specRowLeft}>
      {icon && (
        <View style={styles.specIconBox}>
          <Feather name={icon} size={m(14)} color={iconColor} />
        </View>
      )}
      <Text style={styles.specLabel}>{label}</Text>
    </View>
    <Text style={styles.specValue}>{value || 'N/A'}</Text>
  </View>
);

export default function PlanDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { plan } = route.params || {};

  const handleEditPlan = useCallback(() => {
    navigation.navigate('CreateEditPlan', { plan, mode: 'edit' });
  }, [navigation, plan]);

  if (!plan) {
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
            <Feather name="chevron-left" size={m(22)} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Plan Specifications</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.emptyBox}>
          <Feather name="alert-circle" size={m(44)} color="#FF4D4F" />
          <Text style={styles.emptyTitle}>Plan Not Found</Text>
          <Text style={styles.emptySubtitle}>The specified plan could not be located.</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const durationDays =
    plan.durationDays ||
    (plan.duration === '1 year'
      ? 365
      : plan.duration === '6 months'
      ? 180
      : plan.duration === '3 months'
      ? 90
      : 30);

  const packPrice = Number(plan.price || plan.priceMonthly || 1999);
  const monthlyRate =
    plan.priceMonthly || Math.round(packPrice / (durationDays / 30)) || packPrice;
  const isActive = plan.isActive ?? true;

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
        {/* Fixed Brand Green Top Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={m(22)} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Plan Specifications</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Curved Sheet Container */}
        <View style={styles.sheetSection}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ======================================================== */}
            {/* Executive Ocean Blue Hero Plan Banner                    */}
            {/* ======================================================== */}
            <View style={styles.heroBanner}>
              <View style={styles.heroHeader}>
                <View style={styles.heroTitleArea}>
                  <View style={styles.titleBadgeRow}>
                    <Text style={styles.planTitle}>{plan.planName}</Text>
                    {plan.tag ? (
                      <View style={styles.tagBadge}>
                        <Text style={styles.tagText}>{plan.tag}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.planDurationText}>
                    {plan.duration} • {durationDays} Days Unrestricted Platform Access
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: isActive ? colors.white : '#FFF3CD' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: isActive ? '#009B72' : '#D97706' },
                    ]}
                  >
                    {isActive ? '● Published' : '● Archived'}
                  </Text>
                </View>
              </View>

              {/* Pricing Highlight Strip */}
              <View style={styles.pricingStrip}>
                <View>
                  <Text style={styles.priceSubLabel}>Pack Price</Text>
                  <Text style={styles.heroPrice}>{formatCurrency(packPrice)}</Text>
                </View>
                <View style={styles.monthlyBlock}>
                  <Text style={styles.priceSubLabel}>Effective Monthly</Text>
                  <Text style={styles.heroMonthly}>{formatCurrency(monthlyRate)}/mo</Text>
                </View>
              </View>
            </View>

            {/* ======================================================== */}
            {/* Included Capabilities                                    */}
            {/* ======================================================== */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBox, { backgroundColor: '#E6F2FF' }]}>
                  <Feather name="check-circle" size={m(15)} color={colors.oceanBlueButton} />
                </View>
                <Text style={styles.sectionTitle}>Included Capabilities</Text>
              </View>

              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <View style={styles.featureIconBox}>
                    <Feather name="check" size={m(13)} color="#00A87A" />
                  </View>
                  <View style={styles.featureTextCol}>
                    <Text style={styles.featureTitle}>Full Platform Services</Text>
                    <Text style={styles.featureDesc}>
                      Underwriting pipeline, borrower exploration, and loan agreement tools.
                    </Text>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <View style={styles.featureIconBox}>
                    <Feather name="check" size={m(13)} color="#00A87A" />
                  </View>
                  <View style={styles.featureTextCol}>
                    <Text style={styles.featureTitle}>DigiLocker KYC Credentials Access</Text>
                    <Text style={styles.featureDesc}>
                      Direct access to verified government identity dossiers.
                    </Text>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <View style={styles.featureIconBox}>
                    <Feather name="check" size={m(13)} color="#00A87A" />
                  </View>
                  <View style={styles.featureTextCol}>
                    <Text style={styles.featureTitle}>Portfolio & Deal Quota</Text>
                    <Text style={styles.featureDesc}>
                      Unlimited incoming deal evaluation and loan application tracking.
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ======================================================== */}
            {/* Technical Specifications Ledger                          */}
            {/* ======================================================== */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBox, { backgroundColor: '#F3E8FF' }]}>
                  <Feather name="layers" size={m(15)} color="#7C3AED" />
                </View>
                <Text style={styles.sectionTitle}>Technical Specifications</Text>
              </View>

              <View style={styles.specGrid}>
                <DetailRow
                  label="Duration Tier"
                  value={plan.duration || '1 month'}
                  icon="clock"
                />
                <DetailRow
                  label="Active Days"
                  value={`${durationDays} Days`}
                  icon="calendar"
                />
                <DetailRow
                  label="Created Date"
                  value={formatDate(plan.createdAt)}
                  icon="check"
                />
                <DetailRow
                  label="Last Configured"
                  value={formatDate(plan.updatedAt)}
                  icon="edit-3"
                />
              </View>
            </View>

            {/* ======================================================== */}
            {/* Configure Action Button                                  */}
            {/* ======================================================== */}
            <TouchableOpacity
              style={styles.editButton}
              activeOpacity={0.85}
              onPress={handleEditPlan}
            >
              <Text style={styles.editButtonText}>Configure Plan Specifications</Text>
            </TouchableOpacity>
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

  // Ocean Blue Hero Card
  heroBanner: {
    backgroundColor: colors.oceanBlueButton,
    borderRadius: m(22),
    padding: m(18),
    marginBottom: m(14),
    shadowColor: colors.oceanBlueButton,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroTitleArea: {
    flex: 1,
    marginRight: m(8),
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: m(6),
  },
  planTitle: {
    fontSize: m(18),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  tagBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: m(8),
    paddingVertical: m(2),
    borderRadius: m(6),
  },
  tagText: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  planDurationText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryMedium,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: m(4),
  },
  statusBadge: {
    paddingHorizontal: m(9),
    paddingVertical: m(3),
    borderRadius: m(6),
  },
  statusBadgeText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryBold,
  },
  pricingStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: m(12),
    padding: m(12),
    marginTop: m(14),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  priceSubLabel: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryMedium,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  heroPrice: {
    fontSize: m(20),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
    marginTop: m(2),
  },
  monthlyBlock: {
    alignItems: 'flex-end',
  },
  heroMonthly: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
    marginTop: m(2),
  },

  // Section Cards
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(16),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    marginBottom: m(14),
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    marginBottom: m(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: m(8),
  },
  sectionIconBox: {
    width: m(28),
    height: m(28),
    borderRadius: m(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  featureList: {
    gap: m(12),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: m(10),
  },
  featureIconBox: {
    width: m(24),
    height: m(24),
    borderRadius: m(12),
    backgroundColor: '#DFF7E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: m(1),
  },
  featureTextCol: {
    flex: 1,
  },
  featureTitle: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  featureDesc: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(2),
    lineHeight: m(16),
  },

  // Spec Grid
  specGrid: {
    gap: m(8),
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: m(3),
  },
  specRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
  },
  specIconBox: {
    width: m(24),
    height: m(24),
    borderRadius: m(6),
    backgroundColor: '#F1FFF3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  specLabel: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
  },
  specValue: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },

  // Edit Button
  editButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    height: m(50),
    borderRadius: m(25),
    marginTop: m(8),
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  editButtonText: {
    fontSize: m(14.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  emptyBox: {
    alignItems: 'center',
    paddingVertical: m(60),
    gap: m(8),
  },
  emptyTitle: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  emptySubtitle: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
  },
});
