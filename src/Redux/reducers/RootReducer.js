import { combineReducers } from 'redux';
import authReducer from '../Slices/authslice';
import loanReducer from '../Slices/loanSlice';
import subscriptionReducer from '../Slices/subscriptionSlice';
import borrowerReducer from '../Slices/borrowerSlice';
import borrowerLoanReducer from '../Slices/borrowerLoanSlice';
import lenderPaymentReducer from '../Slices/lenderPaymentSlice';

const rootReducer = combineReducers({
    auth: authReducer,
    loans: loanReducer,
    subscription: subscriptionReducer,
    borrowers: borrowerReducer,
    borrowerLoans: borrowerLoanReducer,
    lenderPayments: lenderPaymentReducer,
});

export default rootReducer;
