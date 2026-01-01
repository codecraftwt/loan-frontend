import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import {
  getAdminPlans,
  clearErrors,
} from '../../../Redux/Slices/adminPlanSlice';

export default function PlansList() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { plans, loading, error } = useSelector(state => state.adminPlans);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch plans on component mount
  useEffect(() => {
    dispatch(getAdminPlans());
  }, [dispatch]);

  // Refresh plans when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      dispatch(getAdminPlans());
    }, [dispatch]),
  );

  // Handle errors
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      dispatch(clearErrors());
    }
  }, [error, dispatch]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(getAdminPlans()).finally(() => {
      setRefreshing(false);
    });
  }, [dispatch]);

  // Navigation handlers
  const handlePlanPress = useCallback(
    plan => {
      navigation.navigate('PlanDetailsScreen', { plan });
    },
    [navigation],
  );

  const handleCreatePlan = useCallback(() => {
    navigation.navigate('CreateEditPlan', { mode: 'create' });
  }, [navigation]);

  const handleEditPlan = useCallback(
    plan => {
      navigation.navigate('CreateEditPlan', { plan, mode: 'edit' });
    },
    [navigation],
  );

  // Memoized plan item renderer
  const renderPlanItem = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={styles.planCard}
        onPress={() => handlePlanPress(item)}
        activeOpacity={0.7}>
        <View style={styles.planHeader}>
          <View style={styles.planInfo}>
            <Text style={styles.planName} numberOfLines={1}>
              {item.planName}
            </Text>
            <Text style={styles.planDetails}>
              {item.duration} • ₹{item.priceMonthly?.toLocaleString('en-IN')}/month
            </Text>
          </View>
          <View style={styles.planActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditPlan(item)}
              activeOpacity={0.7}>
              <Icon name="edit" size={18} color="orange" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.planAmounts}>
          <View style={styles.featuresContainer}>
            {(item.planFeatures?.advancedAnalytics ?? false) && (
              <View style={styles.featureBadge}>
                <Text style={styles.featureText}>Analytics</Text>
              </View>
            )}
            {(item.planFeatures?.prioritySupport ?? false) && (
              <View style={styles.featureBadge}>
                <Text style={styles.featureText}>Priority</Text>
              </View>
            )}
            <View style={styles.featureBadge}>
              <Text style={styles.featureText}>Unlimited Loans</Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: item.isActive ? '#E8F5E9' : '#FFEBEE',
              },
            ]}>
            <Text
              style={[
                styles.statusText,
                { color: item.isActive ? '#4CAF50' : '#F44336' },
              ]}>
              {item.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [handlePlanPress, handleEditPlan],
  );

  // Memoized key extractor
  const keyExtractor = useCallback(item => item._id, []);

  // Loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <Header title="Plan Management" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6700" />
          <Text style={styles.loadingText}>Loading plans...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Plan Management" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        <View style={styles.headerSection}>
          <Text style={styles.sectionTitle}>All Plans</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreatePlan}
            activeOpacity={0.8}>
            <LinearGradient
              colors={['#ACE1AF', '#ACE1AF']}
              style={styles.createGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}>
              <Icon name="plus" size={18} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Create Plan</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {plans.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="inbox" size={48} color="#999" />
            <Text style={styles.emptyText}>No plans found</Text>
            <Text style={styles.emptySubtext}>
              Create your first plan to get started
            </Text>
          </View>
        ) : (
          <FlatList
            data={plans}
            renderItem={renderPlanItem}
            keyExtractor={keyExtractor}
            scrollEnabled={false}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: m(20),
    paddingBottom: m(100),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: m(16),
  },
  loadingText: {
    fontSize: m(16),
    color: '#666',
    fontWeight: '500',
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(16),
  },
  sectionTitle: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#333',
    letterSpacing: 0.3,
  },
  createButton: {
    borderRadius: m(8),
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  createGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: m(16),
    paddingVertical: m(10),
    gap: m(6),
  },
  createButtonText: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(60),
    gap: m(12),
  },
  emptyText: {
    fontSize: m(18),
    fontWeight: '600',
    color: '#666',
  },
  emptySubtext: {
    fontSize: m(14),
    color: '#999',
    textAlign: 'center',
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(12),
    padding: m(16),
    marginBottom: m(12),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(12),
  },
  planInfo: {
    flex: 1,
    marginRight: m(12),
  },
  planName: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#333',
    marginBottom: m(4),
  },
  planDetails: {
    fontSize: m(14),
    color: '#666',
  },
  planActions: {
    flexDirection: 'row',
    gap: m(8),
  },
  actionButton: {
    padding: m(8),
    borderRadius: m(8),
  },
  planAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: m(8),
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m(6),
    flex: 1,
  },
  featureBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: m(10),
    paddingVertical: m(4),
    borderRadius: m(12),
  },
  featureText: {
    fontSize: m(11),
    fontWeight: '600',
    color: '#1976D2',
  },
  statusBadge: {
    paddingHorizontal: m(12),
    paddingVertical: m(4),
    borderRadius: m(12),
  },
  statusText: {
    fontSize: m(12),
    fontWeight: '600',
  },
});
