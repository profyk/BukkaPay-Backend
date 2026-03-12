import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useToast } from "../hooks/use-toast";

type TravelType = "bus" | "flight" | "hotel";

interface BusRoute {
  id: string;
  operator: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  duration: string;
  price: number;
  seats: number;
  type: string;
  rating: number;
}

interface Flight {
  id: string;
  airline: string;
  from: string;
  fromCode: string;
  to: string;
  toCode: string;
  departure: string;
  arrival: string;
  duration: string;
  price: number;
  stops: number;
  class: string;
  rating: number;
}

interface HotelOption {
  id: string;
  name: string;
  location: string;
  rating: number;
  reviews: number;
  price: number;
  amenities: string[];
  image: string;
  type: string;
}

const busRoutes: BusRoute[] = [
  { id: "bus-1", operator: "Metro Express", from: "New York", to: "Boston", departure: "08:00 AM", arrival: "12:30 PM", duration: "4h 30m", price: 45, seats: 12, type: "Luxury", rating: 4.7 },
  { id: "bus-2", operator: "Greyhound", from: "New York", to: "Washington DC", departure: "09:30 AM", arrival: "02:00 PM", duration: "4h 30m", price: 35, seats: 8, type: "Standard", rating: 4.3 },
  { id: "bus-3", operator: "FlixBus", from: "Los Angeles", to: "San Francisco", departure: "07:00 AM", arrival: "02:00 PM", duration: "7h", price: 55, seats: 20, type: "Premium", rating: 4.5 },
  { id: "bus-4", operator: "Megabus", from: "Chicago", to: "Detroit", departure: "10:00 AM", arrival: "02:30 PM", duration: "4h 30m", price: 25, seats: 15, type: "Economy", rating: 4.2 },
  { id: "bus-5", operator: "Peter Pan", from: "Boston", to: "New York", departure: "06:00 AM", arrival: "10:30 AM", duration: "4h 30m", price: 40, seats: 5, type: "Luxury", rating: 4.6 },
];

const flights: Flight[] = [
  { id: "fl-1", airline: "Delta Airlines", from: "New York", fromCode: "JFK", to: "Los Angeles", toCode: "LAX", departure: "08:00 AM", arrival: "11:30 AM", duration: "5h 30m", price: 299, stops: 0, class: "Economy", rating: 4.6 },
  { id: "fl-2", airline: "United Airlines", from: "Chicago", fromCode: "ORD", to: "Miami", toCode: "MIA", departure: "10:15 AM", arrival: "03:45 PM", duration: "3h 30m", price: 189, stops: 0, class: "Economy", rating: 4.4 },
  { id: "fl-3", airline: "American Airlines", from: "Los Angeles", fromCode: "LAX", to: "New York", toCode: "JFK", departure: "06:00 AM", arrival: "02:30 PM", duration: "5h 30m", price: 279, stops: 0, class: "Economy", rating: 4.5 },
  { id: "fl-4", airline: "Southwest", from: "Dallas", fromCode: "DFW", to: "Denver", toCode: "DEN", departure: "11:00 AM", arrival: "12:30 PM", duration: "2h 30m", price: 149, stops: 0, class: "Economy", rating: 4.3 },
  { id: "fl-5", airline: "JetBlue", from: "Boston", fromCode: "BOS", to: "San Francisco", toCode: "SFO", departure: "07:30 AM", arrival: "11:00 AM", duration: "6h 30m", price: 329, stops: 1, class: "Economy", rating: 4.7 },
];

const hotels: HotelOption[] = [
  { id: "htl-1", name: "Grand Plaza Hotel", location: "Manhattan, New York", rating: 4.8, reviews: 2453, price: 189, amenities: ["WiFi", "Pool", "Gym", "Spa"], image: "", type: "Luxury" },
  { id: "htl-2", name: "Comfort Inn Downtown", location: "Chicago, IL", rating: 4.3, reviews: 1876, price: 99, amenities: ["WiFi", "Breakfast", "Parking"], image: "", type: "Budget" },
  { id: "htl-3", name: "Ocean View Resort", location: "Miami Beach, FL", rating: 4.9, reviews: 3241, price: 259, amenities: ["WiFi", "Beach Access", "Pool", "Restaurant"], image: "", type: "Resort" },
  { id: "htl-4", name: "Business Suites", location: "San Francisco, CA", rating: 4.5, reviews: 1543, price: 159, amenities: ["WiFi", "Business Center", "Gym"], image: "", type: "Business" },
  { id: "htl-5", name: "Mountain Lodge", location: "Denver, CO", rating: 4.7, reviews: 987, price: 129, amenities: ["WiFi", "Fireplace", "Restaurant", "Hiking"], image: "", type: "Lodge" },
];

