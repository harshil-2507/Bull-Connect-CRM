import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { apiRequest } from "../utils/api";
import { useRouter } from "expo-router";

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalVisits: 0,
    completed: 0,
    sold: 0,
    pending: 0,
  });

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      // First, get all leads assigned or completed
      const res = await apiRequest("/leads?limit=100");
      const data = await res.json();
      const allLeads = data.leads || [];

      // We filter manually, though in production you'd use a proper endpoint
      const assigned = allLeads.filter((l: any) => l.status === "VISIT_ASSIGNED");
      const completed = allLeads.filter((l: any) => l.status === "VISIT_COMPLETED");
      const sold = allLeads.filter((l: any) => l.status === "SOLD");

      setStats({
        totalVisits: assigned.length + completed.length + sold.length,
        pending: assigned.length,
        completed: completed.length + sold.length,
        sold: sold.length,
      });
    } catch (e) {
      console.log(e);
    }
  };

  const StatCard = ({ label, value, icon, color }: any) => (
    <View
      className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700"
      style={{
        width: "48%",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <Feather name={icon} size={20} color={color} />
      <Text className="text-gray-500 dark:text-slate-400 text-xs mt-2 font-medium">{label}</Text>
      <Text className="text-2xl font-bold text-gray-900 dark:text-slate-50 mt-1">{value}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f8fafc] dark:bg-slate-900">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* HEADER */}
        <View className="px-5 py-4 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-gray-500 dark:text-slate-400 font-medium">Hello, Executive</Text>
              <Text className="text-xl font-bold text-gray-900 dark:text-slate-50 mt-1">Field Dashboard</Text>
            </View>
            <View className="bg-sky-100 dark:bg-sky-900/40 p-2 rounded-full">
              <MaterialIcons name="person" size={24} color="#0ea5e9" />
            </View>
          </View>
        </View>

        {/* SUMMARY */}
        <View className="p-4 mt-2">
          <View className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
            {/* Decorative background element */}
            <View className="absolute top-0 right-0 w-32 h-32 bg-sky-50 dark:bg-sky-900/10 rounded-full -mr-10 -mt-10" />
            
            <View className="flex-row justify-between mb-2">
              <Text className="text-lg font-bold text-gray-900 dark:text-slate-50 relative z-10">
                Today's Route Preview
              </Text>
              <View className="bg-emerald-100 dark:bg-emerald-900/40 px-2 py-1 rounded-md mb-auto relative z-10">
                <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-400">SYNCED</Text>
              </View>
            </View>
            
            <Text className="text-gray-500 dark:text-slate-400 text-sm mb-5 relative z-10">
              You have <Text className="font-bold text-gray-900 dark:text-slate-200">{stats.pending}</Text> pending visits in your route today.
            </Text>
            
            <TouchableOpacity
              className="bg-[#0ea5e9] py-3.5 rounded-xl items-center flex-row justify-center relative z-10"
              onPress={() => router.push("/groundexecutive/leads")}
              activeOpacity={0.8}
            >
              <MaterialIcons name="navigation" size={18} color="white" className="mr-2" />
              <Text className="text-white font-bold text-base ml-2">View Route & Start Visits</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-4">
          <Text className="text-lg font-bold mb-4 text-gray-900 dark:text-slate-50">Performance Overview</Text>
          <View className="flex-row flex-wrap justify-between gap-y-4">
            <StatCard label="Total Route" value={stats.totalVisits} icon="map" color="#3b82f6" />
            <StatCard label="Pending" value={stats.pending} icon="clock" color="#f59e0b" />
            <StatCard label="Completed" value={stats.completed} icon="check-circle" color="#10b981" />
            <StatCard label="Points Earned" value={stats.sold * 10} icon="star" color="#8b5cf6" />
          </View>
        </View>
        
        {/* SYNC STATUS */}
        <View className="p-4 mt-2">
          <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 flex-row items-center justify-between shadow-sm">
             <View className="flex-row items-center">
                 <View className="bg-gray-100 dark:bg-slate-700 w-10 h-10 rounded-full items-center justify-center mr-3">
                     <Feather name="wifi-off" size={18} color="#64748b" />
                 </View>
                 <View>
                     <Text className="font-bold text-gray-900 dark:text-slate-50">Offline Mode</Text>
                     <Text className="text-xs text-gray-500 dark:text-slate-400 mt-1">Data syncs automatically</Text>
                 </View>
             </View>
             <View className="bg-gray-200 dark:bg-slate-700 w-12 h-6 rounded-full px-1 justify-center">
                 <View className="bg-white w-4 h-4 rounded-full" />
             </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
