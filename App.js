import React from 'react'; 
import { Text, View, FlatList, Alert, TextInput, TouchableOpacity, StatusBar, Modal } from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import styles from './styles';

export default function App() {
  const [recording, setRecording] = React.useState();
  const [recordings, setRecordings] = React.useState([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [recordingTime, setRecordingTime] = React.useState(0);
  const [renameModalVisible, setRenameModalVisible] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [selectedRecordingIndex, setSelectedRecordingIndex] = React.useState(null);

  React.useEffect(() => {
    const loadRecordingsFromStorage = async () => {
      try {
        const savedRecordings = await AsyncStorage.getItem('recordings');
        if (savedRecordings) {
          setRecordings(JSON.parse(savedRecordings));
        }
      } catch (err) {
        console.error('Error loading recordings', err);
      }
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

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === "granted") {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
        setRecording(recording);
        setRecordingTime(0);
      } else {
        Alert.alert("Permission Denied", "You need to grant permission to access the microphone.");
      }
    } catch (err) {
      console.error("Error starting recording", err);
    }
  }

  async function stopRecording() {
    setRecording(undefined);
    setRecordingTime(0);
  
    await recording.stopAndUnloadAsync();
    const { sound, status } = await recording.createNewLoadedSoundAsync();
    const fileUri = recording.getURI();
    let allRecordings = [...recordings];
    allRecordings.push({
      sound: sound,
      duration: getDurationFormatted(status.durationMillis),
      file: fileUri,
      date: new Date().toLocaleString(),
      name: `Recording ${allRecordings.length + 1}`,
    });

    setRecordings(allRecordings);
    await AsyncStorage.setItem('recordings', JSON.stringify(allRecordings));
  }

  function getDurationFormatted(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return `${hrs > 0 ? `${hrs}:` : ''}${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  async function playRecording(sound) {
    await sound.replayAsync();
  }

  async function deleteRecording(index) {
    const updatedRecordings = [...recordings];
    updatedRecordings.splice(index, 1);
    setRecordings(updatedRecordings);
    await AsyncStorage.setItem('recordings', JSON.stringify(updatedRecordings));
  }

  function openRenameModal(index) {
    setSelectedRecordingIndex(index);
    setNewName(recordings[index].name || `Recording ${index + 1}`);
    setRenameModalVisible(true);
  }

  async function renameRecording() {
    const updatedRecordings = [...recordings];
    updatedRecordings[selectedRecordingIndex].name = newName;

    setRecordings(updatedRecordings);
    setRenameModalVisible(false);
    await AsyncStorage.setItem('recordings', JSON.stringify(updatedRecordings));
  }

  function renderRecordingItem({ item, index }) {
    return (
      <View style={styles.row}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.details}>{item.duration} | {item.date}</Text>
        <View style={styles.iconContainer}>
          <FontAwesome name="play" size={24} color="#4CAF50" onPress={() => playRecording(item.sound)} />
          <MaterialIcons name="edit" size={24} color="#FF9800" onPress={() => openRenameModal(index)} />
          <MaterialIcons name="delete" size={24} color="#F44336" onPress={() => deleteRecording(index)} />
        </View>
      </View>
    );
  }

  const filteredRecordings = recordings.filter((recording) =>
    (recording.name && recording.name.includes(searchTerm)) || 
    recording.date.includes(searchTerm)
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#004AAD" />
      <Text style={styles.header}>Recording App</Text>

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

      <FlatList
        data={filteredRecordings}
        renderItem={renderRecordingItem}
        keyExtractor={(item, index) => index.toString()}
      />

      <Modal visible={renameModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Rename Recording</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="New name"
            value={newName}
            onChangeText={setNewName}
          />
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
