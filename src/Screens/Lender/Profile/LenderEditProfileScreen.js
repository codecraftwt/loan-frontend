import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  const scrollRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal'); // 'personal' | 'financial'
  const [customService, setCustomService] = useState('');

  const [profile, setProfile] = useState({
    userName: '',
    companyName: '',
    licenseNumber: '',
    email: '',
    mobileNo: '',
    city: '',
    taluka: '',
    district: '',
    state: '',
    pincode: '',
    stateOfOperation: '',
    address: '',
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
          city: l.city || '',
          taluka: l.taluka || '',
          district: l.district || '',
          state: l.state || 'Maharashtra',
          pincode: l.pincode || '',
          stateOfOperation: l.stateOfOperation || 'Pan India Coverage',
          address: l.address || '',
          minInterestRate: String(lp.minInterestRate ?? 9.5),
          maxInterestRate: String(lp.maxInterestRate ?? 14.0),
          servicesOffered: Array.isArray(lp.servicesOffered) && lp.servicesOffered.length > 0
            ? lp.servicesOffered
            : [
              'Commercial Term Loan',
              'Working Capital Line',
              'SME Business Loan',
              'Equipment & Machinery Finance',
            ],
          experienceYears: String(lp.experienceYears ?? 5),
          bio: lp.bio || '',
          minLoanAmount: String(lp.minLoanAmount ?? 500000),
          maxLoanAmount: String(lp.maxLoanAmount ?? 100000000),
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

  const handleAddCustomService = () => {
    const trimmed = customService.trim();
    if (!trimmed) return;
    if (profile.servicesOffered.includes(trimmed)) {
      setCustomService('');
      return;
    }
    setProfile({
      ...profile,
      servicesOffered: [...profile.servicesOffered, trimmed],
    });
    setCustomService('');
  };

  const handleSave = async () => {
    if (!profile.companyName.trim()) {
      showAlert('Required', 'Please enter your institution legal name.');
      return;
    }
    if (!profile.userName.trim()) {
      showAlert('Required', 'Please enter your representative name.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        userName: profile.userName.trim(),
        email: profile.email.trim(),
        mobileNo: profile.mobileNo.trim(),
        companyName: profile.companyName.trim(),
        licenseNumber: profile.licenseNumber.trim(),
        city: profile.city.trim(),
        taluka: profile.taluka.trim(),
        district: profile.district.trim(),
        state: profile.state.trim(),
        pincode: profile.pincode.trim(),
        stateOfOperation: profile.stateOfOperation.trim(),
        address: profile.address.trim(),
        minInterestRate: Number(profile.minInterestRate) || 9.5,
        maxInterestRate: Number(profile.maxInterestRate) || 14.0,
        servicesOffered: profile.servicesOffered,
        experienceYears: Number(profile.experienceYears) || 0,
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
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={colors.lettersAndIcons} />
          <Text style={styles.loaderText}>Loading institutional parameters...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const switchTab = (tab) => {
    setActiveTab(tab);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
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
      {/* ── 1. Top Green Header Bar ── */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <Feather name="chevron-left" size={m(22)} color={colors.lettersAndIcons} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
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
        {/* ── Segmented Top Tabs Bar ── */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'personal' && styles.tabBtnActive,
            ]}
            onPress={() => switchTab('personal')}
            activeOpacity={0.8}
          >
            <Feather
              name="user"
              size={m(13)}
              color={activeTab === 'personal' ? colors.white : '#475569'}
              style={{ marginRight: m(6) }}
            />
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'personal' && styles.tabBtnTextActive,
              ]}
            >
              Personal Information
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'financial' && styles.tabBtnActive,
            ]}
            onPress={() => switchTab('financial')}
            activeOpacity={0.8}
          >
            <Feather
              name="percent"
              size={m(13)}
              color={activeTab === 'financial' ? colors.white : '#475569'}
              style={{ marginRight: m(6) }}
            />
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'financial' && styles.tabBtnTextActive,
              ]}
            >
              Financial Information
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ═════════════════════════════════════════════════════════════ */}
          {/* ── TAB 1: PERSONAL INFORMATION ── */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'personal' && (
            <View>
              {/* Card 1: Lender Contact & Representative Details */}
              <View style={styles.formCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.cardIconCircle, { backgroundColor: colors.oceanBlueButton }]}>
                    <Feather name="user" size={m(14)} color={colors.white} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardHeaderTitle}>Lender Contact & Representative Details</Text>
                    <Text style={styles.cardSubtitle}>
                      Primary communication channels for borrower applications and deals.
                    </Text>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Full Legal Name / Representative <Text style={styles.reqAsterisk}>*</Text>
                  </Text>
                  <View style={styles.iconInputWrap}>
                    <Feather name="user" size={m(14)} color="#94a3b8" style={styles.inputLeftIcon} />
                    <TextInput
                      style={styles.iconInputField}
                      value={profile.userName}
                      onChangeText={(t) => setProfile({ ...profile, userName: t })}
                      placeholder="e.g. Rahul Sharma"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Official Email Address <Text style={styles.reqAsterisk}>*</Text>
                  </Text>
                  <View style={styles.iconInputWrap}>
                    <Feather name="mail" size={m(14)} color="#94a3b8" style={styles.inputLeftIcon} />
                    <TextInput
                      style={styles.iconInputField}
                      value={profile.email}
                      onChangeText={(t) => setProfile({ ...profile, email: t })}
                      placeholder="lender@loanhub.in"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Direct Mobile / Contact Number <Text style={styles.reqAsterisk}>*</Text>
                  </Text>
                  <View style={styles.iconInputWrap}>
                    <Feather name="phone" size={m(14)} color="#94a3b8" style={styles.inputLeftIcon} />
                    <TextInput
                      style={styles.iconInputField}
                      value={profile.mobileNo}
                      onChangeText={(t) => setProfile({ ...profile, mobileNo: t })}
                      placeholder="e.g. 9876543210"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Institution / Firm Legal Name <Text style={styles.reqAsterisk}>*</Text>
                  </Text>
                  <View style={styles.iconInputWrap}>
                    <Feather name="briefcase" size={m(14)} color="#94a3b8" style={styles.inputLeftIcon} />
                    <TextInput
                      style={styles.iconInputField}
                      value={profile.companyName}
                      onChangeText={(t) => setProfile({ ...profile, companyName: t })}
                      placeholder="e.g. Apex Commercial Capital NBFC"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>
              </View>

              {/* Card 2: Regional Location, Taluka & District Address */}
              <View style={styles.formCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.cardIconCircle, { backgroundColor: '#0891b2' }]}>
                    <Feather name="map-pin" size={m(14)} color={colors.white} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardHeaderTitle}>Regional Location, Taluka & District Address</Text>
                    <Text style={styles.cardSubtitle}>
                      Exact geographical operating base and registered underwriting address.
                    </Text>
                  </View>
                </View>

                <View style={styles.rowInputs}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: m(8) }]}>
                    <Text style={styles.inputLabel}>
                      City / Town <Text style={styles.reqAsterisk}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.inputField}
                      value={profile.city}
                      onChangeText={(t) => setProfile({ ...profile, city: t })}
                      placeholder="e.g. Mumbai / Kolhapur"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Taluka / Tehsil</Text>
                    <TextInput
                      style={styles.inputField}
                      value={profile.taluka}
                      onChangeText={(t) => setProfile({ ...profile, taluka: t })}
                      placeholder="e.g. Karveer / Haveli"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                <View style={styles.rowInputs}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: m(8) }]}>
                    <Text style={styles.inputLabel}>
                      District <Text style={styles.reqAsterisk}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.inputField}
                      value={profile.district}
                      onChangeText={(t) => setProfile({ ...profile, district: t })}
                      placeholder="e.g. Kolhapur / Pune"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>
                      State <Text style={styles.reqAsterisk}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.inputField}
                      value={profile.state}
                      onChangeText={(t) => setProfile({ ...profile, state: t })}
                      placeholder="e.g. Maharashtra"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                <View style={styles.rowInputs}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: m(8) }]}>
                    <Text style={styles.inputLabel}>Pin Code / Postal Code</Text>
                    <TextInput
                      style={styles.inputField}
                      value={profile.pincode}
                      onChangeText={(t) => setProfile({ ...profile, pincode: t })}
                      placeholder="e.g. 416003"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Operating Geography</Text>
                    <TextInput
                      style={styles.inputField}
                      value={profile.stateOfOperation}
                      onChangeText={(t) => setProfile({ ...profile, stateOfOperation: t })}
                      placeholder="e.g. Pan India / Maharashtra"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Street / Registered Physical Address</Text>
                  <TextInput
                    style={[styles.inputField, { height: m(65), textAlignVertical: 'top' }]}
                    value={profile.address}
                    onChangeText={(t) => setProfile({ ...profile, address: t })}
                    placeholder="e.g. 402, Trade Square, Station Road..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                  />
                </View>
              </View>

              {/* Card 3: Lender License & Registration Number */}
              <View style={styles.formCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.cardIconCircle, { backgroundColor: '#d97706' }]}>
                    <Feather name="shield" size={m(14)} color={colors.white} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardHeaderTitle}>Lender License & Registration Number</Text>
                    <Text style={styles.cardSubtitle}>
                      RBI Registration / NBFC License Number for compliance and badge verification.
                    </Text>
                  </View>
                </View>

                <View style={styles.rowInputs}>
                  <View style={[styles.inputGroup, { flex: 1.5, marginRight: m(8) }]}>
                    <Text style={styles.inputLabel}>
                      NBFC / RBI License <Text style={styles.reqAsterisk}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.inputField}
                      value={profile.licenseNumber}
                      onChangeText={(t) => setProfile({ ...profile, licenseNumber: t })}
                      placeholder="NBFC-RBI-IND-74921"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="characters"
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Experience (Yrs)</Text>
                    <TextInput
                      style={styles.inputField}
                      value={profile.experienceYears}
                      onChangeText={(t) => setProfile({ ...profile, experienceYears: t })}
                      placeholder="5"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* ── TAB 2: FINANCIAL INFORMATION ── */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'financial' && (
            <View>
              {/* Card 1: Interest Rates & Ticket Size Engine */}
              <View style={styles.formCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.cardIconCircle, { backgroundColor: '#059669' }]}>
                    <Feather name="percent" size={m(14)} color={colors.white} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleBadgeRow}>
                      <Text style={styles.cardHeaderTitle}>Interest Rates & Ticket Size Engine</Text>
                      <View style={styles.liveTermsBadge}>
                        <Text style={styles.liveTermsText}>LIVE TERMS</Text>
                      </View>
                    </View>
                    <Text style={styles.cardSubtitle}>
                      Defines your underwriting parameters and match criteria for borrowers.
                    </Text>
                  </View>
                </View>

                {/* Section A: Annual Interest Rate Range */}
                <Text style={styles.sectionHeaderTitle}>
                  ANNUAL INTEREST RATE RANGE (APR % P.A.)
                </Text>

                <View style={styles.rowInputs}>
                  <View style={[styles.rateBox, { marginRight: m(8) }]}>
                    <Text style={styles.rateBoxLabel}>Minimum Rate (Best Credit Score)</Text>
                    <View style={styles.rateInputRow}>
                      <TextInput
                        style={styles.rateNumberInput}
                        value={profile.minInterestRate}
                        onChangeText={(t) => setProfile({ ...profile, minInterestRate: t })}
                        placeholder="9.5"
                        placeholderTextColor="#94a3b8"
                        keyboardType="numeric"
                      />
                      <Text style={styles.rateUnitText}>% p.a.</Text>
                    </View>
                  </View>

                  <View style={styles.rateBox}>
                    <Text style={styles.rateBoxLabel}>Maximum Rate (Higher Risk/Subprime)</Text>
                    <View style={styles.rateInputRow}>
                      <TextInput
                        style={styles.rateNumberInput}
                        value={profile.maxInterestRate}
                        onChangeText={(t) => setProfile({ ...profile, maxInterestRate: t })}
                        placeholder="14.0"
                        placeholderTextColor="#94a3b8"
                        keyboardType="numeric"
                      />
                      <Text style={styles.rateUnitText}>% p.a.</Text>
                    </View>
                  </View>
                </View>

                {/* Section B: Loan Ticket Size Limits */}
                <View style={[styles.ticketHeaderRow, { marginTop: m(14) }]}>
                  <Text style={styles.sectionHeaderTitle}>LOAN TICKET SIZE LIMITS (₹)</Text>
                  <Text style={styles.rangeIndicatorText}>
                    Range: {formatINR(profile.minLoanAmount)} — {formatINR(profile.maxLoanAmount)}
                  </Text>
                </View>

                <View style={styles.rowInputs}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: m(8) }]}>
                    <Text style={styles.inputLabel}>Minimum Loan Amount (₹)</Text>
                    <TextInput
                      style={styles.inputField}
                      value={profile.minLoanAmount}
                      onChangeText={(t) => setProfile({ ...profile, minLoanAmount: t })}
                      placeholder="500000"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                    />
                    <Text style={styles.helperText}>= {formatINR(profile.minLoanAmount)}</Text>
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Maximum Loan Amount (₹)</Text>
                    <TextInput
                      style={styles.inputField}
                      value={profile.maxLoanAmount}
                      onChangeText={(t) => setProfile({ ...profile, maxLoanAmount: t })}
                      placeholder="100000000"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                    />
                    <Text style={styles.helperText}>= {formatINR(profile.maxLoanAmount)}</Text>
                  </View>
                </View>

                {/* Quick Max Cap Presets */}
                <View style={styles.quickCapRow}>
                  <Text style={styles.quickCapLabel}>Quick Max Caps:</Text>
                  <View style={styles.chipWrap}>
                    {TICKET_SIZE_PRESETS.map((t) => {
                      const isActive = Number(profile.maxLoanAmount) === t.val;
                      return (
                        <TouchableOpacity
                          key={t.val}
                          style={[styles.quickCapChip, isActive && styles.quickCapChipActive]}
                          onPress={() => setProfile({ ...profile, maxLoanAmount: String(t.val) })}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.quickCapText, isActive && styles.quickCapTextActive]}>
                            {t.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Section C: Approval Turnaround Time (TAT) */}
                <View style={{ marginTop: m(12), paddingTop: m(12), borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                  <Text style={styles.sectionHeaderTitle}>APPROVAL TURNAROUND TIME (TAT)</Text>

                  <View style={styles.chipWrap}>
                    {TAT_PRESETS.map((tat) => {
                      const isSelected = profile.turnaroundTime === tat;
                      return (
                        <TouchableOpacity
                          key={tat}
                          style={[styles.tatChip, isSelected && styles.tatChipActive]}
                          onPress={() => setProfile({ ...profile, turnaroundTime: tat })}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.tatChipText, isSelected && styles.tatChipTextActive]}>
                            {tat}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={[styles.iconInputWrap, { marginTop: m(6) }]}>
                    <Feather name="clock" size={m(14)} color="#94a3b8" style={styles.inputLeftIcon} />
                    <TextInput
                      style={styles.iconInputField}
                      value={profile.turnaroundTime}
                      onChangeText={(t) => setProfile({ ...profile, turnaroundTime: t })}
                      placeholder="e.g. 24-48 Hours"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>
              </View>

              {/* Card 2: Lending Facilities & Product Portfolio */}
              <View style={styles.formCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.cardIconCircle, { backgroundColor: '#4f46e5' }]}>
                    <Feather name="layers" size={m(14)} color={colors.white} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleBadgeRow}>
                      <Text style={styles.cardHeaderTitle}>Lending Facilities & Product Portfolio</Text>
                      <View style={styles.activeCountBadge}>
                        <Text style={styles.activeCountText}>{profile.servicesOffered.length} Active</Text>
                      </View>
                    </View>
                    <Text style={styles.cardSubtitle}>
                      Select the credit products your fund is authorized to disburse.
                    </Text>
                  </View>
                </View>

                {/* Facilities Chips */}
                <View style={styles.serviceChipsWrap}>
                  {AVAILABLE_SERVICES_PRESETS.map((svc) => {
                    const isSelected = profile.servicesOffered.includes(svc);
                    return (
                      <TouchableOpacity
                        key={svc}
                        style={[styles.facilityChip, isSelected && styles.facilityChipActive]}
                        onPress={() => toggleService(svc)}
                        activeOpacity={0.8}
                      >
                        <Feather
                          name={isSelected ? 'check' : 'plus'}
                          size={m(12)}
                          color={isSelected ? colors.white : '#64748b'}
                          style={{ marginRight: m(5) }}
                        />
                        <Text
                          style={[
                            styles.facilityChipText,
                            isSelected && styles.facilityChipTextActive,
                          ]}
                        >
                          {svc}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}

                  {/* Render any custom added facilities not in the preset list */}
                  {profile.servicesOffered
                    .filter((s) => !AVAILABLE_SERVICES_PRESETS.includes(s))
                    .map((svc) => (
                      <TouchableOpacity
                        key={svc}
                        style={[styles.facilityChip, styles.facilityChipActive]}
                        onPress={() => toggleService(svc)}
                        activeOpacity={0.8}
                      >
                        <Feather
                          name="check"
                          size={m(12)}
                          color={colors.white}
                          style={{ marginRight: m(5) }}
                        />
                        <Text style={[styles.facilityChipText, styles.facilityChipTextActive]}>
                          {svc}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>

                {/* Custom Facility Input */}
                <View style={styles.customAddRow}>
                  <TextInput
                    style={styles.customAddInput}
                    value={customService}
                    onChangeText={setCustomService}
                    placeholder="Add custom debt facility (e.g. Export Factoring)..."
                    placeholderTextColor="#94a3b8"
                    onSubmitEditing={handleAddCustomService}
                  />
                  <TouchableOpacity
                    style={styles.customAddBtn}
                    onPress={handleAddCustomService}
                    activeOpacity={0.8}
                  >
                    <Feather name="plus" size={m(13)} color={colors.white} style={{ marginRight: m(3) }} />
                    <Text style={styles.customAddBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Card 3: Underwriting Criteria & Guidelines */}
              <View style={styles.formCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.cardIconCircle, { backgroundColor: '#7c3aed' }]}>
                    <Feather name="file-text" size={m(14)} color={colors.white} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardHeaderTitle}>Underwriting Criteria & Guidelines</Text>
                    <Text style={styles.cardSubtitle}>
                      Displayed directly to borrowers on their Explore Lenders comparison desk.
                    </Text>
                  </View>
                </View>

                <TextInput
                  style={[styles.inputField, { height: m(90), textAlignVertical: 'top' }]}
                  value={profile.bio}
                  onChangeText={(t) => setProfile({ ...profile, bio: t })}
                  placeholder="Describe preferred industries, minimum revenue turnover, collateral requirements, and key highlights of your underwriting desk..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                />
              </View>
            </View>
          )}

          {/* ── Submit / Save Profile Changes Button ── */}
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
                <Text style={styles.saveSubmitText}>Save Profile Changes</Text>
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
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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

  // Tab Switcher
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: m(16),
    marginBottom: m(12),
    backgroundColor: '#e2e8f0',
    borderRadius: m(14),
    padding: m(3.5),
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(9),
    borderRadius: m(11),
  },
  tabBtnActive: {
    backgroundColor: '#2563eb',
    elevation: 2,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  tabBtnText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryBold,
    color: '#475569',
  },
  tabBtnTextActive: {
    color: colors.white,
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
    alignItems: 'flex-start',
    marginBottom: m(14),
  },
  cardIconCircle: {
    width: m(32),
    height: m(32),
    borderRadius: m(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(10),
    marginTop: m(2),
  },
  cardHeaderTitle: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  cardSubtitle: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryRegular,
    color: '#94a3b8',
    marginTop: m(2),
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: m(6),
  },
  liveTermsBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: m(7),
    paddingVertical: m(2),
    borderRadius: m(6),
  },
  liveTermsText: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: '#15803d',
    letterSpacing: 0.4,
  },
  activeCountBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: m(8),
    paddingVertical: m(2.5),
    borderRadius: m(8),
  },
  activeCountText: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: '#4338ca',
  },

  // Inputs
  inputGroup: {
    marginBottom: m(12),
  },
  rowInputs: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: '#334155',
    marginBottom: m(5),
  },
  reqAsterisk: {
    color: '#ef4444',
  },
  inputField: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: m(12),
    paddingHorizontal: m(12),
    paddingVertical: m(9),
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  iconInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: m(12),
    paddingHorizontal: m(10),
  },
  inputLeftIcon: {
    marginRight: m(8),
  },
  iconInputField: {
    flex: 1,
    paddingVertical: m(9),
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  helperText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryBold,
    color: '#2563eb',
    marginTop: m(3),
  },

  // Financial Section Elements
  sectionHeaderTitle: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: '#334155',
    letterSpacing: 0.6,
    marginBottom: m(8),
  },
  rateBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: m(14),
    padding: m(12),
  },
  rateBoxLabel: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: '#64748b',
    marginBottom: m(6),
  },
  rateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rateNumberInput: {
    fontSize: m(17),
    fontFamily: FontFamily.primaryBold,
    color: '#059669',
    padding: 0,
    flex: 1,
  },
  rateUnitText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: '#94a3b8',
    marginLeft: m(4),
  },

  ticketHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: m(8),
  },
  rangeIndicatorText: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: '#2563eb',
  },

  quickCapRow: {
    marginTop: m(2),
    marginBottom: m(6),
  },
  quickCapLabel: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryMedium,
    color: '#94a3b8',
    marginBottom: m(6),
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(6),
  },
  quickCapChip: {
    paddingHorizontal: m(9),
    paddingVertical: m(4.5),
    borderRadius: m(8),
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickCapChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  quickCapText: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: '#475569',
  },
  quickCapTextActive: {
    color: colors.white,
  },

  tatChip: {
    paddingHorizontal: m(11),
    paddingVertical: m(6),
    borderRadius: m(12),
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tatChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  tatChipText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryBold,
    color: '#475569',
  },
  tatChipTextActive: {
    color: colors.white,
  },

  // Lending Facilities
  serviceChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(7),
    marginBottom: m(12),
  },
  facilityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(11),
    paddingVertical: m(6.5),
    borderRadius: m(12),
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  facilityChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  facilityChipText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: '#334155',
  },
  facilityChipTextActive: {
    color: colors.white,
  },

  customAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
    marginTop: m(4),
  },
  customAddInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: m(12),
    paddingHorizontal: m(12),
    paddingVertical: m(8.5),
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  customAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    borderRadius: m(12),
    paddingHorizontal: m(14),
    paddingVertical: m(9.5),
  },
  customAddBtnText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },

  // Submit Button
  saveSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    borderRadius: m(14),
    paddingVertical: m(13),
    marginBottom: m(20),
    elevation: 3,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  saveSubmitText: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
});
