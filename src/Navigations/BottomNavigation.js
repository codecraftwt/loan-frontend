import { StyleSheet, View } from 'react-native';
import React, { useMemo } from 'react';
import Feather from 'react-native-vector-icons/Feather';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { m } from 'walstar-rn-responsive';

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
      <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
        <Feather
          name={name}
          size={focused ? size + 2 : size}
          color={focused ? '#ffffff' : color}
        />
      </View>
    );
  };

  // Admin Dashboard (roleId === 0)
  if (roleId === 0) {
    return (
      <View style={{ flex: 1 }}>
        <Tab.Navigator
          initialRouteName="AdminHome"
          screenOptions={{
            headerShown: false,
            tabBarHideOnKeyboard: true,
            tabBarActiveTintColor: '#ff6700',
            tabBarInactiveTintColor: '#666666',
            tabBarLabelStyle: {
              fontSize: m(11),
              fontFamily: 'Poppins-SemiBold',
              paddingTop: m(5)
            },
            tabBarStyle: {
              position: 'absolute',
              left: m(16),
              right: m(16),
              bottom: insets.bottom,
              height: m(68),
              backgroundColor: '#e5dad1',
              borderTopWidth: 0,
              paddingTop: m(5),
              paddingBottom: insets.bottom > 0 ? m(5) : 0,
            },
          }}>
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
      <View style={{ flex: 1 }}>
        <Tab.Navigator
          initialRouteName="BorrowerHome"
          screenOptions={{
            headerShown: false,
            tabBarHideOnKeyboard: true,
            tabBarActiveTintColor: '#ff6700',
            tabBarInactiveTintColor: '#666666',
            tabBarLabelStyle: {
              fontSize: m(11),
              fontFamily: 'Poppins-SemiBold',
              paddingTop: m(5)
            },
            tabBarStyle: {
              position: 'absolute',
              left: m(16),
              right: m(16),
              bottom: insets.bottom,
              height: m(69),
              backgroundColor: '#e5dad1',
              borderTopWidth: 0,
              paddingTop: m(6),
              paddingBottom: insets.bottom > 0 ? m(5) : 0,
            },
          }}>
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
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: '#ff6700',
          tabBarInactiveTintColor: '#666666',
          tabBarLabelStyle: {
            fontSize: m(11),
            fontFamily: 'Poppins-SemiBold',
            paddingTop: m(5)
          },
          tabBarStyle: {
            position: 'absolute',
            left: m(16),
            right: m(16),
            bottom: insets.bottom,
            height: m(69),
            backgroundColor: '#e5dad1',
            borderTopWidth: 0,
            paddingTop: m(10),
            paddingBottom: insets.bottom > 0 ? m(5) : 0,
          },
        }}>
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
          name="Loans"
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
  iconWrapper: {
    width: m(34),
    height: m(34),
    borderRadius: m(17),
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapperActive: {
    backgroundColor: '#ff6700',
  },
});