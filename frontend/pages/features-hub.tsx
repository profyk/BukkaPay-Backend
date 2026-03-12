import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface Feature {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  route: string;
  color: string;
  comingSoon?: boolean;
}

const features: Feature[] = [
  { iconName: "bag-handle", label: "Purchases Hub", route: "/(screens)/purchases-hub", color: "#0891B2" },
  { iconName: "card", label: "Gift Cards", route: "/(screens)/gift-cards", color: "#EC4899" },
  { iconName: "heart", label: "Contributions", route: "/(screens)/contributions", color: "#10B981" },
  { iconName: "airplane", label: "Travel Booking", route: "/(screens)/travel", color: "#0EA5E9" },
  { iconName: "gift", label: "Loyalty Rewards", route: "/(screens)/loyalty", color: "#7C3AED" },
  { iconName: "bar-chart", label: "Analytics", route: "/(screens)/analytics", color: "#2563EB" },
  { iconName: "people", label: "Referral Program", route: "#", color: "#059669", comingSoon: true },
  { iconName: "flash", label: "Gamification", route: "/(screens)/gamification", color: "#F97316" },
  { iconName: "chatbubble", label: "Support Chat", route: "/(screens)/support-chat", color: "#EC4899" },
  { iconName: "git-branch", label: "Bill Splitting", route: "/(screens)/bill-split", color: "#6366F1" },
  { iconName: "home", label: "Pay Rent", route: "/(screens)/tenant-dashboard", color: "#D97706" },
];

export default function FeaturesHub() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/(tabs)")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Explore Features</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.subtitle}>Discover all premium features in BukkaPay</Text>

      <View style={styles.grid}>
        {features.map((feature, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => {
              if (!feature.comingSoon) router.push(feature.route as any);
            }}
            style={[styles.featureCard, { backgroundColor: feature.color }, feature.comingSoon && { opacity: 0.7 }]}
            disabled={feature.comingSoon}
          >
            {feature.comingSoon && (
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
            )}
            <Ionicons name={feature.iconName} size={32} color="#FFFFFF" />
            <Text style={styles.featureLabel}>{feature.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingBottom: 100, paddingHorizontal: 24 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 48, paddingBottom: 16 },
  backButton: { padding: 8, borderRadius: 20 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
  subtitle: { textAlign: "center", color: "#6B7280", fontSize: 14, marginBottom: 24 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  featureCard: { width: "47%", borderRadius: 16, padding: 24, alignItems: "center", position: "relative" },
  comingSoonBadge: { position: "absolute", top: 8, right: 8, backgroundColor: "rgba(255,255,255,0.9)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  comingSoonText: { fontSize: 10, fontWeight: "700", color: "#374151" },
  featureLabel: { fontSize: 14, fontWeight: "600", color: "#FFFFFF", marginTop: 8, textAlign: "center" },
});
