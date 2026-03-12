import { Stack, useRouter } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RootLayout() {
  const systemColorScheme = useColorScheme();

  useEffect(() => {
    (async () => {
      const darkModeEnabled = await AsyncStorage.getItem("dark_mode");
      if (darkModeEnabled === "true") {
        // Dark mode preference is set, UI will respond accordingly
      }
    })();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(screens)" />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
