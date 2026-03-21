import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { apiRequest } from "../utils/api";
import LeadProfile from "../components/Lead";
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

type Lead = {
  id: string;
  farmer_name: string;
  phone_number: string;
  alternate_phone?: string | null;
  farmer_type?: string | null;
  village?: string | null;
  taluka?: string | null;
  district?: string | null;
  status: LeadStatus;
  created_at: string;
};

const STATUS_STYLES: Record<LeadStatus, string> = {
  NEW: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400",
  ASSIGNED: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400",
  CONTACTED: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400",
  VISIT_REQUESTED: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400",
  VISIT_ASSIGNED: "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400",
  VISIT_COMPLETED: "bg-lime-100 dark:bg-lime-900/40 text-lime-700 dark:text-lime-400",
  SOLD: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400",
  DROPPED: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400",
};

export default function Leads() {
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchLeads = async (pageNumber = 1, shouldAppend = false) => {
    if (pageNumber === 1) setIsLoading(true);
    else setIsFetchingMore(true);

    try {
      console.log(`Fetching leads for telecaller, page: ${pageNumber}`);
      const res = await apiRequest(`/telecaller/queue?page=${pageNumber}&limit=20`);
      const json = await res.json();
      console.log('Leads response:', JSON.stringify(json).substring(0, 200));

      const newLeads = json.data || json.leads || (Array.isArray(json) ? json : []);
      console.log(`Found ${newLeads.length} leads`);

      setAllLeads((prev) => {
        const combined = shouldAppend ? [...prev, ...newLeads] : newLeads;
        const seen = new Set();
        return combined.filter((l: Lead) => {
          if (!l.id) return true; // Keep items without ID as is (they'll use index as fallback key)
          if (seen.has(l.id)) return false;
          seen.add(l.id);
          return true;
        });
      });

      if (newLeads.length < 20) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setPage(1);
      setHasMore(true);
      fetchLeads(1, false);
    }, [])
  );

  const handleLoadMore = () => {
    if (!isLoading && !isFetchingMore && hasMore && !search) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchLeads(nextPage, true);
    }
  };

  const handleCall = (phoneNumber: string) => {
    if (!phoneNumber) return;
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert("Error", "Unable to open phone dialer");
    });
  };

  const filteredLeads = allLeads.filter((lead) => {
    const lowerSearch = search.toLowerCase();
    return (
      lead.farmer_name.toLowerCase().includes(lowerSearch) ||
      lead.phone_number.includes(lowerSearch)
    );
  });

  const renderItem = ({ item }: { item: Lead }) => {
    const statusClass = STATUS_STYLES[item.status] || "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300";
    const firstLetter = item.farmer_name?.charAt(0)?.toUpperCase() || "?";

    return (
      <View className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 mb-4 overflow-hidden">
        <View className="p-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-row items-center gap-3 flex-1">
              <View className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/50 items-center justify-center">
                <Text className="text-xl font-bold text-blue-600 dark:text-blue-400">{firstLetter}</Text>
              </View>

              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-900 dark:text-slate-50">{item.farmer_name}</Text>
                <Text className="text-base text-gray-500 dark:text-slate-400 mt-1">+{item.phone_number}</Text>
              </View>
            </View>

            <View className={`px-3 py-1.5 rounded-full ${statusClass}`}>
              <Text className="text-xs font-bold uppercase">{item.status}</Text>
            </View>
          </View>

          <View className="flex-row justify-between mt-5">
            <View>
              <Text className="text-[11px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">Village</Text>
              <Text className="text-base font-semibold text-gray-800 dark:text-slate-100 mt-1">{item.village || "N/A"}</Text>
            </View>
            <View>
              <Text className="text-[11px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">Farmer Type</Text>
              <Text className="text-base font-semibold text-gray-800 dark:text-slate-100 mt-1">{item.farmer_type || "N/A"}</Text>
            </View>
          </View>
        </View>

        <View className="flex-row justify-end gap-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80 px-4 py-3">
          <TouchableOpacity 
            className="flex-row items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/40 px-4 py-2 rounded-lg"
            onPress={() => handleCall(item.phone_number)}
          >
            <Feather name="phone-call" size={16} color="#059669" />
            <Text className="text-emerald-700 dark:text-emerald-400 font-bold">Call</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="bg-blue-600 px-5 py-2 rounded-lg"
            onPress={() => setSelectedLeadId(item.id)}
          >
            <Text className="text-white font-bold">View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (selectedLeadId) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-gray-50 dark:bg-slate-900">
        <LeadProfile id={selectedLeadId} onBack={() => { setSelectedLeadId(null); fetchLeads(1, false); }} />
      </SafeAreaView>
    );
  }

  if (isCreating) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-gray-50 dark:bg-slate-900">
        <NewLeadForm onBack={() => setIsCreating(false)} onSuccess={() => { setIsCreating(false); fetchLeads(1, false); }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-slate-900">
      <View className="px-5 pt-6 pb-4 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 items-center justify-center">
            <MaterialIcons name="groups" size={24} color="#2563eb" />
          </View>
          <Text className="text-3xl font-extrabold text-gray-900 dark:text-slate-50">Leads Queue</Text>
        </View>
      </View>

      <View className="px-5 mt-4 mb-4">
        <View className="flex-row items-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 h-12">
          <MaterialIcons name="search" size={20} color="#9ca3af" />
          <TextInput
            placeholder="Search leads..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
            className="ml-2 flex-1 text-base text-gray-900 dark:text-slate-50"
          />
        </View>
      </View>

      <FlatList
        data={filteredLeads}
        keyExtractor={(item, index) => item.id || `lead-${index}`}
        renderItem={renderItem}

        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 140,
        }}
        ListEmptyComponent={
          isLoading ? (
            <View className="items-center mt-10">
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          ) : (
            <View className="bg-white dark:bg-slate-800 rounded-2xl p-6 items-center mt-10">
              <Text className="text-gray-500 dark:text-slate-400 text-base">No leads in queue.</Text>
            </View>
          )
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingMore ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          ) : null
        }
      />

      <TouchableOpacity 
        className="absolute bottom-24 right-6 w-16 h-16 bg-blue-600 rounded-full items-center justify-center shadow-xl"
        onPress={() => setIsCreating(true)}
      >
        <MaterialIcons name="add" size={30} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
