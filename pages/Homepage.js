import React from 'react';
import { Text, View, FlatList, Alert, TextInput, TouchableOpacity, Modal } from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome, MaterialIcons, Entypo } from '@expo/vector-icons';
import styles from '../styles';

export default function Homepage({ navigation }) {
  const [recording, setRecording] = React.useState();
  const [recordings, setRecordings] = React.useState([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [recordingTime, setRecordingTime] = React.useState(0);
  const [renameModalVisible, setRenameModalVisible] = React.useState(false);
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [selectedRecordingIndex, setSelectedRecordingIndex] = React.useState(null);

  React.useEffect(() => {
    const loadRecordingsFromStorage = async () => {
      try {
        const savedRecordings = await AsyncStorage.getItem('recordings');
        if (savedRecordings) setRecordings(JSON.parse(savedRecordings));
      } catch (err) {}
    };
    loadRecordingsFromStorage();
  }, []);

  React.useEffect(() => {
    let timer;
    if (recording) {
      timer = setInterval(() => setRecordingTime((prevTime) => prevTime + 1), 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [recording]);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
        setRecording(recording);
        setRecordingTime(0);
      } else {
        Alert.alert('Permission Denied', 'You need to grant permission to access the microphone.');
      }
    } catch (err) {}
  };

  const stopRecording = async () => {
    setRecording(undefined);
    setRecordingTime(0);
    await recording.stopAndUnloadAsync();
    const { sound, status } = await recording.createNewLoadedSoundAsync();
    const fileUri = recording.getURI();
    const allRecordings = [...recordings];
    allRecordings.push({
      sound,
      duration: getDurationFormatted(status.durationMillis),
      file: fileUri,
      date: new Date().toLocaleString(),
      name: `Recording ${allRecordings.length + 1}`,
    });
    setRecordings(allRecordings);
    await AsyncStorage.setItem('recordings', JSON.stringify(allRecordings));
  };

  const getDurationFormatted = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs > 0 ? `${hrs}:` : ''}${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const playRecording = async (sound) => {
    await sound.replayAsync();
  };

  const deleteRecording = async (index) => {
    const updatedRecordings = [...recordings];
    updatedRecordings.splice(index, 1);
    setRecordings(updatedRecordings);
    await AsyncStorage.setItem('recordings', JSON.stringify(updatedRecordings));
  };

  const openRenameModal = (index) => {
    setSelectedRecordingIndex(index);
    setNewName(recordings[index].name || `Recording ${index + 1}`);
    setRenameModalVisible(true);
  };

  const renameRecording = async () => {
    const updatedRecordings = [...recordings];
    updatedRecordings[selectedRecordingIndex].name = newName;
    setRecordings(updatedRecordings);
    setRenameModalVisible(false);
    await AsyncStorage.setItem('recordings', JSON.stringify(updatedRecordings));
  };

  const renderRecordingItem = ({ item, index }) => (
    <View style={styles.row}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.details}>{item.duration} | {item.date}</Text>
      <View style={styles.iconContainer}>
        <FontAwesome name="play" size={24} color="#4CAF50" onPress={() => playRecording(item.sound)} />
        <MaterialIcons name="edit" size={24} color="#FF9800" onPress={() => openRenameModal(index)} />
        <MaterialIcons name="delete" size={24} color="#F44336" onPress={() => deleteRecording(index)} />
        {/* Backup icon added here */}
        <FontAwesome name="cloud-upload" size={24} color="#2196F3" onPress={() => Alert.alert('Backup feature coming soon!')} />
      </View>
    </View>
  );
  

  const filteredRecordings = recordings.filter((recording) =>
    (recording.name && recording.name.includes(searchTerm)) || recording.date.includes(searchTerm)
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Mabohlale's Recording App</Text>
        <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)}>
          <Entypo name="dots-three-vertical" size={24} color="black" />
        </TouchableOpacity>
      </View>
      {menuVisible && (
        <View style={styles.menu}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.menuItem}>Profile</Text>
          </TouchableOpacity>
        </View>
      )}
      <TextInput
        style={styles.searchInput}
        placeholder="Search recordings..."
        onChangeText={setSearchTerm}
        value={searchTerm}
      />
      <TouchableOpacity
        style={recording ? styles.stopButton : styles.startButton}
        onPress={recording ? stopRecording : startRecording}
      >
        <Text style={styles.buttonText}>{recording ? 'Stop Recording' : 'Start Recording'}</Text>
      </TouchableOpacity>
      {recording && (
        <View style={styles.recordingIndicator}>
          <Text style={styles.recordingTime}>{getDurationFormatted(recordingTime * 1000)}</Text>
        </View>
      )}
      <View style={styles.listContainer}>
        <FlatList
          data={filteredRecordings}
          renderItem={renderRecordingItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
      <Modal visible={renameModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Rename Recording</Text>
          <TextInput style={styles.modalInput} placeholder="New name" value={newName} onChangeText={setNewName} />
          <TouchableOpacity onPress={renameRecording}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setRenameModalVisible(false)}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}
