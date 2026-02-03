import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Image,
  PermissionsAndroid
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../../Redux/Slices/authslice';
import Toast from 'react-native-toast-message';
import { m } from 'walstar-rn-responsive';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { FontFamily, FontSizes } from '../../constants';

export default function Register({ navigation }) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Step 1: Basic Info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // Step 2: Numbers
  const [aadharNumber, setAadharNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [panCardNumber, setPanCardNumber] = useState('');
  const [roleId, setRoleId] = useState(2);

  // Step 3: Profile Picture
  const [profileImage, setProfileImage] = useState(null);

  // Error states
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [aadharError, setAadharError] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [panCardError, setPanCardError] = useState('');

  const { isLoading } = useSelector(state => state.auth || {});
  const dispatch = useDispatch();

  const requestCameraPermission = async () => {
    if (Platform.OS !== 'android') {
      return true; // iOS handles permissions differently
    }
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: "App Needs Camera Access",
          message: "This app needs access to your camera to take a profile photo.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        }
      );
      // Check if permission was granted
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn("Camera permission error:", err);
      return false;
    }
  };

  // Simple input handlers - no validation while typing
  const handleNameChange = text => {
    setName(text);
    setNameError('');
  };

  const handleEmailChange = text => {
    // Convert the first letter to lowercase and keep the rest of the string intact
    const modifiedText = text.charAt(0).toLowerCase() + text.slice(1);

    // Set the modified email in the state
    setEmail(modifiedText);
    setEmailError('');
  };

  const handleAddressChange = text => {
    setAddress(text);
    setAddressError('');
  };

  const handlePasswordChange = text => {
    setPassword(text);
    setPasswordError('');
    setConfirmPasswordError('');
  };

  const handleConfirmPasswordChange = text => {
    setConfirmPassword(text);
    setConfirmPasswordError('');
  };

  const handleAadharChange = text => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 12) {
      setAadharNumber(numericText);
      setAadharError('');
    }
  };

  const handleMobileChange = text => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 10) {
      setMobileNumber(numericText);
      setMobileError('');
    }
  };

  const handlePanCardChange = text => {
    const upperText = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (upperText.length <= 10) {
      setPanCardNumber(upperText);
      setPanCardError('');
    }
  };

  // Validation functions - only called on button click
  const validateStep1 = () => {
    let hasError = false;

    if (!name || name.trim().length < 1) {
      setNameError('Name is required.');
      hasError = true;
    }

    if (!email || email.trim().length < 1) {
      setEmailError('Email is required.');
      hasError = true;
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        setEmailError('Please enter a valid email address.');
        hasError = true;
      }
    }

    if (!address || address.trim().length < 1) {
      setAddressError('Address is required.');
      hasError = true;
    }

    if (!password || password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      hasError = true;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password.');
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      hasError = true;
    }

    return !hasError;
  };

  const validateStep2 = () => {
    let hasError = false;

    if (!aadharNumber || aadharNumber.length !== 12) {
      setAadharError('Aadhar number must be exactly 12 digits.');
      hasError = true;
    }

    if (!mobileNumber || mobileNumber.length !== 10) {
      setMobileError('Mobile number must be 10 digits.');
      hasError = true;
    }

    if (panCardNumber && panCardNumber.length > 0) {
      if (panCardNumber.length !== 10) {
        setPanCardError(
          'PAN card must be 10 characters (5 letters, 4 digits, 1 letter).',
        );
        hasError = true;
      } else {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(panCardNumber)) {
          setPanCardError('Invalid PAN card format.');
          hasError = true;
        }
      }
    }

    if (roleId !== 0 && roleId !== 1 && roleId !== 2) {
      hasError = true;
    }

    return !hasError;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!validateStep1()) {
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Please fill in all fields correctly.',
        });
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!validateStep2()) {
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Please fill in all fields correctly.',
        });
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Image picker
  const handleImagePicker = async action => {
    // Request permission if using camera on Android
  if (action === 'camera' && Platform.OS === 'android') {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Toast.show({
        type: 'error',
        text1: 'Camera permission is required.',
      });
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

  const handleRegister = async () => {
    // Validate both steps before submitting
    const step1Valid = validateStep1();
    const step2Valid = validateStep2();

    if (!step1Valid || !step2Valid) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Please complete all steps correctly.',
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('userName', name);
      formData.append('email', email);
      formData.append('address', address);
      formData.append('password', password);
      formData.append('confirmPassword', confirmPassword);
      formData.append('aadharCardNo', aadharNumber);
      formData.append('mobileNo', mobileNumber);
      formData.append('roleId', roleId.toString());
      if (panCardNumber && panCardNumber.length === 10) {
        formData.append('panCardNumber', panCardNumber);
      }

      if (profileImage) {
        formData.append('profileImage', {
          uri: profileImage.uri,
          type: profileImage.type || 'image/jpeg',
          name: profileImage.fileName || 'profile.jpg',
        });
      }

      await dispatch(registerUser(formData)).unwrap();

      Toast.show({
        type: 'success',
        position: 'top',
        text1: 'Account created successfully!',
      });

      navigation.navigate('Login');
    } catch (error) {
      const errorMessage =
        (typeof error === 'string' ? error : null) ||
        error?.message ||
        (error?.missingFields
          ? `Missing fields: ${error.missingFields.join(', ')}`
          : null) ||
        'Registration failed. Please try again.';

      Toast.show({
        type: 'error',
        position: 'top',
        text1: errorMessage,
      });
    }
  };

  const renderStep1 = () => (
    <>
      <Text style={styles.stepTitle}>Basic Information</Text>
      <Text style={styles.stepSubtitle}>Enter your personal details</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Full Name</Text>
        <View
          style={[
            styles.inputContainer,
            nameError ? styles.inputError : {},
          ]}>
          <Ionicons
            name="person-outline"
            size={20}
            color={nameError ? '#FF4444' : '#ff7900'}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor="#999"
            value={name}
            onChangeText={handleNameChange}
          />
        </View>
        {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email Address</Text>
        <View
          style={[
            styles.inputContainer,
            emailError ? styles.inputError : {},
          ]}>
          <Ionicons
            name="mail-outline"
            size={20}
            color={emailError ? '#FF4444' : '#ff7900'}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            keyboardType="email-address"
            placeholderTextColor="#999"
            value={email}
            onChangeText={handleEmailChange}
          />
        </View>
        {emailError ? (
          <Text style={styles.errorText}>{emailError}</Text>
        ) : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Address</Text>
        <View
          style={[
            styles.inputContainer,
            addressError ? styles.inputError : {},
          ]}>
          <Ionicons
            name="location-outline"
            size={20}
            color={addressError ? '#FF4444' : '#ff7900'}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter your full address"
            placeholderTextColor="#999"
            value={address}
            onChangeText={handleAddressChange}
          />
        </View>
        {addressError ? (
          <Text style={styles.errorText}>{addressError}</Text>
        ) : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Password</Text>
        <View
          style={[
            styles.inputContainer,
            passwordError ? styles.inputError : {},
          ]}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color={passwordError ? '#FF4444' : '#ff7900'}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Create a password"
            secureTextEntry={!passwordVisible}
            placeholderTextColor="#999"
            value={password}
            onChangeText={handlePasswordChange}
          />
          <TouchableOpacity
            onPress={() => setPasswordVisible(!passwordVisible)}
            style={styles.eyeButton}>
            <Ionicons
              name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#ff7900"
            />
          </TouchableOpacity>
        </View>
        {passwordError ? (
          <Text style={styles.errorText}>{passwordError}</Text>
        ) : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Confirm Password</Text>
        <View
          style={[
            styles.inputContainer,
            confirmPasswordError ? styles.inputError : {},
          ]}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color={confirmPasswordError ? '#FF4444' : '#ff7900'}
            style={styles.inputIcon}
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Confirm your password"
            secureTextEntry={!confirmPasswordVisible}
            placeholderTextColor="#999"
            value={confirmPassword}
            onChangeText={handleConfirmPasswordChange}
          />
          <TouchableOpacity
            onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
            style={styles.eyeButton}>
            <Ionicons
              name={confirmPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#ff7900"
            />
          </TouchableOpacity>
        </View>
        {confirmPasswordError ? (
          <Text style={styles.errorText}>{confirmPasswordError}</Text>
        ) : null}
      </View>
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.stepTitle}>Identity Details</Text>
      <Text style={styles.stepSubtitle}>Enter your identification details</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Aadhar Card Number</Text>
        <View
          style={[
            styles.inputContainer,
            aadharError ? styles.inputError : {},
            aadharNumber.length === 12 && !aadharError
              ? styles.inputSuccess
              : {},
          ]}>
          <Ionicons
            name="id-card-outline"
            size={20}
            color={
              aadharError
                ? '#FF4444'
                : aadharNumber.length === 12 && !aadharError
                  ? '#28a745'
                  : '#ff7900'
            }
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter 12 digit Aadhar number"
            keyboardType="numeric"
            placeholderTextColor="#999"
            value={aadharNumber}
            onChangeText={handleAadharChange}
            maxLength={12}
          />
          {aadharNumber.length === 12 && !aadharError && (
            <Ionicons name="checkmark-circle" size={20} color="#28a745" />
          )}
        </View>
        {aadharError ? (
          <Text style={styles.errorText}>{aadharError}</Text>
        ) : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Mobile Number</Text>
        <View
          style={[
            styles.inputContainer,
            mobileError ? styles.inputError : {},
            mobileNumber.length === 10 && !mobileError
              ? styles.inputSuccess
              : {},
          ]}>
          <Ionicons
            name="call-outline"
            size={20}
            color={
              mobileError
                ? '#FF4444'
                : mobileNumber.length === 10 && !mobileError
                  ? '#28a745'
                  : '#ff7900'
            }
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter 10 digit mobile number"
            keyboardType="phone-pad"
            placeholderTextColor="#999"
            value={mobileNumber}
            onChangeText={handleMobileChange}
            maxLength={10}
          />
          {mobileNumber.length === 10 && !mobileError && (
            <Ionicons name="checkmark-circle" size={20} color="#28a745" />
          )}
        </View>
        {mobileError ? (
          <Text style={styles.errorText}>{mobileError}</Text>
        ) : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>PAN Card Number (Optional)</Text>
        <View
          style={[
            styles.inputContainer,
            panCardError ? styles.inputError : {},
            panCardNumber.length === 10 && !panCardError
              ? styles.inputSuccess
              : {},
          ]}>
          <Ionicons
            name="card-outline"
            size={20}
            color={
              panCardError
                ? '#FF4444'
                : panCardNumber.length === 10 && !panCardError
                  ? '#28a745'
                  : '#ff7900'
            }
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter 10 digit PAN"
            placeholderTextColor="#999"
            value={panCardNumber}
            onChangeText={handlePanCardChange}
            autoCapitalize="characters"
            maxLength={10}
          />
          {panCardNumber.length === 10 && !panCardError && (
            <Ionicons name="checkmark-circle" size={20} color="#28a745" />
          )}
        </View>
        {panCardError ? (
          <Text style={styles.errorText}>{panCardError}</Text>
        ) : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Account Type *</Text>
        <View style={styles.roleContainer}>
          {/* <TouchableOpacity
            style={[
              styles.roleOption,
              roleId === 0 && styles.roleOptionSelected,
            ]}
            onPress={() => setRoleId(0)}>
            <Ionicons
              name={roleId === 0 ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={roleId === 0 ? '#ff6700' : '#999'}
            />
            <Text
              style={[
                styles.roleOptionText,
                roleId === 0 && styles.roleOptionTextSelected,
              ]}>
              Admin
            </Text>
          </TouchableOpacity> */}
          <TouchableOpacity
            style={[
              styles.roleOption,
              roleId === 1 && styles.roleOptionSelected,
            ]}
            onPress={() => setRoleId(1)}>
            <Ionicons
              name={roleId === 1 ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={roleId === 1 ? '#ff6700' : '#999'}
            />
            <Text
              style={[
                styles.roleOptionText,
                roleId === 1 && styles.roleOptionTextSelected,
              ]}>
              Lender
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.roleOption,
              roleId === 2 && styles.roleOptionSelected,
            ]}
            onPress={() => setRoleId(2)}>
            <Ionicons
              name={roleId === 2 ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={roleId === 2 ? '#ff6700' : '#999'}
            />
            <Text
              style={[
                styles.roleOptionText,
                roleId === 2 && styles.roleOptionTextSelected,
              ]}>
              Borrower
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={styles.stepTitle}>Profile Picture</Text>
      <Text style={styles.stepSubtitle}>Add a profile picture (Optional)</Text>

      <View style={styles.imagePickerContainer}>
        {/* Image Preview/Placeholder */}
        <View style={styles.imageWrapper}>
          {profileImage ? (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: profileImage.uri }}
                style={styles.profileImagePreview}
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setProfileImage(null)}
                activeOpacity={0.7}>
                <View style={styles.removeButtonInner}>
                  <Ionicons name="close" size={18} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <View style={styles.placeholderIconContainer}>
                <Ionicons name="camera" size={m(40)} color="#ff7900" />
              </View>
              <Text style={styles.imagePlaceholderText}>
                No profile picture
              </Text>
              <Text style={styles.imagePlaceholderSubtext}>
                Tap below to add
              </Text>
            </View>
          )}
        </View>

        {/* Image Picker Buttons */}
        <View style={styles.imagePickerButtons}>
          <TouchableOpacity
            style={styles.imagePickerButton}
            onPress={() => handleImagePicker('gallery')}
            activeOpacity={0.7}>
            <View style={styles.imagePickerButtonIcon}>
              <Ionicons name="images-outline" size={m(22)} color="#ff6700" />
            </View>
            <Text style={styles.imagePickerButtonText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.imagePickerButton}
            onPress={() => handleImagePicker('camera')}
            activeOpacity={0.7}>
            <View style={styles.imagePickerButtonIcon}>
              <Ionicons name="camera-outline" size={m(22)} color="#ff6700" />
            </View>
            <Text style={styles.imagePickerButtonText}>Camera</Text>
          </TouchableOpacity>
        </View>

        {profileImage && (
          <TouchableOpacity
            style={styles.changeImageButton}
            onPress={() => handleImagePicker('gallery')}
            activeOpacity={0.7}>
            <Ionicons name="refresh-outline" size={m(18)} color="#ff6700" />
            <Text style={styles.changeImageButtonText}>Change Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Terms Agreement */}
      <View style={styles.termsContainer}>
        <View style={styles.termsIconContainer}>
          <Ionicons name="checkmark-circle" size={m(20)} color="#28a745" />
        </View>
        <Text style={styles.termsText}>
          By creating an account, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </View>
    </>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <StatusBar barStyle="light-content" backgroundColor="#ff6700" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.gradientHeader}>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Text style={styles.appName}>LoanHub</Text>
            </View>
            <Text style={styles.tagline}>Smart Loan Management</Text>
          </View>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {[1, 2, 3].map(step => (
            <View key={step} style={styles.progressStepContainer}>
              <View
                style={[
                  styles.progressStep,
                  currentStep >= step && styles.progressStepActive,
                ]}>
                {currentStep > step ? (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                ) : (
                  <Text style={styles.progressStepText}>{step}</Text>
                )}
              </View>
              {step < totalSteps && (
                <View
                  style={[
                    styles.progressLine,
                    currentStep > step && styles.progressLineActive,
                  ]}
                />
              )}
            </View>
          ))}
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          {/* Navigation Buttons */}
          <View style={styles.navigationButtons}>
            {currentStep > 1 && (
              <TouchableOpacity
                style={[
                  styles.backButton,
                  isLoading && styles.backButtonDisabled,
                ]}
                onPress={handleBack}
                disabled={isLoading}>
                <Ionicons
                  name="arrow-back"
                  size={20}
                  color={isLoading ? '#999' : '#ff6700'}
                />
                <Text
                  style={[
                    styles.backButtonText,
                    isLoading && styles.backButtonTextDisabled,
                  ]}>
                  Back
                </Text>
              </TouchableOpacity>
            )}

            {currentStep < totalSteps ? (
              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleNext}
                disabled={isLoading}>
                <LinearGradient
                  colors={['#ff6700', '#ff7900', '#ff8500']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.nextButtonGradient}>
                  <Text style={styles.nextButtonText}>Next</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.registerButtonContainer,
                  isLoading && styles.registerButtonDisabled,
                ]}
                onPress={handleRegister}
                disabled={isLoading}>
                <LinearGradient
                  colors={['#ff6700', '#ff7900', '#ff8500']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.registerButtonGradient}>
                  {isLoading ? (
                    <>
                      <Text style={styles.registerButtonText}>
                        Creating Account
                      </Text>
                      <Ionicons name="hourglass-outline" size={20} color="#FFFFFF" />
                    </>
                  ) : (
                    <>
                      <Text style={styles.registerButtonText}>
                        Create Account
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Info */}
        <View style={styles.securityInfo}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#ff7900" />
          <Text style={styles.securityText}>
            Your data is secured with bank-level encryption
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ff6700',
  },
  gradientHeader: {
    paddingTop: Platform.OS === 'ios' ? m(50) : m(38),
    paddingHorizontal: m(20),
  },
  headerContent: {
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? m(10) : m(5),
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(12),
  },
  appName: {
    fontSize: FontSizes['4xl'],
    fontFamily: FontFamily.secondaryBold,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  tagline: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.secondaryRegular,
    color: 'white',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: m(20),
    paddingTop: m(10),
    paddingBottom: m(100),
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: m(20),
    marginBottom: m(10),
    paddingHorizontal: m(20),
  },
  progressStepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressStep: {
    width: m(40),
    height: m(40),
    borderRadius: m(20),
    backgroundColor: 'lightgrey',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  progressStepActive: {
    backgroundColor: '#ff6700',
    borderColor: '#ff6700',
  },
  progressStepText: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.primarySemiBold,
    color: '#FFFFFF',
  },
  progressLine: {
    width: m(60),
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: m(4),
  },
  progressLineActive: {
    backgroundColor: '#ff6700',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(20),
    padding: m(24),
    marginTop: m(20),
    marginBottom: m(20),
    borderWidth: 1,
    borderColor: '#FFEDD5',
    elevation: 8,
    shadowColor: '#ff6700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  stepTitle: {
    fontSize: FontSizes['2xl'],
    fontFamily: FontFamily.secondaryBold,
    color: '#333',
    marginBottom: m(4),
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primaryRegular,
    color: '#666',
    marginBottom: m(24),
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: m(20),
  },
  inputLabel: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: '#555',
    marginBottom: m(8),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9F0',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#FFEDD5',
    paddingHorizontal: m(16),
    height: m(56),
  },
  inputError: {
    borderColor: '#FF4444',
  },
  inputSuccess: {
    borderColor: '#28a745',
  },
  inputIcon: {
    marginRight: m(12),
  },
  input: {
    flex: 1,
    fontSize: FontSizes.md,
    fontFamily: FontFamily.primaryRegular,
    color: '#333',
    padding: 0,
  },
  eyeButton: {
    padding: m(4),
    marginLeft: m(8),
  },
  errorText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#FF4444',
    marginTop: m(4),
    marginLeft: m(4),
  },
  roleContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF9F0',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#FFEDD5',
    padding: m(8),
    gap: m(8),
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(12),
    paddingHorizontal: m(8),
    borderRadius: m(8),
    backgroundColor: '#FFFFFF',
    gap: m(6),
  },
  roleOptionSelected: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#ff6700',
  },
  roleOptionText: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primaryMedium,
    color: '#666',
  },
  roleOptionTextSelected: {
    color: '#ff6700',
    fontFamily: FontFamily.primarySemiBold,
  },
  imagePickerContainer: {
    marginBottom: m(24),
    alignItems: 'center',
  },
  imageWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: m(24),
  },
  imagePreviewContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImagePreview: {
    width: m(160),
    height: m(160),
    borderRadius: m(80),
    borderWidth: 4,
    borderColor: '#ff6700',
    backgroundColor: '#F5F5F5',
  },
  removeImageButton: {
    position: 'absolute',
    top: m(-8),
    right: m(-8),
    zIndex: 10,
  },
  removeButtonInner: {
    width: m(32),
    height: m(32),
    borderRadius: m(16),
    backgroundColor: '#FF4444',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  imagePlaceholder: {
    width: m(160),
    height: m(160),
    borderRadius: m(80),
    backgroundColor: '#FFF9F0',
    borderWidth: 3,
    borderColor: '#FFEDD5',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: m(20),
  },
  placeholderIconContainer: {
    width: m(60),
    height: m(60),
    borderRadius: m(30),
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: m(12),
  },
  imagePlaceholderText: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: '#666',
    marginTop: m(8),
    textAlign: 'center',
  },
  imagePlaceholderSubtext: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#999',
    marginTop: m(4),
    textAlign: 'center',
  },
  imagePickerButtons: {
    flexDirection: 'row',
    gap: m(12),
    width: '100%',
    marginBottom: m(12),
  },
  imagePickerButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(18),
    paddingHorizontal: m(12),
    backgroundColor: '#FFF9F0',
    borderRadius: m(12),
    borderWidth: 2,
    borderColor: '#FFEDD5',
    minHeight: m(100),
  },
  imagePickerButtonIcon: {
    width: m(48),
    height: m(48),
    borderRadius: m(24),
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: m(8),
  },
  imagePickerButtonText: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: '#ff6700',
    textAlign: 'center',
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(12),
    paddingHorizontal: m(20),
    backgroundColor: '#FFFFFF',
    borderRadius: m(8),
    borderWidth: 1,
    borderColor: '#ff6700',
    gap: m(8),
    alignSelf: 'center',
  },
  changeImageButtonText: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: '#ff6700',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: m(24),
    padding: m(16),
    backgroundColor: '#FFF7ED',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  termsIconContainer: {
    marginRight: m(12),
    marginTop: m(2),
  },
  termsText: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#7C2D12',
    lineHeight: m(18),
  },
  termsLink: {
    fontFamily: FontFamily.primarySemiBold,
    color: '#C2410C',
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: m(12),
    marginTop: m(8),
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(16),
    backgroundColor: '#FFFFFF',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#ff6700',
    gap: m(8),
  },
  backButtonDisabled: {
    opacity: 0.5,
    borderColor: '#999',
  },
  backButtonText: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.primarySemiBold,
    color: '#ff6700',
  },
  backButtonTextDisabled: {
    color: '#999',
  },
  nextButton: {
    flex: 1,
    borderRadius: m(12),
    overflow: 'hidden',
    shadowColor: '#ff6700',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Platform.OS === 'android' ? m(16) : m(0),
    gap: m(8),
  },
  nextButtonText: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.primarySemiBold,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    paddingVertical: Platform.OS === 'android' ? m(1) : m(16),
  },
  registerButtonContainer: {
    flex: 1,
    borderRadius: m(12),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#ff6700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  registerButtonDisabled: {
    opacity: 0.5,
  },
  registerButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Platform.OS === 'android' ? m(16) : m(0),
    gap: m(8),
  },
  registerButtonText: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.primarySemiBold,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    paddingVertical: Platform.OS === 'android' ? m(1) : m(16),
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: m(16),
  },
  loginText: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primaryRegular,
    color: '#666',
  },
  loginLink: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: '#ff6700',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
    padding: m(16),
    backgroundColor: '#FFFFFF',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#FFEDD5',
    marginBottom: m(20),
  },
  securityText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#666',
  },
});
