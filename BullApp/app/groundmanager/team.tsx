import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { apiRequest } from "../utils/api";

type TeamMember = {
  name: string;
  total_visits: number;
  in_progress: number;
  eta: string;
};

export default function Team() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTeamStatus();
  }, []);

  const fetchTeamStatus = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest("/field-manager/team/status");
      const data = await res.json();
      setTeam(data.data || []);
    } catch (err) {
      console.error("Team status error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f6f6f8] dark:bg-slate-900">
      {/* HEADER */}
      <View className="px-4 py-3 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex-row justify-between items-center">
        <View className="flex-row items-center gap-2">
          <Feather name="users" size={26} color="#245feb" />
          <Text className="text-lg font-bold dark:text-slate-50">Ground Team</Text>
        </View>
        <TouchableOpacity onPress={fetchTeamStatus}>
          <Feather name="refresh-cw" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Text className="text-xs text-gray-500 dark:text-slate-400 mb-4 font-semibold uppercase">
          Live Status
        </Text>

        {isLoading ? (
          <ActivityIndicator size="large" color="#245feb" className="mt-10" />
        ) : team.length === 0 ? (
          <View className="bg-white dark:bg-slate-800 py-10 px-6 rounded-xl border border-gray-200 dark:border-slate-700 items-center">
            <Feather name="user-x" size={40} color="#9ca3af" />
            <Text className="text-gray-500 font-medium mt-3 text-center">No ground executives found.</Text>
          </View>
        ) : (
          team.map((member, index) => (
            <View
              key={index}
              className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-4 border border-gray-200 dark:border-slate-700 shadow-sm"
              style={{ shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 }}
            >
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full items-center justify-center">
                    <Feather name="user" size={24} color="#245feb" />
                  </View>
                  <View>
                    <Text className="font-bold text-base dark:text-slate-50">{member.name}</Text>
                    <View className="flex-row items-center gap-1 mt-1">
                      <View className={`w-2 h-2 rounded-full ${member.in_progress > 0 ? "bg-green-500" : "bg-gray-400"}`} />
                      <Text className="text-xs text-gray-500 dark:text-slate-400">
                        {member.in_progress > 0 ? "Active In Field" : "Idle"}
                      </Text>
                    </View>
                  </View>
                </View>
                <View className="bg-gray-100 dark:bg-slate-700 px-3 py-1 rounded-full flex-row items-center gap-1">
                  <MaterialIcons name="timer" size={14} color="#f97316" />
                  <Text className="text-xs font-bold text-gray-600 dark:text-slate-300">
                    ETA: {member.eta}
                  </Text>
                </View>
              </View>

              <View className="flex-row justify-between bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg border border-gray-100 dark:border-slate-700">
                <View className="items-center">
                  <Text className="text-gray-500 dark:text-slate-400 text-xs mb-1">Total Assigned</Text>
                  <Text className="font-bold text-gray-800 dark:text-slate-200">{member.total_visits}</Text>
                </View>
                <View className="w-[1px] bg-gray-200 dark:bg-slate-600" />
                <View className="items-center">
                  <Text className="text-gray-500 dark:text-slate-400 text-xs mb-1">In Progress</Text>
                  <Text className="font-bold text-[#f97316]">{member.in_progress}</Text>
                </View>
                <View className="w-[1px] bg-gray-200 dark:bg-slate-600" />
                <View className="items-center">
                  <Text className="text-gray-500 dark:text-slate-400 text-xs mb-1">Completed</Text>
                  <Text className="font-bold text-green-600 dark:text-green-500">
                    {member.total_visits - member.in_progress}
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
