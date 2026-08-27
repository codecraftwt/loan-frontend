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
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { getAllBorrowers, searchBorrowers } from '../../../Redux/Slices/borrowerSlice';
import { getRiskAssessment } from '../../../Redux/Slices/loanSlice';
import { getPendingPayments } from '../../../Redux/Slices/lenderPaymentSlice';
import { useFocusEffect } from '@react-navigation/native';
import BorrowerReputationCard from '../../../Components/BorrowerReputationCard';
import LoaderSkeleton from '../../../Components/LoaderSkeleton';
import SubscriptionRestriction from '../../../Components/SubscriptionRestriction';
import { useSubscription } from '../../../hooks/useSubscription';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import { colors, FontFamily } from '../../../constants';

const ALL_BORROWERS_LIMIT = 10000;

const Outward = ({ navigation, route }) => {
  const scrollViewRef = React.useRef(null);
  const dispatch = useDispatch();
  const { pendingPayments } = useSelector(state => state.lenderPayments);
  const { borrowers, loading: borrowersLoading,} = useSelector(state => state.borrowers);
  const user = useSelector(state => state.auth.user);
  const isLender = user?.roleId === 1;
  const { hasActivePlan } = useSubscription();
  const { loading: planLoading } = useSelector(state => state.planPurchase);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedBorrower, setSelectedBorrower] = useState(null);
  const [borrowerActionModalVisible, setBorrowerActionModalVisible] = useState(false);
  const [highlightedBorrowerId, setHighlightedBorrowerId] = useState(null);
  const [pendingHighlightParams, setPendingHighlightParams] = useState(null);
  const [borrowerRiskAssessment, setBorrowerRiskAssessment] = useState({});

  // Scroll to specific borrower
  const scrollToBorrower = useCallback((borrowerId) => {
    if (!scrollViewRef.current || !borrowers) return;
    
    const index = borrowers.findIndex(b => b._id === borrowerId);
    if (index !== -1) {
      scrollViewRef.current?.scrollTo({ y: index * 200, animated: true });
    }
  }, [borrowers]);

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
  }, [borrowers, navigation, route?.params, scrollToBorrower]);

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
  }, [borrowers, pendingHighlightParams, scrollToBorrower]);

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
        dispatch(searchBorrowers({
          search: debouncedSearch,
          page: 1,
          limit: ALL_BORROWERS_LIMIT,
        }));
      } else {
        try {
          await dispatch(getAllBorrowers({ page: 1, limit: ALL_BORROWERS_LIMIT }));
        } catch (error) {
          console.error("Error fetching borrowers:", error);
        }
      }
    };
    fetchData();
  }, [debouncedSearch, dispatch]);

  // Fetch risk assessment for a borrower
  const fetchRiskAssessment = useCallback(async (aadhaarNumber) => {
    if (!aadhaarNumber || aadhaarNumber.length !== 12) return;
    
    try {
      const result = await dispatch(getRiskAssessment(aadhaarNumber));
      if (getRiskAssessment.fulfilled.match(result)) {
        setBorrowerRiskAssessment(prev => {
          // Check if we already have risk assessment for this borrower
          if (prev[aadhaarNumber]) return prev;
          return {
            ...prev,
            [aadhaarNumber]: result.payload,
          };
        });
      } else if (getRiskAssessment.rejected.match(result)) {
        // Silently handle rejections - borrower may not have loan history
      }
    } catch (error) {
      // Silently handle errors - borrower may not have loan history
    }
  }, [dispatch]);

  // Fetch risk assessment for all borrowers when they load
  useEffect(() => {
    if (borrowers && borrowers.length > 0) {
      borrowers.forEach(borrower => {
        const aadhaarNumber = borrower.aadharCardNo || borrower.aadhaarCardNo || borrower.aadhaarNumber;
        if (aadhaarNumber && aadhaarNumber.length === 12) {
          fetchRiskAssessment(aadhaarNumber);
        }
      });
    }
  }, [borrowers, fetchRiskAssessment]);

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
      await dispatch(searchBorrowers({
        search: debouncedSearch,
        page: 1,
        limit: ALL_BORROWERS_LIMIT,
      }));
    } else {
      await dispatch(getAllBorrowers({ page: 1, limit: ALL_BORROWERS_LIMIT }));
    }
  }, [dispatch, debouncedSearch]);

  const handleBorrowerCardPress = (borrower) => {
    if (isLender && !hasActivePlan) {
      return;
    }
    setSelectedBorrower(borrower);
    setBorrowerActionModalVisible(true);
  };

  const handleSeeDetails = () => {
    setBorrowerActionModalVisible(false);
    navigation.navigate('BorrowerDetailsScreen', { borrowerDetails: selectedBorrower });
  };

  const handleViewLoanHistory = () => {
    if (!selectedBorrower?._id) return;

    setBorrowerActionModalVisible(false);
    navigation.navigate('BorrowerLoanHistoryScreen', {
      borrowerId: selectedBorrower._id,
      borrowerDetails: selectedBorrower,
    });
  };

  const handleAddLoan = () => {
    setBorrowerActionModalVisible(false);
    
    // Check for risk assessment before proceeding
    const aadhaarNumber = selectedBorrower.aadharCardNo;
    const riskData = aadhaarNumber ? borrowerRiskAssessment[aadhaarNumber] : null;
    
    // Check if borrower has medium, high, or critical risk
    if (riskData && riskData.riskLevel) {
      const riskLevel = riskData.riskLevel.toLowerCase();
      if (riskLevel === 'medium' || riskLevel === 'high' || riskLevel === 'critical') {
        // Show alert with risk warning
        Alert.alert(
          '⚠️ Fraud Risk Detected',
          riskData.warning || riskData.recommendation || `This borrower has been flagged as ${riskLevel.toUpperCase()} RISK. Do you still want to proceed with creating a loan?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                // User cancelled, do nothing
              },
            },
            {
              text: 'Yes, Continue',
              style: 'destructive',
              onPress: () => {
                // User confirmed, proceed with loan creation
                const borrowerData = {
                  name: selectedBorrower.userName,
                  mobileNumber: selectedBorrower.mobileNo?.replace(/^\+91/, '') || selectedBorrower.mobileNo,
                  aadhaarNumber: selectedBorrower.aadharCardNo,
                  address: selectedBorrower.address,
                };
                navigation.navigate('AddDetails', { borrowerData });
              },
            },
          ],
          { cancelable: true }
        );
        return;
      }
    }
    
    // No risk or low risk - proceed directly
    const borrowerData = {
      name: selectedBorrower.userName,
      mobileNumber: selectedBorrower.mobileNo?.replace(/^\+91/, '') || selectedBorrower.mobileNo,
      aadhaarNumber: selectedBorrower.aadharCardNo,
      address: selectedBorrower.address,
    };
    navigation.navigate('AddDetails', { borrowerData });
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Header title="Borrowers" />

      {/* Search and Filter Section */}
      <View style={[
        styles.searchSection,
        isLender && !hasActivePlan && styles.disabledSection
      ]}>
        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <Icon name="search" size={22} color={colors.gold} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or mobile number"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.textMuted}
              editable={isLender ? hasActivePlan : true}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
                disabled={isLender && !hasActivePlan}>
                <Icon name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[styles.addButton, (!isLender || !hasActivePlan) && styles.disabledButton]}
            onPress={() => {
              if (isLender && !hasActivePlan) return;
              navigation.navigate('AddDetails');
            }}
            activeOpacity={0.8}
            disabled={isLender && !hasActivePlan}>
            <Icon name="add" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
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
              <View style={styles.actionModalTitleBlock}>
                <Text style={styles.actionModalTitle}>Choose Action</Text>
                <Text style={styles.actionModalSubtitle}>
                  Select what you want to do next
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setBorrowerActionModalVisible(false)}
                style={styles.closeButton}>
                <Icon name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.historyButton]}
                onPress={handleViewLoanHistory}
                activeOpacity={0.8}>
                <View style={[styles.actionIconContainer, { backgroundColor: colors.butterSoft }]}>
                  <Icon name="history" size={24} color={colors.goldDark} />
                </View>
                <View style={styles.actionButtonContent}>
                  <Text style={styles.actionButtonText}>Loan History</Text>
                  <Text style={styles.actionButtonSubtext}>View this borrower's loans directly</Text>
                </View>
                <Icon name="chevron-right" size={20} color={colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.detailsButton]}
                onPress={handleSeeDetails}
                activeOpacity={0.8}>
                <View style={[styles.actionIconContainer, { backgroundColor: colors.skySoft }]}>
                  <Icon name="info" size={24} color={colors.skyText} />
                </View>
                <View style={styles.actionButtonContent}>
                  <Text style={styles.actionButtonText}>Borrower Profile</Text>
                  <Text style={styles.actionButtonSubtext}>See full borrower information</Text>
                </View>
                <Icon name="chevron-right" size={20} color={colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.addLoanButton]}
                onPress={handleAddLoan}
                activeOpacity={0.8}>
                <View style={[styles.actionIconContainer, { backgroundColor: colors.mintSoft }]}>
                  <Icon name="add-circle" size={24} color={colors.mintText} />
                </View>
                <View style={styles.actionButtonContent}>
                  <Text style={styles.actionButtonText}>Add New Loan</Text>
                  <Text style={styles.actionButtonSubtext}>Create a loan for this borrower</Text>
                </View>
                <Icon name="chevron-right" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.actionModalFooter}>
              <View style={styles.actionModalFooterHandle} />
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
          style={[
            styles.loanListContainer,
            isLender && !hasActivePlan && styles.disabledSection
          ]}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl 
              refreshing={loading} 
              onRefresh={onRefresh}
              enabled={isLender ? hasActivePlan : true}
            />
          }
          showsVerticalScrollIndicator={false}
          scrollEnabled={isLender ? hasActivePlan : true}>
          {borrowers?.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Icon name="people-outline" size={80} color={colors.textMuted} />
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
                  <Icon name="add" size={20} color={colors.white} />
                  <Text style={styles.emptyActionText}>Add Borrower</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <>
            {(borrowers || []).map((borrower, index) => {
              const isHighlighted = highlightedBorrowerId === borrower._id;
              const aadhaarNumber = borrower.aadharCardNo || borrower.aadhaarCardNo || borrower.aadhaarNumber;
              const riskData = aadhaarNumber ? borrowerRiskAssessment[aadhaarNumber] : null;
              const hasRisk = riskData && riskData.riskLevel && riskData.riskLevel.toLowerCase() !== 'low';
              const riskLevel = riskData?.riskLevel?.toLowerCase() || null;
              const riskBadge = riskData?.riskBadge || null;
              const borrowerPendingPayments = getBorrowerPendingPayments(borrower);
              const cardTint = index % 2 === 0 ? colors.skyText : colors.mintText;
              const avatarContent = borrower?.profileImage ? (
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
              );

              return (
                <React.Fragment key={borrower._id || index}>
                  <TouchableOpacity
                    onPress={() => handleBorrowerCardPress(borrower)}
                    activeOpacity={isLender && !hasActivePlan ? 1 : 0.9}
                    disabled={isLender && !hasActivePlan}>
                    <View style={[
                      styles.borrowerCard,
                      isHighlighted && styles.highlightedBorrowerCard,
                      hasRisk && styles.fraudRiskBorrowerCard,
                      borrowerPendingPayments && styles.pendingPaymentBorrowerCard,
                      { borderLeftColor: cardTint }
                    ]}>
                      {/* Status Banners */}
                      {borrowerPendingPayments && (
                        <View style={styles.pendingPaymentBanner}>
                          <Icon name="notifications" size={14} color={colors.white} />
                          <Text style={styles.pendingPaymentBannerText} numberOfLines={1}>
                            {borrowerPendingPayments.count} Pending • {formatCurrency(borrowerPendingPayments.amount)}
                          </Text>
                        </View>
                      )}
                      {hasRisk && !borrowerPendingPayments && riskBadge && (
                        <View style={[
                          styles.fraudBanner,
                          { borderColor: riskBadge.color || colors.error }
                        ]}>
                          <Icon name="warning" size={13} color={riskBadge.color || colors.error} />
                          <Text
                            style={[
                              styles.fraudBannerText,
                              { color: riskBadge.color || colors.error }
                            ]}
                            numberOfLines={1}>
                            {riskBadge.label || riskLevel} Risk Detected
                          </Text>
                        </View>
                      )}

                      {/* Top Row — label + Details pill, mirrors MyLoans' loan card */}
                      {/* Avatar + name + primary contact number */}
                      <View style={styles.cardMainRow}>
                        {borrower.aadharCardNo && borrower.aadharCardNo.length === 12 ? (
                          <View style={styles.avatarReputationRing}>
                            <BorrowerReputationCard
                              aadhaarNumber={borrower.aadharCardNo}
                              compact={true}
                              circle={true}
                              avatarContent={avatarContent}
                            />
                          </View>
                        ) : avatarContent}
                        <View style={styles.userDetails}>
                          <Text style={styles.userName} numberOfLines={1}>
                            {borrower.userName}
                          </Text>
                          <View style={styles.userMeta}>
                            <Icon name="phone" size={12} color={colors.textSecondary} />
                            <Text style={styles.userMobile} numberOfLines={1}>
                              {borrower.mobileNo || 'Not provided'}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.viewButton}>
                          <Icon name="chevron-right" size={20} color={colors.textSecondary} />
                        </View>
                      </View>

                      {/* Reputation Score Card */}
                      {borrower.aadharCardNo && borrower.aadharCardNo.length === 12 && (
                        <View style={styles.reputationSection}>
                          <View style={styles.reputationContainer}>
                            <BorrowerReputationCard
                              aadhaarNumber={borrower.aadharCardNo}
                              compact={true}
                              minimal={true}
                            />
                          </View>
                        </View>
                      )}

                      {/* Footer — pending payment status only */}
                      {borrowerPendingPayments && (
                        <View style={styles.cardFooter}>
                          <View style={styles.pendingPaymentBadge}>
                            <Icon name="schedule" size={12} color={colors.goldDark} />
                            <Text style={styles.pendingPaymentBadgeText}>
                              {borrowerPendingPayments.count} pending
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>

                </React.Fragment>
              );
            })}
            </>
          )}
        </ScrollView>
      )}
      </KeyboardAvoidingView>
      
      {/* Subscription Restriction Overlay */}
      {isLender && !planLoading && !hasActivePlan && (
        <SubscriptionRestriction 
          message="Purchase a plan to view and search borrowers"
          asOverlay={true}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.background,
  },
  // Search Section
  searchSection: {
    backgroundColor: colors.surface,
    paddingHorizontal: m(16),
    paddingTop: m(16),
    paddingBottom: m(12),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: colors.black,
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
    backgroundColor: colors.background,
    borderRadius: m(16),
    paddingHorizontal: m(16),
    borderWidth: 1.5,
    borderColor: colors.border,
    minHeight: m(52),
  },
  searchIcon: {
    marginRight: m(10),
  },
  searchInput: {
    flex: 1,
    fontSize: m(15),
    color: colors.textPrimary,
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
    backgroundColor: colors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(24),
  },
  emptyTitle: {
    fontSize: m(22),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: m(8),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: m(15),
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: m(24),
    lineHeight: m(22),
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navy,
    paddingHorizontal: m(24),
    paddingVertical: m(14),
    borderRadius: m(12),
    gap: m(8),
    elevation: 2,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  emptyActionText: {
    fontSize: m(16),
    fontWeight: '600',
    color: colors.white,
  },
  // Borrower Card — top row (label + Details pill), mirrors MyLoans' loan card
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(10),
  },
  cardLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  cardLabel: {
    fontSize: m(13),
    fontWeight: '700',
    color: colors.inkSoft,
  },
  riskDot: {
    width: m(7),
    height: m(7),
    borderRadius: m(4),
    backgroundColor: colors.error,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: m(18),
    paddingHorizontal: m(10),
    paddingVertical: m(6),
    marginLeft: m(8),
    gap: m(3),
    justifyContent: 'center',
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(10),
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: m(8),
  },
  avatarReputationRing: {
    marginRight: m(12),
  },
  userAvatar: {
    width: m(42),
    height: m(42),
    borderRadius: m(21),
    backgroundColor: colors.navyTint,
  },
  avatarPlaceholder: {
    width: m(42),
    height: m(42),
    borderRadius: m(21),
    backgroundColor: colors.navyTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: m(16),
    fontWeight: '800',
    color: colors.navyDark,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: m(14.5),
    fontFamily: FontFamily.primaryBold,
    color: colors.ink,
    marginBottom: m(4),
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(5),
  },
  userMobile: {
    fontSize: m(11.5),
    fontWeight: '500',
    color: colors.textSecondary,
    flex: 1,
  },
  borrowerDetails: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: m(10),
    paddingVertical: m(8),
    paddingHorizontal: m(10),
    marginBottom: m(10),
    gap: m(6),
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: m(16),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
    flexShrink: 1,
  },
  detailValue: {
    fontSize: m(12.5),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  addressText: {
    fontSize: m(12),
    fontWeight: '500',
    color: colors.textSecondary,
    flex: 1,
  },
  // Borrower Card Styles — flat pastel cards, alternating sky/mint like MyLoans
  borrowerCard: {
    backgroundColor: colors.surface,
    borderRadius: m(16),
    padding: m(14),
    marginBottom: m(14),
    borderWidth: 1,
    borderLeftWidth: m(4),
    borderColor: colors.borderLight,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  reputationSection: {
    paddingTop: m(2),
    marginTop: 0,
    marginBottom: 0,
  },
  reputationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(6),
  },
  reputationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(16),
    backgroundColor: 'rgba(255, 255, 255, 0.56)',
    gap: m(4),
  },
  reputationPillText: {
    fontSize: m(9.5),
    fontWeight: '700',
    color: colors.navy,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  reputationContainer: {
    marginTop: 0,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: m(4),
  },
  highlightedBorrowerCard: {
    borderWidth: 2,
    borderColor: colors.error,
  },
  fraudRiskBorrowerCard: {
    borderWidth: 1.5,
    borderColor: colors.goldDark,
  },
  fraudBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.goldTint,
    borderWidth: 1,
    borderRadius: m(16),
    paddingVertical: m(5),
    paddingHorizontal: m(10),
    marginBottom: m(10),
    gap: m(5),
  },
  fraudBannerText: {
    fontSize: m(11),
    fontWeight: '800',
  },
  pendingPaymentBorrowerCard: {
    borderWidth: 1.5,
    borderColor: colors.butterDark,
  },
  pendingPaymentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.butterDark,
    paddingVertical: m(6),
    paddingHorizontal: m(12),
    marginHorizontal: m(-14),
    marginTop: m(-14),
    marginBottom: m(12),
    gap: m(6),
  },
  pendingPaymentBannerText: {
    color: colors.white,
    fontSize: m(11.5),
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  pendingPaymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.butterSoft,
    borderRadius: m(8),
    paddingHorizontal: m(8),
    paddingVertical: m(4),
    gap: m(4),
    borderWidth: 1,
    borderColor: colors.butter,
  },
  pendingPaymentBadgeText: {
    fontSize: m(10.5),
    fontWeight: '600',
    color: colors.goldDarker,
  },
  // Action Modal Styles
  actionModalContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    alignSelf: 'stretch',
    marginBottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: m(26),
    borderTopRightRadius: m(26),
    padding: m(18),
    paddingTop: m(12),
    paddingBottom: 0,
    maxHeight: '68%',
  },
  modalHandle: {
    width: m(44),
    height: m(4),
    backgroundColor: colors.goldLight,
    borderRadius: m(2),
    alignSelf: 'center',
    marginBottom: m(14),
  },
  actionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(12),
  },
  actionModalTitleBlock: {
    flex: 1,
    paddingRight: m(12),
  },
  actionModalTitle: {
    fontSize: m(20),
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: m(3),
  },
  actionModalSubtitle: {
    fontSize: m(13),
    color: colors.textSecondary,
    fontWeight: '500',
  },
  closeButton: {
    width: m(36),
    height: m(36),
    borderRadius: m(18),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  selectedBorrowerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: m(16),
    padding: m(12),
    borderWidth: 1,
    borderColor: colors.goldLight,
    marginBottom: m(14),
  },
  selectedBorrowerAvatar: {
    width: m(46),
    height: m(46),
    borderRadius: m(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldTint,
    marginRight: m(12),
  },
  selectedBorrowerAvatarText: {
    fontSize: m(18),
    fontWeight: '800',
    color: colors.goldDark,
  },
  selectedBorrowerInfo: {
    flex: 1,
  },
  selectedBorrowerName: {
    fontSize: m(15),
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: m(3),
  },
  selectedBorrowerMeta: {
    fontSize: m(12),
    fontWeight: '500',
    color: colors.textSecondary,
  },
  actionButtonsContainer: {
    gap: m(10),
  },
  actionModalFooter: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingTop: m(12),
    paddingBottom: m(10),
  },
  actionModalFooterHandle: {
    width: m(76),
    height: m(4),
    borderRadius: m(999),
    backgroundColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: m(14),
    borderRadius: m(15),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: m(12),
  },
  historyButton: {
    borderColor: colors.butter,
    backgroundColor: colors.butterSoft,
  },
  detailsButton: {
    borderColor: colors.sky,
    backgroundColor: colors.skySoft,
  },
  addLoanButton: {
    borderColor: colors.mint,
    backgroundColor: colors.mintSoft,
  },
  actionIconContainer: {
    width: m(44),
    height: m(44),
    borderRadius: m(13),
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonContent: {
    flex: 1,
  },
  actionButtonText: {
    fontSize: m(15),
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: m(2),
  },
  actionButtonSubtext: {
    fontSize: m(12),
    color: colors.textSecondary,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledSection: {
    opacity: 0.5,
  },
});

export default Outward;
