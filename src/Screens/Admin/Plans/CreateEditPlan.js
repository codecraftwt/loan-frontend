import React, { useState, useEffect } from 'react';
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
import Feather from 'react-native-vector-icons/Feather';
import { colors, FontFamily } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper } from '../../../Components/common';
import {
  createPlan,
  updatePlan,
} from '../../../Redux/Slices/adminPlanSlice';

// Duration presets matching web app Plan.jsx
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
    state => state.adminPlans || {}
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
    <ScreenWrapper
      backgroundColor={colors.backgroundGreenWhite}
      topInsetBg={colors.primary}
      statusBarColor={colors.primary}
      statusBarStyle="dark-content"
      includeTabBarClearance={false}
      scrollable={false}
    >
      <View style={styles.pageGreenWrapper}>
        {/* Fixed Brand Green Top Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={m(22)} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditMode ? 'Configure SaaS Plan' : 'Create Pricing Plan'}
          </Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Curved Sheet Container (Figma 9.4.5 Form Style) */}
        <View style={styles.sheetSection}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Duration & Pricing Presets */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Duration & Pricing Presets</Text>
              <View style={styles.presetRow}>
                {DURATION_PRESETS.map((p, idx) => {
                  const isSelected = duration === p.duration;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.presetCard,
                        isSelected && styles.activePresetCard,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => handleSelectPreset(p)}
                    >
                      <Text
                        style={[
                          styles.presetLabel,
                          isSelected && styles.activePresetLabel,
                        ]}
                      >
                        {p.label}
                      </Text>
                      <Text
                        style={[
                          styles.presetPrice,
                          isSelected && styles.activePresetPrice,
                        ]}
                      >
                        ₹{p.price}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Plan Name Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Plan Name *</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 1 Month Starter Plan"
                  placeholderTextColor="#7E9D86"
                  value={planName}
                  onChangeText={setPlanName}
                />
              </View>
            </View>

            {/* Marketing Tag / Badge */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Marketing Tag / Badge</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Most Popular • Save 25%"
                  placeholderTextColor="#7E9D86"
                  value={tag}
                  onChangeText={setTag}
                />
              </View>
            </View>

            {/* Pricing Row: Pack Price & Monthly Rate */}
            <View style={styles.twoColRow}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Pack Price (₹) *</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="1999"
                    placeholderTextColor="#7E9D86"
                    keyboardType="numeric"
                    value={price}
                    onChangeText={v => {
                      setPrice(v);
                      const days = Number(durationDays) || 30;
                      setPriceMonthly(String(Math.round(Number(v) / (days / 30))));
                    }}
                  />
                </View>
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Monthly Rate (₹)</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="1999"
                    placeholderTextColor="#7E9D86"
                    keyboardType="numeric"
                    value={priceMonthly}
                    onChangeText={setPriceMonthly}
                  />
                </View>
              </View>
            </View>

            {/* Duration Row: Duration Label & Days of Validity */}
            <View style={styles.twoColRow}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Duration Label</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="1 month"
                    placeholderTextColor="#7E9D86"
                    value={duration}
                    onChangeText={setDuration}
                  />
                </View>
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Days of Validity</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="30"
                    placeholderTextColor="#7E9D86"
                    keyboardType="numeric"
                    value={String(durationDays)}
                    onChangeText={v => setDurationDays(Number(v) || 30)}
                  />
                </View>
              </View>
            </View>

            {/* Plan Description (Large Rounded Textarea) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Plan Description</Text>
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Outline what features and access are included..."
                  placeholderTextColor="#7E9D86"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            </View>

            {/* Active Status Switch Card */}
            <View style={styles.switchCard}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchTitle}>Publish & Activate Plan</Text>
                <Text style={styles.switchSub}>
                  Lenders can view and subscribe to this tier.
                </Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: '#CBD5E1', true: '#6DB6FE' }}
                thumbColor={isActive ? colors.oceanBlueButton : '#FFFFFF'}
              />
            </View>

            {/* Submit Action Button (Figma Mint Green Pill) */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                isSaving && styles.submitButtonDisabled,
              ]}
              activeOpacity={0.85}
              disabled={isSaving}
              onPress={handleSubmit}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.lettersAndIcons} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isEditMode ? 'Update Plan' : 'Save Plan'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  pageGreenWrapper: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: m(18),
    paddingTop: m(12),
    paddingBottom: m(16),
  },
  backBtn: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    backgroundColor: 'rgba(9, 48, 48, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: m(19),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: m(36),
  },

  // Curved Sheet
  sheetSection: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(36),
    borderTopRightRadius: m(36),
    paddingTop: m(20),
  },
  scrollContent: {
    paddingHorizontal: m(18),
    paddingBottom: m(90),
  },

  // Field Groups & Labels
  fieldGroup: {
    marginBottom: m(14),
  },
  fieldLabel: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(6),
    marginLeft: m(2),
  },
  twoColRow: {
    flexDirection: 'row',
    gap: m(10),
  },

  // Soft Mint Rounded Inputs (Figma 9.4.5 Form Style)
  inputContainer: {
    backgroundColor: colors.lightGreen,
    borderRadius: m(18),
    height: m(48),
    paddingHorizontal: m(16),
    justifyContent: 'center',
  },
  input: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
    padding: 0,
  },
  textAreaContainer: {
    height: m(110),
    paddingTop: m(12),
    paddingBottom: m(12),
    borderRadius: m(20),
  },
  textArea: {
    flex: 1,
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
    padding: 0,
  },

  // Presets
  presetRow: {
    flexDirection: 'row',
    gap: m(8),
  },
  presetCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: m(12),
    paddingVertical: m(9),
    paddingHorizontal: m(6),
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(9, 48, 48, 0.08)',
  },
  activePresetCard: {
    backgroundColor: colors.oceanBlueButton,
    borderColor: colors.oceanBlueButton,
  },
  presetLabel: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
    marginBottom: m(2),
  },
  activePresetLabel: {
    color: colors.white,
    fontFamily: FontFamily.primaryBold,
  },
  presetPrice: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.textSecondary,
  },
  activePresetPrice: {
    color: colors.white,
  },

  // Switch Card
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: m(16),
    padding: m(14),
    marginBottom: m(20),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
  },
  switchInfo: {
    flex: 1,
    marginRight: m(10),
  },
  switchTitle: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  switchSub: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(2),
  },

  // Submit Action Button (Figma Mint Green Pill)
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    height: m(50),
    borderRadius: m(25),
    marginTop: m(8),
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
});