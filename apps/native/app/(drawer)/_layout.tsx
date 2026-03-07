import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { Pressable, Text } from "react-native";

// Light mode colors
const FOREGROUND_COLOR = "#11181C";
const BACKGROUND_COLOR = "#FFFFFF";

function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        headerTintColor: FOREGROUND_COLOR,
        headerStyle: { backgroundColor: BACKGROUND_COLOR },
        headerTitleStyle: {
          fontWeight: "600",
          color: FOREGROUND_COLOR,
        },
        drawerStyle: { backgroundColor: BACKGROUND_COLOR },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          headerTitle: "Home",
          drawerLabel: ({ color, focused }) => (
            <Text style={{ color: focused ? color : FOREGROUND_COLOR }}>Home</Text>
          ),
          drawerIcon: ({ size, color, focused }) => (
            <Ionicons
              name="home-outline"
              size={size}
              color={focused ? color : FOREGROUND_COLOR}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="(tabs)"
        options={{
          headerTitle: "Tabs",
          drawerLabel: ({ color, focused }) => (
            <Text style={{ color: focused ? color : FOREGROUND_COLOR }}>Tabs</Text>
          ),
          drawerIcon: ({ size, color, focused }) => (
            <MaterialIcons
              name="border-bottom"
              size={size}
              color={focused ? color : FOREGROUND_COLOR}
            />
          ),
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable className="mr-4">
                <Ionicons name="add-outline" size={24} color={FOREGROUND_COLOR} />
              </Pressable>
            </Link>
          ),
        }}
      />
      <Drawer.Screen
        name="ai"
        options={{
          headerTitle: "AI",
          drawerLabel: ({ color, focused }) => (
            <Text style={{ color: focused ? color : FOREGROUND_COLOR }}>AI</Text>
          ),
          drawerIcon: ({ size, color, focused }) => (
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={size}
              color={focused ? color : FOREGROUND_COLOR}
            />
          ),
        }}
      />
    </Drawer>
  );
}

export default DrawerLayout;
