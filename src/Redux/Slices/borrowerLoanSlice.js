import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import borrowerLoanAPI from '../../Services/borrowerLoanService';

const initialState = {
  loans: [],
  currentLoan: null,
  paymentHistory: [],
  summary: {
    totalLoans: 0,
    activeLoans: 0,
    completedLoans: 0,
    overdueLoans: 0,
    totalAmountBorrowed: 0,
    totalAmountPaid: 0,
    totalAmountRemaining: 0,
  },
  loading: false,
  paymentLoading: false,
  historyLoading: false,
  error: null,
  paymentError: null,
  historyError: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  },
  paymentStats: {
    totalPaid: 0,
    pendingPayments: 0,
    confirmedPayments: 0,
    rejectedPayments: 0,
  },
};

// Get borrower's loans
export const getBorrowerLoans = createAsyncThunk(
  'borrowerLoans/getBorrowerLoans',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { borrowerId, ...queryParams } = params;
      if (!borrowerId) {
        return rejectWithValue('Borrower ID is required');
      }
      const response = await borrowerLoanAPI.getMyLoans(borrowerId, queryParams);
      return {
        loans: response.data || [],
        summary: response.summary || initialState.summary,
        pagination: response.pagination || initialState.pagination,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch loans'
      );
    }
  }
);

// Get loans for a specific borrower (for lenders)
export const getBorrowerLoansById = createAsyncThunk(
  'borrowerLoans/getBorrowerLoansById',
  async ({ borrowerId, params = {} }, { rejectWithValue }) => {
    try {
      const response = await borrowerLoanAPI.getBorrowerLoansById(borrowerId, params);
      return {
        loans: response.data || [],
        summary: response.summary || initialState.summary,
        pagination: response.pagination || initialState.pagination,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch borrower loans'
      );
    }
  }
);

// Get loan details
export const getLoanDetails = createAsyncThunk(
  'borrowerLoans/getLoanDetails',
  async (loanId, { rejectWithValue }) => {
    try {
      const response = await borrowerLoanAPI.getLoanDetails(loanId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch loan details'
      );
    }
  }
);

// Make payment
export const makePayment = createAsyncThunk(
  'borrowerLoans/makePayment',
  async ({ loanId, paymentData }, { rejectWithValue }) => {
    try {
      const response = await borrowerLoanAPI.makePayment(loanId, paymentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to make payment'
      );
    }
  }
);

// Get payment history
export const getPaymentHistory = createAsyncThunk(
  'borrowerLoans/getPaymentHistory',
  async (loanId, { rejectWithValue }) => {
    try {
      const response = await borrowerLoanAPI.getPaymentHistory(loanId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch payment history'
      );
    }
  }
);

// Update payment proof
export const updatePaymentProof = createAsyncThunk(
  'borrowerLoans/updatePaymentProof',
  async ({ paymentId, proofData }, { rejectWithValue }) => {
    try {
      const response = await borrowerLoanAPI.updatePaymentProof(paymentId, proofData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to update payment proof'
      );
    }
  }
);

const borrowerLoanSlice = createSlice({
  name: 'borrowerLoans',
  initialState,
  reducers: {
    clearLoans: (state) => {
      state.loans = [];
      state.summary = initialState.summary;
      state.error = null;
      state.pagination = initialState.pagination;
    },
    clearCurrentLoan: (state) => {
      state.currentLoan = null;
    },
    clearPaymentHistory: (state) => {
      state.paymentHistory = [];
      state.paymentStats = initialState.paymentStats;
      state.historyError = null;
    },
    clearErrors: (state) => {
      state.error = null;
      state.paymentError = null;
      state.historyError = null;
    },
    updateLoanInList: (state, action) => {
      const updatedLoan = action.payload;
      const index = state.loans.findIndex(loan => loan._id === updatedLoan._id);
      if (index !== -1) {
        state.loans[index] = { ...state.loans[index], ...updatedLoan };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Get borrower loans
      .addCase(getBorrowerLoans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBorrowerLoans.fulfilled, (state, action) => {
        state.loading = false;
        state.loans = action.payload.loans;
        state.summary = action.payload.summary;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(getBorrowerLoans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.loans = [];
        state.pagination = initialState.pagination;
      })

      // Get borrower loans by ID
      .addCase(getBorrowerLoansById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBorrowerLoansById.fulfilled, (state, action) => {
        state.loading = false;
        state.loans = action.payload.loans;
        state.summary = action.payload.summary;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(getBorrowerLoansById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.loans = [];
        state.pagination = initialState.pagination;
      })

      // Get loan details
      .addCase(getLoanDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getLoanDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentLoan = action.payload;
        state.error = null;
      })
      .addCase(getLoanDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.currentLoan = null;
      })

      // Make payment
      .addCase(makePayment.pending, (state) => {
        state.paymentLoading = true;
        state.paymentError = null;
      })
      .addCase(makePayment.fulfilled, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = null;
        // Update the loan in the list if it exists
        if (action.payload.loanId) {
          const loanIndex = state.loans.findIndex(loan => loan._id === action.payload.loanId);
          if (loanIndex !== -1) {
            state.loans[loanIndex] = {
              ...state.loans[loanIndex],
              ...action.payload,
            };
          }
        }
      })
      .addCase(makePayment.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = action.payload;
      })

      // Get payment history
      .addCase(getPaymentHistory.pending, (state) => {
        state.historyLoading = true;
        state.historyError = null;
      })
      .addCase(getPaymentHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.paymentHistory = action.payload.paymentHistory || [];
        // Calculate payment stats
        const stats = (action.payload.paymentHistory || []).reduce(
          (acc, payment) => {
            acc.totalPaid += payment.amount || 0;
            switch (payment.paymentStatus?.toLowerCase()) {
              case 'pending':
                acc.pendingPayments += 1;
                break;
              case 'confirmed':
                acc.confirmedPayments += 1;
                break;
              case 'rejected':
                acc.rejectedPayments += 1;
                break;
            }
            return acc;
          },
          { totalPaid: 0, pendingPayments: 0, confirmedPayments: 0, rejectedPayments: 0 }
        );
        state.paymentStats = stats;
        state.historyError = null;
      })
      .addCase(getPaymentHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.historyError = action.payload;
        state.paymentHistory = [];
        state.paymentStats = initialState.paymentStats;
      })

      // Update payment proof
      .addCase(updatePaymentProof.pending, (state) => {
        state.paymentLoading = true;
        state.paymentError = null;
      })
      .addCase(updatePaymentProof.fulfilled, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = null;
        // Update payment in history if it exists
        const paymentIndex = state.paymentHistory.findIndex(
          payment => payment._id === action.payload._id
        );
        if (paymentIndex !== -1) {
          state.paymentHistory[paymentIndex] = action.payload;
        }
      })
      .addCase(updatePaymentProof.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = action.payload;
      });
  },
});

export const {
  clearLoans,
  clearCurrentLoan,
  clearPaymentHistory,
  clearErrors,
  updateLoanInList,
} = borrowerLoanSlice.actions;

export default borrowerLoanSlice.reducer;

