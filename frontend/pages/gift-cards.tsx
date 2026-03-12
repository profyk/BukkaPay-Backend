import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, ActivityIndicator, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "../hooks/use-toast";
import { apiRequest, queryClient } from "../lib/queryClient";
import * as Clipboard from "expo-clipboard";

interface GiftCard {
  id: string;
  code: string;
  amount: string;
  recipientName: string;
  recipientEmail?: string;
  message?: string;
  design: string;
  status: string;
  expiresAt?: string;
}

const designs = [
  { id: "birthday", label: "Birthday", colors: ["#EC4899", "#9333EA"] },
  { id: "love", label: "Love", colors: ["#EF4444", "#EC4899"] },
  { id: "celebration", label: "Celebration", colors: ["#F59E0B", "#EA580C"] },
  { id: "thank-you", label: "Thank You", colors: ["#10B981", "#0D9488"] },
  { id: "holiday", label: "Holiday", colors: ["#3B82F6", "#6366F1"] },
  { id: "default", label: "Classic", colors: ["#334155", "#0F172A"] },
];

function GiftCardPreview({ amount, recipientName, message, design }: { amount: string; recipientName: string; message: string; design: string }) {
  const selectedDesign = designs.find(d => d.id === design) || designs[5];

  return (
    <View style={[styles.previewCard, { backgroundColor: selectedDesign.colors[0] }]}>
      <View style={styles.previewDecoCircle1} />
      <View style={styles.previewDecoCircle2} />
      <View style={styles.previewContent}>
        <View style={styles.previewHeader}>
          <Ionicons name="gift" size={24} color="#FFFFFF" />
          <Text style={styles.previewBrand}>BukkaPay Gift Card</Text>
        </View>
        <Text style={styles.previewAmount}>${amount || "0.00"}</Text>
        <Text style={styles.previewTo}>To: {recipientName || "Recipient"}</Text>
        {message ? <Text style={styles.previewMessage}>"{message}"</Text> : null}
      </View>
    </View>
  );
}

