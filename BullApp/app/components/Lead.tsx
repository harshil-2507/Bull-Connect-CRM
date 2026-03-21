import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { apiRequest } from '../utils/api';
import { useRouter } from 'expo-router';

export default function Lead({ id, onBack }: { id: string, onBack?: () => void }) {
  const router = useRouter();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const fetchLead = async () => {
    try {
      setLoading(true);
      const res = await apiRequest(`/leads/${id}`);
      const json = await res.json();
      setLead(json);
      setEditForm(json);
    } catch (e) {
      console.log(e);
      Alert.alert('Error', 'Failed to fetch lead details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchLead();
  }, [id]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await apiRequest(`/leads/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error('Failed to update');
      const json = await res.json();
      setLead(json.lead || editForm);
      setIsEditing(false);
      Alert.alert('Success', 'Lead updated successfully');
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to update lead');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View className="flex-1 items-center justify-center p-8 bg-gray-50 dark:bg-slate-900"><ActivityIndicator size="large" color="#2563eb" /></View>;
  if (!lead) return <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-slate-900"><Text className="text-gray-900 dark:text-slate-50">Lead not found</Text></View>;

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.split(" ");
    return parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0][0];
  };

  const renderField = (label: string, fieldName: string, multiline: boolean = false) => {
    const val = editForm[fieldName];
    const displayVal = val === null || val === undefined ? '' : String(val);

    return (
      <View className="mb-4" key={fieldName}>
        <Text className="text-xs font-bold text-gray-500 dark:text-slate-500 mb-1 uppercase tracking-wider">{label}</Text>
        {isEditing ? (
           <TextInput
            className="bg-gray-100 dark:bg-slate-700/50 rounded-lg px-3 py-2 text-gray-900 dark:text-slate-50 border border-gray-200 dark:border-slate-600"
            value={displayVal}
            onChangeText={(text) => setEditForm((prev: any) => ({ ...prev, [fieldName]: text }))}
            placeholder={`Enter ${label}`}
            placeholderTextColor="#9ca3af"
            multiline={multiline}
            style={multiline ? { minHeight: 80, textAlignVertical: 'top' } : {}}
          />
        ) : (
          <Text className="text-base font-medium text-gray-900 dark:text-slate-100">{displayVal || '—'}</Text>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
        <View className="flex-row items-center gap-2">
          <TouchableOpacity onPress={() => { if (onBack) onBack(); else router.back(); }} className="p-2">
            <MaterialIcons name="arrow-back" size={24} color="#9ca3af" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-slate-50">Lead Details</Text>
        </View>
        <View className="flex-row items-center gap-2">
          {isEditing ? (
            <TouchableOpacity onPress={handleSave} disabled={saving} className="bg-blue-600 px-4 py-1.5 rounded-full">
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white font-bold">Save</Text>}
            </TouchableOpacity>
          ) : (
             <TouchableOpacity onPress={() => setIsEditing(true)} className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full">
              <MaterialIcons name="edit" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
         {/* Profile Card */}
        <View className="items-center bg-white dark:bg-slate-800 px-6 pt-6 pb-4 border-b border-gray-100 dark:border-slate-700">
           <View className="h-24 w-24 bg-blue-100 dark:bg-blue-900/30 rounded-full items-center justify-center border-4 border-white dark:border-slate-800 shadow-sm mb-3">
             <Text className="text-3xl font-bold text-blue-600 dark:text-blue-400">{getInitials(editForm.farmer_name)}</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900 dark:text-slate-50 mb-1 text-center">{editForm.farmer_name || 'N/A'}</Text>
           <Text className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-3 text-center">
            {editForm.village || 'Unknown Village'} @ {editForm.taluka || 'Unknown Taluka'}
           </Text>
          <View className="flex-row items-center gap-2">
            <View className="bg-blue-50 dark:bg-blue-900/40 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900/50">
              <Text className="text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">{editForm.status || 'NEW'}</Text>
            </View>
            <View className="bg-gray-100 dark:bg-slate-700 px-3 py-1 rounded-full border border-gray-200 dark:border-slate-600">
              <Text className="text-gray-700 dark:text-gray-300 text-xs font-bold uppercase tracking-wider">PRIORITY: {editForm.priority || 0}</Text>
            </View>
          </View>
        </View>

        {/* Info Sections */}
        <View className="px-4 mt-6">
          {/* Card: Basic Info */}
          <View className="bg-white dark:bg-slate-800 rounded-2xl p-5 mb-4 shadow-sm border border-gray-100 dark:border-slate-700">
            <View className="flex-row items-center gap-2 mb-4 border-b border-gray-50 dark:border-slate-700/50 pb-2">
              <MaterialIcons name="info" size={20} color="#3b82f6" />
              <Text className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Basic Info</Text>
            </View>
            {renderField("Farmer Name", "farmer_name")}
            {renderField("Phone", "phone_number")}
            {renderField("Alternate Phone", "alternate_phone")}
            {renderField("Village", "village")}
            {renderField("Taluka", "taluka")}
            {renderField("District", "district")}
            {renderField("State", "state")}
            {renderField("Geo State", "geo_state")}
          </View>

          {/* Card: Farming Details */}
          <View className="bg-white dark:bg-slate-800 rounded-2xl p-5 mb-4 shadow-sm border border-gray-100 dark:border-slate-700">
             <View className="flex-row items-center gap-2 mb-4 border-b border-gray-50 dark:border-slate-700/50 pb-2">
              <MaterialIcons name="eco" size={20} color="#22c55e" />
              <Text className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Farming Details</Text>
             </View>
             {renderField("Farmer Type", "farmer_type")}
             {renderField("Total Land (Bigha)", "total_land_bigha")}
             {renderField("Crop Type", "crop_type")}
             {renderField("Acreage", "acreage")}
             {renderField("Bull Centre", "bull_centre")}
             {renderField("Farmer ID", "farmer_id")}
          </View>

          {/* Card: Castor Crop */}
           <View className="bg-white dark:bg-slate-800 rounded-2xl p-5 mb-4 shadow-sm border border-gray-100 dark:border-slate-700">
             <View className="flex-row items-center gap-2 mb-4 border-b border-gray-50 dark:border-slate-700/50 pb-2">
              <MaterialIcons name="spa" size={20} color="#ea580c" />
              <Text className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Castor Crop Details</Text>
             </View>
             {renderField("Castor Bori", "castor_bori")}
             {renderField("Castor Expected Price", "castor_expected_price")}
             {renderField("Castor Offered Price", "castor_offered_price")}
             {renderField("Castor Expected Harvest Time", "castor_expected_harvest_time")}
             {renderField("Castor Vavetar Bigha", "castor_vavetar_bigha")}
             {renderField("Castor Deal Status", "castor_deal_status")}
             {renderField("Castor Intent To Sell", "castor_intent_to_sell")}
          </View>

          {/* Card: Groundnut Crop */}
           <View className="bg-white dark:bg-slate-800 rounded-2xl p-5 mb-4 shadow-sm border border-gray-100 dark:border-slate-700">
              <View className="flex-row items-center gap-2 mb-4 border-b border-gray-50 dark:border-slate-700/50 pb-2">
              <MaterialIcons name="spa" size={20} color="#ea580c" />
               <Text className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Groundnut Crop Details</Text>
             </View>
             {renderField("Groundnut Bori", "groundnut_bori")}
             {renderField("Groundnut Expected Price", "groundnut_expected_price")}
             {renderField("Groundnut Offered Price", "groundnut_offered_price")}
             {renderField("Groundnut Expected Harvest Time", "groundnut_expected_harvest_time")}
             {renderField("Groundnut Vavetar Bigha", "groundnut_vavetar_bigha")}
             {renderField("Groundnut Intent To Sell", "groundnut_intent_to_sell")}
          </View>

          {/* Card: Additional Info */}
           <View className="bg-white dark:bg-slate-800 rounded-2xl p-5 mb-4 shadow-sm border border-gray-100 dark:border-slate-700">
             <View className="flex-row items-center gap-2 mb-4 border-b border-gray-50 dark:border-slate-700/50 pb-2">
               <MaterialIcons name="post-add" size={20} color="#9333ea" />
               <Text className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Additional Information</Text>
             </View>
             {renderField("Interested in Warehouse", "interested_in_warehouse")}
             {renderField("Previous Experience", "previous_experience")}
             {renderField("Sold Before Bull", "sold_before_bull")}
             {renderField("Sold After Bull", "sold_after_bull")}
             {renderField("Experience / Remarks", "experience_or_remarks", true)}
             {renderField("Source", "source")}
             {renderField("Product Type", "product_type")}
          </View>

          {/* Card: Campaign & Status */}
          <View className="bg-white dark:bg-slate-800 rounded-2xl p-5 mb-4 shadow-sm border border-gray-100 dark:border-slate-700">
             <View className="flex-row items-center gap-2 mb-4 border-b border-gray-50 dark:border-slate-700/50 pb-2">
               <MaterialIcons name="campaign" size={20} color="#db2777" />
               <Text className="text-sm font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Campaign & Status Info</Text>
             </View>
             {renderField("Campaign ID", "campaign_id")}
             {renderField("Status", "status")}
             {renderField("Assigned To", "assigned_to")}
             {renderField("Priority", "priority")}
             {renderField("Attempt Count", "attempt_count")}
             {renderField("Last Contacted At", "last_contacted_at")}
             {renderField("Next Callback At", "next_callback_at")}
             {renderField("Last Call Duration", "last_call_duration")}
             {renderField("Drop Reason", "drop_reason")}
             {renderField("Drop Notes", "drop_notes", true)}
           </View>
        </View>
      </ScrollView>
    </View>
  );
}