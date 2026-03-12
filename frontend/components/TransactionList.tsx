import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet } from "react-native";

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  "arrow-up-right": "arrow-up-outline",
  "arrow-down-left": "arrow-down-outline",
  "shopping-cart": "cart-outline",
  "credit-card": "card-outline",
  phone: "call-outline",
  wifi: "wifi-outline",
  zap: "flash-outline",
  coffee: "cafe-outline",
  home: "home-outline",
  car: "car-outline",
  gift: "gift-outline",
  send: "send-outline",
  download: "download-outline",
};

const getIconName = (tx: any): keyof typeof Ionicons.glyphMap => {
  if (typeof tx.iconName === "string" && iconMap[tx.iconName]) {
    return iconMap[tx.iconName];
  }
  if (tx.type === "income") return "arrow-down-outline";
  return "arrow-up-outline";
};

export default function TransactionList({ transactions }: { transactions: any[] }) {
  return (
    <View style={styles.container}>
      {transactions.map((tx) => (
        <View key={tx.id} style={styles.transactionRow}>
          <View style={styles.leftSection}>
            <View style={[
              styles.iconCircle,
              tx.type === "income" && styles.iconCircleIncome,
            ]}>
              <Ionicons
                name={getIconName(tx)}
                size={20}
                color={tx.type === "income" ? "#10B981" : "#6B7280"}
              />
            </View>
            <View>
              <Text style={styles.txTitle}>{tx.title}</Text>
              <Text style={styles.txMeta}>
                {tx.date} {tx.category ? `• ${tx.category}` : ""}
              </Text>
            </View>
          </View>
          <Text style={[
            styles.txAmount,
            tx.type === "income" ? styles.txAmountIncome : styles.txAmountExpense,
          ]}>
            {tx.type === "income" ? "+" : ""}{tx.amount.toFixed(2)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleIncome: {
    backgroundColor: "rgba(16,185,129,0.1)",
  },
  txTitle: {
    fontWeight: "600",
    fontSize: 14,
    color: "#1A1A2E",
  },
  txMeta: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  txAmount: {
    fontWeight: "600",
    fontSize: 14,
  },
  txAmountIncome: {
    color: "#10B981",
  },
  txAmountExpense: {
    color: "#1A1A2E",
  },
});
