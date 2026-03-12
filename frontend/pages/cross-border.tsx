import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useToast } from "../hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { fetchCards } from "../lib/api";
import { mapCardFromAPI } from "../lib/mappers";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Country {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  rate: number;
}

const countries: Country[] = [
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", currency: "GBP", currencySymbol: "£", rate: 0.79 },
  { code: "EU", name: "European Union", flag: "🇪🇺", currency: "EUR", currencySymbol: "€", rate: 0.92 },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", currency: "NGN", currencySymbol: "₦", rate: 1550.00 },
  { code: "KE", name: "Kenya", flag: "🇰🇪", currency: "KES", currencySymbol: "KSh", rate: 153.50 },
  { code: "GH", name: "Ghana", flag: "🇬🇭", currency: "GHS", currencySymbol: "₵", rate: 15.20 },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", currency: "ZAR", currencySymbol: "R", rate: 18.75 },
  { code: "IN", name: "India", flag: "🇮🇳", currency: "INR", currencySymbol: "₹", rate: 83.50 },
  { code: "PH", name: "Philippines", flag: "🇵🇭", currency: "PHP", currencySymbol: "₱", rate: 56.80 },
  { code: "MX", name: "Mexico", flag: "🇲🇽", currency: "MXN", currencySymbol: "$", rate: 17.25 },
  { code: "CA", name: "Canada", flag: "🇨🇦", currency: "CAD", currencySymbol: "C$", rate: 1.36 },
  { code: "AU", name: "Australia", flag: "🇦🇺", currency: "AUD", currencySymbol: "A$", rate: 1.53 },
  { code: "JP", name: "Japan", flag: "🇯🇵", currency: "JPY", currencySymbol: "¥", rate: 154.50 },
  { code: "CN", name: "China", flag: "🇨🇳", currency: "CNY", currencySymbol: "¥", rate: 7.24 },
  { code: "BR", name: "Brazil", flag: "🇧🇷", currency: "BRL", currencySymbol: "R$", rate: 5.05 },
  { code: "AE", name: "UAE", flag: "🇦🇪", currency: "AED", currencySymbol: "د.إ", rate: 3.67 },
];

const deliveryMethods = [
  { id: "bank", name: "Bank Transfer", icon: "business" as const, time: "1-2 business days", fee: 2.99 },
  { id: "mobile", name: "Mobile Money", icon: "card" as const, time: "Instant", fee: 1.99 },
  { id: "cash", name: "Cash Pickup", icon: "person" as const, time: "Ready in minutes", fee: 4.99 },
];

type Step = "country" | "amount" | "recipient" | "delivery" | "review" | "success";

