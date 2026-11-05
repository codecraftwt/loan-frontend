import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  ScrollView,
  Image,
  PermissionsAndroid,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { m } from 'walstar-rn-responsive';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { FontFamily, FontSizes } from '../../../constants';
import { registerUser } from '../../../Redux/Slices/authslice';
import {
  updateRegistrationDraft,
  clearRegistrationDraft,
} from '../../../Services/registrationDraftService';

const BRAND_NAVY = '#172340';
const BRAND_TEAL = '#118A6B';
const BRAND_SOFT = '#EAF7F2';
const BRAND_BORDER = '#BDE5D8';

const ProgressTracker = () => (
  <View style={styles.progressContainer}>
    {[1, 2, 3].map(step => (
      <View key={step} style={styles.progressStepWrap}>
        <View
          style={[
            styles.progressStep,
            step < 3 && styles.progressStepComplete,
            step === 3 && styles.progressStepActive,
          ]}>
          {step < 3 ? (
            <Ionicons name="checkmark" size={m(16)} color="#FFFFFF" />
          ) : (
            <Text style={styles.progressStepText}>{step}</Text>
          )}
        </View>
        {step < 3 ? (
          <View style={[styles.progressLine, styles.progressLineActive]} />
        ) : null}
      </View>
    ))}
  </View>
);

const getRoleLabel = roleId => {
  if (roleId === 1) return 'Lender';
  if (roleId === 0) return 'Administrator';
  return 'Borrower';
};

