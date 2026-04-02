import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import GroundExecutiveLeadActions from "../components/GroundExecutiveLeadActions";
import { useFocusEffect } from "expo-router";
import { apiRequest } from "../utils/api";

type LeadType = {
  id: string;
  farmer_name: string;
  phone_number: string;
  status: string;
  village: string;
  taluka: string;
  crop_type: string;
  acreage: number;
};

const FILTERS = [
  { id: "VISIT_ASSIGNED", label: "My Route", icon: "map-pin" },
  { id: "COMPLETED", label: "Completed", icon: "check-circle" },
];

export default function Leads() {
  const [leads, setLeads] = useState<LeadType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadType | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("VISIT_ASSIGNED");

  const fetchLeads = async () => {
    try {
      const res = await apiRequest("/leads?limit=100");
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch (error) {
      console.error("Failed to fetch leads:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLeads();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeads();
  };

  const handleUpdated = () => {
    fetchLeads();
    setSelectedLead(null);
  };

  const filteredLeads = leads.filter((lead) => {
    if (selectedFilter === "COMPLETED") {
      return ["VISIT_COMPLETED", "SOLD", "DROPPED"].includes(lead.status);
    }
    return lead.status === selectedFilter;
  });

  const VisitItem = ({ item, index }: { item: LeadType, index: number }) => {
    const isCompleted = ["VISIT_COMPLETED", "SOLD", "DROPPED"].includes(item.status);
    
    return (
      <View className="mb-4 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-row items-center flex-1">
            <View className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 items-center justify-center mr-3">
              <Text className="text-blue-700 dark:text-blue-400 font-bold text-xs">{index + 1}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900 dark:text-slate-50" numberOfLines={1}>
                {item.farmer_name || "Unknown Farmer"}
              </Text>
              <Text className="text-sm text-gray-500 dark:text-slate-400">
                {item.village || "Unknown Village"}, {item.taluka || "Unknown"}
              </Text>
            </View>
          </View>
          
          <View className={`px-2 py-1 rounded-md ${isCompleted ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-sky-100 dark:bg-sky-900/40'}`}>
            <Text className={`text-xs font-bold ${isCompleted ? 'text-emerald-700 dark:text-emerald-400' : 'text-sky-700 dark:text-sky-400'}`}>
              {isCompleted ? item.status.replace("_", " ") : "READY TO VISIT"}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center mb-4 bg-gray-50 dark:bg-slate-900/50 p-2 rounded-lg">
           <MaterialIcons name="eco" size={16} color="#65a30d" />
           <Text className="text-gray-700 dark:text-slate-300 text-xs ml-2 font-medium">
             {item.crop_type || "No Crop"} • {item.acreage || 0} Acres
           </Text>
        </View>

        <View className="flex-row gap-2 mt-1">
          {!isCompleted && (
            <TouchableOpacity className="flex-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl py-2.5 items-center flex-row justify-center">
              <Feather name="navigation" size={16} color="#3b82f6" />
              <Text className="text-blue-600 dark:text-blue-400 font-semibold ml-2">Navigate</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => setSelectedLead(item)}
            className={`flex-1 rounded-xl py-2.5 items-center flex-row justify-center shadow-sm ${
              isCompleted 
                ? 'bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600' 
                : 'bg-[#0ea5e9]'
            }`}
          >
            {isCompleted ? (
              <Text className="text-gray-700 dark:text-slate-300 font-semibold">View Details</Text>
            ) : (
              <>
                <MaterialIcons name="play-circle-outline" size={18} color="white" />
                <Text className="text-white font-bold ml-1">Start Visit</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8fafc] dark:bg-slate-900">
      <View className="px-5 pt-4 pb-2 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 shadow-sm z-10">
        <Text className="text-2xl font-bold text-gray-900 dark:text-slate-50 mb-4">
          Today's Route
        </Text>

        {/* Filters */}
        <View className="flex-row space-x-3 mb-2">
          {FILTERS.map((filter) => {
            const isActive = selectedFilter === filter.id;
            return (
              <TouchableOpacity
                key={filter.id}
                onPress={() => setSelectedFilter(filter.id)}
                className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl border ${
                  isActive
                    ? "bg-[#0ea5e9] border-[#0ea5e9]"
                    : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600"
                }`}
              >
                <Feather 
                  name={filter.icon as any} 
                  size={16} 
                  color={isActive ? "white" : "#64748b"} 
                />
                <Text
                  className={`font-semibold ml-2 ${
                    isActive ? "text-white" : "text-gray-600 dark:text-slate-400"
                  }`}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      ) : filteredLeads.length === 0 ? (
        <View className="flex-1 items-center justify-center p-8">
          <View className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full items-center justify-center mb-4">
            <Feather name="map" size={32} color="#94a3b8" />
          </View>
          <Text className="text-lg font-bold text-gray-700 dark:text-slate-300">No visits here</Text>
          <Text className="text-gray-500 dark:text-slate-500 text-center mt-2">
            You don't have any visits in this category right now.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredLeads}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => <VisitItem item={item} index={index} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {selectedLead && (
        <GroundExecutiveLeadActions
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdated={handleUpdated}
        />
      )}
    </SafeAreaView>
  );
}
