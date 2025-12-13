import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Platform, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../../components/ui/AppButton';
import { Phone, MessageCircle, MapPin, CheckCircle } from 'lucide-react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

export default function ActiveJobScreen() {
    const { id } = useLocalSearchParams();
    const [status, setStatus] = useState<'pickup' | 'dropoff' | 'completed'>('pickup');

    const handleAction = () => {
        if (status === 'pickup') {
            setStatus('dropoff');
        } else if (status === 'dropoff') {
            setStatus('completed');
            Alert.alert("Job Completed", "Payment collected: ฿150", [
                { text: "OK", onPress: () => router.back() }
            ]);
        }
    };

    return (
        <View className="flex-1 bg-white">
            {/* Map Placeholder */}
            <MapView
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                style={{ flex: 1, width: '100%' }}
                initialRegion={{
                    latitude: 13.7563,
                    longitude: 100.5018,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
            >
                <Marker coordinate={{ latitude: 13.7563, longitude: 100.5018 }} title="Pickup" />
            </MapView>

            {/* Persistent Bottom Sheet */}
            <View className="bg-white rounded-t-3xl shadow-2xl p-6 h-[45%]">

                <View className="flex-row justify-between items-center mb-6">
                    <View>
                        <Text className="text-gray-500 text-xs text-transform uppercase tracking-wider mb-1">
                            {status === 'pickup' ? 'Picking Up' : 'Dropping Off'}
                        </Text>
                        <Text className="text-xl font-bold text-gray-900">
                            {status === 'pickup' ? 'Siam Paragon' : 'Thong Lor Pet Hospital'}
                        </Text>
                    </View>
                    <View className="bg-green-100 flex-row items-center px-3 py-1 rounded-full">
                        <Text className="text-green-600 font-bold text-lg">15</Text>
                        <Text className="text-green-600 text-xs ml-1">min</Text>
                    </View>
                </View>

                {/* Customer Info */}
                <View className="flex-row items-center justify-between border-t border-b border-gray-100 py-4 mb-6">
                    <View className="flex-row items-center">
                        <View className="w-12 h-12 bg-gray-200 rounded-full items-center justify-center mr-3">
                            <Text className="text-xl">👤</Text>
                        </View>
                        <View>
                            <Text className="font-bold text-gray-800">Khun Somchai</Text>
                            <Text className="text-gray-500 text-xs">Dog (Golden Retriever)</Text>
                        </View>
                    </View>
                    <View className="flex-row space-x-3">
                        <TouchableOpacity className="bg-gray-100 p-3 rounded-full">
                            <MessageCircle size={20} color="black" />
                        </TouchableOpacity>
                        <TouchableOpacity className="bg-green-500 p-3 rounded-full">
                            <Phone size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                <AppButton
                    title={status === 'pickup' ? 'Arrived at Pickup' : 'Complete Job'}
                    onPress={handleAction}
                    className={status === 'dropoff' ? 'bg-red-500' : 'bg-green-600'}
                />
            </View>
        </View>
    );
}
