import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function NotFound() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconRow}>
          <Ionicons name="alert-circle" size={32} color="#EF4444" />
          <Text style={styles.title}>404 Page Not Found</Text>
        </View>
        <Text style={styles.message}>The page you're looking for doesn't exist.</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)")} style={styles.button}>
          <Ionicons name="home" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.buttonText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA", alignItems: "center", justifyContent: "center", padding: 24 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 24, borderWidth: 1, borderColor: "#E5E7EB", width: "100%", maxWidth: 400 },
  iconRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "700", color: "#1A1A2E" },
  message: { fontSize: 14, color: "#6B7280", marginBottom: 24 },
  button: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#7C3AED", borderRadius: 12, paddingVertical: 14 },
  buttonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
});
