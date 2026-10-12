import axiosInstance from '../Utils/AxiosInstance';

/**
 * Lender Flow API Service
 * Aligned 1:1 with backend routes in lenderFlowRoutes.js & planPurchaseRoutes.js
 */
export const lenderFlowService = {
  // ─── 1. Executive Dashboard ───
  getDashboardStats: async () => {
    try {
      const response = await axiosInstance.get('lender/dashboard-stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching lender dashboard stats:', error);
      throw error;
    }
  },

  // ─── 2. Incoming Borrower Loan Requests & Underwriting ───
  getIncomingRequests: async (params = {}) => {
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
      const url = queryStr ? `lender/incoming-requests?${queryStr}` : 'lender/incoming-requests';
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching incoming borrower loan requests:', error);
      throw error;
    }
  },

  getRequestById: async (id) => {
    try {
      const response = await axiosInstance.get(`lender/requests/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching request details for ${id}:`, error);
      throw error;
    }
  },

  // Decision actions
  acceptLoanRequest: async (requestId, termSheetData = {}) => {
    try {
      const response = await axiosInstance.post(
        `lender/requests/${requestId}/accept`,
        termSheetData
      );
      return response.data;
    } catch (error) {
      console.error(`Error accepting loan request ${requestId}:`, error);
      throw error;
    }
  },

  rejectLoanRequest: async (requestId, reason) => {
    try {
      const response = await axiosInstance.post(
        `lender/requests/${requestId}/reject`,
        { reason }
      );
      return response.data;
    } catch (error) {
      console.error(`Error rejecting loan request ${requestId}:`, error);
      throw error;
    }
  },

  // ─── 3. 2-Way OTP Disbursal Verification ───
  initiateDisbursalOtp: async (entityId, isLoan = false) => {
    try {
      const routePrefix = isLoan ? 'lender/loans' : 'lender/requests';
      const response = await axiosInstance.post(`${routePrefix}/${entityId}/initiate-disbursal`);
      return response.data;
    } catch (error) {
      console.error(`Error initiating disbursal OTP for ${entityId}:`, error);
      throw error;
    }
  },

  verifyDisbursalOtp: async (entityId, otp, isLoan = false) => {
    try {
      const routePrefix = isLoan ? 'lender/loans' : 'lender/requests';
      const response = await axiosInstance.post(
        `${routePrefix}/${entityId}/verify-disbursal-otp`,
        { otp: otp.trim() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error verifying disbursal OTP for ${entityId}:`, error);
      throw error;
    }
  },

  resendDisbursalOtp: async (entityId, isLoan = false) => {
    try {
      const routePrefix = isLoan ? 'lender/loans' : 'lender/requests';
      const response = await axiosInstance.post(`${routePrefix}/${entityId}/resend-disbursal-otp`);
      return response.data;
    } catch (error) {
      console.error(`Error resending disbursal OTP for ${entityId}:`, error);
      throw error;
    }
  },

  // ─── 4. Active Loans Portfolio & Repayment Ledger ───
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
      const url = queryStr ? `lender/loans?${queryStr}` : 'lender/loans';
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching lender loans portfolio:', error);
      throw error;
    }
  },

  getLoanById: async (loanId) => {
    try {
      const response = await axiosInstance.get(`lender/loans/${loanId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching loan details for ${loanId}:`, error);
      throw error;
    }
  },

  recordLoanPayment: async (loanId, paymentData) => {
    try {
      const response = await axiosInstance.post(
        `lender/loans/${loanId}/record-payment`,
        paymentData
      );
      return response.data;
    } catch (error) {
      console.error(`Error recording loan payment for ${loanId}:`, error);
      throw error;
    }
  },

  recalculateLoanSchedule: async (loanId) => {
    try {
      const response = await axiosInstance.post(`lender/loans/${loanId}/recalculate`);
      return response.data;
    } catch (error) {
      console.error(`Error recalculating schedule for ${loanId}:`, error);
      throw error;
    }
  },

  // ─── 5. Connected Borrowers Directory ───
  getAvailableBorrowers: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append('search', params.search.trim());
      if (params.businessType) queryParams.append('businessType', params.businessType);
      if (params.riskGrade) queryParams.append('riskGrade', params.riskGrade);
      if (params.minCreditScore) queryParams.append('minCreditScore', params.minCreditScore.toString());
      if (params.maxCreditScore) queryParams.append('maxCreditScore', params.maxCreditScore.toString());

      const queryStr = queryParams.toString();
      const url = queryStr ? `lender/available-borrowers?${queryStr}` : 'lender/available-borrowers';
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching available borrowers:', error);
      throw error;
    }
  },

  getBorrowerDetails: async (borrowerId) => {
    try {
      const response = await axiosInstance.get(`lender/borrowers/${borrowerId}`);
      return response.data;
    } catch (error)
      {
      console.error(`Error fetching borrower details for ${borrowerId}:`, error);
      throw error;
    }
  },

  // ─── 6. Lender Profile & Lending Parameters ───
  getProfile: async () => {
    try {
      const response = await axiosInstance.get('lender/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching lender profile:', error);
      throw error;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await axiosInstance.put('lender/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating lender profile:', error);
      throw error;
    }
  },

  changePassword: async (passwordData) => {
    try {
      const response = await axiosInstance.post('user/change-password', passwordData);
      return response.data;
    } catch (error) {
      console.error('Error changing lender password:', error);
      throw error;
    }
  },

  // ─── 7. In-App Notifications ───
  getNotifications: async () => {
    try {
      const response = await axiosInstance.get('lender/notifications');
      return response.data;
    } catch (error) {
      console.error('Error fetching lender notifications:', error);
      throw error;
    }
  },

  markNotificationRead: async (notificationId) => {
    try {
      const response = await axiosInstance.patch(`lender/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error(`Error marking notification read ${notificationId}:`, error);
      throw error;
    }
  },

  // ─── 8. Subscription Plans & Tier Management ───
  getAvailablePlans: async () => {
    try {
      const response = await axiosInstance.get('admin/plans/active').catch(() => {
        return axiosInstance.get('admin/plans');
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching available plans:', error);
      throw error;
    }
  },

  getActivePlan: async () => {
    try {
      const response = await axiosInstance.get('plans/active');
      return response.data;
    } catch (error) {
      console.error('Error fetching active lender plan:', error);
      throw error;
    }
  },

  getSubscriptionHistory: async () => {
    try {
      const response = await axiosInstance.get('plans/purchase/history');
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription history:', error);
      throw error;
    }
  },

  createPlanOrder: async (planId) => {
    try {
      const response = await axiosInstance.post('plans/purchase/order', { planId });
      return response.data;
    } catch (error) {
      console.error('Error creating plan purchase order:', error);
      throw error;
    }
  },

  verifyPlanPayment: async (paymentPayload) => {
    try {
      const response = await axiosInstance.post('plans/purchase/verify', paymentPayload);
      return response.data;
    } catch (error) {
      console.error('Error verifying plan payment:', error);
      throw error;
    }
  },
};

export default lenderFlowService;
