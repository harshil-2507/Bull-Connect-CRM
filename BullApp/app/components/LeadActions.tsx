// components/LeadActions.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import TelecallerSelector from "./TelecallerSelector";
import * as SecureStore from "expo-secure-store";

interface LeadActionsProps {
  lead: any | null;
  onClose: () => void;
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

export default function LeadActions({ lead, onClose }: LeadActionsProps) {
  if (!lead) return null;

  const statusStyle = STATUS_COLORS[lead.status] || { bg: "#e5e7eb", text: "#374151" };
  const [selectedTelecaller, setSelectedTelecaller] = useState<any>(null);
  const [telecallerModalVisible, setTelecallerModalVisible] = useState(false);
  const [loadingAssign, setLoadingAssign] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignTelecaller = async () => {
    if (!selectedTelecaller) {
      setError("Please select a telecaller to assign.");
      return;
    }

    setError(null);
    setLoadingAssign(true);

    try {
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) throw new Error("Authentication token missing");

      const response = await fetch(
        "https://bull-connect-crm.onrender.com/manager/assign-telecaller",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            leadId: lead.id,
            telecallerId: selectedTelecaller.id,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to assign telecaller");
      }

      Alert.alert("Success", `Telecaller assigned to ${lead.farmer_name}`);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingAssign(false);
    }
  };

  return (
    <Modal visible={!!lead} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 bg-white shadow-md border-b border-gray-200">
          <Text className="text-2xl font-bold text-[#1a4d2e]">Lead Details</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={28} color="#1a4d2e" />
          </TouchableOpacity>
        </View>

        <ScrollView className="p-4 space-y-5">
          {/* Lead Header: Name + Status */}
          <View className="bg-white rounded-2xl shadow-lg p-5 flex-row justify-between items-center">
            <Text className="text-2xl font-bold text-[#1a4d2e]">{lead.farmer_name}</Text>
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: statusStyle.bg }}
            >
              <Text className="text-sm font-semibold" style={{ color: statusStyle.text }}>
                {lead.status}
              </Text>
            </View>
          </View>

          {/* Sections */}
          <View className="space-y-4">
            {/* Contact Info */}
            <View className="bg-white rounded-2xl shadow-md p-4">
              <Text className="text-lg font-semibold text-gray-700 mb-2">Contact Info</Text>
              <InfoRow label="Phone" value={lead.phone_number} />
              <InfoRow label="Village" value={lead.village} />
              <InfoRow label="Taluka" value={lead.taluka} />
              <InfoRow label="District" value={lead.district} />
              <InfoRow label="State" value={lead.state} />
            </View>

            {/* Campaign Info */}
            <View className="bg-white rounded-2xl shadow-md p-4">
              <Text className="text-lg font-semibold text-gray-700 mb-2">Campaign Info</Text>
              <InfoRow label="Campaign" value={lead.campaign_name} />
              <InfoRow label="Created At" value={new Date(lead.created_at).toLocaleDateString()} />
            </View>

            {/* Telecaller Selection */}
            <View className="bg-white rounded-2xl shadow-md p-4 space-y-2">
              <Text className="text-lg font-semibold text-gray-700">Assign Telecaller</Text>

              <TouchableOpacity
                className="bg-gray-100 p-3 rounded-xl flex-row justify-between items-center"
                onPress={() => setTelecallerModalVisible(true)}
              >
                <Text className="text-gray-700">
                  {selectedTelecaller ? selectedTelecaller.name : "Select Telecaller"}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#1a4d2e" />
              </TouchableOpacity>

              {/* Show error if any */}
              {error && <Text className="text-red-600 mt-2">{error}</Text>}

              {/* Assign Button */}
              <TouchableOpacity
                className={`p-4 rounded-2xl items-center ${
                  selectedTelecaller ? "bg-[#0ea633]" : "bg-gray-400"
                }`}
                onPress={assignTelecaller}
                disabled={!selectedTelecaller || loadingAssign}
              >
                {loadingAssign ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-lg">Assign</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Telecaller Selector Modal */}
        <TelecallerSelector
          visible={telecallerModalVisible}
          onSelect={(tc) => setSelectedTelecaller(tc)}
          onClose={() => setTelecallerModalVisible(false)}
        />
      </SafeAreaView>
    </Modal>
  );
}

/* ------------------- Helper Component ------------------- */
const InfoRow = ({ label, value }: { label: string; value: string | null }) => (
  <View className="flex-row justify-between py-1">
    <Text className="text-gray-500 font-medium">{label}</Text>
    <Text className="text-gray-800">{value || "-"}</Text>
  </View>
);