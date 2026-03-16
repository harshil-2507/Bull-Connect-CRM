import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Lead from "../components/Lead";
import LeadActions from "../components/LeadActions";
import { useFocusEffect } from "expo-router";
import { apiRequest } from "../utils/api";

type LeadType = {
  id: string;
  farmer_name: string;
  phone_number: string;
  status: string;
  // Add other fields if needed
};

const FILTERS = ["NEW", "ASSIGNED", "CONTACTED", "VISIT_REQUESTED"] as const;

export default function Leads() {
  const [leads, setLeads] = useState<LeadType[]>([]);
  const [selectedLead, setSelectedLead] = useState<LeadType | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<typeof FILTERS[number]>("NEW");
  const [searchQuery, setSearchQuery] = useState("");

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalLeads, setTotalLeads] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch leads from API with pagination & filter
 const fetchLeads = async (pageNum = 1, reset = false, filter = selectedFilter) => {
  setLoading(true);
  try {
    const res = await apiRequest(
      `/leads?page=${pageNum}&limit=100&status=${filter}`
    );

    if (!res.ok) throw new Error("Failed to fetch leads");

    const data = await res.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid data format received");
    }

    setLeads((prev) => (reset ? data : [...prev, ...data]));
    setTotalLeads(data.length); // optional: for pagination display
    setPage(pageNum);
  } catch (error: any) {
    Alert.alert("Error", error.message || "Unknown error occurred");
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  const refreshLeads = () => {
    setRefreshing(true);
    fetchLeads(1, true);
    setSelectedLead(null);
  };

  const loadMoreLeads = () => {
    if (loading) return;
    if (leads.length >= totalLeads) return;
    fetchLeads(page + 1);
  };

  useFocusEffect(useCallback(() => {
    refreshLeads();
  }, []));

  // Refetch when filter changes
  useEffect(() => {
    fetchLeads(1, true, selectedFilter);
  }, [selectedFilter]);

  // Filter leads by search query
  const displayedLeads = leads.filter((lead) =>
    lead.farmer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 px-4 pt-4 bg-gray-50">
      <Text className="text-3xl font-bold text-[#1a4d2e] mb-4">My Leads</Text>

      {/* Search Bar */}
      <View className="mb-4">
        <TextInput
          placeholder="Search by name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
          className="bg-white h-12 rounded-lg border border-gray-200 pl-4 shadow-sm"
        />
      </View>

      {/* Filters */}
      {/* <View className="flex-row space-x-2 mb-4">
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
            <Text className={`font-semibold ${selectedFilter === filter ? "text-white" : "text-gray-700"}`}>
              {filter.replace("_", " ")}
            </Text>
          </TouchableOpacity>
        ))}
      </View> */}

      {/* No leads */}
      {displayedLeads.length === 0 && !loading ? (
        <View className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <Text className="text-gray-700">No leads found.</Text>
        </View>
      ) : (
        <FlatList
          data={displayedLeads}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Lead item={item} onAction={setSelectedLead} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          onEndReached={loadMoreLeads}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loading ? <ActivityIndicator size="small" color="#1a4d2e" /> : null}
          refreshing={refreshing}
          onRefresh={refreshLeads}
        />
      )}

      <LeadActions
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdated={refreshLeads}
      />
    </SafeAreaView>
  );
}