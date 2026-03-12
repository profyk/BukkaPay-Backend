import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useToast } from "../hooks/use-toast";

interface Notification {
  id: string;
  type: "success" | "info" | "warning" | "alert";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export default function Notifications() {
  const router = useRouter();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: "1", type: "success", title: "Payment Received", message: "You received $50 from John Doe", timestamp: "2 hours ago", read: false },
    { id: "2", type: "success", title: "Transfer Completed", message: "You sent $100 to Alice Smith", timestamp: "5 hours ago", read: false },
    { id: "3", type: "info", title: "Card Added", message: "Your new debit card has been added successfully", timestamp: "1 day ago", read: true },
    { id: "4", type: "warning", title: "Low Balance Alert", message: "Your wallet balance is below $100", timestamp: "2 days ago", read: true },
    { id: "5", type: "success", title: "Loyalty Points Earned", message: "You earned 250 points from your transaction", timestamp: "3 days ago", read: true },
    { id: "6", type: "info", title: "New Feature Available", message: "Check out our new Stokvel group savings feature", timestamp: "1 week ago", read: true },
    { id: "7", type: "alert", title: "Security Alert", message: "New login from Chrome on Windows", timestamp: "2 weeks ago", read: true },
    { id: "8", type: "success", title: "Referral Bonus", message: "Your friend signed up! You earned $5", timestamp: "3 weeks ago", read: true },
  ]);

  const getIconName = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case "success": return "checkmark-circle";
      case "warning": return "alert-circle";
      case "alert": return "alert-circle";
      default: return "information-circle";
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "success": return "#059669";
      case "warning": return "#D97706";
      case "alert": return "#DC2626";
      default: return "#2563EB";
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case "success": return "rgba(16,185,129,0.1)";
      case "warning": return "rgba(245,158,11,0.1)";
      case "alert": return "rgba(239,68,68,0.1)";
      default: return "rgba(59,130,246,0.1)";
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case "success": return "rgba(16,185,129,0.3)";
      case "warning": return "rgba(245,158,11,0.3)";
      case "alert": return "rgba(239,68,68,0.3)";
      default: return "rgba(59,130,246,0.3)";
    }
  };

  const handleDelete = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
    toast({ title: "Deleted", description: "Notification deleted" });
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleClearAll = () => {
    setNotifications([]);
    toast({ title: "Cleared", description: "All notifications cleared" });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/(tabs)")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.length > 0 ? (
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Ionicons name="notifications" size={16} color="#2563EB" />
          <Text style={styles.unreadText}>
            {unreadCount} new notification{unreadCount !== 1 ? "s" : ""}
          </Text>
        </View>
      )}

      {notifications.length > 0 ? (
        notifications.map((notification, idx) => (
          <TouchableOpacity
            key={notification.id}
            onPress={() => handleMarkAsRead(notification.id)}
            style={[
              styles.notificationCard,
              { backgroundColor: getBgColor(notification.type), borderColor: getBorderColor(notification.type) },
              !notification.read && styles.unreadRing,
            ]}
          >
            <View style={styles.notificationRow}>
              <Ionicons name={getIconName(notification.type)} size={24} color={getIconColor(notification.type)} style={{ marginTop: 2 }} />
              <View style={styles.notificationContent}>
                <View style={styles.notificationTitleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    <Text style={styles.notificationMessage}>{notification.message}</Text>
                  </View>
                  {!notification.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notificationTime}>{notification.timestamp}</Text>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() => router.push("/(screens)/transaction-slip")}
                    style={styles.getSlipButton}
                  >
                    <Ionicons name="download" size={14} color="#FFFFFF" />
                    <Text style={styles.getSlipText}>Get Slip</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(notification.id)} style={styles.deleteButton}>
                    <Ionicons name="trash" size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="notifications-off" size={32} color="#6B7280" />
          </View>
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptySubtitle}>You're all caught up! Check back later for updates.</Text>
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
  clearAllText: { fontSize: 14, color: "#7C3AED", fontWeight: "600" },
  unreadBadge: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(59,130,246,0.1)", borderWidth: 1, borderColor: "rgba(59,130,246,0.3)", borderRadius: 12, padding: 12, marginBottom: 16 },
  unreadText: { fontSize: 14, fontWeight: "600", color: "#2563EB" },
  notificationCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  unreadRing: { borderWidth: 2, borderColor: "rgba(124,58,237,0.3)" },
  notificationRow: { flexDirection: "row", gap: 12 },
  notificationContent: { flex: 1 },
  notificationTitleRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  notificationTitle: { fontSize: 14, fontWeight: "600", color: "#1A1A2E", marginBottom: 4 },
  notificationMessage: { fontSize: 14, color: "#6B7280" },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#7C3AED", marginTop: 8 },
  notificationTime: { fontSize: 12, color: "#6B7280", marginTop: 8 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  getSlipButton: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: "#2563EB" },
  getSlipText: { fontSize: 12, fontWeight: "600", color: "#FFFFFF" },
  deleteButton: { padding: 6, borderRadius: 8 },
  emptyState: { paddingVertical: 64, alignItems: "center" },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#F8F9FA", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#1A1A2E", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#6B7280", textAlign: "center" },
});
