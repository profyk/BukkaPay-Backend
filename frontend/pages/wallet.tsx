import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import PremiumCard from "../components/PremiumCard";
import AddCardDialog from "../components/AddCardDialog";
import { fetchCards } from "../lib/api";
import { mapCardFromAPI } from "../lib/mappers";
import { getCurrentUser } from "../lib/auth";

const cardColors: Array<"blue" | "gold" | "black" | "purple"> = ["blue", "gold", "black", "purple"];

export default function Wallet() {
  const [userName, setUserName] = useState("Card Holder");

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      if (user) setUserName(user.name);
    })();
  }, []);

  const { data: cards, isLoading } = useQuery({
    queryKey: ["cards"],
    queryFn: fetchCards,
  });

  const mappedCards = cards?.map(mapCardFromAPI) || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cards</Text>
        <Text style={styles.headerSubtitle}>Manage your budgeting cards</Text>
      </View>

      {isLoading && [1, 2, 3].map(i => (
        <View key={i} style={styles.skeleton} />
      ))}

      {mappedCards.map((card: any, index: number) => (
        <View key={card.id} style={styles.cardContainer}>
          <PremiumCard
            cardNumber={card.cardNumber}
            holderName={userName}
            balance={card.balance}
            currency={card.currency}
            color={cardColors[index % cardColors.length]}
          />
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{card.title} Budget</Text>
            <Text style={styles.cardSpent}>
              Spent <Text style={styles.cardSpentBold}>$340.00</Text> / $1000
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(index + 1) * 20}%` }]} />
          </View>
        </View>
      ))}

      {!isLoading && mappedCards.length === 0 && (
        <Text style={styles.emptyText}>No cards yet. Add your first card!</Text>
      )}

      <AddCardDialog />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  header: {
    paddingTop: 48,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  skeleton: {
    height: 192,
    borderRadius: 16,
    backgroundColor: "#F8F9FA",
    marginBottom: 24,
  },
  cardContainer: {
    marginBottom: 24,
  },
  cardInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    marginTop: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1A1A2E",
  },
  cardSpent: {
    fontSize: 12,
    color: "#6B7280",
  },
  cardSpentBold: {
    color: "#1A1A2E",
    fontWeight: "600",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#F8F9FA",
    borderRadius: 4,
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#7C3AED",
    borderRadius: 4,
  },
  emptyText: {
    textAlign: "center",
    paddingVertical: 48,
    color: "#6B7280",
    fontSize: 14,
  },
});
