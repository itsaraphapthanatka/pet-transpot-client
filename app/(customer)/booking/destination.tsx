import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppInput } from '../../../components/ui/AppInput';
import { ArrowLeft, MapPin } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { useBookingStore } from '../../../store/useBookingStore';
import { useTranslation } from 'react-i18next';
import { longdoMapApi } from '../../../services/longdoMapApi';

type SearchResult = {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
};

export default function DestinationScreen() {
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const { setDropoffLocation, setPickupLocation } = useBookingStore();
    const { t } = useTranslation();

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission to access location was denied');
                return;
            }

            // Get current location for Pickup if not set
            const location = await Location.getCurrentPositionAsync({});
            setPickupLocation({
                name: t('current_location'),
                address: 'Current Location',
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });
        })();
    }, []);

    const LONGDO_API_KEY = process.env.EXPO_PUBLIC_LONGDO_MAP_API_KEY || 'YOUR_LONGDO_MAP_API_KEY';

    useEffect(() => {
        const searchPlaces = async () => {
            if (!search.trim()) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                // Use Longdo Map API for search
                const longdoResults = await longdoMapApi.search(search, LONGDO_API_KEY);

                // Map Longdo results to SearchResult type
                const mappedResults: SearchResult[] = longdoResults.map(item => ({
                    id: item.id,
                    name: item.name,
                    address: item.address,
                    latitude: item.latitude,
                    longitude: item.longitude
                }));

                setResults(mappedResults);
            } catch (error) {
                console.error('Longdo search error:', error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            searchPlaces();
        }, 800); // 800ms debounce

        return () => clearTimeout(timeoutId);
    }, [search]);

    const handleSelectLocation = (item: SearchResult) => {
        setDropoffLocation({
            name: item.name,
            address: item.address,
            latitude: item.latitude,
            longitude: item.longitude
        });

        // Check if pickup is set, if not try to set it to current location (fallback)
        // This is handled by useEffect on mount, but as a safety net:
        if (!useBookingStore.getState().pickupLocation) {
            // We can't easily wait for async here without blocking, so we rely on the mount effect or user not disabling location.
            // But let's NOT overwrite it with hardcoded values if it IS set.
        }

        router.push('/(customer)/booking/select-pet');
    };

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
                            placeholder={t('current_location')}
                            value={t('current_location')}
                            containerClassName="mb-0 flex-1"
                            className="bg-gray-50 border-0"
                            editable={false}
                        />
                    </View>
                    <View className="flex-row items-center">
                        <View className="w-3 h-3 bg-red-500 rounded-sm mr-3" />
                        <AppInput
                            placeholder={t('where_to')}
                            value={search}
                            onChangeText={setSearch}
                            containerClassName="mb-0 flex-1"
                            autoFocus
                        />
                    </View>
                </View>
            </View>

            <View className="flex-1 mt-6 border-t border-gray-100">
                {loading ? (
                    <View className="p-4">
                        <ActivityIndicator color="gray" />
                    </View>
                ) : (
                    <FlatList
                        data={results}
                        keyExtractor={item => item.id}
                        ListEmptyComponent={() => (
                            <View className="p-4 items-center">
                                <Text className="text-gray-400">
                                    {search ? t('no_location_found') : t('enter_destination')}
                                </Text>
                            </View>
                        )}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                className="flex-row items-center p-4 border-b border-gray-50"
                                onPress={() => handleSelectLocation(item)}
                            >
                                <View className="bg-gray-100 p-2 rounded-full mr-4">
                                    <MapPin size={20} color="gray" />
                                </View>
                                <View className="flex-1">
                                    <Text className="font-semibold text-gray-800 text-base">{item.name}</Text>
                                    <Text className="text-gray-500 text-xs">{item.address}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}
