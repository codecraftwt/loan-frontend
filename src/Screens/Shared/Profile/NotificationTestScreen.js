import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import NotificationService from '../../../Services/NotificationService';
import { m } from 'walstar-rn-responsive';

export default function NotificationTestScreen() {
  const navigation = useNavigation();
  const user = useSelector(state => state.auth?.user);
  const [fcmToken, setFcmToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('Checking...');

  useEffect(() => {
    loadToken();
    checkPermissionStatus();
  }, []);

  const loadToken = async () => {
    try {
      const token = await AsyncStorage.getItem('fcm_token');
      if (token) {
        setFcmToken(token);
      } else {
        // Try to get token if not stored
        const newToken = await NotificationService.getFCMToken();
        if (newToken) {
          setFcmToken(newToken);
        }
      }
    } catch (error) {
      console.error('Error loading token:', error);
    }
  };

  const checkPermissionStatus = async () => {
    try {
      const hasPermission = await NotificationService.requestPermission();
      setPermissionStatus(hasPermission ? 'Granted ✅' : 'Denied ❌');
    } catch (error) {
      setPermissionStatus('Error checking permission');
    }
  };

  const handleRequestPermission = async () => {
    setLoading(true);
    try {
      const hasPermission = await NotificationService.requestPermission();
      setPermissionStatus(hasPermission ? 'Granted ✅' : 'Denied ❌');
      
      if (hasPermission) {
        Alert.alert('Success', 'Notification permission granted!');
        // Get token after permission granted
        await loadToken();
      } else {
        Alert.alert(
          'Permission Denied',
          'Please enable notifications in your device settings to receive push notifications.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request permission: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGetToken = async () => {
    setLoading(true);
    try {
      const token = await NotificationService.getFCMToken();
      if (token) {
        setFcmToken(token);
        Alert.alert('Success', 'FCM token retrieved successfully!');
      } else {
        Alert.alert('Error', 'Failed to get FCM token. Check console for details.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get token: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterToken = async () => {
    if (!user?._id) {
      Alert.alert('Error', 'Please login first to register token.');
      return;
    }

    if (!fcmToken) {
      Alert.alert('Error', 'No FCM token available. Please get token first.');
      return;
    }

    setLoading(true);
    try {
      const result = await NotificationService.registerToken(user._id, fcmToken);
      if (result.success) {
        Alert.alert('Success', 'Token registered successfully with backend!');
      } else {
        Alert.alert('Error', result.error || 'Failed to register token.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to register token: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveToken = async () => {
    if (!fcmToken) {
      Alert.alert('Error', 'No FCM token available.');
      return;
    }

    setLoading(true);
    try {
      const result = await NotificationService.removeToken(fcmToken);
      if (result.success) {
        Alert.alert('Success', 'Token removed successfully from backend!');
        await AsyncStorage.removeItem('fcm_token');
        setFcmToken(null);
      } else {
        Alert.alert('Error', result.error || 'Failed to remove token.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to remove token: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = () => {
    if (fcmToken) {
      // For React Native, we'll show an alert with the token
      // You can use Clipboard API if needed
      Alert.alert(
        'FCM Token',
        fcmToken,
        [
          { text: 'OK' },
          { text: 'Copy', onPress: () => {
            // Add clipboard functionality if needed
            console.log('Token to copy:', fcmToken);
          }}
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Notification Testing</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Status Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="info" size={20} color="#b80266" />
            <Text style={styles.cardTitle}>Status</Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Permission:</Text>
            <Text style={[styles.statusValue, permissionStatus.includes('✅') && styles.statusSuccess]}>
              {permissionStatus}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>User ID:</Text>
            <Text style={styles.statusValue}>
              {user?._id ? user._id.substring(0, 20) + '...' : 'Not logged in'}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Token Status:</Text>
            <Text style={[styles.statusValue, fcmToken && styles.statusSuccess]}>
              {fcmToken ? 'Available ✅' : 'Not available ❌'}
            </Text>
          </View>
        </View>

        {/* FCM Token Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="key" size={20} color="#b80266" />
            <Text style={styles.cardTitle}>FCM Token</Text>
          </View>

          {fcmToken ? (
            <>
              <View style={styles.tokenContainer}>
                <Text style={styles.tokenText} numberOfLines={3}>
                  {fcmToken}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyToken}>
                <Icon name="copy" size={16} color="#b80266" />
                <Text style={styles.copyButtonText}>View Full Token</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.noTokenText}>No token available. Get token first.</Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="settings" size={20} color="#b80266" />
            <Text style={styles.cardTitle}>Actions</Text>
          </View>

          <TouchableOpacity
            style={[styles.actionButton, loading && styles.actionButtonDisabled]}
            onPress={handleRequestPermission}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Icon name="shield" size={18} color="#FFF" />
                <Text style={styles.actionButtonText}>Request Permission</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, loading && styles.actionButtonDisabled]}
            onPress={handleGetToken}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Icon name="refresh-cw" size={18} color="#FFF" />
                <Text style={styles.actionButtonText}>Get FCM Token</Text>
              </>
            )}
          </TouchableOpacity>

          {user?._id && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary, loading && styles.actionButtonDisabled]}
              onPress={handleRegisterToken}
              disabled={loading || !fcmToken}>
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Icon name="check-circle" size={18} color="#FFF" />
                  <Text style={styles.actionButtonText}>Register Token</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {user?._id && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonDanger, loading && styles.actionButtonDisabled]}
              onPress={handleRemoveToken}
              disabled={loading || !fcmToken}>
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Icon name="trash-2" size={18} color="#FFF" />
                  <Text style={styles.actionButtonText}>Remove Token</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Instructions Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="help-circle" size={20} color="#b80266" />
            <Text style={styles.cardTitle}>Testing Instructions</Text>
          </View>

          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>1.</Text>
            <Text style={styles.instructionText}>
              Request permission and get FCM token
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>2.</Text>
            <Text style={styles.instructionText}>
              Register token with backend (requires login)
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>3.</Text>
            <Text style={styles.instructionText}>
              Copy token and test from Firebase Console
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <Text style={styles.instructionNumber}>4.</Text>
            <Text style={styles.instructionText}>
              Test in foreground, background, and quit states
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerBar: {
    backgroundColor: '#b80266',
    height: m(60),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: m(20),
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    left: m(15),
    top: m(10),
    padding: m(10),
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: m(20),
  },
  card: {
    backgroundColor: '#F8F8F8',
    borderRadius: m(12),
    padding: m(16),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(12),
  },
  cardTitle: {
    fontSize: m(18),
    fontWeight: 'bold',
    color: '#333',
    marginLeft: m(8),
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: m(8),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statusLabel: {
    fontSize: m(14),
    color: '#666',
  },
  statusValue: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#333',
  },
  statusSuccess: {
    color: '#00A550',
  },
  tokenContainer: {
    backgroundColor: '#FFF',
    borderRadius: m(8),
    padding: m(12),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tokenText: {
    fontSize: m(12),
    color: '#333',
    fontFamily: 'monospace',
  },
  noTokenText: {
    fontSize: m(14),
    color: '#999',
    fontStyle: 'italic',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(8),
  },
  copyButtonText: {
    fontSize: m(14),
    color: '#b80266',
    marginLeft: m(8),
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#b80266',
    borderRadius: m(8),
    paddingVertical: m(12),
    paddingHorizontal: m(16),
    marginBottom: m(12),
  },
  actionButtonPrimary: {
    backgroundColor: '#00A550',
  },
  actionButtonDanger: {
    backgroundColor: '#EF4444',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: m(16),
    fontWeight: '600',
    marginLeft: m(8),
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: m(12),
  },
  instructionNumber: {
    fontSize: m(16),
    fontWeight: 'bold',
    color: '#b80266',
    marginRight: m(8),
  },
  instructionText: {
    flex: 1,
    fontSize: m(14),
    color: '#666',
    lineHeight: m(20),
  },
});

