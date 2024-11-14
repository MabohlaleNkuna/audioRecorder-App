import React from 'react'; 
import { Text, View, Button, FlatList, Alert, TextInput, TouchableOpacity, StatusBar } from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from './styles';

export default function App() {
  const [recording, setRecording] = React.useState();
  const [recordings, setRecordings] = React.useState([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [recordingTime, setRecordingTime] = React.useState(0);

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
    });

    setRecordings(allRecordings);
    await AsyncStorage.setItem('recordings', JSON.stringify(allRecordings));
  }

  function getDurationFormatted(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const hrsDisplay = hrs > 0 ? `${hrs}:` : "";
    const minsDisplay = `${hrs > 0 && mins < 10 ? '0' : ''}${mins}:`;
    const secsDisplay = `${secs < 10 ? '0' : ''}${secs}`;

    return `${hrsDisplay}${minsDisplay}${secsDisplay}`;
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

  function renderRecordingItem({ item, index }) {
    return (
      <View style={styles.row}>
        <Text style={styles.fill}>
          Recording #{String(index + 1).padStart(3, '0')} | {item.duration} | {item.date}
        </Text>
        <View style={styles.buttonContainer}>
          <Button title="Play" onPress={() => playRecording(item.sound)} />
          <View style={{ width: 3 }} />
          <Button title="Delete" onPress={() => deleteRecording(index)} />
        </View>
      </View>
    );
  }

  const filteredRecordings = recordings.filter((recording, index) =>
    String(index + 1).padStart(3, '0').includes(searchTerm) || recording.date.includes(searchTerm)
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#004AAD" />
      <Text style={styles.header}>Recording App</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search recordings by number..."
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
        <Text style={styles.recordingTime}>{getDurationFormatted(recordingTime)}</Text>
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
