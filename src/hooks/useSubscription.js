import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAdminPlansForLender, // NEW - Fetch admin plans
  selectPlan,
} from '../Redux/Slices/subscriptionSlice';
import {
  getActivePlan,
  createPlanOrder,
  verifyPlanPayment,
  clearCurrentOrder,
} from '../Redux/Slices/planPurchaseSlice';
import { openRazorpayCheckout } from '../Services/razorpayService';

export const useSubscription = () => {
  const dispatch = useDispatch();
  const {
    plans,
    selectedPlan,
    plansLoading,
    plansError,
  } = useSelector((state) => state.subscription);

  const {
    activePlan,
    hasActivePlan,
    purchaseDate,
    expiryDate,
    remainingDays,
    isActive,
    currentOrder,
    orderLoading,
    verifyLoading,
    orderError,
    verifyError,
  } = useSelector((state) => state.planPurchase);

  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  // Fetch admin plans (for lenders)
  const fetchPlans = async () => {
    try {
      await dispatch(getAdminPlansForLender()).unwrap();
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  // Select a plan
  const handleSelectPlan = (plan) => {
    dispatch(selectPlan(plan));
  };

  // Purchase plan
  const purchaseSubscription = async (planId, userData) => {
    try {
      setProcessing(true);
      setPaymentError(null);

      console.log('Starting plan purchase for plan:', planId);

      // Step 1: Create order
      console.log('Creating order...');
      const order = await dispatch(createPlanOrder(planId)).unwrap();
      console.log('Order created:', order.orderId);

      // Step 2: Open Razorpay checkout
      console.log('Opening Razorpay...');
      let paymentResult;
      try {
        paymentResult = await openRazorpayCheckout(order, userData);
        console.log('Payment result:', paymentResult.success);
      } catch (razorpayError) {
        console.log('Razorpay error caught:', razorpayError);
        setProcessing(false);
        
        // Handle user cancellation
        if (razorpayError.type === 'USER_CANCELLED' || razorpayError.code === 2) {
          return {
            success: false,
            message: 'Payment cancelled by user',
            type: 'CANCELLED',
          };
        }
        
        // Handle other Razorpay errors
        return {
          success: false,
          message: razorpayError.message || 'Payment failed. Please try again.',
          type: 'PAYMENT_ERROR',
        };
      }

      if (!paymentResult.success) {
        setProcessing(false);
        return {
          success: false,
          message: 'Payment failed. Please try again.',
          type: 'PAYMENT_ERROR',
        };
      }

      // Step 3: Verify payment
      // Ensure we have all required fields
      if (!paymentResult.data.razorpay_payment_id) {
        throw new Error('Payment ID is missing from Razorpay response');
      }
      if (!paymentResult.data.razorpay_order_id) {
        throw new Error('Order ID is missing from Razorpay response');
      }
      if (!paymentResult.data.razorpay_signature) {
        throw new Error('Signature is missing from Razorpay response');
      }

      const verifyData = {
        razorpay_payment_id: paymentResult.data.razorpay_payment_id.trim(),
        razorpay_order_id: paymentResult.data.razorpay_order_id.trim(),
        razorpay_signature: paymentResult.data.razorpay_signature.trim(),
        planId: planId,
      };

      const verificationResult = await dispatch(verifyPlanPayment(verifyData)).unwrap();

      // Step 4: Clear order data
      dispatch(clearCurrentOrder());

      // Step 5: Refresh active plan
      await dispatch(getActivePlan()).unwrap();

      setProcessing(false);
      return {
        success: true,
        message: 'Plan activated successfully!',
        data: verificationResult,
      };

    } catch (error) {
      console.error('Purchase error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      setProcessing(false);
      setPaymentError(error);

      // Handle different error types
      let errorMessage = 'Payment failed. Please try again.';
      let errorType = 'PAYMENT_ERROR';
      
      if (error.message) {
        errorMessage = error.message;
        
        // Provide more helpful messages for signature errors
        if (error.message.includes('signature') || error.message.includes('Invalid signature')) {
          errorMessage = 'Payment verification failed. The payment was successful, but verification failed. Please contact support with your payment ID: ' + 
            (paymentResult?.data?.razorpay_payment_id || 'N/A');
        }
      }
      
      if (error.type) {
        errorType = error.type;
      } else if (error.code === 2) {
        errorType = 'CANCELLED';
      }
      
      // Don't show alert for user cancelled payments
      if (errorType === 'CANCELLED') {
        return {
          success: false,
          message: 'Payment cancelled by user',
          type: 'CANCELLED',
        };
      }

      return {
        success: false,
        message: errorMessage,
        type: errorType,
        paymentId: paymentResult?.data?.razorpay_payment_id,
        orderId: paymentResult?.data?.razorpay_order_id,
      };
    }
  };

  // Check plan status
  const checkSubscriptionStatus = async () => {
    try {
      await dispatch(getActivePlan()).unwrap();
      return hasActivePlan && isActive && remainingDays > 0;
    } catch (error) {
      console.error('Error checking plan status:', error);
      return false;
    }
  };

  // Get plan by ID
  const getPlanById = (planId) => {
    return plans.find(plan => plan._id === planId);
  };

  return {
    // State
    plans,
    selectedPlan,
    activePlan,
    hasActivePlan: hasActivePlan && isActive && remainingDays > 0,
    purchaseDate,
    expiryDate,
    remainingDays,
    isActive,
    currentOrder,
    processing,
    paymentError,
    plansLoading,
    purchaseLoading: orderLoading || verifyLoading,
    plansError,
    purchaseError: orderError || verifyError,

    // Actions
    fetchPlans,
    handleSelectPlan,
    purchaseSubscription,
    checkSubscriptionStatus,
    getPlanById,
    getActivePlan: () => dispatch(getActivePlan()),
    clearPaymentError: () => setPaymentError(null),
  };
};