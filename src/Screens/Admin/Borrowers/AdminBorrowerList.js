import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { colors, FontFamily } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper } from '../../../Components/common';
import { getAdminBorrowers } from '../../../Redux/Slices/adminBorrowersSlice';

export default function AdminBorrowerList() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { borrowers = [], loading } = useSelector(
    (state) => state.adminBorrowers || {}
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [kycTab, setKycTab] = useState('all'); // 'all' | 'verified' | 'unverified'
  const [refreshing, setRefreshing] = useState(false);

  // Load borrowers from API
  const loadData = useCallback(() => {
    dispatch(
      getAdminBorrowers({
        search: searchQuery,
        kycStatus: kycTab,
        limit: 100,
      })
    );
  }, [dispatch, searchQuery, kycTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(
      getAdminBorrowers({
        search: searchQuery,
        kycStatus: kycTab,
        limit: 100,
      })
    );
    setRefreshing(false);
  }, [dispatch, searchQuery, kycTab]);

  // Client-side filtering for fast responsive interactions
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
        b.digilockerKyc?.isVerified ||
        b.aadhaarVerified ||
        b.isAadhaarVerified ||
        b.kycStatus === 'verified'
      );
      if (kycTab === 'verified') return isVerified;
      if (kycTab === 'unverified') return !isVerified;

      return true;
    });
  }, [borrowers, searchQuery, kycTab]);

  // Statistics counters
  const totalCount = borrowers.length;
  const verifiedCount = borrowers.filter(
    (b) =>
      Boolean(
        b.digilockerKyc?.isVerified ||
        b.aadhaarVerified ||
        b.isAadhaarVerified ||
        b.kycStatus === 'verified'
      )
  ).length;
  const pendingCount = totalCount - verifiedCount;

  // Render individual borrower item: ONLY Avatar + Name + Status Dot + Chevron Button
  const renderBorrowerCard = ({ item }) => {
    const isKycVerified = Boolean(
      item.digilockerKyc?.isVerified ||
      item.aadhaarVerified ||
      item.isAadhaarVerified ||
      item.kycStatus === 'verified'
    );
    const displayName =
      item.userName || item.name || item.borrowerName || 'Anonymous Borrower';
    const initials =
      displayName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'BR';

    const avatarUrl =
      item.profileImage || item.borrowerProfile?.profileImage || item.avatar;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate('AdminBorrowerDetailsScreen', {
            borrowerId: item._id || item.id,
            borrower: item,
          })
        }
      >
        {/* 1. Name Logo / Initials Avatar */}
        <View style={styles.avatar}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.avatarText}>{initials}</Text>
          )}
        </View>

        {/* 2. Borrower Name + Status Dot (Green for Verified, Red for Pending) */}
        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <Text style={styles.borrowerName} numberOfLines={1}>
              {displayName}
            </Text>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isKycVerified ? '#00D09E' : '#FF4D4F' },
              ]}
            />
          </View>
        </View>

        {/* 3. Icon Button Only (Chevron) */}
        <View style={styles.viewBtn}>
          <Feather name="chevron-right" size={m(15)} color={colors.white} />
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
      includeTabBarClearance={false}
      scrollable={false}
    >
      <View style={styles.pageGreenWrapper}>
        {/* Top Green Banner */}
        <View style={styles.topSection}>
          <Text style={styles.headerTitle}>Borrowers Directory</Text>

          {/* Search Pill Bar */}
          <View style={styles.searchBar}>
            <Feather
              name="search"
              size={m(18)}
              color={colors.lettersAndIcons}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by borrower name, phone, PAN..."
              placeholderTextColor="#7E9D86"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={m(16)} color={colors.lettersAndIcons} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Filter Pills with Counts */}
          <View style={styles.filterTabsRow}>
            {[
              { id: 'all', label: `All (${totalCount})` },
              { id: 'verified', label: `Verified (${verifiedCount})` },
              { id: 'unverified', label: `Pending (${pendingCount})` },
            ].map((tab) => {
              const isSelected = kycTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.filterTab,
                    isSelected && styles.filterTabActive,
                  ]}
                  onPress={() => setKycTab(tab.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      isSelected && styles.filterTabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Curved Sheet Container */}
        <View style={styles.sheetSection}>
          {loading && !refreshing && borrowers.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading borrowers...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredBorrowers}
              keyExtractor={(item, idx) =>
                item?._id || item?.id || String(idx)
              }
              renderItem={renderBorrowerCard}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[colors.primary]}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Feather
                    name="users"
                    size={m(42)}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.emptyTitle}>No Borrowers Found</Text>
                  <Text style={styles.emptyDesc}>
                    {searchQuery
                      ? 'No borrowers match your search query.'
                      : 'Registered borrowers and credit dossiers will appear here.'}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  pageGreenWrapper: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  topSection: {
    backgroundColor: colors.primary,
    paddingHorizontal: m(18),
    paddingTop: m(14),
    paddingBottom: m(18),
  },
  headerTitle: {
    fontSize: m(22),
    lineHeight: m(28),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(12),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGreen,
    borderRadius: m(24),
    height: m(46),
    paddingHorizontal: m(16),
    marginBottom: m(12),
  },
  searchIcon: {
    marginRight: m(10),
  },
  searchInput: {
    flex: 1,
    fontSize: m(14),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
    padding: 0,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: m(8),
    marginBottom: m(12),
  },
  filterTab: {
    paddingHorizontal: m(14),
    paddingVertical: m(6),
    borderRadius: m(18),
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  filterTabActive: {
    backgroundColor: colors.lettersAndIcons,
  },
  filterTabText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  filterTabTextActive: {
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  // Curved Sheet
  sheetSection: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(36),
    borderTopRightRadius: m(36),
    paddingTop: m(16),
  },
  listContent: {
    paddingHorizontal: m(18),
    paddingBottom: m(110),
    paddingTop: m(4),
  },

  // Borrower Card: Avatar + Name + Status Dot + Chevron Button
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: m(14),
    paddingVertical: m(9),
    paddingHorizontal: m(12),
    marginBottom: m(10),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  avatar: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    backgroundColor: '#E6F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(10),
    borderWidth: 1.5,
    borderColor: 'rgba(50, 153, 255, 0.3)',
    overflow: 'hidden',
  },
  avatarImage: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
  },
  avatarText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.blueButton,
    letterSpacing: -0.2,
  },
  infoCol: {
    flex: 1,
    paddingRight: m(10),
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(7),
  },
  borrowerName: {
    fontSize: m(14.5),
    lineHeight: m(19),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    flexShrink: 1,
  },
  statusDot: {
    width: m(7),
    height: m(7),
    borderRadius: m(3.5),
  },
  viewBtn: {
    width: m(28),
    height: m(28),
    borderRadius: m(14),
    backgroundColor: colors.blueButton,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: m(60),
  },
  loadingText: {
    marginTop: m(10),
    fontSize: m(13),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: m(60),
    paddingHorizontal: m(30),
  },
  emptyTitle: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginTop: m(12),
  },
  emptyDesc: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: m(4),
  },
});
