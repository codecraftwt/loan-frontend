import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { useState } from 'react';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import PromptBox from '../../PromptBox/Prompt';
import { logout, removeUserDeviceToken } from '../../../Redux/Slices/authslice';
import useFetchUserFromStorage from '../../../Redux/hooks/useFetchUserFromStorage';
import { m } from 'walstar-rn-responsive';
import { colors, FontFamily } from '../../../constants';

const statusBarOffset = Platform.OS === 'android' ? (StatusBar.currentHeight || m(24)) : m(44);
const HEADER_HEIGHT = statusBarOffset + m(16) + m(28) + m(20) + m(76) + m(50);
const HEADER_OVERLAP = m(40);

export default function Profile() {
  // Navigation & Redux
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  useFetchUserFromStorage();

  const [imageError, setImageError] = useState(false);
  const [isPromptVisible, setIsPromptVisible] = useState(false);

  // Event Handlers
  const handleImageError = () => {
    setImageError(true);
  };

  const navigateToProfileDetails = () => {
    navigation.navigate('ProfileDetails', { profileData: user });
  };

  const handleLogout = () => {
    setIsPromptVisible(true);
  };

  const handleConfirmLogout = async () => {
    try {
      await dispatch(removeUserDeviceToken({}));
      await dispatch(logout());
      setTimeout(() => {
        setIsPromptVisible(false);
        navigation.replace('Login');
      }, 200);
    } catch (error) {
      // console.error('Error during logout process:', error);
      Alert.alert('Not able to logout');
    }
  };

  const handleCancelLogout = () => {
    setIsPromptVisible(false);
  };

  // Constants (menu items configuration)
  const menuItems = [
    {
      icon: 'user',
      label: 'Personal Details',
      onPress: navigateToProfileDetails,
      iconColor: '#573888',
      iconBg: colors.navyTint,
    },
    {
      icon: 'lock',
      label: 'Change Password',
      onPress: () => navigation.navigate('ChangePassword'),
      iconColor: '#F68350',
      iconBg: colors.goldTint,
    },
    {
      icon: 'shield',
      label: 'Privacy Policy',
      onPress: () => navigation.navigate('PrivacyPolicy'),
      iconColor: '#8B6FC9',
      iconBg: '#E0D9F0',
    },
  ];

  return (
    <>
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />

        <LinearGradient
          colors={[colors.navyDark, colors.navy]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}>
          <Text style={styles.headerTitle}>Profile</Text>

          {imageError || !user?.profileImage ? (
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>
                {user?.userName?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          ) : (
            <Image
              source={{ uri: user?.profileImage }}
              style={styles.headerAvatarImage}
              onError={handleImageError}
            />
          )}
        </LinearGradient>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>

          {/* Profile Info Card */}
          <View style={styles.infoCard}>
            {user ? (
              <>
                <Text style={styles.profileName} numberOfLines={2}>
                  {user?.userName}
                </Text>
                <Text style={styles.profilePhone}>
                  {user?.mobileNo}
                </Text>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedBadgeText}>Verified Borrower</Text>
                </View>
              </>
            ) : (
              <ActivityIndicator size="small" color={colors.navy} />
            )}
          </View>

          {/* Menu Section */}
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>General</Text>

            <View style={styles.menuGrid}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.menuItem,
                    index === menuItems.length - 1 && styles.menuItemLast,
                  ]}
                  onPress={item.onPress}
                  activeOpacity={0.7}>
                  <View style={[styles.menuIconContainer, { backgroundColor: item.iconBg }]}>
                    <Icon name={item.icon} size={20} color={item.iconColor} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Icon name="chevron-right" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.85}>
            <Text style={styles.logoutButtonText}>LOG OUT</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <PromptBox
        visible={isPromptVisible}
        message="Are you sure you want to logout?"
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    paddingTop: statusBarOffset + m(16),
    borderBottomLeftRadius: m(28),
    borderBottomRightRadius: m(28),
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: m(20),
    lineHeight: m(26),
    fontFamily: FontFamily.primaryBold,
    marginBottom: m(20),
  },
  headerAvatar: {
    width: m(76),
    height: m(76),
    borderRadius: m(38),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    fontSize: m(28),
    fontFamily: FontFamily.primaryBold,
    color: colors.navy,
  },
  headerAvatarImage: {
    width: m(76),
    height: m(76),
    borderRadius: m(38),
    borderWidth: 3,
    borderColor: colors.white,
  },

  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingHorizontal: m(16),
    paddingTop: HEADER_HEIGHT - HEADER_OVERLAP,
    paddingBottom: m(140),
  },

  // Profile Info Card
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: m(20),
    paddingVertical: m(20),
    paddingHorizontal: m(20),
    marginBottom: m(24),
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  profileName: {
    fontSize: m(19),
    lineHeight: m(24),
    fontFamily: FontFamily.primaryBold,
    color: colors.textPrimary,
    marginBottom: m(4),
  },
  profilePhone: {
    fontSize: m(13),
    lineHeight: m(18),
    fontFamily: FontFamily.bodyRegular,
    color: colors.goldDark,
    marginBottom: m(12),
  },
  verifiedBadge: {
    backgroundColor: colors.navyTint,
    borderRadius: m(20),
    paddingVertical: m(6),
    paddingHorizontal: m(16),
  },
  verifiedBadgeText: {
    fontSize: m(11),
    lineHeight: m(14),
    fontFamily: FontFamily.bodySemiBold,
    color: colors.navy,
  },

  // Menu Section
  menuSection: {
    marginBottom: m(24),
  },
  sectionTitle: {
    fontSize: m(16),
    lineHeight: m(22),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.textPrimary,
    marginBottom: m(12),
    paddingHorizontal: m(4),
  },
  menuGrid: {
    backgroundColor: colors.white,
    borderRadius: m(16),
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: m(14),
    paddingHorizontal: m(16),
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconContainer: {
    width: m(40),
    height: m(40),
    borderRadius: m(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(14),
  },
  menuLabel: {
    flex: 1,
    fontSize: m(14),
    lineHeight: m(18),
    fontFamily: FontFamily.bodySemiBold,
    color: colors.textPrimary,
  },

  // Logout Button
  logoutButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E85D75',
    borderRadius: m(28),
    paddingVertical: m(16),
  },
  logoutButtonText: {
    fontSize: m(14),
    lineHeight: m(18),
    fontFamily: FontFamily.bodySemiBold,
    color: '#FFFFFF',
    letterSpacing: m(1),
  },
});
