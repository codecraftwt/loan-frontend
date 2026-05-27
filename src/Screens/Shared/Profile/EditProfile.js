import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  PermissionsAndroid,
  Alert,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import PromptBox from '../../PromptBox/Prompt';
import {
  deleteProfileImage,
  updateUser,
  updateUserProfile,
} from '../../../Redux/Slices/authslice';
import useFetchUserFromStorage from '../../../Redux/hooks/useFetchUserFromStorage';

const requestCameraPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'App needs access to your camera to take profile photos.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    return true;
  } catch (err) {
    console.warn(err);
    return false;
  }
};

const EditProfile = ({ navigation }) => {
  const dispatch = useDispatch();
  const profileData = useSelector(state => state.auth.user);
  useFetchUserFromStorage();

  const [isDeleteImagePromptVisible, setIsDeleteImagePromptVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isImagePickerModalVisible, setIsImagePickerModalVisible] = useState(false);
  
  // Helper function to extract only the numeric part (remove +91)
  const getDisplayPhoneNumber = (fullNumber) => {
    if (!fullNumber) return '';
    // Remove +91 prefix if present
    return fullNumber.replace(/^\+91/, '');
  };
  
  const [editedData, setEditedData] = useState({
    userName: profileData?.userName || '',
    mobileNo: profileData?.mobileNo || '',
    email: profileData?.email || '',
    address: profileData?.address || '',
  });
  
  // For display in the input field (without +91)
  const [displayMobileNo, setDisplayMobileNo] = useState(
    getDisplayPhoneNumber(profileData?.mobileNo || '')
  );

  // Refresh editedData when profileData changes
  useFocusEffect(
    useCallback(() => {
      const newDisplayNumber = getDisplayPhoneNumber(profileData?.mobileNo || '');
      setDisplayMobileNo(newDisplayNumber);
      setEditedData({
        userName: profileData?.userName || '',
        mobileNo: profileData?.mobileNo || '',
        email: profileData?.email || '',
        address: profileData?.address || '',
      });
    }, [profileData])
  );

  // Profile Image Functions
  const handleProfileImageOption = (option) => {
    setIsImagePickerModalVisible(false);
    
    switch(option) {
      case 'camera':
        launchCameraAction();
        break;
      case 'gallery':
        launchGalleryAction();
        break;
      case 'remove':
        if (profileData?.profileImage) {
          setIsDeleteImagePromptVisible(true);
        } else {
          Toast.show({ 
            type: 'info', 
            text1: 'No Image', 
            text2: 'You don\'t have a profile image to remove' 
          });
        }
        break;
      default:
        break;
    }
  };

const launchCameraAction = async () => {
  const hasPermission = await requestCameraPermission();

  if (!hasPermission) {
    Alert.alert(
      'Permission Denied',
      'Camera permission is required to take photos.'
    );
    return;
  }

  const options = {
    mediaType: 'photo',
    cameraType: 'front',
    quality: 1,
    saveToPhotos: true,
  };

  launchCamera(options, response => {
    if (response.didCancel) {
      return;
    }

    if (response.errorCode) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: response.errorMessage,
      });
      return;
    }

    if (response.assets && response.assets[0]) {
      handleImageUpload(response.assets[0]);
    }
  });
};

  const launchGalleryAction = () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
    };
    
    launchImageLibrary(options, response => {
      if (response.didCancel) {
        return;
      }
      if (response.errorCode) {
        Toast.show({ type: 'error', text1: 'Error', text2: response.errorMessage });
        return;
      }
      if (response.assets && response.assets[0]) {
        handleImageUpload(response.assets[0]);
      }
    });
  };

  const handleImageUpload = async asset => {
    try {
      setLoading(true);
      const { uri, type, fileName } = asset;
      const formData = new FormData();
      formData.append('profileImage', { 
        uri, 
        type, 
        name: fileName || 'profile.jpg' 
      });
      await dispatch(updateUserProfile(formData)).unwrap();
      Toast.show({ type: 'success', text1: 'Profile Image Updated' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Image Update Failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfileImage = () => setIsDeleteImagePromptVisible(true);
  
  const handleConfirmDeleteImage = async () => {
    try {
      await dispatch(deleteProfileImage()).unwrap();
      Toast.show({ type: 'success', text1: 'Profile Image Deleted' });
      setIsDeleteImagePromptVisible(false);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Delete Failed' });
      setIsDeleteImagePromptVisible(false);
    }
  };

  const handleSaveChanges = async () => {
    // Validate name field - cannot be empty
    const trimmedName = editedData.userName?.trim();
    
    if (!trimmedName) {
      Toast.show({ 
        type: 'error', 
        text1: 'Name Required', 
        text2: 'Please enter your name' 
      });
      return;
    }

    // Only validate phone if it's not empty
    const displayNumber = displayMobileNo;
    if (displayNumber && displayNumber.length > 0) {
      if (displayNumber.length !== 10) {
        Toast.show({ 
          type: 'error', 
          text1: 'Invalid Phone Number', 
          text2: 'Please enter a valid 10-digit mobile number' 
        });
        return;
      }
      
      // Validate phone number starts with valid digit (6-9)
      const firstDigit = displayNumber.charAt(0);
      if (!['6', '7', '8', '9'].includes(firstDigit)) {
        Toast.show({ 
          type: 'error', 
          text1: 'Invalid Phone Number', 
          text2: 'Mobile number must start with 6, 7, 8, or 9' 
        });
        return;
      }
    }

    setSaving(true);
    
    // Prepare data to save - only include fields that have changed
    const dataToSave = {};
    
    if (trimmedName !== profileData?.userName) {
      dataToSave.userName = trimmedName;
    }
    
    // Only include mobile if it was changed
    const newMobileFull = editedData.mobileNo || '';
    const oldMobileFull = profileData?.mobileNo || '';
    if (newMobileFull !== oldMobileFull) {
      dataToSave.mobileNo = newMobileFull;
    }
    
    if (editedData.email !== profileData?.email) {
      dataToSave.email = editedData.email;
    }
    
    if (editedData.address !== profileData?.address) {
      dataToSave.address = editedData.address;
    }
    
    // If no changes, just go back
    if (Object.keys(dataToSave).length === 0) {
      Toast.show({ type: 'info', text1: 'No changes to save' });
      setSaving(false);
      navigation.goBack();
      return;
    }

    try {
      const result = await dispatch(updateUser(dataToSave)).unwrap();
      
      // Show success message
      Toast.show({ 
        type: 'success', 
        text1: 'Profile Updated', 
        text2: 'Your changes have been saved successfully' 
      });
      
      // Navigate back after a short delay to ensure toast is shown
      setTimeout(() => {
        navigation.goBack();
      }, 500);
      
    } catch (err) {
      console.error('Update error details:', err);
      let errorMessage = 'Update Failed';
      
      if (typeof err === 'string') {
        errorMessage = err;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (err?.data?.message) {
        errorMessage = err.data.message;
      }
      
      Toast.show({ 
        type: 'error', 
        text1: 'Update Failed', 
        text2: errorMessage 
      });
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  // Handle phone number input - only allow numbers and update both states
  const handlePhoneNumberChange = (text) => {
    // Remove all non-numeric characters
    const numericOnly = text.replace(/[^0-9]/g, '');
    
    // Limit to 10 digits for display
    const limitedNumber = numericOnly.slice(0, 10);
    setDisplayMobileNo(limitedNumber);
    
    // Store the full number with +91 prefix in editedData
    const fullNumber = limitedNumber.length === 10 ? `+91${limitedNumber}` : '';
    setEditedData({ ...editedData, mobileNo: fullNumber });
  };

  const renderField = (icon, label, value, editable = false, keyName, iconColor = '#3B82F6') => {
    const isPhoneField = keyName === 'mobileNo';
    
    return (
      <View style={styles.fieldCard}>
        <View style={[styles.fieldIconContainer, { backgroundColor: iconColor + '15' }]}>
          <Icon name={icon} size={22} color={iconColor} />
        </View>
        <View style={styles.fieldContent}>
          <Text style={styles.fieldLabel}>{label}</Text>
          {editable ? (
            isPhoneField ? (
              <View style={styles.phoneInputContainer}>
                <View style={styles.countryCodeContainer}>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  value={displayMobileNo}
                  onChangeText={handlePhoneNumberChange}
                  placeholder="Enter 10-digit mobile number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            ) : (
              <TextInput
                style={styles.fieldInput}
                value={editedData[keyName]}
                onChangeText={text => setEditedData({ ...editedData, [keyName]: text })}
                placeholder={`Enter ${label.toLowerCase()}`}
                placeholderTextColor="#9CA3AF"
                keyboardType={keyName === 'email' ? 'email-address' : 'default'}
                maxLength={keyName === 'email' ? 100 : 50}
              />
            )
          ) : (
            <Text style={styles.fieldValue}>
              {isPhoneField ? getDisplayPhoneNumber(value) : (value || 'Not provided')}
            </Text>
          )}
        </View>
      </View>
    );
  };

  // Image Picker Modal Component
  const renderImagePickerModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isImagePickerModalVisible}
      onRequestClose={() => setIsImagePickerModalVisible(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setIsImagePickerModalVisible(false)}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Profile Image</Text>
            <TouchableOpacity onPress={() => setIsImagePickerModalVisible(false)}>
              <Icon name="x" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.modalOption} 
            onPress={() => handleProfileImageOption('camera')}
          >
            <View style={[styles.modalOptionIcon, { backgroundColor: '#3B82F6' }]}>
              <Icon name="camera" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.modalOptionText}>Take Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.modalOption} 
            onPress={() => handleProfileImageOption('gallery')}
          >
            <View style={[styles.modalOptionIcon, { backgroundColor: '#10B981' }]}>
              <Icon name="image" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.modalOptionText}>Choose from Gallery</Text>
          </TouchableOpacity>
          
          {profileData?.profileImage && (
            <TouchableOpacity 
              style={[styles.modalOption, styles.modalOptionRemove]} 
              onPress={() => handleProfileImageOption('remove')}
            >
              <View style={[styles.modalOptionIcon, { backgroundColor: '#EF4444' }]}>
                <Icon name="trash-2" size={22} color="#FFFFFF" />
              </View>
              <Text style={[styles.modalOptionText, styles.modalOptionRemoveText]}>
                Remove Photo
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.modalCancelButton} 
            onPress={() => setIsImagePickerModalVisible(false)}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header title="Edit Profile" showBackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Card */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.profileImageSection}>
            <TouchableOpacity 
              style={styles.imageContainer}
              onPress={() => setIsImagePickerModalVisible(true)}
              activeOpacity={0.9}
            >
              {profileData?.profileImage ? (
                <Image
                  source={{ uri: profileData.profileImage }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.defaultProfileIcon}>
                  <Icon name="user" size={56} color="#FFFFFF" />
                </View>
              )}

              {/* Camera Icon Overlay - Always show in edit mode */}
              <View style={styles.cameraBtn}>
                <LinearGradient
                  colors={['#3B82F6', '#2563EB']}
                  style={styles.cameraIconBg}
                >
                  <Icon name="camera" size={18} color="#FFFFFF" />
                </LinearGradient>
              </View>
            </TouchableOpacity>

            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color="#3B82F6" />
              </View>
            )}

            <View style={styles.userNameSection}>
              <TextInput
                style={styles.userNameInput}
                value={editedData.userName}
                onChangeText={text => setEditedData({ ...editedData, userName: text })}
                placeholder="Enter your name"
                placeholderTextColor="#9CA3AF"
                maxLength={50}
              />
            </View>
          </View>
        </View>

        {/* Profile Information Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <Icon name="info" size={20} color="#3B82F6" />
            <Text style={styles.infoCardTitle}>Personal Information</Text>
          </View>

          <View style={styles.fieldsContainer}>
            {renderField('user', 'Name', profileData?.userName, true, 'userName', '#3B82F6')}
            {renderField('phone', 'Phone Number', profileData?.mobileNo, true, 'mobileNo', '#10B981')}
            {renderField('mail', 'Email Address', profileData?.email, true, 'email', '#F59E0B')}
            {renderField('map-pin', 'Address', profileData?.address, true, 'address', '#EF4444')}
          </View>
        </View>

        {/* Edit Action Buttons */}
        <View style={styles.editActionButtons}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSaveChanges}
            activeOpacity={0.8}
            disabled={saving}
          >
            <LinearGradient
              colors={saving ? ['#d1d5db', '#9ca3af'] : ['#ff9100ff', '#ffa200ff']}
              style={styles.saveButtonGradient}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelEditButton}
            onPress={handleCancel}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelEditText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Image Picker Modal */}
      {renderImagePickerModal()}

      {/* Prompt Box for Delete Confirmation */}
      <PromptBox
        visible={isDeleteImagePromptVisible}
        message="Are you sure you want to delete your profile image?"
        onConfirm={handleConfirmDeleteImage}
        onCancel={() => setIsDeleteImagePromptVisible(false)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: m(16),
    paddingBottom: m(100),
  },
  // Profile Header Card
  profileHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(20),
    padding: m(24),
    marginBottom: m(16),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  profileImageSection: {
    alignItems: 'center',
    width: '100%',
  },
  imageContainer: {
    width: m(120),
    height: m(120),
    borderRadius: m(60),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: m(20),
    borderWidth: 4,
    borderColor: '#DBEAFE',
  },
  defaultProfileIcon: {
    width: m(120),
    height: m(120),
    borderRadius: m(60),
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: m(120),
    height: m(120),
    borderRadius: m(60),
  },
  cameraBtn: {
    position: 'absolute',
    bottom: m(0),
    right: m(0),
    width: m(40),
    height: m(40),
    borderRadius: m(20),
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  cameraIconBg: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: m(140),
    alignItems: 'center',
    justifyContent: 'center',
  },
  userNameSection: {
    width: '100%',
    alignItems: 'center',
  },
  userNameInput: {
    fontSize: m(24),
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
    paddingHorizontal: m(12),
    paddingVertical: m(8),
    minWidth: m(200),
    backgroundColor: '#F9FAFB',
    borderRadius: m(8),
  },
  // Info Card
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(20),
    padding: m(20),
    marginBottom: m(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(20),
    gap: m(10),
  },
  infoCardTitle: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#111827',
  },
  fieldsContainer: {
    gap: m(16),
  },
  fieldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: m(16),
    backgroundColor: '#F9FAFB',
    borderRadius: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: m(16),
  },
  fieldIconContainer: {
    width: m(48),
    height: m(48),
    borderRadius: m(14),
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: m(13),
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: m(6),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#111827',
    lineHeight: m(22),
  },
  fieldInput: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#111827',
    borderBottomWidth: 1.5,
    borderBottomColor: '#3B82F6',
    paddingVertical: m(6),
    paddingHorizontal: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: m(4),
    paddingLeft: m(8),
  },
  // Phone input specific styles
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
    borderRadius: m(4),
    paddingLeft: m(8),
  },
  countryCodeContainer: {
    paddingRight: m(8),
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    marginRight: m(8),
  },
  countryCodeText: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#111827',
  },
  phoneInput: {
    flex: 1,
    fontSize: m(16),
    fontWeight: '600',
    color: '#111827',
    paddingVertical: m(6),
    paddingHorizontal: 0,
  },
  // Edit Action Buttons
  editActionButtons: {
    marginTop: m(22),
    gap: m(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: m(20),
  },
  saveButton: {
    borderRadius: m(16),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    width: m(160),
    height: m(56),
    marginHorizontal: m(4),
  },
  saveButtonDisabled: {
    opacity: 0.7,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    gap: m(10),
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: m(16),
    fontWeight: '700',
  },
  cancelEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#E5E7EB',
    borderWidth: 1.5,
    borderRadius: m(16),
    backgroundColor: '#FFFFFF',
    width: m(160),
    height: m(56),
    marginHorizontal: m(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelEditText: {
    color: '#6B7280',
    fontSize: m(16),
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: m(20),
    borderTopRightRadius: m(20),
    padding: m(20),
    paddingBottom: m(34),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(20),
    paddingBottom: m(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#111827',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: m(14),
    paddingHorizontal: m(12),
    borderRadius: m(12),
    marginBottom: m(8),
    backgroundColor: '#F9FAFB',
  },
  modalOptionRemove: {
    backgroundColor: '#FEF2F2',
  },
  modalOptionIcon: {
    width: m(44),
    height: m(44),
    borderRadius: m(22),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(16),
  },
  modalOptionText: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#111827',
  },
  modalOptionRemoveText: {
    color: '#EF4444',
  },
  modalCancelButton: {
    marginTop: m(12),
    paddingVertical: m(14),
    alignItems: 'center',
    borderRadius: m(12),
    backgroundColor: '#F3F4F6',
  },
  modalCancelText: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#6B7280',
  },
});

export default EditProfile;