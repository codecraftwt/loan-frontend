import { Platform, StyleSheet, View, Text, Dimensions, TouchableOpacity } from 'react-native';
import React, { useMemo, useState, useEffect } from 'react';
import Feather from 'react-native-vector-icons/Feather';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { m } from 'walstar-rn-responsive';
import { FontFamily, FontSizes, colors } from '../constants';
// import Fonts from '../constants/fonts';

// Lender screens
import LenderDashboard from '../Screens/Lender/Dashboard/LenderDashboard';
import LenderIncomingRequests from '../Screens/Lender/Requests/LenderIncomingRequests';
import LenderLoansPortfolio from '../Screens/Lender/Loans/LenderLoansPortfolio';
import LenderAvailableBorrowers from '../Screens/Lender/Borrowers/LenderAvailableBorrowers';
import LenderSubscriptionScreen from '../Screens/Lender/Subscription/LenderSubscriptionScreen';
import LenderProfileScreen from '../Screens/Lender/Profile/LenderProfileScreen';
import lenderFlowService from '../Services/lenderFlowService';
import Home from '../Screens/Lender/Dashboard/Home';
import Outward from '../Screens/Shared/Loans/Outward';
import Inward from '../Screens/Shared/Loans/Inward';

// Admin screens
import AdminDashboard from '../Screens/Admin/Dashboard/AdminDashboard';
import PlansList from '../Screens/Admin/Plans/PlansList';
import Revenue from '../Screens/Admin/Revenue/Revenue';
import LenderList from '../Screens/Admin/Lenders/LenderList';
import AdminBorrowerList from '../Screens/Admin/Borrowers/AdminBorrowerList';
import AdminProfileScreen from '../Screens/Admin/Profile/AdminProfileScreen';

// Borrower screens
import BorrowerDashboard from '../Screens/Borrower/Dashboard/BorrowerDashboard';
import BorrowerExploreLenders from '../Screens/Borrower/Lenders/BorrowerExploreLenders';
import BorrowerApply from '../Screens/Borrower/Applications/BorrowerApply';
import BorrowerApplications from '../Screens/Borrower/Applications/BorrowerApplications';
import BorrowerLoansPortfolio from '../Screens/Borrower/Loans/BorrowerLoansPortfolio';
import MyLoans from '../Screens/Borrower/Loans/MyLoans';
import BorrowerAnalyticsScreen from '../Screens/Borrower/Analytics/BorrowerAnalyticsScreen';

// Shared screens
import Profile from '../Screens/Shared/Profile/Profile';

