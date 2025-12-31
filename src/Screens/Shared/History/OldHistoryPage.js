import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useDispatch, useSelector } from 'react-redux';
import { getLoanByAadhar } from '../../../Redux/Slices/loanSlice';
import { m } from 'walstar-rn-responsive';
import LoaderSkeleton from '../../../Components/LoaderSkeleton';
import AgreementModal from '../../PromptBox/AgreementModal';
import Header from '../../../Components/Header';
import { LinearGradient } from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');
const ITEM_HEIGHT = 80;
const EXPANDED_HEIGHT = 300;

const OldHistoryPage = ({ route, navigation }) => {
  const { aadhaarNumber } = route.params;
  const [expandedLoanIndex, setExpandedLoanIndex] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedLoanAgreement, setSelectedLoanAgreement] = useState(null);
  const dispatch = useDispatch();
  const { loans, totalAmount, loading, error } = useSelector(
    state => state.loans
  );

  useEffect(() => {
    if (aadhaarNumber) {
      dispatch(getLoanByAadhar({ aadhaarNumber }));
    }
  }, [aadhaarNumber, dispatch]);

  const toggleDetails = index => {
    setExpandedLoanIndex(expandedLoanIndex === index ? null : index);
  };

  const handleViewAgreement = agreement => {
    setSelectedLoanAgreement(agreement);
    setIsModalVisible(true);
  };

  const getStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'pending': return '#FFA500';
      case 'paid': return '#4CAF50';
      case 'overdue': return '#F44336';
      case 'rejected': return '#9E9E9E';
      default: return '#757575';
    }
  };

  const getStatusIcon = status => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'clock';
      case 'paid': return 'check-circle';
      case 'overdue': return 'alert-circle';
      case 'rejected': return 'x-circle';
      default: return 'help-circle';
    }
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <View style={styles.container}>
      <Header title="Loan History" showBackButton />
      
      {loading ? (
        <LoaderSkeleton />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Hero Section */}
          <LinearGradient
            colors={['#FF6700', '#FF8C42']}
            style={styles.heroSection}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.avatarContainer}>
              <View style={styles.avatarWrapper}>
                <Icon name="user" size={40} color="#FF6700" />
              </View>
              <TouchableOpacity style={styles.cameraButton}>
                <Icon name="camera" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.userName}>
              {loans?.[0]?.name || 'User Name'}
            </Text>
            <Text style={styles.userAadhar}>
              Aadhar: {aadhaarNumber?.replace(/(\d{4})(?=\d)/g, '$1 ')}
            </Text>
          </LinearGradient>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FFE6D5' }]}>
                <Icon name="dollar-sign" size={24} color="#FF6700" />
              </View>
              <Text style={styles.statValue}>{formatCurrency(totalAmount || 0)}</Text>
              <Text style={styles.statLabel}>Total Pending</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#E3F2FD' }]}>
                <Icon name="file-text" size={24} color="#2196F3" />
              </View>
              <Text style={styles.statValue}>{loans?.length || 0}</Text>
              <Text style={styles.statLabel}>Total Loans</Text>
            </View>
          </View>

          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Mobile</Text>
                <Text style={styles.summaryValue}>{loans?.[0]?.mobileNumber || 'N/A'}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Address</Text>
                <Text style={styles.summaryValue} numberOfLines={1}>
                  {loans?.[0]?.address || 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          {/* Loans List Header */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Loan Details</Text>
            <Text style={styles.sectionSubtitle}>
              {loans?.length || 0} loans found
            </Text>
          </View>

          {/* Loans List */}
          {error ? (
            <View style={styles.errorContainer}>
              <Icon name="alert-triangle" size={48} color="#FF6B6B" />
              <Text style={styles.errorText}>{error.message}</Text>
            </View>
          ) : loans?.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="file" size={48} color="#CCCCCC" />
              <Text style={styles.emptyText}>No loans found</Text>
            </View>
          ) : (
            loans?.map((loan, index) => (
              <TouchableOpacity
                key={loan._id}
                activeOpacity={0.9}
                onPress={() => toggleDetails(index)}
                style={[
                  styles.loanCard,
                  expandedLoanIndex === index && styles.loanCardExpanded,
                ]}
              >
                <View style={styles.loanHeader}>
                  <View style={styles.loanIconContainer}>
                    <Icon name="credit-card" size={24} color="#fff" />
                  </View>
                  
                  <View style={styles.loanInfo}>
                    <Text style={styles.loanPurpose} numberOfLines={1}>
                      {loan?.purpose || 'No purpose specified'}
                    </Text>
                    <Text style={styles.loanDate}>
                      {new Date(loan?.loanStartDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  
                  <View style={styles.loanAmountContainer}>
                    <Text style={styles.loanAmount}>
                      {formatCurrency(loan?.amount)}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(loan?.status) + '20' }]}>
                      <Icon 
                        name={getStatusIcon(loan?.status)} 
                        size={12} 
                        color={getStatusColor(loan?.status)} 
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.statusText, { color: getStatusColor(loan?.status) }]}>
                        {loan?.status?.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  
                  <Icon
                    name={expandedLoanIndex === index ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#666"
                  />
                </View>

                {expandedLoanIndex === index && (
                  <Animated.View style={styles.expandedContent}>
                    {/* Details Grid */}
                    <View style={styles.detailsGrid}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Start Date</Text>
                        <Text style={styles.detailValue}>
                          {new Date(loan?.loanStartDate).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>End Date</Text>
                        <Text style={styles.detailValue}>
                          {new Date(loan?.loanEndDate).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Acceptance</Text>
                        <Text style={[
                          styles.detailValue,
                          { color: loan?.borrowerAcceptanceStatus === 'accepted' ? '#4CAF50' : '#F44336' }
                        ]}>
                          {loan?.borrowerAcceptanceStatus?.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {/* Lender Info */}
                    {loan?.lenderId && (
                      <View style={styles.lenderSection}>
                        <View style={styles.sectionTitleRow}>
                          <Icon name="user-check" size={18} color="#FF6700" />
                          <Text style={styles.sectionTitleSmall}>Lender Details</Text>
                        </View>
                        <View style={styles.lenderDetails}>
                          <View style={styles.lenderRow}>
                            <Icon name="user" size={16} color="#666" />
                            <Text style={styles.lenderText}>
                              {loan?.lenderId?.userName || 'N/A'}
                            </Text>
                          </View>
                          <View style={styles.lenderRow}>
                            <Icon name="mail" size={16} color="#666" />
                            <Text style={styles.lenderText}>
                              {loan?.lenderId?.email || 'N/A'}
                            </Text>
                          </View>
                          <View style={styles.lenderRow}>
                            <Icon name="phone" size={16} color="#666" />
                            <Text style={styles.lenderText}>
                              {loan?.lenderId?.mobileNo || 'N/A'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#FF6700' }]}
                        onPress={() => handleViewAgreement(loan.agreement)}
                      >
                        <Icon name="file-text" size={18} color="#fff" />
                        <Text style={styles.actionButtonText}>View Agreement</Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      <AgreementModal
        isVisible={isModalVisible}
        agreement={selectedLoanAgreement}
        onClose={() => setIsModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: m(20),
  },
  heroSection: {
    padding: m(24),
    paddingTop: m(40),
    borderBottomLeftRadius: m(24),
    borderBottomRightRadius: m(24),
    alignItems: 'center',
    marginBottom: m(-40),
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: m(16),
  },
  avatarWrapper: {
    width: m(80),
    height: m(80),
    borderRadius: m(40),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF6700',
    width: m(28),
    height: m(28),
    borderRadius: m(14),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: m(20),
    fontWeight: '700',
    color: '#fff',
    marginBottom: m(4),
  },
  userAadhar: {
    fontSize: m(14),
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'monospace',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: m(16),
    marginTop: m(50),
    marginBottom: m(16),
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: m(16),
    padding: m(16),
    marginHorizontal: m(6),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: m(2) },
    shadowOpacity: 0.1,
    shadowRadius: m(8),
    elevation: 4,
    alignItems: 'center',
  },
  statIconContainer: {
    width: m(48),
    height: m(48),
    borderRadius: m(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(8),
  },
  statValue: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#333',
    marginBottom: m(4),
  },
  statLabel: {
    fontSize: m(12),
    color: '#666',
  },
  summaryCard: {
    backgroundColor: '#fff',
    marginHorizontal: m(16),
    borderRadius: m(16),
    padding: m(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: m(2) },
    shadowOpacity: 0.1,
    shadowRadius: m(8),
    elevation: 4,
    marginBottom: m(24),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: m(12),
    color: '#666',
    marginBottom: m(4),
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: m(14),
    color: '#333',
    fontWeight: '500',
  },
  sectionHeader: {
    paddingHorizontal: m(16),
    marginBottom: m(12),
  },
  sectionTitle: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: m(12),
    color: '#666',
    marginTop: m(2),
  },
  loanCard: {
    backgroundColor: '#fff',
    marginHorizontal: m(16),
    marginBottom: m(12),
    borderRadius: m(16),
    padding: m(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: m(2) },
    shadowOpacity: 0.1,
    shadowRadius: m(8),
    elevation: 4,
  },
  loanCardExpanded: {
    shadowColor: '#FF6700',
    shadowOpacity: 0.15,
    shadowRadius: m(12),
  },
  loanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loanIconContainer: {
    width: m(48),
    height: m(48),
    borderRadius: m(12),
    backgroundColor: '#FF6700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(12),
  },
  loanInfo: {
    flex: 1,
  },
  loanPurpose: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#333',
    marginBottom: m(4),
  },
  loanDate: {
    fontSize: m(12),
    color: '#666',
  },
  loanAmountContainer: {
    alignItems: 'flex-end',
    marginRight: m(12),
  },
  loanAmount: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#333',
    marginBottom: m(4),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    borderRadius: m(12),
  },
  statusText: {
    fontSize: m(10),
    fontWeight: '600',
  },
  expandedContent: {
    marginTop: m(16),
    paddingTop: m(16),
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: m(16),
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: m(12),
    color: '#666',
    marginBottom: m(4),
  },
  detailValue: {
    fontSize: m(14),
    color: '#333',
    fontWeight: '500',
  },
  lenderSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: m(12),
    padding: m(12),
    marginBottom: m(16),
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(8),
  },
  sectionTitleSmall: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#333',
    marginLeft: m(8),
  },
  lenderDetails: {
    paddingLeft: m(4),
  },
  lenderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(6),
  },
  lenderText: {
    fontSize: m(14),
    color: '#555',
    marginLeft: m(8),
  },
  actionButtons: {
    flexDirection: 'row',
    gap: m(8),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(12),
    borderRadius: m(12),
    gap: m(8),
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: m(14),
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: m(40),
  },
  errorText: {
    fontSize: m(16),
    color: '#666',
    textAlign: 'center',
    marginTop: m(16),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: m(60),
  },
  emptyText: {
    fontSize: m(16),
    color: '#999',
    textAlign: 'center',
    marginTop: m(16),
  },
});

export default OldHistoryPage;