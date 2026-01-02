import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  KeyboardAvoidingView,
  RefreshControl,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { getAllBorrowers, searchBorrowers } from '../../../Redux/Slices/borrowerSlice';
import { checkFraudStatus } from '../../../Redux/Slices/loanSlice';
import { getPendingPayments } from '../../../Redux/Slices/lenderPaymentSlice';
import { useFocusEffect } from '@react-navigation/native';
import FraudStatusBadge from '../../../Components/FraudStatusBadge';
import BorrowerReputationCard from '../../../Components/BorrowerReputationCard';
import LoaderSkeleton from '../../../Components/LoaderSkeleton';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Outward = ({ navigation, route }) => {
  const scrollViewRef = React.useRef(null);
  const dispatch = useDispatch();
  const { pendingPayments } = useSelector(state => state.lenderPayments);
  const { borrowers, loading: borrowersLoading,} = useSelector(state => state.borrowers);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedBorrower, setSelectedBorrower] = useState(null);
  const [borrowerActionModalVisible, setBorrowerActionModalVisible] = useState(false);
  const [highlightedBorrowerId, setHighlightedBorrowerId] = useState(null);
  const [pendingHighlightParams, setPendingHighlightParams] = useState(null);
  const [borrowerFraudStatus, setBorrowerFraudStatus] = useState({});


  // Handle navigation from notification
  useEffect(() => {
  if (route?.params) {
      const { highlightBorrowerId, highlightMobileNumber, notificationId, notificationType } = route.params;
      
      // Store params for retry if borrowers not loaded yet
      if (highlightBorrowerId || highlightMobileNumber) {
        setPendingHighlightParams({
          highlightBorrowerId,
          highlightMobileNumber,
          notificationId,
          notificationType,
        });
      }

      // Find and highlight borrower when borrowers are loaded
      if (borrowers && borrowers.length > 0) {
        if (highlightBorrowerId) {
          // Find by borrower ID
          const borrower = borrowers.find(b => b._id === highlightBorrowerId);
          if (borrower) {
            setHighlightedBorrowerId(borrower._id);
            // Scroll to borrower after a short delay
            setTimeout(() => {
              scrollToBorrower(borrower._id);
            }, 500);
          } else {
            console.warn('⚠️ Borrower not found with ID:', highlightBorrowerId);
          }
        } else if (highlightMobileNumber) {
          // Find by mobile number
          const borrower = borrowers.find(b => 
            b.mobileNo === highlightMobileNumber || 
            b.mobileNo === `+91${highlightMobileNumber}` ||
            b.mobileNo === highlightMobileNumber.replace(/^\+91/, '')
          );
          if (borrower) {
            setHighlightedBorrowerId(borrower._id);
            // Scroll to borrower after a short delay
            setTimeout(() => {
              scrollToBorrower(borrower._id);
            }, 500);
          } else {
            console.warn('Borrower not found with mobile number:', highlightMobileNumber);
          }
        }
      }

      // Clear route params after processing
      if (navigation) {
        navigation.setParams({
          highlightBorrowerId: undefined,
          highlightMobileNumber: undefined,
          notificationId: undefined,
          notificationType: undefined,
        });
      }
    }
  }, [route?.params]);

  // Retry highlighting when borrowers are loaded
  useEffect(() => {
    if (pendingHighlightParams && borrowers && borrowers.length > 0) {
      const { highlightBorrowerId, highlightMobileNumber } = pendingHighlightParams;
      
      if (highlightBorrowerId) {
        const borrower = borrowers.find(b => b._id === highlightBorrowerId);
        if (borrower) {
          setHighlightedBorrowerId(borrower._id);
          setTimeout(() => {
            scrollToBorrower(borrower._id);
          }, 500);
          setPendingHighlightParams(null);
        }
      } else if (highlightMobileNumber) {
        const borrower = borrowers.find(b => 
          b.mobileNo === highlightMobileNumber || 
          b.mobileNo === `+91${highlightMobileNumber}` ||
          b.mobileNo === highlightMobileNumber.replace(/^\+91/, '')
        );
        if (borrower) {
          setHighlightedBorrowerId(borrower._id);
          setTimeout(() => {
            scrollToBorrower(borrower._id);
          }, 500);
          setPendingHighlightParams(null);
        }
      }
    }
  }, [borrowers, pendingHighlightParams]);

  // Scroll to specific borrower
  const scrollToBorrower = (borrowerId) => {
    if (!scrollViewRef.current || !borrowers) return;
    
    const index = borrowers.findIndex(b => b._id === borrowerId);
    if (index !== -1) {
      // Scroll to the borrower card
      // Note: This is a simplified scroll - you may need to adjust based on card heights
      scrollViewRef.current?.scrollTo({ y: index * 200, animated: true });
    }
  };

  const loading = borrowersLoading;
  // Add debouncing effect for search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch borrowers when debounced search changes
  useEffect(() => {
    const fetchData = async () => {
      if (debouncedSearch && debouncedSearch.trim() !== '') {
        dispatch(searchBorrowers({ search: debouncedSearch }));
      } else {
        try {
          // Assuming dispatch(getAllBorrowers()) returns a promise or handles data fetching asynchronously
          const result = await dispatch(getAllBorrowers());
        } catch (error) {
          console.error("Error fetching borrowers:", error); // In case there is an error fetching data
        }
      }
    };
    fetchData();
  }, [debouncedSearch, dispatch]);


  // Fetch fraud status for a borrower
  const fetchFraudStatus = async (aadhaarNumber) => {
    if (!aadhaarNumber || aadhaarNumber.length !== 12) return;
    
    // Check if we already have fraud status for this borrower
    if (borrowerFraudStatus[aadhaarNumber]) return;
    
    try {
      const result = await dispatch(checkFraudStatus(aadhaarNumber));
      if (checkFraudStatus.fulfilled.match(result)) {
        setBorrowerFraudStatus(prev => ({
          ...prev,
          [aadhaarNumber]: result.payload,
        }));
      }
    } catch (error) {
      console.error('Error fetching fraud status:', error);
    }
  };

  // Fetch fraud status for all borrowers when they load
  useEffect(() => {
    if (borrowers && borrowers.length > 0) {
      borrowers.forEach(borrower => {
        const aadhaarNumber = borrower.aadharCardNo;
        if (aadhaarNumber && aadhaarNumber.length === 12) {
          fetchFraudStatus(aadhaarNumber);
        }
      });
    }
  }, [borrowers]);

  // Fetch borrowers on initial mount
  useEffect(() => {
    dispatch(getAllBorrowers());
  }, [dispatch]);

  // Fetch pending payments on mount and when screen is focused
  useFocusEffect(
    useCallback(() => {
      dispatch(getPendingPayments({ page: 1, limit: 100 }));
    }, [dispatch])
  );

  const formatCurrency = (amount) => {
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    return `₹${numAmount.toLocaleString('en-IN')}`;
  };

  // Helper function to get pending payments for a borrower
  const getBorrowerPendingPayments = (borrower) => {
    if (!pendingPayments || pendingPayments.length === 0) return null;
    
    // Match by borrower name (userName in borrowers vs loanName in pending payments)
    const borrowerLoans = pendingPayments.filter(
      loan => loan.loanName && borrower.userName && 
      loan.loanName.toLowerCase() === borrower.userName.toLowerCase()
    );
    
    if (borrowerLoans.length === 0) return null;
    
    // Aggregate all pending payments for this borrower
    let totalPendingCount = 0;
    let totalPendingAmount = 0;
    
    borrowerLoans.forEach(loan => {
      if (loan.pendingPayments && Array.isArray(loan.pendingPayments)) {
        totalPendingCount += loan.pendingPayments.length;
        loan.pendingPayments.forEach(payment => {
          totalPendingAmount += typeof payment.amount === 'number' ? payment.amount : parseFloat(payment.amount) || 0;
        });
      }
    });
    
    if (totalPendingCount === 0) return null;
    
    return {
      count: totalPendingCount,
      amount: totalPendingAmount,
    };
  };

  const onRefresh = useCallback(async () => {
    if (debouncedSearch && debouncedSearch.trim() !== '') {
      await dispatch(searchBorrowers({ search: debouncedSearch }));
    } else {
      await dispatch(getAllBorrowers());
    }
  }, [dispatch, debouncedSearch]);

  const handleBorrowerCardPress = (borrower) => {
    setSelectedBorrower(borrower);
    setBorrowerActionModalVisible(true);
  };

  const handleSeeDetails = () => {
    setBorrowerActionModalVisible(false);
    navigation.navigate('BorrowerDetailsScreen', { borrowerDetails: selectedBorrower });
  };

  const handleAddLoan = () => {
    setBorrowerActionModalVisible(false);
    // Map borrower fields to loan form fields
    const borrowerData = {
      name: selectedBorrower.userName,
      mobileNumber: selectedBorrower.mobileNo?.replace(/^\+91/, '') || selectedBorrower.mobileNo,
      aadhaarNumber: selectedBorrower.aadharCardNo,
      address: selectedBorrower.address,
    };
    navigation.navigate('AddDetails', { borrowerData });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title="Borrowers" />

      {/* Search and Filter Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search borrowers"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddDetails')}>
          <Icon name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>


      {/* Borrower Action Modal */}
      <Modal
        visible={borrowerActionModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setBorrowerActionModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setBorrowerActionModalVisible(false)}>
          <View style={styles.actionModalContent}>
            <View style={styles.actionModalHeader}>
              <Text style={styles.actionModalTitle}>Select Action</Text>
              <TouchableOpacity onPress={() => setBorrowerActionModalVisible(false)}>
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSeeDetails}>
              <Icon name="info" size={24} color="#3B82F6" />
              <Text style={styles.actionButtonText}>See Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleAddLoan}>
              <Icon name="add-circle" size={24} color="#10B981" />
              <Text style={styles.actionButtonText}>Add Loan</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Borrowers List */}
      {loading ? (
        <LoaderSkeleton />
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.loanListContainer}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}>
          {borrowers?.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="people-outline" size={60} color="#E5E7EB" />
              <Text style={styles.emptyTitle}>No borrowers found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Try a different search term' : 'No borrowers registered yet'}
              </Text>
            </View>
          ) : (
            borrowers?.map((borrower, index) => {
              const isHighlighted = highlightedBorrowerId === borrower._id;
              const fraudData = borrower.aadharCardNo ? borrowerFraudStatus[borrower.aadharCardNo] : null;
              const hasFraudRisk = fraudData && fraudData.success && fraudData.riskLevel && fraudData.riskLevel !== 'low';
              const borrowerPendingPayments = getBorrowerPendingPayments(borrower);
              
              return (
              <TouchableOpacity
                key={borrower._id || index}
                onPress={() => handleBorrowerCardPress(borrower)}
                activeOpacity={0.9}>
                <View style={[
                  styles.borrowerCard,
                  isHighlighted && styles.highlightedBorrowerCard,
                  hasFraudRisk && styles.fraudRiskBorrowerCard,
                  borrowerPendingPayments && styles.pendingPaymentBorrowerCard
                ]}>
                  {borrowerPendingPayments && (
                    <View style={styles.pendingPaymentBanner}>
                      <Icon name="notifications" size={16} color="#FFFFFF" />
                      <Text style={styles.pendingPaymentBannerText}>
                        {borrowerPendingPayments.count} Pending Payment{borrowerPendingPayments.count !== 1 ? 's' : ''} - {formatCurrency(borrowerPendingPayments.amount)}
                      </Text>
                    </View>
                  )}
                  {hasFraudRisk && (
                    <View style={[
                      styles.fraudBanner,
                      { backgroundColor: fraudData.riskLevel === 'critical' ? '#dc3545' : 
                                       fraudData.riskLevel === 'high' ? '#fd7e14' : 
                                       fraudData.riskLevel === 'medium' ? '#ffc107' : '#28a745' }
                    ]}>
                      <Icon name="pending" size={16} color="#FFFFFF" />
                      <Text style={styles.fraudBannerText}>
                        {fraudData.riskLevel?.toUpperCase()} FRAUD RISK
                      </Text>
                    </View>
                  )}
                  <View style={styles.cardHeader}>
                    <View style={styles.userInfo}>
                      {borrower?.profileImage ? (
                        <Image
                          source={{ uri: borrower?.profileImage }}
                          style={styles.userAvatar}
                        />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarText}>
                            {borrower?.userName?.charAt(0)?.toUpperCase() || 'U'}
                          </Text>
                        </View>
                      )}
                      <View style={styles.userDetails}>
                        <View style={styles.userNameRow}>
                          <Text style={styles.userName} numberOfLines={1}>
                            {borrower.userName}
                          </Text>
                          {hasFraudRisk && (
                            <View style={styles.fraudBadgeContainer}>
                              <FraudStatusBadge 
                                fraudScore={fraudData.fraudScore} 
                                riskLevel={fraudData.riskLevel} 
                              />
                            </View>
                          )}
                        </View>
                        <View style={styles.userMeta}>
                          <Icon name="mail" size={12} color="#9CA3AF" />
                          <Text style={styles.userEmail} numberOfLines={1}>
                            {borrower.email || 'No email'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.chevronContainer}>
                      <Icon name="chevron-right" size={20} color="#9CA3AF" />
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.borrowerDetails}>
                    <View style={styles.detailRow}>
                      <View style={styles.detailItem}>
                        <View style={styles.iconContainer}>
                          <Icon name="phone" size={16} color="#50C878" />
                        </View>
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Phone</Text>
                          <Text style={styles.detailValue} numberOfLines={1}>
                            {borrower.mobileNo ? borrower.mobileNo : 'Not provided'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.detailRow}>
                      <View style={styles.detailItem}>
                        <View style={styles.iconContainer}>
                          <Icon name="badge" size={16} color="#50C878" />
                        </View>
                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>Aadhar Number</Text>
                          <Text style={styles.detailValue} numberOfLines={1}>
                            {borrower.aadharCardNo ? borrower.aadharCardNo : 'Not provided'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {borrower.address && (
                      <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                          <View style={styles.iconContainer}>
                            <Icon name="home" size={16} color="#50C878" />
                          </View>
                          <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Address</Text>
                            <Text style={styles.detailValue} numberOfLines={2}>
                              {borrower.address}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Reputation Score Card */}
                  {borrower.aadharCardNo && borrower.aadharCardNo.length === 12 && (
                    <View style={styles.reputationContainer}>
                      <BorrowerReputationCard 
                        aadhaarNumber={borrower.aadharCardNo} 
                        compact={true}
                      />
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    <View style={styles.footerBadge}>
                      <Icon name="person" size={12} color="#6B7280" />
                      <Text style={styles.footerText}>Borrower</Text>
                    </View>
                    {borrowerPendingPayments && (
                      <View style={styles.pendingPaymentBadge}>
                        <Icon name="clock" size={14} color="#F59E0B" />
                        <Text style={styles.pendingPaymentBadgeText}>
                          {borrowerPendingPayments.count} pending • {formatCurrency(borrowerPendingPayments.amount)}
                        </Text>
                      </View>
                    )}
                    {hasFraudRisk && !borrowerPendingPayments && (
                      <View style={[
                        styles.fraudWarning,
                        { backgroundColor: fraudData.riskLevel === 'critical' ? '#FEE2E2' : 
                                         fraudData.riskLevel === 'high' ? '#FED7AA' : 
                                         fraudData.riskLevel === 'medium' ? '#FEF3C7' : '#D1FAE5' }
                      ]}>
                        <Text style={[
                          styles.fraudWarningText,
                          { color: fraudData.riskLevel === 'critical' ? '#DC2626' : 
                                  fraudData.riskLevel === 'high' ? '#EA580C' : 
                                  fraudData.riskLevel === 'medium' ? '#D97706' : '#059669' }
                        ]}>
                          {fraudData.details?.pendingLoansCount || 0} pending • {fraudData.details?.overdueLoansCount || 0} overdue
                        </Text>
                      </View>
                    )}
                    {!hasFraudRisk && !borrowerPendingPayments && (
                      <View style={styles.actionHint}>
                        <Text style={styles.actionHintText}>Tap to view options</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  // Search Section
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: m(16),
    paddingVertical: m(12),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: m(12),
    paddingHorizontal: m(12),
    marginRight: m(12),
  },
  searchIcon: {
    marginRight: m(8),
  },
  searchInput: {
    flex: 1,
    height: m(44),
    fontSize: m(16),
    color: '#374151',
  },
  addButton: {
    width: m(44),
    height: m(44),
    borderRadius: m(12),
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Filter Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  // Loan List
  loanListContainer: {
    padding: m(16),
  },
  scrollContent: {
    paddingTop: m(8),
    paddingBottom: m(130),
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(60),
  },
  emptyTitle: {
    fontSize: m(18),
    fontWeight: '600',
    color: '#6B7280',
    marginTop: m(12),
    marginBottom: m(4),
  },
  emptySubtitle: {
    fontSize: m(14),
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Loan Card
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: m(10),
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: m(56),
    height: m(56),
    borderRadius: m(28),
    marginRight: m(14),
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  avatarPlaceholder: {
    width: m(56),
    height: m(56),
    borderRadius: m(28),
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(14),
    borderWidth: 2,
    borderColor: '#FFF3E0',
  },
  avatarText: {
    fontSize: m(22),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(3),
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  userEmail: {
    fontSize: m(13),
    color: '#6B7280',
    flex: 1,
  },
  chevronContainer: {
    padding: m(4),
    marginLeft: m(13),
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: m(8),
  },
  detailRow: {
    marginBottom: m(14),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: m(36),
    height: m(36),
    borderRadius: m(10),
    backgroundColor: '#D0F0C0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(12),
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: m(11),
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: m(4),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#374151',
    lineHeight: m(20),
  },
  // Borrower Card Styles
  borrowerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(20),
    padding: m(18),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  borrowerDetails: {
    marginTop: m(2),
  },
  reputationContainer: {
    marginTop: m(12),
    marginBottom: m(8),
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: m(6),
    paddingTop: m(13),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    borderRadius: m(8),
    gap: m(6),
  },
  footerText: {
    fontSize: m(11),
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionHint: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: m(8),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    gap: m(6),
  },
  actionHintText: {
    fontSize: m(11),
    color: 'black',
    fontStyle: 'italic',
  },
  highlightedBorrowerCard: {
    borderWidth: 3,
    borderColor: '#b80266',
    backgroundColor: '#FFF5F5',
    shadowColor: '#b80266',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fraudRiskBorrowerCard: {
    borderWidth: 2,
    borderColor: '#FED7AA',
    backgroundColor: '#FFFBEB',
  },
  fraudBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(8),
    paddingHorizontal: m(12),
    marginHorizontal: m(-20),
    marginTop: m(-20),
    marginBottom: m(16),
    gap: m(6),
    borderTopLeftRadius: m(17),
    borderTopRightRadius: m(17),
  },
  fraudBannerText: {
    color: '#FFFFFF',
    fontSize: m(12),
    fontWeight: '700',
    letterSpacing: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(6),
    gap: m(8),
  },
  fraudBadgeContainer: {
    marginLeft: m(8),
  },
  fraudWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: m(8),
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    gap: m(6),
  },
  fraudWarningText: {
    fontSize: m(11),
    fontWeight: '600',
  },
  pendingPaymentBorrowerCard: {
    borderWidth: 2,
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBF5',
  },
  pendingPaymentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: m(8),
    paddingHorizontal: m(12),
    marginHorizontal: m(-20),
    marginTop: m(-20),
    marginBottom: m(16),
    gap: m(6),
    borderTopLeftRadius: m(17),
    borderTopRightRadius: m(17),
  },
  pendingPaymentBannerText: {
    color: '#FFFFFF',
    fontSize: m(12),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pendingPaymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: m(8),
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    gap: m(6),
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingPaymentBadgeText: {
    fontSize: m(11),
    fontWeight: '600',
    color: '#92400E',
  },
  // Action Modal Styles
  actionModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: m(20),
    borderTopRightRadius: m(20),
    padding: m(24),
    maxHeight: '50%',
  },
  actionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(20),
  },
  actionModalTitle: {
    fontSize: m(20),
    fontWeight: '600',
    color: '#111827',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: m(16),
    borderRadius: m(12),
    backgroundColor: '#d8e5f1ff',
    marginBottom: m(12),
    gap: m(12),
  },
  actionButtonText: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#374151',
  },
});

export default Outward;