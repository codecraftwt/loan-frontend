import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { borrowerLoanAPI } from '../../Services/borrowerLoanService';

const initialState = {
  activities: [],
  count: 0,
  loading: false,
  error: null,
};

export const getBorrowerRecentActivities = createAsyncThunk(
  'borrowerActivities/getBorrowerRecentActivities',
  async (params = { limit: 10 }, { rejectWithValue }) => {
    try {
      const response = await borrowerLoanAPI.getBorrowerRecentActivities(params);
      return response.data || response;
    } catch (error) {
      console.error('Error fetching borrower recent activities:', error);
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch borrower recent activities'
      );
    }
  }
);

const borrowerActivitiesSlice = createSlice({
  name: 'borrowerActivities',
  initialState,
  reducers: {
    clearBorrowerActivities: state => {
      state.activities = [];
      state.count = 0;
      state.error = null;
    },
    clearBorrowerActivitiesError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getBorrowerRecentActivities.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBorrowerRecentActivities.fulfilled, (state, action) => {
        state.loading = false;
        // Handle both response.data and direct response
        const payload = action.payload || {};
        state.activities = payload.data || (Array.isArray(payload) ? payload : []);
        state.count = payload.count || (Array.isArray(payload) ? payload.length : 0);
        state.error = null;
      })
      .addCase(getBorrowerRecentActivities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch borrower recent activities';
      });
  },
});

export const { clearBorrowerActivities, clearBorrowerActivitiesError } = borrowerActivitiesSlice.actions;
export default borrowerActivitiesSlice.reducer;

