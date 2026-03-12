import type { Express, Request, Response } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { signup, login, generateSessionToken, hashPassword } from "./auth";
import { insertWalletCardSchema, insertTransactionSchema, insertContactSchema, insertUserSchema, loginSchema, insertPaymentRequestSchema, insertLoyaltyRewardSchema, insertAutoPaySchema, insertBeneficiarySchema, insertChallengeSchema, insertVirtualCardSchema, insertMerchantSchema, insertMerchantTransactionSchema, insertPropertySchema, insertPropertyUnitSchema, insertTenantSchema, insertRentPaymentSchema, insertGiftCardSchema, insertContributionGroupSchema, insertContributionSchema } from "./shared/schema";
import crypto from "crypto";
import { fromZodError } from "zod-validation-error";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/server";

const sessions = new Map<string, { userId: string; expiresAt: number }>();
const webauthnChallenges = new Map<string, { challenge: string; expiresAt: number }>();

const rpName = "BukkaPay";
const rpID = process.env.REPL_SLUG ? `${process.env.REPL_SLUG}.${process.env.REPL_OWNER?.toLowerCase()}.repl.co` : "localhost";
const origin = process.env.REPL_SLUG ? `https://${rpID}` : "http://localhost:5000";

function getUserIdFromRequest(req: Request): string | null {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  
  return session.userId;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Auth Routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const validation = insertUserSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error as any).message });
      }

      const user = await signup(validation.data);
      
      // Create single default card for new users
      await storage.createWalletCard({
        userId: user.id,
        title: "💳 BukkaPay",
        balance: "0.00",
        currency: "$",
        icon: "credit-card",
        color: "from-blue-900 to-blue-800",
        cardNumber: "4532 **** **** 1234"
      });

      const token = generateSessionToken();
      sessions.set(token, { userId: user.id, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 });

      res.status(201).json({
        token,
        user: { id: user.id, walletId: user.walletId, name: user.name, email: user.email, username: user.username, phone: user.phone, countryCode: user.countryCode, loyaltyPoints: user.loyaltyPoints, biometricEnabled: user.biometricEnabled },
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error as any).message });
      }

      const user = await login(validation.data);
      const token = generateSessionToken();
      sessions.set(token, { userId: user.id, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 });

      res.json({
        token,
        user: { id: user.id, walletId: user.walletId, name: user.name, email: user.email, username: user.username, phone: user.phone, countryCode: user.countryCode, loyaltyPoints: user.loyaltyPoints, biometricEnabled: user.biometricEnabled },
      });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (token) sessions.delete(token);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Password reset tokens storage (in production, use database with expiration)
  const resetTokens = new Map<string, { email: string; expires: number }>();

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists for security, but still return success
        return res.json({ success: true, message: "If an account with that email exists, we've sent reset instructions." });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const expires = Date.now() + 3600000; // 1 hour

      // Store token
      resetTokens.set(resetToken, { email, expires });

      // In a real app, you would send an email here
      // For demo purposes, we return the reset link
      const resetLink = `/reset-password?token=${resetToken}`;

      res.json({ 
        success: true, 
        message: "Password reset link sent",
        resetLink // Only for demo - remove in production
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ error: "Token and password are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      // Verify token
      const tokenData = resetTokens.get(token);
      if (!tokenData) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }

      if (Date.now() > tokenData.expires) {
        resetTokens.delete(token);
        return res.status(400).json({ error: "Reset token has expired" });
      }

      // Find user and update password
      const user = await storage.getUserByEmail(tokenData.email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Hash new password and update
      const hashedPassword = await hashPassword(password);
      await storage.updateUserPassword(user.id, hashedPassword);

      // Delete used token
      resetTokens.delete(token);

      res.json({ success: true, message: "Password reset successful" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/auth/me", (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      storage.getUser(userId).then(user => {
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json({ id: user.id, walletId: user.walletId, name: user.name, email: user.email, username: user.username, phone: user.phone, countryCode: user.countryCode, loyaltyPoints: user.loyaltyPoints, biometricEnabled: user.biometricEnabled, avatar: user.avatar });
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/auth/profile", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { name, phone, avatar } = req.body;
      if (!name && !phone && !avatar) {
        return res.status(400).json({ error: "At least one field (name, phone, or avatar) is required" });
      }

      const updateData: { name?: string; phone?: string; avatar?: string } = {};
      if (name) updateData.name = name;
      if (phone) updateData.phone = phone;
      if (avatar) updateData.avatar = avatar;

      const updatedUser = await storage.updateUserProfile(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ 
        id: updatedUser.id, 
        walletId: updatedUser.walletId, 
        name: updatedUser.name, 
        email: updatedUser.email, 
        username: updatedUser.username, 
        phone: updatedUser.phone, 
        countryCode: updatedUser.countryCode, 
        loyaltyPoints: updatedUser.loyaltyPoints, 
        biometricEnabled: updatedUser.biometricEnabled,
        avatar: updatedUser.avatar
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Wallet Cards
  app.get("/api/cards", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const cards = await storage.getWalletCards(userId);
      res.json(cards);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/cards/:id", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const card = await storage.getWalletCard(req.params.id, userId);
      if (!card) return res.status(404).json({ error: "Card not found" });
      
      res.json(card);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/cards", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const validation = insertWalletCardSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error as any).message });
      }

      const card = await storage.createWalletCard({
        userId,
        ...validation.data,
      });
      res.status(201).json(card);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/cards/:id/balance", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const { balance } = req.body;
      if (!balance) return res.status(400).json({ error: "Balance is required" });

      const updated = await storage.updateWalletCardBalance(req.params.id, userId, balance);
      if (!updated) return res.status(404).json({ error: "Card not found" });
      
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Transactions
  app.get("/api/transactions", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const transactions = await storage.getTransactions(userId);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const validation = insertTransactionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error as any).message });
      }

      const transaction = await storage.createTransaction({
        userId,
        ...validation.data,
      });
      res.status(201).json(transaction);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Payment Requests
  app.post("/api/payment-requests", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const validation = insertPaymentRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error as any).message });
      }

      const request = await storage.createPaymentRequest({
        userId,
        ...validation.data,
      });
      
      const requester = await storage.getUser(userId);
      res.status(201).json({ ...request, requester });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/payment-requests/:id", async (req, res) => {
    try {
      const request = await storage.getPaymentRequest(req.params.id);
      if (!request) return res.status(404).json({ error: "Payment request not found" });
      
      const requester = await storage.getUser(request.userId);
      res.json({ ...request, requester });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/payment-requests", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const requests = await storage.getPaymentRequestsByUser(userId);
      res.json(requests);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/payment-requests/:id/status", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const { status } = req.body;
      if (!status) return res.status(400).json({ error: "Status is required" });

      const updated = await storage.updatePaymentRequestStatus(req.params.id, status);
      if (!updated) return res.status(404).json({ error: "Payment request not found" });
      
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Contacts
  app.get("/api/contacts", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const contacts = await storage.getContacts(userId);
      res.json(contacts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/contacts", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const validation = insertContactSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error as any).message });
      }

      const contact = await storage.createContact({
        userId,
        ...validation.data,
      });
      res.status(201).json(contact);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Loyalty
  app.get("/api/loyalty", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const reward = await storage.getLoyaltyReward(userId);
      res.json(reward || { userId, totalPoints: 0, tier: "bronze" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Auto Pay
  app.get("/api/autopays", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const autoPays = await storage.getAutoPays(userId);
      res.json(autoPays);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/autopays", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const validation = insertAutoPaySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error as any).message });
      }

      const autoPay = await storage.createAutoPay({
        userId,
        ...validation.data,
      });
      res.status(201).json(autoPay);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Beneficiaries
  app.get("/api/beneficiaries", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const beneficiaries = await storage.getBeneficiaries(userId);
      res.json(beneficiaries);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/beneficiaries", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const validation = insertBeneficiarySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error as any).message });
      }

      const beneficiary = await storage.createBeneficiary({
        userId,
        ...validation.data,
      });
      res.status(201).json(beneficiary);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Challenges
  app.get("/api/challenges", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const challenges = await storage.getChallenges(userId);
      res.json(challenges);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/challenges", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const validation = insertChallengeSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error as any).message });
      }

      const challenge = await storage.createChallenge({
        userId,
        ...validation.data,
      });
      res.status(201).json(challenge);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Virtual Cards
  app.get("/api/virtual-cards", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const cards = await storage.getVirtualCards(userId);
      res.json(cards);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/virtual-cards", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const validation = insertVirtualCardSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error as any).message });
      }

      const card = await storage.createVirtualCard({
        userId,
        ...validation.data,
      });
      res.status(201).json(card);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Merchant Routes
  app.get("/api/merchants", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const merchantsList = await storage.getMerchantsByUser(userId);
      res.json(merchantsList);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/merchants/:id", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const merchant = await storage.getMerchant(req.params.id);
      if (!merchant) return res.status(404).json({ error: "Merchant not found" });
      if (merchant.userId !== userId) return res.status(403).json({ error: "Forbidden" });
      
      res.json(merchant);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/merchants", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const validation = insertMerchantSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error as any).message });
      }

      const qrCode = `BKP-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
      const paymentLink = `pay-${crypto.randomBytes(6).toString('hex')}`;

      const merchant = await storage.createMerchant({
        userId,
        ...validation.data,
        qrCode,
        paymentLink,
      });
      res.status(201).json(merchant);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/merchants/:id/transactions", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const merchant = await storage.getMerchant(req.params.id);
      if (!merchant) return res.status(404).json({ error: "Merchant not found" });
      if (merchant.userId !== userId) return res.status(403).json({ error: "Forbidden" });

      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const txs = await storage.getMerchantTransactions(req.params.id, limit);
      res.json(txs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/merchants/:id/analytics", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const merchant = await storage.getMerchant(req.params.id);
      if (!merchant) return res.status(404).json({ error: "Merchant not found" });
      if (merchant.userId !== userId) return res.status(403).json({ error: "Forbidden" });

      const allTxs = await storage.getMerchantTransactions(req.params.id);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today); monthAgo.setMonth(monthAgo.getMonth() - 1);

      const todayTxs = allTxs.filter(tx => new Date(tx.createdAt) >= today);
      const weekTxs = allTxs.filter(tx => new Date(tx.createdAt) >= weekAgo);
      const monthTxs = allTxs.filter(tx => new Date(tx.createdAt) >= monthAgo);

      const sumAmount = (txs: any[]) => txs.reduce((s, t) => s + parseFloat(t.amount), 0);
      const avgAmount = (txs: any[]) => txs.length > 0 ? sumAmount(txs) / txs.length : 0;

      const uniqueCustomers = new Set(allTxs.filter(tx => tx.payerId).map(tx => tx.payerId));
      const monthCustomers = new Set(monthTxs.filter(tx => tx.payerId).map(tx => tx.payerId));

      const customerMap: Record<string, { name: string; total: number; count: number }> = {};
      for (const tx of allTxs) {
        const key = tx.payerId || tx.payerName || "anonymous";
        if (!customerMap[key]) customerMap[key] = { name: tx.payerName || "Anonymous", total: 0, count: 0 };
        customerMap[key].total += parseFloat(tx.amount);
        customerMap[key].count += 1;
      }
      const topCustomers = Object.values(customerMap).sort((a, b) => b.total - a.total).slice(0, 5);

      const last30Days: { date: string; amount: number; count: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today); d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().split("T")[0];
        const dayTxs = allTxs.filter(tx => new Date(tx.createdAt).toISOString().split("T")[0] === dayStr);
        last30Days.push({ date: dayStr, amount: sumAmount(dayTxs), count: dayTxs.length });
      }

      const last7Days = last30Days.slice(-7);

      const completedTxs = allTxs.filter(tx => tx.status === "completed");
      const pendingTxs = allTxs.filter(tx => tx.status === "pending");
      const failedTxs = allTxs.filter(tx => tx.status === "failed");

      const dailyUsed = sumAmount(todayTxs);
      const dailyLimit = parseFloat(merchant.dailyLimit || "10000");

      const prevMonthStart = new Date(monthAgo); prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
      const prevMonthTxs = allTxs.filter(tx => {
        const d = new Date(tx.createdAt);
        return d >= prevMonthStart && d < monthAgo;
      });
      const monthRevenue = sumAmount(monthTxs);
      const prevMonthRevenue = sumAmount(prevMonthTxs);
      const revenueGrowth = prevMonthRevenue > 0 ? ((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0;

      res.json({
        summary: {
          todayRevenue: sumAmount(todayTxs),
          todayCount: todayTxs.length,
          weekRevenue: sumAmount(weekTxs),
          weekCount: weekTxs.length,
          monthRevenue,
          monthCount: monthTxs.length,
          totalRevenue: sumAmount(allTxs),
          totalCount: allTxs.length,
          avgTransaction: avgAmount(allTxs),
          revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        },
        customers: {
          total: uniqueCustomers.size,
          thisMonth: monthCustomers.size,
          topCustomers,
        },
        dailyChart: last7Days,
        monthlyChart: last30Days,
        statusBreakdown: {
          completed: completedTxs.length,
          pending: pendingTxs.length,
          failed: failedTxs.length,
        },
        dailyLimit: {
          limit: dailyLimit,
          used: dailyUsed,
          remaining: Math.max(0, dailyLimit - dailyUsed),
          percentUsed: dailyLimit > 0 ? Math.round((dailyUsed / dailyLimit) * 100) : 0,
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/merchant-pay/:paymentLink", async (req, res) => {
    try {
      const merchant = await storage.getMerchantByPaymentLink(req.params.paymentLink);
      if (!merchant) return res.status(404).json({ error: "Merchant not found" });
      
      const owner = await storage.getUser(merchant.userId);
      res.json({ 
        merchantId: merchant.id,
        businessName: merchant.businessName,
        businessType: merchant.businessType,
        qrCode: merchant.qrCode,
        ownerName: owner?.name || "Unknown"
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/merchant-pay/:merchantId", async (req, res) => {
    try {
      const { amount, payerName, reference } = req.body;
      if (!amount) return res.status(400).json({ error: "Amount is required" });

      const merchant = await storage.getMerchant(req.params.merchantId);
      if (!merchant) return res.status(404).json({ error: "Merchant not found" });

      const userId = getUserIdFromRequest(req);

      const transaction = await storage.createMerchantTransaction({
        merchantId: merchant.id,
        payerId: userId || undefined,
        payerName: payerName || "Anonymous",
        amount: amount.toString(),
        type: "payment",
        status: "completed",
        reference,
      });

      const newBalance = (parseFloat(merchant.walletBalance || "0") + parseFloat(amount)).toFixed(2);
      await storage.updateMerchantBalance(merchant.id, newBalance);

      res.status(201).json({ transaction, newBalance });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ============================================
  // RENTAL PAYMENT SYSTEM ROUTES
  // ============================================

  // Generate tenant ID: TEN-[YYYYMMDD]-[Random4Digits]
  function generateTenantId(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `TEN-${dateStr}-${random}`;
  }

  // Get all properties for landlord
  app.get("/api/rental/properties", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const props = await storage.getPropertiesByLandlord(userId);
      res.json(props);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create a new property
  app.post("/api/rental/properties", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const { merchantId, name, address, propertyType, totalUnits } = req.body;
      if (!merchantId || !name) {
        return res.status(400).json({ error: "Merchant ID and name are required" });
      }

      const merchant = await storage.getMerchant(merchantId);
      if (!merchant || merchant.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const property = await storage.createProperty({
        merchantId,
        landlordId: userId,
        name,
        address,
        propertyType: propertyType || "apartment",
        totalUnits: totalUnits || 1,
      });

      res.status(201).json(property);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get property details
  app.get("/api/rental/properties/:id", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const property = await storage.getProperty(req.params.id);
      if (!property) return res.status(404).json({ error: "Property not found" });
      if (property.landlordId !== userId) return res.status(403).json({ error: "Forbidden" });

      res.json(property);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get units for a property
  app.get("/api/rental/properties/:id/units", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const property = await storage.getProperty(req.params.id);
      if (!property) return res.status(404).json({ error: "Property not found" });
      if (property.landlordId !== userId) return res.status(403).json({ error: "Forbidden" });

      const units = await storage.getPropertyUnits(req.params.id);
      res.json(units);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create a unit in a property
  app.post("/api/rental/properties/:id/units", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const property = await storage.getProperty(req.params.id);
      if (!property) return res.status(404).json({ error: "Property not found" });
      if (property.landlordId !== userId) return res.status(403).json({ error: "Forbidden" });

      const { unitNumber, monthlyRent } = req.body;
      if (!unitNumber || !monthlyRent) {
        return res.status(400).json({ error: "Unit number and monthly rent are required" });
      }

      const unit = await storage.createPropertyUnit({
        propertyId: req.params.id,
        unitNumber,
        monthlyRent: monthlyRent.toString(),
      });

      res.status(201).json(unit);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all tenants for landlord
  app.get("/api/rental/tenants", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const allTenants = await storage.getTenantsByLandlord(userId);
      res.json(allTenants);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create a new tenant
  app.post("/api/rental/tenants", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const { propertyId, unitId, name, email, phone } = req.body;
      if (!propertyId || !unitId || !name) {
        return res.status(400).json({ error: "Property, unit, and name are required" });
      }

      const property = await storage.getProperty(propertyId);
      if (!property || property.landlordId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const tenantIdCode = generateTenantId();
      const tenant = await storage.createTenant({
        tenantId: tenantIdCode,
        propertyId,
        unitId,
        name,
        email,
        phone,
      });

      await storage.updatePropertyUnit(unitId, { isOccupied: true });

      res.status(201).json(tenant);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get tenant by tenant ID (public lookup)
  app.get("/api/rental/tenant-lookup/:tenantId", async (req, res) => {
    try {
      const tenant = await storage.getTenantByTenantId(req.params.tenantId);
      if (!tenant) return res.status(404).json({ error: "Tenant not found" });

      const unit = await storage.getPropertyUnit(tenant.unitId);
      const property = await storage.getProperty(tenant.propertyId);

      res.json({
        id: tenant.id,
        tenantId: tenant.tenantId,
        name: tenant.name,
        propertyName: property?.name,
        unitNumber: unit?.unitNumber,
        monthlyRent: unit?.monthlyRent,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get landlord dashboard data
  app.get("/api/rental/dashboard", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const props = await storage.getPropertiesByLandlord(userId);
      const allTenants = await storage.getTenantsByLandlord(userId);
      
      let totalIncome = 0;
      const tenantDetails = [];
      const currentMonth = new Date().toISOString().slice(0, 7);

      for (const tenant of allTenants) {
        const unit = await storage.getPropertyUnit(tenant.unitId);
        const property = await storage.getProperty(tenant.propertyId);
        const payments = await storage.getRentPaymentsForMonth(tenant.id, currentMonth);
        
        const monthlyRent = parseFloat(unit?.monthlyRent || "0");
        const amountPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
        
        let status: 'unpaid' | 'partial' | 'paid' = 'unpaid';
        if (amountPaid >= monthlyRent) status = 'paid';
        else if (amountPaid > 0) status = 'partial';

        tenantDetails.push({
          id: tenant.id,
          tenantId: tenant.tenantId,
          name: tenant.name,
          email: tenant.email,
          phone: tenant.phone,
          propertyId: tenant.propertyId,
          propertyName: property?.name,
          unitId: tenant.unitId,
          unitNumber: unit?.unitNumber,
          monthlyRent,
          amountPaid,
          status,
        });
      }

      // Calculate total income from all rent payments
      for (const prop of props) {
        const payments = await storage.getRentPaymentsByProperty(prop.id);
        totalIncome += payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      }

      const unpaidCount = tenantDetails.filter(t => t.status === 'unpaid').length;
      const partialCount = tenantDetails.filter(t => t.status === 'partial').length;
      const paidCount = tenantDetails.filter(t => t.status === 'paid').length;

      res.json({
        totalProperties: props.length,
        totalTenants: allTenants.length,
        totalIncome,
        unpaidCount,
        partialCount,
        paidCount,
        properties: props,
        tenants: tenantDetails,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get rent payments for a property
  app.get("/api/rental/properties/:id/payments", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const property = await storage.getProperty(req.params.id);
      if (!property || property.landlordId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const payments = await storage.getRentPaymentsByProperty(req.params.id);
      
      const paymentDetails = await Promise.all(payments.map(async (p) => {
        const tenant = await storage.getTenant(p.tenantId);
        const unit = await storage.getPropertyUnit(p.unitId);
        return {
          ...p,
          tenantName: tenant?.name,
          tenantIdCode: tenant?.tenantId,
          unitNumber: unit?.unitNumber,
        };
      }));

      res.json(paymentDetails);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Make a rent payment (for tenants)
  app.post("/api/rental/pay", async (req, res) => {
    try {
      const { tenantId, amount, paymentMethod, reference } = req.body;
      if (!tenantId || !amount) {
        return res.status(400).json({ error: "Tenant ID and amount are required" });
      }

      const tenant = await storage.getTenantByTenantId(tenantId);
      if (!tenant) return res.status(404).json({ error: "Tenant not found" });

      const property = await storage.getProperty(tenant.propertyId);
      if (!property) return res.status(404).json({ error: "Property not found" });

      const currentMonth = new Date().toISOString().slice(0, 7);

      const payment = await storage.createRentPayment({
        tenantId: tenant.id,
        propertyId: tenant.propertyId,
        unitId: tenant.unitId,
        merchantId: property.merchantId,
        amount: amount.toString(),
        rentMonth: currentMonth,
        paymentMethod: paymentMethod || "wallet",
        status: "completed",
        reference,
      });

      const merchant = await storage.getMerchant(property.merchantId);
      if (merchant) {
        const newBalance = (parseFloat(merchant.walletBalance || "0") + parseFloat(amount)).toFixed(2);
        await storage.updateMerchantBalance(merchant.id, newBalance);
      }

      res.status(201).json(payment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get tenant dashboard (for tenant view)
  app.get("/api/rental/tenant-dashboard", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const tenant = await storage.getTenantByUserId(userId);
      if (!tenant) return res.status(404).json({ error: "Tenant profile not found" });

      const unit = await storage.getPropertyUnit(tenant.unitId);
      const property = await storage.getProperty(tenant.propertyId);
      const currentMonth = new Date().toISOString().slice(0, 7);
      const payments = await storage.getRentPaymentsForMonth(tenant.id, currentMonth);
      const allPayments = await storage.getRentPayments(tenant.id);

      const monthlyRent = parseFloat(unit?.monthlyRent || "0");
      const amountPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      
      let status: 'unpaid' | 'partial' | 'paid' = 'unpaid';
      if (amountPaid >= monthlyRent) status = 'paid';
      else if (amountPaid > 0) status = 'partial';

      res.json({
        id: tenant.id,
        tenantId: tenant.tenantId,
        name: tenant.name,
        propertyName: property?.name,
        unitNumber: unit?.unitNumber,
        monthlyRent,
        amountPaid,
        amountDue: Math.max(0, monthlyRent - amountPaid),
        status,
        dueDate: `${currentMonth}-01`,
        paymentHistory: allPayments,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Link tenant to user account
  app.post("/api/rental/link-tenant", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const { tenantId } = req.body;
      if (!tenantId) return res.status(400).json({ error: "Tenant ID is required" });

      const tenant = await storage.getTenantByTenantId(tenantId);
      if (!tenant) return res.status(404).json({ error: "Tenant not found" });

      if (tenant.userId) {
        return res.status(400).json({ error: "Tenant already linked to an account" });
      }

      const updated = await storage.updateTenant(tenant.id, { userId });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Create rent payment link (landlord sends to tenant)
  app.post("/api/rental/payment-links", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const { tenantId, amount, rentMonth } = req.body;
      if (!tenantId || !amount) {
        return res.status(400).json({ error: "Tenant ID and amount are required" });
      }
      
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: "Amount must be a positive number" });
      }

      const tenant = await storage.getTenant(tenantId);
      if (!tenant) return res.status(404).json({ error: "Tenant not found" });

      const property = await storage.getProperty(tenant.propertyId);
      if (!property || property.landlordId !== userId) {
        return res.status(403).json({ error: "Not authorized to create payment link for this tenant" });
      }

      const linkCode = `RPL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const currentMonth = rentMonth || new Date().toISOString().slice(0, 7);

      const paymentLink = await storage.createRentPaymentLink({
        linkCode,
        tenantId,
        merchantId: property.merchantId,
        amount: amount.toString(),
        rentMonth: currentMonth,
        status: "pending",
      });

      res.status(201).json({
        ...paymentLink,
        shareableLink: `/pay-rent/${linkCode}`,
        tenantName: tenant.name,
        propertyName: property.name,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get payment link details (PUBLIC - no auth required for viewing)
  app.get("/api/rental/payment-links/:linkCode", async (req, res) => {
    try {
      const paymentLink = await storage.getRentPaymentLinkByCode(req.params.linkCode);
      if (!paymentLink) {
        return res.status(404).json({ error: "Payment link not found or expired" });
      }

      if (paymentLink.status === "paid") {
        return res.status(400).json({ error: "This payment link has already been used" });
      }

      const tenant = await storage.getTenant(paymentLink.tenantId);
      const property = tenant ? await storage.getProperty(tenant.propertyId) : null;
      const unit = tenant ? await storage.getPropertyUnit(tenant.unitId) : null;
      const merchant = await storage.getMerchant(paymentLink.merchantId);

      res.json({
        ...paymentLink,
        tenantName: tenant?.name,
        tenantEmail: tenant?.email,
        propertyName: property?.name,
        propertyAddress: property?.address,
        unitNumber: unit?.unitNumber,
        landlordBusinessName: merchant?.businessName,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Pay rent via payment link
  app.post("/api/rental/payment-links/:linkCode/pay", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Please login or create an account to pay" });

      const paymentLink = await storage.getRentPaymentLinkByCode(req.params.linkCode);
      if (!paymentLink) {
        return res.status(404).json({ error: "Payment link not found" });
      }

      if (paymentLink.status === "paid") {
        return res.status(400).json({ error: "This payment link has already been paid" });
      }

      const tenant = await storage.getTenant(paymentLink.tenantId);
      if (!tenant) return res.status(404).json({ error: "Tenant not found" });

      const property = await storage.getProperty(tenant.propertyId);
      if (!property) return res.status(404).json({ error: "Property not found" });

      // Get user's primary card for payment
      const cards = await storage.getCardsByUserId(userId);
      if (!cards || cards.length === 0) {
        return res.status(400).json({ error: "No wallet card found. Please add a card first." });
      }

      const primaryCard = cards[0];
      const cardBalance = parseFloat(primaryCard.balance || "0");
      const paymentAmount = parseFloat(paymentLink.amount);

      if (cardBalance < paymentAmount) {
        return res.status(400).json({ error: "Insufficient funds in your wallet" });
      }

      // Deduct from user's wallet
      const newCardBalance = (cardBalance - paymentAmount).toFixed(2);
      await storage.updateCardBalance(primaryCard.id, newCardBalance);

      // Create transaction record for payer
      await storage.createTransaction({
        userId,
        cardId: primaryCard.id,
        title: `Rent Payment - ${property.name}`,
        category: "Rent",
        amount: (-paymentAmount).toString(),
        type: "rent_payment",
        icon: "home",
      });

      // Create rent payment record
      const rentPayment = await storage.createRentPayment({
        tenantId: tenant.id,
        propertyId: tenant.propertyId,
        unitId: tenant.unitId,
        merchantId: property.merchantId,
        amount: paymentLink.amount,
        rentMonth: paymentLink.rentMonth,
        paymentMethod: "wallet",
        status: "completed",
        reference: `LINK-${paymentLink.linkCode}`,
      });

      // Credit landlord's merchant wallet
      const merchant = await storage.getMerchant(property.merchantId);
      if (merchant) {
        const newMerchantBalance = (parseFloat(merchant.walletBalance || "0") + paymentAmount).toFixed(2);
        await storage.updateMerchantBalance(merchant.id, newMerchantBalance);
      }

      // Mark payment link as paid
      await storage.updateRentPaymentLink(paymentLink.id, { status: "paid" });

      // Link tenant to user if not already linked
      if (!tenant.userId) {
        await storage.updateTenant(tenant.id, { userId });
      }

      res.json({
        success: true,
        message: "Rent payment successful!",
        payment: rentPayment,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // WebAuthn Routes
  
  // Generate registration options (for registering a new biometric credential)
  app.post("/api/webauthn/register/options", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const existingCredentials = await storage.getWebauthnCredentialsByUserId(userId);
      
      const options = await generateRegistrationOptions({
        rpName,
        rpID,
        userID: new TextEncoder().encode(userId),
        userName: user.email,
        userDisplayName: user.name,
        attestationType: "none",
        excludeCredentials: existingCredentials.map(cred => ({
          id: cred.credentialId,
          transports: cred.transports ? (cred.transports.split(",") as any) : undefined,
        })),
        authenticatorSelection: {
          residentKey: "preferred",
          userVerification: "preferred",
          authenticatorAttachment: "platform",
        },
      });

      // Store challenge for verification
      webauthnChallenges.set(userId, {
        challenge: options.challenge,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      });

      res.json(options);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Verify registration response
  app.post("/api/webauthn/register/verify", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const challengeData = webauthnChallenges.get(userId);
      if (!challengeData || challengeData.expiresAt < Date.now()) {
        webauthnChallenges.delete(userId);
        return res.status(400).json({ error: "Challenge expired or not found" });
      }

      const response = req.body as RegistrationResponseJSON;
      
      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: challengeData.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      });

      if (!verification.verified || !verification.registrationInfo) {
        return res.status(400).json({ error: "Verification failed" });
      }

      const { credential, credentialDeviceType } = verification.registrationInfo;
      
      // Store credential
      await storage.createWebauthnCredential({
        userId,
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey).toString("base64"),
        counter: credential.counter,
        deviceType: credentialDeviceType,
        transports: response.response.transports?.join(","),
      });

      // Enable biometric for user
      await storage.updateUserBiometricEnabled(userId, true);

      webauthnChallenges.delete(userId);
      res.json({ success: true, message: "Biometric credential registered successfully" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Generate authentication options (for logging in with biometrics)
  app.post("/api/webauthn/authenticate/options", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email is required" });

      const user = await storage.getUserByEmail(email);
      if (!user) return res.status(404).json({ error: "User not found" });

      const credentials = await storage.getWebauthnCredentialsByUserId(user.id);
      if (credentials.length === 0) {
        return res.status(400).json({ error: "No biometric credentials found. Please set up biometrics first." });
      }

      const options = await generateAuthenticationOptions({
        rpID,
        userVerification: "preferred",
        allowCredentials: credentials.map(cred => ({
          id: cred.credentialId,
          transports: cred.transports ? (cred.transports.split(",") as any) : undefined,
        })),
      });

      // Store challenge for verification
      webauthnChallenges.set(user.id, {
        challenge: options.challenge,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      res.json({ options, userId: user.id });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Verify authentication response
  app.post("/api/webauthn/authenticate/verify", async (req, res) => {
    try {
      const { response: authResponse, userId } = req.body as { response: AuthenticationResponseJSON; userId: string };
      
      if (!userId) return res.status(400).json({ error: "User ID is required" });

      const challengeData = webauthnChallenges.get(userId);
      if (!challengeData || challengeData.expiresAt < Date.now()) {
        webauthnChallenges.delete(userId);
        return res.status(400).json({ error: "Challenge expired or not found" });
      }

      const credential = await storage.getWebauthnCredentialByCredentialId(authResponse.id);
      if (!credential || credential.userId !== userId) {
        return res.status(400).json({ error: "Credential not found" });
      }

      const verification = await verifyAuthenticationResponse({
        response: authResponse,
        expectedChallenge: challengeData.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
          id: credential.credentialId,
          publicKey: Buffer.from(credential.publicKey, "base64"),
          counter: credential.counter,
        },
      });

      if (!verification.verified) {
        return res.status(400).json({ error: "Verification failed" });
      }

      // Update credential counter
      await storage.updateWebauthnCredentialCounter(credential.id, verification.authenticationInfo.newCounter);

      // Create session
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const token = generateSessionToken();
      sessions.set(token, { userId, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });

      webauthnChallenges.delete(userId);
      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          walletId: user.walletId,
          phone: user.phone,
          countryCode: user.countryCode,
          loyaltyPoints: user.loyaltyPoints,
          biometricEnabled: user.biometricEnabled,
        },
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get user's WebAuthn credentials
  app.get("/api/webauthn/credentials", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const credentials = await storage.getWebauthnCredentialsByUserId(userId);
      res.json(credentials.map(c => ({
        id: c.id,
        deviceType: c.deviceType,
        createdAt: c.createdAt,
      })));
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete a WebAuthn credential
  app.delete("/api/webauthn/credentials/:id", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      await storage.deleteWebauthnCredential(req.params.id);
      
      // Check if user still has credentials
      const remaining = await storage.getWebauthnCredentialsByUserId(userId);
      if (remaining.length === 0) {
        await storage.updateUserBiometricEnabled(userId, false);
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Disable all WebAuthn credentials (turn off biometrics)
  app.post("/api/webauthn/disable", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      // Delete all credentials for this user
      const credentials = await storage.getWebauthnCredentialsByUserId(userId);
      for (const credential of credentials) {
        await storage.deleteWebauthnCredential(credential.id);
      }

      // Update user's biometric status
      await storage.updateUserBiometricEnabled(userId, false);

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Gift Cards Routes
  app.get("/api/gift-cards", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const sentCards = await storage.getGiftCardsBySender(userId);
      const receivedCards = await storage.getReceivedGiftCards(userId);
      
      res.json({ sent: sentCards, received: receivedCards });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/gift-cards", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const validation = insertGiftCardSchema.safeParse({ ...req.body, senderId: userId });
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error as any).message });
      }

      const code = `GC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const giftCard = await storage.createGiftCard({
        ...validation.data,
        code,
        expiresAt,
      });

      res.status(201).json(giftCard);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/gift-cards/:id", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const giftCard = await storage.getGiftCard(req.params.id);
      if (!giftCard) {
        return res.status(404).json({ error: "Gift card not found" });
      }

      res.json(giftCard);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/gift-cards/code/:code", async (req, res) => {
    try {
      const giftCard = await storage.getGiftCardByCode(req.params.code);
      if (!giftCard) {
        return res.status(404).json({ error: "Gift card not found" });
      }

      res.json(giftCard);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/gift-cards/:id/redeem", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const giftCard = await storage.getGiftCard(req.params.id);
      if (!giftCard) {
        return res.status(404).json({ error: "Gift card not found" });
      }

      if (giftCard.status === "redeemed") {
        return res.status(400).json({ error: "Gift card already redeemed" });
      }

      if (giftCard.expiresAt && new Date(giftCard.expiresAt) < new Date()) {
        return res.status(400).json({ error: "Gift card has expired" });
      }

      const cards = await storage.getWalletCards(userId);
      if (cards.length === 0) {
        return res.status(400).json({ error: "No wallet card found" });
      }

      const primaryCard = cards[0];
      const newBalance = (parseFloat(primaryCard.balance) + parseFloat(giftCard.amount)).toFixed(2);
      await storage.updateWalletCardBalance(primaryCard.id, userId, newBalance);

      const updatedGiftCard = await storage.updateGiftCardStatus(giftCard.id, "redeemed", userId);

      await storage.createTransaction({
        userId,
        cardId: primaryCard.id,
        title: `Gift Card Redeemed`,
        category: "gift",
        amount: giftCard.amount,
        type: "credit",
        icon: "gift",
      });

      res.json(updatedGiftCard);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Contribution Groups Routes
  app.get("/api/contributions", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const groups = await storage.getContributionGroupsByCreator(userId);
      res.json(groups);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/contributions", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const validation = insertContributionGroupSchema.safeParse({ ...req.body, creatorId: userId });
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error as any).message });
      }

      const shareCode = `CON-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      
      const group = await storage.createContributionGroup({
        ...validation.data,
        shareCode,
      });

      res.status(201).json(group);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/contributions/:id", async (req, res) => {
    try {
      const group = await storage.getContributionGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ error: "Contribution group not found" });
      }

      const contributionsList = await storage.getContributionsByGroup(group.id);
      res.json({ group, contributions: contributionsList });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/contributions/code/:code", async (req, res) => {
    try {
      const group = await storage.getContributionGroupByShareCode(req.params.code);
      if (!group) {
        return res.status(404).json({ error: "Contribution group not found" });
      }

      const contributionsList = await storage.getContributionsByGroup(group.id);
      res.json({ group, contributions: contributionsList });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/contributions/:id/contribute", async (req, res) => {
    try {
      const group = await storage.getContributionGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ error: "Contribution group not found" });
      }

      if (!group.isActive) {
        return res.status(400).json({ error: "This contribution group is no longer active" });
      }

      const userId = getUserIdFromRequest(req);
      
      const validation = insertContributionSchema.safeParse({ 
        ...req.body, 
        groupId: group.id,
        contributorId: userId || null,
      });
      
      if (!validation.success) {
        return res.status(400).json({ error: fromZodError(validation.error as any).message });
      }

      const contribution = await storage.createContribution(validation.data);
      
      const newAmount = (parseFloat(group.currentAmount) + parseFloat(contribution.amount)).toFixed(2);
      await storage.updateContributionGroupAmount(group.id, newAmount);

      res.status(201).json(contribution);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Bill Split Routes
  app.get("/api/bill-splits", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const billSplits = await storage.getBillSplitsByUser(userId);
      res.json(billSplits);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/bill-splits", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const { title, totalAmount, participants } = req.body;
      
      if (!title || !totalAmount) {
        return res.status(400).json({ error: "Title and total amount are required" });
      }

      const billSplit = await storage.createBillSplit({
        creatorId: userId,
        title,
        totalAmount: totalAmount.toString(),
        participants: participants || [],
      });

      res.status(201).json(billSplit);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/bill-splits/:id", async (req, res) => {
    try {
      const billSplit = await storage.getBillSplit(req.params.id);
      if (!billSplit) {
        return res.status(404).json({ error: "Bill split not found" });
      }
      res.json(billSplit);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/bill-splits/:id/participants", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const billSplit = await storage.getBillSplit(req.params.id);
      if (!billSplit) {
        return res.status(404).json({ error: "Bill split not found" });
      }

      if (billSplit.creatorId !== userId) {
        return res.status(403).json({ error: "Not authorized to update this bill" });
      }

      const { participants } = req.body;
      const updated = await storage.updateBillSplitParticipants(req.params.id, participants);
      
      // Check if all participants have paid
      const allPaid = participants.every((p: any) => p.paid);
      if (allPaid) {
        await storage.updateBillSplitStatus(req.params.id, "completed");
      }

      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/bill-splits/:id/status", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const billSplit = await storage.getBillSplit(req.params.id);
      if (!billSplit) {
        return res.status(404).json({ error: "Bill split not found" });
      }

      if (billSplit.creatorId !== userId) {
        return res.status(403).json({ error: "Not authorized to update this bill" });
      }

      const { status } = req.body;
      const updated = await storage.updateBillSplitStatus(req.params.id, status);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ==========================================
  // Purchase Transactions Routes (Purchases Hub)
  // ==========================================

  // GET /api/transactions - Get user's purchase transactions with optional filters
  app.get("/api/transactions", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const { category, status, start_date, end_date, limit, offset } = req.query;

      const filters: {
        category?: string;
        status?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        offset?: number;
      } = {};

      if (category && typeof category === "string") filters.category = category;
      if (status && typeof status === "string") filters.status = status;
      if (start_date && typeof start_date === "string") filters.startDate = new Date(start_date);
      if (end_date && typeof end_date === "string") filters.endDate = new Date(end_date);
      if (limit) filters.limit = parseInt(limit as string, 10);
      if (offset) filters.offset = parseInt(offset as string, 10);

      const transactions = await storage.getPurchaseTransactionsByUser(userId, filters);
      res.json(transactions);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // GET /api/transactions/:id - Get single transaction detail
  app.get("/api/transactions/:id", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const transaction = await storage.getPurchaseTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      // Ensure user can only access their own transactions
      if (transaction.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(transaction);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // POST /api/transactions - Create a new purchase transaction (internal use)
  app.post("/api/transactions", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const { category, merchantName, amount, currency, status, metadata } = req.body;

      if (!category || !merchantName || !amount) {
        return res.status(400).json({ error: "Missing required fields: category, merchantName, amount" });
      }

      const reference = `TXN-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

      const transaction = await storage.createPurchaseTransaction({
        userId,
        category,
        merchantName,
        amount: String(amount),
        currency: currency || "USD",
        status: status || "success",
        reference,
        metadata: metadata || null,
      });

      res.status(201).json(transaction);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  return httpServer;
}
