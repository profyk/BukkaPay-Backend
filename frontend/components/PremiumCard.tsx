import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";

interface PremiumCardProps {
  cardNumber: string;
  holderName: string;
  expiryDate?: string;
  balance: number;
  currency: string;
  color?: "blue" | "gold" | "black" | "purple";
  showBalanceToggle?: boolean;
}

const colorMap: Record<string, string> = {
  blue: "#1a3a6e",
  gold: "#8b6914",
  black: "#1a1a1a",
  purple: "#4a1a6e",
};

export default function PremiumCard({
  cardNumber,
  holderName,
  expiryDate = "12/28",
  balance,
  currency,
  color = "blue",
  showBalanceToggle = true,
}: PremiumCardProps) {
  const [showBalance, setShowBalance] = useState(true);

  const formatCardNumber = (num: string) => {
    const cleaned = num.replace(/\D/g, "").slice(0, 16);
    const padded = cleaned.padEnd(16, "0");
    return padded.match(/.{1,4}/g)?.join(" ") || "0000 0000 0000 0000";
  };

  const bgColor = colorMap[color] || "#1a3a6e";

  return (
    <View style={[styles.card, { backgroundColor: bgColor }]}>
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      <View style={styles.contentContainer}>
        <View style={styles.topRow}>
          <View style={styles.brandRow}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>B</Text>
            </View>
            <Text style={styles.brandName}>BukkaPay</Text>
          </View>
          <Ionicons name="wifi" size={20} color="rgba(255,255,255,0.7)" />
        </View>

        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <View style={styles.chipGrid}>
              {[...Array(9)].map((_, i) => (
                <View key={i} style={styles.chipCell} />
              ))}
            </View>
          </View>

          {showBalanceToggle && (
            <View style={styles.balancePill}>
              <Text style={styles.balancePillLabel}>Balance:</Text>
              <Text style={styles.balancePillValue}>
                {showBalance
                  ? `${currency}${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                  : `${currency}••••`}
              </Text>
              <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
                <Ionicons
                  name={showBalance ? "eye-outline" : "eye-off-outline"}
                  size={14}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={styles.cardNumberText}>{formatCardNumber(cardNumber)}</Text>

        <View style={styles.bottomRow}>
          <View>
            <Text style={styles.cardLabel}>Card Holder</Text>
            <Text style={styles.cardValue}>{holderName}</Text>
          </View>
          <View style={styles.centerAlign}>
            <Text style={styles.cardLabel}>Valid Thru</Text>
            <Text style={styles.cardValue}>{expiryDate}</Text>
          </View>
          <View style={styles.rightAlign}>
            <Text style={styles.visaText}>VISA</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    aspectRatio: 1.586,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  decorCircle1: {
    position: "absolute",
    top: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  decorCircle2: {
    position: "absolute",
    bottom: -50,
    left: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "space-between",
    padding: 20,
    zIndex: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 18,
  },
  brandName: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 18,
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  chip: {
    width: 48,
    height: 36,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#D4A843",
  },
  chipGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 3,
    gap: 1,
  },
  chipCell: {
    width: 12,
    height: 9,
    backgroundColor: "rgba(180,140,40,0.6)",
    borderRadius: 1,
  },
  balancePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: "auto",
  },
  balancePillLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
  },
  balancePillValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cardNumberText: {
    fontFamily: "monospace",
    fontSize: 18,
    letterSpacing: 3,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  centerAlign: {
    alignItems: "center",
  },
  rightAlign: {
    alignItems: "flex-end",
  },
  cardLabel: {
    fontSize: 9,
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  visaText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 22,
    fontStyle: "italic",
  },
});
