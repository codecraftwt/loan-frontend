import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';

const DetailItem = ({ icon, label, value }) => {
  return (
    <View style={styles.detailItem}>
      <View style={styles.detailIconContainer}>
        <Icon name={icon} size={20} color="#FF9800" />
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

  const handleViewLoanHistory = () => {
    if (borrowerDetails?._id) {
      navigation.navigate('BorrowerLoanHistoryScreen', {
        borrowerId: borrowerDetails._id,
        borrowerDetails,
      });
    }
  };

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

          {/* Loan History Button */}
          <TouchableOpacity
            style={styles.loanHistoryButton}
            onPress={handleViewLoanHistory}>
            <Icon name="history" size={20} color="#FFFFFF" />
            <Text style={styles.loanHistoryButtonText}>View Loan History</Text>
            <Icon name="chevron-right" size={20} color="#FFFFFF" />
          </TouchableOpacity>
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
    paddingBottom: m(20),
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    margin: m(16),
    padding: m(16),
    borderRadius: m(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(16),
  },
  profileImage: {
    width: m(60),
    height: m(60),
    borderRadius: m(30),
    marginRight: m(16),
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
    fontSize: m(24),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: m(20),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: m(8),
  },
  profileMeta: {
    gap: m(4),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: m(12),
    color: '#6B7280',
    marginLeft: m(6),
    flex: 1,
  },
  loanHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#50C878',
    padding: m(12),
    borderRadius: m(8),
    marginTop: m(8),
  },
  loanHistoryButtonText: {
    color: '#FFFFFF',
    fontSize: m(14),
    fontWeight: '600',
    marginHorizontal: m(8),
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: m(16),
    marginBottom: m(16),
    padding: m(16),
    borderRadius: m(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsTitle: {
    fontSize: m(18),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: m(16),
  },
  detailsGrid: {
    gap: m(12),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: m(3)
  },
  detailIconContainer: {
    width: m(32),
    height: m(32),
    borderRadius: m(16),
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
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
    marginBottom: m(2),
  },
  detailValue: {
    fontSize: m(14),
    fontWeight: '500',
    color: '#1F2937',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: m(16),
  },
  footerText: {
    fontSize: m(12),
    color: '#9CA3AF',
    marginLeft: m(6),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: m(16),
    color: '#EF4444',
  },
});