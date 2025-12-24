import axiosInstance from '../Utils/AxiosInstance';
import axios from 'axios';
import { baseurl } from '../Utils/API';

// Borrower Loan API Services

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

      console.log('Fetching borrower loans (authenticated) from:', url); // Debug log

      const response = await axiosInstance.get(url);
      console.log('Borrower loans response:', response.data); // Debug log
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
        `/borrower/loans/payment/${loanId}`,
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
      throw error;
    }
  },

  // Get payment history for a loan
  getPaymentHistory: async (loanId) => {
    try {
      const response = await axiosInstance.get(`borrower/loans/payment-history/${loanId}`);
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

      console.log('Fetching borrower loans from:', url); // Debug log

      // Use plain axios without authentication for this endpoint
      const response = await axios.get(url, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('Borrower loans response:', response.data); // Debug log
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
};

export default borrowerLoanAPI;

