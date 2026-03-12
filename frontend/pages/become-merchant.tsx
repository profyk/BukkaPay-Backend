import { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";

const businessTypes = [
  { id: "sme", label: "SME / Registered business", icon: "business" as const },
  { id: "tuckshop", label: "Tuckshop / Food stall", icon: "storefront" as const },
  { id: "street_vendor", label: "Street vendor / Informal trader", icon: "bag-handle" as const },
  { id: "taxi", label: "Taxi / Transport", icon: "car" as const },
  { id: "service", label: "Service provider", icon: "briefcase" as const },
  { id: "online", label: "Online seller", icon: "cube" as const },
  { id: "property", label: "Property / Rent collection", icon: "home" as const },
  { id: "school", label: "School / Organisation", icon: "school" as const },
  { id: "other", label: "Other", icon: "storefront" as const },
];

const propertySubcategories = [
  { id: "student_accommodation", label: "Student Accommodation", icon: "school" as const },
  { id: "flats", label: "Flats / Apartments", icon: "business" as const },
  { id: "residential", label: "Residential Houses", icon: "home" as const },
  { id: "rooms", label: "Rooms / Backyard Rooms", icon: "people" as const },
  { id: "commercial", label: "Commercial Property", icon: "storefront" as const },
  { id: "guest_house", label: "Guest House / B&B", icon: "bed" as const },
  { id: "other_property", label: "Other Property Type", icon: "business" as const },
];

const benefits = [
  { icon: "qr-code" as const, title: "QR Code Payments", desc: "Customers scan to pay instantly" },
  { icon: "chatbubble" as const, title: "WhatsApp Payment Links", desc: "Share payment links easily" },
  { icon: "bar-chart" as const, title: "Transaction Tracking", desc: "See all payments in real-time" },
  { icon: "flash" as const, title: "Instant Settlement", desc: "Money goes straight to your wallet" },
];

const whoItsFor = [
  "SMEs & small businesses",
  "Tuckshops & food vendors",
  "Street vendors & informal traders",
  "Taxi operators",
  "Service providers",
  "Online sellers",
  "Landlords & property managers",
  "Schools & organisations",
];

export default function BecomeMerchant() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [step, setStep] = useState<"info" | "type" | "property_subcategory" | "details">("info");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedPropertySubcategory, setSelectedPropertySubcategory] = useState<string>("");
  const [businessName, setBusinessName] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");

  const createMerchant = useMutation({
    mutationFn: async (data: { businessName: string; businessType: string; businessCategory?: string }) => {
      return apiRequest("POST", "/api/merchants", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/merchants"] });
      toast({ title: "Success", description: "Merchant account created successfully!" });
      router.push("/(screens)/merchant-dashboard" as any);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to create merchant account" });
    },
  });

  const handleCreateMerchant = () => {
    if (!businessName.trim()) {
      toast({ title: "Error", description: "Please enter a business name" });
      return;
    }
    createMerchant.mutate({
      businessName: businessName.trim(),
      businessType: selectedType,
      businessCategory: businessCategory.trim() || undefined,
    });
  };

  const handleBack = () => {
    if (step === "info") router.back();
    else if (step === "type") setStep("info");
    else if (step === "property_subcategory") setStep("type");
    else if (selectedType === "property") setStep("property_subcategory");
    else setStep("type");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === "info" ? "Become a Merchant" : step === "type" ? "Business Type" : step === "property_subcategory" ? "Property Type" : "Business Details"}
        </Text>
      </View>

      {step === "info" && (
        <View style={styles.section}>
          <View style={styles.centerSection}>
            <View style={styles.iconContainer}>
              <Ionicons name="storefront" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.mainTitle}>Become a BukkaPay Merchant</Text>
            <Text style={styles.subtitle}>Accept payments using QR codes and payment links</Text>
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>BENEFITS</Text>
            <View style={styles.benefitsGrid}>
              {benefits.map((benefit) => (
                <View key={benefit.title} style={styles.benefitCard}>
                  <Ionicons name={benefit.icon} size={24} color="#7C3AED" />
                  <Text style={styles.benefitTitle}>{benefit.title}</Text>
                  <Text style={styles.benefitDesc}>{benefit.desc}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>WHO IT'S FOR</Text>
            <View style={styles.card}>
              {whoItsFor.map((item) => (
                <View key={item} style={styles.checkRow}>
                  <Ionicons name="checkmark" size={16} color="#10B981" />
                  <Text style={styles.checkText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>REQUIREMENTS</Text>
            <View style={styles.card}>
              <View style={styles.checkRow}>
                <Ionicons name="checkmark" size={16} color="#10B981" />
                <Text style={styles.checkText}>BukkaPay account</Text>
              </View>
              <View style={styles.checkRow}>
                <Ionicons name="checkmark" size={16} color="#10B981" />
                <Text style={styles.checkText}>Business name</Text>
              </View>
              <View style={styles.checkRow}>
                <Ionicons name="checkmark" size={16} color="#10B981" />
                <Text style={styles.checkText}>Phone number</Text>
              </View>
              <View style={[styles.noteRow, { borderTopWidth: 1, borderTopColor: "#E5E7EB", marginTop: 12, paddingTop: 8 }]}>
                <Text style={styles.noteText}>No paperwork required. Informal businesses are welcome.</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={() => setStep("type")}>
            <Text style={styles.primaryButtonText}>Create Merchant Account</Text>
          </TouchableOpacity>
          <Text style={styles.smallNote}>Takes less than 2 minutes</Text>
        </View>
      )}

      {step === "type" && (
        <View style={styles.section}>
          <Text style={styles.subtitle}>Select your business type</Text>
          {businessTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              onPress={() => {
                setSelectedType(type.id);
                if (type.id === "property") {
                  setStep("property_subcategory");
                } else {
                  setStep("details");
                }
              }}
              style={[
                styles.typeButton,
                selectedType === type.id && styles.typeButtonSelected,
              ]}
            >
              <Ionicons name={type.icon} size={24} color="#7C3AED" />
              <Text style={styles.typeLabel}>{type.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#6B7280" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {step === "property_subcategory" && (
        <View style={styles.section}>
          <Text style={styles.subtitle}>What type of property do you manage?</Text>
          {propertySubcategories.map((subcat) => (
            <TouchableOpacity
              key={subcat.id}
              onPress={() => {
                setSelectedPropertySubcategory(subcat.id);
                setBusinessCategory(subcat.label);
                setStep("details");
              }}
              style={[
                styles.typeButton,
                selectedPropertySubcategory === subcat.id && styles.typeButtonSelected,
              ]}
            >
              <Ionicons name={subcat.icon} size={24} color="#7C3AED" />
              <Text style={styles.typeLabel}>{subcat.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#6B7280" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {step === "details" && (
        <View style={styles.section}>
          <Text style={styles.subtitle}>Enter your business details</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Business Name *</Text>
            <TextInput
              style={styles.input}
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="e.g. Mama's Tuckshop"
              placeholderTextColor="#6B7280"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Category (Optional)</Text>
            <TextInput
              style={styles.input}
              value={businessCategory}
              onChangeText={setBusinessCategory}
              placeholder="e.g. Food, Transport, Services"
              placeholderTextColor="#6B7280"
            />
          </View>

          <View style={styles.successBox}>
            <Text style={styles.successTitle}>What you'll get:</Text>
            <Text style={styles.successItem}>• Unique QR code for your business</Text>
            <Text style={styles.successItem}>• Shareable payment link</Text>
            <Text style={styles.successItem}>• Dedicated merchant wallet</Text>
            <Text style={styles.successItem}>• Real-time transaction history</Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, (createMerchant.isPending || !businessName.trim()) && styles.disabledButton]}
            onPress={handleCreateMerchant}
            disabled={createMerchant.isPending || !businessName.trim()}
          >
            {createMerchant.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Create My Business</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
    gap: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  section: {
    paddingHorizontal: 24,
  },
  centerSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
  },
  sectionBlock: {
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  sectionLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 12,
  },
  benefitsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  benefitCard: {
    width: "47%",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
  },
  benefitTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A2E",
    marginTop: 8,
  },
  benefitDesc: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  card: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  checkText: {
    fontSize: 14,
    color: "#1A1A2E",
  },
  noteRow: {},
  noteText: {
    fontSize: 12,
    color: "#6B7280",
  },
  primaryButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 24,
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.5,
  },
  smallNote: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
  },
  typeButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F8F9FA",
    marginBottom: 8,
    gap: 12,
  },
  typeButtonSelected: {
    borderColor: "#7C3AED",
    backgroundColor: "rgba(124, 58, 237, 0.05)",
  },
  typeLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#1A1A2E",
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1A1A2E",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#1A1A2E",
    backgroundColor: "#FFFFFF",
  },
  successBox: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
    marginBottom: 8,
  },
  successItem: {
    fontSize: 12,
    color: "rgba(5, 150, 105, 0.8)",
    marginBottom: 4,
  },
});
