import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import moment from 'moment';
import { m } from 'walstar-rn-responsive';
import { useSelector } from 'react-redux';
import AgreementModal from '../../PromptBox/AgreementModal';
import Header from '../../../Components/Header';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { lenderLoanAPI } from '../../../Services/lenderLoanService';
import Toast from 'react-native-toast-message';


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
  const [installmentHistory, setInstallmentHistory] = useState(null);
  const [loadingInstallments, setLoadingInstallments] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllInstallments, setShowAllInstallments] = useState(false);

  // Check if user is a lender
  const isLender = user?.roleId === 1;

  // Fetch installment history for lenders
  useEffect(() => {
    if (isLender && loanDetails?._id) {
      fetchInstallmentHistory();
    }
  }, [isLender, loanDetails?._id]);

  const fetchInstallmentHistory = async () => {
    try {
      setLoadingInstallments(true);
      const response = await lenderLoanAPI.getInstallmentHistory(loanDetails._id);
      if (response) {
        setInstallmentHistory(response);
      }
    } catch (error) {
      // Only show error if it's not a 400/404 (not an installment loan)
      if (error.response?.status !== 400 && error.response?.status !== 404) {
        console.error('Error fetching installment history:', error);
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Error',
          text2: error.response?.data?.message || 'Failed to fetch installment history',
        });
      }
    } finally {
      setLoadingInstallments(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInstallmentHistory();
    setRefreshing(false);
  };

  const formatDate = date => moment(date).format('DD MMM, YYYY');
  const formatCurrency = (amount) => {
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    return `₹${numAmount.toLocaleString('en-IN')}`;
  };

  // Render installment item
  const renderInstallmentItem = (installment, index) => {
    const getStatusColor = (status) => {
      switch (status?.toLowerCase()) {
        case 'paid': return '#10B981';
        case 'pending': return '#F59E0B';
        case 'rejected': return '#EF4444';
        case 'overdue': return '#EF4444';
        case 'upcoming': return '#6B7280';
        default: return '#6B7280';
      }
    };

    const getStatusIcon = (status) => {
      switch (status?.toLowerCase()) {
        case 'paid': return 'check-circle';
        case 'pending': return 'clock';
        case 'rejected': return 'x-circle';
        case 'overdue': return 'alert-circle';
        case 'upcoming': return 'calendar';
        default: return 'circle';
      }
    };

    const statusColor = getStatusColor(installment.status);
    const statusIcon = getStatusIcon(installment.status);
    const isLast = index === (showAllInstallments
      ? installmentHistory.installmentHistory.length - 1
      : Math.min(2, installmentHistory.installmentHistory.length - 1));

    return (
      <View
        key={installment.installmentNumber}
        style={[styles.installmentCard, isLast && styles.installmentCardLast]}>
        <View style={styles.installmentHeader}>
          <View style={styles.installmentLeftSection}>
            <View style={[styles.installmentIconContainer, { backgroundColor: statusColor + '20' }]}>
              <Icon name={statusIcon} size={18} color={statusColor} />
            </View>
            <View style={styles.installmentInfo}>
              <Text style={styles.installmentNumber}>
                Installment #{installment.installmentNumber}
              </Text>
              <Text style={[styles.installmentStatus, { color: statusColor }]}>
                {installment.status?.charAt(0).toUpperCase() + installment.status?.slice(1)}
              </Text>
            </View>
          </View>
          <Text style={styles.installmentAmount}>
            {formatCurrency(installment.amount)}
          </Text>
        </View>

        <View style={styles.installmentDetails}>
          <View style={styles.installmentDetailRow}>
            <Text style={styles.installmentDetailLabel}>Due Date:</Text>
            <Text style={styles.installmentDetailValue}>
              {moment(installment.dueDate).format('DD MMM YYYY')}
            </Text>
          </View>

          {installment.status === 'paid' && (
            <>
              <View style={styles.installmentDetailRow}>
                <Text style={styles.installmentDetailLabel}>Paid Date:</Text>
                <Text style={styles.installmentDetailValue}>
                  {moment(installment.paidDate).format('DD MMM YYYY, hh:mm A')}
                </Text>
              </View>
              <View style={styles.installmentDetailRow}>
                <Text style={styles.installmentDetailLabel}>Payment Mode:</Text>
                <Text style={styles.installmentDetailValue}>
                  {installment.paymentMode?.charAt(0).toUpperCase() + installment.paymentMode?.slice(1)}
                </Text>
              </View>
            </>
          )}

          {installment.status === 'pending' && (
            <>
              <View style={styles.installmentDetailRow}>
                <Text style={styles.installmentDetailLabel}>Submitted:</Text>
                <Text style={styles.installmentDetailValue}>
                  {moment(installment.submittedDate).format('DD MMM YYYY, hh:mm A')}
                </Text>
              </View>
              <View style={styles.installmentDetailRow}>
                <Text style={styles.installmentDetailLabel}>Payment Mode:</Text>
                <Text style={styles.installmentDetailValue}>
                  {installment.paymentMode?.charAt(0).toUpperCase() + installment.paymentMode?.slice(1)}
                </Text>
              </View>
              <View style={styles.pendingBadge}>
                <Icon name="clock" size={14} color="#F59E0B" />
                <Text style={styles.pendingBadgeText}>Awaiting your confirmation</Text>
              </View>
            </>
          )}

          {installment.status === 'rejected' && (
            <>
              <View style={styles.installmentDetailRow}>
                <Text style={styles.installmentDetailLabel}>Rejected Date:</Text>
                <Text style={styles.installmentDetailValue}>
                  {moment(installment.rejectedDate).format('DD MMM YYYY')}
                </Text>
              </View>
              {installment.rejectionReason && (
                <View style={styles.installmentDetailRow}>
                  <Text style={styles.installmentDetailLabel}>Reason:</Text>
                  <Text style={styles.installmentDetailValue}>
                    {installment.rejectionReason}
                  </Text>
                </View>
              )}
            </>
          )}

          {installment.status === 'overdue' && (
            <View style={styles.overdueBadge}>
              <Icon name="alert-circle" size={14} color="#EF4444" />
              <Text style={styles.overdueBadgeText}>
                {installment.overdueDays} day(s) overdue
              </Text>
            </View>
          )}
        </View>
      </View>
    );
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
  
  // Check if loan is overdue
  const isOverdue = loanDetails.loanEndDate && 
    moment(loanDetails.loanEndDate).isBefore(moment(), 'day') && 
    remainingAmount > 0 && 
    !isLoanClosed;

  // Get display status based on borrower's decision
  const getDisplayStatus = () => {
    if (loanDetails.borrowerAcceptanceStatus?.toLowerCase() === 'rejected') {
      return 'rejected';
    }
    if (isOverdue) {
      return 'overdue';
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
      value: isOverdue ? 'Overdue' : getStatusDisplayText(),
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
        refreshControl={
          isLender ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
      >
        {/* Profile Card */}
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
                  {(loanDetails.name || user?.userName || 'U')?.charAt(0)?.toUpperCase()}
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
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(loanDetails.status) }]}>
                <Icon name={getStatusIcon(loanDetails.status)} size={14} color="#FFFFFF" />
                <Text style={styles.statusText}>
                  {isOverdue ? 'Overdue' : getStatusDisplayText()}
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
              <Text style={styles.statusLabel}>Borrower Decision</Text>
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
                      backgroundColor: isOverdue ? '#EF4444' : (isLoanClosed ? '#10B981' : '#3B82F6')
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {loanAmount > 0 ? `${((totalPaid / loanAmount) * 100).toFixed(1)}%` : '0%'} Paid
                {isOverdue && ' • Overdue'}
              </Text>
            </View>

            {/* Overdue Badge */}
            {isOverdue && (
              <View style={styles.overdueBadge}>
                <Icon name="alert-circle" size={20} color="#EF4444" />
                <Text style={styles.overdueBadgeText}>
                  Overdue - Payment was due on {moment(loanDetails.loanEndDate).format('DD MMM YYYY')}
                </Text>
              </View>
            )}
            
            {/* Loan Closed Badge */}
            {isLoanClosed && !isOverdue && (
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

        {/* Installment History Section - Only for Lenders */}
        {isLender && installmentHistory && (
          <View style={styles.installmentSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Icon name="calendar" size={20} color="#111827" />
                <Text style={styles.sectionTitle}>Installment History</Text>
              </View>
              {installmentHistory.installmentHistory?.length > 3 && (
                <TouchableOpacity
                  onPress={() => setShowAllInstallments(!showAllInstallments)}
                  activeOpacity={0.7}>
                  <Text style={styles.viewAllText}>
                    {showAllInstallments ? 'Show Less' : 'See All'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Installment Plan Summary */}
            {installmentHistory.installmentPlan && (
              <View style={styles.installmentPlanCard}>
                <View style={styles.planRow}>
                  <View style={styles.planItem}>
                    <Text style={styles.planLabel}>Total Installments</Text>
                    <Text style={styles.planValue}>
                      {installmentHistory.installmentPlan.totalInstallments}
                    </Text>
                  </View>
                  <View style={styles.planItem}>
                    <Text style={styles.planLabel}>Paid</Text>
                    <Text style={[styles.planValue, { color: '#10B981' }]}>
                      {installmentHistory.installmentPlan.paidInstallments}
                    </Text>
                  </View>
                  <View style={styles.planItem}>
                    <Text style={styles.planLabel}>Pending</Text>
                    <Text style={[styles.planValue, { color: '#F59E0B' }]}>
                      {installmentHistory.installmentPlan.pendingInstallments}
                    </Text>
                  </View>
                  <View style={styles.planItem}>
                    <Text style={styles.planLabel}>Overdue</Text>
                    <Text style={[styles.planValue, { color: '#EF4444' }]}>
                      {installmentHistory.installmentPlan.overdueInstallments}
                    </Text>
                  </View>
                </View>
                <View style={styles.planDetails}>
                  <Text style={styles.planDetailText}>
                    Installment Amount: {formatCurrency(installmentHistory.installmentPlan.installmentAmount)}
                  </Text>
                  <Text style={styles.planDetailText}>
                    Frequency: {installmentHistory.installmentPlan.frequency?.charAt(0).toUpperCase() + installmentHistory.installmentPlan.frequency?.slice(1)}
                  </Text>
                  {installmentHistory.installmentPlan.nextDueDate && (
                    <Text style={styles.planDetailText}>
                      Next Due: {moment(installmentHistory.installmentPlan.nextDueDate).format('DD MMM YYYY')}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Summary Stats */}
            {installmentHistory.summary && (
              <View style={styles.summaryStatsCard}>
                <View style={styles.summaryStatsRow}>
                  <View style={styles.summaryStatItem}>
                    <Text style={styles.summaryStatLabel}>Total Paid</Text>
                    <Text style={[styles.summaryStatValue, { color: '#10B981' }]}>
                      {formatCurrency(installmentHistory.summary.totalPaidAmount)}
                    </Text>
                  </View>
                  <View style={styles.summaryStatItem}>
                    <Text style={styles.summaryStatLabel}>Pending</Text>
                    <Text style={[styles.summaryStatValue, { color: '#F59E0B' }]}>
                      {formatCurrency(installmentHistory.summary.totalPendingAmount)}
                    </Text>
                  </View>
                  <View style={styles.summaryStatItem}>
                    <Text style={styles.summaryStatLabel}>Overdue</Text>
                    <Text style={[styles.summaryStatValue, { color: '#EF4444' }]}>
                      {formatCurrency(installmentHistory.summary.totalOverdueAmount)}
                    </Text>
                  </View>
                </View>
                {installmentHistory.summary.onTimePaymentRate !== undefined && (
                  <View style={styles.onTimeRateContainer}>
                    <Text style={styles.onTimeRateLabel}>On-Time Payment Rate</Text>
                    <Text style={styles.onTimeRateValue}>
                      {installmentHistory.summary.onTimePaymentRate.toFixed(1)}%
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Installment List */}
            {loadingInstallments ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={styles.loadingText}>Loading installments...</Text>
              </View>
            ) : installmentHistory.installmentHistory?.length > 0 ? (
              <View style={styles.installmentListContainer}>
                {(showAllInstallments
                  ? installmentHistory.installmentHistory
                  : installmentHistory.installmentHistory.slice(0, 3)
                ).map((installment, index) => renderInstallmentItem(installment, index))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No installment history available</Text>
              </View>
            )}

            {/* Action Message */}
            {installmentHistory.actions?.requiresAction && (
              <View style={styles.actionCard}>
                <Icon name="alert-circle" size={20} color="#F59E0B" />
                <Text style={styles.actionText}>
                  {installmentHistory.actions.message}
                </Text>
              </View>
            )}
          </View>
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
    borderRadius: m(20),
    padding: m(24),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(12),
  },
  profileAvatar: {
    width: m(60),
    height: m(60),
    borderRadius: m(30),
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(16),
    borderWidth: 3,
    borderColor: '#FFF3E0',
  },
  avatarText: {
    fontSize: m(23),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  profileImage: {
    width: m(60),
    height: m(60),
    borderRadius: m(30),
    marginRight: m(16),
    borderWidth: 3,
    borderColor: '#EFF6FF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: m(22),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(8),
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
    fontSize: m(20),
    fontWeight: '700',
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
    borderRadius: m(14),
    padding: m(14),
    marginBottom: m(5),
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  detailIconContainer: {
    width: m(44),
    height: m(44),
    borderRadius: m(12),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(14),
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: m(11),
    color: '#9CA3AF',
    marginBottom: m(4),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#111827',
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
    borderRadius: m(20),
    padding: m(24),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  paymentSummaryTitle: {
    fontSize: m(20),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(20),
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
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: m(8),
    padding: m(12),
    gap: m(8),
    marginTop: m(8),
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  overdueBadgeText: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#DC2626',
    flex: 1,
  },

  // Installment History Styles
  installmentSection: {
    marginBottom: m(16),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(16),
    paddingHorizontal: m(4),
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
  },
  viewAllText: {
    fontSize: m(14),
    color: '#3B82F6',
    fontWeight: '600',
  },
  installmentPlanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    padding: m(16),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: m(12),
  },
  planItem: {
    alignItems: 'center',
    flex: 1,
  },
  planLabel: {
    fontSize: m(11),
    color: '#6B7280',
    marginBottom: m(4),
    textAlign: 'center',
  },
  planValue: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#111827',
  },
  planDetails: {
    paddingTop: m(12),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: m(6),
  },
  planDetailText: {
    fontSize: m(13),
    color: '#6B7280',
  },
  summaryStatsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: m(12),
    padding: m(16),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: m(12),
  },
  summaryStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryStatLabel: {
    fontSize: m(11),
    color: '#6B7280',
    marginBottom: m(4),
  },
  summaryStatValue: {
    fontSize: m(14),
    fontWeight: '700',
    color: '#111827',
  },
  onTimeRateContainer: {
    paddingTop: m(12),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  onTimeRateLabel: {
    fontSize: m(13),
    color: '#6B7280',
    fontWeight: '600',
  },
  onTimeRateValue: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#10B981',
  },
  installmentListContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: m(12),
  },
  installmentCard: {
    padding: m(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  installmentCardLast: {
    borderBottomWidth: 0,
  },
  installmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(12),
  },
  installmentLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  installmentIconContainer: {
    width: m(40),
    height: m(40),
    borderRadius: m(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(12),
  },
  installmentInfo: {
    flex: 1,
  },
  installmentNumber: {
    fontSize: m(15),
    fontWeight: '600',
    color: '#111827',
    marginBottom: m(2),
  },
  installmentStatus: {
    fontSize: m(12),
    fontWeight: '500',
  },
  installmentAmount: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#111827',
  },
  installmentDetails: {
    gap: m(8),
  },
  installmentDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  installmentDetailLabel: {
    fontSize: m(12),
    color: '#6B7280',
    fontWeight: '500',
  },
  installmentDetailValue: {
    fontSize: m(12),
    color: '#111827',
    flex: 1,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    padding: m(8),
    borderRadius: m(6),
    gap: m(6),
    marginTop: m(4),
  },
  pendingBadgeText: {
    fontSize: m(12),
    color: '#F59E0B',
    fontWeight: '500',
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: m(8),
    borderRadius: m(6),
    gap: m(6),
    marginTop: m(4),
  },
  overdueBadgeText: {
    fontSize: m(12),
    color: '#EF4444',
    fontWeight: '500',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: m(12),
    padding: m(16),
    gap: m(12),
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  actionText: {
    flex: 1,
    fontSize: m(14),
    color: '#92400E',
    fontWeight: '500',
  },
  loadingContainer: {
    padding: m(20),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    marginBottom: m(12),
  },
  loadingText: {
    marginTop: m(8),
    fontSize: m(12),
    color: '#6B7280',
  },
  emptyContainer: {
    padding: m(20),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    marginBottom: m(12),
  },
  emptyText: {
    fontSize: m(14),
    color: '#9CA3AF',
  },
});