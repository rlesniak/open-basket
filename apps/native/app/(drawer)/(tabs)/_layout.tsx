import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

// Light mode colors
const FOREGROUND_COLOR = "#11181C";
const BACKGROUND_COLOR = "#FFFFFF";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: BACKGROUND_COLOR,
        },
        headerTintColor: FOREGROUND_COLOR,
        headerTitleStyle: {
          color: FOREGROUND_COLOR,
          fontWeight: "600",
        },
        tabBarStyle: {
          backgroundColor: BACKGROUND_COLOR,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="compass" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
