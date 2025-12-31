import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import instance from '../../Utils/AxiosInstance';
import NotificationService from '../../Services/NotificationService';

// Function to register the device token after login or signup
const registerDeviceToken = async userId => {
  try {
    // Request permission first before getting token
    const hasPermission = await NotificationService.requestPermission();
    if (!hasPermission) {
      console.warn('Notification permission not granted, skipping token registration');
      return;
    }

    // Get FCM token after permission is granted
    const token = await NotificationService.getFCMToken();
    if (token && userId) {
      const result = await NotificationService.registerToken(userId, token);
      if (result.success) {
        console.log('Device token registered successfully');
      } else {
        console.warn('Failed to register device token:', result.error);
      }
    }
  } catch (error) {
    console.error('Error in registerDeviceToken:', error);
  }
};

// Function to remove device token
const removeDeviceToken = async () => {
  try {
    const token = await AsyncStorage.getItem('fcm_token');
    if (token) {
      const result = await NotificationService.removeToken(token);
      if (result.success) {
        console.log('Device token removed successfully');
      } else {
        console.warn('Failed to remove device token:', result.error);
      }
      // Remove token from local storage
      await AsyncStorage.removeItem('fcm_token');
    }
  } catch (error) {
    console.error('Error in removeDeviceToken:', error);
  }
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
        roleId,
        isMobileVerified,
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
            roleId,
            isMobileVerified,
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
          roleId,
          isMobileVerified,
        };
      } else {
        return rejectWithValue('Invalid credentials'); // Handle invalid response data
      }
    } catch (error) {
      // If there is a network issue or other API issues, capture the error and pass it to rejectWithValue
      console.error('Login error:', error.response?.data?.message || error.message);
      if (
        error.response &&
        error.response.data &&
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
  async (formData, {rejectWithValue}) => {
    try {
      const response = await instance.post('auth/signup', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Backend returns { message, user, token }
      const {user, token} = response.data;

      // If token and user info are present, save to AsyncStorage
      if (token && user._id) {
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem(
          'user',
          JSON.stringify({
            _id: user._id,
            email: user.email,
            userName: user.userName,
            mobileNo: user.mobileNo,
            address: user.address,
            aadharCardNo: user.aadharCardNo,
            profileImage: user.profileImage,
            roleId: user.roleId,
            isMobileVerified: user.isMobileVerified,
          }),
        );

        // Register the device token after user registration
        await registerDeviceToken(user._id);
      }

      return {
        user,
        token,
      };
    } catch (error) {
      // Handle error response structure from backend
      if (error.response && error.response.data) {
        // Backend returns { message: "..." } or { message: "...", missingFields: [...] }
        const errorData = error.response.data;
        if (errorData.message) {
          // If missingFields exist, include them in the error
          if (errorData.missingFields) {
            return rejectWithValue({
              message: errorData.message,
              missingFields: errorData.missingFields,
            });
          }
          return rejectWithValue(errorData.message);
        }
        return rejectWithValue(errorData);
      }
      return rejectWithValue('Registration failed. Please try again.');
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
      return response.data;
    } catch (error) {
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
  async (_, {rejectWithValue}) => {
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
      // Cleanup notification handlers
      NotificationService.cleanup();
    },

    setUser: (state, action) => {
      // Preserve roleId if it exists in current state and is missing in payload
      const currentRoleId = state.user?.roleId;
      const payloadRoleId = action.payload?.roleId;
      
      state.user = {
        ...action.payload,
        // Preserve roleId if payload doesn't have it but current state does
        roleId: payloadRoleId !== undefined && payloadRoleId !== null 
          ? payloadRoleId 
          : currentRoleId !== undefined && currentRoleId !== null 
            ? currentRoleId 
            : action.payload?.roleId,
      };
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
        if (action.payload.token) {
          state.user = action.payload.user;
          state.token = action.payload.token;
        } else {
          state.error = 'Registration failed';
        }
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
