/**
 * @format
 */
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Import Firebase app first to ensure it's initialized
import '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';

// Set up background message handler only if Firebase is configured
try {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    // DO NOT display notification here - Firebase will auto-display it
    // This handler is only for processing, not displaying
  });
} catch (error) {
  console.warn('Firebase messaging setup failed:', error.message);
}

AppRegistry.registerComponent(appName, () => App);
