import {useEffect} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {setUser} from '../Slices/authslice';
import {baseurl} from '../../Utils/API';

const useFetchUserFromStorage = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.auth.user);

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

          // Preserve roleId from Redux state or AsyncStorage if API doesn't return it
          if (userData.roleId === undefined || userData.roleId === null) {
            if (currentUser?.roleId !== undefined && currentUser?.roleId !== null) {
              userData.roleId = currentUser.roleId;
            } else {
              const existingUserStr = await AsyncStorage.getItem('user');
              if (existingUserStr) {
                try {
                  const existingUser = JSON.parse(existingUserStr);
                  if (existingUser.roleId !== undefined && existingUser.roleId !== null) {
                    userData.roleId = existingUser.roleId;
                  }
                } catch (e) {
                  console.error('Error parsing existing user data:', e);
                }
              }
            }
          }

          dispatch(setUser(userData));

          // Optionally, store the updated user data in AsyncStorage if you want it available locally
          await AsyncStorage.setItem('user', JSON.stringify(userData));
        }
      } catch (error) {
        console.error('Error fetching user from API:', error);
      }
    };

    fetchUser();
  }, [dispatch, currentUser?.roleId]);
};

export default useFetchUserFromStorage;
