import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { m } from 'walstar-rn-responsive';
import { colors } from '../../../constants';
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
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  if (!lender) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={styles.notFoundText}>Lender details could not be loaded.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Return to Lenders</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const lp = lender.lenderProfile || {};
  const maxAmount = lp.maxLoanAmount || 5000000;
  const minRate = lp.minInterestRate || 10.5;
  const maxRate = lp.maxInterestRate || 16.0;
  const maxTenure = lp.maxTenureMonths || 36;
  const isFav = !!lender.isFavorite;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={m(22)} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Institutional Lender Profile</Text>
        <TouchableOpacity style={styles.favHeaderBtn} onPress={handleToggleFavorite}>
          <Feather
            name="heart"
            size={m(20)}
            color={isFav ? '#EF4444' : '#64748B'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Feather name="shield" size={m(32)} color="#2563EB" />
          </View>
          <Text style={styles.companyName}>
            {lender.companyName || lender.userName || 'Institutional Lender'}
          </Text>
          <View style={styles.badgeRow}>
            <View style={styles.verifiedBadge}>
              <Feather name="check" size={m(12)} color="#16A34A" />
              <Text style={styles.verifiedText}>Verified Commercial Lender</Text>
            </View>
          </View>

          {/* Quick Metrics Strip */}
          <View style={styles.metricsRow}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Max Facility</Text>
              <Text style={styles.metricVal}>{formatINR(maxAmount)}</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Interest Rate</Text>
              <Text style={styles.metricVal}>{minRate}% - {maxRate}%</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Tenure</Text>
              <Text style={styles.metricVal}>{maxTenure} Mo</Text>
            </View>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.switcherBtn, activeTab === 'financial' && styles.activeSwitcherBtn]}
            onPress={() => setActiveTab('financial')}
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
            style={[styles.switcherBtn, activeTab === 'profile' && styles.activeSwitcherBtn]}
            onPress={() => setActiveTab('profile')}
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
            {/* Financing Terms Section */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Lending Terms & Parameters</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Repayment Mode:</Text>
                <Text style={styles.infoValue}>Monthly EMI / Amortizing</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Max Ticket Cap:</Text>
                <Text style={styles.infoValue}>{formatINR(maxAmount)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Annual Interest Rate:</Text>
                <Text style={styles.infoValue}>{minRate}% – {maxRate}% p.a.</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Max Facility Tenure:</Text>
                <Text style={styles.infoValue}>{maxTenure} Months</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Disbursal Verification:</Text>
                <Text style={styles.infoValue}>Mutual 6-Digit OTP</Text>
              </View>
            </View>

            {/* Criteria & Eligibility Section */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Eligibility & Supported Purposes</Text>
              <View style={styles.chipsContainer}>
                {[
                  'Working Capital Line',
                  'Machinery & Equipment',
                  'Business Expansion',
                  'Inventory Financing',
                  'Debt Refinancing',
                ].map((item) => (
                  <View key={item} style={styles.purposeChip}>
                    <Feather name="check" size={m(12)} color="#2563EB" />
                    <Text style={styles.purposeChipText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Institution Profile & Contact */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Official Contact & Compliance</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Official Email:</Text>
                <Text style={styles.infoValue}>{lender.email || 'partner@loanhub.in'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Verified Phone:</Text>
                <Text style={styles.infoValue}>{lender.mobileNo || '+91-XXXXXXXXXX'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Operational Location:</Text>
                <Text style={styles.infoValue}>
                  {lender.city ? `${lender.city}, ${lender.state || 'India'}` : 'Pan-India Operations'}
                </Text>
              </View>
              {lender.licenseNumber ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>NBFC / License No:</Text>
                  <Text style={styles.infoValue}>{lender.licenseNumber}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Operational Integrity</Text>
              <Text style={styles.bioText}>
                {lp.bio ||
                  'Institutional capital provider specializing in credit lines, merchant loans, and structured debt for SMEs.'}
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.applyNowBtn}
          onPress={() => navigation.navigate('BorrowerApply', { preselectedLender: lender })}
        >
          <Text style={styles.applyNowBtnText}>Apply for Loan with this Institution</Text>
          <Feather name="arrow-right" size={m(16)} color={colors.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: m(16),
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || m(24)) + m(10) : m(14),
    paddingBottom: m(14),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: m(15),
    fontWeight: '700',
    color: '#0F172A',
  },
  backIcon: {
    padding: m(4),
  },
  favHeaderBtn: {
    padding: m(4),
  },
  content: {
    padding: m(16),
    gap: m(14),
    paddingBottom: m(100),
  },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(20),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatar: {
    width: m(64),
    height: m(64),
    borderRadius: m(20),
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: m(12),
  },
  companyName: {
    fontSize: m(17),
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  badgeRow: {
    marginTop: m(4),
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: '#DCFCE7',
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(6),
  },
  verifiedText: {
    fontSize: m(11),
    color: '#16A34A',
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: m(12),
    padding: m(14),
    marginTop: m(16),
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  metricBox: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: m(9),
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  metricVal: {
    fontSize: m(13),
    fontWeight: '800',
    color: '#0F172A',
    marginTop: m(3),
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: m(12),
    padding: m(4),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: m(4),
  },
  switcherBtn: {
    flex: 1,
    paddingVertical: m(8),
    alignItems: 'center',
    borderRadius: m(8),
  },
  activeSwitcherBtn: {
    backgroundColor: '#0F172A',
  },
  switcherBtnText: {
    fontSize: m(12),
    fontWeight: '600',
    color: '#64748B',
  },
  activeSwitcherBtnText: {
    color: colors.white,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: m(14),
    padding: m(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: m(10),
  },
  sectionTitle: {
    fontSize: m(14),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: m(4),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: m(2),
  },
  infoLabel: {
    fontSize: m(12),
    color: '#64748B',
  },
  infoValue: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#0F172A',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(8),
    marginTop: m(4),
  },
  purposeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: '#EFF6FF',
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    borderRadius: m(8),
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  purposeChipText: {
    fontSize: m(11),
    fontWeight: '600',
    color: '#1E40AF',
  },
  bioText: {
    fontSize: m(12),
    color: '#475569',
    lineHeight: m(18),
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: m(16),
    paddingVertical: m(14),
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  applyNowBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(13),
    borderRadius: m(12),
    gap: m(8),
  },
  applyNowBtnText: {
    fontSize: m(14),
    fontWeight: '700',
    color: colors.white,
  },
  notFoundText: {
    fontSize: m(14),
    color: '#64748B',
  },
  backBtn: {
    marginTop: m(12),
    paddingHorizontal: m(16),
    paddingVertical: m(8),
    backgroundColor: '#2563EB',
    borderRadius: m(8),
  },
  backBtnText: {
    color: colors.white,
    fontWeight: '600',
  },
});
