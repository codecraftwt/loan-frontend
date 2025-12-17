import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';

const DetailItem = ({ icon, label, value }) => {
  return (
    <View style={styles.detailItem}>
      <View style={styles.detailIconContainer}>
        <Icon name={icon} size={20} color="#3B82F6" />
      </View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value || 'N/A'}</Text>
      </View>
    </View>
  );
};

export default function BorrowerDetailsScreen({ route, navigation }) {
  const { borrowerDetails } = route.params || {};

  if (!borrowerDetails) {
    return (
      <View style={styles.container}>
        <Header title="Borrower Details" showBackButton />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Borrower details not available</Text>
        </View>
      </View>
    );
  }

  const borrowerInfo = [
    {
      label: 'Full Name',
      value: borrowerDetails.userName,
      icon: 'person',
    },
    {
      label: 'Email',
      value: borrowerDetails.email,
      icon: 'email',
    },
    {
      label: 'Mobile Number',
      value: borrowerDetails.mobileNo,
      icon: 'phone',
    },
    {
      label: 'Aadhar Card Number',
      value: borrowerDetails.aadharCardNo,
      icon: 'badge',
    },
    {
      label: 'PAN Card Number',
      value: borrowerDetails.panCardNumber || 'Not provided',
      icon: 'credit-card',
    },
    {
      label: 'Address',
      value: borrowerDetails.address,
      icon: 'location-on',
    },
    {
      label: 'Mobile Verified',
      value: borrowerDetails.isMobileVerified ? 'Yes' : 'No',
      icon: borrowerDetails.isMobileVerified ? 'verified' : 'verified-user',
    },
  ];

  return (
    <View style={styles.container}>
      <Header title="Borrower Details" showBackButton />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            {borrowerDetails.profileImage ? (
              <Image
                source={{ uri: borrowerDetails.profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileAvatar}>
                <Text style={styles.avatarText}>
                  {borrowerDetails.userName?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={2}>
                {borrowerDetails.userName}
              </Text>
              <View style={styles.profileMeta}>
                <View style={styles.metaItem}>
                  <Icon name="email" size={14} color="#6B7280" />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {borrowerDetails.email || 'N/A'}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Icon name="phone" size={14} color="#6B7280" />
                  <Text style={styles.metaText}>
                    {borrowerDetails.mobileNo || 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Verification Status */}
          <View style={styles.verificationContainer}>
            <View style={[
              styles.verificationBadge,
              borrowerDetails.isMobileVerified 
                ? styles.verifiedBadge 
                : styles.unverifiedBadge
            ]}>
              <Icon 
                name={borrowerDetails.isMobileVerified ? 'verified' : 'verified-user'} 
                size={16} 
                color={borrowerDetails.isMobileVerified ? '#10B981' : '#F59E0B'} 
              />
              <Text style={[
                styles.verificationText,
                borrowerDetails.isMobileVerified 
                  ? styles.verifiedText 
                  : styles.unverifiedText
              ]}>
                {borrowerDetails.isMobileVerified ? 'Mobile Verified' : 'Mobile Not Verified'}
              </Text>
            </View>
          </View>
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Personal Information</Text>
          
          <View style={styles.detailsGrid}>
            {borrowerInfo.map((item, index) => (
              <DetailItem
                key={index}
                icon={item.icon}
                label={item.label}
                value={item.value}
              />
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Icon name="access-time" size={14} color="#9CA3AF" />
          <Text style={styles.footerText}>
            Registered {moment(borrowerDetails.createdAt).fromNow()}
          </Text>
        </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: m(16),
    color: '#6B7280',
  },
  
  // Profile Card
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    padding: m(20),
    marginBottom: m(14),
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
    marginBottom: m(14),
  },
  profileAvatar: {
    width: m(60),
    height: m(60),
    borderRadius: m(30),
    backgroundColor: '#3B82F6',
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
    width: m(60),
    height: m(60),
    borderRadius: m(30),
    marginRight: m(16),
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: m(20),
    fontWeight: '600',
    color: '#111827',
    marginBottom: m(8),
  },
  profileMeta: {
    gap: m(6),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  metaText: {
    fontSize: m(14),
    color: '#6B7280',
    flex: 1,
  },
  
  // Verification Container
  verificationContainer: {
    paddingTop: m(14),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: m(12),
    paddingVertical: m(8),
    borderRadius: m(20),
    gap: m(6),
  },
  verifiedBadge: {
    backgroundColor: '#ECFDF5',
  },
  unverifiedBadge: {
    backgroundColor: '#FEF3C7',
  },
  verificationText: {
    fontSize: m(13),
    fontWeight: '600',
  },
  verifiedText: {
    color: '#10B981',
  },
  unverifiedText: {
    color: '#F59E0B',
  },
  
  // Details Card
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    padding: m(20),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  detailsTitle: {
    fontSize: m(18),
    fontWeight: '600',
    color: '#111827',
    marginBottom: m(16),
  },
  detailsGrid: {
    gap: m(12),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: m(12),
    padding: m(12),
  },
  detailIconContainer: {
    width: m(40),
    height: m(40),
    borderRadius: m(10),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(12),
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: m(12),
    color: '#6B7280',
    marginBottom: m(4),
  },
  detailValue: {
    fontSize: m(15),
    fontWeight: '500',
    color: '#374151',
  },
  
  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(6),
    padding: m(12),
  },
  footerText: {
    fontSize: m(14),
    color: '#9CA3AF',
  },
});







