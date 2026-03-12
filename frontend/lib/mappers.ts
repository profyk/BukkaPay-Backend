const iconMap: Record<string, string> = {
  "fuel": "car",
  "shopping-cart": "cart",
  "bus": "bus",
  "coffee": "cafe",
  "arrow-up-right": "arrow-up",
  "arrow-down-left": "arrow-down",
  "arrow-right-left": "swap-horizontal",
  "credit-card": "card",
  "piggy-bank": "cash",
  "plane": "airplane",
  "wallet": "wallet",
  "gift": "gift",
  "heart": "heart",
  "utensils": "restaurant",
  "home": "home",
  "smartphone": "phone-portrait",
};

const colorMap: Record<string, string> = {
  "blue": "#2563EB",
  "green": "#059669",
  "purple": "#7C3AED",
  "orange": "#F97316",
  "pink": "#EC4899",
  "cyan": "#06B6D4",
  "indigo": "#6366F1",
  "rose": "#F43F5E",
  "teal": "#14B8A6",
  "amber": "#F59E0B",
};

export { iconMap, colorMap };

export function mapCardFromAPI(card: any) {
  return {
    ...card,
    balance: parseFloat(card.balance),
    icon: iconMap[card.icon] || "car",
    color: colorMap[card.color] || "#2563EB",
  };
}

export function mapTransactionFromAPI(tx: any) {
  return {
    ...tx,
    amount: parseFloat(tx.amount),
    date: new Date(tx.createdAt).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
    icon: iconMap[tx.icon] || "arrow-down",
  };
}
