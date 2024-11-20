import React from 'react';
import { View, StatusBar } from 'react-native';
import Homepage from './pages/Homepage';
import styles from './styles';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#004AAD" />
      <Homepage />
    </View>
  );
}
