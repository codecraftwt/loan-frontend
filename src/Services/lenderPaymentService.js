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

      console.log('Fetching pending payments from:', url);
      const response = await axiosInstance.get(url);
      console.log('Pending payments response:', response.data);
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

      console.log('Confirming payment:', { loanId, paymentId, notes });
      const response = await axiosInstance.patch(url, payload);
      console.log('Payment confirmation response:', response.data);
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

      console.log('Rejecting payment:', { loanId, paymentId, reason });
      const response = await axiosInstance.patch(url, payload);
      console.log('Payment rejection response:', response.data);
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

