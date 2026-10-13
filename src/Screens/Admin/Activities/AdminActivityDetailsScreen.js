import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';
import { getAdminRecentActivities } from '../../../Redux/Slices/adminActivitiesSlice';

export default function AdminActivityDetailsScreen() {
  const dispatch = useDispatch();
  const { activities, loading } = useSelector((state) => state.adminActivities);
  const [refreshing, setRefreshing] = useState(false);

  const loadActivities = useCallback(() => {
    dispatch(getAdminRecentActivities({ limit: 50 }));
  }, [dispatch]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(getAdminRecentActivities({ limit: 50 })).finally(() => setRefreshing(false));
  }, [dispatch]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Just now';
    try {
      const date = new Date(dateStr);
      return `${date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
      })} at ${date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } catch {
      return 'Recent';
    }
  };

  const getActivityConfig = (type) => {
    switch (type) {
      case 'subscription_purchased':
        return { icon: 'shopping-cart', color: '#16a34a', bg: '#dcfce7', label: 'Subscription' };
      case 'plan_updated':
        return { icon: 'edit-3', color: '#2563eb', bg: '#dbeafe', label: 'Plan Config' };
      case 'lender_registered':
        return { icon: 'user-plus', color: '#7c3aed', bg: '#ede9fe', label: 'Lender Onboarding' };
      default:
        return { icon: 'activity', color: '#0284c7', bg: '#e0f2fe', label: 'System Event' };
    }
  };

  const renderItem = ({ item }) => {
    const config = getActivityConfig(item.type || item.action);

    return (
      <View style={styles.activityItem}>
        <View style={[styles.iconContainer, { backgroundColor: config.bg }]}>
          <Icon name={config.icon} size={18} color={config.color} />
        </View>
        <View style={styles.activityContent}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>{item.title || item.action || 'Platform Event'}</Text>
            <View style={[styles.typeBadge, { backgroundColor: config.bg }]}>
              <Text style={[styles.typeText, { color: config.color }]}>{config.label}</Text>
            </View>
          </View>
          <Text style={styles.activityDesc}>{item.description || item.details || 'Event logged successfully.'}</Text>
          <Text style={styles.activityTime}>{formatDate(item.createdAt || item.timestamp)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Platform Activity Log" />

      {loading && !refreshing && activities.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Fetching activity audit trail...</Text>
        </View>
      ) : (
        <FlatList
          data={activities}
          renderItem={renderItem}
          keyExtractor={(item, index) => item._id || item.id || String(index)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="check-circle" size={44} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Activities Recorded</Text>
              <Text style={styles.emptySubtitle}>Live events and audit logs will appear here.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    padding: m(16),
    paddingBottom: m(80),
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: m(12),
    padding: m(14),
    marginBottom: m(10),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  iconContainer: {
    width: m(38),
    height: m(38),
    borderRadius: m(19),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(12),
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityTitle: {
    fontSize: m(13),
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: m(6),
    paddingVertical: m(2),
    borderRadius: m(4),
  },
  typeText: {
    fontSize: m(10),
    fontWeight: '700',
  },
  activityDesc: {
    fontSize: m(12),
    color: '#475569',
    marginTop: m(3),
  },
  activityTime: {
    fontSize: m(10),
    color: '#94a3b8',
    marginTop: m(6),
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: m(60),
  },
  emptyTitle: {
    fontSize: m(15),
    fontWeight: '700',
    color: '#475569',
    marginTop: m(10),
  },
  emptySubtitle: {
    fontSize: m(12),
    color: '#94a3b8',
    marginTop: m(4),
  },
});
