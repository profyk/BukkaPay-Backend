import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useToast } from "../hooks/use-toast";
import { queryClient } from "../lib/queryClient";
import { createCard } from "../lib/api";

const cardTypes = [
  { id: "virtual", title: "Virtual Card", icon: "card-outline" as const, color: "purple", description: "For online purchases" },
  { id: "savings", title: "Savings", icon: "wallet-outline" as const, color: "green", description: "Save for your goals" },
  { id: "travel", title: "Travel", icon: "airplane-outline" as const, color: "cyan", description: "Vacation & trips" },
  { id: "daily", title: "Daily Spending", icon: "wallet-outline" as const, color: "blue", description: "Everyday expenses" },
  { id: "gifts", title: "Gifts", icon: "gift-outline" as const, color: "pink", description: "Special occasions" },
  { id: "shopping", title: "Shopping", icon: "cart-outline" as const, color: "orange", description: "Retail therapy" },
  { id: "food", title: "Food & Dining", icon: "restaurant-outline" as const, color: "amber", description: "Restaurants & groceries" },
  { id: "rent", title: "Rent & Bills", icon: "home-outline" as const, color: "indigo", description: "Monthly payments" },
];

const colorOptions = [
  { id: "blue", color: "#3B82F6" },
  { id: "green", color: "#10B981" },
  { id: "purple", color: "#8B5CF6" },
  { id: "orange", color: "#F97316" },
  { id: "pink", color: "#EC4899" },
  { id: "cyan", color: "#06B6D4" },
  { id: "indigo", color: "#6366F1" },
  { id: "teal", color: "#14B8A6" },
  { id: "amber", color: "#F59E0B" },
];

function generateCardNumber() {
  const segments = [];
  for (let i = 0; i < 4; i++) {
    segments.push(Math.floor(1000 + Math.random() * 9000).toString());
  }
  return segments.join(" ");
}

interface AddCardDialogProps {
  trigger?: React.ReactNode;
}

export default function AddCardDialog({ trigger }: AddCardDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"type" | "customize">("type");
  const [selectedType, setSelectedType] = useState<(typeof cardTypes)[0] | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState("blue");
  const [initialBalance, setInitialBalance] = useState("0");
  const [spendingLimit, setSpendingLimit] = useState("");
  const { toast } = useToast();

  const createCardMutation = useMutation({
    mutationFn: createCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      toast({ title: "Success", description: "Card created successfully!" });
      handleClose();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create card" });
    },
  });

  const handleClose = () => {
    setOpen(false);
    setStep("type");
    setSelectedType(null);
    setCustomTitle("");
    setSelectedColor("blue");
    setInitialBalance("0");
    setSpendingLimit("");
  };

  const handleSelectType = (type: (typeof cardTypes)[0]) => {
    setSelectedType(type);
    setCustomTitle(type.title);
    setSelectedColor(type.color);
    setStep("customize");
  };

  const handleCreate = () => {
    if (!customTitle.trim()) {
      toast({ title: "Error", description: "Please enter a card name" });
      return;
    }

    const iconMap: Record<string, string> = {
      virtual: "credit-card",
      savings: "piggy-bank",
      travel: "plane",
      daily: "wallet",
      gifts: "gift",
      shopping: "shopping-cart",
      food: "utensils",
      rent: "home",
    };

    const cardData: any = {
      title: customTitle.trim(),
      balance: initialBalance || "0",
      currency: "$",
      icon: selectedType ? iconMap[selectedType.id] : "credit-card",
      color: selectedColor,
      cardNumber: generateCardNumber(),
    };

    if (spendingLimit && spendingLimit.trim() !== "") {
      cardData.spendingLimit = spendingLimit;
    }

    createCardMutation.mutate(cardData);
  };

  const getColorValue = (colorId: string) => {
    return colorOptions.find((c) => c.id === colorId)?.color || "#3B82F6";
  };

  return (
    <>
      {trigger ? (
        <TouchableOpacity onPress={() => setOpen(true)}>{trigger}</TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.defaultTrigger} onPress={() => setOpen(true)}>
          <Ionicons name="add" size={20} color="#6B7280" />
          <Text style={styles.defaultTriggerText}>Add New Card</Text>
        </TouchableOpacity>
      )}

      <Modal visible={open} transparent animationType="slide" onRequestClose={handleClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {step === "type" ? "Choose Card Type" : "Customize Your Card"}
              </Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollBody}>
              {step === "type" && (
                <View style={styles.typeGrid}>
                  {cardTypes.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={styles.typeCard}
                      onPress={() => handleSelectType(type)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.typeIconBox, { backgroundColor: getColorValue(type.color) }]}>
                        <Ionicons name={type.icon} size={20} color="#FFFFFF" />
                      </View>
                      <Text style={styles.typeTitle}>{type.title}</Text>
                      <Text style={styles.typeDesc}>{type.description}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {step === "customize" && selectedType && (
                <View style={styles.customizeContainer}>
                  <View style={[styles.previewCard, { backgroundColor: getColorValue(selectedColor) }]}>
                    <View style={styles.previewRow}>
                      <Ionicons name={selectedType.icon} size={20} color="#FFFFFF" />
                      <Text style={styles.previewName}>{customTitle || selectedType.title}</Text>
                    </View>
                    <Text style={styles.previewBalance}>
                      ${parseFloat(initialBalance || "0").toFixed(2)}
                    </Text>
                    <Text style={styles.previewCardNum}>**** **** **** ****</Text>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Card Name</Text>
                    <TextInput
                      style={styles.textInput}
                      value={customTitle}
                      onChangeText={setCustomTitle}
                      placeholder="Enter card name"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Initial Balance</Text>
                    <TextInput
                      style={styles.textInput}
                      value={initialBalance}
                      onChangeText={setInitialBalance}
                      placeholder="0.00"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Spending Limit (optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={spendingLimit}
                      onChangeText={setSpendingLimit}
                      placeholder="No limit"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Card Color</Text>
                    <View style={styles.colorRow}>
                      {colorOptions.map((c) => (
                        <TouchableOpacity
                          key={c.id}
                          style={[
                            styles.colorCircle,
                            { backgroundColor: c.color },
                            selectedColor === c.id && styles.colorCircleSelected,
                          ]}
                          onPress={() => setSelectedColor(c.id)}
                        >
                          {selectedColor === c.id && (
                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.backButton} onPress={() => setStep("type")}>
                      <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.createButton, createCardMutation.isPending && styles.createButtonDisabled]}
                      onPress={handleCreate}
                      disabled={createCardMutation.isPending}
                    >
                      {createCardMutation.isPending ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.createButtonText}>Create Card</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  defaultTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#E5E7EB",
  },
  defaultTriggerText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  scrollBody: {
    paddingHorizontal: 20,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingTop: 16,
    paddingBottom: 20,
  },
  typeCard: {
    width: "47%",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  typeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  typeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  typeDesc: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  customizeContainer: {
    gap: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  previewCard: {
    borderRadius: 16,
    padding: 16,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  previewName: {
    color: "#FFFFFF",
    fontWeight: "500",
    fontSize: 14,
  },
  previewBalance: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  previewCardNum: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginTop: 8,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1A1A2E",
    backgroundColor: "#F8F9FA",
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: "#FFFFFF",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  backButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  createButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
