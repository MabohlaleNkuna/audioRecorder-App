import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../styles';

export default function Profile({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      const userData = await AsyncStorage.getItem('userData');
      const { name, email, password } = userData ? JSON.parse(userData) : { name: '', email: '', password: '' };
      setName(name);
      setEmail(email);
      setPassword(password);
    };
    loadUserData();
  }, []);

 
  const handleLogout = async () => {
    await AsyncStorage.removeItem('userData');
    Alert.alert('Logged Out', 'You have been logged out');
    navigation.navigate('Login');
  };

  const handleUpdate = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    const updatedUserData = {
      name,
      email,
      password: newPassword || password, 
    };

    await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
    Alert.alert('Success', 'Profile updated successfully');
    setIsEditing(false);  
  };

  const handleDeleteAccount = async () => {
    await AsyncStorage.removeItem('userData');
    Alert.alert('Deleted', 'Your account has been deleted');
    navigation.navigate('Register');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Profile</Text>

      {!isEditing ? (
        <>
          <Text style={{ fontSize: 16, marginBottom: 20 }}>Welcome, {name}</Text>
          <Text style={{ fontSize: 16, marginBottom: 20 }}>Email: {email}</Text>
          <TouchableOpacity style={styles.startButton} onPress={() => setIsEditing(true)}>
            <Text style={styles.buttonText}>Update Details</Text>
          </TouchableOpacity>
        </>
      ) : (
    
        <>
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
            editable={false} 
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Current Password"
            value={password}
            secureTextEntry
            onChangeText={setPassword}
            editable={false} 
          />
          <TextInput
            style={styles.searchInput}
            placeholder="New Password"
            value={newPassword}
            secureTextEntry
            onChangeText={setNewPassword}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Confirm New Password"
            value={confirmPassword}
            secureTextEntry
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity style={styles.startButton} onPress={handleUpdate}>
            <Text style={styles.buttonText}>Update Profile</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={styles.startButton} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.startButton} onPress={handleDeleteAccount}>
        <Text style={styles.buttonText}>Delete Account</Text>
      </TouchableOpacity>
    </View>
  );
}
