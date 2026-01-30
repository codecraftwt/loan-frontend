import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import Toast from 'react-native-toast-message';
import borrowerLoanAPI from '../../../Services/borrowerLoanService';
import { useDispatch, useSelector } from 'react-redux';
import { getBorrowerLoans } from '../../../Redux/Slices/borrowerLoanSlice';
import { openRazorpayCheckoutForLoan } from '../../../Services/razorpayService';
import moment from 'moment';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

export default function MakePayment() {
  const navigation = useNavigation();
  const route = useRoute();
  const { loan } = route.params;
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);

  const [loading, setLoading] = useState(false);
  const [checkingPending, setCheckingPending] = useState(true);
  const [pendingPayment, setPendingPayment] = useState(null);
  const [paymentMode, setPaymentMode] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentProof, setPaymentProof] = useState(null);

  const paymentModes = [
    { id: 'cash', label: 'Cash', icon: 'dollar-sign', description: 'Pay directly to lender (requires confirmation)' },
    { id: 'online', label: 'Online Payment', icon: 'credit-card', description: 'Pay via Razorpay (requires confirmation)' },
  ];

  const paymentTypes = [
    { id: 'one-time', label: 'One-time Payment', icon: 'check-circle', description: 'Pay full remaining amount' },
    { id: 'installment', label: 'Installment', icon: 'calendar', description: 'Pay partial amount' },
  ];

  useEffect(() => {
    // Check for pending payments when component mounts
    checkForPendingPayment();
  }, []);

  useEffect(() => {
    // If one-time payment is selected, set amount to remaining amount
    if (paymentType === 'one-time') {
      setAmount(loan.remainingAmount?.toString() || '');
    }
  }, [paymentType]);

  const checkForPendingPayment = async () => {
    try {
      setCheckingPending(true);
      
      // Validate loan ID
      if (!loan?._id) {
        return;
      }
      
      // Get borrower ID from user or loan object
      const borrowerId = user?._id || loan.borrowerId || loan.borrower?._id;
      if (!borrowerId) {
        return;
      }
      
      const response = await borrowerLoanAPI.getPaymentHistory(loan._id, borrowerId);
      
      // Service returns the data object directly: { loanId, loanSummary, installmentDetails, payments, paymentStats, lenderInfo }
      const data = response || {};
      const payments = data.payments || [];
      
      // Find pending payment (status === 'pending')
      const pending = payments.find(
        payment => payment.paymentStatus?.toLowerCase() === 'pending'
      );
      
      if (pending) {
        setPendingPayment(pending);
      } else {
        setPendingPayment(null);
      }
    } catch (error) {
      console.error('Error checking for pending payment:', error);
      // Don't block the form if there's an error checking
      setPendingPayment(null);
    } finally {
      setCheckingPending(false);
    }
  };

  const validateForm = () => {
    // Check for pending payment first
    if (pendingPayment) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Pending Payment',
        text2: 'You have a pending payment. Please wait for lender confirmation.',
      });
      return false;
    }

    if (!paymentMode) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Payment Mode Required',
        text2: 'Please select a payment mode (Cash or Online Payment)',
      });
      return false;
    }

    if (!paymentType) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Payment Type Required',
        text2: 'Please select a payment type (One-time Payment or Installment)',
      });
      return false;
    }

    if (!amount || amount.trim() === '') {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Amount Required',
        text2: 'Please enter the payment amount',
      });
      return false;
    }

    const amountNum = parseFloat(amount);

    if (isNaN(amountNum) || amountNum <= 0) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Invalid Amount',
        text2: 'Please enter a valid amount greater than zero',
      });
      return false;
    }

    const remainingAmount = loan.remainingAmount || 0;

    if (amountNum > remainingAmount) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Amount Exceeds Balance',
        text2: `Payment amount (₹${amountNum.toLocaleString('en-IN')}) cannot exceed remaining balance (₹${remainingAmount.toLocaleString('en-IN')})`,
      });
      return false;
    }
    return true;
  };

  const handleSubmitPayment = async () => {
    if (!validateForm()) return;

    // If online payment mode, handle Razorpay flow
    if (paymentMode === 'online') {
      await handleOnlinePayment();
      return;
    }

    // For cash payments, show confirmation dialog
    Alert.alert(
      'Confirm Payment',
      `Are you sure you want to submit this payment?\n\nAmount: ₹${amount}\nMode: ${paymentMode}\nType: ${paymentType}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: submitPayment },
      ]
    );
  };

  const handleOnlinePayment = async () => {
    setLoading(true);
    try {
      const paymentAmount = parseFloat(amount);

      // Step 1: Create Razorpay order
      let orderResponse;
      try {
        orderResponse = await borrowerLoanAPI.createRazorpayOrder(loan._id, {
        paymentType: paymentType,
        amount: paymentAmount,
      });
      } catch (orderError) {
        setLoading(false);
        const orderErrorResponse = orderError.response?.data || {};
        const orderErrorMessage = orderErrorResponse.message || orderErrorResponse.error || orderError.message || '';
        
        if (orderErrorMessage.includes('amount') || orderErrorResponse.error?.includes('amount')) {
          Toast.show({
            type: 'error',
            position: 'top',
            text1: 'Amount Error',
            text2: orderErrorMessage || 'Invalid payment amount. Please check and try again.',
          });
        } else if (orderErrorMessage.includes('payment type') || orderErrorResponse.error?.includes('paymentType')) {
          Toast.show({
            type: 'error',
            position: 'top',
            text1: 'Payment Type Error',
            text2: orderErrorMessage || 'Invalid payment type selected.',
          });
        } else {
          Toast.show({
            type: 'error',
            position: 'top',
            text1: 'Order Creation Failed',
            text2: orderErrorMessage || 'Failed to create payment order. Please try again.',
          });
        }
        return;
      }

      if (!orderResponse || !orderResponse.success) {
        setLoading(false);
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Order Creation Failed',
          text2: orderResponse?.message || 'Failed to create payment order. Please try again.',
        });
        return;
      }

      // Step 2: Open Razorpay checkout
      let paymentResult;
      try {
        paymentResult = await openRazorpayCheckoutForLoan(orderResponse, user, loan);
      } catch (razorpayError) {
        setLoading(false);
        
        // Handle user cancellation
        if (razorpayError.type === 'USER_CANCELLED' || razorpayError.code === 2) {
          Toast.show({
            type: 'info',
            position: 'top',
            text1: 'Payment Cancelled',
            text2: 'Payment was cancelled by you',
          });
          return;
        }
        
        // Handle other Razorpay errors
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Payment Failed',
          text2: razorpayError.message || 'Payment failed. Please try again.',
        });
        return;
      }

      if (!paymentResult.success) {
        setLoading(false);
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Payment Failed',
          text2: 'Payment failed. Please try again.',
        });
        return;
      }

      // Step 3: Verify payment
      if (
        !paymentResult.data.razorpay_payment_id ||
        !paymentResult.data.razorpay_order_id ||
        !paymentResult.data.razorpay_signature
      ) {
        throw new Error('Payment response incomplete');
      }

      let verifyResponse;
      try {
        // Ensure all required fields are present
        if (!paymentType || !paymentAmount || paymentAmount <= 0) {
          throw new Error('Payment type and amount are required');
        }

        verifyResponse = await borrowerLoanAPI.verifyRazorpayPayment(loan._id, {
          razorpay_payment_id: paymentResult.data.razorpay_payment_id,
          razorpay_order_id: paymentResult.data.razorpay_order_id,
          razorpay_signature: paymentResult.data.razorpay_signature,
          amount: paymentAmount, // amount in INR as required by backend docs
          paymentMode: 'online', // Online payment mode
          paymentType: paymentType,
          notes: notes.trim() || undefined,
        });
      } catch (verifyError) {
        setLoading(false);
        const verifyErrorResponse = verifyError.response?.data || {};
        const verifyErrorMessage = verifyErrorResponse.message || verifyErrorResponse.error || verifyError.message || '';
        
        if (verifyErrorMessage.includes('pending payment') || verifyErrorResponse?.pendingPayment) {
          const pendingPaymentData = verifyErrorResponse?.pendingPayment || { amount: parseFloat(amount) };
          setPendingPayment(pendingPaymentData);
          Toast.show({
            type: 'error',
            position: 'top',
            text1: 'Pending Payment',
            text2: verifyErrorMessage || 'You have a pending payment. Please wait for lender confirmation.',
          });
        } else if (verifyErrorMessage.includes('signature') || verifyErrorResponse.error?.includes('signature')) {
          Toast.show({
            type: 'error',
            position: 'top',
            text1: 'Verification Failed',
            text2: verifyErrorMessage || 'Payment signature verification failed. Please contact support.',
          });
        } else if (verifyErrorMessage.includes('payment') || verifyErrorResponse.error?.includes('payment')) {
          Toast.show({
            type: 'error',
            position: 'top',
            text1: 'Payment Verification Failed',
            text2: verifyErrorMessage || 'Failed to verify payment. Please contact support.',
          });
        } else {
          Toast.show({
            type: 'error',
            position: 'top',
            text1: 'Verification Error',
            text2: verifyErrorMessage || 'Payment verification failed. Please try again or contact support.',
          });
        }
        return;
      }

      if (!verifyResponse || !verifyResponse.success) {
        setLoading(false);
        const errorMsg = verifyResponse?.message || verifyResponse?.error || 'Payment verification failed';
        
        if (errorMsg.includes('pending payment') || verifyResponse?.data?.pendingPayment) {
          const pendingPaymentData = verifyResponse?.data?.pendingPayment || { amount: parseFloat(amount) };
          setPendingPayment(pendingPaymentData);
          Toast.show({
            type: 'error',
            position: 'top',
            text1: 'Pending Payment',
            text2: errorMsg || 'You have a pending payment. Please wait for lender confirmation.',
          });
        } else {
          Toast.show({
            type: 'error',
            position: 'top',
            text1: 'Verification Failed',
            text2: errorMsg || 'Payment verification failed. Please try again.',
          });
        }
        return;
      }

      // Payment verified - now pending lender confirmation
      setLoading(false);
      
      // Show success message with lender confirmation status
      const confirmationMessage = verifyResponse.data?.lenderConfirmationMessage 
        || 'Payment verified successfully! Lender confirmation pending.';
      
      Toast.show({
        type: 'success',
        position: 'top',
        text1: 'Payment Verified',
        text2: verifyResponse.message || confirmationMessage,
      });

      // Refresh loan list and navigate back
      if (user?._id) {
        await dispatch(getBorrowerLoans({ borrowerId: user._id })).unwrap();
      }

      // Loan totals will be updated only after lender confirms
      navigation.navigate('BorrowerLoanDetails', { 
        loan: {
          ...loan,
          // Use loanSummary for current values (before lender confirmation)
          totalPaid: verifyResponse.data?.loanSummary?.currentPaidAmount ?? loan.totalPaid,
          remainingAmount: verifyResponse.data?.loanSummary?.currentRemainingAmount ?? loan.remainingAmount,
          paymentStatus: verifyResponse.data?.loanSummary?.loanStatus || loan.paymentStatus,
        }
      });

    } catch (error) {
      setLoading(false);
      console.error('Online payment error:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      
      // Extract error information
      const errorResponse = error.response?.data || {};
      const errorMessage = errorResponse.message || error.message || '';
      const errorDetail = errorResponse.error || errorResponse.details || '';
      const statusCode = error.response?.status;
      
      // Combine error messages (prefer detail over message)
      let fullErrorMessage = errorDetail || errorMessage;
      
      // If no specific message, provide default based on status code
      if (!fullErrorMessage) {
        switch (statusCode) {
          case 400:
            fullErrorMessage = 'Invalid payment data. Please check all fields and try again.';
            break;
          case 401:
            fullErrorMessage = 'Authentication failed. Please login again.';
            break;
          case 403:
            fullErrorMessage = 'You do not have permission to make this payment.';
            break;
          case 404:
            fullErrorMessage = 'Loan not found. Please refresh and try again.';
            break;
          case 422:
            fullErrorMessage = 'Validation failed. Please check all required fields.';
            break;
          case 500:
            fullErrorMessage = 'Server error occurred. Please try again later.';
            break;
          default:
            fullErrorMessage = 'Payment failed. Please try again.';
        }
      }
      
      // Check for specific error cases
      if (errorMessage.includes('pending payment') || errorResponse?.pendingPayment) {
        const pendingPaymentData = errorResponse?.pendingPayment;
        setPendingPayment(pendingPaymentData || { amount: parseFloat(amount) });
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Pending Payment',
          text2: errorMessage || 'You have a pending payment. Please wait for lender confirmation.',
        });
      } else if (errorDetail?.includes('Loan end date is already passed') || errorDetail?.includes('loanEndDate') || errorMessage.includes('loan end date')) {
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Loan Expired',
          text2: 'The loan end date has passed. Please contact your lender to extend the loan before making a payment.',
          visibilityTime: 5000,
        });
      } else if (errorMessage.includes('cannot exceed remaining') || errorMessage.includes('exceed remaining amount')) {
        // Handle amount exceeds remaining balance error from backend
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Amount Exceeds Balance',
          text2: errorMessage,
          visibilityTime: 4000,
        });
      } else if (errorMessage.includes('amount') || errorDetail?.includes('amount')) {
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Amount Error',
          text2: errorMessage || fullErrorMessage || 'Invalid payment amount. Please check and try again.',
        });
      } else if (errorMessage.includes('payment type') || errorDetail?.includes('paymentType')) {
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Payment Type Error',
          text2: fullErrorMessage || 'Invalid payment type selected.',
        });
      } else if (statusCode === 400 || statusCode === 422) {
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Validation Error',
          text2: fullErrorMessage || 'Please check all required fields and try again.',
        });
      } else if (statusCode === 500) {
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Server Error',
          text2: fullErrorMessage || 'A server error occurred. Please try again later or contact support.',
        });
      } else {
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Payment Failed',
          text2: fullErrorMessage || 'Payment failed. Please try again.',
        });
      }
    }
  };

  const submitPayment = async () => {
    setLoading(true);
    try {
      // Double-check required fields before submitting
      if (!paymentMode || !paymentType || !amount) {
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Validation Error',
          text2: 'Payment mode, payment type, and amount are required',
        });
        setLoading(false);
        return;
      }

      const paymentAmount = parseFloat(amount);
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Invalid Amount',
          text2: 'Please enter a valid payment amount',
        });
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('paymentMode', paymentMode.trim());
      formData.append('paymentType', paymentType.trim());
      formData.append('amount', paymentAmount);
      
      if (transactionId && transactionId.trim()) {
        formData.append('transactionId', transactionId.trim());
      }
      if (notes && notes.trim()) {
        formData.append('notes', notes.trim());
      }
      if (paymentProof) {
        formData.append('paymentProof', {
          uri: paymentProof.uri,
          type: paymentProof.type,
          name: paymentProof.fileName,
        });
      }

      const response = await borrowerLoanAPI.makePayment(loan._id, formData);

      Toast.show({
        type: 'success',
        position: 'top',
        text1: 'Payment Submitted',
        text2: response.message || 'Payment submitted successfully. Awaiting lender confirmation.',
      });

      // Refresh loan data after successful payment
      // Navigate back to loan details with updated loan data
      navigation.navigate('BorrowerLoanDetails', { 
        loan: {
          ...loan,
          totalPaid: response.data?.totalPaid || loan.totalPaid,
          remainingAmount: response.data?.remainingAmount || loan.remainingAmount,
          paymentStatus: response.data?.paymentStatus || loan.paymentStatus,
        }
      });
    } catch (error) {
      console.error('Payment submission error:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      
      // Extract error information
      const errorResponse = error.response?.data || {};
      const errorMessage = errorResponse.message || error.message || '';
      const errorDetail = errorResponse.error || errorResponse.details || '';
      const statusCode = error.response?.status;
      
      // Combine error messages (prefer detail over message)
      let fullErrorMessage = errorDetail || errorMessage;
      
      // If no specific message, provide default based on status code
      if (!fullErrorMessage) {
        switch (statusCode) {
          case 400:
            fullErrorMessage = 'Invalid payment data. Please check all fields and try again.';
            break;
          case 401:
            fullErrorMessage = 'Authentication failed. Please login again.';
            break;
          case 403:
            fullErrorMessage = 'You do not have permission to make this payment.';
            break;
          case 404:
            fullErrorMessage = 'Loan not found. Please refresh and try again.';
            break;
          case 422:
            fullErrorMessage = 'Validation failed. Please check all required fields.';
            break;
          case 500:
            fullErrorMessage = 'Server error occurred. Please try again later.';
            break;
          default:
            fullErrorMessage = 'Failed to submit payment. Please try again.';
        }
      }
      
      // Check for specific error cases
      if (errorMessage.includes('pending payment') || errorResponse?.pendingPayment) {
        const pendingPaymentData = errorResponse?.pendingPayment;
        setPendingPayment(pendingPaymentData || { amount: parseFloat(amount) });
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Pending Payment',
          text2: errorMessage || 'You have a pending payment. Please wait for lender confirmation.',
        });
      } else if (errorDetail?.includes('Loan end date is already passed') || errorDetail?.includes('loanEndDate') || errorMessage.includes('loan end date')) {
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Loan Expired',
          text2: 'The loan end date has passed. Please contact your lender to extend the loan before making a payment.',
          visibilityTime: 5000,
        });
      } else if (errorMessage.includes('cannot exceed remaining') || errorMessage.includes('exceed remaining amount')) {
        // Handle amount exceeds remaining balance error from backend
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Amount Exceeds Balance',
          text2: errorMessage,
          visibilityTime: 4000,
        });
      } else if (errorMessage.includes('payment mode') || errorDetail?.includes('paymentMode')) {
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Payment Mode Error',
          text2: fullErrorMessage || 'Please select a valid payment mode.',
        });
      } else if (errorMessage.includes('amount') || errorDetail?.includes('amount')) {
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Amount Error',
          text2: errorMessage || fullErrorMessage || 'Please enter a valid payment amount.',
        });
      } else if (statusCode === 400 || statusCode === 422) {
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Validation Error',
          text2: fullErrorMessage || 'Please check all required fields and try again.',
        });
      } else if (statusCode === 500) {
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Server Error',
          text2: fullErrorMessage || 'A server error occurred. Please try again later or contact support.',
        });
      } else {
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Payment Failed',
          text2: fullErrorMessage || 'Failed to submit payment. Please try again.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const requestCameraPermission = async () => {
    if (Platform.OS !== 'android') {
      return true; // iOS handles permissions differently
    }
    
    try {
       const checkResult = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );
      
      if (checkResult) {
        return true; // Permission already granted
      }

      // Request permission if not granted
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission Required',
          message: 'This app needs access to your camera to take a payment proof photo.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'Allow',
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        Alert.alert(
          'Camera Permission Denied',
          'Camera permission is required to take photos. Please enable it in your device settings (Settings > Apps > Loanhub > Permissions > Camera).',
          [{ text: 'OK' }]
        );
        return false;
      } else {
        return false;
      }
    } catch (err) {
      console.warn('Camera permission error:', err);
      return false;
    }
  };

  const selectImage = () => {
    Alert.alert(
      'Upload Payment Proof',
      'Choose an option to upload payment proof',
      [
        {
          text: 'Camera',
          onPress: async () => {
            try {
              // Request camera permission for Android (required since it's in manifest)
              if (Platform.OS === 'android') {
                const hasPermission = await requestCameraPermission();
                if (!hasPermission) {
                  return;
                }
              }

              launchCamera(
                {
                  mediaType: 'photo',
                  quality: 0.8,
                  saveToPhotos: true,
                },
                (response) => {
                  if (response.didCancel) {
                    return;
                  }
                  if (response.errorCode) {
                    let errorMessage = 'Failed to open camera.';
                    if (response.errorCode === 'permission') {
                      errorMessage = 'Camera permission is required. Please grant permission in your device settings.';
                    } else if (response.errorMessage) {
                      errorMessage = response.errorMessage;
                    }
                    Toast.show({
                      type: 'error',
                      position: 'top',
                      text1: 'Camera Error',
                      text2: errorMessage,
                    });
                    return;
                  }
                  if (response.assets && response.assets[0]) {
                    const asset = response.assets[0];
                    setPaymentProof({
                      uri: asset.uri,
                      type: asset.type || 'image/jpeg',
                      fileName: asset.fileName || `payment_proof_${Date.now()}.jpg`,
                    });
                    Toast.show({
                      type: 'success',
                      position: 'top',
                      text1: 'Image Selected',
                      text2: 'Payment proof image has been selected.',
                    });
                  }
                }
              );
            } catch (error) {
              console.error('Error launching camera:', error);
              Toast.show({
                type: 'error',
                position: 'top',
                text1: 'Camera Error',
                text2: 'Failed to open camera. Please try again.',
              });
            }
          },
        },
        {
          text: 'Gallery',
          onPress: () => {
            launchImageLibrary(
              {
                mediaType: 'photo',
                quality: 0.8,
              },
              (response) => {
                if (response.didCancel) {
                  return;
                }
                if (response.errorCode) {
                  Toast.show({
                    type: 'error',
                    position: 'top',
                    text1: 'Gallery Error',
                    text2: response.errorMessage || 'Failed to open gallery.',
                  });
                  return;
                }
                if (response.assets && response.assets[0]) {
                  const asset = response.assets[0];
                  setPaymentProof({
                    uri: asset.uri,
                    type: asset.type || 'image/jpeg',
                    fileName: asset.fileName || `payment_proof_${Date.now()}.jpg`,
                  });
                  Toast.show({
                    type: 'success',
                    position: 'top',
                    text1: 'Image Selected',
                    text2: 'Payment proof image has been selected.',
                  });
                }
              }
            );
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const formatCurrency = (value) => {
    return `₹${value?.toLocaleString('en-IN') || 0}`;
  };

  const handleAmountChange = (text) => {
    // Only allow numbers and decimal point
    // Remove any non-numeric characters except decimal point
    const numericValue = text.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = numericValue.split('.');
    let filteredValue = parts[0];
    if (parts.length > 1) {
      // Only allow one decimal point and max 2 decimal places
      filteredValue = parts[0] + '.' + parts.slice(1).join('').substring(0, 2);
    }
    
    setAmount(filteredValue);
  };

  const renderPaymentModeCard = (mode) => (
    <TouchableOpacity
      key={mode.id}
      style={[
        styles.optionCard,
        paymentMode === mode.id && styles.selectedOptionCard,
      ]}
      onPress={() => !pendingPayment && setPaymentMode(mode.id)}
      disabled={pendingPayment}
    >
      <View style={styles.optionIcon}>
        <Icon name={mode.icon} size={24} color={paymentMode === mode.id ? '#FFFFFF' : '#3B82F6'} />
      </View>
      <View style={styles.optionContent}>
        <Text style={[
          styles.optionTitle,
          paymentMode === mode.id && styles.selectedText
        ]}>
          {mode.label}
        </Text>
        <Text style={[
          styles.optionDescription,
          paymentMode === mode.id && styles.selectedText
        ]}>
          {mode.description}
        </Text>
      </View>
      {paymentMode === mode.id && (
        <View style={styles.checkmark}>
          <Icon name="check" size={16} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderPaymentTypeCard = (type) => (
    <TouchableOpacity
      key={type.id}
      style={[
        styles.optionCard,
        paymentType === type.id && styles.selectedOptionCard,
      ]}
      onPress={() => !pendingPayment && setPaymentType(type.id)}
      disabled={pendingPayment}
    >
      <View style={styles.optionIcon}>
        <Icon name={type.icon} size={24} color={paymentType === type.id ? '#FFFFFF' : '#10B981'} />
      </View>
      <View style={styles.optionContent}>
        <Text style={[
          styles.optionTitle,
          paymentType === type.id && styles.selectedText
        ]}>
          {type.label}
        </Text>
        <Text style={[
          styles.optionDescription,
          paymentType === type.id && styles.selectedText
        ]}>
          {type.description}
        </Text>
      </View>
      {paymentType === type.id && (
        <View style={styles.checkmark}>
          <Icon name="check" size={16} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title="Make Payment" showBackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Loan Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Loan Summary</Text>
          <View style={styles.summaryDetails}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Amount</Text>
              <Text style={styles.summaryValue}>{formatCurrency(loan.amount)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Paid</Text>
              <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                {formatCurrency(loan.totalPaid)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Remaining</Text>
              <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
                {formatCurrency(loan.remainingAmount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Pending Payment Warning */}
        {checkingPending ? (
          <View style={styles.pendingCheckCard}>
            <ActivityIndicator size="small" color="#F59E0B" />
            <Text style={styles.pendingCheckText}>Checking for pending payments...</Text>
          </View>
        ) : pendingPayment ? (
          <View style={styles.pendingPaymentCard}>
            <View style={styles.pendingPaymentHeader}>
              <Icon name="clock" size={24} color="#F59E0B" />
              <Text style={styles.pendingPaymentTitle}>Payment Pending</Text>
            </View>
            <Text style={styles.pendingPaymentMessage}>
              You have a pending payment request. Please wait for the lender to confirm or reject this payment before making a new payment.
            </Text>
            <View style={styles.pendingPaymentDetails}>
              <View style={styles.pendingDetailRow}>
                <Text style={styles.pendingDetailLabel}>Amount:</Text>
                <Text style={styles.pendingDetailValue}>
                  {formatCurrency(pendingPayment.amount)}
                </Text>
              </View>
              <View style={styles.pendingDetailRow}>
                <Text style={styles.pendingDetailLabel}>Mode:</Text>
                <Text style={styles.pendingDetailValue}>
                  {pendingPayment.paymentMode?.charAt(0).toUpperCase() + pendingPayment.paymentMode?.slice(1) || 'N/A'}
                </Text>
              </View>
              {pendingPayment.paymentDate && (
                <View style={styles.pendingDetailRow}>
                  <Text style={styles.pendingDetailLabel}>Date:</Text>
                  <Text style={styles.pendingDetailValue}>
                    {moment(pendingPayment.paymentDate).format('DD MMM YYYY, hh:mm A')}
                  </Text>
                </View>
              )}
              {pendingPayment.installmentNumber && (
                <View style={styles.pendingDetailRow}>
                  <Text style={styles.pendingDetailLabel}>Installment:</Text>
                  <Text style={styles.pendingDetailValue}>
                    #{pendingPayment.installmentNumber}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : null}

        {/* Payment Mode Selection */}
        <View style={[styles.section, pendingPayment && styles.disabledSection]}>
          <Text style={styles.sectionTitle}>Payment Mode</Text>
          <Text style={styles.sectionSubtitle}>Choose how you want to make the payment</Text>
          <View style={styles.optionsGrid}>
            {paymentModes.map(mode => (
              <View key={mode.id} style={{ opacity: pendingPayment ? 0.5 : 1 }}>
                {renderPaymentModeCard(mode)}
              </View>
            ))}
          </View>
        </View>

        {/* Payment Type Selection */}
        <View style={[styles.section, pendingPayment && styles.disabledSection]}>
          <Text style={styles.sectionTitle}>Payment Type</Text>
          <Text style={styles.sectionSubtitle}>Select payment structure</Text>
          <View style={styles.optionsGrid}>
            {paymentTypes.map(type => (
              <View key={type.id} style={{ opacity: pendingPayment ? 0.5 : 1 }}>
                {renderPaymentTypeCard(type)}
              </View>
            ))}
          </View>
        </View>

        {/* Amount Input */}
        <View style={[styles.section, pendingPayment && styles.disabledSection]}>
          <Text style={styles.sectionTitle}>Payment Amount</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="Enter amount"
              keyboardType="numeric"
              value={amount}
              onChangeText={handleAmountChange}
              editable={!pendingPayment && paymentType !== 'one-time'}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          {paymentType === 'one-time' && (
            <Text style={styles.helperText}>
              Full remaining amount will be paid
            </Text>
          )}
        </View>

        {/* Online Payment Info (for Razorpay) */}
        {paymentMode === 'online' && (
          <View style={styles.section}>
            <View style={styles.infoCard}>
              <Icon name="info" size={20} color="#3B82F6" />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Online Payment via Razorpay</Text>
                <Text style={styles.infoText}>
                  You will be redirected to Razorpay secure payment gateway. Payment will be verified and then submitted for lender confirmation.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Notes */}
        <View style={[styles.section, pendingPayment && styles.disabledSection]}>
          <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add any additional information..."
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
            editable={!pendingPayment}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Payment Proof Upload (Only for Cash payments) */}
          <View style={[styles.section, pendingPayment && styles.disabledSection]}>
            <Text style={styles.sectionTitle}>Payment Proof (Optional)</Text>
            <Text style={styles.sectionSubtitle}>
              Upload receipt, bank statement, or payment screenshot
            </Text>
            <TouchableOpacity
              style={[styles.uploadButton, pendingPayment && styles.disabledButton]}
              onPress={selectImage}
              disabled={pendingPayment}
            >
              <Ionicons name="cloud-upload-outline" size={24} color={pendingPayment ? "#9CA3AF" : "#6B7280"} />
              <Text style={[styles.uploadText, pendingPayment && { color: "#9CA3AF" }]}>
                {paymentProof ? 'Change Proof' : 'Upload Payment Proof'}
              </Text>
            </TouchableOpacity>
            {paymentProof && (
              <View style={styles.proofPreview}>
                <View style={styles.proofImageContainer}>
                <Image source={{ uri: paymentProof.uri }} style={styles.proofImage} />
                  <TouchableOpacity
                    style={styles.removeProofButton}
                    onPress={() => {
                      setPaymentProof(null);
                      Toast.show({
                        type: 'info',
                        position: 'top',
                        text1: 'Image Removed',
                        text2: 'Payment proof image has been removed.',
                      });
                    }}
                    disabled={pendingPayment}
                  >
                    <Icon name="x" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.proofName}>{paymentProof.fileName}</Text>
              </View>
            )}
          </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton, 
            (loading || pendingPayment || checkingPending) && styles.disabledButton
          ]}
          onPress={handleSubmitPayment}
          disabled={loading || pendingPayment || checkingPending}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="cash-outline" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>
                {pendingPayment ? 'Payment Pending' : 'Submit Payment'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

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
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    padding: m(20),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  summaryTitle: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(16),
  },
  summaryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: m(12),
    color: '#6B7280',
    marginBottom: m(4),
  },
  summaryValue: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#111827',
  },
  summaryDivider: {
    width: 1,
    height: m(40),
    backgroundColor: '#E5E7EB',
    marginHorizontal: m(12),
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    padding: m(20),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(8),
  },
  sectionSubtitle: {
    fontSize: m(14),
    color: '#6B7280',
    marginBottom: m(16),
  },
  optionsGrid: {
    gap: m(12),
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: m(16),
    borderRadius: m(12),
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  selectedOptionCard: {
    borderColor: '#3B82F6',
    backgroundColor: '#3B82F6',
  },
  optionIcon: {
    width: m(48),
    height: m(48),
    borderRadius: m(24),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(16),
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#111827',
    marginBottom: m(4),
  },
  optionDescription: {
    fontSize: m(14),
    color: '#6B7280',
  },
  selectedText: {
    color: '#FFFFFF',
  },
  checkmark: {
    width: m(24),
    height: m(24),
    borderRadius: m(12),
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: m(12),
    paddingHorizontal: m(16),
    backgroundColor: '#F9FAFB',
  },
  currencySymbol: {
    fontSize: m(18),
    fontWeight: '600',
    color: '#111827',
    marginRight: m(8),
  },
  amountInput: {
    flex: 1,
    fontSize: m(16),
    color: '#111827',
    paddingVertical: m(12),
  },
  // inputIcon: {
  //   marginRight: m(12),
  // },
  // textInput: {
  //   flex: 1,
  //   fontSize: m(16),
  //   color: '#111827',
  //   paddingVertical: m(12),
  // },
  helperText: {
    fontSize: m(12),
    color: '#6B7280',
    marginTop: m(8),
    fontStyle: 'italic',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: m(12),
    padding: m(16),
    fontSize: m(16),
    color: '#111827',
    backgroundColor: '#F9FAFB',
    textAlignVertical: 'top',
    minHeight: m(80),
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: m(16),
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: m(12),
    backgroundColor: '#F9FAFB',
    gap: m(8),
  },
  uploadText: {
    fontSize: m(16),
    color: '#6B7280',
    fontWeight: '500',
  },
  proofPreview: {
    marginTop: m(12),
    padding: m(12),
    backgroundColor: '#F0F9FF',
    borderRadius: m(8),
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  proofImageContainer: {
    position: 'relative',
    marginBottom: m(8),
  },
  proofImage: {
    width: '100%',
    height: m(150),
    borderRadius: m(8),
  },
  removeProofButton: {
    position: 'absolute',
    top: m(8),
    right: m(8),
    width: m(32),
    height: m(32),
    borderRadius: m(16),
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  proofName: {
    fontSize: m(14),
    color: '#0369A1',
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    padding: m(16),
    borderRadius: m(12),
    gap: m(8),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: m(18),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: m(12),
    padding: m(16),
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: m(12),
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: m(8),
  },
  infoText: {
    fontSize: m(14),
    color: '#1E40AF',
    lineHeight: m(20),
  },
  pendingCheckCard: {
    backgroundColor: '#FFFBF5',
    borderRadius: m(12),
    padding: m(16),
    marginBottom: m(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(12),
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingCheckText: {
    fontSize: m(14),
    color: '#92400E',
    fontWeight: '500',
  },
  pendingPaymentCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: m(12),
    padding: m(20),
    marginBottom: m(16),
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  pendingPaymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(12),
    marginBottom: m(12),
  },
  pendingPaymentTitle: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#92400E',
  },
  pendingPaymentMessage: {
    fontSize: m(14),
    color: '#92400E',
    lineHeight: m(20),
    marginBottom: m(16),
  },
  pendingPaymentDetails: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(8),
    padding: m(12),
    gap: m(8),
  },
  pendingDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pendingDetailLabel: {
    fontSize: m(14),
    color: '#6B7280',
    fontWeight: '500',
  },
  pendingDetailValue: {
    fontSize: m(14),
    color: '#111827',
    fontWeight: '600',
  },
  disabledSection: {
    opacity: 0.6,
  },
});