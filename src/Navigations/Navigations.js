import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Login from '../Screens/Auth/Login';
import SplashScreen from '../Screens/Auth/Splash';
import Register from '../Screens/Auth/Register';
import CreatePin from '../Screens/Auth/CreatePin';
import ConsentScreen from '../Screens/Borrower/Authentication/ConsentScreen';
import EnterAadhaarScreen from '../Screens/Borrower/Authentication/EnterAadhaarScreen';
import VerifyAadhaarOtpScreen from '../Screens/Borrower/Authentication/VerifyAadhaarOtpScreen';
import AadhaarKycSuccessScreen from '../Screens/Borrower/Authentication/AadhaarKycSuccessScreen';
import ForgotPassword from '../Screens/Auth/ForgotPassword';
import ForgotPin from '../Screens/Auth/ForgotPin';
import OTP from '../Screens/Auth/OTP';
import CreatePass from '../Screens/Auth/CreatePass';
import BottomNavigation from './BottomNavigation';
import LoanRequest from '../Screens/Shared/Loans/LoanRequest';
import Outward from '../Screens/Shared/Loans/Outward';
import AddDetails from '../Screens/Lender/Loans/AddDetails';
import LoanDetailScreen from '../Screens/Shared/Loans/LoanDetailsScreen';
import BorrowerDetailsScreen from '../Screens/Shared/Borrowers/BorrowerDetailsScreen';
import ProfileDetails from '../Screens/Shared/Profile/ProfileDetails';
import EditProfile from '../Screens/Shared/Profile/EditProfile';
import OldHistoryPage from '../Screens/Shared/History/OldHistoryPage';
import SettingsScreen from '../Screens/Shared/Profile/SettingsScreen';
import TermsOfServiceScreen from '../Screens/Shared/Profile/TermsOfServiceScreen';
import PrivacyPolicyScreen from '../Screens/Shared/Profile/PrivacyPolicyScreen';
import AboutUsScreen from '../Screens/Shared/Profile/AboutUsScreen';
import RateAppScreen from '../Screens/Shared/Profile/RateAppScreen';
import ChangePasswordScreen from '../Screens/Shared/Profile/ChangePasswordScreen';
import SubscriptionScreen from '../Screens/Shared/Subscription/SubscriptionScreen';
import LenderPlanDetailsScreen from '../Screens/Shared/Subscription/LenderPlanDetailsScreen';
import HelpAndSupportScreen from '../Screens/Auth/HelpAndSupportScreen';
import PersonalLoan from '../Screens/Shared/Loans/PersonalLoan';
import BorrowerLoansScreen from '../Screens/Shared/Loans/BorrowerLoansScreen';
import AnalyticsScreen from '../Screens/Lender/Analytics/AnalyticsScreen';
import BorrowerAnalyticsScreen from '../Screens/Borrower/Analytics/BorrowerAnalyticsScreen';
import ContactsScreen from '../Screens/Shared/Contacts/ContactsScreen';
import BorrowerRecentActivity from '../Screens/Borrower/Dashboard/BorrowerRecentActivity';
import LenderRecentActivity from '../Screens/Lender/Dashboard/LenderRecentActivity';
// Admin screens
import PlansList from '../Screens/Admin/Plans/PlansList';
import CreateEditPlan from '../Screens/Admin/Plans/CreateEditPlan';
import PlanDetailsScreen from '../Screens/Admin/Plans/PlanDetailsScreen';
import Revenue from '../Screens/Admin/Revenue/Revenue';
import LenderList from '../Screens/Admin/Lenders/LenderList';
import LenderDetailsScreen from '../Screens/Admin/Lenders/LenderDetailsScreen';
import AdminBorrowerList from '../Screens/Admin/Borrowers/AdminBorrowerList';
import AdminBorrowerDetailsScreen from '../Screens/Admin/Borrowers/AdminBorrowerDetailsScreen';
import AdminLenderSubscriptionHistory from '../Screens/Admin/Lenders/AdminLenderSubscriptionHistory';
import AdminProfileScreen from '../Screens/Admin/Profile/AdminProfileScreen';
import AdminActivityDetailsScreen from '../Screens/Admin/Activities/AdminActivityDetailsScreen';
import BorrowerLoanHistoryScreen from '../Screens/Shared/Borrowers/BorrowerLoanHistoryScreen';
import AgreementScreen from '../Screens/PromptBox/AgreementScreen';
// Borrower Loan Screens
import MyLoans from '../Screens/Borrower/Loans/MyLoans';
import BorrowerLoanDetails from '../Screens/Borrower/Loans/BorrowerLoanDetails';
import MakePayment from '../Screens/Borrower/Loans/MakePayment';
import PaymentHistory from '../Screens/Borrower/Loans/PaymentHistory';
import PendingLoanOffersScreen from '../Screens/Borrower/Loans/PendingLoanOffersScreen';
import BorrowerExploreLenders from '../Screens/Borrower/Lenders/BorrowerExploreLenders';
import BorrowerLenderDetails from '../Screens/Borrower/Lenders/BorrowerLenderDetails';
import BorrowerApply from '../Screens/Borrower/Applications/BorrowerApply';
import BorrowerApplications from '../Screens/Borrower/Applications/BorrowerApplications';
import BorrowerLoansPortfolio from '../Screens/Borrower/Loans/BorrowerLoansPortfolio';
import BorrowerProfileScreen from '../Screens/Borrower/Profile/BorrowerProfileScreen';
import BorrowerSecurityScreen from '../Screens/Borrower/Security/BorrowerSecurityScreen';
// Lender Payment Screens
import PendingPayments from '../Screens/Lender/Payments/PendingPayments';
// Lender Modern Flow Screens
import LenderDashboard from '../Screens/Lender/Dashboard/LenderDashboard';
import LenderIncomingRequests from '../Screens/Lender/Requests/LenderIncomingRequests';
import LenderRequestDetails from '../Screens/Lender/Requests/LenderRequestDetails';
import LenderLoansPortfolio from '../Screens/Lender/Loans/LenderLoansPortfolio';
import LenderLoanDetails from '../Screens/Lender/Loans/LenderLoanDetails';
import LenderAvailableBorrowers from '../Screens/Lender/Borrowers/LenderAvailableBorrowers';
import LenderBorrowerDetails from '../Screens/Lender/Borrowers/LenderBorrowerDetails';
import LenderSubscriptionScreen from '../Screens/Lender/Subscription/LenderSubscriptionScreen';
import LenderProfileScreen from '../Screens/Lender/Profile/LenderProfileScreen';
import LenderSettingsScreen from '../Screens/Lender/Settings/LenderSettingsScreen';

