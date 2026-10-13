import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminAPI } from '../../Services/adminService';

const initialState = {
  lenders: [],
  selectedLender: null,
  subscriptionHistory: [],
  loading: false,
  detailsLoading: false,
  historyLoading: false,
  error: null,
  detailsError: null,
  historyError: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalDocuments: 0,
  },
  filters: {
    search: '',
    planStatus: 'all',
    sortBy: 'planPurchaseDate',
    sortOrder: 'desc',
  },
  limit: 10,
};

// Get lenders with plans
export const getLendersWithPlans = createAsyncThunk(
  'adminLenders/getLendersWithPlans',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getLendersWithPlans(params);
      
      if (response.success) {
        return {
          lenders: response.data || [],
          pagination: response.pagination || initialState.pagination,
          count: response.count || 0,
        };
      } else {
        return rejectWithValue(
          response.message || 'Failed to fetch lenders with plans'
        );
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch lenders with plans. Please try again.'
      );
    }
  }
);

// Get single lender details
export const getLenderDetails = createAsyncThunk(
  'adminLenders/getLenderDetails',
  async (lenderId, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getLenderDetails(lenderId);
      if (response.success && response.data?.length) {
        return response.data[0];
      }
      return response.data || null;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch lender details'
      );
    }
  }
);

// Get lender subscription history
export const getLenderSubscriptionHistory = createAsyncThunk(
  'adminLenders/getLenderSubscriptionHistory',
  async (lenderId, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getLenderSubscriptionHistory(lenderId);
      if (response.success) {
        return response.data || [];
      } else {
        return rejectWithValue(
          response.message || 'Failed to fetch subscription history'
        );
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch subscription history'
      );
    }
  }
);

const adminLendersSlice = createSlice({
  name: 'adminLenders',
  initialState,
  reducers: {
    // Set filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    // Reset filters
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    
    // Set limit
    setLimit: (state, action) => {
      state.limit = action.payload;
    },
    
    // Clear errors
    clearErrors: (state) => {
      state.error = null;
      state.detailsError = null;
      state.historyError = null;
    },

    clearSelectedLender: (state) => {
      state.selectedLender = null;
      state.detailsError = null;
    },

    clearSubscriptionHistory: (state) => {
      state.subscriptionHistory = [];
      state.historyError = null;
    },
    
    // Reset state
    resetAdminLenders: () => initialState,
  },
  extraReducers: builder => {
    builder
      // Get lenders with plans
      .addCase(getLendersWithPlans.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getLendersWithPlans.fulfilled, (state, action) => {
        state.loading = false;
        state.lenders = action.payload.lenders;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(getLendersWithPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.lenders = [];
        state.pagination = initialState.pagination;
      })
      // Get lender details
      .addCase(getLenderDetails.pending, state => {
        state.detailsLoading = true;
        state.detailsError = null;
      })
      .addCase(getLenderDetails.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.selectedLender = action.payload;
        state.detailsError = null;
      })
      .addCase(getLenderDetails.rejected, (state, action) => {
        state.detailsLoading = false;
        state.detailsError = action.payload;
      })
      // Get lender subscription history
      .addCase(getLenderSubscriptionHistory.pending, state => {
        state.historyLoading = true;
        state.historyError = null;
      })
      .addCase(getLenderSubscriptionHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.subscriptionHistory = action.payload;
        state.historyError = null;
      })
      .addCase(getLenderSubscriptionHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.historyError = action.payload;
        state.subscriptionHistory = [];
      });
  },
});

export const {
  setFilters,
  resetFilters,
  setLimit,
  clearErrors,
  clearSelectedLender,
  clearSubscriptionHistory,
  resetAdminLenders,
} = adminLendersSlice.actions;

export default adminLendersSlice.reducer;

