import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function Gamification() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"challenges" | "achievements">("challenges");

  const challenges = [
    { id: 1, title: "Save $50", description: "Don't spend more than $50 today", progress: 60, reward: 100, icon: "cash" as keyof typeof Ionicons.glyphMap, completed: false },
    { id: 2, title: "5 Transactions", description: "Make 5 different transactions", progress: 100, reward: 200, icon: "swap-horizontal" as keyof typeof Ionicons.glyphMap, completed: true },
    { id: 3, title: "Top-up Success", description: "Complete 3 successful top-ups", progress: 33, reward: 150, icon: "arrow-up" as keyof typeof Ionicons.glyphMap, completed: false },
    { id: 4, title: "Weekly Savings", description: "Save 20% this week", progress: 85, reward: 300, icon: "trending-up" as keyof typeof Ionicons.glyphMap, completed: false },
  ];

  const achievements = [
    { title: "First Transaction", description: "Make your first payment", icon: "flag" as keyof typeof Ionicons.glyphMap, date: "Jan 1" },
    { title: "Saving Hero", description: "Reach Silver tier", icon: "shield-checkmark" as keyof typeof Ionicons.glyphMap, date: "Jan 15" },
    { title: "Socializer", description: "Refer 5 friends", icon: "people" as keyof typeof Ionicons.glyphMap, date: "Jan 20" },
    { title: "Frequent User", description: "Use app 30 days in a row", icon: "calendar" as keyof typeof Ionicons.glyphMap, date: "Feb 1" },
    { title: "Big Spender", description: "Spend $1,000", icon: "card" as keyof typeof Ionicons.glyphMap, date: "Feb 10" },
    { title: "Bill Master", description: "Pay 10 bills on time", icon: "document-text" as keyof typeof Ionicons.glyphMap, date: "Feb 15" },
  ];

  const stats = { streak: 12, totalPoints: 2850, badges: 6, rank: "Silver" };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/(tabs)")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gamification</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#F97316" }]}>
          <Ionicons name="flame" size={20} color="#FFFFFF" />
          <Text style={styles.statValue}>{stats.streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#EAB308" }]}>
          <Ionicons name="trophy" size={20} color="#FFFFFF" />
          <Text style={styles.statValue}>{stats.badges}</Text>
          <Text style={styles.statLabel}>Badges Earned</Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          onPress={() => setActiveTab("challenges")}
          style={[styles.tabButton, activeTab === "challenges" && styles.tabActive]}
        >
          <Ionicons name="flash" size={18} color={activeTab === "challenges" ? "#FFFFFF" : "#1A1A2E"} />
          <Text style={[styles.tabText, activeTab === "challenges" && styles.tabActiveText]}>Challenges</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("achievements")}
          style={[styles.tabButton, activeTab === "achievements" && styles.tabActive]}
        >
          <Ionicons name="ribbon" size={18} color={activeTab === "achievements" ? "#FFFFFF" : "#1A1A2E"} />
          <Text style={[styles.tabText, activeTab === "achievements" && styles.tabActiveText]}>Achievements</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "challenges" ? (
        challenges.map((challenge, idx) => (
          <View
            key={challenge.id}
            style={[styles.challengeCard, challenge.completed && styles.challengeCompleted]}
          >
            <View style={styles.challengeHeader}>
              <View style={styles.challengeLeft}>
                <Ionicons name={challenge.icon} size={24} color={challenge.completed ? "#10B981" : "#7C3AED"} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.challengeTitle}>{challenge.title}</Text>
                  <Text style={styles.challengeDesc}>{challenge.description}</Text>
                </View>
              </View>
              {challenge.completed && <Ionicons name="checkmark" size={20} color="#10B981" />}
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${challenge.progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{challenge.progress}% Complete</Text>
            <View style={styles.challengeFooter}>
              <Text style={styles.rewardText}>+{challenge.reward} points</Text>
              <TouchableOpacity
                style={[styles.claimButton, challenge.completed && styles.claimButtonDisabled]}
                disabled={challenge.completed}
              >
                <Text style={styles.claimButtonText}>{challenge.completed ? "Claimed" : "Claim"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.achievementsGrid}>
          {achievements.map((achievement, idx) => (
            <View key={idx} style={styles.achievementCard}>
              <Ionicons name={achievement.icon} size={32} color="#7C3AED" />
              <Text style={styles.achievementTitle}>{achievement.title}</Text>
              <Text style={styles.achievementDesc}>{achievement.description}</Text>
              <Text style={styles.achievementDate}>{achievement.date}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingBottom: 100, paddingHorizontal: 24 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 48, paddingBottom: 16 },
  backButton: { padding: 8, borderRadius: 20 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  statCard: { flex: 1, borderRadius: 12, padding: 16 },
  statValue: { fontSize: 24, fontWeight: "700", color: "#FFFFFF", marginTop: 8 },
  statLabel: { fontSize: 12, color: "rgba(255,255,255,0.9)", marginTop: 2 },
  tabRow: { flexDirection: "row", gap: 8, marginBottom: 24 },
  tabButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12, backgroundColor: "#F8F9FA" },
  tabActive: { backgroundColor: "#7C3AED" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#1A1A2E" },
  tabActiveText: { color: "#FFFFFF" },
  challengeCard: { padding: 16, borderRadius: 12, borderWidth: 2, borderColor: "#E5E7EB", backgroundColor: "#F8F9FA", marginBottom: 12 },
  challengeCompleted: { backgroundColor: "rgba(16,185,129,0.1)", borderColor: "rgba(16,185,129,0.2)" },
  challengeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  challengeLeft: { flexDirection: "row", alignItems: "flex-start", flex: 1 },
  challengeTitle: { fontSize: 16, fontWeight: "600", color: "#1A1A2E" },
  challengeDesc: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  progressBg: { height: 8, backgroundColor: "#FFFFFF", borderRadius: 4, marginBottom: 4 },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: "#7C3AED" },
  progressText: { fontSize: 12, color: "#6B7280", marginBottom: 12 },
  challengeFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rewardText: { fontSize: 12, fontWeight: "600", color: "#1A1A2E" },
  claimButton: { backgroundColor: "#7C3AED", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  claimButtonDisabled: { opacity: 0.5 },
  claimButtonText: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
  achievementsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  achievementCard: { width: "47%", backgroundColor: "#F8F9FA", borderRadius: 12, padding: 16, alignItems: "center" },
  achievementTitle: { fontSize: 14, fontWeight: "600", color: "#1A1A2E", marginTop: 8, textAlign: "center" },
  achievementDesc: { fontSize: 12, color: "#6B7280", marginTop: 4, textAlign: "center" },
  achievementDate: { fontSize: 12, color: "#7C3AED", fontWeight: "600", marginTop: 8 },
});
