import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { m } from 'walstar-rn-responsive';
import { colors } from '../../../constants';
import borrowerFlowService from '../../../Services/borrowerFlowService';

export default function BorrowerExploreLenders() {
  const navigation = useNavigation();
  const [lenders, setLenders] = useState([]);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState('all'); // 'all' | 'favorites'

  const fetchLenders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await borrowerFlowService.getLenders({
        search: searchQuery,
        onlyFavorites: activeFilterTab === 'favorites',
      });
      if (res?.success) {
        setLenders(res.lenders || []);
        if (res.favoriteCount !== undefined) {
          setFavoriteCount(res.favoriteCount);
        }
      }
    } catch (err) {
      console.error('Error fetching lenders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, activeFilterTab]);

  useEffect(() => {
    fetchLenders();
  }, [fetchLenders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLenders();
  };

  const handleToggleFavorite = async (lenderId) => {
    // Optimistic UI update
    setLenders((prev) =>
      prev.map((l) => (l._id === lenderId ? { ...l, isFavorite: !l.isFavorite } : l))
    );
    try {
      const res = await borrowerFlowService.toggleFavoriteLender(lenderId);
      if (res?.success && res.favoriteCount !== undefined) {
        setFavoriteCount(res.favoriteCount);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      // Revert if error
      setLenders((prev) =>
        prev.map((l) => (l._id === lenderId ? { ...l, isFavorite: !l.isFavorite } : l))
      );
    }
  };

  const formatINR = (val) => {
    if (!val) return '₹0';
    const num = Number(val);
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lakh`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const renderLenderItem = ({ item }) => {
    const lp = item.lenderProfile || {};
    const maxAmount = lp.maxLoanAmount || 5000000;
    const minRate = lp.minInterestRate || 10.5;
    const maxRate = lp.maxInterestRate || 16.0;
    const maxTenure = lp.maxTenureMonths || 36;
    const isFav = !!item.isFavorite;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Feather name="shield" size={m(20)} color="#2563EB" />
          </View>
          <View style={styles.headerInfo}>
            <View style={styles.companyRow}>
              <Text style={styles.companyName} numberOfLines={1}>
                {item.companyName || item.userName || 'Institutional Lender'}
              </Text>
              <View style={styles.verifiedBadge}>
                <Feather name="check" size={m(10)} color="#16A34A" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
            <Text style={styles.contactText}>
              {item.city ? `${item.city}, ${item.state || 'India'}` : 'Commercial Lending Partner'}
            </Text>
          </View>

          {/* Heart Favorite Toggle */}
          <TouchableOpacity
            style={[styles.favBtn, isFav && styles.activeFavBtn]}
            onPress={() => handleToggleFavorite(item._id)}
          >
            <Feather
              name="heart"
              size={m(16)}
              color={isFav ? '#EF4444' : '#94A3B8'}
            />
          </TouchableOpacity>
        </View>

        {/* Metrics Grid */}
        <View style={styles.cardBody}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Max Facility</Text>
            <Text style={styles.metricValue}>{formatINR(maxAmount)}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Interest Range</Text>
            <Text style={styles.metricValue}>{minRate}% - {maxRate}%</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Max Tenure</Text>
            <Text style={styles.metricValue}>{maxTenure} Mo</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.detailsBtn}
            onPress={() => navigation.navigate('BorrowerLenderDetails', { id: item._id })}
          >
            <Text style={styles.detailsBtnText}>View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => navigation.navigate('BorrowerApply', { preselectedLender: item })}
          >
            <Text style={styles.applyBtnText}>Apply Now</Text>
            <Feather name="arrow-right" size={m(14)} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Explore Verified Lenders</Text>
          <Text style={styles.headerSubtitle}>
            Browse institutions, compare credit terms, and apply directly.
          </Text>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={m(18)} color="#94A3B8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by institution name, city, or bio..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={fetchLenders}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Feather name="x" size={m(18)} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeFilterTab === 'all' && styles.activeTabBtn]}
          onPress={() => setActiveFilterTab('all')}
        >
          <Text style={[styles.tabBtnText, activeFilterTab === 'all' && styles.activeTabBtnText]}>
            All Institutions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeFilterTab === 'favorites' && styles.activeTabBtn]}
          onPress={() => setActiveFilterTab('favorites')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: m(4) }}>
            <Feather
              name="heart"
              size={m(12)}
              color={activeFilterTab === 'favorites' ? colors.white : '#EF4444'}
            />
            <Text
              style={[styles.tabBtnText, activeFilterTab === 'favorites' && styles.activeTabBtnText]}
            >
              Favorites ({favoriteCount})
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Lenders List */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={lenders}
          keyExtractor={(item) => item._id}
          renderItem={renderLenderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="users" size={m(42)} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Lenders Found</Text>
              <Text style={styles.emptyText}>
                {activeFilterTab === 'favorites'
                  ? "You haven't bookmarked any favorite lenders yet."
                  : 'Try adjusting your search criteria.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: m(16),
    paddingTop: m(14),
    paddingBottom: m(8),
  },
  headerTitle: {
    fontSize: m(18),
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: m(12),
    color: '#64748B',
    marginTop: m(2),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: m(16),
    marginTop: m(8),
    paddingHorizontal: m(12),
    paddingVertical: m(10),
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: m(8),
  },
  searchInput: {
    flex: 1,
    fontSize: m(13),
    color: '#0F172A',
    padding: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: m(16),
    marginTop: m(12),
    gap: m(8),
  },
  tabBtn: {
    paddingHorizontal: m(14),
    paddingVertical: m(7),
    borderRadius: m(20),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeTabBtn: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  tabBtnText: {
    fontSize: m(12),
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabBtnText: {
    color: colors.white,
  },
  listContent: {
    padding: m(16),
    gap: m(12),
    paddingBottom: m(90),
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(12),
  },
  avatar: {
    width: m(42),
    height: m(42),
    borderRadius: m(12),
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  companyName: {
    fontSize: m(14),
    fontWeight: '700',
    color: '#0F172A',
    flexShrink: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(2),
    backgroundColor: '#DCFCE7',
    paddingHorizontal: m(5),
    paddingVertical: m(1.5),
    borderRadius: m(4),
  },
  verifiedText: {
    fontSize: m(9),
    fontWeight: '700',
    color: '#16A34A',
  },
  contactText: {
    fontSize: m(11),
    color: '#64748B',
    marginTop: m(2),
  },
  favBtn: {
    width: m(32),
    height: m(32),
    borderRadius: m(8),
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeFavBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: m(12),
    padding: m(12),
    marginTop: m(12),
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: m(9),
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: m(13),
    fontWeight: '800',
    color: '#0F172A',
    marginTop: m(2),
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: m(8),
    marginTop: m(14),
  },
  detailsBtn: {
    paddingHorizontal: m(14),
    paddingVertical: m(8),
    borderRadius: m(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: colors.white,
  },
  detailsBtnText: {
    fontSize: m(12),
    fontWeight: '600',
    color: '#334155',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
    backgroundColor: '#2563EB',
    paddingHorizontal: m(14),
    paddingVertical: m(8),
    borderRadius: m(10),
  },
  applyBtnText: {
    fontSize: m(12),
    fontWeight: '700',
    color: colors.white,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(60),
    gap: m(8),
  },
  emptyTitle: {
    fontSize: m(15),
    fontWeight: '700',
    color: '#0F172A',
  },
  emptyText: {
    fontSize: m(12),
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: m(30),
  },
});
