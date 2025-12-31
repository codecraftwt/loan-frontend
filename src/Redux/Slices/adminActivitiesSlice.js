import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminAPI } from '../../Services/adminService';

const initialState = {
  activities: [],
  count: 0,
  loading: false,
  error: null,
};

export const getAdminRecentActivities = createAsyncThunk(
  'adminActivities/getAdminRecentActivities',
  async (params = { limit: 10 }, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getAdminRecentActivities(params);
      return response.data || response;
    } catch (error) {
      console.error('Error fetching admin recent activities:', error);
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch admin recent activities'
      );
    }
  }
);

const adminActivitiesSlice = createSlice({
  name: 'adminActivities',
  initialState,
  reducers: {
    clearAdminActivities: state => {
      state.activities = [];
      state.count = 0;
      state.error = null;
    },
    clearAdminActivitiesError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getAdminRecentActivities.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAdminRecentActivities.fulfilled, (state, action) => {
        state.loading = false;
        state.activities = action.payload.data || action.payload || [];
        state.count = action.payload.count || action.payload.length || 0;
      })
      .addCase(getAdminRecentActivities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch admin recent activities';
      });
  },
});

export const { clearAdminActivities, clearAdminActivitiesError } = adminActivitiesSlice.actions;
export default adminActivitiesSlice.reducer;