function BusCard({ route, onBook }: { route: BusRoute; onBook: () => void }) {
  return (
    <View style={styles.travelCard}>
      <View style={styles.cardTopRow}>
        <View style={styles.cardTopLeft}>
          <View style={[styles.iconCircle, { backgroundColor: "rgba(59,130,246,0.1)" }]}>
            <Ionicons name="bus-outline" size={20} color="#3B82F6" />
          </View>
          <View>
            <Text style={styles.operatorName}>{route.operator}</Text>
            <Text style={styles.operatorType}>{route.type}</Text>
          </View>
        </View>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color="#F59E0B" />
          <Text style={styles.ratingText}>{route.rating}</Text>
        </View>
      </View>

      <View style={styles.routeRow}>
        <View style={styles.routePoint}>
          <Text style={styles.routeTime}>{route.departure}</Text>
          <Text style={styles.routeCity}>{route.from}</Text>
        </View>
        <View style={styles.routeMiddle}>
          <View style={styles.routeLine} />
          <View style={styles.durationRow}>
            <Ionicons name="time-outline" size={12} color="#6B7280" />
            <Text style={styles.durationText}>{route.duration}</Text>
          </View>
          <View style={styles.routeLine} />
        </View>
        <View style={styles.routePoint}>
          <Text style={styles.routeTime}>{route.arrival}</Text>
          <Text style={styles.routeCity}>{route.to}</Text>
        </View>
      </View>

      <View style={styles.cardBottomRow}>
        <Text style={styles.seatsText}>{route.seats} seats left</Text>
        <View style={styles.priceBookRow}>
          <Text style={styles.priceText}>${route.price}</Text>
          <TouchableOpacity onPress={onBook} style={styles.bookButton}>
            <Text style={styles.bookButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function FlightCard({ flight, onBook }: { flight: Flight; onBook: () => void }) {
  return (
    <View style={styles.travelCard}>
      <View style={styles.cardTopRow}>
        <View style={styles.cardTopLeft}>
          <View style={[styles.iconCircle, { backgroundColor: "rgba(139,92,246,0.1)" }]}>
            <Ionicons name="airplane-outline" size={20} color="#8B5CF6" />
          </View>
          <View>
            <Text style={styles.operatorName}>{flight.airline}</Text>
            <Text style={styles.operatorType}>{flight.class}</Text>
          </View>
        </View>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color="#F59E0B" />
          <Text style={styles.ratingText}>{flight.rating}</Text>
        </View>
      </View>

      <View style={styles.routeRow}>
        <View style={styles.routePoint}>
          <Text style={styles.flightTime}>{flight.departure}</Text>
          <Text style={styles.airportCode}>{flight.fromCode}</Text>
          <Text style={styles.routeCity}>{flight.from}</Text>
        </View>
        <View style={styles.routeMiddle}>
          <View style={styles.flightMiddleCol}>
            <View style={styles.routeLineRow}>
              <View style={styles.routeLine} />
              <Ionicons name="airplane" size={16} color="#6B7280" />
              <View style={styles.routeLine} />
            </View>
            <Text style={styles.durationText}>{flight.duration}</Text>
            <Text style={styles.stopsText}>{flight.stops === 0 ? "Non-stop" : `${flight.stops} stop`}</Text>
          </View>
        </View>
        <View style={styles.routePoint}>
          <Text style={styles.flightTime}>{flight.arrival}</Text>
          <Text style={styles.airportCode}>{flight.toCode}</Text>
          <Text style={styles.routeCity}>{flight.to}</Text>
        </View>
      </View>

      <View style={[styles.cardBottomRow, styles.borderTop]}>
        <Text style={styles.flightPrice}>${flight.price}</Text>
        <TouchableOpacity onPress={onBook} style={styles.bookButton}>
          <Text style={styles.bookButtonText}>Book Flight</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function HotelCard({ hotel, onBook }: { hotel: HotelOption; onBook: () => void }) {
  return (
    <View style={styles.travelCard}>
      <View style={styles.hotelTopRow}>
        <View style={styles.hotelImagePlaceholder}>
          <Ionicons name="bed-outline" size={32} color="#F59E0B" />
        </View>
        <View style={styles.hotelInfo}>
          <View style={styles.hotelNameRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.hotelName}>{hotel.name}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={12} color="#6B7280" />
                <Text style={styles.locationText}>{hotel.location}</Text>
              </View>
            </View>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{hotel.type}</Text>
            </View>
          </View>

          <View style={styles.hotelRatingRow}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.ratingText}>{hotel.rating}</Text>
            <Text style={styles.reviewsText}>({hotel.reviews} reviews)</Text>
          </View>

          <View style={styles.amenitiesRow}>
            {hotel.amenities.slice(0, 3).map((amenity) => (
              <View key={amenity} style={styles.amenityChip}>
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
            {hotel.amenities.length > 3 && (
              <View style={styles.amenityChip}>
                <Text style={styles.amenityText}>+{hotel.amenities.length - 3}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={[styles.cardBottomRow, styles.borderTop, { marginTop: 16 }]}>
        <View>
          <Text style={styles.flightPrice}>${hotel.price}</Text>
          <Text style={styles.perNightText}>per night</Text>
        </View>
        <TouchableOpacity onPress={onBook} style={styles.bookButton}>
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function Travel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TravelType>("bus");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookingDialog, setBookingDialog] = useState<{ open: boolean; type: TravelType; item: any }>({
    open: false,
    type: "bus",
    item: null,
  });
  const [passengers, setPassengers] = useState("1");
  const [travelDate, setTravelDate] = useState("");
  const [nights, setNights] = useState("1");
  const { toast } = useToast();

  const handleBook = (type: TravelType, item: any) => {
    setBookingDialog({ open: true, type, item });
  };

  const confirmBooking = () => {
    const item = bookingDialog.item;
    const type = bookingDialog.type;

    let message = "";
    if (type === "bus") {
      message = `Bus ticket from ${item.from} to ${item.to} booked successfully!`;
    } else if (type === "flight") {
      message = `Flight from ${item.from} to ${item.to} booked successfully!`;
    } else {
      message = `${item.name} booked for ${nights} night(s) successfully!`;
    }

    toast({ title: "Booking Confirmed!", description: message });
    setBookingDialog({ open: false, type: "bus", item: null });
  };

  const tabs: { id: TravelType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: "bus", label: "Bus", icon: "bus-outline" },
    { id: "flight", label: "Flights", icon: "airplane-outline" },
    { id: "hotel", label: "Hotels", icon: "bed-outline" },
  ];

  const filteredBuses = busRoutes.filter(
    (r) =>
      r.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.operator.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFlights = flights.filter(
    (f) =>
      f.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.airline.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHotels = hotels.filter(
    (h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerBg}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => router.push("/features-hub")} style={styles.headerBackButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Travel Booking</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="rgba(196,181,253,1)" style={styles.searchIcon} />
          <TextInput
            placeholder="Search destinations, operators..."
            placeholderTextColor="rgba(196,181,253,0.7)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.tabsRow}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[styles.tabButton, activeTab === tab.id ? styles.tabActive : styles.tabInactive]}
            >
              <Ionicons name={tab.icon} size={18} color={activeTab === tab.id ? "#7C3AED" : "#FFFFFF"} />
              <Text style={[styles.tabText, activeTab === tab.id ? styles.tabTextActive : styles.tabTextInactive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={styles.listContainer} contentContainerStyle={{ paddingBottom: 100, gap: 16 }}>
        {activeTab === "bus" && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Available Bus Routes</Text>
              <Text style={styles.sectionCount}>{filteredBuses.length} routes</Text>
            </View>
            {filteredBuses.map((route) => (
              <BusCard key={route.id} route={route} onBook={() => handleBook("bus", route)} />
            ))}
          </View>
        )}

        {activeTab === "flight" && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Available Flights</Text>
              <Text style={styles.sectionCount}>{filteredFlights.length} flights</Text>
            </View>
            {filteredFlights.map((flight) => (
              <FlightCard key={flight.id} flight={flight} onBook={() => handleBook("flight", flight)} />
            ))}
          </View>
        )}

        {activeTab === "hotel" && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Hotels</Text>
              <Text style={styles.sectionCount}>{filteredHotels.length} hotels</Text>
            </View>
            {filteredHotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} onBook={() => handleBook("hotel", hotel)} />
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={bookingDialog.open} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                {bookingDialog.type === "bus" && <Ionicons name="bus-outline" size={20} color="#1A1A2E" />}
                {bookingDialog.type === "flight" && <Ionicons name="airplane-outline" size={20} color="#1A1A2E" />}
                {bookingDialog.type === "hotel" && <Ionicons name="bed-outline" size={20} color="#1A1A2E" />}
                <Text style={styles.modalTitle}>Confirm Booking</Text>
              </View>
              <TouchableOpacity onPress={() => setBookingDialog({ ...bookingDialog, open: false })}>
                <Ionicons name="close" size={24} color="#1A1A2E" />
              </TouchableOpacity>
            </View>

            {bookingDialog.item && (
              <ScrollView>
                {bookingDialog.type === "bus" && (
                  <View style={styles.bookingSummary}>
                    <Text style={styles.summaryTitle}>{bookingDialog.item.operator}</Text>
                    <Text style={styles.summarySubtext}>
                      {bookingDialog.item.from} → {bookingDialog.item.to}
                    </Text>
                    <Text style={styles.summarySubtext}>{bookingDialog.item.departure}</Text>
                    <Text style={styles.summaryPrice}>${bookingDialog.item.price}</Text>
                  </View>
                )}

                {bookingDialog.type === "flight" && (
                  <View style={styles.bookingSummary}>
                    <Text style={styles.summaryTitle}>{bookingDialog.item.airline}</Text>
                    <Text style={styles.summarySubtext}>
                      {bookingDialog.item.from} ({bookingDialog.item.fromCode}) → {bookingDialog.item.to} ({bookingDialog.item.toCode})
                    </Text>
                    <Text style={styles.summarySubtext}>
                      {bookingDialog.item.departure} - {bookingDialog.item.arrival}
                    </Text>
                    <Text style={styles.summaryPrice}>${bookingDialog.item.price}</Text>
                  </View>
                )}

                {bookingDialog.type === "hotel" && (
                  <View style={styles.bookingSummary}>
                    <Text style={styles.summaryTitle}>{bookingDialog.item.name}</Text>
                    <Text style={styles.summarySubtext}>{bookingDialog.item.location}</Text>
                    <Text style={styles.summaryPrice}>${bookingDialog.item.price}/night</Text>
                  </View>
                )}

                <Text style={styles.formLabel}>Travel Date</Text>
                <TextInput
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#6B7280"
                  value={travelDate}
                  onChangeText={setTravelDate}
                  style={styles.formInput}
                />

                {bookingDialog.type !== "hotel" ? (
                  <View>
                    <Text style={styles.formLabel}>Passengers</Text>
                    <View style={styles.pickerRow}>
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <TouchableOpacity
                          key={n}
                          onPress={() => setPassengers(n.toString())}
                          style={[styles.pickerOption, passengers === n.toString() && styles.pickerOptionActive]}
                        >
                          <Text style={[styles.pickerText, passengers === n.toString() && styles.pickerTextActive]}>
                            {n}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : (
                  <View>
                    <Text style={styles.formLabel}>Number of Nights</Text>
                    <View style={styles.pickerRow}>
                      {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                        <TouchableOpacity
                          key={n}
                          onPress={() => setNights(n.toString())}
                          style={[styles.pickerOption, nights === n.toString() && styles.pickerOptionActive]}
                        >
                          <Text style={[styles.pickerText, nights === n.toString() && styles.pickerTextActive]}>
                            {n}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <View style={[styles.totalRow, styles.borderTop]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalAmount}>
                    ${bookingDialog.type === "hotel"
                      ? bookingDialog.item.price * parseInt(nights)
                      : bookingDialog.item.price * parseInt(passengers)}
                  </Text>
                </View>

                <TouchableOpacity onPress={confirmBooking} style={styles.confirmButton}>
                  <Text style={styles.confirmButtonText}>Confirm & Pay</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  headerBg: { backgroundColor: "#7C3AED", paddingHorizontal: 24, paddingTop: 48, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  headerBackButton: { padding: 8, borderRadius: 20 },
  headerTitle: { color: "#FFFFFF", fontWeight: "700", fontSize: 18 },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", paddingHorizontal: 16 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: "#FFFFFF" },
  tabsRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  tabButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12 },
  tabActive: { backgroundColor: "#FFFFFF" },
  tabInactive: { backgroundColor: "rgba(255,255,255,0.1)" },
  tabText: { fontWeight: "500", fontSize: 14 },
  tabTextActive: { color: "#7C3AED" },
  tabTextInactive: { color: "#FFFFFF" },
  listContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { fontWeight: "600", fontSize: 16, color: "#1A1A2E" },
  sectionCount: { fontSize: 14, color: "#6B7280" },
  travelCard: { backgroundColor: "#F8F9FA", borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cardTopLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  operatorName: { fontWeight: "600", fontSize: 14, color: "#1A1A2E" },
  operatorType: { fontSize: 12, color: "#6B7280" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 14, fontWeight: "500", color: "#1A1A2E" },
  routeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  routePoint: { alignItems: "center" },
  routeTime: { fontWeight: "700", fontSize: 15, color: "#1A1A2E" },
  routeCity: { fontSize: 12, color: "#6B7280" },
  routeMiddle: { flex: 1, paddingHorizontal: 16, alignItems: "center" },
  routeLine: { height: 1, flex: 1, backgroundColor: "#E5E7EB" },
  durationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginVertical: 4 },
  durationText: { fontSize: 12, color: "#6B7280" },
  cardBottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  seatsText: { fontSize: 12, color: "#6B7280" },
  priceBookRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  priceText: { fontSize: 20, fontWeight: "700", color: "#7C3AED" },
  bookButton: { backgroundColor: "#7C3AED", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  bookButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },
  flightTime: { fontWeight: "700", fontSize: 17, color: "#1A1A2E" },
  airportCode: { fontWeight: "500", fontSize: 14, color: "#1A1A2E" },
  flightMiddleCol: { alignItems: "center", gap: 4, flex: 1 },
  routeLineRow: { flexDirection: "row", alignItems: "center", width: "100%", gap: 4 },
  stopsText: { fontSize: 12, color: "#6B7280" },
  flightPrice: { fontSize: 22, fontWeight: "700", color: "#7C3AED" },
  borderTop: { borderTopWidth: 1, borderTopColor: "#E5E7EB", paddingTop: 12 },
  hotelTopRow: { flexDirection: "row", gap: 16 },
  hotelImagePlaceholder: { width: 80, height: 80, borderRadius: 12, backgroundColor: "rgba(245,158,11,0.1)", justifyContent: "center", alignItems: "center" },
  hotelInfo: { flex: 1 },
  hotelNameRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  hotelName: { fontWeight: "600", fontSize: 15, color: "#1A1A2E" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  locationText: { fontSize: 12, color: "#6B7280" },
  typeBadge: { backgroundColor: "#F8F9FA", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  typeBadgeText: { fontSize: 12, color: "#6B7280" },
  hotelRatingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  reviewsText: { fontSize: 12, color: "#6B7280" },
  amenitiesRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 8 },
  amenityChip: { backgroundColor: "#F8F9FA", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  amenityText: { fontSize: 11, color: "#6B7280" },
  perNightText: { fontSize: 12, color: "#6B7280" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
  bookingSummary: { backgroundColor: "#F8F9FA", borderRadius: 8, padding: 16, marginBottom: 16 },
  summaryTitle: { fontWeight: "600", fontSize: 16, color: "#1A1A2E" },
  summarySubtext: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  summaryPrice: { fontSize: 18, fontWeight: "700", color: "#7C3AED", marginTop: 8 },
  formLabel: { fontSize: 14, fontWeight: "500", color: "#1A1A2E", marginBottom: 8, marginTop: 12 },
  formInput: { backgroundColor: "#F8F9FA", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: "#1A1A2E" },
  pickerRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  pickerOption: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: "#F8F9FA", borderWidth: 1, borderColor: "#E5E7EB" },
  pickerOptionActive: { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },
  pickerText: { fontSize: 14, color: "#1A1A2E", fontWeight: "500" },
  pickerTextActive: { color: "#FFFFFF" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16, marginBottom: 12 },
  totalLabel: { color: "#6B7280", fontSize: 15 },
  totalAmount: { fontSize: 24, fontWeight: "700", color: "#7C3AED" },
  confirmButton: { backgroundColor: "#7C3AED", borderRadius: 8, height: 52, justifyContent: "center", alignItems: "center" },
  confirmButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 16 },
});
