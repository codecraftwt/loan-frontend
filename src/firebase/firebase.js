import messaging from '@react-native-firebase/messaging';

// NOTE:
// react-native-push-notification is not fully compatible with React Native 0.77
// and is the source of the "new NativeEventEmitter() requires a non-null argument"
// crash on iOS. To keep the app running, we ONLY use Firebase Messaging here
// and avoid any NativeEventEmitter usage from that library.

// Initialize Firebase Messaging and handle push notifications (log-only)
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

  // Handle background notifications when app is in the background
  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log(
      'Notification caused app to open from background state:',
      remoteMessage?.notification,
    );

    if (remoteMessage?.data && remoteMessage.data.screen) {
      // navigation.navigate(remoteMessage.data.screen); // Navigate to the screen
      console.log('Navigating to screen from background notification');
    }
  });

  // Handle notifications when the app is fully closed and opened by a notification
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log(
          'Notification caused app to open from quit state:',
          remoteMessage.notification,
        );
      }

      if (remoteMessage?.data && remoteMessage.data.screen) {
        // navigation.navigate(remoteMessage.data.screen); // Navigate to the screen
        console.log('Navigating to screen from quit-state notification');
      }
    })
    .catch(error =>
      console.log('Error getting initial notification:', error),
    );

  // Handle foreground notifications (just log them for now)
  messaging().onMessage(async remoteMessage => {
    console.log(
      'Foreground notification received:',
      remoteMessage.notification,
      remoteMessage.data,
    );
  });
};
