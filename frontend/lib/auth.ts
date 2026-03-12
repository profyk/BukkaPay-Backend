import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { API_BASE } from "./config";

export interface User {
  id: number;
  email: string;
  username: string;
  name: string;
  phone?: string | null;
  walletId?: string | null;
  loyaltyPoints?: number;
  isMerchant?: boolean;
  merchantName?: string | null;
  merchantType?: string | null;
  avatarColor?: string | null;
  language?: string | null;
  countryCode?: string | null;
  createdAt?: string | null;
}

const AUTH_TOKEN = "bukkapay_token";
const CURRENT_USER = "bukkapay_user";
const BIOMETRIC_ENABLED = "bukkapay_biometric_enabled";
const BIOMETRIC_CREDENTIALS = "bukkapay_biometric_creds";

type AuthListener = () => void;
const listeners: AuthListener[] = [];

export const authEvents = {
  on(_event: string, fn: AuthListener) {
    listeners.push(fn);
  },
  off(_event: string, fn: AuthListener) {
    const idx = listeners.indexOf(fn);
    if (idx !== -1) listeners.splice(idx, 1);
  },
  emit(_event: string) {
    listeners.forEach((fn) => fn());
  },
};

export async function setAuthToken(token: string) {
  await AsyncStorage.setItem(AUTH_TOKEN, token);
}

export async function setAuth(token: string, user: User) {
  await setAuthToken(token);
  await setCurrentUser(user);
}

export async function getAuthToken(): Promise<string | null> {
  return await AsyncStorage.getItem(AUTH_TOKEN);
}

export async function clearAuthToken() {
  await AsyncStorage.removeItem(AUTH_TOKEN);
  await AsyncStorage.removeItem(CURRENT_USER);
  authEvents.emit("authStateChanged");
}

export async function setCurrentUser(user: User) {
  await AsyncStorage.setItem(CURRENT_USER, JSON.stringify(user));
  authEvents.emit("authStateChanged");
}

export async function getCurrentUser(): Promise<User | null> {
  const user = await AsyncStorage.getItem(CURRENT_USER);
  return user ? JSON.parse(user) : null;
}

export async function signup(email: string, username: string, password: string, name: string, phone?: string, countryCode?: string) {
  const res = await fetch(API_BASE + "/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password, name, phone, countryCode }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Signup failed");
  }

  const data = await res.json();
  await setAuthToken(data.token);
  await setCurrentUser(data.user);
  return data;
}

export async function login(email: string, password: string) {
  const res = await fetch(API_BASE + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Login failed");
  }

  const data = await res.json();
  await setAuthToken(data.token);
  await setCurrentUser(data.user);
  return data;
}

export async function logout() {
  const token = await getAuthToken();
  if (token) {
    try {
      await fetch(API_BASE + "/api/auth/logout", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
      });
    } catch (e) {
      console.error("Logout error:", e);
    }
  }
  await clearAuthToken();
}

export async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  return token ? { "Authorization": `Bearer ${token}` } : {};
}

export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

export async function getBiometricType(): Promise<string> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return "Face ID";
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return "Fingerprint";
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return "Iris";
  }
  return "Biometric";
}

export async function authenticateWithBiometric(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Sign in to BukkaPay",
    fallbackLabel: "Use password",
    cancelLabel: "Cancel",
    disableDeviceFallback: false,
  });
  return result.success;
}

export async function enableBiometricLogin(email: string, password: string) {
  await AsyncStorage.setItem(BIOMETRIC_ENABLED, "true");
  await AsyncStorage.setItem(BIOMETRIC_CREDENTIALS, JSON.stringify({ email, password }));
}

export async function disableBiometricLogin() {
  await AsyncStorage.setItem(BIOMETRIC_ENABLED, "false");
  await AsyncStorage.removeItem(BIOMETRIC_CREDENTIALS);
}

export async function isBiometricLoginEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(BIOMETRIC_ENABLED);
  return val === "true";
}

export async function biometricLogin(): Promise<any> {
  const credsStr = await AsyncStorage.getItem(BIOMETRIC_CREDENTIALS);
  if (!credsStr) throw new Error("No saved credentials");

  const authenticated = await authenticateWithBiometric();
  if (!authenticated) throw new Error("Biometric authentication failed");

  const { email, password } = JSON.parse(credsStr);
  return login(email, password);
}
