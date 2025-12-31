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
import LenderPlanDetailsScreen from '../Screens/Shared/Subscription/LenderPlanDetailsScreen';
import HelpAndSupportScreen from '../Screens/Auth/HelpAndSupportScreen';
import PersonalLoan from '../Screens/Shared/Loans/PersonalLoan';
import BorrowerLoansScreen from '../Screens/Shared/Loans/BorrowerLoansScreen';
import AnalyticsScreen from '../Screens/Lender/Analytics/AnalyticsScreen';
import BorrowerAnalyticsScreen from '../Screens/Borrower/Analytics/BorrowerAnalyticsScreen';
// Admin screens
import PlansList from '../Screens/Admin/Plans/PlansList';
import CreateEditPlan from '../Screens/Admin/Plans/CreateEditPlan';
import PlanDetailsScreen from '../Screens/Admin/Plans/PlanDetailsScreen';
import Revenue from '../Screens/Admin/Revenue/Revenue';
import LenderList from '../Screens/Admin/Lenders/LenderList';
import LenderDetailsScreen from '../Screens/Admin/Lenders/LenderDetailsScreen';
import BorrowerLoanHistoryScreen from '../Screens/Shared/Borrowers/BorrowerLoanHistoryScreen';
// Borrower Loan Screens
import MyLoans from '../Screens/Borrower/Loans/MyLoans';
import BorrowerLoanDetails from '../Screens/Borrower/Loans/BorrowerLoanDetails';
import MakePayment from '../Screens/Borrower/Loans/MakePayment';
import PaymentHistory from '../Screens/Borrower/Loans/PaymentHistory';
// Lender Payment Screens
import PendingPayments from '../Screens/Lender/Payments/PendingPayments';
import NotificationTestScreen from '../Screens/Shared/Profile/NotificationTestScreen';

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
      <Stack.Screen name="PersonalLoan" component={PersonalLoan} />
      <Stack.Screen name="BorrowerLoansScreen" component={BorrowerLoansScreen} />

      <Stack.Screen name="ProfileDetails" component={ProfileDetails} />
      <Stack.Screen name="OldHistoryPage" component={OldHistoryPage} />

      <Stack.Screen name="SubscriptionScreen" component={SubscriptionScreen} />
      <Stack.Screen name="LenderPlanDetailsScreen" component={LenderPlanDetailsScreen} />
      <Stack.Screen
        name="HelpAndSupportScreen"
        component={HelpAndSupportScreen}
      />

      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="NotificationTestScreen" component={NotificationTestScreen} />
      <Stack.Screen name="AnalyticsScreen" component={AnalyticsScreen} />
      <Stack.Screen name="BorrowerAnalyticsScreen" component={BorrowerAnalyticsScreen} />
      
      {/* Lender Payment Screens */}
      <Stack.Screen name="PendingPayments" component={PendingPayments} />
      
      {/* Admin Screens */}
      <Stack.Screen name="PlansList" component={PlansList} />
      <Stack.Screen name="CreateEditPlan" component={CreateEditPlan} />
      <Stack.Screen name="PlanDetailsScreen" component={PlanDetailsScreen} />
      <Stack.Screen name="Revenue" component={Revenue} />
      <Stack.Screen name="LenderList" component={LenderList} />
      <Stack.Screen name="LenderDetailsScreen" component={LenderDetailsScreen} />

      {/* Borrower Loan Screens */}
      <Stack.Screen name="MyLoans" component={MyLoans} />
      <Stack.Screen name="BorrowerLoanDetails" component={BorrowerLoanDetails} />
      <Stack.Screen name="MakePayment" component={MakePayment} />
      <Stack.Screen name="PaymentHistory" component={PaymentHistory} />

      {/* Other Borrower screens */}
      <Stack.Screen name="BorrowerLoanHistoryScreen" component={BorrowerLoanHistoryScreen} />
      <Stack.Screen name="BorrowerDetailsScreen" component={BorrowerDetailsScreen} />

    </Stack.Navigator>
  );
};

export default Navigation;
