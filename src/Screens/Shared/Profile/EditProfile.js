import React, { useState, useCallback } from 'react';
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
  Image,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { m } from '../../../Utils/responsive';
import { colors, FontFamily } from '../../../constants';
import { ScreenWrapper } from '../../../Components/common';
import { updateUser } from '../../../Redux/Slices/authslice';
import useFetchUserFromStorage from '../../../Redux/hooks/useFetchUserFromStorage';

const EditProfile = ({ navigation }) => {
  const dispatch = useDispatch();
  const profileData = useSelector(state => state.auth.user);
  useFetchUserFromStorage();

  const [saving, setSaving] = useState(false);

  // Helper function to extract only numeric digits (strip +91 prefix)
  const getDisplayPhoneNumber = (fullNumber) => {
    if (!fullNumber) return '';
    return fullNumber.replace(/^\+91/, '');
  };

  const [editedData, setEditedData] = useState({
    userName: profileData?.userName || profileData?.name || '',
    mobileNo: profileData?.mobileNo || profileData?.phone || '',
    email: profileData?.email || '',
    address: profileData?.address || '',
  });

  const [displayMobileNo, setDisplayMobileNo] = useState(
    getDisplayPhoneNumber(profileData?.mobileNo || profileData?.phone || '')
  );

  const avatarUrl = profileData?.profileImage || profileData?.avatar || profileData?.image;
  const initials = (editedData.userName || profileData?.name || 'Admin')
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AD';

  // Synchronize state when Redux user data updates
  useFocusEffect(
    useCallback(() => {
      const currentPhone = profileData?.mobileNo || profileData?.phone || '';
      setDisplayMobileNo(getDisplayPhoneNumber(currentPhone));
      setEditedData({
        userName: profileData?.userName || profileData?.name || '',
        mobileNo: currentPhone,
        email: profileData?.email || '',
        address: profileData?.address || '',
      });
    }, [profileData])
  );

  const handlePhoneNumberChange = (text) => {
    const numericOnly = text.replace(/[^0-9]/g, '');
    const limitedNumber = numericOnly.slice(0, 10);
    setDisplayMobileNo(limitedNumber);

    const fullNumber = limitedNumber.length === 10 ? `+91${limitedNumber}` : limitedNumber;
    setEditedData({ ...editedData, mobileNo: fullNumber });
  };

  const handleSaveChanges = async () => {
    const trimmedName = editedData.userName?.trim();

    if (!trimmedName) {
      Toast.show({
        type: 'error',
        text1: 'Name Required',
        text2: 'Please enter your full name',
      });
      return;
    }

    const displayNumber = displayMobileNo;
    if (displayNumber && displayNumber.length > 0) {
      if (displayNumber.length !== 10) {
        Toast.show({
          type: 'error',
          text1: 'Invalid Phone Number',
          text2: 'Please enter a valid 10-digit mobile number',
        });
        return;
      }

      const firstDigit = displayNumber.charAt(0);
      if (!['6', '7', '8', '9'].includes(firstDigit)) {
        Toast.show({
          type: 'error',
          text1: 'Invalid Phone Number',
          text2: 'Mobile number must start with 6, 7, 8, or 9',
        });
        return;
      }
    }

    setSaving(true);

    const dataToSave = {};

    if (trimmedName !== (profileData?.userName || profileData?.name)) {
      dataToSave.userName = trimmedName;
    }

    const newMobileFull = editedData.mobileNo || '';
    const oldMobileFull = profileData?.mobileNo || profileData?.phone || '';
    if (newMobileFull !== oldMobileFull) {
      dataToSave.mobileNo = newMobileFull;
    }

    if (editedData.email !== profileData?.email) {
      dataToSave.email = editedData.email;
    }

    if (editedData.address !== profileData?.address) {
      dataToSave.address = editedData.address;
    }

    if (Object.keys(dataToSave).length === 0) {
      Toast.show({ type: 'info', text1: 'No changes detected' });
      setSaving(false);
      navigation.goBack();
      return;
    }

    try {
      await dispatch(updateUser(dataToSave)).unwrap();

      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your profile changes have been saved',
      });

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
        text2: errorMessage,
      });
      setSaving(false);
    }
  };

  return (
    <ScreenWrapper
      backgroundColor={colors.backgroundGreenWhite}
      topInsetBg={colors.primary}
      statusBarColor={colors.primary}
      statusBarStyle="dark-content"
      includeTabBarClearance={false}
      scrollable={false}
    >
      <KeyboardAvoidingView
        style={styles.pageWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Fixed Top Mint Green Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={m(22)} color={colors.white} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Edit Profile</Text>

          <View style={styles.headerPlaceholder} />
        </View>

        {/* Curved Sheet Container */}
        <View style={styles.sheetSection}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Avatar Profile Preview */}
            <View style={styles.avatarCard}>
              <View style={styles.avatarCircle}>
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
              </View>
              <Text style={styles.avatarName}>
                {editedData.userName || profileData?.name || 'Administrator'}
              </Text>
              <Text style={styles.avatarSubtitle}>
                {profileData?.email || 'admin@loanhub.internal'}
              </Text>
            </View>

            {/* Form Fields - Pastel Mint Input Containers */}
            <View style={styles.formContainer}>
              {/* Full Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Full Name *</Text>
                <View style={styles.inputContainer}>
                  <Feather
                    name="user"
                    size={m(16)}
                    color={colors.lettersAndIcons}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={editedData.userName}
                    onChangeText={text => setEditedData({ ...editedData, userName: text })}
                    placeholder="Enter your full name"
                    placeholderTextColor="#7E9D86"
                    autoCapitalize="words"
                    maxLength={50}
                  />
                </View>
              </View>

              {/* Mobile Number */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Mobile Number</Text>
                <View style={styles.inputContainer}>
                  <Feather
                    name="phone"
                    size={m(16)}
                    color={colors.lettersAndIcons}
                    style={styles.inputIcon}
                  />
                  <Text style={styles.phonePrefix}>+91</Text>
                  <TextInput
                    style={styles.input}
                    value={displayMobileNo}
                    onChangeText={handlePhoneNumberChange}
                    placeholder="10-digit mobile number"
                    placeholderTextColor="#7E9D86"
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
              </View>

              {/* Email Address */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email Address</Text>
                <View style={styles.inputContainer}>
                  <Feather
                    name="mail"
                    size={m(16)}
                    color={colors.lettersAndIcons}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={editedData.email}
                    onChangeText={text => setEditedData({ ...editedData, email: text })}
                    placeholder="Enter email address"
                    placeholderTextColor="#7E9D86"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    maxLength={100}
                  />
                </View>
              </View>

              {/* Address / Location */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Office Address / City</Text>
                <View style={styles.inputContainer}>
                  <Feather
                    name="map-pin"
                    size={m(16)}
                    color={colors.lettersAndIcons}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={editedData.address}
                    onChangeText={text => setEditedData({ ...editedData, address: text })}
                    placeholder="Enter address or location"
                    placeholderTextColor="#7E9D86"
                    maxLength={100}
                  />
                </View>
              </View>
            </View>

            {/* Actions: Save Button (Primary Pill) & Cancel */}
            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                activeOpacity={0.85}
                onPress={handleSaveChanges}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.lettersAndIcons} />
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                activeOpacity={0.7}
                onPress={() => navigation.goBack()}
                disabled={saving}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  pageWrapper: {
    flex: 1,
    backgroundColor: colors.primary,
  },

  // Fixed Top Mint Green Header
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: m(18),
    paddingTop: m(12),
    paddingBottom: m(16),
  },
  backBtn: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    backgroundColor: 'rgba(9, 48, 48, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: m(19),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: m(36),
  },

  // Curved Sheet
  sheetSection: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(36),
    borderTopRightRadius: m(36),
    paddingTop: m(16),
  },
  scrollContent: {
    paddingHorizontal: m(18),
    paddingBottom: m(90),
  },

  // Avatar Profile Preview
  avatarCard: {
    alignItems: 'center',
    paddingVertical: m(12),
    marginBottom: m(8),
  },
  avatarCircle: {
    width: m(82),
    height: m(82),
    borderRadius: m(41),
    borderWidth: m(3),
    borderColor: colors.white,
    backgroundColor: colors.white,
    overflow: 'hidden',
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: m(10),
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: m(41),
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: m(41),
    backgroundColor: colors.oceanBlueButton,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: m(26),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  avatarName: {
    fontSize: m(18),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  avatarSubtitle: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryMedium,
    color: '#5A7A71',
    marginTop: m(2),
  },

  // Form
  formContainer: {
    marginTop: m(6),
  },
  fieldGroup: {
    marginBottom: m(16),
  },
  fieldLabel: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(6),
    marginLeft: m(4),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGreen,
    borderRadius: m(18),
    height: m(50),
    paddingHorizontal: m(16),
  },
  inputIcon: {
    marginRight: m(10),
  },
  phonePrefix: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginRight: m(8),
  },
  input: {
    flex: 1,
    fontSize: m(14),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
    padding: 0,
  },

  // Action Buttons
  actionContainer: {
    marginTop: m(16),
    gap: m(10),
  },
  saveBtn: {
    backgroundColor: colors.primary,
    height: m(50),
    borderRadius: m(25),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnDisabled: {
    opacity: 0.65,
  },
  saveBtnText: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  cancelBtn: {
    height: m(46),
    borderRadius: m(23),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(9, 48, 48, 0.15)',
  },
  cancelBtnText: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
});

export default EditProfile;
