import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { m } from 'walstar-rn-responsive';
import { colors } from '../../../constants';
import borrowerFlowService from '../../../Services/borrowerFlowService';

const BUSINESS_TYPES = [
  'Private Limited Company',
  'Sole Proprietorship',
  'Partnership Firm',
  'Limited Liability Partnership (LLP)',
  'Public Limited',
];

const EMPLOYMENT_TYPES = [
  'Business Owner / Self-Employed',
  'Corporate Executive',
  'Salaried Professional',
  'Partner / Director',
];

export default function BorrowerProfileScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('all'); // 'all' | 'personal' | 'business' | 'address'

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
  const [completion, setCompletion] = useState({
    percentage: 100,
    isComplete: true,
    missingFields: [],
  });

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

        if (res.profileCompletion) {
          setCompletion(res.profileCompletion);
        }
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

  // Local live completion calculation
  const computedCompletion = useMemo(() => {
    const checks = [
      { name: 'Full Name', valid: Boolean(profile.userName?.trim()) },
      { name: 'Email Address', valid: Boolean(profile.email?.trim()) },
      { name: 'Primary Mobile', valid: Boolean(profile.mobileNo?.trim()) },
      { name: 'Alternative Mobile', valid: Boolean(profile.altMobileNo?.trim()) },
      { name: 'PAN Card', valid: Boolean(profile.panCardNumber?.trim()) },
      { name: 'Aadhaar Card', valid: Boolean(profile.aadharCardNo?.trim()) },
      { name: 'Address', valid: Boolean(profile.address?.trim()) },
      { name: 'City', valid: Boolean(profile.city?.trim()) },
      { name: 'District', valid: Boolean(profile.district?.trim()) },
      { name: 'State', valid: Boolean(profile.state?.trim()) },
      { name: 'Pincode', valid: Boolean(profile.pincode?.trim()) },
      { name: 'Company Name', valid: Boolean(profile.companyName?.trim()) },
      { name: 'Annual Turnover', valid: Boolean(Number(profile.annualRevenue) > 0) },
      { name: 'Monthly Income', valid: Boolean(Number(profile.monthlyIncome) > 0) },
      { name: 'Credit Score', valid: Boolean(Number(profile.creditScore) >= 300) },
    ];
    const done = checks.filter((c) => c.valid).length;
    const pct = Math.round((done / checks.length) * 100);
    const missing = checks.filter((c) => !c.valid).map((c) => c.name);
    return { percentage: pct, isComplete: pct === 100, missingFields: missing };
  }, [profile]);

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
          'Profile Saved!',
          `Your borrower profile is now ${res.profileCompletion?.percentage || computedCompletion.percentage}% complete.`
        );
        if (res.profileCompletion) {
          setCompletion(res.profileCompletion);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile details.';
      Alert.alert('Save Error', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backIcon} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={m(22)} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Borrower Profile & KYC</Text>
        <TouchableOpacity
          style={styles.securityShortcut}
          onPress={() => navigation.navigate('BorrowerSecurityScreen')}
        >
          <Feather name="lock" size={m(18)} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Profile Completion Meter Card */}
          <View style={styles.meterCard}>
            <View style={styles.meterHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.meterTag}>PROFILE COMPLETION</Text>
                <Text style={styles.meterPctText}>{computedCompletion.percentage}% Complete</Text>
              </View>
              {digilockerKyc?.isAadhaarVerified ? (
                <View style={styles.kycVerifiedBadge}>
                  <Feather name="shield" size={m(12)} color="#16A34A" />
                  <Text style={styles.kycVerifiedText}>DigiLocker Verified</Text>
                </View>
              ) : (
                <View style={styles.kycPendingBadge}>
                  <Feather name="info" size={m(12)} color="#D97706" />
                  <Text style={styles.kycPendingText}>Self-Declared</Text>
                </View>
              )}
            </View>

            <View style={styles.meterTrack}>
              <View style={[styles.meterFill, { width: `${computedCompletion.percentage}%` }]} />
            </View>

            {computedCompletion.missingFields.length > 0 ? (
              <View style={styles.missingBox}>
                <Text style={styles.missingLabel}>Pending Verification:</Text>
                <Text style={styles.missingText}>
                  {computedCompletion.missingFields.slice(0, 4).join(', ')}
                  {computedCompletion.missingFields.length > 4 ? ` +${computedCompletion.missingFields.length - 4} more` : ''}
                </Text>
              </View>
            ) : (
              <Text style={styles.completeNotice}>
                100% verified. You are fully eligible to apply for institutional financing.
              </Text>
            )}
          </View>

          {/* Section 1: Personal & Statutory KYC */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Feather name="user" size={m(16)} color="#2563EB" />
              <Text style={styles.sectionTitle}>Personal & Statutory KYC</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Full Legal Name</Text>
              <TextInput
                style={styles.textInput}
                value={profile.userName}
                onChangeText={(t) => setProfile({ ...profile, userName: t })}
                placeholder="Authorized Signatory Name"
              />
            </View>

            <View style={styles.rowTwo}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Primary Mobile (Registered)</Text>
                <TextInput
                  style={[styles.textInput, styles.readOnlyInput]}
                  value={profile.mobileNo}
                  editable={false}
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Alt Mobile</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="phone-pad"
                  value={profile.altMobileNo}
                  onChangeText={(t) => setProfile({ ...profile, altMobileNo: t })}
                  placeholder="Optional alternate"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[styles.textInput, styles.readOnlyInput]}
                value={profile.email}
                editable={false}
              />
            </View>

            <View style={styles.rowTwo}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>PAN Card Number</Text>
                <TextInput
                  style={[styles.textInput, { textTransform: 'uppercase' }]}
                  autoCapitalize="characters"
                  value={profile.panCardNumber}
                  onChangeText={(t) => setProfile({ ...profile, panCardNumber: t.toUpperCase() })}
                  placeholder="ABCDE1234F"
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Aadhaar Number</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={profile.aadharCardNo}
                  onChangeText={(t) => setProfile({ ...profile, aadharCardNo: t })}
                  placeholder="12-digit UID"
                />
              </View>
            </View>
          </View>

          {/* Section 2: Commercial & Business Profile */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Feather name="briefcase" size={m(16)} color="#2563EB" />
              <Text style={styles.sectionTitle}>Commercial & Business Entity</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Company / Trade Name</Text>
              <TextInput
                style={styles.textInput}
                value={profile.companyName}
                onChangeText={(t) => setProfile({ ...profile, companyName: t })}
                placeholder="Enterprise Registered Name"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Entity Constitution</Text>
              <View style={styles.chipsWrap}>
                {BUSINESS_TYPES.map((bt) => (
                  <TouchableOpacity
                    key={bt}
                    style={[styles.chip, profile.businessType === bt && styles.activeChip]}
                    onPress={() => setProfile({ ...profile, businessType: bt })}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        profile.businessType === bt && styles.activeChipText,
                      ]}
                    >
                      {bt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Source of Income / Employment Type</Text>
              <View style={styles.chipsWrap}>
                {EMPLOYMENT_TYPES.map((et) => (
                  <TouchableOpacity
                    key={et}
                    style={[styles.chip, profile.employmentType === et && styles.activeChip]}
                    onPress={() => setProfile({ ...profile, employmentType: et })}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        profile.employmentType === et && styles.activeChipText,
                      ]}
                    >
                      {et}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.rowTwo}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>GSTIN Number (Optional)</Text>
                <TextInput
                  style={[styles.textInput, { textTransform: 'uppercase' }]}
                  autoCapitalize="characters"
                  value={profile.gstNumber}
                  onChangeText={(t) => setProfile({ ...profile, gstNumber: t.toUpperCase() })}
                  placeholder="27AAAAA0000A1Z5"
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Vintage (Years)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={profile.yearsInBusiness}
                  onChangeText={(t) => setProfile({ ...profile, yearsInBusiness: t })}
                  placeholder="3"
                />
              </View>
            </View>

            <View style={styles.rowTwo}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Annual Turnover (₹)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={profile.annualRevenue}
                  onChangeText={(t) => setProfile({ ...profile, annualRevenue: t })}
                  placeholder="e.g. 5000000"
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Monthly Income (₹)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={profile.monthlyIncome}
                  onChangeText={(t) => setProfile({ ...profile, monthlyIncome: t })}
                  placeholder="e.g. 200000"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>CIBIL / Credit Score</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={profile.creditScore}
                onChangeText={(t) => setProfile({ ...profile, creditScore: t })}
                placeholder="750"
              />
            </View>
          </View>

          {/* Section 3: Registered Physical Address */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Feather name="map-pin" size={m(16)} color="#2563EB" />
              <Text style={styles.sectionTitle}>Registered Physical Address</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Street Address / Premise</Text>
              <TextInput
                style={styles.textInput}
                value={profile.address}
                onChangeText={(t) => setProfile({ ...profile, address: t })}
                placeholder="Shop No., Commercial Complex, Industrial Estate"
              />
            </View>

            <View style={styles.rowTwo}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>City / Town</Text>
                <TextInput
                  style={styles.textInput}
                  value={profile.city}
                  onChangeText={(t) => setProfile({ ...profile, city: t })}
                  placeholder="Mumbai"
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>District</Text>
                <TextInput
                  style={styles.textInput}
                  value={profile.district}
                  onChangeText={(t) => setProfile({ ...profile, district: t })}
                  placeholder="Mumbai City"
                />
              </View>
            </View>

            <View style={styles.rowTwo}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>State</Text>
                <TextInput
                  style={styles.textInput}
                  value={profile.state}
                  onChangeText={(t) => setProfile({ ...profile, state: t })}
                  placeholder="Maharashtra"
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Pincode</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={profile.pincode}
                  onChangeText={(t) => setProfile({ ...profile, pincode: t })}
                  placeholder="400001"
                />
              </View>
            </View>
          </View>

          {/* Save Action Button */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.disabledBtn]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Feather name="check" size={m(16)} color={colors.white} />
                <Text style={styles.saveBtnText}>Save Profile Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: m(16),
    paddingVertical: m(14),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: m(16),
    fontWeight: '800',
    color: '#0F172A',
  },
  backIcon: {
    padding: m(4),
  },
  securityShortcut: {
    padding: m(4),
  },
  scrollContent: {
    padding: m(16),
    gap: m(14),
    paddingBottom: m(80),
  },
  meterCard: {
    backgroundColor: '#0F172A',
    borderRadius: m(16),
    padding: m(16),
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: m(10),
  },
  meterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meterTag: {
    fontSize: m(9),
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  meterPctText: {
    fontSize: m(18),
    fontWeight: '900',
    color: colors.white,
    marginTop: m(2),
  },
  kycVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: '#14532D',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(6),
  },
  kycVerifiedText: {
    fontSize: m(10),
    fontWeight: '700',
    color: '#86EFAC',
  },
  kycPendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: '#78350F',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(6),
  },
  kycPendingText: {
    fontSize: m(10),
    fontWeight: '700',
    color: '#FDE68A',
  },
  meterTrack: {
    height: m(6),
    backgroundColor: '#1E293B',
    borderRadius: m(3),
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
  },
  missingBox: {
    backgroundColor: '#1E293B',
    borderRadius: m(8),
    padding: m(8),
  },
  missingLabel: {
    fontSize: m(9),
    color: '#94A3B8',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  missingText: {
    fontSize: m(10),
    color: '#F8FAFC',
    marginTop: m(2),
  },
  completeNotice: {
    fontSize: m(11),
    color: '#86EFAC',
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: m(12),
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    marginBottom: m(2),
  },
  sectionTitle: {
    fontSize: m(14),
    fontWeight: '800',
    color: '#0F172A',
  },
  fieldGroup: {
    gap: m(4),
  },
  rowTwo: {
    flexDirection: 'row',
    gap: m(10),
  },
  label: {
    fontSize: m(11),
    fontWeight: '600',
    color: '#475569',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: m(10),
    paddingHorizontal: m(12),
    paddingVertical: m(9),
    fontSize: m(13),
    color: '#0F172A',
  },
  readOnlyInput: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
  },
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
  activeChip: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  chipText: {
    fontSize: m(11),
    fontWeight: '600',
    color: '#64748B',
  },
  activeChipText: {
    color: colors.white,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
    backgroundColor: '#2563EB',
    borderRadius: m(14),
    paddingVertical: m(14),
    marginTop: m(8),
  },
  disabledBtn: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: m(15),
    fontWeight: '700',
    color: colors.white,
  },
});
