import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import { updateUser } from '../../../Redux/Slices/authslice';
import useFetchUserFromStorage from '../../../Redux/hooks/useFetchUserFromStorage';

const EditProfile = ({ navigation }) => {
  const dispatch = useDispatch();
  const profileData = useSelector(state => state.auth.user);
  useFetchUserFromStorage();

  const [saving, setSaving] = useState(false);
  
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
      await dispatch(updateUser(dataToSave)).unwrap();
      
      // Show success message
      Toast.show({ 
        type: 'success', 
        text1: 'Profile Updated', 
        text2: 'Your changes have been saved successfully' 
      });
      
      // Navigate back after a short delay to ensure toast is shown
      setTimeout(() => {
        setSaving(false);
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
});

export default EditProfile;
