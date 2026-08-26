import { Platform, StyleSheet, View } from 'react-native';
import React, { useMemo } from 'react';
import Feather from 'react-native-vector-icons/Feather';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { m } from 'walstar-rn-responsive';
import { colors } from '../constants';
// import Fonts from '../constants/fonts';

// Lender screens
import Home from '../Screens/Lender/Dashboard/Home';
import Outward from '../Screens/Shared/Loans/Outward';
import Inward from '../Screens/Shared/Loans/Inward';

// Admin screens
import AdminDashboard from '../Screens/Admin/Dashboard/AdminDashboard';
import PlansList from '../Screens/Admin/Plans/PlansList';
import Revenue from '../Screens/Admin/Revenue/Revenue';
import LenderList from '../Screens/Admin/Lenders/LenderList';

// Borrower screens
import BorrowerDashboard from '../Screens/Borrower/Dashboard/BorrowerDashboard';
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

  // Get safe area values
  const insets = useSafeAreaInsets();

  const renderIcon = (name, color, size, focused) => {
    return (
      <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
        <Feather
          name={name}
          size={focused ? size : size - 1}
          color={focused ? colors.white : color}
        />
      </View>
    );
  };

  const tabScreenOptions = {
    headerShown: false,
    tabBarHideOnKeyboard: true,
    tabBarShowLabel: false,
    tabBarActiveTintColor: colors.white,
    tabBarInactiveTintColor: colors.ink,
    tabBarLabelStyle: styles.hiddenLabel,
    tabBarIconStyle: styles.tabBarIcon,
    tabBarItemStyle: styles.tabBarItem,
    tabBarStyle: [
      styles.tabBar,
      {
        bottom: Platform.OS === 'ios'
          ? Math.max(insets.bottom, m(10))
          : Math.max(insets.bottom + m(6), m(12)),
      },
    ],
  };

  // Admin Dashboard (roleId === 0)
  if (roleId === 0) {
    return (
      <View style={styles.container}>
        <Tab.Navigator
          initialRouteName="AdminHome"
          screenOptions={tabScreenOptions}>
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
            name="Plans"
            component={PlansList}
            options={{
              tabBarLabel: 'Plans',
              tabBarIcon: ({ color, size, focused }) =>
                renderIcon('file-text', color, size, focused),
            }}
          />
          <Tab.Screen
            name="Revenue"
            component={Revenue}
            options={{
              tabBarLabel: 'Revenue',
              tabBarIcon: ({ color, size, focused }) =>
                renderIcon('dollar-sign', color, size, focused),
            }}
          />
          <Tab.Screen
            name="Lenders"
            component={LenderList}
            options={{
              tabBarLabel: 'Lenders',
              tabBarIcon: ({ color, size, focused }) =>
                renderIcon('users', color, size, focused),
            }}
          />
          <Tab.Screen
            name="Profile"
            component={Profile}
            options={{
              tabBarIcon: ({ color, size, focused }) =>
                renderIcon('user', color, size, focused),
            }}
          />
        </Tab.Navigator>
      </View>
    );
  }

  // Borrower Dashboard (roleId === 2)
  if (roleId === 2) {
    return (
      <View style={styles.container}>
        <Tab.Navigator
          initialRouteName="BorrowerHome"
          screenOptions={tabScreenOptions}>
          <Tab.Screen
            name="BorrowerHome"
            component={BorrowerDashboard}
            options={{
              tabBarLabel: 'Home',
              tabBarIcon: ({ color, size, focused }) =>
                renderIcon('home', color, size, focused),
            }}
          />
          <Tab.Screen
            name="MyLoans"
            component={MyLoans}
            options={{
              tabBarLabel: 'My Loans',
              tabBarIcon: ({ color, size, focused }) =>
                renderIcon('file-text', color, size, focused),
            }}
          />
          <Tab.Screen
            name="History"
            component={BorrowerAnalyticsScreen}
            options={{
              tabBarLabel: 'Analytics',
              tabBarIcon: ({ color, size, focused }) =>
                renderIcon('bar-chart-2', color, size, focused),
            }}
          />
          <Tab.Screen
            name="Profile"
            component={Profile}
            options={{
              tabBarIcon: ({ color, size, focused }) =>
                renderIcon('user', color, size, focused),
            }}
          />
        </Tab.Navigator>
      </View>
    );
  }

  // Lender Dashboard (roleId === 1) - Default/Current Dashboard
  return (
    <View style={styles.container}>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={tabScreenOptions}>
        <Tab.Screen
          name="Home"
          component={Home}
          options={{
            tabBarIcon: ({ color, size, focused }) =>
              renderIcon('home', color, size, focused),
          }}
        />
        <Tab.Screen
          name="Borrowers"
          component={Outward}
          options={{
            tabBarIcon: ({ color, size, focused }) =>
              renderIcon('arrow-up-circle', color, size, focused),
          }}
        />
        <Tab.Screen
          name="My Loans"
          component={Inward}
          options={{
            tabBarIcon: ({ color, size, focused }) =>
              renderIcon('arrow-down-circle', color, size, focused),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={Profile}
          options={{
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
  },
  tabBar: {
    position: 'absolute',
    left: m(48),
    right: m(48),
    height: m(62),
    backgroundColor: colors.white,
    borderTopWidth: 0,
    borderRadius: m(31),
    paddingHorizontal: m(9),
    paddingTop: 0,
    paddingBottom: 0,
    elevation: 16,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: m(8),
    },
    shadowOpacity: 0.14,
    shadowRadius: m(16),
  },
  tabBarItem: {
    height: m(62),
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 0,
    paddingBottom: 0,
  },
  tabBarIcon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
  },
  hiddenLabel: {
    display: 'none',
    height: 0,
    margin: 0,
    padding: 0,
  },
  iconWrapper: {
    width: m(46),
    height: m(46),
    borderRadius: m(23),
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIconWrapper: {
    backgroundColor: colors.ink,
  },
});
