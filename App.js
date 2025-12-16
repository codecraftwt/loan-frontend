import React, {useEffect, useRef} from 'react';
import {StatusBar} from 'react-native';
import Navigation from './src/Navigations/Navigations';
import {PaperProvider} from 'react-native-paper';
import {NavigationContainer} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import {toastConfig} from './src/Utils/toastConfig';
import {Provider} from 'react-redux';
import store from './src/Redux/store/store';
// NOTE: Push notification setup is temporarily disabled while resolving
// iOS NativeEventEmitter issues with notification libraries.
// import PushNotification from 'react-native-push-notification';
// import {setupFirebaseNotifications} from './src/firebase/firebase';
export default function App() {
  useEffect(() => {
    // Setup Firebase push notifications when the app starts
    // setupFirebaseNotifications();
  }, []);
  return (
    <Provider store={store}>
      <PaperProvider>
        <NavigationContainer>
          {/* Set the StatusBar color here */}
          <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
          <Navigation />
          <Toast config = {toastConfig} />
        </NavigationContainer>
      </PaperProvider>
    </Provider>
  );
}