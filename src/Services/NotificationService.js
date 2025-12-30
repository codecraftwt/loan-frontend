import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import notifee from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import instance from '../Utils/AxiosInstance';

class NotificationService {
  constructor() {
    this.foregroundUnsubscribe = null;
    this.notificationOpenedUnsubscribe = null;
    this.tokenRefreshUnsubscribe = null;
    this.navigation = null;
    this.notifeeHandlersSetup = false;
  }

  async requestPermission() {
    try {      
      if (Platform.OS === 'android') {
        // For Android 13+ (API 33+), explicit permission is required
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Notification Permission',
              message: 'This app needs notification permission to send you loan updates',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            return false;
          }
        } else {
          // For Android < 13, notifications are enabled by default
          // But we still need to request Firebase permission
          try {
            const authStatus = await messaging().requestPermission();
          } catch (err) {
            console.log('Firebase permission request failed, but notifications may still work');
          }
        }
      } else {
        // For iOS
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in Settings to receive loan updates'
          );
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  }

  /**
   * Get FCM token
   */
  async getFCMToken() {
    try {
      const token = await messaging().getToken();
      
      // Store token locally
      await AsyncStorage.setItem('fcm_token', token);
      
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Register token with backend
   */
  async registerToken(userId, token) {
    try {
      const response = await instance.post('user/register-device-token', {
        userId: userId,
        deviceToken: token,
      });

      const data = response.data;
      
      if (response.status === 200 || response.status === 201) {
        return { success: true, data };
      } else {
        console.error('Failed to register token:', data);
        return { success: false, error: data.message || 'Failed to register token' };
      }
    } catch (error) {
      console.error('Error registering token:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to register token';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Remove token from backend
   */
  async removeToken(token) {
    try {
      const response = await instance.post('user/remove-device-token', {
        deviceToken: token,
      });

      const data = response.data;
      
      if (response.status === 200 || response.status === 201) {
        return { success: true, data };
      } else {
        console.error('Failed to remove token:', data);
        return { success: false, error: data.message || 'Failed to remove token' };
      }
    } catch (error) {
      console.error('Error removing token:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to remove token';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Set navigation reference
   */
  setNavigation(navigation) {
    this.navigation = navigation;
    if (navigation) {
      console.log('Navigation object:', typeof navigation.navigate);
    }
  }

// Setup notification handlers
  setupNotificationHandlers() {
    // Prevent duplicate handlers
    if (this.foregroundUnsubscribe) {
      return;
    }

    // Handle foreground messages
    this.foregroundUnsubscribe = messaging().onMessage(async remoteMessage => {
      
      // Log specific notification types
      if (remoteMessage?.data?.type === 'mobile_number_change') {
        console.log('Mobile number change notification detected in foreground handler');
      }
      
      this.displayNotification(remoteMessage);
    });

    // Handle notification opened from quit state
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          
          setTimeout(() => {
            // Only navigate, don't mark as read
            this.handleNotificationPress(remoteMessage);
          }, 1000); // Wait for navigation to be ready
        }
      });

    // Handle notification opened from background
    this.notificationOpenedUnsubscribe = messaging().onNotificationOpenedApp(
      remoteMessage => {
        if (!this.navigation) {
          console.error('Navigation not available when notification opened from background!');
          // Wait a bit for navigation to be ready
          setTimeout(() => {
            if (this.navigation) {
              this.handleNotificationPress(remoteMessage);
            } else {
              console.error('Navigation still not available after delay!');
            }
          }, 500);
          return;
        }
        
        // Only navigate, don't mark as read
        this.handleNotificationPress(remoteMessage);
      }
    );

    // Setup token refresh listener
    this.setupTokenRefresh();
  }

  /**
   * Handle notification press/navigation
   */
  handleNotificationPress(remoteMessage) {
    if (!this.navigation) {
      console.error('Navigation not available in NotificationService!');
      console.error('Please ensure navigation is set via NotificationService.setNavigation()');
      // Retry after a delay in case navigation is being set
      setTimeout(() => {
        if (this.navigation) {
          this.handleNotificationPress(remoteMessage);
        } else {
          console.error('❌ Navigation still not available after retry!');
        }
      }, 1000);
      return;
    }

    const { data } = remoteMessage;

    
    if (data) {
      // Navigate based on notification data
      if (data.screen) {
        switch (data.screen) {
          case 'Outward':
            // Navigate to Outward screen with borrower data if available
            const navigationParams = {};
            
            // Add borrower ID or mobile number for highlighting
            if (data.borrowerId) {
              navigationParams.highlightBorrowerId = data.borrowerId;
            }
            if (data.mobileNumber) {
              navigationParams.highlightMobileNumber = data.mobileNumber;
            }
            if (data.loanId) {
              navigationParams.loanId = data.loanId;
            }
            
            // Add notification ID for mark as read
            if (data.notificationId) {
              navigationParams.notificationId = data.notificationId;
            }
            
            // Add notification type
            if (data.type) {
              navigationParams.notificationType = data.type;
            }
            try {
              this.navigation.navigate('Outward', navigationParams);
            } catch (error) {
              console.error('Navigation error:', error);
              console.error('Error details:', error.message);
              // Fallback navigation
              try {
                this.navigation.navigate('BottomNavigation');
              } catch (fallbackError) {
                console.error('Fallback navigation also failed:', fallbackError);
              }
            }
            break;
          case 'Inward':
            this.navigation.navigate('LoanRequest');
            break;
          default:
            // Try to navigate to the screen name directly
            try {
              this.navigation.navigate(data.screen);
            } catch (error) {
              // Fallback to home
              this.navigation.navigate('BottomNavigation');
            }
        }
      } else {
        // Default navigation
        this.navigation.navigate('BottomNavigation');
      }
      
      // Handle specific notification types - navigate to Outward with borrower info
      if (data.type === 'mobile_number_change') {
        const navigationParams = {};
        if (data.borrowerId) {
          navigationParams.highlightBorrowerId = data.borrowerId;
        }
        if (data.mobileNumber) {
          navigationParams.highlightMobileNumber = data.mobileNumber;
        }
        if (data.notificationId) {
          navigationParams.notificationId = data.notificationId;
        }
        navigationParams.notificationType = 'mobile_number_change';
        
        try {
          this.navigation.navigate('Outward', navigationParams);
        } catch (error) {
          console.error('Navigation error (mobile number change):', error);
          // Fallback navigation
          try {
            this.navigation.navigate('BottomNavigation');
          } catch (fallbackError) {
            console.error('Fallback navigation failed:', fallbackError);
          }
        }
      }
    } else {
      // Default navigation
      this.navigation.navigate('BottomNavigation');
    }
  }

  /**
   * Display notification (for foreground)
   */
  async displayNotification(remoteMessage) {
    const { notification, data } = remoteMessage;
    
    // Create notification channel for Android (required for Notifee)
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: 'loan_notifications',
        name: 'Loan Notifications',
        importance: 4, // HIGH
        sound: 'default',
        vibration: true,
      });
    }
    
    // Display notification using Notifee for better appearance
    try {
      // Add notification ID to data for tracking
      const notificationData = {
        ...(data || {}),
        notificationId: data?.notificationId || `notif_${Date.now()}`,
        timestamp: Date.now().toString(),
      };

      await notifee.displayNotification({
        title: notification?.title || 'Notification',
        body: notification?.body || '',
        data: notificationData,
        android: {
          channelId: 'loan_notifications',
          importance: 4, // HIGH
          sound: 'default',
          pressAction: {
            id: 'default',
          },
          // Add action buttons
          actions: [
            {
              title: 'Mark as Read',
              pressAction: {
                id: 'mark_as_read',
              },
            },
          ],
          // Add color for better visibility
          color: '#b80266', // Your app's primary color
          // Use app launcher icon as notification icon (should exist in your app)
          // To use custom icon: add ic_notification.png to android/app/src/main/res/drawable/
          smallIcon: 'ic_launcher',
          showTimestamp: true,
        },
        ios: {
          sound: 'default',
          foregroundPresentationOptions: {
            alert: true,
            badge: true,
            sound: true,
          },
          // Add action buttons for iOS
          categoryId: 'LOAN_NOTIFICATIONS',
          // iOS actions will be handled via categories
        },
      });
    } catch (error) {
      console.error('Error displaying notification with Notifee:', error);
      // Fallback to Alert if Notifee fails
      if (notification) {
        Alert.alert(
          notification.title || 'Notification',
          notification.body || '',
          [
            { 
              text: 'OK',
              onPress: () => {
                if (data) {
                  this.handleNotificationPress(remoteMessage);
                }
              }
            }
          ]
        );
      }
    }
  }

  /**
   * Initialize Notifee event handlers (called once during setup)
   */
  setupNotifeeEventHandlers() {
    // Prevent duplicate event handlers
    if (this.notifeeHandlersSetup) {
      return;
    }

    // Listen for notification press events when app is in foreground
    notifee.onForegroundEvent(async ({ type, detail }) => {
      // Type 1 = PRESS (notification body tapped)
      // Type 0 = ACTION_PRESS (action button tapped)
      
      if (type === 1) { // PRESS - notification body was tapped (navigate only, don't mark as read)
        
        if (!this.navigation) {
          console.error('Navigation not available when notification tapped!');
          // Wait a bit for navigation to be ready
          setTimeout(() => {
            if (this.navigation && detail.notification?.data) {
              const mockRemoteMessage = {
                notification: {
                  title: detail.notification.title,
                  body: detail.notification.body,
                },
                data: detail.notification.data,
              };
              this.handleNotificationPress(mockRemoteMessage);
            }
          }, 500);
          return;
        }
        
        if (detail.notification?.data) {
          // Create a mock remoteMessage object for navigation
          const mockRemoteMessage = {
            notification: {
              title: detail.notification.title,
              body: detail.notification.body,
            },
            data: detail.notification.data,
          };
          // Only navigate, don't mark as read
          this.handleNotificationPress(mockRemoteMessage);
        } else {
          console.error('❌ No notification data available!');
        }
      } else if (type === 0) { // ACTION_PRESS - action button was pressed
        if (detail.pressAction?.id === 'mark_as_read') {
          await this.markNotificationAsRead(detail.notification?.data?.notificationId);
          // Dismiss the notification
          if (detail.notification?.id) {
            await notifee.cancelNotification(detail.notification.id);
          }
        } else if (detail.pressAction?.id === 'default') {
          // Default action pressed - navigate but don't mark as read
          if (detail.notification?.data && this.navigation) {
            const mockRemoteMessage = {
              notification: {
                title: detail.notification.title,
                body: detail.notification.body,
              },
              data: detail.notification.data,
            };
            this.handleNotificationPress(mockRemoteMessage);
          }
        }
      }
    });

    this.notifeeHandlersSetup = true;
  }

  /**
   * Setup token refresh listener
   */
  setupTokenRefresh() {
    this.tokenRefreshUnsubscribe = messaging().onTokenRefresh(async token => {      
      // Update stored token
      await AsyncStorage.setItem('fcm_token', token);
      
      // Re-register with backend if user is logged in
      try {
        const user = await AsyncStorage.getItem('user');
        if (user) {
          const userData = JSON.parse(user);
          if (userData._id) {
            const result = await this.registerToken(userData._id, token);
            if (result.success) {
              console.log('Token refreshed and re-registered successfully');
            }
          }
        }
      } catch (error) {
        console.error('Error re-registering refreshed token:', error);
      }
    });
  }

  /**
   * Initialize notifications
   */
  async initialize(userId, navigation) {
    try {
      // Set navigation reference
      if (navigation) {
        this.setNavigation(navigation);
      }

      // Request permission first
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.warn('⚠️ Notification permission not granted');
        return { success: false, error: 'Permission denied' };
      }

      // Get token after permission is granted
      const token = await this.getFCMToken();
      if (!token) {
        return { success: false, error: 'Failed to get FCM token' };
      }

      // Register with backend
      if (userId) {
        const registerResult = await this.registerToken(userId, token);
        if (!registerResult.success) {
          console.warn('Failed to register token:', registerResult.error);
          // Don't fail initialization if registration fails, token might still work
        } else {
          console.log('Token registered with backend');
        }
      }

      // Setup handlers (only once)
      if (!this.foregroundUnsubscribe) {
        this.setupNotificationHandlers();
        this.setupNotifeeEventHandlers();
      }

      return { success: true, token };
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cleanup
   */
  cleanup() {
    if (this.foregroundUnsubscribe) {
      this.foregroundUnsubscribe();
      this.foregroundUnsubscribe = null;
    }
    if (this.notificationOpenedUnsubscribe) {
      this.notificationOpenedUnsubscribe();
      this.notificationOpenedUnsubscribe = null;
    }
    if (this.tokenRefreshUnsubscribe) {
      this.tokenRefreshUnsubscribe();
      this.tokenRefreshUnsubscribe = null;
    }
    this.navigation = null;
  }
}

export default new NotificationService();

