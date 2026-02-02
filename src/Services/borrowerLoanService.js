import axiosInstance from '../Utils/AxiosInstance';
import axios from 'axios';
import { baseurl } from '../Utils/API';

export const borrowerLoanAPI = {
  // Get all loans for the current borrower (requires authentication)
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

      const queryString = queryParams.toString();
      const url = `borrower/loans/my-loans?${queryString}`;

      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching borrower loans:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      throw error;
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
      // Validate required parameters
      if (!loanId) {
        throw new Error('Loan ID is required');
      }
      if (!borrowerId) {
        throw new Error('Borrower ID is required');
      }
      
      // Build query string with borrowerId
      const queryParams = new URLSearchParams();
      queryParams.append('borrowerId', borrowerId);
      
      const queryString = queryParams.toString();
      const url = `borrower/loans/payment-history/${loanId}?${queryString}`;
            
      const response = await axiosInstance.get(url);
      
      // API returns: { message: "...", data: {...} }
      // Return the data object directly for easier access
      if (response.data && response.data.data) {
        return response.data.data;
      }
      
      // Fallback to response.data if structure is different
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

      const queryString = queryParams.toString();
      const url = `borrower/loans/recent-activities${queryString ? `?${queryString}` : ''}`;

      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      // Handle 404 gracefully - endpoint may not exist
      if (error.response?.status === 404) {
        console.warn('Borrower recent activities endpoint not found (404), returning empty array');
        return {
          data: [],
          count: 0,
        };
      }
      console.error('Error fetching borrower recent activities:', error);
      throw error;
    }
  },

  // Get loans for a specific borrower (for lenders) - No authentication required
  getBorrowerLoansById: async (borrowerId, params = {}) => {
    try {
      const queryParams = new URLSearchParams();

      // Add borrower ID
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

      const queryString = queryParams.toString();
      const url = `${baseurl}borrower/loans/my-loans${queryString ? `?${queryString}` : ''}`;

      // Use plain axios without authentication for this endpoint
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching borrower loans:', error);
      throw error;
    }
  },
};

export default borrowerLoanAPI;