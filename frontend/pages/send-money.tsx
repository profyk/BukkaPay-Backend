import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function SendMoney() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Send Money</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSubtitle}>Choose where you want to send money</Text>
      </View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.optionCard} onPress={() => router.push("/(screens)/scan-pay")}>
          <View style={styles.optionHeader}>
            <View style={[styles.optionIconBox, { backgroundColor: "#2563EB" }]}>
              <Ionicons name="location" size={32} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>Local</Text>
              <Text style={styles.optionSubtitle}>Send money locally</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#6B7280" />
          </View>

          <View style={styles.tagsRow}>
            <View style={[styles.tag, { backgroundColor: "rgba(139, 92, 246, 0.1)" }]}>
              <Ionicons name="people" size={12} color="#7C3AED" />
              <Text style={[styles.tagText, { color: "#7C3AED" }]}>BukkaPay Wallet</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
              <Ionicons name="phone-portrait" size={12} color="#10B981" />
              <Text style={[styles.tagText, { color: "#10B981" }]}>Mobile Money</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: "rgba(37, 99, 235, 0.1)" }]}>
              <Ionicons name="business" size={12} color="#2563EB" />
              <Text style={[styles.tagText, { color: "#2563EB" }]}>Bank</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionCard} onPress={() => router.push("/(screens)/cross-border")}>
          <View style={styles.optionHeader}>
            <View style={[styles.optionIconBox, { backgroundColor: "#059669" }]}>
              <Ionicons name="globe" size={32} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>Abroad</Text>
              <Text style={styles.optionSubtitle}>Send money internationally</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#6B7280" />
          </View>

          <View style={styles.flagsRow}>
            {["GB", "EU", "NG", "KE", "GH", "ZA", "IN"].map((code, idx) => (
              <Text key={idx} style={styles.flagText}>{code}</Text>
            ))}
            <Text style={styles.moreText}>+8 more</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.securityNote}>All transfers are secured with PIN verification</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    paddingBottom: 100,
  },
  headerBanner: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  optionsContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 16,
  },
  optionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 8,
  },
  optionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  optionIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
  },
  flagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    alignItems: "center",
  },
  flagText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  moreText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  securityNote: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 16,
  },
});
