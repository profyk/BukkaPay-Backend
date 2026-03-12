import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Share, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useToast } from "../hooks/use-toast";
import * as Clipboard from "expo-clipboard";

interface Transaction {
  id: string;
  type: "sent" | "received" | "purchase" | "topup";
  amount: string;
  currency: string;
  recipient: string;
  recipientId?: string;
  description: string;
  date: string;
  time: string;
  status: "completed" | "pending" | "failed";
  reference: string;
}

export default function TransactionSlip() {
  const router = useRouter();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const transaction: Transaction = {
    id: "TXN-2024-001",
    type: "sent",
    amount: "2,500",
    currency: "$",
    recipient: "John Doe",
    recipientId: "BKP-J0HND0E",
    description: "Payment for services",
    date: "December 1, 2024",
    time: "2:45 PM",
    status: "completed",
    reference: "REF-20241201-001",
  };

  const getSlipText = () => {
    return `Transaction Receipt\nAmount: ${transaction.currency}${transaction.amount}\nRecipient: ${transaction.recipient}\nDate: ${transaction.date}\nTime: ${transaction.time}\nReference: ${transaction.reference}\nStatus: Completed`;
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: getSlipText() });
    } catch {
      toast({ title: "Error", description: "Failed to share", variant: "destructive" });
    }
  };

  const copyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(getSlipText());
      setCopied(true);
      toast({ title: "Copied", description: "Slip copied to clipboard!" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Error", description: "Failed to copy", variant: "destructive" });
    }
  };

  const copyReference = async () => {
    try {
      await Clipboard.setStringAsync(transaction.reference);
      setCopied(true);
      toast({ title: "Copied", description: "Reference copied!" });
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/(screens)/notifications")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Receipt</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.receiptCard}>
        <View style={styles.statusBadge}>
          <Ionicons name="checkmark-circle" size={32} color="#10B981" />
        </View>

        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Amount Transferred</Text>
          <Text style={styles.amountValue}>{transaction.currency}{transaction.amount}</Text>
          <Text style={styles.statusText}>Completed</Text>
        </View>

        <View style={styles.detailsDivider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Transaction Type</Text>
          <Text style={styles.detailValue}>{transaction.type}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Recipient</Text>
          <Text style={styles.detailValue}>{transaction.recipient}</Text>
        </View>
        {transaction.recipientId && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Recipient ID</Text>
            <Text style={[styles.detailValue, { fontFamily: "monospace", fontSize: 12 }]}>{transaction.recipientId}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Description</Text>
          <Text style={styles.detailValue}>{transaction.description}</Text>
        </View>

        <View style={styles.detailsDivider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date</Text>
          <Text style={styles.detailValue}>{transaction.date}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Time</Text>
          <Text style={styles.detailValue}>{transaction.time}</Text>
        </View>

        <TouchableOpacity onPress={copyReference} style={styles.referenceBox}>
          <View>
            <Text style={styles.referenceLabel}>Reference Number</Text>
            <Text style={styles.referenceValue}>{transaction.reference}</Text>
          </View>
          <Ionicons name={copied ? "checkmark" : "copy"} size={16} color={copied ? "#10B981" : "#94A3B8"} />
        </TouchableOpacity>
      </View>

      <Text style={styles.shareTitle}>Share Receipt</Text>

      <TouchableOpacity onPress={handleShare} style={[styles.actionButton, { backgroundColor: "#2563EB" }]}>
        <Ionicons name="share-social" size={20} color="#FFFFFF" />
        <Text style={styles.actionButtonText}>Share Receipt</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={copyToClipboard} style={[styles.actionButton, { backgroundColor: "#F8F9FA" }]}>
        <Ionicons name="copy" size={20} color="#1A1A2E" />
        <Text style={[styles.actionButtonText, { color: "#1A1A2E" }]}>Copy Receipt</Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={18} color="#2563EB" style={{ marginRight: 8, marginTop: 2 }} />
        <Text style={styles.infoText}>This receipt can be used as proof of transaction. Keep it safe for your records.</Text>
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
  receiptCard: { backgroundColor: "#1E293B", borderRadius: 16, padding: 32, marginBottom: 24 },
  statusBadge: { alignItems: "center", marginBottom: 24 },
  amountSection: { alignItems: "center", marginBottom: 24 },
  amountLabel: { fontSize: 14, color: "#94A3B8", marginBottom: 8 },
  amountValue: { fontSize: 40, fontWeight: "700", color: "#FFFFFF", marginBottom: 4 },
  statusText: { fontSize: 14, color: "#10B981", fontWeight: "600" },
  detailsDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.1)", marginVertical: 16 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  detailLabel: { fontSize: 14, color: "#94A3B8" },
  detailValue: { fontSize: 14, fontWeight: "500", color: "#FFFFFF" },
  referenceBox: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 16, marginTop: 8 },
  referenceLabel: { fontSize: 12, color: "#94A3B8", marginBottom: 4 },
  referenceValue: { fontSize: 14, fontWeight: "700", color: "#FFFFFF", fontFamily: "monospace" },
  shareTitle: { fontSize: 14, fontWeight: "600", color: "#6B7280", marginBottom: 12 },
  actionButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, borderRadius: 12, paddingVertical: 16, marginBottom: 12 },
  actionButtonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  infoBox: { flexDirection: "row", backgroundColor: "rgba(59,130,246,0.1)", borderWidth: 1, borderColor: "rgba(59,130,246,0.3)", borderRadius: 12, padding: 16, marginTop: 8 },
  infoText: { flex: 1, fontSize: 14, color: "#2563EB" },
});
