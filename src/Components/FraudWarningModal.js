import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { m } from 'walstar-rn-responsive';
import FraudStatusBadge from './FraudStatusBadge';

const FraudWarningModal = ({ visible, fraudData, onProceed, onCancel, onViewHistory }) => {
  if (!fraudData) return null;

  const { fraudScore, riskLevel, flags, details, recommendation } = fraudData;

  const getBackgroundColor = () => {
    switch (riskLevel?.toLowerCase()) {
      case 'critical':
        return '#fef2f2';
      case 'high':
        return '#fff7ed';
      case 'medium':
        return '#fffbeb';
      default:
        return '#f0fdf4';
    }
  };

  const getBorderColor = () => {
    switch (riskLevel?.toLowerCase()) {
      case 'critical':
        return '#dc3545';
      case 'high':
        return '#fd7e14';
      case 'medium':
        return '#ffc107';
      default:
        return '#28a745';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={[styles.header, { backgroundColor: getBackgroundColor(), borderColor: getBorderColor() }]}>
            <Icon 
              name={riskLevel === 'critical' ? 'alert-octagon' : 'alert'} 
              size={32} 
              color={getBorderColor()} 
            />
            <Text style={[styles.title, { color: getBorderColor() }]}>
              Fraud Alert - {riskLevel?.toUpperCase()} Risk Detected
            </Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.badgeContainer}>
              <FraudStatusBadge fraudScore={fraudScore} riskLevel={riskLevel} />
            </View>

            <View style={styles.recommendationContainer}>
              <Text style={styles.recommendationLabel}>Recommendation:</Text>
              <Text style={styles.recommendationText}>{recommendation}</Text>
            </View>

            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Fraud Indicators</Text>
              
              {flags && (
                <>
                  {flags.multipleLoansInShortTime && (
                    <View style={styles.indicatorItem}>
                      <Icon name="alert-circle" size={18} color="#fd7e14" />
                      <Text style={styles.indicatorText}>
                        Multiple loans in short time period
                      </Text>
                    </View>
                  )}
                  
                  {flags.hasPendingLoans && (
                    <View style={styles.indicatorItem}>
                      <Icon name="alert-circle" size={18} color="#fd7e14" />
                      <Text style={styles.indicatorText}>
                        Has pending loans ({flags.totalPendingLoans || 0})
                      </Text>
                    </View>
                  )}
                  
                  {flags.hasOverdueLoans && (
                    <View style={styles.indicatorItem}>
                      <Icon name="alert-circle" size={18} color="#dc3545" />
                      <Text style={styles.indicatorText}>
                        Has overdue loans ({flags.totalOverdueLoans || 0})
                      </Text>
                    </View>
                  )}
                </>
              )}

              {details && (
                <View style={styles.detailsGrid}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Total Active Loans:</Text>
                    <Text style={styles.detailValue}>{details.totalActiveLoans || 0}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Loans in Last 30 Days:</Text>
                    <Text style={styles.detailValue}>{details.loansInLast30Days || 0}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Loans in Last 90 Days:</Text>
                    <Text style={styles.detailValue}>{details.loansInLast90Days || 0}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Pending Loans:</Text>
                    <Text style={styles.detailValue}>{details.pendingLoansCount || 0}</Text>
                  </View>
                  
                  {details.pendingLoansAmount > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Pending Amount:</Text>
                      <Text style={styles.detailValue}>₹{details.pendingLoansAmount?.toLocaleString() || 0}</Text>
                    </View>
                  )}
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Overdue Loans:</Text>
                    <Text style={styles.detailValue}>{details.overdueLoansCount || 0}</Text>
                  </View>
                  
                  {details.overdueLoansAmount > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Overdue Amount:</Text>
                      <Text style={styles.detailValue}>₹{details.overdueLoansAmount?.toLocaleString() || 0}</Text>
                    </View>
                  )}
                  
                  {details.maxOverdueDays > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Max Overdue Days:</Text>
                      <Text style={styles.detailValue}>{details.maxOverdueDays} days</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              activeOpacity={0.8}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            {onViewHistory && (
              <TouchableOpacity
                style={[styles.button, styles.viewHistoryButton]}
                onPress={onViewHistory}
                activeOpacity={0.8}>
                {/* <Icon name="history" size={18} color="#3B82F6" /> */}
                <Text style={styles.viewHistoryButtonText}>View History</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.button,{ backgroundColor: getBorderColor() }]}
              onPress={onProceed}
              activeOpacity={0.8}>
              <Text style={styles.proceedButtonText}>Proceed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: m(20),
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(20),
    width: '100%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: m(20),
    borderBottomWidth: 2,
    gap: m(12),
  },
  title: {
    flex: 1,
    fontSize: m(18),
    fontWeight: '700',
    lineHeight: m(24),
  },
  content: {
    padding: m(20),
    maxHeight: m(400),
  },
  badgeContainer: {
    marginBottom: m(20),
  },
  recommendationContainer: {
    backgroundColor: '#f8fafc',
    padding: m(16),
    borderRadius: m(12),
    marginBottom: m(20),
    borderLeftWidth: 4,
    borderLeftColor: '#fd7e14',
  },
  recommendationLabel: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#374151',
    marginBottom: m(8),
  },
  recommendationText: {
    fontSize: m(14),
    color: '#64748b',
    lineHeight: m(20),
  },
  detailsSection: {
    marginTop: m(10),
  },
  sectionTitle: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: m(16),
  },
  indicatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(12),
    gap: m(10),
  },
  indicatorText: {
    flex: 1,
    fontSize: m(14),
    color: '#374151',
  },
  detailsGrid: {
    backgroundColor: '#f8fafc',
    borderRadius: m(12),
    padding: m(16),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: m(10),
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  detailLabel: {
    fontSize: m(14),
    color: '#64748b',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: m(14),
    color: '#1e293b',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: m(8),
    padding: m(20),
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  button: {
    flex: 1,
    paddingVertical: m(14),
    borderRadius: m(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelButtonText: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#64748b',
  },
  viewHistoryButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
    flexDirection: 'row',
    gap: m(6),
  },
  viewHistoryButtonText: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#3B82F6',
  },
  proceedButtonText: {
    fontSize: m(14),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default FraudWarningModal;