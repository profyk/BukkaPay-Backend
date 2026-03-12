import { db } from "./db/index";
import { users, walletCards, transactions, contacts } from "./shared/schema";

async function seed() {
  console.log("Seeding database...");

  const [user] = await db.insert(users).values({
    walletId: "BKP-DEMO00000000",
    name: "Alex Morgan",
    email: "alex.morgan@example.com",
    username: "alex_morgan",
    password: "demo-hashed-password",
  }).onConflictDoNothing().returning();

  const userId = user?.id;
  console.log("User created:", user?.username);
  if (!userId) { console.log("User already exists, skipping seed."); return; }

  await db.insert(walletCards).values([
    {
      userId,
      title: "Fuel",
      balance: "1250.50",
      currency: "$",
      icon: "fuel",
      color: "blue",
      cardNumber: "**** 4582",
    },
    {
      userId,
      title: "Groceries",
      balance: "450.75",
      currency: "$",
      icon: "shopping-cart",
      color: "green",
      cardNumber: "**** 9921",
    },
    {
      userId,
      title: "Transport",
      balance: "85.20",
      currency: "$",
      icon: "bus",
      color: "purple",
      cardNumber: "**** 3310",
    },
    {
      userId,
      title: "Leisure",
      balance: "320.00",
      currency: "$",
      icon: "coffee",
      color: "orange",
      cardNumber: "**** 1209",
    },
  ]).onConflictDoNothing();

  console.log("Cards created");

  await db.insert(transactions).values([
    {
      userId,
      title: "Shell Station",
      category: "Fuel",
      amount: "-45.00",
      type: "expense",
      icon: "fuel",
    },
    {
      userId,
      title: "Sarah Jenkins",
      category: "Transfer",
      amount: "150.00",
      type: "income",
      icon: "arrow-down-left",
    },
    {
      userId,
      title: "Whole Foods",
      category: "Groceries",
      amount: "-123.45",
      type: "expense",
      icon: "shopping-cart",
    },
  ]).onConflictDoNothing();

  console.log("Transactions created");

  await db.insert(contacts).values([
    { userId, name: "Sarah", username: "sarah_j", color: "pink" },
    { userId, name: "Mike", username: "mike_d", color: "blue" },
    { userId, name: "Mom", username: "mom", color: "purple" },
    { userId, name: "David", username: "david_k", color: "green" },
  ]).onConflictDoNothing();

  console.log("Contacts created");
  console.log("Seeding complete!");
}

seed().catch(console.error);
