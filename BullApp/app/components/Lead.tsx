// components/Lead.tsx

import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface LeadProps {
  item: any;
  onCall?: (phone: string) => void;
}

export default function Lead({ item, onCall }: LeadProps) {
  const initials = getInitials(item.farmer_name);

  return (
    <View className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex-row items-center justify-between mb-3">
      
      {/* Left Content */}
      <View className="flex-row items-center gap-4 flex-1">
        
        {/* Avatar */}
        <View className="h-12 w-12 rounded-full bg-green-50 border border-green-100 items-center justify-center">
          <Text className="text-green-700 font-bold text-lg">
            {initials}
          </Text>
        </View>

        {/* Info */}
        <View className="flex-1">
          
          {/* Name + Badge */}
          <View className="flex-row justify-between items-start">
            <Text className="font-bold text-slate-800 text-base flex-1">
              {item.farmer_name}
            </Text>

            {item.priority === "High" && (
              <Text className="text-[10px] font-medium bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100">
                High Priority
              </Text>
            )}

            {item.status === "New" && (
              <Text className="text-[10px] font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                New
              </Text>
            )}
          </View>

          {/* Crop + Location */}
          <View className="flex-row items-center gap-2 mt-1">
            <View className="flex-row items-center gap-1 bg-gray-50 px-2 py-0.5 rounded">
              <MaterialIcons name="grass" size={14} color="#475569" />
              <Text className="text-xs text-slate-600">
                {item.crop || "Crop"}
              </Text>
            </View>

            <View className="w-1 h-1 bg-gray-300 rounded-full" />

            <View className="flex-row items-center gap-1">
              <MaterialIcons name="location-on" size={14} color="#94a3b8" />
              <Text className="text-xs text-slate-500">
                {item.state}
              </Text>
            </View>
          </View>

          {/* Last Contact */}
          <View className="flex-row items-center gap-1 mt-1.5">
            <MaterialIcons name="history" size={12} color="#94a3b8" />
            <Text className="text-[11px] text-slate-400">
              {formatLastContact(item)}
            </Text>
          </View>
        </View>
      </View>

      {/* Call Button */}
      <TouchableOpacity
        onPress={() => onCall?.(item.phone_number)}
        className="ml-3 h-10 w-10 rounded-full bg-[#13ec49] items-center justify-center shadow-lg"
      >
        <MaterialIcons name="call" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
}

/* ------------------ Helpers ------------------ */

function getInitials(name: string) {
  if (!name) return "";
  const parts = name.split(" ");
  return parts.length > 1
    ? parts[0][0] + parts[1][0]
    : parts[0][0];
}

function formatLastContact(item: any) {
  if (!item.last_contacted_at) {
    return `Added: ${new Date(item.created_at).toLocaleDateString()}`;
  }

  const date = new Date(item.last_contacted_at);
  return `Last contact: ${date.toLocaleDateString()}`;
}