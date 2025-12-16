import React, { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Dimensions,
  Animated,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useDispatch, useSelector } from 'react-redux';
import {
  createLoan,
  getLoanByAadhar,
  updateLoan,
} from '../../Redux/Slices/loanSlice';
import Toast from 'react-native-toast-message';
import { m } from 'walstar-rn-responsive';
import Header from '../../Components/Header';
import { LinearGradient } from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

export default function AddDetails({ route, navigation }) {
  const dispatch = useDispatch();
  const { error, aadharError, loading } = useSelector(
    state => state.loans,
  );
  const { loanDetails } = route.params || {};

  const [formData, setFormData] = useState({
    name: loanDetails?.name || '',
    mobileNumber: loanDetails?.mobileNumber || '',
    aadhaarNumber: loanDetails?.aadhaarNumber || '',
    address: loanDetails?.address || '',
    amount: loanDetails?.amount?.toString() || '',
    loanStartDate: loanDetails?.loanStartDate || null,
    loanEndDate: loanDetails?.loanEndDate || null,
    purpose: loanDetails?.purpose || '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [showOldHistoryButton, setShowOldHistoryButton] = useState(false);
  const [isStartDatePickerVisible, setStartDatePickerVisible] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);
  const [isFocused, setIsFocused] = useState({});

  // Focus animation
  const focusAnim = new Animated.Value(0);

  const handleFocus = (field) => {
    setIsFocused({ [field]: true });
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = (field) => {
    setIsFocused({ [field]: false });
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Validate form fields
  const validateForm = () => {
    const {
      name,
      mobileNumber,
      aadhaarNumber,
      address,
      amount,
      loanStartDate,
      loanEndDate,
      purpose,
    } = formData;

    if (
      !name ||
      !mobileNumber ||
      !aadhaarNumber ||
      !address ||
      !amount ||
      !loanStartDate ||
      !loanEndDate ||
      !purpose
    ) {
      setErrorMessage('All fields are required.');
      return false;
    }
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      setErrorMessage('Amount should be a positive number.');
      return false;
    }
    if (loanStartDate >= loanEndDate) {
      setErrorMessage('Loan start date must be before loan end date.');
      return false;
    }

    setErrorMessage('');
    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!validateForm()) return;

    const aadharNumber = formData.aadhaarNumber?.trim();
    if (!aadharNumber || aadharNumber.length !== 12) {
      setErrorMessage('Please enter a valid 12-digit Aadhar number.');
      return;
    }

    const newData = {
      name: formData.name.trim(),
      mobileNumber: formData.mobileNumber.trim(),
      aadharCardNo: aadharNumber,
      address: formData.address.trim(),
      amount: parseFloat(formData.amount),
      loanStartDate: formData.loanStartDate instanceof Date
        ? formData.loanStartDate.toISOString()
        : formData.loanStartDate,
      loanEndDate: formData.loanEndDate instanceof Date
        ? formData.loanEndDate.toISOString()
        : formData.loanEndDate,
      purpose: formData.purpose.trim(),
    };

    try {
      const action = loanDetails
        ? updateLoan({ ...newData, id: loanDetails._id })
        : createLoan(newData);
      const response = await dispatch(action);

      if (
        createLoan.fulfilled.match(response) ||
        updateLoan.fulfilled.match(response)
      ) {
        Toast.show({
          type: 'success',
          position: 'top',
          text1: 'Loan saved successfully',
        });
        navigation.navigate('BottomNavigation', { screen: 'Outward' });
      } else {
        let errorMsg =
          response.payload?.message ||
          response.payload?.error?.message ||
          (Array.isArray(response.payload?.errors)
            ? response.payload.errors.join(', ')
            : response.payload?.errors) ||
          response.payload?.error ||
          'An error occurred.';

        if (errorMsg.includes('Aadhar number does not exist') ||
          errorMsg.includes('Aadhar number') && errorMsg.includes('not exist')) {
          errorMsg = 'The borrower with this Aadhar number is not registered. Please ask them to register first, or verify the Aadhar number is correct.';
        }

        setErrorMessage(errorMsg);
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Cannot Create Loan',
          text2: errorMsg,
          visibilityTime: 5000,
        });
      }
    } catch (error) {
      console.error('Error submitting data:', error);
      const errorMsg = error.message || 'An error occurred while saving the loan.';
      setErrorMessage(errorMsg);
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: errorMsg,
      });
    }
  };

  // Reset form fields
  const resetForm = () => {
    setFormData({
      name: '',
      mobileNumber: '',
      aadhaarNumber: '',
      address: '',
      amount: '',
      loanStartDate: null,
      loanEndDate: null,
      purpose: '',
    });
    setErrorMessage('');
    setShowOldHistoryButton(false);
  };

  // Handle Aadhar number change
  const handleAadharChange = text => {
    if (!/^\d{0,12}$/.test(text)) return;
    setFormData({ ...formData, aadhaarNumber: text });
    setShowOldHistoryButton(text.length === 12);
    if (text.length === 12) dispatch(getLoanByAadhar({ aadhaarNumber: text }));
  };

  // Handle contact number change
  const handleContactNoChange = text => {
    if (/^[0-9]{0,10}$/.test(text)) {
      setFormData({ ...formData, mobileNumber: text });
    }
  };

  // Handle date picker changes
  const handleDateChange = (type, date) => {
    setFormData({ ...formData, [type]: date });
    if (type === 'loanStartDate') setStartDatePickerVisible(false);
    else setEndDatePickerVisible(false);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 20}>
        <Header
          title={loanDetails ? 'Edit Loan Details' : 'Add Loan Details'}
          showBackButton
        />

        <ScrollView
          style={styles.scrollViewContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">

          <View style={styles.headerCard}>
            <Text style={styles.headerTitle}>
              {loanDetails ? 'Update Loan Information' : 'Add New Loan'}
            </Text>
            <Text style={styles.headerSubtitle}>
              Fill the form below to {loanDetails ? 'update' : 'create'} loan details
            </Text>
          </View>

          <View style={styles.formContainer}>
            {/* Personal Information Section */}
            <View style={styles.sectionHeader}>
              <Icon name="account-details" size={22} color="#ff7900" />
              <Text style={styles.sectionTitle}>Personal Information</Text>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <Icon name="account" size={20} color="#666" />
              </View>
              <TextInput
                style={[styles.input, isFocused.name && styles.inputFocused]}
                placeholder="Full Name"
                value={formData.name}
                onChangeText={text => setFormData({ ...formData, name: text })}
                placeholderTextColor="#888"
                onFocus={() => handleFocus('name')}
                onBlur={() => handleBlur('name')}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <Icon name="phone" size={20} color="#666" />
              </View>
              <TextInput
                style={[styles.input, isFocused.mobileNumber && styles.inputFocused]}
                placeholder="Contact Number"
                value={formData.mobileNumber}
                onChangeText={handleContactNoChange}
                keyboardType="phone-pad"
                placeholderTextColor="#888"
                onFocus={() => handleFocus('mobileNumber')}
                onBlur={() => handleBlur('mobileNumber')}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <Icon name="card-account-details" size={20} color="#666" />
              </View>
              <TextInput
                style={[styles.input, isFocused.aadhaarNumber && styles.inputFocused]}
                placeholder="Aadhar Card No"
                value={formData.aadhaarNumber}
                onChangeText={handleAadharChange}
                keyboardType="numeric"
                placeholderTextColor="#888"
                onFocus={() => handleFocus('aadhaarNumber')}
                onBlur={() => handleBlur('aadhaarNumber')}
              />
            </View>

            {showOldHistoryButton && (
              <View style={styles.historyContainer}>
                {aadharError ? (
                  <View style={styles.errorContainer}>
                    <View style={styles.errorHeader}>
                      <Icon name="alert-circle" size={20} color="#dc2626" />
                      <Text style={styles.errorTitle}>User Not Found</Text>
                    </View>
                    <Text style={styles.errorMessage}>
                      {aadharError.message || aadharError || 'User with this Aadhar number not found'}
                    </Text>
                    <Text style={styles.errorNote}>
                      Note: The borrower must be registered in the system before creating a loan.
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.oldHistoryButton}
                    onPress={() =>
                      navigation.navigate('OldHistoryPage', {
                        aadharNo: formData.aadhaarNumber,
                      })
                    }>
                    <Icon name="history" size={20} color="#FFF" />
                    <Text style={styles.oldHistoryButtonText}>View Loan History</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={styles.inputGroup}>
              <View style={[styles.inputIcon, styles.textAreaIcon]}>
                <Icon name="home-map-marker" size={20} color="#666" />
              </View>
              <TextInput
                style={[styles.textArea, isFocused.address && styles.inputFocused]}
                placeholder="Address"
                value={formData.address}
                onChangeText={text => setFormData({ ...formData, address: text })}
                multiline
                numberOfLines={3}
                placeholderTextColor="#888"
                onFocus={() => handleFocus('address')}
                onBlur={() => handleBlur('address')}
              />
            </View>

            {/* Loan Details Section */}
            <View style={[styles.sectionHeader, { marginTop: m(14) }]}>
              <Icon name="cash-multiple" size={22} color="#ff7900" />
              <Text style={styles.sectionTitle}>Loan Details</Text>
            </View>

            <View style={styles.amountContainer}>
              <View style={styles.amountInputGroup}>
                <View style={styles.inputIcon}>
                  <Icon name="currency-inr" size={20} color="#666" />
                </View>
                <TextInput
                  style={[styles.amountInput, isFocused.amount && styles.inputFocused]}
                  placeholder="Loan Amount"
                  value={formData.amount}
                  onChangeText={text => setFormData({ ...formData, amount: text })}
                  keyboardType="numeric"
                  placeholderTextColor="#888"
                  onFocus={() => handleFocus('amount')}
                  onBlur={() => handleBlur('amount')}
                />
                <Text style={styles.currencyText}>INR</Text>
              </View>
            </View>

            <View style={styles.dateRow}>
              <TouchableOpacity
                style={styles.dateInputContainer}
                activeOpacity={0.7}
                onPress={() => {
                  Keyboard.dismiss();
                  setStartDatePickerVisible(true);
                }}>
                <View style={styles.inputIcon}>
                  <Icon name="calendar-start" size={20} color="#666" />
                </View>
                <View style={styles.dateTextContainer}>
                  <Text
                    style={[
                      styles.datePlaceholder,
                      formData.loanStartDate && styles.datePlaceholderFilled
                    ]}
                    numberOfLines={1}
                  >
                    {formData.loanStartDate ? 'Start Date' : 'Start Date'}
                  </Text>
                  {formData.loanStartDate && (
                    <Text
                      style={styles.dateValue}
                      numberOfLines={1}
                    >
                      {new Date(formData.loanStartDate).toLocaleDateString()}
                    </Text>
                  )}
                </View>
                <Icon name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateInputContainer}
                activeOpacity={0.7}
                onPress={() => {
                  Keyboard.dismiss();
                  setEndDatePickerVisible(true);
                }}>
                <View style={styles.inputIcon}>
                  <Icon name="calendar-end" size={20} color="#666" />
                </View>
                <View style={styles.dateTextContainer}>
                  <Text
                    style={[
                      styles.datePlaceholder,
                      formData.loanEndDate && styles.datePlaceholderFilled
                    ]}
                    numberOfLines={1}
                  >
                    {formData.loanEndDate ? 'End Date' : 'End Date'}
                  </Text>
                  {formData.loanEndDate && (
                    <Text
                      style={styles.dateValue}
                      numberOfLines={1}
                    >
                      {new Date(formData.loanEndDate).toLocaleDateString()}
                    </Text>
                  )}
                </View>
                <Icon name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <View style={[styles.inputIcon, styles.textAreaIcon]}>
                <Icon name="note-text" size={20} color="#666" />
              </View>
              <TextInput
                style={[styles.textArea, isFocused.purpose && styles.inputFocused]}
                placeholder="Purpose of Loan"
                value={formData.purpose}
                onChangeText={text => setFormData({ ...formData, purpose: text })}
                multiline
                numberOfLines={3}
                placeholderTextColor="#888"
                onFocus={() => handleFocus('purpose')}
                onBlur={() => handleBlur('purpose')}
              />
            </View>

            {(errorMessage || error) && (
              <View style={styles.errorCard}>
                <Icon name="alert" size={20} color="#dc2626" />
                <Text style={styles.errorText}>
                  {errorMessage || error?.message || 'An unknown error occurred.'}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetForm}
                activeOpacity={0.8}>
                <Icon name="refresh" size={20} color="#666" />
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}>
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Icon
                      name={loanDetails ? "check-circle" : "plus-circle"}
                      size={20}
                      color="#FFF"
                    />
                    <Text style={styles.submitButtonText}>
                      {loanDetails ? 'Update Loan' : 'Create Loan'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Date Pickers */}
        <DateTimePickerModal
          isVisible={isStartDatePickerVisible}
          mode="date"
          onConfirm={date => handleDateChange('loanStartDate', date)}
          onCancel={() => setStartDatePickerVisible(false)}
          minimumDate={new Date()}
          display="spinner"
        />

        <DateTimePickerModal
          isVisible={isEndDatePickerVisible}
          mode="date"
          onConfirm={date => handleDateChange('loanEndDate', date)}
          onCancel={() => setEndDatePickerVisible(false)}
          minimumDate={new Date()}
          display="spinner"
        />
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollViewContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: m(40),
  },
  headerCard: {
    backgroundColor: '#FFF',
    marginHorizontal: m(20),
    marginTop: m(20),
    marginBottom: m(10),
    padding: m(24),
    borderRadius: m(20),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  headerTitle: {
    fontSize: m(18),
    fontFamily: 'Montserrat-Bold',
    color: '#ff8500',
    textAlign: 'center',
    marginBottom: m(6),
  },
  headerSubtitle: {
    fontSize: m(14),
    fontFamily: 'Montserrat-Regular',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: m(20),
  },
  formContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: m(20),
    marginBottom: m(20),
    padding: m(24),
    borderRadius: m(20),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(20),
    paddingBottom: m(10),
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: m(16),
    fontFamily: 'Montserrat-SemiBold',
    color: '#1e293b',
    marginLeft: m(10),
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(12),
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    paddingHorizontal: m(14),
  },
  inputIcon: {
    padding: m(12),
    backgroundColor: '#f1f5f9',
  },
  textAreaIcon: {
    alignSelf: 'flex-start',
    paddingTop: m(16),

  },
  input: {
    flex: 1,
    padding: m(12),
    fontSize: m(15),
    fontFamily: 'Montserrat-Regular',
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  inputFocused: {
    borderColor: '#ff7900',
    backgroundColor: '#FFF',
  },
  textArea: {
    flex: 1,
    padding: m(12),
    fontSize: m(15),
    fontFamily: 'Montserrat-Regular',
    color: '#1e293b',
    minHeight: m(70),
    textAlignVertical: 'top',
    backgroundColor: '#f8fafc',
  },
  historyContainer: {
    marginBottom: m(20),
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: m(12),
    padding: m(16),
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(8),
  },
  errorTitle: {
    fontSize: m(14),
    fontFamily: 'Montserrat-SemiBold',
    color: '#dc2626',
    marginLeft: m(8),
  },
  errorMessage: {
    fontSize: m(13),
    fontFamily: 'Montserrat-Regular',
    color: '#b91c1c',
    lineHeight: m(18),
    marginBottom: m(8),
  },
  errorNote: {
    fontSize: m(12),
    fontFamily: 'Montserrat-Regular',
    color: '#92400e',
    lineHeight: m(16),
  },
  oldHistoryButton: {
    backgroundColor: '#ff7900',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: m(14),
    borderRadius: m(12),
    gap: m(10),
  },
  oldHistoryButtonText: {
    color: '#FFF',
    fontSize: m(15),
    fontFamily: 'Montserrat-SemiBold',
  },
  amountContainer: {
    marginBottom: m(16),
  },
  amountInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    paddingHorizontal: m(12),

  },
  amountInput: {
    flex: 1,
    padding: m(12),
    fontSize: m(16),
    fontFamily: 'Montserrat-SemiBold',
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  currencyText: {
    paddingHorizontal: m(16),
    fontSize: m(14),
    fontFamily: 'Montserrat-Medium',
    color: '#64748b',
  },
  dateRow: {
    flexDirection: 'row',
    gap: m(12),
    marginBottom: m(20),
  },
  dateInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: m(12),
    paddingVertical: m(10),
    minHeight: m(52),
  },
  inputIcon: {
    marginRight: m(8),
  },
  dateTextContainer: {
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: m(8),
  },
  datePlaceholder: {
    fontSize: m(13),
    fontFamily: 'Montserrat-Regular',
    color: '#888',
    lineHeight: m(18),
  },
  datePlaceholderFilled: {
    fontSize: m(11),
    color: '#94a3b8',
    fontFamily: 'Montserrat-Medium',
  },
  dateValue: {
    fontSize: m(14),
    fontFamily: 'Montserrat-SemiBold',
    color: '#1e293b',
    lineHeight: m(20),
    marginTop: m(2),
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: m(12),
    padding: m(16),
    marginBottom: m(20),
    gap: m(10),
  },
  errorText: {
    flex: 1,
    fontSize: m(13),
    fontFamily: 'Montserrat-Regular',
    color: '#b91c1c',
    lineHeight: m(18),
  },
  actionButtons: {
    flexDirection: 'row',
    gap: m(12),
    marginTop: m(10),
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: m(10),
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    gap: m(8),
  },
  resetButtonText: {
    fontSize: m(14),
    fontFamily: 'Montserrat-SemiBold',
    color: '#64748b',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: m(10),
    borderRadius: m(12),
    backgroundColor: '#ff7900',
    gap: m(10),
  },
  submitButtonText: {
    fontSize: m(14),
    fontFamily: 'Montserrat-Bold',
    color: '#FFF',
  },
});