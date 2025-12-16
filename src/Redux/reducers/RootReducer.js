import { combineReducers } from 'redux';
import authReducer from '../Slices/authslice';
import loanReducer from '../Slices/loanSlice';
import subscriptionReducer from '../Slices/subscriptionSlice';

const rootReducer = combineReducers({
    auth: authReducer,
    loans: loanReducer,
    subscription: subscriptionReducer,
});

export default rootReducer;
