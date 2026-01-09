import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import React, { useState } from 'react';
import Icon from 'react-native-vector-icons/Feather';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';

export default function SettingsScreen() {
  // State for toggles
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const settingsSections = [
    {
      title: 'Notifications',
      items: [
        {
          icon: 'bell',
          label: 'Push Notifications',
          value: pushNotifications,
          onToggle: setPushNotifications,
          type: 'toggle',
          color: '#3B82F6',
        },
        {
          icon: 'mail',
          label: 'Email Notifications',
          value: emailNotifications,
          onToggle: setEmailNotifications,
          type: 'toggle',
          color: '#8B5CF6',
        },
        {
          icon: 'settings',
          label: 'Notification Settings',
          type: 'navigate',
          onPress: () => {},
          color: '#10B981',
        },
      ],
    },
    {
      title: 'Security',
      items: [
        {
          icon: 'lock',
          label: 'Change Password',
          type: 'navigate',
          onPress: () => {},
          color: '#EF4444',
        },
        {
          icon: 'fingerprint',
          label: 'Biometric Authentication',
          value: biometricEnabled,
          onToggle: setBiometricEnabled,
          type: 'toggle',
          color: '#F59E0B',
        },
        {
          icon: 'shield',
          label: 'Two-Factor Authentication',
          type: 'navigate',
          onPress: () => {},
          color: '#6366F1',
        },
        {
          icon: 'key',
          label: 'Security Settings',
          type: 'navigate',
          onPress: () => {},
          color: '#8B5CF6',
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: 'moon',
          label: 'Dark Mode',
          value: darkMode,
          onToggle: setDarkMode,
          type: 'toggle',
          color: '#1F2937',
        },
        {
          icon: 'globe',
          label: 'Language',
          type: 'navigate',
          onPress: () => {},
          subtitle: 'English',
          color: '#3B82F6',
        },
        {
          icon: 'dollar-sign',
          label: 'Currency',
          type: 'navigate',
          onPress: () => {},
          subtitle: 'USD',
          color: '#10B981',
        },
      ],
    },
    {
      title: 'Data & Storage',
      items: [
        {
          icon: 'download',
          label: 'Download Data',
          type: 'navigate',
          onPress: () => {},
          color: '#3B82F6',
        },
        {
          icon: 'trash-2',
          label: 'Clear Cache',
          type: 'navigate',
          onPress: () => {},
          color: '#EF4444',
        },
        {
          icon: 'database',
          label: 'Storage Usage',
          type: 'navigate',
          onPress: () => {},
          subtitle: '125 MB',
          color: '#8B5CF6',
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          icon: 'info',
          label: 'Terms of Service',
          type: 'navigate',
          onPress: () => {},
          color: '#6B7280',
        },
        {
          icon: 'file-text',
          label: 'Privacy Policy',
          type: 'navigate',
          onPress: () => {},
          color: '#6B7280',
        },
        {
          icon: 'users',
          label: 'About Us',
          type: 'navigate',
          onPress: () => {},
          color: '#6B7280',
        },
        {
          icon: 'star',
          label: 'Rate App',
          type: 'navigate',
          onPress: () => {},
          color: '#F59E0B',
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
        disabled={item.type === 'toggle'}>
        <View style={[styles.settingIconContainer, { backgroundColor: `${item.color}15` }]}>
          <Icon name={item.icon} size={20} color={item.color} />
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingLabel}>{item.label}</Text>
          {item.subtitle && (
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          )}
        </View>
        {item.type === 'toggle' ? (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: '#E5E7EB', true: `${item.color}40` }}
            thumbColor={item.value ? item.color : '#F3F4F6'}
          />
        ) : (
          <Icon name="chevron-right" size={18} color="#9CA3AF" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Settings" showBackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, itemIndex) =>
                renderSettingItem(
                  item,
                  itemIndex,
                  itemIndex === section.items.length - 1,
                ),
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: m(16),
    paddingBottom: m(40),
  },
  section: {
    marginBottom: m(24),
  },
  sectionTitle: {
    fontSize: m(18),
    fontWeight: '600',
    color: '#111827',
    marginBottom: m(12),
    paddingHorizontal: m(4),
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: m(16),
    paddingHorizontal: m(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingIconContainer: {
    width: m(36),
    height: m(36),
    borderRadius: m(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(12),
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: m(16),
    fontWeight: '500',
    color: '#374151',
    marginBottom: m(2),
  },
  settingSubtitle: {
    fontSize: m(12),
    color: '#6B7280',
  },
});
