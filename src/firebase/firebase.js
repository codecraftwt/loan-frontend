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
      if (enabled) {
        console.log('Notification permission granted:', authStatus);
      } else {
        console.log('Notification permission NOT granted:', authStatus);
      }
    })
    .catch(error => console.log('Notification permission error:', error));
};
