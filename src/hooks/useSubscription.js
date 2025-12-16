import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getSubscriptionPlans,
  createSubscriptionOrder,
  getActiveSubscription,
  clearCurrentOrder,
  selectPlan,
  verifyPayment,
} from '../Redux/Slices/subscriptionSlice';
import { openRazorpayCheckout } from '../Services/razorpayService';

export const useSubscription = () => {
  const dispatch = useDispatch();
  const {
    plans,
    selectedPlan,
    currentOrder,
    activeSubscription,
    hasActiveSubscription,
    plansLoading,
    purchaseLoading,
    subscriptionLoading,
    plansError,
    purchaseError,
  } = useSelector((state) => state.subscription);

  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  // Fetch subscription plans
  const fetchPlans = async () => {
    try {
      await dispatch(getSubscriptionPlans()).unwrap();
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  // Select a plan
  const handleSelectPlan = (plan) => {
    dispatch(selectPlan(plan));
  };

  // Purchase subscription
const purchaseSubscription = async (planId, userData) => {
  try {
    setProcessing(true);
    setPaymentError(null);

    console.log('Starting purchase for plan:', planId);

    // 1. Create order
    console.log('Creating order...');
    const order = await dispatch(createSubscriptionOrder(planId)).unwrap();
    console.log('Order created:', order.orderId);

    // 2. Open Razorpay checkout
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

    // 3. Verify payment
    console.log('Verifying payment...');
    const verifyData = {
      subscriptionId: planId,
      razorpay_payment_id: paymentResult.data.razorpay_payment_id,
      razorpay_order_id: paymentResult.data.razorpay_order_id,
      razorpay_signature: paymentResult.data.razorpay_signature,
    };

    const verificationResult = await dispatch(verifyPayment(verifyData)).unwrap();
    console.log('Payment verified:', verificationResult);

    // 4. Clear order data
    dispatch(clearCurrentOrder());

    // 5. Refresh subscription status
    await dispatch(getActiveSubscription()).unwrap();

    setProcessing(false);
    return {
      success: true,
      message: 'Subscription activated successfully!',
      subscription: verificationResult?.subscription,
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
    };
  }
};

  // Check subscription status
  const checkSubscriptionStatus = async () => {
    try {
      await dispatch(getActiveSubscription()).unwrap();
      return hasActiveSubscription;
    } catch (error) {
      console.error('Error checking subscription:', error);
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
    currentOrder,
    activeSubscription,
    hasActiveSubscription,
    processing,
    paymentError,
    plansLoading,
    purchaseLoading,
    subscriptionLoading,
    plansError,
    purchaseError,

    // Actions
    fetchPlans,
    handleSelectPlan,
    purchaseSubscription,
    checkSubscriptionStatus,
    getPlanById,
    clearPaymentError: () => setPaymentError(null),
  };
};