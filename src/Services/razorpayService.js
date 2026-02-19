import RazorpayCheckout from 'react-native-razorpay';
import { Alert } from 'react-native';

// Your Razorpay key (use test key for development)
const RAZORPAY_KEY = 'rzp_test_eXyUgxz2VtmepU'; 

/**
 * Normalize the various error shapes Razorpay SDK can return into a
 * consistent { isUserCancelled, isNetworkError, message } object.
 *
 * Known shapes from Razorpay Android SDK:
 *  A) { code: 2 }                              – explicit user cancel
 *  B) { code: 0, description: '{"error":{…}}', error: {…} }
 *  C) { error: { code, source, reason, … } }   – nested object
 *  D) JSON string                               – entire error as string
 */
const parseRazorpayError = (error) => {
  let innerError = null;

  // 1. Try error.error (nested object from SDK)
  if (error?.error && typeof error.error === 'object') {
    innerError = error.error;
    // Could be double-nested: error.error.error
    if (innerError?.error && typeof innerError.error === 'object') {
      innerError = innerError.error;
    }
  }

  // 2. Razorpay Android SDK packs a JSON string inside `description` (shape B)
  if (!innerError && typeof error?.description === 'string' && error.description.startsWith('{')) {
    try {
      const parsed = JSON.parse(error.description);
      innerError = parsed?.error || parsed;
    } catch (_) { /* ignore */ }
  }

  // 3. Entire error is a JSON string (shape D)
  if (!innerError && typeof error === 'string' && error.startsWith('{')) {
    try {
      const parsed = JSON.parse(error);
      innerError = parsed?.error || parsed;
    } catch (_) { /* ignore */ }
  }

  const errorObj = innerError || error;
  const topLevelCode = error?.code;
  const source = errorObj?.source;
  const reason = errorObj?.reason;
  const description = errorObj?.description;

  // User cancellation takes priority over everything else
  const isUserCancelled =
    topLevelCode === 2 ||
    (source === 'customer' && reason === 'payment_error') ||
    (source === 'customer' && String(description).toLowerCase().includes('cancel'));

  // Network error only when NOT a user cancellation
  const isNetworkError = !isUserCancelled && (topLevelCode === 0 || topLevelCode === 3);

  const hasUsefulDescription =
    description &&
    description !== 'undefined' &&
    !description.startsWith('{') &&
    description.length < 200;

  const message = hasUsefulDescription
    ? description
    : 'Payment failed. Please try again.';

  return { isUserCancelled, isNetworkError, message };
};

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

        const parsed = parseRazorpayError(error);

        if (parsed.isUserCancelled) {
          reject({
            type: 'USER_CANCELLED',
            message: 'Payment cancelled by user',
            code: 2,
          });
        } else if (parsed.isNetworkError) {
          reject({
            type: 'PAYMENT_FAILED',
            message: 'Network error. Please check your connection and try again.',
            code: error.code,
          });
        } else {
          reject({
            type: 'PAYMENT_FAILED',
            message: parsed.message,
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

/**
 * Open Razorpay checkout for loan repayment
 * @param {Object} order - Order data from backend
 * @param {Object} user - User data
 * @param {Object} loan - Loan data
 * @returns {Promise} Promise with payment result
 */
export const openRazorpayCheckoutForLoan = (order, user, loan) => {
  return new Promise((resolve, reject) => {
    if (!order || !order.data || !order.data.orderId) {
      console.error('Invalid order data:', order);
      reject(new Error('Invalid order data'));
      return;
    }

    const orderData = order.data;
    const loanName = loan?.name || loan?.loanName || 'Loan';

    const options = {
      key: orderData.razorpayKeyId || RAZORPAY_KEY,
      amount: orderData.amount.toString(), // Amount in paise
      currency: orderData.currency || 'INR',
      name: 'Loan Management App',
      description: `Loan Repayment: ${loanName}`,
      order_id: orderData.orderId,
      prefill: {
        email: user?.email || '',
        contact: user?.mobileNo || user?.mobile || '',
        name: user?.userName || user?.name || '',
      },
      theme: { color: '#3399cc' },
      notes: {
        loanId: loan?._id || loan?.id,
        loanName: loanName,
        paymentType: orderData.paymentType || 'one-time',
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
            razorpay_order_id: data.razorpay_order_id || data.razorpay_orderId || orderData.orderId,
            razorpay_signature: data.razorpay_signature,
          },
          order: orderData,
        };
        
        resolve(paymentResponse);
      })
      .catch((error) => {
        console.error('Razorpay error - Full error:', error);

        const parsed = parseRazorpayError(error);

        if (parsed.isUserCancelled) {
          reject({
            type: 'USER_CANCELLED',
            message: 'Payment cancelled by user',
            code: 2,
          });
        } else if (parsed.isNetworkError) {
          reject({
            type: 'PAYMENT_FAILED',
            message: 'Network error. Please check your connection and try again.',
            code: error.code,
          });
        } else {
          reject({
            type: 'PAYMENT_FAILED',
            message: parsed.message,
            error: error,
            code: error.code,
          });
        }
      });
  });
};

/**
 * Open Razorpay checkout for lender giving loan to borrower (online payment mode)
 * @param {Object} razorpayOrder - Razorpay order data from loan creation response
 * @param {Object} lender - Lender user data
 * @param {Object} loan - Loan data
 * @returns {Promise} Promise with payment result
 */
export const openRazorpayCheckoutForLoanCreation = (razorpayOrder, lender, loan) => {
  return new Promise((resolve, reject) => {
    if (!razorpayOrder || !razorpayOrder.orderId) {
      console.error('Invalid Razorpay order data:', razorpayOrder);
      reject(new Error('Invalid Razorpay order data'));
      return;
    }

    const borrowerName = loan?.name || 'Borrower';
    const loanAmount = loan?.amount || (razorpayOrder.amount / 100);

    const options = {
      key: razorpayOrder.keyId || RAZORPAY_KEY,
      amount: razorpayOrder.amount.toString(), // Amount already in paise from backend
      currency: razorpayOrder.currency || 'INR',
      name: 'Loan Management App',
      description: `Loan to ${borrowerName} - ₹${loanAmount.toLocaleString('en-IN')}`,
      order_id: razorpayOrder.orderId,
      prefill: {
        email: lender?.email || '',
        contact: lender?.mobileNo || lender?.mobile || '',
        name: lender?.userName || lender?.name || '',
      },
      theme: { color: '#ff7900' },
      notes: {
        loanId: loan?._id || loan?.id,
        borrowerName: borrowerName,
        paymentType: 'loan-disbursement',
      },
    };

    RazorpayCheckout.open(options)
      .then((data) => {
        if (!data.razorpay_payment_id || !data.razorpay_order_id) {
          console.error('Missing payment or order ID in loan creation checkout');
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
        
        const paymentResponse = {
          success: true,
          data: {
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_order_id: data.razorpay_order_id || razorpayOrder.orderId,
            razorpay_signature: data.razorpay_signature,
          },
          order: razorpayOrder,
        };
        
        resolve(paymentResponse);
      })
      .catch((error) => {
        console.error('Razorpay loan creation error:', error);

        const parsed = parseRazorpayError(error);

        if (parsed.isUserCancelled) {
          reject({
            type: 'USER_CANCELLED',
            message: 'Payment cancelled by user',
            code: 2,
          });
        } else if (parsed.isNetworkError) {
          reject({
            type: 'PAYMENT_FAILED',
            message: 'Network error. Please check your connection and try again.',
            code: error.code,
          });
        } else {
          reject({
            type: 'PAYMENT_FAILED',
            message: parsed.message,
            error: error,
            code: error.code,
          });
        }
      });
  });
};