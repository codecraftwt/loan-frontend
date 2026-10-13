import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminAPI } from '../../Services/adminService';

const initialState = {
  borrowers: [],
  summary: null,
  selectedBorrower: null,
  loading: false,
  detailsLoading: false,
  error: null,
  detailsError: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalDocuments: 0,
  },
  filters: {
    search: '',
    kycStatus: 'all',
    loanStatus: 'all',
  },
  limit: 20,
};

// Fetch admin borrowers directory
export const getAdminBorrowers = createAsyncThunk(
  'adminBorrowers/getAdminBorrowers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getAdminBorrowers(params);
      if (response.success) {
        return {
          borrowers: response.data || [],
          summary: response.summary || null,
          pagination: response.pagination || initialState.pagination,
        };
      } else {
        return rejectWithValue(
          response.message || 'Failed to fetch borrowers directory'
        );
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch borrowers. Please try again.'
      );
    }
  }
);

// Fetch single borrower details with DigiLocker KYC
export const getAdminBorrowerDetails = createAsyncThunk(
  'adminBorrowers/getAdminBorrowerDetails',
  async (borrowerId, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getAdminBorrowerDetails(borrowerId);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(
          response.message || 'Failed to fetch borrower details'
        );
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch borrower details.'
      );
    }
  }
);

const adminBorrowersSlice = createSlice({
  name: 'adminBorrowers',
  initialState,
  reducers: {
    setBorrowerFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetBorrowerFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearSelectedBorrower: (state) => {
      state.selectedBorrower = null;
      state.detailsError = null;
    },
    clearBorrowerErrors: (state) => {
      state.error = null;
      state.detailsError = null;
    },
    resetAdminBorrowers: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch borrowers
      .addCase(getAdminBorrowers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAdminBorrowers.fulfilled, (state, action) => {
        state.loading = false;
        state.borrowers = action.payload.borrowers;
        state.summary = action.payload.summary;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(getAdminBorrowers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.borrowers = [];
      })
      // Fetch borrower details
      .addCase(getAdminBorrowerDetails.pending, (state) => {
        state.detailsLoading = true;
        state.detailsError = null;
      })
      .addCase(getAdminBorrowerDetails.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.selectedBorrower = action.payload;
        state.detailsError = null;
      })
      .addCase(getAdminBorrowerDetails.rejected, (state, action) => {
        state.detailsLoading = false;
        state.detailsError = action.payload;
      });
  },
});

export const {
  setBorrowerFilters,
  resetBorrowerFilters,
  clearSelectedBorrower,
  clearBorrowerErrors,
  resetAdminBorrowers,
} = adminBorrowersSlice.actions;

export default adminBorrowersSlice.reducer;
