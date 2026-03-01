// components/TelecallerSelector.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import * as SecureStore from "expo-secure-store";

interface TelecallerSelectorProps {
  visible: boolean;
  onSelect: (telecaller: any) => void;
  onClose: () => void;
}

export default function TelecallerSelector({
  visible,
  onSelect,
  onClose,
}: TelecallerSelectorProps) {
  const [telecallers, setTelecallers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) fetchTelecallers();
  }, [visible]);

  const fetchTelecallers = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) throw new Error("No auth token found");

      const response = await fetch(
        "https://bull-connect-crm.onrender.com/manager/telecallers",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to fetch telecallers");
      setTelecallers(result || []);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-gray-50 p-4">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-[#1a4d2e]">Select Telecaller</Text>
          <TouchableOpacity onPress={onClose}>
            <Text className="text-[#1a4d2e] font-bold">Close</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#1a4d2e" />
        ) : telecallers.length === 0 ? (
          <Text className="text-gray-500">No telecallers found.</Text>
        ) : (
          <FlatList
            data={telecallers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="bg-white p-4 rounded-xl mb-2 shadow"
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text className="font-bold text-[#1a4d2e]">{item.name}</Text>
                <Text className="text-gray-600 text-sm">{item.username}</Text>
                {item.phone && (
                  <Text className="text-gray-500 text-sm">Phone: {item.phone}</Text>
                )}
                {item.email && (
                  <Text className="text-gray-500 text-sm">Email: {item.email}</Text>
                )}
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
}