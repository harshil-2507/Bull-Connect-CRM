import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
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
  bull_centre?: string | null;
  crop_type?: string | null;
  castor_bori?: number | null;
  groundnut_bori?: number | null;
  total_land_bigha?: number | null;
  status: LeadStatus;
  created_at: string;
};

const STATUS_STYLES: Record<LeadStatus, string> = {
  NEW: "bg-emerald-100 text-emerald-700",
  ASSIGNED: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-yellow-100 text-yellow-700",
  VISIT_REQUESTED: "bg-purple-100 text-purple-700",
  VISIT_ASSIGNED: "bg-cyan-100 text-cyan-700",
  VISIT_COMPLETED: "bg-lime-100 text-lime-700",
  SOLD: "bg-green-100 text-green-700",
  DROPPED: "bg-red-100 text-red-700",
};

export default function Leads() {
  const router = useRouter();
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Assign modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignLeadId, setAssignLeadId] = useState<string | null>(null);
  const [telecallers, setTelecallers] = useState<any[]>([]);
  const [loadingTelecallers, setLoadingTelecallers] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  useEffect(() => {
    if (showAssignModal && telecallers.length === 0) {
      const fetchTelecallers = async () => {
        setLoadingTelecallers(true);
        try {
          const res = await apiRequest("/manager/telecallers");
          if (!res.ok) throw new Error("Failed to fetch telecallers");
          const data = await res.json();
          setTelecallers(Array.isArray(data) ? data : []);
        } catch(e) {
          console.log(e);
          Alert.alert("Error", "Failed to load telecallers");
        } finally {
          setLoadingTelecallers(false);
        }
      };
      fetchTelecallers();
    }
  }, [showAssignModal]);

  const handleAssign = async (telecallerId: string) => {
    setAssigningId(telecallerId);
    try {
      const res = await apiRequest("/manager/assign-telecaller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: assignLeadId, telecallerId }),
      });
      if (!res.ok) throw new Error("Failed to assign lead");
      
      Alert.alert("Success", "Lead assigned successfully");
      setShowAssignModal(false);
      
      setAllLeads(prev => prev.map(l => l.id === assignLeadId ? { ...l, status: "ASSIGNED" } : l));
      setAssignLeadId(null);
    } catch(e: any) {
      Alert.alert("Error", e.message || "Failed to assign");
    } finally {
      setAssigningId(null);
    }
  };

  const fetchLeads = async (pageNumber = 1, shouldAppend = false) => {
    if (pageNumber === 1) setIsLoading(true);
    else setIsFetchingMore(true);

    try {
      const res = await apiRequest(`/leads?page=${pageNumber}&limit=20`);
      const json = await res.json();

      const newLeads = json.leads || [];
      if (newLeads.length < 20) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (shouldAppend) {
        setAllLeads((prev) => {
          const existingIds = new Set(prev.map((l) => l.id));
          const uniqueNewLeads = newLeads.filter((l: Lead) => !existingIds.has(l.id));
          return [...prev, ...uniqueNewLeads];
        });
      } else {
        setAllLeads(newLeads);
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

  // Filter leads by name or phone number
  const filteredLeads = allLeads.filter((lead) => {
    const lowerSearch = search.toLowerCase();
    return (
      lead.farmer_name.toLowerCase().includes(lowerSearch) ||
      lead.phone_number.includes(lowerSearch)
    );
  });

  const renderItem = ({ item }: { item: Lead }) => {
    const statusClass = STATUS_STYLES[item.status] || "bg-gray-100 text-gray-600";
    const firstLetter = item.farmer_name?.charAt(0)?.toUpperCase() || "?";

    return (
      <View className="bg-white rounded-2xl border border-gray-200 mb-4 overflow-hidden">
        {/* Lead Top Row */}
        <View className="p-4">
          <View className="flex-row items-start justify-between">
            {/* Avatar + Name + Phone */}
            <View className="flex-row items-center gap-3 flex-1">
              <View className="w-14 h-14 rounded-xl bg-blue-100 items-center justify-center">
                <Text className="text-xl font-bold text-blue-600">{firstLetter}</Text>
              </View>

              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-900">{item.farmer_name}</Text>
                <Text className="text-base text-gray-500 mt-1">+{item.phone_number}</Text>
              </View>
            </View>

            {/* Status */}
            <View className={`px-3 py-1.5 rounded-full ${statusClass}`}>
              <Text className="text-xs font-bold uppercase">{item.status}</Text>
            </View>
          </View>

          {/* Village + Farmer Type */}
          <View className="flex-row justify-between mt-5">
            <View>
              <Text className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                Village
              </Text>
              <Text className="text-base font-semibold text-gray-800 mt-1">
                {item.village || "N/A"}
              </Text>
            </View>

            <View>
              <Text className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                Farmer Type
              </Text>
              <Text className="text-base font-semibold text-gray-800 mt-1">
                {item.farmer_type || "N/A"}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View className="flex-row justify-end gap-4 border-t border-gray-100 bg-gray-50 px-4 py-3">
          <TouchableOpacity 
            className="flex-row items-center gap-1"
            onPress={() => {
              setAssignLeadId(item.id);
              setShowAssignModal(true);
            }}
          >
            <MaterialIcons name="person-add" size={18} color="#6b7280" />
            <Text className="text-gray-500 font-semibold">Assign</Text>
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
      <SafeAreaView edges={['top']} className="flex-1 bg-gray-50">
        <LeadProfile id={selectedLeadId} onBack={() => { setSelectedLeadId(null); fetchLeads(1, false); }} />
      </SafeAreaView>
    );
  }

  if (isCreating) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-gray-50">
        <NewLeadForm onBack={() => setIsCreating(false)} onSuccess={() => { setIsCreating(false); fetchLeads(1, false); }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="px-5 pt-6 pb-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
            <MaterialIcons name="groups" size={24} color="#2563eb" />
          </View>
          <Text className="text-3xl font-extrabold text-gray-900">Leads Management</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View className="px-5 mt-4 mb-4">
        <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 h-12">
          <MaterialIcons name="search" size={20} color="#9ca3af" />
          <TextInput
            placeholder="Search by name or phone number..."
            value={search}
            onChangeText={setSearch}
            className="ml-2 flex-1 text-base"
          />
        </View>
      </View>

      {/* Leads List */}
      <FlatList
        data={filteredLeads}
        keyExtractor={(item) => item.id}
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
            <View className="bg-white rounded-2xl p-6 items-center mt-10">
              <Text className="text-gray-500 text-base">No leads found.</Text>
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

      {/* Floating Action Button */}
      <TouchableOpacity 
        className="absolute bottom-24 right-6 w-16 h-16 bg-blue-600 rounded-full items-center justify-center shadow-xl"
        onPress={() => setIsCreating(true)}
      >
        <MaterialIcons name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* Assign Telecaller Modal */}
      <Modal visible={showAssignModal} animationType="slide" transparent={true} onRequestClose={() => setShowAssignModal(false)}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl h-2/3 shadow-xl">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-5 border-b border-gray-100">
              <Text className="text-xl font-bold text-gray-900">Assign Telecaller</Text>
              <TouchableOpacity onPress={() => setShowAssignModal(false)} className="p-2 bg-gray-100 rounded-full">
                <MaterialIcons name="close" size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* List */}
            {loadingTelecallers ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#2563eb" />
              </View>
            ) : telecallers.length === 0 ? (
              <View className="flex-1 items-center justify-center px-6">
                <MaterialIcons name="person-off" size={48} color="#9ca3af" />
                <Text className="text-gray-500 font-medium mt-3">No telecallers available</Text>
              </View>
            ) : (
              <FlatList
                data={telecallers}
                keyExtractor={(item) => item.id || Math.random().toString()}
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleAssign(item.id)}
                    disabled={assigningId !== null}
                    className="flex-row items-center bg-gray-50 rounded-2xl p-4 mb-3 border border-gray-200"
                  >
                    <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
                      <Text className="text-lg font-bold text-blue-600">
                        {item.name ? item.name.charAt(0).toUpperCase() : 'T'}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-gray-900">{item.name || 'Unknown'}</Text>
                    </View>
                    {assigningId === item.id ? (
                      <ActivityIndicator color="#2563eb" size="small" />
                    ) : (
                      <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}