// config.ts
import Constants from "expo-constants";

/**
 * API_BASE:
 * Priority:
 * 1. EXPO_PUBLIC_API_URL from environment (.env)
 * 2. backendUrl from app.json extra (used in EAS / Expo builds)
 * 3. Default to BukkaPay API domain
 */
export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.backendUrl ||
  "https://api.bukkapay.com";

/**
 * Helper function to construct full API endpoints
 * Usage:
 *   fetch(apiUrl("/auth/login"), {...})
 */
export const apiUrl = (endpoint: string) => `${API_BASE}${endpoint}`;