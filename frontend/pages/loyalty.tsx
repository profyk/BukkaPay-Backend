import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function Loyalty() {
  const router = useRouter();
  const [selectedRedemption, setSelectedRedemption] = useState<string | null>(null);

  const loyaltyData = {
    points: 2850,
    tier: "Silver",
    nextTier: "Gold",
    pointsToNextTier: 1150,
    rewards: [
      { id: 1, name: "$5 Credit", cost: 500, icon: "card" as keyof typeof Ionicons.glyphMap, description: "Add to any card" },
      { id: 2, name: "$10 Airtime", cost: 1000, icon: "phone-portrait" as keyof typeof Ionicons.glyphMap, description: "Any network" },
      { id: 3, name: "50% Data Discount", cost: 2000, icon: "wifi" as keyof typeof Ionicons.glyphMap, description: "Next purchase" },
      { id: 4, name: "Free Bill Payment", cost: 1500, icon: "document-text" as keyof typeof Ionicons.glyphMap, description: "Any bill" },
    ],
    recentTransactions: [
      { description: "Airtime purchase", points: 100, date: "Today" },
      { description: "Data top-up", points: 150, date: "Yesterday" },
      { description: "Electricity bill", points: 200, date: "2 days ago" },
    ],
  };

  const tierBenefits = [
    { tier: "Bronze", min: 0, benefits: ["1 point per $1 spent", "Basic support"] },
    { tier: "Silver", min: 1000, benefits: ["1.5 points per $1 spent", "Priority support", "5% cashback"] },
    { tier: "Gold", min: 5000, benefits: ["2 points per $1 spent", "VIP support", "10% cashback", "Free premium features"] },
    { tier: "Platinum", min: 10000, benefits: ["3 points per $1 spent", "Dedicated support", "15% cashback", "Exclusive events"] },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/(tabs)")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Loyalty Rewards</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.pointsCard}>
        <Text style={styles.pointsLabel}>Your Points Balance</Text>
        <Text style={styles.pointsAmount}>{loyaltyData.points.toLocaleString()}</Text>
        <Text style={styles.pointsNext}>{loyaltyData.pointsToNextTier} points to {loyaltyData.nextTier}</Text>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${((loyaltyData.points % 5000) / 5000) * 100}%` }]} />
        </View>
        <View style={styles.tierBadge}>
          <Ionicons name="ribbon" size={18} color="#FFFFFF" />
          <Text style={styles.tierBadgeText}>{loyaltyData.tier} Member</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Membership Tiers</Text>
      {tierBenefits.map((t, idx) => (
        <View
          key={idx}
          style={[styles.tierCard, t.tier === loyaltyData.tier && styles.tierCardActive]}
        >
          <View style={styles.tierHeader}>
            <Text style={[styles.tierName, t.tier === loyaltyData.tier && { color: "#FFFFFF" }]}>{t.tier}</Text>
            <Text style={[styles.tierMin, t.tier === loyaltyData.tier && { color: "rgba(255,255,255,0.75)" }]}>{t.min.toLocaleString()}+ points</Text>
          </View>
          {t.benefits.map((b, i) => (
            <Text key={i} style={[styles.tierBenefit, t.tier === loyaltyData.tier && { color: "rgba(255,255,255,0.9)" }]}>
              ✓ {b}
            </Text>
          ))}
        </View>
      ))}

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Redeem Rewards</Text>
      <View style={styles.rewardsGrid}>
        {loyaltyData.rewards.map((reward) => (
          <TouchableOpacity
            key={reward.id}
            onPress={() => setSelectedRedemption(reward.id.toString())}
            style={[styles.rewardCard, selectedRedemption === reward.id.toString() && styles.rewardCardActive]}
          >
            <Ionicons name={reward.icon} size={28} color={selectedRedemption === reward.id.toString() ? "#FFFFFF" : "#7C3AED"} />
            <Text style={[styles.rewardName, selectedRedemption === reward.id.toString() && { color: "#FFFFFF" }]}>{reward.name}</Text>
            <Text style={[styles.rewardCost, selectedRedemption === reward.id.toString() && { color: "rgba(255,255,255,0.75)" }]}>{reward.cost} pts</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Recent Activity</Text>
      {loyaltyData.recentTransactions.map((tx, idx) => (
        <View key={idx} style={styles.txCard}>
          <View>
            <Text style={styles.txDesc}>{tx.description}</Text>
            <Text style={styles.txDate}>{tx.date}</Text>
          </View>
          <Text style={styles.txPoints}>+{tx.points}</Text>
        </View>
      ))}

      <TouchableOpacity style={styles.redeemButton}>
        <Ionicons name="gift" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
        <Text style={styles.redeemButtonText}>Redeem Now</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingBottom: 100, paddingHorizontal: 24 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 48, paddingBottom: 16 },
  backButton: { padding: 8, borderRadius: 20 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
  pointsCard: { backgroundColor: "#7C3AED", borderRadius: 16, padding: 32, alignItems: "center", marginBottom: 24 },
  pointsLabel: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 8 },
  pointsAmount: { fontSize: 48, fontWeight: "700", color: "#FFFFFF", marginBottom: 16 },
  pointsNext: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 16 },
  progressBg: { width: "100%", height: 8, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 4, marginBottom: 24 },
  progressFill: { height: 8, backgroundColor: "#FFFFFF", borderRadius: 4 },
  tierBadge: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  tierBadgeText: { color: "#FFFFFF", fontWeight: "600" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E", marginBottom: 16 },
  tierCard: { padding: 16, borderRadius: 12, backgroundColor: "#F8F9FA", marginBottom: 12 },
  tierCardActive: { backgroundColor: "#7C3AED" },
  tierHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  tierName: { fontSize: 16, fontWeight: "600", color: "#1A1A2E" },
  tierMin: { fontSize: 12, color: "#6B7280" },
  tierBenefit: { fontSize: 12, color: "#6B7280", marginBottom: 4 },
  rewardsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  rewardCard: { width: "47%", padding: 16, borderRadius: 12, backgroundColor: "#F8F9FA", alignItems: "center" },
  rewardCardActive: { backgroundColor: "#7C3AED" },
  rewardName: { fontSize: 14, fontWeight: "600", color: "#1A1A2E", marginTop: 8, textAlign: "center" },
  rewardCost: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  txCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, backgroundColor: "#F8F9FA", borderRadius: 12, marginBottom: 12 },
  txDesc: { fontSize: 14, fontWeight: "500", color: "#1A1A2E" },
  txDate: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  txPoints: { fontSize: 16, fontWeight: "700", color: "#7C3AED" },
  redeemButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#7C3AED", borderRadius: 12, paddingVertical: 16, marginTop: 24 },
  redeemButtonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
});
