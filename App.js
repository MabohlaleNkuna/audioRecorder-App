import React from 'react';
import { StyleSheet, Text, View, Button, FlatList, Alert, TextInput, TouchableOpacity, StatusBar } from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [recording, setRecording] = React.useState();
  const [recordings, setRecordings] = React.useState([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [recordingTime, setRecordingTime] = React.useState(0); // Store the recording time

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
      // Start a timer 
      timer = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
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

  // Stop recording
  async function stopRecording() {
    setRecording(undefined);
    setRecordingTime(0); 

    await recording.stopAndUnloadAsync();
    const { sound, status } = await recording.createNewLoadedSoundAsync();

    const fileUri = recording.getURI();

    // Save recording details
    let allRecordings = [...recordings];
    allRecordings.push({
      sound: sound,
      duration: getDurationFormatted(status.durationMillis),
      file: fileUri,
      date: new Date().toLocaleString(),
    });

    setRecordings(allRecordings);

    await AsyncStorage.setItem('recordings', JSON.stringify(allRecordings));
  }

  function getDurationFormatted(milliseconds) {
    const minutes = Math.floor(milliseconds / 1000 / 60);
    const seconds = Math.round((milliseconds / 1000) % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  // Play the audio
  async function playRecording(sound) {
    await sound.replayAsync();
  }

  // Delete
  async function deleteRecording(index) {
    const updatedRecordings = [...recordings];
    updatedRecordings.splice(index, 1);
    setRecordings(updatedRecordings);

    await AsyncStorage.setItem('recordings', JSON.stringify(updatedRecordings));
  }

  function renderRecordingItem({ item, index }) {
    return (
      <View style={styles.row}>
        <Text style={styles.fill}>
          Recording #{index + 1} | {item.duration} | {item.date}
        </Text>
        <Button title="Play" onPress={() => playRecording(item.sound)} />
        <Button title="Delete" onPress={() => deleteRecording(index)} />
      </View>
    );
  }

  // Filter recordings based on search term
  const filteredRecordings = recordings.filter(recording =>
    recording.date.includes(searchTerm) || recording.file.includes(searchTerm)
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#004AAD" />

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
          <Text style={styles.recordingTime}>{recordingTime}s</Text>
        </View>
      )}

      <Text style={styles.recordingCount}>Recording Count: {recordings.length}</Text>

      <FlatList
        data={filteredRecordings}
        renderItem={renderRecordingItem}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Transparent background for the entire screen
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
    marginTop: 0,
    height: '100%',
  },
  searchInput: {
    height: 45,
    width: '100%',
    borderColor: '#004AAD',
    borderWidth: 1.5,
    paddingHorizontal: 10,
    marginBottom: 20,
    marginTop: 40,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    padding: 10,
    width: '90%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.6)', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 3,
    height:100
  },
  fill: {
    flex: 1,
    marginRight: 10,
  },
  startButton: {
    backgroundColor: '#004AAD',
    padding: 18,
    borderRadius: 8,
    marginBottom: 20,
  },
  stopButton: {
    backgroundColor: '#F44336', 
    padding: 18,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  recordingCount: {
    marginTop: 20,
    fontSize: 16,
    color: '#333',
  },
  recordingIndicator: {
    marginTop: 100,
    padding: 100,
    backgroundColor: '#004AAD', 
    borderRadius: 50,
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  recordingTime: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