const Navigation = () => {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="SplashScreen" component={SplashScreen} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={Register} />
      <Stack.Screen name="CreatePin" component={CreatePin} />
      <Stack.Screen name="ConsentScreen" component={ConsentScreen} />
      <Stack.Screen name="EnterAadhaarScreen" component={EnterAadhaarScreen} />
      <Stack.Screen name="VerifyAadhaarOtpScreen" component={VerifyAadhaarOtpScreen} />
      <Stack.Screen name="AadhaarKycSuccessScreen" component={AadhaarKycSuccessScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
      <Stack.Screen name="ForgotPin" component={ForgotPin} />
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
      <Stack.Screen name="EditProfile" component={EditProfile} />
      <Stack.Screen name="OldHistoryPage" component={OldHistoryPage} />
      <Stack.Screen name="AgreementScreen" component={AgreementScreen} />

      <Stack.Screen name="SubscriptionScreen" component={SubscriptionScreen} />
      <Stack.Screen name="LenderPlanDetailsScreen" component={LenderPlanDetailsScreen} />
      <Stack.Screen
        name="HelpAndSupportScreen"
        component={HelpAndSupportScreen}
      />

      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="AboutUs" component={AboutUsScreen} />
      <Stack.Screen name="RateApp" component={RateAppScreen} />
      <Stack.Screen name="AnalyticsScreen" component={AnalyticsScreen} />
      <Stack.Screen name="BorrowerAnalyticsScreen" component={BorrowerAnalyticsScreen} />
      <Stack.Screen name="BorrowerRecentActivity" component={BorrowerRecentActivity} />
      <Stack.Screen name="LenderRecentActivity" component={LenderRecentActivity} />
      <Stack.Screen name="ContactsScreen" component={ContactsScreen} />
      
      {/* Lender Payment Screens */}
      <Stack.Screen name="PendingPayments" component={PendingPayments} />
      
      {/* Admin Screens */}
      <Stack.Screen name="PlansList" component={PlansList} />
      <Stack.Screen name="CreateEditPlan" component={CreateEditPlan} />
      <Stack.Screen name="PlanDetailsScreen" component={PlanDetailsScreen} />
      <Stack.Screen name="Revenue" component={Revenue} />
      <Stack.Screen name="LenderList" component={LenderList} />
      <Stack.Screen name="LenderDetailsScreen" component={LenderDetailsScreen} />
      <Stack.Screen name="AdminBorrowerList" component={AdminBorrowerList} />
      <Stack.Screen name="AdminBorrowerDetailsScreen" component={AdminBorrowerDetailsScreen} />
      <Stack.Screen name="AdminLenderSubscriptionHistory" component={AdminLenderSubscriptionHistory} />
      <Stack.Screen name="AdminProfileScreen" component={AdminProfileScreen} />
      <Stack.Screen name="AdminActivityDetailsScreen" component={AdminActivityDetailsScreen} />

      {/* Borrower Screens */}
      <Stack.Screen name="MyLoans" component={MyLoans} />
      <Stack.Screen name="BorrowerLoanDetails" component={BorrowerLoanDetails} />
      <Stack.Screen name="MakePayment" component={MakePayment} />
      <Stack.Screen name="PaymentHistory" component={PaymentHistory} />
      <Stack.Screen name="PendingLoanOffers" component={PendingLoanOffersScreen} />
      <Stack.Screen name="BorrowerExploreLenders" component={BorrowerExploreLenders} />
      <Stack.Screen name="BorrowerLenderDetails" component={BorrowerLenderDetails} />
      <Stack.Screen name="BorrowerApply" component={BorrowerApply} />
      <Stack.Screen name="BorrowerApplications" component={BorrowerApplications} />
      <Stack.Screen name="BorrowerLoansPortfolio" component={BorrowerLoansPortfolio} />
      <Stack.Screen name="BorrowerProfileScreen" component={BorrowerProfileScreen} />
      <Stack.Screen name="BorrowerSecurityScreen" component={BorrowerSecurityScreen} />

      {/* Other Borrower screens */}
      <Stack.Screen name="BorrowerLoanHistoryScreen" component={BorrowerLoanHistoryScreen} />
      <Stack.Screen name="BorrowerDetailsScreen" component={BorrowerDetailsScreen} />

      {/* Modern Lender Flow Screens */}
      <Stack.Screen name="LenderDashboard" component={LenderDashboard} />
      <Stack.Screen name="LenderIncomingRequests" component={LenderIncomingRequests} />
      <Stack.Screen name="LenderRequestDetails" component={LenderRequestDetails} />
      <Stack.Screen name="LenderLoansPortfolio" component={LenderLoansPortfolio} />
      <Stack.Screen name="LenderLoanDetails" component={LenderLoanDetails} />
      <Stack.Screen name="LenderAvailableBorrowers" component={LenderAvailableBorrowers} />
      <Stack.Screen name="LenderBorrowerDetails" component={LenderBorrowerDetails} />
      <Stack.Screen name="LenderSubscriptionScreen" component={LenderSubscriptionScreen} />
      <Stack.Screen name="LenderProfileScreen" component={LenderProfileScreen} />
      <Stack.Screen name="LenderSettingsScreen" component={LenderSettingsScreen} />

    </Stack.Navigator>
  );
};

export default Navigation;
