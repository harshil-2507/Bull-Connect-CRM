import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

export default function Campaigns() {
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-white dark:bg-slate-900 items-center justify-center">
      <View className="bg-indigo-50 dark:bg-slate-800 p-8 rounded-3xl items-center border border-indigo-100 dark:border-slate-700">
        <View className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/50 rounded-full items-center justify-center mb-6">
          <MaterialIcons name="construction" size={48} color="#4f46e5" />
        </View>
        <Text className="text-gray-900 dark:text-slate-50 font-bold text-2xl mt-4 text-center">Coming soon</Text>
        <Text className="text-gray-500 dark:text-slate-400 mt-2 text-center text-base">
          Campaign management details for telecallers are currently in development.
        </Text>
      </View>
    </SafeAreaView>
  );
}
