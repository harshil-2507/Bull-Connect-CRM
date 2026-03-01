import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface LeadProps {
  item: any;
  onAction?: (lead: any) => void; // Triggered when action button is pressed
}

export default function Lead({ item, onAction }: LeadProps) {
  const initials = getInitials(item.farmer_name);

  const statusColors: Record<string, { bg: string; text: string }> = {
    NEW: { bg: "#e0f2fe", text: "#0284c7" },
    ASSIGNED: { bg: "#fef3c7", text: "#b45309" },
    CONTACTED: { bg: "#d1fae5", text: "#065f46" },
    VISIT_REQUESTED: { bg: "#ede9fe", text: "#7c3aed" },
    VISIT_ASSIGNED: { bg: "#fee2e2", text: "#b91c1c" },
    VISIT_COMPLETED: { bg: "#dcfce7", text: "#16a34a" },
    SOLD: { bg: "#fef9c3", text: "#ca8a04" },
    DROPPED: { bg: "#f5f5f5", text: "#6b7280" },
  };

  const statusStyle = statusColors[item.status] || { bg: "#f5f5f5", text: "#374151" };

  return (
    <View className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex-row items-center justify-between mb-3">
      {/* Left Content */}
      <View className="flex-row items-center gap-4 flex-1">
        {/* Avatar */}
        <View className="h-12 w-12 rounded-full bg-green-50 border border-green-100 items-center justify-center">
          <Text className="text-green-700 font-bold text-lg">{initials}</Text>
        </View>

        {/* Info */}
        <View className="flex-1">
          {/* Name + Status */}
          <View className="flex-row justify-between items-start">
            <Text className="font-bold text-slate-800 text-base flex-1">
              {item.farmer_name}
            </Text>

            <Text
              style={{
                backgroundColor: statusStyle.bg,
                color: statusStyle.text,
              }}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-gray-200"
            >
              {item.status}
            </Text>
          </View>

          {/* Campaign + Location */}
          <View className="flex-row items-center gap-2 mt-1">
            <View className="flex-row items-center gap-1 bg-gray-50 px-2 py-0.5 rounded">
              <MaterialIcons name="grass" size={14} color="#475569" />
              <Text className="text-xs text-slate-600">
                {item.campaign_name || "Campaign"}
              </Text>
            </View>

            <View className="w-1 h-1 bg-gray-300 rounded-full" />

            <View className="flex-row items-center gap-1">
              <MaterialIcons name="location-on" size={14} color="#94a3b8" />
              <Text className="text-xs text-slate-500">{item.state}</Text>
            </View>
          </View>

          {/* Created Date */}
          <View className="flex-row items-center gap-1 mt-1.5">
            <MaterialIcons name="history" size={12} color="#94a3b8" />
            <Text className="text-[11px] text-slate-400">
              Added: {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Button */}
      <TouchableOpacity
        onPress={() => onAction?.(item)}
        className="ml-3 h-10 w-10 rounded-full bg-[#13ec49] items-center justify-center shadow-lg"
      >
        <MaterialIcons name="arrow-forward-ios" size={18} color="white" />
      </TouchableOpacity>
    </View>
  );
}

/* ------------------ Helpers ------------------ */
function getInitials(name: string) {
  if (!name) return "";
  const parts = name.split(" ");
  return parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0][0];
}