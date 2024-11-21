import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../styles';

export default function Profile({ navigation }) {
  const [email, setEmail] = useState('');

  useEffect(() => {
    const loadUserData = async () => {
      const userData = await AsyncStorage.getItem('userData');
      const { email } = userData ? JSON.parse(userData) : { email: 'Guest' };
      setEmail(email);
    };
    loadUserData();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userData');
    Alert.alert('Logged Out', 'You have been logged out');
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Profile</Text>
      <Text style={{ fontSize: 16, marginBottom: 20 }}>Welcome, {email}</Text>
      <TouchableOpacity style={styles.startButton} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
