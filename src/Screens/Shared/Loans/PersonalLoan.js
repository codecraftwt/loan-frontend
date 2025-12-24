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
import { m } from 'walstar-rn-responsive';
import { useSelector } from 'react-redux';
import AgreementModal from '../../PromptBox/AgreementModal';
import Header from '../../../Components/Header';
import FontAwesome from 'react-native-vector-icons/FontAwesome';


const DetailCard = ({ icon, label, value }) => (
  <View style={styles.detailCard}>
    <View style={styles.detailIconContainer}>
      <Icon name={icon} size={20} color="#3B82F6" />
    </View>
    <View style={styles.detailContent}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

export default function PersonalLoan({ route }) {
  const { loanDetails } = route.params;
  const user = useSelector(state => state.auth.user);

  const [isModalVisible, setIsModalVisible] = useState(false);

  const formatDate = date => moment(date).format('DD MMM, YYYY');
  const formatCurrency = (amount) => {
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    return `₹${numAmount.toLocaleString('en-IN')}`;
  };

  // Get lender name with multiple fallbacks
  const getLenderName = () => {
    // Check multiple possible structures for lenderId object
    if (loanDetails?.lenderId) {
      // If lenderId is an object with userName
      if (typeof loanDetails.lenderId === 'object' && loanDetails.lenderId.userName) {
        return loanDetails.lenderId.userName;
      }
      // If lenderId is an object with name
      if (typeof loanDetails.lenderId === 'object' && loanDetails.lenderId.name) {
        return loanDetails.lenderId.name;
      }
      // If lenderId is a string ID, check if current user is the lender
      if (typeof loanDetails.lenderId === 'string' && user?.roleId === 1 && user?.userName) {
        return user.userName;
      }
    }
    
    // Check lender object
    if (loanDetails?.lender?.userName) {
      return loanDetails.lender.userName;
    }
    if (loanDetails?.lender?.name) {
      return loanDetails.lender.name;
    }
    
    // Check lenderName field
    if (loanDetails?.lenderName) {
      return loanDetails.lenderName;
    }
    
    // If user is a lender viewing their own loan, show their name
    if (user?.roleId === 1 && user?.userName) {
      return user.userName;
    }
    
    // Debug: Log the structure to help identify the issue (only in development)
    if (__DEV__) {
      console.log('Lender info structure:', {
        lenderId: loanDetails?.lenderId,
        lenderIdType: typeof loanDetails?.lenderId,
        lender: loanDetails?.lender,
        lenderName: loanDetails?.lenderName,
        userRole: user?.roleId,
        userName: user?.userName,
        loanDetailsKeys: Object.keys(loanDetails || {}),
      });
    }
    
    return 'Unknown';
  };

  // Calculate loan amounts
  const loanAmount = typeof loanDetails.amount === 'number' 
    ? loanDetails.amount 
    : parseFloat(loanDetails.amount) || 0;
  const totalPaid = typeof loanDetails.totalPaid === 'number'
    ? loanDetails.totalPaid
    : parseFloat(loanDetails.totalPaid) || 0;
  const remainingAmount = typeof loanDetails.remainingAmount === 'number'
    ? loanDetails.remainingAmount
    : parseFloat(loanDetails.remainingAmount) || loanAmount;
  
  // Check if loan is closed
  const isLoanClosed = remainingAmount <= 0 && totalPaid > 0;

  // Get display status based on borrower's decision
  const getDisplayStatus = () => {
    if (loanDetails.borrowerAcceptanceStatus?.toLowerCase() === 'rejected') {
      return 'rejected';
    }
    if (isLoanClosed) {
      return 'closed';
    }
    return loanDetails.paymentStatus || loanDetails.status;
  };

  const getStatusColor = (status) => {
    const displayStatus = getDisplayStatus();
    switch (displayStatus?.toLowerCase()) {
      case 'accepted': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'pending': return '#F59E0B';
      case 'paid': return '#10B981';
      case 'closed': return '#10B981';
      case 'part paid': return '#F59E0B';
      case 'overdue': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    const displayStatus = getDisplayStatus();
    switch (displayStatus?.toLowerCase()) {
      case 'accepted': return 'check-circle';
      case 'rejected': return 'x-circle';
      case 'paid': return 'check-circle';
      case 'closed': return 'check-circle';
      case 'part paid': return 'clock';
      case 'overdue': return 'alert-circle';
      default: return 'clock';
    }
  };

  // Get status display text
  const getStatusDisplayText = () => {
    if (loanDetails.borrowerAcceptanceStatus?.toLowerCase() === 'rejected') {
      return 'Rejected';
    }
    if (isLoanClosed) {
      return 'Closed';
    }
    return (loanDetails.paymentStatus || loanDetails.status)?.charAt(0).toUpperCase() + (loanDetails.paymentStatus || loanDetails.status)?.slice(1);
  };

  const loanInfo = [
    {
      label: 'Loan Amount',
      value: formatCurrency(loanAmount),
      icon: 'dollar-sign',
    },
    {
      label: 'Total Paid',
      value: formatCurrency(totalPaid),
      icon: 'check-circle',
    },
    {
      label: 'Remaining Amount',
      value: isLoanClosed ? '₹0 (Loan Closed)' : formatCurrency(remainingAmount),
      icon: 'dollar-sign',
    },
    {
      label: 'Loan Status',
      value: getStatusDisplayText(),
      icon: getStatusIcon(loanDetails.status),
    },
    {
      label: 'Purpose',
      value: loanDetails.purpose || 'Not specified',
      icon: 'book',
    },
    {
      label: 'Start Date',
      value: loanDetails.loanStartDate ? formatDate(loanDetails.loanStartDate) : 'N/A',
      icon: 'calendar',
    },
    {
      label: 'Due Date',
      value: formatDate(loanDetails.loanEndDate),
      icon: 'calendar',
    },
    {
      label: 'Lender',
      value: getLenderName(),
      icon: 'user',
    },
    {
      label: 'Address',
      value: loanDetails.address || 'Not specified',
      icon: 'map-pin',
    },
  ];

  return (
    <View style={styles.container}>
      <Header
        title="Loan Details"
        showBackButton
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            {user?.profileImage ? (
              <Image
                source={{ uri: user.profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileAvatar}>
                <Text style={styles.avatarText}>
                  {user?.userName?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={2}>
                {loanDetails.name || user?.userName || 'User'}
              </Text>
              <View style={styles.profileMeta}>
                <View style={styles.metaItem}>
                  <Icon name="phone" size={14} color="#6B7280" />
                  <Text style={styles.metaText}>
                    {loanDetails.mobileNumber || 'N/A'}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <FontAwesome name="id-card" color="#6B7280" size={14} />
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
              <View style={[styles.statusBadge, { backgroundColor: isLoanClosed ? '#10B981' : getStatusColor(loanDetails.status) }]}>
                <Icon name={isLoanClosed ? 'check-circle' : getStatusIcon(loanDetails.status)} size={14} color="#FFFFFF" />
                <Text style={styles.statusText}>
                  {getStatusDisplayText()}
                </Text>
              </View>
              <Text style={styles.statusLabel}>Loan Status</Text>
            </View>

            <View style={styles.statusDivider} />

            <View style={styles.statusItem}>
              <View style={[
                styles.statusBadge,
                {
                  backgroundColor: loanDetails.borrowerAcceptanceStatus?.toLowerCase() === 'accepted'
                    ? '#10B981'
                    : loanDetails.borrowerAcceptanceStatus?.toLowerCase() === 'rejected'
                      ? '#EF4444'
                      : '#F59E0B'
                }
              ]}>
                <Icon
                  name={loanDetails.borrowerAcceptanceStatus?.toLowerCase() === 'accepted'
                    ? 'check'
                    : loanDetails.borrowerAcceptanceStatus?.toLowerCase() === 'rejected'
                      ? 'x'
                      : 'clock'}
                  size={14}
                  color="#FFFFFF"
                />
                <Text style={styles.statusText}>
                  {loanDetails.borrowerAcceptanceStatus?.toUpperCase() || 'PENDING'}
                </Text>
              </View>
              <Text style={styles.statusLabel}>Your Decision</Text>
            </View>
          </View>
        </View>

        {/* Payment Summary Card */}
        {loanAmount > 0 && (
          <View style={styles.paymentSummaryCard}>
            <Text style={styles.paymentSummaryTitle}>Payment Summary</Text>
            
            <View style={styles.paymentSummaryRow}>
              <View style={styles.paymentSummaryItem}>
                <Text style={styles.paymentSummaryLabel}>Loan Amount</Text>
                <Text style={styles.paymentSummaryValue}>{formatCurrency(loanAmount)}</Text>
              </View>
              <View style={styles.paymentSummaryItem}>
                <Text style={styles.paymentSummaryLabel}>Total Paid</Text>
                <Text style={[styles.paymentSummaryValue, styles.paidAmount]}>
                  {formatCurrency(totalPaid)}
                </Text>
              </View>
              <View style={styles.paymentSummaryItem}>
                <Text style={styles.paymentSummaryLabel}>Remaining</Text>
                <Text style={[styles.paymentSummaryValue, isLoanClosed ? styles.closedAmount : styles.remainingAmount]}>
                  {isLoanClosed ? '₹0' : formatCurrency(remainingAmount)}
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${loanAmount > 0 ? (totalPaid / loanAmount) * 100 : 0}%`,
                      backgroundColor: isLoanClosed ? '#10B981' : '#3B82F6'
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {loanAmount > 0 ? `${((totalPaid / loanAmount) * 100).toFixed(1)}%` : '0%'} Paid
              </Text>
            </View>

            {/* Loan Closed Badge */}
            {isLoanClosed && (
              <View style={styles.closedBadge}>
                <Icon name="check-circle" size={20} color="#10B981" />
                <Text style={styles.closedBadgeText}>Loan Closed - All Amount Paid</Text>
              </View>
            )}
          </View>
        )}

        {/* Loan Details Grid */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Loan Information</Text>
          <View style={styles.detailsGrid}>
            {loanInfo.map((item, index) => (
              <DetailCard
                key={index}
                icon={item.icon}
                label={item.label}
                value={item.value}
              />
            ))}
          </View>
        </View>

        {/* Show message if loan is rejected */}
        {loanDetails.borrowerAcceptanceStatus?.toLowerCase() === 'rejected' && (
          <View style={styles.rejectionMessage}>
            <Icon name="alert-circle" size={24} color="#EF4444" />
            <View style={styles.rejectionTextContainer}>
              <Text style={styles.rejectionTitle}>Loan Rejected</Text>
              <Text style={styles.rejectionSubtitle}>
                This loan has been rejected and is no longer active
              </Text>
            </View>
          </View>
        )}

        {/* Agreement Button - Hide if loan is rejected */}
        {loanDetails.borrowerAcceptanceStatus?.toLowerCase() !== 'rejected' && (
          <TouchableOpacity
            style={styles.agreementButton}
            onPress={() => setIsModalVisible(true)}>
            <View style={styles.agreementButtonContent}>
              <Icon name="file-text" size={24} color="#3B82F6" />
              <View style={styles.agreementTextContainer}>
                <Text style={styles.agreementTitle}>Loan Agreement</Text>
                <Text style={styles.agreementSubtitle}>
                  View terms and conditions
                </Text>
              </View>
              <Icon name="chevron-right" size={24} color="#6B7280" />
            </View>
          </TouchableOpacity>
        )}

        {/* Loan Summary - Hide or modify if loan is rejected */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            {loanDetails.borrowerAcceptanceStatus?.toLowerCase() === 'rejected'
              ? 'Loan Summary (Rejected)'
              : 'Loan Summary'}
          </Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Amount {loanDetails.borrowerAcceptanceStatus?.toLowerCase() === 'rejected' ? 'Requested' : 'Taken'}</Text>
              <Text style={styles.summaryValue}>
                ₹{loanDetails.amount?.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Loan Duration</Text>
              <Text style={styles.summaryValue}>
                {loanDetails.loanStartDate && loanDetails.loanEndDate
                  ? `${moment(loanDetails.loanEndDate).diff(
                    moment(loanDetails.loanStartDate),
                    'days'
                  )} days`
                  : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Icon name="clock" size={14} color="#9CA3AF" />
            <Text style={styles.footerText}>
              Created {moment(loanDetails.createdAt).fromNow()}
            </Text>
          </View>
          {loanDetails.updatedAt && (
            <View style={styles.footerItem}>
              <Icon name="edit" size={14} color="#9CA3AF" />
              <Text style={styles.footerText}>
                Updated {moment(loanDetails.updatedAt).fromNow()}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Only show agreement modal if loan is not rejected */}
      {loanDetails.borrowerAcceptanceStatus?.toLowerCase() !== 'rejected' && (
        <AgreementModal
          isVisible={isModalVisible}
          agreement={loanDetails.agreement}
          onClose={() => setIsModalVisible(false)}
        />
      )}
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
    paddingBottom: m(45),
  },

  // Profile Card
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    padding: m(20),
    paddingVertical: m(14),
    marginBottom: m(16),
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
    marginBottom: m(12),
  },
  profileAvatar: {
    width: m(50),
    height: m(50),
    borderRadius: m(25),
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(16),
  },
  avatarText: {
    fontSize: m(23),
    fontWeight: '600',
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
    fontSize: m(20),
    fontWeight: '600',
    color: '#111827',
    marginBottom: m(4),
  },
  profileMeta: {
    gap: m(4),
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
    paddingTop: m(16),
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

  // Details Section
  detailsSection: {
    marginBottom: m(16),
  },
  sectionTitle: {
    fontSize: m(18),
    fontWeight: '600',
    color: '#111827',
    marginBottom: m(16),
    paddingHorizontal: m(4),
  },
  detailsGrid: {
    gap: m(10),
  },
  detailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: m(12),
    padding: m(13),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  detailIconContainer: {
    width: m(40),
    height: m(40),
    borderRadius: m(10),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(16),
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
    fontSize: m(16),
    fontWeight: '500',
    color: '#374151',
  },

  // Agreement Button
  agreementButton: {
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
  agreementButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agreementTextContainer: {
    flex: 1,
    marginLeft: m(16),
  },
  agreementTitle: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#111827',
    marginBottom: m(2),
  },
  agreementSubtitle: {
    fontSize: m(14),
    color: '#6B7280',
  },

  // Summary Card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    padding: m(16),
    paddingVertical: m(14),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  summaryTitle: {
    fontSize: m(17),
    fontWeight: '600',
    color: '#111827',
    marginBottom: m(10),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: m(12),
    color: '#6B7280',
    marginBottom: m(4),
  },
  summaryValue: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#111827',
  },
  summaryDivider: {
    width: 1,
    height: m(50),
    backgroundColor: '#E5E7EB',
  },

  // Footer
  footer: {
    gap: m(8),
    paddingHorizontal: m(4),
    marginBottom: m(16),
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  footerText: {
    fontSize: m(12),
    color: '#9CA3AF',
  },
  
  // Payment Summary Card
  paymentSummaryCard: {
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
  paymentSummaryTitle: {
    fontSize: m(18),
    fontWeight: '600',
    color: '#111827',
    marginBottom: m(16),
  },
  paymentSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: m(16),
    gap: m(12),
  },
  paymentSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  paymentSummaryLabel: {
    fontSize: m(12),
    color: '#6B7280',
    marginBottom: m(4),
  },
  paymentSummaryValue: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#111827',
  },
  paidAmount: {
    color: '#10B981',
  },
  remainingAmount: {
    color: '#EF4444',
  },
  closedAmount: {
    color: '#10B981',
  },
  progressContainer: {
    marginBottom: m(16),
  },
  progressBar: {
    height: m(8),
    backgroundColor: '#E5E7EB',
    borderRadius: m(4),
    overflow: 'hidden',
    marginBottom: m(8),
  },
  progressFill: {
    height: '100%',
    borderRadius: m(4),
    backgroundColor: '#3B82F6',
  },
  progressText: {
    fontSize: m(12),
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  closedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: m(8),
    padding: m(12),
    gap: m(8),
    marginTop: m(8),
  },
  closedBadgeText: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#10B981',
  },
});