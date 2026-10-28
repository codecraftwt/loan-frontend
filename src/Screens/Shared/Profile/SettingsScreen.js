import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { m } from '../../../Utils/responsive';
import { colors, FontFamily } from '../../../constants';
import { ScreenWrapper } from '../../../Components/common';

export default function SettingsScreen({ navigation }) {
  const settingsSections = [
    {
      title: 'Security & Access',
      items: [
        {
          icon: 'lock',
          label: 'Change Password',
          type: 'navigate',
          onPress: () => navigation.navigate('ChangePassword'),
        },
      ],
    },
    {
      title: 'About Platform',
      items: [
        {
          icon: 'info',
          label: 'Terms of Service',
          type: 'navigate',
          onPress: () => navigation.navigate('TermsOfService'),
        },
        {
          icon: 'shield',
          label: 'Privacy Policy',
          type: 'navigate',
          onPress: () => navigation.navigate('PrivacyPolicy'),
        },
        {
          icon: 'users',
          label: 'About Us',
          type: 'navigate',
          onPress: () => navigation.navigate('AboutUs'),
        },
        {
          icon: 'star',
          label: 'Rate App',
          type: 'navigate',
          onPress: () => navigation.navigate('RateApp'),
        },
      ],
    },
  ];

  const renderSettingItem = (item, index, isLast) => {
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.settingItem,
          isLast && styles.settingItemLast,
        ]}
        onPress={item.type === 'navigate' ? item.onPress : undefined}
        activeOpacity={0.7}
        disabled={item.type === 'toggle'}
      >
        <View style={styles.settingIconContainer}>
          <Feather name={item.icon} size={m(18)} color={colors.white} />
        </View>

        <View style={styles.settingContent}>
          <Text style={styles.settingLabel}>{item.label}</Text>
          {item.subtitle ? (
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          ) : null}
        </View>

        {item.type === 'toggle' ? (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: '#E2E8F0', true: colors.primary }}
            thumbColor={item.value ? colors.white : '#F8FAFC'}
          />
        ) : (
          <Feather name="chevron-right" size={m(17)} color="#7E9D86" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper
      backgroundColor={colors.backgroundGreenWhite}
      topInsetBg={colors.primary}
      statusBarColor={colors.primary}
      statusBarStyle="dark-content"
      includeTabBarClearance={false}
      scrollable={false}
    >
      <View style={styles.pageWrapper}>
        {/* Fixed Top Mint Green Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={m(22)} color={colors.white} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Settings</Text>

          <View style={styles.headerPlaceholder} />
        </View>

        {/* Curved Sheet Container */}
        <View style={styles.sheetSection}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {settingsSections.map((section, sectionIndex) => (
              <View key={sectionIndex} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={styles.sectionCard}>
                  {section.items.map((item, itemIndex) =>
                    renderSettingItem(
                      item,
                      itemIndex,
                      itemIndex === section.items.length - 1
                    )
                  )}
                </View>
              </View>
            ))}

            {/* Subtle Platform Version Tag */}
            <Text style={styles.versionText}>LoanHub Platform v2.4.0</Text>
          </ScrollView>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  pageWrapper: {
    flex: 1,
    backgroundColor: colors.primary,
  },

  // Fixed Top Mint Green Header
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
    paddingBottom: m(80),
  },

  // Section
  section: {
    marginBottom: m(20),
  },
  sectionTitle: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: '#5A7A71',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: m(8),
    marginLeft: m(4),
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: m(18),
    borderWidth: 1,
    borderColor: 'rgba(9, 48, 48, 0.08)',
    overflow: 'hidden',
    shadowColor: colors.lettersAndIcons,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },

  // Setting Item
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: m(14),
    paddingHorizontal: m(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F7F3',
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingIconContainer: {
    width: m(40),
    height: m(40),
    borderRadius: m(20),
    backgroundColor: '#52A6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(14),
    shadowColor: '#52A6FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: m(14.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.lettersAndIcons,
  },
  settingSubtitle: {
    fontSize: m(11.5),
    fontFamily: FontFamily.primaryRegular,
    color: '#7E9D86',
    marginTop: m(2),
  },

  // Version Footer
  versionText: {
    fontSize: m(11),
    fontFamily: FontFamily.primaryRegular,
    color: '#7E9D86',
    textAlign: 'center',
    marginTop: m(16),
  },
});