function GiftCardItem({ card, type }: { card: GiftCard; type: "sent" | "received" }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const selectedDesign = designs.find(d => d.id === card.design) || designs[5];

  const redeemMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/gift-cards/${card.id}/redeem`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Gift card redeemed!", description: `$${card.amount} added to your wallet.` });
      queryClient.invalidateQueries({ queryKey: ["/api/gift-cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet-cards"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to redeem", variant: "destructive" });
    },
  });

  const copyCode = async () => {
    await Clipboard.setStringAsync(card.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Gift card code copied to clipboard" });
  };

  const isRedeemed = card.status === "redeemed";
  const isExpired = card.expiresAt && new Date(card.expiresAt) < new Date();

  return (
    <View style={[styles.giftItemCard, isRedeemed && { opacity: 0.6 }]}>
      <View style={[styles.giftItemStripe, { backgroundColor: selectedDesign.colors[0] }]} />
      <View style={styles.giftItemContent}>
        <View style={styles.giftItemRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.giftCodeRow}>
              <Ionicons name="gift" size={16} color="#6B7280" />
              <Text style={styles.giftCodeText}>{card.code}</Text>
              <TouchableOpacity onPress={copyCode}>
                <Ionicons name={copied ? "checkmark" : "copy"} size={14} color={copied ? "#10B981" : "#6B7280"} />
              </TouchableOpacity>
            </View>
            <Text style={styles.giftAmountText}>${card.amount}</Text>
            <Text style={styles.giftRecipientText}>
              {type === "sent" ? `To: ${card.recipientName}` : `From: Gift`}
            </Text>
            {card.message ? (
              <Text style={styles.giftMessageText}>"{card.message}"</Text>
            ) : null}
          </View>

          <View style={styles.giftItemRight}>
            {isRedeemed ? (
              <View style={styles.statusBadgeMuted}>
                <Text style={styles.statusBadgeMutedText}>Redeemed</Text>
              </View>
            ) : isExpired ? (
              <View style={styles.statusBadgeDanger}>
                <Text style={styles.statusBadgeDangerText}>Expired</Text>
              </View>
            ) : type === "received" ? (
              <TouchableOpacity
                style={styles.redeemButton}
                onPress={() => redeemMutation.mutate()}
                disabled={redeemMutation.isPending}
              >
                <Text style={styles.redeemButtonText}>{redeemMutation.isPending ? "..." : "Redeem"}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.statusBadgePending}>
                <Text style={styles.statusBadgePendingText}>Pending</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

export default function GiftCards() {
  const router = useRouter();
  const [redeemCode, setRedeemCode] = useState("");
  const [activeTab, setActiveTab] = useState<"sent" | "received">("sent");
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [amount, setAmount] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [design, setDesign] = useState("default");
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ sent: GiftCard[]; received: GiftCard[] }>({
    queryKey: ["/api/gift-cards"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/gift-cards", data);
      return response.json();
    },
    onSuccess: (giftCard: any) => {
      toast({
        title: "Gift card created!",
        description: `Your gift card (${giftCard.code}) is ready to share.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/gift-cards"] });
      setCreateModalVisible(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create gift card",
        variant: "destructive",
      });
    },
  });

  const lookupMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await fetch(`/api/gift-cards/code/${code}`);
      if (!response.ok) throw new Error("Gift card not found");
      return response.json();
    },
    onSuccess: (giftCard: any) => {
      if (giftCard.status === "redeemed") {
        toast({ title: "Already Redeemed", description: "This gift card has already been used.", variant: "destructive" });
      } else {
        toast({ title: "Gift Card Found!", description: `Value: $${giftCard.amount}` });
      }
    },
    onError: () => {
      toast({ title: "Not Found", description: "Invalid gift card code", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setAmount("");
    setRecipientName("");
    setRecipientEmail("");
    setMessage("");
    setDesign("default");
  };

  const handleCreate = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "Error", description: "Please enter a valid amount", variant: "destructive" });
      return;
    }
    if (!recipientName) {
      toast({ title: "Error", description: "Please enter recipient name", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      amount,
      recipientName,
      recipientEmail: recipientEmail || null,
      message: message || null,
      design,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerSimple}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gift Cards</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.body}>
        <View style={styles.centerSection}>
          <View style={styles.giftIconCircle}>
            <Ionicons name="gift" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.subtitleText}>Send love with digital gift cards</Text>
        </View>

        <TouchableOpacity style={styles.createButton} onPress={() => setCreateModalVisible(true)}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Create Gift Card</Text>
        </TouchableOpacity>

        <View style={styles.redeemCard}>
          <Text style={styles.redeemLabel}>Redeem a Gift Card</Text>
          <View style={styles.redeemRow}>
            <TextInput
              placeholder="Enter gift card code"
              placeholderTextColor="#6B7280"
              value={redeemCode}
              onChangeText={(text) => setRedeemCode(text.toUpperCase())}
              style={styles.redeemInput}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.lookupButton, (!redeemCode || lookupMutation.isPending) && { opacity: 0.5 }]}
              onPress={() => lookupMutation.mutate(redeemCode)}
              disabled={!redeemCode || lookupMutation.isPending}
            >
              <Ionicons name="card" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "sent" && styles.tabActive]}
            onPress={() => setActiveTab("sent")}
          >
            <Ionicons name="send" size={16} color={activeTab === "sent" ? "#7C3AED" : "#6B7280"} />
            <Text style={[styles.tabText, activeTab === "sent" && styles.tabTextActive]}>
              Sent ({data?.sent?.length || 0})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "received" && styles.tabActive]}
            onPress={() => setActiveTab("received")}
          >
            <Ionicons name="gift" size={16} color={activeTab === "received" ? "#7C3AED" : "#6B7280"} />
            <Text style={[styles.tabText, activeTab === "received" && styles.tabTextActive]}>
              Received ({data?.received?.length || 0})
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color="#7C3AED" />
          </View>
        ) : activeTab === "sent" ? (
          data?.sent?.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="gift" size={48} color="#E5E7EB" />
              <Text style={styles.emptyText}>No gift cards sent yet</Text>
            </View>
          ) : (
            data?.sent?.map((card) => (
              <GiftCardItem key={card.id} card={card} type="sent" />
            ))
          )
        ) : (
          data?.received?.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="gift" size={48} color="#E5E7EB" />
              <Text style={styles.emptyText}>No gift cards received yet</Text>
            </View>
          ) : (
            data?.received?.map((card) => (
              <GiftCardItem key={card.id} card={card} type="received" />
            ))
          )
        )}

        <View style={{ height: 100 }} />
      </View>

      <Modal visible={createModalVisible} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={styles.container}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setCreateModalVisible(false); resetForm(); }}>
              <Ionicons name="close" size={24} color="#1A1A2E" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Gift Card</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.body}>
            <GiftCardPreview amount={amount} recipientName={recipientName} message={message} design={design} />

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Amount ($)</Text>
            <TextInput
              placeholder="Enter amount"
              placeholderTextColor="#6B7280"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              style={styles.textInput}
            />
            <View style={styles.presetRow}>
              {[10, 25, 50, 100, 200].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={styles.presetButton}
                  onPress={() => setAmount(preset.toString())}
                >
                  <Text style={styles.presetText}>${preset}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Recipient Name</Text>
            <TextInput
              placeholder="Who is this for?"
              placeholderTextColor="#6B7280"
              value={recipientName}
              onChangeText={setRecipientName}
              style={styles.textInput}
            />

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Recipient Email (optional)</Text>
            <TextInput
              placeholder="Send via email"
              placeholderTextColor="#6B7280"
              value={recipientEmail}
              onChangeText={setRecipientEmail}
              keyboardType="email-address"
              style={styles.textInput}
            />

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Personal Message (optional)</Text>
            <TextInput
              placeholder="Add a personal note..."
              placeholderTextColor="#6B7280"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={2}
              style={[styles.textInput, { height: 64, textAlignVertical: "top" }]}
            />

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Design</Text>
            <View style={styles.designGrid}>
              {designs.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={[
                    styles.designOption,
                    { backgroundColor: d.colors[0] },
                    design === d.id && styles.designOptionSelected,
                  ]}
                  onPress={() => setDesign(d.id)}
                >
                  <Text style={styles.designLabel}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, createMutation.isPending && { opacity: 0.5 }]}
              onPress={handleCreate}
              disabled={createMutation.isPending}
            >
              <Text style={styles.primaryButtonText}>
                {createMutation.isPending ? "Creating..." : "Create & Share"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerSimple: {
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
  body: {
    paddingHorizontal: 24,
  },
  centerSection: {
    alignItems: "center",
    paddingVertical: 16,
  },
  giftIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#9333EA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  subtitleText: {
    fontSize: 14,
    color: "#6B7280",
  },
  createButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  redeemCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 16,
  },
  redeemLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A2E",
    marginBottom: 8,
  },
  redeemRow: {
    flexDirection: "row",
    gap: 8,
  },
  redeemInput: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: "monospace",
    color: "#1A1A2E",
    backgroundColor: "#FFFFFF",
  },
  lookupButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 6,
    gap: 6,
  },
  tabActive: {
    backgroundColor: "#FFFFFF",
  },
  tabText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#7C3AED",
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
  },
  giftItemCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    marginBottom: 12,
  },
  giftItemStripe: {
    height: 4,
  },
  giftItemContent: {
    padding: 16,
  },
  giftItemRow: {
    flexDirection: "row",
    gap: 12,
  },
  giftCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  giftCodeText: {
    fontSize: 13,
    fontFamily: "monospace",
    color: "#1A1A2E",
  },
  giftAmountText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  giftRecipientText: {
    fontSize: 14,
    color: "#6B7280",
  },
  giftMessageText: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
    marginTop: 4,
  },
  giftItemRight: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  statusBadgeMuted: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeMutedText: {
    fontSize: 12,
    color: "#6B7280",
  },
  statusBadgeDanger: {
    backgroundColor: "rgba(239,68,68,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeDangerText: {
    fontSize: 12,
    color: "#EF4444",
  },
  statusBadgePending: {
    backgroundColor: "rgba(124,58,237,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgePendingText: {
    fontSize: 12,
    color: "#7C3AED",
  },
  redeemButton: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  redeemButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  previewCard: {
    borderRadius: 16,
    padding: 24,
    overflow: "hidden",
    marginBottom: 16,
  },
  previewDecoCircle1: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  previewDecoCircle2: {
    position: "absolute",
    bottom: -30,
    left: -30,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  previewContent: {
    zIndex: 1,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  previewBrand: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  previewAmount: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  previewTo: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
  },
  previewMessage: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontStyle: "italic",
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A2E",
    marginBottom: 8,
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#1A1A2E",
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  presetText: {
    fontSize: 14,
    color: "#1A1A2E",
    fontWeight: "500",
  },
  designGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  designOption: {
    width: "30%",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  designOptionSelected: {
    borderWidth: 2,
    borderColor: "#7C3AED",
  },
  designLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  primaryButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 32,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
