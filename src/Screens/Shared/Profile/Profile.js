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
  PermissionsAndroid,
  Modal,
} from 'react-native';
import { useState } from 'react';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import PromptBox from '../../PromptBox/Prompt';
import {
  deleteProfileImage,
  logout,
  removeUserDeviceToken,
  updateUserProfile,
} from '../../../Redux/Slices/authslice';
import useFetchUserFromStorage from '../../../Redux/hooks/useFetchUserFromStorage';
import { m } from 'walstar-rn-responsive';
import { colors, FontFamily } from '../../../constants';

const statusBarOffset = Platform.OS === 'android' ? (StatusBar.currentHeight || m(24)) : m(44);
const HEADER_HEIGHT = statusBarOffset + m(16) + m(28) + m(20) + m(76) + m(50);
const HEADER_OVERLAP = m(40);

const requestCameraPermission = async () => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Camera Permission',
        message: 'LoanHub needs camera access to take a profile photo.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.warn('Camera permission error:', error);
    return false;
  }
};

export default function Profile() {
  // Navigation & Redux
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  useFetchUserFromStorage();

  const [imageError, setImageError] = useState(false);
  const [isPromptVisible, setIsPromptVisible] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isPhotoOptionsVisible, setIsPhotoOptionsVisible] = useState(false);

  // Event Handlers
  const handleImageError = () => {
    setImageError(true);
  };

  const handleChooseProfilePhoto = () => {
    if (isUploadingImage) {
      return;
    }

    setIsPhotoOptionsVisible(true);
  };

  const handlePhotoOptionPress = option => {
    setIsPhotoOptionsVisible(false);

    if (option === 'camera') {
      handleImagePicker('camera');
      return;
    }

    if (option === 'gallery') {
      handleImagePicker('gallery');
      return;
    }

    if (option === 'remove') {
      handleRemoveProfilePhoto();
    }
  };

  const handleImagePicker = async source => {
    if (source === 'camera') {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Denied',
          'Camera permission is required to take a profile photo.',
        );
        return;
      }
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      ...(source === 'camera' ? { cameraType: 'front', saveToPhotos: true } : {}),
    };
    const launch = source === 'camera' ? launchCamera : launchImageLibrary;

    launch(options, response => {
      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        Toast.show({
          type: 'error',
          text1: 'Photo selection failed',
          text2: response.errorMessage || 'Please try again.',
        });
        return;
      }

      if (response.assets?.[0]) {
        uploadProfilePhoto(response.assets[0]);
      }
    });
  };

  const uploadProfilePhoto = async asset => {
    try {
      setIsUploadingImage(true);

      const formData = new FormData();
      formData.append('profileImage', {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || 'profile.jpg',
      });

      await dispatch(updateUserProfile(formData)).unwrap();
      setImageError(false);

      Toast.show({
        type: 'success',
        text1: 'Profile photo updated',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Upload failed',
        text2:
          (typeof error === 'string' ? error : null) ||
          error?.message ||
          'Please try again.',
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveProfilePhoto = () => {
    if (!user?.profileImage) {
      Toast.show({
        type: 'info',
        text1: 'No profile photo',
      });
      return;
    }

    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile photo?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: removeProfilePhoto,
        },
      ],
    );
  };

  const removeProfilePhoto = async () => {
    try {
      setIsUploadingImage(true);
      await dispatch(deleteProfileImage()).unwrap();
      setImageError(false);

      Toast.show({
        type: 'success',
        text1: 'Profile photo removed',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Remove failed',
        text2:
          (typeof error === 'string' ? error : null) ||
          error?.message ||
          'Please try again.',
      });
    } finally {
      setIsUploadingImage(false);
    }
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

        <TouchableOpacity
          style={styles.avatarHitArea}
          onPress={handleChooseProfilePhoto}
          activeOpacity={1}
          disabled={isUploadingImage}>
          <View style={styles.avatarUploadIcon}>
            {isUploadingImage ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Icon name="camera" size={m(14)} color={colors.white} />
            )}
          </View>
        </TouchableOpacity>
      </View>

      <PromptBox
        visible={isPromptVisible}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />

      <Modal
        visible={isPhotoOptionsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPhotoOptionsVisible(false)}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsPhotoOptionsVisible(false)}>
          <TouchableOpacity
            style={styles.photoOptionsModal}
            activeOpacity={1}
            onPress={() => {}}>
            <Text style={styles.photoOptionsTitle}>Profile Photo</Text>
            <TouchableOpacity
              style={styles.photoOptionItem}
              onPress={() => handlePhotoOptionPress('camera')}
              activeOpacity={0.75}>
              <Icon name="camera" size={m(18)} color={colors.navy} />
              <Text style={styles.photoOptionText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.photoOptionItem}
              onPress={() => handlePhotoOptionPress('gallery')}
              activeOpacity={0.75}>
              <Icon name="image" size={m(18)} color={colors.navy} />
              <Text style={styles.photoOptionText}>Upload from Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.photoOptionItem, styles.photoOptionItemLast]}
              onPress={() => handlePhotoOptionPress('remove')}
              activeOpacity={0.75}>
              <Icon name="trash-2" size={m(18)} color={colors.error} />
              <Text style={[styles.photoOptionText, styles.removePhotoText]}>
                Remove Photo
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  avatarHitArea: {
    position: 'absolute',
    top: statusBarOffset + m(62),
    alignSelf: 'center',
    width: m(76),
    height: m(76),
    borderRadius: m(38),
    zIndex: 3,
    elevation: 3,
  },
  avatarUploadIcon: {
    position: 'absolute',
    right: m(-2),
    bottom: m(-2),
    width: m(28),
    height: m(28),
    borderRadius: m(14),
    backgroundColor: colors.goldDark,
    borderWidth: 2,
    borderColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    paddingHorizontal: m(16),
  },
  photoOptionsModal: {
    backgroundColor: colors.white,
    borderRadius: m(18),
    overflow: 'hidden',
  },
  photoOptionsTitle: {
    fontSize: m(16),
    lineHeight: m(22),
    fontFamily: FontFamily.primaryBold,
    color: colors.textPrimary,
    paddingHorizontal: m(18),
    paddingVertical: m(16),
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  photoOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(18),
    paddingVertical: m(15),
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  photoOptionItemLast: {
    borderBottomWidth: 0,
  },
  photoOptionText: {
    fontSize: m(14),
    lineHeight: m(19),
    fontFamily: FontFamily.bodySemiBold,
    color: colors.textPrimary,
    marginLeft: m(12),
  },
  removePhotoText: {
    color: colors.error,
  },
});
