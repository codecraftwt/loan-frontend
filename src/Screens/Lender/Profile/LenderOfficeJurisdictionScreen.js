import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { FontFamily, colors } from '../../../constants';
import { m } from '../../../Utils/responsive';
import { ScreenWrapper } from '../../../Components/common';
import lenderFlowService from '../../../Services/lenderFlowService';

export default function LenderOfficeJurisdictionScreen() {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [addressData, setAddressData] = useState({
    stateOfOperation: 'Pan India Coverage',
    address: '',
    city: '',
    taluka: '',
    district: '',
    state: 'Maharashtra',
    pincode: '',
  });

  const fetchAddress = useCallback(async () => {
    try {
      setLoading(true);
      const res = await lenderFlowService.getProfile();
      if (res?.success && res.lender) {
        const l = res.lender;
        setAddressData({
          stateOfOperation: l.stateOfOperation || 'Pan India Coverage',
          address: l.address || '',
          city: l.city || '',
          taluka: l.taluka || '',
          district: l.district || '',
          state: l.state || 'Maharashtra',
          pincode: l.pincode || '',
        });
      }
    } catch (err) {
      console.error('Error fetching office address:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddress();
  }, [fetchAddress]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        stateOfOperation: addressData.stateOfOperation.trim(),
        address: addressData.address.trim(),
        city: addressData.city.trim(),
        taluka: addressData.taluka.trim(),
        district: addressData.district.trim(),
        state: addressData.state.trim(),
        pincode: addressData.pincode.trim(),
      };

      const res = await lenderFlowService.updateProfile(payload);
      if (res?.success) {
        Alert.alert('Address Saved ✨', 'Registered head office and jurisdiction details updated.');
        navigation.goBack();
      } else {
        Alert.alert('Update Failed', res?.message || 'Unable to update address.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save address.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ScreenWrapper
        backgroundColor={colors.backgroundGreenWhite}
        topInsetBg={colors.primary}
        statusBarColor={colors.primary}
        statusBarStyle="dark-content"
      >
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={colors.lettersAndIcons} />
          <Text style={styles.loaderText}>Loading office location & jurisdiction...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      backgroundColor={colors.backgroundGreenWhite}
      topInsetBg={colors.primary}
      statusBarColor={colors.primary}
      statusBarStyle="dark-content"
      includeTabBarClearance={false}
      scrollable={false}
    >
      {/* ── 1. Top Green Header Bar ── */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={m(18)} color={colors.lettersAndIcons} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTag}>OFFICIAL LOCATION</Text>
          <Text style={styles.headerTitle}>Office & Jurisdiction</Text>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={styles.saveHeaderBtn}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Feather name="check" size={m(17)} color={colors.white} />
          )}
        </TouchableOpacity>
      </View>

      {/* ── 2. Curved Main Body Section ── */}
      <View style={styles.sheetSection}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Card 1: Operating Jurisdiction */}
          <View style={styles.formCard}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardIconCircle, { backgroundColor: colors.oceanBlueButton }]}>
                <Feather name="globe" size={m(14)} color={colors.white} />
              </View>
              <Text style={styles.cardHeaderTitle}>Lending Jurisdiction & Coverage</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Operating Jurisdiction / Geographical Coverage</Text>
              <TextInput
                style={styles.inputField}
                value={addressData.stateOfOperation}
                onChangeText={(t) => setAddressData({ ...addressData, stateOfOperation: t })}
                placeholder="Pan India Coverage or Specific Region"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.helperText}>
                Borrowers from this territory will be routed to your Deal Desk.
              </Text>
            </View>
          </View>

          {/* Card 2: Registered Head Office Address */}
          <View style={styles.formCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardIconCircle}>
                <Feather name="map-pin" size={m(14)} color={colors.white} />
              </View>
              <Text style={styles.cardHeaderTitle}>Registered Corporate Premises</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Corporate Premises / Building / Suite Address</Text>
              <TextInput
                style={styles.inputField}
                value={addressData.address}
                onChangeText={(t) => setAddressData({ ...addressData, address: t })}
                placeholder="Premises / Building / Street Address"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: m(8) }]}>
                <Text style={styles.inputLabel}>City</Text>
                <TextInput
                  style={styles.inputField}
                  value={addressData.city}
                  onChangeText={(t) => setAddressData({ ...addressData, city: t })}
                  placeholder="e.g. Mumbai"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Taluka / Sub-district</Text>
                <TextInput
                  style={styles.inputField}
                  value={addressData.taluka}
                  onChangeText={(t) => setAddressData({ ...addressData, taluka: t })}
                  placeholder="Taluka"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: m(8) }]}>
                <Text style={styles.inputLabel}>District</Text>
                <TextInput
                  style={styles.inputField}
                  value={addressData.district}
                  onChangeText={(t) => setAddressData({ ...addressData, district: t })}
                  placeholder="District"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>State</Text>
                <TextInput
                  style={styles.inputField}
                  value={addressData.state}
                  onChangeText={(t) => setAddressData({ ...addressData, state: t })}
                  placeholder="State"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Postal Pincode</Text>
              <TextInput
                style={styles.inputField}
                value={addressData.pincode}
                onChangeText={(t) => setAddressData({ ...addressData, pincode: t })}
                placeholder="6-digit Pincode"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.saveSubmitBtn}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Feather name="check-circle" size={m(16)} color={colors.white} style={{ marginRight: m(6) }} />
                <Text style={styles.saveSubmitText}>Save Office & Jurisdiction</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loaderCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.lettersAndIcons,
    marginTop: m(10),
  },

  // Header Bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: m(16),
    paddingTop: m(10),
    paddingBottom: m(14),
    backgroundColor: colors.primary,
  },
  backBtn: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: m(10),
  },
  headerTag: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    letterSpacing: 0.8,
    opacity: 0.85,
  },
  headerTitle: {
    fontSize: m(17),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  saveHeaderBtn: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    backgroundColor: colors.oceanBlueButton,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },

  // Curved Sheet
  sheetSection: {
    flex: 1,
    backgroundColor: colors.backgroundGreenWhite,
    borderTopLeftRadius: m(28),
    borderTopRightRadius: m(28),
    paddingTop: m(14),
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: m(16),
    paddingBottom: m(40),
  },

  // Form Card
  formCard: {
    backgroundColor: colors.white,
    borderRadius: m(18),
    padding: m(16),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.06)',
    elevation: 2,
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(14),
  },
  cardIconCircle: {
    width: m(28),
    height: m(28),
    borderRadius: m(14),
    backgroundColor: colors.lettersAndIcons,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(8),
  },
  cardHeaderTitle: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },

  inputGroup: {
    marginBottom: m(12),
  },
  rowInputs: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
    marginBottom: m(5),
  },
  inputField: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: m(12),
    paddingHorizontal: m(12),
    paddingVertical: m(9),
    fontSize: m(13),
    fontFamily: FontFamily.primaryMedium,
    color: colors.lettersAndIcons,
  },
  helperText: {
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginTop: m(4),
  },

  saveSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.oceanBlueButton,
    borderRadius: m(14),
    paddingVertical: m(13),
    marginBottom: m(20),
    elevation: 3,
  },
  saveSubmitText: {
    fontSize: m(13.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
});
