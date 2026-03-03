import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import * as SecureStore from "expo-secure-store";

interface Props {
  lead: any;
  loading: boolean;
  onUpdated?: () => void;
}

export default function LeadDetailsCard({
  lead,
  loading,
  onUpdated,
}: Props) {
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (lead) {
      setFormData({
        farmer_name: lead.farmer_name || "",
        phone_number: lead.phone_number || "",
        farmer_type: lead.farmer_type || "",
        bull_center: lead.bull_center || "",
        district: lead.district || "",
        taluka: lead.taluka || "",
        village: lead.village || "",
        bigha: lead.bigha ? String(lead.bigha) : "",
        crops: lead.crops ? lead.crops.join(", ") : "",
        warehouse_interest: lead.warehouse_interest ?? null,
        previous_experience: lead.previous_experience ?? null,
      });
    }
  }, [lead]);

  const handleChange = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const token = await SecureStore.getItemAsync("authToken");
      if (!token) throw new Error("Authentication failed");

      const response = await fetch(
        `https://bull-connect-crm.onrender.com/leads/${lead.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...formData,
            bigha: formData.bigha ? Number(formData.bigha) : null,
            crops: formData.crops
              ? formData.crops.split(",").map((c: string) => c.trim())
              : [],
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update lead");

      Alert.alert("Success", "Lead updated successfully");
      setEditMode(false);
      onUpdated?.();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.card}>
        <Text className="text-gray-400">Loading...</Text>
      </View>
    );
  }

  if (!lead) return null;

  const renderField = (label: string, key: string) => (
    <View className="mb-4">
      <Text className="text-xs font-semibold text-gray-500 mb-1">
        {label}
      </Text>

      {editMode ? (
        <TextInput
          value={formData[key]}
          onChangeText={(text) => handleChange(key, text)}
          className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
        />
      ) : (
        <Text className="text-base font-semibold text-gray-800">
          {formData[key] !== "" && formData[key] !== null
            ? formData[key]
            : "—"}
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.card}>
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-lg font-bold text-green-800">
          Farmer Profile
        </Text>

        <TouchableOpacity onPress={() => setEditMode(!editMode)}>
          <Text className="text-green-700 font-semibold">
            {editMode ? "Cancel" : "Edit"}
          </Text>
        </TouchableOpacity>
      </View>

      {renderField("Farmer Name", "farmer_name")}
      {renderField("Phone Number", "phone_number")}
      {renderField("Farmer Type", "farmer_type")}
      {renderField("Bull Center", "bull_center")}
      {renderField("District", "district")}
      {renderField("Taluka", "taluka")}
      {renderField("Village", "village")}
      {renderField("Total Land (Bigha)", "bigha")}
      {renderField("Crops (comma separated)", "crops")}

      {/* Boolean Fields */}
      {["warehouse_interest", "previous_experience"].map((key) => (
        <View key={key} className="mb-4">
          <Text className="text-xs font-semibold text-gray-500 mb-2">
            {key === "warehouse_interest"
              ? "Interested in Warehouse"
              : "Previous Experience"}
          </Text>

          {editMode ? (
            <View className="flex-row">
              {["Yes", "No"].map((val) => (
                <TouchableOpacity
                  key={val}
                  onPress={() =>
                    handleChange(key, val === "Yes")
                  }
                  className={`px-4 py-2 rounded-full mr-3 ${
                    formData[key] === (val === "Yes")
                      ? "bg-green-600"
                      : "bg-gray-200"
                  }`}
                >
                  <Text
                    className={`font-semibold ${
                      formData[key] === (val === "Yes")
                        ? "text-white"
                        : "text-gray-700"
                    }`}
                  >
                    {val}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text className="text-base font-semibold text-gray-800">
              {formData[key] === true
                ? "Yes"
                : formData[key] === false
                ? "No"
                : "—"}
            </Text>
          )}
        </View>
      ))}

      {editMode && (
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className="bg-green-600 py-4 rounded-2xl items-center mt-4"
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">
              Save Changes
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
  },
});