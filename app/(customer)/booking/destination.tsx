import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppInput } from '../../../components/ui/AppInput';
import { ArrowLeft, MapPin } from 'lucide-react-native';
import { router } from 'expo-router';

const LOCATIONS = [
    { id: '1', name: 'Siam Paragon', address: '991 Rama I Rd, Pathum Wan' },
    { id: '2', name: 'Thong Lor Pet Hospital', address: '789 Sukhumvit 55' },
    { id: '3', name: 'Central World', address: '999/9 Rama I Rd, Pathum Wan' },
];

export default function DestinationScreen() {
    const [search, setSearch] = useState('');

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="px-5 pt-2">
                <TouchableOpacity onPress={() => router.back()} className="mb-4">
                    <ArrowLeft size={24} color="black" />
                </TouchableOpacity>

                <View>
                    <View className="flex-row items-center mb-4">
                        <View className="w-3 h-3 bg-blue-500 rounded-full mr-3" />
                        <AppInput
                            placeholder="Current Location"
                            value="My Home"
                            containerClassName="mb-0 flex-1"
                            className="bg-gray-50 border-0"
                            editable={false}
                        />
                    </View>
                    <View className="flex-row items-center">
                        <View className="w-3 h-3 bg-red-500 rounded-sm mr-3" />
                        <AppInput
                            placeholder="Where to?"
                            value={search}
                            onChangeText={setSearch}
                            containerClassName="mb-0 flex-1"
                            autoFocus
                        />
                    </View>
                </View>
            </View>

            <View className="flex-1 mt-6 border-t border-gray-100">
                <FlatList
                    data={LOCATIONS}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            className="flex-row items-center p-4 border-b border-gray-50"
                            onPress={() => router.push('/(customer)/booking/select-pet')}
                        >
                            <View className="bg-gray-100 p-2 rounded-full mr-4">
                                <MapPin size={20} color="gray" />
                            </View>
                            <View>
                                <Text className="font-semibold text-gray-800 text-base">{item.name}</Text>
                                <Text className="text-gray-500 text-xs">{item.address}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            </View>
        </SafeAreaView>
    );
}
