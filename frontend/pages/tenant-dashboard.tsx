import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Modal, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "../hooks/use-toast";
import { apiRequest, queryClient } from "../lib/queryClient";

interface PaymentHistory {
  id: string;
  amount: string;
  rentMonth: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

interface TenantDashboardData {
  id: string;
  tenantId: string;
  name: string;
  propertyName: string;
  unitNumber: string;
  monthlyRent: number;
  amountPaid: number;
  amountDue: number;
  status: "unpaid" | "partial" | "paid";
  dueDate: string;
  paymentHistory: PaymentHistory[];
}

interface TenantLookup {
  id: string;
  tenantId: string;
  name: string;
  propertyName: string;
  unitNumber: string;
  monthlyRent: string;
}

export default function TenantDashboard() {
  const { toast } = useToast();
  const [tenantIdInput, setTenantIdInput] = useState("");
  const [linkedTenant, setLinkedTenant] = useState<TenantLookup | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");

  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError, isError } = useQuery<TenantDashboardData>({
    queryKey: ["/api/rental/tenant-dashboard"],
    retry: false,
  });

  const isTenantNotLinked = isError && dashboardError?.message?.includes("404");

  const lookupMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      const res = await fetch(`/api/rental/tenant-lookup/${tenantId}`);
      if (!res.ok) throw new Error("Tenant not found");
      return res.json();
    },
    onSuccess: (data: TenantLookup) => {
      setLinkedTenant(data);
    },
    onError: () => {
      toast({ title: "Tenant not found", description: "Please check your Tenant ID", variant: "destructive" });
    },
  });

  const linkMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      return apiRequest("POST", "/api/rental/link-tenant", { tenantId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rental/tenant-dashboard"] });
      setLinkedTenant(null);
      setTenantIdInput("");
      toast({ title: "Account linked successfully!" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to link account", description: error.message, variant: "destructive" });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async ({ tenantId, amount }: { tenantId: string; amount: number }) => {
      return apiRequest("POST", "/api/rental/pay", { tenantId, amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rental/tenant-dashboard"] });
      setPaymentOpen(false);
      setPaymentAmount("");
      toast({ title: "Payment successful!" });
    },
    onError: (error: Error) => {
      toast({ title: "Payment failed", description: error.message, variant: "destructive" });
    },
  });

  const getStatusIcon = (status: string): { name: keyof typeof Ionicons.glyphMap; color: string } => {
    switch (status) {
      case "paid":
        return { name: "checkmark-circle", color: "#10B981" };
      case "partial":
        return { name: "time", color: "#EAB308" };
      default:
        return { name: "alert-circle", color: "#EF4444" };
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "paid":
        return "#10B981";
      case "partial":
        return "#EAB308";
      default:
        return "#EF4444";
    }
  };

  const hasDashboard = dashboardData && !isError;

  if (dashboardLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (!hasDashboard) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.centerContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitleCenter}>Link Your Tenant Account</Text>
          <Text style={styles.descriptionText}>
            Enter your Tenant ID provided by your landlord to view your rent status and make payments.
          </Text>

          <Text style={styles.label}>Tenant ID</Text>
          <TextInput
            value={tenantIdInput}
            onChangeText={(text) => setTenantIdInput(text.toUpperCase())}
            placeholder="TEN-XXXXXXXX-XXXX"
            placeholderTextColor="#6B7280"
            style={styles.textInput}
            autoCapitalize="characters"
          />

          {!linkedTenant && (
            <TouchableOpacity
              onPress={() => lookupMutation.mutate(tenantIdInput)}
              disabled={lookupMutation.isPending || !tenantIdInput}
              style={[styles.primaryButton, (!tenantIdInput || lookupMutation.isPending) && styles.disabledButton]}
            >
              <Text style={styles.primaryButtonText}>
                {lookupMutation.isPending ? "Looking up..." : "Find My Account"}
              </Text>
            </TouchableOpacity>
          )}

          {linkedTenant && (
            <View style={styles.linkedCard}>
              <Text style={styles.linkedName}>{linkedTenant.name}</Text>
              <Text style={styles.linkedSub}>
                {linkedTenant.propertyName} - Unit {linkedTenant.unitNumber}
              </Text>
              <Text style={styles.linkedRent}>Monthly Rent: ${linkedTenant.monthlyRent}</Text>
              <TouchableOpacity
                onPress={() => linkMutation.mutate(linkedTenant.tenantId)}
                disabled={linkMutation.isPending}
                style={[styles.primaryButton, linkMutation.isPending && styles.disabledButton]}
              >
                <Text style={styles.primaryButtonText}>
                  {linkMutation.isPending ? "Linking..." : "Link to My Account"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  const statusIcon = getStatusIcon(dashboardData.status);
  const statusColor = getStatusColor(dashboardData.status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollPadding}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>My Rent</Text>
        <Text style={styles.welcomeText}>Welcome back, {dashboardData.name}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.propertyRow}>
          <View style={styles.propertyIcon}>
            <Ionicons name="home-outline" size={24} color="#7C3AED" />
          </View>
          <View>
            <Text style={styles.propertyName}>{dashboardData.propertyName}</Text>
            <Text style={styles.unitText}>Unit {dashboardData.unitNumber}</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.statusRow}>
          <View style={styles.statusLeft}>
            <Ionicons name={statusIcon.name} size={20} color={statusIcon.color} />
            <Text style={[styles.statusLabel, { textTransform: "capitalize" }]}>{dashboardData.status}</Text>
          </View>
          <View style={[styles.monthBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.monthBadgeText}>
              {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
            </Text>
          </View>
        </View>

        <View style={styles.rentGrid}>
          <View style={styles.rentGridItem}>
            <Text style={styles.rentAmount}>${dashboardData.monthlyRent.toFixed(2)}</Text>
            <Text style={styles.rentLabel}>Monthly Rent</Text>
          </View>
          <View style={styles.rentGridItem}>
            <Text style={[styles.rentAmount, { color: "#10B981" }]}>${dashboardData.amountPaid.toFixed(2)}</Text>
            <Text style={styles.rentLabel}>Paid</Text>
          </View>
          <View style={styles.rentGridItem}>
            <Text style={[styles.rentAmount, { color: "#EF4444" }]}>${dashboardData.amountDue.toFixed(2)}</Text>
            <Text style={styles.rentLabel}>Due</Text>
          </View>
        </View>

        {dashboardData.status !== "paid" && (
          <TouchableOpacity onPress={() => setPaymentOpen(true)} style={styles.payRentButton}>
            <Ionicons name="card-outline" size={16} color="#FFFFFF" />
            <Text style={styles.payRentButtonText}>Pay Rent</Text>
          </TouchableOpacity>
        )}

        {dashboardData.status === "paid" && (
          <View style={styles.paidBanner}>
            <Ionicons name="checkmark-circle" size={32} color="#10B981" />
            <Text style={styles.paidText}>You're all paid up for this month!</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.historyHeader}>
          <Ionicons name="calendar-outline" size={16} color="#1A1A2E" />
          <Text style={styles.historyTitle}>Payment History</Text>
        </View>
        {dashboardData.paymentHistory.length === 0 ? (
          <Text style={styles.noPayments}>No payments yet</Text>
        ) : (
          <View>
            {dashboardData.paymentHistory.map((payment) => (
              <View key={payment.id} style={styles.paymentItem}>
                <View>
                  <Text style={styles.paymentAmount}>${parseFloat(payment.amount).toFixed(2)}</Text>
                  <Text style={styles.paymentDate}>
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.paymentBadge}>
                  <Text style={styles.paymentBadgeText}>{payment.rentMonth}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <Modal visible={paymentOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Make a Payment</Text>
              <TouchableOpacity onPress={() => setPaymentOpen(false)}>
                <Ionicons name="close" size={24} color="#1A1A2E" />
              </TouchableOpacity>
            </View>

            <Text style={styles.amountDueText}>
              Amount due: <Text style={styles.amountDueBold}>${dashboardData.amountDue.toFixed(2)}</Text>
            </Text>

            <Text style={styles.label}>Payment Amount ($)</Text>
            <TextInput
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              placeholder={dashboardData.amountDue.toFixed(2)}
              placeholderTextColor="#6B7280"
              keyboardType="numeric"
              style={styles.textInput}
            />

            <TouchableOpacity
              onPress={() => setPaymentAmount(dashboardData.amountDue.toFixed(2))}
              style={styles.outlineButton}
            >
              <Text style={styles.outlineButtonText}>Pay Full Amount</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                paymentMutation.mutate({
                  tenantId: dashboardData.tenantId,
                  amount: parseFloat(paymentAmount || "0"),
                })
              }
              disabled={paymentMutation.isPending || !paymentAmount}
              style={[styles.primaryButton, (!paymentAmount || paymentMutation.isPending) && styles.disabledButton]}
            >
              <Text style={styles.primaryButtonText}>
                {paymentMutation.isPending ? "Processing..." : `Pay $${paymentAmount || "0"}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  loadingContainer: { flex: 1, backgroundColor: "#FFFFFF", justifyContent: "center", alignItems: "center" },
  centerContent: { padding: 16, justifyContent: "center", flexGrow: 1 },
  scrollPadding: { padding: 16, paddingBottom: 32 },
  pageHeader: { marginBottom: 24 },
  pageTitle: { fontSize: 24, fontWeight: "700", color: "#1A1A2E" },
  welcomeText: { color: "#6B7280", fontSize: 14, marginTop: 4 },
  card: { backgroundColor: "#F8F9FA", borderRadius: 12, padding: 16, marginBottom: 16 },
  cardTitleCenter: { fontSize: 18, fontWeight: "700", color: "#1A1A2E", textAlign: "center", marginBottom: 12 },
  descriptionText: { fontSize: 14, color: "#6B7280", textAlign: "center", marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "500", color: "#1A1A2E", marginBottom: 8 },
  textInput: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: "#1A1A2E", marginBottom: 12 },
  primaryButton: { backgroundColor: "#7C3AED", borderRadius: 8, height: 48, justifyContent: "center", alignItems: "center", marginTop: 8 },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },
  disabledButton: { opacity: 0.5 },
  linkedCard: { backgroundColor: "#FFFFFF", borderRadius: 8, padding: 16, marginTop: 12, alignItems: "center" },
  linkedName: { fontWeight: "600", fontSize: 16, color: "#1A1A2E" },
  linkedSub: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  linkedRent: { fontSize: 14, color: "#1A1A2E", marginTop: 4, marginBottom: 8 },
  propertyRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  propertyIcon: { width: 48, height: 48, borderRadius: 8, backgroundColor: "rgba(124,58,237,0.1)", justifyContent: "center", alignItems: "center" },
  propertyName: { fontWeight: "600", fontSize: 16, color: "#1A1A2E" },
  unitText: { fontSize: 14, color: "#6B7280" },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  statusLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusLabel: { fontWeight: "500", fontSize: 15, color: "#1A1A2E" },
  monthBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  monthBadgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  rentGrid: { flexDirection: "row", gap: 16, marginBottom: 16 },
  rentGridItem: { flex: 1, alignItems: "center" },
  rentAmount: { fontSize: 20, fontWeight: "700", color: "#1A1A2E" },
  rentLabel: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  payRentButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#7C3AED", borderRadius: 8, height: 48, marginTop: 8 },
  payRentButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },
  paidBanner: { backgroundColor: "rgba(16,185,129,0.1)", borderRadius: 8, padding: 16, alignItems: "center", marginTop: 16 },
  paidText: { fontSize: 14, fontWeight: "500", color: "#047857", marginTop: 8 },
  historyHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  historyTitle: { fontSize: 16, fontWeight: "600", color: "#1A1A2E" },
  noPayments: { fontSize: 14, color: "#6B7280", textAlign: "center", paddingVertical: 16 },
  paymentItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  paymentAmount: { fontSize: 14, fontWeight: "500", color: "#1A1A2E" },
  paymentDate: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  paymentBadge: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  paymentBadgeText: { fontSize: 12, color: "#1A1A2E" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
  amountDueText: { fontSize: 14, color: "#6B7280", textAlign: "center", marginBottom: 16 },
  amountDueBold: { fontWeight: "700", color: "#1A1A2E" },
  outlineButton: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, height: 48, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  outlineButtonText: { color: "#1A1A2E", fontWeight: "600", fontSize: 15 },
});
