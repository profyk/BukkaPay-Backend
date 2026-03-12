import { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, Image, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useToast } from "../hooks/use-toast";
import { API_BASE } from "../lib/config";

const logoImage = require("../assets/logo.png");

export default function ResetPassword() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const token = params.token as string;

  const handleSubmit = async () => {
    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }

    if (!password || !confirmPassword) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(API_BASE + "/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccess(true);
      toast({ title: "Success", description: "Your password has been reset!" });
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.errorCircle}>
            <Ionicons name="close-circle" size={32} color="#EF4444" />
          </View>
          <Text style={styles.title}>Invalid Link</Text>
          <Text style={styles.subtitle}>This password reset link is invalid or has expired.</Text>
          <TouchableOpacity onPress={() => router.push("/(screens)/forgot-password" as any)} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Request New Link</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.logoRow}>
          <Image source={logoImage} style={styles.logoImage} />
        </View>

        {!success ? (
          <>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Enter your new password below</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.inputLabel}>New Password</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed" size={20} color="#6B7280" style={{ marginRight: 10 }} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="Enter new password"
                placeholderTextColor="#6B7280"
                style={styles.textInput}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed" size={20} color="#6B7280" style={{ marginRight: 10 }} />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor="#6B7280"
                style={styles.textInput}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleSubmit} disabled={loading} style={[styles.primaryButton, loading && { opacity: 0.6 }]}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.successContainer}>
            <View style={styles.successCircle}>
              <Ionicons name="checkmark-circle" size={32} color="#10B981" />
            </View>
            <Text style={styles.successTitle}>Password Reset!</Text>
            <Text style={styles.successSubtitle}>Your password has been successfully reset. You can now log in with your new password.</Text>
            <TouchableOpacity onPress={() => router.push("/(screens)/login" as any)} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.brandRow}>
        <Text style={styles.brandName}>BukkaPay</Text>
        <Text style={styles.brandTagline}>The Pulse of African Finance</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA", alignItems: "center", justifyContent: "center", padding: 24 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 32, borderWidth: 1, borderColor: "#E5E7EB", width: "100%", maxWidth: 400, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 4 },
  logoRow: { alignItems: "center", marginBottom: 24 },
  logoImage: { width: 56, height: 56, borderRadius: 16 },
  title: { fontSize: 24, fontWeight: "700", color: "#1A1A2E", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#6B7280", textAlign: "center", marginBottom: 32 },
  inputLabel: { fontSize: 14, fontWeight: "500", color: "#1A1A2E", marginBottom: 8 },
  inputRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 16 },
  textInput: { flex: 1, fontSize: 16, color: "#1A1A2E" },
  primaryButton: { backgroundColor: "#7C3AED", borderRadius: 12, paddingVertical: 16, alignItems: "center", width: "100%" },
  primaryButtonText: { fontSize: 18, fontWeight: "600", color: "#FFFFFF" },
  errorBox: { backgroundColor: "rgba(239,68,68,0.1)", borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { fontSize: 14, color: "#EF4444" },
  errorCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(239,68,68,0.1)", alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 16 },
  successContainer: { alignItems: "center" },
  successCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(16,185,129,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: "700", color: "#1A1A2E", marginBottom: 8 },
  successSubtitle: { fontSize: 14, color: "#6B7280", textAlign: "center", marginBottom: 24 },
  brandRow: { marginTop: 32, alignItems: "center" },
  brandName: { fontSize: 24, fontWeight: "700", color: "#1A1A2E" },
  brandTagline: { fontSize: 14, color: "#6B7280", fontStyle: "italic", marginTop: 4 },
});
