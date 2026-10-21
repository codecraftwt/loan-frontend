import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { colors, FontFamily } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper } from '../../../Components/common';
import borrowerFlowService from '../../../Services/borrowerFlowService';

const BUSINESS_TYPES = [
  'Private Limited Company',
  'Limited Liability Partnership (LLP)',
  'Sole Proprietorship',
  'Partnership Firm',
  'Public Limited',
];

const EMPLOYMENT_TYPES = [
  'Business Owner / Self-Employed',
  'Corporate Executive',
  'Salaried Professional',
  'Partner / Director',
];

export default function BorrowerEditProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const initialSection = route.params?.section || 'all';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(initialSection === 'all' ? 'kyc' : initialSection);

  const [profile, setProfile] = useState({
    userName: '',
    email: '',
    mobileNo: '',
    altMobileNo: '',
    panCardNumber: '',
    aadharCardNo: '',
    address: '',
    city: '',
    taluka: '',
    district: '',
    state: 'Maharashtra',
    pincode: '',
    companyName: '',
    businessType: 'Private Limited Company',
    employmentType: 'Business Owner / Self-Employed',
    annualRevenue: '',
    monthlyIncome: '',
    creditScore: '750',
    gstNumber: '',
    yearsInBusiness: '3',
  });

  const [digilockerKyc, setDigilockerKyc] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await borrowerFlowService.getProfile();
      if (res?.success && res.borrower) {
        const b = res.borrower;
        const bp = b.borrowerProfile || {};
        setDigilockerKyc(b.digilockerKyc || null);

        setProfile({
          userName: b.userName || '',
          email: b.email || '',
          mobileNo: b.mobileNo || '',
          altMobileNo: b.altMobileNo || '',
          panCardNumber: b.panCardNumber || '',
          aadharCardNo: b.aadharCardNo || '',
          address: b.address || '',
          city: b.city || '',
          taluka: b.taluka || '',
          district: b.district || '',
          state: b.state || 'Maharashtra',
          pincode: b.pincode || '',
          companyName: b.companyName || bp.businessName || '',
          businessType: bp.businessType || 'Private Limited Company',
          employmentType: bp.employmentType || 'Business Owner / Self-Employed',
          annualRevenue: bp.annualRevenue ? String(bp.annualRevenue) : '',
          monthlyIncome: bp.monthlyIncome ? String(bp.monthlyIncome) : '',
          creditScore: bp.creditScore ? String(bp.creditScore) : '750',
          gstNumber: bp.gstNumber || '',
          yearsInBusiness: bp.yearsInBusiness ? String(bp.yearsInBusiness) : '3',
        });
      }
    } catch (err) {
      console.error('Error fetching borrower profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        userName: profile.userName,
        altMobileNo: profile.altMobileNo,
        panCardNumber: profile.panCardNumber,
        aadharCardNo: profile.aadharCardNo,
        address: profile.address,
        city: profile.city,
        taluka: profile.taluka,
        district: profile.district,
        state: profile.state,
        pincode: profile.pincode,
        companyName: profile.companyName,
        businessName: profile.companyName,
        businessType: profile.businessType,
        employmentType: profile.employmentType,
        annualRevenue: Number(profile.annualRevenue) || 0,
        monthlyIncome: Number(profile.monthlyIncome) || 0,
        creditScore: Number(profile.creditScore) || 750,
        gstNumber: profile.gstNumber,
        yearsInBusiness: Number(profile.yearsInBusiness) || 3,
      };

      const res = await borrowerFlowService.updateProfile(payload);
      if (res?.success) {
        Alert.alert(
          'Profile Saved',
          'Your corporate details have been successfully synchronized.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update details.';
      Alert.alert('Save Error', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenWrapper
      backgroundColor={colors.backgroundGreenWhite}
      topInsetBg={colors.primary}
      statusBarColor={colors.primary}
      statusBarStyle="dark-content"
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
            <Feather name="arrow-left" size={m(20)} color={colors.white} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTag}>CREDENTIAL DOSSIER</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {activeTab === 'kyc'
                ? 'Statutory KYC'
                : activeTab === 'entity'
                ? 'Corporate Entity'
                : 'Registered Office'}
            </Text>
          </View>

          <View style={{ width: m(38) }} />
        </View>

        {/* Section Tabs */}
        <View style={styles.capsuleTabsRow}>
          <TouchableOpacity
            style={[styles.tabCapsule, activeTab === 'kyc' && styles.tabCapsuleActive]}
            onPress={() => setActiveTab('kyc')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabCapsuleText, activeTab === 'kyc' && styles.tabCapsuleTextActive]}>
              Statutory KYC
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabCapsule, activeTab === 'entity' && styles.tabCapsuleActive]}
            onPress={() => setActiveTab('entity')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabCapsuleText, activeTab === 'entity' && styles.tabCapsuleTextActive]}>
              Entity Info
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabCapsule, activeTab === 'address' && styles.tabCapsuleActive]}
            onPress={() => setActiveTab('address')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabCapsuleText, activeTab === 'address' && styles.tabCapsuleTextActive]}>
              Address
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Curved Body Section */}
      <View style={styles.sheetSection}>
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={colors.lettersAndIcons} />
            <Text style={styles.loadingText}>Loading information...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ─── TAB 1: Statutory KYC ─── */}
            {activeTab === 'kyc' && (
              <>
                <View style={styles.statutoryGrid}>
                  {/* PAN Card */}
                  <View style={styles.statutoryCard}>
                    <View style={styles.statutoryHeader}>
                      <View style={styles.statutoryIconBox}>
                        <Feather name="file-text" size={m(16)} color={colors.lettersAndIcons} />
                      </View>
                      <View style={styles.statutoryBadgeSuccess}>
                        <Feather name="check" size={m(10)} color="#059669" />
                        <Text style={styles.statutoryBadgeSuccessText}>NSDL VERIFIED</Text>
                      </View>
                    </View>
                    <Text style={styles.statutoryLabel}>Permanent Account No.</Text>
                    <Text style={styles.statutoryValue}>
                      {profile.panCardNumber ? profile.panCardNumber.toUpperCase() : 'NOT PROVIDED'}
                    </Text>
                    <Text style={styles.statutorySub}>Direct Tax Department matched</Text>
                  </View>

                  {/* Aadhaar DigiLocker */}
                  <View style={styles.statutoryCard}>
                    <View style={styles.statutoryHeader}>
                      <View style={styles.statutoryIconBox}>
                        <Feather name="shield" size={m(16)} color={colors.lettersAndIcons} />
                      </View>
                      <View
                        style={
                          digilockerKyc?.isAadhaarVerified || profile.aadharCardNo
                            ? styles.statutoryBadgeSuccess
                            : styles.statutoryBadgePending
                        }
                      >
                        <Feather
                          name={
                            digilockerKyc?.isAadhaarVerified || profile.aadharCardNo
                              ? 'check'
                              : 'clock'
                          }
                          size={m(10)}
                          color={
                            digilockerKyc?.isAadhaarVerified || profile.aadharCardNo
                              ? '#059669'
                              : '#D97706'
                          }
                        />
                        <Text
                          style={
                            digilockerKyc?.isAadhaarVerified || profile.aadharCardNo
                              ? styles.statutoryBadgeSuccessText
                              : styles.statutoryBadgePendingText
                          }
                        >
                          {digilockerKyc?.isAadhaarVerified || profile.aadharCardNo
                            ? 'DIGILOCKER SYNC'
                            : 'PENDING'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.statutoryLabel}>Aadhaar UIDAI (12-Digit)</Text>
                    <Text style={styles.statutoryValue}>
                      {profile.aadharCardNo
                        ? `•••• •••• ${profile.aadharCardNo.slice(-4)}`
                        : 'NOT LINKED'}
                    </Text>
                    <Text style={styles.statutorySub}>e-KYC verified with OTP</Text>
                  </View>

                  {/* GSTIN Filing Status */}
                  <View style={styles.statutoryCard}>
                    <View style={styles.statutoryHeader}>
                      <View style={styles.statutoryIconBox}>
                        <Feather name="activity" size={m(16)} color={colors.lettersAndIcons} />
                      </View>
                      <View
                        style={
                          profile.gstNumber
                            ? styles.statutoryBadgeSuccess
                            : styles.statutoryBadgePending
                        }
                      >
                        <Feather
                          name={profile.gstNumber ? 'check' : 'minus'}
                          size={m(10)}
                          color={profile.gstNumber ? '#059669' : '#64748B'}
                        />
                        <Text
                          style={
                            profile.gstNumber
                              ? styles.statutoryBadgeSuccessText
                              : styles.statutoryBadgeNeutralText
                          }
                        >
                          {profile.gstNumber ? 'GSTR COMPLIANT' : 'OPTIONAL'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.statutoryLabel}>Goods & Services Tax (GSTIN)</Text>
                    <Text style={styles.statutoryValue}>
                      {profile.gstNumber ? profile.gstNumber.toUpperCase() : 'UNREGISTERED'}
                    </Text>
                    <Text style={styles.statutorySub}>Monthly 3B/GSTR-1 status active</Text>
                  </View>

                  {/* Bank Mandate */}
                  <View style={styles.statutoryCard}>
                    <View style={styles.statutoryHeader}>
                      <View style={styles.statutoryIconBox}>
                        <Feather name="credit-card" size={m(16)} color={colors.lettersAndIcons} />
                      </View>
                      <View style={styles.statutoryBadgeSuccess}>
                        <Feather name="check" size={m(10)} color="#059669" />
                        <Text style={styles.statutoryBadgeSuccessText}>NPCI MANDATE</Text>
                      </View>
                    </View>
                    <Text style={styles.statutoryLabel}>e-NACH Auto-Debit</Text>
                    <Text style={styles.statutoryValue}>ACTIVE MANDATE</Text>
                    <Text style={styles.statutorySub}>Scheduled EMI debits authorized</Text>
                  </View>
                </View>

                {/* Authorized Signatory Details */}
                <View style={styles.cardContainer}>
                  <View style={styles.cardHeader}>
                    <Feather name="user-check" size={m(16)} color={colors.lettersAndIcons} />
                    <Text style={styles.cardTitle}>Authorized Signatory Information</Text>
                  </View>

                  <View style={styles.fieldWrap}>
                    <Text style={styles.inputLabel}>FULL LEGAL NAME (AS PER PAN)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={profile.userName}
                      onChangeText={t => setProfile({ ...profile, userName: t })}
                      placeholder="Authorized Person Name"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View style={styles.twoColumnRow}>
                    <View style={[styles.fieldWrap, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>REGISTERED MOBILE (LOCKED)</Text>
                      <TextInput
                        style={[styles.textInput, styles.lockedInput]}
                        value={profile.mobileNo}
                        editable={false}
                      />
                    </View>
                    <View style={[styles.fieldWrap, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>ALT MOBILE</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="phone-pad"
                        value={profile.altMobileNo}
                        onChangeText={t => setProfile({ ...profile, altMobileNo: t })}
                        placeholder="Alternate Contact"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  </View>

                  <View style={styles.fieldWrap}>
                    <Text style={styles.inputLabel}>OFFICIAL EMAIL (LOCKED)</Text>
                    <TextInput
                      style={[styles.textInput, styles.lockedInput]}
                      value={profile.email}
                      editable={false}
                    />
                  </View>

                  <View style={styles.twoColumnRow}>
                    <View style={[styles.fieldWrap, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>PAN NUMBER</Text>
                      <TextInput
                        style={[styles.textInput, { textTransform: 'uppercase' }]}
                        autoCapitalize="characters"
                        value={profile.panCardNumber}
                        onChangeText={t => setProfile({ ...profile, panCardNumber: t.toUpperCase() })}
                        placeholder="ABCDE1234F"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                    <View style={[styles.fieldWrap, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>AADHAAR NUMBER</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        value={profile.aadharCardNo}
                        onChangeText={t => setProfile({ ...profile, aadharCardNo: t })}
                        placeholder="12-digit UID"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  </View>
                </View>
              </>
            )}

            {/* ─── TAB 2: Entity Info ─── */}
            {activeTab === 'entity' && (
              <View style={styles.cardContainer}>
                <View style={styles.cardHeader}>
                  <Feather name="layers" size={m(16)} color={colors.lettersAndIcons} />
                  <Text style={styles.cardTitle}>Commercial Entity & Constitution</Text>
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={styles.inputLabel}>ENTERPRISE LEGAL NAME</Text>
                  <TextInput
                    style={styles.textInput}
                    value={profile.companyName}
                    onChangeText={t => setProfile({ ...profile, companyName: t })}
                    placeholder="e.g. Apex Precision Engineering Pvt Ltd"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={styles.inputLabel}>ENTITY CONSTITUTION</Text>
                  <View style={styles.chipsWrap}>
                    {BUSINESS_TYPES.map(bt => {
                      const isSelected = profile.businessType === bt;
                      return (
                        <TouchableOpacity
                          key={bt}
                          style={[styles.chip, isSelected && styles.chipActive]}
                          onPress={() => setProfile({ ...profile, businessType: bt })}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                            {bt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={styles.inputLabel}>BUSINESS PROFILE / VERTICAL</Text>
                  <View style={styles.chipsWrap}>
                    {EMPLOYMENT_TYPES.map(et => {
                      const isSelected = profile.employmentType === et;
                      return (
                        <TouchableOpacity
                          key={et}
                          style={[styles.chip, isSelected && styles.chipActive]}
                          onPress={() => setProfile({ ...profile, employmentType: et })}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                            {et}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.twoColumnRow}>
                  <View style={[styles.fieldWrap, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>VINTAGE (YEARS)</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={profile.yearsInBusiness}
                      onChangeText={t => setProfile({ ...profile, yearsInBusiness: t })}
                      placeholder="3"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  <View style={[styles.fieldWrap, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>CIBIL / COMMERCIAL SCORE</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={profile.creditScore}
                      onChangeText={t => setProfile({ ...profile, creditScore: t })}
                      placeholder="750"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                <View style={styles.twoColumnRow}>
                  <View style={[styles.fieldWrap, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>ANNUAL TURNOVER (₹)</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={profile.annualRevenue}
                      onChangeText={t => setProfile({ ...profile, annualRevenue: t })}
                      placeholder="e.g. 5000000"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  <View style={[styles.fieldWrap, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>MONTHLY INFLOW (₹)</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={profile.monthlyIncome}
                      onChangeText={t => setProfile({ ...profile, monthlyIncome: t })}
                      placeholder="e.g. 350000"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={styles.inputLabel}>GSTIN (OPTIONAL)</Text>
                  <TextInput
                    style={[styles.textInput, { textTransform: 'uppercase' }]}
                    autoCapitalize="characters"
                    value={profile.gstNumber}
                    onChangeText={t => setProfile({ ...profile, gstNumber: t.toUpperCase() })}
                    placeholder="27AAAAA0000A1Z5"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>
            )}

            {/* ─── TAB 3: Address ─── */}
            {activeTab === 'address' && (
              <View style={styles.cardContainer}>
                <View style={styles.cardHeader}>
                  <Feather name="map-pin" size={m(16)} color={colors.lettersAndIcons} />
                  <Text style={styles.cardTitle}>Registered Office Premise</Text>
                </View>

                <View style={styles.fieldWrap}>
                  <Text style={styles.inputLabel}>STREET ADDRESS / BUILDING / UNIT</Text>
                  <TextInput
                    style={styles.textInput}
                    value={profile.address}
                    onChangeText={t => setProfile({ ...profile, address: t })}
                    placeholder="Unit No., Commercial Tower, Industrial Area"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={styles.twoColumnRow}>
                  <View style={[styles.fieldWrap, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>CITY / TOWN</Text>
                    <TextInput
                      style={styles.textInput}
                      value={profile.city}
                      onChangeText={t => setProfile({ ...profile, city: t })}
                      placeholder="Mumbai"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  <View style={[styles.fieldWrap, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>DISTRICT</Text>
                    <TextInput
                      style={styles.textInput}
                      value={profile.district}
                      onChangeText={t => setProfile({ ...profile, district: t })}
                      placeholder="Mumbai City"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>

                <View style={styles.twoColumnRow}>
                  <View style={[styles.fieldWrap, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>STATE</Text>
                    <TextInput
                      style={styles.textInput}
                      value={profile.state}
                      onChangeText={t => setProfile({ ...profile, state: t })}
                      placeholder="Maharashtra"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  <View style={[styles.fieldWrap, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>PINCODE</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={profile.pincode}
                      onChangeText={t => setProfile({ ...profile, pincode: t })}
                      placeholder="400001"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.btnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <>
                  <Feather name="check" size={m(16)} color={colors.white} />
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={{ height: m(40) }} />
          </ScrollView>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  topBanner: {
    backgroundColor: colors.primary,
    paddingHorizontal: m(16),
    paddingTop: m(8),
    paddingBottom: m(16),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(12),
  },
  backCircularBtn: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    backgroundColor: 'rgba(9, 48, 48, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: m(12),
  },
  headerTag: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: m(18),
    fontFamily: FontFamily.primaryExtraBold,
    color: colors.lettersAndIcons,
  },
  capsuleTabsRow: {
    flexDirection: 'row',
    gap: m(8),
  },
  tabCapsule: {
    flex: 1,
    paddingVertical: m(7),
    borderRadius: m(20),
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabCapsuleActive: {
    backgroundColor: colors.lettersAndIcons,
  },
  tabCapsuleText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  tabCapsuleTextActive: {
    color: colors.white,
    fontFamily: FontFamily.primaryBold,
  },
  sheetSection: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(26),
    borderTopRightRadius: m(26),
    marginTop: -m(8),
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: m(16),
    paddingBottom: m(60),
    gap: m(14),
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(10),
  },
  loadingText: {
    fontSize: m(13),
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
  },

  // Statutory Checklist Grid (Neutral #F8FAFC)
  statutoryGrid: {
    gap: m(10),
  },
  statutoryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: m(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: m(12),
  },
  statutoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(8),
  },
  statutoryIconBox: {
    width: m(32),
    height: m(32),
    borderRadius: m(8),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statutoryBadgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: '#DCFCE7',
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(6),
  },
  statutoryBadgeSuccessText: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: '#166534',
  },
  statutoryBadgePending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: '#FEF3C7',
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(6),
  },
  statutoryBadgePendingText: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: '#92400E',
  },
  statutoryBadgeNeutralText: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: '#64748B',
  },
  statutoryLabel: {
    fontSize: m(10),
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statutoryValue: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginTop: m(2),
  },
  statutorySub: {
    fontSize: m(11),
    fontFamily: FontFamily.bodyRegular,
    color: '#94A3B8',
    marginTop: m(3),
  },

  // Generic Card Containers
  cardContainer: {
    backgroundColor: colors.white,
    borderRadius: m(18),
    padding: m(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: m(12),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    paddingBottom: m(8),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardTitle: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  // Form Fields
  fieldWrap: {
    gap: m(6),
  },
  inputLabel: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: '#64748B',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: m(12),
    paddingVertical: m(10),
    fontSize: m(13),
    fontFamily: FontFamily.bodyRegular,
    color: colors.lettersAndIcons,
  },
  lockedInput: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: m(10),
  },

  // Chips
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(6),
  },
  chip: {
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    borderRadius: m(8),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: colors.lettersAndIcons,
    borderColor: colors.lettersAndIcons,
  },
  chipText: {
    fontSize: m(11),
    fontFamily: FontFamily.bodyMedium,
    color: '#475569',
  },
  chipTextActive: {
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },

  // Action Button
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lettersAndIcons,
    borderRadius: m(16),
    paddingVertical: m(14),
    gap: m(8),
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
});