export default function BottomNavigation() {
  const Tab = createBottomTabNavigator();
  const user = useSelector(state => state.auth.user);
  // Memoize roleId to prevent unnecessary re-renders
  const roleId = useMemo(() => {
    // Get roleId from user object, ensuring it's a valid number
    const id = user?.roleId;
    if (id === 0 || id === 1 || id === 2) {
      return id;
    }
    // If roleId is invalid, try to get from AsyncStorage as fallback
    return undefined;
  }, [user?.roleId]);

  // Live badge counter for incoming borrower requests (roleId === 1)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    if (roleId === 1) {
      let isMounted = true;
      const fetchBadge = () => {
        lenderFlowService
          .getDashboardStats()
          .then(res => {
            if (isMounted && res?.success && res.stats?.pendingRequests !== undefined) {
              setPendingRequestsCount(res.stats.pendingRequests);
            }
          })
          .catch(() => {});
      };
      fetchBadge();
      const interval = setInterval(fetchBadge, 25000);
      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }
  }, [roleId]);

  // Get safe area values
  const insets = useSafeAreaInsets();
  const bottomInset =
    Platform.OS === 'ios'
      ? Math.max(insets.bottom, m(12))
      : Math.max(insets.bottom, m(8));
  const barHeight = m(66) + bottomInset;

  const renderIcon = (name, color, size, focused, badgeCount = 0) => {
    return (
      <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
        <Feather
          name={name}
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
    );
  };

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Smooth horizontal slide animation between tabs (right-to-left forward, left-to-right backward)
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

  const tabScreenOptions = {
    headerShown: false,
    tabBarHideOnKeyboard: true,
    tabBarShowLabel: false,
    tabBarActiveTintColor: colors.lettersAndIcons,
    tabBarInactiveTintColor: colors.lettersAndIcons,
    tabBarIconStyle: styles.tabBarIcon,
    tabBarItemStyle: styles.tabBarItem,
    tabBarButton: props => (
      <TouchableOpacity
        {...props}
        activeOpacity={0.8}
      />
    ),
    sceneStyle: { backgroundColor: colors.backgroundGreenWhite },
    lazy: true,
    freezeOnBlur: true,
    detachInactiveScreens: true,
    animation: 'shift',
    sceneStyleInterpolator: tabSlideInterpolator,
    transitionSpec: tabTransitionSpec,
    tabBarStyle: [
      styles.tabBar,
      {
        height: barHeight,
        paddingBottom: bottomInset,
      },
    ],
  };

  // Admin Dashboard (roleId === 0) - 5 Clean Tabs
  if (roleId === 0) {
    return (
      <View style={styles.container}>
        <Tab.Navigator
          initialRouteName="AdminHome"
          screenOptions={tabScreenOptions}
        >
          <Tab.Screen
            name="AdminHome"
            component={AdminDashboard}
            options={{
              tabBarLabel: 'Dashboard',
              tabBarIcon: ({ color, size, focused }) =>
                renderIcon('home', color, size, focused),
            }}
          />
          <Tab.Screen
            name="Lenders"
            component={LenderList}
            options={{
              tabBarLabel: 'Lenders',
              tabBarIcon: ({ color, size, focused }) =>
                renderIcon('briefcase', color, size, focused),
            }}
          />
          <Tab.Screen
            name="Borrowers"
            component={AdminBorrowerList}
            options={{
              tabBarLabel: 'Borrowers',
              tabBarIcon: ({ color, size, focused }) =>
                renderIcon('user-check', color, size, focused),
            }}
          />
          <Tab.Screen
            name="Plans"
            component={PlansList}
            options={{
              tabBarLabel: 'Plans',
              tabBarIcon: ({ color, size, focused }) =>
                renderIcon('layers', color, size, focused),
            }}
          />
          <Tab.Screen
            name="Profile"
            component={AdminProfileScreen}
            options={{
              tabBarLabel: 'Profile',
              tabBarIcon: ({ color, size, focused }) =>
                renderIcon('user', color, size, focused),
            }}
          />
        </Tab.Navigator>
      </View>
    );
  }

  // Borrower Dashboard (roleId === 2) - Streamlined commercial flows matching webapp
  if (roleId === 2) {
    return (
      <View style={styles.container}>
        <Tab.Navigator
          initialRouteName="BorrowerHome"
          screenOptions={tabScreenOptions}
        >
          <Tab.Screen
            name="BorrowerHome"
            component={BorrowerDashboard}
            options={{
              tabBarLabel: 'Dashboard',
              tabBarIcon: ({ color, size, focused }) =>
                renderIcon('home', color, size, focused),
            }}
          />
          <Tab.Screen
            name="BorrowerExploreLenders"
            component={BorrowerExploreLenders}
            options={{
              tabBarLabel: 'Explore',
              tabBarIcon: ({ color, size, focused }) =>
                renderIcon('search', color, size, focused),
            }}
          />
          <Tab.Screen
            name="BorrowerApply"
            component={BorrowerApply}
            options={{
              tabBarLabel: 'Apply',
              tabBarIcon: ({ color, size, focused }) =>
                renderIcon('send', color, size, focused),
            }}
          />
          <Tab.Screen
            name="BorrowerApplications"
            component={BorrowerApplications}
            options={{
              tabBarLabel: 'Applications',
              tabBarIcon: ({ color, size, focused }) =>
                renderIcon('inbox', color, size, focused),
            }}
          />
          <Tab.Screen
            name="BorrowerLoansPortfolio"
            component={BorrowerLoansPortfolio}
            options={{
              tabBarLabel: 'Loans & EMI',
              tabBarIcon: ({ color, size, focused }) =>
                renderIcon('credit-card', color, size, focused),
            }}
          />
        </Tab.Navigator>
      </View>
    );
  }

  // Lender Dashboard (roleId === 1) - Modern 5-tab institutional workflow matching webapp
  return (
    <View style={styles.container}>
      <Tab.Navigator initialRouteName="LenderHome" screenOptions={tabScreenOptions}>
        <Tab.Screen
          name="LenderHome"
          component={LenderDashboard}
          options={{
            tabBarLabel: 'Dashboard',
            tabBarIcon: ({ color, size, focused }) =>
              renderIcon('home', color, size, focused),
          }}
        />
        <Tab.Screen
          name="LenderRequests"
          component={LenderIncomingRequests}
          options={{
            tabBarLabel: 'Requests',
            tabBarIcon: ({ color, size, focused }) =>
              renderIcon('inbox', color, size, focused, pendingRequestsCount),
          }}
        />
        <Tab.Screen
          name="LenderLoans"
          component={LenderLoansPortfolio}
          options={{
            tabBarLabel: 'Loans',
            tabBarIcon: ({ color, size, focused }) =>
              renderIcon('credit-card', color, size, focused),
          }}
        />
        <Tab.Screen
          name="LenderBorrowers"
          component={LenderAvailableBorrowers}
          options={{
            tabBarLabel: 'Borrowers',
            tabBarIcon: ({ color, size, focused }) =>
              renderIcon('users', color, size, focused),
          }}
        />
        <Tab.Screen
          name="LenderProfile"
          component={LenderProfileScreen}
          options={{
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color, size, focused }) =>
              renderIcon('user', color, size, focused),
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
    paddingHorizontal: m(10),
    elevation: 16,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: {
      width: 0,
      height: -m(4),
    },
    shadowOpacity: 0.08,
    shadowRadius: m(10),
  },
  tabBarItem: {
    height: m(66),
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 0,
    paddingBottom: 0,
    paddingVertical: 0,
    marginVertical: 0,
  },
  tabBarIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 0,
    padding: 0,
    width: '100%',
    height: '100%',
  },
  iconWrapper: {
    width: m(48),
    height: m(48),
    borderRadius: m(16),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  activeIconWrapper: {
    backgroundColor: colors.primary,
    borderRadius: m(16),
  },
  badgeContainer: {
    position: 'absolute',
    top: m(4),
    right: m(4),
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
