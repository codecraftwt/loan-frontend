import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminAPI } from '../../Services/adminService';

const initialState = {
  revenueData: null,
  loading: false,
  error: null,
  filters: {
    startDate: null,
    endDate: null,
    groupBy: 'all',
  },
};

// Get revenue statistics
export const getRevenueStatistics = createAsyncThunk(
  'adminRevenue/getRevenueStatistics',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getRevenueStatistics(params);
      
      if (response.success) {
        return {
          data: response.data || {},
          filters: response.filters || initialState.filters,
        };
      } else {
        return rejectWithValue(
          response.message || 'Failed to fetch revenue statistics'
        );
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch revenue statistics. Please try again.'
      );
    }
  }
);

const adminRevenueSlice = createSlice({
  name: 'adminRevenue',
  initialState,
  reducers: {
    // Set filters
    setRevenueFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    // Reset filters
    resetRevenueFilters: (state) => {
      state.filters = initialState.filters;
    },
    
    // Clear errors
    clearRevenueErrors: (state) => {
      state.error = null;
    },
    
    // Reset state
    resetAdminRevenue: () => initialState,
  },
  extraReducers: builder => {
    builder
      // Get revenue statistics
      .addCase(getRevenueStatistics.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getRevenueStatistics.fulfilled, (state, action) => {
        state.loading = false;
        state.revenueData = action.payload.data;
        state.filters = action.payload.filters;
        state.error = null;
      })
      .addCase(getRevenueStatistics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.revenueData = null;
      });
  },
});

export const {
  setRevenueFilters,
  resetRevenueFilters,
  clearRevenueErrors,
  resetAdminRevenue,
} = adminRevenueSlice.actions;

export default adminRevenueSlice.reducer;

