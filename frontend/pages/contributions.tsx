import { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Modal, Share } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "../hooks/use-toast";
import { apiRequest, queryClient } from "../lib/queryClient";
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

function CreateGroupModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/contributions", data);
      return response.json();
    },
    onSuccess: (group: any) => {
      toast({ title: "Group created!", description: `Share code: ${group.shareCode}` });
      queryClient.invalidateQueries({ queryKey: ["/api/contributions"] });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create group", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("");
    setTargetAmount("");
  };

  const handleCreate = () => {
    if (!title || !category) {
      toast({ title: "Error", description: "Please fill in required fields", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      title,
      description: description || null,
      category,
      targetAmount: targetAmount ? targetAmount : null,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#1A1A2E" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>New Contribution Group</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, gap: 16 }}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Memorial Fund for John"
              placeholderTextColor="#6B7280"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryOption, category === cat.id && styles.categoryOptionActive]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Ionicons name={cat.icon} size={16} color={category === cat.id ? "#7C3AED" : "#6B7280"} />
                  <Text style={[styles.categoryOptionText, category === cat.id && { color: "#7C3AED" }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: "top" }]}
              placeholder="Tell people what this contribution is for..."
              placeholderTextColor="#6B7280"
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Target Amount (optional)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="Leave empty for no target"
              placeholderTextColor="#6B7280"
              value={targetAmount}
              onChangeText={setTargetAmount}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, createMutation.isPending && styles.disabledButton]}
            onPress={handleCreate}
            disabled={createMutation.isPending}
          >
            <Text style={styles.primaryButtonText}>
              {createMutation.isPending ? "Creating..." : "Create Group"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

function ShareModal({ group, visible, onClose }: { group: ContributionGroup; visible: boolean; onClose: () => void }) {
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

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.shareModalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#1A1A2E" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Share "{group.title}"</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={{ padding: 24, gap: 12 }}>
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
        </View>
      </View>
    </Modal>
  );
}

function GroupCard({ group }: { group: ContributionGroup }) {
  const router = useRouter();
  const [shareVisible, setShareVisible] = useState(false);
  const categoryInfo = categories.find((c) => c.id === group.category) || categories[5];

  const progress = group.targetAmount
    ? (parseFloat(group.currentAmount) / parseFloat(group.targetAmount)) * 100
    : 0;

  return (
    <>
      <TouchableOpacity
        style={styles.groupCard}
        onPress={() => router.push(`/(screens)/contribution-detail?id=${group.id}` as any)}
      >
        <View style={[styles.groupColorBar, { backgroundColor: categoryInfo.color }]} />
        <View style={styles.groupCardContent}>
          <View style={styles.groupCardRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.categorySmallBadge}>
                <Ionicons name={categoryInfo.icon} size={14} color="#6B7280" />
                <Text style={styles.categorySmallText}>{categoryInfo.label}</Text>
              </View>
              <Text style={styles.groupTitle} numberOfLines={1}>{group.title}</Text>
              <Text style={styles.groupAmount}>${group.currentAmount}</Text>
              {group.targetAmount && (
                <View style={{ marginTop: 8 }}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
                  </View>
                  <Text style={styles.progressText}>
                    {Math.round(progress)}% of ${group.targetAmount} goal
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.shareSmallButton}
              onPress={(e) => {
                e.stopPropagation?.();
                setShareVisible(true);
              }}
            >
              <Ionicons name="share-social" size={16} color="#7C3AED" />
              <Text style={styles.shareSmallText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
      <ShareModal group={group} visible={shareVisible} onClose={() => setShareVisible(false)} />
    </>
  );
}

export default function Contributions() {
  const router = useRouter();
  const [createVisible, setCreateVisible] = useState(false);

  const { data: groups, isLoading } = useQuery<ContributionGroup[]>({
    queryKey: ["/api/contributions"],
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contributions</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.section}>
        <View style={styles.heroSection}>
          <View style={styles.heroCircle}>
            <Ionicons name="hand-left" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.mutedText}>Create and manage contribution groups</Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={() => setCreateVisible(true)}>
          <Ionicons name="add" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.primaryButtonText}>Create Contribution Group</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Your Groups</Text>

        {isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.mutedText}>Loading...</Text>
          </View>
        ) : groups?.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people" size={48} color="rgba(107,114,128,0.3)" />
            <Text style={styles.mutedText}>No contribution groups yet</Text>
            <Text style={styles.mutedSmall}>Create one to start collecting</Text>
          </View>
        ) : (
          groups?.map((group) => <GroupCard key={group.id} group={group} />)
        )}
      </View>

      <CreateGroupModal visible={createVisible} onClose={() => setCreateVisible(false)} />
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  section: {
    paddingHorizontal: 24,
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: 16,
  },
  heroCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  mutedText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  mutedSmall: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  groupCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F8F9FA",
    overflow: "hidden",
    marginBottom: 12,
  },
  groupColorBar: {
    height: 4,
  },
  groupCardContent: {
    padding: 16,
  },
  groupCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  categorySmallBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  categorySmallText: {
    fontSize: 12,
    color: "#6B7280",
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  groupAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#7C3AED",
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#7C3AED",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  shareSmallButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignSelf: "flex-start",
  },
  shareSmallText: {
    fontSize: 12,
    color: "#7C3AED",
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  formGroup: {
    marginBottom: 4,
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
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  categoryOptionActive: {
    borderColor: "#7C3AED",
    backgroundColor: "rgba(124,58,237,0.05)",
  },
  categoryOptionText: {
    fontSize: 13,
    color: "#6B7280",
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  shareModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
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
});
