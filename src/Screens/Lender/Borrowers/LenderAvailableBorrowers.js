import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { FontFamily, colors } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper } from '../../../Components/common';
import lenderFlowService from '../../../Services/lenderFlowService';

export default function LenderAvailableBorrowers() {
  const navigation = useNavigation();
  const [borrowers, setBorrowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchBorrowers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        search: search.trim() || undefined,
      };

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
  }, [search]);

  useFocusEffect(
    useCallback(() => {
      fetchBorrowers();
    }, [fetchBorrowers])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBorrowers();
  };

  // Local filter for High Turnover or secondary checks
  const filteredBorrowers = borrowers;

  // Network metrics
  const networkMetrics = useMemo(() => {
    const total = borrowers.length;
    const primeCount = borrowers.filter(
      (b) => Number(b.borrowerProfile?.creditScore || 750) >= 750
    ).length;
    const highTurnoverCount = borrowers.filter(
      (b) => Number(b.borrowerProfile?.annualRevenue || 0) >= 2500000
    ).length;
    return { total, primeCount, highTurnoverCount };
  }, [borrowers]);

  const renderItem = ({ item }) => {
    const bProfile = item.borrowerProfile || {};
    const tradeName = bProfile.businessName || item.companyName || item.userName || 'Borrower';
    const address = item.address || bProfile.businessAddress || bProfile.businessCity || 'Location not specified';
    const isVerified = Boolean(
      item.digilockerKyc?.isVerified ||
      item.isVerified ||
      item.borrowerProfile?.isVerified ||
      item.panCardNumber
    );

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('LenderBorrowerDetails', {
            borrowerId: item._id,
            borrower: item,
          })
        }
        activeOpacity={0.8}
      >
        {/* Left Icon: Blue circle */}
        <View style={styles.activityIconCircle}>
          <Feather name="user" size={m(18)} color={colors.white} />
        </View>

        {/* Middle: Name & Address */}
        <View style={styles.cardContent}>
          <Text style={styles.borrowerNameText} numberOfLines={1}>
            {tradeName}
          </Text>
          <View style={styles.addressRow}>
            <Feather name="map-pin" size={m(11)} color={colors.textSecondary} style={{ marginRight: m(4) }} />
            <Text style={styles.addressText} numberOfLines={1}>
              {address}
            </Text>
          </View>
        </View>

        {/* Right: Verified or Not Badge + Chevron */}
        <View style={styles.cardRightCol}>
          <View style={[styles.statusBadge, isVerified ? styles.statusBadgeVerified : styles.statusBadgeUnverified]}>
            <Feather
              name={isVerified ? 'check-circle' : 'alert-circle'}
              size={m(10.5)}
              color={isVerified ? '#15803d' : '#854d0e'}
            />
            <Text style={[styles.statusText, isVerified ? styles.statusTextVerified : styles.statusTextUnverified]}>
              {isVerified ? 'Verified' : 'Not Verified'}
            </Text>
          </View>
          <Feather name="chevron-right" size={m(15)} color={colors.textSecondary} style={{ marginTop: m(4) }} />
        </View>
      </TouchableOpacity>
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
      {/* ── 1. Top Green Header Banner ── */}
      <View style={styles.topBanner}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTag}>COMMERCIAL NETWORK</Text>
            <Text style={styles.headerTitle}>Borrower Directory</Text>
            <Text style={styles.headerSubtitle}>
              Verified institutional & SME credit profiles
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

        {/* Network Metrics Strip on Green */}
        <View style={styles.networkMetricsCard}>
          <View style={styles.metricColumn}>
            <Text style={styles.metricColumnLabel}>Total Network</Text>
            <Text style={styles.metricColumnValueWhite}>{networkMetrics.total}</Text>
          </View>
          <View style={styles.metricDividerLight} />
          <View style={styles.metricColumn}>
            <Text style={styles.metricColumnLabel}>Prime (>750)</Text>
            <Text style={styles.metricColumnValueBlue}>{networkMetrics.primeCount}</Text>
          </View>
          <View style={styles.metricDividerLight} />
          <View style={styles.metricColumn}>
            <Text style={styles.metricColumnLabel}>Turnover {'>'}₹25L</Text>
            <Text style={styles.metricColumnValueDark}>{networkMetrics.highTurnoverCount}</Text>
          </View>
        </View>
      </View>

      {/* ── 2. Curved Main Body Section ── */}
      <View style={styles.sheetSection}>
        {/* Search Input Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={m(16)} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by company, contact, or city..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={fetchBorrowers}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={m(16)} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* List Content */}
        {loading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.lettersAndIcons} />
            <Text style={styles.loadingText}>Syncing verified borrower network...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredBorrowers}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
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
                <Feather name="users" size={m(42)} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Connected Borrowers Found</Text>
                <Text style={styles.emptySubtitle}>
                  Borrowers whose applications you accept or partner with will appear in this directory.
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
    paddingHorizontal: m(18),
    paddingTop: m(10),
    paddingBottom: m(16),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(12),
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
    width: m(40),
    height: m(40),
    borderRadius: m(20),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // 3-Column Metrics Card on Green
  networkMetricsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: m(14),
    paddingVertical: m(8),
    paddingHorizontal: m(14),
    marginTop: m(2),
  },
  metricColumn: {
    flex: 1,
    alignItems: 'center',
  },
  metricColumnLabel: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
    opacity: 0.85,
    marginBottom: m(2),
  },
  metricColumnValueWhite: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  metricColumnValueBlue: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: colors.oceanBlueButton,
  },
  metricColumnValueDark: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  metricDividerLight: {
    width: 1,
    height: m(24),
    backgroundColor: 'rgba(9, 48, 48, 0.15)',
  },

  // Main Curved Sheet
  sheetSection: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(30),
    borderTopRightRadius: m(30),
    paddingTop: m(14),
  },

  // Search Input Container
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: m(16),
    marginHorizontal: m(18),
    marginBottom: m(10),
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

  listContent: {
    paddingHorizontal: m(18),
    paddingBottom: m(30),
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(8),
  },

  // Compact Borrower Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: m(14),
    paddingHorizontal: m(14),
    paddingVertical: m(12),
    marginBottom: m(10),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.06)',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  activityIconCircle: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    backgroundColor: colors.blueButton,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(12),
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    marginRight: m(8),
  },
  borrowerNameText: {
    fontSize: m(14),
    lineHeight: m(19),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(2),
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressText: {
    fontSize: m(11.5),
    lineHeight: m(16),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    flex: 1,
  },
  cardRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(8),
    paddingVertical: m(3.5),
    borderRadius: m(8),
    gap: m(3.5),
  },
  statusBadgeVerified: {
    backgroundColor: '#dcfce7',
  },
  statusBadgeUnverified: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
  },
  statusTextVerified: {
    color: '#15803d',
  },
  statusTextUnverified: {
    color: '#854d0e',
  },

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
  },
});
