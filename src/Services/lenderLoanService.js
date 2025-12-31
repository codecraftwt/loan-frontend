import axiosInstance from '../Utils/AxiosInstance';

// Lender Loan API Services

export const lenderLoanAPI = {
  // Get loan details by ID (for lenders)
  getLoanDetails: async (loanId) => {
    try {
      const response = await axiosInstance.get(`lender/loans/${loanId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching lender loan details:', error);
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
      // console.error('Error fetching loan from list:', error);
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
};

export default lenderLoanAPI;

