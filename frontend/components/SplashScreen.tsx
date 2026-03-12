import { View, Text, ActivityIndicator, StyleSheet, Image } from "react-native";
import appIcon from "../assets/bukkapay-icon.png";

interface SplashScreenProps {
  isVisible: boolean;
  onComplete?: () => void;
}

export default function SplashScreen({ isVisible, onComplete }: SplashScreenProps) {
  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image source={appIcon} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>BukkaPay</Text>
        <Text style={styles.subtitle}>Smart Wallet, Smart Life</Text>
      </View>
      <View style={styles.loadingSection}>
        <ActivityIndicator size="small" color="#FFFFFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  content: {
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  loadingSection: {
    position: "absolute",
    bottom: 60,
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
});
