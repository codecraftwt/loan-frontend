import axiosInstance from '../Utils/AxiosInstance';

// Lender Loan API Services

export const lenderLoanAPI = {
  // Get loan details by ID (for lenders)
  getLoanDetails: async (loanId) => {
    try {
      // console.log('Fetching lender loan details for:', loanId);
      const response = await axiosInstance.get(`lender/loans/${loanId}`);
      // console.log('Lender loan details response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching lender loan details:', error);
      // console.error('Error details:', {
      //   message: error.message,
      //   status: error.response?.status,
      //   statusText: error.response?.statusText,
      //   data: error.response?.data,
      // });
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
};

export default lenderLoanAPI;

