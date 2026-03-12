import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform, StatusBar, Dimensions, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import QRCode from "react-native-qrcode-svg";
import { getCurrentUser } from "../lib/auth";
import { useDarkMode } from "../lib/useDarkMode";

const logoImage = require("../assets/logo.png");
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const STATUSBAR_HEIGHT = Platform.OS === "android" ? (StatusBar.currentHeight || 24) : 44;
const SCAN_FRAME_SIZE = SCREEN_WIDTH * 0.65;

export default function Scan() {
  const router = useRouter();
  const { darkMode } = useDarkMode();
  const [mode, setMode] = useState<"scan" | "my-code">("scan");
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [walletId, setWalletId] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      if (user) {
        setWalletId(user.walletId || "");
        setUserName(user.name || "");
      }
    })();
  }, []);

  useEffect(() => {
    if (mode === "my-code") setTorchOn(false);
  }, [mode]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    if (data.startsWith("bukkapay://pay/")) {
      const payId = data.replace("bukkapay://pay/", "");
      router.push(`/(screens)/qr-pay?walletId=${payId}` as any);
    } else if (data.startsWith("bukkapay://")) {
      const walletTarget = data.replace("bukkapay://", "");
      router.push(`/(screens)/qr-pay?walletId=${walletTarget}` as any);
    } else {
      Alert.alert(
        "QR Code Scanned",
        `Data: ${data}`,
        [
          { text: "Scan Again", onPress: () => setScanned(false) },
          { text: "OK" },
        ]
      );
    }

    setTimeout(() => setScanned(false), 3000);
  };

  const qrValue = walletId ? `bukkapay://pay/${walletId}` : "bukkapay://unknown";

  const renderScanMode = () => {
    if (!permission) {
      return (
        <View style={styles.fullPermission}>
          <Ionicons name="camera-outline" size={48} color="rgba(255,255,255,0.5)" />
          <Text style={styles.permissionText}>Loading camera...</Text>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.fullPermission}>
          <Ionicons name="camera-outline" size={64} color="rgba(255,255,255,0.5)" />
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionText}>
            BukkaPay needs camera access to scan QR codes for payments.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={StyleSheet.absoluteFill}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torchOn}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          autofocus="on"
          focusDistance={0}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />

        <View style={styles.overlayTop} />
        <View style={styles.overlayRow}>
          <View style={styles.overlaySide} />
          <View style={styles.scanWindow}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />

        {scanned && (
          <View style={styles.scannedBanner}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.scannedText}>Processing payment...</Text>
          </View>
        )}
      </View>
    );
  };

  const renderMyCode = () => {
    return (
      <View style={styles.myCodeCenter}>
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
              size={200}
              color="#001A72"
              backgroundColor="#FFFFFF"
              logo={logoImage}
              logoSize={40}
              logoBackgroundColor="#FFFFFF"
              logoBorderRadius={10}
              logoMargin={4}
              ecl="H"
              quietZone={8}
            />
          </View>

          <Text style={styles.walletName}>{userName}</Text>
          <View style={styles.walletIdRow}>
            <Text style={styles.walletIdLabel}>BKP</Text>
            <Text style={styles.walletIdText}>{walletId || "Not available"}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {mode === "scan" ? (
        <View style={StyleSheet.absoluteFill}>
          {renderScanMode()}

          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.push("/(tabs)")} style={styles.circleBtn}>
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.topTitle}>Scan QR Code</Text>
            <TouchableOpacity onPress={() => setTorchOn(!torchOn)} style={[styles.circleBtn, torchOn && styles.circleBtnActive]}>
              <Ionicons name={torchOn ? "flash" : "flash-outline"} size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.scanInstruction}>
            <Text style={styles.scanInstructionText}>Align the QR code within the frame</Text>
          </View>

          <View style={styles.bottomBar}>
            <TouchableOpacity onPress={() => setMode("scan")} style={styles.tabBtn}>
              <View style={[styles.tabIcon, styles.tabIconActive]}>
                <Ionicons name="scan" size={22} color="#FFFFFF" />
              </View>
              <Text style={[styles.tabLabel, styles.tabLabelActive]}>Scan</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMode("my-code")} style={styles.tabBtn}>
              <View style={styles.tabIcon}>
                <Ionicons name="qr-code-outline" size={22} color="rgba(255,255,255,0.6)" />
              </View>
              <Text style={styles.tabLabel}>My Code</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.myCodeScreen}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.push("/(tabs)")} style={styles.circleBtn}>
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.topTitle}>My QR Code</Text>
            <TouchableOpacity style={styles.circleBtn}>
              <Ionicons name="share-social-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {renderMyCode()}

          <Text style={styles.myCodeHint}>Show this code to receive payments</Text>

          <View style={styles.bottomBar}>
            <TouchableOpacity onPress={() => setMode("scan")} style={styles.tabBtn}>
              <View style={styles.tabIcon}>
                <Ionicons name="scan-outline" size={22} color="rgba(255,255,255,0.6)" />
              </View>
              <Text style={styles.tabLabel}>Scan</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMode("my-code")} style={styles.tabBtn}>
              <View style={[styles.tabIcon, styles.tabIconActive]}>
                <Ionicons name="qr-code" size={22} color="#FFFFFF" />
              </View>
              <Text style={[styles.tabLabel, styles.tabLabelActive]}>My Code</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const OVERLAY_COLOR = "rgba(0,0,0,0.55)";
