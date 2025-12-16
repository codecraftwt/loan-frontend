import Reactotron from 'reactotron-react-native';
import { reactotronRedux } from 'reactotron-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

Reactotron
  .setAsyncStorageHandler(AsyncStorage)
  .configure({ name: 'ExpressOwner' })
  .useReactNative()
  .use(reactotronRedux())
  .connect();

Reactotron.clear();

console.tron = Reactotron;

export default Reactotron;
