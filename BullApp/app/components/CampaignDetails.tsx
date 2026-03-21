import React, { useEffect, useState } from "react";
import { View, Text, Modal, ActivityIndicator, TouchableOpacity, Alert, SafeAreaView, FlatList } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { apiRequest } from "../utils/api";
import Lead from "./Lead";

type CampaignDetailsProps = {
  campaignId: string;
  onClose: () => void;
};

export default function CampaignDetails({ campaignId, onClose }: CampaignDetailsProps) {
  const [campaign, setCampaign] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const fetchCampaignData = async () => {
    try {
      const [campRes, statsRes] = await Promise.all([
        apiRequest(`/campaigns/${campaignId}`),
        apiRequest(`/campaigns/${campaignId}/stats`)
      ]);
      if (campRes.ok) setCampaign(await campRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err: any) {
      console.error("Campaign fetch error:", err);
      Alert.alert("Error", "Failed to fetch campaign data");
    }
  };

  const fetchLeads = async (pageNum: number) => {
    try {
      const res = await apiRequest(`/campaigns/${campaignId}/leads?page=${pageNum}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        if (pageNum === 1) {
          setLeads(data.data || []);
        } else {
          setLeads(prev => [...prev, ...(data.data || [])]);
        }
        setHasMore(pageNum < (data.pagination?.total_pages || 1));
      }
    } catch (err: any) {
      console.error("Leads fetch error:", err);
    }
  };

  useEffect(() => {
    if (campaignId) {
      setLoading(true);
      fetchCampaignData().then(() => {
        setPage(1);
        fetchLeads(1).finally(() => setLoading(false));
      });
    }
  }, [campaignId]);

  const handleLoadMore = () => {
    if (!hasMore || isFetchingMore || loading) return;
    setIsFetchingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchLeads(nextPage).finally(() => setIsFetchingMore(false));
  };

  if (selectedLeadId) {
    return (
      <Modal visible={true} animationType="slide">
        <Lead id={selectedLeadId} onBack={() => setSelectedLeadId(null)} />
      </Modal>
    );
  }

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.split(" ");
    return parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0][0];
  };

  const getStatusColor = (status: string) => {
    switch(status?.toUpperCase()) {
      case 'NEW': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400';
      case 'ASSIGNED': return 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400';
      case 'CONTACTED': return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400';
      case 'SOLD': return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400';
      case 'DROPPED': return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400';
      default: return 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300';
    }
  };

  const renderHeader = () => (
    <View className="pb-4">
      {/* Campaign Title & Info */}
      <View className="mb-6 px-1">
        <Text className="text-3xl font-extrabold text-gray-900 dark:text-slate-50 mb-2">{campaign?.name}</Text>
        
        {campaign?.description ? (
          <Text className="text-base text-gray-600 dark:text-slate-400 mb-3 leading-relaxed">{campaign.description}</Text>
        ) : null}

        <View className="flex-row flex-wrap gap-2 mb-3">
          <View className="flex-row items-center bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700">
            <MaterialIcons name="date-range" size={16} color="#9ca3af" />
            <Text className="text-xs font-bold text-gray-600 dark:text-slate-400 ml-1.5">
              {campaign?.start_date ? new Date(campaign.start_date).toLocaleDateString() : 'N/A'} - {campaign?.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
          
          <View className="bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/50 flex-row items-center">
            <View className={`w-2 h-2 rounded-full mr-2 ${campaign?.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <Text className="text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
              {campaign?.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats Cards Row */}
      {stats && (
        <View className="mb-6 flex-row flex-wrap justify-between gap-y-4">
          <View className="bg-white dark:bg-slate-800 w-[48%] p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
            <Text className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Total Leads</Text>
            <View className="flex-row items-end gap-2">
               <Text className="text-3xl font-extrabold text-gray-900 dark:text-slate-50">{stats.total_leads || '0'}</Text>
            </View>
            <Text className="text-xs font-medium text-gray-400 dark:text-slate-500 mt-2">Overall target</Text>
          </View>

          <View className="bg-white dark:bg-slate-800 w-[48%] p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
            <Text className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">New</Text>
             <View className="flex-row items-end gap-2">
               <Text className="text-3xl font-extrabold text-gray-900 dark:text-slate-50">{stats.new_leads || '0'}</Text>
            </View>
            <Text className="text-xs font-medium text-blue-500 dark:text-blue-400 mt-2 font-bold">Unassigned</Text>
          </View>

          <View className="bg-white dark:bg-slate-800 w-[48%] p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
            <Text className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Converted</Text>
             <View className="flex-row items-end gap-2">
               <Text className="text-3xl font-extrabold text-gray-900 dark:text-slate-50">{stats.sold || '0'}</Text>
            </View>
            <Text className="text-xs font-medium text-emerald-500 dark:text-emerald-400 mt-2 font-bold">Successful</Text>
          </View>

           <View className="bg-white dark:bg-slate-800 w-[48%] p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
            <Text className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Dropped</Text>
             <View className="flex-row items-end gap-2">
               <Text className="text-3xl font-extrabold text-gray-900 dark:text-slate-50">{stats.dropped || '0'}</Text>
            </View>
            <Text className="text-xs font-medium text-red-400 dark:text-red-400 mt-2 font-bold">Lost leads</Text>
          </View>
        </View>
      )}

      {/* Leads List Header */}
      <View className="mb-2">
        <Text className="text-xl font-bold text-gray-900 dark:text-slate-50 px-1">Leads</Text>
      </View>
    </View>
  );

  const renderLeadItem = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity 
      className={`flex-row items-center py-4 px-5 bg-white dark:bg-slate-800 ${index === 0 ? 'rounded-t-3xl' : ''} ${index === leads.length - 1 ? 'rounded-b-3xl' : 'border-b border-gray-50 dark:border-slate-700'}`}
      onPress={() => setSelectedLeadId(item.id)}
    >
      <View className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/50 rounded-full items-center justify-center border border-indigo-100 dark:border-indigo-800 mr-4">
        <Text className="text-indigo-600 dark:text-indigo-400 font-bold text-lg">{getInitials(item.name)}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-bold text-gray-900 dark:text-slate-50 mb-0.5">{item.name}</Text>
        <Text className="text-xs font-medium text-gray-500 dark:text-slate-400">{item.phone || 'No phone'}</Text>
      </View>
      <View className={`px-3 py-1.5 rounded-full ${getStatusColor(item.status).split(' ').slice(0, -1).join(' ')}`}>
         <Text className={`text-xs font-bold uppercase tracking-wider ${getStatusColor(item.status).split(' ').pop() || ''}`}>
           {item.status || 'UNKNOWN'}
         </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={!!campaignId} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-slate-900">
        <View className="flex-row items-center justify-between px-4 py-4 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 shadow-sm z-10">
          <TouchableOpacity onPress={onClose} className="p-2 flex-row items-center">
            <MaterialIcons name="arrow-back" size={24} color="#9ca3af" />
            <Text className="ml-2 font-bold text-gray-900 dark:text-slate-50 text-lg">Back</Text>
          </TouchableOpacity>
          <Text className="font-bold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-widest">{campaign?.region || 'Campaign'}</Text>
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : (
          <FlatList
            className="flex-1 px-4 pt-4"
            contentContainerStyle={{ paddingBottom: 60 }}
            data={leads}
            keyExtractor={item => item.id}
            renderItem={renderLeadItem}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={
              <View className="py-10 items-center justify-center bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm">
                <MaterialIcons name="group-off" size={48} color="#cbd5e1" style={{ marginBottom: 16 }} />
                <Text className="text-gray-400 dark:text-slate-500 font-medium text-base">No leads found.</Text>
              </View>
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isFetchingMore ? (
                <View className="py-4 items-center">
                  <ActivityIndicator size="small" color="#2563eb" />
                </View>
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}