import { Tabs } from "expo-router";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";

export default function ManagerLayout() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? "#60a5fa" : "#245feb", // Lighter blue in dark mode
        tabBarInactiveTintColor: isDark ? "#64748b" : "#9ca3af",
        
        tabBarStyle: {
          backgroundColor: isDark ? "#1e293b" : "#ffffff", // slate-800 or white
          borderTopColor: isDark ? "#334155" : "#e5e7eb", // slate-700 or gray-200
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="campaigns"
        options={{
          title: "Campaigns",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="campaign" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="leads"
        options={{
          title: "Leads",
          tabBarIcon: ({ color, size }) => (
            <Feather name="users" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="telecallers"
        options={{
          title: "Telecallers",
          tabBarIcon: ({ color, size }) => (
            <Feather name="phone" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}