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
import Icon from 'react-native-vector-icons/Feather';
import { m } from 'walstar-rn-responsive';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Header from '../../../Components/Header';
import {
  getLendersWithPlans,
  setFilters,
} from '../../../Redux/Slices/adminLendersSlice';

/**
 * Format currency value to Indian Rupee format
 */
const formatCurrency = value => {
  if (!value) return '₹0';
  const num = Number(value) || 0;
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

/**
 * Format date string to readable format
 */
const formatDate = dateString => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};

export default function LenderList() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { lenders, loading, error, filters } = useSelector(
    state => state.adminLenders,
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch lenders on load
  const loadData = useCallback(() => {
    dispatch(
      getLendersWithPlans({
        search: searchQuery,
        planStatus: selectedStatusTab,
        limit: 100,
      })
    );
  }, [dispatch, searchQuery, selectedStatusTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(
      getLendersWithPlans({
        search: searchQuery,
        planStatus: selectedStatusTab,
        limit: 100,
      })
    );
    setRefreshing(false);
  }, [dispatch, searchQuery, selectedStatusTab]);

  // Filter lenders locally as well for instantaneous responsive search
  const filteredLenders = useMemo(() => {
    return lenders.filter(item => {
      const lender = item.lender || item;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (lender.userName || lender.name || '').toLowerCase().includes(q) ||
        (lender.email || '').toLowerCase().includes(q) ||
        (lender.mobileNo || lender.phone || '').toString().toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const isPlanActive = Boolean(item.planPurchaseDetails?.isPlanActive);
      if (selectedStatusTab === 'active') return isPlanActive;
      if (selectedStatusTab === 'expired') return !isPlanActive;
      return true;
    });
  }, [lenders, searchQuery, selectedStatusTab]);

  // Statistics
  const totalLenders = lenders.length;
  const activeCount = lenders.filter(
    l => Boolean(l.planPurchaseDetails?.isPlanActive)
  ).length;
  const expiredCount = totalLenders - activeCount;

  const renderLenderItem = ({ item }) => {
    const lender = item.lender || item;
    const plan = item.currentPlan || {};
    const planDetails = item.planPurchaseDetails || {};
    const isPlanActive = Boolean(planDetails.isPlanActive);

    const initials = (lender.userName || lender.name || 'LN')
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.lenderName} numberOfLines={1}>
                {lender.userName || lender.name || 'Institutional Lender'}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  isPlanActive ? styles.activeBadge : styles.expiredBadge,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isPlanActive ? '#16a34a' : '#dc2626' },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    isPlanActive ? styles.activeText : styles.expiredText,
                  ]}
                >
                  {isPlanActive ? 'Active Plan' : 'Expired / Free'}
                </Text>
              </View>
            </View>
            <Text style={styles.contactText}>
              {lender.email || 'No email'} • {lender.mobileNo || lender.phone || 'No phone'}
            </Text>
          </View>
        </View>

        {/* Current Plan Details */}
        {plan.planName ? (
          <View style={styles.planBox}>
            <View style={styles.planHeader}>
              <Icon name="package" size={14} color="#2563eb" />
              <Text style={styles.planTitle}>{plan.planName}</Text>
              <Text style={styles.planPrice}>
                {formatCurrency(plan.priceMonthly || plan.price)}/{plan.duration || 'month'}
              </Text>
            </View>
            <View style={styles.planMetaRow}>
              <Text style={styles.planMetaText}>
                Expires: {formatDate(planDetails.planExpiryDate)}
              </Text>
              {isPlanActive && planDetails.remainingDays !== undefined && (
                <Text style={styles.remainingText}>
                  {planDetails.remainingDays} days left
                </Text>
              )}
            </View>
          </View>
        ) : null}

        <View style={styles.divider} />

        {/* Actions Row */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionBtnOutline}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate('AdminLenderSubscriptionHistory', {
                lenderId: lender._id || lender.id,
                lenderName: lender.userName || lender.name || 'Institutional Lender',
              })
            }
          >
            <Icon name="clock" size={13} color="#2563eb" />
            <Text style={styles.actionBtnOutlineText}>Ledger</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnSolid}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate('LenderDetailsScreen', {
                lenderData: item,
              })
            }
          >
            <Text style={styles.actionBtnSolidText}>View Details</Text>
            <Icon name="chevron-right" size={14} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Lending Institutions" />

      {/* Top Search & Filter Bar */}
      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Icon name="search" size={18} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by lender name, email, phone..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="x" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Instant Filter Tabs */}
        <View style={styles.tabRow}>
          {[
            { id: 'all', label: 'All Plans' },
            { id: 'active', label: 'Active Plans' },
            { id: 'expired', label: 'Expired / Inactive' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabBtn,
                selectedStatusTab === tab.id && styles.activeTabBtn,
              ]}
              onPress={() => setSelectedStatusTab(tab.id)}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  selectedStatusTab === tab.id && styles.activeTabBtnText,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* KPI Metrics Strip */}
      <View style={styles.statsStrip}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalLenders}</Text>
          <Text style={styles.statLabel}>Total Lenders</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#16a34a' }]}>{activeCount}</Text>
          <Text style={styles.statLabel}>Active Plans</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#64748b' }]}>{expiredCount}</Text>
          <Text style={styles.statLabel}>Expired / Free</Text>
        </View>
      </View>

      {/* List */}
      {loading && !refreshing && lenders.length === 0 ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading institutional lenders...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLenders}
          renderItem={renderLenderItem}
          keyExtractor={(item, index) =>
            item.lender?._id || item._id || String(index)
          }
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
              <Icon name="briefcase" size={44} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Lenders Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'No lenders matched your search criteria.'
                  : 'Registered institutional lenders will appear here.'}
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
  tabRow: {
    flexDirection: 'row',
    gap: m(8),
    marginTop: m(10),
  },
  tabBtn: {
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(20),
    backgroundColor: '#f1f5f9',
  },
  activeTabBtn: {
    backgroundColor: '#2563eb',
  },
  tabBtnText: {
    fontSize: m(12),
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabBtnText: {
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
  statLabel: {
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
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(12),
  },
  avatarText: {
    fontSize: m(15),
    fontWeight: '700',
    color: '#1d4ed8',
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lenderName: {
    fontSize: m(14),
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    marginRight: m(8),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(7),
    paddingVertical: m(3),
    borderRadius: m(6),
    gap: m(4),
  },
  activeBadge: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  expiredBadge: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  statusDot: {
    width: m(6),
    height: m(6),
    borderRadius: m(3),
  },
  statusText: {
    fontSize: m(10),
    fontWeight: '700',
  },
  activeText: {
    color: '#15803d',
  },
  expiredText: {
    color: '#b91c1c',
  },
  contactText: {
    fontSize: m(11),
    color: '#64748b',
    marginTop: m(2),
  },
  planBox: {
    backgroundColor: '#f8fafc',
    borderRadius: m(8),
    padding: m(10),
    marginTop: m(10),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planTitle: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    marginLeft: m(6),
  },
  planPrice: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#2563eb',
  },
  planMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: m(4),
  },
  planMetaText: {
    fontSize: m(11),
    color: '#64748b',
  },
  remainingText: {
    fontSize: m(11),
    fontWeight: '600',
    color: '#16a34a',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: m(10),
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: m(8),
  },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(6),
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    gap: m(4),
  },
  actionBtnOutlineText: {
    fontSize: m(11),
    fontWeight: '700',
    color: '#1d4ed8',
  },
  actionBtnSolid: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(6),
    backgroundColor: '#2563eb',
    gap: m(4),
  },
  actionBtnSolidText: {
    fontSize: m(11),
    fontWeight: '700',
    color: '#ffffff',
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
