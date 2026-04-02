import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { colorScheme, setColorScheme } = useColorScheme();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          setUser(JSON.parse(userDataString));
        } else {
          // Fallback mock user if not logged in
          setUser({
            id: "GE-001",
            name: "Jogi",
            role: "Ground Executive",
            phone: "9988776655",
            email: "jogi@bullconnect.in",
            created_at: "2024-01-01",
          });
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

  const toggleTheme = () => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#f8fafc] dark:bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </SafeAreaView>
    );
  }

  const initials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'GE';

  const InfoCard = ({ icon, label, value }: { icon: any; label: string; value: string }) => (
    <View className="flex-row items-center border-b border-gray-50 dark:border-slate-700/50 py-4 px-2">
      <View className="w-10 h-10 bg-sky-50 dark:bg-slate-700/50 rounded-full items-center justify-center mr-4">
        <MaterialIcons name={icon} size={20} color="#0ea5e9" />
      </View>
      <View className="flex-1">
        <Text className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">{label}</Text>
        <Text className="text-base font-semibold text-gray-900 dark:text-slate-50">{value}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#f8fafc] dark:bg-slate-900">
      {/* Header */}
      <View className="px-6 py-4 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <Text className="text-2xl font-extrabold text-gray-900 dark:text-slate-50">My Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {/* User Card */}
        <View className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 items-center mt-2 mb-6">
          <View className="w-24 h-24 bg-sky-100 dark:bg-sky-900/30 rounded-full items-center justify-center border-4 border-white dark:border-slate-800 shadow-sm mb-4">
            <Text className="text-4xl font-extrabold text-sky-600 dark:text-sky-400">{initials}</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900 dark:text-slate-50 mb-1">{user?.name || 'Unknown User'}</Text>
          <View className="bg-sky-50 dark:bg-sky-900/30 px-3 py-1.5 rounded-full border border-sky-100 dark:border-sky-900/50 mt-2">
            <Text className="text-sky-700 dark:text-sky-300 text-xs font-bold uppercase tracking-wider">{user?.role || 'Ground Executive'}</Text>
          </View>
        </View>

        {/* Preferences Section */}
        <View className="bg-white dark:bg-slate-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 mb-6">
          <Text className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2 mt-2">Preferences</Text>
          <View className="flex-row items-center justify-between py-2 px-2">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-full items-center justify-center mr-4">
                <MaterialIcons name={colorScheme === 'dark' ? 'dark-mode' : 'light-mode'} size={20} color="#4f46e5" />
              </View>
              <Text className="text-base font-semibold text-gray-900 dark:text-slate-50">Dark Mode</Text>
            </View>
            <Switch
              trackColor={{ false: "#cbd5e1", true: "#0ea5e9" }}
              thumbColor={"#ffffff"}
              onValueChange={toggleTheme}
              value={colorScheme === 'dark'}
            />
          </View>
        </View>

        {/* Details Section */}
        <View className="bg-white dark:bg-slate-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 mb-8">
          <Text className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-2 mt-2">Account Information</Text>
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
          className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl py-4 flex-row items-center justify-center shadow-sm"
        >
          <MaterialIcons name="logout" size={22} color="#dc2626" />
          <Text className="text-red-600 dark:text-red-400 font-bold text-lg ml-2">Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}