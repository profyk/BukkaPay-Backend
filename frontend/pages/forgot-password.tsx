import { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, Image, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useToast } from "../hooks/use-toast";
import { API_BASE } from "../lib/config";

const logoImage = require("../assets/logo.png");

export default function ForgotPassword() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetLink, setResetLink] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async () => {
    if (!email) {
      toast({ title: "Error", description: "Please enter your email", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(API_BASE + "/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send reset email");
      }

      setSent(true);
      if (data.resetLink) {
        setResetLink(data.resetLink);
      }
      toast({ title: "Success", description: "Password reset instructions sent!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.logoRow}>
          <Image source={logoImage} style={styles.logoImage} />
        </View>

        {!sent ? (
          <>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>Enter your email and we'll send you instructions to reset your password</Text>

            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail" size={20} color="#6B7280" style={{ marginRight: 10 }} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#6B7280"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.textInput}
              />
            </View>

            <TouchableOpacity onPress={handleSubmit} disabled={loading} style={[styles.submitButton, loading && { opacity: 0.6 }]}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.sentContainer}>
            <View style={styles.successCircle}>
              <Ionicons name="checkmark-circle" size={32} color="#10B981" />
            </View>
            <Text style={styles.sentTitle}>Check Your Email</Text>
            <Text style={styles.sentSubtitle}>
              We've sent password reset instructions to{" "}
              <Text style={{ fontWeight: "700" }}>{email}</Text>
            </Text>

            {resetLink ? (
              <View style={styles.demoBox}>
                <Text style={styles.demoLabel}>Demo Mode: Tap below to reset your password</Text>
                <TouchableOpacity onPress={() => router.push(("/(screens)/reset-password?token=" + resetLink.split("token=")[1]) as any)}>
                  <Text style={styles.demoLink}>Reset Password Now</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <TouchableOpacity onPress={() => { setSent(false); setEmail(""); setResetLink(""); }} style={styles.outlineButton}>
              <Text style={styles.outlineButtonText}>Try Different Email</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity onPress={() => router.push("/(screens)/login" as any)} style={styles.backToLogin}>
          <Ionicons name="arrow-back" size={16} color="#6B7280" style={{ marginRight: 8 }} />
          <Text style={styles.backToLoginText}>Back to Login</Text>
        </TouchableOpacity>
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
  inputRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 24 },
  textInput: { flex: 1, fontSize: 16, color: "#1A1A2E" },
  submitButton: { backgroundColor: "#7C3AED", borderRadius: 12, paddingVertical: 16, alignItems: "center" },
  submitButtonText: { fontSize: 18, fontWeight: "600", color: "#FFFFFF" },
  sentContainer: { alignItems: "center" },
  successCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(16,185,129,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  sentTitle: { fontSize: 24, fontWeight: "700", color: "#1A1A2E", marginBottom: 8 },
  sentSubtitle: { fontSize: 14, color: "#6B7280", textAlign: "center", marginBottom: 24 },
  demoBox: { backgroundColor: "#F8F9FA", borderRadius: 12, padding: 16, marginBottom: 24, width: "100%" },
  demoLabel: { fontSize: 12, color: "#6B7280", marginBottom: 8, textAlign: "center" },
  demoLink: { fontSize: 14, fontWeight: "500", color: "#7C3AED", textAlign: "center" },
  outlineButton: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingVertical: 14, alignItems: "center", width: "100%" },
  outlineButtonText: { fontSize: 16, fontWeight: "600", color: "#1A1A2E" },
  backToLogin: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 24 },
  backToLoginText: { fontSize: 14, color: "#6B7280" },
  brandRow: { marginTop: 32, alignItems: "center" },
  brandName: { fontSize: 24, fontWeight: "700", color: "#1A1A2E" },
  brandTagline: { fontSize: 14, color: "#6B7280", fontStyle: "italic", marginTop: 4 },
});
