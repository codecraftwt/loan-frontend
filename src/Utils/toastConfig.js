import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

// Define the toastConfig with proper ReactNode return type
export const toastConfig = {
  success: ({ text1, text2 }) => (
    <View style={styles.successContainer}>
      <View style={styles.iconContainer}>
        <Icon name="check-circle" size={24} color="#FFFFFF" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{text1}</Text>
        {text2 ? <Text style={styles.message}>{text2}</Text> : null}
      </View>
    </View>
  ),
  error: ({ text1, text2 }) => (
    <View style={styles.errorContainer}>
      <View style={styles.errorIconContainer}>
        <Icon name="alert-circle" size={24} color="#DC2626" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.errorTitle}>{text1}</Text>
        {text2 ? <Text style={styles.errorMessage}>{text2}</Text> : null}
      </View>
    </View>
  ),
  info: ({ text1, text2 }) => (
    <View style={styles.infoContainer}>
      <View style={styles.iconContainer}>
        <Icon name="info" size={24} color="#FFFFFF" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{text1}</Text>
        {text2 ? <Text style={styles.message}>{text2}</Text> : null}
      </View>
    </View>
  ),
  warning: ({ text1, text2 }) => (
    <View style={styles.warningContainer}>
      <View style={styles.iconContainer}>
        <Icon name="alert-triangle" size={24} color="#FFFFFF" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.warningTitle}>{text1}</Text>
        {text2 ? <Text style={styles.warningMessage}>{text2}</Text> : null}
      </View>
    </View>
  ),
};

const styles = StyleSheet.create({
  // Success Toast - Green
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#059669',
    borderRadius: 12,
    width: '92%',
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderLeftWidth: 5,
    borderLeftColor: '#34D399',
  },
  // Error Toast - White background with red left border
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '92%',
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderLeftWidth: 5,
    borderLeftColor: '#DC2626',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  errorIconContainer: {
    marginRight: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    color: '#991B1B',
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 2,
  },
  errorMessage: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  // Info Toast - Blue
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1D4ED8',
    borderRadius: 12,
    width: '92%',
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderLeftWidth: 5,
    borderLeftColor: '#93C5FD',
  },
  // Warning Toast - Amber/Orange (distinct from pending payment card)
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#7C2D12',
    borderRadius: 12,
    width: '92%',
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
    borderLeftWidth: 5,
    borderLeftColor: '#FB923C',
    borderWidth: 1,
    borderColor: '#9A3412',
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 2,
  },
  message: {
    color: '#F3F4F6',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  warningTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 2,
  },
  warningMessage: {
    color: '#FED7AA',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
});
