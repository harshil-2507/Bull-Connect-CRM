import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { apiRequest } from "../utils/api";
import LeadProfile from "../components/Lead";

type Telecaller = {
  id: string;
  username: string;
  name: string;
  role: string;
  phone: string;
  email: string | null;
};

// --- Lazy Loader Card to fetch Lead Details based on simple ID ---
const AssignedLeadCard = ({ leadId, searchText, onPress }: { leadId: string, searchText: string, onPress: () => void }) => {
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const res = await apiRequest(`/leads/${leadId}`);
        const data = await res.json();
        setLead(data);
      } catch (err) {
        console.log("Failed to load generic lead", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLead();
  }, [leadId]);

  if (loading) {
    return (
      <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 mb-3 border border-gray-100 dark:border-slate-700 shadow-sm items-center justify-center h-24">
        <ActivityIndicator size="small" color="#2563eb" />
      </View>
    );
  }

  if (!lead) return null;

  if (searchText) {
    const s = searchText.toLowerCase();
    const nameMatch = lead.farmer_name?.toLowerCase().includes(s);
    const phoneMatch = lead.phone_number?.includes(s);
    if (!nameMatch && !phoneMatch) return null;
  }

  return (
    <TouchableOpacity onPress={onPress} className="bg-white dark:bg-slate-800 rounded-2xl p-4 mb-3 border border-gray-100 dark:border-slate-700 shadow-sm flex-row items-center justify-between">
      <View className="flex-1">
        <Text className="text-lg font-bold text-gray-900 dark:text-slate-50 mb-1">{lead.farmer_name || "Unknown Farmer"}</Text>
        <Text className="text-sm text-gray-500 dark:text-slate-400 mb-2">{lead.phone_number}</Text>
        <View className="flex-row items-center">
          <MaterialIcons name="location-on" size={14} color="#9ca3af" />
          <Text className="text-xs text-gray-400 dark:text-slate-500 ml-1">
            {[lead.village, lead.taluka, lead.district].filter(Boolean).join(", ") || "No location info"}
          </Text>
        </View>
      </View>
      <View className="items-end justify-center">
        <View className="bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900/50 mb-2">
           <Text className="text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">{lead.status}</Text>
        </View>
        <Text className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
           PRIORITY: {lead.priority || 0}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function Telecallers() {
  const [telecallers, setTelecallers] = useState<Telecaller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // States for viewing assigned leads
  const [selectedTelecaller, setSelectedTelecaller] = useState<Telecaller | null>(null);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [assignedLeadIds, setAssignedLeadIds] = useState<string[]>([]);
  const [searchLead, setSearchLead] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const fetchTelecallers = async () => {
    try {
      setIsLoading(true);
      const res = await apiRequest("/manager/telecallers");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch telecallers");
      setTelecallers(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.log(e);
      Alert.alert("Error", e.message || "Failed to load telecallers");
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTelecallers();
    }, [])
  );

  const getInitials = (name: string) => {
    if (!name) return "T";
    const parts = name.split(" ");
    return parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0][0];
  };

  const handleViewDetails = async (telecaller: Telecaller) => {
    setSelectedTelecaller(telecaller);
    setSearchLead("");
    setAssignmentsLoading(true);
    setAssignedLeadIds([]);
    try {
      const res = await apiRequest("/manager/tele-assignments");
      const data = await res.json();
      if (!res.ok) throw new Error("Failed to load assignments");
      
      const filtered = data.filter((assignment: any) => assignment.user_id === telecaller.id);
      const leadIds = filtered.map((a: any) => a.lead_id);
      
      setAssignedLeadIds(leadIds);
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Could not fetch assignments");
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const filteredTelecallers = telecallers.filter((t) => {
    const s = search.toLowerCase();
    return (t.name?.toLowerCase() || "").includes(s) || (t.username?.toLowerCase() || "").includes(s);
  });

  const renderItem = ({ item }: { item: Telecaller }) => {
    return (
      <View className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm p-5 mb-5">
        {/* Card Header Layer */}
        <View className="flex-row justify-between items-start mb-6">
          <View className="flex-row items-center flex-1">
            {/* Avatar */}
            <View className="relative mr-4">
              <View className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 rounded-full items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm">
                <Text className="text-xl font-bold text-blue-700 dark:text-blue-400">{getInitials(item.name)}</Text>
              </View>
              {/* Online Dot */}
              <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800" />
            </View>

            {/* Name and Phone */}
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900 dark:text-slate-50 leading-tight mb-1">{item.name}</Text>
              <View className="flex-row items-center gap-1.5 mt-0.5">
                <MaterialIcons name="phone" size={14} color="#6b7280" />
                <Text className="text-sm font-medium text-gray-500 dark:text-slate-400">{item.phone}</Text>
              </View>
            </View>
          </View>

          {/* Right Tag/Status */}
          <View className="items-end justify-center">
            <Text className="text-sm font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">ACTIVE</Text>
            <Text className="text-[10px] font-bold text-gray-400 dark:text-slate-500 mt-1 uppercase tracking-wider">{item.role}</Text>
          </View>
        </View>

        {/* Info Columns: Username & Email Only */}
        <View className="flex-row items-center justify-between px-2 mb-6">
          <View className="items-center flex-1">
            <Text className="text-base font-bold text-gray-900 dark:text-slate-50" numberOfLines={1}>{item.username}</Text>
            <Text className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mt-1">Username</Text>
          </View>
          <View className="w-[1px] h-8 bg-gray-200 dark:bg-slate-700" />
          <View className="items-center flex-1">
            <Text className="text-base font-bold text-gray-900 dark:text-slate-50" numberOfLines={1}>{item.email || "N/A"}</Text>
            <Text className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mt-1">Email</Text>
          </View>
        </View>

        {/* View Details Button */}
        <TouchableOpacity 
          className="bg-blue-50 dark:bg-blue-900/40 py-3.5 rounded-xl items-center justify-center border border-blue-100 dark:border-blue-900/50"
          onPress={() => handleViewDetails(item)}
        >
          <Text className="text-blue-700 dark:text-blue-400 font-bold uppercase tracking-wider text-sm">View Details</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (selectedLeadId) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-gray-50 dark:bg-slate-900">
        <LeadProfile id={selectedLeadId} onBack={() => setSelectedLeadId(null)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#f8fafc] dark:bg-slate-900">
      {/* Header */}
      <View className="bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 pb-4">
        <View className="flex-row items-center justify-between px-6 py-4">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 bg-blue-600 rounded-xl items-center justify-center">
              <MaterialIcons name="assessment" size={22} color="white" />
            </View>
            <Text className="text-2xl font-extrabold text-gray-900 dark:text-slate-50">Telecallers</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View className="px-6 mb-2">
          <View className="flex-row items-center bg-gray-100 dark:bg-slate-700 rounded-xl px-4 py-2">
             <Feather name="search" size={20} color="#9ca3af" />
             <TextInput 
                placeholder="Search by name or username..."
                placeholderTextColor="#9ca3af"
                value={search}
                onChangeText={setSearch}
                className="flex-1 ml-2 text-base text-gray-900 dark:text-slate-50 h-10"
             />
             {search.length > 0 && (
               <TouchableOpacity onPress={() => setSearch("")}>
                 <MaterialIcons name="close" size={20} color="#9ca3af" />
               </TouchableOpacity>
             )}
          </View>
        </View>
      </View>

      <FlatList
        data={filteredTelecallers}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 }}
        ListHeaderComponent={
          isLoading ? null : (
            <View className="mb-6">
              {/* Top Summaries */}
              <View className="flex-row justify-between mb-2 gap-4">
                <View className="flex-1 bg-indigo-50/50 dark:bg-indigo-900/30 border border-indigo-100/50 dark:border-indigo-800/50 rounded-2xl p-4 shadow-sm">
                  <Text className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Total Calls Today</Text>
                  <Text className="text-base font-extrabold text-gray-400 dark:text-slate-500">Coming Soon</Text>
                </View>

                <View className="flex-1 bg-emerald-50/50 dark:bg-emerald-900/30 border border-emerald-100/50 dark:border-emerald-800/50 rounded-2xl p-4 shadow-sm">
                  <Text className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">Conversion Rate</Text>
                  <Text className="text-base font-extrabold text-gray-400 dark:text-slate-500">Coming Soon</Text>
                </View>
              </View>
            </View>
          )
        }
        ListEmptyComponent={
          isLoading ? (
            <View className="items-center justify-center py-20">
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          ) : (
            <View className="items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm mt-4">
              <MaterialIcons name="group-off" size={48} color="#cbd5e1" style={{ marginBottom: 10 }} />
              <Text className="text-gray-500 dark:text-slate-400 font-medium text-lg mt-3">No telecallers match your search.</Text>
            </View>
          )
        }
      />

      {/* Leads modal for specific telecaller */}
      <Modal visible={!!selectedTelecaller} animationType="slide" onRequestClose={() => setSelectedTelecaller(null)}>
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900">
           {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-4 bg-white dark:bg-slate-800 shadow-sm border-b border-gray-100 dark:border-slate-700">
            <View className="flex-row items-center gap-2">
              <TouchableOpacity onPress={() => setSelectedTelecaller(null)} className="p-2">
                <MaterialIcons name="arrow-back" size={24} color="#9ca3af" />
              </TouchableOpacity>
              <View>
                <Text className="text-lg font-bold text-gray-900 dark:text-slate-50">{selectedTelecaller?.name}'s Leads</Text>
              </View>
            </View>
          </View>

          {/* Search Bar for Leads */}
          <View className="px-4 py-3 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
            <View className="flex-row items-center bg-gray-100 dark:bg-slate-700 rounded-xl px-4 py-2">
              <Feather name="search" size={20} color="#9ca3af" />
              <TextInput 
                 placeholder="Search leads by name or phone..."
                 placeholderTextColor="#9ca3af"
                 value={searchLead}
                 onChangeText={setSearchLead}
                 className="flex-1 ml-2 text-base text-gray-900 dark:text-slate-50 h-10"
              />
              {searchLead.length > 0 && (
                <TouchableOpacity onPress={() => setSearchLead("")}>
                  <MaterialIcons name="close" size={20} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* List of Leads */}
          {assignmentsLoading ? (
            <View className="flex-1 items-center justify-center">
               <ActivityIndicator size="large" color="#2563eb" />
               <Text className="text-gray-500 dark:text-slate-400 mt-4">Fetching assignments...</Text>
            </View>
          ) : assignedLeadIds.length === 0 ? (
             <View className="flex-1 items-center justify-center px-4">
               <MaterialIcons name="list-alt" size={48} color="#cbd5e1" style={{ marginBottom: 10 }} />
               <Text className="text-gray-400 dark:text-slate-500 font-medium text-lg">No leads assigned to this telecaller.</Text>
             </View>
          ) : (
            <FlatList 
              data={assignedLeadIds}
              keyExtractor={(item, index) => `${item}-${index}`}
              contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={5}
              renderItem={({ item }) => <AssignedLeadCard leadId={item} searchText={searchLead} onPress={() => setSelectedLeadId(item)} />}
            />
          )}

        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}