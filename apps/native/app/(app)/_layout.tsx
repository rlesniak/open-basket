import { Stack } from "expo-router/stack";

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: "#F9FAFB" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Lista zakupów" }} />
      <Stack.Screen name="settings/index" options={{ title: "Ustawienia" }} />
      <Stack.Screen
        name="settings/store/[id]"
        options={{ title: "Kolejność kategorii" }}
      />
    </Stack>
  );
}
