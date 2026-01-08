import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  StatusBar,
  Platform,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/Feather';
import { m } from 'walstar-rn-responsive';
import { logo } from '../Assets';
import { FontFamily } from '../constants';

const Header = ({
  title,
  showBackButton = false,
  onBackPress,
  isEdit = false,
  onEditPress,
  showLogo = true,
}) => {
  const navigation = useNavigation();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  const handleEditPress = () => {
    if (onEditPress && typeof onEditPress === 'function') {
      onEditPress();
    } else {
      console.warn('onEditPress is not a function or is not provided');
    }
  };

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Gradient Status Bar */}
      <LinearGradient
        // colors={['#ff6700', '#ff7900', '#ff8500', '#ff9100']}
        colors={['#ff6700', '#ff8800ff', '#ff9100ff', '#ffa200ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientStatusBar}>
        <View style={styles.statusBarContent} />
      </LinearGradient>

      {/* Main Header */}
      <LinearGradient
        colors={['#ff6700', '#ff8800ff', '#ff9100ff', '#ffa200ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerBar}>
        <View style={styles.headerRow}>

          {/* LEFT: Back Button */}
          <View style={styles.leftContainer}>
            {showBackButton && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackPress}
                activeOpacity={0.7}>
                <Feather name="arrow-left" size={m(24)} color="#ffffff" />
              </TouchableOpacity>
            )}
          </View>

          {/* CENTER: Title */}
          <View style={styles.centerContainer}>
            <Text style={styles.headerText}>{title}</Text>
          </View>

          {/* RIGHT: Optional Logo or Edit Button */}
          <View style={styles.rightContainer}>
            {isEdit ? (
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEditPress}
                activeOpacity={0.7}>
                <Icon name="edit" size={m(24)} color="#FFF" />
              </TouchableOpacity>
            ) : showLogo ? (
              <Image source={logo} style={styles.logo} />
            ) : (
              <View style={{ width: m(50) }} />
            )}
          </View>

        </View>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  gradientStatusBar: {
    height: Platform.OS === 'android' ? StatusBar.currentHeight : m(44),
    width: '100%',
  },
  statusBarContent: {
    flex: 1,
  },
  headerBar: {
    height: m(90),
    paddingTop: Platform.OS === 'android' ? m(20) : m(0),
    borderBottomEndRadius: m(25),
    borderBottomStartRadius: m(25),
    overflow: 'hidden',
    marginTop: -1,
  },

  /* Flex row for left - center - right */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    paddingHorizontal: m(20),
  },
  leftContainer: {
    width: m(50),
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightContainer: {
    width: m(50),
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  backButton: {
    padding: m(8),
    borderRadius: m(20),
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  editButton: {
    padding: m(8),
    borderRadius: m(20),
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    color: '#ffffff',
    fontSize: m(20),
    fontFamily: FontFamily.secondaryBold,
    letterSpacing: m(1.2),
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: m(8),
    marginBottom: m(10),
  },
  logo: {
    width: m(65),
    height: m(32),
    resizeMode: 'contain',
    tintColor: '#ffffff',
  },
});

export default Header;
