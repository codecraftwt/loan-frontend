import RazorpayCheckout from 'react-native-razorpay';
import { Alert } from 'react-native';

// Your Razorpay key (use test key for development)
const RAZORPAY_KEY = 'rzp_test_eXyUgxz2VtmepU'; 

export const initializeRazorpay = () => {
  // Razorpay initialization (if needed)
  return true;
};

/**
 * Open Razorpay checkout for subscription payment
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

    const options = {
      key: RAZORPAY_KEY,
      amount: order.amount.toString(),
      currency: order.currency || 'INR',
      name: 'Loan Management App',
      description: `Subscription: ${order.subscription?.name || 'Plan'}`,
      order_id: order.orderId,
      prefill: {
        email: user?.email || '',
        contact: user?.mobileNo || '',
        name: user?.userName || '',
      },
      theme: { color: '#53a20e' },
      notes: {
        subscriptionId: order.subscription?.id,
        subscriptionName: order.subscription?.name,
      },
    };

    console.log('Razorpay Options:', {
      amount: options.amount,
      orderId: options.order_id,
      currency: options.currency,
      description: options.description,
      key: options.key ? 'Key present' : 'Key missing',
    });

    RazorpayCheckout.open(options)
      .then((data) => {
        console.log('Payment success - Data:', data);
        console.log('Payment ID:', data.razorpay_payment_id);
        console.log('Order ID:', data.razorpay_order_id);
        console.log('Signature:', data.razorpay_signature);
        
        if (!data.razorpay_payment_id || !data.razorpay_order_id) {
          console.error('Missing payment or order ID');
          reject({
            type: 'PAYMENT_FAILED',
            message: 'Payment response incomplete',
          });
          return;
        }
        
        resolve({
          success: true,
          data: {
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_order_id: data.razorpay_order_id,
            razorpay_signature: data.razorpay_signature,
          },
          order: order,
        });
      })
      .catch((error) => {
        console.error('Razorpay error - Full error:', error);
        console.error('Razorpay error code:', error.code);
        console.error('Razorpay error description:', error.description);
        console.error('Razorpay error message:', error.message);
        
        if (error.code === 2) {
          // User cancelled
          console.log('User cancelled payment');
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