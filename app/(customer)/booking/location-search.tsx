import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, SafeAreaView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, Search as SearchIcon, Map as MapIcon, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useBookingStore } from '../../../store/useBookingStore';
import { longdoMapApi, LongdoSearchResult } from '../../../services/longdoMapApi';
import debounce from 'lodash/debounce';

export default function LocationSearchScreen() {
    const { t } = useTranslation();
    const params = useLocalSearchParams();
    const mode = params.mode as 'pickup' | 'dropoff';

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<LongdoSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const { setPickupLocation, setDropoffLocation } = useBookingStore();

    // Use the API key from environment
    const LONGDO_API_KEY = process.env.EXPO_PUBLIC_LONGDO_MAP_API_KEY || '';

    // Debounced search function
    const performSearch = useCallback(
        debounce(async (text: string) => {
            if (!text.trim()) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const searchResults = await longdoMapApi.search(text, LONGDO_API_KEY);
                setResults(searchResults);
            } catch (error) {
                console.error('Search failed:', error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 500),
        []
    );

    useEffect(() => {
        performSearch(query);
    }, [query, performSearch]);

    const handleSelectLocation = (item: LongdoSearchResult) => {
        // Go to map picker for confirmation, but centered on this location
        const locationData = {
            name: item.name,
            address: item.address,
            latitude: item.latitude,
            longitude: item.longitude
        };

        if (mode === 'pickup') {
            setPickupLocation(locationData);
        } else {
            setDropoffLocation(locationData);
        }

        router.push({
            pathname: '/(customer)/booking/location-picker',
            params: { mode }
        });
    };

    const handleChooseOnMap = () => {
        router.push({
            pathname: '/(customer)/booking/location-picker',
            params: { mode }
        });
    };

    const clearSearch = () => {
        setQuery('');
        setResults([]);
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="px-5 pt-2 pb-4 border-b border-gray-100">
                {/* Header */}
                <View className="flex-row items-center mb-4">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
                        <ArrowLeft size={24} color="black" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold">
                        {mode === 'pickup' ? t('pickup_location') : t('dropoff_location')}
                    </Text>
                </View>

                {/* Search Input */}
                <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 h-12">
                    <View className={`w-2 h-2 rounded-full mr-3 ${mode === 'pickup' ? 'bg-blue-500' : 'bg-red-500'}`} />
                    <TextInput
                        className="flex-1 text-base text-gray-800 h-full"
                        placeholder={mode === 'pickup' ? t('search_pickup') || "Search pickup location" : t('search_dropoff') || "Search drop-off location"}
                        placeholderTextColor="#9CA3AF"
                        value={query}
                        onChangeText={setQuery}
                        autoFocus
                        returnKeyType="search"
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={clearSearch}>
                            <X size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Content */}
            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#3B82F6" />
                </View>
            ) : (
                <View className="flex-1">
                    {/* Choose on Map Option */}
                    <TouchableOpacity
                        onPress={handleChooseOnMap}
                        className="flex-row items-center px-5 py-4 border-b border-gray-100 bg-white active:bg-gray-50"
                    >
                        <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-3">
                            <MapIcon size={20} color="#3B82F6" />
                        </View>
                        <Text className="text-base font-semibold text-gray-800">{t('choose_on_map') || "Set on map"}</Text>
                    </TouchableOpacity>

                    {/* Results List */}
                    <FlatList
                        data={results}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => handleSelectLocation(item)}
                                className="flex-row items-start px-5 py-4 border-b border-gray-100 active:bg-gray-50"
                            >
                                <View className="mt-1 mr-3">
                                    <MapPin size={20} color="#6B7280" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-base font-medium text-gray-900 mb-0.5">{item.name}</Text>
                                    <Text className="text-sm text-gray-500" numberOfLines={1}>{item.address}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        className="flex-1"
                        keyboardShouldPersistTaps="handled"
                    />
                </View>
            )}
        </SafeAreaView>
    );
}
