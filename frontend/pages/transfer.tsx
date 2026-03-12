import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, FlatList, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "../hooks/use-toast";
import { fetchCards } from "../lib/api";
import { mapCardFromAPI } from "../lib/mappers";

export default function Transfer() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<"select" | "amount" | "confirm" | "success">("select");
  const [amount, setAmount] = useState("0");
  const [fromCardId, setFromCardId] = useState("");
  const [toCardId, setToCardId] = useState("");
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);

  const { data: cards } = useQuery({
    queryKey: ["cards"],
    queryFn: fetchCards,
  });

  const mappedCards = cards?.map(mapCardFromAPI) || [];
  const fromCard = mappedCards.find((c: any) => c.id === fromCardId);
  const toCard = mappedCards.find((c: any) => c.id === toCardId);

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

  const handleProceed = () => {
    if (!fromCard || !toCard) {
      toast({ title: "Error", description: "Please select both cards", variant: "destructive" });
      return;
    }
    if (fromCardId === toCardId) {
      toast({ title: "Error", description: "Select different cards", variant: "destructive" });
      return;
    }
    setStep("amount");
  };

  const handleReview = () => {
    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      toast({ title: "Error", description: "Enter a valid amount", variant: "destructive" });
      return;
    }
    const fromBalance = parseFloat(fromCard?.balance || "0");
    if (transferAmount > fromBalance) {
      toast({ title: "Error", description: `Insufficient balance. Available: $${fromBalance}`, variant: "destructive" });
      return;
    }
    setStep("confirm");
  };

  const handleConfirm = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast({ title: "Success", description: "Transfer completed successfully!" });
      setStep("success");
      setTimeout(() => {
        setStep("select");
        setAmount("0");
        setFromCardId("");
        setToCardId("");
      }, 3000);
    } catch (error) {
      toast({ title: "Error", description: "Transfer failed", variant: "destructive" });
    }
  };

  const renderCardSelector = (label: string, selectedCard: any, showDropdown: boolean, setShowDropdown: (v: boolean) => void, setCardId: (id: string) => void) => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setShowDropdown(!showDropdown)}
      >
        {selectedCard ? (
          <View style={styles.selectedCardRow}>
            <View style={styles.cardDot}>
              <Ionicons name="card" size={16} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.cardName}>{selectedCard.title}</Text>
              <Text style={styles.cardBalance}>${selectedCard.balance}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.placeholderText}>Select card...</Text>
        )}
        <Ionicons name="chevron-down" size={20} color="#6B7280" />
      </TouchableOpacity>
      {showDropdown && (
        <View style={styles.dropdown}>
          {mappedCards.map((card: any) => (
            <TouchableOpacity
              key={card.id}
              style={styles.dropdownItem}
              onPress={() => {
                setCardId(card.id);
                setShowDropdown(false);
              }}
            >
              <View style={styles.cardDotSmall}>
                <Ionicons name="card" size={12} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dropdownCardName}>{card.title}</Text>
                <Text style={styles.dropdownCardBalance}>${card.balance}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  if (step === "select") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transfer Money</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.subtitle}>Choose cards to transfer between</Text>

        {renderCardSelector("FROM", fromCard, showFromDropdown, (v) => { setShowFromDropdown(v); setShowToDropdown(false); }, setFromCardId)}

        <View style={styles.arrowContainer}>
          <View style={styles.arrowCircle}>
            <Ionicons name="arrow-down" size={18} color="#7C3AED" />
          </View>
        </View>

        {renderCardSelector("TO", toCard, showToDropdown, (v) => { setShowToDropdown(v); setShowFromDropdown(false); }, setToCardId)}

        <TouchableOpacity
          style={[styles.primaryButton, (!fromCard || !toCard || fromCardId === toCardId) && styles.disabledButton]}
          onPress={handleProceed}
          disabled={!fromCard || !toCard || fromCardId === toCardId}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (step === "amount") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setStep("select")}>
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transfer Amount</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.transferPreview}>
          <Text style={styles.previewText}>{fromCard?.title}</Text>
          <Ionicons name="arrow-forward" size={16} color="#7C3AED" />
          <Text style={styles.previewText}>{toCard?.title}</Text>
        </View>

        <View style={styles.amountContainer}>
          <Text style={styles.amountDollar}>$</Text>
          <Text style={styles.amountValue}>{amount}</Text>
        </View>

        <View style={styles.quickAmounts}>
          <Text style={styles.quickAmountsLabel}>QUICK AMOUNTS</Text>
          <View style={styles.quickAmountsRow}>
            {["25", "50", "100", "250"].map((val) => (
              <TouchableOpacity key={val} style={styles.quickAmountBtn} onPress={() => setAmount(val)}>
                <Text style={styles.quickAmountText}>${val}</Text>
              </TouchableOpacity>
            ))}
          </View>
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

        <TouchableOpacity style={styles.primaryButton} onPress={handleReview}>
          <Text style={styles.primaryButtonText}>Review Transfer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === "confirm") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setStep("amount")}>
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirm Transfer</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.confirmCard}>
          <Text style={styles.confirmSubtitle}>Transfer Summary</Text>

          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>From</Text>
            <Text style={styles.confirmValue}>{fromCard?.title}</Text>
          </View>

          <View style={styles.confirmArrow}>
            <View style={styles.arrowCircle}>
              <Ionicons name="arrow-down" size={20} color="#7C3AED" />
            </View>
          </View>

          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>To</Text>
            <Text style={styles.confirmValue}>{toCard?.title}</Text>
          </View>

          <View style={styles.confirmDivider} />

          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Amount</Text>
            <Text style={styles.confirmAmount}>${amount}</Text>
          </View>

          <View style={styles.warningBox}>
            <Text style={styles.warningText}>This transfer will be completed immediately. Both cards will be updated.</Text>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity style={styles.successButton} onPress={handleConfirm}>
          <Text style={styles.primaryButtonText}>Complete Transfer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.outlineButton} onPress={() => setStep("amount")}>
          <Text style={styles.outlineButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.centerContent]}>
      <View style={styles.successCircle}>
        <Ionicons name="checkmark" size={48} color="#FFFFFF" />
      </View>
      <Text style={styles.successTitle}>Transfer Complete!</Text>
      <Text style={styles.successSubtitle}>Your money has been transferred</Text>

      <View style={styles.successCard}>
        <Text style={styles.successCardLabel}>Amount Transferred</Text>
        <Text style={styles.successAmount}>${amount}</Text>
        <View style={styles.confirmDivider} />
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>From</Text>
          <Text style={styles.confirmValue}>{fromCard?.title}</Text>
        </View>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>To</Text>
          <Text style={styles.confirmValue}>{toCard?.title}</Text>
        </View>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>Reference</Text>
          <Text style={styles.refText}>TRF-{Date.now().toString().slice(-8)}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/(tabs)")}>
        <Text style={styles.primaryButtonText}>Back to Home</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.outlineButton} onPress={() => { setStep("select"); setAmount("0"); setFromCardId(""); setToCardId(""); }}>
        <Text style={styles.outlineButtonText}>Make Another Transfer</Text>
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
  contentContainer: {
    paddingBottom: 40,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
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
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
  },
  selectorContainer: {
    marginBottom: 8,
    zIndex: 10,
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
  },
  selectorButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  selectedCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  cardDotSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  cardBalance: {
    fontSize: 12,
    color: "#6B7280",
  },
  placeholderText: {
    color: "#6B7280",
    fontSize: 14,
  },
  dropdown: {
    marginTop: 8,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  dropdownCardName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  dropdownCardBalance: {
    fontSize: 12,
    color: "#6B7280",
  },
  arrowContainer: {
    alignItems: "center",
    paddingVertical: 8,
  },
  arrowCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(124, 58, 237, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  disabledButton: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  transferPreview: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
    marginBottom: 16,
    gap: 8,
  },
  previewText: {
    fontSize: 14,
    color: "#1A1A2E",
  },
  amountContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    flexDirection: "row",
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
  quickAmounts: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  quickAmountsLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 12,
  },
  quickAmountsRow: {
    flexDirection: "row",
    gap: 8,
  },
  quickAmountBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  numpad: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
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
  confirmCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 24,
    marginTop: 16,
  },
  confirmSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  confirmRow: {
    marginBottom: 12,
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
  confirmArrow: {
    alignItems: "center",
    paddingVertical: 8,
  },
  confirmDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },
  confirmAmount: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  warningBox: {
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.2)",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  warningText: {
    fontSize: 12,
    color: "#2563EB",
  },
  successButton: {
    backgroundColor: "#059669",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
  },
  outlineButtonText: {
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
    marginBottom: 16,
  },
  successCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    marginVertical: 24,
  },
  successCardLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  successAmount: {
    fontSize: 36,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 16,
  },
  refText: {
    fontSize: 14,
    fontFamily: "monospace",
    color: "#1A1A2E",
  },
});
