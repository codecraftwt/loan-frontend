import {
  Platform,
  StyleSheet,
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  Keyboard,
  UIManager,
  LayoutAnimation,
} from 'react-native';
import React, { useMemo, useState, useEffect } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { m } from 'walstar-rn-responsive';
import { FontFamily, colors } from '../constants';

// Lender screens
import LenderDashboard from '../Screens/Lender/Dashboard/LenderDashboard';
import LenderIncomingRequests from '../Screens/Lender/Requests/LenderIncomingRequests';
import LenderLoansPortfolio from '../Screens/Lender/Loans/LenderLoansPortfolio';
import LenderAvailableBorrowers from '../Screens/Lender/Borrowers/LenderAvailableBorrowers';
import LenderProfileScreen from '../Screens/Lender/Profile/LenderProfileScreen';
import lenderFlowService from '../Services/lenderFlowService';

// Admin screens
import AdminDashboard from '../Screens/Admin/Dashboard/AdminDashboard';
import PlansList from '../Screens/Admin/Plans/PlansList';
import LenderList from '../Screens/Admin/Lenders/LenderList';
import AdminBorrowerList from '../Screens/Admin/Borrowers/AdminBorrowerList';
import AdminProfileScreen from '../Screens/Admin/Profile/AdminProfileScreen';

// Borrower screens
import BorrowerDashboard from '../Screens/Borrower/Dashboard/BorrowerDashboard';
import BorrowerExploreLenders from '../Screens/Borrower/Lenders/BorrowerExploreLenders';
import BorrowerApplications from '../Screens/Borrower/Applications/BorrowerApplications';
import BorrowerLoansPortfolio from '../Screens/Borrower/Loans/BorrowerLoansPortfolio';
import BorrowerProfileScreen from '../Screens/Borrower/Profile/BorrowerProfileScreen';

const Tab = createBottomTabNavigator();
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Enable layout animation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Smooth horizontal slide animation between tabs
const tabSlideInterpolator = ({ current }) => {
  return {
    sceneStyle: {
      opacity: current.progress.interpolate({
        inputRange: [-1, -0.6, 0, 0.6, 1],
        outputRange: [0, 0.7, 1, 0.7, 0],
      }),
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
          }),
        },
      ],
    },
  };
};

const tabTransitionSpec = {
  animation: 'timing',
  config: {
    duration: 220,
  },
};

/**
 * Custom Tab Bar Component
 * Displays professional mobile icons with solid active / outline inactive variants,
 * expands the active tab horizontally to show the full name,
 * and maintains consistent alignment and clearance across all device sizes.
 */
