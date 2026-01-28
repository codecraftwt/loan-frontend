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

const EditProfile = ({ navigation }) => {
  const dispatch = useDispatch();
  const profileData = useSelector(state => state.auth.user);

  useFetchUserFromStorage();

  const [isDeleteImagePromptVisible, setIsDeleteImagePromptVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const [editedData, setEditedData] = useState({
    userName: profileData?.userName || '',
    mobileNo: profileData?.mobileNo || '',
    email: profileData?.email || '',
    address: profileData?.address || '',
  });

  // Refresh editedData when profileData changes
  useFocusEffect(
    useCallback(() => {
      setEditedData({
        userName: profileData?.userName || '',
        mobileNo: profileData?.mobileNo || '',
        email: profileData?.email || '',
        address: profileData?.address || '',
      });
    }, [profileData])
  );

  // Profile Image Functions
  const handleProfileImage = action => {
    const options =
      action === 'camera'
        ? { mediaType: 'photo', cameraType: 'front', quality: 1, saveToPhotos: true }
        : { mediaType: 'photo', quality: 1 };

    const launch = action === 'camera' ? launchCamera : launchImageLibrary;
    launch(options, response => {
      if (response.didCancel || response.errorCode)
        return Toast.show({ type: 'error', text1: 'Cancelled or Error' });
      handleImageUpload(response.assets[0]);
    });
  };

  const handleImageUpload = async asset => {
    try {
      setLoading(true);
      const { uri, type, fileName } = asset;
      const formData = new FormData();
      formData.append('profileImage', { uri, type, name: fileName || 'profile.jpg' });
      await dispatch(updateUserProfile(formData)).unwrap();
      setLoading(false);
      Toast.show({ type: 'success', text1: 'Profile Updated Successfully' });
    } catch (err) {
      setLoading(false);
      Toast.show({ type: 'error', text1: 'Profile Update Failed' });
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

    try {
      // Update with trimmed name
      const dataToSave = {
        ...editedData,
        userName: trimmedName,
      };
      await dispatch(updateUser(dataToSave)).unwrap();
      Toast.show({ type: 'success', text1: 'Profile Updated' });
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Update Failed' });
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  // Handle phone number input - only allow numbers
  const handlePhoneNumberChange = (text) => {
    // Remove all non-numeric characters
    const numericOnly = text.replace(/[^0-9]/g, '');
    setEditedData({ ...editedData, mobileNo: numericOnly });
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
            <TextInput
              style={styles.fieldInput}
              value={editedData[keyName]}
              onChangeText={isPhoneField 
                ? handlePhoneNumberChange 
                : (text => setEditedData({ ...editedData, [keyName]: text }))
              }
              placeholder={`Enter ${label.toLowerCase()}`}
              placeholderTextColor="#9CA3AF"
              keyboardType={isPhoneField ? 'phone-pad' : 'default'}
              maxLength={isPhoneField ? 10 : undefined}
            />
          ) : (
            <Text style={styles.fieldValue}>{value || 'Not provided'}</Text>
          )}
        </View>
      </View>
    );
  };

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
            <View style={styles.imageContainer}>
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
              <TouchableOpacity
                style={styles.cameraBtn}
                onPress={() => handleProfileImage('gallery')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#3B82F6', '#2563EB']}
                  style={styles.cameraIconBg}
                >
                  <Icon name="camera" size={18} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>

              {/* Delete Image - Only show when has image */}
              {profileData?.profileImage && (
                <TouchableOpacity
                  style={styles.deleteImageBtn}
                  onPress={handleDeleteProfileImage}
                  activeOpacity={0.8}
                >
                  <View style={styles.deleteImageIconBg}>
                    <Icon name="trash-2" size={16} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              )}
            </View>

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
            style={styles.saveButton}
            onPress={handleSaveChanges}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#ff9100ff', '#ffa200ff']}
              style={styles.saveButtonGradient}
            >
              <Text style={styles.saveButtonText}>Save</Text>
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

      {/* Prompt Box */}
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
  deleteImageBtn: {
    position: 'absolute',
    top: m(-4),
    right: m(-4),
    width: m(32),
    height: m(32),
    borderRadius: m(16),
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  deleteImageIconBg: {
    width: '100%',
    height: '100%',
    backgroundColor: '#EF4444',
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
});
export default EditProfile;