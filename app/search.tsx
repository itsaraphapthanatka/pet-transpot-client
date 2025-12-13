import React from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin } from 'lucide-react-native';
import { router } from 'expo-router';

const MOCK_PLACES = [
    { id: '1', title: 'สยามพารากอน', address: '991 ถ.พระราม 1, ปทุมวัน' },
    { id: '2', title: 'เซ็นทรัลเวิลด์', address: '999/9 ถ.พระราม 1, ปทุมวัน' },
    { id: '3', title: 'รพ.สัตว์ทองหล่อ', address: '789 สุขุมวิท 55' },
    { id: '4', title: 'เพ็ทคลับ', address: 'ลาดพร้าว 101' },
];

export default function SearchScreen() {
    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center p-4 shadow-sm bg-white z-10">
                <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
                    <ArrowLeft color="black" size={24} />
                </TouchableOpacity>

                <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-3 py-2">
                    <View className="w-2 h-2 rounded-full bg-blue-500 mr-3" />
                    <TextInput
                        className="flex-1 text-base text-gray-800"
                        placeholder="ไปไหนดี?"
                        placeholderTextColor="gray"
                        autoFocus={true}
                    />
                </View>
            </View>

            {/* Current Location Row */}
            <TouchableOpacity className="flex-row items-center p-4 border-b border-gray-100">
                <View className="bg-blue-100 p-2 rounded-full mr-4">
                    <MapPin size={20} color="#2962FF" />
                </View>
                <Text className="text-base font-medium text-blue-600">ปักหมุดบนแผนที่</Text>
            </TouchableOpacity>

            {/* Suggestions List */}
            <FlatList
                data={MOCK_PLACES}
                keyExtractor={item => item.id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                    <TouchableOpacity className="flex-row items-center p-4 border-b border-gray-50 active:bg-gray-50">
                        <View className="bg-gray-100 p-2 rounded-full mr-4">
                            <MapPin size={20} color="gray" />
                        </View>
                        <View>
                            <Text className="text-base font-semibold text-gray-800">{item.title}</Text>
                            <Text className="text-gray-500 text-xs">{item.address}</Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </SafeAreaView>
    );
}
