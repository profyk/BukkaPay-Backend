import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function Analytics() {
  const router = useRouter();
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year">("month");

  const analyticsData = {
    totalSpent: 45230,
    budgetLimit: 50000,
    percentUsed: (45230 / 50000) * 100,
    byCategory: [
      { name: "Food & Groceries", amount: 12500, percentage: 27.6, icon: "cart" as keyof typeof Ionicons.glyphMap, limit: 15000 },
      { name: "Transport", amount: 8950, percentage: 19.8, icon: "car" as keyof typeof Ionicons.glyphMap, limit: 10000 },
      { name: "Entertainment", amount: 9200, percentage: 20.3, icon: "film" as keyof typeof Ionicons.glyphMap, limit: 12000 },
      { name: "Bills & Utilities", amount: 7800, percentage: 17.2, icon: "document-text" as keyof typeof Ionicons.glyphMap, limit: 10000 },
      { name: "Other", amount: 6780, percentage: 15, icon: "card" as keyof typeof Ionicons.glyphMap, limit: 5000 },
    ],
    alerts: [
      { type: "warning", message: "You've spent 90% of your grocery budget" },
      { type: "info", message: "Average spending this week is 25% higher than last week" },
      { type: "success", message: "Saved $50 on transport this month" },
    ],
  };

  const getAlertBg = (type: string) => {
    switch (type) {
      case "warning": return "rgba(245,158,11,0.1)";
      case "info": return "rgba(59,130,246,0.1)";
      default: return "rgba(16,185,129,0.1)";
    }
  };

  const getAlertBorder = (type: string) => {
    switch (type) {
      case "warning": return "rgba(245,158,11,0.2)";
      case "info": return "rgba(59,130,246,0.2)";
      default: return "rgba(16,185,129,0.2)";
    }
  };

  const getProgressColor = (ratio: number) => {
    if (ratio > 90) return "#EF4444";
    if (ratio > 75) return "#EAB308";
    return "#10B981";
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/(tabs)")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Spending Analytics</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.timeframeRow}>
        {(["week", "month", "year"] as const).map((tf) => (
          <TouchableOpacity
            key={tf}
            onPress={() => setTimeframe(tf)}
            style={[styles.timeframeButton, timeframe === tf && styles.timeframeActive]}
          >
            <Text style={[styles.timeframeText, timeframe === tf && styles.timeframeActiveText]}>
              {tf.charAt(0).toUpperCase() + tf.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.budgetCard}>
        <View style={styles.budgetHeader}>
          <View>
            <Text style={styles.budgetLabel}>Total Spent</Text>
            <Text style={styles.budgetAmount}>${analyticsData.totalSpent.toLocaleString()}</Text>
          </View>
          <Ionicons name="bar-chart" size={32} color="#A78BFA" />
        </View>
        <View style={{ marginTop: 16 }}>
          <View style={styles.budgetProgressHeader}>
            <Text style={styles.budgetProgressLabel}>Budget Usage</Text>
            <Text style={styles.budgetProgressLabel}>{analyticsData.percentUsed.toFixed(1)}%</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${analyticsData.percentUsed}%` }]} />
          </View>
          <Text style={styles.remainingText}>
            ${(analyticsData.budgetLimit - analyticsData.totalSpent).toLocaleString()} remaining
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Spending by Category</Text>
      {analyticsData.byCategory.map((cat, idx) => {
        const ratio = (cat.amount / cat.limit) * 100;
        return (
          <View key={idx} style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryLeft}>
                <Ionicons name={cat.icon} size={24} color="#7C3AED" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                  <Text style={styles.categoryBudget}>Budget: ${cat.limit.toLocaleString()}</Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.categoryAmount}>${cat.amount.toLocaleString()}</Text>
                <Text style={styles.categoryPercent}>{cat.percentage}%</Text>
              </View>
            </View>
            <View style={styles.categoryProgressBg}>
              <View style={[styles.categoryProgressFill, { width: `${Math.min(ratio, 100)}%`, backgroundColor: getProgressColor(ratio) }]} />
            </View>
          </View>
        );
      })}

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Insights & Alerts</Text>
      {analyticsData.alerts.map((alert, idx) => (
        <View key={idx} style={[styles.alertCard, { backgroundColor: getAlertBg(alert.type), borderColor: getAlertBorder(alert.type) }]}>
          <Ionicons name="alert-circle" size={18} color="#6B7280" style={{ marginTop: 2 }} />
          <Text style={styles.alertText}>{alert.message}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingBottom: 100, paddingHorizontal: 24 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 48, paddingBottom: 16 },
  backButton: { padding: 8, borderRadius: 20 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
  timeframeRow: { flexDirection: "row", gap: 8, marginBottom: 24 },
  timeframeButton: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: "#F8F9FA", alignItems: "center" },
  timeframeActive: { backgroundColor: "#7C3AED" },
  timeframeText: { fontSize: 14, fontWeight: "600", color: "#1A1A2E" },
  timeframeActiveText: { color: "#FFFFFF" },
  budgetCard: { backgroundColor: "#1E293B", borderRadius: 16, padding: 24, marginBottom: 24 },
  budgetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  budgetLabel: { fontSize: 14, color: "#94A3B8" },
  budgetAmount: { fontSize: 28, fontWeight: "700", color: "#FFFFFF", marginTop: 4 },
  budgetProgressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  budgetProgressLabel: { fontSize: 14, color: "#FFFFFF" },
  progressBg: { height: 12, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 6 },
  progressFill: { height: 12, borderRadius: 6, backgroundColor: "#7C3AED" },
  remainingText: { fontSize: 12, color: "#94A3B8", marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E", marginBottom: 16 },
  categoryCard: { backgroundColor: "#F8F9FA", borderRadius: 12, padding: 16, marginBottom: 12 },
  categoryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  categoryLeft: { flexDirection: "row", alignItems: "center" },
  categoryName: { fontSize: 14, fontWeight: "600", color: "#1A1A2E" },
  categoryBudget: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  categoryAmount: { fontSize: 16, fontWeight: "700", color: "#1A1A2E" },
  categoryPercent: { fontSize: 12, color: "#6B7280" },
  categoryProgressBg: { height: 8, backgroundColor: "#FFFFFF", borderRadius: 4 },
  categoryProgressFill: { height: 8, borderRadius: 4 },
  alertCard: { flexDirection: "row", gap: 12, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  alertText: { fontSize: 14, color: "#1A1A2E", flex: 1 },
});
