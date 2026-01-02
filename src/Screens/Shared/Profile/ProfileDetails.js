import React, { useState } from 'react';
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
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import PromptBox from '../../PromptBox/Prompt';
import {
  deleteProfileImage,
  logout,
  removeUserDeviceToken,
  updateUser,
  updateUserProfile,
} from '../../../Redux/Slices/authslice';
import useFetchUserFromStorage from '../../../Redux/hooks/useFetchUserFromStorage';

const ProfileDetails = ({ navigation }) => {
  const dispatch = useDispatch();
  const profileData = useSelector(state => state.auth.user);

  useFetchUserFromStorage();

  const [isPromptVisible, setIsPromptVisible] = useState(false);
  const [isDeleteImagePromptVisible, setIsDeleteImagePromptVisible] =
    useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [editedData, setEditedData] = useState({
    userName: profileData?.userName || '',
    mobileNo: profileData?.mobileNo || '',
    email: profileData?.email || '',
    address: profileData?.address || '',
  });

  const toggleEditMode = () => {
    if (!isEditing) {
      // When entering edit mode, update editedData with current profile data
      setEditedData({
        userName: profileData?.userName || '',
        mobileNo: profileData?.mobileNo || '',
        email: profileData?.email || '',
        address: profileData?.address || '',
      });
    }
    setIsEditing(prev => !prev);
  };

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

  const handleConfirmLogout = async () => {
    await dispatch(removeUserDeviceToken());
    dispatch(logout());
    navigation.replace('Login');
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
    try {
      await dispatch(updateUser(editedData)).unwrap();
      setIsEditing(false);
      Toast.show({ type: 'success', text1: 'Profile Updated' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Update Failed' });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (isEditing) {
      handleCancelEdit();
    } else {
      navigation.goBack();
    }
  };

  const renderField = (icon, label, value, editable = false, keyName, iconColor = '#3B82F6') => (
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
            onChangeText={text => setEditedData({ ...editedData, [keyName]: text })}
            placeholder={`Enter ${label.toLowerCase()}`}
            placeholderTextColor="#9CA3AF"
          />
        ) : (
          <Text style={styles.fieldValue}>{value || 'Not provided'}</Text>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Conditional Header based on edit mode */}
      {isEditing ? (
        <Header
          title="Edit Profile"
          showBackButton />
      ) : (
        <Header
          title="Profile Details"
          showBackButton
          isEdit={true}
          onEditPress={toggleEditMode}
        />
      )}

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
              
              {/* Camera Icon Overlay */}
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

              {/* Delete Image - Only show when has image and in edit mode */}
              {profileData?.profileImage && isEditing && (
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
              {isEditing ? (
                <TextInput
                  style={styles.userNameInput}
                  value={editedData.userName}
                  onChangeText={text => setEditedData({ ...editedData, userName: text })}
                  placeholder="Enter your name"
                  placeholderTextColor="#9CA3AF"
                  maxLength={50}
                />
              ) : (
                <Text style={styles.userName}>{profileData?.userName || 'User Name'}</Text>
              )}
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
            {renderField('user', 'Name', profileData?.userName, isEditing, 'userName', '#3B82F6')}
            {renderField('phone', 'Phone Number', profileData?.mobileNo, isEditing, 'mobileNo', '#10B981')}
            {renderField('mail', 'Email Address', profileData?.email, isEditing, 'email', '#F59E0B')}
            {renderField('map-pin', 'Address', profileData?.address, isEditing, 'address', '#EF4444')}
          </View>
        </View>

        {/* Edit mode action buttons */}
        {isEditing && (
          <View style={styles.editActionButtons}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveChanges}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                style={styles.saveButtonGradient}
              >
                <Icon name="check" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelEditButton}
              onPress={handleCancelEdit}
              activeOpacity={0.8}
            >
              <Icon name="x" size={20} color="#6B7280" />
              <Text style={styles.cancelEditText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Back Button - Only show when not in edit mode */}
        {!isEditing && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleCancel}
            activeOpacity={0.8}
          >
            <Icon name="arrow-left" size={20} color="#6B7280" />
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Prompt Boxes */}
      <PromptBox
        visible={isPromptVisible}
        message="Are you sure you want to logout?"
        onConfirm={handleConfirmLogout}
        onCancel={() => setIsPromptVisible(false)}
      />
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
  userName: {
    fontSize: m(24),
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
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
    marginTop: m(8),
    gap: m(12),
  },
  saveButton: {
    borderRadius: m(16),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(16),
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
    paddingVertical: m(16),
    borderRadius: m(16),
    backgroundColor: '#FFFFFF',
    gap: m(10),
  },
  cancelEditText: {
    color: '#6B7280',
    fontSize: m(16),
    fontWeight: '600',
  },
  // Back Button
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#E5E7EB',
    borderWidth: 1.5,
    paddingVertical: m(16),
    borderRadius: m(16),
    backgroundColor: '#FFFFFF',
    marginTop: m(8),
    gap: m(10),
  },
  backButtonText: {
    color: '#6B7280',
    fontSize: m(16),
    fontWeight: '600',
  },
});

export default ProfileDetails;
