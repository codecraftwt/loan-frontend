import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import moment from 'moment';
import { m } from 'walstar-rn-responsive';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Header from '../../../Components/Header';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { lenderLoanAPI } from '../../../Services/lenderLoanService';
import borrowerLoanAPI from '../../../Services/borrowerLoanService';
import Toast from 'react-native-toast-message';
import { baseurl } from '../../../Utils/API';
import PinVerificationModal from '../../../Components/PinVerificationModal';
import { colors, FontFamily } from '../../../constants';

const ORANGE_THEME = {
  primary: colors.navy,
  primaryLight: colors.navyTint,
  primaryDark: colors.navyDark,
  secondary: colors.skySoft,
  accent: colors.butter,
  background: colors.offWhite,
  card: colors.white,
  text: colors.ink,
  textLight: colors.textSecondary,
  border: '#E2DED4',
  success: colors.success,
  warning: colors.goldDark,
  error: colors.error,
  info: colors.skyText,
  sky: colors.sky,
  mint: colors.mint,
  ink: colors.navyDark,
};

const DetailCard = ({ icon, label, value }) => (
  <View style={styles.detailCard}>
    <View style={styles.detailIconContainer}>
      <Icon name={icon} size={17} color={ORANGE_THEME.info} />
    </View>
    <View style={styles.detailContent}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  </View>
);

