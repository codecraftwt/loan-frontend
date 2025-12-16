import React, {useState} from 'react';
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
import {useDispatch, useSelector} from 'react-redux';
import {forgotPassword} from '../../Redux/Slices/authslice';
import Toast from 'react-native-toast-message';
import {m} from 'walstar-rn-responsive';

export default function ForgotPassword({navigation}) {
  const dispatch = useDispatch();

  const forgotPasswordMessage = useSelector(
    state => state.auth.forgotPasswordMessage,
  );
  const error = useSelector(state => state.auth.error);

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Validate Email Format
  const validateEmail = text => {
    setEmail(text);
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (emailRegex.test(text)) {
      setEmailError('');
    } else {
      setEmailError('Please enter a valid email address.');
    }
  };

  // Check if form is valid
  const isFormValid = () => email.length > 0 && !emailError;

  // Handle form submission (forgot password)
  const handleForgotPassword = async () => {
    if (isFormValid()) {
      try {
        const response = await dispatch(forgotPassword(email));

        if (
          response?.payload?.message === 'Verification code sent to your email'
        ) {
          navigation.navigate('OTP', {email});

          Toast.show({
            type: 'success',
            position: 'top',
            text1: response.payload.message,
          });
        } else {
          const errorMessage =
            response?.payload?.message ||
            response?.payload ||
            'An error occurred. Please try again.';

          Toast.show({
            type: 'error',
            position: 'top',
            text1: errorMessage,
          });
        }
      } catch (error) {
        console.error('Error during forgot password:', error);

        Toast.show({
          type: 'error',
          position: 'top',
          text1: error?.message || 'An unexpected error occurred.',
        });
      }
    } else {
      alert('Please enter a valid email address.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" {...(Platform.OS === 'android' && {backgroundColor: '#fff'})} />
      <Text style={styles.headerText}>Forgot Password</Text>
      <Text style={styles.instructionText}>
        Enter your email address to receive an OTP.
      </Text>

      {/* Email Input Field */}
      <TextInput
        style={styles.input}
        placeholder="Email Address"
        keyboardType="email-address"
        placeholderTextColor="#666666"
        value={email}
        onChangeText={validateEmail}
      />
      {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

      {/* Continue Button */}
      <TouchableOpacity
        style={[styles.continueButton, {opacity: isFormValid() ? 1 : 0.5}]}
        onPress={handleForgotPassword}
        disabled={!isFormValid()}>
        <Text style={styles.continueButtonText}>Continue</Text>
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
    fontSize: m(26),
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
  input: {
    height: m(60),
    borderColor: '#f26fb7',
    borderWidth: m(1),
    borderRadius: m(8),
    marginBottom: m(15),
    paddingHorizontal: m(16),
    fontSize: m(16),
    fontFamily: 'Poppins-Regular',
    color: '#333333',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: m(2)},
    shadowOpacity: 0.1,
    shadowRadius: m(4),
  },
  errorText: {
    fontSize: m(14),
    color: 'red',
    fontFamily: 'Poppins-Regular',
    marginBottom: m(10),
  },
  continueButton: {
    backgroundColor: '#b80266',
    borderRadius: m(8),
    height: m(60),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: m(10),
    elevation: m(4),
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: m(18),
    fontFamily: 'Poppins-Bold',
  },
});
