import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { Modal, Pressable } from "react-native";

interface Props {
  onSuccess?: () => void;
}

export default function NewLeadForm({ onSuccess }: Props) {
  const [farmerName, setFarmerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [village, setVillage] = useState("");
  const [taluka, setTaluka] = useState("");
  const [district, setDistrict] = useState("");
  const [stateName, setStateName] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateLead = async () => {
    if (!farmerName || !phoneNumber || !campaignId) {
      Alert.alert("Error", "Farmer name, phone number and campaign are required");
      return;
    }

    try {
      setLoading(true);

      const token = await SecureStore.getItemAsync("authToken");

      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      const response = await fetch(
        "https://bull-connect-crm.onrender.com/leads",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            farmer_name: farmerName,
            phone_number: phoneNumber,
            village,
            taluka,
            district,
            state: stateName,
            campaign_id: campaignId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to create lead");
      }

      Alert.alert("Success", "Lead created successfully");

      // Clear form
      setFarmerName("");
      setPhoneNumber("");
      setVillage("");
      setTaluka("");
      setDistrict("");
      setStateName("");
      setCampaignId("");

      if (onSuccess) onSuccess();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const [campaignModalVisible, setCampaignModalVisible] = useState(false);

const campaigns = [
  {
    id: "a57a9798-68c8-4466-bf2d-6a5f6721d0f9",
    name: "Main Agriculture Campaign",
  },
];

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      className="flex-1 bg-[#f3f5f4]"
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <View className="bg-white rounded-2xl border border-gray-200 px-5 py-6 shadow-sm">
        
        {/* FARMER DETAILS */}
        <View className="mb-6">
          <View className="flex-row items-center mb-4">
            <Feather name="user" size={18} color="#16a34a" />
            <Text className="ml-2 text-xs font-bold tracking-widest text-green-600">
              FARMER DETAILS
            </Text>
          </View>

          <Text className="text-base font-medium mb-2">Farmer Name</Text>
          <TextInput
            value={farmerName}
            onChangeText={setFarmerName}
            placeholder="e.g., Vishwanath Kale"
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 mb-4"
          />

          <Text className="text-base font-medium mb-2">Phone Number</Text>
          <TextInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="e.g., 9662345502"
            keyboardType="phone-pad"
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4"
          />
        </View>

        <View className="border-t border-gray-100 my-6" />

        {/* LOCATION */}
        <View className="mb-6">
          <View className="flex-row items-center mb-4">
            <Feather name="map-pin" size={18} color="#16a34a" />
            <Text className="ml-2 text-xs font-bold tracking-widest text-green-600">
              LOCATION
            </Text>
          </View>

          <View className="flex-row space-x-4 mb-4">
            <TextInput
              value={village}
              onChangeText={setVillage}
              placeholder="Village"
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-4"
            />
            <TextInput
              value={taluka}
              onChangeText={setTaluka}
              placeholder="Taluka"
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-4"
            />
          </View>

          <View className="flex-row space-x-4">
            <TextInput
              value={district}
              onChangeText={setDistrict}
              placeholder="District"
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-4"
            />
            <TextInput
              value={stateName}
              onChangeText={setStateName}
              placeholder="State"
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-4"
            />
          </View>
        </View>

        <View className="border-t border-gray-100 my-6" />

        {/* MARKETING */}
<View className="mb-6">
  <View className="flex-row items-center mb-4">
    <MaterialIcons name="campaign" size={18} color="#16a34a" />
    <Text className="ml-2 text-xs font-bold tracking-widest text-green-600">
      MARKETING
    </Text>
  </View>

  <Text className="text-base font-medium mb-2">Campaign</Text>

  <TouchableOpacity
    onPress={() => setCampaignModalVisible(true)}
    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 flex-row justify-between items-center"
  >
    <Text className={`${campaignId ? "text-black" : "text-gray-400"}`}>
      {campaignId
        ? campaigns.find((c) => c.id === campaignId)?.name
        : "Select Campaign"}
    </Text>
    <Feather name="chevron-down" size={20} color="#9ca3af" />
  </TouchableOpacity>
</View>

        {/* BUTTON */}
        <TouchableOpacity
          onPress={handleCreateLead}
          disabled={loading}
          className={`py-5 rounded-2xl items-center justify-center ${
            loading ? "bg-green-300" : "bg-[#13ec49]"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="black" />
          ) : (
            <Text className="text-black font-bold text-lg">
              Add Lead
            </Text>
          )}
        </TouchableOpacity>
      </View>
      <Modal
  transparent
  animationType="slide"
  visible={campaignModalVisible}
  onRequestClose={() => setCampaignModalVisible(false)}
>
  <Pressable
    className="flex-1 bg-black/30 justify-end"
    onPress={() => setCampaignModalVisible(false)}
  >
    <View className="bg-white rounded-t-3xl p-6">
      <Text className="text-lg font-bold mb-4">Select Campaign</Text>

      {campaigns.map((campaign) => (
        <TouchableOpacity
          key={campaign.id}
          onPress={() => {
            setCampaignId(campaign.id);
            setCampaignModalVisible(false);
          }}
          className="py-4 border-b border-gray-100"
        >
          <Text className="text-base">{campaign.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </Pressable>
</Modal>
    </ScrollView>
  );
}