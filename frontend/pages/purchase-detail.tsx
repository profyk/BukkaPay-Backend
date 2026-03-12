import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Share, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import * as Clipboard from "expo-clipboard";

const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  airtime: "call-outline",
  electricity: "flash-outline",
  ticket: "ticket-outline",
  hotel: "business-outline",
  rental: "home-outline",
  marketplace: "bag-outline",
  contribution: "heart-outline",
  transfer: "swap-horizontal-outline",
};

const categoryColors: Record<string, string> = {
  airtime: "#3B82F6",
  electricity: "#EAB308",
  ticket: "#A855F7",
  hotel: "#06B6D4",
  rental: "#22C55E",
  marketplace: "#F97316",
  contribution: "#EC4899",
  transfer: "#6366F1",
};

const statusConfig: Record<string, { bg: string; textColor: string; label: string }> = {
  success: { bg: "#D1FAE5", textColor: "#047857", label: "Success" },
  pending: { bg: "#FEF3C7", textColor: "#B45309", label: "Pending" },
  failed: { bg: "#FEE2E2", textColor: "#B91C1C", label: "Failed" },
  refunded: { bg: "#F3F4F6", textColor: "#374151", label: "Refunded" },
};

const metadataLabels: Record<string, Record<string, string>> = {
  electricity: {
    meter_number: "Meter Number",
    token: "Token",
    units: "Units Purchased",
  },
  airtime: {
    phone_number: "Phone Number",
    network: "Network",
  },
  ticket: {
    qr_code: "QR Code",
    event_date: "Event Date",
    venue: "Venue",
  },
  hotel: {
    booking_id: "Booking ID",
    check_in: "Check-in Date",
    check_out: "Check-out Date",
  },
  rental: {
    property_id: "Property ID",
    period: "Rental Period",
    payment_state: "Payment State",
  },
};

export default function PurchaseDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [copied, setCopied] = useState(false);

  const { data: transaction, isLoading, error } = useQuery<any>({
    queryKey: [`/api/transactions/${id}`],
    enabled: !!id,
  });

  const handleCopyReference = async () => {
    if (transaction?.reference) {
      await Clipboard.setStringAsync(transaction.reference);
      setCopied(true);
      Alert.alert("Copied", "Reference copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (transaction) {
      const text = `BukkaPay Transaction\nMerchant: ${transaction.merchantName}\nAmount: ${transaction.currency}${Number(transaction.amount).toFixed(2)}\nReference: ${transaction.reference}\nDate: ${format(new Date(transaction.createdAt), "MMM d, yyyy 'at' h:mm a")}`;
      try {
        await Share.share({ message: text, title: "BukkaPay Receipt" });
      } catch {
        await Clipboard.setStringAsync(text);
        Alert.alert("Copied", "Receipt details copied to clipboard");
      }
    }
  };

  const handleDownload = () => {
    Alert.alert("Coming Soon", "Download feature coming soon!");
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (error || !transaction) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/purchases-hub")} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction Details</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.mutedText}>Transaction not found</Text>
          <TouchableOpacity onPress={() => router.push("/purchases-hub")} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const iconName = categoryIcons[transaction.category] || "bag-outline";
  const color = categoryColors[transaction.category] || "#6B7280";
  const status = statusConfig[transaction.status] || statusConfig.success;
  const metadata = (transaction.metadata as Record<string, unknown>) || {};
  const catLabels = metadataLabels[transaction.category] || {};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/purchases-hub")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Details</Text>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={[styles.heroCard, { backgroundColor: color }]}>
          <View style={styles.heroRow}>
            <View style={styles.heroIconContainer}>
              <Ionicons name={iconName} size={28} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.heroCategory}>{transaction.category}</Text>
              <Text style={styles.heroMerchant}>{transaction.merchantName}</Text>
            </View>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroAmountContainer}>
            <Text style={styles.heroAmountLabel}>Amount</Text>
            <Text style={styles.heroAmount}>
              {transaction.currency}{Number(transaction.amount).toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Ionicons name="checkmark-circle" size={16} color={status.textColor} />
            <Text style={[styles.statusText, { color: status.textColor }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Transaction Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.mutedText}>Reference</Text>
            <View style={styles.referenceRow}>
              <Text style={styles.monoText}>{transaction.reference}</Text>
              <TouchableOpacity onPress={handleCopyReference} style={styles.copyButton}>
                <Ionicons name={copied ? "checkmark-circle" : "copy-outline"} size={16} color={copied ? "#10B981" : "#6B7280"} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.mutedText}>Date</Text>
            <Text style={styles.detailValue}>{format(new Date(transaction.createdAt), "MMM d, yyyy")}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.mutedText}>Time</Text>
            <Text style={styles.detailValue}>{format(new Date(transaction.createdAt), "h:mm a")}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.mutedText}>Category</Text>
            <Text style={[styles.detailValue, { textTransform: "capitalize" }]}>{transaction.category}</Text>
          </View>
        </View>

        {Object.keys(metadata).length > 0 && (
          <View style={styles.card}>
            <Text style={[styles.cardTitle, { textTransform: "capitalize" }]}>{transaction.category} Details</Text>
            {Object.entries(metadata).map(([key, value]) => (
              <View key={key} style={styles.detailRow}>
                <Text style={styles.mutedText}>
                  {catLabels[key] || key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </Text>
                <Text style={styles.monoText}>{String(value)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity onPress={handleDownload} style={styles.outlineButton}>
            <Ionicons name="download-outline" size={18} color="#7C3AED" />
            <Text style={styles.outlineButtonText}>Download</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.primaryButton}>
            <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  loadingContainer: { flex: 1, backgroundColor: "#FFFFFF", justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingTop: 48, paddingBottom: 16, position: "relative" },
  backButton: { position: "absolute", left: 24, zIndex: 1, padding: 8, borderRadius: 20 },
  headerTitle: { flex: 1, textAlign: "center", fontWeight: "700", fontSize: 18, color: "#1A1A2E" },
  scrollContent: { flex: 1, paddingHorizontal: 24 },
  heroCard: { borderRadius: 16, padding: 24, marginBottom: 24 },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 },
  heroIconContainer: { width: 56, height: 56, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  heroCategory: { color: "rgba(255,255,255,0.8)", fontSize: 14, textTransform: "capitalize" },
  heroMerchant: { color: "#FFFFFF", fontWeight: "700", fontSize: 20 },
  heroDivider: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.2)", marginBottom: 16 },
  heroAmountContainer: { alignItems: "center", paddingTop: 0 },
  heroAmountLabel: { color: "rgba(255,255,255,0.8)", fontSize: 14, marginBottom: 4 },
  heroAmount: { color: "#FFFFFF", fontWeight: "700", fontSize: 32 },
  statusContainer: { alignItems: "center", marginBottom: 24 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  statusText: { fontSize: 14, fontWeight: "600" },
  card: { backgroundColor: "#F8F9FA", borderRadius: 12, padding: 20, marginBottom: 24 },
  cardTitle: { fontWeight: "600", fontSize: 16, color: "#1A1A2E", marginBottom: 16 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  mutedText: { color: "#6B7280", fontSize: 14 },
  detailValue: { color: "#1A1A2E", fontSize: 14 },
  monoText: { fontFamily: "monospace", fontSize: 13, color: "#1A1A2E" },
  referenceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  copyButton: { padding: 4 },
  actionRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  outlineButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 56, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB" },
  outlineButtonText: { color: "#7C3AED", fontWeight: "600", fontSize: 15 },
  primaryButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 56, borderRadius: 12, backgroundColor: "#7C3AED" },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
});
