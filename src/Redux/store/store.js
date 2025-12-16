import { configureStore} from '@reduxjs/toolkit';
import rootReducer from '../reducers/RootReducer';
// import Reactotron from '../../../ReactotronConfig';

const store = configureStore({
  reducer: rootReducer,
  // enhancers: getDefaultEnhancers => getDefaultEnhancers().concat(Reactotron.createEnhancer()),
});

export default store;

