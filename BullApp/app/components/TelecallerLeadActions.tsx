import React, { useEffect, useState } from "react";
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

import LeadDetailsCard from "./LeadDetailsCard";
import CallHistorySection from "./CallHistorySection";

interface Props {
  lead: any | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function TelecallerLeadActions({
  lead,
  onClose,
  onSuccess,
}: Props) {
  const [leadDetails, setLeadDetails] = useState<any>(null);
  const [callHistory, setCallHistory] = useState<any[]>([]);
  const [leadLoading, setLeadLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(false);

  const [loading, setLoading] = useState(false);
  const [disposition, setDisposition] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [cropType, setCropType] = useState("");
  const [acreage, setAcreage] = useState("");

  const fetchData = async () => {
    if (!lead) return;

    try {
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) return;

      setLeadLoading(true);
      setHistoryLoading(true);
      setHistoryError(false);

      const [leadRes, historyRes] = await Promise.all([
        fetch(
          `https://bull-connect-crm.onrender.com/leads/${lead.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        fetch(
          `https://bull-connect-crm.onrender.com/lead/call/${lead.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
      ]);

      if (leadRes.ok) {
        const leadData = await leadRes.json();
        setLeadDetails(leadData);
      } else {
        setLeadDetails(null);
      }

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setCallHistory(historyData || []);
      } else {
        setHistoryError(true);
      }
    } catch (err) {
      setHistoryError(true);
    } finally {
      setLeadLoading(false);
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lead]);

  const submitCall = async () => {
    if (!disposition) {
      Alert.alert("Error", "Please select disposition");
      return;
    }

    try {
      setLoading(true);

      const token = await SecureStore.getItemAsync("authToken");
      if (!token) throw new Error("Authentication failed");

      const payload: any = {
        leadId: lead.id,
        disposition,
        notes,
      };

      if (disposition === "INTERESTED") {
        payload.cropType = cropType;
        payload.acreage = Number(acreage);
      }

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

      if (!response.ok) throw new Error("Failed to log call");

      Alert.alert("Success", "Call logged successfully");

      // 🔥 Refresh history instead of closing immediately
      fetchData();
      setDisposition(null);
      setNotes("");
      setCropType("");
      setAcreage("");

      onSuccess?.();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!lead) return null;

  return (
    <Modal visible animationType="slide">
      <SafeAreaView className="flex-1 bg-[#f4f6f5]">

        {/* HEADER */}
        <View className="flex-row justify-between items-center px-4 py-4 bg-white border-b border-gray-100">
          <Text className="text-xl font-bold text-gray-800">
            Lead Profile
          </Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={26} color="#14532d" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        >

          <LeadDetailsCard lead={leadDetails} loading={leadLoading} />

          <CallHistorySection
            calls={callHistory}
            loading={historyLoading}
            error={historyError}
          />

          {/* CALL ACTION (STAYS HERE) */}
          <View className="bg-white rounded-3xl px-5 py-6 border border-gray-100 shadow-sm">

            <Text className="text-xs font-bold tracking-widest text-green-600 mb-4">
              LOG NEW CALL
            </Text>

            {["CONTACTED", "INTERESTED", "NOT_INTERESTED"].map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setDisposition(type)}
                className={`py-3 rounded-xl mb-3 ${
                  disposition === type
                    ? "bg-green-600"
                    : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-center font-semibold ${
                    disposition === type
                      ? "text-white"
                      : "text-gray-700"
                  }`}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}

            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Call notes"
              multiline
              className="bg-gray-100 rounded-xl p-4 mt-2"
            />

            {disposition === "INTERESTED" && (
              <>
                <TextInput
                  value={cropType}
                  onChangeText={setCropType}
                  placeholder="Crop type"
                  className="bg-gray-100 rounded-xl p-4 mt-3"
                />
                <TextInput
                  value={acreage}
                  onChangeText={setAcreage}
                  placeholder="Acreage"
                  keyboardType="numeric"
                  className="bg-gray-100 rounded-xl p-4 mt-3"
                />
              </>
            )}

            <TouchableOpacity
              onPress={submitCall}
              disabled={loading}
              className="bg-green-600 py-5 rounded-2xl mt-6 items-center"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">
                  Submit Call
                </Text>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}