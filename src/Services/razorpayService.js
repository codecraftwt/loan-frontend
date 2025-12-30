import RazorpayCheckout from 'react-native-razorpay';
import { Alert } from 'react-native';

// Your Razorpay key (use test key for development)
const RAZORPAY_KEY = 'rzp_test_eXyUgxz2VtmepU'; 

export const initializeRazorpay = () => {
  // Razorpay initialization (if needed)
  return true;
};

/**
 * Open Razorpay checkout for plan purchase
 * @param {Object} order - Order data from backend
 * @param {Object} user - User data
 * @returns {Promise} Promise with payment result
 */
export const openRazorpayCheckout = (order, user) => {
  return new Promise((resolve, reject) => {
    if (!order || !order.orderId) {
      console.error('Invalid order data:', order);
      reject(new Error('Invalid order data'));
      return;
    }

    const planName = order.plan?.planName || order.plan?.name || 'Plan';

    const options = {
      key: RAZORPAY_KEY,
      amount: order.amount.toString(),
      currency: order.currency || 'INR',
      name: 'Loan Management App',
      description: `Plan Purchase: ${planName}`,
      order_id: order.orderId,
      prefill: {
        email: user?.email || '',
        contact: user?.mobileNo || '',
        name: user?.userName || '',
      },
      theme: { color: '#ff6700' },
      notes: {
        planId: order.plan?._id || order.plan?.id,
        planName: planName,
      },
    };

    RazorpayCheckout.open(options)
      .then((data) => {
        
        if (!data.razorpay_payment_id || !data.razorpay_order_id) {
          console.error('Missing payment or order ID');
          console.error('Received data:', data);
          reject({
            type: 'PAYMENT_FAILED',
            message: 'Payment response incomplete',
          });
          return;
        }
        
        if (!data.razorpay_signature) {
          console.error('Missing signature in payment response');
          console.error('Received data:', data);
          reject({
            type: 'PAYMENT_FAILED',
            message: 'Payment signature missing',
          });
          return;
        }
        
        // Ensure we're using the correct order_id from the response
        const paymentResponse = {
          success: true,
          data: {
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_order_id: data.razorpay_order_id || data.razorpay_orderId || order.orderId,
            razorpay_signature: data.razorpay_signature,
          },
          order: order,
        };
        
        resolve(paymentResponse);
      })
      .catch((error) => {
        console.error('Razorpay error - Full error:', error);
        
        if (error.code === 2) {
          // User cancelled
          reject({
            type: 'USER_CANCELLED',
            message: 'Payment cancelled by user',
            code: error.code,
          });
        } else if (error.code === 0 || error.code === 3) {
          // Network error or payment failed
          reject({
            type: 'PAYMENT_FAILED',
            message: error.description || error.message || 'Payment failed. Please try again.',
            code: error.code,
          });
        } else {
          // Other errors
          reject({
            type: 'PAYMENT_FAILED',
            message: error.description || error.message || 'Payment failed. Please try again.',
            error: error,
            code: error.code,
          });
        }
      });
  });
};

/**
 * Handle payment verification
 */
export const handlePaymentVerification = async (paymentResult, subscriptionId, dispatch) => {
  try {
    if (!paymentResult.success) {
      throw new Error('Payment not successful');
    }

    const paymentData = {
      subscriptionId: subscriptionId,
      razorpay_payment_id: paymentResult.data.razorpay_payment_id,
      razorpay_order_id: paymentResult.data.razorpay_order_id,
      razorpay_signature: paymentResult.data.razorpay_signature,
    };

    // Dispatch verification to backend
    const result = await dispatch(verifyPayment(paymentData)).unwrap();
    
    return {
      success: true,
      message: 'Payment verified and subscription activated!',
      data: result,
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    throw error;
  }
};

/**
 * Check if user can proceed with payment
 */
export const canProceedToPayment = (hasActiveSubscription) => {
  if (hasActiveSubscription) {
    Alert.alert(
      'Active Subscription',
      'You already have an active subscription. You can purchase a new plan after your current subscription ends.',
      [{ text: 'OK' }]
    );
    return false;
  }
  return true;
};