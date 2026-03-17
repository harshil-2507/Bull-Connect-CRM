import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import LeadActions from "../components/LeadActions"; // <-- Import universal LeadActions
import { apiRequest } from "../utils/api"; // For fetching lead details

export const drawerLabel = 'Home';
export const drawerIcon = ({ color, size }: { color: string; size: number }) => (
  <Feather name="home" size={size} color={color} />
);

type TelecallerType = {
  id: string;
  username: string;
  name: string;
  phone: string;
  email: string | null;
};

type AssignmentType = {
  id: string;
  lead_id: string;
  user_id: string;
  assigned_by: string;
  assigned_at: string;
  is_active: boolean;
};

export default function Telecallers() {
  const [telecallers, setTelecallers] = useState<TelecallerType[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTelecaller, setSelectedTelecaller] = useState<TelecallerType | null>(null);
  const [assignments, setAssignments] = useState<AssignmentType[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  const [selectedLead, setSelectedLead] = useState<any | null>(null); // <-- For LeadActions modal

  const router = useRouter();

  const fetchTelecallers = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) throw new Error("No auth token found");

      const res = await fetch(
        "https://bull-connect-crm.onrender.com/manager/telecallers",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error("Failed to fetch telecallers");
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Invalid data format");

      setTelecallers(data);
    } catch (err: any) {
      console.error("Telecallers fetch error:", err);
      Alert.alert("Error", err.message || "Unable to load telecallers");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAssignments = async (telecallerId: string) => {
    setAssignmentsLoading(true);
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) throw new Error("No auth token found");

      const res = await fetch(
        "https://bull-connect-crm.onrender.com/manager/tele-assignments",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error("Failed to fetch assignments");
      const data: AssignmentType[] = await res.json();

      const filtered = data.filter(a => a.user_id === telecallerId && a.is_active);
      setAssignments(filtered);
    } catch (err: any) {
      console.error("Assignments fetch error:", err);
      Alert.alert("Error", err.message || "Unable to load assignments");
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const fetchLeadById = async (leadId: string) => {
    try {
      const res = await apiRequest(`/leads/${leadId}`);
      if (!res.ok) throw new Error("Failed to fetch lead details");
      const data = await res.json();
      setSelectedLead(data); // <-- Open LeadActions modal
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Unable to fetch lead details");
    }
  };

  const refreshTelecallers = () => {
    setRefreshing(true);
    fetchTelecallers();
  };

  useFocusEffect(
    useCallback(() => {
      fetchTelecallers();
    }, [])
  );

  const handleTelecallerPress = async (telecaller: TelecallerType) => {
    setSelectedTelecaller(telecaller);
    setModalVisible(true);
    await fetchAssignments(telecaller.id);
  };

  return (
    <View className="flex-1 px-6 pt-6 bg-[#f9faf8]">
      <Text className="text-3xl font-bold text-[#1a4d2e] mb-6">Telecallers</Text>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#1a4d2e" className="mt-10" />
      ) : telecallers.length === 0 ? (
        <View className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <Text className="text-gray-700">No telecallers found.</Text>
        </View>
      ) : (
        <FlatList
          data={telecallers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshing={refreshing}
          onRefresh={refreshTelecallers}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleTelecallerPress(item)}
              className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 mb-4 flex-row items-center"
              activeOpacity={0.7}
            >
              <View className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                <Text className="text-green-700 font-bold text-lg">{item.name[0]}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-800">{item.name}</Text>
                <Text className="text-gray-500 mt-1">Username: {item.username}</Text>
                <Text className="text-gray-500 mt-1">Phone: {item.phone}</Text>
                {item.email && <Text className="text-gray-500 mt-1">Email: {item.email}</Text>}
              </View>
              <View className="ml-2">
                <Text className="text-green-600 font-bold text-lg">→</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Modal for assigned leads */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-[#f9faf8] px-6 pt-8">
          <TouchableOpacity
            onPress={() => setModalVisible(false)}
            className="mb-6 flex-row items-center"
          >
            <Feather name="arrow-left" size={24} color="#1a4d2e" />
            <Text className="text-lg font-semibold ml-4">
              {selectedTelecaller?.name} - Assigned Leads
            </Text>
          </TouchableOpacity>

          {assignmentsLoading ? (
            <ActivityIndicator size="large" color="#1a4d2e" />
          ) : assignments.length === 0 ? (
            <Text className="text-gray-500">No active leads assigned.</Text>
          ) : (
            <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
              {assignments.map(a => (
                <TouchableOpacity
                  key={a.id}
                  className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 mb-4"
                  onPress={() => fetchLeadById(a.lead_id)} // <-- Open lead details
                >
                  <Text className="text-gray-700 font-semibold">Lead ID:</Text>
                  <Text className="text-gray-800">{a.lead_id}</Text>
                  <Text className="text-gray-500 mt-1">
                    Assigned At: {new Date(a.assigned_at).toLocaleString()}
                  </Text>
                  <Text className="text-blue-600 mt-2 font-semibold">
                    View Details →
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Universal LeadActions modal */}
      <LeadActions
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdated={() => {
          setSelectedLead(null);
          if (selectedTelecaller) fetchAssignments(selectedTelecaller.id);
        }}
      />
    </View>
  );
}