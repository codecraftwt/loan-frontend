import { combineReducers } from 'redux';
import authReducer from '../Slices/authslice';
import loanReducer from '../Slices/loanSlice';
import subscriptionReducer from '../Slices/subscriptionSlice';
import borrowerReducer from '../Slices/borrowerSlice';

const rootReducer = combineReducers({
    auth: authReducer,
    loans: loanReducer,
    subscription: subscriptionReducer,
    borrowers: borrowerReducer,
});

export default rootReducer;
