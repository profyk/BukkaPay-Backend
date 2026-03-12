import { db } from "./db/index";
import { users, walletCards, transactions, contacts, paymentRequests, loyaltyRewards, autoPays, beneficiaries, challenges, achievements, chatMessages, billSplits, virtualCards, securitySettings, familyMembers, stokvels, stokvelMembers, merchants, merchantTransactions, properties, propertyUnits, tenants, rentPayments, rentPaymentLinks, webauthnCredentials, giftCards, contributionGroups, contributions, purchaseTransactions } from "./shared/schema";
import type { 
  User, InsertUser, 
  WalletCard, InsertWalletCard,
  Transaction, InsertTransaction,
  Contact, InsertContact,
  PaymentRequest, InsertPaymentRequest,
  LoyaltyReward, AutoPay, Beneficiary, Challenge, Achievement, ChatMessage, BillSplit, VirtualCard,
  Merchant, InsertMerchant, MerchantTransaction, InsertMerchantTransaction,
  Property, InsertProperty, PropertyUnit, InsertPropertyUnit, Tenant, InsertTenant, RentPayment, InsertRentPayment,
  RentPaymentLink, InsertRentPaymentLink,
  WebauthnCredential, InsertWebauthnCredential,
  GiftCard, InsertGiftCard,
  ContributionGroup, InsertContributionGroup, Contribution, InsertContribution,
  PurchaseTransaction, InsertPurchaseTransaction
} from "./shared/schema";
import { eq, desc, and, sql, gte, lte } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByWalletId(walletId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(userId: string, data: { name?: string; phone?: string; avatar?: string }): Promise<User | undefined>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
  
  getWalletCards(userId: string): Promise<WalletCard[]>;
  getWalletCard(id: string, userId: string): Promise<WalletCard | undefined>;
  createWalletCard(card: InsertWalletCard): Promise<WalletCard>;
  updateWalletCardBalance(id: string, userId: string, balance: string): Promise<WalletCard | undefined>;
  
  getTransactions(userId: string, limit?: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  
  getContacts(userId: string): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  
  createPaymentRequest(request: InsertPaymentRequest): Promise<PaymentRequest>;
  getPaymentRequest(id: string): Promise<PaymentRequest | undefined>;
  getPaymentRequestsByUser(userId: string): Promise<PaymentRequest[]>;
  updatePaymentRequestStatus(id: string, status: string): Promise<PaymentRequest | undefined>;
  
  getLoyaltyReward(userId: string): Promise<LoyaltyReward | undefined>;
  updateLoyaltyPoints(userId: string, points: number): Promise<void>;
  
  getAutoPays(userId: string): Promise<AutoPay[]>;
  createAutoPay(autoPay: any): Promise<AutoPay>;
  
  getBeneficiaries(userId: string): Promise<Beneficiary[]>;
  createBeneficiary(beneficiary: any): Promise<Beneficiary>;
  
  getChallenges(userId: string): Promise<Challenge[]>;
  createChallenge(challenge: any): Promise<Challenge>;
  
  getAchievements(userId: string): Promise<Achievement[]>;
  createAchievement(achievement: any): Promise<Achievement>;
  
  createVirtualCard(card: any): Promise<VirtualCard>;
  getVirtualCards(userId: string): Promise<VirtualCard[]>;
  
  // Merchant operations
  createMerchant(merchant: InsertMerchant & { qrCode: string; paymentLink: string }): Promise<Merchant>;
  getMerchant(id: string): Promise<Merchant | undefined>;
  getMerchantByQrCode(qrCode: string): Promise<Merchant | undefined>;
  getMerchantByPaymentLink(paymentLink: string): Promise<Merchant | undefined>;
  getMerchantsByUser(userId: string): Promise<Merchant[]>;
  updateMerchantBalance(id: string, balance: string): Promise<Merchant | undefined>;
  
  // Merchant transactions
  createMerchantTransaction(transaction: InsertMerchantTransaction): Promise<MerchantTransaction>;
  getMerchantTransactions(merchantId: string, limit?: number): Promise<MerchantTransaction[]>;
  
  // Rental system operations
  createProperty(property: InsertProperty): Promise<Property>;
  getProperty(id: string): Promise<Property | undefined>;
  getPropertiesByMerchant(merchantId: string): Promise<Property[]>;
  getPropertiesByLandlord(landlordId: string): Promise<Property[]>;
  updateProperty(id: string, data: Partial<InsertProperty>): Promise<Property | undefined>;
  
  createPropertyUnit(unit: InsertPropertyUnit): Promise<PropertyUnit>;
  getPropertyUnit(id: string): Promise<PropertyUnit | undefined>;
  getPropertyUnits(propertyId: string): Promise<PropertyUnit[]>;
  updatePropertyUnit(id: string, data: Partial<InsertPropertyUnit>): Promise<PropertyUnit | undefined>;
  
  createTenant(tenant: InsertTenant & { tenantId: string }): Promise<Tenant>;
  getTenant(id: string): Promise<Tenant | undefined>;
  getTenantByTenantId(tenantId: string): Promise<Tenant | undefined>;
  getTenantsByProperty(propertyId: string): Promise<Tenant[]>;
  getTenantsByLandlord(landlordId: string): Promise<Tenant[]>;
  getTenantByUserId(userId: string): Promise<Tenant | undefined>;
  updateTenant(id: string, data: Partial<InsertTenant>): Promise<Tenant | undefined>;
  
  createRentPayment(payment: InsertRentPayment): Promise<RentPayment>;
  getRentPayments(tenantId: string): Promise<RentPayment[]>;
  getRentPaymentsByProperty(propertyId: string): Promise<RentPayment[]>;
  getRentPaymentsByMerchant(merchantId: string): Promise<RentPayment[]>;
  getRentPaymentsForMonth(tenantId: string, rentMonth: string): Promise<RentPayment[]>;
  
  // Rent payment links
  createRentPaymentLink(link: InsertRentPaymentLink): Promise<RentPaymentLink>;
  getRentPaymentLinkByCode(linkCode: string): Promise<RentPaymentLink | undefined>;
  updateRentPaymentLink(id: string, data: Partial<InsertRentPaymentLink>): Promise<RentPaymentLink | undefined>;
  
  // Card operations
  getCardsByUserId(userId: string): Promise<WalletCard[]>;
  updateCardBalance(id: string, balance: string): Promise<WalletCard | undefined>;
  
  // WebAuthn credentials
  createWebauthnCredential(credential: InsertWebauthnCredential): Promise<WebauthnCredential>;
  getWebauthnCredentialsByUserId(userId: string): Promise<WebauthnCredential[]>;
  getWebauthnCredentialByCredentialId(credentialId: string): Promise<WebauthnCredential | undefined>;
  updateWebauthnCredentialCounter(id: string, counter: number): Promise<void>;
  deleteWebauthnCredential(id: string): Promise<void>;
  updateUserBiometricEnabled(userId: string, enabled: boolean): Promise<void>;
  
  // Gift cards
  createGiftCard(giftCard: InsertGiftCard & { code: string }): Promise<GiftCard>;
  getGiftCard(id: string): Promise<GiftCard | undefined>;
  getGiftCardByCode(code: string): Promise<GiftCard | undefined>;
  getGiftCardsBySender(senderId: string): Promise<GiftCard[]>;
  getReceivedGiftCards(userId: string): Promise<GiftCard[]>;
  updateGiftCardStatus(id: string, status: string, redeemedBy?: string): Promise<GiftCard | undefined>;
  
  // Contribution groups
  createContributionGroup(group: InsertContributionGroup & { shareCode: string }): Promise<ContributionGroup>;
  getContributionGroup(id: string): Promise<ContributionGroup | undefined>;
  getContributionGroupByShareCode(shareCode: string): Promise<ContributionGroup | undefined>;
  getContributionGroupsByCreator(creatorId: string): Promise<ContributionGroup[]>;
  updateContributionGroupAmount(id: string, amount: string): Promise<ContributionGroup | undefined>;
  
  // Contributions
  createContribution(contribution: InsertContribution): Promise<Contribution>;
  getContributionsByGroup(groupId: string): Promise<Contribution[]>;
  
  // Bill splits
  createBillSplit(billSplit: { creatorId: string; title: string; totalAmount: string; participants: any[] }): Promise<BillSplit>;
  getBillSplit(id: string): Promise<BillSplit | undefined>;
  getBillSplitsByUser(userId: string): Promise<BillSplit[]>;
  updateBillSplitParticipants(id: string, participants: any[]): Promise<BillSplit | undefined>;
  updateBillSplitStatus(id: string, status: string): Promise<BillSplit | undefined>;
  
  // Purchase transactions
  createPurchaseTransaction(transaction: InsertPurchaseTransaction & { reference: string }): Promise<PurchaseTransaction>;
  getPurchaseTransaction(id: string): Promise<PurchaseTransaction | undefined>;
  getPurchaseTransactionsByUser(userId: string, filters?: { category?: string; status?: string; startDate?: Date; endDate?: Date; limit?: number; offset?: number }): Promise<PurchaseTransaction[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByWalletId(walletId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletId, walletId));
    return user;
  }

  async createUser(insertUser: InsertUser & { walletId: string }): Promise<User> {
    const [user] = await db.insert(users).values(insertUser as any).returning();
    return user;
  }

  async getWalletCards(userId: string): Promise<WalletCard[]> {
    return await db.select().from(walletCards).where(eq(walletCards.userId, userId));
  }

  async getWalletCard(id: string, userId: string): Promise<WalletCard | undefined> {
    const [card] = await db.select().from(walletCards)
      .where(and(eq(walletCards.id, id), eq(walletCards.userId, userId)));
    return card;
  }

  async createWalletCard(card: InsertWalletCard): Promise<WalletCard> {
    const [newCard] = await db.insert(walletCards).values(card).returning();
    return newCard;
  }

  async updateWalletCardBalance(id: string, userId: string, balance: string): Promise<WalletCard | undefined> {
    const [updated] = await db.update(walletCards)
      .set({ balance })
      .where(and(eq(walletCards.id, id), eq(walletCards.userId, userId)))
      .returning();
    return updated;
  }

  async getTransactions(userId: string, limit?: number): Promise<Transaction[]> {
    let query = db.select().from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
    
    if (limit) {
      query = query.limit(limit) as any;
    }
    
    return await query;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async getContacts(userId: string): Promise<Contact[]> {
    return await db.select().from(contacts).where(eq(contacts.userId, userId));
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }

  async createPaymentRequest(request: InsertPaymentRequest): Promise<PaymentRequest> {
    const [newRequest] = await db.insert(paymentRequests).values(request).returning();
    return newRequest;
  }

  async getPaymentRequest(id: string): Promise<PaymentRequest | undefined> {
    const [request] = await db.select().from(paymentRequests).where(eq(paymentRequests.id, id));
    return request;
  }

  async getPaymentRequestsByUser(userId: string): Promise<PaymentRequest[]> {
    return await db.select().from(paymentRequests)
      .where(eq(paymentRequests.userId, userId))
      .orderBy(desc(paymentRequests.createdAt));
  }

  async updatePaymentRequestStatus(id: string, status: string): Promise<PaymentRequest | undefined> {
    const [updated] = await db.update(paymentRequests)
      .set({ status })
      .where(eq(paymentRequests.id, id))
      .returning();
    return updated;
  }

  async getLoyaltyReward(userId: string): Promise<LoyaltyReward | undefined> {
    const [reward] = await db.select().from(loyaltyRewards).where(eq(loyaltyRewards.userId, userId));
    return reward;
  }

  async updateLoyaltyPoints(userId: string, points: number): Promise<void> {
    const existing = await this.getLoyaltyReward(userId);
    if (existing) {
      await db.update(loyaltyRewards)
        .set({ totalPoints: (existing.totalPoints ?? 0) + points })
        .where(eq(loyaltyRewards.userId, userId));
    } else {
      await db.insert(loyaltyRewards).values({
        userId,
        pointsEarned: points,
        totalPoints: points,
        tier: "bronze",
      });
    }
  }

  async getAutoPays(userId: string): Promise<AutoPay[]> {
    return await db.select().from(autoPays).where(eq(autoPays.userId, userId));
  }

  async createAutoPay(autoPay: any): Promise<AutoPay> {
    const [newAutoPay] = await db.insert(autoPays).values(autoPay).returning();
    return newAutoPay;
  }

  async getBeneficiaries(userId: string): Promise<Beneficiary[]> {
    return await db.select().from(beneficiaries).where(eq(beneficiaries.userId, userId));
  }

  async createBeneficiary(beneficiary: any): Promise<Beneficiary> {
    const [newBeneficiary] = await db.insert(beneficiaries).values(beneficiary).returning();
    return newBeneficiary;
  }

  async getChallenges(userId: string): Promise<Challenge[]> {
    return await db.select().from(challenges).where(eq(challenges.userId, userId));
  }

  async createChallenge(challenge: any): Promise<Challenge> {
    const [newChallenge] = await db.insert(challenges).values(challenge).returning();
    return newChallenge;
  }

  async getAchievements(userId: string): Promise<Achievement[]> {
    return await db.select().from(achievements).where(eq(achievements.userId, userId));
  }

  async createAchievement(achievement: any): Promise<Achievement> {
    const [newAchievement] = await db.insert(achievements).values(achievement).returning();
    return newAchievement;
  }

  async createVirtualCard(card: any): Promise<VirtualCard> {
    const [newCard] = await db.insert(virtualCards).values(card).returning();
    return newCard;
  }

  async getVirtualCards(userId: string): Promise<VirtualCard[]> {
    return await db.select().from(virtualCards).where(eq(virtualCards.userId, userId));
  }

  async getProduct(productId: string): Promise<any> {
    try {
      const result = await db.execute(
        sql`SELECT * FROM stripe.products WHERE id = ${productId}`
      );
      return result.rows[0] || null;
    } catch {
      return null;
    }
  }

  async listProducts(active = true, limit = 20, offset = 0): Promise<any[]> {
    try {
      const result = await db.execute(
        sql`SELECT * FROM stripe.products WHERE active = ${active} LIMIT ${limit} OFFSET ${offset}`
      );
      return result.rows;
    } catch {
      return [];
    }
  }

  async getPrice(priceId: string): Promise<any> {
    try {
      const result = await db.execute(
        sql`SELECT * FROM stripe.prices WHERE id = ${priceId}`
      );
      return result.rows[0] || null;
    } catch {
      return null;
    }
  }

  async getSubscription(subscriptionId: string): Promise<any> {
    try {
      const result = await db.execute(
        sql`SELECT * FROM stripe.subscriptions WHERE id = ${subscriptionId}`
      );
      return result.rows[0] || null;
    } catch {
      return null;
    }
  }

  async updateUserStripeInfo(userId: string, stripeInfo: any): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set(stripeInfo)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserProfile(userId: string, data: { name?: string; phone?: string; avatar?: string }): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set(data)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));
  }

  // Merchant methods
  async createMerchant(merchant: InsertMerchant & { qrCode: string; paymentLink: string; userId: string }): Promise<Merchant> {
    const [newMerchant] = await db.insert(merchants).values(merchant as any).returning();
    return newMerchant;
  }

  async getMerchant(id: string): Promise<Merchant | undefined> {
    const [merchant] = await db.select().from(merchants).where(eq(merchants.id, id));
    return merchant;
  }

  async getMerchantByQrCode(qrCode: string): Promise<Merchant | undefined> {
    const [merchant] = await db.select().from(merchants).where(eq(merchants.qrCode, qrCode));
    return merchant;
  }

  async getMerchantByPaymentLink(paymentLink: string): Promise<Merchant | undefined> {
    const [merchant] = await db.select().from(merchants).where(eq(merchants.paymentLink, paymentLink));
    return merchant;
  }

  async getMerchantsByUser(userId: string): Promise<Merchant[]> {
    return await db.select().from(merchants)
      .where(eq(merchants.userId, userId))
      .orderBy(desc(merchants.createdAt));
  }

  async updateMerchantBalance(id: string, balance: string): Promise<Merchant | undefined> {
    const [updated] = await db.update(merchants)
      .set({ walletBalance: balance })
      .where(eq(merchants.id, id))
      .returning();
    return updated;
  }

  async createMerchantTransaction(transaction: InsertMerchantTransaction): Promise<MerchantTransaction> {
    const [newTransaction] = await db.insert(merchantTransactions).values(transaction).returning();
    return newTransaction;
  }

  async getMerchantTransactions(merchantId: string, limit?: number): Promise<MerchantTransaction[]> {
    let query = db.select().from(merchantTransactions)
      .where(eq(merchantTransactions.merchantId, merchantId))
      .orderBy(desc(merchantTransactions.createdAt));
    
    if (limit) {
      query = query.limit(limit) as any;
    }
    
    return await query;
  }

  // Rental system methods
  async createProperty(property: InsertProperty): Promise<Property> {
    const [newProperty] = await db.insert(properties).values(property).returning();
    return newProperty;
  }

  async getProperty(id: string): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property;
  }

  async getPropertiesByMerchant(merchantId: string): Promise<Property[]> {
    return await db.select().from(properties)
      .where(eq(properties.merchantId, merchantId))
      .orderBy(desc(properties.createdAt));
  }

  async getPropertiesByLandlord(landlordId: string): Promise<Property[]> {
    return await db.select().from(properties)
      .where(eq(properties.landlordId, landlordId))
      .orderBy(desc(properties.createdAt));
  }

  async updateProperty(id: string, data: Partial<InsertProperty>): Promise<Property | undefined> {
    const [updated] = await db.update(properties)
      .set(data)
      .where(eq(properties.id, id))
      .returning();
    return updated;
  }

  async createPropertyUnit(unit: InsertPropertyUnit): Promise<PropertyUnit> {
    const [newUnit] = await db.insert(propertyUnits).values(unit).returning();
    return newUnit;
  }

  async getPropertyUnit(id: string): Promise<PropertyUnit | undefined> {
    const [unit] = await db.select().from(propertyUnits).where(eq(propertyUnits.id, id));
    return unit;
  }

  async getPropertyUnits(propertyId: string): Promise<PropertyUnit[]> {
    return await db.select().from(propertyUnits)
      .where(eq(propertyUnits.propertyId, propertyId))
      .orderBy(propertyUnits.unitNumber);
  }

  async updatePropertyUnit(id: string, data: Partial<InsertPropertyUnit>): Promise<PropertyUnit | undefined> {
    const [updated] = await db.update(propertyUnits)
      .set(data)
      .where(eq(propertyUnits.id, id))
      .returning();
    return updated;
  }

  async createTenant(tenant: InsertTenant & { tenantId: string }): Promise<Tenant> {
    const [newTenant] = await db.insert(tenants).values(tenant).returning();
    return newTenant;
  }

  async getTenant(id: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }

  async getTenantByTenantId(tenantId: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.tenantId, tenantId));
    return tenant;
  }

  async getTenantsByProperty(propertyId: string): Promise<Tenant[]> {
    return await db.select().from(tenants)
      .where(and(eq(tenants.propertyId, propertyId), eq(tenants.isActive, true)))
      .orderBy(tenants.name);
  }

  async getTenantsByLandlord(landlordId: string): Promise<Tenant[]> {
    const landlordProperties = await this.getPropertiesByLandlord(landlordId);
    const propertyIds = landlordProperties.map(p => p.id);
    
    if (propertyIds.length === 0) return [];
    
    const allTenants: Tenant[] = [];
    for (const propertyId of propertyIds) {
      const propertyTenants = await this.getTenantsByProperty(propertyId);
      allTenants.push(...propertyTenants);
    }
    return allTenants;
  }

  async getTenantByUserId(userId: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.userId, userId));
    return tenant;
  }

  async updateTenant(id: string, data: Partial<InsertTenant>): Promise<Tenant | undefined> {
    const [updated] = await db.update(tenants)
      .set(data)
      .where(eq(tenants.id, id))
      .returning();
    return updated;
  }

  async createRentPayment(payment: InsertRentPayment): Promise<RentPayment> {
    const [newPayment] = await db.insert(rentPayments).values(payment).returning();
    return newPayment;
  }

  async getRentPayments(tenantId: string): Promise<RentPayment[]> {
    return await db.select().from(rentPayments)
      .where(eq(rentPayments.tenantId, tenantId))
      .orderBy(desc(rentPayments.createdAt));
  }

  async getRentPaymentsByProperty(propertyId: string): Promise<RentPayment[]> {
    return await db.select().from(rentPayments)
      .where(eq(rentPayments.propertyId, propertyId))
      .orderBy(desc(rentPayments.createdAt));
  }

  async getRentPaymentsByMerchant(merchantId: string): Promise<RentPayment[]> {
    return await db.select().from(rentPayments)
      .where(eq(rentPayments.merchantId, merchantId))
      .orderBy(desc(rentPayments.createdAt));
  }

  async getRentPaymentsForMonth(tenantId: string, rentMonth: string): Promise<RentPayment[]> {
    return await db.select().from(rentPayments)
      .where(and(eq(rentPayments.tenantId, tenantId), eq(rentPayments.rentMonth, rentMonth)))
      .orderBy(desc(rentPayments.createdAt));
  }

  async createRentPaymentLink(link: InsertRentPaymentLink): Promise<RentPaymentLink> {
    const [created] = await db.insert(rentPaymentLinks).values(link).returning();
    return created;
  }

  async getRentPaymentLinkByCode(linkCode: string): Promise<RentPaymentLink | undefined> {
    const [link] = await db.select().from(rentPaymentLinks).where(eq(rentPaymentLinks.linkCode, linkCode));
    return link;
  }

  async updateRentPaymentLink(id: string, data: Partial<InsertRentPaymentLink>): Promise<RentPaymentLink | undefined> {
    const [updated] = await db.update(rentPaymentLinks).set(data).where(eq(rentPaymentLinks.id, id)).returning();
    return updated;
  }

  async getCardsByUserId(userId: string): Promise<WalletCard[]> {
    return await db.select().from(walletCards).where(eq(walletCards.userId, userId));
  }

  async updateCardBalance(id: string, balance: string): Promise<WalletCard | undefined> {
    const [updated] = await db.update(walletCards).set({ balance }).where(eq(walletCards.id, id)).returning();
    return updated;
  }

  async createWebauthnCredential(credential: InsertWebauthnCredential): Promise<WebauthnCredential> {
    const [created] = await db.insert(webauthnCredentials).values(credential).returning();
    return created;
  }

  async getWebauthnCredentialsByUserId(userId: string): Promise<WebauthnCredential[]> {
    return await db.select().from(webauthnCredentials).where(eq(webauthnCredentials.userId, userId));
  }

  async getWebauthnCredentialByCredentialId(credentialId: string): Promise<WebauthnCredential | undefined> {
    const [credential] = await db.select().from(webauthnCredentials).where(eq(webauthnCredentials.credentialId, credentialId));
    return credential;
  }

  async updateWebauthnCredentialCounter(id: string, counter: number): Promise<void> {
    await db.update(webauthnCredentials).set({ counter }).where(eq(webauthnCredentials.id, id));
  }

  async deleteWebauthnCredential(id: string): Promise<void> {
    await db.delete(webauthnCredentials).where(eq(webauthnCredentials.id, id));
  }

  async updateUserBiometricEnabled(userId: string, enabled: boolean): Promise<void> {
    await db.update(users).set({ biometricEnabled: enabled }).where(eq(users.id, userId));
  }

  async createGiftCard(giftCard: InsertGiftCard & { code: string }): Promise<GiftCard> {
    const [created] = await db.insert(giftCards).values(giftCard).returning();
    return created;
  }

  async getGiftCard(id: string): Promise<GiftCard | undefined> {
    const [giftCard] = await db.select().from(giftCards).where(eq(giftCards.id, id));
    return giftCard;
  }

  async getGiftCardByCode(code: string): Promise<GiftCard | undefined> {
    const [giftCard] = await db.select().from(giftCards).where(eq(giftCards.code, code));
    return giftCard;
  }

  async getGiftCardsBySender(senderId: string): Promise<GiftCard[]> {
    return await db.select().from(giftCards).where(eq(giftCards.senderId, senderId)).orderBy(desc(giftCards.createdAt));
  }

  async getReceivedGiftCards(userId: string): Promise<GiftCard[]> {
    return await db.select().from(giftCards).where(eq(giftCards.redeemedBy, userId)).orderBy(desc(giftCards.createdAt));
  }

  async updateGiftCardStatus(id: string, status: string, redeemedBy?: string): Promise<GiftCard | undefined> {
    const updateData: any = { status };
    if (redeemedBy) {
      updateData.redeemedBy = redeemedBy;
      updateData.redeemedAt = new Date();
    }
    const [updated] = await db.update(giftCards).set(updateData).where(eq(giftCards.id, id)).returning();
    return updated;
  }

  async createContributionGroup(group: InsertContributionGroup & { shareCode: string }): Promise<ContributionGroup> {
    const [created] = await db.insert(contributionGroups).values(group).returning();
    return created;
  }

  async getContributionGroup(id: string): Promise<ContributionGroup | undefined> {
    const [group] = await db.select().from(contributionGroups).where(eq(contributionGroups.id, id));
    return group;
  }

  async getContributionGroupByShareCode(shareCode: string): Promise<ContributionGroup | undefined> {
    const [group] = await db.select().from(contributionGroups).where(eq(contributionGroups.shareCode, shareCode));
    return group;
  }

  async getContributionGroupsByCreator(creatorId: string): Promise<ContributionGroup[]> {
    return await db.select().from(contributionGroups).where(eq(contributionGroups.creatorId, creatorId)).orderBy(desc(contributionGroups.createdAt));
  }

  async updateContributionGroupAmount(id: string, amount: string): Promise<ContributionGroup | undefined> {
    const [updated] = await db.update(contributionGroups).set({ currentAmount: amount }).where(eq(contributionGroups.id, id)).returning();
    return updated;
  }

  async createContribution(contribution: InsertContribution): Promise<Contribution> {
    const [created] = await db.insert(contributions).values(contribution).returning();
    return created;
  }

  async getContributionsByGroup(groupId: string): Promise<Contribution[]> {
    return await db.select().from(contributions).where(eq(contributions.groupId, groupId)).orderBy(desc(contributions.createdAt));
  }

  async createBillSplit(billSplit: { creatorId: string; title: string; totalAmount: string; participants: any[] }): Promise<BillSplit> {
    const [created] = await db.insert(billSplits).values({
      creatorId: billSplit.creatorId,
      title: billSplit.title,
      totalAmount: billSplit.totalAmount,
      participants: billSplit.participants,
      status: "pending"
    }).returning();
    return created;
  }

  async getBillSplit(id: string): Promise<BillSplit | undefined> {
    const [billSplit] = await db.select().from(billSplits).where(eq(billSplits.id, id));
    return billSplit;
  }

  async getBillSplitsByUser(userId: string): Promise<BillSplit[]> {
    return await db.select().from(billSplits).where(eq(billSplits.creatorId, userId)).orderBy(desc(billSplits.createdAt));
  }

  async updateBillSplitParticipants(id: string, participants: any[]): Promise<BillSplit | undefined> {
    const [updated] = await db.update(billSplits).set({ participants }).where(eq(billSplits.id, id)).returning();
    return updated;
  }

  async updateBillSplitStatus(id: string, status: string): Promise<BillSplit | undefined> {
    const [updated] = await db.update(billSplits).set({ status }).where(eq(billSplits.id, id)).returning();
    return updated;
  }

  // Purchase transactions
  async createPurchaseTransaction(transaction: InsertPurchaseTransaction & { reference: string }): Promise<PurchaseTransaction> {
    const [created] = await db.insert(purchaseTransactions).values(transaction).returning();
    return created;
  }

  async getPurchaseTransaction(id: string): Promise<PurchaseTransaction | undefined> {
    const [transaction] = await db.select().from(purchaseTransactions).where(eq(purchaseTransactions.id, id));
    return transaction;
  }

  async getPurchaseTransactionsByUser(
    userId: string, 
    filters?: { category?: string; status?: string; startDate?: Date; endDate?: Date; limit?: number; offset?: number }
  ): Promise<PurchaseTransaction[]> {
    const conditions = [eq(purchaseTransactions.userId, userId)];
    
    if (filters?.category) {
      conditions.push(eq(purchaseTransactions.category, filters.category));
    }
    if (filters?.status) {
      conditions.push(eq(purchaseTransactions.status, filters.status));
    }
    if (filters?.startDate) {
      conditions.push(gte(purchaseTransactions.createdAt, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(purchaseTransactions.createdAt, filters.endDate));
    }

    let query = db.select().from(purchaseTransactions).where(and(...conditions)).orderBy(desc(purchaseTransactions.createdAt));
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as typeof query;
    }
    if (filters?.offset) {
      query = query.offset(filters.offset) as typeof query;
    }

    return await query;
  }
}

export const storage = new DatabaseStorage();
