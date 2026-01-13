import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { m } from 'walstar-rn-responsive';

const SubscriptionRestriction = ({ message, showButton = true, asOverlay = false }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleBuyPlan = () => {
    navigation.navigate('SubscriptionScreen');
  };

  // Overlay badge version (for showing over disabled content)
  if (asOverlay) {
    // Header height (m(90) from Header component) + status bar
    const headerHeight = m(90) + (insets.top || 0);
    // Bottom tab height + safe area + some padding
    const bottomTabHeight = m(20) + insets.bottom + m(10);
    
    return (
      <View style={[
        styles.overlayContainer, 
        { 
          top: headerHeight,
          bottom: bottomTabHeight 
        }
      ]}>
        <TouchableOpacity 
          style={styles.overlayBackdrop}
          activeOpacity={1}
          onPress={() => {}}>
          <View style={styles.overlayContent}>
            <View style={styles.overlayIconContainer}>
              <Icon name="lock" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.overlayTextContainer}>
              <Text style={styles.overlayTitle}>Subscription Required</Text>
              <Text style={styles.overlayMessage} numberOfLines={2}>
                {message || 'Purchase a plan to access this feature'}
              </Text>
            </View>
            {showButton && (
              <TouchableOpacity style={styles.overlayButton} onPress={handleBuyPlan}>
                <Text style={styles.overlayButtonText}>Buy Plan</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  // Full screen version (original)
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon name="lock" size={48} color="#F59E0B" />
        </View>
        <Text style={styles.title}>Subscription Required</Text>
        <Text style={styles.message}>
          {message || 'You need an active subscription plan to access this feature.'}
        </Text>
        {showButton && (
          <TouchableOpacity style={styles.button} onPress={handleBuyPlan}>
            <Icon name="shopping-cart" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Buy Plan</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: m(20),
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    padding: m(24),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: m(400),
    width: '100%',
  },
  iconContainer: {
    width: m(80),
    height: m(80),
    borderRadius: m(40),
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(20),
  },
  title: {
    fontSize: m(20),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: m(12),
    textAlign: 'center',
  },
  message: {
    fontSize: m(14),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: m(20),
    marginBottom: m(24),
  },
  button: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(12),
    paddingHorizontal: m(24),
    borderRadius: m(8),
    minWidth: m(150),
  },
  buttonIcon: {
    marginRight: m(8),
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: m(16),
    fontWeight: '600',
  },
  // Overlay styles
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  overlayBackdrop: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    padding: m(20),
    alignItems: 'center',
    margin: m(20),
    maxWidth: m(350),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  overlayIconContainer: {
    width: m(60),
    height: m(60),
    borderRadius: m(30),
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: m(16),
  },
  overlayTextContainer: {
    alignItems: 'center',
    marginBottom: m(16),
  },
  overlayTitle: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: m(8),
    textAlign: 'center',
  },
  overlayMessage: {
    fontSize: m(14),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: m(20),
  },
  overlayButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: m(10),
    paddingHorizontal: m(24),
    borderRadius: m(8),
    minWidth: m(120),
  },
  overlayButtonText: {
    color: '#FFFFFF',
    fontSize: m(14),
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default SubscriptionRestriction;