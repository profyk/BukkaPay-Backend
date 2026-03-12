import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";

interface MerchantInfo {
  merchantId: string;
  businessName: string;
  businessType: string;
  qrCode: string;
  ownerName: string;
}

export default function MerchantPay() {
  const router = useRouter();
  const params = useLocalSearchParams<{ paymentLink: string }>();
  const [amount, setAmount] = useState("");
  const [payerName, setPayerName] = useState("");
  const [reference, setReference] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: merchant, isLoading, error } = useQuery<MerchantInfo>({
    queryKey: [`/api/merchant-pay/${params.paymentLink}`],
    enabled: !!params.paymentLink,
  });

  const payMerchant = useMutation({
    mutationFn: async (data: { amount: number; payerName: string; reference?: string }) => {
      return apiRequest("POST", `/api/merchant-pay/${merchant?.merchantId}`, data);
    },
    onSuccess: () => {
      setIsSuccess(true);
      Alert.alert("Success", "Payment successful!");
    },
    onError: (err: Error) => {
      Alert.alert("Error", err.message || "Payment failed");
    },
  });

  const handlePay = () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }
    payMerchant.mutate({
      amount: amountNum,
      payerName: payerName.trim() || "Anonymous",
      reference: reference.trim() || undefined,
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (error || !merchant) {
    return (
      <View style={styles.container}>
        <View style={styles.headerSimple}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pay Merchant</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.errorContent}>
          <View style={styles.errorIcon}>
            <Ionicons name="storefront" size={40} color="#EF4444" />
          </View>
          <Text style={styles.errorTitle}>Merchant Not Found</Text>
          <Text style={styles.errorSubtitle}>This payment link is invalid or expired</Text>
        </View>
      </View>
    );
  }

  if (isSuccess) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCircle}>
          <Ionicons name="checkmark-circle" size={48} color="#FFFFFF" />
        </View>
        <Text style={styles.successTitle}>Payment Successful!</Text>
        <Text style={styles.successSubtitle}>
          You paid ${parseFloat(amount).toFixed(2)} to {merchant.businessName}
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
        <Text style={styles.headerTitle}>Pay Merchant</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.body}>
        <View style={styles.merchantCard}>
          <View style={styles.merchantRow}>
            <View style={styles.merchantIcon}>
              <Ionicons name="storefront" size={28} color="#7C3AED" />
            </View>
            <View>
              <Text style={styles.merchantName}>{merchant.businessName}</Text>
              <Text style={styles.merchantType}>{merchant.businessType.replace("_", " ")}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.inputLabel}>Amount *</Text>
        <View style={styles.amountInputContainer}>
          <Text style={styles.currencyPrefix}>$</Text>
          <TextInput
            placeholder="0.00"
            placeholderTextColor="#6B7280"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            style={styles.amountInput}
          />
        </View>

        <Text style={[styles.inputLabel, { marginTop: 16 }]}>Your Name (Optional)</Text>
        <TextInput
          placeholder="Enter your name"
          placeholderTextColor="#6B7280"
          value={payerName}
          onChangeText={setPayerName}
          style={styles.textInput}
        />

        <Text style={[styles.inputLabel, { marginTop: 16 }]}>Reference (Optional)</Text>
        <TextInput
          placeholder="e.g. Order #123"
          placeholderTextColor="#6B7280"
          value={reference}
          onChangeText={setReference}
          style={styles.textInput}
        />

        <TouchableOpacity
          style={[styles.payButton, (payMerchant.isPending || !amount) && { opacity: 0.5 }]}
          onPress={handlePay}
          disabled={payMerchant.isPending || !amount}
        >
          <Text style={styles.primaryButtonText}>
            {payMerchant.isPending ? "Processing..." : `Pay $${parseFloat(amount || "0").toFixed(2)}`}
          </Text>
        </TouchableOpacity>
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
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  errorIcon: {
    width: 80,
    height: 80,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
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
    marginBottom: 32,
  },
  merchantCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 24,
    marginBottom: 24,
  },
  merchantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  merchantIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "rgba(124,58,237,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  merchantName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  merchantType: {
    fontSize: 14,
    color: "#6B7280",
    textTransform: "capitalize",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A2E",
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    height: 56,
  },
  currencyPrefix: {
    fontSize: 24,
    fontWeight: "700",
    color: "#6B7280",
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#1A1A2E",
  },
  payButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
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
});
