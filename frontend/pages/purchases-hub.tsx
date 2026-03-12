import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

const categories = [
  { id: "all", label: "All", icon: "filter-outline" as keyof typeof Ionicons.glyphMap },
  { id: "airtime", label: "Airtime", icon: "call-outline" as keyof typeof Ionicons.glyphMap },
  { id: "electricity", label: "Electricity", icon: "flash-outline" as keyof typeof Ionicons.glyphMap },
  { id: "ticket", label: "Tickets", icon: "ticket-outline" as keyof typeof Ionicons.glyphMap },
  { id: "hotel", label: "Travel", icon: "business-outline" as keyof typeof Ionicons.glyphMap },
  { id: "rental", label: "Rentals", icon: "home-outline" as keyof typeof Ionicons.glyphMap },
  { id: "marketplace", label: "Marketplace", icon: "bag-outline" as keyof typeof Ionicons.glyphMap },
  { id: "contribution", label: "Contributions", icon: "heart-outline" as keyof typeof Ionicons.glyphMap },
  { id: "transfer", label: "Transfers", icon: "swap-horizontal-outline" as keyof typeof Ionicons.glyphMap },
];

const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  airtime: "call-outline",
  electricity: "flash-outline",
  ticket: "ticket-outline",
  hotel: "business-outline",
  rental: "home-outline",
  marketplace: "bag-outline",
  contribution: "heart-outline",
  transfer: "swap-horizontal-outline",
};

const categoryColors: Record<string, string> = {
  airtime: "#3B82F6",
  electricity: "#EAB308",
  ticket: "#A855F7",
  hotel: "#06B6D4",
  rental: "#22C55E",
  marketplace: "#F97316",
  contribution: "#EC4899",
  transfer: "#6366F1",
};

const statusColors: Record<string, { bg: string; text: string }> = {
  success: { bg: "#D1FAE5", text: "#047857" },
  pending: { bg: "#FEF3C7", text: "#B45309" },
  failed: { bg: "#FEE2E2", text: "#B91C1C" },
  refunded: { bg: "#F3F4F6", text: "#374151" },
};

export default function PurchasesHub() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const queryUrl = activeCategory !== "all"
    ? `/api/transactions?category=${activeCategory}`
    : "/api/transactions";

  const { data: transactions = [], isLoading, refetch, isRefetching } = useQuery<any[]>({
    queryKey: [queryUrl],
  });

  const filteredTransactions = transactions.filter((t: any) =>
    t.merchantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTransactionClick = (id: string) => {
    router.push(`/purchase-detail?id=${id}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Purchases Hub</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.refreshButton} disabled={isRefetching}>
          <Ionicons name="refresh-outline" size={20} color={isRefetching ? "#D1D5DB" : "#1A1A2E"} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search-outline" size={18} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            placeholder="Search transactions..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setActiveCategory(cat.id)}
                style={[styles.filterChip, isActive ? styles.filterChipActive : styles.filterChipInactive]}
              >
                <Ionicons name={cat.icon} size={16} color={isActive ? "#FFFFFF" : "#1A1A2E"} />
                <Text style={[styles.filterChipText, isActive ? styles.filterChipTextActive : styles.filterChipTextInactive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={styles.listContainer} contentContainerStyle={{ paddingBottom: 32 }}>
        {isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#6B7280" />
            <Text style={styles.emptyStateText}>Loading transactions...</Text>
          </View>
        ) : filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bag-outline" size={48} color="#6B7280" />
            <Text style={styles.emptyStateText}>
              {searchQuery
                ? "No transactions match your search"
                : activeCategory !== "all"
                ? `No ${activeCategory} transactions yet`
                : "No transactions yet"}
            </Text>
            <Text style={styles.emptyStateSubText}>Your purchases will appear here</Text>
          </View>
        ) : (
          <View style={styles.transactionList}>
            {filteredTransactions.map((transaction: any) => {
              const iconName = categoryIcons[transaction.category] || "bag-outline";
              const iconBg = categoryColors[transaction.category] || "#6B7280";
              const sColors = statusColors[transaction.status] || statusColors.success;

              return (
                <TouchableOpacity
                  key={transaction.id}
                  onPress={() => handleTransactionClick(transaction.id)}
                  style={styles.transactionCard}
                >
                  <View style={styles.transactionRow}>
                    <View style={[styles.transactionIcon, { backgroundColor: iconBg }]}>
                      <Ionicons name={iconName} size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.transactionInfo}>
                      <View style={styles.transactionTopRow}>
                        <Text style={styles.merchantName} numberOfLines={1}>{transaction.merchantName}</Text>
                        <Text style={styles.amountText}>
                          {transaction.currency}{Number(transaction.amount).toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.transactionBottomRow}>
                        <View style={[styles.statusBadge, { backgroundColor: sColors.bg }]}>
                          <Text style={[styles.statusText, { color: sColors.text }]}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </Text>
                        </View>
                        <Text style={styles.dateText}>
                          {format(new Date(transaction.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingTop: 48, paddingBottom: 16 },
  backButton: { padding: 8, borderRadius: 20 },
  headerTitle: { flex: 1, textAlign: "center", fontWeight: "700", fontSize: 18, color: "#1A1A2E" },
  refreshButton: { padding: 8, borderRadius: 20 },
  searchContainer: { paddingHorizontal: 24, paddingVertical: 8 },
  searchInputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8F9FA", borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", paddingHorizontal: 16 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: "#1A1A2E" },
  filterContainer: { paddingHorizontal: 24, paddingBottom: 16 },
  filterScroll: { gap: 8 },
  filterChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  filterChipActive: { backgroundColor: "#7C3AED" },
  filterChipInactive: { backgroundColor: "#F8F9FA" },
  filterChipText: { fontSize: 13, fontWeight: "500" },
  filterChipTextActive: { color: "#FFFFFF" },
  filterChipTextInactive: { color: "#1A1A2E" },
  listContainer: { flex: 1, paddingHorizontal: 24 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 48 },
  emptyStateText: { color: "#6B7280", textAlign: "center", marginTop: 16 },
  emptyStateSubText: { color: "#6B7280", fontSize: 13, marginTop: 8 },
  transactionList: { gap: 12 },
  transactionCard: { backgroundColor: "#F8F9FA", borderRadius: 12, padding: 16 },
  transactionRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  transactionIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  transactionInfo: { flex: 1, minWidth: 0 },
  transactionTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  merchantName: { fontWeight: "600", fontSize: 15, color: "#1A1A2E", flex: 1 },
  amountText: { fontWeight: "700", fontSize: 17, color: "#1A1A2E" },
  transactionBottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "600" },
  dateText: { fontSize: 11, color: "#6B7280" },
});
