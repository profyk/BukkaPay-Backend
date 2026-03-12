import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, Switch, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useToast } from "../hooks/use-toast";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SecuritySettings() {
  const router = useRouter();
  const { toast } = useToast();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [transactionPinEnabled, setTransactionPinEnabled] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [transactionLimit, setTransactionLimit] = useState("1000");
  const [dailyLimit, setDailyLimit] = useState("5000");
  const [showPinModal, setShowPinModal] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);

  useEffect(() => {
    (async () => {
      const tfa = await AsyncStorage.getItem("2fa_enabled");
      const tpe = await AsyncStorage.getItem("transaction_pin_enabled");
      const la = await AsyncStorage.getItem("login_alerts");
      const tl = await AsyncStorage.getItem("transaction_limit");
      const dl = await AsyncStorage.getItem("daily_limit");
      if (tfa !== null) setTwoFactorEnabled(tfa === "true");
      if (tpe !== null) setTransactionPinEnabled(tpe !== "false");
      if (la !== null) setLoginAlerts(la !== "false");
      if (tl) setTransactionLimit(tl);
      if (dl) setDailyLimit(dl);
    })();
  }, []);

  const handle2FAToggle = async (enabled: boolean) => {
    setTwoFactorEnabled(enabled);
    await AsyncStorage.setItem("2fa_enabled", String(enabled));
    toast({ title: enabled ? "2FA Enabled" : "2FA Disabled" });
  };

  const handleTransactionPinToggle = async (enabled: boolean) => {
    setTransactionPinEnabled(enabled);
    await AsyncStorage.setItem("transaction_pin_enabled", String(enabled));
    toast({ title: enabled ? "Transaction PIN enabled" : "Transaction PIN disabled" });
  };

  const handleLoginAlertsToggle = async (enabled: boolean) => {
    setLoginAlerts(enabled);
    await AsyncStorage.setItem("login_alerts", String(enabled));
    toast({ title: enabled ? "Login alerts enabled" : "Login alerts disabled" });
  };

  const handleSaveLimits = async () => {
    await AsyncStorage.setItem("transaction_limit", transactionLimit);
    await AsyncStorage.setItem("daily_limit", dailyLimit);
    toast({ title: "Success", description: "Transaction limits updated" });
  };

  const handleChangePin = async () => {
    const storedPin = (await AsyncStorage.getItem("wallet_pin")) || "1234";

    if (currentPin !== storedPin) {
      toast({ title: "Error", description: "Current PIN is incorrect", variant: "destructive" });
      return;
    }
    if (newPin.length < 4) {
      toast({ title: "Error", description: "PIN must be at least 4 digits", variant: "destructive" });
      return;
    }
    if (newPin !== confirmPin) {
      toast({ title: "Error", description: "PINs do not match", variant: "destructive" });
      return;
    }
    await AsyncStorage.setItem("wallet_pin", newPin);
    setShowPinModal(false);
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    toast({ title: "Success", description: "PIN updated successfully" });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/profile" as any)} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.statusBox}>
        <Ionicons name="checkmark-circle" size={20} color="#10B981" style={{ marginTop: 2 }} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.statusTitle}>Account Secured</Text>
          <Text style={styles.statusSubtitle}>Your account has security measures enabled</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>AUTHENTICATION</Text>
      <View style={styles.settingsCard}>
        <View style={styles.settingRow}>
          <Ionicons name="phone-portrait" size={20} color="#7C3AED" />
          <View style={styles.settingTextBox}>
            <Text style={styles.settingTitle}>Two-Factor Authentication</Text>
            <Text style={styles.settingDesc}>Extra security for your account</Text>
          </View>
          <Switch
            value={twoFactorEnabled}
            onValueChange={handle2FAToggle}
            trackColor={{ false: "#E5E7EB", true: "#7C3AED" }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.settingDivider} />

        <View style={styles.settingRow}>
          <Ionicons name="finger-print" size={20} color="#7C3AED" />
          <View style={styles.settingTextBox}>
            <Text style={styles.settingTitle}>Transaction PIN</Text>
            <Text style={styles.settingDesc}>Require PIN for all payments</Text>
          </View>
          <Switch
            value={transactionPinEnabled}
            onValueChange={handleTransactionPinToggle}
            trackColor={{ false: "#E5E7EB", true: "#7C3AED" }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.settingDivider} />

        <View style={styles.settingRow}>
          <Ionicons name="warning" size={20} color="#7C3AED" />
          <View style={styles.settingTextBox}>
            <Text style={styles.settingTitle}>Login Alerts</Text>
            <Text style={styles.settingDesc}>Get notified of new logins</Text>
          </View>
          <Switch
            value={loginAlerts}
            onValueChange={handleLoginAlertsToggle}
            trackColor={{ false: "#E5E7EB", true: "#7C3AED" }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.settingDivider} />

        <TouchableOpacity onPress={() => setShowPinModal(true)} style={styles.settingRow}>
          <Ionicons name="lock-closed" size={20} color="#7C3AED" />
          <View style={styles.settingTextBox}>
            <Text style={styles.settingTitle}>Change PIN</Text>
            <Text style={styles.settingDesc}>Update your wallet PIN</Text>
          </View>
          <Ionicons name="key" size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>TRANSACTION LIMITS</Text>
      <View style={styles.limitsCard}>
        <Text style={styles.limitLabel}>Single Transaction Limit</Text>
        <View style={styles.limitInputRow}>
          <Text style={styles.dollarSign}>$</Text>
          <TextInput
            value={transactionLimit}
            onChangeText={setTransactionLimit}
            keyboardType="numeric"
            placeholder="1000"
            placeholderTextColor="#6B7280"
            style={styles.limitInput}
          />
        </View>
        <Text style={styles.limitHint}>Maximum amount per transaction</Text>

        <Text style={[styles.limitLabel, { marginTop: 16 }]}>Daily Spending Limit</Text>
        <View style={styles.limitInputRow}>
          <Text style={styles.dollarSign}>$</Text>
          <TextInput
            value={dailyLimit}
            onChangeText={setDailyLimit}
            keyboardType="numeric"
            placeholder="5000"
            placeholderTextColor="#6B7280"
            style={styles.limitInput}
          />
        </View>
        <Text style={styles.limitHint}>Maximum daily spending</Text>

        <TouchableOpacity onPress={handleSaveLimits} style={styles.saveLimitsButton}>
          <Text style={styles.saveLimitsButtonText}>Save Limits</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>SECURITY TIPS</Text>
      <View style={styles.tipsBox}>
        <Ionicons name="shield" size={20} color="#D97706" style={{ marginTop: 2 }} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.tipsTitle}>Stay Safe</Text>
          <Text style={styles.tipItem}>Never share your PIN or password</Text>
          <Text style={styles.tipItem}>Enable two-factor authentication</Text>
          <Text style={styles.tipItem}>Review your transactions regularly</Text>
          <Text style={styles.tipItem}>Log out on shared devices</Text>
        </View>
      </View>

      <Modal visible={showPinModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change PIN</Text>
              <TouchableOpacity onPress={() => setShowPinModal(false)}>
                <Ionicons name="close" size={24} color="#1A1A2E" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Current PIN</Text>
            <View style={styles.pinInputRow}>
              <TextInput
                value={currentPin}
                onChangeText={setCurrentPin}
                secureTextEntry={!showCurrentPin}
                placeholder="Enter current PIN"
                placeholderTextColor="#6B7280"
                maxLength={6}
                style={styles.pinInput}
              />
              <TouchableOpacity onPress={() => setShowCurrentPin(!showCurrentPin)}>
                <Ionicons name={showCurrentPin ? "eye-off" : "eye"} size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>New PIN</Text>
            <View style={styles.pinInputRow}>
              <TextInput
                value={newPin}
                onChangeText={setNewPin}
                secureTextEntry={!showNewPin}
                placeholder="Enter new PIN"
                placeholderTextColor="#6B7280"
                maxLength={6}
                style={styles.pinInput}
              />
              <TouchableOpacity onPress={() => setShowNewPin(!showNewPin)}>
                <Ionicons name={showNewPin ? "eye-off" : "eye"} size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Confirm New PIN</Text>
            <TextInput
              value={confirmPin}
              onChangeText={setConfirmPin}
              secureTextEntry
              placeholder="Confirm new PIN"
              placeholderTextColor="#6B7280"
              maxLength={6}
              style={styles.modalInput}
            />

            <TouchableOpacity onPress={handleChangePin} style={styles.updatePinButton}>
              <Text style={styles.updatePinButtonText}>Update PIN</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingBottom: 100, paddingHorizontal: 24 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 48, paddingBottom: 16 },
  backButton: { padding: 8, borderRadius: 20 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#1A1A2E" },
  statusBox: { flexDirection: "row", backgroundColor: "rgba(16,185,129,0.1)", borderWidth: 1, borderColor: "rgba(16,185,129,0.3)", borderRadius: 12, padding: 16, marginBottom: 24 },
  statusTitle: { fontSize: 14, fontWeight: "600", color: "#10B981" },
  statusSubtitle: { fontSize: 12, color: "rgba(16,185,129,0.7)", marginTop: 2 },
  sectionLabel: { fontSize: 12, fontWeight: "500", color: "#6B7280", marginBottom: 12, letterSpacing: 0.5 },
  settingsCard: { backgroundColor: "#F8F9FA", borderRadius: 16, borderWidth: 1, borderColor: "#E5E7EB", marginBottom: 24, overflow: "hidden" },
  settingRow: { flexDirection: "row", alignItems: "center", padding: 16 },
  settingTextBox: { flex: 1, marginLeft: 12, marginRight: 12 },
  settingTitle: { fontSize: 14, fontWeight: "500", color: "#1A1A2E" },
  settingDesc: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  settingDivider: { height: 1, backgroundColor: "#E5E7EB" },
  limitsCard: { backgroundColor: "#F8F9FA", borderRadius: 16, borderWidth: 1, borderColor: "#E5E7EB", padding: 16, marginBottom: 24 },
  limitLabel: { fontSize: 14, fontWeight: "500", color: "#1A1A2E", marginBottom: 8 },
  limitInputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dollarSign: { fontSize: 16, color: "#6B7280" },
  limitInput: { flex: 1, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: "#1A1A2E", backgroundColor: "#FFFFFF" },
  limitHint: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  saveLimitsButton: { backgroundColor: "#7C3AED", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 16 },
  saveLimitsButtonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  tipsBox: { flexDirection: "row", backgroundColor: "rgba(217,119,6,0.1)", borderWidth: 1, borderColor: "rgba(217,119,6,0.3)", borderRadius: 12, padding: 16, marginBottom: 24 },
  tipsTitle: { fontSize: 14, fontWeight: "600", color: "#D97706", marginBottom: 8 },
  tipItem: { fontSize: 12, color: "rgba(217,119,6,0.8)", marginBottom: 4 },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
  modalLabel: { fontSize: 14, fontWeight: "500", color: "#1A1A2E", marginBottom: 8, marginTop: 16 },
  pinInputRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  pinInput: { flex: 1, fontSize: 16, color: "#1A1A2E" },
  modalInput: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: "#1A1A2E" },
  updatePinButton: { backgroundColor: "#7C3AED", borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 24 },
  updatePinButtonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
});