const overlayTopHeight = (SCREEN_HEIGHT - SCAN_FRAME_SIZE) / 2 - 40;
const overlayBottomHeight = (SCREEN_HEIGHT - SCAN_FRAME_SIZE) / 2 + 40;
const overlaySideWidth = (SCREEN_WIDTH - SCAN_FRAME_SIZE) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  topBar: {
    position: "absolute",
    top: STATUSBAR_HEIGHT + 8,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  circleBtnActive: {
    backgroundColor: "#7C3AED",
  },
  topTitle: { fontSize: 17, fontWeight: "700", color: "#FFFFFF" },

  overlayTop: { width: "100%", height: overlayTopHeight, backgroundColor: OVERLAY_COLOR },
  overlayRow: { flexDirection: "row", height: SCAN_FRAME_SIZE },
  overlaySide: { width: overlaySideWidth, backgroundColor: OVERLAY_COLOR },
  scanWindow: { width: SCAN_FRAME_SIZE, height: SCAN_FRAME_SIZE },
  overlayBottom: { flex: 1, backgroundColor: OVERLAY_COLOR },

  corner: { position: "absolute", width: 28, height: 28 },
  cornerTL: { top: -1, left: -1, borderTopWidth: 4, borderLeftWidth: 4, borderColor: "#7C3AED", borderTopLeftRadius: 14 },
  cornerTR: { top: -1, right: -1, borderTopWidth: 4, borderRightWidth: 4, borderColor: "#7C3AED", borderTopRightRadius: 14 },
  cornerBL: { bottom: -1, left: -1, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: "#7C3AED", borderBottomLeftRadius: 14 },
  cornerBR: { bottom: -1, right: -1, borderBottomWidth: 4, borderRightWidth: 4, borderColor: "#7C3AED", borderBottomRightRadius: 14 },

  scanInstruction: {
    position: "absolute",
    bottom: 140,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  scanInstructionText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
  },

  scannedBanner: {
    position: "absolute",
    top: STATUSBAR_HEIGHT + 70,
    left: 40,
    right: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(16,185,129,0.2)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.4)",
    paddingVertical: 12,
    borderRadius: 14,
    zIndex: 20,
  },
  scannedText: { color: "#34D399", fontSize: 15, fontWeight: "600" },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 48,
    paddingBottom: Platform.OS === "ios" ? 36 : 28,
    paddingTop: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 10,
  },
  tabBtn: { alignItems: "center", gap: 6 },
  tabIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  tabIconActive: { backgroundColor: "#7C3AED" },
  tabLabel: { fontSize: 12, fontWeight: "500", color: "rgba(255,255,255,0.5)" },
  tabLabelActive: { color: "#FFFFFF" },

  fullPermission: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 40,
    backgroundColor: "#171717",
  },
  permissionTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF", textAlign: "center" },
  permissionText: { fontSize: 14, color: "rgba(255,255,255,0.7)", textAlign: "center", lineHeight: 20 },
  permissionButton: { backgroundColor: "#7C3AED", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginTop: 8 },
  permissionButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },

  myCodeScreen: { flex: 1, backgroundColor: "#001A72" },
  myCodeCenter: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  qrCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  qrBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
    alignSelf: "flex-start",
  },
  qrBrandLogo: { width: 36, height: 36, borderRadius: 10 },
  qrBrandName: { fontSize: 18, fontWeight: "800", color: "#001A72" },
  qrBrandTag: { fontSize: 11, color: "#6B7280", fontWeight: "500", marginTop: 1 },
  qrCodeWrap: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    marginBottom: 20,
  },
  walletName: { fontSize: 20, fontWeight: "700", color: "#1A1A2E", marginBottom: 6 },
  walletIdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F0F0FF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  walletIdLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#7C3AED",
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: "hidden",
  },
  walletIdText: { fontSize: 13, color: "#374151", fontWeight: "600", fontFamily: "monospace" },

  myCodeHint: {
    textAlign: "center",
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    marginBottom: 8,
  },
});
