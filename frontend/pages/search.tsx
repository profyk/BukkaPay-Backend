import { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface SearchResult {
  id: string;
  type: "transaction" | "card" | "contact" | "feature" | "page";
  title: string;
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  route: string;
}

export default function Search() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const allItems: SearchResult[] = [
    { id: "tx-1", type: "transaction", title: "Payment to John Doe", description: "$50 sent - 2 hours ago", iconName: "card", iconColor: "#2563EB", route: "/(tabs)" },
    { id: "tx-2", type: "transaction", title: "Received from Alice Smith", description: "$100 received - 5 hours ago", iconName: "card", iconColor: "#059669", route: "/(tabs)" },
    { id: "card-1", type: "card", title: "Main Visa Card", description: "****4242 - $2,456.50 balance", iconName: "wallet", iconColor: "#7C3AED", route: "/(tabs)/wallet" },
    { id: "card-2", type: "card", title: "Savings Card", description: "****8765 - $5,200.00 balance", iconName: "wallet", iconColor: "#2563EB", route: "/(tabs)/wallet" },
    { id: "contact-1", type: "contact", title: "Alice Smith", description: "alice.smith@email.com - Frequent", iconName: "people", iconColor: "#EC4899", route: "/(screens)/scan-pay" },
    { id: "contact-2", type: "contact", title: "John Doe", description: "john.doe@email.com - 5 transfers", iconName: "people", iconColor: "#F97316", route: "/(screens)/scan-pay" },
    { id: "feature-1", type: "feature", title: "Send Money", description: "Send funds to BukkaPay, mobile wallet, or bank", iconName: "flash", iconColor: "#06B6D4", route: "/(screens)/scan-pay" },
    { id: "feature-2", type: "feature", title: "QR Code Scan", description: "Scan & pay using QR codes", iconName: "flash", iconColor: "#6366F1", route: "/(screens)/qr-pay" },
    { id: "feature-3", type: "feature", title: "Tap to Pay", description: "Make payments with tap functionality", iconName: "flash", iconColor: "#2563EB", route: "/(screens)/tap-pay" },
    { id: "feature-4", type: "feature", title: "Top Up", description: "Add funds to your wallet", iconName: "flash", iconColor: "#059669", route: "/(screens)/topup" },
    { id: "feature-5", type: "feature", title: "Marketplace", description: "Buy airtime, data, and services", iconName: "flash", iconColor: "#D97706", route: "/(screens)/buy" },
    { id: "feature-6", type: "feature", title: "Stokvel", description: "Group savings for families and communities", iconName: "flash", iconColor: "#7C3AED", route: "/(screens)/stokvel" },
    { id: "feature-7", type: "feature", title: "Loyalty Rewards", description: "Earn points and get exclusive rewards", iconName: "flash", iconColor: "#EC4899", route: "/(screens)/loyalty" },
    { id: "feature-8", type: "feature", title: "Spending Analytics", description: "Track your spending and budgets", iconName: "flash", iconColor: "#14B8A6", route: "/(screens)/analytics" },
    { id: "page-1", type: "page", title: "Wallet", description: "Manage your cards and accounts", iconName: "document-text", iconColor: "#64748B", route: "/(tabs)/wallet" },
    { id: "page-2", type: "page", title: "Transfer", description: "Card-to-card transfers", iconName: "document-text", iconColor: "#64748B", route: "/(tabs)/transfer" },
    { id: "page-3", type: "page", title: "Request Payment", description: "Request money from others", iconName: "document-text", iconColor: "#64748B", route: "/(screens)/request" },
  ];

  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return allItems.filter(
      (item) => item.title.toLowerCase().includes(lowerQuery) || item.description.toLowerCase().includes(lowerQuery)
    );
  }, [query]);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "transaction": return "Transaction";
      case "card": return "Card";
      case "contact": return "Contact";
      case "feature": return "Feature";
      case "page": return "Page";
      default: return type;
    }
  };

  const groupedResults = useMemo(() => {
    const grouped: { [key: string]: SearchResult[] } = {};
    filteredResults.forEach((result) => {
      if (!grouped[result.type]) grouped[result.type] = [];
      grouped[result.type].push(result);
    });
    return grouped;
  }, [filteredResults]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.push("/(tabs)")} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Search</Text>
        </View>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#6B7280" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search transactions, cards, features..."
            placeholderTextColor="#6B7280"
            value={query}
            onChangeText={setQuery}
            autoFocus
            style={styles.searchInput}
          />
        </View>
      </View>

      {query.trim() === "" ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="search" size={32} color="#6B7280" />
          </View>
          <Text style={styles.emptyTitle}>Start Searching</Text>
          <Text style={styles.emptySubtitle}>Search for transactions, cards, contacts, and features</Text>
        </View>
      ) : filteredResults.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Results Found</Text>
          <Text style={styles.emptySubtitle}>Try searching with different keywords</Text>
        </View>
      ) : (
        Object.entries(groupedResults).map(([type, results]) => (
          <View key={type} style={{ marginBottom: 24 }}>
            <Text style={styles.groupLabel}>{getTypeLabel(type)}</Text>
            {results.map((result) => (
              <TouchableOpacity
                key={result.id}
                onPress={() => router.push(result.route as any)}
                style={styles.resultCard}
              >
                <Ionicons name={result.iconName} size={20} color={result.iconColor} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.resultTitle}>{result.title}</Text>
                  <Text style={styles.resultDesc} numberOfLines={1}>{result.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingBottom: 100, paddingHorizontal: 24 },
  header: { paddingTop: 32, paddingBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  backButton: { padding: 8, borderRadius: 20 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8F9FA", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 },
  searchInput: { flex: 1, fontSize: 16, color: "#1A1A2E" },
  emptyState: { paddingVertical: 48, alignItems: "center" },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#F8F9FA", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#1A1A2E", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#6B7280", textAlign: "center" },
  groupLabel: { fontSize: 12, fontWeight: "700", color: "#6B7280", textTransform: "uppercase", marginBottom: 12 },
  resultCard: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 12, backgroundColor: "#F8F9FA", borderWidth: 1, borderColor: "#E5E7EB", marginBottom: 8 },
  resultTitle: { fontSize: 14, fontWeight: "600", color: "#1A1A2E" },
  resultDesc: { fontSize: 12, color: "#6B7280", marginTop: 2 },
});
