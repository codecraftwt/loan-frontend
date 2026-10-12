import axiosInstance from '../Utils/AxiosInstance';

/**
 * Borrower Flow API Service
 * Aligned 1:1 with backend routes in borrowerFlowRoutes.js
 */
export const borrowerFlowService = {
  // ─── Dashboard ───
  getDashboardStats: async () => {
    try {
      const response = await axiosInstance.get('borrower/dashboard-stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching borrower dashboard stats:', error);
      throw error;
    }
  },

  // ─── Lenders Marketplace ───
  getLenders: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append('search', params.search.trim());
      if (params.onlyFavorites) queryParams.append('onlyFavorites', 'true');
      if (params.loanType) queryParams.append('loanType', params.loanType);
      if (params.minAmount) queryParams.append('minAmount', params.minAmount.toString());
      if (params.maxAmount) queryParams.append('maxAmount', params.maxAmount.toString());
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const queryStr = queryParams.toString();
      const url = queryStr ? `borrower/lenders?${queryStr}` : 'borrower/lenders';
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching available lenders:', error);
      throw error;
    }
  },

  getLenderById: async (id) => {
    try {
      const response = await axiosInstance.get(`borrower/lenders/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching lender with id ${id}:`, error);
      throw error;
    }
  },

  toggleFavoriteLender: async (lenderId) => {
    try {
      const response = await axiosInstance.post(`borrower/favorites/${lenderId}/toggle`);
      return response.data;
    } catch (error) {
      console.error('Error toggling favorite lender:', error);
      throw error;
    }
  },

  getFavoriteLenders: async () => {
    try {
      const response = await axiosInstance.get('borrower/favorites');
      return response.data;
    } catch (error) {
      console.error('Error fetching favorite lenders:', error);
      throw error;
    }
  },

  // ─── Applications Wizard & Tracking ───
  submitApplications: async (payload) => {
    try {
      const response = await axiosInstance.post('borrower/applications', payload);
      return response.data;
    } catch (error) {
      console.error('Error submitting loan applications:', error);
      throw error;
    }
  },

  getMyApplications: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.status && params.status !== 'all') {
        queryParams.append('status', params.status);
      }
      if (params.search) {
        queryParams.append('search', params.search.trim());
      }

      const queryStr = queryParams.toString();
      const url = queryStr ? `borrower/my-applications?${queryStr}` : 'borrower/my-applications';
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching borrower applications:', error);
      throw error;
    }
  },

  signAgreement: async (applicationId, signaturePayload) => {
    try {
      const response = await axiosInstance.post(
        `borrower/applications/${applicationId}/sign-agreement`,
        signaturePayload
      );
      return response.data;
    } catch (error) {
      console.error('Error signing loan agreement:', error);
      throw error;
    }
  },

  getApplicationAgreement: async (applicationId) => {
    try {
      const response = await axiosInstance.get(`borrower/applications/${applicationId}/agreement`);
      return response.data;
    } catch (error) {
      console.error('Error fetching application agreement:', error);
      throw error;
    }
  },

  // ─── Active Loans Portfolio & EMI Schedules ───
  getLoansPortfolio: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.status && params.status !== 'all') {
        queryParams.append('status', params.status);
      }
      if (params.search) {
        queryParams.append('search', params.search.trim());
      }
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const queryStr = queryParams.toString();
      const url = queryStr ? `borrower/loans?${queryStr}` : 'borrower/loans';
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching borrower loans portfolio:', error);
      throw error;
    }
  },

  getLoanById: async (loanId) => {
    try {
      const response = await axiosInstance.get(`borrower/loans/${loanId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching borrower loan with id ${loanId}:`, error);
      throw error;
    }
  },

  // ─── Profile Management ───
  getProfile: async () => {
    try {
      const response = await axiosInstance.get('borrower/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching borrower profile:', error);
      throw error;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await axiosInstance.put('borrower/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating borrower profile:', error);
      throw error;
    }
  },

  // ─── Notifications ───
  getNotifications: async () => {
    try {
      const response = await axiosInstance.get('borrower/notifications');
      return response.data;
    } catch (error) {
      console.error('Error fetching borrower notifications:', error);
      throw error;
    }
  },

  markNotificationRead: async (id) => {
    try {
      const response = await axiosInstance.patch(`borrower/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // ─── Security / Password ───
  changePassword: async (passwordData) => {
    try {
      const response = await axiosInstance.post('user/change-password', passwordData);
      return response.data;
    } catch (error) {
      console.error('Error changing borrower password:', error);
      throw error;
    }
  },
};

export default borrowerFlowService;
