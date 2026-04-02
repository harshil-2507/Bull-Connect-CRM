import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { apiRequest } from "../utils/api";

interface Props {
  lead: any | null;
  onClose: () => void;
  onUpdated?: () => void;
}

export default function GroundExecutiveLeadActions({
  lead,
  onClose,
  onUpdated,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [outcome, setOutcome] = useState<"SOLD" | "DROPPED" | null>(null);
  
  // Verification Checklist State
  const [checklist, setChecklist] = useState({
    identity: false,
    crop: false,
    quantity: false,
    photos: false,
  });

  if (!lead) return null;

  const isCompleted = ["VISIT_COMPLETED", "SOLD", "DROPPED"].includes(lead.status);

  const toggleCheck = (key: keyof typeof checklist) => {
    if (isCompleted) return;
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isChecklistComplete = Object.values(checklist).every(Boolean);

  const submitVerification = async () => {
    if (!outcome) {
      Alert.alert("Required", "Please select an outcome.");
      return;
    }
    
    try {
      setLoading(true);
      const res = await apiRequest("/field-exec/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          finalStatus: outcome,
          photoRef: "captured_photo_mock.jpg", // Mock photo upload
        }),
      });

      if (!res.ok) throw new Error("Failed to verify");

      Alert.alert(
        "Verification Successful",
        outcome === "SOLD" 
          ? "Great job! A new order has been created in the system." 
          : "Visit logged and marked as Not Interested."
      );
      
      onUpdated?.();
      onClose();
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", "Could not complete verification.");
    } finally {
      setLoading(false);
    }
  };

  const ChecklistItem = ({ title, field }: { title: string, field: keyof typeof checklist }) => (
    <TouchableOpacity
      className={`flex-row items-center p-4 rounded-xl border mb-3 ${
        checklist[field] 
          ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500" 
          : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
      }`}
      onPress={() => toggleCheck(field)}
      disabled={isCompleted}
    >
      <View
        className={`w-6 h-6 rounded-md items-center justify-center mr-3 ${
          checklist[field] 
            ? "bg-emerald-500" 
            : "border-2 border-gray-300 dark:border-slate-500"
        }`}
      >
        {checklist[field] && <Feather name="check" size={16} color="white" />}
      </View>
      <Text className={`font-semibold ${
        checklist[field] ? "text-emerald-700 dark:text-emerald-400" : "text-gray-700 dark:text-slate-300"
      }`}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={!!lead} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-[#f8fafc] dark:bg-slate-900">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
          <View>
            <Text className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              {isCompleted ? "Visit Log" : "Farm Verification"}
            </Text>
            <Text className="text-xl font-bold text-gray-900 dark:text-slate-50 mt-1">
              {lead.farmer_name}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full">
            <MaterialIcons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        <ScrollView className="p-4" contentContainerStyle={{ paddingBottom: 60 }}>
          
          {/* Call Notes from Telecaller */}
          <View className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-5 mb-5 border border-amber-100 dark:border-amber-900/50">
            <View className="flex-row items-center mb-2">
              <Feather name="file-text" size={18} color="#d97706" />
              <Text className="text-sm font-bold text-amber-700 dark:text-amber-500 ml-2">Telecaller Notes</Text>
            </View>
            <Text className="text-amber-800 dark:text-amber-400 text-sm leading-6">
              "Farmer is interested to sell {lead.acreage} acres of {lead.crop_type}. Needs quick pickup logistics. Make sure to check the moisture level."
            </Text>
            <View className="mt-3 pt-3 border-t border-amber-200/50 dark:border-amber-700/30 flex-row justify-between">
               <Text className="text-xs text-amber-600 dark:text-amber-500">📞 {lead.phone}</Text>
               <Text className="text-xs text-amber-600 dark:text-amber-500">📍 {lead.village}</Text>
            </View>
          </View>

          {isCompleted ? (
             <View className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 items-center">
                <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
                  lead.status === "SOLD" ? "bg-emerald-100" : "bg-red-100"
                }`}>
                  <MaterialIcons 
                    name={lead.status === "SOLD" ? "check-circle" : "cancel"} 
                    size={36} 
                    color={lead.status === "SOLD" ? "#10b981" : "#ef4444"} 
                  />
                </View>
                <Text className="text-xl font-bold text-gray-900 dark:text-slate-50 mb-1">
                  Visit Finished
                </Text>
                <Text className="text-gray-500 dark:text-slate-400">
                  Outcome was marked as: <Text className="font-bold">{lead.status}</Text>
                </Text>
             </View>
          ) : (
            <View>
              {/* Verification Checklist */}
              <Text className="font-bold text-gray-900 dark:text-slate-50 text-lg mb-3 ml-1">
                Verification Checklist
              </Text>
              
               <ChecklistItem title="Farmer Identity Verified (ID Check)" field="identity" />
               <ChecklistItem title={`Crop Type Confirmed (${lead.crop_type})`} field="crop" />
               <ChecklistItem title={`Quantity Estimated (${lead.acreage} Acres)`} field="quantity" />
               
               {/* Take Photos Action */}
               <TouchableOpacity 
                 className={`flex-row items-center p-4 rounded-xl border mb-5 ${
                   checklist.photos 
                     ? "bg-slate-800 border-slate-900" 
                     : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900"
                 }`}
                 onPress={() => toggleCheck("photos")}
               >
                 <View className={`p-3 rounded-full mr-3 ${checklist.photos ? "bg-slate-700" : "bg-blue-100 dark:bg-blue-900"}`}>
                   <Feather name="camera" size={20} color={checklist.photos ? "white" : "#2563eb"} />
                 </View>
                 <View className="flex-1">
                   <Text className={`font-bold ${checklist.photos ? "text-white" : "text-blue-900 dark:text-blue-400"}`}>
                     {checklist.photos ? "Photos Captured ✓" : "Take Farm Photos"}
                   </Text>
                   <Text className={`text-xs mt-1 ${checklist.photos ? "text-slate-300" : "text-blue-600 dark:text-blue-500"}`}>
                     Require: Crop quality, Farmer with crop
                   </Text>
                 </View>
               </TouchableOpacity>

              {/* Outcome Selection */}
              {isChecklistComplete && (
                <View className="mt-4 animate-fade-in-up">
                  <Text className="font-bold text-gray-900 dark:text-slate-50 text-lg mb-3 ml-1">
                    Select Outcome
                  </Text>
                  
                  <View className="gap-3">
                    <TouchableOpacity
                      onPress={() => setOutcome("SOLD")}
                      className={`p-4 rounded-xl border-2 flex-row items-center ${
                        outcome === "SOLD"
                          ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500"
                          : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                      }`}
                    >
                      <View className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                        outcome === "SOLD" ? "border-emerald-500" : "border-gray-300"
                      }`}>
                        {outcome === "SOLD" && <View className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                      </View>
                      <View>
                        <Text className={`font-bold text-base ${outcome === "SOLD" ? "text-emerald-700 dark:text-emerald-400" : "text-gray-900 dark:text-slate-50"}`}>
                          Ready to Sell in Bull
                        </Text>
                        <Text className="text-xs text-gray-500 mt-1">System creates Sales Order immediately</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setOutcome("DROPPED")}
                      className={`p-4 rounded-xl border-2 flex-row items-center ${
                        outcome === "DROPPED"
                          ? "bg-red-50 dark:bg-red-900/20 border-red-500"
                          : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                      }`}
                    >
                      <View className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                        outcome === "DROPPED" ? "border-red-500" : "border-gray-300"
                      }`}>
                        {outcome === "DROPPED" && <View className="w-2.5 h-2.5 rounded-full bg-red-500" />}
                      </View>
                      <View>
                        <Text className={`font-bold text-base ${outcome === "DROPPED" ? "text-red-700 dark:text-red-400" : "text-gray-900 dark:text-slate-50"}`}>
                          Not Interested / Quality Reject
                        </Text>
                        <Text className="text-xs text-gray-500 mt-1">Lead will be marked as dropped</Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={submitVerification}
                    disabled={!outcome || loading}
                    className={`mt-6 py-4 rounded-xl items-center flex-row justify-center shadow-sm ${
                      outcome ? "bg-blue-600" : "bg-gray-300 dark:bg-slate-700"
                    }`}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <>
                        <MaterialIcons name="send" size={20} color={outcome ? "white" : "#9ca3af"} />
                        <Text className={`font-bold text-lg ml-2 ${outcome ? "text-white" : "text-gray-500"}`}>
                          Confirm & Submit Verification
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
