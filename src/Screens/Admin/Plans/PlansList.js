import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import {
  getAdminPlans,
  clearErrors,
} from '../../../Redux/Slices/adminPlanSlice';

/**
 * Format currency value
 */
const formatCurrency = value => {
  if (!value) return '₹0';
  const num = Number(value) || 0;
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export default function PlansList() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { plans, loading, error } = useSelector(state => state.adminPlans);

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'

  // Fetch plans
  const loadPlans = useCallback(() => {
    dispatch(getAdminPlans());
  }, [dispatch]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  useFocusEffect(
    useCallback(() => {
      loadPlans();
    }, [loadPlans])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(getAdminPlans()).finally(() => setRefreshing(false));
  }, [dispatch]);

  // Local filter
  const filteredPlans = useMemo(() => {
    return (plans || []).filter(plan => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (plan.planName || '').toLowerCase().includes(q) ||
        (plan.tag || '').toLowerCase().includes(q) ||
        (plan.duration || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const isActive = plan.isActive ?? true;
      if (statusFilter === 'active') return isActive;
      if (statusFilter === 'inactive') return !isActive;
      return true;
    });
  }, [plans, searchQuery, statusFilter]);

  const activePlansCount = (plans || []).filter(p => p.isActive ?? true).length;
  const totalPlansCount = (plans || []).length;

  const renderPlanCard = ({ item }) => {
    const isActive = item.isActive ?? true;
    const packPrice = Number(item.price || item.priceMonthly || 0);
    const durationDays =
      item.durationDays ||
      (item.duration === '1 year'
        ? 365
        : item.duration === '6 months'
        ? 180
        : item.duration === '3 months'
        ? 90
        : 30);
    const monthlyRate =
      item.priceMonthly || Math.round(packPrice / (durationDays / 30)) || packPrice;

    return (
      <View style={styles.planCard}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.planHeaderInfo}>
            <View style={styles.planTitleRow}>
              <Text style={styles.planName} numberOfLines={1}>
                {item.planName}
              </Text>
              {item.tag ? (
                <View style={styles.tagBadge}>
                  <Text style={styles.tagText}>{item.tag}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.durationText}>
              Duration: {item.duration} ({durationDays} days)
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              isActive ? styles.activeBadge : styles.inactiveBadge,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isActive ? '#16a34a' : '#dc2626' },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                isActive ? styles.activeText : styles.inactiveText,
              ]}
            >
              {isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {/* Pricing Area */}
        <View style={styles.pricingRow}>
          <View>
            <Text style={styles.priceLabel}>Plan Price</Text>
            <Text style={styles.packPriceText}>{formatCurrency(packPrice)}</Text>
          </View>
          <View style={styles.monthlyBox}>
            <Text style={styles.monthlyLabel}>Effective Monthly</Text>
            <Text style={styles.monthlyRateText}>{formatCurrency(monthlyRate)}/mo</Text>
          </View>
        </View>

        {/* Description */}
        {item.description ? (
          <Text style={styles.planDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        {/* Features / Quota Highlights */}
        <View style={styles.featureChipsRow}>
          <View style={styles.chip}>
            <Icon name="check" size={11} color="#16a34a" />
            <Text style={styles.chipText}>All Services Included</Text>
          </View>
          {(item.planFeatures?.advancedAnalytics || item.tier === 'pro' || item.tier === 'enterprise') && (
            <View style={styles.chip}>
              <Icon name="check" size={11} color="#2563eb" />
              <Text style={styles.chipText}>Analytics Suite</Text>
            </View>
          )}
          {(item.planFeatures?.prioritySupport || item.tier === 'enterprise') && (
            <View style={styles.chip}>
              <Icon name="check" size={11} color="#7c3aed" />
              <Text style={styles.chipText}>Priority Underwriting</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Action Buttons */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionBtnOutline}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CreateEditPlan', { plan: item, mode: 'edit' })}
          >
            <Icon name="edit-2" size={13} color="#2563eb" />
            <Text style={styles.actionBtnOutlineText}>Configure</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnSolid}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('PlanDetailsScreen', { plan: item })}
          >
            <Text style={styles.actionBtnSolidText}>Specifications</Text>
            <Icon name="chevron-right" size={14} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Subscription Plans" />

      {/* Top Search & Filter Bar */}
      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Icon name="search" size={18} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search plans by name, tier, duration..."
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

        <View style={styles.filterTabsRow}>
          <View style={styles.pillRow}>
            {[
              { id: 'all', label: 'All Tiers' },
              { id: 'active', label: 'Active Plans' },
              { id: 'inactive', label: 'Archived' },
            ].map(tab => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.pill,
                  statusFilter === tab.id && styles.activePill,
                ]}
                onPress={() => setStatusFilter(tab.id)}
              >
                <Text
                  style={[
                    styles.pillText,
                    statusFilter === tab.id && styles.activePillText,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Add Plan Shortcut */}
          <TouchableOpacity
            style={styles.createBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CreateEditPlan', { mode: 'create' })}
          >
            <Icon name="plus" size={14} color="#ffffff" />
            <Text style={styles.createBtnText}>Add Plan</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* KPI Overview Strip */}
      <View style={styles.statsStrip}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalPlansCount}</Text>
          <Text style={styles.statLabel}>Total Tiers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#16a34a' }]}>{activePlansCount}</Text>
          <Text style={styles.statLabel}>Active Pricing</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#2563eb' }]}>
            {totalPlansCount - activePlansCount}
          </Text>
          <Text style={styles.statLabel}>Inactive Tiers</Text>
        </View>
      </View>

      {/* Plans Feed */}
      {loading && !refreshing && (plans || []).length === 0 ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Fetching SaaS pricing tiers...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPlans}
          renderItem={renderPlanCard}
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
              <Icon name="layers" size={44} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Plans Available</Text>
              <Text style={styles.emptySubtitle}>
                Create and configure SaaS pricing packages for lenders.
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
  filterTabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: m(10),
  },
  pillRow: {
    flexDirection: 'row',
    gap: m(6),
  },
  pill: {
    paddingHorizontal: m(10),
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
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    borderRadius: m(8),
    gap: m(4),
  },
  createBtnText: {
    fontSize: m(11),
    fontWeight: '700',
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
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: m(14),
    padding: m(16),
    marginBottom: m(14),
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planHeaderInfo: {
    flex: 1,
    marginRight: m(8),
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: m(6),
  },
  planName: {
    fontSize: m(15),
    fontWeight: '700',
    color: '#0f172a',
  },
  tagBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: m(6),
    paddingVertical: m(2),
    borderRadius: m(4),
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  tagText: {
    fontSize: m(10),
    fontWeight: '700',
    color: '#1d4ed8',
  },
  durationText: {
    fontSize: m(11),
    color: '#64748b',
    marginTop: m(3),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(6),
    gap: m(4),
  },
  activeBadge: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  inactiveBadge: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  statusDot: {
    width: m(5),
    height: m(5),
    borderRadius: m(2.5),
  },
  statusText: {
    fontSize: m(10),
    fontWeight: '700',
  },
  activeText: {
    color: '#15803d',
  },
  inactiveText: {
    color: '#b91c1c',
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: m(10),
    padding: m(12),
    marginTop: m(12),
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  priceLabel: {
    fontSize: m(10),
    color: '#64748b',
    fontWeight: '600',
  },
  packPriceText: {
    fontSize: m(18),
    fontWeight: '800',
    color: '#0f172a',
    marginTop: m(2),
  },
  monthlyBox: {
    alignItems: 'flex-end',
  },
  monthlyLabel: {
    fontSize: m(10),
    color: '#64748b',
    fontWeight: '600',
  },
  monthlyRateText: {
    fontSize: m(13),
    fontWeight: '700',
    color: '#2563eb',
    marginTop: m(2),
  },
  planDesc: {
    fontSize: m(12),
    color: '#475569',
    marginTop: m(10),
    lineHeight: m(16),
  },
  featureChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(6),
    marginTop: m(10),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
    backgroundColor: '#f1f5f9',
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(6),
  },
  chipText: {
    fontSize: m(10),
    color: '#334155',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: m(12),
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
