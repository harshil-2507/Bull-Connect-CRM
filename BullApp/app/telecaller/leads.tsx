import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Leads() {
  return (
    <SafeAreaView className="flex-1 bg-[#fafbf9] px-6 pt-10">
      <Text className="text-3xl font-bold text-[#1a4d2e]">
        Leads
      </Text>

      <View className="mt-6 bg-white p-6 rounded-xl shadow border border-gray-100">
        <Text className="text-gray-700">
          No leads assigned yet.
        </Text>
      </View>
    </SafeAreaView>
  );
}