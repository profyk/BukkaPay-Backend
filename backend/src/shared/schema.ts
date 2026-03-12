import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  phone: text("phone"),
  countryCode: text("country_code").default("+1"),
  password: text("password"),
  avatar: text("avatar"),
  biometricEnabled: boolean("biometric_enabled").default(false),
  verified: boolean("verified").default(false),
  loyaltyPoints: integer("loyalty_points").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const walletCards = pgTable("wallet_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0"),
  currency: text("currency").notNull().default("$"),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  cardNumber: text("card_number").notNull(),
  frozen: boolean("frozen").default(false),
  spendingLimit: decimal("spending_limit", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cardId: varchar("card_id").references(() => walletCards.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  category: text("category").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(),
  icon: text("icon").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  username: text("username").notNull(),
  color: text("color").notNull(),
  isFavorite: boolean("is_favorite").default(false),
});

export const paymentRequests = pgTable("payment_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  recipientName: text("recipient_name"),
  recipientPhone: text("recipient_phone"),
  status: text("status").notNull().default("pending"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const loyaltyRewards = pgTable("loyalty_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  pointsEarned: integer("points_earned").notNull(),
  pointsRedeemed: integer("points_redeemed").default(0),
  tier: text("tier").default("bronze"),
  totalPoints: integer("total_points").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const autoPays = pgTable("auto_pays", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  billName: text("bill_name").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  frequency: text("frequency").notNull(),
  nextPaymentDate: timestamp("next_payment_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const beneficiaries = pgTable("beneficiaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  walletId: varchar("wallet_id").notNull(),
  isFavorite: boolean("is_favorite").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const challenges = pgTable("challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  target: decimal("target", { precision: 10, scale: 2 }),
  current: decimal("current", { precision: 10, scale: 2 }).default("0"),
  reward: integer("reward").default(0),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  badge: text("badge").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  isUserMessage: boolean("is_user_message").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const billSplits = pgTable("bill_splits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  participants: jsonb("participants"),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const securitySettings = pgTable("security_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cardsFrozen: jsonb("cards_frozen"),
  whitelistedMerchants: jsonb("whitelisted_merchants"),
  fraudAlerts: boolean("fraud_alerts").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const familyMembers = pgTable("family_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  childId: varchar("child_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role").default("child"),
  monthlyAllowance: decimal("monthly_allowance", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const virtualCards = pgTable("virtual_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cardNumber: varchar("card_number").notNull().unique(),
  cvv: varchar("cvv").notNull(),
  expiryDate: varchar("expiry_date").notNull(),
  spendingLimit: decimal("spending_limit", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stokvels = pgTable("stokvels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  purpose: text("purpose"),
  contributionAmount: decimal("contribution_amount", { precision: 10, scale: 2 }).notNull(),
  contributionFrequency: text("contribution_frequency").notNull(),
  payoutDate: timestamp("payout_date"),
  totalMembers: integer("total_members").default(1),
  totalContributed: decimal("total_contributed", { precision: 12, scale: 2 }).default("0"),
  status: text("status").default("active"),
  icon: text("icon").default("👥"),
  color: text("color").default("from-purple-600 to-pink-600"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stokvelMembers = pgTable("stokvel_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stokvelId: varchar("stokvel_id").notNull().references(() => stokvels.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").defaultNow(),
  totalContributed: decimal("total_contributed", { precision: 10, scale: 2 }).default("0"),
  status: text("status").default("active"),
});

export const stokvelContributions = pgTable("stokvel_contributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stokvelId: varchar("stokvel_id").notNull().references(() => stokvels.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp("due_date"),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stokvelPayouts = pgTable("stokvel_payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stokvelId: varchar("stokvel_id").notNull().references(() => stokvels.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  payoutDate: timestamp("payout_date"),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Multi-Merchant Schema
export const merchants = pgTable("merchants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  businessName: text("business_name").notNull(),
  businessType: text("business_type").notNull(),
  businessCategory: text("business_category"),
  qrCode: text("qr_code").notNull().unique(),
  paymentLink: text("payment_link").notNull().unique(),
  walletBalance: decimal("wallet_balance", { precision: 12, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true),
  dailyLimit: decimal("daily_limit", { precision: 10, scale: 2 }).default("10000"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const merchantTransactions = pgTable("merchant_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantId: varchar("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  payerId: varchar("payer_id").references(() => users.id, { onDelete: "set null" }),
  payerName: text("payer_name"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull().default("payment"),
  status: text("status").notNull().default("completed"),
  reference: text("reference"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  walletId: z.string().optional(),
  phone: z.string().optional(),
  countryCode: z.string().optional(),
  biometricEnabled: z.boolean().optional(),
  verified: z.boolean().optional(),
  loyaltyPoints: z.number().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string(),
});

// @ts-ignore - drizzle-zod type compatibility
export const insertWalletCardSchema = (createInsertSchema(walletCards) as any).omit({ id: true, createdAt: true });
// @ts-ignore - drizzle-zod type compatibility
export const insertTransactionSchema = (createInsertSchema(transactions) as any).omit({ id: true, createdAt: true });
// @ts-ignore - drizzle-zod type compatibility
export const insertContactSchema = (createInsertSchema(contacts) as any).omit({ id: true });
// @ts-ignore - drizzle-zod type compatibility
export const insertPaymentRequestSchema = (createInsertSchema(paymentRequests) as any).omit({ id: true, createdAt: true });
// @ts-ignore - drizzle-zod type compatibility
export const insertLoyaltyRewardSchema = (createInsertSchema(loyaltyRewards) as any).omit({ id: true, createdAt: true });
// @ts-ignore - drizzle-zod type compatibility
export const insertAutoPaySchema = (createInsertSchema(autoPays) as any).omit({ id: true, createdAt: true });
// @ts-ignore - drizzle-zod type compatibility
export const insertBeneficiarySchema = (createInsertSchema(beneficiaries) as any).omit({ id: true, createdAt: true });
// @ts-ignore - drizzle-zod type compatibility
export const insertChallengeSchema = (createInsertSchema(challenges) as any).omit({ id: true, createdAt: true });
// @ts-ignore - drizzle-zod type compatibility
export const insertAchievementSchema = (createInsertSchema(achievements) as any).omit({ id: true });
// @ts-ignore - drizzle-zod type compatibility
export const insertChatMessageSchema = (createInsertSchema(chatMessages) as any).omit({ id: true, createdAt: true });
// @ts-ignore - drizzle-zod type compatibility
export const insertBillSplitSchema = (createInsertSchema(billSplits) as any).omit({ id: true, createdAt: true });
// @ts-ignore - drizzle-zod type compatibility
export const insertVirtualCardSchema = (createInsertSchema(virtualCards) as any).omit({ id: true, createdAt: true });

export const insertMerchantSchema = z.object({
  userId: z.string().optional(),
  businessName: z.string().min(1, "Business name is required"),
  businessType: z.string().min(1, "Business type is required"),
  businessCategory: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  dailyLimit: z.string().optional(),
});
// @ts-ignore - drizzle-zod type compatibility
export const insertMerchantTransactionSchema = (createInsertSchema(merchantTransactions) as any).omit({ id: true, createdAt: true });

// Rental Payment System Schema
export const properties = pgTable("properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantId: varchar("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  landlordId: varchar("landlord_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address"),
  propertyType: text("property_type").notNull().default("apartment"),
  totalUnits: integer("total_units").default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const propertyUnits = pgTable("property_units", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  unitNumber: text("unit_number").notNull(),
  monthlyRent: decimal("monthly_rent", { precision: 10, scale: 2 }).notNull(),
  isOccupied: boolean("is_occupied").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: text("tenant_id").notNull().unique(),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  unitId: varchar("unit_id").notNull().references(() => propertyUnits.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  moveInDate: timestamp("move_in_date").defaultNow(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rentPayments = pgTable("rent_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  unitId: varchar("unit_id").notNull().references(() => propertyUnits.id, { onDelete: "cascade" }),
  merchantId: varchar("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  rentMonth: text("rent_month").notNull(),
  paymentMethod: text("payment_method").default("wallet"),
  status: text("status").notNull().default("completed"),
  reference: text("reference"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rentPaymentLinks = pgTable("rent_payment_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  linkCode: text("link_code").notNull().unique(),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  merchantId: varchar("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  rentMonth: text("rent_month").notNull(),
  status: text("status").notNull().default("pending"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const webauthnCredentials = pgTable("webauthn_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  credentialId: text("credential_id").notNull().unique(),
  publicKey: text("public_key").notNull(),
  counter: integer("counter").notNull().default(0),
  deviceType: text("device_type"),
  transports: text("transports"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const giftCards = pgTable("gift_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  recipientEmail: text("recipient_email"),
  recipientPhone: text("recipient_phone"),
  recipientName: text("recipient_name").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("$"),
  message: text("message"),
  code: varchar("code").notNull().unique(),
  status: text("status").notNull().default("pending"),
  design: text("design").notNull().default("default"),
  redeemedBy: varchar("redeemed_by").references(() => users.id),
  redeemedAt: timestamp("redeemed_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contributionGroups = pgTable("contribution_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  targetAmount: decimal("target_amount", { precision: 10, scale: 2 }),
  currentAmount: decimal("current_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  currency: text("currency").notNull().default("$"),
  shareCode: varchar("share_code").notNull().unique(),
  isActive: boolean("is_active").default(true),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contributions = pgTable("contributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => contributionGroups.id, { onDelete: "cascade" }),
  contributorId: varchar("contributor_id").references(() => users.id),
  contributorName: text("contributor_name").notNull(),
  contributorPhone: text("contributor_phone"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  message: text("message"),
  isAnonymous: boolean("is_anonymous").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// @ts-ignore - drizzle-zod type compatibility
export const insertWebauthnCredentialSchema = (createInsertSchema(webauthnCredentials) as any).omit({ id: true, createdAt: true });
// @ts-ignore - drizzle-zod type compatibility
export const insertGiftCardSchema = (createInsertSchema(giftCards) as any).omit({ id: true, createdAt: true, code: true });
// @ts-ignore - drizzle-zod type compatibility
export const insertContributionGroupSchema = (createInsertSchema(contributionGroups) as any).omit({ id: true, createdAt: true, shareCode: true, currentAmount: true });
// @ts-ignore - drizzle-zod type compatibility
export const insertContributionSchema = (createInsertSchema(contributions) as any).omit({ id: true, createdAt: true });

// Purchase Transactions for Purchases Hub
export const purchaseTransactions = pgTable("purchase_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // airtime, electricity, ticket, hotel, rental, marketplace, contribution, transfer
  merchantName: text("merchant_name").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("success"), // success, pending, failed, refunded
  reference: text("reference").notNull().unique(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// @ts-ignore - drizzle-zod type compatibility
export const insertPurchaseTransactionSchema = (createInsertSchema(purchaseTransactions) as any).omit({ id: true, createdAt: true, updatedAt: true });

// @ts-ignore - drizzle-zod type compatibility
export const insertPropertySchema = (createInsertSchema(properties) as any).omit({ id: true, createdAt: true });
// @ts-ignore - drizzle-zod type compatibility
export const insertPropertyUnitSchema = (createInsertSchema(propertyUnits) as any).omit({ id: true, createdAt: true });
// @ts-ignore - drizzle-zod type compatibility
export const insertTenantSchema = (createInsertSchema(tenants) as any).omit({ id: true, createdAt: true, tenantId: true });
// @ts-ignore - drizzle-zod type compatibility
export const insertRentPaymentSchema = (createInsertSchema(rentPayments) as any).omit({ id: true, createdAt: true });
// @ts-ignore - drizzle-zod type compatibility
export const insertRentPaymentLinkSchema = (createInsertSchema(rentPaymentLinks) as any).omit({ id: true, createdAt: true });

export type LoginInput = z.infer<typeof loginSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Merchant = typeof merchants.$inferSelect;
export type InsertMerchant = z.infer<typeof insertMerchantSchema>;
export type MerchantTransaction = typeof merchantTransactions.$inferSelect;
export type InsertMerchantTransaction = z.infer<typeof insertMerchantTransactionSchema>;
export type WalletCard = typeof walletCards.$inferSelect;
export type InsertWalletCard = z.infer<typeof insertWalletCardSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type PaymentRequest = typeof paymentRequests.$inferSelect;
export type InsertPaymentRequest = z.infer<typeof insertPaymentRequestSchema>;
export type LoyaltyReward = typeof loyaltyRewards.$inferSelect;
export type AutoPay = typeof autoPays.$inferSelect;
export type Beneficiary = typeof beneficiaries.$inferSelect;
export type Challenge = typeof challenges.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type BillSplit = typeof billSplits.$inferSelect;
export type VirtualCard = typeof virtualCards.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type PropertyUnit = typeof propertyUnits.$inferSelect;
export type InsertPropertyUnit = z.infer<typeof insertPropertyUnitSchema>;
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type RentPayment = typeof rentPayments.$inferSelect;
export type InsertRentPayment = z.infer<typeof insertRentPaymentSchema>;
export type RentPaymentLink = typeof rentPaymentLinks.$inferSelect;
export type InsertRentPaymentLink = z.infer<typeof insertRentPaymentLinkSchema>;
export type WebauthnCredential = typeof webauthnCredentials.$inferSelect;
export type InsertWebauthnCredential = z.infer<typeof insertWebauthnCredentialSchema>;
export type GiftCard = typeof giftCards.$inferSelect;
export type InsertGiftCard = z.infer<typeof insertGiftCardSchema>;
export type ContributionGroup = typeof contributionGroups.$inferSelect;
export type InsertContributionGroup = z.infer<typeof insertContributionGroupSchema>;
export type Contribution = typeof contributions.$inferSelect;
export type InsertContribution = z.infer<typeof insertContributionSchema>;
export type PurchaseTransaction = typeof purchaseTransactions.$inferSelect;
export type InsertPurchaseTransaction = z.infer<typeof insertPurchaseTransactionSchema>;
