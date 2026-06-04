import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { m } from 'walstar-rn-responsive';
import { FontFamily, FontSizes } from '../../constants';
import bcrypt from 'react-native-bcrypt';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { registerUser } from '../../Redux/Slices/authslice';

export default function CreatePin({ navigation, route }) {
  const { userData } = route.params || {};
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState('');
  const [isCreatingPin, setIsCreatingPin] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const { isLoading } = useSelector(state => state.auth || {});
  const dispatch = useDispatch();

  const pinInputs = useRef([]);
  const confirmPinInputs = useRef([]);

  const handlePinChange = (text, index) => {
    const newPin = [...pin];
    newPin[index] = text;
    setPin(newPin);
    setPinError('');

    // Auto-focus next input
    if (text && index < 3) {
      pinInputs.current[index + 1].focus();
    }
  };

  const handleConfirmPinChange = (text, index) => {
    const newConfirmPin = [...confirmPin];
    newConfirmPin[index] = text;
    setConfirmPin(newConfirmPin);
    setPinError('');

    // Auto-focus next input
    if (text && index < 3) {
      confirmPinInputs.current[index + 1].focus();
    }
  };

  const handlePinKeyPress = (e, index) => {
    // Handle backspace to go to previous input
    if (e.nativeEvent.key === 'Backspace' && !pin[index] && index > 0) {
      pinInputs.current[index - 1].focus();
    }
  };

  const handleConfirmPinKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !confirmPin[index] && index > 0) {
      confirmPinInputs.current[index - 1].focus();
    }
  };

  const validatePin = () => {
    const pinString = pin.join('');
    const confirmPinString = confirmPin.join('');

    if (pinString.length !== 4) {
      setPinError('PIN must be 4 digits');
      return false;
    }

    if (pinString !== confirmPinString) {
      setPinError('PINs do not match');
      return false;
    }

    // Check for sequential numbers (1234, 2345, etc.)
    const isSequential = '1234,2345,3456,4567,5678,6789'.includes(pinString);
    if (isSequential) {
      setPinError('Please choose a more secure PIN (avoid sequential numbers)');
      return false;
    }

    // Check for repeated numbers (1111, 2222, etc.)
    const isRepeated = /^(\d)\1{3}$/.test(pinString);
    if (isRepeated) {
      setPinError('Please choose a more secure PIN (avoid repeated digits)');
      return false;
    }

    return true;
  };

  const handleCreatePin = async () => {
    if (!validatePin()) return;

    if (!userData) {
      setPinError('Registration details are missing. Please start again.');
      return;
    }

    setIsCreatingPin(true);

    try {
      const pinString = pin.join('');
      const salt = bcrypt.genSaltSync(10);
      const hashedPin = bcrypt.hashSync(pinString, salt);
      const formData = new FormData();

      formData.append('userName', userData.name);
      formData.append('email', userData.email);
      formData.append('address', userData.address);
      formData.append('password', userData.password);
      formData.append('confirmPassword', userData.confirmPassword);
      formData.append('aadharCardNo', userData.aadharNumber);
      formData.append('mobileNo', userData.mobileNumber);
      formData.append('roleId', userData.roleId.toString());
      formData.append('pinHash', hashedPin);
      formData.append('pinCreatedAt', new Date().toISOString());

      if (userData.panCardNumber && userData.panCardNumber.length === 10) {
        formData.append('panCardNumber', userData.panCardNumber);
      }

      if (userData.profileImage) {
        formData.append('profileImage', {
          uri: userData.profileImage.uri,
          type: userData.profileImage.type || 'image/jpeg',
          name: userData.profileImage.fileName || 'profile.jpg',
        });
      }

      await dispatch(registerUser(formData)).unwrap();

      Toast.show({
        type: 'success',
        position: 'top',
        text1: 'Account created successfully!',
      });

      if (userData.roleId === 2) {
        navigation.replace('ConsentScreen', {
          source: 'register',
          aadhaarNumber: userData.aadharNumber,
        });
        return;
      }

      navigation.replace('Login');
    } catch (error) {
      const errorMessage =
        (typeof error === 'string' ? error : null) ||
        error?.message ||
        (error?.missingFields
          ? `Missing fields: ${error.missingFields.join(', ')}`
          : null) ||
        'Registration failed. Please try again.';

      Toast.show({
        type: 'error',
        position: 'top',
        text1: errorMessage,
      });
      setPinError(errorMessage);
    } finally {
      setIsCreatingPin(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#ff6700" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContent}>
          <Text style={styles.appName}>LoanHub</Text>
          <Text style={styles.tagline}>Secure Your Account</Text>
        </View>

        <View style={styles.formCard}>
          {/* Security Icon */}
          <View style={styles.iconCircle}>
            <Ionicons
              name="shield-checkmark-outline"
              size={m(50)}
              color="#ff6700"
            />
          </View>

          <Text style={styles.title}>Create Your Security PIN</Text>

          <View style={styles.warningBox}>
            <Ionicons
              name="information-circle-outline"
              size={m(24)}
              color="#ff7900"
            />
            <Text style={styles.warningText}>
              This PIN will be required whenever you accept a loan or perform
              important actions.
            </Text>
          </View>

          {/* PIN Input Section */}
          <Text style={styles.inputLabel}>Enter 4-Digit PIN</Text>
          <View style={styles.pinContainer}>
            {[0, 1, 2, 3].map(index => (
              <TextInput
                key={`pin-${index}`}
                ref={ref => {
                  pinInputs.current[index] = ref;
                }}
                style={[styles.pinInput, pin[index] && styles.pinInputFilled]}
                value={pin[index]}
                onChangeText={text => handlePinChange(text, index)}
                onKeyPress={e => handlePinKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                secureTextEntry={!showPin}
                textAlign="center"
              />
            ))}
          </View>

          {/* Confirm PIN Section */}
          <Text style={[styles.inputLabel, styles.confirmLabel]}>
            Confirm PIN
          </Text>
          <View style={styles.pinContainer}>
            {[0, 1, 2, 3].map(index => (
              <TextInput
                key={`confirm-${index}`}
                ref={ref => {
                  confirmPinInputs.current[index] = ref;
                }}
                style={[
                  styles.pinInput,
                  confirmPin[index] && styles.pinInputFilled,
                ]}
                value={confirmPin[index]}
                onChangeText={text => handleConfirmPinChange(text, index)}
                onKeyPress={e => handleConfirmPinKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                secureTextEntry={!showPin}
                textAlign="center"
              />
            ))}
          </View>

          {/* Show/Hide PIN Toggle */}
          <TouchableOpacity
            style={styles.showPinButton}
            onPress={() => setShowPin(!showPin)}
          >
            <Ionicons
              name={showPin ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#ff7900"
            />
            <Text style={styles.showPinText}>
              {showPin ? 'Hide PIN' : 'Show PIN'}
            </Text>
          </TouchableOpacity>

          {pinError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={18} color="#FF4444" />
              <Text style={styles.errorText}>{pinError}</Text>
            </View>
          ) : null}

          {/* Security Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>🔐 PIN Security Tips:</Text>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#28a745" />
              <Text style={styles.tipText}>
                Never share your PIN with anyone
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#28a745" />
              <Text style={styles.tipText}>
                Avoid using 1234, 0000, or birth year
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#28a745" />
              <Text style={styles.tipText}>
                Don't write it down or save in phone
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color="#28a745" />
              <Text style={styles.tipText}>We will never ask for your PIN</Text>
            </View>
          </View>

          {/* Create PIN Button */}
          <TouchableOpacity
            style={[
              styles.createButton,
              (isCreatingPin || isLoading) && styles.createButtonDisabled,
            ]}
            onPress={handleCreatePin}
            disabled={isCreatingPin || isLoading}
          >
            <LinearGradient
              colors={['#ff6700', '#ff7900', '#ff8500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createButtonGradient}
            >
              {isCreatingPin || isLoading ? (
                <Text style={styles.createButtonText}>Creating Account...</Text>
              ) : (
                <>
                  <Text style={styles.createButtonText}>
                    Create PIN & Continue
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.securityFooter}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#999" />
          <Text style={styles.securityFooterText}>
            End-to-end encrypted • Bank-level security
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ff6700',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#ff6700',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: m(20),
    paddingTop: Platform.OS === 'ios' ? m(52) : m(32),
    paddingBottom: m(40),
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: m(18),
  },
  appName: {
    fontSize: FontSizes['4xl'],
    fontFamily: FontFamily.secondaryBold,
    color: '#FFFFFF',
  },
  tagline: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.secondaryRegular,
    color: '#FFFFFF',
    marginTop: m(6),
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(20),
    padding: m(24),
    borderWidth: 1,
    borderColor: '#FFEDD5',
    elevation: 8,
    shadowColor: '#ff6700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  iconCircle: {
    width: m(90),
    height: m(90),
    borderRadius: m(45),
    backgroundColor: '#FFF9F0',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#FFEDD5',
    marginBottom: m(16),
  },
  title: {
    fontSize: FontSizes['2xl'],
    fontFamily: FontFamily.secondaryBold,
    color: '#333',
    textAlign: 'center',
    marginBottom: m(16),
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF7ED',
    borderRadius: m(12),
    padding: m(12),
    marginBottom: m(24),
    borderWidth: 1,
    borderColor: '#FFEDD5',
    gap: m(8),
  },
  warningText: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#7C2D12',
    lineHeight: m(18),
  },
  inputLabel: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: '#555',
    marginBottom: m(12),
  },
  confirmLabel: {
    marginTop: m(20),
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: m(12),
  },
  pinInput: {
    flex: 1,
    height: m(60),
    backgroundColor: '#FFF9F0',
    borderRadius: m(12),
    borderWidth: 2,
    borderColor: '#FFEDD5',
    fontSize: FontSizes['2xl'],
    fontFamily: FontFamily.primarySemiBold,
    color: '#333',
    textAlign: 'center',
    padding: 0,
  },
  pinInputFilled: {
    borderColor: '#28a745',
    backgroundColor: '#F0FFF4',
  },
  showPinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
    marginTop: m(16),
    padding: m(8),
  },
  showPinText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryMedium,
    color: '#ff7900',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: m(8),
    padding: m(12),
    marginTop: m(16),
    gap: m(8),
  },
  errorText: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#FF4444',
  },
  tipsContainer: {
    backgroundColor: '#F0FDF4',
    borderRadius: m(12),
    padding: m(16),
    marginTop: m(24),
    marginBottom: m(24),
  },
  tipsTitle: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.primarySemiBold,
    color: '#166534',
    marginBottom: m(12),
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    marginBottom: m(8),
  },
  tipText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#14532D',
  },
  createButton: {
    borderRadius: m(12),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#ff6700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(16),
    gap: m(8),
  },
  createButtonText: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.primarySemiBold,
    color: '#FFFFFF',
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
    marginTop: m(20),
    padding: m(12),
  },
  securityFooterText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.primaryRegular,
    color: '#FFFFFF',
  },
});
