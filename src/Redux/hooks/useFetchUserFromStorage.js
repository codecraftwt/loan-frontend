import {useEffect} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {setUser} from '../Slices/authslice';
import {baseurl} from '../../Utils/API';

const useFetchUserFromStorage = () => {
  const dispatch = useDispatch();
  // const user = useSelector(state => state.auth.user);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem('token');

        if (token) {
          // Make an API call to fetch the user data from the backend
          const response = await axios.get(`${baseurl}user/user-data`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const userData = response.data.user;

          console.log('User Data updated');

          dispatch(setUser(userData));

          // Optionally, store the updated user data in AsyncStorage if you want it available locally
          await AsyncStorage.setItem('user', JSON.stringify(userData));

          console.log(
            'User details fetched from the API and updated in Redux store',
          );
        } else {
          console.log('No token found in AsyncStorage');
        }
      } catch (error) {
        console.error('Error fetching user from API:', error);
      }
    };

    fetchUser();
  }, [dispatch]);
};

export default useFetchUserFromStorage;
