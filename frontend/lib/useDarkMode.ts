import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useDarkMode() {
  const [darkMode, setDarkModeState] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const dm = await AsyncStorage.getItem("dark_mode");
      setDarkModeState(dm === "true");
      setLoaded(true);
    })();
  }, []);

  const setDarkMode = useCallback(async (enabled: boolean) => {
    setDarkModeState(enabled);
    await AsyncStorage.setItem("dark_mode", String(enabled));
  }, []);

  return { darkMode, setDarkMode, loaded };
}
