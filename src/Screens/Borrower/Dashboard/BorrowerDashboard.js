import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { useSelector, useDispatch } from 'react-redux';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import { getBorrowerLoans, clearLoans } from '../../../Redux/Slices/borrowerLoanSlice';
import { getBorrowerRecentActivities } from '../../../Redux/Slices/borrowerActivitiesSlice';

export default function BorrowerDashboard() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const { loans, summary } = useSelector(state => state.borrowerLoans);
  const { activities: recentActivities, loading: activitiesLoading } = useSelector(
    state => state.borrowerActivities,
  );

  const [showAllActivities, setShowAllActivities] = useState(false);

  useEffect(() => {
    if (user?._id) {
      dispatch(getBorrowerLoans({ borrowerId: user._id }));
      dispatch(getBorrowerRecentActivities({ limit: 5 }));
    }
    return () => {
      dispatch(clearLoans());
    };
  }, [user?._id, dispatch]);

  const myLoans = loans.slice(0, 2);

  const quickActions = [
    {
      id: 1,
      title: 'My Loans',
      icon: 'file-text',
      screen: 'MyLoans',
      color: '#2196F3',
    },
    {
      id: 2,
      title: 'Payment History',
      icon: 'clock',
      screen: 'BorrowerLoanHistoryScreen',
      color: '#4CAF50',
    },
  ];

  const renderMyLoan = ({ item }) => (
    <TouchableOpacity
      style={styles.loanCard}
      onPress={() => navigation.navigate('BorrowerLoanDetails', { loan: item })}>
      <View style={styles.loanHeader}>
        <View>
          <Text style={styles.loanPlanName}>{item.lenderId?.userName || 'Unknown Lender'}</Text>
          <Text style={styles.loanAmount}>₹{item.amount?.toLocaleString('en-IN')}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.paymentStatus === 'paid' ? '#E8F5E9' :
                item.paymentStatus === 'part paid' ? '#FFF3E0' : '#FFF3E0',
            },
          ]}>
          <Text
            style={[
              styles.statusText,
              {
                color: item.paymentStatus === 'paid' ? '#4CAF50' :
                       item.paymentStatus === 'part paid' ? '#FF9800' : '#FF9800',
              },
            ]}>
            {item.paymentStatus?.charAt(0).toUpperCase() + item.paymentStatus?.slice(1)}
          </Text>
        </View>
      </View>
      <View style={styles.loanProgress}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: item.amount > 0 ? `${((item.totalPaid || 0) / item.amount) * 100}%` : '0%',
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          Remaining: ₹{item.remainingAmount?.toLocaleString('en-IN') || item.amount}
        </Text>
      </View>
      <View style={styles.loanFooter}>
        <View style={styles.loanFooterItem}>
          <Icon name="calendar" size={14} color="#666" />
          <Text style={styles.loanFooterText}>
            Due: {item.loanEndDate ? new Date(item.loanEndDate).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
        <Icon name="chevron-right" size={20} color="#666" />
      </View>
    </TouchableOpacity>
  );

  const totalActiveLoans = summary.activeLoans || 0;
  const totalLoanAmount = summary.totalAmountBorrowed || 0;

  return (
    <View style={styles.container}>
      <Header title="Borrower Dashboard" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.userName || 'Borrower'}</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map(action => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={() => {
                  if (action.screen === 'BorrowerLoanHistoryScreen' && user?._id) {
                    navigation.navigate(action.screen, { borrowerId: user._id });
                  } else {
                    navigation.navigate(action.screen);
                  }
                }}>
                <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                  <Icon name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Loan Overview</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Icon name="file-text" size={24} color="#2196F3" />
              <Text style={styles.statValue}>{totalActiveLoans}</Text>
              <Text style={styles.statLabel}>Active Loans</Text>
            </View>
            <View style={styles.statCard}>
              <Icon name="dollar-sign" size={24} color="#4CAF50" />
              <Text style={styles.statValue}>
                ₹{(totalLoanAmount / 1000).toFixed(0)}K
              </Text>
              <Text style={styles.statLabel}>Total Borrowed</Text>
            </View>
            <View style={styles.statCard}>
              <Icon name="check-circle" size={24} color="#FF9800" />
              <Text style={styles.statValue}>
                ₹{(
                  loans
                    .filter(loan => loan.paymentStatus !== 'paid')
                    .reduce((sum, loan) => sum + (loan.remainingAmount || 0), 0) / 1000
                ).toFixed(0)}K
              </Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
          </View>
        </View>

        {/* My Loans */}
        {myLoans.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Loans</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MyLoans')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={myLoans}
              renderItem={renderMyLoan}
              keyExtractor={item => item._id}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Recent Activities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {recentActivities.length > 3 && (
              <TouchableOpacity
                onPress={() => setShowAllActivities(!showAllActivities)}
                activeOpacity={0.7}>
                <Text style={styles.viewAllText}>
                  {showAllActivities ? 'Show Less' : 'See All'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {activitiesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#ff6700" />
              <Text style={styles.loadingText}>Loading activities...</Text>
            </View>
          ) : recentActivities.length > 0 ? (
            <View style={styles.activityCard}>
              {(() => {
                const displayedActivities = showAllActivities ? recentActivities : recentActivities.slice(0, 3);
                return displayedActivities.map((activity, index) => {
                  const getActivityIcon = (type) => {
                    switch (type) {
                      case 'payment_made':
                        return { name: 'dollar-sign', color: '#4CAF50' };
                      case 'loan_paid':
                        return { name: 'check-circle', color: '#4CAF50' };
                      case 'loan_accepted':
                        return { name: 'check-circle', color: '#2196F3' };
                      case 'loan_rejected':
                        return { name: 'x-circle', color: '#F44336' };
                      case 'loan_received':
                        return { name: 'arrow-down', color: '#FF9800' };
                      case 'loan_overdue':
                        return { name: 'alert-circle', color: '#F44336' };
                      default:
                        return { name: 'activity', color: '#666' };
                    }
                  };
                  const handleActivityPress = () => {
                    if (activity.loanId) {
                      const loan = loans.find(l => l._id === activity.loanId);
                      if (loan) {
                        navigation.navigate('BorrowerLoanDetails', { loan });
                      } else {
                        navigation.navigate('MyLoans');
                      }
                    } else {
                      navigation.navigate('MyLoans');
                    }
                  };
                  const iconInfo = getActivityIcon(activity.type);
                  const isLast = index === displayedActivities.length - 1;
                // Create unique key by combining multiple identifiers
                const uniqueKey = activity._id 
                  ? `${activity._id}-${index}` 
                  : activity.loanId 
                    ? `${activity.loanId}-${index}` 
                    : `activity-${index}-${activity.type || 'unknown'}`;
                return (
                  <TouchableOpacity
                    key={uniqueKey}
                    style={[
                      styles.activityItem,
                      isLast && styles.activityItemLast
                    ]}
                    onPress={handleActivityPress}
                    activeOpacity={0.7}>
                    <View style={[styles.activityIcon, { backgroundColor: iconInfo.color + '20' }]}>
                      <Icon name={iconInfo.name} size={16} color={iconInfo.color} />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{activity.shortMessage || activity.type}</Text>
                      <Text style={styles.activityDescription} numberOfLines={2}>
                        {activity.message || ''}
                      </Text>
                      <Text style={styles.activityTime}>{activity.relativeTime || 'Recently'}</Text>
                    </View>
                    {activity.amount && (
                      <Text style={styles.activityAmount}>
                        ₹{activity.amount.toLocaleString('en-IN')}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
                });
              })()}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No recent activities</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: m(100),
  },
  welcomeSection: {
    padding: m(20),
    backgroundColor: '#FFFFFF',
    marginBottom: m(10),
  },
  welcomeText: {
    fontSize: m(16),
    color: '#666',
  },
  userName: {
    fontSize: m(24),
    fontWeight: '700',
    color: '#ff6700',
    marginTop: m(4),
  },
  section: {
    padding: m(20),
    backgroundColor: '#FFFFFF',
    marginTop: m(10),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(16),
  },
  sectionTitle: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#333',
    marginBottom: m(16),
  },
  viewAllText: {
    fontSize: m(14),
    color: '#ff6700',
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: m(12),
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    padding: m(16),
    backgroundColor: '#F5F5F5',
    borderRadius: m(12),
  },
  actionIcon: {
    width: m(50),
    height: m(50),
    borderRadius: m(25),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: m(8),
  },
  actionTitle: {
    fontSize: m(12),
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: m(12),
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: m(16),
    backgroundColor: '#F5F5F5',
    borderRadius: m(12),
  },
  statValue: {
    fontSize: m(20),
    fontWeight: '700',
    color: '#333',
    marginTop: m(8),
    marginBottom: m(4),
  },
  statLabel: {
    fontSize: m(12),
    color: '#666',
  },
  loanCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: m(12),
    padding: m(16),
    marginBottom: m(12),
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: m(12),
  },
  loanPlanName: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#333',
    marginBottom: m(4),
  },
  loanAmount: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#ff6700',
  },
  statusBadge: {
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(12),
  },
  statusText: {
    fontSize: m(12),
    fontWeight: '600',
  },
  loanProgress: {
    marginBottom: m(12),
  },
  progressBar: {
    height: m(8),
    backgroundColor: '#E0E0E0',
    borderRadius: m(4),
    marginBottom: m(8),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: m(4),
  },
  progressText: {
    fontSize: m(12),
    color: '#666',
  },
  loanFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loanFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  loanFooterText: {
    fontSize: m(12),
    color: '#666',
  },
  activityCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: m(12),
    padding: m(12),
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: m(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  activityItemLast: {
    borderBottomWidth: 0,
  },
  activityIcon: {
    width: m(32),
    height: m(32),
    borderRadius: m(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(12),
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: m(4),
  },
  activityDescription: {
    fontSize: m(12),
    color: '#666',
    marginBottom: m(4),
  },
  activityTime: {
    fontSize: m(11),
    color: '#999',
  },
  activityAmount: {
    fontSize: m(14),
    fontWeight: '700',
    color: '#ff6700',
    marginLeft: m(8),
  },
  loadingContainer: {
    padding: m(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: m(8),
    fontSize: m(12),
    color: '#666',
  },
  emptyContainer: {
    padding: m(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: m(14),
    color: '#999',
  },
});