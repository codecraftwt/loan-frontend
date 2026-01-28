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
      activeOpacity={0.8}>
      {isOverdue && (
        <View style={styles.overdueBanner}>
          <Icon name="error" size={16} color="#FFFFFF" />
          <Text style={styles.overdueBannerText}>OVERDUE</Text>
        </View>
      )}

      <View style={styles.loanCardHeader}>
        <View style={styles.loanInfo}>
          <Text style={styles.loanAmount}>{formatCurrency(loanAmount)}</Text>
          <Text style={styles.loanPurpose}>{loan.purpose || 'Loan'}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor() + '20', borderColor: getStatusColor() + '40', borderWidth: 1 }
        ]}>
          <Icon name={getStatusIcon()} size={18} color={getStatusColor()} />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.loanDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <View style={[styles.iconContainer, { backgroundColor: '#ECFDF5' }]}>
              <Icon name="check-circle" size={16} color="#10B981" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Paid</Text>
              <Text style={[styles.detailValue, { color: '#10B981' }]}>
                {formatCurrency(totalPaid)}
              </Text>
            </View>
          </View>
          <View style={styles.detailItem}>
            <View style={[styles.iconContainer, { backgroundColor: isOverdue ? '#FEE2E2' : '#FFF7ED' }]}>
              <Icon name="schedule" size={16} color={isOverdue ? '#EF4444' : '#F59E0B'} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Remaining</Text>
              <Text style={[styles.detailValue, { color: isOverdue ? '#EF4444' : '#F59E0B' }]}>
                {isLoanClosed ? '₹0' : formatCurrency(remainingAmount)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <View style={[styles.iconContainer, { backgroundColor: '#EFF6FF' }]}>
              <Icon name="event" size={16} color={isOverdue ? '#EF4444' : '#3B82F6'} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Due Date</Text>
              <Text style={[styles.detailValue, { color: isOverdue ? '#EF4444' : '#374151' }]}>
                {moment(loan.loanEndDate).format('DD MMM YYYY')}
              </Text>
              {isOverdue && (
                <Text style={styles.overdueDays}>
                  {moment(loan.loanEndDate).fromNow()}
                </Text>
              )}
            </View>
          </View>
        </View>

        {loan.loanMode && (
          <View style={styles.loanModeContainer}>
            <View style={[styles.loanModeBadge, { backgroundColor: loan.loanMode === 'cash' ? '#10B981' : '#3B82F6' }]}>
              <Icon
                name={loan.loanMode === 'cash' ? 'cash' : 'credit-card'}
                size={14}
                color="#FFFFFF"
              />
              <Text style={styles.loanModeText}>
                {loan.loanMode.toUpperCase()}
              </Text>
            </View>
          </View>
        )}
      </View>

      {loanAmount > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${paymentPercent}%`,
                  backgroundColor: isLoanClosed ? '#10B981' : (isOverdue ? '#EF4444' : '#3B82F6')
                }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {paymentPercent.toFixed(1)}% Paid
            {isLoanClosed && ' • Closed'}
            {isOverdue && ' • Overdue'}
          </Text>
        </View>
      )}

     <View style={styles.cardFooter}>
  <View style={styles.footerItem}>
    <Icon name="access-time" size={20} color="#9CA3AF" />
    <Text style={styles.footerText}>
      {loan.loanStartDate ? `Started ${moment(loan.loanStartDate).fromNow()}` : 'Not started'}
    </Text>
  </View>
  
  {/* Right side icon */}
  {/* <View style={styles.footerRight}> */}
    <View style={styles.footerIconButton}>
      <Icon name="chevron-right" size={21} color="#6B7280" />
    {/* </View> */}
  </View>
</View>
    </TouchableOpacity>
  );
};

export default function BorrowerLoansScreen({ route, navigation }) {
  const { borrower, loans } = route.params || {};
  const [refreshing, setRefreshing] = useState(false);

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
          <BorrowerReputationCard 
            aadhaarNumber={borrower.aadhaarNumber || borrower.aadharCardNo}
            compact={false}
          />
        )}

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Loan Summary</Text>
          <View style={styles.summaryGrid}>
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
          </View>
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
    borderRadius: m(16),
    padding: m(20),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  overdueCard: {
    borderWidth: 2,
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5',
  },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: m(6),
    paddingHorizontal: m(12),
    marginHorizontal: m(-20),
    marginTop: m(-20),
    marginBottom: m(16),
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
    marginBottom: m(16),
  },
  loanInfo: {
    flex: 1,
  },
  loanAmount: {
    fontSize: m(28),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(6),
  },
  loanPurpose: {
    fontSize: m(14),
    color: '#6B7280',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(12),
    paddingVertical: m(8),
    borderRadius: m(20),
    gap: m(6),
  },
  statusText: {
    fontSize: m(13),
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: m(16),
  },
  loanDetails: {
    gap: m(12),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: m(12),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: m(12),
  },
  iconContainer: {
    width: m(40),
    height: m(40),
    borderRadius: m(10),
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: m(15),
    fontWeight: '700',
    color: '#111827',
  },
  overdueDays: {
    fontSize: m(11),
    color: '#EF4444',
    marginTop: m(2),
    fontWeight: '600',
  },
  loanModeContainer: {
    marginTop: m(8),
  },
  loanModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(20),
    gap: m(6),
  },
  loanModeText: {
    fontSize: m(11),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  progressContainer: {
    marginTop: m(16),
    paddingTop: m(16),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
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
  },
  progressText: {
    fontSize: m(12),
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Changed from 'flex-start'
    alignItems: 'center',
    marginTop: m(12),
    paddingTop: m(12),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  // footerRight: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  // },
  footerIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: m(32),
    height: m(32),
    borderRadius: m(16),
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: m(12),
    color: '#9CA3AF',
    fontWeight: '500',
  },
});


