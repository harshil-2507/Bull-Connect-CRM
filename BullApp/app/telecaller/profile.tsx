import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function Profile() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#fafbf9] px-6 pt-10">
      <Text className="text-3xl font-bold text-[#1a4d2e]">
        Profile
      </Text>

      <View className="mt-6 bg-white p-6 rounded-xl shadow border border-gray-100">
        <Text className="text-lg font-semibold text-gray-800">
          Username: telecaller
        </Text>

        <TouchableOpacity
          onPress={() => router.replace("/")}
          className="mt-6 bg-[#13ec49] py-3 rounded-lg"
        >
          <Text className="text-center font-semibold text-black">
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}