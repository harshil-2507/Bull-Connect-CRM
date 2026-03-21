import React, { useCallback, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { apiRequest } from "../utils/api";
import CampaignDetails from "../components/CampaignDetails";

type Campaign = {
  id: string;
  name: string;
  region: string | null;
  status: string | null;
  start_date: string;
  end_date: string;
  created_at: string;
  total_leads: string;
};

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("/campaigns");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch campaigns");
      setCampaigns(json.data || []);
    } catch (e: any) {
      console.log(e);
      Alert.alert("Error", e.message || "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCampaigns();
    }, [])
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const renderItem = ({ item }: { item: Campaign }) => {
    return (
      <TouchableOpacity 
        className="bg-white dark:bg-slate-800 rounded-3xl p-5 mb-5 shadow-sm border border-gray-100 dark:border-slate-700"
        onPress={() => setSelectedCampaignId(item.id)}
      >
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-1 mr-4">
            <View className="flex-row items-center gap-2 mb-1">
              <MaterialIcons name="campaign" size={18} color="#2563eb" />
              <Text className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                {item.region || "Global Campaign"}
              </Text>
            </View>
            <Text className="text-xl font-bold text-gray-900 dark:text-slate-50">{item.name}</Text>
          </View>
          <View className="bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-900/50">
            <Text className="text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
              {item.status || "ACTIVE"}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center border-t border-gray-50 dark:border-slate-700/50 pt-4 mt-2">
          {/* Timeline Start */}
          <View className="flex-1 border-r border-gray-100 dark:border-slate-700 pr-4">
            <View className="flex-row items-center gap-1.5 mb-2">
              <MaterialIcons name="flight-takeoff" size={16} color="#9ca3af" />
              <Text className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Start</Text>
            </View>
            <Text className="text-base font-bold text-gray-800 dark:text-slate-100">{formatDate(item.start_date)}</Text>
          </View>
          
          {/* Timeline End */}
          <View className="flex-1 pl-4">
            <View className="flex-row items-center gap-1.5 mb-2">
              <MaterialIcons name="flight-land" size={16} color="#9ca3af" />
              <Text className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">End</Text>
            </View>
            <Text className="text-base font-bold text-gray-800 dark:text-slate-100">{formatDate(item.end_date)}</Text>
          </View>
        </View>

        {/* Highlight Banner */}
        <View className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl p-4 mt-5 flex-row items-center justify-between border border-gray-100 dark:border-slate-700/50">
          <View className="flex-row items-center gap-2">
            <View className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full items-center justify-center">
              <MaterialIcons name="groups" size={20} color="#4f46e5" />
            </View>
            <Text className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total Leads</Text>
          </View>
          <Text className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{item.total_leads || "0"}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#f8fafc] dark:bg-slate-900">
      {/* Header */}
      <View className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex-row items-center gap-3">
        <View className="w-10 h-10 bg-blue-600 rounded-xl items-center justify-center shadow-sm">
          <MaterialIcons name="flag" size={22} color="white" />
        </View>
        <Text className="text-2xl font-extrabold text-gray-900 dark:text-slate-50">Campaigns</Text>
      </View>

      <FlatList
        data={campaigns}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        ListEmptyComponent={
          loading ? (
            <View className="items-center justify-center py-20">
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          ) : (
            <View className="items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm mt-4">
              <MaterialIcons name="tour" size={48} color="#cbd5e1" style={{ marginBottom: 10 }} />
              <Text className="text-gray-500 dark:text-slate-400 font-medium text-lg mt-3">No active campaigns.</Text>
            </View>
          )
        }
      />

      {selectedCampaignId && (
        <CampaignDetails 
          campaignId={selectedCampaignId} 
          onClose={() => setSelectedCampaignId(null)} 
        />
      )}
    </SafeAreaView>
  );
}