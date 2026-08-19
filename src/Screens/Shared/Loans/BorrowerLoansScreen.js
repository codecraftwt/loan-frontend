import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import BorrowerReputationCard from '../../../Components/BorrowerReputationCard';

const LoanCard = ({ loan, onPress }) => {
  const loanAmount = typeof loan.amount === 'number' ? loan.amount : parseFloat(loan.amount) || 0;
  const totalPaid = typeof loan.totalPaid === 'number' ? loan.totalPaid : parseFloat(loan.totalPaid) || 0;
  const remainingAmount = typeof loan.remainingAmount === 'number' ? loan.remainingAmount : parseFloat(loan.remainingAmount) || loanAmount;
  const isLoanClosed = remainingAmount <= 0 && totalPaid > 0;
  const isOverdue = loan.loanEndDate &&
    moment(loan.loanEndDate).isBefore(moment(), 'day') &&
    remainingAmount > 0 &&
    !isLoanClosed;

  const getStatusColor = () => {
    if (isOverdue) return '#EF4444';
    if (isLoanClosed) return '#10B981';
    const status = loan?.paymentStatus?.toLowerCase() || loan?.status?.toLowerCase();
    switch (status) {
      case 'paid': return '#10B981';
      case 'part paid': return '#F59E0B';
      case 'pending': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = () => {
    if (isOverdue) return 'error';
    if (isLoanClosed) return 'check-circle';
    const status = loan?.paymentStatus?.toLowerCase() || loan?.status?.toLowerCase();
    switch (status) {
      case 'paid': return 'check-circle';
      case 'part paid': return 'schedule';
      default: return 'pending';
    }
  };

  const getStatusText = () => {
    if (isOverdue) return 'Overdue';
    if (isLoanClosed) return 'Closed';
    return (loan?.paymentStatus || loan?.status || 'Pending')?.charAt(0).toUpperCase() + (loan?.paymentStatus || loan?.status || 'Pending')?.slice(1);
  };

  const formatCurrency = (amount) => {
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    return `₹${numAmount.toLocaleString('en-IN')}`;
  };

  const paymentPercent = loanAmount > 0 ? (totalPaid / loanAmount) * 100 : 0;

  return (
    <TouchableOpacity
      style={[
        styles.loanCard,
        isOverdue && styles.overdueCard
      ]}
      onPress={onPress}
      activeOpacity={0.85}>
      <View style={[styles.statusAccent, { backgroundColor: getStatusColor() }]} />

      {isOverdue && (
        <View style={styles.overdueBanner}>
          <Icon name="error" size={14} color="#FFFFFF" />
          <Text style={styles.overdueBannerText}>OVERDUE</Text>
        </View>
      )}

      <View style={styles.loanCardHeader}>
        <View style={styles.loanInfo}>
          <Text style={styles.loanAmount}>{formatCurrency(loanAmount)}</Text>
          <View style={styles.loanSubRow}>
            <Text style={styles.loanPurpose} numberOfLines={1}>{loan.purpose || 'Loan'}</Text>
            {loan.loanMode && (
              <View style={[styles.loanModeBadge, { backgroundColor: loan.loanMode === 'cash' ? '#10B981' : '#3B82F6' }]}>
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
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor() + '18', borderColor: getStatusColor() + '40', borderWidth: 1 }
        ]}>
          <Icon name={getStatusIcon()} size={14} color={getStatusColor()} />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
      </View>

      <View style={styles.loanDetails}>
        <View style={styles.detailItem}>
          <View style={[styles.iconContainer, { backgroundColor: '#ECFDF5' }]}>
            <Icon name="check-circle" size={14} color="#10B981" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Paid</Text>
            <Text style={[styles.detailValue, { color: '#10B981' }]} numberOfLines={1}>
              {formatCurrency(totalPaid)}
            </Text>
          </View>
        </View>
        <View style={styles.detailDivider} />
        <View style={styles.detailItem}>
          <View style={[styles.iconContainer, { backgroundColor: isOverdue ? '#FEE2E2' : '#FFF7ED' }]}>
            <Icon name="schedule" size={14} color={isOverdue ? '#EF4444' : '#F59E0B'} />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Remaining</Text>
            <Text style={[styles.detailValue, { color: isOverdue ? '#EF4444' : '#F59E0B' }]} numberOfLines={1}>
              {isLoanClosed ? '₹0' : formatCurrency(remainingAmount)}
            </Text>
          </View>
        </View>
        <View style={styles.detailDivider} />
        <View style={styles.detailItem}>
          <View style={[styles.iconContainer, { backgroundColor: '#EFF6FF' }]}>
            <Icon name="event" size={14} color={isOverdue ? '#EF4444' : '#3B82F6'} />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Due</Text>
            <Text style={[styles.detailValue, { color: isOverdue ? '#EF4444' : '#374151' }]} numberOfLines={1}>
              {moment(loan.loanEndDate).format('DD MMM')}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <Icon name="access-time" size={14} color="#9CA3AF" />
          <Text style={styles.footerText}>
            {loan.loanStartDate ? `Started ${moment(loan.loanStartDate).fromNow()}` : 'Not started'}
          </Text>
        </View>
        <View style={styles.footerIconButton}>
          <Icon name="chevron-right" size={18} color="#6B7280" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function BorrowerLoansScreen({ route, navigation }) {
  const { borrower, loans } = route.params || {};
  const [refreshing, setRefreshing] = useState(false);
  const [showReputation, setShowReputation] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh logic can be added here
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (!borrower || !loans || loans.length === 0) {
    return (
      <View style={styles.container}>
        <Header title="Borrower Loans" showBackButton />
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={64} color="#9CA3AF" />
          <Text style={styles.errorText}>No loans found</Text>
        </View>
      </View>
    );
  }

  // Calculate totals
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

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <View style={styles.container}>
      <Header title="Borrower Loans" showBackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>

        {/* Borrower Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            {borrower.profileImage ? (
              <Image
                source={{ uri: borrower.profileImage }}
                style={styles.profileImage}
              />
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
                  <Icon name="phone" size={14} color="#6B7280" />
                  <Text style={styles.metaText}>{borrower.mobileNumber || borrower.mobileNo || 'N/A'}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Icon name="badge" size={14} color="#6B7280" />
                  <Text style={styles.metaText}>{borrower.aadhaarNumber || borrower.aadharCardNo || 'N/A'}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Reputation Score Card */}
        {(borrower.aadhaarNumber || borrower.aadharCardNo) &&
         (borrower.aadhaarNumber || borrower.aadharCardNo).length === 12 && (
          <View style={styles.reputationContainer}>
            <TouchableOpacity
              style={styles.reputationToggle}
              onPress={() => setShowReputation(!showReputation)}
              activeOpacity={0.8}>
              <View style={styles.reputationToggleLeft}>
                <View style={styles.reputationIconWrap}>
                  <Icon name="verified" size={16} color="#3B82F6" />
                </View>
                <View>
                  <Text style={styles.reputationToggleTitle}>Reputation Score</Text>
                  <Text style={styles.reputationToggleSubtitle}>
                    Tap to {showReputation ? 'hide' : 'view'} details
                  </Text>
                </View>
              </View>
              <Icon
                name={showReputation ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={22}
                color="#6B7280"
              />
            </TouchableOpacity>
            {showReputation && (
              <View style={styles.reputationCardWrapper}>
                <BorrowerReputationCard
                  aadhaarNumber={borrower.aadhaarNumber || borrower.aadharCardNo}
                  compact={false}
                />
              </View>
            )}
          </View>
        )}

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Loan Summary</Text>
          {/* <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{loans.length}</Text>
              <Text style={styles.summaryLabel}>Total Loans</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: '#EF4444' }]}>{overdueCount}</Text>
              <Text style={styles.summaryLabel}>Overdue</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: '#10B981' }]}>
                {loans.filter(loan => {
                  const remaining = typeof loan.remainingAmount === 'number' ? loan.remainingAmount : parseFloat(loan.remainingAmount) || 0;
                  return remaining <= 0;
                }).length}
              </Text>
              <Text style={styles.summaryLabel}>Closed</Text>
            </View>
          </View> */}
          <View style={styles.amountSummary}>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Total Given:</Text>
              <Text style={[styles.amountValue, { color: '#3B82F6' }]}>
                {formatCurrency(totalLoanAmount)}
              </Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Total Paid:</Text>
              <Text style={[styles.amountValue, { color: '#10B981' }]}>
                {formatCurrency(totalPaid)}
              </Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Remaining:</Text>
              <Text style={[styles.amountValue, { color: '#EF4444' }]}>
                {formatCurrency(totalRemaining)}
              </Text>
            </View>
          </View>
        </View>

        {/* Loans List */}
        <View style={styles.loansSection}>
          <Text style={styles.sectionTitle}>All Loans ({loans.length})</Text>
          {loans.map((loan, index) => (
            <LoanCard
              key={loan._id || index}
              loan={loan}
              onPress={() => navigation.navigate('PersonalLoan', {
                loanDetails: loan,
                isEdit: false,
              })}
            />
          ))}
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
    paddingBottom: m(100),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: m(16),
  },
  errorText: {
    fontSize: m(16),
    color: '#6B7280',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(20),
    padding: m(20),
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
    fontSize: m(24),
    fontWeight: '700',
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
    fontSize: m(20),
    fontWeight: '700',
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
  },
  reputationContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  reputationToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: m(14),
  },
  reputationToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(10),
    flex: 1,
  },
  reputationIconWrap: {
    width: m(34),
    height: m(34),
    borderRadius: m(10),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reputationToggleTitle: {
    fontSize: m(14.5),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(1),
  },
  reputationToggleSubtitle: {
    fontSize: m(11.5),
    color: '#9CA3AF',
    fontWeight: '500',
  },
  reputationCardWrapper: {
    paddingHorizontal: m(12),
    paddingBottom: m(12),
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(20),
    padding: m(20),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  summaryTitle: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(16),
    paddingBottom: m(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: m(16),
    paddingBottom: m(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNumber: {
    fontSize: m(24),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(4),
  },
  summaryLabel: {
    fontSize: m(12),
    color: '#6B7280',
    textAlign: 'center',
  },
  amountSummary: {
    gap: m(10),
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: m(14),
    color: '#6B7280',
  },
  amountValue: {
    fontSize: m(16),
    fontWeight: '700',
  },
  loansSection: {
    marginTop: m(8),
  },
  sectionTitle: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(16),
  },
  loanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(14),
    padding: m(14),
    paddingLeft: m(17),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  overdueCard: {
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5',
  },
  statusAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: m(4),
  },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: m(5),
    paddingHorizontal: m(12),
    marginLeft: m(-17),
    marginRight: m(-14),
    marginTop: m(-14),
    marginBottom: m(12),
    gap: m(6),
  },
  overdueBannerText: {
    color: '#FFFFFF',
    fontSize: m(12),
    fontWeight: '700',
    letterSpacing: 1,
  },
  loanCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: m(12),
  },
  loanInfo: {
    flex: 1,
    marginRight: m(8),
  },
  loanAmount: {
    fontSize: m(21),
    fontWeight: '800',
    color: '#111827',
    marginBottom: m(4),
    letterSpacing: -0.3,
  },
  loanSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
  },
  loanPurpose: {
    fontSize: m(12.5),
    color: '#6B7280',
    fontWeight: '500',
    flexShrink: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(9),
    paddingVertical: m(5),
    borderRadius: m(16),
    gap: m(4),
  },
  statusText: {
    fontSize: m(11),
    fontWeight: '700',
  },
  loanDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: m(10),
    paddingVertical: m(8),
    paddingHorizontal: m(8),
  },
  detailDivider: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: m(2),
    backgroundColor: '#E5E7EB',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: m(6),
  },
  iconContainer: {
    width: m(26),
    height: m(26),
    borderRadius: m(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: m(9.5),
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#111827',
  },
  loanModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(7),
    paddingVertical: m(2.5),
    borderRadius: m(12),
    gap: m(3),
  },
  loanModeText: {
    fontSize: m(9.5),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: m(10),
    gap: m(8),
  },
  progressBar: {
    flex: 1,
    height: m(5),
    backgroundColor: '#E5E7EB',
    borderRadius: m(3),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: m(3),
  },
  progressText: {
    fontSize: m(11),
    color: '#6B7280',
    fontWeight: '700',
    width: m(30),
    textAlign: 'right',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: m(10),
    paddingTop: m(10),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  footerIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: m(24),
    height: m(24),
    borderRadius: m(12),
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: m(11.5),
    color: '#9CA3AF',
    fontWeight: '500',
  },
});