export default function ProfileSummaryScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const { isLoading } = useSelector(state => state.auth || {});
  const { userData, aadhaarNumber, source } = route.params || {};

  const [profileImage, setProfileImage] = useState(
    userData?.profileImage || null,
  );
  const [signupError, setSignupError] = useState('');

  const maskedAadhaar =
    aadhaarNumber && aadhaarNumber.length === 12
      ? `•••• •••• ${aadhaarNumber.slice(8)}`
      : aadhaarNumber || '—';

  const requestCameraPermission = async () => {
    if (Platform.OS !== 'android') {
      return true;
    }
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'App Needs Camera Access',
          message:
            'This app needs access to your camera to take a profile photo.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Camera permission error:', err);
      return false;
    }
  };

  const handleImagePicker = async action => {
    if (action === 'camera' && Platform.OS === 'android') {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Toast.show({ type: 'error', text1: 'Camera permission is required.' });
        return;
      }
    }
    const options =
      action === 'camera'
        ? {
            mediaType: 'photo',
            cameraType: 'front',
            quality: 0.8,
            saveToPhotos: true,
          }
        : { mediaType: 'photo', quality: 0.8 };

    const launch = action === 'camera' ? launchCamera : launchImageLibrary;

    launch(options, response => {
      if (response.didCancel || response.errorCode) {
        return;
      }
      if (response.assets && response.assets[0]) {
        setProfileImage(response.assets[0]);
      }
    });
  };

  const handleRemovePhoto = () => setProfileImage(null);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleRegister = async () => {
    if (!userData) {
      navigation.reset({ index: 0, routes: [{ name: 'BottomNavigation' }] });
      return;
    }

    setSignupError('');
    try {
      const formData = new FormData();
      formData.append('userName', userData.name);
      formData.append('email', userData.email);
      formData.append('password', userData.password);
      formData.append('confirmPassword', userData.confirmPassword);
      formData.append('roleId', userData.roleId.toString());
      formData.append('address', userData.address || 'Not provided');
      formData.append('aadharCardNo', aadhaarNumber);

      if (userData.mobileNumber) {
        formData.append('mobileNo', userData.mobileNumber);
      }

      if (userData.panCardNumber && userData.panCardNumber.length === 10) {
        formData.append('panCardNumber', userData.panCardNumber);
      }

      if (profileImage) {
        formData.append('profileImage', {
          uri: profileImage.uri,
          type: profileImage.type || 'image/jpeg',
          name: profileImage.fileName || 'profile.jpg',
        });
      }

      await dispatch(registerUser(formData)).unwrap();
      await clearRegistrationDraft();

      Toast.show({
        type: 'success',
        position: 'top',
        text1: `${getRoleLabel(userData.roleId)} account created successfully!`,
      });

      navigation.reset({ index: 0, routes: [{ name: 'BottomNavigation' }] });
    } catch (error) {
      const errorMessage =
        (typeof error === 'string' ? error : error?.message) ||
        'Registration failed. Please try again.';
      setSignupError(errorMessage);
      Toast.show({ type: 'error', position: 'top', text1: errorMessage });
    }
  };

  React.useEffect(() => {
    if (userData) {
      updateRegistrationDraft({
        screen: 'ProfileSummaryScreen',
        userData,
        aadhaarNumber,
        source: source || 'register',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND_NAVY} />
      <View style={styles.fixedTop}>
        <View style={styles.headerContent}>
          <Text style={styles.appName}>LoanHub</Text>
          <Text style={styles.tagline}>Profile Picture & Summary</Text>
        </View>
        <ProgressTracker />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.title}>Profile Picture & Summary</Text>
          <Text style={styles.subtitle}>
            Attach photograph and review your details
          </Text>

          {/* Photo */}
          <View style={styles.photoWrap}>
            <View style={styles.photoCircle}>
              {profileImage ? (
                <Image
                  source={{ uri: profileImage.uri }}
                  style={styles.photoImage}
                />
              ) : (
                <Ionicons name="camera" size={m(36)} color={BRAND_TEAL} />
              )}
            </View>
            <Text style={styles.photoLabel}>
              {profileImage ? 'Photograph Ready' : 'Official Photo (Optional)'}
            </Text>
          </View>

          <View style={styles.photoButtonsRow}>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={() => handleImagePicker('gallery')}
              activeOpacity={0.7}>
              <Ionicons name="image-outline" size={m(20)} color={BRAND_TEAL} />
              <Text style={styles.photoButtonText}>Upload Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={() => handleImagePicker('camera')}
              activeOpacity={0.7}>
              <Ionicons name="camera-outline" size={m(20)} color={BRAND_TEAL} />
              <Text style={styles.photoButtonText}>Use Camera</Text>
            </TouchableOpacity>
          </View>

          {profileImage && (
            <TouchableOpacity
              style={styles.removePhotoButton}
              onPress={handleRemovePhoto}
              activeOpacity={0.7}>
              <Text style={styles.removePhotoText}>Remove or Retake Photo</Text>
            </TouchableOpacity>
          )}

          {/* Account Overview */}
          <View style={styles.overviewCard}>
            <View style={styles.overviewHeader}>
              <Text style={styles.overviewHeaderTitle}>Account Overview</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>
                  {getRoleLabel(userData?.roleId)}
                </Text>
              </View>
            </View>

            <View style={styles.overviewGrid}>
              <View style={styles.overviewCol}>
                <Text style={styles.overviewLabel}>Name</Text>
                <Text style={styles.overviewValue}>{userData?.name}</Text>
              </View>
              <View style={styles.overviewCol}>
                <Text style={styles.overviewLabel}>Mobile</Text>
                <Text style={styles.overviewValue}>
                  {userData?.mobileNumber}
                </Text>
              </View>
              <View style={styles.overviewColFull}>
                <Text style={styles.overviewLabel}>Email</Text>
                <Text style={styles.overviewValue}>{userData?.email}</Text>
              </View>
              <View style={styles.overviewColFull}>
                <Text style={styles.overviewLabel}>Address</Text>
                <Text style={styles.overviewValue}>
                  {userData?.address || 'Not provided'}
                </Text>
              </View>
              <View style={styles.overviewColFull}>
                <Text style={styles.overviewLabel}>Aadhaar Number</Text>
                <Text style={styles.overviewValueMono}>{maskedAadhaar}</Text>
              </View>
            </View>

            <View style={styles.consentRow}>
              <Ionicons name="checkmark-circle" size={14} color={BRAND_TEAL} />
              <Text style={styles.consentText}>
                Aadhaar eKYC consent accepted under RBI guidelines
              </Text>
            </View>
          </View>

          {signupError ? (
            <View style={styles.errorBox}>
              <Ionicons
                name="alert-circle-outline"
                size={m(18)}
                color="#D93025"
              />
              <Text style={styles.errorText}>{signupError}</Text>
            </View>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.backButton, isLoading && styles.disabledButton]}
              onPress={handleBack}
              disabled={isLoading}>
              <Ionicons name="chevron-back" size={20} color={BRAND_TEAL} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.registerButtonContainer,
                isLoading && styles.disabledButton,
              ]}
              onPress={handleRegister}
              disabled={isLoading}>
              <LinearGradient
                colors={[BRAND_NAVY, BRAND_TEAL]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.registerButtonGradient}>
                <Text style={styles.registerButtonText}>
                  {isLoading
                    ? 'Creating Account...'
                    : `Register as ${getRoleLabel(userData?.roleId)}`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND_TEAL },
  scrollView: { flex: 1, backgroundColor: BRAND_TEAL },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: m(20),
    paddingTop: 0,
    paddingBottom: m(40),
    backgroundColor: BRAND_TEAL,
  },
  fixedTop: {
    paddingHorizontal: m(20),
    paddingTop: Platform.OS === 'ios' ? m(52) : m(32),
  },
  headerContent: { alignItems: 'center', marginBottom: m(18) },
  appName: {
    fontSize: FontSizes['4xl'],
    fontFamily: FontFamily.secondaryBold,
    color: '#FFFFFF',
  },
  tagline: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.secondaryRegular,
    color: '#FFFFFF',
    marginTop: m(6),
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(20),
    padding: m(24),
    borderWidth: 1,
    borderColor: BRAND_BORDER,
    elevation: 8,
    shadowColor: BRAND_TEAL,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  title: {
    fontSize: FontSizes['2xl'],
    fontFamily: FontFamily.secondaryBold,
    color: '#333',
    textAlign: 'center',
    marginBottom: m(6),
  },
  subtitle: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primaryRegular,
    color: '#666',
    textAlign: 'center',
    marginBottom: m(22),
  },
  photoWrap: { alignItems: 'center', marginBottom: m(16) },
  photoCircle: {
    width: m(112),
    height: m(112),
    borderRadius: m(56),
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: BRAND_TEAL,
    backgroundColor: BRAND_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImage: { width: '100%', height: '100%' },
  photoLabel: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primarySemiBold,
    color: '#333',
    marginTop: m(10),
  },
  photoButtonsRow: { flexDirection: 'row', gap: m(12), marginBottom: m(8) },
  photoButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(16),
    backgroundColor: BRAND_SOFT,
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: BRAND_BORDER,
    gap: m(6),
  },
  photoButtonText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primarySemiBold,
    color: '#333',
  },
  removePhotoButton: { alignItems: 'center', marginBottom: m(16) },
  removePhotoText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primarySemiBold,
    color: BRAND_TEAL,
  },
  overviewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: m(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: m(16),
    marginTop: m(8),
    marginBottom: m(16),
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: m(10),
    marginBottom: m(10),
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  overviewHeaderTitle: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.primarySemiBold,
    color: '#64748B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  roleBadge: {
    backgroundColor: BRAND_SOFT,
    paddingHorizontal: m(10),
    paddingVertical: m(4),
    borderRadius: m(999),
  },
  roleBadgeText: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.primarySemiBold,
    color: BRAND_TEAL,
  },
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: m(12) },
  overviewCol: { width: '46%' },
  overviewColFull: { width: '100%' },
  overviewLabel: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.primarySemiBold,
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: m(2),
  },
  overviewValue: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#1E293B',
  },
  overviewValueMono: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#1E293B',
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
    marginTop: m(12),
    paddingTop: m(10),
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  consentText: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.primarySemiBold,
    color: BRAND_TEAL,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#F8B4B4',
    borderRadius: m(10),
    padding: m(12),
    gap: m(8),
    marginBottom: m(16),
  },
  errorText: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#D93025',
    lineHeight: m(18),
  },
  actionRow: { flexDirection: 'row', gap: m(12), marginTop: m(4) },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(16),
    backgroundColor: '#FFFFFF',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: BRAND_TEAL,
    gap: m(6),
  },
  backButtonText: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.primarySemiBold,
    color: BRAND_TEAL,
  },
  registerButtonContainer: {
    flex: 2,
    borderRadius: m(12),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: BRAND_TEAL,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  registerButtonGradient: {
    minHeight: m(54),
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.primarySemiBold,
    color: '#FFFFFF',
  },
  disabledButton: { opacity: 0.6 },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: m(6),
    marginBottom: m(18),
  },
  progressStepWrap: { flexDirection: 'row', alignItems: 'center' },
  progressStep: {
    width: m(30),
    height: m(30),
    borderRadius: m(15),
    backgroundColor: '#516178',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStepComplete: { backgroundColor: BRAND_TEAL },
  progressStepActive: {
    backgroundColor: BRAND_TEAL,
    borderWidth: 3,
    borderColor: '#46B89D',
  },
  progressStepText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primarySemiBold,
    color: '#FFFFFF',
  },
  progressLine: { width: m(42), height: 2, backgroundColor: '#516178' },
  progressLineActive: { backgroundColor: BRAND_TEAL },
});
