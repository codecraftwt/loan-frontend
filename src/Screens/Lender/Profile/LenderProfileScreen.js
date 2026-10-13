import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Clipboard,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { useDispatch, useSelector } from 'react-redux';
import { m } from 'walstar-rn-responsive';
import { FontFamily, colors } from '../../../constants';
import lenderFlowService from '../../../Services/lenderFlowService';
import { logout } from '../../../Redux/Slices/authslice';

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

export default function LenderProfileScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const authUser = useSelector((state) => state.auth.user);

  const [activeTab, setActiveTab] = useState('company'); // 'company' | 'lending' | 'address'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedLicense, setCopiedLicense] = useState(false);

  const [profile, setProfile] = useState({
    userName: '',
    companyName: '',
    licenseNumber: '',
    email: '',
    mobileNo: '',
    address: '',
    city: '',
    taluka: '',
    district: '',
    state: 'Maharashtra',
    pincode: '',
    stateOfOperation: 'Pan India Coverage',
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
          address: l.address || '',
          city: l.city || '',
          taluka: l.taluka || '',
          district: l.district || '',
          state: l.state || 'Maharashtra',
          pincode: l.pincode || '',
          stateOfOperation: l.stateOfOperation || 'Pan India Coverage',
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
      console.error('Error fetching lender profile:', err);
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleCopyLicense = () => {
    if (profile.licenseNumber) {
      Clipboard.setString(profile.licenseNumber);
      setCopiedLicense(true);
      setTimeout(() => setCopiedLicense(false), 2500);
      Alert.alert('Copied', `NBFC License number ${profile.licenseNumber} copied to clipboard.`);
    }
  };

  const toggleService = (svc) => {
    setProfile((prev) => {
      const exists = prev.servicesOffered.includes(svc);
      if (exists) {
        return {
          ...prev,
          servicesOffered: prev.servicesOffered.filter((s) => s !== svc),
        };
      } else {
        return {
          ...prev,
          servicesOffered: [...prev.servicesOffered, svc],
        };
      }
    });
  };

  const handleSaveProfile = async () => {
    if (!profile.companyName.trim()) {
      Alert.alert('Required', 'Please enter your registered company or NBFC name.');
      return;
    }
    if (!profile.email.trim()) {
      Alert.alert('Required', 'Please enter an institutional contact email.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        userName: profile.userName.trim(),
        companyName: profile.companyName.trim(),
        licenseNumber: profile.licenseNumber.trim(),
        email: profile.email.trim(),
        mobileNo: profile.mobileNo.trim(),
        address: profile.address.trim(),
        city: profile.city.trim(),
        taluka: profile.taluka.trim(),
        district: profile.district.trim(),
        state: profile.state.trim(),
        pincode: profile.pincode.trim(),
        stateOfOperation: profile.stateOfOperation.trim(),
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
        Alert.alert('Success ✨', 'Your institutional profile and lending parameters have been updated.');
        fetchProfile();
      } else {
        Alert.alert('Update Failed', res?.message || 'Unable to update profile.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save profile changes.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of your institutional account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          dispatch(logout());
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        },
      },
    ]);
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
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={styles.loaderText}>Loading institutional profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={m(20)} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Lender Profile</Text>
          <Text style={styles.headerSubtitle}>Institutional Credentials</Text>
        </View>
        <TouchableOpacity
          onPress={handleSaveProfile}
          disabled={saving}
          style={styles.saveHeaderBtn}
          activeOpacity={0.7}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : (
            <Feather name="check" size={m(18)} color="#2563eb" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Feather name="shield" size={m(30)} color="#2563eb" />
          </View>
          <Text style={styles.heroName}>
            {profile.companyName || authUser?.userName || 'Institutional Lender'}
          </Text>
          <Text style={styles.heroOfficer}>
            Signatory: {profile.userName || authUser?.userName || 'Principal Officer'}
          </Text>

          {/* NBFC License Badge & Copy */}
          <TouchableOpacity
            style={styles.licenseRow}
            onPress={handleCopyLicense}
            activeOpacity={0.8}
          >
            <View style={styles.nbfcDot} />
            <Text style={styles.licenseText}>
              RBI NBFC License: {profile.licenseNumber || 'NBFC-CORP-984210'}
            </Text>
            <Feather
              name={copiedLicense ? 'check' : 'copy'}
              size={m(12)}
              color={copiedLicense ? '#10b981' : '#64748b'}
              style={{ marginLeft: m(6) }}
            />
          </TouchableOpacity>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'company' && styles.tabItemActive]}
            onPress={() => setActiveTab('company')}
          >
            <Feather
              name="briefcase"
              size={m(14)}
              color={activeTab === 'company' ? '#0f172a' : '#64748b'}
            />
            <Text
              style={[styles.tabItemText, activeTab === 'company' && styles.tabItemTextActive]}
            >
              Enterprise
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'lending' && styles.tabItemActive]}
            onPress={() => setActiveTab('lending')}
          >
            <Feather
              name="pie-chart"
              size={m(14)}
              color={activeTab === 'lending' ? '#0f172a' : '#64748b'}
            />
            <Text
              style={[styles.tabItemText, activeTab === 'lending' && styles.tabItemTextActive]}
            >
              Lending Terms
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'address' && styles.tabItemActive]}
            onPress={() => setActiveTab('address')}
          >
            <Feather
              name="map-pin"
              size={m(14)}
              color={activeTab === 'address' ? '#0f172a' : '#64748b'}
            />
            <Text
              style={[styles.tabItemText, activeTab === 'address' && styles.tabItemTextActive]}
            >
              Registered Office
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Enterprise Profile */}
        {activeTab === 'company' && (
          <View style={styles.sectionCard}>
            <Text style={styles.cardHeader}>Entity Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company / NBFC Legal Name *</Text>
              <TextInput
                style={styles.input}
                value={profile.companyName}
                onChangeText={(t) => setProfile({ ...profile, companyName: t })}
                placeholder="e.g. Apex Industrial Credit Ltd."
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Authorized Signatory Name *</Text>
              <TextInput
                style={styles.input}
                value={profile.userName}
                onChangeText={(t) => setProfile({ ...profile, userName: t })}
                placeholder="Principal Officer Name"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Institutional Email *</Text>
              <TextInput
                style={styles.input}
                value={profile.email}
                onChangeText={(t) => setProfile({ ...profile, email: t })}
                placeholder="operations@lender.com"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Direct Contact Mobile *</Text>
              <TextInput
                style={styles.input}
                value={profile.mobileNo}
                onChangeText={(t) => setProfile({ ...profile, mobileNo: t })}
                placeholder="10-digit mobile number"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>RBI NBFC Registration Number</Text>
              <TextInput
                style={styles.input}
                value={profile.licenseNumber}
                onChangeText={(t) => setProfile({ ...profile, licenseNumber: t })}
                placeholder="NBFC Registration ID"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Institutional Bio / Overview</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={profile.bio}
                onChangeText={(t) => setProfile({ ...profile, bio: t })}
                placeholder="Brief summary of lending thesis, capital capacity, and sectors serviced..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        )}

        {/* Tab 2: Lending Terms & Parameters */}
        {activeTab === 'lending' && (
          <View style={styles.sectionCard}>
            <Text style={styles.cardHeader}>Lending Parameters & Ticket Brackets</Text>

            {/* Ticket Size Min & Max */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: m(8) }]}>
                <Text style={styles.label}>Min Ticket Size (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={profile.minLoanAmount}
                  onChangeText={(t) => setProfile({ ...profile, minLoanAmount: t })}
                  placeholder="500000"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                />
                <Text style={styles.helperText}>{formatINR(profile.minLoanAmount)}</Text>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Max Ticket Size (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={profile.maxLoanAmount}
                  onChangeText={(t) => setProfile({ ...profile, maxLoanAmount: t })}
                  placeholder="100000000"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                />
                <Text style={styles.helperText}>{formatINR(profile.maxLoanAmount)}</Text>
              </View>
            </View>

            {/* Quick Ticket Presets */}
            <Text style={[styles.label, { marginTop: m(4), marginBottom: m(6) }]}>
              Quick Presets (Max Cap)
            </Text>
            <View style={styles.chipWrap}>
              {TICKET_SIZE_PRESETS.map((t) => (
                <TouchableOpacity
                  key={t.val}
                  style={[
                    styles.chip,
                    Number(profile.maxLoanAmount) === t.val && styles.chipActive,
                  ]}
                  onPress={() => setProfile({ ...profile, maxLoanAmount: String(t.val) })}
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

            {/* Interest Rate Bracket */}
            <View style={[styles.rowInputs, { marginTop: m(12) }]}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: m(8) }]}>
                <Text style={styles.label}>Min Rate (% p.a.)</Text>
                <TextInput
                  style={styles.input}
                  value={profile.minInterestRate}
                  onChangeText={(t) => setProfile({ ...profile, minInterestRate: t })}
                  placeholder="9.5"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Max Rate (% p.a.)</Text>
                <TextInput
                  style={styles.input}
                  value={profile.maxInterestRate}
                  onChangeText={(t) => setProfile({ ...profile, maxInterestRate: t })}
                  placeholder="14.0"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Turnaround Time */}
            <Text style={[styles.label, { marginTop: m(6), marginBottom: m(6) }]}>
              Disbursal Turnaround (TAT)
            </Text>
            <View style={styles.chipWrap}>
              {TAT_PRESETS.map((tat) => (
                <TouchableOpacity
                  key={tat}
                  style={[
                    styles.chip,
                    profile.turnaroundTime === tat && styles.chipActive,
                  ]}
                  onPress={() => setProfile({ ...profile, turnaroundTime: tat })}
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
            <View style={[styles.inputGroup, { marginTop: m(14) }]}>
              <Text style={styles.label}>Lending Experience (Years)</Text>
              <TextInput
                style={styles.input}
                value={profile.experienceYears}
                onChangeText={(t) => setProfile({ ...profile, experienceYears: t })}
                placeholder="5"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
              />
            </View>

            {/* Services Offered Multi-Select Chips */}
            <Text style={[styles.label, { marginTop: m(6), marginBottom: m(6) }]}>
              Financial Products & Services Offered
            </Text>
            <View style={styles.chipWrap}>
              {AVAILABLE_SERVICES_PRESETS.map((svc) => {
                const isSelected = profile.servicesOffered.includes(svc);
                return (
                  <TouchableOpacity
                    key={svc}
                    style={[styles.serviceChip, isSelected && styles.serviceChipActive]}
                    onPress={() => toggleService(svc)}
                  >
                    <Feather
                      name={isSelected ? 'check' : 'plus'}
                      size={m(12)}
                      color={isSelected ? '#ffffff' : '#64748b'}
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
        )}

        {/* Tab 3: Registered Office Address */}
        {activeTab === 'address' && (
          <View style={styles.sectionCard}>
            <Text style={styles.cardHeader}>Registered Head Office</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Operating Jurisdiction</Text>
              <TextInput
                style={styles.input}
                value={profile.stateOfOperation}
                onChangeText={(t) => setProfile({ ...profile, stateOfOperation: t })}
                placeholder="Pan India Coverage or State Name"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Street Address</Text>
              <TextInput
                style={styles.input}
                value={profile.address}
                onChangeText={(t) => setProfile({ ...profile, address: t })}
                placeholder="Tower / Floor / Business Park"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: m(8) }]}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.input}
                  value={profile.city}
                  onChangeText={(t) => setProfile({ ...profile, city: t })}
                  placeholder="e.g. Mumbai"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>District / Region</Text>
                <TextInput
                  style={styles.input}
                  value={profile.district}
                  onChangeText={(t) => setProfile({ ...profile, district: t })}
                  placeholder="District"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: m(8) }]}>
                <Text style={styles.label}>State</Text>
                <TextInput
                  style={styles.input}
                  value={profile.state}
                  onChangeText={(t) => setProfile({ ...profile, state: t })}
                  placeholder="Maharashtra"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Pincode</Text>
                <TextInput
                  style={styles.input}
                  value={profile.pincode}
                  onChangeText={(t) => setProfile({ ...profile, pincode: t })}
                  placeholder="400051"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        )}

        {/* Save Changes Floating Action Button */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSaveProfile}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Feather name="save" size={m(16)} color="#ffffff" style={{ marginRight: m(8) }} />
              <Text style={styles.saveBtnText}>Save Institutional Profile</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Settings & Password Shortcut */}
        <TouchableOpacity
          style={styles.settingsRowBtn}
          onPress={() => navigation.navigate('LenderSettingsScreen')}
          activeOpacity={0.8}
        >
          <View style={styles.settingsIconBox}>
            <Feather name="lock" size={m(16)} color="#2563eb" />
          </View>
          <View style={{ flex: 1, marginLeft: m(12) }}>
            <Text style={styles.settingsRowTitle}>Security & Credentials</Text>
            <Text style={styles.settingsRowSubtitle}>
              Change admin password, update security keys
            </Text>
          </View>
          <Feather name="chevron-right" size={m(16)} color="#94a3b8" />
        </TouchableOpacity>

        {/* Sign Out Action */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={m(16)} color="#ef4444" style={{ marginRight: m(8) }} />
          <Text style={styles.logoutText}>Sign Out of Lender Portal</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    marginTop: m(10),
    fontSize: m(12),
    color: '#64748b',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: m(16),
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || m(24)) + m(10) : m(12),
    paddingBottom: m(12),
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  backBtn: {
    width: m(40),
    height: m(40),
    borderRadius: m(20),
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: m(16),
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FontFamily?.primaryBold,
  },
  headerSubtitle: {
    fontSize: m(11),
    color: '#64748b',
    marginTop: m(1),
  },
  saveHeaderBtn: {
    width: m(40),
    height: m(40),
    borderRadius: m(20),
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: { flex: 1 },
  content: {
    padding: m(16),
    paddingBottom: m(50),
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: m(16),
    padding: m(20),
    alignItems: 'center',
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  avatar: {
    width: m(64),
    height: m(64),
    borderRadius: m(32),
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: m(10),
    borderWidth: 2,
    borderColor: '#bfdbfe',
  },
  heroName: {
    fontSize: m(17),
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  heroOfficer: {
    fontSize: m(12),
    color: '#64748b',
    marginTop: m(2),
    fontWeight: '500',
  },
  licenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: m(20),
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    marginTop: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  nbfcDot: {
    width: m(6),
    height: m(6),
    borderRadius: m(3),
    backgroundColor: '#10b981',
    marginRight: m(6),
  },
  licenseText: {
    fontSize: m(11),
    fontWeight: '700',
    color: '#334155',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: m(12),
    padding: m(4),
    marginBottom: m(16),
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(8),
    borderRadius: m(8),
  },
  tabItemActive: {
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  tabItemText: {
    fontSize: m(11),
    fontWeight: '700',
    color: '#64748b',
    marginLeft: m(6),
  },
  tabItemTextActive: {
    color: '#0f172a',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: m(16),
    padding: m(18),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    fontSize: m(14),
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: m(14),
  },
  inputGroup: {
    marginBottom: m(14),
  },
  label: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#334155',
    marginBottom: m(6),
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: m(10),
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: m(12),
    height: m(44),
    fontSize: m(13),
    color: '#0f172a',
    fontWeight: '600',
  },
  textArea: {
    height: m(80),
    textAlignVertical: 'top',
    paddingTop: m(10),
  },
  rowInputs: {
    flexDirection: 'row',
  },
  helperText: {
    fontSize: m(10),
    fontWeight: '700',
    color: '#2563eb',
    marginTop: m(3),
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(6),
    marginBottom: m(8),
  },
  chip: {
    backgroundColor: '#f1f5f9',
    borderRadius: m(8),
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  chipText: {
    fontSize: m(11),
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: m(8),
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  serviceChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  serviceChipText: {
    fontSize: m(11),
    fontWeight: '600',
    color: '#475569',
  },
  serviceChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    borderRadius: m(12),
    height: m(48),
    marginBottom: m(14),
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: m(13),
    fontWeight: '800',
  },
  settingsRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: m(14),
    padding: m(14),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: m(14),
  },
  settingsIconBox: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsRowTitle: {
    fontSize: m(13),
    fontWeight: '800',
    color: '#0f172a',
  },
  settingsRowSubtitle: {
    fontSize: m(11),
    color: '#64748b',
    marginTop: m(1),
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: m(12),
    height: m(46),
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: m(12),
    fontWeight: '800',
  },
});
