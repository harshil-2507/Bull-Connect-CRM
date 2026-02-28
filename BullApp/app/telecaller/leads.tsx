import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import Lead from "../components/Lead";
import * as Linking from "expo-linking";

export default function Leads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);

      const token = await SecureStore.getItemAsync("authToken");

      const response = await fetch(
        "https://bull-connect-crm.onrender.com/leads",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch leads");
      }

      setLeads(data);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderLead = ({ item }: any) => (
    <View className="bg-white p-5 rounded-xl shadow border border-gray-100 mb-4">
      <Text className="text-lg font-bold text-[#1a4d2e]">
        {item.farmer_name}
      </Text>

      <Text className="text-gray-600 mt-1">
        📞 {item.phone_number}
      </Text>

      <Text className="text-gray-600">
        📍 {item.village}, {item.taluka}
      </Text>

      <Text className="text-gray-600">
        {item.district}, {item.state}
      </Text>

      <Text className="mt-2 text-sm font-semibold text-blue-600">
        Campaign: {item.campaign_name}
      </Text>

      <Text className="mt-1 text-sm">
        Status: {item.status}
      </Text>

      <Text className="mt-1 text-xs text-gray-400">
        Created: {new Date(item.created_at).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#fafbf9] px-6 pt-10">
      <Text className="text-3xl font-bold text-[#1a4d2e] mb-6">
        Leads
      </Text>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#1a4d2e" />
          <Text className="mt-4 text-gray-500">
            Loading leads...
          </Text>
        </View>
      ) : leads.length === 0 ? (
        <View className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <Text className="text-gray-700">
            No leads assigned yet.
          </Text>
        </View>
      ) : (
        <FlatList
  data={leads}
  keyExtractor={(item) => item.id.toString()}
  renderItem={({ item }) => (
    <Lead
      item={item}
      onCall={(phone) => Linking.openURL(`tel:${phone}`)}
    />
  )}
  showsVerticalScrollIndicator={false}
  contentContainerStyle={{ paddingBottom: 120 }}
/>
      )}
    </SafeAreaView>
  );
}