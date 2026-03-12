import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "../hooks/use-toast";
import { transfer, fetchCards } from "../lib/api";
import { getCurrentUser } from "../lib/auth";
import { getCountries, getBanksByCountry } from "../lib/banksData";

export default function SendMoney() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { toast } = useToast();

  const isFloatingButtonMode = params.mode === "qr";
  const initialMode = isFloatingButtonMode ? "scan" : "method";
  const initialPaymentMethod = isFloatingButtonMode ? "qr" : null;

  const [stage, setStage] = useState<"method" | "scan" | "wallet-id" | "card-select" | "amount" | "confirm" | "success">(initialMode as any);
  const [paymentMethod, setPaymentMethod] = useState<"qr" | "bukka" | "mobile" | "bank" | null>(initialPaymentMethod as any);
  const [walletId, setWalletId] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCard, setSelectedCard] = useState("");
  const [loading, setLoading] = useState(false);

  const [bankDetails, setBankDetails] = useState({
    accountName: "",
    accountNumber: "",
    bankName: "",
    country: "",
  });

  const [recipientData, setRecipientData] = useState<any>(null);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);

  const { data: cards = [], isLoading: cardsLoading } = useQuery({
    queryKey: ["cards"],
    queryFn: fetchCards,
  });

  const handleMethodSelect = (method: "bukka" | "mobile" | "bank") => {
    setPaymentMethod(method);
    setStage("wallet-id");
  };

  const handleWalletIdContinue = () => {
    if (!walletId.trim()) {
      toast({ title: "Invalid ID", description: "Please enter a wallet or wallet ID", variant: "destructive" });
      return;
    }
    setRecipientData({ id: walletId, type: paymentMethod });
    setStage("card-select");
  };

  const handleBankDetailsContinue = () => {
    const { accountName, accountNumber, bankName, country } = bankDetails;
    if (!accountName || !accountNumber || !bankName || !country) {
      toast({ title: "Missing Details", description: "Please fill in all bank details", variant: "destructive" });
      return;
    }
    setRecipientData({ accountName, accountNumber, bankName, country, type: "bank" });
    setStage("card-select");
  };

  const handleCardSelect = () => {
    if (!selectedCard) {
      toast({ title: "Select Card", description: "Please select a card to send from", variant: "destructive" });
      return;
    }
    setStage("amount");
  };

  const handleAmountContinue = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount", variant: "destructive" });
      return;
    }
    setStage("confirm");
  };

  const handleSend = async () => {
    setLoading(true);
    try {
      if (paymentMethod === "qr") {
        await transfer(selectedCard, recipientData?.userId || recipientData?.id, amount);
      } else if (paymentMethod === "bukka" || paymentMethod === "mobile") {
        await transfer(selectedCard, recipientData.id, amount);
      } else if (paymentMethod === "bank") {
        await transfer(selectedCard, recipientData.accountNumber, amount);
      }

      setStage("success");
      toast({ title: "Payment Sent", description: `$${amount} sent successfully` });

      setTimeout(() => {
        router.push("/(tabs)");
      }, 2000);
    } catch (error: any) {
      toast({ title: "Transfer Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (isFloatingButtonMode) {
      router.push("/(tabs)");
    } else if (stage === "method") {
      router.push("/(tabs)");
    } else {
      setStage("method");
      setPaymentMethod(null);
      setWalletId("");
      setAmount("");
      setBankDetails({ accountName: "", accountNumber: "", bankName: "", country: "" });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Money</Text>
        <View style={{ width: 40 }} />
      </View>

      {stage === "method" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How would you like to send?</Text>
          <Text style={styles.sectionSubtitle}>Choose your preferred payment method</Text>

          {isFloatingButtonMode && (
            <TouchableOpacity
              onPress={() => { setPaymentMethod("qr"); setStage("scan"); }}
              style={[styles.methodCard, { borderColor: "#7C3AED", backgroundColor: "rgba(124,58,237,0.05)" }]}
            >
              <View style={[styles.methodIcon, { backgroundColor: "rgba(124,58,237,0.2)" }]}>
                <Ionicons name="qr-code" size={24} color="#7C3AED" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.methodTitle}>Scan QR Code</Text>
                <Text style={styles.methodDesc}>Fast P2P payment with BukkaPay users</Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => handleMethodSelect("bukka")} style={styles.methodCard}>
            <View style={[styles.methodIcon, { backgroundColor: "rgba(139,92,246,0.2)" }]}>
              <Ionicons name="wallet" size={24} color="#8B5CF6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.methodTitle}>BukkaPay Wallet</Text>
              <Text style={styles.methodDesc}>Instant transfer to any BukkaPay user</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleMethodSelect("mobile")} style={styles.methodCard}>
            <View style={[styles.methodIcon, { backgroundColor: "rgba(16,185,129,0.2)" }]}>
              <Ionicons name="phone-portrait" size={24} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.methodTitle}>Mobile Money</Text>
              <Text style={styles.methodDesc}>Send to local mobile wallets</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleMethodSelect("bank")} style={styles.methodCard}>
            <View style={[styles.methodIcon, { backgroundColor: "rgba(37,99,235,0.2)" }]}>
              <Ionicons name="business" size={24} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.methodTitle}>Local Bank Transfer</Text>
              <Text style={styles.methodDesc}>Send to any local bank account</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/(tabs)")} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {stage === "scan" && paymentMethod === "qr" && (
        <View style={styles.section}>
          <View style={styles.scanPlaceholder}>
            <Ionicons name="qr-code" size={64} color="#6B7280" />
            <Text style={styles.scanPlaceholderText}>Camera QR scanning</Text>
            <Text style={styles.scanPlaceholderSubtext}>Point your camera at a QR code</Text>
          </View>
          <Text style={styles.inputLabel}>Or enter Wallet ID manually</Text>
          <TextInput
            value={walletId}
            onChangeText={setWalletId}
            placeholder="BKP-XXXXXXXX"
            placeholderTextColor="#6B7280"
            style={styles.input}
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={() => { setStage("method"); setPaymentMethod(null); }} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (walletId.trim()) {
                  setRecipientData({ id: walletId, type: "qr" });
                  setStage("card-select");
                } else {
                  toast({ title: "Error", description: "Enter a wallet ID", variant: "destructive" });
                }
              }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {stage === "wallet-id" && paymentMethod !== "bank" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recipient Details</Text>
          <Text style={styles.sectionSubtitle}>
            {paymentMethod === "bukka" ? "Enter the BukkaPay wallet ID" : "Enter the mobile wallet ID or phone number"}
          </Text>
          <Text style={styles.inputLabel}>{paymentMethod === "bukka" ? "BukkaPay Wallet ID" : "Mobile Wallet ID"}</Text>
          <TextInput
            value={walletId}
            onChangeText={setWalletId}
            placeholder={paymentMethod === "bukka" ? "BKP-XXXXXXXX" : "Wallet ID or phone number"}
            placeholderTextColor="#6B7280"
            style={styles.input}
            autoFocus
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={() => { setStage("method"); setPaymentMethod(null); }} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleWalletIdContinue} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {stage === "wallet-id" && paymentMethod === "bank" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bank Details</Text>
          <Text style={styles.sectionSubtitle}>Enter the recipient's bank account information</Text>

          <Text style={styles.inputLabel}>Account Holder Name</Text>
          <TextInput
            value={bankDetails.accountName}
            onChangeText={(t) => setBankDetails({ ...bankDetails, accountName: t })}
            placeholder="Full name"
            placeholderTextColor="#6B7280"
            style={styles.input}
          />

          <Text style={styles.inputLabel}>Country</Text>
          <TouchableOpacity onPress={() => setShowCountryPicker(!showCountryPicker)} style={styles.pickerButton}>
            <Text style={bankDetails.country ? styles.pickerText : styles.pickerPlaceholder}>
              {bankDetails.country || "Select a country..."}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>
          {showCountryPicker && (
            <ScrollView style={styles.pickerList} nestedScrollEnabled>
              {getCountries().map((country) => (
                <TouchableOpacity
                  key={country}
                  onPress={() => {
                    setBankDetails({ ...bankDetails, country, bankName: "" });
                    setShowCountryPicker(false);
                  }}
                  style={styles.pickerItem}
                >
                  <Text style={styles.pickerItemText}>{country}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <Text style={styles.inputLabel}>Bank Name</Text>
          <TouchableOpacity
            onPress={() => bankDetails.country && setShowBankPicker(!showBankPicker)}
            style={[styles.pickerButton, !bankDetails.country && { opacity: 0.5 }]}
            disabled={!bankDetails.country}
          >
            <Text style={bankDetails.bankName ? styles.pickerText : styles.pickerPlaceholder}>
              {bankDetails.bankName || (bankDetails.country ? "Select a bank..." : "Choose a country first...")}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>
          {showBankPicker && bankDetails.country && (
            <ScrollView style={styles.pickerList} nestedScrollEnabled>
              {getBanksByCountry(bankDetails.country).map((bank) => (
                <TouchableOpacity
                  key={bank}
                  onPress={() => {
                    setBankDetails({ ...bankDetails, bankName: bank });
                    setShowBankPicker(false);
                  }}
                  style={styles.pickerItem}
                >
                  <Text style={styles.pickerItemText}>{bank}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <Text style={styles.inputLabel}>Account Number</Text>
          <TextInput
            value={bankDetails.accountNumber}
            onChangeText={(t) => setBankDetails({ ...bankDetails, accountNumber: t })}
            placeholder="Account number or IBAN"
            placeholderTextColor="#6B7280"
            style={styles.input}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={() => { setStage("method"); setPaymentMethod(null); }} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleBankDetailsContinue} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {stage === "card-select" && recipientData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Payment Card</Text>
          <Text style={styles.sectionSubtitle}>Choose which card to send from</Text>

          {cardsLoading ? (
            <ActivityIndicator size="large" color="#7C3AED" style={{ marginVertical: 32 }} />
          ) : cards.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>No cards available</Text>
              <Text style={styles.emptyCardSubtext}>Please add a card first</Text>
            </View>
          ) : (
            cards.map((card: any) => (
              <TouchableOpacity
                key={card.id}
                onPress={() => setSelectedCard(card.id)}
                style={[
                  styles.cardOption,
                  selectedCard === card.id && { borderColor: "#7C3AED", backgroundColor: "rgba(124,58,237,0.05)" },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardBalance}>
                    Balance: ${parseFloat(card.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </Text>
                </View>
                {selectedCard === card.id && (
                  <View style={styles.checkCircle}>
                    <Text style={{ color: "#FFFFFF", fontSize: 12 }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={() => setStage("wallet-id")} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCardSelect}
              disabled={!selectedCard}
              style={[styles.primaryButton, !selectedCard && { opacity: 0.5 }]}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {stage === "amount" && recipientData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How much to send?</Text>
          <Text style={styles.sectionSubtitle}>Enter the amount to transfer</Text>

          <View style={styles.fromCardBox}>
            <Text style={styles.fromCardLabel}>From Card</Text>
            <Text style={styles.fromCardValue}>{cards.find((c: any) => c.id === selectedCard)?.title || "Loading..."}</Text>
          </View>

          <Text style={styles.inputLabel}>Amount</Text>
          <View style={styles.amountInputRow}>
            <Text style={styles.amountDollar}>$</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="#6B7280"
              keyboardType="numeric"
              style={styles.amountInput}
              autoFocus
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={() => {
                if (paymentMethod === "qr") setStage("scan");
                else setStage("wallet-id");
              }}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAmountContinue} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {stage === "confirm" && recipientData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Confirm Payment</Text>
          <Text style={styles.sectionSubtitle}>Review the details before sending</Text>

          <View style={styles.confirmCard}>
            <Text style={styles.confirmLabel}>Sending to</Text>
            {paymentMethod === "bank" ? (
              <>
                <Text style={styles.confirmName}>{recipientData.accountName}</Text>
                <Text style={styles.confirmDetail}>{recipientData.bankName} - {recipientData.country}</Text>
                <Text style={styles.confirmDetail}>Account: {recipientData.accountNumber}</Text>
              </>
            ) : (
              <>
                <Text style={styles.confirmName}>{recipientData.username || recipientData.id}</Text>
                <Text style={styles.confirmDetail}>
                  {paymentMethod === "bukka" ? "BukkaPay Wallet" : paymentMethod === "mobile" ? "Mobile Wallet" : "QR Payment"}
                </Text>
              </>
            )}
          </View>

          <View style={styles.confirmGrid}>
            <View style={styles.confirmGridItem}>
              <Text style={styles.confirmGridLabel}>Amount</Text>
              <Text style={styles.confirmGridValue}>${amount}</Text>
            </View>
            <View style={styles.confirmGridItem}>
              <Text style={styles.confirmGridLabel}>From Card</Text>
              <Text style={styles.confirmGridValueSmall}>{cards.find((c: any) => c.id === selectedCard)?.title || "Loading..."}</Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="alert-circle" size={20} color="#2563EB" style={{ marginTop: 2 }} />
            <Text style={styles.infoBoxText}>Verify all details are correct before confirming.</Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={() => setStage("amount")} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSend}
              disabled={loading}
              style={[styles.primaryButton, loading && { opacity: 0.5 }]}
            >
              <Ionicons name="send" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>{loading ? "Sending..." : `Pay $${amount}`}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {stage === "success" && (
        <View style={styles.successContainer}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.successTitle}>Payment Sent!</Text>
          <Text style={styles.successSubtitle}>${amount} has been sent successfully</Text>
          <Text style={styles.successRedirect}>Redirecting to home...</Text>
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
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#1A1A2E" },
  section: { paddingTop: 16 },
  sectionTitle: { fontSize: 22, fontWeight: "700", color: "#1A1A2E", marginBottom: 4 },
  sectionSubtitle: { fontSize: 14, color: "#6B7280", marginBottom: 24 },
  methodCard: { flexDirection: "row", alignItems: "flex-start", gap: 16, padding: 20, borderRadius: 16, borderWidth: 2, borderColor: "#E5E7EB", marginBottom: 12 },
  methodIcon: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  methodTitle: { fontSize: 16, fontWeight: "600", color: "#1A1A2E", marginBottom: 4 },
  methodDesc: { fontSize: 14, color: "#6B7280" },
  cancelButton: { paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", marginTop: 12 },
  cancelButtonText: { fontSize: 16, fontWeight: "600", color: "#1A1A2E" },
  inputLabel: { fontSize: 14, fontWeight: "500", color: "#1A1A2E", marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: "#1A1A2E", backgroundColor: "#FFFFFF" },
  buttonRow: { flexDirection: "row", gap: 12, marginTop: 24 },
  secondaryButton: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center" },
  secondaryButtonText: { fontSize: 16, fontWeight: "600", color: "#1A1A2E" },
  primaryButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: "#7C3AED", alignItems: "center", flexDirection: "row", justifyContent: "center" },
  primaryButtonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  pickerButton: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  pickerText: { fontSize: 16, color: "#1A1A2E" },
  pickerPlaceholder: { fontSize: 16, color: "#6B7280" },
  pickerList: { maxHeight: 200, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, marginTop: 4 },
  pickerItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F8F9FA" },
  pickerItemText: { fontSize: 14, color: "#1A1A2E" },
  cardOption: { padding: 16, borderRadius: 12, borderWidth: 2, borderColor: "#E5E7EB", marginBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontSize: 14, fontWeight: "600", color: "#1A1A2E", marginBottom: 4 },
  cardBalance: { fontSize: 12, color: "#6B7280" },
  checkCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#7C3AED", alignItems: "center", justifyContent: "center" },
  emptyCard: { backgroundColor: "#F8F9FA", borderRadius: 12, padding: 24, alignItems: "center" },
  emptyCardText: { fontSize: 14, color: "#6B7280" },
  emptyCardSubtext: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  fromCardBox: { backgroundColor: "#F8F9FA", borderRadius: 12, padding: 16, marginBottom: 16 },
  fromCardLabel: { fontSize: 12, color: "#6B7280", marginBottom: 4 },
  fromCardValue: { fontSize: 14, fontWeight: "600", color: "#1A1A2E" },
  amountInputRow: { flexDirection: "row", alignItems: "center", borderWidth: 2, borderColor: "#E5E7EB", borderRadius: 16, paddingHorizontal: 16 },
  amountDollar: { fontSize: 28, fontWeight: "700", color: "#7C3AED", marginRight: 8 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: "700", color: "#1A1A2E", paddingVertical: 16 },
  confirmCard: { backgroundColor: "rgba(124,58,237,0.1)", borderWidth: 1, borderColor: "rgba(124,58,237,0.2)", borderRadius: 16, padding: 24, marginBottom: 16 },
  confirmLabel: { fontSize: 14, color: "#6B7280", marginBottom: 8 },
  confirmName: { fontSize: 24, fontWeight: "700", color: "#7C3AED", marginBottom: 4 },
  confirmDetail: { fontSize: 12, color: "#6B7280" },
  confirmGrid: { flexDirection: "row", gap: 12, marginBottom: 16 },
  confirmGridItem: { flex: 1, backgroundColor: "#F8F9FA", borderRadius: 12, padding: 16 },
  confirmGridLabel: { fontSize: 12, color: "#6B7280", marginBottom: 4 },
  confirmGridValue: { fontSize: 24, fontWeight: "700", color: "#7C3AED" },
  confirmGridValueSmall: { fontSize: 14, fontWeight: "600", color: "#1A1A2E" },
  infoBox: { flexDirection: "row", gap: 12, backgroundColor: "rgba(59,130,246,0.1)", borderWidth: 1, borderColor: "rgba(59,130,246,0.2)", borderRadius: 12, padding: 16, marginBottom: 16 },
  infoBoxText: { flex: 1, fontSize: 14, color: "#2563EB" },
  successContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 64 },
  successCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#10B981", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: "700", color: "#1A1A2E", marginBottom: 8 },
  successSubtitle: { fontSize: 14, color: "#6B7280", marginBottom: 8 },
  successRedirect: { fontSize: 12, color: "#6B7280" },
  scanPlaceholder: { backgroundColor: "#171717", borderRadius: 16, padding: 48, alignItems: "center", marginBottom: 24 },
  scanPlaceholderText: { fontSize: 16, color: "#FFFFFF", fontWeight: "600", marginTop: 16 },
  scanPlaceholderSubtext: { fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 4 },
});
