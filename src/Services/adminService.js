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
      // console.error('Error details:', {
      //   message: error.message,
      //   status: error.response?.status,
      //   statusText: error.response?.statusText,
      //   data: error.response?.data,
      //   url: error.config?.url
      // });
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

export default adminAPI;

