import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Lead from "../components/Lead";
import TelecallerLeadActions from "../components/TelecallerLeadActions";

import { getLeads } from "../data/leads";

const FILTERS = ["ASSIGNED", "CONTACTED", "VISIT_REQUESTED"] as const;

export default function Leads() {
  const [leads, setLeads] = useState<any[]>(getLeads());
  const [selectedFilter, setSelectedFilter] = useState<typeof FILTERS[number]>("ASSIGNED");
  const [selectedLead, setSelectedLead] = useState<any>(null);

  // Refresh leads when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setLeads(getLeads());
    }, [])
  );

  const handleUpdated = () => {
    setLeads(getLeads());
    setSelectedLead(null);
  };

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

      {filteredLeads.length === 0 ? (
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
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}
      <TelecallerLeadActions
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdated={handleUpdated}
      />
    </SafeAreaView>
  );
}