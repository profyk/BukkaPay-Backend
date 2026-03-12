import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, Switch, ActivityIndicator, StyleSheet, Alert, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getCurrentUser, logout, setCurrentUser,
  isBiometricAvailable, isBiometricLoginEnabled,
  enableBiometricLogin, disableBiometricLogin, getBiometricType,
} from "../lib/auth";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { useDarkMode } from "../lib/useDarkMode";
import * as Clipboard from "expo-clipboard";

const languages = [
  { code: "en-US", name: "English (US)", flag: "US" },
  { code: "en-GB", name: "English (UK)", flag: "GB" },
  { code: "es", name: "Spanish", flag: "ES" },
  { code: "fr", name: "French", flag: "FR" },
  { code: "de", name: "German", flag: "DE" },
  { code: "pt", name: "Portuguese", flag: "PT" },
  { code: "zh", name: "Chinese", flag: "CN" },
  { code: "ja", name: "Japanese", flag: "JP" },
  { code: "ko", name: "Korean", flag: "KR" },
  { code: "ar", name: "Arabic", flag: "SA" },
  { code: "hi", name: "Hindi", flag: "IN" },
  { code: "sw", name: "Swahili", flag: "KE" },
];

const avatarOptions = [
  { id: "blue-user", color: "#3B82F6" },
  { id: "green-user", color: "#22C55E" },
  { id: "purple-user", color: "#A855F7" },
  { id: "orange-user", color: "#F97316" },
  { id: "pink-user", color: "#EC4899" },
  { id: "cyan-user", color: "#06B6D4" },
  { id: "red-user", color: "#EF4444" },
  { id: "amber-user", color: "#F59E0B" },
  { id: "indigo-user", color: "#6366F1" },
  { id: "teal-user", color: "#14B8A6" },
  { id: "rose-user", color: "#F43F5E" },
  { id: "emerald-user", color: "#10B981" },
];

