import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminAPI } from '../../Services/adminService';

const initialState = {
  lenders: [],
  loading: false,
  error: null,
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
      });
  },
});

export const {
  setFilters,
  resetFilters,
  setLimit,
  clearErrors,
  resetAdminLenders,
} = adminLendersSlice.actions;

export default adminLendersSlice.reducer;

