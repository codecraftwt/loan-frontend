import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import instance from '../../Utils/AxiosInstance';

const initialState = {
  // Active plan data
  activePlan: null,
  hasActivePlan: false,
  purchaseDate: null,
  expiryDate: null,
  remainingDays: 0,
  isActive: false,

  // Order data
  currentOrder: null,

  // Loading states
  loading: false,
  orderLoading: false,
  verifyLoading: false,

  // Error states
  error: null,
  orderError: null,
  verifyError: null,
};

// Get user's active plan
export const getActivePlan = createAsyncThunk(
  'planPurchase/getActivePlan',
  async (_, { rejectWithValue }) => {
    try {
      const response = await instance.get('plans/active');
      if (response.data.success) {
        return {
          hasActivePlan: response.data.data.hasActivePlan,
          plan: response.data.data.plan,
          purchaseDate: response.data.data.purchaseDate,
          expiryDate: response.data.data.expiryDate,
          remainingDays: response.data.data.remainingDays,
          isActive: response.data.data.isActive,
        };
      } else {
        return rejectWithValue(
          response.data.message || 'Failed to fetch active plan'
        );
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch active plan. Please try again.'
      );
    }
  }
);

// Create Razorpay order for plan purchase
export const createPlanOrder = createAsyncThunk(
  'planPurchase/createPlanOrder',
  async (planId, { rejectWithValue }) => {
    try {
      const response = await instance.post('plans/purchase/order', {
        planId,
      });
      if (response.data.success) {
        return {
          orderId: response.data.data.orderId,
          amount: response.data.data.amount,
          currency: response.data.data.currency,
          plan: response.data.data.plan,
        };
      } else {
        return rejectWithValue(
          response.data.message || 'Failed to create order'
        );
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Failed to create order. Please try again.'
      );
    }
  }
);

// Verify payment and activate plan
export const verifyPlanPayment = createAsyncThunk(
  'planPurchase/verifyPlanPayment',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await instance.post('plans/purchase/verify', paymentData);
      
      if (response.data.success) {
        return {
          plan: response.data.data.plan,
          purchaseDate: response.data.data.purchaseDate,
          expiryDate: response.data.data.expiryDate,
          remainingDays: response.data.data.remainingDays,
          isActive: response.data.data.isActive,
        };
      } else {
        console.error('Verification failed - response:', response.data);
        return rejectWithValue(
          response.data.message || 'Payment verification failed'
        );
      }
    } catch (error) {
      console.error('Verification error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.message,
        error: error.message,
        data: error.response?.data,
      });
      
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          'Payment verification failed. Please try again.'
      );
    }
  }
);

const planPurchaseSlice = createSlice({
  name: 'planPurchase',
  initialState,
  reducers: {
    // Clear errors
    clearErrors: state => {
      state.error = null;
      state.orderError = null;
      state.verifyError = null;
    },

    // Clear current order
    clearCurrentOrder: state => {
      state.currentOrder = null;
    },

    // Reset state
    resetPlanPurchase: () => initialState,
  },
  extraReducers: builder => {
    builder
      // Get active plan
      .addCase(getActivePlan.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getActivePlan.fulfilled, (state, action) => {
        state.loading = false;
        // Extract values from API response
        const apiHasActivePlan = action.payload.hasActivePlan === true;
        const apiIsActive = action.payload.isActive === true;
        const apiRemainingDays = typeof action.payload.remainingDays === 'number' 
          ? action.payload.remainingDays 
          : 0;
        
        // Store raw values from API
        state.hasActivePlan = apiHasActivePlan;
        state.activePlan = action.payload.plan || null;
        state.purchaseDate = action.payload.purchaseDate || null;
        state.expiryDate = action.payload.expiryDate || null;
        state.remainingDays = apiRemainingDays;
        state.isActive = apiIsActive;
      })
      .addCase(getActivePlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // When API fails or returns error, assume no active plan
        state.hasActivePlan = false;
        state.activePlan = null;
        state.purchaseDate = null;
        state.expiryDate = null;
        state.remainingDays = 0;
        state.isActive = false;
      })

      // Create plan order
      .addCase(createPlanOrder.pending, state => {
        state.orderLoading = true;
        state.orderError = null;
      })
      .addCase(createPlanOrder.fulfilled, (state, action) => {
        state.orderLoading = false;
        state.currentOrder = action.payload;
      })
      .addCase(createPlanOrder.rejected, (state, action) => {
        state.orderLoading = false;
        state.orderError = action.payload;
      })

      // Verify plan payment
      .addCase(verifyPlanPayment.pending, state => {
        state.verifyLoading = true;
        state.verifyError = null;
      })
      .addCase(verifyPlanPayment.fulfilled, (state, action) => {
        state.verifyLoading = false;
        state.hasActivePlan = true;
        state.activePlan = action.payload.plan;
        state.purchaseDate = action.payload.purchaseDate;
        state.expiryDate = action.payload.expiryDate;
        state.remainingDays = action.payload.remainingDays;
        state.isActive = action.payload.isActive;
        state.currentOrder = null;
      })
      .addCase(verifyPlanPayment.rejected, (state, action) => {
        state.verifyLoading = false;
        state.verifyError = action.payload;
      });
  },
});

export const { clearErrors, clearCurrentOrder, resetPlanPurchase } =
  planPurchaseSlice.actions;

export default planPurchaseSlice.reducer;

