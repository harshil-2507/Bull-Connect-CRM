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

import { addLead } from "../data/leads";

interface Props {
  onSuccess?: () => void;
}

const campaignOptions = [
  "Kharif Campaign",
  "Cotton Drive",
  "Hybrid Seeds Campaign",
  "Fertilizer Awareness",
];

export default function NewLeadForm({ onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  const [farmerName, setFarmerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [district, setDistrict] = useState("");
  const [taluka, setTaluka] = useState("");
  const [village, setVillage] = useState("");
  const [campaign, setCampaign] = useState("");

  const handleCreateLead = () => {
    if (!farmerName || !phoneNumber) {
      Alert.alert("Error", "Farmer name and phone number required");
      return;
    }

    setLoading(true);

    addLead({
      farmer_name: farmerName,
      phone: phoneNumber,
      district,
      taluka,
      village,
      campaign_name: campaign || "General Campaign",
      status: "NEW",
      created_at: new Date().toISOString(),
      notes: "",
    });

    setLoading(false);

    Alert.alert("Success", "Lead created successfully");

    // reset form
    setFarmerName("");
    setPhoneNumber("");
    setDistrict("");
    setTaluka("");
    setVillage("");
    setCampaign("");

    onSuccess?.();
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      className="flex-1 bg-[#f4f6f5]"
      contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
    >
      <View className="bg-white rounded-3xl p-6 shadow-md border border-gray-100">

        {/* HEADER */}
        <Text className="text-2xl font-bold mb-6 text-gray-800">
          Add New Farmer Lead
        </Text>

        {/* BASIC INFO */}
        <Text className="text-sm font-semibold text-green-600 mb-3">
          BASIC INFORMATION
        </Text>

        <TextInput
          placeholder="Farmer Name"
          value={farmerName}
          onChangeText={setFarmerName}
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 mb-4"
        />

        <TextInput
          placeholder="Phone Number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 mb-6"
        />

        {/* LOCATION */}
        <Text className="text-sm font-semibold text-green-600 mb-3">
          LOCATION
        </Text>

        <TextInput
          placeholder="District"
          value={district}
          onChangeText={setDistrict}
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 mb-4"
        />

        <TextInput
          placeholder="Taluka"
          value={taluka}
          onChangeText={setTaluka}
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 mb-4"
        />

        <TextInput
          placeholder="Village"
          value={village}
          onChangeText={setVillage}
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 mb-6"
        />

        {/* CAMPAIGN */}
        <Text className="text-sm font-semibold text-green-600 mb-3">
          CAMPAIGN
        </Text>

        <View className="flex-row flex-wrap mb-6">
          {campaignOptions.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setCampaign(c)}
              className={`px-4 py-2 rounded-full mr-3 mb-3 ${
                campaign === c
                  ? "bg-green-500"
                  : "bg-gray-200"
              }`}
            >
              <Text
                className={`${
                  campaign === c ? "text-white" : "text-gray-700"
                }`}
              >
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* SUBMIT BUTTON */}
        <TouchableOpacity
          onPress={handleCreateLead}
          disabled={loading}
          className={`py-5 rounded-2xl items-center ${
            loading ? "bg-green-300" : "bg-green-500"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">
              Create Lead
            </Text>
          )}
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}