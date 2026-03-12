import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { getCurrentUser } from "../lib/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../lib/config";

interface PaymentLinkDetails {
  id: string;
  linkCode: string;
  amount: string;
  rentMonth: string;
  status: string;
  tenantName: string;
  tenantEmail: string;
  propertyName: string;
  propertyAddress: string;
  unitNumber: string;
  landlordBusinessName: string;
}

export default function PayRent() {
  const router = useRouter();
  const params = useLocalSearchParams<{ linkCode: string }>();
  const linkCode = params.linkCode;
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      const u = await getCurrentUser();
      setUser(u);
    };
    loadUser();
  }, []);

  const { data: paymentLink, isLoading, error } = useQuery<PaymentLinkDetails>({
    queryKey: ["/api/rental/payment-links", linkCode],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/rental/payment-links/${linkCode}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Payment link not found");
      }
      return res.json();
    },
    enabled: !!linkCode,
  });

  const payMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/rental/payment-links/${linkCode}/pay`, {});
    },
    onSuccess: () => {
      setPaymentSuccess(true);
      Alert.alert("Success", "Rent payment successful!");
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message || "Payment failed");
    },
  });

  const handlePayNow = async () => {
    if (!user) {
      await AsyncStorage.setItem("redirectAfterLogin", `/pay-rent/${linkCode}`);
      router.push("/(screens)/login");
      return;
    }
    payMutation.mutate();
  };

  const formatMonth = (rentMonth: string) => {
    const [year, month] = rentMonth.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (error || !paymentLink) {
    return (
      <View style={styles.container}>
        <View style={styles.headerSimple}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Link</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.errorContent}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle" size={64} color="#EF4444" />
          </View>
          <Text style={styles.errorTitle}>Invalid or Expired Link</Text>
          <Text style={styles.errorSubtitle}>
            {(error as Error)?.message || "This payment link is no longer valid."}
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/(tabs)")}>
            <Text style={styles.primaryButtonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (paymentSuccess) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={48} color="#FFFFFF" />
        </View>
        <Text style={styles.successTitle}>Payment Successful!</Text>
        <Text style={styles.successSubtitle}>
          Your rent payment of ${parseFloat(paymentLink.amount).toFixed(2)} has been processed.
        </Text>
        <Text style={styles.successDetail}>
          For {formatMonth(paymentLink.rentMonth)} at {paymentLink.propertyName}
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/(tabs)")}>
          <Text style={styles.primaryButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerSimple}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pay Rent</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.body}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="home" size={20} color="#7C3AED" />
            <Text style={styles.cardTitle}>Rent Payment Request</Text>
          </View>

          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Amount Due</Text>
            <Text style={styles.amountValue}>${parseFloat(paymentLink.amount).toFixed(2)}</Text>
            <Text style={styles.amountMonth}>For {formatMonth(paymentLink.rentMonth)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Property</Text>
            <Text style={styles.detailValue}>{paymentLink.propertyName}</Text>
          </View>
          {paymentLink.propertyAddress ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Address</Text>
              <Text style={[styles.detailValue, { textAlign: "right", flex: 1 }]}>{paymentLink.propertyAddress}</Text>
            </View>
          ) : null}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Unit</Text>
            <Text style={styles.detailValue}>{paymentLink.unitNumber}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Landlord</Text>
            <Text style={styles.detailValue}>{paymentLink.landlordBusinessName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tenant</Text>
            <Text style={styles.detailValue}>{paymentLink.tenantName}</Text>
          </View>
        </View>

        {!user && (
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>
              You need to log in or create an account to pay. Your payment will be processed from your BukkaPay wallet.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.payButton, payMutation.isPending && { opacity: 0.5 }]}
          onPress={handlePayNow}
          disabled={payMutation.isPending}
        >
          {payMutation.isPending ? (
            <View style={styles.payButtonRow}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.payButtonText}> Processing...</Text>
            </View>
          ) : user ? (
            <View style={styles.payButtonRow}>
              <Ionicons name="card" size={20} color="#FFFFFF" />
              <Text style={styles.payButtonText}> Pay ${parseFloat(paymentLink.amount).toFixed(2)}</Text>
            </View>
          ) : (
            <Text style={styles.payButtonText}>Login to Pay</Text>
          )}
        </TouchableOpacity>

        {user && (
          <Text style={styles.hintText}>Payment will be deducted from your BukkaPay wallet</Text>
        )}

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  headerSimple: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  body: {
    paddingHorizontal: 24,
  },
  errorContent: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  successContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 4,
  },
  successDetail: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 32,
  },
  card: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  amountBox: {
    backgroundColor: "rgba(124,58,237,0.1)",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  amountValue: {
    fontSize: 36,
    fontWeight: "700",
    color: "#7C3AED",
  },
  amountMonth: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  warningCard: {
    backgroundColor: "rgba(245,158,11,0.1)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.3)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    color: "#A16207",
  },
  payButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  payButtonRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  primaryButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  hintText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 12,
  },
});
