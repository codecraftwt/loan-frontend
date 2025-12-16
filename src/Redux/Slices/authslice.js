import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import instance from '../../Utils/AxiosInstance';
// NOTE: Firebase cloud messaging is temporarily disabled on iOS while
// resolving NativeEventEmitter issues. The token registration helpers
// are currently no-ops to avoid runtime crashes.
// import messaging from '@react-native-firebase/messaging';

// Function to register the device token after login or signup
const registerDeviceToken = async userId => {
  // Temporarily disabled to prevent FCM from initializing while
  // investigating NativeEventEmitter issues on iOS.
  console.log('registerDeviceToken skipped for user:', userId);
};

// Function to remove device token
const removeDeviceToken = async () => {
  // Temporarily disabled to prevent FCM from initializing while
  // investigating NativeEventEmitter issues on iOS.
  console.log('removeDeviceToken skipped');
};

// Thunk for user login
export const login = createAsyncThunk(
  'auth/signin',
  async ({emailOrMobile, password}, {rejectWithValue}) => {
    try {
      const response = await instance.post('auth/signin', {
        emailOrMobile,
        password,
      });

      // Destructure user data and token from the response
      const {
        token,
        _id,
        email,
        userName,
        mobileNo,
        address,
        aadharCardNo,
        profileImage,
      } = response.data;

      // If token and user info are present, save to AsyncStorage
      if (token && _id) {
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem(
          'user',
          JSON.stringify({
            _id,
            email,
            userName,
            mobileNo,
            address,
            aadharCardNo,
            profileImage,
          }),
        );

        await registerDeviceToken(_id);

        return {
          token,
          _id,
          email,
          userName,
          mobileNo,
          address,
          aadharCardNo,
          profileImage,
        };
      } else {
        return rejectWithValue('Invalid credentials'); // Handle invalid response data
      }
    } catch (error) {
      // If there is a network issue or other API issues, capture the error and pass it to rejectWithValue
      console.error('Login error:', error.response.data.message);
      if (
        error.response ||
        error.response.data ||
        error.response.data.message
      ) {
        return rejectWithValue(error.response.data.message);
      } else {
        return rejectWithValue('Network error, please try again later.'); // Fallback error message
      }
    }
  },
);

// Thunk for user registration
export const registerUser = createAsyncThunk(
  'auth/signup',
  async (userData, {rejectWithValue}) => {
    try {
      const response = await instance.post('auth/signup', userData);

      // Get the user ID from the response
      const {_id} = response.data.user;

      // Register the device token after user registration
      await registerDeviceToken(_id);

      console.log(response.data, 'Success');
      return response.data;
    } catch (error) {
      console.log(error, 'error');
      return rejectWithValue(error.response.data);
    }
  },
);

