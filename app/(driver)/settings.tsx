import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import Slider from '@react-native-community/slider';
import { api } from '../../services/api';
import { AppButton } from '../../components/ui/AppButton';
import { useAuthStore } from '../../store/useAuthStore';

export default function DriverSettingsScreen() {
    const { user } = useAuthStore();
    const [workRadius, setWorkRadius] = useState(10);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch current driver settings on mount
    useEffect(() => {
        const fetchDriverSettings = async () => {
            try {
                const locations = await api.getDriverLocations();
                const currentDriver = locations.find(loc => loc.driver?.user?.id === user?.id);
                if (currentDriver?.driver?.work_radius_km) {
                    setWorkRadius(currentDriver.driver.work_radius_km);
                }
            } catch (error) {
                console.error('Failed to fetch driver settings:', error);
            }
        };

        if (user?.id) {
            fetchDriverSettings();
        }
    }, [user?.id]);

    const handleSaveWorkRadius = async () => {
        setIsSaving(true);
        try {
            await api.updateDriverWorkRadius(workRadius);
            Alert.alert('สำเร็จ', `อัพเดทรัศมีการทำงาน ${workRadius} กม. แล้ว`);
        } catch (error) {
            console.error('Failed to update work radius:', error);
            Alert.alert('ข้อผิดพลาด', 'ไม่สามารถอัพเดทรัศมีการทำงานได้ กรุณาลองใหม่อีกครั้ง');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white px-5 py-4 flex-row items-center border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <ArrowLeft size={24} color="#000" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-800">Settings</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {/* Work Radius Setting */}
                <View className="bg-white rounded-xl shadow-sm p-5">
                    <Text className="text-lg font-bold text-gray-800 mb-2">รัศมีการทำงาน</Text>
                    <Text className="text-gray-500 text-sm mb-4">
                        กำหนดระยะทางที่คุณพร้อมรับงาน
                    </Text>

                    <View className="flex-row justify-between items-center mb-3">
                        <Text className="text-gray-600">2 กม.</Text>
                        <Text className="text-2xl font-bold text-green-600">{workRadius.toFixed(0)} กม.</Text>
                        <Text className="text-gray-600">50 กม.</Text>
                    </View>

                    <Slider
                        style={{ width: '100%', height: 40 }}
                        minimumValue={2}
                        maximumValue={50}
                        step={1}
                        value={workRadius}
                        onValueChange={setWorkRadius}
                        minimumTrackTintColor="#00A862"
                        maximumTrackTintColor="#E5E7EB"
                        thumbTintColor="#00A862"
                    />

                    <View className="bg-blue-50 p-3 rounded-lg mt-4 mb-4">
                        <Text className="text-blue-700 text-sm">
                            💡 คุณจะเห็นเฉพาะงานที่อยู่ในรัศมี {workRadius} กม. จากตำแหน่งของคุณ
                        </Text>
                    </View>

                    <AppButton
                        title={isSaving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
                        onPress={handleSaveWorkRadius}
                        disabled={isSaving}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
