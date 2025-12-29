import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import instance from '../../Utils/AxiosInstance';

const initialState = {
  // Plans data
  plans: [],
  selectedPlan: null,

  // Loading states
  loading: false,
  creating: false,
  updating: false,

  // Error states
  error: null,
  createError: null,
  updateError: null,
};

// Get all plans (Admin only)
export const getAdminPlans = createAsyncThunk(
  'adminPlans/getAdminPlans',
  async (_, { rejectWithValue }) => {
    try {
      const response = await instance.get('admin/plans');
      if (response.data.success) {
        return {
          plans: response.data.data || [],
        };
      } else {
        return rejectWithValue(
          response.data.message || 'Failed to fetch plans'
        );
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch plans. Please try again.'
      );
    }
  }
);

// Create plan
export const createPlan = createAsyncThunk(
  'adminPlans/createPlan',
  async (planData, { rejectWithValue }) => {
    try {
      const response = await instance.post('admin/plans', planData);
      if (response.data.success) {
        return {
          plan: response.data.data,
          message: response.data.message || 'Plan created successfully',
        };
      } else {
        return rejectWithValue(
          response.data.message || 'Failed to create plan'
        );
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Failed to create plan. Please try again.'
      );
    }
  }
);

// Update plan
export const updatePlan = createAsyncThunk(
  'adminPlans/updatePlan',
  async ({ planId, planData }, { rejectWithValue }) => {
    try {
      const response = await instance.put(`admin/plans/${planId}`, planData);
      if (response.data.success) {
        return {
          plan: response.data.data,
          message: response.data.message || 'Plan updated successfully',
        };
      } else {
        return rejectWithValue(
          response.data.message || 'Failed to update plan'
        );
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Failed to update plan. Please try again.'
      );
    }
  }
);

const adminPlanSlice = createSlice({
  name: 'adminPlans',
  initialState,
  reducers: {
    // Clear errors
    clearErrors: state => {
      state.error = null;
      state.createError = null;
      state.updateError = null;
    },

    // Select a plan
    selectPlan: (state, action) => {
      state.selectedPlan = action.payload;
    },

    // Clear selected plan
    clearSelectedPlan: state => {
      state.selectedPlan = null;
    },

    // Reset state
    resetAdminPlans: () => initialState,
  },
  extraReducers: builder => {
    builder
      // Get all plans
      .addCase(getAdminPlans.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAdminPlans.fulfilled, (state, action) => {
        state.loading = false;
        state.plans = action.payload.plans;
      })
      .addCase(getAdminPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create plan
      .addCase(createPlan.pending, state => {
        state.creating = true;
        state.createError = null;
      })
      .addCase(createPlan.fulfilled, (state, action) => {
        state.creating = false;
        // Add the new plan to the plans array
        state.plans.push(action.payload.plan);
      })
      .addCase(createPlan.rejected, (state, action) => {
        state.creating = false;
        state.createError = action.payload;
      })

      // Update plan
      .addCase(updatePlan.pending, state => {
        state.updating = true;
        state.updateError = null;
      })
      .addCase(updatePlan.fulfilled, (state, action) => {
        state.updating = false;
        // Update the plan in the plans array
        const index = state.plans.findIndex(
          plan => plan._id === action.payload.plan._id
        );
        if (index !== -1) {
          state.plans[index] = action.payload.plan;
        }
        // Update selected plan if it's the one being updated
        if (
          state.selectedPlan &&
          state.selectedPlan._id === action.payload.plan._id
        ) {
          state.selectedPlan = action.payload.plan;
        }
      })
      .addCase(updatePlan.rejected, (state, action) => {
        state.updating = false;
        state.updateError = action.payload;
      });
  },
});

export const { clearErrors, selectPlan, clearSelectedPlan, resetAdminPlans } =
  adminPlanSlice.actions;

export default adminPlanSlice.reducer;

