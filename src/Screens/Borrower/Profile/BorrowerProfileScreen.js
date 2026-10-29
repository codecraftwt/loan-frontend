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
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Toast from 'react-native-toast-message';
import { FontFamily, colors } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper, showAlert } from '../../../Components/common';
import borrowerFlowService from '../../../Services/borrowerFlowService';
import { logout, updateUserProfile, deleteProfileImage, setUser } from '../../../Redux/Slices/authslice';

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

export default function BorrowerProfileScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const authUser = useSelector(state => state.auth.user);
  const isLoggingOut = useRef(false);

  const [loading, setLoading] = useState(true);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [profile, setProfile] = useState({
    userName: '',
    companyName: '',
    panCardNumber: '',
    email: '',
    mobileNo: '',
    profileImage: authUser?.profileImage || null,
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
        const currentImg = b.profileImage !== undefined ? b.profileImage : (authUser?.profileImage || null);
        setProfile({
          userName: b.userName || authUser?.userName || '',
          companyName: b.companyName || b.borrowerProfile?.businessName || authUser?.companyName || '',
          panCardNumber: b.panCardNumber || '',
          email: b.email || authUser?.email || '',
          mobileNo: b.mobileNo || authUser?.mobileNo || '',
          profileImage: currentImg,
        });
        if (b.profileImage !== authUser?.profileImage) {
          dispatch(setUser({ profileImage: b.profileImage || null }));
          const currentStored = await AsyncStorage.getItem('user');
          if (currentStored) {
            try {
              const parsed = JSON.parse(currentStored);
              await AsyncStorage.setItem(
                'user',
                JSON.stringify({ ...parsed, profileImage: b.profileImage || null })
              );
            } catch (e) {}
          }
        }
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
  }, [authUser, dispatch]);

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

  const handlePhotoOption = async (option) => {
    setPhotoModalVisible(false);
    if (option === 'camera') {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        showAlert('Permission Denied', 'Camera permission is required to take a profile photo.');
        return;
      }
      launchCamera(
        {
          mediaType: 'photo',
          quality: 0.8,
          cameraType: 'front',
          saveToPhotos: true,
        },
        handleImagePickerResponse
      );
      return;
    }

    if (option === 'gallery') {
      launchImageLibrary(
        {
          mediaType: 'photo',
          quality: 0.8,
        },
        handleImagePickerResponse
      );
      return;
    }

    if (option === 'remove') {
      handleRemovePhoto();
    }
  };

  const handleImagePickerResponse = async (response) => {
    if (response.didCancel) return;
    if (response.errorCode) {
      Toast.show({
        type: 'error',
        text1: 'Photo selection failed',
        text2: response.errorMessage || 'Please try again.',
      });
      return;
    }

    if (response.assets?.[0]) {
      const asset = response.assets[0];
      try {
        setIsUploadingPhoto(true);
        const formData = new FormData();
        formData.append('profileImage', {
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || 'profile.jpg',
        });
        const uploadResult = await dispatch(updateUserProfile(formData)).unwrap();
        const newImg = uploadResult?.user?.profileImage || uploadResult?.profileImage;
        if (newImg) {
          setProfile(prev => ({ ...prev, profileImage: newImg }));
        }
        Toast.show({
          type: 'success',
          text1: 'Profile photo updated',
        });
        fetchProfile();
      } catch (err) {
        Toast.show({
          type: 'error',
          text1: 'Upload failed',
          text2: (typeof err === 'string' ? err : null) || err?.message || 'Please try again.',
        });
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  const handleRemovePhoto = () => {
    showAlert(
      'Remove Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsUploadingPhoto(true);
              await dispatch(deleteProfileImage()).unwrap();
              setProfile(prev => ({ ...prev, profileImage: null }));
              Toast.show({
                type: 'success',
                text1: 'Profile photo removed',
              });
              fetchProfile();
            } catch (err) {
              Toast.show({
                type: 'error',
                text1: 'Failed to remove photo',
                text2: (typeof err === 'string' ? err : null) || err?.message || 'Please try again.',
              });
            } finally {
              setIsUploadingPhoto(false);
            }
          },
        },
      ]
    );
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

  const avatarUrl = profile.profileImage || authUser?.profileImage || authUser?.avatar;

  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'BP';

  // Primary Menu options with rich styling
  const menuItems = [
    {
      id: 'edit_profile',
      title: 'Edit Profile & Statutory KYC',
      subtitle: 'PAN, Aadhaar, DigiLocker & E-NACH',
      icon: 'file-text',
      iconColor: '#059669',
      iconBg: '#E6F4EA',
      onPress: () => navigation.navigate('BorrowerEditProfileScreen', { section: 'kyc' }),
    },
    {
      id: 'entity_info',
      title: 'Corporate Entity & Constitution',
      subtitle: 'Business structure, GSTIN & financials',
      icon: 'briefcase',
      iconColor: '#2563EB',
      iconBg: '#EFF6FF',
      onPress: () => navigation.navigate('BorrowerEditProfileScreen', { section: 'entity' }),
    },
    {
      id: 'office_address',
      title: 'Registered Office Address',
      subtitle: 'Premises location, city & pincode',
      icon: 'map-pin',
      iconColor: '#0D9488',
      iconBg: '#F0FDFA',
      onPress: () => navigation.navigate('BorrowerEditProfileScreen', { section: 'address' }),
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
      includeTabBarClearance={true}
      scrollable={false}
    >
      <View style={styles.pageWrapper}>
        {/* ── 1. Top Green Header Bar ── */}
        <View style={styles.headerBar}>
          <View>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
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
            <View style={styles.idContainer}>
              <Text style={styles.userIdText}>ID: {displayId}</Text>
            </View>

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

            {/* Grouped Enterprise Menu Card */}
            <View style={styles.menuCard}>
              {menuItems.map((item, index) => (
                <React.Fragment key={item.id}>
                  <TouchableOpacity
                    style={styles.menuRow}
                    activeOpacity={0.72}
                    onPress={item.onPress}
                  >
                    <View style={[styles.menuIconBox, { backgroundColor: item.iconBg }]}>
                      <Feather name={item.icon} size={m(18)} color={item.iconColor} />
                    </View>
                    <View style={styles.menuTextWrap}>
                      <Text style={styles.menuTitle}>{item.title}</Text>
                      <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                    </View>
                    <Feather
                      name="chevron-right"
                      size={m(18)}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                  {index < menuItems.length - 1 && <View style={styles.menuDivider} />}
                </React.Fragment>
              ))}
            </View>

            {/* Centered Dedicated Logout Button */}
            <View style={styles.logoutBtnContainer}>
              <TouchableOpacity
                style={styles.logoutBtn}
                activeOpacity={0.8}
                onPress={() => setLogoutModalVisible(true)}
              >
                <Feather name="log-out" size={m(15)} color="#dc2626" />
                <Text style={styles.logoutBtnText}>Log Out</Text>
              </TouchableOpacity>

              <View style={styles.securityRow}>
                <Feather name="shield" size={m(11)} color={colors.textMuted} />
                <Text style={styles.securityText}>256-Bit Bank Grade Encryption</Text>
              </View>

              <Text style={styles.versionText}>LoanHub Borrower Terminal v2.4.0</Text>
            </View>
          </ScrollView>
        </View>

        {/* Floating Circular Avatar Perfectly Positioned at the Seam */}
        <View style={styles.avatarFloatingWrapper} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.avatarCircle}
            activeOpacity={0.85}
            onPress={() => setPhotoModalVisible(true)}
          >
            {isUploadingPhoto ? (
              <View style={styles.avatarLoadingOverlay}>
                <ActivityIndicator size="small" color={colors.white} />
              </View>
            ) : avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Feather name="camera" size={m(11)} color={colors.white} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Photo Action Modal (Add photo / Remove photo) ── */}
        <Modal
          visible={photoModalVisible}
          transparent={true}
          animationType="fade"
          statusBarTranslucent={true}
          onRequestClose={() => setPhotoModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setPhotoModalVisible(false)}
            />
            <View style={styles.photoModalCard}>
              <View style={styles.photoModalHeader}>
                <Text style={styles.photoModalTitle}>Profile Photo</Text>
                <Text style={styles.photoModalSubtitle}>
                  Update or remove your profile picture
                </Text>
              </View>

              <View style={styles.photoModalOptions}>
                <TouchableOpacity
                  style={styles.photoOptionRow}
                  activeOpacity={0.7}
                  onPress={() => handlePhotoOption('camera')}
                >
                  <View style={[styles.photoOptionIcon, { backgroundColor: '#E0F2FE' }]}>
                    <Feather name="camera" size={m(18)} color="#0284C7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.photoOptionText}>Take Photo</Text>
                    <Text style={styles.photoOptionSubtext}>Capture using camera</Text>
                  </View>
                  <Feather name="chevron-right" size={m(16)} color="#94A3B8" />
                </TouchableOpacity>

                <View style={styles.photoOptionDivider} />

                <TouchableOpacity
                  style={styles.photoOptionRow}
                  activeOpacity={0.7}
                  onPress={() => handlePhotoOption('gallery')}
                >
                  <View style={[styles.photoOptionIcon, { backgroundColor: '#ECFDF5' }]}>
                    <Feather name="image" size={m(18)} color="#059669" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.photoOptionText}>Choose from Gallery</Text>
                    <Text style={styles.photoOptionSubtext}>Pick from your photos</Text>
                  </View>
                  <Feather name="chevron-right" size={m(16)} color="#94A3B8" />
                </TouchableOpacity>

                {avatarUrl ? (
                  <>
                    <View style={styles.photoOptionDivider} />
                    <TouchableOpacity
                      style={styles.photoOptionRow}
                      activeOpacity={0.7}
                      onPress={() => handlePhotoOption('remove')}
                    >
                      <View style={[styles.photoOptionIcon, { backgroundColor: '#FEE2E2' }]}>
                        <Feather name="trash-2" size={m(18)} color="#DC2626" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.photoOptionText, { color: '#DC2626' }]}>Remove Photo</Text>
                        <Text style={styles.photoOptionSubtext}>Delete current photo</Text>
                      </View>
                      <Feather name="chevron-right" size={m(16)} color="#94A3B8" />
                    </TouchableOpacity>
                  </>
                ) : null}
              </View>

              <TouchableOpacity
                style={styles.photoCancelBtn}
                activeOpacity={0.8}
                onPress={() => setPhotoModalVisible(false)}
              >
                <Text style={styles.photoCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: m(20),
    paddingTop: m(6),
    paddingBottom: m(2),
    backgroundColor: colors.primary,
  },
  headerTag: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    opacity: 0.85,
    marginBottom: m(2),
  },
  headerTitle: {
    fontSize: m(20),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    textAlign: 'left',
  },
  headerRefreshBtn: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    backgroundColor: 'rgba(9, 48, 48, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Green Backdrop Segment (tightened to remove excess blank space)
  greenBackdrop: {
    height: m(20),
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
    paddingTop: m(48), // Space for bottom half of the floating avatar
    paddingBottom: m(90),
  },

  // Floating Avatar (over the seam between header & curved sheet)
  avatarFloatingWrapper: {
    position: 'absolute',
    top: m(18),
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
    elevation: 6,
  },
  avatarCircle: {
    width: m(86),
    height: m(86),
    borderRadius: m(43),
    borderWidth: m(3.5),
    borderColor: colors.white,
    backgroundColor: colors.white,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: m(43),
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: m(43),
    backgroundColor: colors.lettersAndIcons,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: m(26),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: m(2),
    right: m(2),
    width: m(24),
    height: m(24),
    borderRadius: m(12),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    elevation: 4,
  },
  avatarLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: m(43),
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Photo Action Modal
  photoModalCard: {
    width: '88%',
    maxWidth: m(360),
    backgroundColor: colors.white,
    borderRadius: m(24),
    padding: m(20),
    elevation: 10,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  photoModalHeader: {
    alignItems: 'center',
    marginBottom: m(16),
  },
  photoModalTitle: {
    fontSize: m(18),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  photoModalSubtitle: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(2),
    textAlign: 'center',
  },
  photoModalOptions: {
    backgroundColor: '#F8FAFC',
    borderRadius: m(14),
    borderWidth: 1,
    borderColor: '#EEF2F6',
    overflow: 'hidden',
    marginBottom: m(14),
  },
  photoOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: m(12),
    paddingHorizontal: m(14),
    gap: m(12),
  },
  photoOptionIcon: {
    width: m(38),
    height: m(38),
    borderRadius: m(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoOptionText: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  photoOptionSubtext: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(1),
  },
  photoOptionDivider: {
    height: 1,
    backgroundColor: '#EEF2F6',
    marginHorizontal: m(14),
  },
  photoCancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(12),
    borderRadius: m(12),
    backgroundColor: 'rgba(9, 48, 48, 0.05)',
  },
  photoCancelBtnText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  // User Header Text
  userName: {
    fontSize: m(20),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    textAlign: 'center',
    paddingHorizontal: m(20),
  },
  idContainer: {
    backgroundColor: 'rgba(9, 48, 48, 0.06)',
    paddingHorizontal: m(10),
    paddingVertical: m(3),
    borderRadius: m(12),
    alignSelf: 'center',
    marginTop: m(4),
    marginBottom: m(8),
  },
  userIdText: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryBold,
    color: '#4B6358',
    letterSpacing: 0.3,
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
    paddingHorizontal: m(12),
    paddingVertical: m(4.5),
    borderRadius: m(20),
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  verifiedPillText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryBold,
    color: '#166534',
  },

  // Grouped Enterprise Menu Card
  menuCard: {
    backgroundColor: colors.white,
    marginHorizontal: m(18),
    borderRadius: m(20),
    paddingVertical: m(6),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.07)',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    marginBottom: m(14),
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: m(12),
    paddingHorizontal: m(16),
  },
  menuIconBox: {
    width: m(40),
    height: m(40),
    borderRadius: m(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(14),
  },
  menuTextWrap: {
    flex: 1,
    marginRight: m(8),
  },
  menuTitle: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(2),
  },
  menuSubtitle: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(9, 48, 48, 0.06)',
    marginLeft: m(70),
    marginRight: m(16),
  },

  // Centered Logout Button & Footer
  logoutBtnContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: m(8),
    marginBottom: m(16),
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: m(11),
    paddingHorizontal: m(32),
    borderRadius: m(20),
    elevation: 1,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  logoutBtnText: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: '#DC2626',
    letterSpacing: 0.3,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(5),
    marginTop: m(12),
  },
  securityText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryMedium,
    color: colors.textMuted,
  },
  versionText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: m(4),
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
    marginBottom: m(14),
    borderRadius: m(18),
    padding: m(14),
    borderWidth: 1,
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  completionCardSuccess: {
    backgroundColor: colors.white,
    borderColor: 'rgba(5, 150, 105, 0.22)',
  },
  completionCardPending: {
    backgroundColor: colors.white,
    borderColor: 'rgba(9, 48, 48, 0.08)',
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
