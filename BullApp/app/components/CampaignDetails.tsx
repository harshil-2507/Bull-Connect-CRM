import React, { useEffect, useState } from "react";
import { View, Text, Modal, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiRequest } from "../utils/api";

type CampaignDetailsProps = {
  campaignId: string;
  onClose: () => void;
};

type CampaignData = {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  region: string | null;
  status: string | null;
  total_leads: string;
};

export default function CampaignDetails({ campaignId, onClose }: CampaignDetailsProps) {
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const res = await apiRequest(`/campaigns/${campaignId}`);
        if (!res.ok) throw new Error("Failed to fetch campaign data");
        const data = await res.json();
        setCampaign(data);
      } catch (err: any) {
        console.error("Campaign fetch error:", err);
        Alert.alert("Error", "Failed to fetch campaign data");
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [campaignId]);

  return (
    <Modal visible={!!campaignId} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-gray-50">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#1a4d2e" />
          </View>
        ) : campaign ? (
          <ScrollView className="p-4 space-y-5">
            <TouchableOpacity onPress={onClose} className="mb-4">
              <Text className="text-green-600 font-semibold">← Back</Text>
            </TouchableOpacity>

            <View className="bg-white p-6 rounded-2xl shadow border border-gray-100">
              <Text className="text-2xl font-bold text-[#1a4d2e] mb-2">{campaign.name}</Text>
              <Text className="text-gray-600 mb-4">{campaign.description}</Text>

              <Text className="font-semibold text-gray-700">Start Date:</Text>
              <Text className="text-gray-600 mb-2">{new Date(campaign.start_date).toDateString()}</Text>

              <Text className="font-semibold text-gray-700">End Date:</Text>
              <Text className="text-gray-600 mb-2">{new Date(campaign.end_date).toDateString()}</Text>

              <Text className="font-semibold text-gray-700">Status:</Text>
              <Text className="text-gray-600 mb-2">{campaign.is_active ? "Active" : "Inactive"}</Text>

              <Text className="font-semibold text-gray-700">Region:</Text>
              <Text className="text-gray-600 mb-2">{campaign.region || "N/A"}</Text>

              <Text className="font-semibold text-gray-700">Leads:</Text>
              <Text className="text-gray-600">{campaign.total_leads}</Text>
            </View>
          </ScrollView>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}