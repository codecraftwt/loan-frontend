import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import lenderPaymentAPI from '../../Services/lenderPaymentService';

const initialState = {
  pendingPayments: [],
  loading: false,
  confirming: false,
  rejecting: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  },
};

// Get pending payments
export const getPendingPayments = createAsyncThunk(
  'lenderPayments/getPendingPayments',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await lenderPaymentAPI.getPendingPayments(params);
      // Handle both successful responses and graceful 500 error handling
      return {
        payments: response.data || [],
        pagination: response.pagination || initialState.pagination,
      };
    } catch (error) {
      // If it's a 500 error, the service should have returned empty data
      // But if it still throws, handle it gracefully
      if (error.response?.status === 500) {
        console.warn('Pending payments endpoint failed, returning empty data');
        return {
          payments: [],
          pagination: initialState.pagination,
        };
      }
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch pending payments'
      );
    }
  }
);

// Confirm payment
export const confirmPayment = createAsyncThunk(
  'lenderPayments/confirmPayment',
  async ({ loanId, paymentId, notes = '' }, { rejectWithValue }) => {
    try {
      const response = await lenderPaymentAPI.confirmPayment(loanId, paymentId, notes);
      return {
        loanId,
        paymentId,
        ...response.data,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to confirm payment'
      );
    }
  }
);

// Reject payment
export const rejectPayment = createAsyncThunk(
  'lenderPayments/rejectPayment',
  async ({ loanId, paymentId, reason }, { rejectWithValue }) => {
    try {
      const response = await lenderPaymentAPI.rejectPayment(loanId, paymentId, reason);
      return {
        loanId,
        paymentId,
        ...response.data,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to reject payment'
      );
    }
  }
);

const lenderPaymentSlice = createSlice({
  name: 'lenderPayments',
  initialState,
  reducers: {
    clearPendingPayments: (state) => {
      state.pendingPayments = [];
      state.error = null;
      state.pagination = initialState.pagination;
    },
    clearErrors: (state) => {
      state.error = null;
    },
    removePaymentFromList: (state, action) => {
      const { loanId, paymentId } = action.payload;
      state.pendingPayments = state.pendingPayments.map(loan => {
        if (loan.loanId === loanId) {
          return {
            ...loan,
            pendingPayments: loan.pendingPayments.filter(
              payment => payment._id !== paymentId
            ),
          };
        }
        return loan;
      }).filter(loan => loan.pendingPayments.length > 0);
    },
  },
  extraReducers: (builder) => {
    builder
      // Get pending payments
      .addCase(getPendingPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPendingPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingPayments = action.payload.payments;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(getPendingPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.pendingPayments = [];
        state.pagination = initialState.pagination;
      })

      // Confirm payment
      .addCase(confirmPayment.pending, (state) => {
        state.confirming = true;
        state.error = null;
      })
      .addCase(confirmPayment.fulfilled, (state, action) => {
        state.confirming = false;
        state.error = null;
        // Remove confirmed payment from pending list
        const { loanId, paymentId } = action.payload;
        state.pendingPayments = state.pendingPayments.map(loan => {
          // Match loan by loanId or _id
          const matchesLoan = (loan.loanId === loanId) || (loan._id === loanId);
          if (matchesLoan) {
            return {
              ...loan,
              pendingPayments: loan.pendingPayments.filter(
                payment => {
                  // Match payment by paymentId or _id
                  const paymentMatchId = payment.paymentId || payment._id;
                  return paymentMatchId !== paymentId;
                }
              ),
            };
          }
          return loan;
        }).filter(loan => loan.pendingPayments && loan.pendingPayments.length > 0);
      })
      .addCase(confirmPayment.rejected, (state, action) => {
        state.confirming = false;
        state.error = action.payload;
      })

      // Reject payment
      .addCase(rejectPayment.pending, (state) => {
        state.rejecting = true;
        state.error = null;
      })
      .addCase(rejectPayment.fulfilled, (state, action) => {
        state.rejecting = false;
        state.error = null;
        // Remove rejected payment from pending list
        const { loanId, paymentId } = action.payload;
        state.pendingPayments = state.pendingPayments.map(loan => {
          // Match loan by loanId or _id
          const matchesLoan = (loan.loanId === loanId) || (loan._id === loanId);
          if (matchesLoan) {
            return {
              ...loan,
              pendingPayments: loan.pendingPayments.filter(
                payment => {
                  // Match payment by paymentId or _id
                  const paymentMatchId = payment.paymentId || payment._id;
                  return paymentMatchId !== paymentId;
                }
              ),
            };
          }
          return loan;
        }).filter(loan => loan.pendingPayments && loan.pendingPayments.length > 0);
      })
      .addCase(rejectPayment.rejected, (state, action) => {
        state.rejecting = false;
        state.error = action.payload;
      });
  },
});

export const { clearPendingPayments, clearErrors, removePaymentFromList } = lenderPaymentSlice.actions;
export default lenderPaymentSlice.reducer;

