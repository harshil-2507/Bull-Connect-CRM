import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { apiRequest } from "../utils/api";

interface Props {
  lead: any | null;
  onClose: () => void;
  onUpdated?: () => void;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  ASSIGNED: { bg: "#fef9c3", text: "#b45309" },
  CONTACTED: { bg: "#d1fae5", text: "#047857" },
  VISIT_REQUESTED: { bg: "#fcd5ce", text: "#b91c1c" },
  VISIT_ASSIGNED: { bg: "#ede9fe", text: "#7c3aed" },
  VISIT_COMPLETED: { bg: "#dcfce7", text: "#166534" },
};

export default function TelecallerLeadActions({
  lead,
  onClose,
  onUpdated,
}: Props) {
  const [noteText, setNoteText] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<"CONTACTED" | "VISIT_REQUESTED" | null>(null);

  if (!lead) return null;

  const statusStyle = STATUS_COLORS[lead.status] || { bg: "#e5e7eb", text: "#374151" };

  const handleStatusButtonPress = (newStatus: "CONTACTED" | "VISIT_REQUESTED") => {
    setNoteText("");
    setPendingStatus(newStatus);
    setShowNoteInput(true);
  };

  const handleConfirmStatusUpdate = async () => {
    if (pendingStatus) {
      try {
        const res = await apiRequest(`/leads/${lead.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            status: pendingStatus,
            // Note: noteText might need to be handled differently, perhaps as an activity
          }),
        });

        if (res.ok) {
          Alert.alert("Success", `Lead status updated to ${pendingStatus}`);
          setShowNoteInput(false);
          setPendingStatus(null);
          onUpdated?.();
          onClose();
        } else {
          Alert.alert("Error", "Failed to update lead status");
        }
      } catch (error) {
        console.error('Failed to update status:', error);
        Alert.alert("Error", "Failed to update lead status");
      }
    }
  };

  return (
    <Modal visible animationType="slide">
      <SafeAreaView className="flex-1 bg-gray-50">

        {/* HEADER */}
        <View className="flex-row justify-between items-center px-4 py-4 bg-white border-b border-gray-200 shadow-md">
          <Text className="text-2xl font-bold text-[#1a4d2e]">Lead Details</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={28} color="#1a4d2e" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        >

          {/* Lead Header: Name + Status */}
          <View className="bg-white rounded-2xl shadow-lg p-5 flex-row justify-between items-center mb-4">
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

          {/* Contact Info */}
          <View className="bg-white rounded-2xl shadow-md p-4 mb-4">
            <Text className="text-lg font-semibold text-gray-700 mb-2">Contact Info</Text>
            <InfoRow label="Phone" value={lead.phone} />
            <InfoRow label="Village" value={lead.village} />
            <InfoRow label="Taluka" value={lead.taluka} />
            <InfoRow label="District" value={lead.district} />
          </View>

          {/* Campaign Info */}
          <View className="bg-white rounded-2xl shadow-md p-4 mb-4">
            <Text className="text-lg font-semibold text-gray-700 mb-2">Campaign Info</Text>
            <InfoRow label="Campaign" value={lead.campaign_name} />
            <InfoRow label="Created At" value={new Date(lead.created_at).toLocaleDateString()} />
          </View>

          {/* Notes Section */}
          {lead.notes && (
            <View className="bg-blue-50 rounded-2xl border border-blue-200 p-4 mb-4">
              <Text className="text-lg font-semibold text-gray-700 mb-2">Notes</Text>
              <Text className="text-gray-700 leading-5">{lead.notes}</Text>
            </View>
          )}

          {/* Update Status */}
          <View className="bg-white rounded-2xl shadow-md p-4">
            <Text className="text-lg font-semibold text-gray-700 mb-4">Update Status</Text>

            {!showNoteInput ? (
              <>
                <TouchableOpacity
                  onPress={() => handleStatusButtonPress("CONTACTED")}
                  className="bg-green-50 border-2 border-green-500 rounded-xl p-4 mb-3"
                >
                  <Text className="text-green-700 font-bold text-center">Mark as Contacted</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleStatusButtonPress("VISIT_REQUESTED")}
                  className="bg-blue-50 border-2 border-blue-500 rounded-xl p-4"
                >
                  <Text className="text-blue-700 font-bold text-center">Request Visit</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text className="text-lg font-semibold text-gray-700 mb-3">
                  Add Notes for {pendingStatus === "CONTACTED" ? "Contacted" : "Visit Requested"}
                </Text>
                
                <TextInput
                  placeholder="Enter your notes here..."
                  value={noteText}
                  onChangeText={setNoteText}
                  multiline
                  numberOfLines={4}
                  className="border-2 border-gray-300 rounded-xl p-3 mb-4 text-gray-700"
                  textAlignVertical="top"
                />

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => {
                      setShowNoteInput(false);
                      setPendingStatus(null);
                    }}
                    className="flex-1 bg-gray-300 rounded-lg p-3"
                  >
                    <Text className="text-gray-700 font-bold text-center">Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleConfirmStatusUpdate}
                    className="flex-1 bg-green-600 rounded-lg p-3"
                  >
                    <Text className="text-white font-bold text-center">Confirm</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
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
