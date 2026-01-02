/**
 * @format
 */
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  // DO NOT display notification here - Firebase will auto-display it
  // This handler is only for processing, not displaying
});

AppRegistry.registerComponent(appName, () => App);
