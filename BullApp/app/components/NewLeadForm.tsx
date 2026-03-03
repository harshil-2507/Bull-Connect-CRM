import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
} from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";

interface Props {
  onSuccess?: () => void;
}

const farmerTypes = ["VIP", "High", "Medium", "Low", "Trader", "Not in Area"];
const cropOptions = ["Wheat", "Cotton", "Soybean", "Onion", "Sugarcane"];

export default function NewLeadForm({ onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  const [farmerName, setFarmerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [farmerType, setFarmerType] = useState("");
  const [bullCenter, setBullCenter] = useState("");
  const [district, setDistrict] = useState("");
  const [taluka, setTaluka] = useState("");
  const [village, setVillage] = useState("");
  const [bigha, setBigha] = useState("");
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [warehouseInterest, setWarehouseInterest] = useState<"Yes" | "No" | "">("");
  const [previousExperience, setPreviousExperience] = useState<"Yes" | "No" | "">("");

  const toggleCrop = (crop: string) => {
    if (selectedCrops.includes(crop)) {
      setSelectedCrops(selectedCrops.filter((c) => c !== crop));
    } else {
      setSelectedCrops([...selectedCrops, crop]);
    }
  };

  const handleCreateLead = async () => {
    if (!farmerName || !phoneNumber) {
      Alert.alert("Error", "Farmer name and phone number required");
      return;
    }

    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync("authToken");

      const response = await fetch("YOUR_API_URL", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          farmer_name: farmerName,
          phone_number: phoneNumber,
          farmer_type: farmerType,
          bull_center: bullCenter,
          district,
          taluka,
          village,
          crops: selectedCrops,
          bigha,
          warehouse_interest: warehouseInterest === "Yes",
          previous_experience: previousExperience === "Yes",
        }),
      });

      if (!response.ok) throw new Error("Failed to create lead");

      Alert.alert("Success", "Lead created successfully");

      if (onSuccess) onSuccess();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
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
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 mb-4"
        />

        {/* FARMER TYPE */}
        <Text className="text-sm font-semibold text-green-600 mb-3">
          FARMER TYPE
        </Text>

        <View className="flex-row flex-wrap mb-6">
          {farmerTypes.map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setFarmerType(type)}
              className={`px-4 py-2 rounded-full mr-3 mb-3 ${
                farmerType === type
                  ? "bg-green-500"
                  : "bg-gray-200"
              }`}
            >
              <Text
                className={`${
                  farmerType === type ? "text-white" : "text-gray-700"
                }`}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* LOCATION */}
        <Text className="text-sm font-semibold text-green-600 mb-3">
          LOCATION
        </Text>

        <TextInput
          placeholder="Bull Center"
          value={bullCenter}
          onChangeText={setBullCenter}
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 mb-4"
        />

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

        {/* FARMING DETAILS */}
        <Text className="text-sm font-semibold text-green-600 mb-3">
          FARMING DETAILS
        </Text>

        <TextInput
          placeholder="Total Bigha"
          value={bigha}
          onChangeText={setBigha}
          keyboardType="numeric"
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 mb-4"
        />

        <View className="flex-row flex-wrap mb-6">
          {cropOptions.map((crop) => (
            <TouchableOpacity
              key={crop}
              onPress={() => toggleCrop(crop)}
              className={`px-4 py-2 rounded-full mr-3 mb-3 ${
                selectedCrops.includes(crop)
                  ? "bg-green-500"
                  : "bg-gray-200"
              }`}
            >
              <Text
                className={`${
                  selectedCrops.includes(crop)
                    ? "text-white"
                    : "text-gray-700"
                }`}
              >
                {crop}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* YES / NO TOGGLES */}
        <Text className="text-sm font-semibold text-green-600 mb-3">
          OTHER DETAILS
        </Text>

        {[
          { label: "Interested in Warehouse", state: warehouseInterest, setter: setWarehouseInterest },
          { label: "Previous Experience with Bull", state: previousExperience, setter: setPreviousExperience },
        ].map((item) => (
          <View key={item.label} className="mb-5">
            <Text className="mb-2 text-gray-700">{item.label}</Text>
            <View className="flex-row">
              {["Yes", "No"].map((val) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => item.setter(val as "Yes" | "No")}
                  className={`px-6 py-3 rounded-full mr-4 ${
                    item.state === val ? "bg-green-500" : "bg-gray-200"
                  }`}
                >
                  <Text
                    className={`${
                      item.state === val ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {val}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

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