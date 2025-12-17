import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Login from '../Screens/Auth/Login';
import SplashScreen from '../Screens/Auth/Splash';
import Register from '../Screens/Auth/Register';
import ForgotPassword from '../Screens/Auth/ForgotPassword';
import OTP from '../Screens/Auth/OTP';
import CreatePass from '../Screens/Auth/CreatePass';
import BottomNavigation from './BottomNavigation';
import LoanRequest from '../Screens/Shared/Loans/LoanRequest';
import Outward from '../Screens/Shared/Loans/Outward';
import AddDetails from '../Screens/Lender/Loans/AddDetails';
import LoanDetailScreen from '../Screens/Shared/Loans/LoanDetailsScreen';
import BorrowerDetailsScreen from '../Screens/Shared/Borrowers/BorrowerDetailsScreen';
import ProfileDetails from '../Screens/Shared/Profile/ProfileDetails';
import OldHistoryPage from '../Screens/Shared/History/OldHistoryPage';
import SettingsScreen from '../Screens/Shared/Profile/SettingsScreen';
import SubscriptionScreen from '../Screens/Shared/Subscription/SubscriptionScreen';
import HelpAndSupportScreen from '../Screens/Auth/HelpAndSupportScreen';
import PersonalLoan from '../Screens/Shared/Loans/PersonalLoan';
import AnalyticsScreen from '../Screens/Lender/Analytics/AnalyticsScreen';
// Admin screens
import AddPlan from '../Screens/Admin/Plans/AddPlan';
import EditPlan from '../Screens/Admin/Plans/EditPlan';
import Revenue from '../Screens/Admin/Revenue/Revenue';
import LenderList from '../Screens/Admin/Lenders/LenderList';

const Navigation = () => {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="SplashScreen" component={SplashScreen} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={Register} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
      <Stack.Screen name="OTP" component={OTP} />
      <Stack.Screen name="CreatePass" component={CreatePass} />
      <Stack.Screen name="BottomNavigation" component={BottomNavigation} />

      <Stack.Screen name="LoanRequest" component={LoanRequest} />

      <Stack.Screen name="Outward" component={Outward} />
      <Stack.Screen name="AddDetails" component={AddDetails} />
      <Stack.Screen name="LoanDetailScreen" component={LoanDetailScreen} />
      <Stack.Screen name="BorrowerDetailsScreen" component={BorrowerDetailsScreen} />
      <Stack.Screen name="PersonalLoan" component={PersonalLoan} />

      <Stack.Screen name="ProfileDetails" component={ProfileDetails} />
      <Stack.Screen name="OldHistoryPage" component={OldHistoryPage} />

      <Stack.Screen name="SubscriptionScreen" component={SubscriptionScreen} />
      <Stack.Screen
        name="HelpAndSupportScreen"
        component={HelpAndSupportScreen}
      />

      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="AnalyticsScreen" component={AnalyticsScreen} />
      {/* Admin Screens */}
      <Stack.Screen name="AddPlan" component={AddPlan} />
      <Stack.Screen name="EditPlan" component={EditPlan} />
      <Stack.Screen name="Revenue" component={Revenue} />
      <Stack.Screen name="LenderList" component={LenderList} />
    </Stack.Navigator>
  );
};

export default Navigation;
