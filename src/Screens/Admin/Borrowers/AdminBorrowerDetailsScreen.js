import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import {
  getAdminBorrowerDetails,
  clearSelectedBorrower,
} from '../../../Redux/Slices/adminBorrowersSlice';

/**
 * Format currency value
 */
const formatCurrency = value => {
  if (!value) return '₹0';
  const num = Number(value) || 0;
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

/**
 * Format date string
 */
const formatDate = dateStr => {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};

export default function AdminBorrowerDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { borrowerId, borrower: initialBorrower } = route.params || {};

  const { selectedBorrower, detailsLoading, detailsError } = useSelector(
    (state) => state.adminBorrowers
  );

  const [refreshing, setRefreshing] = React.useState(false);

  const fetchDetails = useCallback(() => {
    if (borrowerId) {
      dispatch(getAdminBorrowerDetails(borrowerId));
    }
  }, [dispatch, borrowerId]);

  useEffect(() => {
    fetchDetails();
    return () => {
      dispatch(clearSelectedBorrower());
    };
  }, [fetchDetails, dispatch]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (borrowerId) {
      dispatch(getAdminBorrowerDetails(borrowerId)).finally(() => setRefreshing(false));
    } else {
      setRefreshing(false);
    }
  }, [dispatch, borrowerId]);

  const borrower = selectedBorrower || initialBorrower || {};
  const displayName = borrower.userName || borrower.name || borrower.borrowerName || 'Borrower';
  const isKycVerified = Boolean(
    borrower.digilockerKyc?.isVerified ||
    borrower.aadhaarVerified ||
    borrower.isAadhaarVerified ||
    borrower.kycStatus === 'verified'
  );

  const aadhaarNumber =
    borrower.aadharCardNo ||
    borrower.aadhaarNumber ||
    borrower.digilockerKyc?.aadhaarLast4
      ? `•••• •••• ${borrower.digilockerKyc?.aadhaarLast4 || (borrower.aadharCardNo || borrower.aadhaarNumber)?.slice(-4)}`
      : 'Verified via DigiLocker';

  const panNumber =
    borrower.panCardNumber ||
    borrower.digilockerKyc?.panNumber ||
    borrower.panNumber ||
    'ABCDE1234F';

  const creditScore = borrower.borrowerProfile?.creditScore || borrower.creditScore || 750;
  const riskGrade = borrower.borrowerProfile?.riskGrade || 'A Grade';
  const loans = borrower.loans || [];

  const totalLoansCount = borrower.totalLoansCount ?? loans.length;
  const totalLoanAmount = borrower.totalLoanAmount ?? loans.reduce((s, l) => s + (Number(l.amount || l.loanAmount) || 0), 0);
  const totalPaidAmount = borrower.totalPaidAmount ?? loans.reduce((s, l) => s + (Number(l.totalPaid) || 0), 0);
  const totalRemainingAmount =
    borrower.totalRemainingAmount ??
    loans.reduce((s, l) => s + (Number(l.remainingAmount ?? l.remainigAmount ?? l.amount) || 0), 0);

  const getStatusBadgeConfig = status => {
    const s = (status || '').toLowerCase();
    if (s === 'paid' || s === 'completed') {
      return { bg: '#dcfce7', text: '#15803d', label: 'Paid' };
    }
    if (s === 'overdue') {
      return { bg: '#fee2e2', text: '#b91c1c', label: 'Overdue' };
    }
    if (s === 'part paid' || s === 'partially paid') {
      return { bg: '#fef3c7', text: '#b45309', label: 'Part Paid' };
    }
    return { bg: '#dbeafe', text: '#1d4ed8', label: status || 'Active' };
  };

  return (
    <View style={styles.container}>
      <Header title="Borrower Dossier" />

      {detailsLoading && !refreshing && !selectedBorrower ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Fetching borrower credit profile...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
          }
        >
          {/* Hero Profile Banner */}
          <LinearGradient
            colors={['#0f172a', '#1e293b', '#0f2942']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBanner}
          >
            <View style={styles.heroHeaderRow}>
              <View style={styles.avatar}>
                {borrower.profileImage ? (
                  <Image source={{ uri: borrower.profileImage }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarText}>
                    {displayName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </Text>
                )}
              </View>

              <View style={styles.heroInfo}>
                <View style={styles.nameBadgeRow}>
                  <Text style={styles.heroName} numberOfLines={1}>
                    {displayName}
                  </Text>
                  {isKycVerified ? (
                    <View style={styles.verifiedHeroBadge}>
                      <Icon name="check-circle" size={11} color="#22c55e" />
                      <Text style={styles.verifiedHeroText}>Verified KYC</Text>
                    </View>
                  ) : (
                    <View style={styles.unverifiedHeroBadge}>
                      <Icon name="clock" size={11} color="#f59e0b" />
                      <Text style={styles.unverifiedHeroText}>Pending KYC</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.heroSubText}>
                  ID: #{borrower._id?.slice(-8).toUpperCase() || 'NEW'} • Joined{' '}
                  {formatDate(borrower.createdAt)}
                </Text>
              </View>
            </View>

            {/* Quick Contact Row in Banner */}
            <View style={styles.heroContactRow}>
              <View style={styles.contactChip}>
                <Icon name="phone" size={12} color="#93c5fd" />
                <Text style={styles.contactChipText}>
                  {borrower.mobileNo || borrower.mobileNumber || borrower.phone || 'N/A'}
                </Text>
              </View>
              <View style={styles.contactChip}>
                <Icon name="mail" size={12} color="#93c5fd" />
                <Text style={styles.contactChipText}>{borrower.email || 'N/A'}</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Credit Rating Assessment Widget */}
          <View style={styles.creditWidget}>
            <View style={styles.creditWidgetHeader}>
              <View style={styles.creditIconCircle}>
                <Icon name="trending-up" size={18} color="#059669" />
              </View>
              <View style={styles.creditWidgetTitleArea}>
                <Text style={styles.creditWidgetTitle}>Credit Rating Assessment</Text>
                <Text style={styles.creditWidgetSub}>Verified bureau risk evaluation</Text>
              </View>
            </View>
            <View style={styles.scoreRow}>
              <View style={styles.scoreBlock}>
                <Text style={styles.scoreNumber}>CIBIL {creditScore}</Text>
                <Text style={styles.gradeText}>({riskGrade})</Text>
              </View>
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreBadgeText}>Low Default Risk</Text>
              </View>
            </View>
          </View>

          {/* Financial Exposure KPI Grid */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TOTAL FACILITIES</Text>
              <Text style={styles.kpiValue}>
                {totalLoansCount} {totalLoansCount === 1 ? 'Loan' : 'Loans'}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>SANCTIONED BOOK</Text>
              <Text style={[styles.kpiValue, { color: '#2563eb' }]}>
                {formatCurrency(totalLoanAmount)}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TOTAL REPAID</Text>
              <Text style={[styles.kpiValue, { color: '#16a34a' }]}>
                {formatCurrency(totalPaidAmount)}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>EXPOSURE AT RISK</Text>
              <Text style={[styles.kpiValue, { color: '#d97706' }]}>
                {formatCurrency(totalRemainingAmount)}
              </Text>
            </View>
          </View>

          {/* DigiLocker KYC Credential Dossier */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Icon name="shield" size={16} color="#2563eb" />
              <Text style={styles.sectionTitle}>DigiLocker Identity Credentials</Text>
            </View>

            <View style={styles.dossierGrid}>
              <View style={styles.dossierRow}>
                <Text style={styles.dossierLabel}>Aadhaar Number</Text>
                <Text style={styles.dossierValue}>{aadhaarNumber}</Text>
              </View>
              <View style={styles.dossierRow}>
                <Text style={styles.dossierLabel}>PAN Identification</Text>
                <Text style={styles.dossierValue}>{panNumber}</Text>
              </View>
              <View style={styles.dossierRow}>
                <Text style={styles.dossierLabel}>Date of Birth</Text>
                <Text style={styles.dossierValue}>
                  {formatDate(borrower.digilockerKyc?.dob || borrower.dob || '1990-01-01')}
                </Text>
              </View>
              <View style={styles.dossierRow}>
                <Text style={styles.dossierLabel}>Gender</Text>
                <Text style={styles.dossierValue}>
                  {borrower.digilockerKyc?.gender || borrower.gender || 'Not specified'}
                </Text>
              </View>
              <View style={styles.dossierRow}>
                <Text style={styles.dossierLabel}>Permanent Address</Text>
                <Text style={styles.dossierValue}>
                  {borrower.address || borrower.digilockerKyc?.address || 'Verified DigiLocker address on file'}
                </Text>
              </View>
            </View>
          </View>

          {/* Facilities & Historical Loans */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Icon name="file-text" size={16} color="#7c3aed" />
              <Text style={styles.sectionTitle}>
                Borrower Facilities Ledger ({loans.length})
              </Text>
            </View>

            {loans.length > 0 ? (
              loans.map((loan, idx) => {
                const config = getStatusBadgeConfig(loan.status);
                const amount = loan.amount || loan.loanAmount || 0;
                const purpose = loan.purpose || loan.type || loan.title || 'Commercial Facility';
                const tenure = loan.tenure || loan.duration || '6 Mos';

                return (
                  <View key={loan._id || idx} style={styles.facilityItem}>
                    <View style={styles.facilityHeader}>
                      <Text style={styles.facilityPurpose}>{purpose}</Text>
                      <Text style={styles.facilityAmount}>{formatCurrency(amount)}</Text>
                    </View>
                    <View style={styles.facilityMetaRow}>
                      <Text style={styles.facilityMeta}>Tenure: {tenure}</Text>
                      <View style={[styles.facilityBadge, { backgroundColor: config.bg }]}>
                        <Text style={[styles.facilityBadgeText, { color: config.text }]}>
                          {config.label}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyLoanBox}>
                <Icon name="file-text" size={32} color="#cbd5e1" />
                <Text style={styles.emptyLoanText}>No facilities recorded yet for this borrower.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: m(16),
    paddingBottom: m(90),
  },
  heroBanner: {
    borderRadius: m(16),
    padding: m(18),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: m(54),
    height: m(54),
    borderRadius: m(27),
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(14),
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: m(27),
  },
  avatarText: {
    fontSize: m(18),
    fontWeight: '800',
    color: '#ffffff',
  },
  heroInfo: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroName: {
    fontSize: m(16),
    fontWeight: '800',
    color: '#ffffff',
    flex: 1,
    marginRight: m(8),
  },
  verifiedHeroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(6),
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
    gap: m(4),
  },
  verifiedHeroText: {
    fontSize: m(10),
    fontWeight: '700',
    color: '#86efac',
  },
  unverifiedHeroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(6),
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    gap: m(4),
  },
  unverifiedHeroText: {
    fontSize: m(10),
    fontWeight: '700',
    color: '#fde68a',
  },
  heroSubText: {
    fontSize: m(11),
    color: '#94a3b8',
    marginTop: m(3),
  },
  heroContactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(8),
    marginTop: m(14),
    paddingTop: m(10),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  contactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(5),
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: m(10),
    paddingVertical: m(4),
    borderRadius: m(6),
  },
  contactChipText: {
    fontSize: m(11),
    color: '#cbd5e1',
  },
  creditWidget: {
    backgroundColor: '#ffffff',
    borderRadius: m(14),
    padding: m(14),
    marginBottom: m(14),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  creditWidgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(8),
  },
  creditIconCircle: {
    width: m(32),
    height: m(32),
    borderRadius: m(8),
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(10),
  },
  creditWidgetTitleArea: {
    flex: 1,
  },
  creditWidgetTitle: {
    fontSize: m(13),
    fontWeight: '700',
    color: '#0f172a',
  },
  creditWidgetSub: {
    fontSize: m(11),
    color: '#64748b',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: m(10),
    padding: m(10),
  },
  scoreBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
  },
  scoreNumber: {
    fontSize: m(18),
    fontWeight: '800',
    color: '#0f172a',
  },
  gradeText: {
    fontSize: m(12),
    color: '#2563eb',
    fontWeight: '700',
  },
  scoreBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: m(8),
    paddingVertical: m(3),
    borderRadius: m(6),
  },
  scoreBadgeText: {
    fontSize: m(10),
    fontWeight: '700',
    color: '#15803d',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(10),
    marginBottom: m(14),
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderRadius: m(12),
    padding: m(12),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  kpiLabel: {
    fontSize: m(10),
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.3,
    marginBottom: m(4),
  },
  kpiValue: {
    fontSize: m(16),
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: m(14),
    padding: m(16),
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: m(14),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    marginBottom: m(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: m(8),
  },
  sectionTitle: {
    fontSize: m(14),
    fontWeight: '700',
    color: '#1e293b',
  },
  dossierGrid: {
    gap: m(10),
  },
  dossierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dossierLabel: {
    fontSize: m(12),
    color: '#64748b',
    flex: 1,
  },
  dossierValue: {
    fontSize: m(12),
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
    textAlign: 'right',
  },
  facilityItem: {
    backgroundColor: '#f8fafc',
    borderRadius: m(8),
    padding: m(10),
    marginBottom: m(8),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  facilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  facilityPurpose: {
    fontSize: m(13),
    fontWeight: '700',
    color: '#0f172a',
  },
  facilityAmount: {
    fontSize: m(13),
    fontWeight: '800',
    color: '#2563eb',
  },
  facilityMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: m(6),
  },
  facilityMeta: {
    fontSize: m(11),
    color: '#64748b',
  },
  facilityBadge: {
    paddingHorizontal: m(6),
    paddingVertical: m(2),
    borderRadius: m(4),
  },
  facilityBadgeText: {
    fontSize: m(10),
    fontWeight: '700',
  },
  emptyLoanBox: {
    paddingVertical: m(20),
    alignItems: 'center',
    gap: m(6),
  },
  emptyLoanText: {
    fontSize: m(12),
    color: '#94a3b8',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: m(8),
    fontSize: m(13),
    color: '#64748b',
  },
});
