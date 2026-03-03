import React from "react";
import { View, Text, ActivityIndicator } from "react-native";

interface Props {
  calls: any[];
  loading: boolean;
  error: boolean;
}

export default function CallHistorySection({
  calls,
  loading,
  error,
}: Props) {
  return (
    <View className="mb-6">
      <Text className="text-xs font-bold tracking-widest text-green-600 mb-4">
        CALL HISTORY
      </Text>

      {loading ? (
        <ActivityIndicator />
      ) : error ? (
        <View className="bg-white p-5 rounded-3xl border border-gray-100">
          <Text className="text-gray-400">
            Failed to load call history
          </Text>
        </View>
      ) : calls.length === 0 ? (
        <View className="bg-white p-5 rounded-3xl border border-gray-100">
          <Text className="text-gray-400">
            No previous calls found
          </Text>
        </View>
      ) : (
        calls.map((call, index) => (
          <View
            key={index}
            className="bg-white rounded-3xl p-5 border border-gray-100 mb-3 shadow-sm"
          >
            <Text className="font-bold text-green-700">
              {call.disposition}
            </Text>

            <Text className="text-gray-600 mt-1">
              {call.notes || "No notes"}
            </Text>

            <Text className="text-gray-500 text-sm mt-1">
              Duration: {call.duration_seconds || 0}s
            </Text>

            {call.next_callback_at && (
              <Text className="text-orange-600 text-sm mt-1">
                Next Callback: {call.next_callback_at}
              </Text>
            )}
          </View>
        ))
      )}
    </View>
  );
}