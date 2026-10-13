import axiosInstance from '../Utils/AxiosInstance';

// Admin API Services
export const adminAPI = {
  // Get lenders with plan purchase details
  getLendersWithPlans: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();

      // Add optional query parameters
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search.trim());
      if (params.planStatus) queryParams.append('planStatus', params.planStatus);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const queryString = queryParams.toString();
      const url = `admin/lenders/plans${queryString ? `?${queryString}` : ''}`;

      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching lenders with plans:', error);
      throw error;
    }
  },

  // Get revenue statistics
  getRevenueStatistics: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();

      // Add optional query parameters
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.groupBy) queryParams.append('groupBy', params.groupBy);

      const queryString = queryParams.toString();
      const url = `admin/revenue${queryString ? `?${queryString}` : ''}`;

      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue statistics:', error);
      throw error;
    }
  },

  // Get admin recent activities
  getAdminRecentActivities: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const queryString = queryParams.toString();
      const url = `admin/recent-activities${queryString ? `?${queryString}` : ''}`;

      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching admin recent activities:', error);
      throw error;
    }
  },

  // Get borrowers directory with filters
  getAdminBorrowers: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', (params.limit || 100).toString());
      if (params.search && params.search.trim()) queryParams.append('search', params.search.trim());
      if (params.kycStatus && params.kycStatus !== 'all') queryParams.append('kycStatus', params.kycStatus);
      if (params.loanStatus && params.loanStatus !== 'all') queryParams.append('loanStatus', params.loanStatus);

      const queryString = queryParams.toString();
      const url = `admin/borrowers${queryString ? `?${queryString}` : ''}`;

      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching admin borrowers:', error);
      throw error;
    }
  },

  // Get borrower detailed profile & KYC
  getAdminBorrowerDetails: async (borrowerId) => {
    try {
      const url = `admin/borrowers/${borrowerId}/details?includeReputation=true`;
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching admin borrower details:', error);
      throw error;
    }
  },

  // Get lender subscription history
  getLenderSubscriptionHistory: async (lenderId) => {
    try {
      const url = `admin/lenders/${lenderId}/subscriptions`;
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching lender subscription history:', error);
      throw error;
    }
  },

  // Get lender details with plans
  getLenderDetails: async (lenderId) => {
    try {
      const url = `admin/lenders/plans?lenderId=${lenderId}&includeDetails=true`;
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching lender details:', error);
      throw error;
    }
  },
};

export default adminAPI;