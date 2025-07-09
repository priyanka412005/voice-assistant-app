import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  StatusBar,
  ScrollView,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

const VoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [recording, setRecording] = useState(null);
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initialize animations
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (isListening) {
      startPulseAnimation();
      startWaveAnimation();
    } else {
      stopAnimations();
    }
  }, [isListening]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startWaveAnimation = () => {
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopAnimations = () => {
    pulseAnim.stopAnimation();
    waveAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    Animated.timing(waveAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const startRecording = async () => {
    try {
      if (permissionResponse?.status !== 'granted') {
        console.log('Requesting permission..');
        await requestPermission();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsListening(true);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please check permissions.');
    }
  };

  const stopRecording = async () => {
    console.log('Stopping recording..');
    setIsListening(false);
    setIsProcessing(true);
    
    if (!recording) {
      setIsProcessing(false);
      return;
    }

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      
      const uri = recording.getURI();
      console.log('Recording stopped and stored at', uri);
      
      // Simulate processing the audio
      await processAudioInput(uri);
      
      setRecording(null);
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
    setIsProcessing(false);
  };

  const processAudioInput = async (audioUri) => {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock responses for demonstration
    const mockResponses = [
      "Hello! I'm your AI assistant. How can I help you today?",
      "I understand you're looking for information. Let me help you with that.",
      "That's an interesting question. Based on my knowledge, I can tell you...",
      "I'm here to assist you with various tasks. What would you like to know?",
      "Thank you for your question. I'm processing your request now.",
    ];
    
    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    
    // Add user message (simulated)
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      text: 'Voice input received',
      timestamp: new Date().toLocaleTimeString(),
    }]);
    
    // Add AI response
    setMessages(prev => [...prev, {
      id: Date.now() + 1,
      type: 'ai',
      text: randomResponse,
      timestamp: new Date().toLocaleTimeString(),
    }]);
    
    setCurrentResponse(randomResponse);
    
    // Speak the response
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Speech.speak(randomResponse, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.8,
      });
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setCurrentResponse('');
  };

  const renderMessage = (message) => (
    <View key={message.id} style={[
      styles.messageContainer,
      message.type === 'user' ? styles.userMessage : styles.aiMessage
    ]}>
      <View style={styles.messageHeader}>
        <Ionicons 
          name={message.type === 'user' ? 'person' : 'chatbubble-ellipses'} 
          size={16} 
          color={message.type === 'user' ? '#007AFF' : '#34C759'} 
        />
        <Text style={styles.messageTime}>{message.timestamp}</Text>
      </View>
      <Text style={styles.messageText}>{message.text}</Text>
    </View>
  );

  const waveOpacity = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>AI Voice Assistant</Text>
          <TouchableOpacity onPress={clearMessages} style={styles.clearButton}>
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Messages Area */}
        <ScrollView 
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="mic" size={60} color="#666" />
              <Text style={styles.emptyStateText}>
                Tap the microphone to start voice interaction
              </Text>
            </View>
          ) : (
            messages.map(renderMessage)
          )}
        </ScrollView>

        {/* Status Display */}
        <View style={styles.statusContainer}>
          {isProcessing && (
            <View style={styles.statusItem}>
              <Ionicons name="sync" size={16} color="#FF9F0A" />
              <Text style={styles.statusText}>Processing your request...</Text>
            </View>
          )}
          {isListening && (
            <View style={styles.statusItem}>
              <Ionicons name="radio-button-on" size={16} color="#FF3B30" />
              <Text style={styles.statusText}>Listening...</Text>
            </View>
          )}
        </View>

        {/* Voice Control Button */}
        <View style={styles.voiceControlContainer}>
          {/* Wave Animation Background */}
          {isListening && (
            <Animated.View style={[
              styles.waveCircle,
              {
                opacity: waveOpacity,
                transform: [{ scale: waveAnim }]
              }
            ]} />
          )}
          
          <TouchableOpacity
            style={[
              styles.voiceButton,
              isListening && styles.voiceButtonActive,
              isProcessing && styles.voiceButtonProcessing
            ]}
            onPress={handleVoiceToggle}
            disabled={isProcessing}
          >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Ionicons
                name={isListening ? "stop" : "mic"}
                size={32}
                color="#fff"
              />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Bottom Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionText}>
            {isListening 
              ? "Speak now... Tap to stop" 
              : isProcessing 
                ? "Processing your voice input..." 
                : "Tap and hold to speak with AI assistant"
            }
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  clearButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messagesContent: {
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: height * 0.2,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 40,
  },
  messageContainer: {
    marginBottom: 15,
    padding: 15,
    borderRadius: 15,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#2C2C54',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageTime: {
    color: '#ccc',
    fontSize: 12,
    marginLeft: 8,
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  statusContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: '#FF9F0A',
    fontSize: 14,
    marginLeft: 8,
  },
  voiceControlContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    position: 'relative',
  },
  waveCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 59, 48, 0.5)',
  },
  voiceButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  voiceButtonActive: {
    backgroundColor: '#FF3B30',
    shadowColor: '#FF3B30',
  },
  voiceButtonProcessing: {
    backgroundColor: '#FF9F0A',
    shadowColor: '#FF9F0A',
  },
  instructionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  instructionText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default VoiceAssistant;