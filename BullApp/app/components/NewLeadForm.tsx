import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch
} from "react-native";
import { apiRequest } from "../utils/api";

interface Props {
  onSuccess?: () => void;
}

export default function NewLeadForm({ onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  // REQUIRED
  const [farmerName, setFarmerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // LOCATION
  const [village, setVillage] = useState("");
  const [taluka, setTaluka] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("Gujarat");

  // FARM INFO
  const [cropType, setCropType] = useState("");
  const [acreage, setAcreage] = useState("");
  const [totalLandBigha, setTotalLandBigha] = useState("");

  // BOOLEAN
  const [previousExperience, setPreviousExperience] = useState(false);
  const [warehouseInterest, setWarehouseInterest] = useState(false);

  // CASTOR
  const [castorBori, setCastorBori] = useState("");
  const [castorExpectedPrice, setCastorExpectedPrice] = useState("");

  // GROUNDNUT
  const [groundnutBori, setGroundnutBori] = useState("");
  const [groundnutExpectedPrice, setGroundnutExpectedPrice] = useState("");

 const handleCreateLead = async () => {
  if (!farmerName || !phoneNumber || !district || !village) {
    Alert.alert("Missing Fields", "Please fill all required fields (*)");
    return;
  }

  try {
    setLoading(true);

    const response = await apiRequest(
      "/leads",
      {
        method: "POST",
        body: JSON.stringify({
          farmer_name: farmerName,
          phone_number: phoneNumber,
          campaign_id: "286ffa2f-fb2f-489b-867f-66997dfd8aa5", // ✅ use your valid campaign ID

          village,
          taluka: taluka || null,
          district,
          state,

          crop_type: cropType || null,
          acreage: acreage ? Number(acreage) : null,
          total_land_bigha: totalLandBigha ? Number(totalLandBigha) : null,

          previous_experience: previousExperience,
          interested_in_warehouse: warehouseInterest,

          castor_bori: castorBori ? Number(castorBori) : null,
          castor_expected_price: castorExpectedPrice ? Number(castorExpectedPrice) : null,

          groundnut_bori: groundnutBori ? Number(groundnutBori) : null,
          groundnut_expected_price: groundnutExpectedPrice ? Number(groundnutExpectedPrice) : null,

          status: "NEW"
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      Alert.alert("Error", data.error || "Failed to create lead");
      return;
    }

    Alert.alert("Success", "Lead created successfully");

    // reset form
    setFarmerName("");
    setPhoneNumber("");
    setVillage("");
    setTaluka("");
    setDistrict("");
    setCropType("");
    setAcreage("");
    setTotalLandBigha("");
    setPreviousExperience(false);
    setWarehouseInterest(false);
    setCastorBori("");
    setCastorExpectedPrice("");
    setGroundnutBori("");
    setGroundnutExpectedPrice("");

    onSuccess?.();

  } catch (error) {
    Alert.alert("Server Error", "Unable to connect");
  } finally {
    setLoading(false);
  }
};

  const Input = (
    label: string,
    value: string,
    setValue: any,
    required = false,
    numeric = false
  ) => (
    <>
      <Text className="text-sm font-semibold text-gray-600 mb-1">
        {label} {required && "*"}
      </Text>

      <TextInput
        value={value}
        onChangeText={setValue}
        keyboardType={numeric ? "numeric" : "default"}
        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4"
      />
    </>
  );

  return (
    <ScrollView
      className="flex-1 bg-[#f4f6f5]"
      contentContainerStyle={{ padding: 16 }}
    >
      <View className="bg-white rounded-3xl p-6 shadow">

        <Text className="text-2xl font-bold mb-6">
          New Farmer Lead
        </Text>

        <Text className="text-green-600 font-semibold mb-2">
          Basic Information
        </Text>

        {Input("Farmer Name", farmerName, setFarmerName, true)}
        {Input("Phone Number", phoneNumber, setPhoneNumber, true)}

        <Text className="text-green-600 font-semibold mb-2">
          Location
        </Text>

        {Input("Village", village, setVillage, true)}
        {Input("Taluka", taluka, setTaluka)}
        {Input("District", district, setDistrict, true)}
        {Input("State", state, setState)}

        <Text className="text-green-600 font-semibold mb-2">
          Farm Details
        </Text>

        {Input("Crop Type", cropType, setCropType)}
        {Input("Acreage", acreage, setAcreage, false, true)}
        {Input("Total Land (Bigha)", totalLandBigha, setTotalLandBigha, false, true)}

        <Text className="text-green-600 font-semibold mb-2">
          Experience
        </Text>

        <View className="flex-row justify-between items-center mb-4">
          <Text>Previous Farming Experience</Text>
          <Switch
            value={previousExperience}
            onValueChange={setPreviousExperience}
          />
        </View>

        <View className="flex-row justify-between items-center mb-4">
          <Text>Interested in Warehouse</Text>
          <Switch
            value={warehouseInterest}
            onValueChange={setWarehouseInterest}
          />
        </View>

        <Text className="text-green-600 font-semibold mb-2">
          Castor Crop (Optional)
        </Text>

        {Input("Castor Bori", castorBori, setCastorBori, false, true)}
        {Input(
          "Castor Expected Price",
          castorExpectedPrice,
          setCastorExpectedPrice,
          false,
          true
        )}

        <Text className="text-green-600 font-semibold mb-2">
          Groundnut Crop (Optional)
        </Text>

        {Input("Groundnut Bori", groundnutBori, setGroundnutBori, false, true)}
        {Input(
          "Groundnut Expected Price",
          groundnutExpectedPrice,
          setGroundnutExpectedPrice,
          false,
          true
        )}

        <TouchableOpacity
          onPress={handleCreateLead}
          disabled={loading}
          className={`mt-6 py-4 rounded-xl items-center ${
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