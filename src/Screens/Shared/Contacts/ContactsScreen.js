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
import { colors, FontFamily, FontSizes } from '../../../constants';

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
    const cardTint = index % 2 === 0 ? colors.skySoft : colors.mintSoft;

    return (
      <View key={index} style={styles.borrowerCard}>
        <View style={styles.borrowerContent}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: cardTint }]}>
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
                  style={[styles.actionButton, styles.callButton]}
                  onPress={() => handleCall(phoneNumber)}
                  activeOpacity={0.7}>
                  <Icon name="phone" size={18} color={colors.success} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.messageButton]}
                  onPress={() => handleMessage(phoneNumber)}
                  activeOpacity={0.7}>
                  <Icon name="message-circle" size={18} color={colors.info} />
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
            colors={[colors.ink]}
            tintColor={colors.ink}
            enabled={isLender ? (planLoading || hasActivePlan) : true}
          />
        }>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerIconContainer}>
            <Icon name="users" size={26} color={colors.ink} />
          </View>
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle}>Borrower Contacts</Text>
            <Text style={styles.headerSubtitle}>
              {borrowers.length > 0
                ? `${borrowers.length} ${borrowers.length === 1 ? 'contact' : 'contacts'} available`
                : 'No contacts available'}
            </Text>
          </View>
        </View>

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={42} color={colors.error} />
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
            <Icon name="user-x" size={56} color={colors.textMuted} />
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
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: m(16),
    paddingBottom: m(100),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: m(16),
    fontSize: FontSizes.base,
    color: colors.textSecondary,
    fontFamily: FontFamily.bodyRegular,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: m(16),
    backgroundColor: colors.navyFaint,
    borderRadius: m(20),
    borderWidth: 1,
    borderColor: colors.navyBorder,
    marginBottom: m(16),
  },
  headerIconContainer: {
    width: m(52),
    height: m(52),
    borderRadius: m(16),
    backgroundColor: colors.mint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: m(12),
  },
  headerTextBlock: {
    flex: 1,
  },
  headerTitle: {
    fontSize: m(20),
    lineHeight: m(26),
    fontFamily: FontFamily.primaryExtraBold,
    color: colors.ink,
    marginBottom: m(4),
  },
  headerSubtitle: {
    fontSize: m(12),
    lineHeight: m(17),
    color: colors.textSecondary,
    fontFamily: FontFamily.bodyRegular,
  },
  contactsList: {
    gap: m(12),
  },
  borrowerCard: {
    backgroundColor: colors.surface,
    borderRadius: m(18),
    padding: m(14),
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  borrowerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: m(12),
  },
  avatar: {
    width: m(48),
    height: m(48),
    borderRadius: m(15),
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.ink,
    fontSize: m(16),
    lineHeight: m(22),
    fontFamily: FontFamily.primaryExtraBold,
  },
  borrowerInfo: {
    flex: 1,
  },
  borrowerName: {
    fontSize: m(15),
    lineHeight: m(20),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.ink,
    marginBottom: m(5),
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  phoneNumber: {
    fontSize: m(12),
    lineHeight: m(17),
    color: colors.textSecondary,
    fontFamily: FontFamily.bodyRegular,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: m(8),
  },
  actionButton: {
    width: m(38),
    height: m(38),
    borderRadius: m(13),
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButton: {
    backgroundColor: colors.mintSoft,
  },
  messageButton: {
    backgroundColor: colors.skySoft,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: m(34),
    backgroundColor: colors.surface,
    borderRadius: m(20),
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  errorTitle: {
    fontSize: m(18),
    lineHeight: m(24),
    fontFamily: FontFamily.primaryBold,
    color: colors.error,
    marginTop: m(16),
    marginBottom: m(8),
  },
  errorText: {
    fontSize: m(13),
    lineHeight: m(19),
    color: colors.textSecondary,
    fontFamily: FontFamily.bodyRegular,
    textAlign: 'center',
    marginBottom: m(24),
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ink,
    paddingHorizontal: m(24),
    paddingVertical: m(12),
    borderRadius: m(12),
    gap: m(8),
  },
  retryButtonText: {
    color: '#fff',
    fontSize: m(14),
    fontFamily: FontFamily.primarySemiBold,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: m(42),
    backgroundColor: colors.surface,
    borderRadius: m(20),
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyTitle: {
    fontSize: m(18),
    lineHeight: m(24),
    fontFamily: FontFamily.primaryBold,
    color: colors.ink,
    marginTop: m(18),
    marginBottom: m(8),
  },
  emptyText: {
    fontSize: m(13),
    color: colors.textSecondary,
    fontFamily: FontFamily.bodyRegular,
    textAlign: 'center',
    lineHeight: m(19),
  },
});

export default ContactsScreen;
