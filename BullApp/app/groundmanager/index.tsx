import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { apiRequest } from "../utils/api";
import { router } from "expo-router";

type RegionData = {
  taluka: string;
  total_requests: string | number;
};

export default function Home() {
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [completedToday, setCompletedToday] = useState<number | null>(null);
  const [totalPending, setTotalPending] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch Pending Requests by Taluka
      const mapRes = await apiRequest("/field-manager/map");
      const mapResult = await mapRes.json();
      
      const regionData = mapResult.data || [];
      setRegions(regionData);

      // Calculate total pending
      const totalPend = regionData.reduce(
        (sum: number, r: RegionData) => sum + Number(r.total_requests),
        0
      );
      setTotalPending(totalPend);

      // Fetch Completed visits today
      const compRes = await apiRequest("/field-manager/visits/completed");
      const compResult = await compRes.json();
      setCompletedToday(compResult.count || 0);

    } catch (err) {
      console.error("Dashboard error:", err);
      setTotalPending(0);
      setCompletedToday(0);
    } finally {
      setIsLoading(false);
    }
  };

  const Skeleton = () => (
    <View className="h-6 w-16 bg-gray-200 dark:bg-slate-700 rounded-md" />
  );

  const StatCard = ({
    label,
    value,
    icon,
    color,
  }: {
    label: string;
    value: number | null;
    icon: keyof typeof Feather.glyphMap;
    color: string;
  }) => (
    <View
      className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700"
      style={{
        width: "48%",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <Feather name={icon} size={18} color={color} />
      <Text className="text-gray-500 dark:text-slate-400 text-xs mt-2">{label}</Text>

      {value === null && isLoading ? (
        <View className="mt-1"><Skeleton /></View>
      ) : (
        <Text className="text-2xl font-bold dark:text-slate-50 mt-1">{value}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f6f6f8] dark:bg-slate-900">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* HEADER */}
        <View className="px-4 py-3 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
          <View className="flex-row items-center gap-2">
            <MaterialIcons name="dashboard" size={26} color="#245feb" />
            <Text className="text-lg font-bold dark:text-slate-50">Ground Manager</Text>
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <View className="p-4">
          <Text className="text-xs text-gray-500 dark:text-slate-400 mb-3 font-semibold uppercase">
            Quick Actions
          </Text>

          <View className="flex-row justify-between">
            <TouchableOpacity
              className="flex-1 mr-2 rounded-xl items-center py-4"
              onPress={() => router.push("/groundmanager/assignments")}
              style={{
                backgroundColor: "#245feb",
                shadowColor: "#245feb",
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <MaterialIcons name="assignment" size={20} color="white" />
              <Text className="text-white text-xs mt-2 font-medium">Assign Visits</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 ml-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl items-center py-4"
              onPress={() => fetchDashboardData()}
            >
              <Feather name="refresh-cw" size={20} color="#245feb" />
              <Text className="text-xs mt-2 dark:text-slate-50 font-medium">Refresh Data</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* DASHBOARD OVERVIEW */}
        <View className="px-4">
          <Text className="text-lg font-bold mb-4 dark:text-slate-50">
            Today's Overview
          </Text>

          <View className="flex-row flex-wrap justify-between gap-y-3">
            <StatCard
              label="Pending Visits"
              value={totalPending}
              icon="alert-circle"
              color="#f97316"
            />
            <StatCard
              label="Completed Today"
              value={completedToday}
              icon="check-circle"
              color="#22c55e"
            />
            <StatCard
              label="Target Areas"
              value={regions.length}
              icon="map-pin"
              color="#a855f7"
            />
            <StatCard
              label="Team Active"
              value={null} // To be fetched if needed, or left as an expansion for later
              icon="users"
              color="#3b82f6"
            />
          </View>
        </View>

        {/* REGIONAL BREAKDOWN (MAP DATA) */}
        <View className="p-4 mt-2">
          <View className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700">
            <View className="flex-row justify-between mb-5 items-center">
              <Text className="font-bold dark:text-slate-50 text-base">Pending by Region</Text>
              <Feather name="map" size={16} color="#9ca3af" />
            </View>

            {regions.length === 0 && !isLoading ? (
              <Text className="text-gray-500 dark:text-slate-400 text-center py-4">No pending visits.</Text>
            ) : (
              regions.map((region, i) => {
                const percent = totalPending ? (Number(region.total_requests) / totalPending) * 100 : 0;
                return (
                  <View key={i} className="mb-4">
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-sm dark:text-slate-300 font-medium">{region.taluka}</Text>
                      <View className="flex-row items-center gap-2">
                        <Text className="text-xs text-gray-500 dark:text-slate-400">{region.total_requests} visits</Text>
                      </View>
                    </View>

                    <View className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full">
                      <View
                        style={{
                          width: `${percent}%`,
                          backgroundColor: "#3b82f6",
                        }}
                        className="h-2 rounded-full"
                      />
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
