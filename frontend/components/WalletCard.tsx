import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const logoImage = require("../assets/logo.png");

interface WalletCardProps {
  title: string;
  balance: number;
  currency: string;
  cardNumber: string;
  color: string;
  icon: string;
}

export default function WalletCard({ title, balance, currency, cardNumber, color, icon }: WalletCardProps) {
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    const loadPreference = async () => {
      const stored = await AsyncStorage.getItem("showWalletBalance");
      if (stored !== null) {
        setShowBalance(stored === "true");
      }
    };
    loadPreference();
  }, []);

  const toggleBalance = async () => {
    const newValue = !showBalance;
    setShowBalance(newValue);
    await AsyncStorage.setItem("showWalletBalance", String(newValue));
  };

  return (
    <View style={styles.card}>
      <Image source={logoImage} style={styles.bgLogo} />

      <View style={styles.contentContainer}>
        <View style={styles.topRow}>
          <View style={styles.titleRow}>
            <Image source={logoImage} style={styles.cardLogo} />
            <View>
              <Text style={styles.titleText}>{title}</Text>
              <Text style={styles.subtitleText}>BukkaPay</Text>
            </View>
          </View>
          <Text style={styles.visaText}>VISA</Text>
        </View>

        <View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <TouchableOpacity onPress={toggleBalance} style={styles.eyeButton}>
              <Ionicons
                name={showBalance ? "eye-outline" : "eye-off-outline"}
                size={16}
                color="rgba(255,255,255,0.8)"
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceAmount}>
            {showBalance
              ? `${currency}${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
              : `${currency}${"•".repeat(8)}`}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.cardNumber}>{cardNumber}</Text>
          <Text style={styles.expiry}>12/28</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 22,
    aspectRatio: 1.58,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#001A72",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    backgroundColor: "#001A72",
  },
  bgLogo: {
    position: "absolute",
    width: 200,
    height: 200,
    right: -40,
    bottom: -40,
    opacity: 0.06,
    borderRadius: 40,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "space-between",
    zIndex: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardLogo: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  titleText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
  subtitleText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 1,
  },
  visaText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 18,
    fontStyle: "italic",
    opacity: 0.8,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "500",
  },
  eyeButton: {
    padding: 4,
    borderRadius: 8,
  },
  balanceAmount: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardNumber: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontFamily: "monospace",
    letterSpacing: 2,
  },
  expiry: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
  },
});
