import {StyleSheet, View} from 'react-native';
import React from 'react';
import Feather from 'react-native-vector-icons/Feather';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {m} from 'walstar-rn-responsive';

import Home from '../Screens/Dashboard/Home';
import Profile from '../Screens/Dashboard/Profile';
import Outward from '../Screens/Dashboard/Outward';
import Inward from '../Screens/Dashboard/Inward';

export default function BottomNavigation() {
  const Tab = createBottomTabNavigator();

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

  return (
    <View style={{flex: 1}}>
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
          name="Home"
          component={Home}
          options={{
            tabBarIcon: ({color, size, focused}) =>
              renderIcon('home', color, size, focused),
          }}
        />
        <Tab.Screen
          name="Given"
          component={Outward}
          options={{
            tabBarIcon: ({color, size, focused}) =>
              renderIcon('arrow-up-circle', color, size, focused),
          }}
        />
        <Tab.Screen
          name="Taken"
          component={Inward}
          options={{
            tabBarIcon: ({color, size, focused}) =>
              renderIcon('arrow-down-circle', color, size, focused),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={Profile}
          options={{
            tabBarIcon: ({color, size, focused}) =>
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