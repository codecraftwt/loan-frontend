import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import instance from '../../Utils/AxiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lenderLoanAPI } from '../../Services/lenderLoanService';

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
  pagination: {
    page: 1,
    limit: 10,
    totalPages: 1,
    totalLoans: 0,
  },
};

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

      console.log('Creating loan with data:', loanData);

      // Map old field names to new API structure
      const apiData = {
        name: loanData.name,
        aadharCardNo: loanData.aadharCardNo || loanData.aadhaarNumber,
        mobileNumber: loanData.mobileNumber,
        address: loanData.address,
        amount: loanData.amount,
        purpose: loanData.purpose,
        loanGivenDate: loanData.loanGivenDate || loanData.loanStartDate,
        loanEndDate: loanData.loanEndDate,
        loanMode: loanData.loanMode || 'cash', // Default to cash if not provided
      };

      const response = await instance.post('lender/loans/create', apiData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Create loan error:', error.response?.data || error.message);

      // Handle subscription-related errors
      if (error.response?.status === 403) {
        return rejectWithValue({
          type: 'SUBSCRIPTION_REQUIRED',
          message: error.response.data.message || 'You need an active subscription to create loans.',
          errorCode: error.response.data.errorCode,
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

export const updateLoanStatus = createAsyncThunk(
  'loans/updateLoanStatus',
  async ({ loanId, status }, { rejectWithValue }) => {
    try {
      console.log('API call for update status', loanId);
      const response = await instance.patch(
        `loan/update-loan-status/${loanId}`,
        { status },
      );
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.log('Fail---------------------------->', error.response.data.error);
      return rejectWithValue(error.response.data.error || error.message || error || 'Unknown error');
    }
  },
);

export const updateLoanAcceptanceStatus = createAsyncThunk(
  'loans/updateLoanAcceptanceStatus',
  async ({ loanId, status }, { rejectWithValue }) => {
    try {
      console.log('API call for update status', loanId);
      const response = await instance.patch(
        `loan/update-loan-acceptance-status/${loanId}`,
        { status },
      );
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.log('Failed loan status update', error.response.data);
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
      console.log(error.response?.data || error.message);
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
      console.log(error.response?.data || error.message);
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
        console.log(errorMessage, "message <--------------")
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
      });
  },
});

export default loanSlice.reducer;
