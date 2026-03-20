import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { apiRequest } from '../utils/api';

interface Props {
  onBack?: () => void;
  onSuccess?: () => void;
}

export default function NewLeadForm({ onBack, onSuccess }: Props) {
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<any>({
    state: 'Gujarat',
    status: 'NEW',
    campaign_id: '286ffa2f-fb2f-489b-867f-66997dfd8aa5'
  });

  const handleCreateLead = async () => {
    if (!editForm.farmer_name || !editForm.phone_number || !editForm.district || !editForm.village) {
      Alert.alert('Missing Fields', 'Please fill all required fields: Farmer Name, Phone, District, and Village.');
      return;
    }

    try {
      setSaving(true);
      
      const payload = {
        ...editForm,
        acreage: editForm.acreage ? Number(editForm.acreage) : null,
        total_land_bigha: editForm.total_land_bigha ? Number(editForm.total_land_bigha) : null,
        castor_bori: editForm.castor_bori ? Number(editForm.castor_bori) : null,
        castor_expected_price: editForm.castor_expected_price ? Number(editForm.castor_expected_price) : null,
        groundnut_bori: editForm.groundnut_bori ? Number(editForm.groundnut_bori) : null,
        groundnut_expected_price: editForm.groundnut_expected_price ? Number(editForm.groundnut_expected_price) : null,
      };

      const res = await apiRequest('/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create lead');
      
      Alert.alert('Success', 'Lead created successfully');
      if (onSuccess) onSuccess();
      else if (onBack) onBack();
    } catch (error: any) {
      console.log(error);
      Alert.alert('Error', error.message || 'Failed to create lead');
    } finally {
      setSaving(false);
    }
  };

  const renderField = (label: string, fieldName: string, multiline: boolean = false, required: boolean = false) => {
    const val = editForm[fieldName];
    const displayVal = val === null || val === undefined ? '' : String(val);

    return (
      <View className="mb-4" key={fieldName}>
        <Text className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
          {label} {required && <Text className="text-red-500">*</Text>}
        </Text>
        <TextInput
          className="bg-gray-100 rounded-lg px-3 py-2 text-gray-900 border border-gray-200"
          value={displayVal}
          onChangeText={(text) => setEditForm((prev: any) => ({ ...prev, [fieldName]: text }))}
          placeholder={`Enter ${label}`}
          multiline={multiline}
          style={multiline ? { minHeight: 80, textAlignVertical: 'top' } : {}}
        />
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center gap-2">
          <TouchableOpacity onPress={() => onBack && onBack()} className="p-2">
            <MaterialIcons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">New Lead Details</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity onPress={handleCreateLead} disabled={saving} className="bg-blue-600 px-4 py-1.5 rounded-full">
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white font-bold">Create</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Info Sections */}
        <View className="px-4 mt-6">
          {/* Card: Basic Info */}
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
            <View className="flex-row items-center gap-2 mb-4 border-b border-gray-50 pb-2">
              <MaterialIcons name="info" size={20} color="#2563eb" />
              <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider">Basic Info</Text>
            </View>
            {renderField("Farmer Name", "farmer_name", false, true)}
            {renderField("Phone", "phone_number", false, true)}
            {renderField("Alternate Phone", "alternate_phone")}
            {renderField("Village", "village", false, true)}
            {renderField("Taluka", "taluka")}
            {renderField("District", "district", false, true)}
            {renderField("State", "state")}
            {renderField("Geo State", "geo_state")}
          </View>

          {/* Card: Farming Details */}
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
             <View className="flex-row items-center gap-2 mb-4 border-b border-gray-50 pb-2">
              <MaterialIcons name="eco" size={20} color="#16a34a" />
              <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider">Farming Details</Text>
             </View>
             {renderField("Farmer Type", "farmer_type")}
             {renderField("Total Land (Bigha)", "total_land_bigha")}
             {renderField("Crop Type", "crop_type")}
             {renderField("Acreage", "acreage")}
             {renderField("Bull Centre", "bull_centre")}
          </View>

          {/* Card: Castor Crop */}
           <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
             <View className="flex-row items-center gap-2 mb-4 border-b border-gray-50 pb-2">
              <MaterialIcons name="spa" size={20} color="#b45309" />
              <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider">Castor Crop Details</Text>
             </View>
             {renderField("Castor Bori", "castor_bori")}
             {renderField("Castor Expected Price", "castor_expected_price")}
             {renderField("Castor Offered Price", "castor_offered_price")}
             {renderField("Castor Expected Harvest Time", "castor_expected_harvest_time")}
             {renderField("Castor Vavetar Bigha", "castor_vavetar_bigha")}
          </View>

          {/* Card: Groundnut Crop */}
           <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
              <View className="flex-row items-center gap-2 mb-4 border-b border-gray-50 pb-2">
              <MaterialIcons name="spa" size={20} color="#b45309" />
               <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider">Groundnut Crop Details</Text>
             </View>
             {renderField("Groundnut Bori", "groundnut_bori")}
             {renderField("Groundnut Expected Price", "groundnut_expected_price")}
             {renderField("Groundnut Offered Price", "groundnut_offered_price")}
             {renderField("Groundnut Expected Harvest Time", "groundnut_expected_harvest_time")}
             {renderField("Groundnut Vavetar Bigha", "groundnut_vavetar_bigha")}
          </View>

          {/* Card: Additional Info */}
           <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
             <View className="flex-row items-center gap-2 mb-4 border-b border-gray-50 pb-2">
               <MaterialIcons name="post-add" size={20} color="#9333ea" />
               <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider">Additional Information</Text>
             </View>
             {renderField("Interested in Warehouse", "interested_in_warehouse")}
             {renderField("Previous Experience", "previous_experience")}
             {renderField("Experience / Remarks", "experience_or_remarks", true)}
             {renderField("Source", "source")}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}