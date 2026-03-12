import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Share, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "../hooks/use-toast";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import type { ContributionGroup, Contribution } from "../../shared/schema";

const categories = [
  { id: "funeral", label: "Funeral", icon: "heart" as const, color: "#475569" },
  { id: "church", label: "Church", icon: "home" as const, color: "#7C3AED" },
  { id: "fundraising", label: "Fundraising", icon: "business" as const, color: "#059669" },
  { id: "celebration", label: "Celebration", icon: "happy" as const, color: "#D97706" },
  { id: "charity", label: "Charity", icon: "hand-left" as const, color: "#EC4899" },
  { id: "other", label: "Other", icon: "flag" as const, color: "#2563EB" },
];

function ShareSection({ group }: { group: ContributionGroup }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareUrl = `https://bukkapay.com/contribute/${group.shareCode}`;
  const shareText = `Help contribute to "${group.title}". Every amount counts! Click here to contribute: ${shareUrl}`;

  const copyLink = async () => {
    await Clipboard.setStringAsync(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Link copied!" });
  };

  const shareWhatsApp = () => {
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(shareText)}`);
  };

  const shareSMS = () => {
    Linking.openURL(`sms:?body=${encodeURIComponent(shareText)}`);
  };

  const shareNative = async () => {
    try {
      await Share.share({ message: shareText });
    } catch (e) {}
  };

  return (
    <View style={styles.shareSection}>
      <TouchableOpacity style={styles.primaryButton} onPress={shareNative}>
        <Ionicons name="share-social" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
        <Text style={styles.primaryButtonText}>Share Group</Text>
      </TouchableOpacity>

      <View style={styles.shareCodeBox}>
        <Text style={styles.shareCodeText}>{group.shareCode}</Text>
      </View>

      <TouchableOpacity style={styles.outlineButton} onPress={copyLink}>
        <Ionicons name={copied ? "checkmark" : "copy"} size={16} color="#1A1A2E" style={{ marginRight: 8 }} />
        <Text style={styles.outlineButtonText}>Copy Link</Text>
      </TouchableOpacity>

      <View style={styles.shareButtonRow}>
        <TouchableOpacity style={[styles.shareButton, { backgroundColor: "#16A34A" }]} onPress={shareWhatsApp}>
          <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.shareButtonText}>WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.shareButton, { backgroundColor: "#6B7280" }]} onPress={shareSMS}>
          <Ionicons name="chatbubble" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.shareButtonText}>SMS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ContributionDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = (params.id as string) || "";

  const { data, isLoading, error } = useQuery<{ group: ContributionGroup; contributions: Contribution[] }>({
    queryKey: ["/api/contributions", id],
    queryFn: async () => {
      const res = await fetch(`/api/contributions/${id}`);
      if (!res.ok) throw new Error("Group not found");
      return res.json();
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.mutedText}>Loading...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="people" size={48} color="#6B7280" />
        <Text style={styles.errorTitle}>Group Not Found</Text>
        <TouchableOpacity style={[styles.primaryButton, { marginTop: 16 }]} onPress={() => router.push("/(screens)/contributions" as any)}>
          <Text style={styles.primaryButtonText}>Back to Contributions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { group, contributions } = data;
  const categoryInfo = categories.find((c) => c.id === group.category) || categories[5];
  const progress = group.targetAmount
    ? (parseFloat(group.currentAmount) / parseFloat(group.targetAmount)) * 100
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={[styles.heroHeader, { backgroundColor: categoryInfo.color }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.heroBackButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.categoryBadge}>
          <Ionicons name={categoryInfo.icon} size={20} color="#FFFFFF" />
          <Text style={styles.categoryLabel}>{categoryInfo.label}</Text>
        </View>

        <Text style={styles.heroTitle}>{group.title}</Text>
        {group.description && <Text style={styles.heroDesc}>{group.description}</Text>}

        <Text style={styles.heroAmount}>${group.currentAmount}</Text>
        {group.targetAmount && (
          <>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
            </View>
            <Text style={styles.heroProgress}>
              {Math.round(progress)}% of ${group.targetAmount} goal
            </Text>
          </>
        )}
        <Text style={styles.heroProgress}>
          {contributions.length} contribution{contributions.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <View style={styles.section}>
        <ShareSection group={group} />

        <Text style={styles.sectionLabel}>All Contributions ({contributions.length})</Text>

        {contributions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="people" size={32} color="rgba(107,114,128,0.5)" />
            <Text style={styles.mutedText}>No contributions yet</Text>
            <Text style={styles.mutedSmall}>Share your group to start receiving contributions</Text>
          </View>
        ) : (
          contributions.map((c) => (
            <View key={c.id} style={styles.contributionCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.contributorName}>
                  {c.isAnonymous ? "Anonymous" : c.contributorName}
                </Text>
                {c.contributorPhone && !c.isAnonymous && (
                  <Text style={styles.mutedSmall}>{c.contributorPhone}</Text>
                )}
                {c.message && (
                  <Text style={styles.contributionMessage}>"{c.message}"</Text>
                )}
                <Text style={[styles.mutedSmall, { marginTop: 4 }]}>
                  {new Date(c.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.contributionAmount}>${c.amount}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    paddingBottom: 96,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  mutedText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
  },
  mutedSmall: {
    fontSize: 12,
    color: "#6B7280",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A2E",
    marginTop: 16,
    marginBottom: 8,
  },
  heroHeader: {
    padding: 24,
    paddingTop: 48,
  },
  heroBackButton: {
    padding: 8,
    borderRadius: 20,
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
  },
  heroProgress: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  shareSection: {
    gap: 12,
    marginBottom: 24,
  },
  shareCodeBox: {
    padding: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    alignItems: "center",
  },
  shareCodeText: {
    fontFamily: "monospace",
    fontSize: 14,
    color: "#1A1A2E",
  },
  shareButtonRow: {
    flexDirection: "row",
    gap: 8,
  },
  shareButton: {
    flex: 1,
    flexDirection: "row",
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  shareButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  outlineButton: {
    borderRadius: 12,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  outlineButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 24,
    alignItems: "center",
  },
  contributionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  contributorName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1A1A2E",
  },
  contributionMessage: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
    marginTop: 4,
  },
  contributionAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#7C3AED",
  },
});