export default function Profile() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { darkMode, setDarkMode } = useDarkMode();
  const [user, setUser] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState("Biometric Login");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hideBalance, setHideBalance] = useState(false);
  const [quickPayEnabled, setQuickPayEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      const u = await getCurrentUser();
      if (u) {
        setUser(u);
      } else {
        router.replace("/(auth)/login");
      }
      const lang = await AsyncStorage.getItem("app_language");
      if (lang) setSelectedLanguage(lang);
      const notif = await AsyncStorage.getItem("notifications_enabled");
      if (notif === "false") setNotificationsEnabled(false);
      const hide = await AsyncStorage.getItem("hide_balance");
      if (hide === "true") setHideBalance(true);
      const qp = await AsyncStorage.getItem("quick_pay");
      if (qp === "true") setQuickPayEnabled(true);

      const bioAvailable = await isBiometricAvailable();
      setBiometricSupported(bioAvailable);
      if (bioAvailable) {
        const type = await getBiometricType();
        setBiometricLabel(type === "Face ID" ? "Face ID Login" : type === "Fingerprint" ? "Fingerprint Login" : "Biometric Login");
        const bioEnabled = await isBiometricLoginEnabled();
        setBiometricEnabled(bioEnabled);
      }
    })();
  }, []);

  const { data: cards } = useQuery<any[]>({ queryKey: ["/api/cards"], enabled: !!user });
  const { data: transactions } = useQuery<any[]>({ queryKey: ["/api/transactions"], enabled: !!user });
  const { data: loyalty } = useQuery<any>({ queryKey: ["/api/loyalty"], enabled: !!user });

  const totalBalance = cards?.reduce((sum: number, card: any) => sum + parseFloat(card.balance || "0"), 0) || 0;
  const transactionCount = transactions?.length || 0;
  const loyaltyPoints = loyalty?.totalPoints || user?.loyaltyPoints || 0;

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name?: string; phone?: string }) => {
      const res = await apiRequest("PATCH", "/api/auth/profile", data);
      return res.json();
    },
    onSuccess: async (updatedUser: any) => {
      await setCurrentUser(updatedUser);
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setShowEditModal(false);
      toast({ title: "Success", description: "Profile updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update profile", variant: "destructive" });
    },
  });

  const updateAvatarMutation = useMutation({
    mutationFn: async (avatar: string) => {
      const res = await apiRequest("PATCH", "/api/auth/profile", { avatar });
      return res.json();
    },
    onSuccess: async (updatedUser: any) => {
      await setCurrentUser(updatedUser);
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setShowAvatarModal(false);
      toast({ title: "Success", description: "Avatar updated!" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update avatar", variant: "destructive" });
    },
  });

  const openEditModal = () => {
    if (user) {
      setEditName(user.name || "");
      setEditPhone(user.phone || "");
      setShowEditModal(true);
    }
  };

  const handleSaveProfile = () => {
    if (!editName.trim()) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }
    updateProfileMutation.mutate({ name: editName.trim(), phone: editPhone.trim() || undefined });
  };

  const getAvatarColor = (avatarId: string | null | undefined) => {
    if (!avatarId) return null;
    return avatarOptions.find((a) => a.id === avatarId)?.color;
  };

  const handleLanguageSelect = async (code: string) => {
    setSelectedLanguage(code);
    await AsyncStorage.setItem("app_language", code);
    const lang = languages.find((l) => l.code === code);
    toast({ title: "Success", description: `Language changed to ${lang?.name || code}` });
    setShowLanguageModal(false);
  };

  const getCurrentLanguageName = () => {
    return languages.find((l) => l.code === selectedLanguage)?.name || "English (US)";
  };

  const copyWalletID = async () => {
    if (user?.walletId) {
      await Clipboard.setStringAsync(user.walletId);
      setCopied(true);
      toast({ title: "Copied", description: "Wallet ID copied!" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    if (enabled) {
      Alert.alert(
        "Enable Biometric Login",
        "This will allow you to sign in using your fingerprint or Face ID. You'll need to sign in with your password once to set it up.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Enable",
            onPress: async () => {
              setBiometricEnabled(true);
              await enableBiometricLogin(user.email, "");
              toast({ title: "Enabled", description: "Biometric login enabled. Sign in with your password next time to save credentials." });
            },
          },
        ]
      );
    } else {
      setBiometricEnabled(false);
      await disableBiometricLogin();
      toast({ title: "Disabled", description: "Biometric login disabled" });
    }
  };

  const handleNotificationsToggle = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    await AsyncStorage.setItem("notifications_enabled", String(enabled));
    toast({ title: enabled ? "Enabled" : "Disabled", description: enabled ? "Notifications enabled" : "Notifications disabled" });
  };

  const handleHideBalanceToggle = async (enabled: boolean) => {
    setHideBalance(enabled);
    await AsyncStorage.setItem("hide_balance", String(enabled));
  };

  const handleQuickPayToggle = async (enabled: boolean) => {
    setQuickPayEnabled(enabled);
    await AsyncStorage.setItem("quick_pay", String(enabled));
    toast({ title: enabled ? "Enabled" : "Disabled", description: enabled ? "Quick Pay enabled" : "Quick Pay disabled" });
  };

  const handleDarkModeToggle = async (enabled: boolean) => {
    await setDarkMode(enabled);
    toast({ title: enabled ? "Dark Mode On" : "Dark Mode Off", description: enabled ? "Switched to dark theme" : "Switched to light theme" });
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  const renderSettingRow = (icon: string, label: string, subtitle: string, value: boolean, onToggle: (v: boolean) => void, disabled?: boolean) => (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={20} color="#7C3AED" />
        <View>
          <Text style={styles.settingLabel}>{label}</Text>
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: "#E5E7EB", true: "#7C3AED" }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

  const renderNavRow = (icon: string, label: string, subtitle: string, onPress: () => void) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={20} color="#7C3AED" />
        <View>
          <Text style={styles.settingLabel}>{label}</Text>
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#6B7280" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
          <Ionicons name="create-outline" size={20} color="#1A1A2E" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.profileTop}>
          <View style={styles.profileInfo}>
            <TouchableOpacity
              style={[styles.avatarCircle, { backgroundColor: getAvatarColor(user.avatar) || "rgba(255,255,255,0.2)" }]}
              onPress={() => setShowAvatarModal(true)}
            >
              <Ionicons name="person" size={28} color="#FFFFFF" />
              <View style={styles.avatarEditBadge}>
                <Ionicons name="create" size={10} color="#6B7280" />
              </View>
            </TouchableOpacity>
            <View>
              <Text style={styles.profileName}>{user.name}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
              <Text style={styles.profileUsername}>@{user.username}</Text>
            </View>
          </View>
          {user.verified !== false && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>

        <View style={styles.walletIdBox}>
          <View>
            <Text style={styles.walletIdLabel}>Wallet ID</Text>
            <Text style={styles.walletIdText}>{user.walletId}</Text>
          </View>
          <TouchableOpacity style={styles.copyButton} onPress={copyWalletID}>
            <Ionicons name={copied ? "checkmark" : "copy-outline"} size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{hideBalance ? "****" : `$${totalBalance.toFixed(2)}`}</Text>
          <Text style={styles.statLabel}>Wallet Balance</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{transactionCount}</Text>
          <Text style={styles.statLabel}>Transactions</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: "#F59E0B" }]}>{loyaltyPoints}</Text>
          <Text style={styles.statLabel}>Loyalty Points</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>WALLET SETTINGS</Text>
      <View style={styles.settingsCard}>
        {renderSettingRow("finger-print", biometricLabel, biometricSupported ? "Use fingerprint or Face ID to sign in" : "Not available on this device", biometricEnabled, handleBiometricToggle, !biometricSupported)}
        <View style={styles.divider} />
        {renderSettingRow(hideBalance ? "eye-off" : "eye", "Hide Balance", "Hide your wallet balance", hideBalance, handleHideBalanceToggle)}
        <View style={styles.divider} />
        {renderSettingRow("phone-portrait", "Quick Pay", "Enable NFC tap to pay", quickPayEnabled, handleQuickPayToggle)}
      </View>

      <Text style={styles.sectionLabel}>APPEARANCE</Text>
      <View style={styles.settingsCard}>
        {renderSettingRow(darkMode ? "moon" : "sunny", "Dark Mode", "Switch between light and dark theme", darkMode, handleDarkModeToggle)}
      </View>

      <Text style={styles.sectionLabel}>SECURITY & NOTIFICATIONS</Text>
      <View style={styles.settingsCard}>
        {renderSettingRow("notifications", "Push Notifications", "Transaction alerts & updates", notificationsEnabled, handleNotificationsToggle)}
        <View style={styles.divider} />
        {renderNavRow("shield-checkmark", "Security Settings", "PIN, 2FA & transaction limits", () => router.push("/(screens)/security-settings"))}
        <View style={styles.divider} />
        {renderNavRow("lock-closed", "Change PIN", "Update your wallet PIN", () => router.push("/(screens)/security-settings"))}
      </View>

      <Text style={styles.sectionLabel}>MERCHANT</Text>
      <View style={styles.settingsCard}>
        {renderNavRow("storefront", "Merchant Dashboard", "Manage your businesses", () => router.push("/(screens)/merchant-dashboard"))}
        <View style={styles.divider} />
        {renderNavRow("add-circle", "Become a Merchant", "Create a merchant account", () => router.push("/(screens)/become-merchant"))}
      </View>

      <Text style={styles.sectionLabel}>ACCOUNT</Text>
      <View style={styles.settingsCard}>
        {renderNavRow("qr-code", "My BKP Code", "View your unique payment QR code", () => router.push("/(screens)/my-id"))}
        <View style={styles.divider} />
        {renderNavRow("globe", "Language & Region", getCurrentLanguageName(), () => setShowLanguageModal(true))}
        <View style={styles.divider} />
        {renderNavRow("information-circle", "About BukkaPay", "Learn about our mission and services", () => router.push("/(screens)/about" as any))}
      </View>

      <View style={styles.loyaltyBanner}>
        <Ionicons name="flash" size={24} color="#F59E0B" />
        <View style={{ flex: 1 }}>
          <Text style={styles.loyaltyTitle}>
            {loyalty?.tier === "gold" ? "Gold Member" : loyalty?.tier === "silver" ? "Silver Member" : "Bronze Member"}
          </Text>
          <Text style={styles.loyaltySubtitle}>Exclusive rewards & higher limits</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#6B7280" />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <Modal visible={showEditModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowEditModal(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#1A1A2E" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalField}>
              <View style={styles.modalLabelRow}>
                <Ionicons name="person-outline" size={16} color="#6B7280" />
                <Text style={styles.modalLabel}>Full Name</Text>
              </View>
              <TextInput
                style={styles.modalInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.modalField}>
              <View style={styles.modalLabelRow}>
                <Ionicons name="call-outline" size={16} color="#6B7280" />
                <Text style={styles.modalLabel}>Phone Number</Text>
              </View>
              <TextInput
                style={styles.modalInput}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Enter your phone number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, updateProfileMutation.isPending && styles.disabledButton]}
              onPress={handleSaveProfile}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowEditModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showLanguageModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowLanguageModal(false)}>
          <View style={[styles.modalSheet, { maxHeight: "70%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Language & Region</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={24} color="#1A1A2E" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={styles.languageItem}
                  onPress={() => handleLanguageSelect(lang.code)}
                >
                  <View style={styles.languageItemLeft}>
                    <Text style={styles.languageFlag}>{lang.flag}</Text>
                    <Text style={styles.languageName}>{lang.name}</Text>
                  </View>
                  {selectedLanguage === lang.code && (
                    <Ionicons name="checkmark" size={20} color="#7C3AED" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showAvatarModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAvatarModal(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Avatar</Text>
              <TouchableOpacity onPress={() => setShowAvatarModal(false)}>
                <Ionicons name="close" size={24} color="#1A1A2E" />
              </TouchableOpacity>
            </View>
            <Text style={styles.avatarDescription}>Select a color for your profile avatar</Text>
            <View style={styles.avatarGrid}>
              {avatarOptions.map((avatar) => (
                <TouchableOpacity
                  key={avatar.id}
                  style={[
                    styles.avatarOption,
                    { backgroundColor: avatar.color },
                    user.avatar === avatar.id && styles.avatarSelected,
                  ]}
                  onPress={() => updateAvatarMutation.mutate(avatar.id)}
                  disabled={updateAvatarMutation.isPending}
                >
                  <Ionicons name="person" size={28} color="#FFFFFF" />
                  {user.avatar === avatar.id && (
                    <View style={styles.avatarCheckmark}>
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            {updateAvatarMutation.isPending && (
              <ActivityIndicator size="small" color="#7C3AED" style={{ marginTop: 16 }} />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
  },
  profileCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: "#2563EB",
    borderRadius: 16,
    padding: 24,
  },
  profileTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  profileEmail: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  profileUsername: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  walletIdBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  walletIdLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 2,
  },
  walletIdText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "monospace",
  },
  copyButton: {
    padding: 8,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 32,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  statLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  settingsCard: {
    marginHorizontal: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 24,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1A1A2E",
  },
  settingSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 16,
  },
  loyaltyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 24,
    padding: 16,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    borderRadius: 12,
    marginBottom: 24,
  },
  loyaltyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  loyaltySubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 24,
    padding: 16,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 12,
    marginBottom: 32,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  modalField: {
    marginBottom: 16,
  },
  modalLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1A1A2E",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1A1A2E",
  },
  saveButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modalCancelButton: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1A1A2E",
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  languageItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  languageFlag: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  languageName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1A1A2E",
  },
  avatarDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  avatarOption: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSelected: {
    borderWidth: 4,
    borderColor: "#7C3AED",
  },
  avatarCheckmark: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
});
