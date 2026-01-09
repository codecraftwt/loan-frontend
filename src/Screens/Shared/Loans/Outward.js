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
    if (!pendingPayments || !Array.isArray(pendingPayments) || pendingPayments.length === 0) {
      return null;
    }
    
    const borrowerLoans = pendingPayments.filter(loan => {
      // Match by name
      const nameMatch = (
        (loan.loanName && borrower.userName && 
         loan.loanName.toLowerCase() === borrower.userName.toLowerCase()) ||
        (loan.borrowerName && borrower.userName && 
         loan.borrowerName.toLowerCase() === borrower.userName.toLowerCase())
      );
      
      // Match by mobile
      const mobileMatch = loan.borrowerMobile && borrower.mobileNo && (
        loan.borrowerMobile === borrower.mobileNo ||
        loan.borrowerMobile === borrower.mobileNo.replace(/^\+91/, '') ||
        loan.borrowerMobile.replace(/^\+91/, '') === borrower.mobileNo
      );
      
      // Match by Aadhaar
      const aadhaarMatch = loan.borrowerAadhaar && borrower.aadharCardNo && 
        loan.borrowerAadhaar === borrower.aadharCardNo;
      
      return nameMatch || mobileMatch || aadhaarMatch;
    });
    
    if (borrowerLoans.length === 0) return null;
    
    // Aggregate all pending payments for this borrower
    let totalPendingCount = 0;
    let totalPendingAmount = 0;
    
    borrowerLoans.forEach(loan => {
      if (loan.pendingPayments && Array.isArray(loan.pendingPayments) && loan.pendingPayments.length > 0) {
        totalPendingCount += loan.pendingPayments.length;
        loan.pendingPayments.forEach(payment => {
          const amount = typeof payment.amount === 'number' 
            ? payment.amount 
            : parseFloat(payment.amount) || 0;
          totalPendingAmount += amount;
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
        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <Icon name="search" size={22} color="#ff6700" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, phone, or email..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}>
                <Icon name="close" size={18} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddDetails')}
            activeOpacity={0.8}>
            <Icon name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        {borrowers && borrowers.length > 0 && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              {borrowers.length} {borrowers.length === 1 ? 'Borrower' : 'Borrowers'}
            </Text>
          </View>
        )}
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
            <View style={styles.modalHandle} />
            <View style={styles.actionModalHeader}>
              <View>
                <Text style={styles.actionModalTitle}>Choose Action</Text>
                <Text style={styles.actionModalSubtitle}>
                  {selectedBorrower?.userName || 'Borrower'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setBorrowerActionModalVisible(false)}
                style={styles.closeButton}>
                <Icon name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.detailsButton]}
                onPress={handleSeeDetails}
                activeOpacity={0.8}>
                <View style={[styles.actionIconContainer, { backgroundColor: '#3B82F620' }]}>
                  <Icon name="info" size={24} color="#3B82F6" />
                </View>
                <View style={styles.actionButtonContent}>
                  <Text style={styles.actionButtonText}>View Details</Text>
                  <Text style={styles.actionButtonSubtext}>See full borrower information</Text>
                </View>
                <Icon name="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.addLoanButton]}
                onPress={handleAddLoan}
                activeOpacity={0.8}>
                <View style={[styles.actionIconContainer, { backgroundColor: '#10B98120' }]}>
                  <Icon name="add-circle" size={24} color="#10B981" />
                </View>
                <View style={styles.actionButtonContent}>
                  <Text style={styles.actionButtonText}>Add New Loan</Text>
                  <Text style={styles.actionButtonSubtext}>Create a loan for this borrower</Text>
                </View>
                <Icon name="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
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
              <View style={styles.emptyIconContainer}>
                <Icon name="people-outline" size={80} color="#D1D5DB" />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No Results Found' : 'No Borrowers Yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Start by adding your first borrower'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  style={styles.emptyActionButton}
                  onPress={() => navigation.navigate('AddDetails')}
                  activeOpacity={0.8}>
                  <Icon name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.emptyActionText}>Add Borrower</Text>
                </TouchableOpacity>
              )}
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
                    {/* Status Banners */}
                    {borrowerPendingPayments && (
                      <View style={styles.pendingPaymentBanner}>
                        <View style={styles.bannerIconContainer}>
                          <Icon name="notifications" size={18} color="#FFFFFF" />
                        </View>
                        <View style={styles.bannerContent}>
                          <Text style={styles.pendingPaymentBannerText}>
                            {borrowerPendingPayments.count} Pending Payment{borrowerPendingPayments.count !== 1 ? 's' : ''}
                          </Text>
                          <Text style={styles.pendingPaymentBannerAmount}>
                            {formatCurrency(borrowerPendingPayments.amount)}
                          </Text>
                        </View>
                      </View>
                    )}
                    {hasFraudRisk && !borrowerPendingPayments && (
                      <View style={[
                        styles.fraudBanner,
                        {
                          backgroundColor: fraudData.riskLevel === 'critical' ? '#DC2626' :
                            fraudData.riskLevel === 'high' ? '#EA580C' :
                              fraudData.riskLevel === 'medium' ? '#D97706' : '#059669'
                        }
                      ]}>
                        <View style={styles.bannerIconContainer}>
                          <Icon name="warning" size={18} color="#FFFFFF" />
                        </View>
                        <Text style={styles.fraudBannerText}>
                          {fraudData.riskLevel?.toUpperCase()} FRAUD RISK DETECTED
                        </Text>
                      </View>
                    )}

                    {/* Card Header */}
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
                            <Icon name="mail" size={14} color="#6B7280" />
                            <Text style={styles.userEmail} numberOfLines={1}>
                              {borrower.email || 'No email provided'}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.chevronContainer}>
                        <View style={styles.chevronCircle}>
                          <Icon name="chevron-right" size={20} color="#ff6700" />
                        </View>
                      </View>
                    </View>

                    {/* Borrower Details */}
                    <View style={styles.borrowerDetails}>
                      <View style={styles.detailsGrid}>
                        {/* Phone */}
                        <View style={styles.detailItem}>
                          <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
                            <Icon name="phone" size={18} color="#2563EB" />
                          </View>
                          <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Phone</Text>
                            <Text style={styles.detailValue} numberOfLines={1}>
                              {borrower.mobileNo || 'Not provided'}
                            </Text>
                          </View>
                        </View>

                        {/* Aadhar */}
                        <View style={styles.detailItem}>
                          <View style={[styles.iconContainer, { backgroundColor: '#D1FAE5' }]}>
                            <Icon name="badge" size={18} color="#059669" />
                          </View>
                          <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Aadhar</Text>
                            <Text style={styles.detailValue} numberOfLines={1}>
                              {borrower.aadharCardNo}
                            </Text>
                          </View>
                        </View>

                        {/* Address */}
                        {borrower.address && (
                          <View style={styles.detailItem}>
                            <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
                              <Icon name="home" size={18} color="#D97706" />
                            </View>
                            <View style={styles.detailContent}>
                              <Text style={styles.detailLabel}>Address</Text>
                              <Text style={styles.detailValue} numberOfLines={2}>
                                {borrower.address}
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Reputation Score Card */}
                    {borrower.aadharCardNo && borrower.aadharCardNo.length === 12 && (
                      <View style={styles.reputationSection}>
                        <View style={styles.reputationHeaderRow}>
                          <View style={styles.reputationPill}>
                            <Icon name="leaderboard" size={14} color="#1D4ED8" />
                            <Text style={styles.reputationPillText}>Reputation</Text>
                          </View>
                          <Text style={styles.reputationHintText}>
                            Based on loan history & repayments
                          </Text>
                        </View>
                        <View style={styles.reputationContainer}>
                          <BorrowerReputationCard
                            aadhaarNumber={borrower.aadharCardNo}
                            compact={true}
                          />
                        </View>
                      </View>
                    )}

                    {/* Card Footer */}
                    <View style={styles.cardFooter}>
                      <View style={styles.footerBadge}>
                        <Icon name="person" size={14} color="#ff6700" />
                        <Text style={styles.footerText}>Borrower</Text>
                      </View>
                      {borrowerPendingPayments && (
                        <View style={styles.pendingPaymentBadge}>
                          <Icon name="schedule" size={14} color="#F59E0B" />
                          <Text style={styles.pendingPaymentBadgeText}>
                            {borrowerPendingPayments.count} pending
                          </Text>
                        </View>
                      )}
                      {hasFraudRisk && !borrowerPendingPayments && (
                        <View style={[
                          styles.fraudWarning,
                          {
                            backgroundColor: fraudData.riskLevel === 'critical' ? '#FEE2E2' :
                              fraudData.riskLevel === 'high' ? '#FED7AA' :
                                fraudData.riskLevel === 'medium' ? '#FEF3C7' : '#D1FAE5'
                          }
                        ]}>
                          <Icon
                            name="warning"
                            size={12}
                            color={fraudData.riskLevel === 'critical' ? '#DC2626' :
                              fraudData.riskLevel === 'high' ? '#EA580C' :
                                fraudData.riskLevel === 'medium' ? '#D97706' : '#059669'}
                          />
                          <Text style={[
                            styles.fraudWarningText,
                            {
                              color: fraudData.riskLevel === 'critical' ? '#DC2626' :
                                fraudData.riskLevel === 'high' ? '#EA580C' :
                                  fraudData.riskLevel === 'medium' ? '#D97706' : '#059669'
                            }
                          ]}>
                            Risk Alert
                          </Text>
                        </View>
                      )}
                      {!hasFraudRisk && !borrowerPendingPayments && (
                        <View style={styles.actionHint}>
                          <Icon name="touch-app" size={12} color="#ff6700" />
                          <Text style={styles.actionHintText}>Tap for options</Text>
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: m(16),
    paddingTop: m(16),
    paddingBottom: m(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(12),
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: m(16),
    paddingHorizontal: m(16),
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    minHeight: m(52),
  },
  searchIcon: {
    marginRight: m(10),
  },
  searchInput: {
    flex: 1,
    fontSize: m(15),
    color: '#374151',
    fontWeight: '500',
  },
  clearButton: {
    padding: m(4),
    marginLeft: m(8),
  },
  addButton: {
    width: m(52),
    height: m(52),
    borderRadius: m(16),
    backgroundColor: '#ff6700',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#ff6700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  statsContainer: {
    marginTop: m(12),
    paddingTop: m(12),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statsText: {
    fontSize: m(13),
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Filter Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  // Loan List
  loanListContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: m(16),
    paddingBottom: m(130),
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(80),
    paddingHorizontal: m(32),
  },
  emptyIconContainer: {
    width: m(120),
    height: m(120),
    borderRadius: m(60),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(24),
  },
  emptyTitle: {
    fontSize: m(22),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(8),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: m(15),
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: m(24),
    lineHeight: m(22),
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6700',
    paddingHorizontal: m(24),
    paddingVertical: m(14),
    borderRadius: m(12),
    gap: m(8),
    elevation: 2,
    shadowColor: '#ff6700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  emptyActionText: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Loan Card
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: m(16),
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: m(64),
    height: m(64),
    borderRadius: m(32),
    marginRight: m(16),
    borderWidth: 3,
    borderColor: '#F0F0F0',
  },
  avatarPlaceholder: {
    width: m(64),
    height: m(64),
    borderRadius: m(32),
    backgroundColor: '#ff6700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(16),
    borderWidth: 3,
    borderColor: '#FFE5D0',
  },
  avatarText: {
    fontSize: m(26),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: m(19),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(6),
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  userEmail: {
    fontSize: m(14),
    color: '#6B7280',
    flex: 1,
  },
  chevronContainer: {
    marginLeft: m(8),
  },
  chevronCircle: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  borrowerDetails: {
    marginBottom: m(16),
    marginLeft: m(8),
  },
  detailsGrid: {
    gap: m(12),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: m(44),
    height: m(44),
    borderRadius: m(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: m(11),
    fontWeight: '600',
    color: '#64748B',
    marginBottom: m(2),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  detailValue: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: m(20),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  // Borrower Card Styles
  borrowerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(24),
    padding: m(20),
    marginBottom: m(16),
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    elevation: 3,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  reputationSection: {
    marginTop: m(8),
    marginBottom: m(4),
  },
  reputationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: m(8),
  },
  reputationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(10),
    paddingVertical: m(4),
    borderRadius: m(20),
    backgroundColor: '#EEF2FF',
    gap: m(6),
  },
  reputationPillText: {
    fontSize: m(11),
    fontWeight: '700',
    color: '#1D4ED8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  reputationHintText: {
    fontSize: m(11),
    color: '#9CA3AF',
    fontWeight: '500',
  },
  reputationContainer: {
    marginTop: m(2),
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: m(8),
    paddingTop: m(16),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5EB',
    paddingHorizontal: m(12),
    paddingVertical: m(8),
    borderRadius: m(10),
    gap: m(6),
    borderWidth: 1,
    borderColor: '#FFE5D0',
  },
  footerText: {
    fontSize: m(12),
    fontWeight: '600',
    color: '#ff6700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: m(10),
    paddingHorizontal: m(12),
    paddingVertical: m(8),
    gap: m(6),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionHintText: {
    fontSize: m(12),
    color: '#6B7280',
    fontWeight: '500',
  },
  highlightedBorrowerCard: {
    borderWidth: 3,
    borderColor: '#b80266',
    backgroundColor: '#FFF5F5',
    shadowColor: '#b80266',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
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
    paddingVertical: m(12),
    paddingHorizontal: m(16),
    marginHorizontal: m(-20),
    marginTop: m(-20),
    marginBottom: m(20),
    gap: m(10),
    borderTopLeftRadius: m(24),
    borderTopRightRadius: m(24),
  },
  bannerIconContainer: {
    width: m(32),
    height: m(32),
    borderRadius: m(16),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerContent: {
    flex: 1,
  },
  fraudBannerText: {
    color: '#FFFFFF',
    fontSize: m(13),
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: m(8),
  },
  fraudBadgeContainer: {
    marginLeft: m(8),
  },
  fraudWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: m(10),
    paddingHorizontal: m(12),
    paddingVertical: m(8),
    gap: m(6),
    borderWidth: 1,
  },
  fraudWarningText: {
    fontSize: m(12),
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
    backgroundColor: '#F59E0B',
    paddingVertical: m(12),
    paddingHorizontal: m(16),
    marginHorizontal: m(-20),
    marginTop: m(-20),
    marginBottom: m(20),
    gap: m(10),
    borderTopLeftRadius: m(24),
    borderTopRightRadius: m(24),
  },
  pendingPaymentBannerText: {
    color: '#FFFFFF',
    fontSize: m(13),
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: m(2),
  },
  pendingPaymentBannerAmount: {
    color: '#FFFFFF',
    fontSize: m(15),
    fontWeight: '800',
  },
  pendingPaymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: m(10),
    paddingHorizontal: m(12),
    paddingVertical: m(8),
    gap: m(6),
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingPaymentBadgeText: {
    fontSize: m(12),
    fontWeight: '600',
    color: '#92400E',
  },
  // Action Modal Styles
  actionModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: m(28),
    borderTopRightRadius: m(28),
    padding: m(24),
    paddingTop: m(12),
    maxHeight: '50%',
  },
  modalHandle: {
    width: m(40),
    height: m(4),
    backgroundColor: '#D1D5DB',
    borderRadius: m(2),
    alignSelf: 'center',
    marginBottom: m(16),
  },
  actionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: m(24),
    paddingBottom: m(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionModalTitle: {
    fontSize: m(22),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(4),
  },
  actionModalSubtitle: {
    fontSize: m(14),
    color: '#6B7280',
    fontWeight: '500',
  },
  closeButton: {
    padding: m(4),
  },
  actionButtonsContainer: {
    gap: m(12),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: m(18),
    borderRadius: m(16),
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: m(14),
  },
  detailsButton: {
    borderColor: '#DBEAFE',
    backgroundColor: '#EFF6FF',
  },
  addLoanButton: {
    borderColor: '#D1FAE5',
    backgroundColor: '#ECFDF5',
  },
  actionIconContainer: {
    width: m(48),
    height: m(48),
    borderRadius: m(14),
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonContent: {
    flex: 1,
  },
  actionButtonText: {
    fontSize: m(17),
    fontWeight: '600',
    color: '#111827',
    marginBottom: m(2),
  },
  actionButtonSubtext: {
    fontSize: m(13),
    color: '#6B7280',
    fontWeight: '400',
  },
});

export default Outward;