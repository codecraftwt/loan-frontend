import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import {
  createPlan,
  updatePlan,
  clearErrors,
} from '../../../Redux/Slices/adminPlanSlice';

// Duration presets directly matching web app Plan.jsx
const DURATION_PRESETS = [
  {
    label: '1 Month',
    duration: '1 month',
    days: 30,
    tag: 'Standard Monthly',
    price: 1999,
    monthly: 1999,
    tier: 'starter',
  },
  {
    label: '3 Months',
    duration: '3 months',
    days: 90,
    tag: 'Quarterly Saver • Save 16%',
    price: 4999,
    monthly: 1666,
    tier: 'pro',
  },
  {
    label: '6 Months',
    duration: '6 months',
    days: 180,
    tag: 'Most Popular • Save 25%',
    price: 8999,
    monthly: 1499,
    tier: 'pro',
  },
  {
    label: '1 Year',
    duration: '1 year',
    days: 365,
    tag: 'Best Value • Save 37%',
    price: 14999,
    monthly: 1249,
    tier: 'enterprise',
  },
];

export default function CreateEditPlan() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { creating, updating, createError, updateError } = useSelector(
    state => state.adminPlans
  );

  const { plan, mode } = route.params || {};
  const isEditMode = mode === 'edit' && plan;

  // Form State
  const [planName, setPlanName] = useState('1 Month Plan');
  const [duration, setDuration] = useState('1 month');
  const [durationDays, setDurationDays] = useState(30);
  const [price, setPrice] = useState('1999');
  const [priceMonthly, setPriceMonthly] = useState('1999');
  const [tag, setTag] = useState('Standard Monthly');
  const [tier, setTier] = useState('starter');
  const [description, setDescription] = useState(
    'Full unrestricted platform access for 30 days. All underwriting and borrower services included.'
  );
  const [isActive, setIsActive] = useState(true);

  // Initialize form in edit mode
  useEffect(() => {
    if (isEditMode && plan) {
      const days =
        plan.durationDays ||
        (plan.duration === '1 year'
          ? 365
          : plan.duration === '6 months'
          ? 180
          : plan.duration === '3 months'
          ? 90
          : 30);
      const packPrice = plan.price || plan.priceMonthly || 1999;
      const monthlyRate = plan.priceMonthly || Math.round(packPrice / (days / 30));

      setPlanName(plan.planName || '');
      setDuration(plan.duration || '1 month');
      setDurationDays(days);
      setPrice(String(packPrice));
      setPriceMonthly(String(monthlyRate));
      setTag(plan.tag || '');
      setTier(plan.tier || 'starter');
      setDescription(plan.description || '');
      setIsActive(plan.isActive !== undefined ? plan.isActive : true);
    }
  }, [isEditMode, plan]);

  // Handle Preset Select
  const handleSelectPreset = preset => {
    setPlanName(`${preset.label} Plan`);
    setDuration(preset.duration);
    setDurationDays(preset.days);
    setPrice(String(preset.price));
    setPriceMonthly(String(preset.monthly));
    setTag(preset.tag);
    setTier(preset.tier);
    setDescription(
      `${preset.days} days uninterrupted access. All platform services and borrower underwriting features included.`
    );
  };

  // Form Validation
  const validate = () => {
    if (!planName.trim()) {
      Alert.alert('Validation Error', 'Plan Name is required.');
      return false;
    }
    const numPrice = Number(price);
    if (!price || isNaN(numPrice) || numPrice <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid price amount.');
      return false;
    }
    return true;
  };

  // Submit Handler
  const handleSubmit = async () => {
    if (!validate()) return;

    const payload = {
      planName: planName.trim(),
      duration,
      durationDays: Number(durationDays),
      price: Number(price),
      priceMonthly: Number(priceMonthly) || Number(price),
      tag: tag.trim(),
      tier,
      description: description.trim(),
      allServicesIncluded: true,
      isActive,
    };

    if (isEditMode) {
      const result = await dispatch(
        updatePlan({ planId: plan._id, planData: payload })
      );
      if (updatePlan.fulfilled.match(result)) {
        Alert.alert('Success', 'Plan updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', updateError || 'Failed to update plan.');
      }
    } else {
      const result = await dispatch(createPlan(payload));
      if (createPlan.fulfilled.match(result)) {
        Alert.alert('Success', 'Plan created successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', createError || 'Failed to create plan.');
      }
    }
  };

  const isSaving = creating || updating;

  return (
    <View style={styles.container}>
      <Header
        title={isEditMode ? 'Configure SaaS Plan' : 'Create Pricing Plan'}
        showBackButton
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Presets Strip */}
        <Text style={styles.sectionHeading}>Duration & Pricing Presets</Text>
        <View style={styles.presetRow}>
          {DURATION_PRESETS.map((p, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.presetCard,
                duration === p.duration && styles.activePresetCard,
              ]}
              activeOpacity={0.8}
              onPress={() => handleSelectPreset(p)}
            >
              <Text
                style={[
                  styles.presetLabel,
                  duration === p.duration && styles.activePresetLabel,
                ]}
              >
                {p.label}
              </Text>
              <Text
                style={[
                  styles.presetPrice,
                  duration === p.duration && styles.activePresetPrice,
                ]}
              >
                ₹{p.price}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Plan Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Plan Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 1 Month Starter Plan"
              placeholderTextColor="#94a3b8"
              value={planName}
              onChangeText={setPlanName}
            />
          </View>

          {/* Tag / Tier Badge */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Marketing Tag / Badge</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Most Popular • Save 25%"
              placeholderTextColor="#94a3b8"
              value={tag}
              onChangeText={setTag}
            />
          </View>

          {/* Pricing Row */}
          <View style={styles.twoColRow}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Pack Price (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="1999"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={price}
                onChangeText={v => {
                  setPrice(v);
                  const days = Number(durationDays) || 30;
                  setPriceMonthly(String(Math.round(Number(v) / (days / 30))));
                }}
              />
            </View>

            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Monthly Rate (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="1999"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={priceMonthly}
                onChangeText={setPriceMonthly}
              />
            </View>
          </View>

          {/* Duration Days */}
          <View style={styles.twoColRow}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Duration Label</Text>
              <TextInput
                style={styles.input}
                placeholder="1 month"
                placeholderTextColor="#94a3b8"
                value={duration}
                onChangeText={setDuration}
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Days of Validity</Text>
              <TextInput
                style={styles.input}
                placeholder="30"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={String(durationDays)}
                onChangeText={v => setDurationDays(Number(v) || 30)}
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Plan Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Outline what features and access are included..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Active Status Switch */}
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchTitle}>Publish & Activate Plan</Text>
              <Text style={styles.switchSub}>
                Lenders can view and subscribe to this tier.
              </Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
              thumbColor={isActive ? '#2563eb' : '#f8fafc'}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSaving && styles.submitButtonDisabled]}
          activeOpacity={0.85}
          disabled={isSaving}
          onPress={handleSubmit}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Icon name="check" size={16} color="#ffffff" />
              <Text style={styles.submitButtonText}>
                {isEditMode ? 'Update Plan Configuration' : 'Create & Publish Plan'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: m(16),
    paddingBottom: m(80),
  },
  sectionHeading: {
    fontSize: m(13),
    fontWeight: '700',
    color: '#475569',
    marginBottom: m(10),
    marginLeft: m(2),
  },
  presetRow: {
    flexDirection: 'row',
    gap: m(8),
    marginBottom: m(16),
  },
  presetCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: m(10),
    paddingVertical: m(10),
    paddingHorizontal: m(6),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activePresetCard: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  presetLabel: {
    fontSize: m(11),
    fontWeight: '700',
    color: '#334155',
  },
  activePresetLabel: {
    color: '#1d4ed8',
  },
  presetPrice: {
    fontSize: m(11),
    color: '#64748b',
    marginTop: m(2),
  },
  activePresetPrice: {
    color: '#2563eb',
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: m(14),
    padding: m(16),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: m(16),
  },
  fieldGroup: {
    marginBottom: m(14),
  },
  fieldLabel: {
    fontSize: m(12),
    fontWeight: '600',
    color: '#334155',
    marginBottom: m(6),
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: m(10),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: m(12),
    paddingVertical: m(10),
    fontSize: m(13),
    color: '#0f172a',
  },
  textArea: {
    height: m(75),
    textAlignVertical: 'top',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: m(10),
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: m(10),
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  switchInfo: {
    flex: 1,
    marginRight: m(12),
  },
  switchTitle: {
    fontSize: m(13),
    fontWeight: '700',
    color: '#0f172a',
  },
  switchSub: {
    fontSize: m(11),
    color: '#64748b',
    marginTop: m(2),
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: m(14),
    borderRadius: m(12),
    gap: m(8),
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: m(14),
    fontWeight: '700',
    color: '#ffffff',
  },
});