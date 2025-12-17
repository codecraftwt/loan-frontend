import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';

export default function LenderList() {
  const [searchQuery, setSearchQuery] = useState('');

  // Static lender data
  const lenders = [
    {
      id: 1,
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@email.com',
      mobile: '9876543210',
      totalLoans: 25,
      activeLoans: 12,
      totalAmount: 2500000,
      status: 'Active',
      joinDate: '2024-01-15',
    },
    {
      id: 2,
      name: 'Priya Sharma',
      email: 'priya.sharma@email.com',
      mobile: '9876543211',
      totalLoans: 18,
      activeLoans: 8,
      totalAmount: 1800000,
      status: 'Active',
      joinDate: '2024-02-20',
    },
    {
      id: 3,
      name: 'Amit Patel',
      email: 'amit.patel@email.com',
      mobile: '9876543212',
      totalLoans: 32,
      activeLoans: 15,
      totalAmount: 3200000,
      status: 'Active',
      joinDate: '2023-12-10',
    },
    {
      id: 4,
      name: 'Sneha Reddy',
      email: 'sneha.reddy@email.com',
      mobile: '9876543213',
      totalLoans: 15,
      activeLoans: 6,
      totalAmount: 1500000,
      status: 'Inactive',
      joinDate: '2024-03-05',
    },
    {
      id: 5,
      name: 'Vikram Singh',
      email: 'vikram.singh@email.com',
      mobile: '9876543214',
      totalLoans: 28,
      activeLoans: 14,
      totalAmount: 2800000,
      status: 'Active',
      joinDate: '2024-01-28',
    },
  ];

  const filteredLenders = lenders.filter(
    lender =>
      lender.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lender.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lender.mobile.includes(searchQuery),
  );

  const renderLenderItem = ({ item }) => (
    <View style={styles.lenderCard}>
      <View style={styles.lenderHeader}>
        <View style={styles.lenderAvatar}>
          <Text style={styles.avatarText}>
            {item.name
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()}
          </Text>
        </View>
        <View style={styles.lenderInfo}>
          <Text style={styles.lenderName}>{item.name}</Text>
          <Text style={styles.lenderEmail}>{item.email}</Text>
          <Text style={styles.lenderMobile}>{item.mobile}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === 'Active' ? '#E8F5E9' : '#FFEBEE',
            },
          ]}>
          <Text
            style={[
              styles.statusText,
              { color: item.status === 'Active' ? '#4CAF50' : '#F44336' },
            ]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.lenderStats}>
        <View style={styles.statItem}>
          <Icon name="file-text" size={16} color="#2196F3" />
          <Text style={styles.statLabel}>Total Loans</Text>
          <Text style={styles.statValue}>{item.totalLoans}</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="check-circle" size={16} color="#4CAF50" />
          <Text style={styles.statLabel}>Active</Text>
          <Text style={styles.statValue}>{item.activeLoans}</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="dollar-sign" size={16} color="#FF9800" />
          <Text style={styles.statLabel}>Total Amount</Text>
          <Text style={styles.statValue}>
            ₹{(item.totalAmount / 100000).toFixed(1)}L
          </Text>
        </View>
      </View>

      <View style={styles.lenderFooter}>
        <Text style={styles.joinDate}>
          Joined: {new Date(item.joinDate).toLocaleDateString()}
        </Text>
        <TouchableOpacity style={styles.viewButton}>
          <Text style={styles.viewButtonText}>View Details</Text>
          <Icon name="chevron-right" size={16} color="#ff6700" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Lender List" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, or mobile..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="x" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Lenders</Text>
            <Text style={styles.summaryValue}>{lenders.length}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Active</Text>
            <Text style={styles.summaryValue}>
              {lenders.filter(l => l.status === 'Active').length}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Loans</Text>
            <Text style={styles.summaryValue}>
              {lenders.reduce((sum, l) => sum + l.totalLoans, 0)}
            </Text>
          </View>
        </View>

        {/* Lender List */}
        <FlatList
          data={filteredLenders}
          renderItem={renderLenderItem}
          keyExtractor={item => item.id.toString()}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="users" size={48} color="#CCC" />
              <Text style={styles.emptyText}>No lenders found</Text>
            </View>
          }
        />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: m(12),
    paddingHorizontal: m(16),
    paddingVertical: m(12),
    marginBottom: m(16),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: m(12),
  },
  searchInput: {
    flex: 1,
    fontSize: m(16),
    color: '#333',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: m(12),
    padding: m(16),
    marginBottom: m(16),
    justifyContent: 'space-around',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: m(12),
    color: '#666',
    marginBottom: m(4),
  },
  summaryValue: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#ff6700',
  },
  lenderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(12),
    padding: m(16),
    marginBottom: m(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  lenderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: m(16),
  },
  lenderAvatar: {
    width: m(50),
    height: m(50),
    borderRadius: m(25),
    backgroundColor: '#ff6700',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: m(12),
  },
  avatarText: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  lenderInfo: {
    flex: 1,
  },
  lenderName: {
    fontSize: m(16),
    fontWeight: '700',
    color: '#333',
    marginBottom: m(4),
  },
  lenderEmail: {
    fontSize: m(12),
    color: '#666',
    marginBottom: m(2),
  },
  lenderMobile: {
    fontSize: m(12),
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: m(12),
    paddingVertical: m(6),
    borderRadius: m(12),
  },
  statusText: {
    fontSize: m(12),
    fontWeight: '600',
  },
  lenderStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: m(12),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: m(12),
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: m(11),
    color: '#666',
    marginTop: m(4),
    marginBottom: m(2),
  },
  statValue: {
    fontSize: m(14),
    fontWeight: '700',
    color: '#333',
  },
  lenderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  joinDate: {
    fontSize: m(12),
    color: '#666',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m(4),
  },
  viewButtonText: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#ff6700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(40),
  },
  emptyText: {
    fontSize: m(16),
    color: '#999',
    marginTop: m(12),
  },
});



