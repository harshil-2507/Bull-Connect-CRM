import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { apiRequest } from "../utils/api";

type Telecaller = {
  id: string;
  username: string;
  name: string;
  phone: string;
  email: string | null;
};

interface LeadActionsProps {
  lead: any | null;
  onClose: () => void;
  onUpdated?: () => void;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  NEW: { bg: "#e0f7fa", text: "#006064" },
  ASSIGNED: { bg: "#fff3e0", text: "#ef6c00" },
  CONTACTED: { bg: "#e8f5e9", text: "#2e7d32" },
  VISIT_REQUESTED: { bg: "#fce4ec", text: "#c2185b" },
  VISIT_ASSIGNED: { bg: "#ede7f6", text: "#512da8" },
  VISIT_COMPLETED: { bg: "#f1f8e9", text: "#33691e" },
  SOLD: { bg: "#fff8e1", text: "#ff6f00" },
  DROPPED: { bg: "#ffebee", text: "#b71c1c" },
};

export default function LeadActions({ lead, onClose, onUpdated }: LeadActionsProps) {
  const [editingLead, setEditingLead] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [telecallers, setTelecallers] = useState<Telecaller[]>([]);
  const [loadingTelecallers, setLoadingTelecallers] = useState(false);
  const [assigningLead, setAssigningLead] = useState(false);

  // Set the lead when modal opens
  useEffect(() => {
    if (lead) setEditingLead(lead);
  }, [lead]);

  // Fetch telecallers when assignment modal opens
  useEffect(() => {
    if (showAssignModal && telecallers.length === 0) {
      fetchTelecallers();
    }
  }, [showAssignModal]);

  const fetchTelecallers = async () => {
    setLoadingTelecallers(true);
    try {
      const res = await apiRequest("/manager/telecallers");
      if (!res.ok) throw new Error("Failed to fetch telecallers");
      const data = await res.json();
      setTelecallers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", "Failed to load telecallers");
    } finally {
      setLoadingTelecallers(false);
    }
  };

  const handleAssignTelecaller = async (telecallerId: string) => {
    setAssigningLead(true);
    try {
      const res = await apiRequest("/manager/assign-telecaller", {
        method: "POST",
        body: JSON.stringify({
          leadId: editingLead.id,
          telecallerId: telecallerId,
        }),
      });

      if (res.ok) {
        Alert.alert("Success", "Lead assigned successfully");
        setShowAssignModal(false);
        onUpdated?.();
      } else {
        Alert.alert("Error", "Failed to assign lead");
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Failed to assign lead");
    } finally {
      setAssigningLead(false);
    }
  };

  if (!lead || !editingLead) return null;

  const statusStyle = STATUS_COLORS[editingLead.status] || { bg: "#f0f0f0", text: "#333" };

  const handleSave = async () => {
    setLoading(true);
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
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Failed to update lead");
    } finally {
      setLoading(false);
    }
  };

  const renderField = (label: string, key: string) => (
    <View className="mb-3">
      <Text className="text-gray-500 font-semibold mb-1">{label}</Text>
      <View className="bg-white border border-gray-200 rounded-lg px-3 py-2">
        {isEditing ? (
          <TextInput
            value={editingLead[key]?.toString() || ""}
            onChangeText={(val: string) =>
              setEditingLead((prev: any) => ({ ...prev, [key]: val }))
            }
            className="text-gray-800"
          />
        ) : (
          <Text className="text-gray-800">{editingLead[key] || "-"}</Text>
        )}
      </View>
    </View>
  );

  return (
    <Modal visible={!!lead} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 bg-white shadow-md border-b border-gray-200">
          <Text className="text-2xl font-bold text-[#1a4d2e]">Lead Details</Text>
          <View className="flex-row items-center space-x-2">
            <TouchableOpacity onPress={() => setShowAssignModal(true)}>
              <MaterialIcons name="person-add" size={24} color="#0ea633" />
            </TouchableOpacity>
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
          <View className="bg-gradient-to-r from-green-100 to-teal-50 rounded-2xl p-5 shadow-lg flex-row justify-between items-center">
            <Text className="text-2xl font-bold text-[#1a4d2e]">{editingLead.farmer_name}</Text>
            <View
              className="px-4 py-1 rounded-full"
              style={{ backgroundColor: statusStyle.bg }}
            >
              <Text style={{ color: statusStyle.text, fontWeight: "700" }}>
                {editingLead.status}
              </Text>
            </View>
          </View>

          {/* Contact Info */}
          <View className="bg-white rounded-2xl shadow-md p-4 space-y-3">
            <Text className="text-lg font-bold text-gray-700 mb-2">Contact Info</Text>
            {renderField("Phone", "phone_number")}
            {renderField("Alternate Phone", "alternate_phone")}
            {renderField("Village", "village")}
            {renderField("Taluka", "taluka")}
            {renderField("District", "district")}
            {renderField("State", "state")}
          </View>

          {/* Campaign Info */}
          <View className="bg-white rounded-2xl shadow-md p-4 space-y-3">
            <Text className="text-lg font-bold text-gray-700 mb-2">Campaign Info</Text>
            {renderField("campaign_name", "campaign_name")}
            {renderField("created_at", "created_at")}
          </View>

          {/* Farm Info */}
          <View className="bg-white rounded-2xl shadow-md p-4 space-y-3">
            <Text className="text-lg font-bold text-gray-700 mb-2">Farm Info</Text>
            {renderField("Farmer Type", "farmer_type")}
            {renderField("Bull Centre", "bull_centre")}
            {renderField("Crop Type", "crop_type")}
            {renderField("Acreage", "acreage")}
            {renderField("Total Land (Bigha)", "total_land_bigha")}
          </View>

          {/* Crop Info */}
          <View className="bg-white rounded-2xl shadow-md p-4 space-y-3">
            <Text className="text-lg font-bold text-gray-700 mb-2">Crop Info</Text>
            {renderField("castor_bori", "castor_bori")}
            {renderField("castor_expected_price", "castor_expected_price")}
            {renderField("castor_intent_to_sell", "castor_intent_to_sell")}
            {renderField("groundnut_bori", "groundnut_bori")}
            {renderField("groundnut_expected_price", "groundnut_expected_price")}
            {renderField("groundnut_intent_to_sell", "groundnut_intent_to_sell")}
          </View>

          {/* Experience */}
          <View className="bg-white rounded-2xl shadow-md p-4 space-y-3">
            <Text className="text-lg font-bold text-gray-700 mb-2">Experience</Text>
            {renderField("previous_experience", "previous_experience")}
            {renderField("interested_in_warehouse", "interested_in_warehouse")}
            {renderField("experience_or_remarks", "experience_or_remarks")}
          </View>

          {/* Save Button */}
          {isEditing && (
            <TouchableOpacity
              onPress={handleSave}
              className="bg-green-600 py-4 rounded-xl items-center mt-2 mb-6"
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Save Changes</Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Assignment Modal */}
      <Modal visible={showAssignModal} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 justify-end">
          <SafeAreaView className="flex-1 bg-white rounded-t-3xl">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
              <Text className="text-2xl font-bold text-[#1a4d2e]">Assign Telecaller</Text>
              <TouchableOpacity onPress={() => setShowAssignModal(false)}>
                <MaterialIcons name="close" size={28} color="#1a4d2e" />
              </TouchableOpacity>
            </View>

            {/* Telecallers List */}
            {loadingTelecallers ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#1a4d2e" />
              </View>
            ) : telecallers.length === 0 ? (
              <View className="flex-1 items-center justify-center px-4">
                <MaterialIcons name="person-off" size={48} color="#ccc" />
                <Text className="text-gray-500 mt-2">No telecallers available</Text>
              </View>
            ) : (
              <FlatList
                data={telecallers}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleAssignTelecaller(item.id)}
                    disabled={assigningLead}
                    className="bg-gray-50 rounded-2xl border border-gray-200 p-4 mb-3 flex-row items-center"
                  >
                    {/* Avatar */}
                    <View className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                      <Text className="text-green-700 font-bold text-lg">{item.name[0]}</Text>
                    </View>

                    {/* Details */}
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-gray-800">{item.name}</Text>
                      <Text className="text-gray-500 mt-1">Username: {item.username}</Text>
                      <Text className="text-gray-500 mt-1">Phone: {item.phone}</Text>
                      {item.email && <Text className="text-gray-500 mt-1">Email: {item.email}</Text>}
                    </View>

                    {/* Arrow */}
                    <View className="ml-2">
                      {assigningLead ? (
                        <ActivityIndicator color="#0ea633" />
                      ) : (
                        <MaterialIcons name="arrow-forward-ios" size={18} color="#0ea633" />
                      )}
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </Modal>
  );
}