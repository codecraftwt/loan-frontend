import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { useSelector } from 'react-redux';
import { FontFamily, colors } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper, showAlert } from '../../../Components/common';
import lenderFlowService from '../../../Services/lenderFlowService';

const AVAILABLE_SERVICES_PRESETS = [
  'Commercial Term Loan',
  'Working Capital Line',
  'SME Business Loan',
  'Equipment & Machinery Finance',
  'Invoice Discounting',
  'Syndicated Facility',
  'Supply Chain Financing',
  'Bridge Loan',
  'Loan Against Property (LAP)',
  'Unsecured Business Credit',
  'Structured Trade Debt',
];

const TAT_PRESETS = [
  '24-48 Hours',
  'Same Day Disbursal',
  '1-3 Business Days',
  '3-5 Business Days',
  'Instant In-Principle',
];

const TICKET_SIZE_PRESETS = [
  { label: '₹5 Lakh', val: 500000 },
  { label: '₹25 Lakh', val: 2500000 },
  { label: '₹1 Crore', val: 10000000 },
  { label: '₹5 Crore', val: 50000000 },
  { label: '₹10 Crore', val: 100000000 },
  { label: '₹25 Crore', val: 250000000 },
  { label: '₹50 Crore', val: 500000000 },
];

export default function LenderEditProfileScreen() {
  const navigation = useNavigation();
  const authUser = useSelector((state) => state.auth.user);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    userName: '',
    companyName: '',
    licenseNumber: '',
    email: '',
    mobileNo: '',
    minInterestRate: '9.5',
    maxInterestRate: '14.0',
    servicesOffered: [
      'Commercial Term Loan',
      'Working Capital Line',
      'SME Business Loan',
      'Equipment & Machinery Finance',
    ],
    experienceYears: '5',
    bio: '',
    minLoanAmount: '500000',
    maxLoanAmount: '100000000',
    turnaroundTime: '24-48 Hours',
  });

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await lenderFlowService.getProfile();
      if (res?.success && res.lender) {
        const l = res.lender;
        const lp = l.lenderProfile || {};

        setProfile({
          userName: l.userName || authUser?.userName || '',
          companyName: l.companyName || authUser?.companyName || '',
          licenseNumber: l.licenseNumber || lp.licenseNumber || 'NBFC-CORP-984210',
          email: l.email || authUser?.email || '',
          mobileNo: l.mobileNo || authUser?.mobileNo || '',
          minInterestRate: String(lp.minInterestRate || 9.5),
          maxInterestRate: String(lp.maxInterestRate || 14.0),
          servicesOffered: Array.isArray(lp.servicesOffered) && lp.servicesOffered.length > 0
            ? lp.servicesOffered
            : [
                'Commercial Term Loan',
                'Working Capital Line',
                'SME Business Loan',
                'Equipment & Machinery Finance',
              ],
          experienceYears: String(lp.experienceYears || 5),
          bio: lp.bio || '',
          minLoanAmount: String(lp.minLoanAmount || 500000),
          maxLoanAmount: String(lp.maxLoanAmount || 100000000),
          turnaroundTime: lp.turnaroundTime || '24-48 Hours',
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const toggleService = (svc) => {
    const current = [...profile.servicesOffered];
    const idx = current.indexOf(svc);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(svc);
    }
    setProfile({ ...profile, servicesOffered: current });
  };

  const handleSave = async () => {
    if (!profile.companyName.trim()) {
      showAlert('Required', 'Please enter your institution legal name.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        companyName: profile.companyName.trim(),
        userName: profile.userName.trim(),
        email: profile.email.trim(),
        mobileNo: profile.mobileNo.trim(),
        licenseNumber: profile.licenseNumber.trim(),
        minInterestRate: Number(profile.minInterestRate) || 9.5,
        maxInterestRate: Number(profile.maxInterestRate) || 14.0,
        servicesOffered: profile.servicesOffered,
        experienceYears: Number(profile.experienceYears) || 5,
        bio: profile.bio.trim(),
        minLoanAmount: Number(profile.minLoanAmount) || 500000,
        maxLoanAmount: Number(profile.maxLoanAmount) || 100000000,
        turnaroundTime: profile.turnaroundTime,
      };

      const res = await lenderFlowService.updateProfile(payload);
      if (res?.success) {
        showAlert('Profile Saved ✨', 'Institutional profile and lending criteria have been updated.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        showAlert('Update Failed', res?.message || 'Unable to update profile.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save changes.';
      showAlert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const formatINR = (val) => {
    if (!val || isNaN(val)) return '₹0';
    const num = Number(val);
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
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
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={colors.lettersAndIcons} />
          <Text style={styles.loaderText}>Loading institutional parameters...</Text>
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
      {/* ── 1. Top Green Header Bar ── */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={m(18)} color={colors.lettersAndIcons} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTag}>INSTITUTIONAL SETTINGS</Text>
          <Text style={styles.headerTitle}>Edit Profile & Criteria</Text>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={styles.saveHeaderBtn}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Feather name="check" size={m(17)} color={colors.white} />
          )}
        </TouchableOpacity>
      </View>

      {/* ── 2. Curved Main Body Section ── */}
      <View style={styles.sheetSection}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Card 1: Legal Entity Information */}
          <View style={styles.formCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardIconCircle}>
                <Feather name="briefcase" size={m(14)} color={colors.white} />
              </View>
              <Text style={styles.cardHeaderTitle}>Legal Institution Information</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Company / NBFC Legal Name *</Text>
              <TextInput
                style={styles.inputField}
                value={profile.companyName}
                onChangeText={(t) => setProfile({ ...profile, companyName: t })}
                placeholder="e.g. Apex Industrial Credit Ltd."
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Authorized Signatory Name *</Text>
              <TextInput
                style={styles.inputField}
                value={profile.userName}
                onChangeText={(t) => setProfile({ ...profile, userName: t })}
                placeholder="Principal Officer Name"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Institutional Email *</Text>
              <TextInput
                style={styles.inputField}
                value={profile.email}
                onChangeText={(t) => setProfile({ ...profile, email: t })}
                placeholder="operations@lender.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Direct Contact Mobile *</Text>
              <TextInput
                style={styles.inputField}
                value={profile.mobileNo}
                onChangeText={(t) => setProfile({ ...profile, mobileNo: t })}
                placeholder="10-digit mobile number"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>RBI NBFC Registration Number</Text>
              <TextInput
                style={styles.inputField}
                value={profile.licenseNumber}
                onChangeText={(t) => setProfile({ ...profile, licenseNumber: t })}
                placeholder="NBFC Registration ID"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Institutional Lending Thesis & Bio</Text>
              <TextInput
                style={[styles.inputField, { height: m(70), textAlignVertical: 'top' }]}
                value={profile.bio}
                onChangeText={(t) => setProfile({ ...profile, bio: t })}
                placeholder="Brief summary of lending capacity and sectors serviced..."
                placeholderTextColor={colors.textMuted}
                multiline
              />
            </View>
          </View>

          {/* Card 2: Lending Ticket & Criteria Presets */}
          <View style={styles.formCard}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardIconCircle, { backgroundColor: colors.oceanBlueButton }]}>
                <Feather name="sliders" size={m(14)} color={colors.white} />
              </View>
              <Text style={styles.cardHeaderTitle}>Lending Ticket & Service Presets</Text>
            </View>

            {/* Min & Max Ticket Sizes */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: m(8) }]}>
                <Text style={styles.inputLabel}>Min Ticket Size (₹)</Text>
                <TextInput
                  style={styles.inputField}
                  value={profile.minLoanAmount}
                  onChangeText={(t) => setProfile({ ...profile, minLoanAmount: t })}
                  placeholder="500000"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
                <Text style={styles.helperText}>{formatINR(profile.minLoanAmount)}</Text>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Max Ticket Size (₹)</Text>
                <TextInput
                  style={styles.inputField}
                  value={profile.maxLoanAmount}
                  onChangeText={(t) => setProfile({ ...profile, maxLoanAmount: t })}
                  placeholder="100000000"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
                <Text style={styles.helperText}>{formatINR(profile.maxLoanAmount)}</Text>
              </View>
            </View>

            {/* Quick Max Cap Presets */}
            <Text style={styles.subInputLabel}>Quick Max Cap Presets</Text>
            <View style={styles.chipWrap}>
              {TICKET_SIZE_PRESETS.map((t) => (
                <TouchableOpacity
                  key={t.val}
                  style={[
                    styles.chip,
                    Number(profile.maxLoanAmount) === t.val && styles.chipActive,
                  ]}
                  onPress={() => setProfile({ ...profile, maxLoanAmount: String(t.val) })}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.chipText,
                      Number(profile.maxLoanAmount) === t.val && styles.chipTextActive,
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Interest Rates */}
            <View style={[styles.rowInputs, { marginTop: m(10) }]}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: m(8) }]}>
                <Text style={styles.inputLabel}>Min Rate (% p.a.)</Text>
                <TextInput
                  style={styles.inputField}
                  value={profile.minInterestRate}
                  onChangeText={(t) => setProfile({ ...profile, minInterestRate: t })}
                  placeholder="9.5"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Max Rate (% p.a.)</Text>
                <TextInput
                  style={styles.inputField}
                  value={profile.maxInterestRate}
                  onChangeText={(t) => setProfile({ ...profile, maxInterestRate: t })}
                  placeholder="14.0"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Turnaround Time Presets */}
            <Text style={styles.subInputLabel}>Disbursal Turnaround (TAT)</Text>
            <View style={styles.chipWrap}>
              {TAT_PRESETS.map((tat) => (
                <TouchableOpacity
                  key={tat}
                  style={[
                    styles.chip,
                    profile.turnaroundTime === tat && styles.chipActive,
                  ]}
                  onPress={() => setProfile({ ...profile, turnaroundTime: tat })}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.chipText,
                      profile.turnaroundTime === tat && styles.chipTextActive,
                    ]}
                  >
                    {tat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Experience Years */}
            <View style={[styles.inputGroup, { marginTop: m(10) }]}>
              <Text style={styles.inputLabel}>Lending Experience (Years)</Text>
              <TextInput
                style={styles.inputField}
                value={profile.experienceYears}
                onChangeText={(t) => setProfile({ ...profile, experienceYears: t })}
                placeholder="5"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>

            {/* Services Offered Toggle Chips */}
            <Text style={styles.subInputLabel}>Products & Facilities Offered</Text>
            <View style={styles.chipWrap}>
              {AVAILABLE_SERVICES_PRESETS.map((svc) => {
                const isSelected = profile.servicesOffered.includes(svc);
                return (
                  <TouchableOpacity
                    key={svc}
                    style={[styles.serviceChip, isSelected && styles.serviceChipActive]}
                    onPress={() => toggleService(svc)}
                    activeOpacity={0.8}
                  >
                    <Feather
                      name={isSelected ? 'check' : 'plus'}
                      size={m(12)}
                      color={isSelected ? colors.white : colors.textSecondary}
                      style={{ marginRight: m(4) }}
                    />
                    <Text
                      style={[
                        styles.serviceChipText,
                        isSelected && styles.serviceChipTextActive,
                      ]}
                    >
                      {svc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.saveSubmitBtn}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Feather name="check-circle" size={m(16)} color={colors.white} style={{ marginRight: m(6) }} />
                <Text style={styles.saveSubmitText}>Save Profile Credentials</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loaderCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
    marginTop: m(10),
  },

  // Header Bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: m(16),
    paddingTop: m(10),
    paddingBottom: m(14),
    backgroundColor: colors.primary,
  },
  backBtn: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: m(10),
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
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  saveHeaderBtn: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    backgroundColor: colors.oceanBlueButton,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },

  // Curved Sheet
  sheetSection: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(28),
    borderTopRightRadius: m(28),
    paddingTop: m(14),
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: m(16),
    paddingBottom: m(40),
  },

  // Form Card
  formCard: {
    backgroundColor: colors.white,
    borderRadius: m(18),
    padding: m(16),
    marginBottom: m(14),
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
    marginBottom: m(14),
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
  cardHeaderTitle: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  inputGroup: {
    marginBottom: m(12),
  },
  rowInputs: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(5),
  },
  subInputLabel: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginTop: m(6),
    marginBottom: m(6),
  },
  inputField: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: m(12),
    paddingHorizontal: m(12),
    paddingVertical: m(9),
    fontSize: m(13),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  helperText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.oceanBlueButton,
    marginTop: m(2),
  },

  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(6),
    marginBottom: m(8),
  },
  chip: {
    paddingHorizontal: m(11),
    paddingVertical: m(6),
    borderRadius: m(14),
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: colors.lettersAndIcons,
    borderColor: colors.lettersAndIcons,
  },
  chipText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.white,
    fontFamily: FontFamily.primaryBold,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    borderRadius: m(14),
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  serviceChipActive: {
    backgroundColor: colors.oceanBlueButton,
    borderColor: colors.oceanBlueButton,
  },
  serviceChipText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
  },
  serviceChipTextActive: {
    color: colors.white,
    fontFamily: FontFamily.primaryBold,
  },

  saveSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.oceanBlueButton,
    borderRadius: m(14),
    paddingVertical: m(13),
    marginBottom: m(20),
    elevation: 3,
  },
  saveSubmitText: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
});
