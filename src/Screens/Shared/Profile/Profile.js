import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useState } from 'react';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import PromptBox from '../../PromptBox/Prompt';
import useFetchUserFromStorage from '../../../Redux/hooks/useFetchUserFromStorage';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';


export default function Profile() {
  // Navigation & Redux
  const navigation = useNavigation();
  const user = useSelector(state => state.auth.user);
  useFetchUserFromStorage();

  const [imageError, setImageError] = useState(false);
  const [isPromptVisible, setIsPromptVisible] = useState(false);

  // Constants
  const menuItems = [
    {
      icon: 'user',
      label: 'Personal Details',
      onPress: navigateToProfileDetails,
      color: '#3B82F6',
    },
    {
      icon: 'settings',
      label: 'Settings',
      onPress: () => navigation.navigate('Settings'),
      color: '#10B981',
    },
    {
      icon: 'help-circle',
      label: 'Help & Support',
      onPress: () => navigation.navigate('HelpAndSupportScreen'),
      color: '#8B5CF6',
    },
    {
      icon: 'shield',
      label: 'Privacy & Security',
      onPress: () => { },
      color: '#EF4444',
    },
  ];

  return (
    <>
      <View style={styles.container}>
        <Header title="Profile" />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              {imageError || !user?.profileImage ? (
                <View style={styles.profileAvatar}>
                  <Text style={styles.avatarText}>
                    {user?.userName?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
              ) : (
                <Image
                  source={{ uri: user?.profileImage }}
                  style={styles.profileImage}
                  onError={handleImageError}
                />
              )}

              <View style={styles.profileInfo}>
                {user ? (
                  <>
                    <Text style={styles.profileName} numberOfLines={2}>
                      {user?.userName}
                    </Text>
                    <Text style={styles.profileEmail} numberOfLines={2}>
                      {user?.email}
                    </Text>
                  </>
                ) : (
                  <ActivityIndicator size="small" color="#3B82F6" />
                )}
              </View>
            </View>
          </View>

          {/* Menu Section */}
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Account</Text>

            <View style={styles.menuGrid}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={item.onPress}
                  activeOpacity={0.7}>
                  <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}15` }]}>
                    <Icon name={item.icon} size={22} color={item.color} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Icon name="chevron-right" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* App Info */}
          <View style={styles.appInfoCard}>
            <View style={styles.appInfoHeader}>
              <Icon name="info" size={20} color="#6B7280" />
              <Text style={styles.appInfoTitle}>App Information</Text>
            </View>

            <View style={styles.appInfoRow}>
              <Text style={styles.appInfoLabel}>Version</Text>
              <Text style={styles.appInfoValue}>1.0.0</Text>
            </View>

            <View style={styles.appInfoRow}>
              <Text style={styles.appInfoLabel}>Build Number</Text>
              <Text style={styles.appInfoValue}>1001</Text>
            </View>

            <View style={styles.appInfoRow}>
              <Text style={styles.appInfoLabel}>Last Updated</Text>
              <Text style={styles.appInfoValue}>Dec 2024</Text>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}>
            <Icon name="log-out" size={20} color="#EF4444" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <PromptBox
        visible={isPromptVisible}
        message="Are you sure you want to logout?"
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
    </>
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
    paddingBottom: m(140),
  },

  // Profile Card
  profileCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: m(20),
    padding: m(20),
     paddingBottom: m(0),
    marginBottom: m(20),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(20),
  },
  profileAvatar: {
    width: m(70),
    height: m(70),
    borderRadius: m(35),
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(16),
  },
  avatarText: {
    fontSize: m(28),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  profileImage: {
    width: m(70),
    height: m(70),
    borderRadius: m(35),
    marginRight: m(16),
    borderWidth: 3,
    borderColor: '#E5E7EB',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: m(22),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(2),
  },
  profileEmail: {
    fontSize: m(14),
    color: '#6B7280',
  },
  // Menu Section
  menuSection: {
    marginBottom: m(20),
  },
  sectionTitle: {
    fontSize: m(18),
    fontWeight: '600',
    color: '#111827',
    marginBottom: m(16),
    paddingHorizontal: m(4),
  },
  menuGrid: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: m(16),
    paddingHorizontal: m(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuIconContainer: {
    width: m(40),
    height: m(40),
    borderRadius: m(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(12),
  },
  menuLabel: {
    flex: 1,
    fontSize: m(16),
    fontWeight: '500',
    color: '#374151',
  },

  // App Info
  appInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    padding: m(16),
    marginBottom: m(20),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  appInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(16),
    paddingBottom: m(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: m(8),
  },
  appInfoTitle: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#111827',
  },
  appInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: m(8),
  },
  appInfoLabel: {
    fontSize: m(14),
    color: '#6B7280',
  },
  appInfoValue: {
    fontSize: m(14),
    fontWeight: '500',
    color: '#374151',
  },

  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
    backgroundColor: '#FEF2F2',
    borderRadius: m(12),
    padding: m(16),
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutButtonText: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#EF4444',
  },
});