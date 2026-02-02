import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  Animated,
  Alert,
  Image,
  PermissionsAndroid,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useDispatch, useSelector } from 'react-redux';
import {
  createLoan,
  getLoanByAadhar,
  updateLoan,
  checkFraudStatus,
  clearFraudStatus,
  verifyLoanPayment,
} from '../../../Redux/Slices/loanSlice';
import { getActivePlan } from '../../../Redux/Slices/planPurchaseSlice';
import { openRazorpayCheckoutForLoanCreation } from '../../../Services/razorpayService';
import Toast from 'react-native-toast-message';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import LoanOTPVerification from '../../../Components/LoanOTPVerification';
import FraudStatusBadge from '../../../Components/FraudStatusBadge';
import FraudWarningModal from '../../../Components/FraudWarningModal';
import SubscriptionRestriction from '../../../Components/SubscriptionRestriction';
import { useSubscription } from '../../../hooks/useSubscription';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { FontFamily, FontSizes } from '../../../constants';

export default function AddDetails({ route, navigation }) {
  const dispatch = useDispatch();
  const { error, aadharError, loading, fraudStatus, fraudLoading, paymentVerifying } = useSelector(
    state => state.loans,
  );
  const user = useSelector(state => state.auth.user);
  const { loanDetails, borrowerData } = route.params || {};
  const { hasActivePlan } = useSubscription();
  const isLender = user?.roleId === 1;
  const { loading: planLoading } = useSelector(state => state.planPurchase);

  // Auto-fill from borrowerData if available
  const getInitialFormData = () => {
    if (borrowerData) {
      return {
        name: borrowerData.name || '',
        mobileNumber: borrowerData.mobileNumber || '',
        aadhaarNumber: borrowerData.aadhaarNumber || '',
        address: borrowerData.address || '',
        amount: '',
        loanStartDate: null,
        loanEndDate: null,
        purpose: '',
        loanMode: 'cash',
      };
    }
    if (loanDetails) {
      return {
        name: loanDetails.name || '',
        mobileNumber: loanDetails.mobileNumber || '',
        aadhaarNumber: loanDetails.aadhaarNumber || '',
        address: loanDetails.address || '',
        amount: loanDetails.amount?.toString() || '',
        loanStartDate: loanDetails.loanStartDate || null,
        loanEndDate: loanDetails.loanEndDate || null,
        purpose: loanDetails.purpose || '',
        loanMode: loanDetails.loanMode || 'cash',
      };
    }
    return {
      name: '',
      mobileNumber: '',
      aadhaarNumber: '',
      address: '',
      amount: '',
      loanStartDate: null,
      loanEndDate: null,
      purpose: '',
      loanMode: 'cash',
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showOldHistoryButton, setShowOldHistoryButton] = useState(false);
  const [isStartDatePickerVisible, setStartDatePickerVisible] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);
  const [isFocused, setIsFocused] = useState({});
  const [isOTPModalVisible, setIsOTPModalVisible] = useState(false);
  const [createdLoanData, setCreatedLoanData] = useState(null);
  const [showFraudWarning, setShowFraudWarning] = useState(false);
  const [pendingLoanData, setPendingLoanData] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [proofError, setProofError] = useState('');

  // Focus animation
  const focusAnim = new Animated.Value(0);

  const handleFocus = (field) => {
    setIsFocused({ [field]: true });
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = (field) => {
    setIsFocused({ [field]: false });
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Request camera permission for Android
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to your camera to take photos.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  // Validate proof file
  const validateProofFile = (file) => {
    setProofError('');
    
    if (!file) {
      return true;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const fileType = file.type || 'image/jpeg';
    
    if (!allowedTypes.includes(fileType.toLowerCase())) {
      setProofError('Only JPEG, JPG, and PNG images are allowed.');
      return false;
    }

    // Check file size (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;
    if (file.fileSize && file.fileSize > maxSize) {
      setProofError('File size must be less than 5MB.');
      return false;
    }

    return true;
  };

  // Handle proof image picker
  const handleProofImagePicker = async (action) => {
    // Request permission if using camera on Android
    if (action === 'camera' && Platform.OS === 'android') {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Camera Permission Required',
          text2: 'Please grant camera permission to take photos.',
        });
        return;
      }
    }

    const options =
      action === 'camera'
        ? {
            mediaType: 'photo',
            cameraType: 'back',
            quality: 0.8,
            saveToPhotos: true,
          }
        : {
            mediaType: 'photo',
            quality: 0.8,
          };

    const launch = action === 'camera' ? launchCamera : launchImageLibrary;

    launch(options, (response) => {
      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Error',
          text2: response.errorMessage || 'Failed to pick image.',
        });
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        
        // Validate file
        if (validateProofFile(asset)) {
          // Prepare file object for FormData
          const fileExtension = asset.type?.split('/')[1] || 'jpg';
          const fileName = asset.fileName || `proof_${Date.now()}.${fileExtension}`;
          
          setProofFile({
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            fileName: fileName,
            fileSize: asset.fileSize,
          });
          setProofError('');
          
          Toast.show({
            type: 'success',
            position: 'top',
            text1: 'Proof Image Selected',
            text2: 'You can change it before submitting.',
          });
        }
      }
    });
  };

  // Remove proof file
  const handleRemoveProof = () => {
    setProofFile(null);
    setProofError('');
  };

  // Validate form fields – set per-field errors and return true only if all valid
  const validateForm = () => {
    const {
      name,
      mobileNumber,
      aadhaarNumber,
      address,
      amount,
      loanStartDate,
      loanEndDate,
      purpose,
    } = formData;
    const errors = {};

    if (!name || !name.trim()) {
      errors.name = 'Full name is required.';
    }
    if (!mobileNumber) {
      errors.mobileNumber = 'Contact number is required.';
    } else if (mobileNumber.length !== 10) {
      errors.mobileNumber = 'Mobile number must be exactly 10 digits.';
    }
    if (!aadhaarNumber) {
      errors.aadhaarNumber = 'Aadhar number is required.';
    } else if (aadhaarNumber.length !== 12) {
      errors.aadhaarNumber = 'Aadhar number must be exactly 12 digits.';
    }
    if (!address || !address.trim()) {
      errors.address = 'Address is required.';
    }
    if (!amount || !amount.trim()) {
      errors.amount = 'Loan amount is required.';
    } else if (isNaN(amount) || parseFloat(amount) <= 0) {
      errors.amount = 'Amount should be a positive number.';
    } else if (parseFloat(amount) < 1000) {
      errors.amount = 'Amount must be at least ₹1000.';
    }
    if (!loanStartDate) {
      errors.loanStartDate = 'Start date is required.';
    }
    if (!loanEndDate) {
      errors.loanEndDate = 'End date is required.';
    } else if (loanStartDate && loanEndDate && new Date(loanStartDate) >= new Date(loanEndDate)) {
      errors.loanEndDate = 'End date must be after start date.';
    }
    if (!purpose || !purpose.trim()) {
      errors.purpose = 'Purpose of loan is required.';
    }

    setFieldErrors(errors);
    setErrorMessage('');
    return Object.keys(errors).length === 0;
  };

  // Check plan before loan creation
  const checkPlanBeforeLoanCreation = async () => {
    try {
      const result = await dispatch(getActivePlan()).unwrap();

      if (!result.hasActivePlan) {
        Alert.alert(
          'Plan Required',
          'You need to purchase a plan to create loans. Would you like to view plans?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'View Plans',
              onPress: () => navigation.navigate('SubscriptionScreen')
            },
          ]
        );
        return false;
      }

      if (result.remainingDays <= 0) {
        Alert.alert(
          'Plan Expired',
          'Your plan has expired. Please renew to continue creating loans.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Renew Plan',
              onPress: () => navigation.navigate('SubscriptionScreen')
            },
          ]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking plan:', error);
      // If plan check fails, show alert but allow user to proceed
      Alert.alert(
        'Plan Check Failed',
        'Unable to verify your plan status. You may proceed, but ensure you have an active plan.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Proceed Anyway',
            onPress: () => { }
          },
        ]
      );
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!validateForm()) return;

    // Check plan before creating loan (only for new loans, not updates)
    if (!loanDetails) {
      const hasValidPlan = await checkPlanBeforeLoanCreation();
      if (!hasValidPlan) {
        return; // User will be redirected to plans screen
      }
    }

    const aadharNumber = formData.aadhaarNumber?.trim();
    if (!aadharNumber || aadharNumber.length !== 12) {
      setErrorMessage('Please enter a valid 12-digit Aadhar number.');
      return;
    }

    // Format dates for new API
    const loanStartDate = formData.loanStartDate instanceof Date
      ? formData.loanStartDate.toISOString()
      : formData.loanStartDate;
    const loanEndDate = formData.loanEndDate instanceof Date
      ? formData.loanEndDate.toISOString()
      : formData.loanEndDate;

    const newData = {
      name: formData.name.trim(),
      mobileNumber: formData.mobileNumber.trim(),
      aadharCardNo: aadharNumber,
      address: formData.address.trim(),
      amount: parseFloat(formData.amount),
      loanGivenDate: loanStartDate,
      loanEndDate: loanEndDate,
      purpose: formData.purpose.trim(),
      loanMode: formData.loanMode || 'cash',
    };

    // Only include proof when creating a new loan (not when updating)
    if (!loanDetails && proofFile) {
      newData.proof = proofFile;
    }

    // Check if fraud warning should be shown before proceeding
    if (!loanDetails && fraudStatus && fraudStatus.riskLevel && fraudStatus.riskLevel !== 'low') {
      setPendingLoanData(newData);
      setShowFraudWarning(true);
      return;
    }

    // Proceed with loan creation
    await proceedWithLoanCreation(newData);
  };

  // Proceed with loan creation (after fraud warning if shown)
  const proceedWithLoanCreation = async (newData) => {
    try {
      const action = loanDetails
        ? updateLoan({ ...newData, id: loanDetails._id })
        : createLoan(newData);
      const response = await dispatch(action);

      if (
        createLoan.fulfilled.match(response) ||
        updateLoan.fulfilled.match(response)
      ) {
        // Check for fraud warning in response
        const responsePayload = response.payload;
        if (responsePayload?.warning && responsePayload.warning.fraudDetected && !loanDetails) {
          // Show fraud warning even after loan creation
          Alert.alert(
            'Fraud Alert',
            responsePayload.warning.recommendation || 'Fraud risk detected for this borrower.',
            [{ text: 'OK' }]
          );
        }

        // For new loans, check if online payment is required
        if (!loanDetails && createLoan.fulfilled.match(response)) {
          // Handle API response structure: response.payload.data or response.payload
          const loanData = responsePayload?.data || responsePayload;

          if (loanData && loanData._id) {
            // Check if this is an online payment loan with Razorpay order
            if (loanData.loanMode === 'online' && loanData.razorpayOrder) {
              // Store loan data and initiate Razorpay payment
              setCreatedLoanData(loanData);
              await handleRazorpayPayment(loanData);
            } else {
              // Cash mode - directly show OTP verification
              setCreatedLoanData(loanData);
              setIsOTPModalVisible(true);
              Toast.show({
                type: 'success',
                position: 'top',
                text1: 'Loan created successfully',
                text2: 'OTP sent to borrower. Please verify to confirm the loan.',
              });
            }
          } else {
            // Fallback: navigate if loan data structure is unexpected
            Toast.show({
              type: 'success',
              position: 'top',
              text1: 'Loan created successfully',
            });
            navigation.navigate('BottomNavigation', { screen: 'Outward' });
          }
        } else {
          // For updates, navigate directly
          Toast.show({
            type: 'success',
            position: 'top',
            text1: 'Loan updated successfully',
          });
          navigation.navigate('BottomNavigation', { screen: 'Outward' });
        }
      } else {
        // Handle plan-related errors
        if (response.payload?.type === 'SUBSCRIPTION_REQUIRED' ||
          response.payload?.errorCode === 'PLAN_REQUIRED') {
          Alert.alert(
            'Plan Required',
            response.payload?.message || 'You need to purchase a plan to create loans.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'View Plans',
                onPress: () => navigation.navigate('SubscriptionScreen')
              },
            ]
          );
          return;
        }

        let errorMsg =
          response.payload?.message ||
          response.payload?.error?.message ||
          (Array.isArray(response.payload?.errors)
            ? response.payload.errors.join(', ')
            : response.payload?.errors) ||
          response.payload?.error ||
          'An error occurred.';

        if (errorMsg.includes('Aadhar number does not exist') ||
          errorMsg.includes('Aadhar number') && errorMsg.includes('not exist')) {
          errorMsg = 'The borrower with this Aadhar number is not registered. Please ask them to register first, or verify the Aadhar number is correct.';
        }

        setErrorMessage(errorMsg);
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Cannot Create Loan',
          text2: errorMsg,
          visibilityTime: 5000,
        });
      }
    } catch (error) {
      console.error('Error submitting data:', error);
      const errorMsg = error.message || 'An error occurred while saving the loan.';
      setErrorMessage(errorMsg);
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: errorMsg,
      });
    }
  };

  // Handle Razorpay payment for online loan disbursement
  const handleRazorpayPayment = async (loanData) => {
    setIsProcessingPayment(true);
    
    try {
      Toast.show({
        type: 'info',
        position: 'top',
        text1: 'Opening Payment Gateway',
        text2: 'Please complete the payment to proceed.',
      });

      // Open Razorpay checkout
      const paymentResult = await openRazorpayCheckoutForLoanCreation(
        loanData.razorpayOrder,
        user,
        loanData
      );

      if (paymentResult.success) {
        // Verify the payment with backend
        await verifyRazorpayPayment(loanData._id, paymentResult.data);
      }
    } catch (error) {
      setIsProcessingPayment(false);
      
      if (error.type === 'USER_CANCELLED') {
        Alert.alert(
          'Payment Cancelled',
          'You cancelled the payment. The loan has been created but payment is pending. You can complete the payment later or switch to cash mode.',
          [
            {
              text: 'Go to Loans',
              onPress: () => navigation.navigate('BottomNavigation', { screen: 'Outward' }),
            },
          ]
        );
      } else {
        Alert.alert(
          'Payment Failed',
          error.message || 'Payment could not be completed. Please try again.',
          [
            {
              text: 'Go to Loans',
              onPress: () => navigation.navigate('BottomNavigation', { screen: 'Outward' }),
            },
          ]
        );
      }
    }
  };

  // Verify Razorpay payment with backend
  const verifyRazorpayPayment = async (loanId, paymentData) => {
    try {
      const verifyResult = await dispatch(verifyLoanPayment({
        loanId,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_signature: paymentData.razorpay_signature,
      })).unwrap();

      setIsProcessingPayment(false);

      if (verifyResult.success) {
        setPaymentVerified(true);
        // Update the created loan data with verified payment info
        if (verifyResult.data?.loan) {
          setCreatedLoanData(prev => ({
            ...prev,
            ...verifyResult.data.loan,
          }));
        }
        
        Toast.show({
          type: 'success',
          position: 'top',
          text1: 'Payment Verified Successfully',
          text2: 'Please verify OTP to confirm the loan.',
        });
        
        // Show OTP verification modal
        setIsOTPModalVisible(true);
      } else {
        throw new Error(verifyResult.message || 'Payment verification failed');
      }
    } catch (error) {
      setIsProcessingPayment(false);
      
      Alert.alert(
        'Payment Verification Failed',
        error.message || 'Could not verify the payment. Please contact support.',
        [
          {
            text: 'Go to Loans',
            onPress: () => navigation.navigate('BottomNavigation', { screen: 'Outward' }),
          },
        ]
      );
    }
  };

  // Reset form fields
  const resetForm = () => {
    setFormData({
      name: '',
      mobileNumber: '',
      aadhaarNumber: '',
      address: '',
      amount: '',
      loanStartDate: null,
      loanEndDate: null,
      purpose: '',
      loanMode: 'cash',
    });
    setErrorMessage('');
    setFieldErrors({});
    setShowOldHistoryButton(false);
    setIsProcessingPayment(false);
    setPaymentVerified(false);
    setProofFile(null);
    setProofError('');
    dispatch(clearFraudStatus());
  };

  // Handle fraud warning modal actions
  const handleFraudWarningProceed = () => {
    setShowFraudWarning(false);
    if (pendingLoanData) {
      proceedWithLoanCreation(pendingLoanData);
      setPendingLoanData(null);
    }
  };

  const handleFraudWarningCancel = () => {
    setShowFraudWarning(false);
    setPendingLoanData(null);
  };

  const handleFraudWarningViewHistory = () => {
    setShowFraudWarning(false);
    // Navigate to loan history page
    if (formData.aadhaarNumber && formData.aadhaarNumber.length === 12) {
      navigation.navigate('OldHistoryPage', {
        aadhaarNumber: formData.aadhaarNumber,
      });
    } else {
      // Show error if Aadhaar number is not valid
      Alert.alert(
        'Invalid Aadhaar Number',
        'Please enter a valid 12-digit Aadhaar number to view history.',
        [{ text: 'OK' }]
      );
    }
  };

  // Handle Aadhar number change
  const handleAadharChange = text => {
    if (!/^\d{0,12}$/.test(text)) return;
    setFormData({ ...formData, aadhaarNumber: text });
    setFieldErrors(prev => ({ ...prev, aadhaarNumber: '' }));
    setShowOldHistoryButton(text.length === 12);
    // Clear previous fraud status when Aadhaar changes
    if (text.length !== 12) {
      dispatch(clearFraudStatus());
    }
    if (text.length === 12) {
      dispatch(getLoanByAadhar({ aadhaarNumber: text }));
      // Check fraud status when Aadhaar is complete
      dispatch(checkFraudStatus(text));
    }
  };

  // Handle contact number change
  const handleContactNoChange = text => {
    if (/^[0-9]{0,10}$/.test(text)) {
      setFormData({ ...formData, mobileNumber: text });
      setFieldErrors(prev => ({ ...prev, mobileNumber: '' }));
    }
  };

  // Handle date picker changes
  const handleDateChange = (type, date) => {
    setFormData({ ...formData, [type]: date });
    setFieldErrors(prev => ({ ...prev, [type]: '' }));
    if (type === 'loanStartDate') setStartDatePickerVisible(false);
    else setEndDatePickerVisible(false);
  };

  const handleOTPVerifySuccess = (verifiedLoanData) => {
    setIsOTPModalVisible(false);
    setCreatedLoanData(null);
    Toast.show({
      type: 'success',
      position: 'top',
      text1: 'Loan confirmed',
      text2: 'Borrower has accepted the loan.',
    });
    navigation.navigate('BottomNavigation', { screen: 'Outward' });
  };

  const handleOTPSkip = () => {
    setIsOTPModalVisible(false);
    Toast.show({
      type: 'info',
      position: 'top',
      text1: 'OTP Verification Skipped',
      text2: 'Loan is pending. You can verify OTP later.',
    });
    navigation.navigate('BottomNavigation', { screen: 'Outward' });
  };

  const handleOTPClose = () => {
    setIsOTPModalVisible(false);
    // If user closes without verifying or skipping, still navigate
    navigation.navigate('BottomNavigation', { screen: 'Outward' });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 20}>
      <Header
        title={loanDetails ? 'Edit Loan Details' : 'Add Loan Details'}
        showBackButton
      />

      <ScrollView
        style={[
          styles.scrollViewContainer,
          isLender && !hasActivePlan && { opacity: 0.5 }
        ]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
        scrollEnabled={isLender ? hasActivePlan : true}>

        <View style={styles.headerCard}>
            <View style={styles.addLoanCont}>
              <MaterialIcons name="add" color="#ff8500" size={24} />
              <Text style={styles.headerTitle}>
                {loanDetails ? 'Update Loan Information' : 'Add New Loan'}
              </Text>
            </View>
            <Text style={styles.headerSubtitle}>
              Fill the form below to {loanDetails ? 'update' : 'create'} loan details
            </Text>
          </View>

          <View style={styles.formContainer}>
            {/* Personal Information Section */}
            <View style={styles.sectionHeader}>
              <Icon name="account-details" size={22} color="#ff7900" />
              <Text style={styles.sectionTitle}>Personal Information</Text>
            </View>

            <View style={[styles.inputGroup, fieldErrors.name && styles.inputGroupError]}>
              <View style={styles.inputIcon}>
                <Icon name="account" size={20} color="#666" />
              </View>
              <TextInput
                style={[styles.input, isFocused.name && styles.inputFocused]}
                placeholder="Full Name"
                value={formData.name}
                onChangeText={text => {
                  setFormData({ ...formData, name: text });
                  setFieldErrors(prev => ({ ...prev, name: '' }));
                }}
                placeholderTextColor="#888"
                onFocus={() => handleFocus('name')}
                onBlur={() => handleBlur('name')}
              />
            </View>
            {fieldErrors.name ? (
              <Text style={styles.fieldErrorText}>{fieldErrors.name}</Text>
            ) : null}

            <View style={[styles.inputGroup, fieldErrors.mobileNumber && styles.inputGroupError]}>
              <View style={styles.inputIcon}>
                <Icon name="phone" size={20} color="#666" />
              </View>
              <TextInput
                style={[styles.input, isFocused.mobileNumber && styles.inputFocused]}
                placeholder="Contact Number"
                value={formData.mobileNumber}
                onChangeText={handleContactNoChange}
                keyboardType="phone-pad"
                placeholderTextColor="#888"
                onFocus={() => handleFocus('mobileNumber')}
                onBlur={() => handleBlur('mobileNumber')}
              />
            </View>
            {fieldErrors.mobileNumber ? (
              <Text style={styles.fieldErrorText}>{fieldErrors.mobileNumber}</Text>
            ) : null}

            <View style={[styles.inputGroup, fieldErrors.aadhaarNumber && styles.inputGroupError]}>
              <View style={styles.inputIcon}>
                <Icon name="card-account-details" size={20} color="#666" />
              </View>
              <TextInput
                style={[styles.input, isFocused.aadhaarNumber && styles.inputFocused]}
                placeholder="Aadhar Card No"
                value={formData.aadhaarNumber}
                onChangeText={handleAadharChange}
                keyboardType="numeric"
                placeholderTextColor="#888"
                onFocus={() => handleFocus('aadhaarNumber')}
                onBlur={() => handleBlur('aadhaarNumber')}
              />
            </View>
            {fieldErrors.aadhaarNumber ? (
              <Text style={styles.fieldErrorText}>{fieldErrors.aadhaarNumber}</Text>
            ) : null}

            {showOldHistoryButton && (
              <View style={styles.historyContainer}>
                {aadharError ? (
                  <View style={styles.errorContainer}>
                    <View style={styles.errorHeader}>
                      <Icon name="alert-circle" size={20} color="#dc2626" />
                      <Text style={styles.errorTitle}>User Not Found</Text>
                    </View>
                    <Text style={styles.errorMessage}>
                      {aadharError.message || aadharError || 'User with this Aadhar number not found'}
                    </Text>
                    <Text style={styles.errorNote}>
                      Note: The borrower must be registered in the system before creating a loan.
                    </Text>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.oldHistoryButton}
                      onPress={() =>
                        navigation.navigate('OldHistoryPage', {
                          aadhaarNumber: formData.aadhaarNumber,
                        })
                      }>
                      <Icon name="history" size={20} color="#FFF" />
                      <Text style={styles.oldHistoryButtonText}>View Loan History</Text>
                    </TouchableOpacity>

                    {/* Fraud Status Badge */}
                    {fraudStatus && fraudStatus.success && (
                      <View style={styles.fraudBadgeContainer}>
                        {fraudLoading ? (
                          <View style={styles.fraudLoadingContainer}>
                            <ActivityIndicator size="small" color="#ff7900" />
                            <Text style={styles.fraudLoadingText}>Checking fraud status...</Text>
                          </View>
                        ) : fraudStatus.riskLevel && fraudStatus.riskLevel !== 'low' ? (
                          <FraudStatusBadge
                            fraudScore={fraudStatus.fraudScore}
                            riskLevel={fraudStatus.riskLevel}
                          />
                        ) : null}
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            <View style={[styles.inputGroup, fieldErrors.address && styles.inputGroupError]}>
              <View style={[styles.inputIcon, styles.textAreaIcon]}>
                <Icon name="home-map-marker" size={20} color="#666" />
              </View>
              <TextInput
                style={[styles.textArea, isFocused.address && styles.inputFocused]}
                placeholder="Address"
                value={formData.address}
                onChangeText={text => {
                  setFormData({ ...formData, address: text });
                  setFieldErrors(prev => ({ ...prev, address: '' }));
                }}
                multiline
                numberOfLines={3}
                placeholderTextColor="#888"
                onFocus={() => handleFocus('address')}
                onBlur={() => handleBlur('address')}
              />
            </View>
            {fieldErrors.address ? (
              <Text style={styles.fieldErrorText}>{fieldErrors.address}</Text>
            ) : null}

            {/* Loan Details Section */}
            <View style={[styles.sectionHeader, { marginTop: m(14) }]}>
              <Icon name="cash-multiple" size={22} color="#ff7900" />
              <Text style={styles.sectionTitle}>Loan Details</Text>
            </View>

            <View style={styles.amountContainer}>
              <View style={[styles.amountInputGroup, fieldErrors.amount && styles.amountInputGroupError]}>
                <View style={styles.inputIcon}>
                  <Icon name="currency-inr" size={20} color="#666" />
                </View>
                <TextInput
                  style={[styles.amountInput, isFocused.amount && styles.inputFocused]}
                  placeholder="Loan Amount"
                  value={formData.amount}
                  onChangeText={text => {
                    setFormData({ ...formData, amount: text });
                    setFieldErrors(prev => ({ ...prev, amount: '' }));
                  }}
                  keyboardType="numeric"
                  placeholderTextColor="#888"
                  onFocus={() => handleFocus('amount')}
                  onBlur={() => handleBlur('amount')}
                />
                <Text style={styles.currencyText}>INR</Text>
              </View>
            </View>
            {fieldErrors.amount ? (
              <Text style={styles.fieldErrorText}>{fieldErrors.amount}</Text>
            ) : null}

            <View style={styles.dateRow}>
              <View style={{ flex: 1 }}>
                <TouchableOpacity
                  style={[styles.dateInputContainer, fieldErrors.loanStartDate && styles.dateInputContainerError]}
                  activeOpacity={0.7}
                  onPress={() => {
                    Keyboard.dismiss();
                    setStartDatePickerVisible(true);
                  }}>
                  <View style={styles.inputIcon}>
                    <Icon name="calendar-start" size={20} color="#666" />
                  </View>
                <View style={styles.dateTextContainer}>
                  <Text
                    style={[
                      styles.datePlaceholder,
                      formData.loanStartDate && styles.datePlaceholderFilled
                    ]}
                    numberOfLines={1}
                  >
                    {formData.loanStartDate ? 'Start Date' : 'Start Date'}
                  </Text>
                  {formData.loanStartDate && (
                    <Text
                      style={styles.dateValue}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {new Date(formData.loanStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Text>
                  )}
                </View>
                <Icon name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
              {fieldErrors.loanStartDate ? (
                <Text style={styles.fieldErrorText}>{fieldErrors.loanStartDate}</Text>
              ) : null}
              </View>

              <View style={{ flex: 1 }}>
              <TouchableOpacity
                style={[styles.dateInputContainer, fieldErrors.loanEndDate && styles.dateInputContainerError]}
                activeOpacity={0.7}
                onPress={() => {
                  Keyboard.dismiss();
                  setEndDatePickerVisible(true);
                }}>
                <View style={styles.inputIcon}>
                  <Icon name="calendar-end" size={20} color="#666" />
                </View>
                <View style={styles.dateTextContainer}>
                  <Text
                    style={[
                      styles.datePlaceholder,
                      formData.loanEndDate && styles.datePlaceholderFilled
                    ]}
                    numberOfLines={1}
                  >
                    {formData.loanEndDate ? 'End Date' : 'End Date'}
                  </Text>
                  {formData.loanEndDate && (
                    <Text
                      style={styles.dateValue}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {new Date(formData.loanEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Text>
                  )}
                </View>
                <Icon name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
              {fieldErrors.loanEndDate ? (
                <Text style={styles.fieldErrorText}>{fieldErrors.loanEndDate}</Text>
              ) : null}
              </View>
            </View>

            <View style={[styles.inputGroup, fieldErrors.purpose && styles.inputGroupError]}>
              <View style={[styles.inputIcon, styles.textAreaIcon]}>
                <Icon name="note-text" size={20} color="#666" />
              </View>
              <TextInput
                style={[styles.textArea, isFocused.purpose && styles.inputFocused]}
                placeholder="Purpose of Loan"
                value={formData.purpose}
                onChangeText={text => {
                  setFormData({ ...formData, purpose: text });
                  setFieldErrors(prev => ({ ...prev, purpose: '' }));
                }}
                multiline
                numberOfLines={3}
                placeholderTextColor="#888"
                onFocus={() => handleFocus('purpose')}
                onBlur={() => handleBlur('purpose')}
              />
            </View>
            {fieldErrors.purpose ? (
              <Text style={styles.fieldErrorText}>{fieldErrors.purpose}</Text>
            ) : null}

            {/* Loan Mode Selection */}
            <View style={styles.loanModeContainer}>
              <Text style={styles.loanModeLabel}>Payment Mode</Text>
              <View style={styles.loanModeButtons}>
                <TouchableOpacity
                  style={[
                    styles.loanModeButton,
                    formData.loanMode === 'cash' && styles.loanModeButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, loanMode: 'cash' })}>
                  <Icon
                    name="cash"
                    size={20}
                    color={formData.loanMode === 'cash' ? '#FFFFFF' : '#666'}
                  />
                  <Text
                    style={[
                      styles.loanModeButtonText,
                      formData.loanMode === 'cash' && styles.loanModeButtonTextActive,
                    ]}>
                    Cash
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.loanModeButton,
                    formData.loanMode === 'online' && styles.loanModeButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, loanMode: 'online' })}>
                  <Icon
                    name="credit-card"
                    size={20}
                    color={formData.loanMode === 'online' ? '#FFFFFF' : '#666'}
                  />
                  <Text
                    style={[
                      styles.loanModeButtonText,
                      formData.loanMode === 'online' && styles.loanModeButtonTextActive,
                    ]}>
                    Online
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Online Payment Info */}
              {formData.loanMode === 'online' && (
                <View style={styles.onlinePaymentInfo}>
                  <Icon name="information" size={18} color="#3B82F6" />
                  <Text style={styles.onlinePaymentInfoText}>
                    Payment will be processed via Razorpay. You'll be redirected to complete the payment after creating the loan.
                  </Text>
                </View>
              )}
            </View>

            {/* Proof Upload Section - Only show when creating new loan */}
            {!loanDetails && (
              <View style={styles.proofSection}>
                <View style={styles.sectionHeader}>
                  <Icon name="file-image" size={22} color="#ff7900" />
                  <Text style={styles.sectionTitle}>Upload Proof (Optional)</Text>
                </View>
                
                <Text style={styles.proofDescription}>
                  Upload a proof document (JPEG, JPG, PNG, max 5MB)
                </Text>

              {proofFile ? (
                <View style={styles.proofPreviewContainer}>
                  <Image
                    source={{ uri: proofFile.uri }}
                    style={styles.proofPreviewImage}
                    resizeMode="cover"
                  />
                  <View style={styles.proofPreviewInfo}>
                    <Text style={styles.proofPreviewName} numberOfLines={1}>
                      {proofFile.fileName || 'proof.jpg'}
                    </Text>
                    {proofFile.fileSize && (
                      <Text style={styles.proofPreviewSize}>
                        {(proofFile.fileSize / 1024 / 1024).toFixed(2)} MB
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.removeProofButton}
                    onPress={handleRemoveProof}
                    activeOpacity={0.7}>
                    <Icon name="close-circle" size={24} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.proofUploadButtons}>
                  <TouchableOpacity
                    style={styles.proofUploadButton}
                    onPress={() => handleProofImagePicker('library')}
                    activeOpacity={0.8}>
                    <Icon name="image-outline" size={20} color="#ff7900" />
                    <Text style={styles.proofUploadButtonText}>Select from Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.proofUploadButton}
                    onPress={() => handleProofImagePicker('camera')}
                    activeOpacity={0.8}>
                    <Icon name="camera-outline" size={20} color="#ff7900" />
                    <Text style={styles.proofUploadButtonText}>Take Photo</Text>
                  </TouchableOpacity>
                </View>
              )}

              {proofError ? (
                <View style={styles.proofErrorContainer}>
                  <Icon name="alert-circle" size={18} color="#dc2626" />
                  <Text style={styles.proofErrorText}>{proofError}</Text>
                </View>
              ) : null}
              </View>
            )}

            {(errorMessage || error) && (
              <View style={styles.errorCard}>
                <Icon name="alert" size={20} color="#dc2626" />
                <Text style={styles.errorText}>
                  {errorMessage || error?.message || 'An unknown error occurred.'}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetForm}
                activeOpacity={0.8}>
                <Icon name="refresh" size={20} color="#666" />
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (loading || isProcessingPayment || paymentVerifying) && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={loading || isProcessingPayment || paymentVerifying}
                activeOpacity={0.8}>
                {(loading || isProcessingPayment || paymentVerifying) ? (
                  <>
                    <ActivityIndicator size="small" color="#FFF" />
                    <Text style={styles.submitButtonText}>
                      {isProcessingPayment ? 'Processing Payment...' : 
                       paymentVerifying ? 'Verifying Payment...' : 'Creating...'}
                    </Text>
                  </>
                ) : (
                  <>
                    <Icon
                      name={loanDetails ? "check-circle" : 
                            formData.loanMode === 'online' ? "credit-card-check" : "plus-circle"}
                      size={20}
                      color="#FFF"
                    />
                    <Text style={styles.submitButtonText}>
                      {loanDetails ? 'Update Loan' : 
                       formData.loanMode === 'online' ? 'Create & Pay Online' : 'Create Loan'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

      {/* Date Pickers */}
      <DateTimePickerModal
        isVisible={isStartDatePickerVisible}
        mode="date"
        onConfirm={date => handleDateChange('loanStartDate', date)}
        onCancel={() => setStartDatePickerVisible(false)}
        minimumDate={new Date()}
        display="spinner"
      />

      <DateTimePickerModal
        isVisible={isEndDatePickerVisible}
        mode="date"
        onConfirm={date => handleDateChange('loanEndDate', date)}
        onCancel={() => setEndDatePickerVisible(false)}
        minimumDate={new Date()}
        display="spinner"
      />

      {/* OTP Verification Modal */}
      {createdLoanData && (
        <LoanOTPVerification
          visible={isOTPModalVisible}
          loanId={createdLoanData._id}
          borrowerMobile={formData.mobileNumber}
          onVerifySuccess={handleOTPVerifySuccess}
          onSkip={handleOTPSkip}
          onClose={handleOTPClose}
          isOnlinePayment={createdLoanData.loanMode === 'online'}
          paymentVerified={paymentVerified}
        />
      )}

      {/* Fraud Warning Modal */}
      <FraudWarningModal
        visible={showFraudWarning}
        fraudData={fraudStatus}
        onProceed={handleFraudWarningProceed}
        onCancel={handleFraudWarningCancel}
        onViewHistory={handleFraudWarningViewHistory}
      />
      
      {/* Subscription Restriction Overlay */}
      {isLender && !planLoading && !hasActivePlan && (
        <SubscriptionRestriction 
          message="Purchase a plan to add new loans"
          asOverlay={true}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollViewContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: m(40),
  },
  headerCard: {
    backgroundColor: '#FFF',
    marginHorizontal: m(20),
    marginTop: m(20),
    marginBottom: m(10),
    padding: m(24),
    borderRadius: m(20),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.secondaryBold,
    color: '#ff8500',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.secondaryRegular,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: m(20),
  },
  formContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: m(20),
    marginBottom: m(20),
    padding: m(24),
    borderRadius: m(20),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(20),
    paddingBottom: m(10),
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.secondarySemiBold,
    color: '#1e293b',
    marginLeft: m(10),
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(3),
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    paddingHorizontal: m(14),
  },
  inputGroupError: {
    borderColor: '#dc2626',
    borderWidth: 2,
  },
  fieldErrorText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#dc2626',
    marginBottom: m(14),
    marginLeft: m(4),
  },
  inputIcon: {
    padding: m(12),
    backgroundColor: '#f1f5f9',
  },
  textAreaIcon: {
    alignSelf: 'flex-start',
    paddingTop: m(16),
  },
  input: {
    flex: 1,
    padding: m(12),
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primaryRegular,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  inputFocused: {
    borderColor: '#ff7900',
    backgroundColor: '#FFF',
  },
  textArea: {
    flex: 1,
    padding: m(12),
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primaryRegular,
    color: '#1e293b',
    minHeight: m(70),
    textAlignVertical: 'top',
    backgroundColor: '#f8fafc',
  },
  historyContainer: {
    marginBottom: m(20),
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: m(12),
    padding: m(16),
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(8),
  },
  errorTitle: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: '#dc2626',
    marginLeft: m(8),
  },
  errorMessage: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#b91c1c',
    lineHeight: m(18),
    marginBottom: m(8),
  },
  errorNote: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#92400e',
    lineHeight: m(16),
  },
  oldHistoryButton: {
    backgroundColor: '#ff7900',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: m(14),
    borderRadius: m(12),
    gap: m(10),
  },
  oldHistoryButtonText: {
    color: '#FFF',
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
  },
  amountContainer: {
    marginBottom: m(3),
  },
  amountInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    paddingHorizontal: m(12),
  },
  amountInput: {
    flex: 1,
    padding: m(12),
    fontSize: FontSizes.md,
    fontFamily: FontFamily.primarySemiBold,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  currencyText: {
    paddingHorizontal: m(16),
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primaryMedium,
    color: '#64748b',
  },
  dateRow: {
    flexDirection: 'row',
    gap: m(12),
    marginBottom: m(20),
  },
  dateInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: m(12),
    minHeight: m(52),
    marginBottom: m(4),
  },
  dateInputContainerError: {
    borderColor: '#dc2626',
    borderWidth: 2,
  },
  inputIcon: {
    marginRight: m(8),
  },
  dateTextContainer: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: m(4),
    marginRight: m(2),
  },
  datePlaceholder: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#888',
    lineHeight: m(18),
  },
  datePlaceholderFilled: {
    fontSize: FontSizes.xs,
    color: '#94a3b8',
    fontFamily: FontFamily.primaryMedium,
  },
  dateValue: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: '#1e293b',
    lineHeight: m(20),
    marginTop: m(2),
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: m(12),
    padding: m(16),
    marginBottom: m(20),
    gap: m(10),
  },
  errorText: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#b91c1c',
    lineHeight: m(18),
  },
  actionButtons: {
    flexDirection: 'row',
    gap: m(12),
    marginTop: m(10),
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: m(10),
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    gap: m(8),
  },
  resetButtonText: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: '#64748b',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: m(10),
    borderRadius: m(12),
    backgroundColor: '#ff7900',
    gap: m(10),
  },
  submitButtonDisabled: {
    backgroundColor: '#ffa54d',
    opacity: 0.8,
  },
  submitButtonText: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: '#FFF',
  },
  loanModeContainer: {
    marginBottom: m(20),
  },
  loanModeLabel: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: '#374151',
    marginBottom: m(12),
  },
  loanModeButtons: {
    flexDirection: 'row',
    gap: m(12),
  },
  loanModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: m(14),
    borderRadius: m(12),
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    gap: m(8),
  },
  loanModeButtonActive: {
    backgroundColor: '#ff7900',
    borderColor: '#ff7900',
  },
  loanModeButtonText: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: '#6B7280',
  },
  loanModeButtonTextActive: {
    color: '#FFFFFF',
  },
  onlinePaymentInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: m(10),
    padding: m(12),
    marginTop: m(12),
    gap: m(10),
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  onlinePaymentInfoText: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#1E40AF',
    lineHeight: m(18),
  },
  fraudBadgeContainer: {
    marginTop: m(12),
  },
  fraudLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: m(12),
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    gap: m(10),
  },
  fraudLoadingText: {
    fontSize: FontSizes.sm,
    color: '#64748b',
    fontFamily: FontFamily.primaryRegular,
  },
  addLoanCont:{
    flexDirection: 'row',
     alignItems: 'center', 
     gap: 6, 
     marginBottom: 6
  },
  proofSection: {
    marginBottom: m(20),
  },
  proofDescription: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#64748b',
    marginBottom: m(12),
  },
  proofUploadButtons: {
    flexDirection: 'row',
    gap: m(12),
    marginBottom: m(8),
  },
  proofUploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: m(14),
    borderRadius: m(12),
    borderWidth: 2,
    borderColor: '#ff7900',
    backgroundColor: '#FFF',
    gap: m(8),
  },
  proofUploadButtonText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primarySemiBold,
    color: '#ff7900',
  },
  proofPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: m(12),
    marginBottom: m(8),
    gap: m(12),
  },
  proofPreviewImage: {
    width: m(60),
    height: m(60),
    borderRadius: m(8),
    backgroundColor: '#e2e8f0',
  },
  proofPreviewInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  proofPreviewName: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: '#1e293b',
    marginBottom: m(4),
  },
  proofPreviewSize: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#64748b',
  },
  removeProofButton: {
    padding: m(4),
  },
  proofErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: m(8),
    padding: m(10),
    gap: m(8),
    marginTop: m(8),
  },
  proofErrorText: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#b91c1c',
    lineHeight: m(16),
  },
});