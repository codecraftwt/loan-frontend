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
  KeyboardAvoidingView
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
  const isLoading = useSelector(state => state.auth.loading);

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

  const handleLogout = () => setIsPromptVisible(true);
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

  const renderField = (icon, label, value, editable = false, keyName) => (
    <View style={styles.fieldRow}>
      <Icon name={icon} size={22} color="#ff6700" />
      <View style={{ flex: 1, marginLeft: m(10) }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {editable ? (
          <TextInput
            style={styles.fieldInput}
            value={editedData[keyName]}
            onChangeText={text => setEditedData({ ...editedData, [keyName]: text })}
            placeholder={`Enter ${label.toLowerCase()}`}
            placeholderTextColor="#999"
          />
        ) : (
          <Text style={styles.fieldValue}>{value || '-'}</Text>
        )}
      </View>
    </View>
  );

  return (
    // <View style={{ flex: 1, backgroundColor: '#f9f9f9' }}>
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f9f9f9' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Conditional Header based on edit mode */}
      {isEditing ? (
        <Header
          title="Edit your profile"
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
      >
        {/* Profile Card */}
        <LinearGradient
          colors={['#fff', '#fff']}
          style={styles.profileCard}>
          <View style={styles.imageContainer}>
            {profileData?.profileImage ? (
              <Image
                source={{ uri: profileData.profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.defaultProfileIcon}>
                <Icon name="user" size={60} color="#ff6700" />
              </View>
            )}

            {/* Camera Icon Overlay - Only show when not editing or in edit mode */}
            {(isEditing || !isEditing) && (
              <TouchableOpacity
                style={styles.cameraBtn}
                onPress={() => handleProfileImage('gallery')}
              >
                <LinearGradient
                  colors={['#ff6700', '#ff9100']}
                  style={styles.cameraIconBg}
                >
                  <Icon name="camera" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Delete Image - Only show when has image and in edit mode */}
            {profileData?.profileImage && isEditing && (
              <TouchableOpacity
                style={styles.deleteImageBtn}
                onPress={handleDeleteProfileImage}
              >
                <Icon name="trash" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          {isEditing ? (
            <TextInput
              style={styles.userNameInput}
              value={editedData.userName}
              onChangeText={text => setEditedData({ ...editedData, userName: text })}
              placeholder="Enter your name"
              placeholderTextColor="#999"
              maxLength={50}
            />
          ) : (
            <Text style={styles.userName}>{profileData?.userName || 'User Name'}</Text>
          )}
        </LinearGradient>

        {loading && <ActivityIndicator size="large" color="#ff6700" style={{ marginTop: m(20) }} />}

        {/* Profile Fields */}
        <View style={styles.fieldsContainer}>
          {renderField('user', 'Name', profileData?.userName, isEditing, 'userName')}
          {renderField('phone', 'Phone', profileData?.mobileNo, isEditing, 'mobileNo')}
          {renderField('mail', 'Email', profileData?.email, isEditing, 'email')}
          {renderField('map-pin', 'Address', profileData?.address, isEditing, 'address')}
        </View>

        {/* Edit mode action buttons */}
        {isEditing && (
          <View style={styles.editActionButtons}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveChanges}
            >
              <LinearGradient
                colors={['#ff6700', '#ff9100']}
                style={styles.saveButtonGradient}
              >
                <Icon name="check" size={22} color="#fff" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelEditButton}
              onPress={handleCancelEdit}
            >
              <Icon name="x" size={22} color="#ff6700" />
              <Text style={styles.cancelEditText}>Cancel Edit</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Cancel/Back Button - Only show when not in edit mode */}
        {!isEditing && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Icon name="arrow-left" size={22} color="#ff6700" />
            <Text style={styles.cancelText}>Go Back</Text>
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
  // Edit Mode Header
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: m(16),
    paddingTop: Platform.OS === 'ios' ? m(50) : m(40),
    paddingBottom: m(16),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    padding: m(8),
  },
  // Profile Card
  profileCard: {
    alignItems: 'center',
    paddingVertical: m(20),
    borderRadius: m(16),
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: m(4) },
    shadowOpacity: 0.1,
    shadowRadius: m(8),
    elevation: 5,
    marginBottom: m(16),
  },
  imageContainer: {
    width: m(90),
    height: m(90),
    borderRadius: m(45),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    position: 'relative',
    borderWidth: 3,
    borderColor: '#ff6700',
    marginBottom: m(12),
  },
  defaultProfileIcon: {
    width: m(90),
    height: m(90),
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: m(90),
    height: m(90),
    borderRadius: m(45),
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: m(40),
    height: m(40),
    borderRadius: m(20),
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  cameraIconBg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    borderRadius: m(20),
  },
  deleteImageBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#ff4444',
    padding: m(6),
    borderRadius: m(20),
    elevation: 2,
  },
  userName: {
    fontSize: m(20),
    fontWeight: 'bold',
    color: '#333333ff',
  },
  userNameInput: {
    fontSize: m(20),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#ff6700',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    minWidth: m(200),
    textAlign: 'center',
  },

  // Fields
  fieldsContainer: {
    backgroundColor: '#fff',
    borderRadius: m(16),
    padding: m(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: m(2) },
    shadowOpacity: 0.05,
    shadowRadius: m(4),
    elevation: 2,
    marginBottom: m(16),
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: m(20),
    paddingBottom: m(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  fieldLabel: {
    fontSize: m(14),
    color: '#777',
    marginBottom: m(4),
  },
  fieldValue: {
    fontSize: m(16),
    fontWeight: '500',
    color: '#333',
  },
  fieldInput: {
    fontSize: m(16),
    borderBottomWidth: 1,
    borderBottomColor: '#ff6700',
    color: '#333',
    paddingVertical: m(4),
    paddingHorizontal: 0,
    flex: 1,
  },

  // Edit Action Buttons
  editActionButtons: {
    marginTop: m(10),
    gap: m(12),
  },
  saveButton: {
    borderRadius: m(12),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#ff6700',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(12),
    gap: m(10),
  },
  saveButtonText: {
    color: '#fff',
    fontSize: m(16),
    fontWeight: 'bold',
  },
  cancelEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#ff6700',
    borderWidth: 1,
    paddingVertical: m(12),
    borderRadius: m(12),
    gap: m(8),
  },
  cancelEditText: {
    color: '#ff6700',
    fontSize: m(16),
    fontWeight: 'bold',
  },

  // Cancel/Back Button
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#ff6700',
    borderWidth: 1,
    paddingVertical: m(14),
    borderRadius: m(12),
    marginTop: m(16),
    marginBottom: m(30),
  },
  cancelText: {
    color: '#ff6700',
    fontSize: m(16),
    fontWeight: 'bold',
    marginLeft: m(8),
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: m(16),
    paddingBottom: m(80),
  },
});

export default ProfileDetails;