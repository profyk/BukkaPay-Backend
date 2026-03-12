import { Alert } from "react-native";

export function useToast() {
  return {
    toast: ({ title, description, variant }: { title?: string; description?: string; variant?: string }) => {
      Alert.alert(title || "", description || "");
    },
  };
}
