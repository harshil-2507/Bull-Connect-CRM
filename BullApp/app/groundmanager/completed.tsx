import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { apiRequest } from "../utils/api";

type CompletedVisit = {
  farmer_name: string;
  outcome: string | null;
  visit_notes: string | null;
};

export default function Completed() {
  const [visits, setVisits] = useState<CompletedVisit[]>([]);
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCompleted();
  }, []);

  const fetchCompleted = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest("/field-manager/visits/completed");
      const data = await res.json();
      setVisits(data.data || []);
      setCount(data.count || 0);
    } catch (err) {
      console.error("Completed visits error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f6f6f8] dark:bg-slate-900">
      {/* HEADER */}
      <View className="px-4 py-3 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex-row justify-between items-center">
        <View className="flex-row items-center gap-2">
          <Feather name="check-square" size={26} color="#245feb" />
          <Text className="text-lg font-bold dark:text-slate-50">Completed Visits</Text>
        </View>
        <TouchableOpacity onPress={fetchCompleted}>
          <Feather name="refresh-cw" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View className="bg-green-100 dark:bg-green-900/30 p-4 rounded-xl border border-green-200 dark:border-green-800 flex-row items-center mb-6">
          <Feather name="check-circle" size={24} color="#10b981" />
          <View className="ml-3 flex-1">
            <Text className="text-sm font-semibold text-green-800 dark:text-green-300">
              Today's Field Achievements
            </Text>
            <Text className="text-xs text-green-600 dark:text-green-400 mt-1">
              Your team successfully closed {count} visits today!
            </Text>
          </View>
        </View>

        <Text className="text-xs text-gray-500 dark:text-slate-400 mb-4 font-semibold uppercase">
          Visit Log ({count})
        </Text>

        {isLoading ? (
          <ActivityIndicator size="large" color="#245feb" className="mt-10" />
        ) : visits.length === 0 ? (
          <View className="bg-white dark:bg-slate-800 py-10 px-6 rounded-xl border border-gray-200 dark:border-slate-700 items-center">
            <MaterialIcons name="event-available" size={40} color="#9ca3af" />
            <Text className="text-gray-500 font-medium mt-3 text-center">No visits completed today.</Text>
          </View>
        ) : (
          visits.map((visit, index) => (
            <View
              key={index}
              className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-4 border-l-4 border-l-green-500 border border-y-gray-200 border-r-gray-200 dark:border-y-slate-700 dark:border-r-slate-700 shadow-sm"
              style={{ shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 }}
            >
              <View className="flex-row justify-between items-center mb-2">
                <Text className="font-bold text-base dark:text-slate-50">{visit.farmer_name}</Text>
                {visit.outcome && (
                  <View className={`px-2 py-1 rounded-md ${
                    visit.outcome.toLowerCase() === 'sold'
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-orange-100 dark:bg-orange-900/30'
                  }`}>
                    <Text className={`text-xs font-bold uppercase ${
                      visit.outcome.toLowerCase() === 'sold'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-orange-600 dark:text-orange-400'
                    }`}>
                      {visit.outcome}
                    </Text>
                  </View>
                )}
              </View>

              <View className="bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg border border-gray-100 dark:border-slate-700 mt-2">
                <View className="flex-row items-start gap-2">
                  <Feather name="file-text" size={14} color="#9ca3af" className="mt-1" />
                  <Text className="text-sm text-gray-600 dark:text-gray-300 flex-1 leading-5">
                    {visit.visit_notes || "No notes provided by the executive."}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
