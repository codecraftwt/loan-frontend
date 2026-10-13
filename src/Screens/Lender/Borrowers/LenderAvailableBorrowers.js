import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { m } from 'walstar-rn-responsive';
import { FontFamily, colors } from '../../../constants';
import lenderFlowService from '../../../Services/lenderFlowService';

export default function LenderAvailableBorrowers() {
  const navigation = useNavigation();
  const [borrowers, setBorrowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'prime' | 'high_revenue'

  const fetchBorrowers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        search: search.trim() || undefined,
      };

      if (activeFilter === 'prime') {
        params.minCreditScore = 750;
      }

      const res = await lenderFlowService.getAvailableBorrowers(params);
      if (res?.success && res.borrowers) {
        setBorrowers(res.borrowers);
      } else {
        setBorrowers([]);
      }
    } catch (err) {
      console.error('Error fetching connected borrowers:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, activeFilter]);

  useFocusEffect(
    useCallback(() => {
      fetchBorrowers();
    }, [fetchBorrowers])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBorrowers();
  };

  const formatINR = (val) => {
    if (!val && val !== 0) return '₹0';
    const num = Number(val) || 0;
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lakh`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  // WhatsApp shortcut
  const handleOpenWhatsApp = (mobileNo, name) => {
    if (!mobileNo) {
      Alert.alert('No Contact', 'No mobile number recorded for this borrower.');
      return;
    }
    const cleanNumber = mobileNo.replace(/\D/g, '');
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

  // Call shortcut
  const handleCall = (mobileNo) => {
    if (!mobileNo) {
      Alert.alert('No Contact', 'No phone number available.');
      return;
    }
    Linking.openURL(`tel:${mobileNo.replace(/\D/g, '')}`).catch(() => {
      Alert.alert('Error', 'Unable to initiate call.');
    });
  };

  const filteredBorrowers = useMemo(() => {
    if (activeFilter === 'high_revenue') {
      return borrowers.filter((b) => (Number(b.borrowerProfile?.annualRevenue) || 0) >= 2500000);
    }
    return borrowers;
  }, [borrowers, activeFilter]);

  const renderItem = ({ item }) => {
    const bProfile = item.borrowerProfile || {};
    const tradeName = bProfile.businessName || item.companyName || item.userName || 'Corporate Entity';
    const contactName = item.userName || 'Authorized Representative';
    const creditScore = Number(bProfile.creditScore || 750);
    const riskGrade = bProfile.riskGrade || (creditScore >= 750 ? 'A' : creditScore >= 680 ? 'B' : 'C');
    const revenue = bProfile.annualRevenue ? Number(bProfile.annualRevenue) : 0;
    const vintage = bProfile.yearsInBusiness !== undefined ? bProfile.yearsInBusiness : 3;
    const phone = item.mobileNo || '';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('LenderBorrowerDetails', {
            borrowerId: item._id,
            borrower: item,
          })
        }
        activeOpacity={0.7}
      >
        {/* Header Row */}
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{tradeName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, marginRight: m(8) }}>
            <Text style={styles.tradeName} numberOfLines={1}>
              {tradeName}
            </Text>
            <Text style={styles.contactName} numberOfLines={1}>
              Contact: {contactName}
            </Text>
          </View>

          {/* Credit Score Badge */}
          <View
            style={[
              styles.scoreBadge,
              creditScore >= 750 ? styles.scoreBadgeGreen : styles.scoreBadgeAmber,
            ]}
          >
            <Feather
              name="shield"
              size={m(11)}
              color={creditScore >= 750 ? '#16a34a' : '#d97706'}
            />
            <Text
              style={[
                styles.scoreText,
                creditScore >= 750 ? styles.scoreTextGreen : styles.scoreTextAmber,
              ]}
            >
              CIBIL {creditScore} ({riskGrade})
            </Text>
          </View>
        </View>

        {/* Business Key Metrics Strip */}
        <View style={styles.metricsStrip}>
          <View>
            <Text style={styles.metricLabel}>Constitution</Text>
            <Text style={styles.metricVal} numberOfLines={1}>
              {bProfile.businessType || 'Pvt Limited'}
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.metricLabel}>Annual Revenue</Text>
            <Text style={styles.metricValBold}>
              {revenue > 0 ? formatINR(revenue) : 'Verified'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.metricLabel}>Vintage</Text>
            <Text style={styles.metricVal}>{vintage} Years</Text>
          </View>
        </View>

        {/* Location & KYC Banner */}
        <View style={styles.subInfoRow}>
          <View style={styles.locationWrap}>
            <Feather name="map-pin" size={m(12)} color="#64748b" />
            <Text style={styles.locationText} numberOfLines={1}>
              {bProfile.businessCity || item.address || 'India'}
            </Text>
          </View>

          <View style={styles.kycTag}>
            <Feather name="check-circle" size={m(11)} color="#16a34a" />
            <Text style={styles.kycTagText}>DigiLocker KYC</Text>
          </View>
        </View>

        {/* Card Footer: Quick Contact & View Profile */}
        <View style={styles.cardFooter}>
          <View style={styles.contactButtonsRow}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => handleCall(phone)}
              title="Call"
            >
              <Feather name="phone" size={m(13)} color="#2563eb" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}
              onPress={() => handleOpenWhatsApp(phone, tradeName)}
              title="WhatsApp"
            >
              <Feather name="message-circle" size={m(13)} color="#15803d" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() =>
              navigation.navigate('LenderBorrowerDetails', {
                borrowerId: item._id,
                borrower: item,
              })
            }
          >
            <Text style={styles.profileBtnText}>Credit Dossier</Text>
            <Feather name="chevron-right" size={m(14)} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Connected Borrowers</Text>
          <Text style={styles.subtitle}>Verified Credit Profiles in Your Network</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} disabled={loading}>
          <Feather name="refresh-cw" size={m(16)} color="#0f172a" />
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Feather name="search" size={m(18)} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by company, contact, or city..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={fetchBorrowers}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Feather name="x" size={m(16)} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {[
          { key: 'all', label: 'All Partners' },
          { key: 'prime', label: 'Prime (750+ CIBIL)' },
          { key: 'high_revenue', label: 'High Turnover' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterChip, activeFilter === tab.key && styles.activeFilterChip]}
            onPress={() => setActiveFilter(tab.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === tab.key && styles.activeFilterChipText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={styles.loadingText}>Loading borrower directory...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBorrowers}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f172a']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="users" size={m(48)} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Connected Borrowers</Text>
              <Text style={styles.emptySubtitle}>
                Borrowers whose loan requests you sanction and partner with will appear here.
              </Text>
            </View>
          }
        />
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: m(16),
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || m(24)) + m(8) : m(16),
    paddingBottom: m(10),
  },
  title: {
    fontSize: m(22),
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: FontFamily.primaryBold,
  },
  subtitle: {
    fontSize: m(12),
    color: '#64748b',
    marginTop: m(2),
  },
  refreshBtn: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: m(12),
    marginHorizontal: m(16),
    marginBottom: m(10),
    paddingHorizontal: m(12),
    height: m(44),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    marginLeft: m(8),
    fontSize: m(13),
    color: '#0f172a',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: m(16),
    marginBottom: m(12),
  },
  filterChip: {
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(18),
    backgroundColor: '#f1f5f9',
    marginRight: m(6),
  },
  activeFilterChip: {
    backgroundColor: '#0f172a',
  },
  filterChipText: {
    fontSize: m(11),
    fontWeight: '700',
    color: '#64748b',
  },
  activeFilterChipText: {
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: m(16),
    paddingBottom: m(100),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: m(12),
    color: '#64748b',
    marginTop: m(8),
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: m(16),
    padding: m(16),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(12),
  },
  avatar: {
    width: m(40),
    height: m(40),
    borderRadius: m(12),
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(10),
  },
  avatarText: {
    fontSize: m(17),
    fontWeight: '800',
    color: '#2563eb',
  },
  tradeName: {
    fontSize: m(15),
    fontWeight: '800',
    color: '#0f172a',
  },
  contactName: {
    fontSize: m(11),
    color: '#64748b',
    marginTop: m(2),
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(8),
    borderWidth: 1,
  },
  scoreBadgeGreen: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  scoreTextGreen: {
    color: '#16a34a',
    fontSize: m(10),
    fontWeight: '800',
    marginLeft: m(4),
  },
  scoreBadgeAmber: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  scoreTextAmber: {
    color: '#d97706',
    fontSize: m(10),
    fontWeight: '800',
    marginLeft: m(4),
  },
  metricsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    padding: m(12),
    marginBottom: m(10),
  },
  metricLabel: {
    fontSize: m(10),
    color: '#64748b',
    fontWeight: '600',
  },
  metricVal: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#0f172a',
    marginTop: m(2),
  },
  metricValBold: {
    fontSize: m(13),
    fontWeight: '800',
    color: '#2563eb',
    marginTop: m(2),
  },
  subInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(12),
  },
  locationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    fontSize: m(11),
    color: '#64748b',
    marginLeft: m(4),
  },
  kycTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: m(6),
    paddingVertical: m(2),
    borderRadius: m(6),
  },
  kycTagText: {
    fontSize: m(10),
    fontWeight: '700',
    color: '#16a34a',
    marginLeft: m(3),
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
    paddingTop: m(10),
  },
  contactButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: m(32),
    height: m(32),
    borderRadius: m(8),
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(6),
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: m(12),
    paddingVertical: m(7),
    borderRadius: m(8),
  },
  profileBtnText: {
    fontSize: m(11),
    fontWeight: '700',
    color: '#ffffff',
    marginRight: m(4),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(60),
  },
  emptyTitle: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#0f172a',
    marginTop: m(12),
  },
  emptySubtitle: {
    fontSize: m(12),
    color: '#64748b',
    marginTop: m(4),
    textAlign: 'center',
    paddingHorizontal: m(24),
  },
});
