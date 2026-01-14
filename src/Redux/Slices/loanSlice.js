import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import instance from '../../Utils/AxiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lenderLoanAPI } from '../../Services/lenderLoanService';

// Get borrower risk assessment (new API)
export const getRiskAssessment = createAsyncThunk(
  'loans/getRiskAssessment',
  async (aadhaarNumber, { rejectWithValue }) => {
    try {
      if (!aadhaarNumber || aadhaarNumber.length !== 12) {
        return rejectWithValue('Valid Aadhaar number (12 digits) is required');
      }

      const response = await lenderLoanAPI.getRiskAssessment(aadhaarNumber);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return rejectWithValue(response.error || 'Failed to fetch risk assessment');
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch risk assessment');
    }
  }
);

const initialState = {
  loans: [],
  totalAmount: 0,
  lenderLoans: [],
  myLoans: [],
  lenderTotalAmount: 0,
  loanStats: [],
  recentActivities: [],
  lenderStatistics: null,
  loading: true,
  error: null,
  updateError: null,
  aadharError: null,
  paymentVerifying: false,
  paymentError: null,
  pagination: {
    page: 1,
    limit: 10,
    totalPages: 1,
    totalLoans: 0,
  },
};

export const checkFraudStatus = createAsyncThunk(
  'loans/checkFraudStatus',
  async (aadhaarNumber, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return rejectWithValue('User is not authenticated');
      }

      if (!aadhaarNumber || aadhaarNumber.length !== 12) {
        return rejectWithValue('Valid Aadhaar number (12 digits) is required');
      }

      const response = await instance.get(`lender/loans/check-fraud/${aadhaarNumber}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      // Only log actual errors, not expected 404s
      if (error.response?.status !== 404) {
        console.error('Check fraud error:', error.response?.data || error.message);
      }
      
      if (error.response?.status === 400) {
        return rejectWithValue(error.response.data.message || 'Invalid Aadhaar number');
      }

      if (error.response?.status === 404) {
        // Borrower not found or endpoint not available - not necessarily an error
        return rejectWithValue('Borrower not found');
      }

      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to check fraud status');
    }
  }
);

export const getLoanByAadhar = createAsyncThunk(
  'loans/getLoanByAadhar',
  async ({ aadhaarNumber, filters = {} }, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return rejectWithValue('User is not authenticated');
      }

      const params = {
        aadhaarNumber,
        page: filters.page || 1,
        limit: filters.limit || 10,
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.status && { status: filters.status }),
        ...(filters.minAmount && { minAmount: filters.minAmount }),
        ...(filters.maxAmount && { maxAmount: filters.maxAmount }),
        // Add search parameter for backend filtering
        ...(filters.search && { search: filters.search }),
      };

      const response = await instance.get('loan/get-loan-by-aadhar', { params });

      if (response.status === 404) {
        return {
          loans: [],
          totalAmount: 0,
          pagination: initialState.pagination,
        };
      }

      return {
        loans: response.data.data,
        totalAmount: response.data.totalAmount || 0,
        pagination: response.data.pagination || initialState.pagination,
      };
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue(error.message || 'Unknown error');
    }
  },
);

export const getLoanByLender = createAsyncThunk(
  'loans/getLoanByLender',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return rejectWithValue('User is not authenticated');
      }

      const params = {
        page: filters.page || 1,
        limit: filters.limit || 10,
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.status && { status: filters.status }),
        ...(filters.minAmount && { minAmount: filters.minAmount }),
        ...(filters.maxAmount && { maxAmount: filters.maxAmount }),
        // Add search parameter for backend filtering
        ...(filters.search && { search: filters.search }),
      };

      const response = await instance.get('loan/get-loan-by-lender', {
        params,
      });

      if (response.status === 404) {
        return {
          lenderLoans: [],
          lenderTotalAmount: 0,
          pagination: initialState.pagination,
        };
      }

      return {
        lenderLoans: response.data.data,
        lenderTotalAmount: response.data.totalAmount || 0,
        pagination: response.data.pagination || initialState.pagination,
      };
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue(error.message || 'Unknown error');
    }
  },
);

export const createLoan = createAsyncThunk(
  'loans/createLoan',
  async (loanData, { rejectWithValue, dispatch }) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return rejectWithValue('User is not authenticated');
      }

      // Create FormData for multipart/form-data (supports file upload)
      const formData = new FormData();
      
      // Add required fields
      formData.append('name', loanData.name);
      formData.append('aadharCardNo', loanData.aadharCardNo || loanData.aadhaarNumber);
      formData.append('mobileNumber', loanData.mobileNumber);
      formData.append('address', loanData.address);
      formData.append('amount', loanData.amount.toString());
      formData.append('purpose', loanData.purpose);
      formData.append('loanGivenDate', loanData.loanGivenDate || loanData.loanStartDate);
      formData.append('loanEndDate', loanData.loanEndDate);
      formData.append('loanMode', loanData.loanMode || 'cash');

      // Add proof file if provided
      if (loanData.proof && loanData.proof.uri) {
        formData.append('proof', {
          uri: loanData.proof.uri,
          type: loanData.proof.type || 'image/jpeg',
          name: loanData.proof.fileName || 'proof.jpg',
        });
      }

      const response = await instance.post('lender/loans/create', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Create loan error:', error.response?.data || error.message);

      // Handle plan-related errors
      if (error.response?.status === 403) {
        return rejectWithValue({
          type: 'SUBSCRIPTION_REQUIRED',
          message: error.response.data.message || 'You need an active plan to create loans.',
          errorCode: error.response.data.errorCode || 'PLAN_REQUIRED',
        });
      }
      
      // Handle plan required errors (400 with PLAN_REQUIRED error code)
      if (error.response?.status === 400 && 
          (error.response.data.errorCode === 'PLAN_REQUIRED' || 
           error.response.data.message?.includes('plan'))) {
        return rejectWithValue({
          type: 'SUBSCRIPTION_REQUIRED',
          message: error.response.data.message || 'You need an active plan to create loans.',
          errorCode: 'PLAN_REQUIRED',
        });
      }

      if (error.response?.status === 400 && error.response.data.errorCode === 'LOAN_LIMIT_REACHED') {
        return rejectWithValue({
          type: 'LOAN_LIMIT_REACHED',
          message: error.response.data.message || 'Loan limit reached for your plan.',
          data: error.response.data.data,
        });
      }

      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to create loan'
      );
    }
  },
);

// Verify OTP for loan
export const verifyLoanOTP = createAsyncThunk(
  'loans/verifyLoanOTP',
  async ({ loanId, otp }, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return rejectWithValue('User is not authenticated');
      }

      if (!loanId || !otp) {
        return rejectWithValue('loanId and otp are required');
      }

      const response = await instance.post(
        'lender/loans/verify-otp',
        { loanId, otp },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Verify OTP error:', error.response?.data || error.message);
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to verify OTP'
      );
    }
  },
);

// Verify Razorpay payment for online loan disbursement
export const verifyLoanPayment = createAsyncThunk(
  'loans/verifyLoanPayment',
  async ({ loanId, razorpay_payment_id, razorpay_order_id, razorpay_signature }, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return rejectWithValue('User is not authenticated');
      }

      if (!loanId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return rejectWithValue('Missing required payment verification fields');
      }

      const response = await instance.post(
        'lender/loans/verify-payment',
        { 
          loanId, 
          razorpay_payment_id, 
          razorpay_order_id, 
          razorpay_signature 
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Verify loan payment error:', error.response?.data || error.message);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        return rejectWithValue(
          error.response.data?.message || 'Invalid payment verification request'
        );
      }
      
      if (error.response?.status === 403) {
        return rejectWithValue(
          error.response.data?.message || 'You can only verify payments for loans that you created'
        );
      }
      
      if (error.response?.status === 404) {
        return rejectWithValue('Loan not found');
      }

      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to verify payment'
      );
    }
  },
);

export const updateLoanStatus = createAsyncThunk(
  'loans/updateLoanStatus',
  async ({ loanId, status }, { rejectWithValue }) => {
    try {
      const response = await instance.patch(
        `loan/update-loan-status/${loanId}`,
        { status },
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.error || error.message || error || 'Unknown error');
    }
  },
);

export const updateLoanAcceptanceStatus = createAsyncThunk(
  'loans/updateLoanAcceptanceStatus',
  async ({ loanId, status }, { rejectWithValue }) => {
    try {
      const response = await instance.patch(
        `loan/update-loan-acceptance-status/${loanId}`,
        { status },
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data || 'Unknown error');
    }
  },
);

export const updateLoan = createAsyncThunk(
  'loans/updateLoan',
  async (loanData, { rejectWithValue }) => {
    try {
      const response = await instance.patch(`loan/${loanData.id}`, loanData);
      return response.data.data;
    } catch (error) {
      console.error('Error updating loan:', error);
      return rejectWithValue(
        error.response ? error.response.data : error.message,
      );
    }
  },
);

export const getLoanStats = createAsyncThunk(
  'loans/getLoanStats',
  async (aadhaarNumber, { rejectWithValue }) => {
    try {
      const response = await instance.get('loan/loan-stats', {
        params: { aadhaarNumber },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || error.message || 'Unknown error',
      );
    }
  },
);

export const getRecentActivities = createAsyncThunk(
  'loans/getRecentActivities',
  async (limit = 5, { rejectWithValue }) => {
    try {
      const response = await instance.get('loan/recent-activities', {
        params: { limit },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || error.message || 'Unknown error',
      );
    }
  },
);

export const getLenderStatistics = createAsyncThunk(
  'loans/getLenderStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await lenderLoanAPI.getLenderStatistics();
      return response;
    } catch (error) {
      console.error('Error fetching lender statistics:', error);
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch statistics',
      );
    }
  },
);

const loanSlice = createSlice({
  name: 'loans',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      // Handling getLoanByAadhar
      .addCase(getLoanByAadhar.pending, state => {
        state.loading = true;
        state.error = null;
        state.totalAmount = 0;
        state.aadharError = null;
      })
      .addCase(getLoanByAadhar.fulfilled, (state, action) => {
        state.loading = false;
        state.loans = action.payload.loans;
        state.totalAmount = action.payload.totalAmount;
        state.pagination = action.payload.pagination;
        state.aadharError = null;
      })
      .addCase(getLoanByAadhar.rejected, (state, action) => {
        state.loading = false;
        state.aadharError =
          action.payload || action.error?.message || 'Something went wrong';
        state.error = action.payload || 'Failed to fetch loans';
        state.loans = [];
        state.totalAmount = 0;
        state.pagination = initialState.pagination;
      })

      // Handling getLoanByLender
      .addCase(getLoanByLender.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getLoanByLender.fulfilled, (state, action) => {
        state.loading = false;
        state.lenderLoans = action.payload.lenderLoans;
        state.lenderTotalAmount = action.payload.lenderTotalAmount;
        state.pagination = action.payload.pagination;
      })
      .addCase(getLoanByLender.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch loans';
        state.lenderLoans = [];
        state.lenderTotalAmount = 0;
        state.pagination = initialState.pagination;
      })

      // Handling createLoan
      .addCase(createLoan.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createLoan.fulfilled, (state, action) => {
        state.loading = false;
        // Handle new API response structure (data.data or data)
        const loanData = action.payload.data || action.payload;
        if (loanData) {
          state.lenderLoans.unshift(loanData);
        }
        state.error = null;
      })
      .addCase(createLoan.rejected, (state, action) => {
        state.loading = false;
        const error = action.payload;

        if (error?.type === 'SUBSCRIPTION_REQUIRED') {
          state.error = {
            type: 'SUBSCRIPTION_REQUIRED',
            message: error.message,
            errorCode: error.errorCode,
          };
        } else if (error?.type === 'LOAN_LIMIT_REACHED') {
          state.error = {
            type: 'LOAN_LIMIT_REACHED',
            message: error.message,
            data: error.data,
          };
        } else {
          state.error = error?.message || 'Error creating loan';
        }
      })

      // Handling updateLoanStatus
      .addCase(updateLoanStatus.pending, state => {
        state.loading = true;
        state.updateError = null;
      })
      .addCase(updateLoanStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updatedLoan = action.payload.loan;
        const updatedLoanIndex = state.loans.findIndex(
          loan => loan._id === updatedLoan._id,
        );

        if (updatedLoanIndex >= 0) {
          state.loans[updatedLoanIndex] = updatedLoan;
        }

        const updatedLenderLoanIndex = state.lenderLoans.findIndex(
          loan => loan._id === updatedLoan._id,
        );
        if (updatedLenderLoanIndex >= 0) {
          state.lenderLoans[updatedLenderLoanIndex] = updatedLoan;
        }

        state.updateError = null;
      })
      .addCase(updateLoanStatus.rejected, (state, action) => {
        state.loading = false;
        const errorMessage = action.payload.replace(/^.*loanEndDate:\s*/, '')
        state.updateError =
          errorMessage.replace(/^.*loanEndDate:\s*/, '') || "Failed to update"
      })

      //update updateLoanAcceptanceStatus
      .addCase(updateLoanAcceptanceStatus.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLoanAcceptanceStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updatedLoan = action.payload.loan;
        const updatedLoanIndex = state.loans.findIndex(
          loan => loan._id === updatedLoan._id,
        );

        if (updatedLoanIndex >= 0) {
          state.loans[updatedLoanIndex] = updatedLoan;
        }

        const updatedLenderLoanIndex = state.lenderLoans.findIndex(
          loan => loan._id === updatedLoan._id,
        );
        if (updatedLenderLoanIndex >= 0) {
          state.lenderLoans[updatedLenderLoanIndex] = updatedLoan;
        }

        state.error = null;
      })
      .addCase(updateLoanAcceptanceStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Handling updateLoan
      .addCase(updateLoan.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLoan.fulfilled, (state, action) => {
        state.loading = false;
        const updatedLoanIndex = state.lenderLoans.findIndex(
          loan => loan._id === action.payload._id,
        );

        if (updatedLoanIndex >= 0) {
          state.lenderLoans[updatedLoanIndex] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateLoan.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || action.error?.message || 'Error updating loan';
      })

      // Handling getLoanStats
      .addCase(getLoanStats.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getLoanStats.fulfilled, (state, action) => {
        state.loading = false;
        state.loanStats = action.payload.data;
        state.error = null;
      })
      .addCase(getLoanStats.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload ||
          action.error?.message ||
          'Error fetching loan stats';
      })

      // Handling getRecentActivities
      .addCase(getRecentActivities.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getRecentActivities.fulfilled, (state, action) => {
        state.loading = false;
        state.recentActivities = action.payload.data || [];
        state.error = null;
      })
      .addCase(getRecentActivities.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload ||
          action.error?.message ||
          'Error fetching recent activities';
        state.recentActivities = [];
      })
      // Handling verifyLoanOTP
      .addCase(verifyLoanOTP.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyLoanOTP.fulfilled, (state, action) => {
        state.loading = false;
        const verifiedLoan = action.payload.data;
        const updatedLoanIndex = state.lenderLoans.findIndex(
          loan => loan._id === verifiedLoan._id,
        );
        if (updatedLoanIndex >= 0) {
          state.lenderLoans[updatedLoanIndex] = verifiedLoan;
        }
        state.error = null;
      })
      .addCase(verifyLoanOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to verify OTP';
      })

      // Handling verifyLoanPayment (Razorpay payment verification for loan disbursement)
      .addCase(verifyLoanPayment.pending, state => {
        state.paymentVerifying = true;
        state.paymentError = null;
      })
      .addCase(verifyLoanPayment.fulfilled, (state, action) => {
        state.paymentVerifying = false;
        const verifiedLoan = action.payload.data?.loan;
        if (verifiedLoan) {
          const updatedLoanIndex = state.lenderLoans.findIndex(
            loan => loan._id === verifiedLoan._id,
          );
          if (updatedLoanIndex >= 0) {
            state.lenderLoans[updatedLoanIndex] = verifiedLoan;
          }
        }
        state.paymentError = null;
      })
      .addCase(verifyLoanPayment.rejected, (state, action) => {
        state.paymentVerifying = false;
        state.paymentError = action.payload || 'Failed to verify payment';
      })

      // Handling getLenderStatistics
      .addCase(getLenderStatistics.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getLenderStatistics.fulfilled, (state, action) => {
        state.loading = false;
        state.lenderStatistics = action.payload.data;
        state.error = null;
      })
      .addCase(getLenderStatistics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error fetching lender statistics';
        state.lenderStatistics = null;
      })
      
      // Handling checkFraudStatus
      .addCase(checkFraudStatus.pending, state => {
        state.fraudLoading = true;
        state.fraudError = null;
      })
      .addCase(checkFraudStatus.fulfilled, (state, action) => {
        state.fraudLoading = false;
        state.fraudStatus = action.payload;
        state.fraudError = null;
      })
      .addCase(checkFraudStatus.rejected, (state, action) => {
        state.fraudLoading = false;
        state.fraudError = action.payload;
        // Don't clear fraudStatus on error, keep last known status
      });
  },
  reducers: {
    clearFraudStatus: (state) => {
      state.fraudStatus = null;
      state.fraudError = null;
    },
  },
});

export const { clearFraudStatus } = loanSlice.actions;
export default loanSlice.reducer;
