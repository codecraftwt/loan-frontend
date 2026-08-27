import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import BorrowerReputationCard from '../../../Components/BorrowerReputationCard';
import { FontFamily } from '../../../constants';

const ORANGE_THEME = {
  primary: '#111827',
  primaryLight: '#F1FAF7',
  primaryDark: '#0F172A',
  secondary: '#B7EDF4',
  accent: '#D7F2C1',
  background: '#F2FAF6',
  card: '#FFFFFF',
  text: '#111827',
  textLight: '#6B7280',
  border: '#DCEFEA',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#1B6E8C',
  sky: '#B7EDF4',
  mint: '#D7F2C1',
  ink: '#111827',
};

const LoanCard = ({ loan, onPress, index = 0 }) => {
  const [scaleAnim] = useState(new Animated.Value(1));

  const loanAmount = typeof loan.amount === 'number' ? loan.amount : parseFloat(loan.amount) || 0;
  const totalPaid = typeof loan.totalPaid === 'number' ? loan.totalPaid : parseFloat(loan.totalPaid) || 0;
  const remainingAmount = typeof loan.remainingAmount === 'number' ? loan.remainingAmount : parseFloat(loan.remainingAmount) || loanAmount;
  const isLoanClosed = remainingAmount <= 0 && totalPaid > 0;
  const isOverdue = loan.loanEndDate &&
    moment(loan.loanEndDate).isBefore(moment(), 'day') &&
    remainingAmount > 0 &&
    !isLoanClosed;

  const effectiveStatus = isOverdue
    ? 'overdue'
    : isLoanClosed
      ? 'closed'
      : loan?.paymentStatus || loan?.status || 'pending';

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return ORANGE_THEME.success;
      case 'part paid':
        return ORANGE_THEME.warning;
      case 'pending':
        return ORANGE_THEME.accent;
      case 'overdue':
        return ORANGE_THEME.error;
      case 'closed':
        return ORANGE_THEME.info;
      default:
        return ORANGE_THEME.textLight;
    }
  };

  const getStatusIcon = status => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'check-circle';
      case 'part paid':
        return 'schedule';
      case 'pending':
        return 'hourglass-empty';
      case 'overdue':
        return 'error';
      case 'closed':
        return 'lock';
      default:
        return 'help';
    }
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const formatCurrency = (amount) => {
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    return `₹${numAmount.toLocaleString('en-IN')}`;
  };

  const paymentPercent = loanAmount > 0 ? (totalPaid / loanAmount) * 100 : 0;
  const statusColor = getStatusColor(effectiveStatus);
  const cardTint = index % 2 === 0 ? ORANGE_THEME.sky : ORANGE_THEME.mint;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.loanCard,
          { borderLeftColor: isOverdue ? ORANGE_THEME.error : cardTint },
          isOverdue && styles.overdueCard,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        {/* Overdue Banner */}
        {isOverdue && (
          <View style={styles.overdueBanner}>
            <Icon name="error" size={13} color={ORANGE_THEME.error} />
            <Text style={styles.overdueBannerText}>OVERDUE</Text>
            <Text style={styles.overdueDays}>
              {moment(loan.loanEndDate).fromNow()}
            </Text>
          </View>
        )}

        <View style={styles.loanCardHeader}>
          <View style={styles.loanInfo}>
            <Text style={styles.loanAmount}>{formatCurrency(loanAmount)}</Text>
            <View style={styles.loanSubRow}>
              <Text style={styles.loanPurpose} numberOfLines={1}>
                {loan.purpose || 'Loan Amount'}
              </Text>
              {loan.loanMode && (
                <View
                  style={[
                    styles.loanModeBadge,
                    { backgroundColor: loan.loanMode === 'cash' ? ORANGE_THEME.success : ORANGE_THEME.info },
                  ]}
                >
                  <Icon
                    name={loan.loanMode === 'cash' ? 'cash' : 'credit-card'}
                    size={11}
                    color="#FFFFFF"
                  />
                  <Text style={styles.loanModeText}>{loan.loanMode.toUpperCase()}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <Icon name={getStatusIcon(effectiveStatus)} size={12} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {isLoanClosed && !isOverdue
                ? 'Closed'
                : effectiveStatus?.charAt(0).toUpperCase() + effectiveStatus?.slice(1) || 'Unknown'}
            </Text>
          </View>
        </View>

        <View style={styles.progressRow}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${paymentPercent}%`,
                  backgroundColor: statusColor,
                },
              ]}
            />
          </View>
          <Text style={styles.progressPercentText}>{paymentPercent.toFixed(0)}%</Text>
        </View>
        <View style={styles.progressLabels}>
          <Text style={[styles.progressLabel, { color: ORANGE_THEME.success }]}>
            Paid {formatCurrency(totalPaid)}
          </Text>
          <Text
            style={[
              styles.progressLabel,
              { color: isOverdue ? ORANGE_THEME.error : ORANGE_THEME.warning },
            ]}
          >
            {isLoanClosed ? 'Settled' : `Due ${formatCurrency(remainingAmount)}`}
          </Text>
        </View>

        <View style={styles.loanDetails}>
          <View style={styles.detailItem}>
            <Icon
              name="event"
              size={12}
              color={isOverdue ? ORANGE_THEME.error : ORANGE_THEME.textLight}
            />
            <Text
              style={[
                styles.detailValue,
                { color: isOverdue ? ORANGE_THEME.error : ORANGE_THEME.text },
              ]}
              numberOfLines={1}
            >
              Due {moment(loan.loanEndDate).format('DD MMM YYYY')}
            </Text>
          </View>
        </View>

        <View style={styles.loanFooter}>
          <View style={styles.dateContainer}>
            <Icon name="event" size={11} color={ORANGE_THEME.textLight} />
            <Text style={styles.loanDate}>
              {loan.loanStartDate ? moment(loan.loanStartDate).format('DD MMM YYYY') : 'Not started'}
            </Text>
          </View>
          <View style={styles.viewButton}>
            <Icon name="chevron-right" size={18} color={ORANGE_THEME.textLight} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function BorrowerLoansScreen({ route, navigation }) {
  const { borrower, loans } = route.params || {};
  const [refreshing, setRefreshing] = useState(false);
  const [showReputation, setShowReputation] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (!borrower || !loans || loans.length === 0) {
    return (
      <View style={styles.container}>
        <Header
          title="Borrower Loans"
          showBackButton
          headerStyle={{ backgroundColor: ORANGE_THEME.primary, height: m(72) }}
        />
        <View style={styles.errorContainer}>
          <View style={styles.emptyIconContainer}>
            <Icon name="error-outline" size={60} color={ORANGE_THEME.border} />
          </View>
          <Text style={styles.errorText}>No loans found</Text>
        </View>
      </View>
    );
  }

  const totalLoanAmount = loans.reduce((sum, loan) => {
    const amount = typeof loan.amount === 'number' ? loan.amount : parseFloat(loan.amount) || 0;
    return sum + amount;
  }, 0);

  const totalPaid = loans.reduce((sum, loan) => {
    const paid = typeof loan.totalPaid === 'number' ? loan.totalPaid : parseFloat(loan.totalPaid) || 0;
    return sum + paid;
  }, 0);

  const totalRemaining = loans.reduce((sum, loan) => {
    const remaining = typeof loan.remainingAmount === 'number' ? loan.remainingAmount : parseFloat(loan.remainingAmount) || 0;
    return sum + remaining;
  }, 0);

  const overdueCount = loans.filter(loan => {
    const remaining = typeof loan.remainingAmount === 'number' ? loan.remainingAmount : parseFloat(loan.remainingAmount) || 0;
    return loan.loanEndDate &&
      moment(loan.loanEndDate).isBefore(moment(), 'day') &&
      remaining > 0;
  }).length;

  const aadhaarNumber = borrower.aadhaarNumber || borrower.aadharCardNo;

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <View style={styles.container}>
      <Header
        title="Borrower Loans"
        showBackButton
        headerStyle={{ backgroundColor: ORANGE_THEME.primary, height: m(72) }}
      />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[ORANGE_THEME.primary]}
            tintColor={ORANGE_THEME.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Borrower Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            {borrower.profileImage ? (
              <Image source={{ uri: borrower.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileAvatar}>
                <Text style={styles.avatarText}>
                  {(borrower.name || 'U')?.charAt(0)?.toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{borrower.name || 'Unknown Borrower'}</Text>
              <View style={styles.profileMeta}>
                <View style={styles.metaItem}>
                  <Icon name="phone" size={14} color={ORANGE_THEME.textLight} />
                  <Text style={styles.metaText}>{borrower.mobileNumber || borrower.mobileNo || 'N/A'}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Icon name="badge" size={14} color={ORANGE_THEME.textLight} />
                  <Text style={styles.metaText}>{borrower.aadhaarNumber || borrower.aadharCardNo || 'N/A'}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Reputation Score Card */}
        {aadhaarNumber && String(aadhaarNumber).length === 12 && (
          <View style={styles.reputationContainer}>
            <TouchableOpacity
              style={styles.reputationToggle}
              onPress={() => setShowReputation(!showReputation)}
              activeOpacity={0.8}
            >
              <View style={styles.reputationHeader}>
                <View style={styles.reputationTitleContainer}>
                  <View style={styles.reputationIconContainer}>
                    <Icon name="verified" size={24} color={ORANGE_THEME.primary} />
                  </View>
                  <View>
                    <Text style={styles.reputationTitle}>Credit Reputation</Text>
                    <Text style={styles.reputationSubtitle}>
                      View reliability score & insights
                    </Text>
                  </View>
                </View>
                <Icon
                  name={showReputation ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                  size={28}
                  color={ORANGE_THEME.primary}
                />
              </View>
            </TouchableOpacity>
            {showReputation && (
              <View style={styles.reputationCardWrapper}>
                <BorrowerReputationCard aadhaarNumber={aadhaarNumber} compact={false} />
              </View>
            )}
          </View>
        )}

        {/* Summary Section */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryTitleContainer}>
              <Icon name="analytics" size={24} color={ORANGE_THEME.primary} />
              <Text style={styles.summaryTitle}>Loan Overview</Text>
            </View>
          </View>

          <View style={styles.amountSummary}>
            <View style={styles.amountSummaryCard}>
              <View style={styles.amountHeader}>
                <Icon name="account-balance" size={18} color={ORANGE_THEME.info} />
                <Text style={styles.amountLabel}>Total Given</Text>
              </View>
              <Text style={[styles.amountValue, { color: ORANGE_THEME.info }]}>{formatCurrency(totalLoanAmount)}</Text>
            </View>

            <View style={styles.amountSummaryCard}>
              <View style={styles.amountHeader}>
                <Icon name="payments" size={18} color={ORANGE_THEME.success} />
                <Text style={styles.amountLabel}>Total Paid</Text>
              </View>
              <Text style={[styles.amountValue, { color: ORANGE_THEME.success }]}>{formatCurrency(totalPaid)}</Text>
            </View>

            <View style={styles.amountSummaryCard}>
              <View style={styles.amountHeader}>
                <Icon name="pending-actions" size={18} color={ORANGE_THEME.error} />
                <Text style={styles.amountLabel}>Remaining</Text>
              </View>
              <Text style={[styles.amountValue, { color: ORANGE_THEME.error }]}>{formatCurrency(totalRemaining)}</Text>
            </View>

            {overdueCount > 0 && (
              <View style={styles.overdueSummaryCard}>
                <Icon name="error" size={16} color="#FFFFFF" />
                <Text style={styles.overdueSummaryText}>
                  {overdueCount} {overdueCount === 1 ? 'loan' : 'loans'} overdue
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Loans List Header */}
        <View style={styles.loansHeader}>
          <Text style={styles.loansTitle}>All Loans</Text>
          <Text style={styles.loansCount}>{loans.length}</Text>
        </View>

        {/* Loans List */}
        {loans.map((loan, index) => (
          <LoanCard
            key={loan._id || index}
            loan={loan}
            index={index}
            onPress={() => navigation.navigate('PersonalLoan', {
              loanDetails: loan,
              isEdit: false,
            })}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ORANGE_THEME.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: m(40),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: m(40),
  },
  errorText: {
    fontSize: m(16),
    color: ORANGE_THEME.error,
    fontFamily: FontFamily.primarySemiBold,
    marginTop: m(16),
  },
  emptyIconContainer: {
    width: m(100),
    height: m(100),
    borderRadius: m(50),
    backgroundColor: ORANGE_THEME.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Borrower Profile Card
  profileCard: {
    backgroundColor: ORANGE_THEME.card,
    marginHorizontal: m(16),
    marginTop: m(16),
    marginBottom: m(16),
    padding: m(20),
    borderRadius: m(18),
    borderWidth: 1,
    borderColor: ORANGE_THEME.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: m(60),
    height: m(60),
    borderRadius: m(30),
    backgroundColor: ORANGE_THEME.ink,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(16),
  },
  avatarText: {
    fontSize: m(24),
    fontFamily: FontFamily.primaryBold,
    color: '#FFFFFF',
  },
  profileImage: {
    width: m(60),
    height: m(60),
    borderRadius: m(30),
    marginRight: m(16),
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: m(18.5),
    fontFamily: FontFamily.primaryBold,
    color: ORANGE_THEME.text,
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
    color: ORANGE_THEME.textLight,
    fontFamily: FontFamily.primaryRegular,
  },
  // Reputation Section
  reputationContainer: {
    backgroundColor: ORANGE_THEME.card,
    marginHorizontal: m(16),
    marginBottom: m(16),
    borderRadius: m(18),
    borderWidth: 1,
    borderColor: ORANGE_THEME.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  reputationToggle: {
    padding: m(20),
  },
  reputationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reputationTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(12),
  },
  reputationIconContainer: {
    width: m(48),
    height: m(48),
    borderRadius: m(14),
    backgroundColor: ORANGE_THEME.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reputationTitle: {
    fontSize: m(17),
    fontFamily: FontFamily.primaryBold,
    color: ORANGE_THEME.text,
    marginBottom: m(2),
  },
  reputationSubtitle: {
    fontSize: m(12),
    color: ORANGE_THEME.textLight,
    fontFamily: FontFamily.primaryRegular,
  },
  reputationCardWrapper: {
    paddingHorizontal: m(16),
    paddingBottom: m(16),
  },
  // Summary Section
  summaryContainer: {
    backgroundColor: ORANGE_THEME.card,
    marginHorizontal: m(16),
    marginBottom: m(16),
    padding: m(20),
    borderRadius: m(18),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: ORANGE_THEME.border,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(10),
  },
  summaryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(10),
  },
  summaryTitle: {
    fontSize: m(19),
    fontFamily: FontFamily.primaryBold,
    color: ORANGE_THEME.text,
  },
  amountSummary: {
    backgroundColor: ORANGE_THEME.primaryLight,
    borderRadius: m(16),
    padding: m(16),
  },
  amountSummaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(12),
  },
  amountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
  },
  amountLabel: {
    fontSize: m(14),
    color: ORANGE_THEME.textLight,
    fontFamily: FontFamily.primaryMedium,
  },
  amountValue: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
  },
  overdueSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m(8),
    backgroundColor: ORANGE_THEME.error,
    borderRadius: m(10),
    paddingVertical: m(10),
    marginTop: m(4),
  },
  overdueSummaryText: {
    color: '#FFFFFF',
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
  },
  // Loans Header
  loansHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: m(16),
    marginTop: m(8),
    marginBottom: m(6),
  },
  loansTitle: {
    fontSize: m(20),
    fontFamily: FontFamily.primaryBold,
    color: ORANGE_THEME.text,
  },
  loansCount: {
    fontSize: m(14),
    color: '#FFFFFF',
    fontFamily: FontFamily.primarySemiBold,
    backgroundColor: ORANGE_THEME.ink,
    paddingHorizontal: m(12),
    paddingVertical: m(4),
    borderRadius: m(12),
  },
  // Loan Card
  loanCard: {
    backgroundColor: ORANGE_THEME.card,
    borderRadius: m(16),
    padding: m(10),
    paddingLeft: m(12),
    marginHorizontal: m(14),
    marginBottom: m(10),
    borderWidth: 1,
    borderLeftWidth: m(4),
    borderColor: ORANGE_THEME.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  overdueCard: {
    borderWidth: 1.5,
    borderColor: ORANGE_THEME.error + '80',
  },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ORANGE_THEME.error + '12',
    paddingVertical: m(4),
    paddingHorizontal: m(10),
    marginLeft: m(-15),
    marginRight: m(-12),
    marginTop: m(-12),
    marginBottom: m(8),
    gap: m(5),
    borderBottomWidth: 1,
    borderBottomColor: ORANGE_THEME.error + '20',
  },
  overdueBannerText: {
    color: ORANGE_THEME.error,
    fontSize: m(10.5),
    fontFamily: FontFamily.primaryBold,
    letterSpacing: 0.5,
  },
  overdueDays: {
    color: ORANGE_THEME.error,
    fontSize: m(10),
    fontFamily: FontFamily.primarySemiBold,
    marginLeft: 'auto',
  },
  loanCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: m(6),
  },
  loanInfo: {
    flex: 1,
    marginRight: m(8),
  },
  loanAmount: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: ORANGE_THEME.text,
    marginBottom: m(1),
    letterSpacing: -0.3,
  },
  loanSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
  },
  loanPurpose: {
    fontSize: m(11),
    color: ORANGE_THEME.textLight,
    fontFamily: FontFamily.primaryMedium,
    flexShrink: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(7),
    paddingVertical: m(3),
    borderRadius: m(16),
    gap: m(3),
  },
  statusText: {
    fontSize: m(9.5),
    fontFamily: FontFamily.primaryBold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  loanModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(6),
    paddingVertical: m(2),
    borderRadius: m(12),
    gap: m(3),
  },
  loanModeText: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryBold,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  progressBar: {
    flex: 1,
    height: m(3),
    backgroundColor: 'rgba(255, 255, 255, 0.62)',
    borderRadius: m(2),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: m(2),
  },
  progressPercentText: {
    fontSize: m(10),
    fontFamily: FontFamily.primaryBold,
    color: ORANGE_THEME.text,
    width: m(28),
    textAlign: 'right',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: m(2),
  },
  progressLabel: {
    fontSize: m(10),
    fontFamily: FontFamily.primarySemiBold,
  },
  loanDetails: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: m(8),
    paddingVertical: m(5),
    paddingHorizontal: m(8),
    gap: m(12),
    marginTop: m(6),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(5),
    flexShrink: 1,
  },
  detailValue: {
    fontSize: m(11),
    fontFamily: FontFamily.primarySemiBold,
    color: ORANGE_THEME.text,
  },
  loanFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: m(6),
    paddingTop: m(6),
    borderTopWidth: 1,
    borderTopColor: 'rgba(17, 24, 39, 0.12)',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
  },
  loanDate: {
    fontSize: m(10),
    color: ORANGE_THEME.textLight,
    fontFamily: FontFamily.primaryMedium,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: m(18),
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    gap: m(3),
    justifyContent: 'center',
  },
});
