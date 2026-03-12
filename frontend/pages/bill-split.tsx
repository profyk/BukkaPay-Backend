import { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";

interface Participant {
  id: string;
  name: string;
  amount: string;
  paid: boolean;
}

interface BillSplit {
  id: string;
  creatorId: string;
  title: string;
  totalAmount: string;
  participants: Participant[];
  status: string;
  createdAt: string;
}

type SplitType = "equal" | "custom" | "percentage";

export default function BillSplitPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedBill, setSelectedBill] = useState<BillSplit | null>(null);

  const [title, setTitle] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [participants, setParticipants] = useState<Participant[]>([
    { id: "1", name: "", amount: "0", paid: false },
  ]);

  const { data: billSplits = [], isLoading } = useQuery<BillSplit[]>({
    queryKey: ["/api/bill-splits"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; totalAmount: string; participants: Participant[] }) => {
      return apiRequest("POST", "/api/bill-splits", data);
    },
    onSuccess: () => {
      toast({ title: "Bill Created", description: "Your bill has been created and shared with participants." });
      queryClient.invalidateQueries({ queryKey: ["/api/bill-splits"] });
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateParticipantsMutation = useMutation({
    mutationFn: async ({ id, participants }: { id: string; participants: Participant[] }) => {
      return apiRequest("PATCH", `/api/bill-splits/${id}/participants`, { participants });
    },
    onSuccess: () => {
      toast({ title: "Updated", description: "Payment status updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/bill-splits"] });
    },
  });

  const resetForm = () => {
    setShowCreate(false);
    setTitle("");
    setTotalAmount("");
    setSplitType("equal");
    setParticipants([{ id: "1", name: "", amount: "0", paid: false }]);
  };

  const addParticipant = () => {
    const newId = (participants.length + 1).toString();
    setParticipants([...participants, { id: newId, name: "", amount: "0", paid: false }]);
  };

  const removeParticipant = (id: string) => {
    if (participants.length > 1) {
      setParticipants(participants.filter((p) => p.id !== id));
    }
  };

  const updateParticipant = (id: string, field: keyof Participant, value: string | boolean) => {
    setParticipants(participants.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const handleCreate = () => {
    const validParticipants = participants.filter((p) => p.name.trim());
    if (!title.trim() || !totalAmount || validParticipants.length === 0) {
      toast({ title: "Missing Info", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      title: title.trim(),
      totalAmount,
      participants: validParticipants.map((p) => ({
        ...p,
        amount: p.amount || (parseFloat(totalAmount) / validParticipants.length).toFixed(2),
      })),
    });
  };

  const markAsPaid = (billId: string, participantId: string) => {
    const bill = billSplits.find((b) => b.id === billId);
    if (!bill) return;

    const updatedParticipants = (bill.participants || []).map((p: Participant) =>
      p.id === participantId ? { ...p, paid: true } : p
    );

    updateParticipantsMutation.mutate({ id: billId, participants: updatedParticipants });

    if (selectedBill?.id === billId) {
      setSelectedBill({ ...selectedBill, participants: updatedParticipants });
    }
  };

  const sendReminder = (participantName: string) => {
    toast({ title: "Reminder Sent", description: `A payment reminder has been sent to ${participantName}.` });
  };

  const getPaidAmount = (bill: BillSplit) => {
    return (bill.participants || [])
      .filter((p: Participant) => p.paid)
      .reduce((sum: number, p: Participant) => sum + parseFloat(p.amount || "0"), 0);
  };

  const getPaidCount = (bill: BillSplit) => {
    return (bill.participants || []).filter((p: Participant) => p.paid).length;
  };

  if (selectedBill) {
    const paidAmount = getPaidAmount(selectedBill);
    const totalAmt = parseFloat(selectedBill.totalAmount);
    const progress = totalAmt > 0 ? (paidAmount / totalAmt) * 100 : 0;

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedBill(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedBill.title}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.centerBlock}>
              <Text style={styles.mutedSmall}>Total Bill</Text>
              <Text style={styles.bigAmount}>${parseFloat(selectedBill.totalAmount).toFixed(2)}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.mutedSmall}>Collected</Text>
              <Text style={[styles.fontSemibold, { color: "#059669" }]}>${paidAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
            </View>
            <Text style={[styles.mutedSmall, { textAlign: "center", marginTop: 4 }]}>
              {getPaidCount(selectedBill)} of {(selectedBill.participants || []).length} people have paid
            </Text>
          </View>

          <Text style={styles.sectionLabel}>PARTICIPANTS</Text>
          {(selectedBill.participants || []).map((participant: Participant) => (
            <View
              key={participant.id}
              style={[styles.card, participant.paid && styles.cardPaid]}
            >
              <View style={styles.participantRow}>
                <View style={styles.participantLeft}>
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: participant.paid ? "#10B981" : "#F3F4F6" },
                    ]}
                  >
                    {participant.paid ? (
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    ) : (
                      <Text style={styles.avatarText}>{participant.name.charAt(0).toUpperCase()}</Text>
                    )}
                  </View>
                  <View>
                    <Text style={styles.participantName}>{participant.name}</Text>
                    <Text style={styles.mutedSmall}>${parseFloat(participant.amount).toFixed(2)}</Text>
                  </View>
                </View>

                {participant.paid ? (
                  <View style={styles.paidBadge}>
                    <Text style={styles.paidBadgeText}>Paid</Text>
                  </View>
                ) : (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.outlineButtonSmall}
                      onPress={() => sendReminder(participant.name)}
                    >
                      <Ionicons name="chatbubble" size={14} color="#7C3AED" />
                      <Text style={styles.outlineButtonSmallText}>Remind</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.smallButton}
                      onPress={() => markAsPaid(selectedBill.id, participant.id)}
                    >
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      <Text style={styles.smallButtonText}>Paid</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  if (showCreate) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={resetForm} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Bill Split</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Bill Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Dinner at Restaurant"
              placeholderTextColor="#6B7280"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Total Amount</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="cash" size={18} color="#6B7280" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.inputInner}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#6B7280"
                value={totalAmount}
                onChangeText={setTotalAmount}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Split Type</Text>
            <View style={styles.splitTypeRow}>
              {([
                { type: "equal" as SplitType, icon: "reorder-two" as const, label: "Equal" },
                { type: "custom" as SplitType, icon: "calculator" as const, label: "Custom" },
                { type: "percentage" as SplitType, icon: "analytics" as const, label: "Percent" },
              ]).map(({ type, icon, label }) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setSplitType(type)}
                  style={[
                    styles.splitTypeButton,
                    splitType === type && styles.splitTypeButtonActive,
                  ]}
                >
                  <Ionicons
                    name={icon}
                    size={20}
                    color={splitType === type ? "#7C3AED" : "#6B7280"}
                  />
                  <Text
                    style={[
                      styles.splitTypeLabel,
                      splitType === type && { color: "#7C3AED" },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>Participants</Text>
              <TouchableOpacity onPress={addParticipant} style={styles.addButton}>
                <Ionicons name="add" size={16} color="#7C3AED" />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            {participants.map((participant, index) => (
              <View key={participant.id} style={styles.participantInputRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder={`Person ${index + 1}`}
                  placeholderTextColor="#6B7280"
                  value={participant.name}
                  onChangeText={(v) => updateParticipant(participant.id, "name", v)}
                />
                {splitType !== "equal" && (
                  <View style={styles.amountInputWrap}>
                    <Text style={styles.amountPrefix}>
                      {splitType === "percentage" ? "%" : "$"}
                    </Text>
                    <TextInput
                      style={styles.amountInput}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#6B7280"
                      value={participant.amount}
                      onChangeText={(v) => updateParticipant(participant.id, "amount", v)}
                    />
                  </View>
                )}
                {participants.length > 1 && (
                  <TouchableOpacity onPress={() => removeParticipant(participant.id)} style={{ padding: 8 }}>
                    <Ionicons name="close" size={18} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {splitType === "equal" && totalAmount && participants.filter((p) => p.name.trim()).length > 0 && (
            <View style={styles.equalSplitCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.mutedSmall}>Each person pays:</Text>
                <Text style={styles.splitAmount}>
                  ${(parseFloat(totalAmount) / participants.filter((p) => p.name.trim()).length).toFixed(2)}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, createMutation.isPending && styles.disabledButton]}
            onPress={handleCreate}
            disabled={createMutation.isPending}
          >
            <Text style={styles.primaryButtonText}>
              {createMutation.isPending ? "Creating..." : "Create & Share Bill"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bill Splitting</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.heroButton} onPress={() => setShowCreate(true)}>
          <View style={styles.heroButtonInner}>
            <View style={styles.heroIcon}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.heroTitle}>Split a Bill</Text>
              <Text style={styles.heroSubtitle}>Create a new bill to split with friends</Text>
            </View>
          </View>
        </TouchableOpacity>

        {isLoading ? (
          <View style={styles.loadingBlock}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.skeleton} />
            ))}
          </View>
        ) : billSplits.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="people" size={32} color="#6B7280" />
            </View>
            <Text style={styles.emptyTitle}>No Bills Yet</Text>
            <Text style={styles.emptyDesc}>Create your first bill split to get started</Text>
          </View>
        ) : (
          <View>
            <Text style={styles.sectionLabel}>YOUR BILLS</Text>
            {billSplits.map((bill) => {
              const paidCount = getPaidCount(bill);
              const totalCount = (bill.participants || []).length;
              const isComplete = bill.status === "completed" || paidCount === totalCount;

              return (
                <TouchableOpacity
                  key={bill.id}
                  onPress={() => setSelectedBill(bill)}
                  style={styles.card}
                >
                  <View style={styles.billRow}>
                    <View style={styles.billLeft}>
                      <View
                        style={[
                          styles.billIcon,
                          { backgroundColor: isComplete ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)" },
                        ]}
                      >
                        <Ionicons
                          name={isComplete ? "checkmark" : "time"}
                          size={24}
                          color={isComplete ? "#059669" : "#D97706"}
                        />
                      </View>
                      <View>
                        <Text style={styles.billTitle}>{bill.title}</Text>
                        <Text style={styles.mutedSmall}>
                          ${parseFloat(bill.totalAmount).toFixed(2)} • {paidCount}/{totalCount} paid
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
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
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  section: {
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 12,
  },
  cardPaid: {
    borderColor: "rgba(16,185,129,0.3)",
    backgroundColor: "rgba(16,185,129,0.05)",
  },
  centerBlock: {
    alignItems: "center",
    marginBottom: 24,
  },
  mutedSmall: {
    fontSize: 13,
    color: "#6B7280",
  },
  bigAmount: {
    fontSize: 36,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fontSemibold: {
    fontWeight: "600",
    fontSize: 14,
  },
  progressBar: {
    height: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 6,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 12,
    marginTop: 8,
  },
  participantRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  participantLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  participantName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1A1A2E",
  },
  paidBadge: {
    backgroundColor: "rgba(16,185,129,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paidBadgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#059669",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  outlineButtonSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  outlineButtonSmallText: {
    fontSize: 12,
    color: "#7C3AED",
    fontWeight: "500",
  },
  smallButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#7C3AED",
  },
  smallButtonText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
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
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
  },
  inputInner: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1A1A2E",
  },
  splitTypeRow: {
    flexDirection: "row",
    gap: 8,
  },
  splitTypeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  splitTypeButtonActive: {
    borderColor: "#7C3AED",
    backgroundColor: "rgba(124,58,237,0.1)",
  },
  splitTypeLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    marginTop: 4,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    color: "#7C3AED",
    fontWeight: "500",
  },
  participantInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  amountInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    width: 96,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 8,
    backgroundColor: "#FFFFFF",
  },
  amountPrefix: {
    fontSize: 14,
    color: "#6B7280",
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1A1A2E",
  },
  equalSplitCard: {
    backgroundColor: "rgba(124,58,237,0.05)",
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.2)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  splitAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#7C3AED",
  },
  primaryButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.5,
  },
  heroButton: {
    borderRadius: 16,
    padding: 24,
    backgroundColor: "#7C3AED",
    marginBottom: 24,
  },
  heroButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  heroSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  loadingBlock: {
    gap: 12,
  },
  skeleton: {
    height: 96,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A2E",
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: "#6B7280",
  },
  billRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  billLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  billIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  billTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A2E",
  },
});
