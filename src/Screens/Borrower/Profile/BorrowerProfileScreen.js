import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontFamily, colors } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper } from '../../../Components/common';
import borrowerFlowService from '../../../Services/borrowerFlowService';
import { logout } from '../../../Redux/Slices/authslice';

export default function BorrowerProfileScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const authUser = useSelector(state => state.auth.user);
  const isLoggingOut = useRef(false);

  const [loading, setLoading] = useState(true);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const [profile, setProfile] = useState({
    userName: '',
    companyName: '',
    panCardNumber: '',
    email: '',
    mobileNo: '',
  });

  const [profileCompletion, setProfileCompletion] = useState({
    percentage: 100,
    isComplete: true,
    missingFields: [],
  });

  const fetchProfile = useCallback(async () => {
    if (!authUser || isLoggingOut.current) return;
    try {
      setLoading(true);
      const res = await borrowerFlowService.getProfile();
      if (res?.success && res.borrower) {
        const b = res.borrower;
        setProfile({
          userName: b.userName || authUser?.userName || '',
          companyName: b.companyName || b.borrowerProfile?.businessName || authUser?.companyName || '',
          panCardNumber: b.panCardNumber || '',
          email: b.email || authUser?.email || '',
          mobileNo: b.mobileNo || authUser?.mobileNo || '',
        });
        if (res.profileCompletion) {
          setProfileCompletion(res.profileCompletion);
        }
      }
    } catch (err) {
      if (err?.response?.status === 401 || isLoggingOut.current) {
        return;
      }
      console.error('Error fetching borrower profile:', err);
    } finally {
      if (!isLoggingOut.current) {
        setLoading(false);
      }
    }
  }, [authUser]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const handleConfirmLogout = async () => {
    try {
      isLoggingOut.current = true;
      setLogoutModalVisible(false);
      await dispatch(logout());
      await AsyncStorage.clear();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (e) {
      console.error('Logout error:', e);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  const displayName =
    profile.userName ||
    profile.companyName ||
    authUser?.userName ||
    authUser?.name ||
    'Borrower Account';

  const displayId =
    profile.panCardNumber ||
    (authUser?._id ? authUser._id.slice(-8).toUpperCase() : '25030024');

  const avatarUrl = authUser?.profileImage || authUser?.avatar;

  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'BP';

  // 6 Primary Menu options matching Lender Profile layout
  const menuItems = [
    {
      id: 'edit_profile',
      title: 'Edit Profile & Statutory KYC',
      icon: 'user',
      onPress: () => navigation.navigate('BorrowerEditProfileScreen', { section: 'kyc' }),
    },
    {
      id: 'entity_info',
      title: 'Corporate Entity & Constitution',
      icon: 'briefcase',
      onPress: () => navigation.navigate('BorrowerEditProfileScreen', { section: 'entity' }),
    },
    {
      id: 'security',
      title: 'Security & PIN Governance',
      icon: 'shield',
      onPress: () => navigation.navigate('BorrowerSecurityScreen'),
    },
    {
      id: 'office_address',
      title: 'Registered Office Address',
      icon: 'map-pin',
      onPress: () => navigation.navigate('BorrowerEditProfileScreen', { section: 'address' }),
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: 'headphones',
      onPress: () => navigation.navigate('HelpAndSupportScreen'),
    },
    {
      id: 'logout',
      title: 'Logout',
      icon: 'log-out',
      onPress: () => setLogoutModalVisible(true),
    },
  ];

  if (loading && !profile.userName && !authUser?.userName) {
    return (
      <ScreenWrapper
        backgroundColor={colors.backgroundGreenWhite}
        topInsetBg={colors.primary}
        statusBarColor={colors.primary}
        statusBarStyle="dark-content"
      >
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={colors.lettersAndIcons} />
          <Text style={styles.loaderText}>Loading borrower profile...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      backgroundColor={colors.backgroundGreenWhite}
      topInsetBg={colors.primary}
      statusBarColor={colors.primary}
      statusBarStyle="dark-content"
      includeTabBarClearance={false}
      scrollable={false}
    >
      <View style={styles.pageWrapper}>
        {/* ── 1. Top Green Header Bar ── */}
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Green Backdrop Segment (hosts top half of the 92px floating avatar) */}
        <View style={styles.greenBackdrop} />

        {/* ── 2. Curved Sheet Section ── */}
        <View style={styles.sheetSection}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* User / Enterprise Name & ID */}
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userIdText}>ID: {displayId}</Text>

            {/* Verified Badge */}
            <View style={styles.badgeWrapper}>
              <View style={styles.verifiedPill}>
                <Feather name="check-circle" size={m(12)} color="#059669" />
                <Text style={styles.verifiedPillText}>DigiLocker & NSDL Verified</Text>
              </View>
            </View>

            {/* 100% Target Profile Completion Card (matching webapp) */}
            <View
              style={[
                styles.completionCard,
                profileCompletion.isComplete
                  ? styles.completionCardSuccess
                  : styles.completionCardPending,
              ]}
            >
              <View style={styles.completionHeaderRow}>
                <View style={styles.completionLeft}>
                  <View
                    style={[
                      styles.completionPercentBadge,
                      profileCompletion.isComplete
                        ? styles.percentBadgeSuccess
                        : styles.percentBadgePending,
                    ]}
                  >
                    {profileCompletion.isComplete ? (
                      <Feather name="check" size={m(14)} color={colors.white} />
                    ) : (
                      <Text style={styles.percentBadgeText}>
                        {profileCompletion.percentage}%
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.completionTitle}>
                      {profileCompletion.isComplete
                        ? '100% Complete — Eligible to Apply'
                        : `Profile Completion: ${profileCompletion.percentage}%`}
                    </Text>
                    <Text style={styles.completionSubtitle}>
                      {profileCompletion.isComplete
                        ? 'All verified parameters ready for underwriting.'
                        : 'Complete 100% of dossier details to apply.'}
                    </Text>
                  </View>
                </View>

                {!profileCompletion.isComplete && (
                  <TouchableOpacity
                    style={styles.completeBtn}
                    activeOpacity={0.8}
                    onPress={() =>
                      navigation.navigate('BorrowerEditProfileScreen', { section: 'kyc' })
                    }
                  >
                    <Text style={styles.completeBtnText}>Fill</Text>
                    <Feather name="arrow-right" size={m(11)} color={colors.white} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.max(5, profileCompletion.percentage)}%` },
                    profileCompletion.isComplete
                      ? styles.progressFillSuccess
                      : styles.progressFillPending,
                  ]}
                />
              </View>

              {/* Missing Fields list */}
              {!profileCompletion.isComplete &&
                profileCompletion.missingFields &&
                profileCompletion.missingFields.length > 0 && (
                  <View style={styles.missingFieldsWrap}>
                    <Text style={styles.missingFieldsTitle}>Pending:</Text>
                    {profileCompletion.missingFields.slice(0, 3).map((f, i) => (
                      <View key={i} style={styles.missingFieldPill}>
                        <Text style={styles.missingFieldText}>{f}</Text>
                      </View>
                    ))}
                    {profileCompletion.missingFields.length > 3 && (
                      <Text style={styles.moreMissingText}>
                        +{profileCompletion.missingFields.length - 3} more
                      </Text>
                    )}
                  </View>
                )}
            </View>

            {/* Figma-Style Blue Circle Menu Items (Matching Lender Profile) */}
            <View style={styles.menuList}>
              {menuItems.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuRow}
                  activeOpacity={0.75}
                  onPress={item.onPress}
                >
                  <View style={styles.menuIconCircle}>
                    <Feather name={item.icon} size={m(20)} color={colors.white} />
                  </View>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Feather
                    name="chevron-right"
                    size={m(18)}
                    color="#94A3B8"
                    style={{ marginLeft: 'auto' }}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Platform Version Subtitle */}
            <Text style={styles.versionText}>LoanHub Borrower Terminal v2.4.0</Text>
          </ScrollView>
        </View>

        {/* Floating Circular Avatar Perfectly Positioned at the Seam */}
        <View style={styles.avatarFloatingWrapper} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.avatarCircle}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('BorrowerEditProfileScreen', { section: 'kyc' })}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── 3. Full-Screen Logout Confirmation Modal ── */}
        <Modal
          visible={logoutModalVisible}
          transparent={true}
          animationType="fade"
          statusBarTranslucent={true}
          onRequestClose={() => setLogoutModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setLogoutModalVisible(false)}
            />
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Sign Out</Text>
              <Text style={styles.modalSubtitle}>
                Are you sure you want to sign out of the Borrower Workspace?
              </Text>
              <View style={styles.modalActionButtons}>
                <TouchableOpacity
                  style={styles.modalConfirmBtn}
                  activeOpacity={0.8}
                  onPress={handleConfirmLogout}
                >
                  <Text style={styles.modalConfirmBtnText}>Sign Out</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  activeOpacity={0.8}
                  onPress={() => setLogoutModalVisible(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  pageWrapper: {
    flex: 1,
    backgroundColor: colors.primary,
  },

  // Fixed Top Header
  headerBar: {
    paddingHorizontal: m(20),
    paddingTop: m(14),
    paddingBottom: m(10),
    backgroundColor: colors.primary,
  },
  headerTitle: {
    fontSize: m(22),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    textAlign: 'left',
  },

  // Green Backdrop Segment
  greenBackdrop: {
    height: m(46),
    backgroundColor: colors.primary,
  },

  // Curved Sheet
  sheetSection: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(36),
    borderTopRightRadius: m(36),
  },
  scrollContent: {
    paddingTop: m(52), // Space for bottom half of the floating avatar
    paddingBottom: m(100),
  },

  // Floating Avatar (over the seam between header & curved sheet)
  avatarFloatingWrapper: {
    position: 'absolute',
    top: m(60),
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
    elevation: 6,
  },
  avatarCircle: {
    width: m(92),
    height: m(92),
    borderRadius: m(46),
    borderWidth: m(3.5),
    borderColor: colors.white,
    backgroundColor: colors.white,
    overflow: 'hidden',
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: m(46),
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: m(46),
    backgroundColor: colors.oceanBlueButton,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: m(28),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },

  // User Header Text
  userName: {
    fontSize: m(20),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    textAlign: 'center',
    paddingHorizontal: m(20),
  },
  userIdText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: '#4B6358',
    textAlign: 'center',
    marginTop: m(2),
    marginBottom: m(8),
  },

  badgeWrapper: {
    alignItems: 'center',
    marginBottom: m(16),
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(5),
    backgroundColor: '#DCFCE7',
    paddingHorizontal: m(10),
    paddingVertical: m(4),
    borderRadius: m(20),
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  verifiedPillText: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: '#166534',
  },

  // Figma-Style Blue Circle Menu Items
  menuList: {
    paddingHorizontal: m(18),
    marginBottom: m(20),
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: m(10),
    paddingHorizontal: m(8),
  },
  menuIconCircle: {
    width: m(44),
    height: m(44),
    borderRadius: m(22),
    backgroundColor: colors.blueButton,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(16),
    elevation: 2,
    shadowColor: colors.blueButton,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  menuTitle: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  versionText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: m(10),
  },

  loaderCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
    marginTop: m(10),
  },

  // Logout Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(9, 48, 48, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: m(24),
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: m(24),
    padding: m(22),
    alignItems: 'center',
    elevation: 10,
  },
  modalIconCircle: {
    width: m(54),
    height: m(54),
    borderRadius: m(27),
    backgroundColor: colors.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(14),
  },
  modalSignOutTitle: {
    fontSize: m(18),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(6),
  },
  modalSignOutSubtitle: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: m(20),
  },
  modalActionButtons: {
    width: '100%',
    gap: m(8),
  },
  modalConfirmBtn: {
    backgroundColor: colors.oceanBlueButton,
    paddingVertical: m(12),
    borderRadius: m(12),
    alignItems: 'center',
  },
  modalConfirmBtnText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  modalCancelBtn: {
    paddingVertical: m(12),
    borderRadius: m(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalCancelBtnText: {
    fontSize: m(13),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.textSecondary,
  },

  // Completion Progress Card
  completionCard: {
    marginHorizontal: m(18),
    marginBottom: m(16),
    borderRadius: m(16),
    padding: m(14),
    borderWidth: 1,
  },
  completionCardSuccess: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  completionCardPending: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  completionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: m(8),
  },
  completionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(10),
  },
  completionPercentBadge: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentBadgeSuccess: {
    backgroundColor: '#059669',
  },
  percentBadgePending: {
    backgroundColor: colors.blueButton,
  },
  percentBadgeText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  completionTitle: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  completionSubtitle: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(1),
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(3),
    backgroundColor: colors.blueButton,
    paddingHorizontal: m(10),
    paddingVertical: m(5),
    borderRadius: m(8),
  },
  completeBtnText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  progressBarTrack: {
    height: m(5),
    backgroundColor: '#e2e8f0',
    borderRadius: m(3),
    marginTop: m(10),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: m(3),
  },
  progressFillSuccess: {
    backgroundColor: '#059669',
  },
  progressFillPending: {
    backgroundColor: colors.blueButton,
  },
  missingFieldsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: m(4),
    marginTop: m(8),
  },
  missingFieldsTitle: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: '#94a3b8',
  },
  missingFieldPill: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
    borderWidth: 1,
    borderRadius: m(4),
    paddingHorizontal: m(6),
    paddingVertical: m(1),
  },
  missingFieldText: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryMedium,
    color: '#e11d48',
  },
  moreMissingText: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: '#64748b',
  },

  // Modal Dialog Styles (Exact Match with Admin Console Sign Out Modal)
  modalBackdrop: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(9, 48, 48, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: m(24),
  },
  modalCard: {
    width: '100%',
    maxWidth: m(320),
    backgroundColor: colors.white,
    borderRadius: m(28),
    paddingHorizontal: m(24),
    paddingTop: m(36),
    paddingBottom: m(28),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 25,
  },
  modalTitle: {
    fontSize: m(20),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryRegular,
    color: '#4B6358',
    textAlign: 'center',
    marginTop: m(10),
    marginBottom: m(26),
    lineHeight: m(20),
  },
  modalActionButtons: {
    width: '100%',
    gap: m(12),
  },
  modalConfirmBtn: {
    width: '100%',
    height: m(48),
    borderRadius: m(24),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmBtnText: {
    fontSize: m(14.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  modalCancelBtn: {
    width: '100%',
    height: m(48),
    borderRadius: m(24),
    backgroundColor: colors.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: m(14.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
});