export default function PersonalLoan({ route }) {
  const { loanDetails, fromPendingOffer = false } = route.params;
  const user = useSelector(state => state.auth.user);
  const navigation = useNavigation();

  const [installmentHistory, setInstallmentHistory] = useState(null);
  const [loadingInstallments, setLoadingInstallments] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllInstallments, setShowAllInstallments] = useState(false);
  const [proofViewerVisible, setProofViewerVisible] = useState(false);
  const [selectedProofUrl, setSelectedProofUrl] = useState(null);
  const [acceptPinModalVisible, setAcceptPinModalVisible] = useState(false);

  // Check if user is a lender
  const isLender = user?.roleId === 1;
  const canAcceptPendingOffer =
    user?.roleId === 2 &&
    loanDetails?.borrowerAcceptanceStatus?.toLowerCase() === 'pending' &&
    fromPendingOffer;

  const fetchInstallmentHistory = useCallback(async () => {
    try {
      setLoadingInstallments(true);
      const response = await lenderLoanAPI.getInstallmentHistory(
        loanDetails._id,
      );
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
          text2:
            error.response?.data?.message ||
            'Failed to fetch installment history',
        });
      }
    } finally {
      setLoadingInstallments(false);
    }
  }, [loanDetails._id]);

  // Fetch installment history for lenders
  useEffect(() => {
    if (isLender && loanDetails?._id) {
      fetchInstallmentHistory();
    }
  }, [fetchInstallmentHistory, isLender, loanDetails?._id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInstallmentHistory();
    setRefreshing(false);
  };

  const formatDate = date => moment(date).format('DD MMM, YYYY');
  const formatCurrency = amount => {
    const numAmount =
      typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    return `₹${numAmount.toLocaleString('en-IN')}`;
  };

  // Get proof URL - Cloudinary URLs are already full URLs
  const getProofUrl = proof => {
    if (!proof) return null;

    // If it's already a full URL (starts with http:// or https://), return as is
    if (proof.startsWith('http://') || proof.startsWith('https://')) {
      return proof;
    }

    // If it's a relative path, construct full URL (unlikely for Cloudinary, but handle it)
    let baseUrl = baseurl.replace('/api', '').replace(/\/$/, '');

    let proofPath = proof;
    if (proofPath.startsWith('/')) {
      proofPath = proofPath.substring(1);
    }

    const fullUrl = `${baseUrl}/${proofPath}`;
    return fullUrl;
  };

  // Handle viewing loan proof
  const handleViewProof = () => {
    const proofUrl = getProofUrl(loanDetails.proof);
    if (proofUrl) {
      setSelectedProofUrl(proofUrl);
      setProofViewerVisible(true);
    } else {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: 'Loan proof image not available',
      });
    }
  };

  // Render installment item
  const renderInstallmentItem = (installment, index) => {
    const getStatusColor = status => {
      switch (status?.toLowerCase()) {
        case 'paid':
          return ORANGE_THEME.success;
        case 'pending':
          return ORANGE_THEME.warning;
        case 'rejected':
          return ORANGE_THEME.error;
        case 'overdue':
          return ORANGE_THEME.error;
        case 'upcoming':
          return ORANGE_THEME.textLight;
        default:
          return ORANGE_THEME.textLight;
      }
    };

    const getStatusIcon = status => {
      switch (status?.toLowerCase()) {
        case 'paid':
          return 'check-circle';
        case 'pending':
          return 'clock';
        case 'rejected':
          return 'x-circle';
        case 'overdue':
          return 'alert-circle';
        case 'upcoming':
          return 'calendar';
        default:
          return 'circle';
      }
    };

    const statusColor = getStatusColor(installment.status);
    const statusIcon = getStatusIcon(installment.status);
    const isLast =
      index ===
      (showAllInstallments
        ? installmentHistory.installmentHistory.length - 1
        : Math.min(2, installmentHistory.installmentHistory.length - 1));

    return (
      <View
        key={installment.installmentNumber}
        style={[styles.installmentCard, isLast && styles.installmentCardLast]}
      >
        <View style={styles.installmentHeader}>
          <View style={styles.installmentLeftSection}>
            <View
              style={[
                styles.installmentIconContainer,
                { backgroundColor: statusColor + '20' },
              ]}
            >
              <Icon name={statusIcon} size={18} color={statusColor} />
            </View>
            <View style={styles.installmentInfo}>
              <Text style={styles.installmentNumber}>
                Installment #{installment.installmentNumber}
              </Text>
              <Text style={[styles.installmentStatus, { color: statusColor }]}>
                {installment.status?.charAt(0).toUpperCase() +
                  installment.status?.slice(1)}
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
                  {installment.paymentMode?.charAt(0).toUpperCase() +
                    installment.paymentMode?.slice(1)}
                </Text>
              </View>
            </>
          )}

          {installment.status === 'pending' && (
            <>
              <View style={styles.installmentDetailRow}>
                <Text style={styles.installmentDetailLabel}>Submitted:</Text>
                <Text style={styles.installmentDetailValue}>
                  {moment(installment.submittedDate).format(
                    'DD MMM YYYY, hh:mm A',
                  )}
                </Text>
              </View>
              <View style={styles.installmentDetailRow}>
                <Text style={styles.installmentDetailLabel}>Payment Mode:</Text>
                <Text style={styles.installmentDetailValue}>
                  {installment.paymentMode?.charAt(0).toUpperCase() +
                    installment.paymentMode?.slice(1)}
                </Text>
              </View>
              <View style={styles.pendingBadge}>
                <Icon name="clock" size={14} color={ORANGE_THEME.warning} />
                <Text style={styles.pendingBadgeText}>
                  Awaiting your confirmation
                </Text>
              </View>
            </>
          )}

          {installment.status === 'rejected' && (
            <>
              <View style={styles.installmentDetailRow}>
                <Text style={styles.installmentDetailLabel}>
                  Rejected Date:
                </Text>
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
            <View style={styles.installmentOverdueBadge}>
              <Icon name="alert-circle" size={14} color={ORANGE_THEME.error} />
              <Text style={styles.installmentOverdueBadgeText}>
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
      if (
        typeof loanDetails.lenderId === 'object' &&
        loanDetails.lenderId.userName
      ) {
        return loanDetails.lenderId.userName;
      }
      // If lenderId is an object with name
      if (
        typeof loanDetails.lenderId === 'object' &&
        loanDetails.lenderId.name
      ) {
        return loanDetails.lenderId.name;
      }
      // If lenderId is a string ID, check if current user is the lender
      if (
        typeof loanDetails.lenderId === 'string' &&
        user?.roleId === 1 &&
        user?.userName
      ) {
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

  const handleAcceptWithPin = async pinCode => {
    const response = await borrowerLoanAPI.acceptLoan(loanDetails._id, pinCode);

    if (response?.success) {
      setAcceptPinModalVisible(false);
      Toast.show({
        type: 'success',
        position: 'top',
        text1: 'Loan Accepted',
        text2: 'The lender offer has been accepted successfully',
      });
      navigation.goBack();
      return response;
    }

    throw new Error(response?.message || 'Failed to accept loan');
  };

  const handleForgotPin = () => {
    setAcceptPinModalVisible(false);
    navigation.navigate('ForgotPin');
  };

  // Calculate loan amounts
  const loanAmount =
    typeof loanDetails.amount === 'number'
      ? loanDetails.amount
      : parseFloat(loanDetails.amount) || 0;
  const totalPaid =
    typeof loanDetails.totalPaid === 'number'
      ? loanDetails.totalPaid
      : parseFloat(loanDetails.totalPaid) || 0;
  const remainingAmount =
    typeof loanDetails.remainingAmount === 'number'
      ? loanDetails.remainingAmount
      : parseFloat(loanDetails.remainingAmount) || loanAmount;

  // Check if loan is closed
  const isLoanClosed = remainingAmount <= 0 && totalPaid > 0;

  // Check if loan is overdue
  const isOverdue =
    loanDetails.loanEndDate &&
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

  const getStatusColor = status => {
    const displayStatus = status || getDisplayStatus();
    switch (displayStatus?.toLowerCase()) {
      case 'accepted':
      case 'pending':
      case 'paid':
      case 'closed':
      case 'part paid':
        return colors.butter;
      case 'rejected':
      case 'overdue':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = status => {
    const displayStatus = getDisplayStatus();
    switch (displayStatus?.toLowerCase()) {
      case 'accepted':
        return 'check-circle';
      case 'rejected':
        return 'x-circle';
      case 'paid':
        return 'check-circle';
      case 'closed':
        return 'check-circle';
      case 'part paid':
        return 'clock';
      case 'overdue':
        return 'alert-circle';
      default:
        return 'clock';
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
    return (
      (loanDetails.paymentStatus || loanDetails.status)
        ?.charAt(0)
        .toUpperCase() +
      (loanDetails.paymentStatus || loanDetails.status)?.slice(1)
    );
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
      value: isLoanClosed
        ? '₹0 (Loan Closed)'
        : formatCurrency(remainingAmount),
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
      value: loanDetails.loanStartDate
        ? formatDate(loanDetails.loanStartDate)
        : 'N/A',
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
      <Header title="Loan Details" showBackButton />

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
        {!fromPendingOffer && (
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
                    {(loanDetails.name || user?.userName || 'U')
                      ?.charAt(0)
                      ?.toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.profileInfo}>
                <Text style={styles.profileName} numberOfLines={2}>
                  {loanDetails.name || user?.userName || 'User'}
                </Text>
                <View style={styles.profileMeta}>
                  <View style={styles.metaItem}>
                    <Icon
                      name="phone"
                      size={14}
                      color={ORANGE_THEME.textLight}
                    />
                    <Text style={styles.metaText}>
                      {loanDetails.mobileNumber || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <FontAwesome
                      name="id-card"
                      color={ORANGE_THEME.textLight}
                      size={14}
                    />
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
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(loanDetails.status) },
                  ]}
                >
                  <Icon
                    name={getStatusIcon(loanDetails.status)}
                    size={14}
                    color={isOverdue ? colors.white : colors.ink}
                  />
                  <Text style={styles.statusText}>
                    {isOverdue ? 'Overdue' : getStatusDisplayText()}
                  </Text>
                </View>
                <Text style={styles.statusLabel}>Loan Status</Text>
              </View>

              <View style={styles.statusDivider} />

              <View style={styles.statusItem}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: getStatusColor(
                        loanDetails.borrowerAcceptanceStatus,
                      ),
                    },
                  ]}
                >
                  <Icon
                    name={
                      loanDetails.borrowerAcceptanceStatus?.toLowerCase() ===
                      'accepted'
                        ? 'check'
                        : loanDetails.borrowerAcceptanceStatus?.toLowerCase() ===
                          'rejected'
                        ? 'x'
                        : 'clock'
                    }
                    size={14}
                    color={
                      loanDetails.borrowerAcceptanceStatus?.toLowerCase() ===
                      'rejected'
                        ? colors.white
                        : colors.ink
                    }
                  />
                  <Text style={styles.statusText}>
                    {loanDetails.borrowerAcceptanceStatus?.toUpperCase() ||
                      'PENDING'}
                  </Text>
                </View>
                <Text style={styles.statusLabel}>Borrower Decision</Text>
              </View>
            </View>
          </View>
        )}

        {/* Payment Summary Card */}
        {!fromPendingOffer && loanAmount > 0 && (
          <View style={styles.paymentSummaryCard}>
            <View style={styles.rowContainer}>
              <View style={styles.titleIconTile}>
                <Icon name="credit-card" size={17} color={colors.white} />
              </View>
              <Text style={styles.paymentSummaryTitle}>Payment Summary</Text>
            </View>

            <View style={styles.paymentSummaryRow}>
              <View style={styles.paymentSummaryItem}>
                <Text style={styles.paymentSummaryLabel}>Loan Amount</Text>
                <Text style={styles.paymentSummaryValue}>
                  {formatCurrency(loanAmount)}
                </Text>
              </View>
              <View style={styles.paymentSummaryItem}>
                <Text style={styles.paymentSummaryLabel}>Total Paid</Text>
                <Text style={[styles.paymentSummaryValue, styles.paidAmount]}>
                  {formatCurrency(totalPaid)}
                </Text>
              </View>
              <View style={styles.paymentSummaryItem}>
                <Text style={styles.paymentSummaryLabel}>Remaining</Text>
                <Text
                  style={[
                    styles.paymentSummaryValue,
                    isLoanClosed ? styles.closedAmount : styles.remainingAmount,
                  ]}
                >
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
                      width: `${
                        loanAmount > 0 ? (totalPaid / loanAmount) * 100 : 0
                      }%`,
                      backgroundColor: isOverdue
                        ? ORANGE_THEME.error
                        : isLoanClosed
                        ? ORANGE_THEME.success
                        : ORANGE_THEME.primary,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {loanAmount > 0
                  ? `${((totalPaid / loanAmount) * 100).toFixed(1)}%`
                  : '0%'}{' '}
                Paid
                {isOverdue && ' • Overdue'}
              </Text>
            </View>

            {/* Overdue Badge */}
            {isOverdue && (
              <View style={styles.overdueBadge}>
                <Icon
                  name="alert-circle"
                  size={20}
                  color={ORANGE_THEME.error}
                />
                <Text style={styles.overdueBadgeText}>
                  Overdue - Payment was due on{' '}
                  {moment(loanDetails.loanEndDate).format('DD MMM YYYY')}
                </Text>
              </View>
            )}

            {/* Loan Closed Badge */}
            {isLoanClosed && !isOverdue && (
              <View style={styles.closedBadge}>
                <Icon
                  name="check-circle"
                  size={20}
                  color={ORANGE_THEME.success}
                />
                <Text style={styles.closedBadgeText}>
                  Loan Closed - All Amount Paid
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Loan Details Grid */}
        {!fromPendingOffer && (
          <View style={styles.detailsSection}>
            <View style={styles.rowContainer}>
              <View style={styles.titleIconTile}>
                <Icon name="info" size={17} color={colors.white} />
              </View>
              <Text style={styles.sectionTitle}>Loan Information</Text>
            </View>
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
        )}

        {/* Loan Proof Section */}
        {(loanDetails.proof || fromPendingOffer) && (
          <View style={styles.proofSection}>
            <Text style={styles.sectionTitle}>Lender Proof</Text>
            {loanDetails.proof ? (
              <TouchableOpacity
                style={styles.proofCard}
                onPress={handleViewProof}
                activeOpacity={0.8}
              >
                <View style={styles.proofIconContainer}>
                  <Icon
                    name="file-image"
                    size={24}
                    color={ORANGE_THEME.primary}
                  />
                </View>
                <View style={styles.proofTextContainer}>
                  <Text style={styles.proofTitle}>Proof Provided</Text>
                  <Text style={styles.proofSubtext}>
                    Tap to view lender proof
                  </Text>
                </View>
                <Icon
                  name="chevron-right"
                  size={20}
                  color={ORANGE_THEME.textLight}
                />
              </TouchableOpacity>
            ) : (
              <View style={[styles.proofCard, styles.noProofCard]}>
                <View
                  style={[
                    styles.proofIconContainer,
                    styles.noProofIconContainer,
                  ]}
                >
                  <Icon
                    name="file-x"
                    size={24}
                    color={ORANGE_THEME.textLight}
                  />
                </View>
                <View style={styles.proofTextContainer}>
                  <Text style={styles.proofTitle}>No Proof Provided</Text>
                  <Text style={styles.proofSubtext}>
                    The lender has not uploaded proof for this offer.
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Show message if loan is rejected */}
        {!fromPendingOffer &&
          loanDetails.borrowerAcceptanceStatus?.toLowerCase() ===
            'rejected' && (
            <View style={styles.rejectionMessage}>
              <Icon name="alert-circle" size={24} color={ORANGE_THEME.error} />
              <View style={styles.rejectionTextContainer}>
                <Text style={styles.rejectionTitle}>Loan Rejected</Text>
                <Text style={styles.rejectionSubtitle}>
                  This loan has been rejected and is no longer active
                </Text>
              </View>
            </View>
          )}

        {/* Agreement Button - Hide if loan is rejected */}
        {!fromPendingOffer &&
          loanDetails.borrowerAcceptanceStatus?.toLowerCase() !==
            'rejected' && (
            <TouchableOpacity
              style={styles.agreementButton}
              onPress={() =>
                navigation.navigate('AgreementScreen', {
                  agreement: loanDetails.agreement,
                })
              }
            >
              <View style={styles.agreementButtonContent}>
                <Icon name="file-text" size={24} color={ORANGE_THEME.primary} />
                <View style={styles.agreementTextContainer}>
                  <Text style={styles.agreementTitle}>Loan Agreement</Text>
                  <Text style={styles.agreementSubtitle}>
                    View terms and conditions
                  </Text>
                </View>
                <Icon
                  name="chevron-right"
                  size={24}
                  color={ORANGE_THEME.textLight}
                />
              </View>
            </TouchableOpacity>
          )}

        {canAcceptPendingOffer && (
          <View style={styles.pendingOfferActionCard}>
            <View style={styles.pendingOfferActionHeader}>
              <View style={styles.pendingOfferActionIcon}>
                <Icon
                  name="check-circle"
                  size={22}
                  color={ORANGE_THEME.success}
                />
              </View>
              <View style={styles.pendingOfferActionText}>
                <Text style={styles.pendingOfferActionTitle}>
                  Accept loan offer
                </Text>
                <Text style={styles.pendingOfferActionSubtitle}>
                  Review the details and proof, then confirm with your PIN.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.acceptOfferButton}
              onPress={() => setAcceptPinModalVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.acceptOfferButtonText}>Accept with PIN</Text>
              <Icon name="lock" size={16} color={ORANGE_THEME.card} />
            </TouchableOpacity>
          </View>
        )}

        {/* Installment History Section - Only for Lenders */}
        {!fromPendingOffer && isLender && installmentHistory && (
          <View style={styles.installmentSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Icon name="calendar" size={20} color={ORANGE_THEME.text} />
                <Text style={styles.sectionTitle}>Installment History</Text>
              </View>
              {installmentHistory.installmentHistory?.length > 3 && (
                <TouchableOpacity
                  onPress={() => setShowAllInstallments(!showAllInstallments)}
                  activeOpacity={0.7}
                >
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
                    <Text
                      style={[
                        styles.planValue,
                        { color: ORANGE_THEME.success },
                      ]}
                    >
                      {installmentHistory.installmentPlan.paidInstallments}
                    </Text>
                  </View>
                  <View style={styles.planItem}>
                    <Text style={styles.planLabel}>Pending</Text>
                    <Text
                      style={[
                        styles.planValue,
                        { color: ORANGE_THEME.warning },
                      ]}
                    >
                      {installmentHistory.installmentPlan.pendingInstallments}
                    </Text>
                  </View>
                  <View style={styles.planItem}>
                    <Text style={styles.planLabel}>Overdue</Text>
                    <Text
                      style={[styles.planValue, { color: ORANGE_THEME.error }]}
                    >
                      {installmentHistory.installmentPlan.overdueInstallments}
                    </Text>
                  </View>
                </View>
                <View style={styles.planDetails}>
                  <Text style={styles.planDetailText}>
                    Installment Amount:{' '}
                    {formatCurrency(
                      installmentHistory.installmentPlan.installmentAmount,
                    )}
                  </Text>
                  <Text style={styles.planDetailText}>
                    Frequency:{' '}
                    {installmentHistory.installmentPlan.frequency
                      ?.charAt(0)
                      .toUpperCase() +
                      installmentHistory.installmentPlan.frequency?.slice(1)}
                  </Text>
                  {installmentHistory.installmentPlan.nextDueDate && (
                    <Text style={styles.planDetailText}>
                      Next Due:{' '}
                      {moment(
                        installmentHistory.installmentPlan.nextDueDate,
                      ).format('DD MMM YYYY')}
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
                    <Text
                      style={[
                        styles.summaryStatValue,
                        { color: ORANGE_THEME.success },
                      ]}
                    >
                      {formatCurrency(
                        installmentHistory.summary.totalPaidAmount,
                      )}
                    </Text>
                  </View>
                  <View style={styles.summaryStatItem}>
                    <Text style={styles.summaryStatLabel}>Pending</Text>
                    <Text
                      style={[
                        styles.summaryStatValue,
                        { color: ORANGE_THEME.warning },
                      ]}
                    >
                      {formatCurrency(
                        installmentHistory.summary.totalPendingAmount,
                      )}
                    </Text>
                  </View>
                  <View style={styles.summaryStatItem}>
                    <Text style={styles.summaryStatLabel}>Overdue</Text>
                    <Text
                      style={[
                        styles.summaryStatValue,
                        { color: ORANGE_THEME.error },
                      ]}
                    >
                      {formatCurrency(
                        installmentHistory.summary.totalOverdueAmount,
                      )}
                    </Text>
                  </View>
                </View>
                {installmentHistory.summary.onTimePaymentRate !== undefined && (
                  <View style={styles.onTimeRateContainer}>
                    <Text style={styles.onTimeRateLabel}>
                      On-Time Payment Rate
                    </Text>
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
                <ActivityIndicator size="small" color={ORANGE_THEME.primary} />
                <Text style={styles.loadingText}>Loading installments...</Text>
              </View>
            ) : installmentHistory.installmentHistory?.length > 0 ? (
              <View style={styles.installmentListContainer}>
                {(showAllInstallments
                  ? installmentHistory.installmentHistory
                  : installmentHistory.installmentHistory.slice(0, 3)
                ).map((installment, index) =>
                  renderInstallmentItem(installment, index),
                )}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No installment history available
                </Text>
              </View>
            )}

            {/* Action Message */}
            {installmentHistory.actions?.requiresAction && (
              <View style={styles.actionCard}>
                <Icon
                  name="alert-circle"
                  size={20}
                  color={ORANGE_THEME.warning}
                />
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
              <Text style={styles.summaryLabel}>
                Amount{' '}
                {loanDetails.borrowerAcceptanceStatus?.toLowerCase() ===
                'rejected'
                  ? 'Requested'
                  : 'Taken'}
              </Text>
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
                      'days',
                    )} days`
                  : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer Info */}
        {!fromPendingOffer && (
          <View style={styles.footer}>
            <View style={styles.footerItem}>
              <Icon name="clock" size={14} color={ORANGE_THEME.textLight} />
              <Text style={styles.footerText}>
                Created {moment(loanDetails.createdAt).fromNow()}
              </Text>
            </View>
            {loanDetails.updatedAt && (
              <View style={styles.footerItem}>
                <Icon name="edit" size={14} color={ORANGE_THEME.textLight} />
                <Text style={styles.footerText}>
                  Updated {moment(loanDetails.updatedAt).fromNow()}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Loan Proof Image Viewer */}
      <Modal
        visible={proofViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setProofViewerVisible(false);
          setSelectedProofUrl(null);
        }}
      >
        <View style={styles.proofViewerOverlay}>
          <View style={styles.proofViewerHeader}>
            <Text style={styles.proofViewerHeaderText}>Loan Proof</Text>
            <TouchableOpacity
              onPress={() => {
                setProofViewerVisible(false);
                setSelectedProofUrl(null);
              }}
              style={styles.proofViewerCloseButton}
            >
              <Icon name="x" size={24} color={ORANGE_THEME.card} />
            </TouchableOpacity>
          </View>
          <ScrollView
            contentContainerStyle={styles.proofViewerScrollContent}
            maximumZoomScale={3}
            minimumZoomScale={1}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          >
            {selectedProofUrl && (
              <Image
                source={{ uri: selectedProofUrl }}
                style={styles.proofViewerImage}
                resizeMode="contain"
                onError={error => {
                  console.error('Image load error:', error);
                  console.error('Failed URL:', selectedProofUrl);
                  Toast.show({
                    type: 'error',
                    position: 'top',
                    text1: 'Error Loading Image',
                    text2:
                      'Failed to load loan proof image. Please check the URL.',
                    visibilityTime: 4000,
                  });
                }}
              />
            )}
          </ScrollView>
        </View>
      </Modal>

      <PinVerificationModal
        visible={acceptPinModalVisible}
        loanId={loanDetails?._id}
        lenderName={getLenderName()}
        loanAmount={loanDetails?.amount}
        onVerifySuccess={handleAcceptWithPin}
        onForgotPin={handleForgotPin}
        onClose={() => setAcceptPinModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: m(18),
    paddingTop: m(10),
    paddingBottom: m(32),
  },

  // Profile Card
  profileCard: {
    backgroundColor: ORANGE_THEME.card,
    borderRadius: m(16),
    paddingVertical: m(18),
    paddingHorizontal: m(18),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: ORANGE_THEME.border,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(12),
  },
  profileAvatar: {
    width: m(54),
    height: m(54),
    borderRadius: m(27),
    backgroundColor: ORANGE_THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(14),
  },
  avatarText: {
    fontSize: m(22),
    fontFamily: FontFamily.primarySemiBold,
    color: ORANGE_THEME.card,
  },
  profileImage: {
    width: m(54),
    height: m(54),
    borderRadius: m(27),
    marginRight: m(14),
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: m(17),
    fontFamily: FontFamily.primaryBold,
    color: ORANGE_THEME.text,
    marginBottom: m(5),
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
    fontSize: m(11),
    color: ORANGE_THEME.textLight,
    fontFamily: FontFamily.bodyRegular,
  },

  // Status Container
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: m(8),
    borderTopWidth: 1,
    borderTopColor: ORANGE_THEME.border,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(14),
    paddingVertical: m(6),
    borderRadius: m(20),
    gap: m(5),
    marginBottom: m(4),
  },
  statusText: {
    fontSize: m(11),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.ink,
  },
  statusLabel: {
    fontSize: m(10.5),
    color: ORANGE_THEME.textLight,
    fontFamily: FontFamily.bodyRegular,
  },
  statusDivider: {
    width: 1,
    height: m(34),
    backgroundColor: ORANGE_THEME.border,
  },

  // Details Section
  detailsSection: {
    backgroundColor: ORANGE_THEME.card,
    borderRadius: m(16),
    padding: m(15),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: ORANGE_THEME.border,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    marginBottom: m(12),
  },
  titleIconTile: {
    width: m(34),
    height: m(34),
    borderRadius: m(9),
    backgroundColor: colors.navyDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: ORANGE_THEME.text,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    columnGap: m(8),
    rowGap: m(8),
  },
  detailCard: {
    width: '48%',
    minHeight: m(92),
    backgroundColor: '#F7F5EF',
    borderRadius: m(10),
    padding: m(10),
    borderWidth: 1,
    borderColor: ORANGE_THEME.border,
    elevation: 0,
  },
  detailIconContainer: {
    width: m(28),
    height: m(28),
    borderRadius: m(8),
    backgroundColor: colors.skySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(8),
  },
  detailContent: {
    minHeight: m(44),
  },
  detailLabel: {
    fontSize: m(9),
    color: ORANGE_THEME.textLight,
    marginBottom: m(3),
    textTransform: 'uppercase',
    letterSpacing: 0,
    fontFamily: FontFamily.bodySemiBold,
  },
  detailValue: {
    fontSize: m(12),
    fontFamily: FontFamily.primarySemiBold,
    color: ORANGE_THEME.text,
    lineHeight: m(16),
  },

  // Agreement Button
  agreementButton: {
    backgroundColor: ORANGE_THEME.card,
    borderRadius: m(16),
    padding: m(20),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: ORANGE_THEME.border,
    elevation: 2,
    shadowColor: colors.black,
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
    fontFamily: FontFamily.primarySemiBold,
    color: ORANGE_THEME.text,
    marginBottom: m(2),
  },
  agreementSubtitle: {
    fontSize: m(14),
    color: ORANGE_THEME.textLight,
    fontFamily: FontFamily.bodyRegular,
  },
  pendingOfferActionCard: {
    backgroundColor: ORANGE_THEME.primaryLight,
    borderRadius: m(14),
    padding: m(16),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: ORANGE_THEME.success + '40',
  },
  pendingOfferActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(14),
  },
  pendingOfferActionIcon: {
    width: m(42),
    height: m(42),
    borderRadius: m(21),
    backgroundColor: ORANGE_THEME.success + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(12),
  },
  pendingOfferActionText: {
    flex: 1,
  },
  pendingOfferActionTitle: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: ORANGE_THEME.success,
    marginBottom: m(3),
  },
  pendingOfferActionSubtitle: {
    fontSize: m(13),
    lineHeight: m(18),
    color: ORANGE_THEME.success,
    fontFamily: FontFamily.bodyRegular,
  },
  acceptOfferButton: {
    height: m(46),
    borderRadius: m(10),
    backgroundColor: ORANGE_THEME.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
  },
  acceptOfferButtonText: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: ORANGE_THEME.card,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: ORANGE_THEME.card,
    borderRadius: m(16),
    padding: m(16),
    paddingVertical: m(14),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: ORANGE_THEME.border,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  summaryTitle: {
    fontSize: m(17),
    fontFamily: FontFamily.primarySemiBold,
    color: ORANGE_THEME.text,
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
    color: ORANGE_THEME.textLight,
    marginBottom: m(4),
    fontFamily: FontFamily.bodyRegular,
  },
  summaryValue: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: ORANGE_THEME.text,
  },
  summaryDivider: {
    width: 1,
    height: m(50),
    backgroundColor: ORANGE_THEME.border,
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
    color: ORANGE_THEME.textLight,
    fontFamily: FontFamily.bodyRegular,
  },

  // Payment Summary Card
  paymentSummaryCard: {
    backgroundColor: ORANGE_THEME.card,
    borderRadius: m(16),
    padding: m(15),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: ORANGE_THEME.border,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  paymentSummaryTitle: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: ORANGE_THEME.text,
  },
  paymentSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: m(10),
    gap: m(8),
  },
  paymentSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  paymentSummaryLabel: {
    fontSize: m(10),
    color: ORANGE_THEME.textLight,
    marginBottom: m(3),
    fontFamily: FontFamily.bodyRegular,
  },
  paymentSummaryValue: {
    fontSize: m(15),
    fontFamily: FontFamily.primaryBold,
    color: ORANGE_THEME.text,
  },
  paidAmount: {
    color: ORANGE_THEME.success,
  },
  remainingAmount: {
    color: ORANGE_THEME.error,
  },
  closedAmount: {
    color: ORANGE_THEME.success,
  },
  progressContainer: {
    marginBottom: m(10),
  },
  progressBar: {
    height: m(6),
    backgroundColor: '#E7E2D8',
    borderRadius: m(4),
    overflow: 'hidden',
    marginBottom: m(5),
  },
  progressFill: {
    height: '100%',
    borderRadius: m(4),
    backgroundColor: ORANGE_THEME.primary,
  },
  progressText: {
    fontSize: m(11),
    color: ORANGE_THEME.textLight,
    textAlign: 'center',
    fontFamily: FontFamily.bodyMedium,
  },
  closedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ORANGE_THEME.primaryLight,
    borderRadius: m(8),
    padding: m(9),
    gap: m(6),
    marginTop: m(6),
  },
  closedBadgeText: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primarySemiBold,
    color: ORANGE_THEME.success,
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ORANGE_THEME.error + '12',
    borderRadius: m(8),
    padding: m(9),
    gap: m(6),
    marginTop: m(6),
    borderWidth: 1,
    borderColor: ORANGE_THEME.error + '40',
  },
  overdueBadgeText: {
    fontSize: m(12.5),
    fontFamily: FontFamily.primarySemiBold,
    color: ORANGE_THEME.error,
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
    color: ORANGE_THEME.primary,
    fontFamily: FontFamily.primarySemiBold,
  },
  installmentPlanCard: {
    backgroundColor: ORANGE_THEME.card,
    borderRadius: m(16),
    padding: m(16),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: ORANGE_THEME.border,
    elevation: 2,
    shadowColor: colors.black,
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
    color: ORANGE_THEME.textLight,
    marginBottom: m(4),
    textAlign: 'center',
    fontFamily: FontFamily.bodyRegular,
  },
  planValue: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: ORANGE_THEME.text,
  },
  planDetails: {
    paddingTop: m(12),
    borderTopWidth: 1,
    borderTopColor: ORANGE_THEME.border,
    gap: m(6),
  },
  planDetailText: {
    fontSize: m(13),
    color: ORANGE_THEME.textLight,
    fontFamily: FontFamily.bodyRegular,
  },
  summaryStatsCard: {
    backgroundColor: '#F7F5EF',
    borderRadius: m(12),
    padding: m(16),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: ORANGE_THEME.border,
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
    color: ORANGE_THEME.textLight,
    marginBottom: m(4),
    fontFamily: FontFamily.bodyRegular,
  },
  summaryStatValue: {
    fontSize: m(14),
    fontFamily: FontFamily.primaryBold,
    color: ORANGE_THEME.text,
  },
  onTimeRateContainer: {
    paddingTop: m(12),
    borderTopWidth: 1,
    borderTopColor: ORANGE_THEME.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  onTimeRateLabel: {
    fontSize: m(13),
    color: ORANGE_THEME.textLight,
    fontFamily: FontFamily.bodySemiBold,
  },
  onTimeRateValue: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: ORANGE_THEME.success,
  },
  installmentListContainer: {
    backgroundColor: ORANGE_THEME.card,
    borderRadius: m(16),
    borderWidth: 1,
    borderColor: ORANGE_THEME.border,
    overflow: 'hidden',
    marginBottom: m(12),
  },
  installmentCard: {
    padding: m(16),
    borderBottomWidth: 1,
    borderBottomColor: ORANGE_THEME.border,
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
    fontFamily: FontFamily.primarySemiBold,
    color: ORANGE_THEME.text,
    marginBottom: m(2),
  },
  installmentStatus: {
    fontSize: m(12),
    fontFamily: FontFamily.bodyMedium,
  },
  installmentAmount: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: ORANGE_THEME.text,
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
    color: ORANGE_THEME.textLight,
    fontFamily: FontFamily.bodyMedium,
  },
  installmentDetailValue: {
    fontSize: m(12),
    color: ORANGE_THEME.text,
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ORANGE_THEME.warning + '12',
    padding: m(8),
    borderRadius: m(6),
    gap: m(6),
    marginTop: m(4),
  },
  pendingBadgeText: {
    fontSize: m(12),
    color: ORANGE_THEME.warning,
    fontFamily: FontFamily.bodyMedium,
  },
  installmentOverdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ORANGE_THEME.error + '12',
    padding: m(8),
    borderRadius: m(6),
    gap: m(6),
    marginTop: m(4),
  },
  installmentOverdueBadgeText: {
    fontSize: m(12),
    color: ORANGE_THEME.error,
    fontFamily: FontFamily.bodyMedium,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ORANGE_THEME.warning + '12',
    borderRadius: m(12),
    padding: m(16),
    gap: m(12),
    borderWidth: 1,
    borderColor: ORANGE_THEME.warning + '40',
  },
  actionText: {
    flex: 1,
    fontSize: m(14),
    color: ORANGE_THEME.warning,
    fontFamily: FontFamily.bodyMedium,
  },
  loadingContainer: {
    padding: m(20),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ORANGE_THEME.card,
    borderRadius: m(16),
    marginBottom: m(12),
  },
  loadingText: {
    marginTop: m(8),
    fontSize: m(12),
    color: ORANGE_THEME.textLight,
    fontFamily: FontFamily.bodyRegular,
  },
  emptyContainer: {
    padding: m(20),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ORANGE_THEME.card,
    borderRadius: m(16),
    marginBottom: m(12),
  },
  emptyText: {
    fontSize: m(14),
    color: ORANGE_THEME.textLight,
    fontFamily: FontFamily.bodyRegular,
  },

  // Loan Proof Styles
  proofSection: {
    marginBottom: m(16),
  },
  proofCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ORANGE_THEME.card,
    borderRadius: m(16),
    padding: m(16),
    borderWidth: 1,
    borderColor: ORANGE_THEME.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  noProofCard: {
    backgroundColor: '#F7F5EF',
    borderColor: ORANGE_THEME.border,
  },
  proofIconContainer: {
    width: m(48),
    height: m(48),
    borderRadius: m(12),
    backgroundColor: ORANGE_THEME.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(12),
  },
  noProofIconContainer: {
    backgroundColor: ORANGE_THEME.border,
  },
  proofTextContainer: {
    flex: 1,
  },
  proofTitle: {
    fontSize: m(16),
    fontFamily: FontFamily.primarySemiBold,
    color: ORANGE_THEME.text,
    marginBottom: m(4),
  },
  proofSubtext: {
    fontSize: m(14),
    color: ORANGE_THEME.textLight,
    fontFamily: FontFamily.bodyRegular,
  },

  // Proof Viewer Modal Styles
  proofViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  proofViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: m(16),
    paddingTop: m(40),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  proofViewerHeaderText: {
    fontSize: m(18),
    fontFamily: FontFamily.primarySemiBold,
    color: ORANGE_THEME.card,
  },
  proofViewerCloseButton: {
    padding: m(8),
  },
  proofViewerScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: m(20),
  },
  proofViewerImage: {
    width: '100%',
    height: m(500),
    borderRadius: m(8),
  },

  // Rejection Message Styles
  rejectionMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ORANGE_THEME.error + '12',
    borderRadius: m(16),
    padding: m(20),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: ORANGE_THEME.error + '40',
    gap: m(12),
  },
  rejectionTextContainer: {
    flex: 1,
  },
  rejectionTitle: {
    fontSize: m(18),
    fontFamily: FontFamily.primaryBold,
    color: ORANGE_THEME.error,
    marginBottom: m(4),
  },
  rejectionSubtitle: {
    fontSize: m(14),
    color: ORANGE_THEME.error,
    lineHeight: m(20),
    fontFamily: FontFamily.bodyRegular,
  },
});
