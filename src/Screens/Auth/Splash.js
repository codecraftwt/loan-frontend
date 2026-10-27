import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  StatusBar,
  Animated,
  SafeAreaView,
} from 'react-native';
import {useDispatch} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {setUser} from '../../Redux/Slices/authslice';
import {m} from 'walstar-rn-responsive';
import {FontFamily, colors} from '../../constants';
import {spalshlogo} from '../../Assets';

export default function SplashScreen({navigation}) {
  const dispatch = useDispatch();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const textAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Smooth entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 65,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Check login state and navigate
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const storedUser = await AsyncStorage.getItem('user');
          if (storedUser) {
            dispatch(setUser({ ...JSON.parse(storedUser), token }));
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
    }, 2000);

    return () => clearTimeout(timer);
  }, [dispatch, navigation, fadeAnim, scaleAnim, textAnim]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.primary}
        translucent={false}
      />
      <View style={styles.container}>
        {/* Main Centered Content */}
        <Animated.View
          style={[
            styles.brandWrapper,
            {
              opacity: fadeAnim,
              transform: [{scale: scaleAnim}],
            },
          ]}>
          {/* Logo image from Assets/spalshlogo.png */}
          <View style={styles.iconContainer}>
            <Image
              source={spalshlogo}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* App Name: Loan Hub with Poppins-Bold font */}
          <Animated.View
            style={[
              styles.textWrapper,
              {
                opacity: textAnim,
                transform: [
                  {
                    translateY: textAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [12, 0],
                    }),
                  },
                ],
              },
            ]}>
            <Text style={styles.appName}>Loan Hub</Text>
          </Animated.View>
        </Animated.View>

        {/* Bottom Tagline */}
        <Animated.View
          style={[
            styles.bottomContainer,
            {
              opacity: textAnim,
            },
          ]}>
          <Text style={styles.tagline}>Simple Lending • Transparent Tracking</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: m(16),
  },
  logoImage: {
    width: m(120),
    height: m(120),
  },
  textWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: m(42),
    lineHeight: m(52),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: m(36),
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: m(20),
  },
  tagline: {
    fontSize: m(13),
    lineHeight: m(18),
    fontFamily: FontFamily.primaryMedium,
    color: 'rgba(255, 255, 255, 0.92)',
    textAlign: 'center',
    letterSpacing: 0.6,
  },
});
