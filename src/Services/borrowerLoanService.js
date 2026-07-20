import axiosInstance from '../Utils/AxiosInstance';

export const borrowerLoanAPI = {
  // Get all loans for the current borrower
  getMyLoans: async (borrowerId, params = {}) => {
    try {
      const queryParams = new URLSearchParams();

      // Add borrower ID (required parameter)
      queryParams.append('borrowerId', borrowerId);

      // Add optional query parameters
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.status) queryParams.append('status', params.status);
      if (params.minAmount) queryParams.append('minAmount', params.minAmount.toString());
      if (params.maxAmount) queryParams.append('maxAmount', params.maxAmount.toString());
      if (params.search) queryParams.append('search', params.search.trim());

      const response = await axiosInstance.get(`borrower/loans/my-loans?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching borrower loans:', error);
      throw error;
    }
  },

  // Get pending loan offers for borrower
  getPendingLoanOffers: async (borrowerId) => {
    try {
      if (!borrowerId) {
        throw new Error('Borrower ID is required');
      }
      
      // Try the new endpoint first
      try {
        const response = await axiosInstance.get(`borrower/loans/pending/${borrowerId}`);
        return response.data;
      } catch (err) {
        // If endpoint doesn't exist, filter from my-loans
        if (err.response?.status === 404) {
          const queryParams = new URLSearchParams();
          queryParams.append('borrowerId', borrowerId);
          queryParams.append('limit', '100');
          
          const response = await axiosInstance.get(`borrower/loans/my-loans?${queryParams.toString()}`);
          const allLoans = response.data?.data || response.data?.loans || [];
          const pendingLoans = allLoans.filter(
            loan => loan.loanStatus?.toLowerCase() === 'pending' || 
                    loan.borrowerAcceptanceStatus === 'pending'
          );
          return { data: pendingLoans };
        }
        throw err;
      }
    } catch (error) {
      console.error('Error fetching pending loan offers:', error);
      return { data: [] };
    }
  },

  // Accept a loan using PIN
  acceptLoan: async (loanId, pin) => {
    try {
      if (!loanId) {
        throw new Error('Loan ID is required');
      }
      if (!pin || pin.length !== 4) {
        throw new Error('Valid 4-digit PIN is required');
      }
      
      const response = await axiosInstance.post(
        `borrower/loans/accept/${loanId}`,
        { pin: pin }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error accepting loan:', error);
      
      // Extract detailed error message
      let errorMessage = 'Failed to accept loan';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Throw enhanced error
      const enhancedError = new Error(errorMessage);
      enhancedError.status = error.response?.status;
      enhancedError.originalError = error;
      throw enhancedError;
    }
  },

  // Get loan details by ID
  getLoanDetails: async (loanId) => {
    try {
      const response = await axiosInstance.get(`borrower/loans/${loanId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching loan details:', error);
      throw error;
    }
  },

  // Make a payment for a loan
  makePayment: async (loanId, paymentData) => {
    try {
      const response = await axiosInstance.post(
        `borrower/loans/payment/${loanId}`,
        paymentData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error making payment:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      throw error;
    }
  },

  // Create Razorpay order for loan payment
  createRazorpayOrder: async (loanId, orderData) => {
    try {
      const response = await axiosInstance.post(
        `borrower/loans/razorpay/create-order/${loanId}`,
        orderData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      throw error;
    }
  },

  // Verify Razorpay payment for loan
  verifyRazorpayPayment: async (loanId, paymentData) => {
    try {
      const response = await axiosInstance.post(
        `borrower/loans/razorpay/verify-payment/${loanId}`,
        paymentData
      );
      return response.data;
    } catch (error) {
      console.error('Error verifying Razorpay payment:', error);
      throw error;
    }
  },

  // Get payment history for a loan
  getPaymentHistory: async (loanId, borrowerId) => {
    try {
      if (!loanId) throw new Error('Loan ID is required');
      if (!borrowerId) throw new Error('Borrower ID is required');
      
      const response = await axiosInstance.get(
        `borrower/loans/payment-history/${loanId}?borrowerId=${borrowerId}`
      );
      
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  },

  // Search borrower loans (if API supports search)
  searchLoans: async (searchParams) => {
    try {
      const queryString = new URLSearchParams(searchParams).toString();
      const response = await axiosInstance.get(`/api/borrower/loans/search?${queryString}`);
      return response.data;
    } catch (error) {
      console.error('Error searching loans:', error);
      throw error;
    }
  },

  // Get borrower dashboard stats
  getDashboardStats: async () => {
    try {
      const response = await axiosInstance.get('/api/borrower/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // Update payment proof (if needed)
  updatePaymentProof: async (paymentId, proofData) => {
    try {
      const response = await axiosInstance.put(
        `/borrower/payments/${paymentId}/proof`,
        proofData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating payment proof:', error);
      throw error;
    }
  },

  // Get borrower loan statistics
  getBorrowerStatistics: async () => {
    try {
      const response = await axiosInstance.get('borrower/loans/statistics');
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      }
      // Fallback to response.data if structure is different
      return response.data?.data || response.data || null;
    } catch (error) {
      // Handle 404 gracefully - endpoint may not exist
      if (error.response?.status === 404) {
        console.warn('Borrower statistics endpoint not found (404), returning default values');
        return {
          totalLoanAmount: 0,
          totalPaidAmount: 0,
          totalOverdueAmount: 0,
          totalPendingAmount: 0,
          totalRemainingAmount: 0,
          percentages: {
            totalLoanAmountPercentage: 0,
            paidPercentage: 0,
            overduePercentage: 0,
            pendingPercentage: 0,
          },
          counts: {
            totalLoans: 0,
            paidLoans: 0,
            overdueLoans: 0,
            pendingLoans: 0,
            activeLoans: 0,
          },
        };
      }
      console.error('Error fetching borrower statistics:', error);
      throw error;
    }
  },

  // Get borrower recent activities
  getBorrowerRecentActivities: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.append('limit', params.limit.toString());
      
      const response = await axiosInstance.get(
        `borrower/loans/recent-activities${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { data: [], count: 0 };
      }
      console.error('Error fetching borrower recent activities:', error);
      throw error;
    }
  },

  // Get loans for a specific borrower (used by lender borrower-history screen)
  getBorrowerLoansById: async (borrowerId, params = {}) => {
    try {
      if (!borrowerId) {
        throw new Error('Borrower ID is required');
      }

      const queryParams = new URLSearchParams();
      queryParams.append('borrowerId', borrowerId);

      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.status) queryParams.append('status', params.status);
      if (params.minAmount) queryParams.append('minAmount', params.minAmount.toString());
      if (params.maxAmount) queryParams.append('maxAmount', params.maxAmount.toString());
      if (params.search) queryParams.append('search', params.search.trim());

      const response = await axiosInstance.get(
        `borrower/loans/my-loans?${queryParams.toString()}`
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching borrower loans by ID:', error);
      throw error;
    }
  },
};

export default borrowerLoanAPI;
