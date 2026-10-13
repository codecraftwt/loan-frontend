import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import {
  getAdminBorrowers,
  setBorrowerFilters,
} from '../../../Redux/Slices/adminBorrowersSlice';

/**
 * Format currency value
 */
const formatCurrency = value => {
  if (!value) return '₹0';
  const num = Number(value) || 0;
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export default function AdminBorrowerList() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { borrowers, summary, loading } = useSelector(
    (state) => state.adminBorrowers
  );

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [kycTab, setKycTab] = useState('all'); // 'all' | 'verified' | 'unverified'
  const [loanTab, setLoanTab] = useState('all'); // 'all' | 'active' | 'overdue'

  const loadData = useCallback(() => {
    dispatch(
      getAdminBorrowers({
        search: searchQuery,
        kycStatus: kycTab,
        loanStatus: loanTab,
        limit: 100,
      })
    );
  }, [dispatch, searchQuery, kycTab, loanTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(
      getAdminBorrowers({
        search: searchQuery,
        kycStatus: kycTab,
        loanStatus: loanTab,
        limit: 100,
      })
    );
    setRefreshing(false);
  }, [dispatch, searchQuery, kycTab, loanTab]);

  // Local responsive filtering
  const filteredBorrowers = useMemo(() => {
    return borrowers.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      const name = (b.userName || b.name || b.borrowerName || '').toLowerCase();
      const email = (b.email || '').toLowerCase();
      const phone = (b.mobileNo || b.mobileNumber || b.phone || '').toString().toLowerCase();
      const aadhaar = (b.aadharCardNo || b.aadhaarNumber || '').toString().toLowerCase();
      const pan = (b.panCardNumber || b.digilockerKyc?.panNumber || b.panNumber || '').toLowerCase();

      const matchesSearch =
        !q ||
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        aadhaar.includes(q) ||
        pan.includes(q);

      if (!matchesSearch) return false;

      const isVerified = Boolean(
        b.digilockerKyc?.isVerified || b.aadhaarVerified || b.isAadhaarVerified || b.kycStatus === 'verified'
      );
      if (kycTab === 'verified' && !isVerified) return false;
      if (kycTab === 'unverified' && isVerified) return false;

      const hasActive = Boolean(b.hasActiveLoan || (b.activeLoansCount || 0) > 0 || (b.loans || []).length > 0);
      if (loanTab === 'active' && !hasActive) return false;
      if (loanTab === 'overdue' && !b.hasOverdueLoan) return false;

      return true;
    });
  }, [borrowers, searchQuery, kycTab, loanTab]);

  // High-level KPI Metrics
  const totalCount = summary?.totalBorrowers ?? borrowers.length;
  const verifiedCount =
    summary?.verifiedKycCount ??
    borrowers.filter(
      (b) =>
        b.digilockerKyc?.isVerified ||
        b.aadhaarVerified ||
        b.isAadhaarVerified ||
        b.kycStatus === 'verified'
    ).length;
  const activeExposuresCount =
    summary?.activeLoansTotal ??
    borrowers.filter((b) => b.hasActiveLoan || (b.activeLoansCount || 0) > 0).length;

  const renderBorrowerCard = ({ item }) => {
    const isKycVerified = Boolean(
      item.digilockerKyc?.isVerified ||
      item.aadhaarVerified ||
      item.isAadhaarVerified ||
      item.kycStatus === 'verified'
    );
    const displayName = item.userName || item.name || item.borrowerName || 'Anonymous Borrower';
    const email = item.email || 'No email';
    const phone = item.mobileNo || item.mobileNumber || item.phone || 'No phone';
    const initials = displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const creditScore = item.borrowerProfile?.creditScore || item.creditScore || '750';
    const exposureAmount = item.totalExposure || item.activeExposure || item.totalLoanAmount || 0;
    const activeFacilities = item.activeLoansCount || (item.loans || []).length || (item.hasActiveLoan ? 1 : 0);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate('AdminBorrowerDetailsScreen', {
            borrowerId: item._id || item.id,
            borrower: item,
          })
        }
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.borrowerName} numberOfLines={1}>
                {displayName}
              </Text>
              {isKycVerified ? (
                <View style={styles.verifiedBadge}>
                  <Icon name="check-circle" size={11} color="#16a34a" />
                  <Text style={styles.verifiedText}>DigiLocker KYC</Text>
                </View>
              ) : (
                <View style={styles.unverifiedBadge}>
                  <Icon name="clock" size={11} color="#d97706" />
                  <Text style={styles.unverifiedText}>KYC Pending</Text>
                </View>
              )}
            </View>
            <Text style={styles.contactText}>
              {email} • {phone}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Exposure & Credit Assessment Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Active Facilities</Text>
            <Text style={styles.statValue}>{activeFacilities}</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Credit Score</Text>
            <Text style={[styles.statValue, { color: '#2563eb' }]}>
              {creditScore}
            </Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Total Exposure</Text>
            <Text style={styles.statValue}>
              {formatCurrency(exposureAmount)}
            </Text>
          </View>
        </View>

        {/* View Dossier Action */}
        <View style={styles.footerRow}>
          <Text style={styles.borrowerIdText}>
            ID: #{item._id?.slice(-8).toUpperCase() || 'NEW'}
          </Text>
          <View style={styles.viewLink}>
            <Text style={styles.viewLinkText}>View Dossier</Text>
            <Icon name="chevron-right" size={14} color="#2563eb" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Borrowers Directory" />

      {/* Top Search & Filter Section */}
      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Icon name="search" size={18} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, phone, PAN, Aadhaar..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="x" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Instant KYC Filter Pills */}
        <View style={styles.pillRow}>
          {[
            { id: 'all', label: 'All KYC' },
            { id: 'verified', label: 'DigiLocker Verified' },
            { id: 'unverified', label: 'KYC Pending' },
          ].map((pill) => (
            <TouchableOpacity
              key={pill.id}
              style={[
                styles.pill,
                kycTab === pill.id && styles.activePill,
              ]}
              onPress={() => setKycTab(pill.id)}
            >
              <Text
                style={[
                  styles.pillText,
                  kycTab === pill.id && styles.activePillText,
                ]}
              >
                {pill.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* KPI Overview Strip */}
      <View style={styles.statsStrip}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalCount}</Text>
          <Text style={styles.statSubLabel}>Total Borrowers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#16a34a' }]}>{verifiedCount}</Text>
          <Text style={styles.statSubLabel}>DigiLocker Verified</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#2563eb' }]}>{activeExposuresCount}</Text>
          <Text style={styles.statSubLabel}>Active Facilities</Text>
        </View>
      </View>

      {/* Borrowers Feed */}
      {loading && !refreshing && borrowers.length === 0 ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Fetching borrowers directory...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBorrowers}
          renderItem={renderBorrowerCard}
          keyExtractor={(item, index) => item._id || item.id || String(index)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2563eb']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Icon name="users" size={44} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Borrowers Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'No borrower matching your search criteria.'
                  : 'Registered borrowers and credit dossiers will appear here.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  filterSection: {
    paddingHorizontal: m(16),
    paddingTop: m(12),
    paddingBottom: m(8),
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: m(10),
    paddingHorizontal: m(12),
    height: m(42),
  },
  searchIcon: {
    marginRight: m(8),
  },
  searchInput: {
    flex: 1,
    fontSize: m(13),
    color: '#0f172a',
    paddingVertical: 0,
  },
  pillRow: {
    flexDirection: 'row',
    gap: m(8),
    marginTop: m(10),
  },
  pill: {
    paddingHorizontal: m(12),
    paddingVertical: m(5),
    borderRadius: m(16),
    backgroundColor: '#f1f5f9',
  },
  activePill: {
    backgroundColor: '#2563eb',
  },
  pillText: {
    fontSize: m(11),
    fontWeight: '600',
    color: '#64748b',
  },
  activePillText: {
    color: '#ffffff',
  },
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: m(16),
    marginTop: m(12),
    paddingVertical: m(12),
    paddingHorizontal: m(16),
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: m(16),
    fontWeight: '800',
    color: '#0f172a',
  },
  statSubLabel: {
    fontSize: m(11),
    color: '#64748b',
    marginTop: m(2),
  },
  listContent: {
    padding: m(16),
    paddingBottom: m(80),
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: m(14),
    padding: m(14),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: m(44),
    height: m(44),
    borderRadius: m(22),
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(12),
  },
  avatarText: {
    fontSize: m(15),
    fontWeight: '700',
    color: '#4338ca',
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  borrowerName: {
    fontSize: m(14),
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    marginRight: m(6),
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: m(7),
    paddingVertical: m(2),
    borderRadius: m(6),
    borderWidth: 1,
    borderColor: '#bbf7d0',
    gap: m(3),
  },
  verifiedText: {
    fontSize: m(10),
    fontWeight: '700',
    color: '#16a34a',
  },
  unverifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: m(7),
    paddingVertical: m(2),
    borderRadius: m(6),
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: m(3),
  },
  unverifiedText: {
    fontSize: m(10),
    fontWeight: '700',
    color: '#d97706',
  },
  contactText: {
    fontSize: m(11),
    color: '#64748b',
    marginTop: m(2),
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: m(10),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: m(10),
    color: '#94a3b8',
    marginBottom: m(2),
  },
  statValue: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#1e293b',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: m(10),
    paddingTop: m(8),
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  borrowerIdText: {
    fontSize: m(10),
    color: '#94a3b8',
    fontWeight: '600',
  },
  viewLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(2),
  },
  viewLinkText: {
    fontSize: m(11),
    fontWeight: '700',
    color: '#2563eb',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: m(8),
    fontSize: m(13),
    color: '#64748b',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: m(60),
  },
  emptyTitle: {
    fontSize: m(15),
    fontWeight: '700',
    color: '#475569',
    marginTop: m(10),
  },
  emptySubtitle: {
    fontSize: m(12),
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: m(4),
    paddingHorizontal: m(30),
  },
});
