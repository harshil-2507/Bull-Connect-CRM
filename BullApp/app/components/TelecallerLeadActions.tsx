import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";

interface Props {
  lead: any | null;
  onClose: () => void;
  onSuccess?: () => void; // refresh list after action
}

export default function TelecallerLeadActions({
  lead,
  onClose,
  onSuccess,
}: Props) {
  if (!lead) return null;

  const [loading, setLoading] = useState(false);
  const [disposition, setDisposition] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [cropType, setCropType] = useState("");
  const [acreage, setAcreage] = useState("");
  const [dropReason, setDropReason] = useState("");

  const submitCall = async () => {
  if (!disposition) {
    Alert.alert("Error", "Please select a disposition");
    return;
  }

  if (disposition === "INTERESTED" && (!cropType || !acreage)) {
    Alert.alert("Error", "Crop type and acreage required");
    return;
  }

  try {
    setLoading(true);

    const token = await SecureStore.getItemAsync("authToken");
    if (!token) throw new Error("Authentication failed");

    // 🔥 Build payload conditionally (CLEAN)
    let payload: any = {
      leadId: lead.id,
      disposition,
      notes: notes.trim(),
    };

    if (disposition === "INTERESTED") {
      payload.cropType = cropType.trim();
      payload.acreage = Number(acreage);
    }

    if (disposition === "CONTACTED") {
      payload.durationSeconds = 60;
    }

    // ❗ For NOT_INTERESTED we send NOTHING extra
    // Backend will auto set dropReason = "OTHER"

    console.log("Sending payload:", payload);

    const response = await fetch(
      "https://bull-connect-crm.onrender.com/telecaller/call",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || result.message || "Failed to log call");
    }

    Alert.alert("Success", "Call logged successfully");
    onClose();
    onSuccess?.();
  } catch (err: any) {
    Alert.alert("Error", err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <Modal visible={!!lead} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="flex-row justify-between items-center p-4 bg-white border-b">
          <Text className="text-xl font-bold text-[#1a4d2e]">
            Call Action
          </Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={26} color="#1a4d2e" />
          </TouchableOpacity>
        </View>

        <ScrollView className="p-4 space-y-4">

          {/* Disposition Buttons */}
          <Text className="font-semibold">Disposition</Text>

          {["CONTACTED", "INTERESTED", "NOT_INTERESTED"].map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setDisposition(type)}
              className={`p-3 rounded-xl mb-2 ${
                disposition === type
                  ? "bg-[#1a4d2e]"
                  : "bg-white border border-gray-300"
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  disposition === type ? "text-white" : "text-gray-700"
                }`}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Notes */}
          <Text className="font-semibold mt-4">Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Enter call notes"
            className="bg-white border border-gray-300 rounded-xl p-3"
            multiline
          />

          {/* Interested Fields */}
          {disposition === "INTERESTED" && (
            <>
              <Text className="font-semibold mt-4">Crop Type</Text>
              <TextInput
                value={cropType}
                onChangeText={setCropType}
                placeholder="Enter crop type"
                className="bg-white border border-gray-300 rounded-xl p-3"
              />

              <Text className="font-semibold mt-4">Acreage</Text>
              <TextInput
                value={acreage}
                onChangeText={setAcreage}
                placeholder="Enter acreage"
                keyboardType="numeric"
                className="bg-white border border-gray-300 rounded-xl p-3"
              />
            </>
          )}

          {/* Drop Fields */}
          {disposition === "NOT_INTERESTED" && (
            <>
              <Text className="font-semibold mt-4">Drop Reason</Text>
              <TextInput
                value={dropReason}
                onChangeText={setDropReason}
                placeholder="Enter drop reason"
                className="bg-white border border-gray-300 rounded-xl p-3"
              />
            </>
          )}

          {/* Submit */}
          <TouchableOpacity
            onPress={submitCall}
            disabled={loading}
            className="bg-[#0ea633] p-4 rounded-2xl mt-6 items-center"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">
                Submit Call
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}