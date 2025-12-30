import React, {useEffect, useRef} from 'react';
import {StatusBar} from 'react-native';
import Navigation from './src/Navigations/Navigations';
import {PaperProvider} from 'react-native-paper';
import {NavigationContainer} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import {toastConfig} from './src/Utils/toastConfig';
import {Provider, useSelector} from 'react-redux';
import store from './src/Redux/store/store';
import NotificationService from './src/Services/NotificationService';

function AppContent() {
  const navigationRef = useRef(null);
  const user = useSelector(state => state.auth?.user);
  const authToken = useSelector(state => state.auth?.token);
  const handlersInitialized = useRef(false);

  // Initialize notification handlers once when navigation is ready
  useEffect(() => {
    // Use a delayed check to ensure NavigationContainer is ready
    const timer = setTimeout(() => {
      if (navigationRef.current && !handlersInitialized.current) {
        NotificationService.setNavigation(navigationRef.current);
        NotificationService.setupNotificationHandlers();
        handlersInitialized.current = true;
      } else {
        console.warn('Navigation ref not ready yet, will retry...');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Update navigation reference when NavigationContainer is ready
  const onNavigationReady = () => {
    if (navigationRef.current) {
      NotificationService.setNavigation(navigationRef.current);
      if (!handlersInitialized.current) {
        NotificationService.setupNotificationHandlers();
        handlersInitialized.current = true;
      }
    }
  };

  // Initialize notifications when user logs in
  useEffect(() => {
    const initNotificationsForUser = async () => {
      if (user?._id && authToken && navigationRef.current) {
        try {
          // Ensure navigation is set
          NotificationService.setNavigation(navigationRef.current);
          
          // Always request permission and initialize notifications when user logs in
          const hasPermission = await NotificationService.requestPermission();
          if (hasPermission) {
            // Get or create FCM token
            const fcmToken = await NotificationService.getFCMToken();
            if (fcmToken) {
              // Register token with backend
              await NotificationService.registerToken(user._id, fcmToken);
            }
          } else {
            console.warn('Notification permission not granted');
          }
        } catch (error) {
          console.error('Error initializing notifications for user:', error);
        }
      }
    };

    if (user?._id) {
      // Small delay to ensure navigation is ready
      const timer = setTimeout(() => {
        initNotificationsForUser();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user?._id, authToken]);

  return (
    <NavigationContainer 
      ref={navigationRef}
      onReady={onNavigationReady}>
      {/* Set the StatusBar color here */}
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
      <Navigation />
      <Toast config={toastConfig} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <PaperProvider>
        <AppContent />
      </PaperProvider>
    </Provider>
  );
}