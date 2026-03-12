import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const logoImage = require("../assets/logo.png");

const coreFeatures = [
  { icon: "qr-code" as const, title: "QR Code Payments", desc: "Fast, simple, and contactless payments that allow merchants and customers to transact instantly \u2014 in person or remotely." },
  { icon: "globe" as const, title: "Cross-Border Payments", desc: "Secure and cost-effective international transfers that help individuals and businesses move money across countries with minimal friction." },
  { icon: "analytics" as const, title: "Merchant Dashboard", desc: "A powerful dashboard that gives businesses full visibility into payments, settlements, transaction history, and performance insights." },
  { icon: "home" as const, title: "Rental Payments System", desc: "A structured digital solution that enables transparent and reliable rent payments between tenants and landlords." },
];

const values = [
  { icon: "earth" as const, text: "Work across borders" },
  { icon: "trending-up" as const, text: "Scale with growing businesses" },
  { icon: "flash" as const, text: "Reduce friction in everyday transactions" },
  { icon: "settings" as const, text: "Adapt to different markets and use cases" },
];

const audiences = [
  "Small and medium-sized businesses",
  "Merchants and service providers",
  "Landlords and tenants",
  "Consumers and cross-border traders",
  "Developers and partners building on payment infrastructure",
];

export default function About() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About BukkaPay</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.heroSection}>
        <Image source={logoImage} style={styles.heroLogo} />
        <Text style={styles.heroTitle}>BukkaPay</Text>
        <Text style={styles.heroTagline}>Simplifying how the world pays and gets paid</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.bodyText}>
          BukkaPay is a global fintech platform building modern payment and commerce infrastructure for individuals and businesses everywhere. We enable people to send, receive, and manage money seamlessly through secure, affordable, and easy-to-use digital solutions.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What We Do</Text>
        <Text style={styles.bodyText}>
          BukkaPay provides an all-in-one payments ecosystem designed for real-world use cases across markets and borders. Through our platform, users and businesses can accept payments, manage transactions, and move money efficiently \u2014 locally and internationally.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Core Solutions</Text>
        {coreFeatures.map((feat, i) => (
          <View key={i} style={styles.featureCard}>
            <View style={styles.featureIconWrap}>
              <Ionicons name={feat.icon} size={22} color="#7C3AED" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>{feat.title}</Text>
              <Text style={styles.featureDesc}>{feat.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.highlightBox}>
        <Text style={styles.highlightText}>
          By unifying these services into a single platform, BukkaPay removes complexity from payments and enables businesses and individuals to operate more efficiently in a connected global economy.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why BukkaPay Exists</Text>
        <Text style={styles.bodyText}>
          Payments should be simple, transparent, and accessible \u2014 yet for many people and businesses around the world, they remain fragmented, expensive, or difficult to manage. BukkaPay exists to change that.
        </Text>
        <Text style={[styles.bodyText, { marginTop: 12, marginBottom: 8 }]}>We are building financial tools that:</Text>
        {values.map((v, i) => (
          <View key={i} style={styles.valueRow}>
            <View style={styles.valueIconWrap}>
              <Ionicons name={v.icon} size={16} color="#7C3AED" />
            </View>
            <Text style={styles.valueText}>{v.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.missionCard}>
        <View style={styles.missionIconWrap}>
          <Ionicons name="rocket" size={24} color="#FFFFFF" />
        </View>
        <Text style={styles.missionLabel}>Our Mission</Text>
        <Text style={styles.missionText}>
          To provide secure, accessible, and affordable digital payment solutions that enable individuals and businesses worldwide to participate fully in the global economy.
        </Text>
      </View>

      <View style={styles.visionCard}>
        <View style={[styles.missionIconWrap, { backgroundColor: "#10B981" }]}>
          <Ionicons name="eye" size={24} color="#FFFFFF" />
        </View>
        <Text style={styles.missionLabel}>Our Vision</Text>
        <Text style={styles.missionText}>
          A world where money moves effortlessly, commerce is inclusive, and everyone has access to modern financial tools \u2014 regardless of location.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Who We Serve</Text>
        {audiences.map((a, i) => (
          <View key={i} style={styles.audienceRow}>
            <View style={styles.audienceDot} />
            <Text style={styles.audienceText}>{a}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Built for a Connected World</Text>
        <Text style={styles.bodyText}>
          BukkaPay is designed with a global-first approach \u2014 mobile-ready, scalable, and adaptable to different markets, currencies, and payment behaviors.
        </Text>
        <Text style={[styles.bodyText, { marginTop: 12 }]}>
          As commerce becomes increasingly digital and borderless, BukkaPay is committed to building the infrastructure that powers everyday transactions around the world.
        </Text>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingHorizontal: 24 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 48, paddingBottom: 16 },
  backButton: { padding: 8, borderRadius: 20 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },

  heroSection: { alignItems: "center", paddingVertical: 28, marginBottom: 8 },
  heroLogo: { width: 72, height: 72, borderRadius: 18, marginBottom: 12 },
  heroTitle: { fontSize: 28, fontWeight: "800", color: "#001A72", marginBottom: 6 },
  heroTagline: { fontSize: 15, color: "#6B7280", textAlign: "center", fontStyle: "italic" },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E", marginBottom: 12 },
  bodyText: { fontSize: 14, color: "#374151", lineHeight: 22 },

  featureCard: { flexDirection: "row", gap: 14, backgroundColor: "#F8F9FA", borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: "#F0F0F0" },
  featureIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(124,58,237,0.1)", alignItems: "center", justifyContent: "center" },
  featureTitle: { fontSize: 15, fontWeight: "700", color: "#1A1A2E", marginBottom: 4 },
  featureDesc: { fontSize: 13, color: "#6B7280", lineHeight: 19 },

  highlightBox: { backgroundColor: "rgba(124,58,237,0.06)", borderLeftWidth: 3, borderLeftColor: "#7C3AED", borderRadius: 8, padding: 16, marginBottom: 24 },
  highlightText: { fontSize: 14, color: "#374151", lineHeight: 22, fontStyle: "italic" },

  valueRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  valueIconWrap: { width: 30, height: 30, borderRadius: 8, backgroundColor: "rgba(124,58,237,0.1)", alignItems: "center", justifyContent: "center" },
  valueText: { fontSize: 14, color: "#374151", flex: 1 },

  missionCard: { backgroundColor: "#7C3AED", borderRadius: 16, padding: 24, alignItems: "center", marginBottom: 16 },
  visionCard: { backgroundColor: "#001A72", borderRadius: 16, padding: 24, alignItems: "center", marginBottom: 24 },
  missionIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  missionLabel: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.7)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 },
  missionText: { fontSize: 14, color: "#FFFFFF", lineHeight: 22, textAlign: "center" },

  audienceRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  audienceDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#7C3AED" },
  audienceText: { fontSize: 14, color: "#374151" },
});
