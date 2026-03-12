import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

export default function Profile() {
  const router = useRouter();

  const user = {
    id: "GM-001",
    name: "Ashish",
    role: "Ground Manager",
    phone: "9988776655",
    email: "ashish@bullconnect.in",
    created_at: "2024-01-01",
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const isActive = true;

  return (
    <SafeAreaView className="flex-1 bg-[#f6f8f6]">
      
      {/* HEADER */}
      <View className="bg-white rounded-b-[40px] pb-8 shadow-sm">
        <View className="flex-row items-center justify-between px-4 pt-4">
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>

          <Text className="text-lg font-bold">Manager Profile</Text>

          <View style={{ width: 24 }} />
        </View>

        {/* Avatar */}
        <View className="items-center mt-6">
          <View className="relative">
            <View className="w-28 h-28 rounded-full border-4 border-[#13ec49]/20 items-center justify-center bg-[#13ec49]/10">
              <Text className="text-3xl font-bold text-[#0ea634]">
                {initials}
              </Text>
            </View>

            {isActive && (
              <View className="absolute bottom-1 right-1 bg-[#13ec49] p-2 rounded-full border-4 border-white">
                <MaterialIcons name="verified" size={16} color="white" />
              </View>
            )}
          </View>

          <Text className="text-xl font-bold mt-4">{user.name}</Text>

          <Text className="text-gray-500 mt-1">{user.role}</Text>

          <View className="flex-row items-center gap-2 mt-3 px-3 py-1 rounded-full border bg-green-50 border-green-100">
            <View className="w-2 h-2 rounded-full bg-green-500" />
            <Text className="text-xs font-semibold text-green-700">
              Online
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

          {/* User ID */}
          <View className="flex-row items-center p-4 border-b border-gray-100">
            <MaterialIcons name="fingerprint" size={20} color="#666" />
            <View className="ml-4">
              <Text className="text-xs text-gray-400">User ID</Text>
              <Text className="font-semibold">{user.id}</Text>
            </View>
          </View>

          {/* Phone */}
          <View className="flex-row items-center p-4 border-b border-gray-100">
            <MaterialIcons name="call" size={20} color="#666" />
            <View className="ml-4">
              <Text className="text-xs text-gray-400">Phone Number</Text>
              <Text className="font-semibold">{user.phone}</Text>
            </View>
          </View>

          {/* Email */}
          <View className="flex-row items-center p-4 border-b border-gray-100">
            <MaterialIcons name="email" size={20} color="#666" />
            <View className="ml-4">
              <Text className="text-xs text-gray-400">Email</Text>
              <Text className="font-semibold">{user.email}</Text>
            </View>
          </View>

          {/* Joined Date */}
          <View className="flex-row items-center p-4">
            <MaterialIcons name="calendar-month" size={20} color="#666" />
            <View className="ml-4">
              <Text className="text-xs text-gray-400">Joined</Text>
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