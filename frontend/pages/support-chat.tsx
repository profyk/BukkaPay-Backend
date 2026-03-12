import { useState, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function SupportChat() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", text: "Hello! How can we help you today?", isUser: false, timestamp: new Date() },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    setTimeout(() => {
      const responses = [
        "I'm here to help! What's your question?",
        "Let me look into that for you.",
        "Thanks for reaching out! Is there anything else I can help with?",
        "That's a great question! Here are some resources that might help.",
      ];

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responses[Math.floor(Math.random() * responses.length)],
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/(tabs)")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support Chat</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[styles.messageRow, message.isUser ? styles.messageRowUser : styles.messageRowBot]}
          >
            <View style={[styles.messageBubble, message.isUser ? styles.bubbleUser : styles.bubbleBot]}>
              <Text style={[styles.messageText, message.isUser ? styles.messageTextUser : styles.messageTextBot]}>
                {message.text}
              </Text>
              <Text style={[styles.messageTime, message.isUser ? styles.messageTimeUser : styles.messageTimeBot]}>
                {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type your message..."
          placeholderTextColor="#6B7280"
          style={styles.chatInput}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          <Ionicons name="send" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 48, paddingBottom: 12, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  backButton: { padding: 8, borderRadius: 20 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 24, paddingBottom: 16 },
  messageRow: { marginBottom: 12 },
  messageRowUser: { alignItems: "flex-end" },
  messageRowBot: { alignItems: "flex-start" },
  messageBubble: { maxWidth: "80%", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16 },
  bubbleUser: { backgroundColor: "#7C3AED", borderBottomRightRadius: 4 },
  bubbleBot: { backgroundColor: "#F8F9FA", borderBottomLeftRadius: 4 },
  messageText: { fontSize: 14 },
  messageTextUser: { color: "#FFFFFF" },
  messageTextBot: { color: "#1A1A2E" },
  messageTime: { fontSize: 11, marginTop: 4 },
  messageTimeUser: { color: "rgba(255,255,255,0.7)" },
  messageTimeBot: { color: "#6B7280" },
  inputContainer: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 1, borderTopColor: "#E5E7EB" },
  chatInput: { flex: 1, backgroundColor: "#F8F9FA", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: "#1A1A2E" },
  sendButton: { width: 48, height: 48, borderRadius: 12, backgroundColor: "#7C3AED", alignItems: "center", justifyContent: "center" },
});
