import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import {
  createPlan,
  updatePlan,
  clearErrors,
} from '../../../Redux/Slices/adminPlanSlice';

// Duration options for plan selection
const DURATION_OPTIONS = [
  { label: '1 month', value: '1 month' },
  { label: '2 months', value: '2 months' },
  { label: '3 months', value: '3 months' },
  { label: '6 months', value: '6 months' },
  { label: '1 year', value: '1 year' },
];

/**
 * CreateEditPlan Component
 * Form for creating or editing subscription plans
 */
export default function CreateEditPlan() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { creating, updating, createError, updateError } = useSelector(
    state => state.adminPlans,
  );

  const { plan, mode } = route.params || {};
  const isEditMode = mode === 'edit' && plan;

  // Form state
  const [planName, setPlanName] = useState('');
  const [duration, setDuration] = useState('1 month');
  const [priceMonthly, setPriceMonthly] = useState('');
  const [description, setDescription] = useState('');
  const [razorpayPlanId, setRazorpayPlanId] = useState('');
  const [advancedAnalytics, setAdvancedAnalytics] = useState(false);
  const [prioritySupport, setPrioritySupport] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Initialize form with plan data in edit mode
  useEffect(() => {
    if (isEditMode && plan) {
      setPlanName(plan.planName || '');
      setDuration(plan.duration || '1 month');
      setPriceMonthly(plan.priceMonthly?.toString() || '');
      setDescription(plan.description || '');
      setRazorpayPlanId(plan.razorpayPlanId || '');
      setAdvancedAnalytics(plan.planFeatures?.advancedAnalytics ?? false);
      setPrioritySupport(plan.planFeatures?.prioritySupport ?? false);
      setIsActive(plan.isActive !== undefined ? plan.isActive : true);
    }
  }, [isEditMode, plan]);

  // Handle errors
  useEffect(() => {
    if (createError) {
      Alert.alert('Error', createError);
      dispatch(clearErrors());
    }
    if (updateError) {
      Alert.alert('Error', updateError);
      dispatch(clearErrors());
    }
  }, [createError, updateError, dispatch]);

  // Form validation
  const validateForm = useCallback(() => {
    if (!planName.trim()) {
      Alert.alert('Error', 'Plan name is required');
      return false;
    }
    if (!duration) {
      Alert.alert('Error', 'Duration is required');
      return false;
    }
    const price = parseFloat(priceMonthly);
    if (!priceMonthly || isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Valid monthly price is required');
      return false;
    }
    return true;
  }, [planName, duration, priceMonthly]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    const planData = {
      planName: planName.trim(),
      duration,
      priceMonthly: parseFloat(priceMonthly),
      description: description.trim() || undefined,
      razorpayPlanId: razorpayPlanId.trim() || undefined,
      planFeatures: {
        advancedAnalytics,
        prioritySupport,
      },
      isActive,
    };

    if (isEditMode) {
      const result = await dispatch(
        updatePlan({ planId: plan._id, planData }),
      );
      if (updatePlan.fulfilled.match(result)) {
        Alert.alert('Success', 'Plan updated successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } else {
      const result = await dispatch(createPlan(planData));
      if (createPlan.fulfilled.match(result)) {
        Alert.alert('Success', 'Plan created successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    }
  }, [
    validateForm,
    planName,
    duration,
    priceMonthly,
    description,
    razorpayPlanId,
    advancedAnalytics,
    prioritySupport,
    isActive,
    isEditMode,
    plan,
    dispatch,
    navigation,
  ]);

  // Toggle component renderer
  const renderToggle = useCallback(
    (label, value, onToggle) => (
      <TouchableOpacity
        style={styles.toggleContainer}
        onPress={onToggle}
        activeOpacity={0.7}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <View
          style={[
            styles.toggleSwitch,
            value ? styles.toggleSwitchActive : styles.toggleSwitchInactive,
          ]}>
          <View
            style={[
              styles.toggleThumb,
              value ? styles.toggleThumbActive : styles.toggleThumbInactive,
            ]}
          />
        </View>
      </TouchableOpacity>
    ),
    [],
  );

  // Memoized submit button text
  const submitButtonText = useMemo(() => {
    if (creating || updating) return 'Processing...';
    return isEditMode ? 'Update Plan' : 'Create Plan';
  }, [creating, updating, isEditMode]);

  const isLoading = creating || updating;

  return (
    <View style={styles.container}>
      <Header
        title={isEditMode ? 'Edit Plan' : 'Create Plan'}
        showBackButton
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {isEditMode ? 'Edit Plan Details' : 'Create New Plan'}
          </Text>
          {!isEditMode && (
            <Text style={styles.formSubtitle}>
              Fill in the details to create a new subscription plan
            </Text>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Plan Name *</Text>
            <TextInput
              style={styles.input}
              value={planName}
              onChangeText={setPlanName}
              placeholder="e.g., Premium Plan - 1 Month"
              placeholderTextColor="#999"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Duration *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={duration}
                onValueChange={setDuration}
                style={styles.picker}
                dropdownIconColor="#666"
                enabled={!isLoading}>
                {DURATION_OPTIONS.map(option => (
                  <Picker.Item
                    key={option.value}
                    label={option.label}
                    value={option.value}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Monthly Price (₹) *</Text>
            <TextInput
              style={styles.input}
              value={priceMonthly}
              onChangeText={setPriceMonthly}
              keyboardType="decimal-pad"
              placeholder="e.g., 999.00"
              placeholderTextColor="#999"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter plan description..."
              multiline
              numberOfLines={4}
              placeholderTextColor="#999"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Razorpay Plan ID (Optional)</Text>
            <TextInput
              style={styles.input}
              value={razorpayPlanId}
              onChangeText={setRazorpayPlanId}
              placeholder="e.g., plan_123"
              placeholderTextColor="#999"
              editable={!isLoading}
            />
          </View>

          <View style={styles.featuresSection}>
            <Text style={styles.sectionLabel}>Plan Features</Text>
            <View style={styles.featuresNote}>
              <Icon name="info" size={16} color="#666" />
              <Text style={styles.featuresNoteText}>
                All plans include unlimited loans
              </Text>
            </View>
            {renderToggle(
              'Advanced Analytics',
              advancedAnalytics,
              () => setAdvancedAnalytics(!advancedAnalytics),
            )}
            {renderToggle(
              'Priority Support',
              prioritySupport,
              () => setPrioritySupport(!prioritySupport),
            )}
          </View>

          <View style={styles.inputGroup}>
            {renderToggle('Active Status', isActive, () =>
              setIsActive(!isActive),
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              isLoading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.8}>
            <LinearGradient
              colors={['#ff6700', '#ff7900']}
              style={styles.submitGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Icon
                  name={isEditMode ? 'save' : 'check'}
                  size={20}
                  color="#FFFFFF"
                />
              )}
              <Text style={styles.submitButtonText}>{submitButtonText}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: m(20),
    paddingBottom: m(100),
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    padding: m(24),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formTitle: {
    fontSize: m(24),
    fontWeight: '700',
    color: '#333',
    marginBottom: m(8),
    letterSpacing: 0.3,
  },
  formSubtitle: {
    fontSize: m(14),
    color: '#666',
    marginBottom: m(24),
    lineHeight: m(20),
  },
  inputGroup: {
    marginBottom: m(20),
  },
  label: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: m(8),
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: m(12),
    padding: m(16),
    fontSize: m(16),
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  pickerContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  picker: {
    color: '#333',
  },
  textArea: {
    height: m(100),
    textAlignVertical: 'top',
  },
  featuresSection: {
    marginBottom: m(20),
  },
  sectionLabel: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: m(12),
  },
  featuresNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
    marginBottom: m(12),
    padding: m(10),
    backgroundColor: '#F5F5F5',
    borderRadius: m(8),
  },
  featuresNoteText: {
    fontSize: m(12),
    color: '#666',
    flex: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: m(12),
  },
  toggleLabel: {
    fontSize: m(14),
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  toggleSwitch: {
    width: m(50),
    height: m(28),
    borderRadius: m(14),
    justifyContent: 'center',
    padding: m(2),
  },
  toggleSwitchActive: {
    backgroundColor: '#4CAF50',
  },
  toggleSwitchInactive: {
    backgroundColor: '#E0E0E0',
  },
  toggleThumb: {
    width: m(24),
    height: m(24),
    borderRadius: m(12),
    backgroundColor: '#FFFFFF',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  toggleThumbInactive: {
    alignSelf: 'flex-start',
  },
  submitButton: {
    borderRadius: m(12),
    overflow: 'hidden',
    marginTop: m(8),
    elevation: 4,
    shadowColor: '#ff6700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(16),
    gap: m(8),
  },
  submitButtonText: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});