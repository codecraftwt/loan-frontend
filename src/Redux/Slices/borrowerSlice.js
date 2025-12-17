import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import instance from '../../Utils/AxiosInstance';

const initialState = {
  borrowers: [],
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

const borrowerSlice = createSlice({
  name: 'borrowers',
  initialState,
  reducers: {
    clearBorrowers: (state) => {
      state.borrowers = [];
      state.error = null;
      state.pagination = initialState.pagination;
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
      });
  },
});

export const { clearBorrowers } = borrowerSlice.actions;
export default borrowerSlice.reducer;







