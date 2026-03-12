import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

interface Props {
  lead: any;
  loading: boolean;
}

export default function LeadDetailsCard({
  lead,
  loading,
  // onUpdated,
}: Props) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (lead) {
      setFormData({
        farmer_name: lead.farmer_name || "",
        phone_number: lead.phone_number || lead.phone || "",
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

          <Text className="text-base font-semibold text-gray-800">
            {formData[key] === true
              ? "Yes"
              : formData[key] === false
              ? "No"
              : "—"}
          </Text>
        </View>
      ))}
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