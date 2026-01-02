import messaging from '@react-native-firebase/messaging';

// Legacy function - kept for reference but should use NotificationService instead
export const setupFirebaseNotifications = () => {  
  // Request permission for notifications
  messaging()
    .requestPermission()
    .then(authStatus => {
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      // Permission status handled silently
    })
    .catch(error => {
      // Error handled silently
    });
};
