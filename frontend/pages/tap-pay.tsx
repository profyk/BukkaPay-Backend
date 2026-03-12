import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useToast } from "../hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { fetchCards } from "../lib/api";
import { mapCardFromAPI } from "../lib/mappers";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface CardData {
  id: string;
  title: string;
  cardNumber: string;
  balance: number;
  color: string;
}

export default function TapPay() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<"select" | "auth" | "ready" | "processing" | "success">("select");
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [authMethod, setAuthMethod] = useState<"pin" | "face">("pin");
  const [pin, setPin] = useState("");
  const [amount, setAmount] = useState("");
  const [storeName, setStoreName] = useState("");

  const { data: cards } = useQuery({
    queryKey: ["cards"],
    queryFn: fetchCards,
  });

  const mappedCards: CardData[] = cards?.map(mapCardFromAPI) || [];

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) setPin(pin + num);
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleVerifyPin = async () => {
    if (pin.length !== 4) {
      toast({ title: "Error", description: "PIN must be 4 digits", variant: "destructive" });
      return;
    }
    const storedPin = (await AsyncStorage.getItem("wallet_pin")) || "1234";
    if (pin === storedPin) {
      toast({ title: "Success", description: "PIN verified!" });
      setStep("ready");
    } else {
      toast({ title: "Error", description: "Invalid PIN", variant: "destructive" });
      setPin("");
    }
  };

  const handleSelectCard = (card: CardData) => {
    setSelectedCard(card);
    setStep("auth");
  };

  const simulateNFCPayment = () => {
    setStep("processing");
    setTimeout(() => {
      setAmount("$" + (Math.random() * 200 + 10).toFixed(2));
      setStoreName(["Tech Store", "Coffee Shop", "Grocery Mart", "Fashion Outlet", "Restaurant"][Math.floor(Math.random() * 5)]);
      setStep("success");
    }, 3000);
  };

  const resetPayment = () => {
    setStep("select");
    setPin("");
    setSelectedCard(null);
    setAmount("");
    setStoreName("");
  };

  if (step === "select") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push("/(tabs)")} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tap to Pay</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.selectHero}>
          <View style={styles.heroCircle}>
            <Ionicons name="phone-portrait" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.selectTitle}>Select Payment Card</Text>
          <Text style={styles.selectSubtitle}>Choose a card for contactless payment</Text>
        </View>

        {mappedCards.length > 0 ? (
          mappedCards.map((card, idx) => (
            <TouchableOpacity key={card.id || idx} onPress={() => handleSelectCard(card)} style={styles.cardItem}>
              <View style={styles.cardIconBox}>
                <Ionicons name="card" size={24} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardItemTitle}>{card.title}</Text>
                <Text style={styles.cardItemNumber}>{card.cardNumber}</Text>
                <Text style={styles.cardItemBalance}>Balance: ${card.balance.toLocaleString()}</Text>
              </View>
              <Ionicons name="wifi" size={24} color="#A78BFA" />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyCards}>
            <Ionicons name="card" size={48} color="#E5E7EB" />
            <Text style={styles.emptyCardsText}>No cards available</Text>
            <Text style={styles.emptyCardsSubtext}>Add a card to use Tap to Pay</Text>
          </View>
        )}

        <TouchableOpacity onPress={() => router.push("/(tabs)")} style={styles.cancelBtn}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (step === "auth") {
    return (
      <View style={styles.container}>
        <View style={styles.header2}>
          <TouchableOpacity onPress={() => setStep("select")} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verify Identity</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.authContent}>
          {selectedCard && (
            <View style={styles.selectedCardBox}>
              <Ionicons name="card" size={24} color="#A78BFA" />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.selectedCardTitle}>{selectedCard.title}</Text>
                <Text style={styles.selectedCardNumber}>{selectedCard.cardNumber}</Text>
              </View>
            </View>
          )}

          <Text style={styles.pinPrompt}>Enter your 4-digit PIN</Text>
          <View style={styles.pinDots}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={styles.pinDot}>
                <Text style={styles.pinDotText}>{pin[i] ? "●" : "○"}</Text>
              </View>
            ))}
          </View>

          <View style={styles.pinPad}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <TouchableOpacity key={num} onPress={() => handleNumberClick(num.toString())} style={styles.pinKey}>
                <Text style={styles.pinKeyText}>{num}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.pinKey} />
            <TouchableOpacity onPress={() => handleNumberClick("0")} style={styles.pinKey}>
              <Text style={styles.pinKeyText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleBackspace} style={styles.pinKey}>
              <Ionicons name="backspace" size={24} color="#1A1A2E" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleVerifyPin}
            disabled={pin.length !== 4}
            style={[styles.verifyButton, pin.length !== 4 && { opacity: 0.5 }]}
          >
            <Ionicons name="lock-closed" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.verifyButtonText}>Verify PIN</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (step === "ready") {
    return (
      <View style={[styles.container, { backgroundColor: "#1E1B4B" }]}>
        <View style={styles.readyHeader}>
          <TouchableOpacity onPress={resetPayment} style={styles.readyBackButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.readyHeaderTitle}>Ready to Pay</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.readyCenter}>
          <View style={styles.readyCircle}>
            <Ionicons name="wifi" size={56} color="#FFFFFF" />
          </View>
          <Text style={styles.readyTitle}>Hold Near POS Terminal</Text>
          <Text style={styles.readySubtitle}>Position your phone near the payment terminal</Text>

          {selectedCard && (
            <View style={styles.readyCardBox}>
              <Ionicons name="card" size={24} color="#A78BFA" />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.readyCardTitle}>{selectedCard.title}</Text>
                <Text style={styles.readyCardNumber}>{selectedCard.cardNumber}</Text>
              </View>
            </View>
          )}

          <TouchableOpacity onPress={simulateNFCPayment} style={styles.simulateButton}>
            <Ionicons name="wifi" size={20} color="#1E1B4B" style={{ marginRight: 8 }} />
            <Text style={styles.simulateButtonText}>Simulate POS Detection</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={resetPayment} style={styles.readyCancelButton}>
          <Text style={styles.readyCancelText}>Cancel Payment</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === "processing") {
    return (
      <View style={[styles.container, { backgroundColor: "#1E1B4B", alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.processingTitle}>Processing Payment</Text>
        <Text style={styles.processingSubtitle}>Please wait...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.successContent}>
      <View style={styles.successCircle}>
        <Ionicons name="checkmark" size={48} color="#FFFFFF" />
      </View>
      <Text style={styles.successTitle}>Payment Successful!</Text>
      <Text style={styles.successSubtitle}>Transaction completed</Text>

      <View style={styles.successCard}>
        <Text style={styles.successAmountLabel}>Amount Paid</Text>
        <Text style={styles.successAmount}>{amount}</Text>
        <View style={styles.successDivider} />
        <View style={styles.successDetailRow}>
          <Text style={styles.successDetailLabel}>Merchant</Text>
          <Text style={styles.successDetailValue}>{storeName}</Text>
        </View>
        <View style={styles.successDetailRow}>
          <Text style={styles.successDetailLabel}>Card</Text>
          <Text style={styles.successDetailValue}>{selectedCard?.title || "Payment Card"}</Text>
        </View>
        <View style={styles.successDetailRow}>
          <Text style={styles.successDetailLabel}>Reference</Text>
          <Text style={[styles.successDetailValue, { fontFamily: "monospace", fontSize: 12 }]}>TX-{Date.now().toString().slice(-8)}</Text>
        </View>
        <View style={styles.successDetailRow}>
          <Text style={styles.successDetailLabel}>Date</Text>
          <Text style={styles.successDetailValue}>{new Date().toLocaleDateString()}</Text>
        </View>
      </View>

      <TouchableOpacity onPress={() => router.push("/(tabs)")} style={styles.homeBtn}>
        <Text style={styles.homeBtnText}>Back to Home</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={resetPayment} style={styles.cancelBtn}>
        <Text style={styles.cancelBtnText}>Make Another Payment</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingBottom: 100, paddingHorizontal: 24 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 48, paddingBottom: 16, paddingHorizontal: 24 },
  header2: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 48, paddingBottom: 16, paddingHorizontal: 24 },
  backButton: { padding: 8, borderRadius: 20 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
  selectHero: { alignItems: "center", marginBottom: 32, marginTop: 16 },
  heroCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#7C3AED", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  selectTitle: { fontSize: 20, fontWeight: "700", color: "#1A1A2E", marginBottom: 8 },
  selectSubtitle: { fontSize: 14, color: "#6B7280" },
  cardItem: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 12, backgroundColor: "#1E293B", marginBottom: 12 },
  cardIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: "#7C3AED", alignItems: "center", justifyContent: "center", marginRight: 12 },
  cardItemTitle: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
  cardItemNumber: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  cardItemBalance: { fontSize: 12, color: "#10B981", marginTop: 4 },
  emptyCards: { alignItems: "center", paddingVertical: 48 },
  emptyCardsText: { fontSize: 14, color: "#6B7280", marginTop: 12 },
  emptyCardsSubtext: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  cancelBtn: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 12 },
  cancelBtnText: { fontSize: 16, fontWeight: "600", color: "#1A1A2E" },
  authContent: { paddingHorizontal: 24, paddingBottom: 32 },
  selectedCardBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#1E293B", borderRadius: 12, padding: 16, marginBottom: 24 },
  selectedCardTitle: { fontSize: 14, fontWeight: "500", color: "#FFFFFF" },
  selectedCardNumber: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  pinPrompt: { fontSize: 14, color: "#6B7280", textAlign: "center", marginBottom: 16 },
  pinDots: { flexDirection: "row", justifyContent: "center", gap: 12, marginBottom: 32 },
  pinDot: { width: 56, height: 56, borderRadius: 12, backgroundColor: "#F8F9FA", alignItems: "center", justifyContent: "center" },
  pinDotText: { fontSize: 24, color: "#1A1A2E" },
  pinPad: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  pinKey: { width: "31%", height: 56, borderRadius: 12, backgroundColor: "#F8F9FA", alignItems: "center", justifyContent: "center" },
  pinKeyText: { fontSize: 20, fontWeight: "600", color: "#1A1A2E" },
  verifyButton: { flexDirection: "row", backgroundColor: "#7C3AED", borderRadius: 12, paddingVertical: 16, alignItems: "center", justifyContent: "center" },
  verifyButtonText: { fontSize: 18, fontWeight: "600", color: "#FFFFFF" },
  readyHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 48, paddingBottom: 16, paddingHorizontal: 24 },
  readyBackButton: { padding: 8, borderRadius: 20 },
  readyHeaderTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  readyCenter: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  readyCircle: { width: 128, height: 128, borderRadius: 64, backgroundColor: "#7C3AED", alignItems: "center", justifyContent: "center", marginBottom: 32, shadowColor: "#7C3AED", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 8 },
  readyTitle: { fontSize: 24, fontWeight: "700", color: "#FFFFFF", marginBottom: 8 },
  readySubtitle: { fontSize: 14, color: "#A78BFA", textAlign: "center", marginBottom: 24 },
  readyCardBox: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 16, width: "100%", marginBottom: 24 },
  readyCardTitle: { fontSize: 14, fontWeight: "500", color: "#FFFFFF" },
  readyCardNumber: { fontSize: 12, color: "#A78BFA", marginTop: 2 },
  simulateButton: { flexDirection: "row", backgroundColor: "#FFFFFF", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24, alignItems: "center" },
  simulateButtonText: { fontSize: 16, fontWeight: "600", color: "#1E1B4B" },
  readyCancelButton: { borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", borderRadius: 12, paddingVertical: 16, marginHorizontal: 24, marginBottom: 32, alignItems: "center" },
  readyCancelText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  processingTitle: { fontSize: 24, fontWeight: "700", color: "#FFFFFF", marginTop: 24 },
  processingSubtitle: { fontSize: 14, color: "#A78BFA", marginTop: 8 },
  successContent: { paddingHorizontal: 24, paddingBottom: 32, alignItems: "center", paddingTop: 64 },
  successCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#10B981", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  successTitle: { fontSize: 28, fontWeight: "700", color: "#1A1A2E", marginBottom: 8 },
  successSubtitle: { fontSize: 14, color: "#6B7280", marginBottom: 32 },
  successCard: { backgroundColor: "#F8F9FA", borderRadius: 16, padding: 24, width: "100%", marginBottom: 32 },
  successAmountLabel: { fontSize: 14, color: "#6B7280", marginBottom: 8 },
  successAmount: { fontSize: 36, fontWeight: "700", color: "#10B981", marginBottom: 16 },
  successDivider: { height: 1, backgroundColor: "#E5E7EB", marginBottom: 16 },
  successDetailRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  successDetailLabel: { fontSize: 14, color: "#6B7280" },
  successDetailValue: { fontSize: 14, fontWeight: "500", color: "#1A1A2E" },
  homeBtn: { backgroundColor: "#7C3AED", borderRadius: 12, paddingVertical: 16, alignItems: "center", width: "100%", marginBottom: 12 },
  homeBtnText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
});
