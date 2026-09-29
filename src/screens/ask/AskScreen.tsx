// =============================================
// EVI - "Ask My Household" AI Chat Screen
// =============================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../theme/colors';
import { ChatMessage } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { askHousehold, HouseholdContext } from '../../services/aiService';
import { getHouseholdDocuments } from '../../services/documentService';
import { getHouseholdTasks } from '../../services/taskService';
import { getHouseholdVehicles } from '../../services/vehicleService';
import { getHomeProfile } from '../../services/householdService';
import { Analytics } from '../../services/analyticsService';
import { isOnline } from '../../hooks/useNetworkStatus';

const SUGGESTED_QUESTIONS = [
  "What do I need to take care of this week?",
  "When does my lease expire?",
  "What warranties do I currently have?",
  "What maintenance does my house need?",
  "What should I do before winter?",
  "What documents am I missing?",
];

export default function AskScreen() {
  const { currentHousehold } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for typing indicator
  useEffect(() => {
    if (isTyping) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isTyping]);

  const handleSend = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    if (!isOnline()) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "You're offline right now, so I can't reach EVI's AI. Reconnect and try again.",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    setIsTyping(true);
    Analytics.askQuestion();

    try {
      // Build household context in parallel
      let context: HouseholdContext = {
        homeProfile: null,
        documents: [],
        tasks: [],
        vehicles: [],
      };

      if (currentHousehold?.id) {
        const hid = currentHousehold.id;
        const [profile, docs, tasks, vehicles] = await Promise.all([
          getHomeProfile(hid).catch(() => null),
          getHouseholdDocuments(hid).catch(() => []),
          getHouseholdTasks(hid).catch(() => []),
          getHouseholdVehicles(hid).catch(() => []),
        ]);
        context = {
          homeProfile: profile,
          documents: docs,
          tasks,
          vehicles,
        };
      }

      const response = await askHousehold(messageText, context, messages);

      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        sources: response.sources,
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (e: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I hit a snag connecting to my brain. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Text style={styles.aiAvatarText}>E</Text>
          </View>
        )}
        <View style={[styles.messageContent, isUser ? styles.userContent : styles.aiContent]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  const showWelcome = messages.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Ask EVI</Text>
          {messages.length > 0 && (
            <TouchableOpacity onPress={() => setMessages([])}>
              <Text style={styles.clearText}>New Chat</Text>
            </TouchableOpacity>
          )}
        </View>

        {showWelcome ? (
          // Welcome / Empty State
          <View style={styles.welcomeContainer}>
            <View style={styles.welcomeAvatar}>
              <Text style={styles.welcomeAvatarText}>EVI</Text>
            </View>
            <Text style={styles.welcomeTitle}>Ask me anything about your household</Text>
            <Text style={styles.welcomeSubtitle}>
              I can help you find documents, track deadlines, understand your home, and manage your tasks.
            </Text>

            <Text style={styles.suggestionsTitle}>Try asking:</Text>
            <View style={styles.suggestions}>
              {SUGGESTED_QUESTIONS.map((question, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => handleSend(question)}
                >
                  <Text style={styles.suggestionText}>{question}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          // Chat Messages
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            ListFooterComponent={
              isTyping ? (
                <View style={styles.typingContainer}>
                  <View style={styles.aiAvatar}>
                    <Text style={styles.aiAvatarText}>E</Text>
                  </View>
                  <Animated.View style={[styles.typingBubble, { opacity: pulseAnim }]}>
                    <Text style={styles.typingText}>EVI is thinking...</Text>
                  </Animated.View>
                </View>
              ) : null
            }
          />
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Ask about your household..."
            placeholderTextColor={Colors.textTertiary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={() => handleSend()}
            disabled={!inputText.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() ? Colors.textInverse : Colors.textTertiary}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Simulated responses (will be replaced with actual AI)
function getSimulatedResponse(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('lease') && q.includes('expire')) {
    return "I don't have your lease information yet. Upload your lease document to the Vault and I'll extract the key dates for you, including the expiration date, notice period, and renewal window.";
  }
  if (q.includes('warranty') || q.includes('warranties')) {
    return "You haven't uploaded any warranty documents yet. Once you do, I'll track all your warranty coverage and alert you before they expire. Go to the Vault tab to upload warranty documents.";
  }
  if (q.includes('week') || q.includes('take care')) {
    return "Based on your household data, here's what needs attention:\n\n• No upcoming deadlines found yet\n• No maintenance tasks scheduled\n\nTip: The more information you add about your home, the better I can help you stay on top of things. Start by adding your home details and uploading important documents.";
  }
  if (q.includes('winter') || q.includes('before winter')) {
    return "Here's a general winter preparation checklist:\n\n• Service your HVAC/furnace\n• Change air filters\n• Check weather stripping on doors and windows\n• Clean gutters\n• Insulate exposed pipes\n• Test smoke and carbon monoxide detectors\n• Stock emergency supplies\n\nAdd your home details so I can give you personalized recommendations!";
  }
  return "I'd love to help with that! To give you the best answer, I need more information about your household. Try uploading documents to the Vault, adding your home details, or creating tasks. The more I know about your household, the better I can assist you.";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  clearText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: FontWeights.semibold,
  },
  welcomeContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxxl,
  },
  welcomeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  welcomeAvatarText: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.extrabold,
    color: Colors.textInverse,
  },
  welcomeTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  suggestionsTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textTertiary,
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
  },
  suggestions: {
    gap: Spacing.sm,
    width: '100%',
  },
  suggestionChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  suggestionText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: FontWeights.medium,
  },
  messagesList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  userBubble: {
    justifyContent: 'flex-end',
  },
  aiBubble: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiAvatarText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.textInverse,
  },
  messageContent: {
    maxWidth: '75%',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  userContent: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
    marginLeft: 'auto',
  },
  aiContent: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: FontSizes.md,
    lineHeight: 22,
  },
  userText: {
    color: Colors.textInverse,
  },
  aiText: {
    color: Colors.textPrimary,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  typingBubble: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  typingText: {
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.surfaceAlt,
  },
});
