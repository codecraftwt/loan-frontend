import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { useSelector, useDispatch } from 'react-redux';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import { getBorrowerLoans } from '../../../Redux/Slices/borrowerLoanSlice';
import { FontFamily, colors } from '../../../constants';
import borrowerLoanAPI from '../../../Services/borrowerLoanService';
import PinVerificationModal from '../../../Components/PinVerificationModal';
import Toast from 'react-native-toast-message';
import { baseurl } from '../../../Utils/API';

const formatCurrency = value => {
  if (!value) return '0';
  const num = Number(value) || 0;
  return num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

export default function PendingLoanOffersScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);

  const [pendingLoanOffers, setPendingLoanOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [proofViewerVisible, setProofViewerVisible] = useState(false);
  const [selectedProofUrl, setSelectedProofUrl] = useState(null);

  const fetchPendingLoanOffers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await borrowerLoanAPI.getPendingLoanOffers(user?._id);
      const offers =
        Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.data?.loans)
              ? response.data.loans
              : Array.isArray(response?.loans)
                ? response.loans
                : [];

      setPendingLoanOffers(offers);
    } catch (error) {
      console.error('Error fetching pending loan offers:', error);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useFocusEffect(
    useCallback(() => {
      if (user?._id) {
        fetchPendingLoanOffers();
      }
    }, [user?._id, fetchPendingLoanOffers]),
  );

  const getProofUrl = proof => {
    if (!proof) return null;
    if (proof.startsWith('http://') || proof.startsWith('https://')) {
      return proof;
    }

    const apiRoot = baseurl.replace('/api', '').replace(/\/$/, '');
    const proofPath = proof.startsWith('/') ? proof.substring(1) : proof;
    return `${apiRoot}/${proofPath}`;
  };

  const handleViewOfferProof = loan => {
    const proofUrl = getProofUrl(loan?.proof);
    if (!proofUrl) {
      Toast.show({
        type: 'info',
        position: 'top',
        text1: 'No Proof Provided',
        text2: 'The lender has not uploaded proof for this offer.',
      });
      return;
    }

    setSelectedProofUrl(proofUrl);
    setProofViewerVisible(true);
  };

  const handleAcceptLoanOffer = loan => {
    setSelectedLoan(loan);
    setPinModalVisible(true);
  };

  const handlePinVerifySuccess = async pinCode => {
    if (!selectedLoan?._id) {
      throw new Error('No loan selected');
    }

    const response = await borrowerLoanAPI.acceptLoan(selectedLoan._id, pinCode);

    if (response?.success) {
      setPinModalVisible(false);
      setSelectedLoan(null);

      Toast.show({
        type: 'success',
        position: 'top',
        text1: 'Loan Accepted',
        text2: 'The lender offer has been accepted successfully.',
      });

      await fetchPendingLoanOffers();
      if (user?._id) {
        dispatch(getBorrowerLoans({ borrowerId: user._id }));
      }

      return response;
    }

    throw new Error(response?.message || 'Failed to accept loan');
  };

  const handleForgotPin = () => {
    setPinModalVisible(false);
    setSelectedLoan(null);
    navigation.navigate('ForgotPin');
  };

  const handleCloseProofViewer = () => {
    setProofViewerVisible(false);
    setSelectedProofUrl(null);
  };

  const getLoanDurationDays = loan => {
    if (!loan?.loanStartDate || !loan?.loanEndDate) {
      return 'N/A';
    }

    const start = new Date(loan.loanStartDate);
    const end = new Date(loan.loanEndDate);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? `${diff} days` : 'N/A';
  };

  const getLenderName = loan => (
    loan?.lenderName || loan?.lenderId?.userName || 'Unknown Lender'
  );

  const getLenderContact = loan => (
    loan?.lenderId?.mobileNo || loan?.mobileNumber || 'Contact unavailable'
  );

  const getLoanDueDate = loan => (
    loan?.loanEndDate ? new Date(loan.loanEndDate).toLocaleDateString() : 'N/A'
  );

  const renderPendingOffer = ({ item }) => (
    <View style={styles.offerCard}>
      <View style={styles.offerCardAccent} />
      <View style={styles.offerCardHeader}>
        <View style={styles.offerLenderAvatar}>
          <Text style={styles.offerLenderAvatarText}>
            {getLenderName(item).charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.offerLenderInfo}>
          <Text style={styles.offerLenderName} numberOfLines={1}>
            {getLenderName(item)}
          </Text>
          <Text style={styles.offerLenderMeta} numberOfLines={1}>
            {getLenderContact(item)}
          </Text>
        </View>
        <View style={styles.offerStatusPill}>
          <Icon name="clock" size={11} color={colors.butterDark} />
          <Text style={styles.offerStatusText}>Pending</Text>
        </View>
      </View>

      <View style={styles.offerAmountPanel}>
        <View>
          <Text style={styles.offerAmountLabel}>Offered Amount</Text>
          <Text style={styles.offerAmountValue}>
            Rs {formatCurrency(item.amount)}
          </Text>
          <Text style={styles.offerAmountHint}>Ready for borrower confirmation</Text>
        </View>
        <View style={styles.offerAmountIcon}>
          <Icon name="trending-up" size={14} color={colors.white} />
        </View>
      </View>

      <View style={styles.offerSummaryGrid}>
        <View style={styles.offerSummaryItem}>
          <Text style={styles.offerSummaryLabel}>Duration</Text>
          <Text style={styles.offerSummaryValue}>{getLoanDurationDays(item)}</Text>
        </View>
        <View style={styles.offerSummaryItem}>
          <Text style={styles.offerSummaryLabel}>Due Date</Text>
          <Text style={styles.offerSummaryValue}>{getLoanDueDate(item)}</Text>
        </View>
      </View>

      <View style={styles.offerDetailsGrid}>
        <View style={styles.offerDetailItem}>
          <Icon name="file-text" size={12} color={colors.ink} />
          <Text style={styles.offerDetailText} numberOfLines={1}>
            {item.purpose || 'No purpose added'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.offerDetailItem}
          onPress={() => handleViewOfferProof(item)}
          activeOpacity={0.8}>
          <Icon
            name={item.proof ? 'image' : 'help-circle'}
            size={12}
            color={item.proof ? colors.ink : colors.error}
          />
          <Text
            style={[
              styles.offerDetailText,
              !item.proof && { color: colors.butterDark },
            ]}
            numberOfLines={1}>
            {item.proof ? 'View lender proof' : 'No proof uploaded'}
          </Text>
          {item.proof && <Icon name="eye" size={12} color={colors.ink} />}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => handleAcceptLoanOffer(item)}
        activeOpacity={0.85}>
        <View style={styles.offerAcceptButton}>
          <Text style={styles.offerAcceptButtonText}>Accept with PIN</Text>
          <Icon name="lock" size={12} color={colors.ink} />
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Pending Offers" showBackButton showLogo={false} />

      <FlatList
        data={pendingLoanOffers}
        keyExtractor={(item, index) => item._id || `offer-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={fetchPendingLoanOffers}
        ListHeaderComponent={
          <View style={styles.offersHeaderCard}>
            <View style={styles.offersHeaderIcon}>
              <Icon name="gift" size={22} color={colors.ink} />
            </View>
            <View style={styles.offersHeaderTitleWrap}>
              <Text style={styles.offersHeaderTitle}>Pending Loan Offers</Text>
              <Text style={styles.offersHeaderSubtitle}>
                Review proof, summary, and accept in one place
              </Text>
            </View>
            <View style={styles.offersCountBadge}>
              <Text style={styles.offersCountText}>{pendingLoanOffers.length}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.offersEmptyState}>
              <View style={styles.offersEmptyIcon}>
                <Icon name="gift" size={28} color={colors.butterDark} />
              </View>
              <Text style={styles.offersEmptyTitle}>No Pending Offers</Text>
              <Text style={styles.offersEmptyText}>
                New loan offers from lenders will appear here.
              </Text>
            </View>
          )
        }
        renderItem={renderPendingOffer}
      />

      <Modal
        visible={proofViewerVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseProofViewer}>
        <View style={styles.proofViewerOverlay}>
          <View style={styles.proofViewerHeader}>
            <Text style={styles.proofViewerHeaderText}>Lender Proof</Text>
            <TouchableOpacity
              style={styles.proofViewerCloseButton}
              onPress={handleCloseProofViewer}>
              <Icon name="x" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.proofViewerScrollContent}>
            {selectedProofUrl && (
              <Image
                source={{ uri: selectedProofUrl }}
                style={styles.proofViewerImage}
                resizeMode="contain"
              />
            )}
          </ScrollView>
        </View>
      </Modal>

      <PinVerificationModal
        visible={pinModalVisible}
        loanId={selectedLoan?._id}
        lenderName={getLenderName(selectedLoan)}
        loanAmount={selectedLoan?.amount}
        onVerifySuccess={handlePinVerifySuccess}
        onForgotPin={handleForgotPin}
        onClose={() => {
          setPinModalVisible(false);
          setSelectedLoan(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  listContent: {
    padding: m(16),
    paddingBottom: m(140),
  },

  offersHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(16),
    gap: m(10),
    borderRadius: m(18),
    padding: m(12),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  offersHeaderIcon: {
    width: m(42),
    height: m(42),
    borderRadius: m(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.butterSoft,
  },
  offersHeaderTitleWrap: {
    flex: 1,
  },
  offersHeaderTitle: {
    fontSize: m(18),
    lineHeight: m(24),
    fontFamily: FontFamily.primaryBold,
    color: colors.ink,
  },
  offersHeaderSubtitle: {
    marginTop: m(3),
    fontSize: m(12),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
  },
  offersCountBadge: {
    minWidth: m(34),
    height: m(34),
    borderRadius: m(17),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.offWhite,
  },
  offersCountText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryBold,
    color: colors.ink,
  },

  offersEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(48),
    paddingHorizontal: m(18),
  },
  offersEmptyIcon: {
    width: m(58),
    height: m(58),
    borderRadius: m(18),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.butterSoft,
    marginBottom: m(12),
  },
  offersEmptyTitle: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: colors.ink,
    marginBottom: m(5),
  },
  offersEmptyText: {
    fontSize: m(13),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: m(18),
  },

  offerCard: {
    backgroundColor: colors.surface,
    borderRadius: m(14),
    padding: m(10),
    marginBottom: m(8),
    borderWidth: 1,
    borderColor: colors.borderLight,
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  offerCardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: m(3),
    backgroundColor: colors.butter,
  },
  offerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(6),
  },
  offerLenderAvatar: {
    width: m(32),
    height: m(32),
    borderRadius: m(10),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
    marginRight: m(8),
  },
  offerLenderAvatarText: {
    fontSize: m(12),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  offerLenderInfo: {
    flex: 1,
  },
  offerLenderName: {
    fontSize: m(12),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.ink,
  },
  offerLenderMeta: {
    marginTop: m(1),
    fontSize: m(10),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
  },
  offerStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(3),
    paddingHorizontal: m(6),
    paddingVertical: m(3),
    borderRadius: m(999),
    backgroundColor: colors.butterSoft,
  },
  offerStatusText: {
    fontSize: m(9),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.butterDark,
  },
  offerAmountPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: m(12),
    padding: m(9),
    marginBottom: m(8),
    backgroundColor: colors.offWhite,
  },
  offerAmountLabel: {
    fontSize: m(9),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.textSecondary,
    marginBottom: m(2),
  },
  offerAmountValue: {
    fontSize: m(16),
    fontFamily: FontFamily.primaryBold,
    color: colors.ink,
  },
  offerAmountHint: {
    marginTop: m(2),
    fontSize: m(9),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
  },
  offerAmountIcon: {
    width: m(30),
    height: m(30),
    borderRadius: m(10),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  offerSummaryGrid: {
    flexDirection: 'row',
    gap: m(6),
    marginBottom: m(6),
  },
  offerSummaryItem: {
    flex: 1,
    borderRadius: m(8),
    padding: m(6),
    backgroundColor: colors.offWhite,
  },
  offerSummaryLabel: {
    fontSize: m(9),
    fontFamily: FontFamily.primaryRegular,
    color: colors.textSecondary,
    marginBottom: m(1),
  },
  offerSummaryValue: {
    fontSize: m(11),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.ink,
  },
  offerDetailsGrid: {
    gap: m(5),
    marginBottom: m(7),
  },
  offerDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: m(8),
    paddingHorizontal: m(7),
    paddingVertical: m(6),
    gap: m(5),
    backgroundColor: colors.offWhite,
  },
  offerDetailText: {
    flex: 1,
    fontSize: m(10),
    fontFamily: FontFamily.primaryRegular,
    color: colors.inkSoft,
  },
  offerAcceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: m(10),
    paddingVertical: m(8),
    gap: m(5),
    backgroundColor: colors.butter,
  },
  offerAcceptButtonText: {
    fontSize: m(12),
    fontFamily: FontFamily.primarySemiBold,
    color: colors.ink,
  },

  proofViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  proofViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: m(16),
    paddingTop: m(40),
    paddingBottom: m(14),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
  },
  proofViewerHeaderText: {
    fontSize: m(18),
    lineHeight: m(24),
    fontFamily: FontFamily.primaryBold,
    color: colors.white,
  },
  proofViewerCloseButton: {
    padding: m(8),
  },
  proofViewerScrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: m(18),
  },
  proofViewerImage: {
    width: '100%',
    height: m(520),
    borderRadius: m(8),
  },
});
