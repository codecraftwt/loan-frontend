import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { m } from 'walstar-rn-responsive';
import Header from '../../Components/Header';

export default function AddPlan({ navigation }) {
  const [planName, setPlanName] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [duration, setDuration] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!planName || !interestRate || !duration || !minAmount || !maxAmount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Here you would make API call to add plan
    Alert.alert('Success', 'Plan added successfully!', [
      {
        text: 'OK',
        onPress: () => {
          // Reset form
          setPlanName('');
          setInterestRate('');
          setDuration('');
          setMinAmount('');
          setMaxAmount('');
          setDescription('');
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header title="Add Plan" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Create New Loan Plan</Text>
          <Text style={styles.formSubtitle}>
            Fill in the details to create a new loan plan
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Plan Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Personal Loan Basic"
              value={planName}
              onChangeText={setPlanName}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Interest Rate (%) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 12.5"
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
              placeholder="e.g., 12, 24, 36"
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
                placeholder="e.g., 10000"
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
                placeholder="e.g., 500000"
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
              placeholder="Enter plan description..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              placeholderTextColor="#999"
            />
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <LinearGradient
              colors={['#ff6700', '#ff7900']}
              style={styles.submitGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}>
              <Icon name="check" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Add Plan</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: m(16),
    padding: m(24),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formTitle: {
    fontSize: m(24),
    fontWeight: '700',
    color: '#333',
    marginBottom: m(8),
  },
  formSubtitle: {
    fontSize: m(14),
    color: '#666',
    marginBottom: m(24),
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

