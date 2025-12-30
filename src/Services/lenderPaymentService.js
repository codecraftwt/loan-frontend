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
      const url = `lender/loans/payment/confirm/${loanId}/${paymentId}`;
      const payload = notes ? { notes } : {};

      const response = await axiosInstance.patch(url, payload);
      return response.data;
    } catch (error) {
      console.error('Error confirming payment:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      throw error;
    }
  },

  // Reject a payment
  rejectPayment: async (loanId, paymentId, reason) => {
    try {
      const url = `lender/loans/payment/reject/${loanId}/${paymentId}`;
      const payload = { reason };

      const response = await axiosInstance.patch(url, payload);
      return response.data;
    } catch (error) {
      console.error('Error rejecting payment:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      throw error;
    }
  },
};

export default lenderPaymentAPI;

