import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { apiRequest } from "../utils/api";

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

type CampaignResponse = {
  data: { id: string }[];
};

type LeadResponse = {
  leads: { status: string }[];
  total?: number;
};

export default function Home() {
  const [campaigns, setCampaigns] = useState<number | null>(null);
  const [telecallers, setTelecallers] = useState<number | null>(null);
  const [leadsCount, setLeadsCount] = useState<number | null>(null);

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

  useEffect(() => {
    fetchCampaigns();
    fetchTelecallers();
    fetchLeadsCount();
    fetchLeadStats();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await apiRequest("/campaigns");
      const data: CampaignResponse = await res.json();
      setCampaigns(data?.data?.length ?? 0);
    } catch {
      setCampaigns(0);
    }
  };

  const fetchTelecallers = async () => {
    try {
      const res = await apiRequest("/manager/telecallers");
      const data: unknown[] = await res.json();
      setTelecallers(data?.length ?? 0);
    } catch {
      setTelecallers(0);
    }
  };

  const fetchLeadsCount = async () => {
    try {
      const res = await apiRequest("/leads?page=1&limit=1");
      const data: LeadResponse = await res.json();
      setLeadsCount(data.total ?? data.leads?.length ?? 0);
    } catch {
      setLeadsCount(0);
    }
  };

  const fetchLeadStats = async () => {
  try {
    const res = await apiRequest("/leads?page=1&limit=100");
    const data: LeadResponse = await res.json();

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

    data.leads?.forEach((l) => {
      const status = l.status as LeadStatus;
      if (stats[status] !== undefined) {
        stats[status]++;
      }
    });

    setLeadStats(stats);
  } catch {}
};
  const Skeleton = () => (
    <View className="h-6 w-16 bg-gray-200 rounded-md" />
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
      className="bg-white rounded-xl p-4 border border-gray-200"
      style={{
        width: "48%",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <Feather name={icon} size={18} color={color} />
      <Text className="text-gray-500 text-xs mt-2">{label}</Text>

      {value === null ? (
        <Skeleton />
      ) : (
        <Text className="text-2xl font-bold">{value}</Text>
      )}
    </View>
  );

  const total =
    Object.values(leadStats).reduce((sum, value) => sum + value, 0) || 1;

  return (
    <SafeAreaView className="flex-1 bg-[#f6f6f8]">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>

        {/* HEADER */}
        <View className="px-4 py-3 bg-white border-b border-gray-200">
          <View className="flex-row items-center gap-2">
            <MaterialIcons name="dashboard" size={26} color="#245feb" />
            <Text className="text-lg font-bold">Manager Home</Text>
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <View className="p-4">
          <Text className="text-xs text-gray-500 mb-3 font-semibold uppercase">
            Quick Actions
          </Text>

          <View className="flex-row justify-between">
            <TouchableOpacity
              className="flex-1 mr-2 rounded-xl items-center py-4"
              style={{
                backgroundColor: "#245feb",
                shadowColor: "#245feb",
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Feather name="user-plus" size={20} color="white" />
              <Text className="text-white text-xs mt-2">Add Lead</Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-1 mx-1 bg-white border border-gray-200 rounded-xl items-center py-4">
              <Feather name="users" size={20} color="#245feb" />
              <Text className="text-xs mt-2">Assign</Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-1 ml-2 bg-white border border-gray-200 rounded-xl items-center py-4">
              <MaterialIcons name="campaign" size={20} color="#245feb" />
              <Text className="text-xs mt-2">Campaign</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* DASHBOARD */}
        <View className="px-4">
          <Text className="text-lg font-bold mb-4">
            Dashboard Overview
          </Text>

          <View className="flex-row flex-wrap justify-between gap-y-3">
            <StatCard
              label="Total Leads"
              value={leadsCount}
              icon="users"
              color="#3b82f6"
            />
            <StatCard
              label="Unassigned"
              value={leadStats.NEW}
              icon="circle"
              color="orange"
            />
            <StatCard
              label="Campaigns"
              value={campaigns}
              icon="flag"
              color="purple"
            />
            <StatCard
              label="Telecallers"
              value={telecallers}
              icon="phone"
              color="#245feb"
            />
          </View>
        </View>

        {/* LEADS STATUS */}
        <View className="p-4">
          <View className="bg-white rounded-xl p-5 border border-gray-200">
            <View className="flex-row justify-between mb-5">
              <Text className="font-bold">Leads by Status</Text>
              <Feather name="more-vertical" color="#9ca3af" />
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
              const percent = (item.value / total) * 100;

              return (
                <View key={i} className="mb-4">
                  <View className="flex-row justify-between">
                    <Text className="text-xs">{item.label}</Text>
                    <Text className="text-xs">
                      {Math.round(percent)}%
                    </Text>
                  </View>

                  <View className="h-2 bg-gray-200 rounded-full mt-1">
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