import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import instance from '../../Utils/AxiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState = {
  // Subscription plans data
  plans: [],
  selectedPlan: null,
  
  // User subscription data
  activeSubscription: null,
  hasActiveSubscription: false,
  
  // Order/ data
  currentOrdpaymenter: null,
  
  // Loading states
  loading: false,
  plansLoading: false,
  purchaseLoading: false,
  subscriptionLoading: false,
  
  // Error states
  error: null,
  plansError: null,
  purchaseError: null,
  
  // Subscription stats
  stats: null,
};

// Get all subscription plans
export const getSubscriptionPlans = createAsyncThunk(
  'subscription/getSubscriptionPlans',
  async (_, { rejectWithValue }) => {
    try {
      const response = await instance.get('subscription/plans');
      
      return {
        plans: response.data.data || [],
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch subscription plans'
      );
    }
  }
);

// Create Razorpay order
export const createSubscriptionOrder = createAsyncThunk(
  'subscription/createSubscriptionOrder',
  async (subscriptionId, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return rejectWithValue('User is not authenticated');
      }

      const response = await instance.post(
        'subscription/create-order',
        { subscriptionId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to create payment order'
      );
    }
  }
);

// Verify payment and activate subscription
export const verifyPayment = createAsyncThunk(
  'subscription/verifyPayment',
  async (paymentData, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return rejectWithValue('User is not authenticated');
      }

      const response = await instance.post(
        'subscription/verify-payment',
        paymentData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Payment verification failed'
      );
    }
  }
);

// Get user's active subscription
export const getActiveSubscription = createAsyncThunk(
  'subscription/getActiveSubscription',
  async (_, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return rejectWithValue('User is not authenticated');
      }

      const response = await instance.get('subscription/my-subscription', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch subscription status'
      );
    }
  }
);

// Check subscription status before loan creation
export const checkSubscriptionStatus = createAsyncThunk(
  'subscription/checkSubscriptionStatus',
  async (_, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return rejectWithValue('User is not authenticated');
      }

      const response = await instance.get('subscription/my-subscription', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to check subscription'
      );
    }
  }
);

// Get subscription stats
export const getSubscriptionStats = createAsyncThunk(
  'subscription/getSubscriptionStats',
  async (_, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return rejectWithValue('User is not authenticated');
      }

      const response = await instance.get('subscription/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch subscription stats'
      );
    }
  }
);

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    // Clear errors
    clearErrors: (state) => {
      state.error = null;
      state.plansError = null;
      state.purchaseError = null;
    },
    
    // Select a plan
    selectPlan: (state, action) => {
      state.selectedPlan = action.payload;
    },
    
    // Clear selected plan
    clearSelectedPlan: (state) => {
      state.selectedPlan = null;
    },
    
    // Clear current order
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    
    // Set Razorpay payment result
    setPaymentResult: (state, action) => {
      state.paymentResult = action.payload;
    },
    
    // Reset subscription state
    resetSubscription: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Get all subscription plans
      .addCase(getSubscriptionPlans.pending, (state) => {
        state.plansLoading = true;
        state.plansError = null;
      })
      .addCase(getSubscriptionPlans.fulfilled, (state, action) => {
        state.plansLoading = false;
        state.plans = action.payload.plans;
      })
      .addCase(getSubscriptionPlans.rejected, (state, action) => {
        state.plansLoading = false;
        state.plansError = action.payload;
      })

      // Create subscription order
      .addCase(createSubscriptionOrder.pending, (state) => {
        state.purchaseLoading = true;
        state.purchaseError = null;
      })
      .addCase(createSubscriptionOrder.fulfilled, (state, action) => {
        state.purchaseLoading = false;
        state.currentOrder = action.payload;
      })
      .addCase(createSubscriptionOrder.rejected, (state, action) => {
        state.purchaseLoading = false;
        state.purchaseError = action.payload;
      })

      // Verify payment
      .addCase(verifyPayment.pending, (state) => {
        state.purchaseLoading = true;
        state.purchaseError = null;
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.purchaseLoading = false;
        state.activeSubscription = action.payload.subscription;
        state.hasActiveSubscription = true;
        state.currentOrder = null;
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.purchaseLoading = false;
        state.purchaseError = action.payload;
      })

      // Get active subscription
      .addCase(getActiveSubscription.pending, (state) => {
        state.subscriptionLoading = true;
        state.error = null;
      })
      .addCase(getActiveSubscription.fulfilled, (state, action) => {
        state.subscriptionLoading = false;
        state.activeSubscription = action.payload.data;
        state.hasActiveSubscription = action.payload.hasActiveSubscription;
      })
      .addCase(getActiveSubscription.rejected, (state, action) => {
        state.subscriptionLoading = false;
        state.error = action.payload;
        state.hasActiveSubscription = false;
      })

      // Check subscription status
      .addCase(checkSubscriptionStatus.pending, (state) => {
        state.subscriptionLoading = true;
        state.error = null;
      })
      .addCase(checkSubscriptionStatus.fulfilled, (state, action) => {
        state.subscriptionLoading = false;
        state.hasActiveSubscription = action.payload.hasActiveSubscription;
      })
      .addCase(checkSubscriptionStatus.rejected, (state, action) => {
        state.subscriptionLoading = false;
        state.error = action.payload;
        state.hasActiveSubscription = false;
      })

      // Get subscription stats
      .addCase(getSubscriptionStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSubscriptionStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(getSubscriptionStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearErrors,
  selectPlan,
  clearSelectedPlan,
  clearCurrentOrder,
  setPaymentResult,
  resetSubscription,
} = subscriptionSlice.actions;

export default subscriptionSlice.reducer;