export const updateUser = createAsyncThunk(
  'user/update-user',
  async (userData, {rejectWithValue}) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return rejectWithValue('User is not authenticated');
      }

      const response = await instance.patch('user/update-profile', {
        userData,
      });
      console.log(response.data, 'Success');
      return response.data;
    } catch (error) {
      console.log(error, 'error');
      return rejectWithValue(
        error.response ? error.response.data : error.message,
      );
    }
  },
);

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (formData, thunkAPI) => {
    try {
      const response = await instance.post(
        'user/uploadProfileImage',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const deleteProfileImage = createAsyncThunk(
  'user/deleteProfileImage',
  async (_, {rejectWithValue}) => {
    try {
      const response = await instance.delete('user/delete-profile-image');
      return response.data;
    } catch (error) {
      console.error(
        'Delete Profile Image error:',
        error.response?.data?.message,
      );
      return rejectWithValue(
        error.response?.data?.message ||
          'An error occurred while deleting the profile image.',
      );
    }
  },
);

export const forgotPassword = createAsyncThunk(
  'auth/forgot-password',
  async (email, {rejectWithValue}) => {
    try {
      const response = await instance.post('auth/forgot-password', {email});
      return response.data; // Success response, typically a message like "OTP sent"
    } catch (error) {
      console.error('Forgot Password error:', error);
      return rejectWithValue(
        error.response?.data?.message ||
          'An error occurred. Please try again later.',
      );
    }
  },
);

export const verifyOtp = createAsyncThunk(
  'auth/verify-otp',
  async (data, {rejectWithValue}) => {
    try {
      const response = await instance.post('auth/verify-otp', data);
      return response.data;
    } catch (error) {
      console.error('Verify OTP error:', error.response?.data?.message);
      return rejectWithValue(
        error.response?.data?.message ||
          'An error occurred. Please try again later.',
      );
    }
  },
);

// Thunk for resetting password
export const resetPassword = createAsyncThunk(
  'auth/reset-password',
  async ({email, otp, newPassword}, {rejectWithValue}) => {
    try {
      const response = await instance.post('auth/reset-password', {
        email,
        otp,
        newPassword,
      });
      return response.data; // Success response, typically a success message
    } catch (error) {
      console.error('Reset Password error:', error);
      return rejectWithValue(
        error.response?.data?.message ||
          'An error occurred. Please try again later.',
      );
    }
  },
);

export const removeUserDeviceToken = createAsyncThunk(
  'auth/remove-device-token',
  async ({rejectWithValue}) => {
    try {
      // Remove the device token from the backend
      await removeDeviceToken();
      return {message: 'Device token removed successfully'};
    } catch (error) {
      console.error('Remove device token error:', error);
      return rejectWithValue(
        'Error removing device token. Please try again later.',
      );
    }
  },
);

// Authentication slice
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    error: null,
    isLoading: false,
    isProfileLoading: false,
    forgotPasswordMessage: null, // For storing success message from forgot-password
    resetPasswordMessage: null,
  },
  reducers: {
    logout: state => {
      state.user = null;
      state.token = null;
      state.error = null;
      AsyncStorage.removeItem('token');
      AsyncStorage.removeItem('user');
    },

    setUser: (state, action) => {
      state.user = action.payload;
      state.token = action.payload.token;
    },
  },
  extraReducers: builder => {
    builder
      // Login reducers
      .addCase(login.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.token) {
          state.user = action.payload;
          state.token = action.payload.token;
        } else {
          state.error = 'Invalid email or password';
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.payload || 'Check your connection or try again later.';
      })

      // Register reducers
      .addCase(registerUser.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.payload || 'Registration failed. Please try again.';
        console.error(action.error.message);
      })

      // Update Profile reducers
      .addCase(updateUser.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          // Update user data in the state
          state.user = action.payload.user || action.payload;
        } else {
          state.error = 'Failed to update profile';
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.payload || 'Failed to update profile. Please try again later.';
      })

      // Forgot Password reducers
      .addCase(forgotPassword.pending, state => {
        state.isLoading = true;
        state.error = null;
        state.forgotPasswordMessage = null; // Reset the message when starting the request
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.forgotPasswordMessage = action.payload.message; // Store success message from the API response
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.payload || 'Error sending OTP. Please try again later.';
        state.forgotPasswordMessage = null;
      })

      // Reset Password reducers
      .addCase(resetPassword.pending, state => {
        state.isLoading = true;
        state.error = null;
        state.resetPasswordMessage = null; // Reset the message when starting the request
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.resetPasswordMessage = action.payload.message; // Store success message from the API response
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.payload || 'Error resetting password. Please try again later.';
      })

      .addCase(updateUserProfile.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          // Update user data in the state
          state.user = action.payload.user || action.payload;
        } else {
          state.error = 'Failed to update profile';
        }
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.payload || 'Failed to update profile. Please try again later.';
      })

      .addCase(deleteProfileImage.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteProfileImage.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.user) {
          state.user.profileImage = null;
        }
      })
      .addCase(deleteProfileImage.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.payload ||
          'Failed to delete profile image. Please try again later.';
      });
  },
});

// Export the logout action if needed
export const {logout, setUser} = authSlice.actions;

export default authSlice.reducer;
