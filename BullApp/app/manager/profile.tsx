import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          setUser(JSON.parse(userDataString));
        }
      } catch (error) {
        console.error('Error fetching user data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out of your account?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('authToken');
              await AsyncStorage.removeItem('userData');
              router.replace('/');
            } catch (error) {
              console.error('Error logging out', error);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  const initials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

  const InfoCard = ({ icon, label, value }: { icon: any; label: string; value: string }) => (
    <View className="flex-row items-center border-b border-gray-50 py-4 px-2">
      <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-4">
        <MaterialIcons name={icon} size={20} color="#2563eb" />
      </View>
      <View className="flex-1">
        <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</Text>
        <Text className="text-base font-semibold text-gray-900">{value}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-200">
        <Text className="text-2xl font-extrabold text-gray-900">My Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {/* User Card */}
        <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 items-center mt-2 mb-6">
          <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center border-4 border-white shadow-sm mb-4">
            <Text className="text-4xl font-extrabold text-blue-600">{initials}</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-1">{user?.name || 'Unknown User'}</Text>
          <View className="bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 mt-2">
            <Text className="text-blue-700 text-xs font-bold uppercase tracking-wider">{user?.role || 'User'}</Text>
          </View>
        </View>

        {/* Details Section */}
        <View className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 mb-8">
          <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider px-2 mb-2 mt-2">Account Information</Text>
          <InfoCard icon="phone" label="Phone Number" value={user?.phone || 'Not provided'} />
          <InfoCard icon="mail" label="Email Address" value={user?.email || 'Not provided'} />
          <InfoCard 
            icon="calendar-today" 
            label="Member Since" 
            value={user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'} 
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          onPress={handleLogout}
          className="bg-red-50 border border-red-100 rounded-2xl py-4 flex-row items-center justify-center shadow-sm"
        >
          <MaterialIcons name="logout" size={22} color="#dc2626" />
          <Text className="text-red-600 font-bold text-lg ml-2">Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}