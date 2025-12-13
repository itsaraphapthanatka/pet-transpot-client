import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, TextInput, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { router } from 'expo-router';
import { AppButton } from '../../../components/ui/AppButton';
import { ArrowLeft, MapPin, Clock, CreditCard, StickyNote, ChevronRight, Wallet } from 'lucide-react-native';
import { MOCK_RIDE_OPTIONS } from '../../../utils/mockData';

export default function ConfirmBookingScreen() {
    const [selectedVehicle, setSelectedVehicle] = useState(MOCK_RIDE_OPTIONS[0]);
    const [note, setNote] = useState('');

    const handleBook = () => {
        // Show mock finding driver
        Alert.alert(
            "Looking for drivers...",
            "We are connecting you with nearby pet transporters.",
            [
                { text: "Cancel", style: 'cancel' },
                { text: "OK", onPress: () => router.replace('/(customer)/(tabs)/home') } // Should go to Trip screen
            ]
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1">
                <View className="px-5 pt-2 flex-row items-center mb-6">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4">
                        <ArrowLeft size={24} color="black" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold">Confirm Booking</Text>
                </View>

                <ScrollView className="px-5">
                    {/* Map Preview */}
                    <View className="w-full h-40 bg-gray-100 rounded-xl mb-6 overflow-hidden border border-gray-200">
                        <MapView
                            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                            style={{ width: '100%', height: '100%' }}
                            initialRegion={{
                                latitude: 13.7563,
                                longitude: 100.5018,
                                latitudeDelta: 0.1,
                                longitudeDelta: 0.1,
                            }}
                            scrollEnabled={false}
                            zoomEnabled={false}
                        >
                            <Marker
                                coordinate={{ latitude: 13.7563, longitude: 100.5018 }}
                                title="Pick Up"
                                description="My Home"
                            >
                                <View className="bg-blue-500 p-2 rounded-full border-2 border-white shadow-sm">
                                    <MapPin size={12} color="white" />
                                </View>
                            </Marker>
                            <Marker
                                coordinate={{ latitude: 13.7469, longitude: 100.5349 }} // Siam Paragon approx coords
                                title="Drop Off"
                                description="Siam Paragon"
                            >
                                <View className="bg-red-500 p-2 rounded-full border-2 border-white shadow-sm">
                                    <MapPin size={12} color="white" />
                                </View>
                            </Marker>
                        </MapView>
                    </View>

                    {/* Route Details */}
                    <View className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <View className="flex-row items-start mb-4 relative">
                            <View className="absolute left-[9px] top-6 bottom-[-10px] w-[2px] bg-gray-300" />
                            <MapPin size={20} color="#3B82F6" className="mr-3 mt-1" />
                            <View className="flex-1">
                                <Text className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">Pick Up</Text>
                                <Text className="font-semibold text-gray-800 text-base">My Home</Text>
                                <Text className="text-gray-400 text-xs">123 Sukhumvit Road</Text>
                            </View>
                        </View>
                        <View className="flex-row items-start">
                            <MapPin size={20} color="#EF4444" className="mr-3 mt-1" />
                            <View className="flex-1">
                                <Text className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">Drop Off</Text>
                                <Text className="font-semibold text-gray-800 text-base">Siam Paragon</Text>
                                <Text className="text-gray-400 text-xs">991 Rama I Rd</Text>
                            </View>
                        </View>
                    </View>

                    {/* Vehicle Selection Carousel */}
                    <Text className="font-bold text-lg mb-4 text-gray-900">Choose Vehicle</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-6 overflow-visible pr-5">
                        {MOCK_RIDE_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                onPress={() => setSelectedVehicle(option)}
                                className={`mr-3 p-3 rounded-2xl border-2 w-40 ${selectedVehicle.id === option.id ? 'border-primary bg-green-50' : 'border-gray-200 bg-white'}`}
                            >
                                <View className="mb-2">
                                    <View className="w-10 h-10 bg-gray-100 rounded-lg items-center justify-center">
                                        {/* Replace with Image later */}
                                        <Text className="text-xl">🚗</Text>
                                    </View>
                                </View>
                                <Text className="font-bold text-gray-800 mb-1">{option.name}</Text>
                                <Text className="text-gray-500 text-xs mb-2 leading-4 h-8" numberOfLines={2}>{option.description}</Text>
                                <Text className="font-bold text-lg text-primary">฿{option.price}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Payment Method */}
                    <TouchableOpacity className="flex-row items-center justify-between p-4 bg-white border border-gray-200 rounded-xl mb-4 shadow-sm">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
                                <Wallet size={20} color="#00C853" />
                            </View>
                            <View>
                                <Text className="font-semibold text-gray-800">Cash Payment</Text>
                                <Text className="text-xs text-gray-500">Pay directly to driver</Text>
                            </View>
                        </View>
                        <ChevronRight size={20} color="gray" />
                    </TouchableOpacity>

                    {/* Notes */}
                    <View className="flex-row items-center bg-gray-50 p-4 rounded-xl border border-gray-200 mb-20">
                        <StickyNote size={20} color="gray" className="mr-3" />
                        <TextInput
                            placeholder="Note to driver (e.g.waiting at lobby)"
                            value={note}
                            onChangeText={setNote}
                            className="flex-1 text-gray-800 font-medium"
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>

                </ScrollView>
            </View>

            <View className="p-5 border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] bg-white">
                <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-500">Distance (5.2km)</Text>
                    <Text className="font-semibold text-gray-800">฿{selectedVehicle.price - 20}</Text>
                </View>
                <View className="flex-row justify-between mb-4 pb-4 border-b border-gray-100">
                    <Text className="text-gray-500">Pet Surcharge</Text>
                    <Text className="font-semibold text-gray-800">฿20</Text>
                </View>

                <View className="flex-row justify-between mb-6">
                    <Text className="text-lg font-bold text-gray-900">Total</Text>
                    <Text className="text-2xl font-bold text-primary">฿{selectedVehicle.price}</Text>
                </View>
                <AppButton
                    title="Confirm Booking"
                    onPress={handleBook}
                    size="lg"
                />
            </View>
        </SafeAreaView>
    );
}
