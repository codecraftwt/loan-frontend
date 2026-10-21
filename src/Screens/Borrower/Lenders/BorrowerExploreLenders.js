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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { colors, FontFamily } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper } from '../../../Components/common';
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
        {/* Header Row */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.lenderIconCircle}>
            <Feather name="briefcase" size={m(17)} color={colors.white} />
          </View>

          <View style={styles.lenderInfoCol}>
            <View style={styles.companyNameRow}>
              <Text style={styles.companyNameText} numberOfLines={1}>
                {item.companyName || item.userName || 'Institutional Lender'}
              </Text>
              <View style={styles.verifiedBadge}>
                <Feather name="check-circle" size={m(11)} color="#059669" />
                <Text style={styles.verifiedBadgeText}>Verified</Text>
              </View>
            </View>

            <Text style={styles.locationText} numberOfLines={1}>
              {item.city ? `${item.city}, ${item.state || 'India'}` : 'Institutional Capital Partner'}
            </Text>
          </View>

          {/* Bookmark Button */}
          <TouchableOpacity
            style={[styles.favBtn, isFav && styles.favBtnActive]}
            activeOpacity={0.8}
            onPress={() => handleToggleFavorite(item._id)}
          >
            <Feather
              name="bookmark"
              size={m(15)}
              color={isFav ? colors.lettersAndIcons : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Compact Metrics Strip - Neutral Slate-50 (#F8FAFC) */}
        <View style={styles.metricsBox}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Max Facility</Text>
            <Text style={styles.metricValueBold}>{formatINR(maxAmount)}</Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Indicative APR</Text>
            <Text style={styles.metricValue}>
              {minRate}% - {maxRate}%
            </Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Tenure Cap</Text>
            <Text style={styles.metricValue}>{maxTenure} Mo</Text>
          </View>
        </View>

        {/* Card Actions */}
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={styles.detailsBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('BorrowerLenderDetails', { id: item._id })}
          >
            <Text style={styles.detailsBtnText}>View Terms</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.applyBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('BorrowerApply', { preselectedLender: item })}
          >
            <Text style={styles.applyBtnText}>Apply Facility</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper
      backgroundColor={colors.backgroundGreenWhite}
      topInsetBg={colors.primary}
      statusBarColor={colors.primary}
      statusBarStyle="dark-content"
      includeTabBarClearance={true}
      scrollable={false}
    >
      {/* Top Green Banner */}
      <View style={styles.topBanner}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTag}>CAPITAL NETWORK</Text>
            <Text style={styles.headerTitle}>Explore Lenders</Text>
            <Text style={styles.headerSubtitle}>
              Browse institutions, compare credit terms & apply directly
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={onRefresh}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Feather name="refresh-cw" size={m(17)} color={colors.lettersAndIcons} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Curved Body Section */}
      <View style={styles.sheetSection}>
        {/* Search Input Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={m(16)} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by institution name, city, or bio..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={fetchLenders}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={m(16)} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Capsule Filter Tabs */}
        <View style={styles.periodCapsuleRow}>
          <TouchableOpacity
            style={[
              styles.periodTab,
              activeFilterTab === 'all' && styles.periodTabActive,
            ]}
            onPress={() => setActiveFilterTab('all')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.periodTabText,
                activeFilterTab === 'all' && styles.periodTabTextActive,
              ]}
            >
              All Institutions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.periodTab,
              activeFilterTab === 'favorites' && styles.periodTabActive,
            ]}
            onPress={() => setActiveFilterTab('favorites')}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: m(4) }}>
              <Feather
                name="bookmark"
                size={m(12)}
                color={activeFilterTab === 'favorites' ? colors.lettersAndIcons : colors.textSecondary}
              />
              <Text
                style={[
                  styles.periodTabText,
                  activeFilterTab === 'favorites' && styles.periodTabTextActive,
                ]}
              >
                Bookmarks ({favoriteCount})
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Lenders List */}
        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.lettersAndIcons} />
            <Text style={styles.loadingText}>Fetching institutional network...</Text>
          </View>
        ) : (
          <FlatList
            data={lenders}
            keyExtractor={(item) => item._id}
            renderItem={renderLenderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.lettersAndIcons]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="users" size={m(36)} color={colors.primary} />
                <Text style={styles.emptyTitle}>No Institutions Found</Text>
                <Text style={styles.emptySubtitle}>
                  {activeFilterTab === 'favorites'
                    ? "You haven't bookmarked any favorite lenders yet."
                    : 'Try clearing your search query to see all available partners.'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  // Top Green Banner
  topBanner: {
    backgroundColor: colors.primary,
    paddingHorizontal: m(20),
    paddingTop: m(12),
    paddingBottom: m(20),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTag: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: 0.8,
    opacity: 0.85,
    marginBottom: m(2),
  },
  headerTitle: {
    fontSize: m(22),
    lineHeight: m(28),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  headerSubtitle: {
    fontSize: m(12),
    lineHeight: m(16),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
    opacity: 0.9,
    marginTop: m(2),
  },
  refreshBtn: {
    width: m(42),
    height: m(42),
    borderRadius: m(21),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // Main Curved Sheet
  sheetSection: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(32),
    borderTopRightRadius: m(32),
    paddingTop: m(16),
  },

  // Search Input Container
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: m(16),
    marginHorizontal: m(18),
    marginBottom: m(12),
    paddingHorizontal: m(14),
    height: m(44),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
  },
  searchInput: {
    flex: 1,
    marginLeft: m(8),
    fontSize: m(13),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
  },

  // Capsule Filter Tabs
  periodCapsuleRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: m(24),
    padding: m(4),
    marginHorizontal: m(18),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
  },
  periodTab: {
    flex: 1,
    paddingVertical: m(7),
    borderRadius: m(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodTabActive: {
    backgroundColor: colors.primary,
  },
  periodTabText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  periodTabTextActive: {
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  listContent: {
    paddingHorizontal: m(18),
    paddingBottom: m(30),
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: m(60),
  },
  loadingText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(8),
  },

  // Lender Card
  card: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(14),
    marginBottom: m(12),
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
    alignItems: 'center',
    marginBottom: m(10),
  },
  lenderIconCircle: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    backgroundColor: colors.blueButton,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(10),
  },
  lenderInfoCol: {
    flex: 1,
    marginRight: m(6),
  },
  companyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  companyNameText: {
    fontSize: m(14),
    lineHeight: m(18),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    flexShrink: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(3),
    backgroundColor: '#ecfdf5',
    paddingHorizontal: m(6),
    paddingVertical: m(2),
    borderRadius: m(6),
  },
  verifiedBadgeText: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: '#059669',
  },
  locationText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(2),
  },
  favBtn: {
    width: m(32),
    height: m(32),
    borderRadius: m(16),
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  // Compact Metrics Box - Clean Neutral Slate-50 (#F8FAFC)
  metricsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: m(10),
    paddingVertical: m(8),
    paddingHorizontal: m(10),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: m(12),
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textSecondary,
    marginBottom: m(1),
  },
  metricValueBold: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  metricValue: {
    fontSize: m(11),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.lettersAndIcons,
  },
  metricDivider: {
    width: 1,
    height: m(20),
    backgroundColor: '#e2e8f0',
  },

  // Card Actions Row
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
  },
  detailsBtn: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: m(9),
    borderRadius: m(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.12)',
  },
  detailsBtnText: {
    fontSize: m(12),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.lettersAndIcons,
  },
  applyBtn: {
    flex: 1.2,
    backgroundColor: colors.lettersAndIcons,
    paddingVertical: m(9),
    borderRadius: m(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(6),
  },
  applyBtnText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },

  // Empty State
  emptyContainer: {
    paddingVertical: m(50),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginTop: m(10),
  },
  emptySubtitle: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: m(4),
    paddingHorizontal: m(20),
    lineHeight: m(16),
  },
});