function CustomTabBar({
  state,
  descriptors,
  navigation,
  pendingRequestsCount = 0,
}) {
  const insets = useSafeAreaInsets();
  const bottomInset =
    Platform.OS === 'ios'
      ? Math.max(insets.bottom, m(12))
      : Math.max(insets.bottom, m(8));
  const barHeight = m(66) + bottomInset;

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (isKeyboardVisible) {
    return null;
  }

  return (
    <View
      style={[
        styles.tabBar,
        {
          height: barHeight,
          paddingBottom: bottomInset,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const iconBase = options.tabBarIconName || 'ellipse';
        const activeIcon = options.tabBarActiveIcon || iconBase;
        const inactiveIcon = options.tabBarInactiveIcon || `${iconBase}-outline`;

        const badgeCount =
          route.name === 'LenderRequests' ? pendingRequestsCount : 0;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.8}
            style={[
              styles.tabItem,
              { flex: isFocused ? 2.1 : 1.0 },
            ]}
          >
            {isFocused ? (
              <View style={styles.activePill}>
                <View style={styles.activeIconContainer}>
                  <Ionicons
                    name={activeIcon}
                    size={m(19)}
                    color={colors.lettersAndIcons}
                  />
                  {badgeCount > 0 ? (
                    <View style={styles.badgeContainer}>
                      <Text style={styles.badgeText}>
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text
                  style={styles.activeLabel}
                  allowFontScaling={false}
                >
                  {label}
                </Text>
              </View>
            ) : (
              <View style={styles.inactiveIconWrapper}>
                <Ionicons
                  name={inactiveIcon}
                  size={m(23)}
                  color={colors.lettersAndIcons}
                />
                {badgeCount > 0 ? (
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function BottomNavigation() {
  const user = useSelector(state => state.auth.user);
  const roleId = useMemo(() => {
    const id = user?.roleId;
    if (id === 0 || id === 1 || id === 2) {
      return id;
    }
    return undefined;
  }, [user?.roleId]);

  // Live badge counter for incoming borrower requests (roleId === 1)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    if (roleId === 1) {
      const unsubscribe = lenderFlowService.subscribeToStats(res => {
        if (res?.success && res.stats?.pendingRequests !== undefined) {
          setPendingRequestsCount(res.stats.pendingRequests);
        }
      });
      return unsubscribe;
    }
  }, [roleId]);

  const tabScreenOptions = {
    headerShown: false,
    tabBarHideOnKeyboard: true,
    sceneStyle: { backgroundColor: colors.backgroundGreenWhite },
    lazy: true,
    freezeOnBlur: true,
    detachInactiveScreens: true,
    animation: 'shift',
    sceneStyleInterpolator: tabSlideInterpolator,
    transitionSpec: tabTransitionSpec,
  };

  const renderTabBar = props => (
    <CustomTabBar
      {...props}
      pendingRequestsCount={pendingRequestsCount}
    />
  );

  // Admin Dashboard (roleId === 0) - 5 Professional Institutional Tabs
  if (roleId === 0) {
    return (
      <View style={styles.container}>
        <Tab.Navigator
          initialRouteName="AdminHome"
          tabBar={renderTabBar}
          screenOptions={tabScreenOptions}
        >
          <Tab.Screen
            name="AdminHome"
            component={AdminDashboard}
            options={{
              tabBarLabel: 'Dashboard',
              tabBarIconName: 'grid',
            }}
          />
          <Tab.Screen
            name="Lenders"
            component={LenderList}
            options={{
              tabBarLabel: 'Lenders',
              tabBarIconName: 'business',
            }}
          />
          <Tab.Screen
            name="Borrowers"
            component={AdminBorrowerList}
            options={{
              tabBarLabel: 'Borrowers',
              tabBarIconName: 'people',
            }}
          />
          <Tab.Screen
            name="Plans"
            component={PlansList}
            options={{
              tabBarLabel: 'Plans',
              tabBarIconName: 'layers',
            }}
          />
          <Tab.Screen
            name="Profile"
            component={AdminProfileScreen}
            options={{
              tabBarLabel: 'Profile',
              tabBarIconName: 'person',
            }}
          />
        </Tab.Navigator>
      </View>
    );
  }

  // Borrower Dashboard (roleId === 2) - 5 Professional Commercial Tabs
  if (roleId === 2) {
    return (
      <View style={styles.container}>
        <Tab.Navigator
          initialRouteName="BorrowerHome"
          tabBar={renderTabBar}
          screenOptions={tabScreenOptions}
        >
          <Tab.Screen
            name="BorrowerHome"
            component={BorrowerDashboard}
            options={{
              tabBarLabel: 'Home',
              tabBarIconName: 'home',
            }}
          />
          <Tab.Screen
            name="BorrowerExploreLenders"
            component={BorrowerExploreLenders}
            options={{
              tabBarLabel: 'Explore',
              tabBarIconName: 'search',
            }}
          />
          <Tab.Screen
            name="BorrowerApplications"
            component={BorrowerApplications}
            options={{
              tabBarLabel: 'Applications',
              tabBarIconName: 'document-text',
            }}
          />
          <Tab.Screen
            name="BorrowerLoansPortfolio"
            component={BorrowerLoansPortfolio}
            options={{
              tabBarLabel: 'Loans',
              tabBarIconName: 'card',
            }}
          />
          <Tab.Screen
            name="BorrowerProfile"
            component={BorrowerProfileScreen}
            options={{
              tabBarLabel: 'Profile',
              tabBarIconName: 'person',
            }}
          />
        </Tab.Navigator>
      </View>
    );
  }

  // Lender Dashboard (roleId === 1) - 5 Professional Institutional Tabs
  return (
    <View style={styles.container}>
      <Tab.Navigator
        initialRouteName="LenderHome"
        tabBar={renderTabBar}
        screenOptions={tabScreenOptions}
      >
        <Tab.Screen
          name="LenderHome"
          component={LenderDashboard}
          options={{
            tabBarLabel: 'Home',
            tabBarIconName: 'home',
          }}
        />
        <Tab.Screen
          name="LenderRequests"
          component={LenderIncomingRequests}
          options={{
            tabBarLabel: 'Requests',
            tabBarIconName: 'file-tray-full',
          }}
        />
        <Tab.Screen
          name="LenderLoans"
          component={LenderLoansPortfolio}
          options={{
            tabBarLabel: 'Loans',
            tabBarIconName: 'card',
          }}
        />
        <Tab.Screen
          name="LenderBorrowers"
          component={LenderAvailableBorrowers}
          options={{
            tabBarLabel: 'Borrowers',
            tabBarIconName: 'people',
          }}
        />
        <Tab.Screen
          name="LenderProfile"
          component={LenderProfileScreen}
          options={{
            tabBarLabel: 'Profile',
            tabBarIconName: 'person',
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
  },
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.lightGreen,
    borderTopLeftRadius: m(36),
    borderTopRightRadius: m(36),
    borderTopWidth: 0,
    borderWidth: 0,
    paddingHorizontal: m(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 16,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: {
      width: 0,
      height: -m(4),
    },
    shadowOpacity: 0.08,
    shadowRadius: m(10),
  },
  tabItem: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: m(10),
    height: m(42),
    borderRadius: m(14),
  },
  activeIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  activeLabel: {
    fontSize: m(11.5),
    lineHeight: m(16),
    fontFamily: FontFamily.primaryBold,
    fontWeight: '700',
    color: colors.lettersAndIcons,
    marginLeft: m(6),
    letterSpacing: -0.2,
  },
  inactiveIconWrapper: {
    width: m(42),
    height: m(42),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: -m(4),
    right: -m(6),
    backgroundColor: '#ef4444',
    minWidth: m(16),
    height: m(16),
    borderRadius: m(8),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: m(3),
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  badgeText: {
    fontSize: m(9),
    fontWeight: '800',
    color: '#ffffff',
  },
});
