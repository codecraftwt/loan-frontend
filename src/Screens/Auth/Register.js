import React, { useRef, useState } from 'react';
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
  PermissionsAndroid,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { m } from 'walstar-rn-responsive';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { FontFamily, FontSizes, colors } from '../../constants';
import instance from '../../Utils/AxiosInstance';

const GRADIENT_INDIGO = '#172340';
const GRADIENT_TEAL = '#118A6B';
const GRADIENT_SOFT = '#EAF7F2';

export default function Register({ navigation }) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 1;
  const pinInputs = useRef([]);
  const confirmPinInputs = useRef([]);

  // Step 1: Basic Info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // Step 2: Numbers
  const [aadharNumber, setAadharNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [panCardNumber, setPanCardNumber] = useState('');
  const [roleId, setRoleId] = useState(2);

  // Step 3: Create PIN
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Step 4: Profile Picture
  const [profileImage, setProfileImage] = useState(null);

  // Error states
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [aadharError, setAadharError] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [panCardError, setPanCardError] = useState('');

  const [, setErrors] = useState({});

  const { isLoading } = useSelector(state => state.auth || {});
  const hasMinLength = password.length >= 8;
  const hasMixedCase = /[A-Z]/.test(password) && /[a-z]/.test(password);
  const hasNumberAndSymbol =
    /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);

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
      // Check if permission was granted
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Camera permission error:', err);
      return false;
    }
  };

  // Simple input handlers - no validation while typing
  const handleNameChange = text => {
    setName(text);
    setNameError('');
  };

  const handleEmailChange = text => {
    const modifiedText = text.charAt(0).toLowerCase() + text.slice(1);
    setEmail(modifiedText);
    setEmailError('');
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

  const handlePinChange = (text, index) => {
    const newPin = [...pin];
    newPin[index] = text;
    setPin(newPin);
    setPinError('');

    if (text && index < 3) {
      pinInputs.current[index + 1].focus();
    }
  };

  const handleConfirmPinChange = (text, index) => {
    const newConfirmPin = [...confirmPin];
    newConfirmPin[index] = text;
    setConfirmPin(newConfirmPin);
    setPinError('');

    if (text && index < 3) {
      confirmPinInputs.current[index + 1].focus();
    }
  };

  const handlePinKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !pin[index] && index > 0) {
      pinInputs.current[index - 1].focus();
    }
  };

  const handleConfirmPinKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !confirmPin[index] && index > 0) {
      confirmPinInputs.current[index - 1].focus();
    }
  };

  const validatePin = () => {
    const pinString = pin.join('');
    const confirmPinString = confirmPin.join('');

    if (pinString.length !== 4) {
      setPinError('PIN must be 4 digits');
      return false;
    }

    if (pinString !== confirmPinString) {
      setPinError('PINs do not match');
      return false;
    }

    const isSequential = '1234,2345,3456,4567,5678,6789'.includes(pinString);
    if (isSequential) {
      setPinError('Please choose a more secure PIN (avoid sequential numbers)');
      return false;
    }

    const isRepeated = /^(\d)\1{3}$/.test(pinString);
    if (isRepeated) {
      setPinError('Please choose a more secure PIN (avoid repeated digits)');
      return false;
    }

    return true;
  };

  // Validation functions - only called on button click
  const validateStep1 = () => {
    let temp = {};
    let valid = true;

    if (!name || name.trim().length < 1) {
      temp.name = 'Full Name is required.';
      valid = false;
    }

    if (!email || email.trim().length < 1) {
      temp.email = 'Email is required.';
      valid = false;
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        temp.email = 'Enter a valid email.';
        valid = false;
      }
    }

    if (!mobileNumber || mobileNumber.length !== 10) {
      temp.mobileNumber = 'Mobile must be 10 digits.';
      valid = false;
    } else if (!/^[6-9]/.test(mobileNumber)) {
      temp.mobileNumber = 'Mobile must start with 6-9.';
      valid = false;
    }

    if (!password) {
      temp.password = 'Password is required.';
      valid = false;
    } else if (!hasMinLength) {
      temp.password = 'Password must be at least 8 characters.';
      valid = false;
    } else if (!hasMixedCase) {
      temp.password = 'Password must include uppercase & lowercase letters.';
      valid = false;
    } else if (!hasNumberAndSymbol) {
      temp.password = 'Password must include numbers and symbols.';
      valid = false;
    }

    if (!confirmPassword) {
      temp.confirmPassword = 'Confirm your password.';
      valid = false;
    } else if (password !== confirmPassword) {
      temp.confirmPassword = 'Passwords do not match.';
      valid = false;
    }

    setErrors(temp);
    setNameError(temp.name || '');
    setEmailError(temp.email || '');
    setMobileError(temp.mobileNumber || '');
    setPasswordError(temp.password || '');
    setConfirmPasswordError(temp.confirmPassword || '');
    return valid;
  };

  const validateStep2 = () => {
    let temp = {};
    let valid = true;

    if (!aadharNumber || aadharNumber.length !== 12) {
      temp.aadharNumber = 'Aadhar must be 12 digits.';
      valid = false;
    }

    if (!mobileNumber || mobileNumber.length !== 10) {
      temp.mobileNumber = 'Mobile must be 10 digits.';
      valid = false;
    } else if (!/^[6-9]/.test(mobileNumber)) {
      temp.mobileNumber = 'Mobile must start with 6-9.';
      valid = false;
    }

    if (panCardNumber) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(panCardNumber)) {
        temp.panCardNumber = 'Invalid PAN format.';
        valid = false;
      }
    }

    setErrors(temp);
    setAadharError(temp.aadharNumber || '');
    setMobileError(temp.mobileNumber || '');
    setPanCardError(temp.panCardNumber || '');
    return valid;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      const ok = validateStep1();
      if (!ok) return;
      setCurrentStep(2);
    }

    if (currentStep === 2) {
      const ok = validateStep2();
      if (!ok) return;
      setCurrentStep(3);
    }

    if (currentStep === 3) {
      const ok = validatePin();
      if (!ok) return;
      setCurrentStep(4);
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
    const step1Valid = validateStep1();

    if (!step1Valid) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Please complete account details correctly.',
      });
      return;
    }

    try {
      await instance.post('auth/check-signup', {
        email,
        mobileNo: mobileNumber,
      });

      navigation.navigate('ConsentScreen', {
        source: 'register',
        userData: {
          name,
          email,
          password,
          confirmPassword,
          roleId,
          mobileNumber,
          panCardNumber,
          profileImage,
        },
      });
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        (typeof error === 'string' ? error : null) ||
        error?.message ||
        (error?.missingFields
          ? `Missing fields: ${error.missingFields.join(', ')}`
          : null) ||
        'Registration failed. Please try again.';

      const normalizedError = errorMessage.toLowerCase();
      if (normalizedError.includes('mobile')) {
        setMobileError(errorMessage);
        setCurrentStep(1);
      } else if (
        normalizedError.includes('aadhar') ||
        normalizedError.includes('aadhaar')
      ) {
        setAadharError(errorMessage);
        setCurrentStep(2);
      } else if (normalizedError.includes('pan')) {
        setPanCardError(errorMessage);
        setCurrentStep(2);
      } else if (normalizedError.includes('email')) {
        setEmailError(errorMessage);
        setCurrentStep(1);
      }

      Toast.show({
        type: 'error',
        position: 'top',
        text1: errorMessage,
      });
    }
  };

  const renderStep1 = () => (
    <>
      <Text style={styles.stepTitle}>Create Your Account</Text>
      <Text style={styles.stepSubtitle}>Let's get you started in a few quick steps</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Full Name</Text>
        <View
          style={[styles.inputContainer, nameError ? styles.inputError : {}]}
        >
          <Ionicons
            name="person-outline"
            size={20}
            color={nameError ? colors.error : GRADIENT_TEAL}
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
          style={[styles.inputContainer, emailError ? styles.inputError : {}]}
        >
          <Ionicons
            name="mail-outline"
            size={20}
            color={emailError ? colors.error : GRADIENT_TEAL}
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
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
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
          ]}
        >
          <Ionicons
            name="call-outline"
            size={20}
            color={
              mobileError
                ? colors.error
                : mobileNumber.length === 10 && !mobileError
                ? colors.success
                : GRADIENT_TEAL
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
          {mobileNumber.length === 10 && !mobileError ? (
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          ) : null}
        </View>
        {mobileError ? (
          <Text style={styles.errorText}>{mobileError}</Text>
        ) : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Password</Text>
        <View
          style={[
            styles.inputContainer,
            passwordError ? styles.inputError : {},
          ]}
        >
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color={passwordError ? colors.error : GRADIENT_TEAL}
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
            style={styles.eyeButton}
          >
            <Ionicons
              name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={GRADIENT_TEAL}
            />
          </TouchableOpacity>
        </View>
        {passwordError ? (
          <Text style={styles.errorText}>{passwordError}</Text>
        ) : null}

        {password.length > 0 ? (
          <View style={styles.passwordTips}>
            {[
              { label: 'At least 8 characters', met: hasMinLength },
              { label: 'Uppercase & lowercase letters', met: hasMixedCase },
              { label: 'Numbers and symbols', met: hasNumberAndSymbol },
            ].map(tip => (
              <View key={tip.label} style={styles.passwordTipItem}>
                <View
                  style={[
                    styles.passwordTipDot,
                    tip.met && styles.passwordTipDotMet,
                  ]}
                />
                <Text
                  style={[
                    styles.passwordTipText,
                    tip.met && styles.passwordTipTextMet,
                  ]}
                >
                  {tip.label}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Confirm Password</Text>
        <View
          style={[
            styles.inputContainer,
            confirmPasswordError ? styles.inputError : {},
          ]}
        >
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color={confirmPasswordError ? colors.error : GRADIENT_TEAL}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm your password"
            secureTextEntry={!confirmPasswordVisible}
            placeholderTextColor="#999"
            value={confirmPassword}
            onChangeText={handleConfirmPasswordChange}
          />
          <TouchableOpacity
            onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
            style={styles.eyeButton}
          >
            <Ionicons
              name={confirmPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={GRADIENT_TEAL}
            />
          </TouchableOpacity>
        </View>
        {confirmPasswordError ? (
          <Text style={styles.errorText}>{confirmPasswordError}</Text>
        ) : null}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Account Type</Text>
        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[
              styles.roleOption,
              roleId === 1 && styles.roleOptionSelected,
            ]}
            onPress={() => setRoleId(1)}
          >
            <Ionicons
              name={roleId === 1 ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={roleId === 1 ? GRADIENT_TEAL : '#B8C8C2'}
            />
            <Text
              style={[
                styles.roleOptionText,
                roleId === 1 && styles.roleOptionTextSelected,
              ]}
            >
              Lender
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.roleOption,
              roleId === 2 && styles.roleOptionSelected,
            ]}
            onPress={() => setRoleId(2)}
          >
            <Ionicons
              name={roleId === 2 ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={roleId === 2 ? GRADIENT_TEAL : '#B8C8C2'}
            />
            <Text
              style={[
                styles.roleOptionText,
                roleId === 2 && styles.roleOptionTextSelected,
              ]}
            >
              Borrower
            </Text>
          </TouchableOpacity>
        </View>
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
          ]}
        >
          <Ionicons
            name="id-card-outline"
            size={20}
            color={
              aadharError
                ? colors.error
                : aadharNumber.length === 12 && !aadharError
                ? colors.success
                : GRADIENT_TEAL
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
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.success}
            />
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
          ]}
        >
          <Ionicons
            name="call-outline"
            size={20}
            color={
              mobileError
                ? colors.error
                : mobileNumber.length === 10 && !mobileError
                ? colors.success
                : GRADIENT_TEAL
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
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.success}
            />
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
          ]}
        >
          <Ionicons
            name="card-outline"
            size={20}
            color={
              panCardError
                ? colors.error
                : panCardNumber.length === 10 && !panCardError
                ? colors.success
                : GRADIENT_TEAL
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
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.success}
            />
          )}
        </View>
        {panCardError ? (
          <Text style={styles.errorText}>{panCardError}</Text>
        ) : null}
      </View>
    </>
  );

  const renderStep3 = () => (
    <>
      <View style={styles.iconCircle}>
        <Ionicons
          name="shield-checkmark-outline"
          size={m(50)}
          color={GRADIENT_TEAL}
        />
      </View>

      <Text style={styles.title}>Create Your Security PIN</Text>

      <View style={styles.warningBox}>
        <Ionicons
          name="information-circle-outline"
          size={m(24)}
          color={GRADIENT_TEAL}
        />
        <Text style={styles.warningText}>
          This PIN will be required whenever you accept a loan or perform
          important actions.
        </Text>
      </View>

      <Text style={styles.inputLabel}>Enter 4-Digit PIN</Text>
      <View style={styles.pinContainer}>
        {[0, 1, 2, 3].map(index => (
          <TextInput
            key={`pin-${index}`}
            ref={ref => {
              pinInputs.current[index] = ref;
            }}
            style={[styles.pinInput, pin[index] && styles.pinInputFilled]}
            value={pin[index]}
            onChangeText={text => handlePinChange(text, index)}
            onKeyPress={e => handlePinKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            secureTextEntry={!showPin}
            textAlign="center"
          />
        ))}
      </View>

      <Text style={[styles.inputLabel, styles.confirmLabel]}>Confirm PIN</Text>
      <View style={styles.pinContainer}>
        {[0, 1, 2, 3].map(index => (
          <TextInput
            key={`confirm-${index}`}
            ref={ref => {
              confirmPinInputs.current[index] = ref;
            }}
            style={[
              styles.pinInput,
              confirmPin[index] && styles.pinInputFilled,
            ]}
            value={confirmPin[index]}
            onChangeText={text => handleConfirmPinChange(text, index)}
            onKeyPress={e => handleConfirmPinKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            secureTextEntry={!showPin}
            textAlign="center"
          />
        ))}
      </View>

      <TouchableOpacity
        style={styles.showPinButton}
        onPress={() => setShowPin(!showPin)}
      >
        <Ionicons
          name={showPin ? 'eye-off-outline' : 'eye-outline'}
          size={20}
          color={GRADIENT_TEAL}
        />
        <Text style={styles.showPinText}>
          {showPin ? 'Hide PIN' : 'Show PIN'}
        </Text>
      </TouchableOpacity>

      {pinError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={18} color={colors.error} />
          <Text style={styles.pinErrorText}>{pinError}</Text>
        </View>
      ) : null}

      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>PIN Security Tips:</Text>
        <View style={styles.tipItem}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={styles.tipText}>Never share your PIN with anyone</Text>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={styles.tipText}>
            Avoid using 1234, 0000, or birth year
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={styles.tipText}>
            Don't write it down or save in phone
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={styles.tipText}>We will never ask for your PIN</Text>
        </View>
      </View>
    </>
  );

  const renderStep4 = () => (
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
                activeOpacity={0.7}
              >
                <View style={styles.removeButtonInner}>
                  <Ionicons name="close" size={18} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <View style={styles.placeholderIconContainer}>
                <Ionicons name="camera" size={m(40)} color={GRADIENT_TEAL} />
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
            activeOpacity={0.7}
          >
            <View style={styles.imagePickerButtonIcon}>
              <Ionicons
                name="images-outline"
                size={m(22)}
                color={GRADIENT_TEAL}
              />
            </View>
            <Text style={styles.imagePickerButtonText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.imagePickerButton}
            onPress={() => handleImagePicker('camera')}
            activeOpacity={0.7}
          >
            <View style={styles.imagePickerButtonIcon}>
              <Ionicons
                name="camera-outline"
                size={m(22)}
                color={GRADIENT_TEAL}
              />
            </View>
            <Text style={styles.imagePickerButtonText}>Camera</Text>
          </TouchableOpacity>
        </View>

        {profileImage && (
          <TouchableOpacity
            style={styles.changeImageButton}
            onPress={() => handleImagePicker('gallery')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="refresh-outline"
              size={m(18)}
              color={GRADIENT_TEAL}
            />
            <Text style={styles.changeImageButtonText}>Change Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Terms Agreement */}
      <View style={styles.termsContainer}>
        <View style={styles.termsIconContainer}>
          <Ionicons
            name="checkmark-circle"
            size={m(20)}
            color={colors.success}
          />
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar barStyle="light-content" backgroundColor={GRADIENT_INDIGO} />

      <LinearGradient
        colors={[GRADIENT_INDIGO, GRADIENT_TEAL]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <View style={styles.fixedTop}>
          <View style={styles.gradientHeader}>
            <View style={styles.headerContent}>
              <View style={styles.logoContainer}>
                <Text style={styles.appName}>LoanHub</Text>
              </View>
              <Text style={styles.tagline}>Smart Loan Management</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            {[1, 2, 3, 4].map(step => (
              <View key={step} style={styles.progressStepContainer}>
                <View
                  style={[
                    styles.progressStep,
                    currentStep >= step && styles.progressStepActive,
                  ]}
                >
                  {currentStep > step ? (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  ) : (
                    <Text style={styles.progressStepText}>{step}</Text>
                  )}
                </View>
                {step < 4 && (
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
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Form Card */}
          <View style={styles.formCard}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}

            {/* Navigation Buttons */}
            <View style={styles.navigationButtons}>
              {currentStep > 1 && (
                <TouchableOpacity
                  style={[
                    styles.backButton,
                    isLoading && styles.backButtonDisabled,
                  ]}
                  onPress={handleBack}
                  disabled={isLoading}
                >
                  <Ionicons
                    name="arrow-back"
                    size={20}
                    color={isLoading ? '#999' : GRADIENT_TEAL}
                  />
                  <Text
                    style={[
                      styles.backButtonText,
                      isLoading && styles.backButtonTextDisabled,
                    ]}
                  >
                    Back
                  </Text>
                </TouchableOpacity>
              )}

              {currentStep < totalSteps ? (
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={handleNext}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={[GRADIENT_INDIGO, GRADIENT_TEAL]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.nextButtonGradient}
                  >
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
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={[GRADIENT_INDIGO, GRADIENT_TEAL]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.registerButtonGradient}
                  >
                    {isLoading ? (
                      <>
                        <Text style={styles.registerButtonText}>
                          Please wait...
                        </Text>
                        <Ionicons
                          name="hourglass-outline"
                          size={20}
                          color="#FFFFFF"
                        />
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
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={GRADIENT_TEAL}
            />
            <Text style={styles.securityText}>
              Your data is secured with bank-level encryption
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
  fixedTop: {
    paddingBottom: m(8),
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
    fontFamily: FontFamily.primaryBold,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  tagline: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.bodyRegular,
    color: 'white',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: m(20),
    paddingTop: m(10),
    paddingBottom: m(100),
    backgroundColor: 'transparent',
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
    backgroundColor: GRADIENT_TEAL,
    borderColor: GRADIENT_TEAL,
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
    backgroundColor: GRADIENT_TEAL,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(20),
    padding: m(24),
    marginTop: m(20),
    marginBottom: m(20),
    borderWidth: 1,
    borderColor: colors.navyBorder,
    elevation: 8,
    shadowColor: GRADIENT_TEAL,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  stepTitle: {
    fontSize: FontSizes['2xl'],
    fontFamily: FontFamily.primaryBold,
    color: '#333',
    marginBottom: m(4),
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.bodyRegular,
    color: '#666',
    marginBottom: m(24),
    textAlign: 'center',
  },
  iconCircle: {
    width: m(90),
    height: m(90),
    borderRadius: m(45),
    backgroundColor: colors.navyFaint,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: colors.navyBorder,
    marginBottom: m(16),
  },
  title: {
    fontSize: FontSizes['2xl'],
    fontFamily: FontFamily.primaryBold,
    color: '#333',
    textAlign: 'center',
    marginBottom: m(16),
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: GRADIENT_SOFT,
    borderRadius: m(12),
    padding: m(12),
    marginBottom: m(24),
    borderWidth: 1,
    borderColor: colors.navyBorder,
    gap: m(8),
  },
  warningText: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.bodyRegular,
    color: colors.navyDark,
    lineHeight: m(18),
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
    backgroundColor: colors.navyFaint,
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: colors.navyBorder,
    paddingHorizontal: m(16),
    height: m(56),
  },
  inputError: {
    borderColor: colors.error,
  },
  inputSuccess: {
    borderColor: colors.success,
  },
  inputIcon: {
    marginRight: m(12),
  },
  input: {
    flex: 1,
    fontSize: FontSizes.md,
    fontFamily: FontFamily.bodyRegular,
    color: '#333',
    padding: 0,
  },
  eyeButton: {
    padding: m(4),
    marginLeft: m(8),
  },
  errorText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.bodyRegular,
    color: colors.error,
    marginTop: m(4),
    marginLeft: m(4),
  },
  passwordTips: {
    marginTop: m(10),
    gap: m(6),
  },
  passwordTipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
  },
  passwordTipDot: {
    width: m(7),
    height: m(7),
    borderRadius: m(3.5),
    backgroundColor: '#D1D5DB',
  },
  passwordTipDotMet: {
    backgroundColor: colors.success,
  },
  passwordTipText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.bodyRegular,
    color: '#6B7280',
  },
  passwordTipTextMet: {
    color: colors.success,
  },
  confirmLabel: {
    marginTop: m(20),
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: m(12),
  },
  pinInput: {
    flex: 1,
    height: m(60),
    backgroundColor: colors.navyFaint,
    borderRadius: m(12),
    borderWidth: 2,
    borderColor: colors.navyBorder,
    fontSize: FontSizes['2xl'],
    fontFamily: FontFamily.primarySemiBold,
    color: '#333',
    textAlign: 'center',
    padding: 0,
  },
  pinInputFilled: {
    borderColor: colors.success,
    backgroundColor: '#F0FFF4',
  },
  showPinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
    marginTop: m(16),
    padding: m(8),
  },
  showPinText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.bodyMedium,
    color: GRADIENT_TEAL,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: m(8),
    padding: m(12),
    marginTop: m(16),
    gap: m(8),
  },
  pinErrorText: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.bodyRegular,
    color: colors.error,
  },
  tipsContainer: {
    backgroundColor: '#F0FDF4',
    borderRadius: m(12),
    padding: m(16),
    marginTop: m(24),
  },
  tipsTitle: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: '#166534',
    marginBottom: m(12),
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    marginBottom: m(8),
  },
  tipText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.bodyRegular,
    color: '#14532D',
  },
  roleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.navyFaint,
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: colors.navyBorder,
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
    backgroundColor: GRADIENT_SOFT,
    borderWidth: 1,
    borderColor: GRADIENT_TEAL,
  },
  roleOptionText: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.bodyMedium,
    color: '#666',
  },
  roleOptionTextSelected: {
    color: GRADIENT_TEAL,
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
    borderColor: GRADIENT_TEAL,
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
    backgroundColor: colors.error,
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
    backgroundColor: colors.navyFaint,
    borderWidth: 3,
    borderColor: colors.navyBorder,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: m(20),
  },
  placeholderIconContainer: {
    width: m(60),
    height: m(60),
    borderRadius: m(30),
    backgroundColor: colors.navyBorder,
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
    fontFamily: FontFamily.bodyRegular,
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
    backgroundColor: colors.navyFaint,
    borderRadius: m(12),
    borderWidth: 2,
    borderColor: colors.navyBorder,
    minHeight: m(100),
  },
  imagePickerButtonIcon: {
    width: m(48),
    height: m(48),
    borderRadius: m(24),
    backgroundColor: colors.navyBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: m(8),
  },
  imagePickerButtonText: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: GRADIENT_TEAL,
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
    borderColor: GRADIENT_TEAL,
    gap: m(8),
    alignSelf: 'center',
  },
  changeImageButtonText: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: GRADIENT_TEAL,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: m(24),
    padding: m(16),
    backgroundColor: GRADIENT_SOFT,
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: colors.navyBorder,
  },
  termsIconContainer: {
    marginRight: m(12),
    marginTop: m(2),
  },
  termsText: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.bodyRegular,
    color: colors.navyDark,
    lineHeight: m(18),
  },
  termsLink: {
    fontFamily: FontFamily.primarySemiBold,
    color: GRADIENT_TEAL,
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
    borderColor: GRADIENT_TEAL,
    gap: m(8),
  },
  backButtonDisabled: {
    opacity: 0.5,
    borderColor: '#999',
  },
  backButtonText: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.primarySemiBold,
    color: GRADIENT_TEAL,
  },
  backButtonTextDisabled: {
    color: '#999',
  },
  nextButton: {
    flex: 1,
    borderRadius: m(12),
    overflow: 'hidden',
    shadowColor: GRADIENT_TEAL,
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
    shadowColor: GRADIENT_TEAL,
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
    fontFamily: FontFamily.bodyRegular,
    color: '#666',
  },
  loginLink: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: GRADIENT_TEAL,
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
    borderColor: colors.navyBorder,
    marginBottom: m(20),
  },
  securityText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.bodyRegular,
    color: '#666',
  },
});
