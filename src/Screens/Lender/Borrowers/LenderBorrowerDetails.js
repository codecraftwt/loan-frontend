import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { m } from 'walstar-rn-responsive';
import { FontFamily, colors } from '../../../constants';
import lenderFlowService from '../../../Services/lenderFlowService';

export default function LenderBorrowerDetails() {
  const route = useRoute();
  const navigation = useNavigation();
  const { borrowerId, borrower: initialBorrower } = route.params || {};

  const [borrowerData, setBorrowerData] = useState(initialBorrower || null);
  const [loading, setLoading] = useState(!initialBorrower);

  const fetchBorrowerProfile = useCallback(async () => {
    try {
      if (borrowerId) {
        setLoading(true);
        const res = await lenderFlowService.getBorrowerDetails(borrowerId);
        if (res?.success && res.borrower) {
          setBorrowerData(res.borrower);
        }
      }
    } catch (err) {
      console.error('Error fetching borrower profile details:', err);
      Alert.alert('Error', 'Unable to retrieve borrower credit profile.');
    } finally {
      setLoading(false);
    }
  }, [borrowerId]);

  useEffect(() => {
    fetchBorrowerProfile();
  }, [fetchBorrowerProfile]);

  const formatINR = (val) => {
    if (!val && val !== 0) return '₹0';
    const num = Number(val) || 0;
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lakh`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const formatDate = (iso) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Contact actions
  const handleCall = (phone) => {
    if (!phone) {
      Alert.alert('No Contact', 'No phone number on record.');
      return;
    }
    Linking.openURL(`tel:${phone.replace(/\D/g, '')}`).catch(() => {
      Alert.alert('Error', 'Unable to initiate phone call.');
    });
  };

  const handleWhatsApp = (phone, name) => {
    if (!phone) {
      Alert.alert('No Contact', 'No phone number on record.');
      return;
    }
    const cleanNumber = phone.replace(/\D/g, '');
    const phoneWithCountry = cleanNumber.startsWith('91') ? cleanNumber : `91${cleanNumber}`;
    const textMsg = encodeURIComponent(
      `Hello ${name}, this is regarding our commercial lending partnership.`
    );
    const waUrl = `whatsapp://send?phone=${phoneWithCountry}&text=${textMsg}`;
    const webWaUrl = `https://wa.me/${phoneWithCountry}?text=${textMsg}`;

    Linking.canOpenURL(waUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(waUrl);
        } else {
          return Linking.openURL(webWaUrl);
        }
      })
      .catch(() => {
        Linking.openURL(webWaUrl).catch(() => {
          Alert.alert('Error', 'Unable to launch WhatsApp.');
        });
      });
  };

  const handleEmail = (email) => {
    if (!email) {
      Alert.alert('No Email', 'No email address available.');
      return;
    }
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert('Error', 'Unable to open email client.');
    });
  };

  if (loading || !borrowerData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={styles.loadingText}>Loading borrower credit dossier...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const b = borrowerData;
  const bProfile = b.borrowerProfile || {};
  const tradeName = bProfile.businessName || b.companyName || b.userName || 'Corporate Enterprise';
  const contactPerson = b.userName || 'Authorized Representative';
  const phone = b.mobileNo || '';
  const email = b.email || '';
  const creditScore = Number(bProfile.creditScore || 750);
  const riskGrade = bProfile.riskGrade || (creditScore >= 750 ? 'A' : creditScore >= 680 ? 'B' : 'C');
  const annualRevenue = Number(bProfile.annualRevenue || 0);
  const monthlyIncome = Number(bProfile.monthlyIncome || 0);

  const loans = b.loans || [];
  const totalLoansCount = b.totalLoansCount ?? loans.length;
  const totalSanctionedBook = b.totalLoanAmount ?? loans.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const totalRecovered = b.totalPaidAmount ?? loans.reduce((s, l) => s + (Number(l.totalPaid) || 0), 0);
  const totalOutstanding = b.totalRemainingAmount ?? loans.reduce((s, l) => s + (Number(l.remainingAmount || l.amount) || 0), 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={m(20)} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: m(10) }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {tradeName}
          </Text>
          <Text style={styles.headerSubtitle}>Borrower ID: #{b._id.slice(-6).toUpperCase()}</Text>
        </View>
        <View style={styles.kycPill}>
          <Feather name="shield" size={m(11)} color="#16a34a" />
          <Text style={styles.kycPillText}>KYC Verified</Text>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* ── 1. Hero Profile Banner ── */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroAvatar}>
              <Text style={styles.heroAvatarText}>{tradeName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTradeName} numberOfLines={1}>
                {tradeName}
              </Text>
              <Text style={styles.heroContactText}>Contact: {contactPerson}</Text>
              <Text style={styles.heroJoinedText}>Member since {formatDate(b.createdAt)}</Text>
            </View>
          </View>

          {/* Rating Assessment Box */}
          <View style={styles.cibilRatingBox}>
            <View>
              <Text style={styles.cibilRatingLabel}>CIBIL CREDIT ASSESSMENT</Text>
              <Text style={styles.cibilScoreText}>
                {creditScore} / 900{' '}
                <Text style={styles.cibilGradeText}>({riskGrade} Grade)</Text>
              </Text>
            </View>
            <View style={styles.riskBadge}>
              <Feather name="shield" size={m(12)} color="#15803d" />
              <Text style={styles.riskBadgeText}>
                {creditScore >= 750 ? 'Prime Risk' : 'Standard Risk'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── 2. Direct Contact Buttons ── */}
        <View style={styles.contactBar}>
          <TouchableOpacity
            style={styles.contactActionBtn}
            onPress={() => handleCall(phone)}
          >
            <Feather name="phone" size={m(16)} color="#2563eb" />
            <Text style={styles.contactActionText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactActionBtn, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}
            onPress={() => handleWhatsApp(phone, tradeName)}
          >
            <Feather name="message-circle" size={m(16)} color="#16a34a" />
            <Text style={[styles.contactActionText, { color: '#16a34a' }]}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactActionBtn}
            onPress={() => handleEmail(email)}
          >
            <Feather name="mail" size={m(16)} color="#475569" />
            <Text style={[styles.contactActionText, { color: '#475569' }]}>Email</Text>
          </TouchableOpacity>
        </View>

        {/* ── 3. Financial Portfolio KPI Grid ── */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>TOTAL FACILITIES</Text>
            <Text style={styles.kpiVal}>{totalLoansCount} Deals</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>SANCTIONED BOOK</Text>
            <Text style={styles.kpiValBold}>{formatINR(totalSanctionedBook)}</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>RECOVERED CAPITAL</Text>
            <Text style={[styles.kpiValBold, { color: '#16a34a' }]}>{formatINR(totalRecovered)}</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>ACTIVE OUTSTANDING</Text>
            <Text style={[styles.kpiValBold, { color: '#2563eb' }]}>{formatINR(totalOutstanding)}</Text>
          </View>
        </View>

        {/* ── 4. Enterprise & Statutory Details Card ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="briefcase" size={m(16)} color="#0f172a" />
            <Text style={styles.cardTitle}>Enterprise Statutory Details</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Trade / Entity Name</Text>
            <Text style={styles.detailValBold}>{tradeName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Constitution</Text>
            <Text style={styles.detailVal}>{bProfile.businessType || 'Private Limited Entity'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Employment / Nature</Text>
            <Text style={styles.detailVal}>{bProfile.employmentType || 'Self-Employed / Business'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Years in Business</Text>
            <Text style={styles.detailVal}>{bProfile.yearsInBusiness || 4} Years</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>PAN Card</Text>
            <Text style={styles.detailValMono}>{b.panCardNumber || 'Disclosed on File'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>GSTIN Registration</Text>
            <Text style={styles.detailValMono}>{bProfile.gstNumber || 'Active GST Registered'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Annual Turnover</Text>
            <Text style={styles.detailValBold}>
              {annualRevenue > 0 ? formatINR(annualRevenue) : 'Disclosed'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Net Monthly Cashflow</Text>
            <Text style={styles.detailValBold}>
              {monthlyIncome > 0 ? formatINR(monthlyIncome) : 'Disclosed'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Registered Address</Text>
            <Text style={[styles.detailVal, { flex: 1, textAlign: 'right', marginLeft: m(10) }]}>
              {bProfile.businessAddress || b.address || 'India'}
            </Text>
          </View>
        </View>

        {/* ── 5. Active Facilities List with this Lender ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="layers" size={m(16)} color="#2563eb" />
            <Text style={styles.cardTitle}>Partnered Loan Facilities</Text>
          </View>

          {loans.length === 0 ? (
            <View style={styles.emptyFacilitiesBox}>
              <Feather name="credit-card" size={m(28)} color="#cbd5e1" />
              <Text style={styles.emptyFacilitiesText}>
                No additional loan facilities on record for this borrower.
              </Text>
            </View>
          ) : (
            loans.map((item, index) => (
              <TouchableOpacity
                key={item._id || index}
                style={styles.facilityItem}
                onPress={() =>
                  navigation.navigate('LenderLoanDetails', {
                    loanId: item._id,
                    loan: item,
                  })
                }
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.facilityItemTitle}>
                    Facility #{item._id.slice(-6).toUpperCase()}
                  </Text>
                  <Text style={styles.facilityItemSub}>
                    Principal: {formatINR(item.amount || item.principal)} • {item.tenureMonths || 12} Mo
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.facilityItemAmount}>
                    {formatINR(item.remainingAmount || item.amount)}
                  </Text>
                  <Text style={styles.facilityItemRemainingLabel}>Outstanding</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(16),
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || m(24)) + m(10) : m(12),
    paddingBottom: m(12),
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  backBtn: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: m(16),
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: m(11),
    color: '#64748b',
    marginTop: m(1),
  },
  kycPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(8),
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  kycPillText: {
    fontSize: m(10),
    fontWeight: '800',
    color: '#16a34a',
    marginLeft: m(4),
  },
  container: { flex: 1 },
  scrollContent: {
    padding: m(16),
    paddingBottom: m(60),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: m(12),
    color: '#64748b',
    marginTop: m(10),
  },
  heroBanner: {
    backgroundColor: '#0f172a',
    borderRadius: m(20),
    padding: m(18),
    marginBottom: m(14),
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(14),
  },
  heroAvatar: {
    width: m(48),
    height: m(48),
    borderRadius: m(14),
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(12),
  },
  heroAvatarText: {
    fontSize: m(20),
    fontWeight: '800',
    color: '#ffffff',
  },
  heroTradeName: {
    fontSize: m(17),
    fontWeight: '800',
    color: '#ffffff',
  },
  heroContactText: {
    fontSize: m(12),
    color: '#94a3b8',
    marginTop: m(2),
  },
  heroJoinedText: {
    fontSize: m(11),
    color: '#64748b',
    marginTop: m(1),
  },
  cibilRatingBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: m(12),
    padding: m(12),
  },
  cibilRatingLabel: {
    fontSize: m(9),
    color: '#94a3b8',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cibilScoreText: {
    fontSize: m(18),
    fontWeight: '800',
    color: '#ffffff',
    marginTop: m(2),
  },
  cibilGradeText: {
    fontSize: m(12),
    fontWeight: '600',
    color: '#60a5fa',
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14532d',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(8),
  },
  riskBadgeText: {
    fontSize: m(10),
    fontWeight: '800',
    color: '#86efac',
    marginLeft: m(4),
  },
  contactBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: m(14),
  },
  contactActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: m(12),
    paddingVertical: m(12),
    marginHorizontal: m(4),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 1,
  },
  contactActionText: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#2563eb',
    marginLeft: m(6),
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: m(14),
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: m(14),
    padding: m(12),
    marginBottom: m(8),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
  },
  kpiLabel: {
    fontSize: m(9),
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  kpiVal: {
    fontSize: m(16),
    fontWeight: '800',
    color: '#0f172a',
    marginTop: m(4),
  },
  kpiValBold: {
    fontSize: m(16),
    fontWeight: '800',
    color: '#0f172a',
    marginTop: m(4),
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: m(16),
    padding: m(16),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(12),
  },
  cardTitle: {
    fontSize: m(13),
    fontWeight: '800',
    color: '#0f172a',
    marginLeft: m(6),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: m(8),
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: m(12),
    color: '#64748b',
  },
  detailVal: {
    fontSize: m(12),
    color: '#0f172a',
    fontWeight: '600',
  },
  detailValBold: {
    fontSize: m(13),
    color: '#0f172a',
    fontWeight: '800',
  },
  detailValMono: {
    fontSize: m(12),
    color: '#0f172a',
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  emptyFacilitiesBox: {
    alignItems: 'center',
    paddingVertical: m(16),
  },
  emptyFacilitiesText: {
    fontSize: m(12),
    color: '#94a3b8',
    marginTop: m(6),
    textAlign: 'center',
  },
  facilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: m(10),
    borderBottomWidth: 1,
    borderColor: '#f8fafc',
  },
  facilityItemTitle: {
    fontSize: m(13),
    fontWeight: '800',
    color: '#0f172a',
  },
  facilityItemSub: {
    fontSize: m(11),
    color: '#64748b',
    marginTop: m(2),
  },
  facilityItemAmount: {
    fontSize: m(14),
    fontWeight: '800',
    color: '#2563eb',
  },
  facilityItemRemainingLabel: {
    fontSize: m(10),
    color: '#94a3b8',
  },
});
