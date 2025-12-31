import { combineReducers } from 'redux';
import authReducer from '../Slices/authslice';
import loanReducer from '../Slices/loanSlice';
import subscriptionReducer from '../Slices/subscriptionSlice';
import borrowerReducer from '../Slices/borrowerSlice';
import borrowerLoanReducer from '../Slices/borrowerLoanSlice';
import lenderPaymentReducer from '../Slices/lenderPaymentSlice';
import adminPlanReducer from '../Slices/adminPlanSlice';
import planPurchaseReducer from '../Slices/planPurchaseSlice';
import adminLendersReducer from '../Slices/adminLendersSlice';
import adminRevenueReducer from '../Slices/adminRevenueSlice';
import adminActivitiesReducer from '../Slices/adminActivitiesSlice';
import lenderActivitiesReducer from '../Slices/lenderActivitiesSlice';
import borrowerActivitiesReducer from '../Slices/borrowerActivitiesSlice';

const rootReducer = combineReducers({
    auth: authReducer,
    loans: loanReducer,
    subscription: subscriptionReducer,
    borrowers: borrowerReducer,
    borrowerLoans: borrowerLoanReducer,
    lenderPayments: lenderPaymentReducer,
    adminPlans: adminPlanReducer,
    planPurchase: planPurchaseReducer,
    adminLenders: adminLendersReducer,
    adminRevenue: adminRevenueReducer,
    adminActivities: adminActivitiesReducer,
    lenderActivities: lenderActivitiesReducer,
    borrowerActivities: borrowerActivitiesReducer,
});

export default rootReducer;
