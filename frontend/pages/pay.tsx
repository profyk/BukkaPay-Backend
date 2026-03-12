import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useToast } from "../hooks/use-toast";
import { getCurrentUser, getAuthToken } from "../lib/auth";
import { API_BASE } from "../lib/config";

export default function Pay() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { toast } = useToast();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requester, setRequester] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  const requestId = params.id as string;

  useEffect(() => {
    (async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    })();
  }, []);

  useEffect(() => {
    if (!requestId) return;

    const fetchRequest = async () => {
      try {
        const response = await fetch(API_BASE + `/api/payment-requests/${requestId}`);
        if (!response.ok) throw new Error("Request not found");

        const data = await response.json();
        setRequest(data);
        setRequester(data.requester);
      } catch {
        toast({ title: "Error", description: "Payment request not found or expired", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading payment request...</Text>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFoundTitle}>Payment Request Not Found</Text>
        <Text style={styles.notFoundSubtitle}>This request may have expired or been cancelled.</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)")} style={styles.homeButton}>
          <Text style={styles.homeButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleConfirmPayment = async () => {
    if (!user) {
      toast({ title: "Error", description: "Please log in to make a payment", variant: "destructive" });
      return;
    }

    try {
      const token = await getAuthToken();
      const response = await fetch(API_BASE + `/api/payment-requests/${requestId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "paid" }),
      });

      if (!response.ok) throw new Error("Failed to confirm payment");

      toast({ title: "Success", description: "Payment confirmed!" });
      setTimeout(() => {
        router.push("/(tabs)");
      }, 1500);
    } catch {
      toast({ title: "Error", description: "Error confirming payment", variant: "destructive" });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/(tabs)")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Request</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.requesterCard}>
        <View style={styles.requesterAvatar}>
          <Text style={styles.requesterAvatarText}>{requester?.name?.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.requesterLabel}>Payment Request from</Text>
        <Text style={styles.requesterName}>{requester?.name}</Text>
        <Text style={styles.requesterUsername}>@{requester?.username}</Text>
      </View>

      <View style={styles.amountCard}>
        <Text style={styles.amountLabel}>Amount Requested</Text>
        <Text style={styles.amountValue}>${request.amount}</Text>
        <Text style={styles.amountCurrency}>{request.currency}</Text>
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.detailSectionLabel}>FOR</Text>
        <Text style={styles.detailValue}>{request.recipientName}</Text>
        <Text style={[styles.detailSectionLabel, { marginTop: 12 }]}>STATUS</Text>
        <Text style={[styles.detailValue, { color: request.status === "paid" ? "#10B981" : "#EAB308" }]}>
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </Text>
      </View>

      {user ? (
        <View style={{ marginTop: 24 }}>
          <TouchableOpacity
            onPress={handleConfirmPayment}
            disabled={request.status === "paid"}
            style={[styles.confirmButton, request.status === "paid" && { opacity: 0.5 }]}
          >
            <Text style={styles.confirmButtonText}>
              {request.status === "paid" ? "Already Paid" : "Confirm Payment"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(tabs)")} style={styles.cancelPayButton}>
            <Text style={styles.cancelPayButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ marginTop: 24 }}>
          <TouchableOpacity onPress={() => toast({ title: "Info", description: "Download BukkaPay from your app store" })} style={[styles.confirmButton, { backgroundColor: "#10B981" }]}>
            <Ionicons name="download" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.confirmButtonText}>Download BukkaPay</Text>
          </TouchableOpacity>
          <Text style={styles.downloadHint}>Download the app to accept this payment request</Text>
          <TouchableOpacity onPress={() => router.push("/(screens)/login" as any)} style={styles.cancelPayButton}>
            <Text style={styles.cancelPayButtonText}>Already have an account? Login</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingBottom: 100, paddingHorizontal: 24 },
  centered: { flex: 1, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", padding: 24 },
  loadingText: { fontSize: 14, color: "#6B7280", marginTop: 16 },
  notFoundTitle: { fontSize: 22, fontWeight: "700", color: "#1A1A2E", marginBottom: 8 },
  notFoundSubtitle: { fontSize: 14, color: "#6B7280", marginBottom: 24, textAlign: "center" },
  homeButton: { backgroundColor: "#7C3AED", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  homeButtonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 48, paddingBottom: 16 },
  backButton: { padding: 8, borderRadius: 20 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
  requesterCard: { backgroundColor: "#F8F9FA", borderRadius: 16, padding: 24, alignItems: "center", marginBottom: 16 },
  requesterAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#7C3AED", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  requesterAvatarText: { fontSize: 24, fontWeight: "700", color: "#FFFFFF" },
  requesterLabel: { fontSize: 14, color: "#6B7280", marginBottom: 4 },
  requesterName: { fontSize: 20, fontWeight: "600", color: "#1A1A2E" },
  requesterUsername: { fontSize: 14, color: "#6B7280" },
  amountCard: { backgroundColor: "#7C3AED", borderRadius: 16, padding: 32, alignItems: "center", marginBottom: 16 },
  amountLabel: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 8 },
  amountValue: { fontSize: 48, fontWeight: "700", color: "#FFFFFF" },
  amountCurrency: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 8 },
  detailsCard: { backgroundColor: "#F8F9FA", borderRadius: 16, padding: 16 },
  detailSectionLabel: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  detailValue: { fontSize: 16, fontWeight: "500", color: "#1A1A2E", marginTop: 4 },
  confirmButton: { backgroundColor: "#7C3AED", borderRadius: 12, paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center" },
  confirmButtonText: { fontSize: 18, fontWeight: "600", color: "#FFFFFF" },
  cancelPayButton: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 12 },
  cancelPayButtonText: { fontSize: 16, fontWeight: "600", color: "#1A1A2E" },
  downloadHint: { fontSize: 14, color: "#6B7280", textAlign: "center", marginTop: 12, marginBottom: 12 },
});
