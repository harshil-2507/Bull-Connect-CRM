// components/LeadActions.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { apiRequest } from "../utils/api";

interface LeadActionsProps {
  lead: any | null;
  onClose: () => void;
  onUpdated?: () => void;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  NEW: { bg: "#e0f2fe", text: "#0284c7" },
  ASSIGNED: { bg: "#fef9c3", text: "#b45309" },
  CONTACTED: { bg: "#d1fae5", text: "#047857" },
  VISIT_REQUESTED: { bg: "#fcd5ce", text: "#b91c1c" },
  VISIT_ASSIGNED: { bg: "#ede9fe", text: "#7c3aed" },
  VISIT_COMPLETED: { bg: "#dcfce7", text: "#166534" },
  SOLD: { bg: "#fefce8", text: "#b45309" },
  DROPPED: { bg: "#f8d7da", text: "#842029" },
};

export default function LeadActions({ lead, onClose, onUpdated }: LeadActionsProps) {
  const [editingLead, setEditingLead] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const [telecallers, setTelecallers] = useState<any[]>([]);
  const [selectedTelecallerId, setSelectedTelecallerId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!lead) return;
    setEditingLead(lead);
    setSelectedTelecallerId(null);

    // Fetch activities
    const fetchActivities = async () => {
      try {
        const res = await apiRequest(`/leads/${lead.id}/activities`);
        if (res.ok) {
          const data = await res.json();
          setActivities(data);
        }
      } catch (err) {
        console.error("Failed to fetch activities:", err);
      }
    };

    fetchActivities();

    // Fetch telecallers
    const fetchTelecallers = async () => {
      try {
        const res = await apiRequest("/manager/telecallers");
        if (!res.ok) throw new Error("Failed to fetch telecallers");
        const data = await res.json();
        setTelecallers(data || []);
      } catch (err) {
        console.error("Failed to fetch telecallers:", err);
      }
    };

    if (lead.status === "NEW") {
      fetchTelecallers();
    }
  }, [lead]);

  if (!lead || !editingLead) return null;

  const statusStyle = STATUS_COLORS[editingLead.status] || { bg: "#e5e7eb", text: "#374151" };

  const handleSave = async () => {
    try {
      const res = await apiRequest(`/leads/${editingLead.id}`, {
        method: "PUT",
        body: JSON.stringify(editingLead),
      });

      if (res.ok) {
        Alert.alert("Success", "Lead updated successfully");
        setIsEditing(false);
        onUpdated?.();
      } else {
        Alert.alert("Error", "Failed to update lead");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to update lead");
    }
  };

  const handleAssignTelecaller = async () => {
    if (!selectedTelecallerId) {
      Alert.alert("Error", "Please select a telecaller");
      return;
    }

    setAssigning(true);
    try {
      const res = await apiRequest("/manager/assign-telecaller", {
        method: "POST",
        body: JSON.stringify({ leadId: editingLead.id, telecallerId: selectedTelecallerId }),
      });

      if (!res.ok) throw new Error("Failed to assign telecaller");

      Alert.alert("Success", "Telecaller assigned successfully");
      onUpdated?.();
      setSelectedTelecallerId(null);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to assign telecaller");
    } finally {
      setAssigning(false);
    }
  };

  const renderField = (label: string, key: string, editable = true) => (
    <View className="flex-row justify-between py-1 items-center">
      <Text className="text-gray-500 font-medium">{label}</Text>
      {isEditing && editable ? (
        <TextInput
          value={editingLead[key]?.toString() || ""}
          onChangeText={(val) => setEditingLead({ ...editingLead, [key]: val })}
          className="border border-gray-300 rounded px-2 py-1 w-40 text-gray-800"
        />
      ) : (
        <Text className="text-gray-800">{editingLead[key] || "-"}</Text>
      )}
    </View>
  );

  return (
    <Modal visible={!!lead} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 bg-white shadow-md border-b border-gray-200">
          <Text className="text-2xl font-bold text-[#1a4d2e]">Lead Details</Text>
          <View className="flex-row items-center space-x-2">
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
              <MaterialIcons name="edit" size={24} color="#1a4d2e" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={28} color="#1a4d2e" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="p-4 space-y-5">
          {/* Lead Header */}
          <View className="bg-white rounded-2xl shadow-lg p-5 flex-row justify-between items-center">
            <Text className="text-2xl font-bold text-[#1a4d2e]">{editingLead.farmer_name}</Text>
            <View className="px-3 py-1 rounded-full" style={{ backgroundColor: statusStyle.bg }}>
              <Text className="text-sm font-semibold" style={{ color: statusStyle.text }}>
                {editingLead.status}
              </Text>
            </View>
          </View>

          {/* Contact Info */}
          <View className="bg-white rounded-2xl shadow-md p-4 space-y-2">
            <Text className="text-lg font-semibold text-gray-700 mb-2">Contact Info</Text>
            {renderField("Phone", "phone_number")}
            {renderField("Alternate Phone", "alternate_phone")}
            {renderField("Village", "village")}
            {renderField("Taluka", "taluka")}
            {renderField("District", "district")}
            {renderField("State", "state")}
          </View>

          {/* Campaign Info */}
          <View className="bg-white rounded-2xl shadow-md p-4 space-y-2">
            <Text className="text-lg font-semibold text-gray-700 mb-2">Campaign Info</Text>
            {renderField("Campaign", "campaign_name", false)}
            {renderField("Created At", "created_at", false)}
          </View>

          {/* Farm Info */}
          <View className="bg-white rounded-2xl shadow-md p-4 space-y-2">
            <Text className="text-lg font-semibold text-gray-700 mb-2">Farm Info</Text>
            {renderField("Farmer Type", "farmer_type")}
            {renderField("Bull Centre", "bull_centre")}
            {renderField("Crop Type", "crop_type")}
            {renderField("Acreage", "acreage")}
            {renderField("Total Land (Bigha)", "total_land_bigha")}
          </View>

          {/* Crop Info */}
          <View className="bg-white rounded-2xl shadow-md p-4 space-y-2">
            <Text className="text-lg font-semibold text-gray-700 mb-2">Crop Info</Text>
            {renderField("Castor Bori", "castor_bori")}
            {renderField("Castor Expected Price", "castor_expected_price")}
            {renderField("Castor Intent To Sell", "castor_intent_to_sell")}
            {renderField("Groundnut Bori", "groundnut_bori")}
            {renderField("Groundnut Expected Price", "groundnut_expected_price")}
            {renderField("Groundnut Intent To Sell", "groundnut_intent_to_sell")}
          </View>

          {/* Experience */}
          <View className="bg-white rounded-2xl shadow-md p-4 space-y-2">
            <Text className="text-lg font-semibold text-gray-700 mb-2">Experience</Text>
            {renderField("Previous Experience", "previous_experience")}
            {renderField("Interested in Warehouse", "interested_in_warehouse")}
            {renderField("Remarks", "experience_or_remarks")}
          </View>

          {/* Activity Timeline */}
          <View className="bg-white rounded-2xl shadow-md p-4 space-y-2">
            <Text className="text-lg font-semibold text-gray-700 mb-2">Activity Timeline</Text>
            {activities.length === 0 && <Text className="text-gray-400">No activities yet</Text>}
            {activities.map((a) => (
              <View key={a.id} className="border-l-2 border-green-500 pl-3 mb-3">
                <Text className="font-semibold text-gray-700">{a.activity_type}</Text>
                <Text className="text-gray-500 text-sm">{a.description}</Text>
                <Text className="text-gray-400 text-xs">{new Date(a.created_at).toLocaleString()}</Text>
              </View>
            ))}
          </View>

          {/* Assign Telecaller (only for NEW leads) */}
          {editingLead.status === "NEW" && telecallers.length > 0 && (
            <View className="bg-white rounded-2xl shadow-md p-4 space-y-3">
              <Text className="text-lg font-semibold text-gray-700 mb-2">Assign Telecaller</Text>
              {telecallers.map((tc) => (
                <TouchableOpacity
                  key={tc.id}
                  onPress={() => setSelectedTelecallerId(tc.id)}
                  className={`p-3 rounded-xl border-2 ${
                    selectedTelecallerId === tc.id ? "bg-green-50 border-green-500" : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <Text className={`font-medium ${selectedTelecallerId === tc.id ? "text-green-700" : "text-gray-700"}`}>
                    {tc.name} ({tc.phone})
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={handleAssignTelecaller}
                className={`bg-green-600 py-4 rounded-xl items-center ${assigning ? "opacity-50" : ""}`}
                disabled={assigning}
              >
                <Text className="text-white font-bold text-lg">{assigning ? "Assigning..." : "Assign Telecaller"}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Save Button */}
          {isEditing && (
            <TouchableOpacity
              onPress={handleSave}
              className="bg-green-600 py-4 rounded-xl items-center mt-4"
            >
              <Text className="text-white font-bold text-lg">Save Changes</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}