import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import WalletCard from "../components/WalletCard";
import TransactionList from "../components/TransactionList";
import ActionButtons from "../components/ActionButtons";
import AppBar from "../components/AppBar";
import { fetchCards, fetchTransactions } from "../lib/api";
import { mapCardFromAPI, mapTransactionFromAPI } from "../lib/mappers";
import { useToast } from "../hooks/use-toast";
import { getCurrentUser } from "../lib/auth";
import { CURRENCIES, CurrencyCode, getStoredCurrency, setStoredCurrency, convertAmount, getCurrency } from "../lib/currency";
import { API_BASE } from "../lib/config";
import { getAuthHeader } from "../lib/auth";

export default function Home() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [userName, setUserName] = useState("");
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>("USD");
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      if (user) {
        setUserName(user.name);
      }
      const stored = await getStoredCurrency();
      setDisplayCurrency(stored);
    })();
  }, []);

  const handleCurrencyChange = async (code: CurrencyCode) => {
    setDisplayCurrency(code);
    await setStoredCurrency(code);
    setShowCurrencyModal(false);
  };

  const currentCurrency = getCurrency(displayCurrency);

  const { data: cards, isLoading: cardsLoading } = useQuery({
    queryKey: ["cards"],
    queryFn: fetchCards,
  });

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ["transactions", 3],
    queryFn: () => fetchTransactions(3),
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const headers = await getAuthHeader();
      const res = await fetch(API_BASE + "/api/seed", { method: "POST", headers });
      if (!res.ok) throw new Error("Failed to seed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast({ title: "Success", description: "Sample data added!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add sample data", variant: "destructive" });
    },
  });

  const mainCard = cards && cards.length > 0 ? mapCardFromAPI(cards[0]) : null;
  const mappedTransactions = transactions?.map(mapTransactionFromAPI) || [];

  return (
    <View style={styles.outerContainer}>
      <AppBar />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
        <View style={styles.currencyRow}>
          <TouchableOpacity style={styles.currencyButton} onPress={() => setShowCurrencyModal(true)}>
            <Text style={styles.currencyText}>{currentCurrency.symbol} {currentCurrency.code}</Text>
            <Ionicons name="chevron-down" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {cardsLoading && <View style={styles.skeleton} />}
        {mainCard && (
          <WalletCard
            {...mainCard}
            balance={convertAmount(mainCard.balance, displayCurrency)}
            currency={currentCurrency.symbol}
          />
        )}
        {!cardsLoading && !mainCard && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No cards yet. Add sample data to get started!</Text>
            <TouchableOpacity
              style={[styles.seedButton, seedMutation.isPending && styles.disabledButton]}
              onPress={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
            >
              <Ionicons name="server-outline" size={18} color="#FFFFFF" />
              <Text style={styles.seedButtonText}>
                {seedMutation.isPending ? "Adding..." : "Add Sample Data"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <ActionButtons />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {txLoading && (
          <View>
            {[1, 2, 3].map(i => <View key={i} style={styles.txSkeleton} />)}
          </View>
        )}
        {!txLoading && mappedTransactions.length > 0 && <TransactionList transactions={mappedTransactions} />}
        {!txLoading && mappedTransactions.length === 0 && (
          <Text style={styles.noTransactions}>No transactions yet</Text>
        )}
      </View>

      <Modal visible={showCurrencyModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCurrencyModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Currency</Text>
            {CURRENCIES.map((currency) => (
              <TouchableOpacity
                key={currency.code}
                style={styles.currencyItem}
                onPress={() => handleCurrencyChange(currency.code)}
              >
                <Text style={styles.currencyItemSymbol}>{currency.symbol}</Text>
                <Text style={styles.currencyItemName}>{currency.name} ({currency.code})</Text>
                {displayCurrency === currency.code && (
                  <Ionicons name="checkmark" size={20} color="#7C3AED" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 32,
  },
  currencyRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  currencyButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  currencyText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1A1A2E",
  },
  skeleton: {
    height: 192,
    borderRadius: 16,
    backgroundColor: "#F8F9FA",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    color: "#6B7280",
    marginBottom: 16,
  },
  seedButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7C3AED",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  seedButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: "#7C3AED",
    fontWeight: "500",
  },
  txSkeleton: {
    height: 64,
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
    marginBottom: 8,
  },
  noTransactions: {
    textAlign: "center",
    paddingVertical: 32,
    color: "#6B7280",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "85%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 16,
  },
  currencyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  currencyItemSymbol: {
    fontWeight: "600",
    marginRight: 12,
    fontSize: 16,
    color: "#1A1A2E",
  },
  currencyItemName: {
    flex: 1,
    fontSize: 14,
    color: "#1A1A2E",
  },
});
