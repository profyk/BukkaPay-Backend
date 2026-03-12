import { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useToast } from "../hooks/use-toast";

export default function TopUp() {
  const router = useRouter();
  const { toast } = useToast();
  const [section, setSection] = useState<"select" | "card" | "voucher">("select");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolderName, setCardHolderName] = useState("");
  const [amount, setAmount] = useState("");
  const [voucherCode, setVoucherCode] = useState("");

  const handleCardTopUp = async () => {
    if (!cardNumber || !cardHolderName || !amount) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    try {
      toast({ title: "Success", description: `$${amount} added to your wallet!` });
      setCardNumber("");
      setCardHolderName("");
      setAmount("");
      setSection("select");
    } catch (error) {
      toast({ title: "Error", description: "Failed to process card top-up", variant: "destructive" });
    }
  };

  const handleVoucherTopUp = async () => {
    if (!voucherCode) {
      toast({ title: "Error", description: "Please enter a voucher code", variant: "destructive" });
      return;
    }
    try {
      toast({ title: "Success", description: "Voucher redeemed successfully!" });
      setVoucherCode("");
      setSection("select");
    } catch (error) {
      toast({ title: "Error", description: "Invalid or expired voucher", variant: "destructive" });
    }
  };

  if (section === "select") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Top Up Wallet</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.subtitle}>Choose how you'd like to add funds to your wallet</Text>

          <TouchableOpacity style={styles.optionCard} onPress={() => setSection("card")}>
            <View style={[styles.optionIcon, { backgroundColor: "#2563EB" }]}>
              <Ionicons name="card" size={24} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>Bank Card</Text>
              <Text style={styles.optionSubtitle}>Top up with any bank card</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.optionCard, { backgroundColor: "#059669" }]} onPress={() => setSection("voucher")}>
            <View style={[styles.optionIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Ionicons name="ticket" size={24} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>Voucher</Text>
              <Text style={[styles.optionSubtitle, { color: "rgba(255,255,255,0.8)" }]}>Redeem BukkaPay or other vouchers</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (section === "card") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setSection("select")}>
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Top Up with Card</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.cardBanner}>
          <Ionicons name="card" size={32} color="#FFFFFF" />
          <Text style={styles.bannerSubtitle}>Card Top Up</Text>
          <Text style={styles.bannerTitle}>Fast & Secure</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Card Holder Name</Text>
          <TextInput
            style={styles.textInput}
            value={cardHolderName}
            onChangeText={setCardHolderName}
            placeholder="John Doe"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Card Number</Text>
          <TextInput
            style={styles.textInput}
            value={cardNumber}
            onChangeText={(t) => setCardNumber(t.replace(/\D/g, "").slice(0, 16))}
            placeholder="1234 5678 9012 3456"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Expiry (MM/YY)</Text>
            <TextInput style={styles.textInput} placeholder="12/25" placeholderTextColor="#9CA3AF" keyboardType="number-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>CVV</Text>
            <TextInput style={styles.textInput} placeholder="123" placeholderTextColor="#9CA3AF" maxLength={3} keyboardType="number-pad" secureTextEntry />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Amount (USD)</Text>
          <View style={styles.amountRow}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              style={[styles.textInput, { flex: 1 }]}
              value={amount}
              onChangeText={setAmount}
              placeholder="100.00"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <View style={styles.quickSection}>
          <Text style={styles.quickLabel}>Quick amounts</Text>
          <View style={styles.quickRow}>
            {["25", "50", "100", "250"].map((val) => (
              <TouchableOpacity key={val} style={styles.quickBtn} onPress={() => setAmount(val)}>
                <Text style={styles.quickBtnText}>${val}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.blueButton} onPress={handleCardTopUp}>
          <Text style={styles.blueButtonText}>Top Up ${amount || "0.00"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setSection("select")}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => setSection("select")}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Redeem Voucher</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.cardBanner, { backgroundColor: "#059669" }]}>
        <Ionicons name="ticket" size={32} color="#FFFFFF" />
        <Text style={styles.bannerSubtitle}>Voucher Redemption</Text>
        <Text style={styles.bannerTitle}>Instant Credit</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Voucher Code</Text>
        <TextInput
          style={[styles.textInput, { textAlign: "center", letterSpacing: 4, fontFamily: "monospace" }]}
          value={voucherCode}
          onChangeText={(t) => setVoucherCode(t.toUpperCase())}
          placeholder="Enter voucher code"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.servicesSection}>
        <Text style={styles.servicesTitle}>Supported Services</Text>
        {[
          { name: "BukkaPay Gift Card", icon: "gift" as const },
          { name: "iTunes & App Store", icon: "phone-portrait" as const },
          { name: "Google Play", icon: "logo-google-playstore" as const },
          { name: "Amazon Gift Card", icon: "cube" as const },
        ].map((service, idx) => (
          <View key={idx} style={styles.serviceItem}>
            <Ionicons name={service.icon} size={20} color="#7C3AED" />
            <Text style={styles.serviceText}>{service.name}</Text>
          </View>
        ))}
      </View>

      <View style={styles.tipBox}>
        <Text style={styles.tipTitle}>Tip</Text>
        <Text style={styles.tipText}>
          Voucher codes typically start with "BKP-" or are 12-16 characters long. Make sure to enter the exact code.
        </Text>
      </View>

      <TouchableOpacity style={[styles.blueButton, { backgroundColor: "#059669" }]} onPress={handleVoucherTopUp}>
        <Text style={styles.blueButtonText}>Redeem Voucher</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={() => setSection("select")}>
        <Text style={styles.secondaryButtonText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 0,
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
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    marginBottom: 16,
    gap: 16,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  optionSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1A1A2E",
  },
  cardBanner: {
    backgroundColor: "#2563EB",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 12,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 4,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1A1A2E",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1A1A2E",
    backgroundColor: "#F8F9FA",
  },
  row: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dollarSign: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  quickSection: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  quickLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 12,
  },
  quickRow: {
    flexDirection: "row",
    gap: 8,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  quickBtnText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1A1A2E",
  },
  blueButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  blueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1A1A2E",
  },
  servicesSection: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  servicesTitle: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 12,
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.5)",
    marginBottom: 8,
  },
  serviceText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1A1A2E",
  },
  tipBox: {
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.2)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563EB",
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
  },
});
