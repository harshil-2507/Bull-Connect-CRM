import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScrollView } from "react-native";

export default function Index() {
  const [secure, setSecure] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter username and password");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "https://bull-connect-crm.onrender.com/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
            password: password.trim(),
          }),
        }
      );

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("Invalid server response");
      }

      if (!response.ok) {
        Alert.alert("Login Failed", data.error || "Invalid credentials");
        return;
      }

      await AsyncStorage.setItem("authToken", data.token);
      await AsyncStorage.setItem("userData", JSON.stringify(data.user));

      const userRole = data.user.role;

      switch (userRole) {
        case "MANAGER":
          router.replace("/manager");
          break;
        case "TELECALLER":
          router.replace("/telecaller");
          break;
        case "GROUND_MANAGER":
          router.replace("/groundmanager");
          break;
        case "GROUND_EXECUTIVE":
          router.replace("/groundexecutive");
          break;
        default:
          Alert.alert("Login Failed", "Unauthorized role");
      }

    } catch (error) {
      let errorMessage = "Server connection failed";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
  <SafeAreaView className="flex-1 bg-[#f6f6f8]">
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      {/* ✅ ADD ScrollView */}
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 20,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
          
          {/* Header */}
          <View className="items-center px-6 pt-8 pb-4">
            <View className="w-12 h-12 rounded-lg bg-blue-100 items-center justify-center mb-4">
              <MaterialIcons name="auto-awesome" size={28} color="#245feb" />
            </View>

            <Text className="text-2xl font-bold text-gray-900">
              Bull Connect
            </Text>
          </View>

          {/* Form */}
          <View className="px-6 pt-2 pb-6">
            
            {/* Username */}
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Username
            </Text>
            <View className="relative mb-4">
              <TextInput
                placeholder="johndoe@example.com"
                value={username}
                onChangeText={setUsername}
                className="bg-gray-100 border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-gray-900"
                placeholderTextColor="#9ca3af"
              />
              <Feather
                name="user"
                size={18}
                color="#9ca3af"
                style={{ position: "absolute", left: 12, top: 14 }}
              />
            </View>

            {/* Password */}
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Password
            </Text>

            <View className="relative mb-5">
              <TextInput
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secure}
                className="bg-gray-100 border border-gray-200 rounded-lg pl-10 pr-12 py-3 text-gray-900"
                placeholderTextColor="#9ca3af"
              />
              <Feather
                name="lock"
                size={18}
                color="#9ca3af"
                style={{ position: "absolute", left: 12, top: 14 }}
              />
              <TouchableOpacity
                onPress={() => setSecure(!secure)}
                style={{ position: "absolute", right: 12, top: 12 }}
              >
                <Feather
                  name={secure ? "eye-off" : "eye"}
                  size={18}
                  color="#9ca3af"
                />
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className={`py-3 rounded-lg flex-row items-center justify-center ${
                loading ? "bg-blue-300" : "bg-[#245feb]"
              }`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className="text-white font-bold mr-2">Login</Text>
                  <MaterialIcons name="login" size={18} color="white" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
);
}