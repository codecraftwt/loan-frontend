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
import lenderFlowService from '../../../Services/lenderFlowService';
import { logout } from '../../../Redux/Slices/authslice';

export default function LenderProfileScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const authUser = useSelector((state) => state.auth.user);
  const isLoggingOut = useRef(false);

  const [loading, setLoading] = useState(true);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const [profile, setProfile] = useState({
    userName: '',
    companyName: '',
    licenseNumber: '',
    email: '',
    mobileNo: '',
  });

  const fetchProfile = useCallback(async () => {
    if (!authUser || isLoggingOut.current) return;
    try {
      setLoading(true);
      const res = await lenderFlowService.getProfile();
      if (res?.success && res.lender) {
        const l = res.lender;
        const lp = l.lenderProfile || {};

        setProfile({
          userName: l.userName || authUser?.userName || '',
          companyName: l.companyName || authUser?.companyName || '',
          licenseNumber: l.licenseNumber || lp.licenseNumber || 'NBFC-CORP-984210',
          email: l.email || authUser?.email || '',
          mobileNo: l.mobileNo || authUser?.mobileNo || '',
        });
      }
    } catch (err) {
      if (err?.response?.status === 401 || isLoggingOut.current) {
        return;
      }
      console.error('Error fetching lender profile:', err);
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

  const displayName = profile.companyName || authUser?.companyName || authUser?.userName || 'Apex Capital NBFC';
  const displayId = profile.licenseNumber || authUser?._id?.slice(-8).toUpperCase() || '25030024';
  const avatarUrl = authUser?.profileImage || authUser?.avatar;
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AC';

  // 6 Primary Menu items matching Figma layout
  const menuItems = [
    {
      id: 'edit_profile',
      title: 'Edit Profile & Lending Criteria',
      icon: 'user',
      onPress: () => navigation.navigate('LenderEditProfileScreen'),
    },
    {
      id: 'subscription',
      title: 'Subscription & Memberships',
      icon: 'award',
      onPress: () => navigation.navigate('LenderSubscriptionScreen'),
    },
    {
      id: 'security',
      title: 'Security',
      icon: 'shield',
      onPress: () => navigation.navigate('ChangePassword'),
    },
    {
      id: 'office_address',
      title: 'Office & Jurisdiction',
      icon: 'map-pin',
      onPress: () => navigation.navigate('LenderOfficeJurisdictionScreen'),
    },
    {
      id: 'help',
      title: 'Help',
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

  if (loading && !profile.companyName && !authUser?.userName) {
    return (
      <ScreenWrapper
        backgroundColor={colors.backgroundGreenWhite}
        topInsetBg={colors.primary}
        statusBarColor={colors.primary}
        statusBarStyle="dark-content"
      >
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={colors.lettersAndIcons} />
          <Text style={styles.loaderText}>Loading institutional profile...</Text>
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
            {/* User / Institution Name & ID */}
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userIdText}>ID: {displayId}</Text>

            {/* Figma-Style Blue Circle Menu Items */}
            <View style={styles.menuList}>
              {menuItems.map((item) => (
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
                </TouchableOpacity>
              ))}
            </View>

            {/* Platform Version Subtitle */}
            <Text style={styles.versionText}>LoanHub Institutional Terminal v2.4.0</Text>
          </ScrollView>
        </View>

        {/* Floating Circular Avatar Perfectly Positioned at the Seam */}
        <View style={styles.avatarFloatingWrapper} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.avatarCircle}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('LenderEditProfileScreen')}
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
                Are you sure you want to sign out of the Institutional Terminal?
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
    marginBottom: m(16),
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
  modalCancelBtnText: {
    fontSize: m(14.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
});
