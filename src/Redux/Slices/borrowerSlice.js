import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import instance from '../../Utils/AxiosInstance';

const initialState = {
  borrowers: [],
  borrowerHistory: [],
  historyLoading: false,
  historyError: null,
  historySummary: null,
  historyPagination: {
    page: 1,
    limit: 10,
    totalPages: 1,
    totalDocuments: 0,
  },
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    totalPages: 1,
    totalDocuments: 0,
  },
};

// Get all borrowers
export const getAllBorrowers = createAsyncThunk(
  'borrowers/getAllBorrowers',
  async ({ page = 1, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const params = {
        page,
        limit,
      };

      const response = await instance.get('borrower/borrowers', { params });

      if (response.status === 404) {
        return {
          borrowers: [],
          pagination: initialState.pagination,
        };
      }

      return {
        borrowers: response.data.data || [],
        pagination: response.data.pagination || initialState.pagination,
      };
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data.message || 'Failed to fetch borrowers');
      }
      return rejectWithValue(error.message || 'Unknown error');
    }
  },
);

// Search borrowers
export const searchBorrowers = createAsyncThunk(
  'borrowers/searchBorrowers',
  async ({ search, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      if (!search || search.trim() === '') {
        return rejectWithValue('Search query is required');
      }

      const params = {
        search: search.trim(),
        page,
        limit,
      };

      const response = await instance.get('borrower/borrowers/search', { params });

      if (response.status === 404) {
        return {
          borrowers: [],
          pagination: initialState.pagination,
        };
      }

      return {
        borrowers: response.data.data || [],
        pagination: response.data.pagination || initialState.pagination,
      };
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data.message || 'Failed to search borrowers');
      }
      return rejectWithValue(error.message || 'Unknown error');
    }
  },
);

// Get borrower loan history
export const getBorrowerHistory = createAsyncThunk(
  'borrowers/getBorrowerHistory',
  async ({ 
    borrowerId, 
    page = 1, 
    limit = 10, 
    startDate, 
    endDate, 
    status, 
    minAmount, 
    maxAmount,
    search 
  }, { rejectWithValue }) => {
    try {
      if (!borrowerId) {
        return rejectWithValue('Borrower ID is required');
      }

      const params = {
        page,
        limit,
      };

      // Add optional filters
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (status) params.status = status;
      if (minAmount) params.minAmount = minAmount;
      if (maxAmount) params.maxAmount = maxAmount;
      if (search) params.search = search;

      const response = await instance.get(`history/borrowers/borrower/${borrowerId}`, { params });

      if (response.status === 404) {
        return {
          borrower: null,
          history: [],
          summary: null,
          pagination: initialState.historyPagination,
        };
      }

      return {
        borrower: response.data.borrower || null,
        history: response.data.data || [],
        summary: response.data.summary || null,
        pagination: response.data.pagination || initialState.historyPagination,
      };
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data.message || 'Failed to fetch borrower history');
      }
      return rejectWithValue(error.message || 'Unknown error');
    }
  },
);

// Clear borrower history
export const clearBorrowerHistory = createAsyncThunk(
  'borrowers/clearBorrowerHistory',
  async () => {
    return;
  }
);

const borrowerSlice = createSlice({
  name: 'borrowers',
  initialState,
  reducers: {
    clearBorrowers: (state) => {
      state.borrowers = [];
      state.error = null;
      state.pagination = initialState.pagination;
    },
    clearHistoryData: (state) => {
      state.borrowerHistory = [];
      state.historySummary = null;
      state.historyError = null;
      state.historyPagination = initialState.historyPagination;
    },
  },
  extraReducers: builder => {
    builder
      // Get all borrowers
      .addCase(getAllBorrowers.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllBorrowers.fulfilled, (state, action) => {
        state.loading = false;
        state.borrowers = action.payload.borrowers;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(getAllBorrowers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch borrowers';
        state.borrowers = [];
        state.pagination = initialState.pagination;
      })
      // Search borrowers
      .addCase(searchBorrowers.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchBorrowers.fulfilled, (state, action) => {
        state.loading = false;
        state.borrowers = action.payload.borrowers;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(searchBorrowers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to search borrowers';
        state.borrowers = [];
        state.pagination = initialState.pagination;
      })
      // Get borrower history
      .addCase(getBorrowerHistory.pending, state => {
        state.historyLoading = true;
        state.historyError = null;
      })
      .addCase(getBorrowerHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.borrowerHistory = action.payload.history;
        state.historySummary = action.payload.summary;
        state.historyPagination = action.payload.pagination;
        state.historyError = null;
      })
      .addCase(getBorrowerHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.historyError = action.payload || 'Failed to fetch borrower history';
        state.borrowerHistory = [];
        state.historySummary = null;
        state.historyPagination = initialState.historyPagination;
      })
      // Clear borrower history
      .addCase(clearBorrowerHistory.fulfilled, (state) => {
        state.borrowerHistory = [];
        state.historySummary = null;
        state.historyError = null;
        state.historyPagination = initialState.historyPagination;
      });
  },
});

export const { clearBorrowers, clearHistoryData } = borrowerSlice.actions;
export default borrowerSlice.reducer;








