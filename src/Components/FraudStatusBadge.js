import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { m } from 'walstar-rn-responsive';

const FraudStatusBadge = ({ fraudScore, riskLevel }) => {
  const getColor = () => {
    switch (riskLevel?.toLowerCase()) {
      case 'critical':
        return '#dc3545'; // Red
      case 'high':
        return '#fd7e14'; // Orange
      case 'medium':
        return '#ffc107'; // Yellow
      case 'low':
        return '#28a745'; // Green
      default:
        return '#6c757d'; // Gray
    }
  };

  const getIcon = () => {
    switch (riskLevel?.toLowerCase()) {
      case 'critical':
        return 'alert-octagon';
      case 'high':
        return 'alert';
      case 'medium':
        return 'alert-circle-outline';
      default:
        return 'shield-check';
    }
  };

  const color = getColor();

  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color }]}>
      <Icon name={getIcon()} size={16} color={color} />
      <Text style={[styles.badgeText, { color }]}>
        {riskLevel?.toUpperCase() || 'UNKNOWN'} RISK
        {/* {riskLevel?.toUpperCase() || 'UNKNOWN'} RISK ({fraudScore || 0} pts) */}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: m(12),
    paddingVertical: m(8),
    borderRadius: m(8),
    borderWidth: 2,
    gap: m(8),
  },
  badgeText: {
    fontSize: m(12),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default FraudStatusBadge;


