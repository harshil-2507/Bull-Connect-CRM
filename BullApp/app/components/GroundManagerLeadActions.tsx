import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { apiRequest } from "../utils/api";

interface Props {
  lead: any | null;
  onClose: () => void;
  onAssigned?: () => void;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  NEW: { bg: "#e0f2fe", text: "#0284c7" },
  ASSIGNED: { bg: "#fef9c3", text: "#b45309" },
  CONTACTED: { bg: "#d1fae5", text: "#047857" },
  VISIT_REQUESTED: { bg: "#fcd5ce", text: "#b91c1c" },
  VISIT_ASSIGNED: { bg: "#ede9fe", text: "#7c3aed" },
  VISIT_COMPLETED: { bg: "#dcfce7", text: "#166534" },
};

export default function GroundManagerLeadActions({
  lead,
  onClose,
  onAssigned,
}: Props) {
  const [selectedExecutiveId, setSelectedExecutiveId] = useState<number | null>(null);
  const [groundExecutives, setGroundExecutives] = useState<any[]>([]);
  const [fieldRequestId, setFieldRequestId] = useState<string | null>(null);

  useEffect(() => {
    const fetchExecutives = async () => {
      try {
        const res = await apiRequest('/users/role/FIELD_EXEC');
        if (res.ok) {
          const data = await res.json();
          setGroundExecutives(data.users || []);
        }
      } catch (error) {
        console.error('Failed to fetch ground executives:', error);
      }
    };
    fetchExecutives();
  }, []);

  useEffect(() => {
    const fetchFieldRequest = async () => {
      if (!lead) return;
      try {
        const res = await apiRequest('/field-manager/field-requests');
        if (res.ok) {
          const data = await res.json();
          const request = data.fieldRequests.find((r: any) => r.lead_id === lead.id);
          if (request) {
            setFieldRequestId(request.id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch field request:', error);
      }
    };
    fetchFieldRequest();
  }, [lead]);

  if (!lead) return null;

  const statusStyle = STATUS_COLORS[lead.status] || { bg: "#e5e7eb", text: "#374151" };

  const handleAssign = async () => {
    if (!selectedExecutiveId) {
      Alert.alert("Error", "Please select a ground executive");
      return;
    }

    if (!fieldRequestId) {
      Alert.alert("Error", "No field request found for this lead");
      return;
    }

    try {
      const res = await apiRequest('/field-manager/assign-field-exec', {
        method: 'POST',
        body: JSON.stringify({
          fieldRequestId,
          fieldExecId: selectedExecutiveId,
        }),
      });

      if (res.ok) {
        Alert.alert("Success", "Ground executive assigned successfully");
        onAssigned?.();
        onClose();
      } else {
        Alert.alert("Error", "Failed to assign ground executive");
      }
    } catch (error) {
      console.error('Failed to assign:', error);
      Alert.alert("Error", "Failed to assign ground executive");
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
                {lead.status.replace("_", " ")}
              </Text>
            </View>
          </View>

          {/* Contact Info */}
          <View className="bg-white rounded-2xl shadow-md p-4">
            <Text className="text-lg font-semibold text-gray-700 mb-2">Contact Info</Text>
            <InfoRow label="Phone" value={lead.phone} />
            <InfoRow label="Village" value={lead.village} />
            <InfoRow label="Taluka" value={lead.taluka} />
            <InfoRow label="District" value={lead.district} />
          </View>

          {/* Campaign Info */}
          <View className="bg-white rounded-2xl shadow-md p-4">
            <Text className="text-lg font-semibold text-gray-700 mb-2">Campaign Info</Text>
            <InfoRow label="Campaign" value={lead.campaign_name} />
            <InfoRow label="Created At" value={new Date(lead.created_at).toLocaleDateString()} />
          </View>

          {/* Notes Section */}
          {lead.notes && (
            <View className="bg-blue-50 rounded-2xl border border-blue-200 p-4">
              <Text className="text-lg font-semibold text-gray-700 mb-2">Notes</Text>
              <Text className="text-gray-700 leading-5">{lead.notes}</Text>
            </View>
          )}

          {/* Ground Executive Assignment */}
          {lead.status === "VISIT_REQUESTED" && (
            <View className="bg-white rounded-2xl shadow-md p-4">
              <Text className="text-lg font-semibold text-gray-700 mb-4">Assign Ground Executive</Text>

              <View className="space-y-2 mb-4">
                {groundExecutives.map((ge) => (
                  <TouchableOpacity
                    key={ge.id}
                    onPress={() => setSelectedExecutiveId(ge.id)}
                    className={`p-3 rounded-xl border-2 ${
                      selectedExecutiveId === ge.id
                        ? "bg-purple-50 border-purple-500"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        selectedExecutiveId === ge.id ? "text-purple-700" : "text-gray-700"
                      }`}
                    >
                      {ge.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={handleAssign}
                className="bg-purple-600 py-4 rounded-xl items-center"
              >
                <Text className="text-white font-bold text-lg">Assign</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

      </SafeAreaView>
    </Modal>
  );
}

const InfoRow = ({ label, value }: { label: string; value: string | undefined }) => (
  <View className="flex-row justify-between py-1">
    <Text className="text-gray-500 font-medium">{label}</Text>
    <Text className="text-gray-800">{value || "-"}</Text>
  </View>
);
