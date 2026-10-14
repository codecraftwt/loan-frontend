import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { m } from '../../../Utils/responsive';
import { colors, FontFamily } from '../../../constants';
import { ScreenWrapper, showCustomAlert } from '../../../Components/common';
import { logout } from '../../../Redux/Slices/authslice';

export default function AdminProfileScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const displayName = user?.name || user?.userName || 'John Smith';
  const displayId =
    user?.adminId ||
    user?.customId ||
    (user?._id ? user._id.slice(-8).toUpperCase() : '25030024');
  const avatarUrl = user?.profileImage || user?.avatar || user?.image;

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'JS';

  const handleLogout = () => {
    showCustomAlert({
      title: 'Sign Out',
      subtitle: 'Are you sure you want to log out?',
      message: 'Are you sure you want to sign out of the Admin Console?',
      confirmText: 'Sign Out',
      cancelText: 'Cancel',
      onConfirm: async () => {
        await dispatch(logout());
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      },
    });
  };

  const menuItems = [
    /*
    {
      id: 'edit_profile',
      title: 'Edit Profile',
      icon: 'user',
      onPress: () => navigation.navigate('EditProfile'),
    },
    */
    /*
    {
      id: 'security',
      title: 'Security',
      icon: 'shield',
      onPress: () => navigation.navigate('ChangePassword'),
    },
    */
    {
      id: 'setting',
      title: 'Settings',
      icon: 'settings',
      onPress: () => navigation.navigate('Settings'),
    },
    {
      id: 'revenue',
      title: 'SaaS Revenue & Analytics',
      icon: 'trending-up',
      onPress: () => navigation.navigate('Revenue'),
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
      onPress: handleLogout,
    },
  ];

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
        {/* Fixed Header Bar with Left-aligned Profile Title & Edit Profile Button */}
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.editHeaderBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Feather name="edit-2" size={m(17)} color={colors.lettersAndIcons} />
          </TouchableOpacity>
        </View>

        {/* Green Backdrop Segment for Top Half of Avatar */}
        <View style={styles.greenBackdrop} />

        {/* Curved Sheet Container */}
        <View style={styles.sheetSection}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* User Details */}
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

            {/* Subdued Platform Version Tag */}
            <Text style={styles.versionText}>LoanHub Enterprise Admin v2.4.0</Text>
          </ScrollView>
        </View>

        {/* Floating Avatar Perfectly Positioned at the Seam */}
        <View style={styles.avatarFloatingWrapper} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.avatarCircle}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('EditProfile')}
          >
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: m(18),
    paddingTop: m(12),
    paddingBottom: m(12),
    backgroundColor: colors.primary,
  },
  headerPlaceholder: {
    width: m(36),
    height: m(36),
  },
  headerTitle: {
    fontSize: m(19),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    textAlign: 'left',
  },
  editHeaderBtn: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  bellBtn: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Green Backdrop Segment (46px tall, hosts top half of 92px avatar)
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
    paddingTop: m(52), // Space for bottom half of avatar
    paddingBottom: m(100),
  },

  // Floating Avatar (over the seam between header & curved sheet)
  avatarFloatingWrapper: {
    position: 'absolute',
    top: m(60), // Starts at bottom of headerBar
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
  },
  userIdText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: '#4B6358',
    textAlign: 'center',
    marginTop: m(3),
    marginBottom: m(22),
  },

  // Menu List
  menuList: {
    paddingHorizontal: m(20),
    gap: m(14),
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: m(4),
  },
  menuIconCircle: {
    width: m(48),
    height: m(48),
    borderRadius: m(24),
    backgroundColor: '#52A6FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#52A6FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 2,
  },
  menuTitle: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginLeft: m(18),
  },

  // Version Footer
  versionText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: '#7E9D86',
    textAlign: 'center',
    marginTop: m(28),
  },
});
