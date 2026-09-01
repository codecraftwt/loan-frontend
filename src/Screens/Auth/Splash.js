import React, {useEffect, useRef} from 'react';
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
import {FontFamily, colors} from '../../constants';

export default function SplashScreen({navigation}) {
  const dispatch = useDispatch();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.84)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation sequence
    Animated.sequence([
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

    const dotLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(dotAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    dotLoop.start();

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

    const timer = setTimeout(() => {
      checkLoginStatus();
    }, 2500);

    return () => {
      clearTimeout(timer);
      dotLoop.stop();
    };
  }, [dispatch, navigation, dotAnim, fadeAnim, scaleAnim, textAnim]);

  const dotOpacity = dotAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 1],
  });

  return (
    <LinearGradient
      colors={[colors.navyDark, colors.navy, colors.navyLight]}
      style={styles.container}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navyDark} />

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
          <View style={styles.logoPlate}>
            <Image resizeMode="contain" style={styles.logo} source={logo} />
          </View>
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
        <Text style={styles.appName}>Loan Hub</Text>
      </Animated.View>

      {/* Tagline with Animation */}
      <Animated.View
        style={[
          styles.taglineContainer,
          {
            opacity: textAnim,
          },
        ]}>
        <Text style={styles.tagline}>Simple lending. Clear tracking.</Text>
      </Animated.View>

      {/* Loading Indicator */}
      <View style={styles.loadingDots}>
        <Animated.View style={[styles.dot, {opacity: dotOpacity}]} />
        <Animated.View
          style={[
            styles.dot,
            styles.dotMiddle,
            {
              opacity: dotOpacity,
              transform: [
                {
                  scale: dotAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.86, 1.15],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View style={[styles.dot, {opacity: dotOpacity}]} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: m(28),
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: m(18),
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPlate: {
    width: m(188),
    height: m(188),
    borderRadius: m(94),
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.navyDark,
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    width: m(154),
    height: m(94),
  },
  appNameContainer: {
    marginBottom: m(6),
  },
  appName: {
    fontSize: m(30),
    lineHeight: m(38),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
    textAlign: 'center',
  },
  taglineContainer: {
    marginBottom: m(34),
  },
  tagline: {
    fontSize: m(14),
    lineHeight: m(20),
    color: 'rgba(255, 255, 255, 0.84)',
    fontFamily: FontFamily.bodyMedium,
    textAlign: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: m(4),
  },
  dot: {
    width: m(8),
    height: m(8),
    borderRadius: m(4),
    backgroundColor: '#FFFFFF',
    marginHorizontal: m(4),
  },
  dotMiddle: {
    backgroundColor: colors.butter,
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
