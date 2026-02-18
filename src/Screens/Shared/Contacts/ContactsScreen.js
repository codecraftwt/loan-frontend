import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useDispatch, useSelector } from 'react-redux';
import Header from '../../../Components/Header';
import SubscriptionRestriction from '../../../Components/SubscriptionRestriction';
import { useSubscription } from '../../../hooks/useSubscription';
import { lenderLoanAPI } from '../../../Services/lenderLoanService';
import { m } from 'walstar-rn-responsive';
import { FontFamily, FontSizes } from '../../../constants';

const ContactsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const { loading: planLoading } = useSelector(state => state.planPurchase);
  const { hasActivePlan } = useSubscription();
  const isLender = user?.roleId === 1;

  const [borrowers, setBorrowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBorrowers();
  }, []);

  const fetchBorrowers = async () => {
    try {
      setError(null);
      const response = await lenderLoanAPI.getBorrowers();
      
      if (response.success) {
        setBorrowers(response.data || []);
      } else {
        setBorrowers([]);
        setError(response.message || 'Failed to fetch borrowers');
      }
    } catch (err) {
      console.error('Error fetching borrowers:', err);
      setBorrowers([]);
      
      if (err.response?.status === 401) {
        setError('Unauthorized. Please login again.');
      } else if (err.response?.status === 403) {
        setError('Access denied. Only lenders can view contacts.');
      } else if (err.response?.status === 404) {
        setError(null); // No borrowers found is not an error
        setBorrowers([]);
      } else {
        setError(err.response?.data?.message || 'Failed to load contacts. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBorrowers();
  };

  const handleCall = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Phone number is not available');
      return;
    }

    // Clean phone number - remove spaces, dashes, and ensure it starts with + or digits
    const cleanedNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Use telprompt: on iOS to open dialer with confirmation dialog
    // Use tel: on Android to open dialer with number pre-filled
    const phoneUrl = Platform.OS === 'ios' ? `telprompt:${cleanedNumber}` : `tel:${cleanedNumber}`;
    
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          // This will open the phone dialer/keyboard with the number pre-filled
          // User can then press call button to initiate the call
          return Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Error', 'Phone calls are not supported on this device');
        }
      })
      .catch((err) => {
        console.error('Error opening phone dialer:', err);
        Alert.alert('Error', 'Unable to open phone dialer. Please check your device settings.');
      });
  };

  const handleMessage = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Phone number is not available');
      return;
    }

    // Clean phone number - remove spaces, dashes, and ensure it starts with + or digits
    const cleanedNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    const smsUrl = `sms:${cleanedNumber}`;
    
    Linking.canOpenURL(smsUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(smsUrl);
        } else {
          Alert.alert('Error', 'SMS is not supported on this device');
        }
      })
      .catch((err) => {
        console.error('Error opening SMS:', err);
        Alert.alert('Error', 'Unable to send SMS. Please check your device settings.');
      });
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    // Format: +91 XXXXX XXXXX
    if (phone.length === 10) {
      return `${phone.slice(0, 5)} ${phone.slice(5)}`;
    }
    return phone;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const renderBorrowerCard = (borrower, index) => {
    const initials = getInitials(borrower.name);
    const phoneNumber = borrower.mobile_No || '';

    return (
      <View key={index} style={styles.borrowerCard}>
        <View style={styles.borrowerContent}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>

          {/* Name and Phone */}
          <View style={styles.borrowerInfo}>
            <Text style={styles.borrowerName}>{borrower.name || 'Unknown'}</Text>
            <View style={styles.phoneContainer}>
              <Icon name="phone" size={14} color="#666" />
              <Text style={styles.phoneNumber}>{formatPhoneNumber(phoneNumber) || 'N/A'}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {phoneNumber && (
              <>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleCall(phoneNumber)}
                  activeOpacity={0.7}>
                  <Icon name="phone" size={18} color="#27ae60" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleMessage(phoneNumber)}
                  activeOpacity={0.7}>
                  <Icon name="message-circle" size={18} color="#3498db" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Contacts" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6700" />
          <Text style={styles.loadingText}>Loading contacts...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Contacts" showBackButton />
      <ScrollView
        style={[
          styles.scrollView,
          isLender && !planLoading && !hasActivePlan && { opacity: 0.5 },
        ]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={isLender ? (planLoading || hasActivePlan) : true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#ff6700']}
            tintColor="#ff6700"
            enabled={isLender ? (planLoading || hasActivePlan) : true}
          />
        }>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerIconContainer}>
            <Icon name="users" size={32} color="#ff6700" />
          </View>
          <Text style={styles.headerTitle}>Borrower Contacts</Text>
          <Text style={styles.headerSubtitle}>
            {borrowers.length > 0
              ? `${borrowers.length} ${borrowers.length === 1 ? 'contact' : 'contacts'} available`
              : 'No contacts available'}
          </Text>
        </View>

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={48} color="#e74c3c" />
            <Text style={styles.errorTitle}>Error</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchBorrowers}
              activeOpacity={0.7}>
              <Icon name="refresh-cw" size={18} color="#fff" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {!error && borrowers.length === 0 && (
          <View style={styles.emptyContainer}>
            <Icon name="user-x" size={64} color="#bdc3c7" />
            <Text style={styles.emptyTitle}>No Contacts Found</Text>
            <Text style={styles.emptyText}>
              There are no borrower contacts available at the moment.
            </Text>
          </View>
        )}

        {/* Contacts List */}
        {!error && borrowers.length > 0 && (
          <View style={styles.contactsList}>
            {borrowers.map((borrower, index) => renderBorrowerCard(borrower, index))}
          </View>
        )}
      </ScrollView>

      {/* Subscription Restriction Overlay */}
      {isLender && !planLoading && !hasActivePlan && (
        <SubscriptionRestriction
          message="Purchase a plan to view your borrower contacts"
          asOverlay={true}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: m(80),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: m(16),
    fontSize: FontSizes.base,
    color: '#666',
    fontFamily: FontFamily.primaryRegular,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: m(24),
    paddingHorizontal: m(20),
    backgroundColor: '#fff',
    marginHorizontal: m(16),
    marginTop: m(20),
    borderRadius: m(20),
    borderWidth: 0.4,
    borderColor: 'lightgrey',
  },
  headerIconContainer: {
    width: m(64),
    height: m(64),
    borderRadius: m(32),
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(12),
  },
  headerTitle: {
    fontSize: FontSizes['2xl'],
    fontFamily: FontFamily.secondaryBold,
    color: '#2c3e50',
    marginBottom: m(6),
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
    color: '#7f8c8d',
    fontFamily: FontFamily.primaryRegular,
  },
  contactsList: {
    paddingHorizontal: m(16),
    marginTop: m(16),
  },
  borrowerCard: {
    backgroundColor: '#fff',
    borderRadius: m(16),
    marginBottom: m(12),
    padding: m(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 0.4,
    borderColor: '#e0e0e0',
  },
  borrowerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: m(16),
  },
  avatar: {
    width: m(56),
    height: m(56),
    borderRadius: m(28),
    backgroundColor: '#ff6700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.secondaryBold,
  },
  borrowerInfo: {
    flex: 1,
  },
  borrowerName: {
    fontSize: FontSizes.lg,
    fontFamily: FontFamily.secondaryBold,
    color: '#2c3e50',
    marginBottom: m(6),
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  phoneNumber: {
    fontSize: FontSizes.base,
    color: '#7f8c8d',
    fontFamily: FontFamily.primaryRegular,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: m(8),
  },
  actionButton: {
    width: m(40),
    height: m(40),
    borderRadius: m(20),
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: m(40),
    marginHorizontal: m(16),
    marginTop: m(20),
    backgroundColor: '#fff',
    borderRadius: m(20),
    borderWidth: 0.4,
    borderColor: 'lightgrey',
  },
  errorTitle: {
    fontSize: FontSizes.xl,
    fontFamily: FontFamily.secondaryBold,
    color: '#e74c3c',
    marginTop: m(16),
    marginBottom: m(8),
  },
  errorText: {
    fontSize: FontSizes.base,
    color: '#7f8c8d',
    fontFamily: FontFamily.primaryRegular,
    textAlign: 'center',
    marginBottom: m(24),
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6700',
    paddingHorizontal: m(24),
    paddingVertical: m(12),
    borderRadius: m(12),
    gap: m(8),
  },
  retryButtonText: {
    color: '#fff',
    fontSize: FontSizes.base,
    fontFamily: FontFamily.secondaryBold,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: m(60),
    marginHorizontal: m(16),
    marginTop: m(20),
    backgroundColor: '#fff',
    borderRadius: m(20),
    borderWidth: 0.4,
    borderColor: 'lightgrey',
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontFamily: FontFamily.secondaryBold,
    color: '#2c3e50',
    marginTop: m(20),
    marginBottom: m(8),
  },
  emptyText: {
    fontSize: FontSizes.base,
    color: '#7f8c8d',
    fontFamily: FontFamily.primaryRegular,
    textAlign: 'center',
    lineHeight: m(22),
  },
});

export default ContactsScreen;
