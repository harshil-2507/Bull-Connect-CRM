import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { apiRequest } from "../utils/api";

type RegionData = {
  taluka: string;
  total_requests: string | number;
};

type VisitRequest = {
  id: string;
  lead_id: string;
  priority: string;
  farmer_name: string;
  phone_number: string;
};

type FieldExecutive = {
  id: string;
  name: string;
  phone: string;
  current_load: string | number;
  capacity: number;
};

export default function Assignments() {
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [selectedTaluka, setSelectedTaluka] = useState<string | null>(null);

  const [requests, setRequests] = useState<VisitRequest[]>([]);
  const [executives, setExecutives] = useState<FieldExecutive[]>([]);
  
  // Local state to hold manual assignments: requestId -> execId
  const [manualAssignments, setManualAssignments] = useState<Record<string, string>>({});

  const [isLoadingRegions, setIsLoadingRegions] = useState(true);
  const [isLoadingTaluka, setIsLoadingTaluka] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    setIsLoadingRegions(true);
    try {
      const res = await apiRequest("/field-manager/map");
      const data = await res.json();
      const regionData = data.data || [];
      setRegions(regionData);
      
      if (regionData.length > 0 && !selectedTaluka) {
        setSelectedTaluka(regionData[0].taluka);
        fetchTalukaDetails(regionData[0].taluka);
      }
    } catch (err) {
      console.error("Regions error:", err);
    } finally {
      setIsLoadingRegions(false);
    }
  };

  const fetchTalukaDetails = async (taluka: string) => {
    setIsLoadingTaluka(true);
    setManualAssignments({});
    try {
      const res = await apiRequest(`/field-manager/taluka/${encodeURIComponent(taluka)}`);
      const data = await res.json();
      setRequests(data.requests || []);
      setExecutives(data.fieldExecutives || []);
    } catch (err) {
      console.error("Taluka details error:", err);
      setRequests([]);
      setExecutives([]);
    } finally {
      setIsLoadingTaluka(false);
    }
  };

  const handleSmartAssign = async () => {
    if (!selectedTaluka) return;
    
    setIsAssigning(true);
    try {
      const res = await apiRequest("/field-manager/assign/smart", {
        method: "POST",
        body: JSON.stringify({ taluka: selectedTaluka }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert("Success", `Assigned ${data.totalAssigned} visits intelligently!`);
        fetchTalukaDetails(selectedTaluka);
        fetchRegions(); // Update counts
      } else {
        Alert.alert("Error", data.error || "Failed to assign.");
      }
    } catch (err) {
      Alert.alert("Error", "Network error during smart assign.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleBulkAssign = async () => {
    const assignmentsList = Object.keys(manualAssignments).map((reqId) => ({
      requestId: reqId,
      execId: manualAssignments[reqId],
    }));

    if (assignmentsList.length === 0) {
      Alert.alert("Info", "No manual assignments made yet.");
      return;
    }

    setIsAssigning(true);
    try {
      const res = await apiRequest("/field-manager/assign/bulk", {
        method: "POST",
        body: JSON.stringify({ assignments: assignmentsList }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert("Success", `Manually assigned ${data.count} visits.`);
        fetchTalukaDetails(selectedTaluka!);
        fetchRegions();
      } else {
        Alert.alert("Error", data.error || "Failed to bulk assign.");
      }
    } catch (err) {
      Alert.alert("Error", "Network error during bulk assign.");
    } finally {
      setIsAssigning(false);
    }
  };

  const setManualAssign = (reqId: string, execId: string) => {
    setManualAssignments(prev => ({ ...prev, [reqId]: execId }));
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f6f6f8] dark:bg-slate-900">
      <View className="px-4 py-3 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <View className="flex-row items-center gap-2">
          <MaterialIcons name="assignment" size={26} color="#245feb" />
          <Text className="text-lg font-bold dark:text-slate-50">Assign Visits</Text>
        </View>
      </View>

      {/* REGION SELECTOR */}
      <View className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 py-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
          {isLoadingRegions ? (
            <ActivityIndicator size="small" color="#245feb" />
          ) : regions.length === 0 ? (
            <Text className="text-gray-500 dark:text-slate-400">No pending zones.</Text>
          ) : (
            regions.map((region) => {
              const isActive = selectedTaluka === region.taluka;
              return (
                <TouchableOpacity
                  key={region.taluka}
                  onPress={() => {
                    setSelectedTaluka(region.taluka);
                    fetchTalukaDetails(region.taluka);
                  }}
                  className={`mr-3 px-4 py-2 rounded-full border ${isActive ? 'bg-[#245feb] border-[#245feb]' : 'bg-transparent border-gray-300 dark:border-slate-600'}`}
                >
                  <Text className={`font-semibold ${isActive ? 'text-white' : 'text-gray-600 dark:text-slate-300'}`}>
                    {region.taluka} ({region.total_requests})
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* CONTENT */}
      {selectedTaluka && (
        <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 100 }}>
          
          {/* ACTIONS */}
          <View className="flex-row justify-between mb-6">
            <TouchableOpacity
              className="flex-1 mr-2 bg-[#10b981] rounded-xl flex-row items-center justify-center py-3 shadow-md"
              onPress={handleSmartAssign}
              disabled={isAssigning || isLoadingTaluka}
              style={{ opacity: (isAssigning || isLoadingTaluka) ? 0.7 : 1 }}
            >
              <Feather name="zap" size={18} color="white" />
              <Text className="text-white font-bold ml-2">Smart Assign</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 ml-2 bg-[#245feb] rounded-xl flex-row items-center justify-center py-3 shadow-md"
              onPress={handleBulkAssign}
              disabled={isAssigning || isLoadingTaluka}
              style={{ opacity: (isAssigning || isLoadingTaluka) ? 0.7 : 1 }}
            >
              <Feather name="save" size={18} color="white" />
              <Text className="text-white font-bold ml-2">Save Manual</Text>
            </TouchableOpacity>
          </View>

          {/* REQUESTS LIST */}
          <Text className="text-lg font-bold mb-3 dark:text-slate-50">Pending Requests ({requests.length})</Text>
          
          {isLoadingTaluka ? (
            <ActivityIndicator size="large" color="#245feb" className="mt-10" />
          ) : requests.length === 0 ? (
            <View className="bg-white dark:bg-slate-800 p-6 rounded-xl items-center border border-gray-200 dark:border-slate-700">
              <Feather name="check-circle" size={40} color="#10b981" />
              <Text className="text-gray-500 dark:text-slate-400 mt-3 font-medium">All visits sorted here!</Text>
            </View>
          ) : (
            requests.map(req => {
              const currentAssignment = manualAssignments[req.id];
              return (
                <View key={req.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl mb-3 border border-gray-200 dark:border-slate-700">
                  <View className="flex-row justify-between mb-2">
                    <Text className="font-bold text-base dark:text-slate-50">{req.farmer_name}</Text>
                    {req.priority === "HIGH" && (
                      <View className="bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                        <Text className="text-red-600 dark:text-red-400 text-xs font-bold">HIGH</Text>
                      </View>
                    )}
                  </View>
                  
                  <Text className="text-gray-500 dark:text-slate-400 mb-3 text-sm">
                    <Feather name="phone" size={12} /> {req.phone_number}
                  </Text>

                  {/* MINI DROPDOWN FOR EXEC SELECTION */}
                  <View className="bg-gray-50 dark:bg-slate-900 rounded-lg p-2 border border-gray-100 dark:border-slate-700">
                    <Text className="text-xs text-gray-500 dark:text-slate-400 mb-2 uppercase font-semibold">Assign To Executive:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {executives.map(exec => {
                        const isSelected = currentAssignment === exec.id;
                        const isFull = Number(exec.current_load) >= exec.capacity;
                        
                        return (
                          <TouchableOpacity
                            key={exec.id}
                            onPress={() => setManualAssign(req.id, exec.id)}
                            className={`mr-2 px-3 py-1.5 rounded-md border ${isSelected ? 'bg-[#245feb] border-[#245feb]' : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600'}`}
                          >
                            <Text className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-gray-700 dark:text-slate-300'}`}>
                              {exec.name} ({exec.current_load}/{exec.capacity})
                            </Text>
                            {isFull && !isSelected && (
                              <View className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
