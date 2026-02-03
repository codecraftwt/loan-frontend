import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { m } from 'walstar-rn-responsive';
import { reputationAPI } from '../Services/reputationService';

const BorrowerReputationCard = ({ aadhaarNumber, compact = false }) => {
  const [reputation, setReputation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchReputation = async () => {
      if (!aadhaarNumber || aadhaarNumber.length !== 12) {
        setLoading(false);
        setError('Invalid Aadhaar number');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await reputationAPI.getBorrowerReputation(aadhaarNumber);
        
        if (result.success && result.data) {
          setReputation(result.data);
        } else {
          setError(result.error || 'Failed to fetch reputation');
        }
      } catch (err) {
        console.error('Error fetching reputation:', err);
        setError('Failed to load reputation');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we have a valid aadhaar number
    if (aadhaarNumber && aadhaarNumber.length === 12) {
      fetchReputation();
    }
  }, [aadhaarNumber]);

  // Get reputation level color
  const getReputationColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'excellent':
        return '#10B981'; 
      case 'good':
        return '#3B82F6';
      case 'fair':
        return '#F59E0B';
      case 'below average':
        return '#F97316';
      case 'poor':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  // Get reputation level icon
  const getReputationIcon = (level) => {
    switch (level?.toLowerCase()) {
      case 'excellent':
        return 'star';
      case 'good':
        return 'check-circle';
      case 'fair':
        return 'info';
      case 'below average':
        return 'warning';
      case 'poor':
        return 'error';
      default:
        return 'help';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, compact && styles.compactContainer]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading reputation...</Text>
        </View>
      </View>
    );
  }

  if (error || !reputation) {
    // Show a subtle card indicating no reputation data available
    if (compact) {
      return null;
    }
    return (
      <View style={[styles.container, styles.noDataContainer]}>
        <View style={styles.noDataContent}>
          <View style={[styles.iconContainer, { backgroundColor: '#F3F4F6' }]}>
            <Icon name="info" size={24} color="#9CA3AF" />
          </View>
          <View style={styles.noDataTextContainer}>
            <Text style={styles.noDataTitle}>No Reputation Data</Text>
            <Text style={styles.noDataSubtitle}>
              {error === 'No loan history available for this borrower' 
                ? 'This borrower has no previous loan history.'
                : 'Reputation score will be available once the borrower has loan history.'}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const { reputationScore, reputationLevel, reputationColor, metrics, breakdown } = reputation;
  const color = reputationColor || getReputationColor(reputationLevel) || '#6B7280';

  // Compact view for borrower cards
  if (compact) {
    return (
      <View style={[styles.compactCard, { borderColor: color + '40' }]}>
        <View style={styles.compactHeader}>
          <View style={[styles.compactIconContainer, { backgroundColor: color + '20' }]}>
            <Icon name={getReputationIcon(reputationLevel)} size={16} color={color} />
          </View>
          <View style={styles.compactScoreContainer}>
            <Text style={[styles.compactScore, { color }]}>
              {reputationScore.toFixed(1)}
            </Text>
            <Text style={styles.compactMax}>/ 100</Text>
          </View>
          <View style={[styles.compactBadge, { backgroundColor: color }]}>
            <Text style={styles.compactBadgeText}>{reputationLevel}</Text>
          </View>
        </View>
      </View>
    );
  }

  // Full view
  return (
    <View style={[styles.container, { borderColor: color + '30' }]}>
      {/* Header Banner */}
      <View style={[styles.headerBanner, { backgroundColor: color + '10' }]}>
        <View style={styles.headerBannerContent}>
          <View style={[styles.headerIconWrapper, { backgroundColor: color + '20' }]}>
            <Icon name={getReputationIcon(reputationLevel)} size={28} color={color} />
          </View>
          <View style={styles.headerTitleSection}>
            <Text style={styles.headerTitle}>Reputation Score</Text>
            <Text style={styles.headerSubtitle}>Borrower Reliability Index</Text>
          </View>
        </View>
        <View style={[styles.levelBadge, { backgroundColor: color }]}>
          <Icon name={getReputationIcon(reputationLevel)} size={14} color="#FFFFFF" />
          <Text style={styles.levelBadgeText}>{reputationLevel}</Text>
        </View>
      </View>

      {/* Score Display Card */}
      <View style={styles.scoreCard}>
        <View style={[styles.scoreRing, { borderColor: color }]}>
          <View style={[styles.scoreInnerRing, { borderColor: color + '30' }]}>
            <Text style={[styles.scoreNumber, { color }]}>
              {reputationScore.toFixed(0)}
            </Text>
            <Text style={styles.scoreOutOf}>out of 100</Text>
          </View>
        </View>
        <View style={styles.scoreInfo}>
          <View style={styles.scoreInfoRow}>
            <Icon name="trending-up" size={16} color={color} />
            <Text style={[styles.scoreInfoText, { color }]}>
              {reputationLevel} Standing
            </Text>
          </View>
          <Text style={styles.scoreDescription}>
            Based on payment history and loan performance
          </Text>
        </View>
      </View>

      {/* Metrics Section */}
      <View style={styles.metricsSection}>
        <View style={styles.metricsSectionHeader}>
          <Icon name="insights" size={18} color="#374151" />
          <Text style={styles.metricsSectionTitle}>Loan Statistics</Text>
        </View>

        {/* First Row - Main Stats */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: '#EFF6FF' }]}>
            <View style={[styles.metricCardIcon, { backgroundColor: '#DBEAFE' }]}>
              <Icon name="description" size={20} color="#3B82F6" />
            </View>
            <Text style={[styles.metricCardValue, { color: '#1E40AF' }]}>
              {metrics.totalLoans || 0}
            </Text>
            <Text style={styles.metricCardLabel}>Total Loans</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: '#ECFDF5' }]}>
            <View style={[styles.metricCardIcon, { backgroundColor: '#D1FAE5' }]}>
              <Icon name="check-circle" size={20} color="#10B981" />
            </View>
            <Text style={[styles.metricCardValue, { color: '#065F46' }]}>
              {metrics.totalPaidLoans || 0}
            </Text>
            <Text style={styles.metricCardLabel}>Paid</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: '#FFF7ED' }]}>
            <View style={[styles.metricCardIcon, { backgroundColor: '#FED7AA' }]}>
              <Icon name="pending" size={20} color="#F59E0B" />
            </View>
            <Text style={[styles.metricCardValue, { color: '#92400E' }]}>
              {metrics.totalPendingLoans || 0}
            </Text>
            <Text style={styles.metricCardLabel}>Pending</Text>
          </View>
        </View>

        {/* Second Row - Additional Stats */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: '#FEF3C7' }]}>
            <View style={[styles.metricCardIcon, { backgroundColor: '#FDE68A' }]}>
              <Icon name="schedule" size={20} color="#D97706" />
            </View>
            <Text style={[styles.metricCardValue, { color: '#92400E' }]}>
              {metrics.totalPartPaidLoans || 0}
            </Text>
            <Text style={styles.metricCardLabel}>Part Paid</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: '#FEE2E2' }]}>
            <View style={[styles.metricCardIcon, { backgroundColor: '#FECACA' }]}>
              <Icon name="error" size={20} color="#EF4444" />
            </View>
            <Text style={[styles.metricCardValue, { color: '#991B1B' }]}>
              {metrics.overdueLoans || 0}
            </Text>
            <Text style={styles.metricCardLabel}>Overdue</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: '#F0FDF4' }]}>
            <View style={[styles.metricCardIcon, { backgroundColor: '#BBF7D0' }]}>
              <Icon name="access-time" size={20} color="#22C55E" />
            </View>
            <Text style={[styles.metricCardValue, { color: '#166534' }]}>
              {metrics.onTimePaymentRate || 0}%
            </Text>
            <Text style={styles.metricCardLabel}>On-time</Text>
          </View>
        </View>

        {/* Overdue Days Alert */}
        {metrics.averageOverdueDays > 0 && (
          <View style={styles.overdueAlert}>
            <View style={styles.overdueAlertIcon}>
              <Icon name="warning" size={18} color="#DC2626" />
            </View>
            <View style={styles.overdueAlertContent}>
              <Text style={styles.overdueAlertLabel}>Average Overdue</Text>
              <Text style={styles.overdueAlertValue}>
                {metrics.averageOverdueDays} days
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Expandable Breakdown Section */}
      {breakdown && (
        <View style={styles.breakdownSection}>
          <TouchableOpacity
            style={[
              styles.expandToggle,
              expanded && styles.expandToggleActive
            ]}
            onPress={() => setExpanded(!expanded)}
            activeOpacity={0.7}>
            <View style={styles.expandToggleLeft}>
              <View style={[styles.expandToggleIcon, expanded && styles.expandToggleIconActive]}>
                <Icon name="analytics" size={18} color={expanded ? '#FFFFFF' : '#6B7280'} />
              </View>
              <Text style={[styles.expandToggleText, expanded && styles.expandToggleTextActive]}>
                Score Breakdown
              </Text>
            </View>
            <View style={[styles.expandChevron, expanded && styles.expandChevronActive]}>
              <Icon
                name={expanded ? 'expand-less' : 'expand-more'}
                size={22}
                color={expanded ? '#FFFFFF' : '#6B7280'}
              />
            </View>
          </TouchableOpacity>

          {expanded && (
            <View style={styles.breakdownContent}>
              {/* Positive Scores */}
              <View style={styles.breakdownGroup}>
                <View style={styles.breakdownGroupHeader}>
                  <Icon name="add-circle" size={16} color="#10B981" />
                  <Text style={styles.breakdownGroupTitle}>Positive Factors</Text>
                </View>
                <BreakdownItem
                  label="On-time Payments"
                  value={breakdown.onTimeScore}
                  max={40}
                  color="#10B981"
                  icon="schedule"
                />
                <BreakdownItem
                  label="Paid Loans"
                  value={breakdown.paidLoansScore}
                  max={30}
                  color="#10B981"
                  icon="check-circle"
                />
                <BreakdownItem
                  label="Part Paid Loans"
                  value={breakdown.partPaidScore}
                  max={10}
                  color="#F59E0B"
                  icon="timelapse"
                />
              </View>

              {/* Penalties (if any) */}
              {(breakdown.overduePenalty < 0 || breakdown.overdueDaysPenalty < 0 || breakdown.pendingPenalty < 0) && (
                <View style={styles.breakdownGroup}>
                  <View style={styles.breakdownGroupHeader}>
                    <Icon name="remove-circle" size={16} color="#EF4444" />
                    <Text style={[styles.breakdownGroupTitle, { color: '#DC2626' }]}>Penalties</Text>
                  </View>
                  {breakdown.overduePenalty < 0 && (
                    <BreakdownItem
                      label="Overdue Penalty"
                      value={breakdown.overduePenalty}
                      max={0}
                      color="#EF4444"
                      icon="error"
                      isPenalty
                    />
                  )}
                  {breakdown.overdueDaysPenalty < 0 && (
                    <BreakdownItem
                      label="Overdue Days Penalty"
                      value={breakdown.overdueDaysPenalty}
                      max={0}
                      color="#EF4444"
                      icon="event-busy"
                      isPenalty
                    />
                  )}
                  {breakdown.pendingPenalty < 0 && (
                    <BreakdownItem
                      label="Pending Penalty"
                      value={breakdown.pendingPenalty}
                      max={0}
                      color="#F59E0B"
                      icon="pending-actions"
                      isPenalty
                    />
                  )}
                </View>
              )}

              {/* Final Score Summary */}
              <View style={[styles.finalScoreCard, { backgroundColor: color + '15', borderColor: color + '30' }]}>
                <View style={styles.finalScoreLeft}>
                  <View style={[styles.finalScoreIcon, { backgroundColor: color + '20' }]}>
                    <Icon name="stars" size={24} color={color} />
                  </View>
                  <View>
                    <Text style={styles.finalScoreLabel}>Final Score</Text>
                    <Text style={styles.finalScoreSubtext}>Overall rating</Text>
                  </View>
                </View>
                <View style={styles.finalScoreRight}>
                  <Text style={[styles.finalScoreValue, { color }]}>
                    {breakdown.finalScore.toFixed(1)}
                  </Text>
                  <Text style={styles.finalScoreMax}>/ 100</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

// Breakdown Item Component
const BreakdownItem = ({ label, value, max, color, icon, isPenalty = false }) => {
  const displayValue = isPenalty ? value.toFixed(1) : `${value.toFixed(1)} / ${max}`;
  const bgColor = isPenalty ? '#FEF2F2' : (color === '#10B981' ? '#ECFDF5' : '#FFFBEB');

  return (
    <View style={[styles.breakdownItem, { backgroundColor: bgColor }]}>
      <View style={styles.breakdownItemLeft}>
        <View style={[styles.breakdownItemIcon, { backgroundColor: color + '20' }]}>
          <Icon name={icon} size={16} color={color} />
        </View>
        <Text style={styles.breakdownItemLabel}>{label}</Text>
      </View>
      <View style={styles.breakdownItemRight}>
        <Text style={[styles.breakdownItemValue, { color }]}>
          {isPenalty ? '' : '+'}{displayValue}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // ============================================
  // MAIN CONTAINER STYLES
  // ============================================
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(20),
    marginBottom: m(12),
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  compactContainer: {
    marginBottom: m(8),
    padding: m(12),
  },

  // ============================================
  // LOADING STATE STYLES
  // ============================================
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: m(24),
    gap: m(10),
  },
  loadingText: {
    fontSize: m(14),
    color: '#6B7280',
    fontWeight: '500',
  },

  // ============================================
  // HEADER BANNER STYLES
  // ============================================
  headerBanner: {
    paddingVertical: m(16),
    paddingHorizontal: m(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: m(12),
  },
  headerIconWrapper: {
    width: m(52),
    height: m(52),
    borderRadius: m(14),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleSection: {
    flex: 1,
  },
  headerTitle: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(2),
  },
  headerSubtitle: {
    fontSize: m(12),
    color: '#6B7280',
    fontWeight: '500',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(20),
    gap: m(4),
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: m(11),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ============================================
  // SCORE CARD STYLES (Main Score Display)
  // ============================================
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: m(20),
    paddingHorizontal: m(16),
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    gap: m(20),
  },
  scoreRing: {
    width: m(100),
    height: m(100),
    borderRadius: m(50),
    borderWidth: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  scoreInnerRing: {
    width: m(82),
    height: m(82),
    borderRadius: m(41),
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  scoreNumber: {
    fontSize: m(32),
    fontWeight: '800',
  },
  scoreOutOf: {
    fontSize: m(11),
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: m(-2),
  },
  scoreInfo: {
    flex: 1,
  },
  scoreInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
    marginBottom: m(6),
  },
  scoreInfoText: {
    fontSize: m(15),
    fontWeight: '700',
  },
  scoreDescription: {
    fontSize: m(12),
    color: '#6B7280',
    lineHeight: m(18),
  },

  // ============================================
  // METRICS SECTION STYLES (Loan Stats Grid)
  // ============================================
  metricsSection: {
    padding: m(16),
  },
  metricsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
    marginBottom: m(14),
  },
  metricsSectionTitle: {
    fontSize: m(14),
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: m(10),
    marginBottom: m(10),
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: m(14),
    paddingHorizontal: m(8),
    borderRadius: m(14),
  },
  metricCardIcon: {
    width: m(36),
    height: m(36),
    borderRadius: m(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(8),
  },
  metricCardValue: {
    fontSize: m(20),
    fontWeight: '800',
    marginBottom: m(2),
  },
  metricCardLabel: {
    fontSize: m(10),
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // ============================================
  // OVERDUE ALERT STYLES
  // ============================================
  overdueAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: m(6),
    padding: m(12),
    backgroundColor: '#FEF2F2',
    borderRadius: m(12),
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: m(12),
  },
  overdueAlertIcon: {
    width: m(36),
    height: m(36),
    borderRadius: m(10),
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overdueAlertContent: {
    flex: 1,
  },
  overdueAlertLabel: {
    fontSize: m(12),
    color: '#991B1B',
    fontWeight: '500',
  },
  overdueAlertValue: {
    fontSize: m(16),
    color: '#DC2626',
    fontWeight: '700',
  },

  // ============================================
  // LEGACY STYLES (kept for compatibility)
  // ============================================
  iconContainer: {
    width: m(48),
    height: m(48),
    borderRadius: m(12),
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ============================================
  // BREAKDOWN SECTION STYLES
  // ============================================
  breakdownSection: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  expandToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: m(14),
    paddingHorizontal: m(16),
    backgroundColor: '#FAFAFA',
  },
  expandToggleActive: {
    backgroundColor: '#374151',
  },
  expandToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(10),
  },
  expandToggleIcon: {
    width: m(32),
    height: m(32),
    borderRadius: m(8),
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandToggleIconActive: {
    backgroundColor: '#4B5563',
  },
  expandToggleText: {
    fontSize: m(14),
    color: '#374151',
    fontWeight: '600',
  },
  expandToggleTextActive: {
    color: '#FFFFFF',
  },
  expandChevron: {
    width: m(28),
    height: m(28),
    borderRadius: m(14),
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandChevronActive: {
    backgroundColor: '#4B5563',
  },

  // ============================================
  // BREAKDOWN CONTENT STYLES
  // ============================================
  breakdownContent: {
    padding: m(16),
    backgroundColor: '#F9FAFB',
  },
  breakdownGroup: {
    marginBottom: m(16),
  },
  breakdownGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(6),
    marginBottom: m(10),
  },
  breakdownGroupTitle: {
    fontSize: m(12),
    fontWeight: '700',
    color: '#065F46',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ============================================
  // BREAKDOWN ITEM STYLES
  // ============================================
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: m(10),
    paddingHorizontal: m(12),
    borderRadius: m(10),
    marginBottom: m(8),
  },
  breakdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(10),
    flex: 1,
  },
  breakdownItemIcon: {
    width: m(30),
    height: m(30),
    borderRadius: m(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  breakdownItemLabel: {
    fontSize: m(13),
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  breakdownItemRight: {
    alignItems: 'flex-end',
  },
  breakdownItemValue: {
    fontSize: m(14),
    fontWeight: '700',
  },

  // ============================================
  // FINAL SCORE CARD STYLES
  // ============================================
  finalScoreCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: m(14),
    borderRadius: m(14),
    borderWidth: 2,
    marginTop: m(8),
  },
  finalScoreLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(12),
  },
  finalScoreIcon: {
    width: m(44),
    height: m(44),
    borderRadius: m(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  finalScoreLabel: {
    fontSize: m(14),
    fontWeight: '700',
    color: '#111827',
  },
  finalScoreSubtext: {
    fontSize: m(11),
    color: '#6B7280',
    marginTop: m(1),
  },
  finalScoreRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: m(2),
  },
  finalScoreValue: {
    fontSize: m(28),
    fontWeight: '800',
  },
  finalScoreMax: {
    fontSize: m(14),
    color: '#9CA3AF',
    fontWeight: '600',
  },

  // ============================================
  // COMPACT VIEW STYLES (Small Card Variant)
  // ============================================
  compactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(12),
    padding: m(12),
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginBottom: m(8),
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
  },
  compactIconContainer: {
    width: m(32),
    height: m(32),
    borderRadius: m(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactScoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flex: 1,
    gap: m(4),
  },
  compactScore: {
    fontSize: m(20),
    fontWeight: '700',
  },
  compactMax: {
    fontSize: m(12),
    color: '#6B7280',
  },
  compactBadge: {
    paddingHorizontal: m(10),
    paddingVertical: m(4),
    borderRadius: m(12),
  },
  compactBadgeText: {
    color: '#FFFFFF',
    fontSize: m(10),
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // ============================================
  // NO DATA / EMPTY STATE STYLES
  // ============================================
  noDataContainer: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  noDataContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(12),
  },
  noDataTextContainer: {
    flex: 1,
  },
  noDataTitle: {
    fontSize: m(15),
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: m(4),
  },
  noDataSubtitle: {
    fontSize: m(13),
    color: '#9CA3AF',
    lineHeight: m(18),
  },
});

export default BorrowerReputationCard;