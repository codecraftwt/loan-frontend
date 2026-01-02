import axiosInstance from '../Utils/AxiosInstance';

/**
 * Reputation Service
 * Handles all API calls related to borrower reputation scoring
 */
export const reputationAPI = {
  /**
   * Get borrower reputation score by Aadhaar number
   * @param {string} aadhaarNumber - 12-digit Aadhaar number
   * @returns {Promise<Object>} Reputation data including score, level, metrics, and breakdown
   */
  getBorrowerReputation: async (aadhaarNumber) => {
    try {
      if (!aadhaarNumber || aadhaarNumber.length !== 12) {
        throw new Error('Invalid Aadhaar number. Must be 12 digits.');
      }

      const response = await axiosInstance.get(
        `lender/loans/reputation/${aadhaarNumber}`
      );

      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }

      return {
        success: false,
        error: response.data?.message || 'Failed to fetch reputation',
      };
    } catch (error) {
      console.error('Error fetching borrower reputation:', error);
      
      // Handle 404 - borrower not found or no loan history
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'No loan history available for this borrower',
          data: null,
        };
      }

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch reputation',
        data: null,
      };
    }
  },

  /**
   * Get loan details with reputation included
   * @param {string} loanId - Loan ID
   * @returns {Promise<Object>} Loan details with borrowerReputation
   */
  getLoanWithReputation: async (loanId) => {
    try {
      const response = await axiosInstance.get(`lender/loans/${loanId}`);
      
      if (response.data && response.data.data) {
        return {
          success: true,
          data: response.data.data,
        };
      }

      return {
        success: false,
        error: response.data?.message || 'Failed to fetch loan details',
      };
    } catch (error) {
      console.error('Error fetching loan with reputation:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch loan details',
      };
    }
  },
};

export default reputationAPI;

