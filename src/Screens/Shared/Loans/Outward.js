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
import LoaderSkeleton from '../../../Components/LoaderSkeleton';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';

const Outward = ({ navigation }) => {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const { borrowers, loading: borrowersLoading, error: borrowersError } = useSelector(state => state.borrowers);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedBorrower, setSelectedBorrower] = useState(null);
  const [borrowerActionModalVisible, setBorrowerActionModalVisible] = useState(false);

  const scrollViewRef = React.useRef(null);

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


  // Fetch borrowers on initial mount
  useEffect(() => {
    dispatch(getAllBorrowers());
  }, [dispatch]);

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
            placeholder="Search borrowers..."
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
            borrowers?.map((borrower, index) => (
              <TouchableOpacity
                key={borrower._id || index}
                onPress={() => handleBorrowerCardPress(borrower)}
                activeOpacity={0.9}>
                <View style={styles.borrowerCard}>
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
                        <Text style={styles.userName} numberOfLines={1}>
                          {borrower.userName}
                        </Text>
                        <Text style={styles.userEmail} numberOfLines={1}>
                          {borrower.email || 'N/A'}
                        </Text>
                      </View>
                    </View>
                    <Icon name="chevron-right" size={24} color="#6B7280" />
                  </View>
                  <View style={styles.borrowerDetails}>
                    <View style={styles.detailItem}>
                      <Icon name="phone" size={16} color="#6B7280" />
                      <Text style={styles.detailValue}>
                      {borrower.mobileNo ? borrower.mobileNo : 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Icon name="badge" size={16} color="#6B7280" />
                      <Text style={styles.detailValue}>
                        {borrower.aadharCardNo || 'N/A'}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
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
    marginBottom: m(6),
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: m(46),
    height: m(46),
    borderRadius: m(24),
    marginRight: m(12),
  },
  avatarPlaceholder: {
    width: m(46),
    height: m(46),
    borderRadius: m(24),
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(12),
  },
  avatarText: {
    fontSize: m(18),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: m(17),
    fontWeight: '600',
    color: '#111827',
    marginBottom: m(2),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(6),
  },
  detailValue: {
    fontSize: m(14),
    fontWeight: '500',
    color: '#374151',
    marginLeft: m(10)
    // flex: 1,
  },
  // Borrower Card Styles
  borrowerCard: {
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
  borrowerDetails: {
    flexDirection: 'coloum',
    marginTop: m(12),
    gap: m(8),
  },
  userEmail: {
    fontSize: m(13),
    color: '#6B7280',
    marginTop: m(2),
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
    backgroundColor: '#F9FAFB',
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