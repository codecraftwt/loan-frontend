import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { lenderLoanAPI } from '../../Services/lenderLoanService';

const initialState = {
  activities: [],
  count: 0,
  loading: false,
  error: null,
};

export const getLenderRecentActivities = createAsyncThunk(
  'lenderActivities/getLenderRecentActivities',
  async (params = { limit: 10 }, { rejectWithValue }) => {
    try {
      const response = await lenderLoanAPI.getLenderRecentActivities(params);
      return response.data || response;
    } catch (error) {
      console.error('Error fetching lender recent activities:', error);
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch lender recent activities'
      );
    }
  }
);

const lenderActivitiesSlice = createSlice({
  name: 'lenderActivities',
  initialState,
  reducers: {
    clearLenderActivities: state => {
      state.activities = [];
      state.count = 0;
      state.error = null;
    },
    clearLenderActivitiesError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getLenderRecentActivities.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getLenderRecentActivities.fulfilled, (state, action) => {
        state.loading = false;
        state.activities = action.payload.data || action.payload || [];
        state.count = action.payload.count || action.payload.length || 0;
      })
      .addCase(getLenderRecentActivities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch lender recent activities';
      });
  },
});

export const { clearLenderActivities, clearLenderActivitiesError } = lenderActivitiesSlice.actions;
export default lenderActivitiesSlice.reducer;

