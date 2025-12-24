import React, {useEffect} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  StatusBar,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {logo} from '../../Assets';
import {useDispatch} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {setUser} from '../../Redux/Slices/authslice';
import {m} from 'walstar-rn-responsive';

export default function SplashScreen({navigation}) {
  const dispatch = useDispatch();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);
  const textAnim = new Animated.Value(0);

  useEffect(() => {
    // Animation sequence
    Animated.sequence([
      // Logo fade in and scale
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // Text fade in
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const user = await AsyncStorage.getItem('user');
          if (user) {
            dispatch(setUser(JSON.parse(user)));
          }
          navigation.replace('BottomNavigation');
        } else {
          navigation.replace('Login');
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        navigation.replace('Login');
      }
    };

    setTimeout(() => {
      checkLoginStatus();
    }, 2500); // Increased slightly for better animation visibility
  }, [dispatch, navigation]);

  return (
    <LinearGradient
      colors={['#ff6700', '#ff7900', '#ff8500', '#ff9100']}
      style={styles.container}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}>
      <StatusBar barStyle="light-content" backgroundColor="#ff6700" />
      
      {/* Animated Logo Container */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{scale: scaleAnim}],
          },
        ]}>
        <View style={styles.logoWrapper}>
          {/* Optional: Add a subtle shadow/glow effect */}
          <View style={styles.logoGlow} />
          <Image
            resizeMode="contain"
            style={styles.logo}
            source={logo}
          />
        </View>
      </Animated.View>

      {/* App Name with Animation */}
      <Animated.View
        style={[
          styles.appNameContainer,
          {
            opacity: textAnim,
            transform: [
              {
                translateY: textAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}>
        <Text style={styles.appName}>LoanHub</Text>
      </Animated.View>

      {/* Tagline with Animation */}
      <Animated.View
        style={[
          styles.taglineContainer,
          {
            opacity: textAnim,
          },
        ]}>
        <Text style={styles.tagline}>Smart Loan Management</Text>
      </Animated.View>

      {/* Loading Indicator */}
      <View style={styles.loadingContainer}>
        <View style={styles.loadingDots}>
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>
      </View>

      {/* Optional: Add decorative elements */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: m(20),
  },
  logoWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: m(280),
    height: m(280),
    borderRadius: m(140),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 0,
  },
  logo: {
    width: m(250),
    height: m(150),
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  appNameContainer: {
    marginBottom: m(8),
  },
  appName: {
    fontSize: m(42),
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
    letterSpacing: 1,
  },
  taglineContainer: {
    marginBottom: m(40),
  },
  tagline: {
    fontSize: m(18),
    color: '#FFFFFF',
    fontWeight: '300',
    letterSpacing: 1.5,
    opacity: 0.9,
  },
  loadingContainer: {
    marginTop: m(30),
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
  },
  dot: {
    width: m(12),
    height: m(12),
    borderRadius: m(6),
    backgroundColor: '#FFFFFF',
    opacity: 0.7,
  },
  dot1: {
    animationDelay: '0s',
    animationDuration: '1s',
    animationIterationCount: 'infinite',
    animationName: 'bounce',
  },
  dot2: {
    animationDelay: '0.2s',
    animationDuration: '1s',
    animationIterationCount: 'infinite',
    animationName: 'bounce',
  },
  dot3: {
    animationDelay: '0.4s',
    animationDuration: '1s',
    animationIterationCount: 'infinite',
    animationName: 'bounce',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -m(100),
    right: -m(100),
    width: m(300),
    height: m(300),
    borderRadius: m(150),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    zIndex: 0,
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -m(80),
    left: -m(80),
    width: m(250),
    height: m(250),
    borderRadius: m(125),
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    zIndex: 0,
  },
});

// Add keyframes for bounce animation
StyleSheet.create({
  '@keyframes bounce': {
    '0%, 100%': {
      transform: [{translateY: 0}],
    },
    '50%': {
      transform: [{translateY: -m(10)}],
    },
  },
});