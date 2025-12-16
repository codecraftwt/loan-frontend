import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import moment from 'moment';
import { useDispatch, useSelector } from 'react-redux';
import { updateLoanStatus } from '../../Redux/Slices/loanSlice';
import Toast from 'react-native-toast-message';
import { m } from 'walstar-rn-responsive';
import PromptBox from '../PromptBox/Prompt';
import Header from '../../Components/Header';

const DetailItem = ({ icon, label, value, isStatus, onStatusChange }) => {
  const isAccepted = value?.toLowerCase() === 'accepted';
  
  return (
    <View style={styles.detailItem}>
      <View style={styles.detailIconContainer}>
        <Icon name={icon} size={20} color="#3B82F6" />
      </View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
      {isStatus && value === 'pending' && isAccepted && (
        <TouchableOpacity
          style={styles.statusButton}
          onPress={onStatusChange}>
          <Text style={styles.statusButtonText}>Mark as Paid</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default function LoanDetailScreen({ route, navigation }) {
  const { loanDetails, isEdit } = route.params;
  const dispatch = useDispatch();
  const { updateError } = useSelector(state => state.loans);

  const [isPromptVisible, setPromptVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);

  const handleBack = () => navigation.goBack();

  const formatDate = date => moment(date).format('DD MMM, YYYY');

  const handleEdit = () => {
    if (loanDetails) {
      navigation.navigate('AddDetails', { loanDetails });
    } else {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: 'Loan details not available',
      });
    }
  };

  const updateLoanStatusHandler = newStatus => {
    dispatch(updateLoanStatus({ loanId: loanDetails._id, status: newStatus }))
      .unwrap()
      .then(() => {
        Toast.show({
          type: 'success',
          position: 'top',
          text1: `Loan status updated to ${newStatus}`,
        });
        setPromptVisible(false);
      })
      .catch(err => {
        Toast.show({
          type: 'error',
          position: 'top',
          text1: updateError || err.message || 'Error updating loan status',
        });
        setPromptVisible(false);
      });
  };

  const handleStatusChangeClick = () => {
    const newStatus = loanDetails.status === 'pending' ? 'paid' : 'pending';
    setSelectedStatus(newStatus);
    setPromptVisible(true);
  };

  const handleConfirm = () => {
    if (selectedStatus) {
      updateLoanStatusHandler(selectedStatus);
    }
  };

  const handleCancel = () => {
    setPromptVisible(false);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'pending': return '#F59E0B';
      case 'paid': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted': return 'check-circle';
      case 'rejected': return 'x-circle';
      case 'paid': return 'check-circle';
      default: return 'clock';
    }
  };

  const loanInfo = [
    {
      label: 'Loan Amount',
      value: `₹${loanDetails.amount?.toLocaleString('en-IN')}`,
      icon: 'dollar-sign',
    },
    {
      label: 'Loan Status',
      value: loanDetails.status,
      icon: getStatusIcon(loanDetails.status),
      isStatus: true,
      onStatusChange: handleStatusChangeClick,
    },
    {
      label: 'Borrower Acceptance',
      value: loanDetails.borrowerAcceptanceStatus || 'N/A',
      icon: 'user-check',
    },
    { 
      label: 'Purpose', 
      value: loanDetails.purpose || 'Not specified', 
      icon: 'book' 
    },
    {
      label: 'Loan Start Date',
      value: loanDetails.loanStartDate ? formatDate(loanDetails.loanStartDate) : 'N/A',
      icon: 'calendar',
    },
    {
      label: 'Loan End Date',
      value: loanDetails.loanEndDate ? formatDate(loanDetails.loanEndDate) : 'N/A',
      icon: 'calendar',
    },
    { 
      label: 'Address', 
      value: loanDetails.address || 'Not specified', 
      icon: 'map-pin' 
    },
  ];

  const isAccepted = loanDetails.borrowerAcceptanceStatus?.toLowerCase() === 'accepted';
  const canMarkAsPaid = isAccepted && loanDetails.status === 'pending';

  return (
    <View style={styles.container}>
      <Header
        title="Loan Details"
        showBackButton
        isEdit={isEdit}
        onEditPress={handleEdit}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            {loanDetails.profileImage ? (
              <Image
                source={{ uri: loanDetails.profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileAvatar}>
                <Text style={styles.avatarText}>
                  {loanDetails.name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={2}>
                {loanDetails.name}
              </Text>
              <View style={styles.profileMeta}>
                <View style={styles.metaItem}>
                  <Icon name="phone" size={14} color="#6B7280" />
                  <Text style={styles.metaText}>
                    {loanDetails.mobileNumber || 'N/A'}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Icon name="id-card" size={14} color="#6B7280" />
                  <Text style={styles.metaText}>
                    {loanDetails.aadhaarNumber || 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Status Indicators */}
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(loanDetails.status) }]}>
                <Icon name={getStatusIcon(loanDetails.status)} size={14} color="#FFFFFF" />
                <Text style={styles.statusText}>
                  {loanDetails.status?.charAt(0).toUpperCase() + loanDetails.status?.slice(1)}
                </Text>
              </View>
              <Text style={styles.statusLabel}>Loan Status</Text>
            </View>

            <View style={styles.statusDivider} />

            <View style={styles.statusItem}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(loanDetails.borrowerAcceptanceStatus) }]}>
                <Icon name="user-check" size={14} color="#FFFFFF" />
                <Text style={styles.statusText}>
                  {loanDetails.borrowerAcceptanceStatus?.charAt(0).toUpperCase() + loanDetails.borrowerAcceptanceStatus?.slice(1)}
                </Text>
              </View>
              <Text style={styles.statusLabel}>Borrower Status</Text>
            </View>
          </View>
        </View>

        {/* Loan Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Loan Information</Text>
          
          <View style={styles.detailsGrid}>
            {loanInfo.map((item, index) => (
              <DetailItem
                key={index}
                icon={item.icon}
                label={item.label}
                value={item.value}
                isStatus={item.isStatus && canMarkAsPaid}
                onStatusChange={item.onStatusChange}
              />
            ))}
          </View>

          {/* Additional Information if needed */}
          {loanDetails.notes && (
            <View style={styles.notesContainer}>
              <View style={styles.notesHeader}>
                <Icon name="file-text" size={18} color="#3B82F6" />
                <Text style={styles.notesTitle}>Additional Notes</Text>
              </View>
              <Text style={styles.notesText}>{loanDetails.notes}</Text>
            </View>
          )}
        </View>

        {/* Action Button - Only show if loan is pending AND borrower has accepted */}
        {canMarkAsPaid && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#10B981' }]}
            onPress={handleStatusChangeClick}>
            <Icon name="check-circle" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Mark as Paid</Text>
          </TouchableOpacity>
        )}

        {/* Created Date */}
        <View style={styles.footer}>
          <Icon name="clock" size={14} color="#9CA3AF" />
          <Text style={styles.footerText}>
            Created {moment(loanDetails.createdAt).fromNow()}
          </Text>
        </View>
      </ScrollView>

      {/* PromptBox for Status Change */}
      <PromptBox
        visible={isPromptVisible}
        message={`Are you sure you want to mark this loan as ${selectedStatus === 'pending' ? 'pending' : 'paid'}?`}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
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
    width: m(50),
    height: m(50),
    borderRadius: m(30),
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(16),
  },
  avatarText: {
    fontSize: m(24),
    fontWeight: '500',
    color: '#FFFFFF',
  },
  profileImage: {
    width: m(50),
    height: m(50),
    borderRadius: m(30),
    marginRight: m(16),
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: m(19),
    fontWeight: '600',
    color: '#111827',
    marginBottom: m(5),
  },
  profileMeta: {
    gap: m(5),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  metaText: {
    fontSize: m(14),
    color: '#6B7280',
  },
  
  // Status Container
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: m(10),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(20),
    gap: m(6),
    marginBottom: m(6),
  },
  statusText: {
    fontSize: m(12),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusLabel: {
    fontSize: m(12),
    color: '#6B7280',
  },
  statusDivider: {
    width: 1,
    height: m(40),
    backgroundColor: '#E5E7EB',
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
    marginBottom: m(10),
  },
  detailsGrid: {
    gap: m(10),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: m(12),
    padding: m(10),
  },
  detailIconContainer: {
    width: m(36),
    height: m(36),
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
    marginBottom: m(2),
  },
  detailValue: {
    fontSize: m(14),
    fontWeight: '500',
    color: '#374151',
  },
  statusButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(8),
    marginLeft: m(8),
  },
  statusButtonText: {
    fontSize: m(12),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Notes Section
  notesContainer: {
    marginTop: m(20),
    paddingTop: m(16),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    marginBottom: m(8),
  },
  notesTitle: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#374151',
  },
  notesText: {
    fontSize: m(14),
    color: '#6B7280',
    lineHeight: m(20),
  },
  
  // Action Button
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
    backgroundColor: '#3B82F6',
    borderRadius: m(12),
    padding: m(16),
    marginBottom: m(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButtonText: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#FFFFFF',
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