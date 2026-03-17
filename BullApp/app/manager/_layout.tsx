import { Drawer } from "expo-router/drawer";
import { Feather } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import { useNavigation } from "expo-router";

function MenuButton() {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      onPress={() => (navigation as any).openDrawer()}
      style={{ marginLeft: 15 }}
    >
      <Feather name="menu" size={24} color="#1a4d2e" />
    </TouchableOpacity>
  );
}

export default function Layout() {
  return (
    <Drawer
      screenOptions={{
        headerShown: true,
        headerLeft: () => <MenuButton />,
        headerStyle: {
          backgroundColor: "#f9faf8",
        },
        headerTintColor: "#1a4d2e",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        drawerActiveTintColor: "#0ea633",
        drawerInactiveTintColor: "#9ca3af",
        drawerStyle: {
          backgroundColor: "#f9faf8",
        },
      }}
    />
  );
}