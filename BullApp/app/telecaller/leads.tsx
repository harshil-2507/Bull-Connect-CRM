import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import Lead from "../components/Lead";

export default function Leads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);

      const token = await SecureStore.getItemAsync("authToken");

      if (!token) {
        console.warn("No auth token found — skipping redirect");
        return;
      }

      const response = await fetch("https://bull-connect-crm.onrender.com/telecaller/queue", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      console.log("Fetched leads:", result);

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

  return (
    <SafeAreaView className="flex-1 px-4 pt-4 bg-gray-50">
      <Text className="text-3xl font-bold text-[#1a4d2e] mb-6">
        My Leads
      </Text>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#1a4d2e" />
          <Text className="mt-4 text-gray-500">Loading leads...</Text>
        </View>
      ) : leads.length === 0 ? (
        <View className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <Text className="text-gray-700">No leads found.</Text>
        </View>
      ) : (
        <FlatList
          data={leads}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={({ item }) => (
            <Lead
              item={item}
              // no action for now
              onAction={() => {}}
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
    </SafeAreaView>
  );
}