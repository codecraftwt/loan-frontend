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

export default function SettingsScreen({ navigation }) {
  // State for toggles
  const [pushNotifications, setPushNotifications] = useState(false);

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
      ],
    },
    {
      title: 'Security',
      items: [
        {
          icon: 'lock',
          label: 'Change Password',
          type: 'navigate',
          onPress: () => navigation.navigate('ForgotPassword'),
          color: '#EF4444',
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
