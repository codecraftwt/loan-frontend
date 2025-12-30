import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {useNavigation} from '@react-navigation/native';
import {m} from 'walstar-rn-responsive';

export default function SettingsScreen() {
  const navigation = useNavigation();

  const handleLogout = () => {
    navigation.navigate('Login');
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
        <Text style={styles.headerText}>Settings</Text>
      </View>

      {/* Settings Options */}
      <View style={styles.settingsOptions}>
        <TouchableOpacity style={styles.option}>
          <Icon name="user" size={24} color="#b80266" />
          <Text style={styles.optionText}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.option}
          onPress={() => navigation.navigate('NotificationTestScreen')}>
          <Icon name="bell" size={24} color="#b80266" />
          <Text style={styles.optionText}>Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <Icon name="shield" size={24} color="#b80266" />
          <Text style={styles.optionText}>Privacy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <Icon name="credit-card" size={24} color="#b80266" />
          <Text style={styles.optionText}>Payment Methods</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <Icon name="settings" size={24} color="#b80266" />
          <Text style={styles.optionText}>App Preferences</Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={styles.option} onPress={handleLogout}>
          <Icon name="log-out" size={24} color="#b80266" />
          <Text style={styles.logOutText}>Logout</Text>
        </TouchableOpacity>
      </View>
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
  settingsOptions: {
    marginTop: m(20),
    paddingHorizontal: m(20),
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: m(15),
    borderBottomWidth: m(1),
    borderBottomColor: '#E0E0E0',
  },
  optionText: {
    fontSize: m(16),
    color: '#333',
    marginLeft: m(10),
  },
  logOutText: {
    fontSize: m(16),
    color: '#b80266',
    marginLeft: m(10),
  },
  backButton: {
    position: 'absolute',
    left: m(15),
    top: m(10),
    padding: m(10),
  },
});
