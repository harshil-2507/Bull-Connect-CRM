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
import { completeVisit } from "../data/leads";

interface Props {
  lead: any | null;
  onClose: () => void;
  onUpdated?: () => void;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  VISIT_ASSIGNED: { bg: "#ede9fe", text: "#7c3aed" },
  VISIT_COMPLETED: { bg: "#dcfce7", text: "#166534" },
};

export default function GroundExecutiveLeadActions({
  lead,
  onClose,
  onUpdated,
}: Props) {
  const [completionNotes, setCompletionNotes] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);

  if (!lead) return null;

  const statusStyle = STATUS_COLORS[lead.status] || { bg: "#e5e7eb", text: "#374151" };

  const handleCompleteVisit = () => {
    setCompletionNotes("");
    setShowNoteInput(true);
  };

  const handleConfirmCompletion = () => {
    completeVisit(lead.id, completionNotes);
    Alert.alert("Success", "Visit marked as completed");
    setShowNoteInput(false);
    onUpdated?.();
    onClose();
  };

  return (
    <Modal visible={!!lead} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 bg-white shadow-md border-b border-gray-200">
          <Text className="text-2xl font-bold text-[#1a4d2e]">Visit Details</Text>
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

          {/* Complete Visit Section */}
          <View className="bg-white rounded-2xl shadow-md p-4">
            <Text className="text-lg font-semibold text-gray-700 mb-4">Visit Status</Text>

            {!showNoteInput ? (
              <>
                {lead.status === "VISIT_ASSIGNED" && (
                  <TouchableOpacity
                    onPress={handleCompleteVisit}
                    className="bg-green-50 border-2 border-green-500 rounded-xl p-4"
                  >
                    <Text className="text-green-700 font-bold text-center">Mark as Completed</Text>
                  </TouchableOpacity>
                )}

                {lead.status === "VISIT_COMPLETED" && (
                  <View className="bg-green-50 border-2 border-green-500 rounded-xl p-4">
                    <Text className="text-green-700 font-bold text-center">✓ Visit Completed</Text>
                  </View>
                )}
              </>
            ) : (
              <>
                <Text className="text-lg font-semibold text-gray-700 mb-3">
                  Add Completion Notes
                </Text>
                
                <TextInput
                  placeholder="Enter completion details..."
                  value={completionNotes}
                  onChangeText={setCompletionNotes}
                  multiline
                  numberOfLines={4}
                  className="border-2 border-gray-300 rounded-xl p-3 mb-4 text-gray-700"
                  textAlignVertical="top"
                />

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => {
                      setShowNoteInput(false);
                      setCompletionNotes("");
                    }}
                    className="flex-1 bg-gray-300 rounded-lg p-3"
                  >
                    <Text className="text-gray-700 font-bold text-center">Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleConfirmCompletion}
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
