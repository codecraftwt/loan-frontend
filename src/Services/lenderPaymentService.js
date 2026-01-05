import axiosInstance from '../Utils/AxiosInstance';

// Lender Payment API Services

export const lenderPaymentAPI = {
  // Get all pending payments for the lender
  getPendingPayments: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();

      // Add optional query parameters
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const queryString = queryParams.toString();
      const url = `lender/loans/payments/pending${queryString ? `?${queryString}` : ''}`;

      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      // If 500 error, return empty data instead of throwing
      // This allows the app to continue and check loan details for pendingConfirmations
      if (error.response?.status === 500) {
        console.warn('Pending payments endpoint returned 500 (backend error), gracefully handling:', {
          message: error.response?.data?.message || error.message,
          url: error.config?.url,
        });
        return {
          data: [],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: 10,
          },
        };
      }
      
      // Log other errors normally
      console.error('Error fetching pending payments:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
      });
      
      throw error;
    }
  },

  // Confirm a payment
  confirmPayment: async (loanId, paymentId, notes = '') => {
    try {
      // Validate required parameters
      if (!loanId || !loanId.toString().trim()) {
        throw new Error('Loan ID is required');
      }
      if (!paymentId || !paymentId.toString().trim()) {
        throw new Error('Payment ID is required');
      }
      
      // Ensure IDs are strings (MongoDB ObjectIds are strings)
      const loanIdStr = loanId.toString().trim();
      const paymentIdStr = paymentId.toString().trim();
      
      const url = `lender/loans/payment/confirm/${loanIdStr}/${paymentIdStr}`;
      const payload = notes ? { notes: notes.trim() } : {};

      const response = await axiosInstance.patch(url, payload);
      return response.data;
    } catch (error) {
      console.error('Error confirming payment:', error);
      // console.error('Error details:', {
      //   message: error.message,
      //   status: error.response?.status,
      //   statusText: error.response?.statusText,
      //   data: error.response?.data,
      //   url: error.config?.url,
      //   loanId,
      //   paymentId,
      // });
      
      // Extract error message from response
      const errorMessage = error.response?.data?.message || error.message || 'Failed to confirm payment';
      throw new Error(errorMessage);
    }
  },

  // Reject a payment
  rejectPayment: async (loanId, paymentId, reason) => {
    try {
      // Validate required parameters
      if (!loanId || !loanId.toString().trim()) {
        throw new Error('Loan ID is required');
      }
      if (!paymentId || !paymentId.toString().trim()) {
        throw new Error('Payment ID is required');
      }
      if (!reason || !reason.trim()) {
        throw new Error('Rejection reason is required');
      }
      
      // Ensure IDs are strings (MongoDB ObjectIds are strings)
      const loanIdStr = loanId.toString().trim();
      const paymentIdStr = paymentId.toString().trim();
      const reasonStr = reason.trim();
      
      const url = `lender/loans/payment/reject/${loanIdStr}/${paymentIdStr}`;
      const payload = { reason: reasonStr };

      const response = await axiosInstance.patch(url, payload);
      return response.data;
    } catch (error) {
      console.error('Error rejecting payment:', error);
    
      // Extract error message from response
      const errorMessage = error.response?.data?.message || error.message || 'Failed to reject payment';
      throw new Error(errorMessage);
    }
  },
};

export default lenderPaymentAPI;

