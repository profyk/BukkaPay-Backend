import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";

export default function ActionButtons() {
  const router = useRouter();

  const actions: { icon: keyof typeof Ionicons.glyphMap; label: string; href: string; color: string }[] = [
    { icon: "send", label: "Send", href: "/(screens)/send-money", color: "#3B82F6" },
    { icon: "arrow-down-outline", label: "Request", href: "/(screens)/request", color: "#8B5CF6" },
    { icon: "add", label: "Top Up", href: "/(screens)/topup", color: "#10B981" },
    { icon: "airplane", label: "Travel", href: "/(screens)/travel", color: "#0EA5E9" },
    { icon: "phone-portrait-outline", label: "Tap Pay", href: "/(screens)/tap-pay", color: "#6366F1" },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {actions.map((action) => (
        <TouchableOpacity
          key={action.label}
          style={styles.actionItem}
          onPress={() => router.push(action.href as any)}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: action.color }]}>
            <Ionicons name={action.icon} size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.label}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  actionItem: {
    alignItems: "center",
    width: 64,
    gap: 8,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    textAlign: "center",
  },
});
