import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Lead from "../components/Lead";
import GroundManagerLeadActions from "../components/GroundManagerLeadActions";
import { useFocusEffect } from "expo-router";
import { apiRequest } from "../utils/api";

type LeadType = {
  id: string;
  farmer_name: string;
  phone_number: string;
  status: string;
  // Add other fields as needed
};

const FILTERS = ["VISIT_REQUESTED", "VISIT_ASSIGNED"] as const;

export default function Leads() {
  const [leads, setLeads] = useState<LeadType[]>([]);
  const [selectedLead, setSelectedLead] = useState<LeadType | null>(null);
  const [selectedFilter, setSelectedFilter] =
    useState<(typeof FILTERS)[number]>("VISIT_REQUESTED");

  const fetchLeads = async () => {
    try {
      const res = await apiRequest(`/leads?status=${selectedFilter}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [selectedFilter]);

  // Refresh leads when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchLeads();
    }, [selectedFilter])
  );

  const handleAssigned = () => {
    fetchLeads();
    setSelectedLead(null);
  };

  const filteredLeads = leads.filter(
    (lead) => lead.status === selectedFilter
  );

  return (
    <SafeAreaView className="flex-1 px-4 pt-4 bg-gray-50">
      <Text className="text-3xl font-bold text-[#1a4d2e] mb-4">
        Visit Requests
      </Text>

      {/* Filters */}
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
              {filter.replace("_", " ")}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredLeads.length === 0 ? (
        <View className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <Text className="text-gray-700">No leads found.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLeads}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Lead item={item} onAction={setSelectedLead} />
          )}
          scrollEnabled={false}
        />
      )}

      <GroundManagerLeadActions
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onAssigned={handleAssigned}
      />
    </SafeAreaView>
  );
}
