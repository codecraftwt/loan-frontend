import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import Toast from 'react-native-toast-message';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useDispatch} from 'react-redux';
import {resetPassword} from '../../Redux/Slices/authslice';
import {m} from 'walstar-rn-responsive';

export default function CreatePass({navigation, route}) {
  const {email, otp} = route.params;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const dispatch = useDispatch();

  const validatePassword = password => {
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasDigits = /\d/.test(password);
    return password.length >= 6 && hasLetters && hasDigits;
  };

  const handleApply = async () => {
    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'info',
        position: 'top',
        text1: 'Passwords do not match!',
      });
      return;
    }

    if (validatePassword(newPassword)) {
      // Dispatch resetPassword action
      const result = await dispatch(
        resetPassword({email, otp, newPassword}),
      ).unwrap();

      Toast.show({
        type: 'success',
        position: 'top',
        text1: 'Password reset successfully',
      });

      navigation.navigate('Login');
    } else {
      Toast.show({
        type: 'info',
        position: 'top',
        text1:
          'Password must be at least 6 characters long and contain both letters and digits.',
      });
    }
  };

  const isButtonDisabled = !validatePassword(newPassword) || !confirmPassword;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" {...(Platform.OS === 'android' && {backgroundColor: '#fff'})} />
      <Text style={styles.headerText}>Create New Password</Text>
      <Text style={styles.instructionText}>
        Please enter a new password below.
      </Text>

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Enter New Password"
          secureTextEntry={!passwordVisible}
          placeholderTextColor="#666666"
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
          <Ionicons
            name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
            size={25}
            color={'#f26fb7'}
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Confirm New Password"
          secureTextEntry={!confirmVisible}
          placeholderTextColor="#666666"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity onPress={() => setConfirmVisible(!confirmVisible)}>
          <Ionicons
            name={confirmVisible ? 'eye-off-outline' : 'eye-outline'}
            size={25}
            color={'#f26fb7'}
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.applyButton, {opacity: isButtonDisabled ? 0.5 : 1}]}
        onPress={handleApply}
        disabled={isButtonDisabled}>
        <Text style={styles.applyButtonText}>Apply</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    padding: m(20),
    justifyContent: 'center',
  },
  headerText: {
    fontSize: m(28),
    color: '#b80266',
    fontFamily: 'Montserrat-Bold',
    textAlign: 'center',
    marginBottom: m(20),
  },
  instructionText: {
    fontSize: m(16),
    color: '#333',
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginBottom: m(30),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#f26fb7',
    borderWidth: m(1),
    borderRadius: m(8),
    marginBottom: m(20),
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: m(2)},
    shadowOpacity: 0.1,
    shadowRadius: m(4),
  },
  input: {
    flex: 1,
    height: m(60),
    paddingHorizontal: m(16),
    fontSize: m(16),
    fontFamily: 'Poppins-Regular',
    color: '#333333',
  },
  icon: {
    paddingHorizontal: m(10),
  },
  applyButton: {
    backgroundColor: '#b80266',
    borderRadius: m(8),
    height: m(50),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: m(10),
    elevation: m(4),
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: m(18),
    fontFamily: 'Poppins-Bold',
  },
});
