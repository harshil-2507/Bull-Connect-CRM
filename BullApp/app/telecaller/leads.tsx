import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import Lead from "../components/Lead";
import TelecallerLeadActions from "../components/TelecallerLeadActions";

const FILTERS = ["ASSIGNED", "CONTACTED", "VISIT_REQUESTED"];

export default function Leads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("ASSIGNED");
  const [selectedLead, setSelectedLead] = useState<any>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);

      const token = await SecureStore.getItemAsync("authToken");

      if (!token) {
        console.warn("No auth token found");
        return;
      }

      const response = await fetch(
        "https://bull-connect-crm.onrender.com/telecaller/queue",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch leads");
      }

      setLeads(result.data || []);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLeads();
  }, []);

  // 🔎 Filter leads based on selected status
  const filteredLeads = leads.filter(
    (lead) => lead.status === selectedFilter
  );

  return (
    <SafeAreaView className="flex-1 px-4 pt-4 bg-gray-50">
      <Text className="text-3xl font-bold text-[#1a4d2e] mb-4">
        My Leads
      </Text>

      {/* ✅ Filter Buttons */}
      <View className="flex-row space-x-2 mb-4">
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            onPress={() => setSelectedFilter(filter)}
            className={`px-4 py-2 rounded-full border ${
              selectedFilter === filter
                ? "bg-[#1a4d2e] border-[#1a4d2e]"
                : "bg-white border-gray-300"
            }`}
          >
            <Text
              className={`font-semibold ${
                selectedFilter === filter
                  ? "text-white"
                  : "text-gray-700"
              }`}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#1a4d2e" />
          <Text className="mt-4 text-gray-500">Loading leads...</Text>
        </View>
      ) : filteredLeads.length === 0 ? (
        <View className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <Text className="text-gray-700">
            No leads found for {selectedFilter}.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredLeads}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={({ item }) => (
            <Lead
              item={item}
              onAction={(lead) => setSelectedLead(lead)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#1a4d2e"]}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}
      <TelecallerLeadActions
  lead={selectedLead}
  onClose={() => setSelectedLead(null)}
  onSuccess={fetchLeads}
/>
    </SafeAreaView>
  );
}