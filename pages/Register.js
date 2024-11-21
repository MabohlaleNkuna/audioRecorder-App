import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../styles';

export default function Register({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    const userData = {
      name,
      email,
      password,
    };

    await AsyncStorage.setItem('userData', JSON.stringify(userData));
    Alert.alert('Success', 'Account created successfully');
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Register</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.searchInput}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.searchInput}
        placeholder="Password"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.searchInput}
        placeholder="Confirm Password"
        value={confirmPassword}
        secureTextEntry
        onChangeText={setConfirmPassword}
      />
      <TouchableOpacity style={styles.startButton} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
    </View>
  );
}
