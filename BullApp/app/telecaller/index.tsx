import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { apiRequest } from "../utils/api";
import { useFocusEffect } from "expo-router";
import NewLeadForm from "../components/NewLeadForm";

type LeadStatus =
  | "NEW"
  | "ASSIGNED"
  | "CONTACTED"
  | "VISIT_REQUESTED"
  | "VISIT_ASSIGNED"
  | "VISIT_COMPLETED"
  | "SOLD"
  | "DROPPED";

type LeadStats = Record<LeadStatus, number>;

type LeadResponse = {
  data: { status: string }[];
  total?: number;
};

export default function TelecallerHome() {
  const [leadsCount, setLeadsCount] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  const [leadStats, setLeadStats] = useState<LeadStats>({
    NEW: 0,
    ASSIGNED: 0,
    CONTACTED: 0,
    VISIT_REQUESTED: 0,
    VISIT_ASSIGNED: 0,
    VISIT_COMPLETED: 0,
    SOLD: 0,
    DROPPED: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("/telecaller/queue?page=1&limit=100");
      const json = await res.json();
      
      const leads = json.data || json.leads || (Array.isArray(json) ? json : []);
      setLeadsCount(json.total ?? leads.length);

      const stats: LeadStats = {
        NEW: 0,
        ASSIGNED: 0,
        CONTACTED: 0,
        VISIT_REQUESTED: 0,
        VISIT_ASSIGNED: 0,
        VISIT_COMPLETED: 0,
        SOLD: 0,
        DROPPED: 0,
      };

      leads.forEach((l: any) => {
        const status = l.status as LeadStatus;
        if (stats[status] !== undefined) {
          stats[status]++;
        }
      });

      setLeadStats(stats);
    } catch (e) {
      console.log("Error fetching TC stats:", e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const Skeleton = () => (
    <View className="h-6 w-16 bg-gray-200 dark:bg-slate-700 rounded-md" />
  );

  const StatCard = ({
    label,
    value,
    icon,
    color,
    fullWidth = false,
  }: {
    label: string;
    value: number | null;
    icon: keyof typeof Feather.glyphMap;
    color: string;
    fullWidth?: boolean;
  }) => (
    <View
      className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700"
      style={{
        width: fullWidth ? "100%" : "48%",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <Feather name={icon} size={18} color={color} />
      <Text className="text-gray-500 dark:text-slate-400 text-xs mt-2">{label}</Text>

      {loading && value === null ? (
        <Skeleton />
      ) : (
        <Text className="text-2xl font-bold dark:text-slate-50">{value ?? 0}</Text>
      )}
    </View>
  );

  const total =
    Object.values(leadStats).reduce((sum, value) => sum + value, 0) || 1;

  if (isCreating) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-gray-50 dark:bg-slate-900">
        <NewLeadForm onBack={() => setIsCreating(false)} onSuccess={() => { setIsCreating(false); fetchData(); }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f6f6f8] dark:bg-slate-900">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>

        {/* HEADER */}
        <View className="px-4 py-3 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
          <View className="flex-row items-center gap-2">
            <MaterialIcons name="dashboard" size={26} color="#245feb" />
            <Text className="text-lg font-bold dark:text-slate-50">Telecaller Home</Text>
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <View className="p-4">
          <Text className="text-xs text-gray-500 dark:text-slate-400 mb-3 font-semibold uppercase">
            Quick Actions
          </Text>

          <View className="flex-row">
            <TouchableOpacity
              className="flex-1 rounded-xl items-center py-4"
              onPress={() => setIsCreating(true)}
              style={{
                backgroundColor: "#245feb",
                shadowColor: "#245feb",
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Feather name="user-plus" size={20} color="white" />
              <Text className="text-white text-xs mt-2 font-bold">Add Lead</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* DASHBOARD */}
        <View className="px-4">
          <Text className="text-lg font-bold mb-4 dark:text-slate-50">
            Queue Overview
          </Text>

          <View className="flex-row flex-wrap justify-between gap-y-3">
            <StatCard
              label="Total Queue"
              value={leadsCount}
              icon="users"
              color="#3b82f6"
            />
            <StatCard
              label="New Leads"
              value={leadStats.NEW}
              icon="circle"
              color="orange"
            />
          </View>
        </View>

        {/* LEADS STATUS */}
        <View className="p-4">
          <View className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700">
            <View className="flex-row justify-between mb-5">
              <Text className="font-bold dark:text-slate-50">Queue by Status</Text>
              <Feather name="activity" color="#9ca3af" />
            </View>

            {[
              { label: "New Leads", value: leadStats.NEW, color: "#245feb" },
              { label: "Assigned", value: leadStats.ASSIGNED, color: "#22c55e" },
              { label: "Contacted", value: leadStats.CONTACTED, color: "#f97316" },
              { label: "Visit Requested", value: leadStats.VISIT_REQUESTED, color: "#a855f7" },
              { label: "Visit Assigned", value: leadStats.VISIT_ASSIGNED, color: "#06b6d4" },
              { label: "Visit Completed", value: leadStats.VISIT_COMPLETED, color: "#84cc16" },
              { label: "Sold", value: leadStats.SOLD, color: "#10b981" },
              { label: "Dropped", value: leadStats.DROPPED, color: "#ef4444" },
            ].map((item, i) => {
              const percent = total > 0 ? (item.value / total) * 100 : 0;

              return (
                <View key={i} className="mb-4">
                  <View className="flex-row justify-between">
                    <Text className="text-xs dark:text-slate-300">{item.label}</Text>
                    <Text className="text-xs dark:text-slate-300">
                      {Math.round(percent)}% ({item.value})
                    </Text>
                  </View>

                  <View className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full mt-1">
                    <View
                      style={{
                        width: `${percent}%`,
                        backgroundColor: item.color,
                      }}
                      className="h-2 rounded-full"
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

