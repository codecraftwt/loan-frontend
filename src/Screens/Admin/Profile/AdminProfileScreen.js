import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import { logout } from '../../../Redux/Slices/authslice';

export default function AdminProfileScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const displayName = user?.name || user?.userName || 'Enterprise Admin';
  const displayEmail = user?.email || 'admin@loanhub.internal';
  const displayPhone = user?.mobileNumber || user?.phone || '+91 98765 43210';

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of the Admin Console?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await dispatch(logout());
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  const menuSections = [
    {
      title: 'Management & Overview',
      items: [
        {
          id: 'revenue',
          title: 'SaaS Revenue & Analytics',
          icon: 'dollar-sign',
          color: '#059669',
          onPress: () => navigation.navigate('Revenue'),
        },
        {
          id: 'plans',
          title: 'Subscription Tiers & Plans',
          icon: 'layers',
          color: '#2563eb',
          onPress: () => navigation.navigate('PlansList'),
        },
        {
          id: 'lenders',
          title: 'Lending Institutions',
          icon: 'briefcase',
          color: '#7c3aed',
          onPress: () => navigation.navigate('LenderList'),
        },
      ],
    },
    {
      title: 'Security & Access',
      items: [
        {
          id: 'password',
          title: 'Change Password',
          icon: 'lock',
          color: '#d97706',
          onPress: () => navigation.navigate('ChangePassword'),
        },
        {
          id: 'privacy',
          title: 'Security & Privacy Policies',
          icon: 'shield',
          color: '#4f46e5',
          onPress: () => navigation.navigate('PrivacyPolicy'),
        },
      ],
    },
    {
      title: 'Platform Info',
      items: [
        {
          id: 'terms',
          title: 'Terms of Service',
          icon: 'file-text',
          color: '#64748b',
          onPress: () => navigation.navigate('TermsOfService'),
        },
        {
          id: 'about',
          title: 'About LoanHub Platform',
          icon: 'info',
          color: '#64748b',
          onPress: () => navigation.navigate('AboutUs'),
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <Header title="Admin Console Profile" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {displayName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.badgeRow}>
              <View style={styles.roleBadge}>
                <Icon name="shield" size={11} color="#1d4ed8" />
                <Text style={styles.roleText}>SYSTEM ADMIN</Text>
              </View>
            </View>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.email}>{displayEmail}</Text>
            <Text style={styles.phone}>{displayPhone}</Text>
          </View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionBody}>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    index < section.items.length - 1 && styles.menuItemBorder,
                  ]}
                  activeOpacity={0.7}
                  onPress={item.onPress}
                >
                  <View style={[styles.iconBox, { backgroundColor: `${item.color}15` }]}>
                    <Icon name={item.icon} size={18} color={item.color} />
                  </View>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Icon name="chevron-right" size={18} color="#cbd5e1" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.8}
          onPress={handleLogout}
        >
          <Icon name="log-out" size={18} color="#ef4444" />
          <Text style={styles.logoutText}>Sign Out from Admin Console</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>LoanHub Enterprise Admin v2.4.0</Text>
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
    paddingBottom: m(90),
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: m(14),
    padding: m(16),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: m(16),
  },
  avatar: {
    width: m(60),
    height: m(60),
    borderRadius: m(30),
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(14),
  },
  avatarText: {
    fontSize: m(20),
    fontWeight: '700',
    color: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: m(4),
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingHorizontal: m(8),
    paddingVertical: m(2),
    borderRadius: m(4),
    gap: m(4),
  },
  roleText: {
    fontSize: m(10),
    fontWeight: '700',
    color: '#1d4ed8',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#0f172a',
  },
  email: {
    fontSize: m(12),
    color: '#64748b',
    marginTop: m(2),
  },
  phone: {
    fontSize: m(11),
    color: '#94a3b8',
    marginTop: m(1),
  },
  section: {
    marginBottom: m(16),
  },
  sectionTitle: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: m(8),
    marginLeft: m(4),
  },
  sectionBody: {
    backgroundColor: '#ffffff',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(14),
    paddingVertical: m(13),
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  iconBox: {
    width: m(34),
    height: m(34),
    borderRadius: m(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(12),
  },
  menuTitle: {
    flex: 1,
    fontSize: m(13),
    fontWeight: '600',
    color: '#1e293b',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: m(12),
    paddingVertical: m(14),
    marginTop: m(8),
    gap: m(8),
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  logoutText: {
    fontSize: m(13),
    fontWeight: '700',
    color: '#dc2626',
  },
  versionText: {
    textAlign: 'center',
    fontSize: m(11),
    color: '#94a3b8',
    marginTop: m(16),
  },
});
