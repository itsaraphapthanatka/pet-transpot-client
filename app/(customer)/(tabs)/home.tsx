import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Platform, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Search, MapPin, Bike, Car, Truck, Menu, Bell } from 'lucide-react-native';
import { useAuthStore } from '../../../store/useAuthStore';
import { MOCK_RIDE_OPTIONS } from '../../../utils/mockData';
import { router } from 'expo-router';

export default function CustomerHome() {
    const { user } = useAuthStore();
    const { t } = useTranslation();

    return (
        <View className="flex-1 bg-white">
            <MapView
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                style={StyleSheet.absoluteFillObject}
                initialRegion={{
                    latitude: 13.7563,
                    longitude: 100.5018,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
            >
                {/* Mock Driver */}
                <Marker coordinate={{ latitude: 13.7563, longitude: 100.5018 }}>
                    <View className="bg-white p-1.5 rounded-full border border-green-500 shadow-sm">
                        <Car size={16} color="black" />
                    </View>
                </Marker>
            </MapView>

            {/* Top Header */}
            <SafeAreaView className="absolute top-0 w-full px-5 pt-2 flex-row justify-between items-center z-10">
                <View className="flex-row items-center bg-white/90 p-2 pr-4 rounded-full shadow-md backdrop-blur-md">
                    <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center mr-2">
                        <Text className="text-lg">👤</Text>
                    </View>
                    <View>
                        <Text className="text-xs text-gray-500">{t('home_screen.good_morning')}</Text>
                        <Text className="text-sm font-bold text-gray-800">{user?.name || t('home_screen.guest')}</Text>
                    </View>
                </View>

                <TouchableOpacity className="bg-white p-2.5 rounded-full shadow-md">
                    <Bell size={20} color="black" />
                </TouchableOpacity>
            </SafeAreaView>

            {/* Bottom Panel */}
            <View className="absolute bottom-0 w-full bg-white rounded-t-3xl shadow-2xl elevation-10 pb-5 pt-6 px-5 h-[40%] z-50">

                {/* Search Trigger */}
                <TouchableOpacity
                    onPress={() => router.push('/(customer)/booking/destination')}
                    className="flex-row items-center bg-gray-100 p-4 rounded-xl mb-6 border border-gray-200 shadow-sm"
                >
                    <Search size={22} color="#6B7280" className="mr-3" />
                    <View>
                        <Text className="text-lg font-bold text-gray-800">{t('where_to')}</Text>
                        <Text className="text-xs text-gray-500">{t('home_screen.transport_safely')}</Text>
                    </View>
                </TouchableOpacity>

                {/* Quick Actions (Vehicles) */}
                {/* <View>
                    <Text className="text-base font-bold text-gray-800 mb-4">{t('choose_vehicle')}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row pb-4">
                        {MOCK_RIDE_OPTIONS.map((option) => (
                            <TouchableOpacity key={option.id} className="mr-4 items-center">
                                <View className="w-20 h-20 bg-green-50 rounded-2xl items-center justify-center border border-green-100 mb-2 shadow-sm">
                                    {option.id === 'bike' && <Bike size={32} color="#00A862" />}
                                    {option.id === 'car' && <Car size={32} color="#2962FF" />}
                                    {option.id === 'van' && <Truck size={32} color="#FF9100" />}
                                </View>
                                <Text className="font-semibold text-gray-700 text-sm">{option.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View> */}

            </View>
        </View>
    );
}
