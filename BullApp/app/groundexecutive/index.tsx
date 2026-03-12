import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
  return (
    <SafeAreaView className="flex-1 bg-[#fafbf9] px-6 pt-10">
      <Text className="text-3xl font-bold text-[#1a4d2e]">
        Home
      </Text>

      <View className="mt-6 bg-white p-6 rounded-xl shadow border border-gray-100">
        <Text className="text-lg font-semibold text-gray-800">
          Welcome Ground Executive 👋
        </Text>
        <Text className="text-gray-500 mt-2">
          Complete assigned visits and update field reports.
        </Text>
      </View>
    </SafeAreaView>
  );
}
