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
        return '#10B981'; // Green
      case 'good':
        return '#3B82F6'; // Blue
      case 'fair':
        return '#F59E0B'; // Yellow
      case 'below average':
        return '#F97316'; // Orange
      case 'poor':
        return '#EF4444'; // Red
      default:
        return '#6B7280'; // Gray
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
    return null; 
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
    <View style={[styles.container, { borderColor: color + '40' }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <Icon name={getReputationIcon(reputationLevel)} size={24} color={color} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Reputation Score</Text>
            <Text style={styles.subtitle}>Borrower Reliability</Text>
          </View>
        </View>
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Text style={styles.badgeText}>{reputationLevel}</Text>
        </View>
      </View>

      {/* Score Display */}
      <View style={styles.scoreContainer}>
        <View style={[styles.scoreCircle, { borderColor: color }]}>
          <Text style={[styles.scoreValue, { color }]}>
            {reputationScore.toFixed(1)}
          </Text>
          <Text style={styles.scoreMax}>/ 100</Text>
        </View>
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <View style={[styles.metricIconContainer, { backgroundColor: '#EFF6FF' }]}>
              <Icon name="description" size={18} color="#3B82F6" />
            </View>
            <Text style={styles.metricValue}>{metrics.totalLoans || 0}</Text>
            <Text style={styles.metricLabel}>Total Loans</Text>
          </View>
          <View style={styles.metricItem}>
            <View style={[styles.metricIconContainer, { backgroundColor: '#ECFDF5' }]}>
              <Icon name="check-circle" size={18} color="#10B981" />
            </View>
            <Text style={[styles.metricValue, { color: '#10B981' }]}>
              {metrics.totalPaidLoans || 0}
            </Text>
            <Text style={styles.metricLabel}>Paid Loans</Text>
          </View>
          <View style={styles.metricItem}>
            <View style={[styles.metricIconContainer, { backgroundColor: '#FFF7ED' }]}>
              <Icon name="pending" size={18} color="#F59E0B" />
            </View>
            <Text style={[styles.metricValue, { color: '#F59E0B' }]}>
              {metrics.totalPendingLoans || 0}
            </Text>
            <Text style={styles.metricLabel}>Pending</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <View style={[styles.metricIconContainer, { backgroundColor: '#FEF3C7' }]}>
              <Icon name="schedule" size={18} color="#D97706" />
            </View>
            <Text style={[styles.metricValue, { color: '#D97706' }]}>
              {metrics.totalPartPaidLoans || 0}
            </Text>
            <Text style={styles.metricLabel}>Part Paid</Text>
          </View>
          <View style={styles.metricItem}>
            <View style={[styles.metricIconContainer, { backgroundColor: '#FEE2E2' }]}>
              <Icon name="error" size={18} color="#EF4444" />
            </View>
            <Text style={[styles.metricValue, { color: '#EF4444' }]}>
              {metrics.overdueLoans || 0}
            </Text>
            <Text style={styles.metricLabel}>Overdue</Text>
          </View>
          <View style={styles.metricItem}>
            <View style={[styles.metricIconContainer, { backgroundColor: '#EFF6FF' }]}>
              <Icon name="access-time" size={18} color="#3B82F6" />
            </View>
            <Text style={[styles.metricValue, { color: '#3B82F6' }]}>
              {metrics.onTimePaymentRate || 0}%
            </Text>
            <Text style={styles.metricLabel}>On-time</Text>
          </View>
        </View>

        {/* Overdue Days */}
        {metrics.averageOverdueDays > 0 && (
          <View style={styles.overdueDaysContainer}>
            <View style={styles.overdueDaysRow}>
              <Icon name="schedule" size={16} color="#EF4444" />
              <Text style={styles.overdueDaysLabel}>Average Overdue Days:</Text>
              <Text style={[styles.overdueDaysValue, { color: '#EF4444' }]}>
                {metrics.averageOverdueDays} days
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Expandable Breakdown */}
      {breakdown && (
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}>
          <Text style={styles.expandButtonText}>
            {expanded ? 'Hide' : 'Show'} Score Breakdown
          </Text>
          <Icon
            name={expanded ? 'expand-less' : 'expand-more'}
            size={20}
            color="#6B7280"
          />
        </TouchableOpacity>
      )}

      {expanded && breakdown && (
        <View style={styles.breakdownContainer}>
          <Text style={styles.breakdownTitle}>Score Breakdown</Text>
          <View style={styles.breakdownList}>
            <BreakdownItem
              label="On-time Payments"
              value={breakdown.onTimeScore}
              max={40}
              color="#10B981"
            />
            <BreakdownItem
              label="Paid Loans"
              value={breakdown.paidLoansScore}
              max={30}
              color="#10B981"
            />
            <BreakdownItem
              label="Part Paid Loans"
              value={breakdown.partPaidScore}
              max={10}
              color="#F59E0B"
            />
            {breakdown.overduePenalty < 0 && (
              <BreakdownItem
                label="Overdue Penalty"
                value={breakdown.overduePenalty}
                max={0}
                color="#EF4444"
                isPenalty
              />
            )}
            {breakdown.overdueDaysPenalty < 0 && (
              <BreakdownItem
                label="Overdue Days Penalty"
                value={breakdown.overdueDaysPenalty}
                max={0}
                color="#EF4444"
                isPenalty
              />
            )}
            {breakdown.pendingPenalty < 0 && (
              <BreakdownItem
                label="Pending Penalty"
                value={breakdown.pendingPenalty}
                max={0}
                color="#F59E0B"
                isPenalty
              />
            )}
            <View style={styles.finalScoreRow}>
              <Text style={styles.finalScoreLabel}>Final Score</Text>
              <Text style={[styles.finalScoreValue, { color }]}>
                {breakdown.finalScore.toFixed(1)} / 100
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

// Breakdown Item Component
const BreakdownItem = ({ label, value, max, color, isPenalty = false }) => {
  const displayValue = isPenalty ? value : `${value.toFixed(1)} / ${max}`;
  const valueColor = isPenalty ? '#EF4444' : color;

  return (
    <View style={styles.breakdownItem}>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <Text style={[styles.breakdownValue, { color: valueColor }]}>
        {isPenalty ? '' : '+'}{displayValue}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    padding: m(16),
    marginBottom: m(12),
    borderWidth: 2,
    borderColor: '#E5E7EB', // Default border color to prevent black flash
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  compactContainer: {
    marginBottom: m(8),
    padding: m(12),
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: m(16),
    gap: m(8),
  },
  loadingText: {
    fontSize: m(14),
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(8),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: m(12),
  },
  iconContainer: {
    width: m(48),
    height: m(48),
    borderRadius: m(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(2),
  },
  subtitle: {
    fontSize: m(12),
    color: '#6B7280',
  },
  badge: {
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(20),
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: m(12),
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  scoreContainer: {
    alignItems: 'center',
    marginVertical: m(8),
  },
  scoreCircle: {
    width: m(100),
    height: m(100),
    borderRadius: m(50),
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  scoreValue: {
    fontSize: m(32),
    fontWeight: '700',
  },
  scoreMax: {
    fontSize: m(14),
    color: '#6B7280',
    marginTop: m(-4),
  },
  metricsContainer: {
    marginTop: m(8),
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: m(12),
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    gap: m(6),
  },
  metricIconContainer: {
    width: m(40),
    height: m(40),
    borderRadius: m(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#111827',
  },
  metricLabel: {
    fontSize: m(11),
    color: '#6B7280',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  overdueDaysContainer: {
    marginTop: m(8),
    padding: m(12),
    backgroundColor: '#FEF2F2',
    borderRadius: m(8),
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  overdueDaysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(8),
  },
  overdueDaysLabel: {
    fontSize: m(13),
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  overdueDaysValue: {
    fontSize: m(14),
    fontWeight: '700',
  },
  expandButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: m(12),
    marginTop: m(8),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  expandButtonText: {
    fontSize: m(14),
    color: '#6B7280',
    fontWeight: '600',
  },
  breakdownContainer: {
    marginTop: m(12),
    paddingTop: m(12),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  breakdownTitle: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#111827',
    marginBottom: m(12),
  },
  breakdownList: {
    gap: m(10),
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: m(8),
    paddingHorizontal: m(12),
    backgroundColor: '#F9FAFB',
    borderRadius: m(8),
  },
  breakdownLabel: {
    fontSize: m(13),
    color: '#6B7280',
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: m(14),
    fontWeight: '700',
  },
  finalScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: m(8),
    paddingTop: m(12),
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
  },
  finalScoreLabel: {
    fontSize: m(15),
    fontWeight: '700',
    color: '#111827',
  },
  finalScoreValue: {
    fontSize: m(16),
    fontWeight: '700',
  },
  // Compact styles
  compactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(12),
    padding: m(12),
    borderWidth: 1.5,
    borderColor: '#E5E7EB', // Default border color to prevent black flash
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
});

export default BorrowerReputationCard;

