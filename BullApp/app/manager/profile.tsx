import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const drawerLabel = 'Profile';
export const drawerIcon = ({ color, size }: { color: string; size: number }) => (
  <Feather name="user" size={size} color={color} />
);

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("userData");
        if (!storedUser) {
          router.replace("/"); // redirect to login if missing
          return;
        }
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error(err);
        router.replace("/");
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#13ec49" />
      </View>
    );
  }

  if (!user) return null;

  const initials = user.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  const isActive = true;

  return (
    <View className="flex-1 bg-[#f6f8f6]">
      {/* HEADER */}
      <View className="bg-white rounded-b-[40px] pb-8 shadow-sm">
        <View className="flex-row items-center justify-between px-4 pt-4">
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
          <Text className="text-lg font-bold">Profile</Text>
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
            <Text className="text-xs font-semibold text-green-700">Online</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        className="px-5 pt-6"
      >
        {/* PERSONAL INFO */}
        <Text className="text-sm font-bold uppercase mb-3">Personal Info</Text>

        <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* User ID */}
          <View className="flex-row items-center p-4 border-b border-gray-100">
            <MaterialIcons name="fingerprint" size={20} color="#666" />
            <View className="ml-4">
              <Text className="text-xs text-gray-400">User ID</Text>
              <Text className="font-semibold">{user.id || "-"}</Text>
            </View>
          </View>

          {/* Phone */}
          <View className="flex-row items-center p-4 border-b border-gray-100">
            <MaterialIcons name="call" size={20} color="#666" />
            <View className="ml-4">
              <Text className="text-xs text-gray-400">Phone Number</Text>
              <Text className="font-semibold">{user.phone || "-"}</Text>
            </View>
          </View>

          {/* Email */}
          <View className="flex-row items-center p-4 border-b border-gray-100">
            <MaterialIcons name="email" size={20} color="#666" />
            <View className="ml-4">
              <Text className="text-xs text-gray-400">Email</Text>
              <Text className="font-semibold">{user.email || "-"}</Text>
            </View>
          </View>

          {/* Joined Date */}
          <View className="flex-row items-center p-4">
            <MaterialIcons name="calendar-month" size={20} color="#666" />
            <View className="ml-4">
              <Text className="text-xs text-gray-400">Joined</Text>
              <Text className="font-semibold">
                {user.created_at ? new Date(user.created_at).toDateString() : "-"}
              </Text>
            </View>
          </View>
        </View>

        {/* LOGOUT */}
        <TouchableOpacity
          onPress={async () => {
            await AsyncStorage.removeItem("authToken");
            await AsyncStorage.removeItem("userData");
            router.replace("/");
          }}
          className="mt-6 bg-red-50 p-4 rounded-xl border border-red-100 flex-row justify-center items-center"
        >
          <MaterialIcons name="logout" size={18} color="#dc2626" />
          <Text className="text-red-600 font-semibold ml-2">Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}