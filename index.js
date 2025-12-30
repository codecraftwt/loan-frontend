/**
 * @format
 */
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  
  // Log mobile number change notification for lenders
  if (remoteMessage?.data?.type === 'mobile_number_change') {
    console.log('📱 MOBILE NUMBER CHANGE NOTIFICATION (BACKGROUND HANDLER)');
  }
  
  // DO NOT display notification here - Firebase will auto-display it
  // This handler is only for processing/logging, not displaying
});

AppRegistry.registerComponent(appName, () => App);
