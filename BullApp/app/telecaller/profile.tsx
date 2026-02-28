import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";

export default function Profile() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);

  // 🔥 Replace with your real API call
  useEffect(() => {
    async function fetchUser() {
      // Example: const res = await api.get("/me");
      const data = {
        id: "c07b5ad9-c0dd-4670-adbc-fc4f6f05708d",
        username: "telecaller5",
        name: "Ramesh Kumar",
        phone: null,
        role: "TELECALLER",
        is_active: true,
        created_at: "2026-02-23T16:52:50.085Z",
      };

      setUser(data);
    }

    fetchUser();
  }, []);

  if (!user) return null;

  const initials = user.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  return (
    <SafeAreaView className="flex-1 bg-[#f6f8f6]">
      {/* HEADER */}
      <View className="bg-white rounded-b-[40px] pb-8 shadow-sm">
        <View className="flex-row items-center justify-between px-4 pt-4">
          <TouchableOpacity>
            <MaterialIcons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>

          <Text className="text-lg font-bold">My Profile</Text>

          <TouchableOpacity>
            <MaterialIcons name="edit" size={22} color="#777" />
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View className="items-center mt-6">
          <View className="relative">
            <View className="w-28 h-28 rounded-full border-4 border-[#13ec49]/20 items-center justify-center bg-[#13ec49]/10">
              <Text className="text-3xl font-bold text-[#0ea634]">
                {initials}
              </Text>
            </View>

            {user.is_active && (
              <View className="absolute bottom-1 right-1 bg-[#13ec49] p-2 rounded-full border-4 border-white">
                <MaterialIcons name="verified" size={16} color="white" />
              </View>
            )}
          </View>

          <Text className="text-xl font-bold mt-4">
            {user.name}
          </Text>

          <Text className="text-gray-500 mt-1">
            {user.role}
          </Text>

          <View
            className={`flex-row items-center gap-2 mt-3 px-3 py-1 rounded-full border ${
              user.is_active
                ? "bg-green-50 border-green-100"
                : "bg-gray-100 border-gray-200"
            }`}
          >
            <View
              className={`w-2 h-2 rounded-full ${
                user.is_active ? "bg-green-500" : "bg-gray-400"
              }`}
            />
            <Text
              className={`text-xs font-semibold ${
                user.is_active ? "text-green-700" : "text-gray-500"
              }`}
            >
              {user.is_active ? "Online" : "Offline"}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        className="px-5 pt-6"
      >
        {/* PERSONAL INFO */}
        <Text className="text-sm font-bold uppercase mb-3">
          Personal Info
        </Text>

        <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

          {/* Username */}
          <View className="flex-row items-center p-4 border-b border-gray-100">
            <MaterialIcons name="person" size={20} color="#666" />
            <View className="ml-4">
              <Text className="text-xs text-gray-400">
                Username
              </Text>
              <Text className="font-semibold">
                {user.username}
              </Text>
            </View>
          </View>

          {/* Phone */}
          <View className="flex-row items-center p-4 border-b border-gray-100">
            <MaterialIcons name="call" size={20} color="#666" />
            <View className="ml-4">
              <Text className="text-xs text-gray-400">
                Phone Number
              </Text>
              <Text className="font-semibold">
                {user.phone ?? "Not Provided"}
              </Text>
            </View>
          </View>

          {/* Joined Date */}
          <View className="flex-row items-center p-4">
            <MaterialIcons name="calendar-month" size={20} color="#666" />
            <View className="ml-4">
              <Text className="text-xs text-gray-400">
                Joined
              </Text>
              <Text className="font-semibold">
                {new Date(user.created_at).toDateString()}
              </Text>
            </View>
          </View>
        </View>

        {/* LOGOUT */}
        <TouchableOpacity
          onPress={() => router.replace("/")}
          className="mt-6 bg-red-50 p-4 rounded-xl border border-red-100 flex-row justify-center items-center"
        >
          <MaterialIcons name="logout" size={18} color="#dc2626" />
          <Text className="text-red-600 font-semibold ml-2">
            Logout
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}