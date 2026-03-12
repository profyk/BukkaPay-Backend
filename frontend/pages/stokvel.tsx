import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";

interface Stokvel {
  id: string;
  name: string;
  description: string;
  purpose: string;
  contributionAmount: number;
  frequency: string;
  members: number;
  totalSaved: number;
  nextPayout: string;
  color: string;
}

const stokvelColors: Record<string, string[]> = {
  "from-purple-600 to-pink-600": ["#9333EA", "#DB2777"],
  "from-blue-600 to-cyan-600": ["#2563EB", "#0891B2"],
  "from-green-600 to-emerald-600": ["#16A34A", "#059669"],
};

function getColor(colorKey: string): string {
  const map: Record<string, string> = {
    "from-purple-600 to-pink-600": "#9333EA",
    "from-blue-600 to-cyan-600": "#2563EB",
    "from-green-600 to-emerald-600": "#16A34A",
  };
  return map[colorKey] || "#7C3AED";
}

export default function Stokvel() {
  const router = useRouter();
  const [view, setView] = useState<"list" | "create" | "details" | "add-members">("list");
  const [selectedStokvel, setSelectedStokvel] = useState<Stokvel | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    purpose: "",
    contributionAmount: "",
    frequency: "monthly",
    description: "",
  });
  const [memberEmail, setMemberEmail] = useState("");
  const [members, setMembers] = useState<string[]>([]);

  const stokvels: Stokvel[] = [
    {
      id: "1",
      name: "Family Savings Circle",
      description: "We save together for big goals",
      purpose: "Home Improvement Fund",
      contributionAmount: 5000,
      frequency: "monthly",
      members: 8,
      totalSaved: 120000,
      nextPayout: "March 15, 2024",
      color: "from-purple-600 to-pink-600",
    },
    {
      id: "2",
      name: "Community Builders",
      description: "Friends saving for vacation",
      purpose: "Group Vacation",
      contributionAmount: 3000,
      frequency: "weekly",
      members: 6,
      totalSaved: 72000,
      nextPayout: "Feb 28, 2024",
      color: "from-blue-600 to-cyan-600",
    },
    {
      id: "3",
      name: "Education Fund",
      description: "Colleagues saving for upskilling",
      purpose: "Professional Development",
      contributionAmount: 2500,
      frequency: "monthly",
      members: 12,
      totalSaved: 90000,
      nextPayout: "April 1, 2024",
      color: "from-green-600 to-emerald-600",
    },
  ];

  const handleCreateStokvel = () => {
    if (!formData.name || !formData.purpose || !formData.contributionAmount) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    Alert.alert("Success", `${formData.name} stokvel created successfully!`);
    setFormData({ name: "", purpose: "", contributionAmount: "", frequency: "monthly", description: "" });
    setView("list");
  };

  if (view === "add-members" && selectedStokvel) {
    const addMember = () => {
      if (!memberEmail || !memberEmail.includes("@")) {
        Alert.alert("Error", "Please enter a valid email");
        return;
      }
      if (members.includes(memberEmail)) {
        Alert.alert("Error", "Member already added");
        return;
      }
      setMembers([...members, memberEmail]);
      setMemberEmail("");
      Alert.alert("Success", "Member added to invite list");
    };

    const sendInvitations = () => {
      if (members.length === 0) {
        Alert.alert("Error", "Add at least one member");
        return;
      }
      Alert.alert("Success", `Invitations sent to ${members.length} member(s)!`);
      setMembers([]);
      setMemberEmail("");
      setView("details");
    };

    const bgColor = getColor(selectedStokvel.color);

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollPadding}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setView("details")} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Members</Text>
        </View>

        <View style={styles.content}>
          <View style={[styles.heroBanner, { backgroundColor: bgColor }]}>
            <Text style={styles.heroBannerSubtext}>Adding members to</Text>
            <Text style={styles.heroBannerTitle}>{selectedStokvel.name}</Text>
          </View>

          <Text style={styles.label}>Member Email</Text>
          <View style={styles.emailRow}>
            <TextInput
              placeholder="Enter email address"
              placeholderTextColor="#6B7280"
              value={memberEmail}
              onChangeText={setMemberEmail}
              onSubmitEditing={addMember}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.emailInput}
            />
            <TouchableOpacity onPress={addMember} style={styles.addMemberButton}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {members.length > 0 && (
            <View style={styles.membersSection}>
              <Text style={styles.sectionTitle}>Members to Invite ({members.length})</Text>
              {members.map((email, idx) => (
                <View key={idx} style={styles.memberItem}>
                  <View style={styles.memberItemLeft}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.memberEmail}>{email}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setMembers(members.filter((_, i) => i !== idx))}>
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.infoBanner}>
            <Text style={styles.infoText}>
              Members will receive an invitation email to join this stokvel. They can accept or decline.
            </Text>
          </View>

          <TouchableOpacity
            onPress={sendInvitations}
            disabled={members.length === 0}
            style={[styles.gradientButton, members.length === 0 && styles.disabledButton]}
          >
            <Text style={styles.gradientButtonText}>
              Send {members.length} Invitation{members.length !== 1 ? "s" : ""}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setView("details")} style={styles.outlineButton}>
            <Text style={styles.outlineButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (view === "create") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollPadding}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setView("list")} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Stokvel</Text>
        </View>

        <View style={styles.content}>
          <View style={[styles.heroBanner, { backgroundColor: "#9333EA" }]}>
            <Text style={styles.heroBannerTitle}>Start a Stokvel</Text>
            <Text style={[styles.heroBannerSubtext, { marginTop: 4 }]}>
              Invite friends, family, or community to save together
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Stokvel Name</Text>
            <TextInput
              placeholder="e.g., Family Savings Circle"
              placeholderTextColor="#6B7280"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              style={styles.textInput}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Purpose/Goal</Text>
            <TextInput
              placeholder="e.g., Home Renovation, Vacation, Education"
              placeholderTextColor="#6B7280"
              value={formData.purpose}
              onChangeText={(text) => setFormData({ ...formData, purpose: text })}
              style={styles.textInput}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              placeholder="Tell members about this stokvel..."
              placeholderTextColor="#6B7280"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={3}
              style={[styles.textInput, { height: 80, textAlignVertical: "top" }]}
            />
          </View>

          <View style={styles.twoColRow}>
            <View style={styles.halfCol}>
              <Text style={styles.label}>Contribution Amount ($)</Text>
              <TextInput
                placeholder="5000"
                placeholderTextColor="#6B7280"
                value={formData.contributionAmount}
                onChangeText={(text) => setFormData({ ...formData, contributionAmount: text })}
                keyboardType="numeric"
                style={styles.textInput}
              />
            </View>
            <View style={styles.halfCol}>
              <Text style={styles.label}>Frequency</Text>
              <View style={styles.frequencyContainer}>
                {["weekly", "biweekly", "monthly"].map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    onPress={() => setFormData({ ...formData, frequency: freq })}
                    style={[
                      styles.frequencyOption,
                      formData.frequency === freq && styles.frequencyOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.frequencyText,
                        formData.frequency === freq && styles.frequencyTextActive,
                      ]}
                    >
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <TouchableOpacity onPress={handleCreateStokvel} style={styles.gradientButton}>
            <Text style={styles.gradientButtonText}>Create Stokvel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (view === "details" && selectedStokvel) {
    const bgColor = getColor(selectedStokvel.color);

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollPadding}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setView("list")} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedStokvel.name}</Text>
        </View>

        <View style={styles.content}>
          <View style={[styles.heroBanner, { backgroundColor: bgColor }]}>
            <View style={styles.heroTopRow}>
              <View>
                <Text style={styles.heroPurpose}>{selectedStokvel.purpose}</Text>
              </View>
              <Ionicons name="people-outline" size={24} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="people-outline" size={20} color="#9333EA" />
              <Text style={styles.statValue}>{selectedStokvel.members}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trending-up-outline" size={20} color="#059669" />
              <Text style={styles.statValue}>${selectedStokvel.totalSaved.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Saved</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.infoRow}>
            <View style={styles.infoRowLeft}>
              <Ionicons name="cash-outline" size={20} color="#2563EB" />
              <View>
                <Text style={styles.infoRowTitle}>Next Contribution</Text>
                <Text style={styles.infoRowSub}>${selectedStokvel.contributionAmount.toLocaleString()}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoRow}>
            <View style={styles.infoRowLeft}>
              <Ionicons name="calendar-outline" size={20} color="#7C3AED" />
              <View>
                <Text style={styles.infoRowTitle}>Next Payout</Text>
                <Text style={styles.infoRowSub}>{selectedStokvel.nextPayout}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Members</Text>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.memberItem}>
              <View style={styles.memberItemLeft}>
                <View style={[styles.memberAvatar, { backgroundColor: "#9333EA" }]}>
                  <Text style={styles.memberAvatarText}>{String.fromCharCode(64 + i)}</Text>
                </View>
                <View>
                  <Text style={styles.memberName}>Member {i}</Text>
                  <Text style={styles.memberContribution}>Contributed ${selectedStokvel.contributionAmount * i}</Text>
                </View>
              </View>
            </View>
          ))}

          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() => Alert.alert("Success", "Contribution added!")}
              style={styles.gradientButton}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.gradientButtonText}>Make Contribution</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setMembers([]);
                setMemberEmail("");
                setView("add-members");
              }}
              style={[styles.gradientButton, { backgroundColor: "#2563EB" }]}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.gradientButtonText}>Add Members</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                await Clipboard.setStringAsync("Join my stokvel: stk-abc123");
                Alert.alert("Copied", "Invite link copied!");
              }}
              style={styles.outlineButton}
            >
              <Text style={styles.outlineButtonText}>Share Invite Link</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollPadding}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stokvel Groups</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Save together, achieve together</Text>

        <TouchableOpacity onPress={() => setView("create")} style={styles.gradientButton}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.gradientButtonText}>Create New Stokvel</Text>
        </TouchableOpacity>

        <View style={styles.stokvelList}>
          {stokvels.map((stokvel, idx) => {
            const bgColor = getColor(stokvel.color);
            return (
              <TouchableOpacity
                key={stokvel.id}
                onPress={() => {
                  setSelectedStokvel(stokvel);
                  setView("details");
                }}
                style={[styles.stokvelCard, { backgroundColor: bgColor }]}
              >
                <View style={styles.stokvelCardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stokvelCardName}>{stokvel.name}</Text>
                    <Text style={styles.stokvelCardPurpose}>{stokvel.purpose}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.stokvelCardDivider} />
                <View style={styles.stokvelCardStats}>
                  <View style={styles.stokvelStat}>
                    <Text style={styles.stokvelStatLabel}>Members</Text>
                    <Text style={styles.stokvelStatValue}>{stokvel.members}</Text>
                  </View>
                  <View style={styles.stokvelStat}>
                    <Text style={styles.stokvelStatLabel}>Saved</Text>
                    <Text style={styles.stokvelStatValueSm}>${(stokvel.totalSaved / 1000).toFixed(0)}k</Text>
                  </View>
                  <View style={styles.stokvelStat}>
                    <Text style={styles.stokvelStatLabel}>Frequency</Text>
                    <Text style={[styles.stokvelStatValueSm, { textTransform: "capitalize" }]}>{stokvel.frequency}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollPadding: { paddingBottom: 100 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingTop: 48, paddingBottom: 16 },
  backButton: { position: "absolute", left: 24, zIndex: 1, padding: 8, borderRadius: 20 },
  headerTitle: { flex: 1, textAlign: "center", fontWeight: "700", fontSize: 18, color: "#1A1A2E" },
  content: { paddingHorizontal: 24, gap: 16 },
  subtitle: { textAlign: "center", color: "#6B7280", fontSize: 14 },
  heroBanner: { borderRadius: 16, padding: 24 },
  heroBannerTitle: { color: "#FFFFFF", fontWeight: "700", fontSize: 22 },
  heroBannerSubtext: { color: "rgba(255,255,255,0.9)", fontSize: 14 },
  heroTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  heroPurpose: { color: "rgba(255,255,255,0.9)", fontSize: 14 },
  label: { fontSize: 14, fontWeight: "500", color: "#1A1A2E", marginBottom: 8 },
  textInput: { backgroundColor: "#F8F9FA", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: "#1A1A2E" },
  emailRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  emailInput: { flex: 1, backgroundColor: "#F8F9FA", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: "#1A1A2E" },
  addMemberButton: { backgroundColor: "#2563EB", width: 48, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  formGroup: { marginBottom: 8 },
  twoColRow: { flexDirection: "row", gap: 16 },
  halfCol: { flex: 1 },
  frequencyContainer: { gap: 4 },
  frequencyOption: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: "#F8F9FA", borderWidth: 1, borderColor: "#E5E7EB" },
  frequencyOptionActive: { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },
  frequencyText: { fontSize: 13, color: "#1A1A2E", textAlign: "center" },
  frequencyTextActive: { color: "#FFFFFF" },
  membersSection: { marginTop: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#1A1A2E", marginBottom: 12 },
  memberItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, backgroundColor: "#F8F9FA", borderRadius: 8, marginBottom: 8 },
  memberItemLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  memberAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#2563EB", justifyContent: "center", alignItems: "center" },
  memberAvatarText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  memberEmail: { fontSize: 14, color: "#1A1A2E" },
  memberName: { fontSize: 14, fontWeight: "500", color: "#1A1A2E" },
  memberContribution: { fontSize: 12, color: "#6B7280" },
  removeText: { color: "#EF4444", fontSize: 13, fontWeight: "500" },
  infoBanner: { backgroundColor: "rgba(59,130,246,0.1)", borderWidth: 1, borderColor: "rgba(59,130,246,0.2)", borderRadius: 8, padding: 16 },
  infoText: { fontSize: 12, color: "#2563EB" },
  gradientButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 8, backgroundColor: "#9333EA" },
  gradientButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },
  disabledButton: { opacity: 0.5 },
  outlineButton: { height: 48, borderRadius: 8, borderWidth: 1, borderColor: "#E5E7EB", justifyContent: "center", alignItems: "center" },
  outlineButtonText: { color: "#1A1A2E", fontWeight: "600", fontSize: 15 },
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, backgroundColor: "#F8F9FA", borderRadius: 8, padding: 16 },
  statValue: { fontSize: 22, fontWeight: "700", color: "#1A1A2E", marginTop: 8 },
  statLabel: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  infoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F8F9FA", borderRadius: 8, padding: 16 },
  infoRowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  infoRowTitle: { fontSize: 14, fontWeight: "500", color: "#1A1A2E" },
  infoRowSub: { fontSize: 12, color: "#6B7280" },
  actionButtons: { gap: 8, marginTop: 8 },
  stokvelList: { gap: 12 },
  stokvelCard: { borderRadius: 12, padding: 16 },
  stokvelCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  stokvelCardName: { color: "#FFFFFF", fontWeight: "700", fontSize: 18 },
  stokvelCardPurpose: { color: "rgba(255,255,255,0.9)", fontSize: 14, marginTop: 2 },
  stokvelCardDivider: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.2)", marginBottom: 12, paddingTop: 12 },
  stokvelCardStats: { flexDirection: "row" },
  stokvelStat: { flex: 1 },
  stokvelStatLabel: { color: "rgba(255,255,255,0.75)", fontSize: 12 },
  stokvelStatValue: { color: "#FFFFFF", fontWeight: "700", fontSize: 18 },
  stokvelStatValueSm: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
});
