import { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, ActivityIndicator, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useToast } from "../hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Product {
  id: string;
  name: string;
  provider: string;
  price: number;
  value: string;
  description: string;
  iconName: string;
  category: string;
  rating: number;
  discount?: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface Order {
  id: string;
  items: CartItem[];
  total: number;
  date: Date;
  status: "completed" | "pending" | "failed";
}

const products: Product[] = [
  { id: "airtime-att-10", name: "AT&T Airtime", provider: "AT&T", price: 10, value: "$10 Credit", description: "Prepaid phone credit", iconName: "phone-portrait", category: "airtime", rating: 4.8 },
  { id: "airtime-verizon-25", name: "Verizon Airtime", provider: "Verizon", price: 25, value: "$25 Credit", description: "Prepaid phone credit", iconName: "phone-portrait", category: "airtime", rating: 4.7 },
  { id: "airtime-tmobile-50", name: "T-Mobile Airtime", provider: "T-Mobile", price: 50, value: "$50 Credit", description: "Prepaid phone credit", iconName: "phone-portrait", category: "airtime", rating: 4.6, discount: 5 },
  { id: "data-att-5gb", name: "5GB Data Plan", provider: "AT&T", price: 30, value: "5GB/30 days", description: "Monthly data add-on", iconName: "wifi", category: "data", rating: 4.7 },
  { id: "data-verizon-10gb", name: "10GB Data Plan", provider: "Verizon", price: 50, value: "10GB/30 days", description: "Monthly data add-on", iconName: "wifi", category: "data", rating: 4.6 },
  { id: "data-tmobile-unlimited", name: "Unlimited Data", provider: "T-Mobile", price: 75, value: "Unlimited/30 days", description: "Unlimited monthly data", iconName: "wifi", category: "data", rating: 4.8, discount: 10 },
  { id: "utility-electric-50", name: "Electric Bill", provider: "Local Utility", price: 50, value: "$50 Payment", description: "Pay your electric bill", iconName: "flash", category: "utilities", rating: 4.6 },
  { id: "utility-electric-100", name: "Electric Bill", provider: "Local Utility", price: 100, value: "$100 Payment", description: "Pay your electric bill", iconName: "flash", category: "utilities", rating: 4.7 },
  { id: "utility-water-75", name: "Water Bill", provider: "Water Authority", price: 75, value: "$75 Payment", description: "Pay your water bill", iconName: "flash", category: "utilities", rating: 4.8 },
  { id: "streaming-netflix", name: "Netflix", provider: "Netflix", price: 15.99, value: "1 Month", description: "Standard HD plan", iconName: "tv", category: "streaming", rating: 4.9 },
  { id: "streaming-hulu", name: "Hulu", provider: "Hulu", price: 12.99, value: "1 Month", description: "Ad-free streaming", iconName: "tv", category: "streaming", rating: 4.7 },
  { id: "streaming-disney", name: "Disney+", provider: "Disney", price: 10.99, value: "1 Month", description: "Disney streaming service", iconName: "tv", category: "streaming", rating: 4.8 },
  { id: "streaming-spotify", name: "Spotify Premium", provider: "Spotify", price: 9.99, value: "1 Month", description: "Ad-free music streaming", iconName: "musical-notes", category: "streaming", rating: 4.9, discount: 10 },
  { id: "insurance-health", name: "Health Insurance", provider: "HealthGuard", price: 150, value: "Monthly Premium", description: "Family health coverage", iconName: "medkit", category: "insurance", rating: 4.8 },
  { id: "insurance-travel", name: "Travel Insurance", provider: "TravelSafe", price: 25, value: "Per Trip", description: "Full coverage while traveling", iconName: "location", category: "insurance", rating: 4.6 },
  { id: "giftcard-amazon-25", name: "Amazon Gift Card", provider: "Amazon", price: 25, value: "$25", description: "Shop anything on Amazon", iconName: "gift", category: "giftcards", rating: 4.9 },
  { id: "giftcard-amazon-50", name: "Amazon Gift Card", provider: "Amazon", price: 50, value: "$50", description: "Shop anything on Amazon", iconName: "gift", category: "giftcards", rating: 4.9 },
  { id: "giftcard-starbucks", name: "Starbucks Card", provider: "Starbucks", price: 25, value: "$25", description: "Coffee and treats", iconName: "gift", category: "giftcards", rating: 4.8 },
  { id: "giftcard-apple", name: "Apple Gift Card", provider: "Apple", price: 50, value: "$50", description: "Apps, games & more", iconName: "gift", category: "giftcards", rating: 4.9, discount: 5 },
  { id: "giftcard-google", name: "Google Play Card", provider: "Google", price: 25, value: "$25", description: "Apps, games & entertainment", iconName: "gift", category: "giftcards", rating: 4.8 },
  { id: "voucher-uber-25", name: "Uber Voucher", provider: "Uber", price: 25, value: "$25 Credit", description: "Rides & Uber Eats", iconName: "ticket", category: "vouchers", rating: 4.8 },
  { id: "voucher-doordash-30", name: "DoorDash Voucher", provider: "DoorDash", price: 30, value: "$30 Credit", description: "Food delivery credit", iconName: "ticket", category: "vouchers", rating: 4.7 },
  { id: "voucher-grubhub-25", name: "Grubhub Voucher", provider: "Grubhub", price: 25, value: "$25 Credit", description: "Order from local restaurants", iconName: "ticket", category: "vouchers", rating: 4.6, discount: 10 },
  { id: "voucher-target-50", name: "Target Voucher", provider: "Target", price: 50, value: "$50 Credit", description: "Shop anything at Target", iconName: "ticket", category: "vouchers", rating: 4.9 },
  { id: "voucher-walmart-50", name: "Walmart Voucher", provider: "Walmart", price: 50, value: "$50 Credit", description: "Groceries & more", iconName: "ticket", category: "vouchers", rating: 4.8 },
  { id: "voucher-spa-100", name: "Spa & Wellness", provider: "SpaFinder", price: 100, value: "$100 Credit", description: "Spa treatments & massages", iconName: "ticket", category: "vouchers", rating: 4.9, discount: 15 },
  { id: "voucher-restaurant-50", name: "Restaurant.com", provider: "Restaurant.com", price: 50, value: "$50 Credit", description: "Dining at 60,000+ restaurants", iconName: "ticket", category: "vouchers", rating: 4.7 },
  { id: "voucher-gym-30", name: "Gym Pass", provider: "ClassPass", price: 30, value: "1 Month", description: "Access to gyms & fitness", iconName: "ticket", category: "vouchers", rating: 4.6 },
  { id: "ticket-concert", name: "Concert Ticket", provider: "Live Events", price: 85, value: "1 Ticket", description: "General admission", iconName: "musical-notes", category: "tickets", rating: 4.7 },
  { id: "ticket-movie", name: "Movie Tickets", provider: "AMC Theaters", price: 15, value: "1 Ticket", description: "Standard showing", iconName: "ticket", category: "tickets", rating: 4.6 },
  { id: "ticket-sports", name: "Sports Game", provider: "StubHub", price: 75, value: "1 Ticket", description: "Local team game", iconName: "ticket", category: "tickets", rating: 4.8, discount: 8 },
  { id: "ticket-flight", name: "Flight Booking", provider: "BukkaPay Travel", price: 299, value: "Round Trip", description: "Economy class", iconName: "airplane", category: "tickets", rating: 4.9 },
];

