import crypto from "crypto";
import { storage } from "./storage";
import type { LoginInput, InsertUser } from "./shared/schema";

export async function hashPassword(password: string): Promise<string> {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return (await hashPassword(password)) === hash;
}

export function generateWalletId(): string {
  return `BKP-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
}

export async function signup(data: InsertUser) {
  const existingUser = await storage.getUserByEmail(data.email);
  if (existingUser) {
    throw new Error("Email already registered");
  }

  const existingUsername = await storage.getUserByUsername(data.username);
  if (existingUsername) {
    throw new Error("Username already taken");
  }

  if (!data.password) {
    throw new Error("Password is required");
  }

  const hashedPassword = await hashPassword(data.password);
  const walletId = generateWalletId();
  
  const user = await storage.createUser({
    ...data,
    password: hashedPassword,
    walletId,
  });

  return user;
}

export async function login(input: LoginInput) {
  const user = await storage.getUserByEmail(input.email);
  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (!user.password) {
    throw new Error("Invalid email or password");
  }

  const passwordValid = await verifyPassword(input.password, user.password);
  if (!passwordValid) {
    throw new Error("Invalid email or password");
  }

  return user;
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
