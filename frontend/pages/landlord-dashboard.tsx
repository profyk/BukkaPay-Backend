import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, ActivityIndicator, Modal, Share } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "../hooks/use-toast";
import { apiRequest, queryClient } from "../lib/queryClient";
import * as Clipboard from "expo-clipboard";
import { API_BASE } from "../lib/config";

interface Property {
  id: string;
  name: string;
  address: string;
  propertyType: string;
  totalUnits: number;
  isActive: boolean;
  createdAt: string;
}

interface PropertyUnit {
  id: string;
  propertyId: string;
  unitNumber: string;
  monthlyRent: string;
  isOccupied: boolean;
}

interface TenantDetail {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  propertyName: string;
  unitId: string;
  unitNumber: string;
  monthlyRent: number;
  amountPaid: number;
  status: 'unpaid' | 'partial' | 'paid';
}

interface DashboardData {
  totalProperties: number;
  totalTenants: number;
  totalIncome: number;
  unpaidCount: number;
  partialCount: number;
  paidCount: number;
  properties: Property[];
  tenants: TenantDetail[];
}

interface Merchant {
  id: string;
  businessName: string;
  businessType: string;
}

export default function LandlordDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [addPropertyOpen, setAddPropertyOpen] = useState(false);
  const [addUnitOpen, setAddUnitOpen] = useState(false);
  const [addTenantOpen, setAddTenantOpen] = useState(false);
  const [requestPaymentOpen, setRequestPaymentOpen] = useState(false);
  const [selectedTenantForPayment, setSelectedTenantForPayment] = useState<TenantDetail | null>(null);
  const [generatedPaymentLink, setGeneratedPaymentLink] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"tenants" | "properties">("tenants");
  const [addUnitPropertyId, setAddUnitPropertyId] = useState<string | null>(null);
  const [addUnitPropertyName, setAddUnitPropertyName] = useState("");

  const [newProperty, setNewProperty] = useState({
    name: "",
    address: "",
    propertyType: "apartment",
    totalUnits: 1,
    merchantId: "",
  });

  const [newUnit, setNewUnit] = useState({
    unitNumber: "",
    monthlyRent: "",
  });

  const [newTenant, setNewTenant] = useState({
    name: "",
    email: "",
    phone: "",
    propertyId: "",
    unitId: "",
  });

  const { data: dashboard, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/rental/dashboard"],
  });

  const { data: merchants } = useQuery<Merchant[]>({
    queryKey: ["/api/merchants"],
  });

  const { data: units } = useQuery<PropertyUnit[]>({
    queryKey: ["/api/rental/properties", selectedProperty, "units"],
    enabled: !!selectedProperty,
  });

  const propertyMerchants = merchants?.filter(m => m.businessType.toLowerCase() === "property") || [];

  const createPropertyMutation = useMutation({
    mutationFn: async (data: typeof newProperty) => {
      return apiRequest("POST", "/api/rental/properties", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rental/dashboard"] });
      setAddPropertyOpen(false);
      setNewProperty({ name: "", address: "", propertyType: "apartment", totalUnits: 1, merchantId: "" });
      toast({ title: "Property added successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add property", description: error.message, variant: "destructive" });
    },
  });

  const createUnitMutation = useMutation({
    mutationFn: async (data: typeof newUnit) => {
      return apiRequest("POST", `/api/rental/properties/${addUnitPropertyId || selectedProperty}/units`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rental/properties", addUnitPropertyId || selectedProperty, "units"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rental/dashboard"] });
      setAddUnitOpen(false);
      setNewUnit({ unitNumber: "", monthlyRent: "" });
      toast({ title: "Unit added successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add unit", description: error.message, variant: "destructive" });
    },
  });

  const createTenantMutation = useMutation({
    mutationFn: async (data: typeof newTenant) => {
      return apiRequest("POST", "/api/rental/tenants", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rental/dashboard"] });
      setAddTenantOpen(false);
      setNewTenant({ name: "", email: "", phone: "", propertyId: "", unitId: "" });
      toast({ title: "Tenant added successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add tenant", description: error.message, variant: "destructive" });
    },
  });

  const createPaymentLinkMutation = useMutation({
    mutationFn: async (data: { tenantId: string; amount: number; rentMonth?: string }) => {
      return apiRequest("POST", "/api/rental/payment-links", data);
    },
    onSuccess: async (response: any) => {
      const data = await response.json();
      const fullLink = `${API_BASE}${data.shareableLink}`;
      setGeneratedPaymentLink(fullLink);
      toast({ title: "Payment link generated!" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to generate payment link", description: error.message, variant: "destructive" });
    },
  });

  const handleRequestPayment = (tenant: TenantDetail) => {
    setSelectedTenantForPayment(tenant);
    setGeneratedPaymentLink(null);
    setRequestPaymentOpen(true);
  };

  const generatePaymentLink = () => {
    if (!selectedTenantForPayment) return;
    const dueAmount = selectedTenantForPayment.monthlyRent - selectedTenantForPayment.amountPaid;
    if (dueAmount <= 0) {
      toast({ title: "No amount due", description: "This tenant has no outstanding balance", variant: "destructive" });
      return;
    }
    createPaymentLinkMutation.mutate({
      tenantId: selectedTenantForPayment.id,
      amount: dueAmount,
    });
  };

  const copyPaymentLink = async () => {
    if (generatedPaymentLink) {
      await Clipboard.setStringAsync(generatedPaymentLink);
      toast({ title: "Payment link copied!" });
    }
  };

  const sharePaymentLink = async () => {
    if (!generatedPaymentLink || !selectedTenantForPayment) return;
    try {
      await Share.share({
        message: `Hi ${selectedTenantForPayment.name}, please pay your rent of $${(selectedTenantForPayment.monthlyRent - selectedTenantForPayment.amountPaid).toFixed(2)} via this link: ${generatedPaymentLink}`,
      });
    } catch {
      copyPaymentLink();
    }
  };

  const copyTenantId = async (tenantId: string) => {
    await Clipboard.setStringAsync(tenantId);
    toast({ title: "Tenant ID copied!" });
  };

  const vacantUnits = units?.filter(u => !u.isOccupied) || [];

  const propertyTypes = [
    { value: "apartment", label: "Apartment" },
    { value: "house", label: "House" },
    { value: "condo", label: "Condo" },
    { value: "commercial", label: "Commercial" },
  ];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerSimple}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Landlord Dashboard</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.subtitleText}>Manage your properties and tenants</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statRow}>
              <Ionicons name="business" size={24} color="#7C3AED" />
              <View>
                <Text style={styles.statValue}>{dashboard?.totalProperties || 0}</Text>
                <Text style={styles.statLabel}>Properties</Text>
              </View>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statRow}>
              <Ionicons name="people" size={24} color="#3B82F6" />
              <View>
                <Text style={styles.statValue}>{dashboard?.totalTenants || 0}</Text>
                <Text style={styles.statLabel}>Tenants</Text>
              </View>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statRow}>
              <Ionicons name="cash" size={24} color="#10B981" />
              <View>
                <Text style={styles.statValue}>${(dashboard?.totalIncome || 0).toFixed(2)}</Text>
                <Text style={styles.statLabel}>Total Income</Text>
              </View>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statusList}>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: "#10B981" }]} />
                <Text style={styles.statusText}>{dashboard?.paidCount || 0} Paid</Text>
              </View>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: "#F59E0B" }]} />
                <Text style={styles.statusText}>{dashboard?.partialCount || 0} Partial</Text>
              </View>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: "#EF4444" }]} />
                <Text style={styles.statusText}>{dashboard?.unpaidCount || 0} Unpaid</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "tenants" && styles.tabActive]}
            onPress={() => setActiveTab("tenants")}
          >
            <Text style={[styles.tabText, activeTab === "tenants" && styles.tabTextActive]}>Tenants</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "properties" && styles.tabActive]}
            onPress={() => setActiveTab("properties")}
          >
            <Text style={[styles.tabText, activeTab === "properties" && styles.tabTextActive]}>Properties</Text>
          </TouchableOpacity>
        </View>

        {activeTab === "tenants" && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tenant Management</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => setAddTenantOpen(true)}>
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add Tenant</Text>
              </TouchableOpacity>
            </View>

            {dashboard?.tenants.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No tenants yet. Add a property and unit first, then add tenants.</Text>
              </View>
            )}

            {dashboard?.tenants.map((tenant) => {
              const statusColor = tenant.status === 'paid' ? '#10B981' : tenant.status === 'partial' ? '#F59E0B' : '#EF4444';
              const statusLabel = tenant.status === 'paid' ? 'Paid' : tenant.status === 'partial' ? 'Partial' : 'Unpaid';

              return (
                <View key={tenant.id} style={styles.tenantCard}>
                  <View style={styles.tenantHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.tenantNameRow}>
                        <Text style={styles.tenantName}>{tenant.name}</Text>
                        <View style={[styles.badge, { backgroundColor: statusColor }]}>
                          <Text style={styles.badgeText}>{statusLabel}</Text>
                        </View>
                      </View>
                      <View style={styles.tenantIdRow}>
                        <Text style={styles.tenantIdText}>ID: {tenant.tenantId}</Text>
                        <TouchableOpacity onPress={() => copyTenantId(tenant.tenantId)}>
                          <Ionicons name="copy" size={12} color="#6B7280" />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.tenantProperty}>{tenant.propertyName} - Unit {tenant.unitNumber}</Text>
                    </View>
                    <View style={styles.tenantRightCol}>
                      <Text style={styles.tenantRentLabel}>Rent: <Text style={styles.tenantRentValue}>${tenant.monthlyRent.toFixed(2)}</Text></Text>
                      <Text style={styles.tenantRentLabel}>Paid: <Text style={[styles.tenantRentValue, { color: "#10B981" }]}>${tenant.amountPaid.toFixed(2)}</Text></Text>
                      {tenant.status !== 'paid' && (
                        <Text style={styles.tenantRentLabel}>Due: <Text style={[styles.tenantRentValue, { color: "#EF4444" }]}>${(tenant.monthlyRent - tenant.amountPaid).toFixed(2)}</Text></Text>
                      )}
                      {tenant.status !== 'paid' && (
                        <TouchableOpacity style={styles.requestPayButton} onPress={() => handleRequestPayment(tenant)}>
                          <Ionicons name="send" size={12} color="#7C3AED" />
                          <Text style={styles.requestPayText}>Request Payment</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {activeTab === "properties" && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Property Management</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => setAddPropertyOpen(true)}>
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add Property</Text>
              </TouchableOpacity>
            </View>

            {dashboard?.properties.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No properties yet. Create a Property merchant account first, then add properties.</Text>
              </View>
            )}

            {dashboard?.properties.map((property) => (
              <View key={property.id} style={styles.propertyCard}>
                <View style={styles.propertyRow}>
                  <View style={styles.propertyIconBox}>
                    <Ionicons name="home" size={20} color="#7C3AED" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.propertyName}>{property.name}</Text>
                    <Text style={styles.propertyAddress}>{property.address || "No address"}</Text>
                    <View style={styles.propertyTypeBadge}>
                      <Text style={styles.propertyTypeText}>{property.propertyType}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.addUnitButton}
                    onPress={() => {
                      setAddUnitPropertyId(property.id);
                      setAddUnitPropertyName(property.name);
                      setSelectedProperty(property.id);
                      setAddUnitOpen(true);
                    }}
                  >
                    <Ionicons name="add" size={14} color="#7C3AED" />
                    <Text style={styles.addUnitText}>Add Unit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 100 }} />
      </View>

      <Modal visible={addTenantOpen} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={styles.container}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAddTenantOpen(false)}>
              <Ionicons name="close" size={24} color="#1A1A2E" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Tenant</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.body}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              placeholder="Tenant name"
              placeholderTextColor="#6B7280"
              value={newTenant.name}
              onChangeText={(v) => setNewTenant({ ...newTenant, name: v })}
              style={styles.textInput}
            />

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Email</Text>
            <TextInput
              placeholder="tenant@email.com"
              placeholderTextColor="#6B7280"
              value={newTenant.email}
              onChangeText={(v) => setNewTenant({ ...newTenant, email: v })}
              keyboardType="email-address"
              style={styles.textInput}
            />

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Phone</Text>
            <TextInput
              placeholder="+1234567890"
              placeholderTextColor="#6B7280"
              value={newTenant.phone}
              onChangeText={(v) => setNewTenant({ ...newTenant, phone: v })}
              keyboardType="phone-pad"
              style={styles.textInput}
            />

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Property</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {dashboard?.properties.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.selectChip, newTenant.propertyId === p.id && styles.selectChipActive]}
                  onPress={() => {
                    setNewTenant({ ...newTenant, propertyId: p.id, unitId: "" });
                    setSelectedProperty(p.id);
                  }}
                >
                  <Text style={[styles.selectChipText, newTenant.propertyId === p.id && styles.selectChipTextActive]}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {newTenant.propertyId ? (
              <>
                <Text style={[styles.inputLabel, { marginTop: 16 }]}>Unit</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                  {vacantUnits.map((u) => (
                    <TouchableOpacity
                      key={u.id}
                      style={[styles.selectChip, newTenant.unitId === u.id && styles.selectChipActive]}
                      onPress={() => setNewTenant({ ...newTenant, unitId: u.id })}
                    >
                      <Text style={[styles.selectChipText, newTenant.unitId === u.id && styles.selectChipTextActive]}>
                        {u.unitNumber} - ${u.monthlyRent}/mo
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryButton, createTenantMutation.isPending && { opacity: 0.5 }]}
              onPress={() => createTenantMutation.mutate(newTenant)}
              disabled={createTenantMutation.isPending}
            >
              <Text style={styles.primaryButtonText}>
                {createTenantMutation.isPending ? "Adding..." : "Add Tenant"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>

      <Modal visible={addPropertyOpen} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={styles.container}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAddPropertyOpen(false)}>
              <Ionicons name="close" size={24} color="#1A1A2E" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Property</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.body}>
            <Text style={styles.inputLabel}>Merchant Account</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {propertyMerchants.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.selectChip, newProperty.merchantId === m.id && styles.selectChipActive]}
                  onPress={() => setNewProperty({ ...newProperty, merchantId: m.id })}
                >
                  <Text style={[styles.selectChipText, newProperty.merchantId === m.id && styles.selectChipTextActive]}>
                    {m.businessName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {propertyMerchants.length === 0 && (
              <Text style={styles.hintText}>You need a Property type merchant account first</Text>
            )}

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Property Name</Text>
            <TextInput
              placeholder="e.g., Sunrise Apartments"
              placeholderTextColor="#6B7280"
              value={newProperty.name}
              onChangeText={(v) => setNewProperty({ ...newProperty, name: v })}
              style={styles.textInput}
            />

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Address</Text>
            <TextInput
              placeholder="123 Main St, City"
              placeholderTextColor="#6B7280"
              value={newProperty.address}
              onChangeText={(v) => setNewProperty({ ...newProperty, address: v })}
              style={styles.textInput}
            />

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Property Type</Text>
            <View style={styles.propertyTypeRow}>
              {propertyTypes.map((pt) => (
                <TouchableOpacity
                  key={pt.value}
                  style={[styles.selectChip, newProperty.propertyType === pt.value && styles.selectChipActive]}
                  onPress={() => setNewProperty({ ...newProperty, propertyType: pt.value })}
                >
                  <Text style={[styles.selectChipText, newProperty.propertyType === pt.value && styles.selectChipTextActive]}>
                    {pt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, (createPropertyMutation.isPending || !newProperty.merchantId) && { opacity: 0.5 }]}
              onPress={() => createPropertyMutation.mutate(newProperty)}
              disabled={createPropertyMutation.isPending || !newProperty.merchantId}
            >
              <Text style={styles.primaryButtonText}>
                {createPropertyMutation.isPending ? "Creating..." : "Create Property"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>

      <Modal visible={addUnitOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.container}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAddUnitOpen(false)}>
              <Ionicons name="close" size={24} color="#1A1A2E" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Unit to {addUnitPropertyName}</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.body}>
            <Text style={styles.inputLabel}>Unit Number</Text>
            <TextInput
              placeholder="e.g., 101, A1, Ground Floor"
              placeholderTextColor="#6B7280"
              value={newUnit.unitNumber}
              onChangeText={(v) => setNewUnit({ ...newUnit, unitNumber: v })}
              style={styles.textInput}
            />

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Monthly Rent ($)</Text>
            <TextInput
              placeholder="1000"
              placeholderTextColor="#6B7280"
              value={newUnit.monthlyRent}
              onChangeText={(v) => setNewUnit({ ...newUnit, monthlyRent: v })}
              keyboardType="numeric"
              style={styles.textInput}
            />

            <TouchableOpacity
              style={[styles.primaryButton, createUnitMutation.isPending && { opacity: 0.5 }]}
              onPress={() => createUnitMutation.mutate(newUnit)}
              disabled={createUnitMutation.isPending}
            >
              <Text style={styles.primaryButtonText}>
                {createUnitMutation.isPending ? "Adding..." : "Add Unit"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={requestPaymentOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.container}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setRequestPaymentOpen(false)}>
              <Ionicons name="close" size={24} color="#1A1A2E" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Request Rent Payment</Text>
            <View style={{ width: 24 }} />
          </View>

          {selectedTenantForPayment && (
            <View style={styles.body}>
              <View style={styles.paymentInfoCard}>
                <Text style={styles.paymentInfoName}>{selectedTenantForPayment.name}</Text>
                <Text style={styles.paymentInfoSub}>
                  {selectedTenantForPayment.propertyName} - Unit {selectedTenantForPayment.unitNumber}
                </Text>
                <View style={styles.paymentInfoAmountRow}>
                  <Text style={styles.paymentInfoLabel}>Amount Due:</Text>
                  <Text style={styles.paymentInfoAmount}>
                    ${(selectedTenantForPayment.monthlyRent - selectedTenantForPayment.amountPaid).toFixed(2)}
                  </Text>
                </View>
              </View>

              {!generatedPaymentLink ? (
                <TouchableOpacity
                  style={[styles.primaryButton, createPaymentLinkMutation.isPending && { opacity: 0.5 }]}
                  onPress={generatePaymentLink}
                  disabled={createPaymentLinkMutation.isPending}
                >
                  <Text style={styles.primaryButtonText}>
                    {createPaymentLinkMutation.isPending ? "Generating..." : "Generate Payment Link"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View>
                  <View style={styles.linkGeneratedCard}>
                    <Text style={styles.linkGeneratedTitle}>Payment Link Generated!</Text>
                    <Text style={styles.linkGeneratedUrl}>{generatedPaymentLink}</Text>
                  </View>

                  <View style={styles.linkButtonsRow}>
                    <TouchableOpacity style={styles.outlineButton} onPress={copyPaymentLink}>
                      <Ionicons name="copy" size={16} color="#7C3AED" />
                      <Text style={styles.outlineButtonText}> Copy Link</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.primaryButtonSmall} onPress={sharePaymentLink}>
                      <Ionicons name="share-social" size={16} color="#FFFFFF" />
                      <Text style={styles.primaryButtonSmallText}> Share</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.hintText}>
                    Send this link to your tenant via WhatsApp, SMS, or email. They can pay even if they don't have BukkaPay yet.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
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
  subtitleText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  statusList: {
    gap: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 12,
    color: "#1A1A2E",
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
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 6,
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#7C3AED",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emptyCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  tenantCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 8,
  },
  tenantHeader: {
    flexDirection: "row",
    gap: 12,
  },
  tenantNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  tenantName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  tenantIdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  tenantIdText: {
    fontSize: 12,
    color: "#6B7280",
  },
  tenantProperty: {
    fontSize: 14,
    color: "#6B7280",
  },
  tenantRightCol: {
    alignItems: "flex-end",
  },
  tenantRentLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  tenantRentValue: {
    fontWeight: "600",
    color: "#1A1A2E",
  },
  requestPayButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#7C3AED",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  requestPayText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7C3AED",
  },
  propertyCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 8,
  },
  propertyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  propertyIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(124,58,237,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  propertyName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  propertyAddress: {
    fontSize: 14,
    color: "#6B7280",
  },
  propertyTypeBadge: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  propertyTypeText: {
    fontSize: 12,
    color: "#6B7280",
  },
  addUnitButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addUnitText: {
    fontSize: 12,
    color: "#7C3AED",
    fontWeight: "600",
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
  selectChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginRight: 8,
  },
  selectChipActive: {
    borderColor: "#7C3AED",
    backgroundColor: "rgba(124,58,237,0.1)",
  },
  selectChipText: {
    fontSize: 14,
    color: "#1A1A2E",
  },
  selectChipTextActive: {
    color: "#7C3AED",
    fontWeight: "600",
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
  hintText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
  },
  propertyTypeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  paymentInfoCard: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  paymentInfoName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  paymentInfoSub: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  paymentInfoAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  paymentInfoLabel: {
    fontSize: 14,
    color: "#1A1A2E",
  },
  paymentInfoAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#EF4444",
  },
  linkGeneratedCard: {
    backgroundColor: "rgba(16,185,129,0.1)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  linkGeneratedTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
    marginBottom: 8,
  },
  linkGeneratedUrl: {
    fontSize: 12,
    color: "#6B7280",
  },
  linkButtonsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  outlineButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    height: 44,
  },
  outlineButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7C3AED",
  },
  primaryButtonSmall: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    height: 44,
  },
  primaryButtonSmallText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
