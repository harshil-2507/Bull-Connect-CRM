import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Layout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0ea633",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
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
        name="leads"
        options={{
          title: "Leads",
          tabBarIcon: ({ color, size }) => (
            <Feather name="users" size={size} color={color} />
          ),
        }}
      />
    <Tabs.Screen
  name="add-lead"
  options={{
    title: "Add Lead",
    tabBarIcon: ({ color, size }) => (
      <Feather name="plus-circle" size={size} color={color} />
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