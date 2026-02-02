import axiosInstance from '../Utils/AxiosInstance';

// Lender Loan API Services
export const lenderLoanAPI = {
  // Get loan details by ID (for lenders)
  getLoanDetails: async (loanId) => {
    try {
      const response = await axiosInstance.get(`lender/loans/${loanId}`);
      return response.data;
    } catch (error) {
      // Suppress console error for 500 errors - backend endpoint may not be fully implemented
      // Fallback strategies exist in the calling code
      if (error.response?.status !== 500) {
        console.error('Error fetching lender loan details:', error);
      }
      throw error;
    }
  },

  // Alternative: Get loan details from loan list endpoint
  getLoanFromList: async (loanId) => {
    try {
      // Fetch all lender loans and find the specific one
      const response = await axiosInstance.get('loan/get-loan-by-lender', {
        params: { page: 1, limit: 1000 }
      });
      
      if (response.data?.data) {
        const loan = response.data.data.find(l => l._id === loanId);
        return loan ? { data: loan } : null;
      }
      return null;
    } catch (error) {
      throw error;
    }
  },

  // Get all loans for lender
  getLenderLoans: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.search) queryParams.append('search', params.search.trim());

      const queryString = queryParams.toString();
      const url = `loan/get-loan-by-lender${queryString ? `?${queryString}` : ''}`;

      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching lender loans:', error);
      throw error;
    }
  },

  // Get lender loan statistics
  getLenderStatistics: async () => {
    try {
      const response = await axiosInstance.get('lender/loans/statistics');
      return response.data;
    } catch (error) {
      console.error('Error fetching lender statistics:', error);
      throw error;
    }
  },

  // Get lender recent activities
  getLenderRecentActivities: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const queryString = queryParams.toString();
      const url = `lender/loans/recent-activities${queryString ? `?${queryString}` : ''}`;

      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching lender recent activities:', error);
      throw error;
    }
  },

  // Get installment history for a loan (lender view)
  getInstallmentHistory: async (loanId) => {
    try {
      const response = await axiosInstance.get(`lender/loans/installment-history/${loanId}`);
      // API returns: { success: true, message: "...", data: {...} }
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      }
      // Fallback to response.data if structure is different
      return response.data?.data || response.data || null;
    } catch (error) {
      // Handle 404 gracefully - loan may not be an installment loan
      if (error.response?.status === 404) {
        console.warn('Installment history endpoint not found (404), loan may not be an installment loan');
        return null;
      }
      // Handle 400 - not an installment loan
      if (error.response?.status === 400) {
        console.warn('Loan is not an installment loan (400)');
        return null;
      }
      console.error('Error fetching installment history:', error);
      throw error;
    }
  },

  // Get borrower risk assessment (fraud/risk badges)
  getRiskAssessment: async (aadhaarNumber) => {
    try {
      if (!aadhaarNumber || aadhaarNumber.length !== 12) {
        throw new Error('Valid Aadhaar number (12 digits) is required');
      }

      const response = await axiosInstance.get(`lender/loans/risk-assessment/${aadhaarNumber}`);
      // API returns: { success: true, message: "...", data: {...} }
      if (response.data && response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      // Fallback to response.data if structure is different
      return {
        success: response.data?.success || false,
        data: response.data?.data || response.data || null,
      };
    } catch (error) {
      // Handle 404 gracefully - borrower not found or no loan history
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'Borrower not found or no loan history available',
          data: null,
        };
      }
      // Handle 400 - invalid Aadhaar
      if (error.response?.status === 400) {
        return {
          success: false,
          error: error.response?.data?.message || 'Invalid Aadhaar number',
          data: null,
        };
      }
      console.error('Error fetching risk assessment:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch risk assessment',
        data: null,
      };
    }
  },
};

export default lenderLoanAPI;