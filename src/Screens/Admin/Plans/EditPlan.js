import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { m } from 'walstar-rn-responsive';
import Header from '../../../Components/Header';

export default function EditPlan({ navigation }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planName, setPlanName] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [duration, setDuration] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [description, setDescription] = useState('');

  // Static plans data
  const plans = [
    {
      id: 1,
      name: 'Personal Loan Basic',
      interestRate: 12.5,
      duration: 12,
      minAmount: 10000,
      maxAmount: 500000,
      status: 'Active',
    },
    {
      id: 2,
      name: 'Personal Loan Premium',
      interestRate: 11.5,
      duration: 24,
      minAmount: 50000,
      maxAmount: 1000000,
      status: 'Active',
    },
    {
      id: 3,
      name: 'Business Loan',
      interestRate: 10.5,
      duration: 36,
      minAmount: 100000,
      maxAmount: 5000000,
      status: 'Active',
    },
  ];

  const handleSelectPlan = plan => {
    setSelectedPlan(plan);
    setPlanName(plan.name);
    setInterestRate(plan.interestRate.toString());
    setDuration(plan.duration.toString());
    setMinAmount(plan.minAmount.toString());
    setMaxAmount(plan.maxAmount.toString());
    setDescription(`${plan.name} - ${plan.duration} months`);
  };

  const handleUpdate = () => {
    if (!selectedPlan) {
      Alert.alert('Error', 'Please select a plan to edit');
      return;
    }
    if (!planName || !interestRate || !duration || !minAmount || !maxAmount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    Alert.alert('Success', 'Plan updated successfully!', [
      {
        text: 'OK',
        onPress: () => {
          setSelectedPlan(null);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleDelete = plan => {
    Alert.alert('Delete Plan', `Are you sure you want to delete ${plan.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Success', 'Plan deleted successfully!');
        },
      },
    ]);
  };

  const renderPlanItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.planCard,
        selectedPlan?.id === item.id && styles.planCardSelected,
      ]}
      onPress={() => handleSelectPlan(item)}>
      <View style={styles.planHeader}>
        <View style={styles.planInfo}>
          <Text style={styles.planName}>{item.name}</Text>
          <Text style={styles.planDetails}>
            {item.interestRate}% • {item.duration} months
          </Text>
        </View>
        <View style={styles.planActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSelectPlan(item)}>
            <Icon name="edit" size={18} color="#2196F3" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item)}>
            <Icon name="trash-2" size={18} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.planAmounts}>
        <Text style={styles.amountText}>
          ₹{item.minAmount.toLocaleString()} - ₹{item.maxAmount.toLocaleString()}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: '#E8F5E9' }]}>
          <Text style={[styles.statusText, { color: '#4CAF50' }]}>
            {item.status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title="Edit Plan" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Select Plan to Edit</Text>
        <FlatList
          data={plans}
          renderItem={renderPlanItem}
          keyExtractor={item => item.id.toString()}
          scrollEnabled={false}
        />

        {selectedPlan && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Edit Plan Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Plan Name *</Text>
              <TextInput
                style={styles.input}
                value={planName}
                onChangeText={setPlanName}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Interest Rate (%) *</Text>
              <TextInput
                style={styles.input}
                value={interestRate}
                onChangeText={setInterestRate}
                keyboardType="decimal-pad"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Duration (Months) *</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: m(8) }]}>
                <Text style={styles.label}>Min Amount (₹) *</Text>
                <TextInput
                  style={styles.input}
                  value={minAmount}
                  onChangeText={setMinAmount}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: m(8) }]}>
                <Text style={styles.label}>Max Amount (₹) *</Text>
                <TextInput
                  style={styles.input}
                  value={maxAmount}
                  onChangeText={setMaxAmount}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleUpdate}>
              <LinearGradient
                colors={['#ff6700', '#ff7900']}
                style={styles.submitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}>
                <Icon name="save" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Update Plan</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
  sectionTitle: {
    fontSize: m(18),
    fontWeight: '700',
    color: '#333',
    marginBottom: m(16),
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(12),
    padding: m(16),
    marginBottom: m(12),
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  planCardSelected: {
    borderColor: '#ff6700',
    backgroundColor: '#FFF7ED',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: m(12),
  },
  planInfo: {
    flex: 1,
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
  },
  planAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountText: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#333',
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
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    padding: m(24),
    marginTop: m(20),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formTitle: {
    fontSize: m(20),
    fontWeight: '700',
    color: '#333',
    marginBottom: m(20),
  },
  inputGroup: {
    marginBottom: m(20),
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: m(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: m(8),
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: m(12),
    padding: m(16),
    fontSize: m(16),
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: m(100),
    textAlignVertical: 'top',
  },
  submitButton: {
    borderRadius: m(12),
    overflow: 'hidden',
    marginTop: m(8),
    elevation: 4,
    shadowColor: '#ff6700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: m(16),
    gap: m(8),
  },
  submitButtonText: {
    fontSize: m(16),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});



