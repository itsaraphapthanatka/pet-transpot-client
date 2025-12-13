import React, { useState } from 'react';
import { View, Text, Switch, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../store/useAuthStore';
import { AppButton } from '../../../components/ui/AppButton';
import { MapPin, Navigation, Clock } from 'lucide-react-native';
import { router } from 'expo-router';

// Mock Incoming Job
const INCOMING_JOBS = [
    {
        id: '101',
        price: 150,
        pickup: 'Siam Paragon',
        dropoff: 'Thong Lor Pet Hospital',
        pet: 'Dog (Golden Retriever)',
        distance: '5.2 km'
    },
    {
        id: '102',
        price: 80,
        pickup: 'Central World',
        dropoff: 'Sukhumvit 24',
        pet: 'Cat (Persian)',
        distance: '3.1 km'
    }
];

export default function DriverHomeScreen() {
    const { user } = useAuthStore();
    const [isOnline, setIsOnline] = useState(false);

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header Status */}
            <View className="bg-white p-5 shadow-sm flex-row justify-between items-center mb-4">
                <View>
                    <Text className="text-gray-500 text-xs">Driver Status</Text>
                    <Text className={`font-bold text-lg ${isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </Text>
                </View>
                <Switch
                    value={isOnline}
                    onValueChange={setIsOnline}
                    trackColor={{ false: "#767577", true: "#00C853" }}
                />
            </View>

            {!isOnline ? (
                <View className="flex-1 items-center justify-center p-10">
                    <View className="bg-gray-200 w-20 h-20 rounded-full items-center justify-center mb-4">
                        <Navigation size={40} color="gray" />
                    </View>
                    <Text className="text-xl font-bold text-gray-400 text-center">You are Offline</Text>
                    <Text className="text-gray-500 text-center mt-2">Go online to start receiving pet transport requests.</Text>
                </View>
            ) : (
                <FlatList
                    data={INCOMING_JOBS}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 20 }}
                    ListHeaderComponent={() => <Text className="text-lg font-bold mb-4">Incoming Requests</Text>}
                    renderItem={({ item }) => (
                        <View className="bg-white p-5 rounded-xl shadow-sm mb-4 border border-gray-100">
                            <View className="flex-row justify-between mb-4">
                                <View className="bg-green-100 px-3 py-1 rounded-full">
                                    <Text className="text-green-700 font-bold text-xs">{item.distance}</Text>
                                </View>
                                <Text className="text-xl font-bold text-green-600">฿{item.price}</Text>
                            </View>

                            <View className="mb-4">
                                <View className="flex-row items-center mb-2">
                                    <MapPin size={16} color="blue" className="mr-2" />
                                    <Text className="font-semibold text-gray-800">{item.pickup}</Text>
                                </View>
                                <View className="flex-row items-center">
                                    <MapPin size={16} color="red" className="mr-2" />
                                    <Text className="font-semibold text-gray-800">{item.dropoff}</Text>
                                </View>
                            </View>

                            <View className="bg-gray-50 p-3 rounded-lg flex-row items-center mb-4">
                                <Text className="text-lg mr-2">🐶</Text>
                                <Text className="text-gray-600 text-sm font-medium">{item.pet}</Text>
                            </View>

                            <View className="flex-row space-x-3">
                                <AppButton
                                    title="Decline"
                                    variant="secondary"
                                    className="flex-1 bg-gray-200"
                                    textClassName="text-gray-600"
                                />
                                <AppButton
                                    title="Accept"
                                    className="flex-1"
                                    onPress={() => router.push(`/(driver)/job/${item.id}`)}
                                />
                            </View>
                        </View>
                    )}
                />
            )}
        </SafeAreaView>
    );
}
