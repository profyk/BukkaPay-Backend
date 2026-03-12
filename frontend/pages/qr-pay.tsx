import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "../hooks/use-toast";
import { transfer, fetchCards } from "../lib/api";

export default function QRPay() {
  const router = useRouter();
  const { toast } = useToast();
  const [stage, setStage] = useState<"scan" | "amount" | "confirm" | "success">("scan");
  const [amount, setAmount] = useState("0");
  const [selectedCard, setSelectedCard] = useState("");
  const [scannedData, setScannedData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showCardPicker, setShowCardPicker] = useState(false);

  const { data: cards = [] } = useQuery({
    queryKey: ["cards"],
    queryFn: fetchCards,
  });

  const handleSimulateScan = () => {
    const mockData = {
      userId: "demo-user-123",
      username: "demo_merchant",
      walletId: "WLT-DEMO-001",
    };
    setScannedData(mockData);
    setStage("amount");
    toast({ title: "QR Code Scanned!", description: `Found ${mockData.username}` });
  };

  const handleNumberClick = (num: string) => {
    if (amount === "0" && num !== ".") {
      setAmount(num);
    } else {
      if (num === "." && amount.includes(".")) return;
      setAmount(amount + num);
    }
  };

  const handleBackspace = () => {
    if (amount.length === 1) {
      setAmount("0");
    } else {
      setAmount(amount.slice(0, -1));
    }
  };

  const handleConfirm = async () => {
    if (!selectedCard) {
      toast({ title: "Select Card", description: "Please select a card to send from", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await transfer(selectedCard, scannedData.userId, amount);
      setStage("success");
      toast({ title: "Payment Sent", description: `$${amount} sent to ${scannedData.username}` });
      setTimeout(() => {
        router.push("/(tabs)");
      }, 2000);
    } catch (error: any) {
      toast({ title: "Transfer Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (stage === "scan") {
    return (
      <View style={styles.scanContainer}>
        <View style={styles.scanHeader}>
          <TouchableOpacity style={styles.scanBackButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.scanTitle}>Scan & Pay</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.scanContent}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            <View style={styles.scanPlaceholder}>
              <Ionicons name="qr-code" size={80} color="rgba(255,255,255,0.3)" />
              <Text style={styles.scanPlaceholderText}>Camera not available in this view</Text>
            </View>
          </View>

          <Text style={styles.scanInstructions}>Align QR code within the frame</Text>

          <TouchableOpacity style={styles.simulateButton} onPress={handleSimulateScan}>
            <Ionicons name="scan" size={20} color="#FFFFFF" />
            <Text style={styles.simulateButtonText}>Simulate QR Scan</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.flashButton}>
            <Ionicons name="flashlight-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (stage === "amount") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setStage("scan")}>
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Amount</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.recipientBox}>
          <Text style={styles.recipientLabel}>Sending to</Text>
          <Text style={styles.recipientName}>{scannedData?.username}</Text>
        </View>

        <View style={styles.amountDisplay}>
          <Text style={styles.amountDollar}>$</Text>
          <Text style={styles.amountValue}>{amount}</Text>
        </View>

        <View style={styles.numpad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <TouchableOpacity key={num} style={styles.numKey} onPress={() => handleNumberClick(num.toString())}>
              <Text style={styles.numKeyText}>{num}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.numKey} onPress={() => handleNumberClick(".")}>
            <Text style={styles.numKeyText}>.</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.numKey} onPress={() => handleNumberClick("0")}>
            <Text style={styles.numKeyText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.numKey} onPress={handleBackspace}>
            <Ionicons name="backspace-outline" size={24} color="#1A1A2E" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardPickerContainer}>
          <Text style={styles.cardPickerLabel}>From Card</Text>
          <TouchableOpacity style={styles.cardPickerButton} onPress={() => setShowCardPicker(!showCardPicker)}>
            <Text style={styles.cardPickerText}>
              {selectedCard ? cards.find((c: any) => c.id === selectedCard)?.title || "Selected" : "Select a card"}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>
          {showCardPicker && (
            <View style={styles.cardPickerDropdown}>
              {cards.map((card: any) => (
                <TouchableOpacity
                  key={card.id}
                  style={styles.cardPickerItem}
                  onPress={() => {
                    setSelectedCard(card.id);
                    setShowCardPicker(false);
                  }}
                >
                  <Text style={styles.cardPickerItemText}>{card.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.reviewButton} onPress={() => setStage("confirm")}>
          <Text style={styles.reviewButtonText}>Review Payment</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (stage === "confirm") {
    const selectedCardData = cards.find((c: any) => c.id === selectedCard);

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setStage("amount")}>
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirm Payment</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.confirmCard}>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>To</Text>
            <Text style={styles.confirmValue}>{scannedData?.username}</Text>
            <Text style={styles.confirmSub}>{scannedData?.walletId}</Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>From</Text>
            <Text style={styles.confirmValue}>{selectedCardData?.title}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Amount</Text>
            <Text style={styles.confirmAmount}>${amount}</Text>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          style={[styles.sendButton, loading && styles.disabledButton]}
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.sendButtonText}>Send Payment</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => setStage("amount")}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.centerContent]}>
      <View style={styles.successCircle}>
        <Ionicons name="checkmark" size={48} color="#FFFFFF" />
      </View>
      <Text style={styles.successTitle}>Payment Sent!</Text>
      <Text style={styles.successSubtitle}>Your payment has been completed</Text>

      <View style={styles.successCard}>
        <Text style={styles.successAmount}>${amount}</Text>
        <Text style={styles.successTo}>to {scannedData?.username}</Text>
      </View>

      <TouchableOpacity style={styles.homeButton} onPress={() => router.push("/(tabs)")}>
        <Text style={styles.homeButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  scanContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scanHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  scanBackButton: {
    padding: 12,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  scanTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  scanContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  scanFrame: {
    width: 280,
    height: 280,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  corner: {
    position: "absolute",
    width: 48,
    height: 48,
    borderColor: "#7C3AED",
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  scanPlaceholder: {
    alignItems: "center",
    gap: 12,
  },
  scanPlaceholderText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    textAlign: "center",
  },
  scanInstructions: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 32,
    marginBottom: 24,
  },
  simulateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#7C3AED",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 24,
  },
  simulateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  flashButton: {
    padding: 16,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  recipientBox: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  recipientLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  amountDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  amountDollar: {
    fontSize: 32,
    fontWeight: "700",
    color: "#6B7280",
    marginRight: 4,
  },
  amountValue: {
    fontSize: 56,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  numpad: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  numKey: {
    width: "31%",
    height: 56,
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    justifyContent: "center",
  },
  numKeyText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  cardPickerContainer: {
    marginBottom: 16,
  },
  cardPickerLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1A1A2E",
    marginBottom: 8,
  },
  cardPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#F8F9FA",
  },
  cardPickerText: {
    fontSize: 16,
    color: "#1A1A2E",
  },
  cardPickerDropdown: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  cardPickerItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  cardPickerItemText: {
    fontSize: 14,
    color: "#1A1A2E",
  },
  reviewButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  reviewButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 24,
    marginTop: 16,
  },
  confirmRow: {
    marginBottom: 16,
  },
  confirmLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  confirmValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  confirmSub: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 8,
  },
  confirmAmount: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  sendButton: {
    backgroundColor: "#059669",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 32,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 32,
  },
  successCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    alignItems: "center",
    marginBottom: 32,
  },
  successAmount: {
    fontSize: 36,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 4,
  },
  successTo: {
    fontSize: 14,
    color: "#6B7280",
  },
  homeButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    width: "100%",
  },
  homeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
