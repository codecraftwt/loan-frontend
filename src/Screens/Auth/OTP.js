import React, {useState, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import {useDispatch} from 'react-redux';
import {verifyOtp} from '../../Redux/Slices/authslice';
import Toast from 'react-native-toast-message';
import {m} from 'walstar-rn-responsive';

export default function OTP({navigation, route}) {
  const {email} = route.params; // The email passed from the Forgot Password screen.
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle input change and focus logic
  const handleChange = (text, index) => {
    const numericText = text.replace(/[^0-9]/g, ''); // Allow only numeric input.
    const newOtp = [...otp];
    newOtp[index] = numericText;
    setOtp(newOtp);

    if (numericText && index < otp.length - 1) {
      inputRefs.current[index + 1].focus();
    } else if (!numericText && index > 0) {
      inputRefs.current[index - 1].focus(); // Go back to previous input if empty
    }
  };

  // Handle OTP verification
  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      Alert.alert('Error', 'Please enter a complete 6-digit OTP.');
      return;
    }

    setLoading(true);
    setError(null); // Clear previous error

    try {
      // Dispatch the verifyOtp action and wait for the response
      const result = await dispatch(verifyOtp({email, otp: otpCode})).unwrap();

      console.log('msg otp', result.message);

      console.log(result, 'result');

      if (result.message === 'Invalid verification code') {
        Alert.alert('Error', 'The OTP you entered is invalid or expired.');
      } else {
        // OTP is valid, navigate to CreatePass to set the new password
        navigation.navigate('CreatePass', {email, otp: otpCode});

        Toast.show({
          type: 'success',
          position: 'top',
          text1: 'OTP verified successfully',
        });
      }
    } catch (err) {
      setError(err || 'An error occurred while verifying the OTP.');
      console.log('msg otp --->', err);
      Toast.show({
        type: 'error',
        position: 'top',
        text1: err || 'Invalid OTP',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" {...(Platform.OS === 'android' && {backgroundColor: '#fff'})} />
      <Text style={styles.headerText}>Enter OTP</Text>
      <Text style={styles.instructionText}>
        We sent a 6-digit code to your email address.
      </Text>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            style={styles.otpInput}
            value={digit}
            onChangeText={text => handleChange(text, index)}
            keyboardType="numeric"
            maxLength={1}
            ref={el => (inputRefs.current[index] = el)}
          />
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.verifyButton,
          {opacity: otp.some(d => d === '') || loading ? 0.5 : 1},
        ]}
        onPress={handleVerify}
        disabled={otp.some(d => d === '') || loading}>
        <Text style={styles.verifyButtonText}>
          {loading ? 'Verifying...' : 'Verify OTP'}
        </Text>
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
    marginBottom: m(40),
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: m(30),
  },
  otpInput: {
    height: m(60),
    width: '14%',
    borderColor: '#f26fb7',
    borderWidth: m(1),
    borderRadius: m(8),
    textAlign: 'center',
    fontSize: m(24),
    fontFamily: 'Poppins-Regular',
    color: '#333333',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: m(2)},
    shadowOpacity: 0.1,
    shadowRadius: m(4),
  },
  verifyButton: {
    backgroundColor: '#b80266',
    borderRadius: m(8),
    height: m(50),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: m(10),
    elevation: m(4),
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: m(18),
    fontFamily: 'Poppins-Bold',
  },
});