const categories = [
  { id: "all", label: "All", icon: "cart" as const },
  { id: "airtime", label: "Airtime", icon: "phone-portrait" as const },
  { id: "data", label: "Data", icon: "wifi" as const },
  { id: "utilities", label: "Utilities", icon: "flash" as const },
  { id: "streaming", label: "Streaming", icon: "tv" as const },
  { id: "insurance", label: "Insurance", icon: "medkit" as const },
  { id: "giftcards", label: "Gift Cards", icon: "gift" as const },
  { id: "vouchers", label: "Vouchers", icon: "ticket" as const },
  { id: "tickets", label: "Tickets", icon: "ticket" as const },
];

type Stage = "browse" | "cart" | "checkout" | "pin" | "success" | "orders";

export default function Buy() {
  const router = useRouter();
  const { toast } = useToast();
  const [stage, setStage] = useState<Stage>("browse");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sortBy, setSortBy] = useState<"price-low" | "price-high" | "rating">("rating");
  const [pin, setPin] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const { data: cards = [] } = useQuery<any[]>({
    queryKey: ["/api/wallet-cards"],
  });

  const walletBalance = cards.reduce((sum: number, card: any) => sum + parseFloat(card.balance || "0"), 0);
  const primaryCard = cards[0];

  const deductBalanceMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!primaryCard) throw new Error("No wallet card found");
      const newBalance = (parseFloat(primaryCard.balance || "0") - amount).toFixed(2);
      return apiRequest("PATCH", `/api/wallet-cards/${primaryCard.id}`, { balance: newBalance });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet-cards"] });
    },
  });

  const filteredProducts = products
    .filter(
      (p) =>
        (activeCategory === "all" || p.category === activeCategory) &&
        (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.provider.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      return b.rating - a.rating;
    });

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      setCart(cart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    toast({ title: "Added to Cart", description: `${product.name} added to cart` });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : item;
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const getDiscountedPrice = (product: Product) => {
    if (product.discount) {
      return product.price * (1 - product.discount / 100);
    }
    return product.price;
  };

  const cartTotal = cart.reduce((sum, item) => sum + getDiscountedPrice(item) * item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({ title: "Cart Empty", description: "Add items to your cart first", variant: "destructive" });
      return;
    }
    setStage("checkout");
  };

  const handleProceedToPin = () => {
    if (cartTotal > walletBalance) {
      toast({ title: "Insufficient Balance", description: "Please top up your wallet", variant: "destructive" });
      return;
    }
    setStage("pin");
  };

  const handleConfirmPurchase = async () => {
    const storedPin = (await AsyncStorage.getItem("wallet_pin")) || "1234";
    if (pin !== storedPin) {
      toast({ title: "Invalid PIN", description: "Please enter your wallet PIN", variant: "destructive" });
      setPin("");
      return;
    }

    try {
      await deductBalanceMutation.mutateAsync(cartTotal);

      const order: Order = {
        id: `ORD-${Date.now().toString(36).toUpperCase()}`,
        items: [...cart],
        total: cartTotal,
        date: new Date(),
        status: "completed",
      };

      setCurrentOrder(order);
      setOrders([order, ...orders]);
      setCart([]);
      setPin("");
      setPhoneNumber("");
      setAccountNumber("");
      setStage("success");
    } catch (error: any) {
      toast({ title: "Payment Failed", description: error.message || "Could not process payment", variant: "destructive" });
      setPin("");
    }
  };

  if (stage === "success" && currentOrder) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={48} color="#FFFFFF" />
        </View>
        <Text style={styles.successTitle}>Purchase Complete!</Text>
        <Text style={styles.mutedText}>Your order has been processed successfully</Text>

        <View style={[styles.card, { marginTop: 24, width: "100%" }]}>
          <View style={styles.orderRow}>
            <Text style={styles.mutedText}>Order ID</Text>
            <Text style={styles.monoText}>{currentOrder.id}</Text>
          </View>
          <View style={styles.orderRow}>
            <Text style={styles.mutedText}>Items</Text>
            <Text style={styles.bodyText}>{currentOrder.items.reduce((sum, i) => sum + i.quantity, 0)} items</Text>
          </View>
          <View style={styles.orderRow}>
            <Text style={styles.mutedText}>Total Paid</Text>
            <Text style={styles.boldLarge}>${currentOrder.total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={{ width: "100%", gap: 12, marginTop: 24 }}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => { setStage("orders"); setCurrentOrder(null); }}
          >
            <Ionicons name="receipt" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>View Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.outlineButton}
            onPress={() => { setStage("browse"); setCurrentOrder(null); }}
          >
            <Text style={styles.outlineButtonText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (stage === "pin") {
    return (
      <View style={styles.pinContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStage("checkout")} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Enter PIN</Text>
        </View>

        <View style={styles.pinCenter}>
          <Text style={styles.mutedText}>Enter your 4-digit PIN to confirm purchase</Text>
          <Text style={styles.pinAmount}>${cartTotal.toFixed(2)}</Text>
        </View>

        <View style={styles.pinDots}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[styles.pinDot, pin.length > i && styles.pinDotFilled]}
            >
              <Text style={styles.pinDotText}>{pin.length > i ? "•" : ""}</Text>
            </View>
          ))}
        </View>

        <View style={styles.numpad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "del"].map((num, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                if (num === "del") {
                  setPin(pin.slice(0, -1));
                } else if (num !== "" && pin.length < 4) {
                  const newPin = pin + num;
                  setPin(newPin);
                  if (newPin.length === 4) {
                    setTimeout(() => handleConfirmPurchase(), 300);
                  }
                }
              }}
              style={[styles.numpadButton, num === "" && { opacity: 0 }]}
              disabled={num === ""}
            >
              {num === "del" ? (
                <Ionicons name="backspace" size={20} color="#1A1A2E" />
              ) : (
                <Text style={styles.numpadText}>{num}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  if (stage === "checkout") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStage("cart")} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order Summary</Text>
            {cart.map((item) => (
              <View key={item.id} style={styles.checkoutItem}>
                <View>
                  <Text style={styles.bodyText}>{item.name}</Text>
                  <Text style={styles.mutedSmall}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.fontSemibold}>${(getDiscountedPrice(item) * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.boldText}>Total</Text>
              <Text style={styles.boldLarge}>${cartTotal.toFixed(2)}</Text>
            </View>
          </View>

          {cart.some((item) => ["airtime", "data"].includes(item.category)) && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Delivery Details</Text>
              <Text style={styles.mutedSmall}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                placeholderTextColor="#6B7280"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>
          )}

          {cart.some((item) => item.category === "utilities") && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Account Details</Text>
              <Text style={styles.mutedSmall}>Account Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter account number"
                placeholderTextColor="#6B7280"
                value={accountNumber}
                onChangeText={setAccountNumber}
              />
            </View>
          )}

          <View style={[styles.card, { borderColor: walletBalance >= cartTotal ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)" }]}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.mutedSmall}>Wallet Balance</Text>
                <Text style={styles.boldLarge}>${walletBalance.toFixed(2)}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: walletBalance >= cartTotal ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)" }]}>
                <Text style={{ fontSize: 12, color: walletBalance >= cartTotal ? "#059669" : "#EF4444" }}>
                  {walletBalance >= cartTotal ? "Sufficient" : "Insufficient"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottomFixed}>
          <TouchableOpacity
            style={[styles.primaryButton, walletBalance < cartTotal && styles.disabledButton]}
            onPress={handleProceedToPin}
            disabled={walletBalance < cartTotal}
          >
            <Text style={styles.primaryButtonText}>Pay ${cartTotal.toFixed(2)}</Text>
            <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (stage === "cart") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStage("browse")} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}>
          {cart.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cart" size={48} color="#6B7280" />
              <Text style={styles.emptyTitle}>Cart is Empty</Text>
              <Text style={styles.mutedText}>Add items to get started</Text>
              <TouchableOpacity style={[styles.primaryButton, { marginTop: 24 }]} onPress={() => setStage("browse")}>
                <Text style={styles.primaryButtonText}>Start Shopping</Text>
              </TouchableOpacity>
            </View>
          ) : (
            cart.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cartItemRow}>
                  <View style={styles.productIcon}>
                    <Ionicons name={item.iconName as any} size={24} color="#7C3AED" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.rowBetween}>
                      <View>
                        <Text style={styles.bodyText}>{item.name}</Text>
                        <Text style={styles.mutedSmall}>{item.provider}</Text>
                      </View>
                      <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                        <Ionicons name="close" size={18} color="#6B7280" />
                      </TouchableOpacity>
                    </View>
                    <View style={[styles.rowBetween, { marginTop: 12 }]}>
                      <View style={styles.qtyRow}>
                        <TouchableOpacity style={styles.qtyButton} onPress={() => updateQuantity(item.id, -1)}>
                          <Ionicons name="remove" size={16} color="#1A1A2E" />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.quantity}</Text>
                        <TouchableOpacity style={styles.qtyButton} onPress={() => updateQuantity(item.id, 1)}>
                          <Ionicons name="add" size={16} color="#1A1A2E" />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.boldText}>${(getDiscountedPrice(item) * item.quantity).toFixed(2)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {cart.length > 0 && (
          <View style={styles.bottomFixed}>
            <View style={styles.rowBetween}>
              <Text style={styles.mutedText}>Total ({cart.reduce((s, i) => s + i.quantity, 0)} items)</Text>
              <Text style={styles.boldLarge}>${cartTotal.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={[styles.primaryButton, { marginTop: 12 }]} onPress={handleCheckout}>
              <Text style={styles.primaryButtonText}>Proceed to Checkout</Text>
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  if (stage === "orders") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStage("browse")} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order History</Text>
        </View>

        <View style={styles.section}>
          {orders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt" size={48} color="#6B7280" />
              <Text style={styles.emptyTitle}>No Orders Yet</Text>
              <Text style={styles.mutedText}>Your purchase history will appear here</Text>
            </View>
          ) : (
            orders.map((order) => (
              <View key={order.id} style={styles.card}>
                <View style={styles.rowBetween}>
                  <View>
                    <Text style={styles.monoText}>{order.id}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                      <Ionicons name="time" size={12} color="#6B7280" />
                      <Text style={styles.mutedSmall}>{order.date.toLocaleDateString()}</Text>
                    </View>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{order.status}</Text>
                  </View>
                </View>
                {order.items.map((item, i) => (
                  <View key={i} style={[styles.rowBetween, { marginTop: 8 }]}>
                    <Text style={styles.mutedSmall}>{item.name} x{item.quantity}</Text>
                    <Text style={styles.bodyText}>${(getDiscountedPrice(item) * item.quantity).toFixed(2)}</Text>
                  </View>
                ))}
                <View style={[styles.totalRow, { marginTop: 12 }]}>
                  <Text style={styles.fontSemibold}>Total</Text>
                  <Text style={styles.boldText}>${order.total.toFixed(2)}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { justifyContent: "space-between" }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Marketplace</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity onPress={() => setStage("orders")} style={styles.backButton}>
            <Ionicons name="receipt" size={22} color="#1A1A2E" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStage("cart")} style={styles.backButton}>
            <Ionicons name="cart" size={22} color="#1A1A2E" />
            {cart.length > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cart.reduce((s, i) => s + i.quantity, 0)}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={20} color="#6B7280" style={{ position: "absolute", left: 36, top: 12, zIndex: 1 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#6B7280"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            onPress={() => setActiveCategory(cat.id)}
            style={[styles.categoryPill, activeCategory === cat.id && styles.categoryPillActive]}
          >
            <Ionicons name={cat.icon} size={16} color={activeCategory === cat.id ? "#FFFFFF" : "#6B7280"} />
            <Text style={[styles.categoryPillText, activeCategory === cat.id && { color: "#FFFFFF" }]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.sortRow}>
        {(["rating", "price-low", "price-high"] as const).map((sort) => (
          <TouchableOpacity
            key={sort}
            onPress={() => setSortBy(sort)}
            style={[styles.sortButton, sortBy === sort && styles.sortButtonActive]}
          >
            <Text style={[styles.sortButtonText, sortBy === sort && { color: "#FFFFFF" }]}>
              {sort === "rating" ? "Top Rated" : sort === "price-low" ? "Price: Low" : "Price: High"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: cart.length > 0 ? 100 : 24 }}>
        {filteredProducts.length > 0 ? (
          <View style={styles.productGrid}>
            {filteredProducts.map((product) => (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.productCardTop}>
                  <View style={styles.productIcon}>
                    <Ionicons name={product.iconName as any} size={24} color="#7C3AED" />
                  </View>
                  {product.discount && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>-{product.discount}%</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                <Text style={styles.mutedSmall} numberOfLines={1}>{product.provider}</Text>
                <Text style={[styles.mutedSmall, { marginTop: 4 }]}>{product.value}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                  <Ionicons name="star" size={10} color="#EAB308" />
                  <Text style={{ fontSize: 10, color: "#6B7280" }}>{product.rating}</Text>
                </View>
                <View style={[styles.rowBetween, { marginTop: 12 }]}>
                  <View>
                    {product.discount ? (
                      <>
                        <Text style={styles.oldPrice}>${product.price.toFixed(2)}</Text>
                        <Text style={styles.currentPrice}>${getDiscountedPrice(product).toFixed(2)}</Text>
                      </>
                    ) : (
                      <Text style={styles.currentPrice}>${product.price.toFixed(2)}</Text>
                    )}
                  </View>
                  <TouchableOpacity style={styles.addCartButton} onPress={() => addToCart(product)}>
                    <Ionicons name="add" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="cart" size={48} color="#6B7280" />
            <Text style={styles.mutedText}>No products found</Text>
            <Text style={[styles.mutedSmall, { marginTop: 4 }]}>Try adjusting your search or filters</Text>
          </View>
        )}
      </ScrollView>

      {cart.length > 0 && (
        <View style={styles.bottomFixed}>
          <TouchableOpacity style={styles.viewCartButton} onPress={() => setStage("cart")}>
            <Ionicons name="cart" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>
              View Cart ({cart.reduce((s, i) => s + i.quantity, 0)}) - ${cartTotal.toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A2E",
    flex: 1,
  },
  section: {
    paddingHorizontal: 24,
    gap: 16,
  },
  card: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A2E",
    marginBottom: 16,
  },
  bodyText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1A1A2E",
  },
  boldText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  boldLarge: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  fontSemibold: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  mutedText: {
    fontSize: 14,
    color: "#6B7280",
  },
  mutedSmall: {
    fontSize: 13,
    color: "#6B7280",
  },
  monoText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "monospace",
    color: "#1A1A2E",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#1A1A2E",
    backgroundColor: "#FFFFFF",
    marginTop: 8,
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
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  outlineButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  disabledButton: {
    opacity: 0.5,
  },
  successContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 8,
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  pinContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  pinCenter: {
    alignItems: "center",
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  pinAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1A1A2E",
    marginTop: 16,
  },
  pinDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 32,
  },
  pinDot: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  pinDotFilled: {
    borderColor: "#7C3AED",
    backgroundColor: "rgba(124,58,237,0.1)",
  },
  pinDotText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  numpad: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    maxWidth: 280,
    alignSelf: "center",
  },
  numpadButton: {
    width: 80,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  numpadText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  checkoutItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bottomFixed: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  cartItemRow: {
    flexDirection: "row",
    gap: 16,
  },
  productIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(124,58,237,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A2E",
    width: 32,
    textAlign: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A2E",
    marginTop: 16,
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: "rgba(16,185,129,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: "#059669",
  },
  searchWrap: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchInput: {
    paddingLeft: 40,
    paddingRight: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    fontSize: 14,
    color: "#1A1A2E",
  },
  categoryScroll: {
    marginBottom: 12,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  categoryPillActive: {
    backgroundColor: "#7C3AED",
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  sortRow: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 16,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  sortButtonActive: {
    backgroundColor: "#7C3AED",
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  productCard: {
    width: "47%",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
  },
  productCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  discountBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  oldPrice: {
    fontSize: 12,
    color: "#6B7280",
    textDecorationLine: "line-through",
  },
  currentPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  addCartButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  viewCartButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
