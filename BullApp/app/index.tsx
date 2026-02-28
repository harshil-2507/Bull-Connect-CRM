import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

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
        "http://10.233.21.128:3000/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // ⚠️ If backend expects "name" instead of "username",
            // change this to: name: username.trim()
            username: username.trim(),
            password: password.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid credentials");
      }

      // ✅ Store token securely
      await SecureStore.setItemAsync("authToken", data.token);
      await SecureStore.setItemAsync("user", JSON.stringify(data.user));

      // Navigate and prevent going back to login
      const role = data.user.role;

if (role === "TELECALLER") {
  router.replace("/telecaller");
} else if (role === "MANAGER") {
  router.replace("/manager")
} else {
  Alert.alert("Access Denied", "Unauthorized role");
}
    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#fafbf9]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header Section */}
        <View className="h-[260px] relative">
          <ImageBackground
            source={{
              uri: "https://images.unsplash.com/photo-1500382017468-9049fed747ef",
            }}
            resizeMode="cover"
            className="flex-1 opacity-30"
          />
          <View className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-transparent" />

          <View className="absolute bottom-8 w-full items-center">
            <View className="bg-white p-4 rounded-2xl shadow-md border border-gray-100">
              <MaterialIcons
                name="agriculture"
                size={32}
                color="#0ea633"
              />
            </View>

            <Text className="text-3xl font-bold text-[#1a4d2e] mt-4">
              Bull Connect
            </Text>
            <Text className="text-gray-500 text-sm mt-1">
              CRM for Modern Agriculture
            </Text>
          </View>
        </View>

        {/* Form */}
        <View className="flex-1 px-8 pt-10">
          {/* Username */}
          <View className="mb-5 relative">
            <TextInput
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholderTextColor="#9ca3af"
              className="bg-white h-12 rounded-lg border border-gray-200 pl-11 pr-4 shadow-sm"
            />
            <Feather
              name="user"
              size={18}
              color="#9ca3af"
              style={{ position: "absolute", left: 14, top: 15 }}
            />
          </View>

          {/* Password */}
          <View className="relative">
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secure}
              placeholderTextColor="#9ca3af"
              className="bg-white h-12 rounded-lg border border-gray-200 pl-11 pr-12 shadow-sm"
            />
            <Feather
              name="lock"
              size={18}
              color="#9ca3af"
              style={{ position: "absolute", left: 14, top: 15 }}
            />
            <TouchableOpacity
              onPress={() => setSecure(!secure)}
              style={{ position: "absolute", right: 14, top: 14 }}
            >
              <Feather
                name={secure ? "eye-off" : "eye"}
                size={18}
                color="#9ca3af"
              />
            </TouchableOpacity>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className={`mt-10 py-4 rounded-lg shadow-lg ${
              loading ? "bg-green-300" : "bg-[#13ec49]"
            }`}
          >
            <View className="flex-row items-center justify-center">
              {loading ? (
                <ActivityIndicator color="black" />
              ) : (
                <>
                  <Text className="font-bold text-lg text-black mr-2">
                    Sign In
                  </Text>
                  <Feather name="arrow-right" size={18} color="black" />
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}