import { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Modal, Share, Alert, Dimensions, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { API_BASE } from "../lib/config";
import { getAuthHeader } from "../lib/auth";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Merchant {
  id: string;
  businessName: string;
  businessType: string;
  businessCategory?: string;
  qrCode: string;
  paymentLink: string;
  walletBalance: string;
  isActive: boolean;
  dailyLimit: string;
  createdAt: string;
}

interface MerchantTransaction {
  id: string;
  merchantId: string;
  payerId?: string;
  payerName?: string;
  amount: string;
  type: string;
  status: string;
  reference?: string;
  createdAt: string;
}

interface Analytics {
  summary: {
    todayRevenue: number;
    todayCount: number;
    weekRevenue: number;
    weekCount: number;
    monthRevenue: number;
    monthCount: number;
    totalRevenue: number;
    totalCount: number;
    avgTransaction: number;
    revenueGrowth: number;
  };
  customers: {
    total: number;
    thisMonth: number;
    topCustomers: { name: string; total: number; count: number }[];
  };
  dailyChart: { date: string; amount: number; count: number }[];
  statusBreakdown: { completed: number; pending: number; failed: number };
  dailyLimit: { limit: number; used: number; remaining: number; percentUsed: number };
}

type TabKey = "overview" | "transactions" | "customers";

export default function MerchantDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [refreshing, setRefreshing] = useState(false);

  const { data: merchants = [], isLoading } = useQuery<Merchant[]>({
    queryKey: ["/api/merchants"],
  });

  const selectedMerchant = merchants.find(m => m.id === selectedMerchantId) || merchants[0];

  useEffect(() => {
    if (merchants.length > 0 && !selectedMerchantId) {
      setSelectedMerchantId(merchants[0].id);
    }
  }, [merchants, selectedMerchantId]);

  const { data: transactions = [] } = useQuery<MerchantTransaction[]>({
    queryKey: ["/api/merchants", selectedMerchant?.id, "transactions"],
    enabled: !!selectedMerchant?.id,
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/merchants/${selectedMerchant?.id}/transactions`, {
        headers: await getAuthHeader(),
      });
      return res.json();
    },
  });

  const { data: analytics } = useQuery<Analytics>({
    queryKey: ["/api/merchants", selectedMerchant?.id, "analytics"],
    enabled: !!selectedMerchant?.id,
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/merchants/${selectedMerchant?.id}/analytics`, {
        headers: await getAuthHeader(),
      });
      return res.json();
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["/api/merchants"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/merchants", selectedMerchant?.id, "transactions"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/merchants", selectedMerchant?.id, "analytics"] }),
    ]);
    setRefreshing(false);
  }, [queryClient, selectedMerchant?.id]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (merchants.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.headerSimple}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Merchant Dashboard</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContent}>
          <View style={styles.emptyIcon}>
            <Ionicons name="storefront" size={40} color="#6B7280" />
          </View>
          <Text style={styles.emptyTitle}>No Businesses Yet</Text>
          <Text style={styles.emptySubtitle}>Create your first merchant account to start accepting payments</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/(screens)/become-merchant")}>
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}> Create Merchant Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const copyPaymentLink = async () => {
    const link = `${API_BASE}/merchant-pay/${selectedMerchant?.paymentLink}`;
    await Clipboard.setStringAsync(link);
    Alert.alert("Copied", "Payment link copied!");
  };

  const sharePaymentLink = async () => {
    const link = `${API_BASE}/merchant-pay/${selectedMerchant?.paymentLink}`;
    const text = `Pay ${selectedMerchant?.businessName} using BukkaPay: ${link}`;
    try {
      await Share.share({ message: text });
    } catch {
      await Clipboard.setStringAsync(link);
      Alert.alert("Copied", "Payment link copied!");
    }
  };

  const chartMax = analytics ? Math.max(...analytics.dailyChart.map(d => d.amount), 1) : 1;

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
    return `$${val.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    if (status === "completed") return "#10B981";
    if (status === "pending") return "#F59E0B";
    return "#EF4444";
  };

  const getStatusIcon = (status: string): keyof typeof Ionicons.glyphMap => {
    if (status === "completed") return "checkmark-circle";
    if (status === "pending") return "time";
    return "close-circle";
  };

  const getDayLabel = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en", { weekday: "short" });
  };

  const renderOverview = () => (
    <View>
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <View>
            <Text style={styles.balanceLabel}>Merchant Balance</Text>
            <Text style={styles.balanceValue}>
              ${parseFloat(selectedMerchant?.walletBalance || "0").toFixed(2)}
            </Text>
          </View>
          <View style={[styles.statusBadge, selectedMerchant?.isActive ? styles.statusActive : styles.statusInactive]}>
            <View style={[styles.statusDot, { backgroundColor: selectedMerchant?.isActive ? "#10B981" : "#EF4444" }]} />
            <Text style={[styles.statusText, { color: selectedMerchant?.isActive ? "#10B981" : "#EF4444" }]}>
              {selectedMerchant?.isActive ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>

        <View style={styles.balanceActions}>
          <TouchableOpacity style={styles.balanceBtn} onPress={() => setShowQRDialog(true)}>
            <Ionicons name="qr-code" size={16} color="#FFFFFF" />
            <Text style={styles.balanceBtnText}> Show QR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.balanceBtn} onPress={sharePaymentLink}>
            <Ionicons name="share-social" size={16} color="#FFFFFF" />
            <Text style={styles.balanceBtnText}> Share Link</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.balanceBtn} onPress={copyPaymentLink}>
            <Ionicons name="copy" size={16} color="#FFFFFF" />
            <Text style={styles.balanceBtnText}> Copy</Text>
          </TouchableOpacity>
        </View>
      </View>

      {analytics && (
        <>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: "rgba(124,58,237,0.1)" }]}>
                <Ionicons name="today" size={18} color="#7C3AED" />
              </View>
              <Text style={styles.statCardLabel}>Today</Text>
              <Text style={styles.statCardValue}>{formatCurrency(analytics.summary.todayRevenue)}</Text>
              <Text style={styles.statCardSub}>{analytics.summary.todayCount} transactions</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: "rgba(16,185,129,0.1)" }]}>
                <Ionicons name="trending-up" size={18} color="#10B981" />
              </View>
              <Text style={styles.statCardLabel}>This Week</Text>
              <Text style={styles.statCardValue}>{formatCurrency(analytics.summary.weekRevenue)}</Text>
              <Text style={styles.statCardSub}>{analytics.summary.weekCount} transactions</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: "rgba(59,130,246,0.1)" }]}>
                <Ionicons name="calendar" size={18} color="#3B82F6" />
              </View>
              <Text style={styles.statCardLabel}>This Month</Text>
              <Text style={styles.statCardValue}>{formatCurrency(analytics.summary.monthRevenue)}</Text>
              <Text style={styles.statCardSub}>{analytics.summary.monthCount} transactions</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: "rgba(245,158,11,0.1)" }]}>
                <Ionicons name="wallet" size={18} color="#F59E0B" />
              </View>
              <Text style={styles.statCardLabel}>All Time</Text>
              <Text style={styles.statCardValue}>{formatCurrency(analytics.summary.totalRevenue)}</Text>
              <Text style={styles.statCardSub}>{analytics.summary.totalCount} transactions</Text>
            </View>
          </View>

          {analytics.summary.revenueGrowth !== 0 && (
            <View style={styles.growthBanner}>
              <Ionicons
                name={analytics.summary.revenueGrowth > 0 ? "arrow-up-circle" : "arrow-down-circle"}
                size={20}
                color={analytics.summary.revenueGrowth > 0 ? "#10B981" : "#EF4444"}
              />
              <Text style={[styles.growthText, { color: analytics.summary.revenueGrowth > 0 ? "#10B981" : "#EF4444" }]}>
                {analytics.summary.revenueGrowth > 0 ? "+" : ""}{analytics.summary.revenueGrowth}% vs last month
              </Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>REVENUE (LAST 7 DAYS)</Text>
            <View style={styles.chartContainer}>
              {analytics.dailyChart.map((day, i) => {
                const barH = chartMax > 0 ? (day.amount / chartMax) * 100 : 0;
                return (
                  <View key={i} style={styles.chartBar}>
                    <Text style={styles.chartBarAmount}>{day.amount > 0 ? formatCurrency(day.amount) : ""}</Text>
                    <View style={styles.chartBarTrack}>
                      <View style={[styles.chartBarFill, { height: `${Math.max(barH, 2)}%` }]} />
                    </View>
                    <Text style={styles.chartBarLabel}>{getDayLabel(day.date)}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DAILY LIMIT</Text>
            <View style={styles.limitCard}>
              <View style={styles.limitRow}>
                <Text style={styles.limitLabel}>Used Today</Text>
                <Text style={styles.limitValue}>{formatCurrency(analytics.dailyLimit.used)} / {formatCurrency(analytics.dailyLimit.limit)}</Text>
              </View>
              <View style={styles.limitBarTrack}>
                <View style={[styles.limitBarFill, {
                  width: `${Math.min(analytics.dailyLimit.percentUsed, 100)}%`,
                  backgroundColor: analytics.dailyLimit.percentUsed > 80 ? "#EF4444" : analytics.dailyLimit.percentUsed > 50 ? "#F59E0B" : "#10B981",
                }]} />
              </View>
              <Text style={styles.limitRemaining}>
                {formatCurrency(analytics.dailyLimit.remaining)} remaining
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>QUICK INSIGHTS</Text>
            <View style={styles.insightsGrid}>
              <View style={styles.insightItem}>
                <Ionicons name="cash" size={20} color="#7C3AED" />
                <Text style={styles.insightLabel}>Avg Transaction</Text>
                <Text style={styles.insightValue}>{formatCurrency(analytics.summary.avgTransaction)}</Text>
              </View>
              <View style={styles.insightItem}>
                <Ionicons name="people" size={20} color="#3B82F6" />
                <Text style={styles.insightLabel}>Total Customers</Text>
                <Text style={styles.insightValue}>{analytics.customers.total}</Text>
              </View>
              <View style={styles.insightItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.insightLabel}>Success Rate</Text>
                <Text style={styles.insightValue}>
                  {analytics.statusBreakdown.completed + analytics.statusBreakdown.pending + analytics.statusBreakdown.failed > 0
                    ? Math.round((analytics.statusBreakdown.completed / (analytics.statusBreakdown.completed + analytics.statusBreakdown.pending + analytics.statusBreakdown.failed)) * 100)
                    : 100}%
                </Text>
              </View>
              <View style={styles.insightItem}>
                <Ionicons name="person-add" size={20} color="#F59E0B" />
                <Text style={styles.insightLabel}>New This Month</Text>
                <Text style={styles.insightValue}>{analytics.customers.thisMonth}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TRANSACTION STATUS</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusItem, { borderLeftColor: "#10B981" }]}>
                <Text style={styles.statusItemCount}>{analytics.statusBreakdown.completed}</Text>
                <Text style={styles.statusItemLabel}>Completed</Text>
              </View>
              <View style={[styles.statusItem, { borderLeftColor: "#F59E0B" }]}>
                <Text style={styles.statusItemCount}>{analytics.statusBreakdown.pending}</Text>
                <Text style={styles.statusItemLabel}>Pending</Text>
              </View>
              <View style={[styles.statusItem, { borderLeftColor: "#EF4444" }]}>
                <Text style={styles.statusItemCount}>{analytics.statusBreakdown.failed}</Text>
                <Text style={styles.statusItemLabel}>Failed</Text>
              </View>
            </View>
          </View>
        </>
      )}

      {selectedMerchant?.businessType.toLowerCase() === "property" && (
        <TouchableOpacity style={styles.landlordButton} onPress={() => router.push("/(screens)/landlord-dashboard")}>
          <Ionicons name="business" size={16} color="#7C3AED" />
          <Text style={styles.landlordButtonText}> Manage Properties & Tenants</Text>
        </TouchableOpacity>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MERCHANT INFO</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Business Type</Text>
            <Text style={styles.infoValue}>{selectedMerchant?.businessType.replace("_", " ")}</Text>
          </View>
          {selectedMerchant?.businessCategory && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoValue}>{selectedMerchant?.businessCategory}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>QR Code</Text>
            <Text style={styles.infoValueMono}>{selectedMerchant?.qrCode}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>{new Date(selectedMerchant?.createdAt || "").toLocaleDateString("en", { month: "short", year: "numeric" })}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderTransactions = () => (
    <View>
      {transactions.length === 0 ? (
        <View style={styles.emptyTransactions}>
          <Ionicons name="receipt-outline" size={40} color="#D1D5DB" />
          <Text style={styles.emptyTransactionsText}>No transactions yet</Text>
          <Text style={styles.emptyTransactionsSub}>Share your QR code or payment link to receive payments</Text>
        </View>
      ) : (
        transactions.map((tx) => (
          <View key={tx.id} style={styles.transactionItem}>
            <View style={[styles.txIcon, { backgroundColor: `${getStatusColor(tx.status)}15` }]}>
              <Ionicons name={getStatusIcon(tx.status)} size={18} color={getStatusColor(tx.status)} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.txName}>{tx.payerName || "Anonymous"}</Text>
              <View style={styles.txMeta}>
                <Text style={styles.txDate}>
                  {new Date(tx.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" })} at {new Date(tx.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
                {tx.reference && <Text style={styles.txRef}>Ref: {tx.reference}</Text>}
              </View>
            </View>
            <View style={styles.txRight}>
              <Text style={[styles.txAmount, { color: getStatusColor(tx.status) }]}>
                +${parseFloat(tx.amount).toFixed(2)}
              </Text>
              <View style={[styles.txStatusBadge, { backgroundColor: `${getStatusColor(tx.status)}15` }]}>
                <Text style={[styles.txStatusText, { color: getStatusColor(tx.status) }]}>{tx.status}</Text>
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderCustomers = () => (
    <View>
      {analytics && analytics.customers.topCustomers.length > 0 ? (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TOP CUSTOMERS</Text>
            {analytics.customers.topCustomers.map((customer, i) => (
              <View key={i} style={styles.customerItem}>
                <View style={styles.customerRank}>
                  <Text style={styles.customerRankText}>{i + 1}</Text>
                </View>
                <View style={styles.customerAvatar}>
                  <Text style={styles.customerAvatarText}>{customer.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.customerName}>{customer.name}</Text>
                  <Text style={styles.customerMeta}>{customer.count} payments</Text>
                </View>
                <Text style={styles.customerTotal}>{formatCurrency(customer.total)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CUSTOMER SUMMARY</Text>
            <View style={styles.customerSummaryGrid}>
              <View style={styles.customerSummaryCard}>
                <Ionicons name="people" size={24} color="#7C3AED" />
                <Text style={styles.customerSummaryValue}>{analytics.customers.total}</Text>
                <Text style={styles.customerSummaryLabel}>Total Customers</Text>
              </View>
              <View style={styles.customerSummaryCard}>
                <Ionicons name="person-add" size={24} color="#10B981" />
                <Text style={styles.customerSummaryValue}>{analytics.customers.thisMonth}</Text>
                <Text style={styles.customerSummaryLabel}>This Month</Text>
              </View>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.emptyTransactions}>
          <Ionicons name="people-outline" size={40} color="#D1D5DB" />
          <Text style={styles.emptyTransactionsText}>No customers yet</Text>
          <Text style={styles.emptyTransactionsSub}>Customers will appear here once they make payments</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerSimple}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.merchantSwitcher} onPress={() => setShowSwitcher(!showSwitcher)}>
          <Text style={styles.headerTitle} numberOfLines={1}>{selectedMerchant?.businessName}</Text>
          <Ionicons name={showSwitcher ? "chevron-up" : "chevron-down"} size={18} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push("/(screens)/become-merchant")}>
          <Ionicons name="add" size={24} color="#1A1A2E" />
        </TouchableOpacity>
      </View>

      {showSwitcher && (
        <View style={styles.switcherDropdown}>
          {merchants.map((merchant) => (
            <TouchableOpacity
              key={merchant.id}
              style={[styles.switcherItem, merchant.id === selectedMerchantId && styles.switcherItemActive]}
              onPress={() => { setSelectedMerchantId(merchant.id); setShowSwitcher(false); }}
            >
              <Ionicons name="storefront" size={18} color="#7C3AED" />
              <View style={{ flex: 1 }}>
                <Text style={styles.switcherName}>{merchant.businessName}</Text>
                <Text style={styles.switcherType}>{merchant.businessType.replace("_", " ")}</Text>
              </View>
              {merchant.id === selectedMerchantId && <View style={styles.activeDot} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.tabBar}>
        {([
          { key: "overview" as TabKey, label: "Overview", icon: "analytics" as keyof typeof Ionicons.glyphMap },
          { key: "transactions" as TabKey, label: "Transactions", icon: "receipt" as keyof typeof Ionicons.glyphMap },
          { key: "customers" as TabKey, label: "Customers", icon: "people" as keyof typeof Ionicons.glyphMap },
        ]).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons name={tab.icon} size={16} color={activeTab === tab.key ? "#7C3AED" : "#6B7280"} />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "overview" && renderOverview()}
        {activeTab === "transactions" && renderTransactions()}
        {activeTab === "customers" && renderCustomers()}
        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={showQRDialog} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ width: 24 }} />
              <Text style={styles.modalTitle}>{selectedMerchant?.businessName}</Text>
              <TouchableOpacity onPress={() => setShowQRDialog(false)}>
                <Ionicons name="close" size={24} color="#1A1A2E" />
              </TouchableOpacity>
            </View>
            <View style={styles.qrPlaceholder}>
              <Ionicons name="qr-code" size={120} color="#7C3AED" />
            </View>
            <Text style={styles.qrHint}>Scan to pay with BukkaPay</Text>
            <TouchableOpacity style={styles.outlineButton} onPress={copyPaymentLink}>
              <Ionicons name="copy" size={16} color="#7C3AED" />
              <Text style={styles.outlineButtonText}> Copy Payment Link</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showPaymentDialog} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ width: 24 }} />
              <Text style={styles.modalTitle}>Request Payment</Text>
              <TouchableOpacity onPress={() => setShowPaymentDialog(false)}>
                <Ionicons name="close" size={24} color="#1A1A2E" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.whatsappButton} onPress={sharePaymentLink}>
              <Ionicons name="chatbubble" size={18} color="#FFFFFF" />
              <Text style={styles.whatsappButtonText}> Share via WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.outlineButton} onPress={copyPaymentLink}>
              <Ionicons name="copy" size={18} color="#7C3AED" />
              <Text style={styles.outlineButtonText}> Copy Payment Link</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  loadingContainer: { flex: 1, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  headerSimple: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 48, paddingBottom: 12 },
  backButton: { padding: 8, borderRadius: 20 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E", maxWidth: 200 },
  merchantSwitcher: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1, justifyContent: "center" },

  tabBar: { flexDirection: "row", marginHorizontal: 20, backgroundColor: "#F3F4F6", borderRadius: 12, padding: 4, marginBottom: 8 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 10, borderRadius: 10 },
  tabActive: { backgroundColor: "#FFFFFF", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 12, fontWeight: "500", color: "#6B7280" },
  tabTextActive: { color: "#7C3AED", fontWeight: "600" },

  scrollBody: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },

  emptyContent: { alignItems: "center", paddingTop: 80, paddingHorizontal: 24 },
  emptyIcon: { width: 80, height: 80, backgroundColor: "#F3F4F6", borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#1A1A2E", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#6B7280", textAlign: "center", marginBottom: 24 },

  switcherDropdown: { marginHorizontal: 20, backgroundColor: "#F8F9FA", borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", overflow: "hidden", marginBottom: 8 },
  switcherItem: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12 },
  switcherItemActive: { backgroundColor: "rgba(124,58,237,0.05)" },
  switcherName: { fontSize: 14, fontWeight: "500", color: "#1A1A2E" },
  switcherType: { fontSize: 12, color: "#6B7280", textTransform: "capitalize" },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#7C3AED" },

  balanceCard: { backgroundColor: "#7C3AED", borderRadius: 16, padding: 20, marginBottom: 16 },
  balanceHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  balanceLabel: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 4 },
  balanceValue: { fontSize: 32, fontWeight: "700", color: "#FFFFFF" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusActive: { backgroundColor: "rgba(16,185,129,0.15)" },
  statusInactive: { backgroundColor: "rgba(239,68,68,0.15)" },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: "600" },
  balanceActions: { flexDirection: "row", gap: 8 },
  balanceBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 10, paddingVertical: 10 },
  balanceBtnText: { fontSize: 12, fontWeight: "600", color: "#FFFFFF" },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  statCard: { width: (SCREEN_WIDTH - 50) / 2, backgroundColor: "#F8F9FA", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#F0F0F0" },
  statIconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  statCardLabel: { fontSize: 12, color: "#6B7280", marginBottom: 2 },
  statCardValue: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
  statCardSub: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },

  growthBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F0FDF4", borderRadius: 10, padding: 12, marginBottom: 16 },
  growthText: { fontSize: 14, fontWeight: "600" },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: "700", color: "#9CA3AF", letterSpacing: 1, marginBottom: 10 },

  chartContainer: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 140, backgroundColor: "#F8F9FA", borderRadius: 12, padding: 12, paddingBottom: 4, borderWidth: 1, borderColor: "#F0F0F0" },
  chartBar: { flex: 1, alignItems: "center", gap: 4 },
  chartBarAmount: { fontSize: 8, color: "#7C3AED", fontWeight: "600" },
  chartBarTrack: { width: 20, height: 80, backgroundColor: "#E5E7EB", borderRadius: 4, overflow: "hidden", justifyContent: "flex-end" },
  chartBarFill: { width: "100%", backgroundColor: "#7C3AED", borderRadius: 4, minHeight: 2 },
  chartBarLabel: { fontSize: 10, color: "#6B7280", fontWeight: "500" },

  limitCard: { backgroundColor: "#F8F9FA", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#F0F0F0" },
  limitRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  limitLabel: { fontSize: 13, color: "#6B7280" },
  limitValue: { fontSize: 13, fontWeight: "600", color: "#1A1A2E" },
  limitBarTrack: { height: 8, backgroundColor: "#E5E7EB", borderRadius: 4, overflow: "hidden", marginBottom: 8 },
  limitBarFill: { height: "100%", borderRadius: 4 },
  limitRemaining: { fontSize: 12, color: "#6B7280" },

  insightsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  insightItem: { width: (SCREEN_WIDTH - 50) / 2, backgroundColor: "#F8F9FA", borderRadius: 12, padding: 14, alignItems: "center", borderWidth: 1, borderColor: "#F0F0F0" },
  insightLabel: { fontSize: 11, color: "#6B7280", marginTop: 6, marginBottom: 2 },
  insightValue: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },

  statusRow: { flexDirection: "row", gap: 10 },
  statusItem: { flex: 1, backgroundColor: "#F8F9FA", borderRadius: 10, padding: 14, borderLeftWidth: 3, borderWidth: 1, borderColor: "#F0F0F0" },
  statusItemCount: { fontSize: 20, fontWeight: "700", color: "#1A1A2E", marginBottom: 2 },
  statusItemLabel: { fontSize: 11, color: "#6B7280" },

  infoCard: { backgroundColor: "#F8F9FA", borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "#F0F0F0" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  infoLabel: { fontSize: 13, color: "#6B7280" },
  infoValue: { fontSize: 13, fontWeight: "500", color: "#1A1A2E", textTransform: "capitalize" },
  infoValueMono: { fontSize: 12, fontWeight: "500", color: "#7C3AED", fontFamily: "monospace" },

  landlordButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingVertical: 14, marginBottom: 16 },
  landlordButtonText: { fontSize: 14, fontWeight: "600", color: "#7C3AED" },

  transactionItem: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#F8F9FA", borderRadius: 12, borderWidth: 1, borderColor: "#F0F0F0", padding: 14, marginBottom: 8 },
  txIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  txName: { fontSize: 14, fontWeight: "600", color: "#1A1A2E" },
  txMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  txDate: { fontSize: 11, color: "#6B7280" },
  txRef: { fontSize: 11, color: "#9CA3AF" },
  txRight: { alignItems: "flex-end", gap: 4 },
  txAmount: { fontSize: 16, fontWeight: "700" },
  txStatusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  txStatusText: { fontSize: 10, fontWeight: "600", textTransform: "capitalize" },

  customerItem: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#F8F9FA", borderRadius: 12, borderWidth: 1, borderColor: "#F0F0F0", padding: 14, marginBottom: 8 },
  customerRank: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#7C3AED", alignItems: "center", justifyContent: "center" },
  customerRankText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },
  customerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#E0D7F8", alignItems: "center", justifyContent: "center" },
  customerAvatarText: { fontSize: 16, fontWeight: "700", color: "#7C3AED" },
  customerName: { fontSize: 14, fontWeight: "600", color: "#1A1A2E" },
  customerMeta: { fontSize: 11, color: "#6B7280" },
  customerTotal: { fontSize: 16, fontWeight: "700", color: "#1A1A2E" },
  customerSummaryGrid: { flexDirection: "row", gap: 10 },
  customerSummaryCard: { flex: 1, backgroundColor: "#F8F9FA", borderRadius: 12, padding: 20, alignItems: "center", borderWidth: 1, borderColor: "#F0F0F0" },
  customerSummaryValue: { fontSize: 28, fontWeight: "700", color: "#1A1A2E", marginVertical: 4 },
  customerSummaryLabel: { fontSize: 12, color: "#6B7280" },

  emptyTransactions: { backgroundColor: "#F8F9FA", borderRadius: 12, borderWidth: 1, borderColor: "#F0F0F0", padding: 40, alignItems: "center" },
  emptyTransactionsText: { fontSize: 15, color: "#6B7280", fontWeight: "600", marginTop: 12 },
  emptyTransactionsSub: { fontSize: 12, color: "#9CA3AF", marginTop: 4, textAlign: "center" },

  primaryButton: { backgroundColor: "#7C3AED", borderRadius: 12, height: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  outlineButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, height: 48, marginBottom: 12 },
  outlineButtonText: { fontSize: 14, fontWeight: "600", color: "#7C3AED" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
  qrPlaceholder: { alignItems: "center", paddingVertical: 24 },
  qrHint: { fontSize: 14, color: "#6B7280", textAlign: "center", marginBottom: 16 },
  whatsappButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#25D366", borderRadius: 12, height: 48, marginBottom: 12 },
  whatsappButtonText: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
});
