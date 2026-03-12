import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Platform, StyleSheet, Share, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getCurrentUser } from "../lib/auth";
import { useToast } from "../hooks/use-toast";
import * as Clipboard from "expo-clipboard";
import QRCode from "react-native-qrcode-svg";
import { Image } from "react-native";

const logoImage = require("../assets/logo.png");

export default function MyID() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    })();
  }, []);

  const walletId = user?.walletId || "";
  const qrValue = walletId ? `bukkapay://pay/${walletId}` : "bukkapay://invalid";

  const copyToClipboard = async () => {
    if (walletId) {
      try {
        await Clipboard.setStringAsync(walletId);
        toast({ title: "Copied", description: "Wallet ID copied to clipboard" });
      } catch {
        toast({ title: "Error", description: "Failed to copy", variant: "destructive" });
      }
    }
  };

  const shareWalletId = async () => {
    try {
      await Share.share({
        message: `Pay me on BukkaPay!\nWallet ID: ${walletId}\nName: ${user?.name}`,
      });
    } catch {
      await Clipboard.setStringAsync(walletId);
      toast({ title: "Copied", description: "Wallet ID copied to clipboard" });
    }
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My BKP Code</Text>
        <TouchableOpacity onPress={shareWalletId} style={styles.backButton}>
          <Ionicons name="share-social" size={22} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      <View style={styles.qrCard}>
        <View style={styles.qrBrandRow}>
          <Image source={logoImage} style={styles.qrBrandLogo} />
          <View>
            <Text style={styles.qrBrandName}>BukkaPay</Text>
            <Text style={styles.qrBrandTag}>Payment QR Code</Text>
          </View>
        </View>

        <View style={styles.qrCodeWrap}>
          <QRCode
            value={qrValue}
            size={220}
            color="#001A72"
            backgroundColor="#FFFFFF"
            logo={logoImage}
            logoSize={44}
            logoBackgroundColor="#FFFFFF"
            logoBorderRadius={10}
            logoMargin={4}
            ecl="H"
            quietZone={10}
          />
        </View>

        <Text style={styles.userName}>{user.name}</Text>
        <View style={styles.bkpBadge}>
          <Text style={styles.bkpLabel}>BKP</Text>
          <Text style={styles.bkpValue}>{walletId || "Not available"}</Text>
        </View>

        <Text style={styles.scanHint}>Scan to pay me instantly</Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={copyToClipboard}>
          <View style={styles.actionIconWrap}>
            <Ionicons name="copy" size={20} color="#7C3AED" />
          </View>
          <Text style={styles.actionLabel}>Copy ID</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={shareWalletId}>
          <View style={styles.actionIconWrap}>
            <Ionicons name="share-social" size={20} color="#7C3AED" />
          </View>
          <Text style={styles.actionLabel}>Share</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.detailsTitle}>Account Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Username</Text>
          <Text style={styles.detailValue}>@{user.username}</Text>
        </View>
        <View style={styles.detailDivider} />
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Display Name</Text>
          <Text style={styles.detailValue}>{user.name}</Text>
        </View>
        <View style={styles.detailDivider} />
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Email</Text>
          <Text style={styles.detailValue}>{user.email}</Text>
        </View>
        {user.phone && (
          <>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone</Text>
              <Text style={styles.detailValue}>{user.countryCode} {user.phone}</Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.tipBox}>
        <Ionicons name="bulb" size={18} color="#7C3AED" style={{ marginRight: 8, marginTop: 2 }} />
        <Text style={styles.tipText}>Share your BKP code with friends so they can pay you instantly. This code is unique to your account.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingBottom: 100, paddingHorizontal: 24 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  loadingText: { fontSize: 16, color: "#6B7280" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 48, paddingBottom: 16 },
  backButton: { padding: 8, borderRadius: 20 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },

  qrCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  qrBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
  },
  qrBrandLogo: { width: 36, height: 36, borderRadius: 8 },
  qrBrandName: { fontSize: 16, fontWeight: "700", color: "#001A72" },
  qrBrandTag: { fontSize: 11, color: "#6B7280" },
  qrCodeWrap: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#F0F0F0",
    marginBottom: 20,
  },
  userName: { fontSize: 18, fontWeight: "700", color: "#1A1A2E", marginBottom: 6 },
  bkpBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F0FF",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 6,
    marginBottom: 12,
  },
  bkpLabel: { fontSize: 12, fontWeight: "800", color: "#7C3AED" },
  bkpValue: { fontSize: 13, fontWeight: "600", color: "#1A1A2E", fontFamily: Platform.OS === "ios" ? "Courier" : "monospace" },
  scanHint: { fontSize: 13, color: "#9CA3AF" },

  actionsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  actionBtn: { flex: 1, alignItems: "center", backgroundColor: "#F8F9FA", borderRadius: 16, paddingVertical: 16, borderWidth: 1, borderColor: "#F0F0F0" },
  actionIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(124,58,237,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  actionLabel: { fontSize: 13, fontWeight: "600", color: "#1A1A2E" },

  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  detailsTitle: { fontSize: 15, fontWeight: "700", color: "#1A1A2E", marginBottom: 16 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
  detailLabel: { fontSize: 13, color: "#6B7280" },
  detailValue: { fontSize: 13, fontWeight: "600", color: "#1A1A2E" },
  detailDivider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 10 },

  tipBox: { flexDirection: "row", backgroundColor: "rgba(124,58,237,0.08)", borderWidth: 1, borderColor: "rgba(124,58,237,0.15)", borderRadius: 12, padding: 16, marginTop: 4 },
  tipText: { flex: 1, fontSize: 13, color: "#1A1A2E", lineHeight: 20 },
});