export default function CrossBorder() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("country");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [sendAmount, setSendAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientAccount, setRecipientAccount] = useState("");
  const [recipientBank, setRecipientBank] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("bank");
  const [pin, setPin] = useState("");
  const { toast } = useToast();

  const { data: cards } = useQuery({
    queryKey: ["cards"],
    queryFn: fetchCards,
  });

  const mappedCards = cards?.map(mapCardFromAPI) || [];
  const primaryCard = mappedCards[0];

  const filteredCountries = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedDelivery = deliveryMethods.find((m) => m.id === deliveryMethod)!;
  const fee = selectedDelivery?.fee || 2.99;
  const totalAmount = parseFloat(sendAmount || "0") + fee;

  const handleSendAmountChange = (value: string) => {
    setSendAmount(value);
    if (selectedCountry && value) {
      const amount = parseFloat(value);
      if (!isNaN(amount)) {
        setReceiveAmount((amount * selectedCountry.rate).toFixed(2));
      }
    } else {
      setReceiveAmount("");
    }
  };

  const handleReceiveAmountChange = (value: string) => {
    setReceiveAmount(value);
    if (selectedCountry && value) {
      const amount = parseFloat(value);
      if (!isNaN(amount)) {
        setSendAmount((amount / selectedCountry.rate).toFixed(2));
      }
    } else {
      setSendAmount("");
    }
  };

  const handleConfirmTransfer = async () => {
    const storedPin = await AsyncStorage.getItem('wallet_pin') || '1234';
    if (pin !== storedPin) {
      toast({ title: "Error", description: "Invalid PIN", variant: "destructive" });
      setPin("");
      return;
    }
    setStep("success");
  };

  const resetTransfer = () => {
    setStep("country");
    setSelectedCountry(null);
    setSendAmount("");
    setReceiveAmount("");
    setRecipientName("");
    setRecipientAccount("");
    setRecipientBank("");
    setDeliveryMethod("bank");
    setPin("");
    setSearchQuery("");
  };

  if (step === "country") {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.headerBanner}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButtonWhite} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitleWhite}>Send Money Abroad</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.headerInfoRow}>
            <Ionicons name="globe" size={32} color="#FFFFFF" />
            <View>
              <Text style={styles.headerSubLabel}>Cross-Border Transfers</Text>
              <Text style={styles.headerSubValue}>Fast, secure international payments</Text>
            </View>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="rgba(255,255,255,0.6)" style={styles.searchIcon} />
            <TextInput
              placeholder="Search country..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.sectionLabel}>Select destination country</Text>
          {filteredCountries.map((country) => (
            <TouchableOpacity
              key={country.code}
              style={styles.countryCard}
              onPress={() => {
                setSelectedCountry(country);
                setStep("amount");
              }}
            >
              <View style={styles.countryLeft}>
                <Text style={styles.countryFlag}>{country.flag}</Text>
                <View>
                  <Text style={styles.countryName}>{country.name}</Text>
                  <Text style={styles.countryCurrency}>{country.currency}</Text>
                </View>
              </View>
              <View style={styles.countryRight}>
                <Text style={styles.rateLabel}>Rate</Text>
                <Text style={styles.rateValue}>1 USD = {country.rate} {country.currency}</Text>
              </View>
            </TouchableOpacity>
          ))}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    );
  }

  if (step === "amount") {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.headerSimple}>
          <TouchableOpacity style={styles.backButton} onPress={() => setStep("country")}>
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Enter Amount</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.body}>
          {selectedCountry && (
            <View style={styles.infoBox}>
              <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
              <View>
                <Text style={styles.infoBoxTitle}>Sending to {selectedCountry.name}</Text>
                <Text style={styles.infoBoxSub}>1 USD = {selectedCountry.rate} {selectedCountry.currency}</Text>
              </View>
            </View>
          )}

          <Text style={styles.inputLabel}>You Send (USD)</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencyPrefix}>$</Text>
            <TextInput
              placeholder="0.00"
              placeholderTextColor="#6B7280"
              value={sendAmount}
              onChangeText={handleSendAmountChange}
              keyboardType="numeric"
              style={styles.amountInput}
            />
          </View>

          <View style={styles.swapIcon}>
            <Ionicons name="swap-vertical" size={20} color="#7C3AED" />
          </View>

          <Text style={styles.inputLabel}>Recipient Gets ({selectedCountry?.currency})</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencyPrefix}>{selectedCountry?.currencySymbol}</Text>
            <TextInput
              placeholder="0.00"
              placeholderTextColor="#6B7280"
              value={receiveAmount}
              onChangeText={handleReceiveAmountChange}
              keyboardType="numeric"
              style={styles.amountInput}
            />
          </View>

          <View style={styles.card}>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Transfer fee</Text>
              <Text style={styles.feeValue}>${fee.toFixed(2)}</Text>
            </View>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Exchange rate</Text>
              <Text style={styles.feeValue}>1 USD = {selectedCountry?.rate} {selectedCountry?.currency}</Text>
            </View>
            <View style={[styles.feeRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total to pay</Text>
              <Text style={styles.totalValue}>${totalAmount.toFixed(2)}</Text>
            </View>
          </View>

          {primaryCard && (
            <View style={styles.infoBox}>
              <View>
                <Text style={styles.infoBoxSub}>Paying from</Text>
                <View style={styles.payFromRow}>
                  <Ionicons name="card" size={20} color="#7C3AED" />
                  <Text style={styles.infoBoxTitle}>{primaryCard.title}</Text>
                </View>
              </View>
              <Text style={styles.infoBoxSub}>Balance: ${primaryCard.balance.toLocaleString()}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, (!sendAmount || parseFloat(sendAmount) <= 0) && styles.disabledButton]}
            onPress={() => setStep("recipient")}
            disabled={!sendAmount || parseFloat(sendAmount) <= 0}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (step === "recipient") {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.headerSimple}>
          <TouchableOpacity style={styles.backButton} onPress={() => setStep("amount")}>
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recipient Details</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.body}>
          <Text style={styles.inputLabel}>Recipient Full Name</Text>
          <TextInput
            placeholder="Enter full name as on bank account"
            placeholderTextColor="#6B7280"
            value={recipientName}
            onChangeText={setRecipientName}
            style={styles.textInput}
          />

          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Bank/Mobile Money Provider</Text>
          <TextInput
            placeholder="e.g. First Bank, MTN Mobile Money"
            placeholderTextColor="#6B7280"
            value={recipientBank}
            onChangeText={setRecipientBank}
            style={styles.textInput}
          />

          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Account Number / Phone Number</Text>
          <TextInput
            placeholder="Enter account or phone number"
            placeholderTextColor="#6B7280"
            value={recipientAccount}
            onChangeText={setRecipientAccount}
            style={styles.textInput}
          />

          <View style={styles.warningBox}>
            <Ionicons name="shield-checkmark" size={20} color="#D97706" />
            <View style={{ flex: 1 }}>
              <Text style={styles.warningTitle}>Verification Required</Text>
              <Text style={styles.warningText}>Please ensure recipient details are correct. Incorrect information may cause delays.</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, (!recipientName || !recipientAccount || !recipientBank) && styles.disabledButton]}
            onPress={() => setStep("delivery")}
            disabled={!recipientName || !recipientAccount || !recipientBank}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (step === "delivery") {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.headerSimple}>
          <TouchableOpacity style={styles.backButton} onPress={() => setStep("recipient")}>
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Delivery Method</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.body}>
          <Text style={styles.sectionLabel}>
            How should {recipientName.split(' ')[0] || 'the recipient'} receive the money?
          </Text>

          {deliveryMethods.map((method) => {
            const isSelected = deliveryMethod === method.id;
            return (
              <TouchableOpacity
                key={method.id}
                style={[styles.deliveryCard, isSelected && styles.deliveryCardSelected]}
                onPress={() => setDeliveryMethod(method.id)}
              >
                <View style={[styles.deliveryIcon, isSelected && styles.deliveryIconSelected]}>
                  <Ionicons name={method.icon} size={24} color={isSelected ? "#FFFFFF" : "#1A1A2E"} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.deliveryName}>{method.name}</Text>
                  <View style={styles.deliveryTimeRow}>
                    <Ionicons name="time" size={12} color="#6B7280" />
                    <Text style={styles.deliveryTime}>{method.time}</Text>
                  </View>
                </View>
                <View style={styles.deliveryRight}>
                  <Text style={styles.deliveryFee}>${method.fee.toFixed(2)}</Text>
                  <Text style={styles.deliveryFeeLabel}>fee</Text>
                </View>
                {isSelected && (
                  <View style={styles.checkCircle}>
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity style={[styles.primaryButton, { marginTop: 24 }]} onPress={() => setStep("review")}>
            <Text style={styles.primaryButtonText}>Review Transfer</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (step === "review") {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.headerSimple}>
          <TouchableOpacity style={styles.backButton} onPress={() => setStep("delivery")}>
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Transfer</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.body}>
          <View style={styles.card}>
            <View style={styles.reviewAmounts}>
              <View style={styles.reviewAmountCol}>
                <Text style={styles.reviewAmountLabel}>You Send</Text>
                <Text style={styles.reviewAmountValue}>${sendAmount}</Text>
                <Text style={styles.reviewAmountCurrency}>USD</Text>
              </View>
              <Ionicons name="swap-horizontal" size={20} color="#6B7280" />
              <View style={styles.reviewAmountCol}>
                <Text style={styles.reviewAmountLabel}>They Get</Text>
                <Text style={[styles.reviewAmountValue, { color: "#7C3AED" }]}>{selectedCountry?.currencySymbol}{receiveAmount}</Text>
                <Text style={styles.reviewAmountCurrency}>{selectedCountry?.currency}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.reviewDetailRow}>
              <Text style={styles.reviewDetailLabel}>Recipient</Text>
              <Text style={styles.reviewDetailValue}>{recipientName}</Text>
            </View>
            <View style={styles.reviewDetailRow}>
              <Text style={styles.reviewDetailLabel}>Bank/Provider</Text>
              <Text style={styles.reviewDetailValue}>{recipientBank}</Text>
            </View>
            <View style={styles.reviewDetailRow}>
              <Text style={styles.reviewDetailLabel}>Account</Text>
              <Text style={styles.reviewDetailValue}>{recipientAccount}</Text>
            </View>
            <View style={styles.reviewDetailRow}>
              <Text style={styles.reviewDetailLabel}>Country</Text>
              <Text style={styles.reviewDetailValue}>{selectedCountry?.flag} {selectedCountry?.name}</Text>
            </View>
            <View style={styles.reviewDetailRow}>
              <Text style={styles.reviewDetailLabel}>Delivery</Text>
              <Text style={styles.reviewDetailValue}>{selectedDelivery?.name}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.reviewDetailRow}>
              <Text style={styles.reviewDetailLabel}>Amount</Text>
              <Text style={styles.reviewDetailValue}>${sendAmount}</Text>
            </View>
            <View style={styles.reviewDetailRow}>
              <Text style={styles.reviewDetailLabel}>Fee</Text>
              <Text style={styles.reviewDetailValue}>${fee.toFixed(2)}</Text>
            </View>
            <View style={[styles.reviewDetailRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${totalAmount.toFixed(2)}</Text>
            </View>
          </View>

          <Text style={[styles.inputLabel, { textAlign: "center", marginTop: 16 }]}>Enter PIN to Confirm</Text>
          <View style={styles.pinDotsRow}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={styles.pinDot}>
                <Text style={styles.pinDotText}>{pin[i] ? "●" : "○"}</Text>
              </View>
            ))}
          </View>

          <View style={styles.pinPad}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <TouchableOpacity
                key={num}
                style={styles.pinKey}
                onPress={() => pin.length < 4 && setPin(pin + num)}
              >
                <Text style={styles.pinKeyText}>{num}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.pinKey} />
            <TouchableOpacity
              style={styles.pinKey}
              onPress={() => pin.length < 4 && setPin(pin + "0")}
            >
              <Text style={styles.pinKeyText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pinKey}
              onPress={() => setPin(pin.slice(0, -1))}
            >
              <Text style={styles.pinKeyText}>⌫</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.confirmButton, pin.length !== 4 && styles.disabledButton]}
            onPress={handleConfirmTransfer}
            disabled={pin.length !== 4}
          >
            <Ionicons name="globe" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}> Confirm Transfer</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.successContainer}>
      <View style={styles.successContent}>
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={48} color="#FFFFFF" />
        </View>

        <Text style={styles.successTitle}>Transfer Initiated!</Text>
        <Text style={styles.successSubtitle}>Your money is on its way</Text>

        <View style={styles.card}>
          <View style={styles.reviewAmounts}>
            <View style={styles.reviewAmountCol}>
              <Text style={styles.reviewAmountLabel}>Sent</Text>
              <Text style={styles.reviewAmountValue}>${sendAmount}</Text>
            </View>
            <Ionicons name="swap-horizontal" size={20} color="#6B7280" />
            <View style={styles.reviewAmountCol}>
              <Text style={styles.reviewAmountLabel}>Receiving</Text>
              <Text style={[styles.reviewAmountValue, { color: "#059669" }]}>{selectedCountry?.currencySymbol}{receiveAmount}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.reviewDetailRow}>
            <Text style={styles.reviewDetailLabel}>To</Text>
            <Text style={styles.reviewDetailValue}>{recipientName}</Text>
          </View>
          <View style={styles.reviewDetailRow}>
            <Text style={styles.reviewDetailLabel}>Country</Text>
            <Text style={styles.reviewDetailValue}>{selectedCountry?.flag} {selectedCountry?.name}</Text>
          </View>
          <View style={styles.reviewDetailRow}>
            <Text style={styles.reviewDetailLabel}>Delivery</Text>
            <Text style={styles.reviewDetailValue}>{selectedDelivery?.time}</Text>
          </View>
          <View style={styles.reviewDetailRow}>
            <Text style={styles.reviewDetailLabel}>Reference</Text>
            <Text style={styles.reviewDetailValueMono}>CB-{Date.now().toString().slice(-8)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.successButtons}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/(tabs)")}>
          <Text style={styles.primaryButtonText}>Back to Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.outlineButton} onPress={resetTransfer}>
          <Text style={styles.outlineButtonText}>Send Another Transfer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerBanner: {
    backgroundColor: "#059669",
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backButtonWhite: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitleWhite: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  headerSubLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  headerSubValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: "#FFFFFF",
    fontSize: 16,
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
    paddingTop: 16,
  },
  sectionLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
  },
  countryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 8,
  },
  countryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  countryFlag: {
    fontSize: 30,
  },
  countryName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  countryCurrency: {
    fontSize: 14,
    color: "#6B7280",
  },
  countryRight: {
    alignItems: "flex-end",
  },
  rateLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  rateValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7C3AED",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    marginBottom: 24,
  },
  infoBoxTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  infoBoxSub: {
    fontSize: 14,
    color: "#6B7280",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A2E",
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    height: 64,
    marginBottom: 8,
  },
  currencyPrefix: {
    fontSize: 24,
    fontWeight: "700",
    color: "#6B7280",
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  swapIcon: {
    alignSelf: "center",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(124,58,237,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  card: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  feeLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  feeValue: {
    fontSize: 14,
    color: "#1A1A2E",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#7C3AED",
  },
  payFromRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  warningBox: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 24,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400E",
  },
  warningText: {
    fontSize: 12,
    color: "#A16207",
    marginTop: 2,
  },
  primaryButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 16,
    marginBottom: 24,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.5,
  },
  confirmButton: {
    backgroundColor: "#059669",
    borderRadius: 12,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 16,
    marginBottom: 24,
  },
  deliveryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    marginBottom: 12,
    gap: 16,
  },
  deliveryCardSelected: {
    borderColor: "#7C3AED",
    backgroundColor: "rgba(124,58,237,0.05)",
  },
  deliveryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  deliveryIconSelected: {
    backgroundColor: "#7C3AED",
  },
  deliveryName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  deliveryTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  deliveryTime: {
    fontSize: 12,
    color: "#6B7280",
  },
  deliveryRight: {
    alignItems: "flex-end",
  },
  deliveryFee: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  deliveryFeeLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  reviewAmounts: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  reviewAmountCol: {
    alignItems: "center",
  },
  reviewAmountLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  reviewAmountValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  reviewAmountCurrency: {
    fontSize: 12,
    color: "#6B7280",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },
  reviewDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  reviewDetailLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  reviewDetailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  reviewDetailValueMono: {
    fontSize: 14,
    fontFamily: "monospace",
    color: "#1A1A2E",
  },
  pinDotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginVertical: 16,
  },
  pinDot: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  pinDotText: {
    fontSize: 24,
    color: "#1A1A2E",
  },
  pinPad: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  pinKey: {
    width: "30%",
    height: 56,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  pinKeyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  successContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "space-between",
  },
  successContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 24,
  },
  successButtons: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 12,
  },
  outlineButton: {
    borderRadius: 12,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  outlineButtonText: {
    color: "#1A1A2E",
    fontSize: 16,
    fontWeight: "600",
  },
});
