import React from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { AppInput } from './ui/AppInput';
import { MapPin } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

export type SearchResult = {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
};

interface LocationSearchProps {
    pickupQuery: string;
    setPickupQuery: (text: string) => void;
    dropoffQuery: string;
    setDropoffQuery: (text: string) => void;
    activeField: 'pickup' | 'dropoff';
    setActiveField: (field: 'pickup' | 'dropoff') => void;
    results: SearchResult[];
    loading: boolean;
    onSelectLocation: (item: SearchResult) => void;
}

export const LocationSearch: React.FC<LocationSearchProps> = ({
    pickupQuery,
    setPickupQuery,
    dropoffQuery,
    setDropoffQuery,
    activeField,
    setActiveField,
    results,
    loading,
    onSelectLocation
}) => {
    const { t } = useTranslation();

    const handleInputPress = (mode: 'pickup' | 'dropoff') => {
        router.push({
            pathname: '/(customer)/booking/location-picker',
            params: { mode }
        });
    };

    return (
        <View className="absolute top-14 w-full px-5 z-20">
            <View className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <View className="p-4">
                    {/* Pickup Input */}
                    <TouchableOpacity onPress={() => handleInputPress('pickup')} className="flex-row items-center mb-3">
                        <View className="w-3 h-3 bg-blue-500 rounded-full mr-3" />
                        <View className="flex-1" pointerEvents="none">
                            <AppInput
                                placeholder={t('current_location')}
                                value={pickupQuery}
                                editable={false}
                                containerClassName="mb-0 flex-1 h-10"
                                inputContainerClassName="border-gray-100"
                                className="bg-gray-50 text-sm"
                            />
                        </View>
                    </TouchableOpacity>

                    {/* Dropoff Input */}
                    <TouchableOpacity onPress={() => handleInputPress('dropoff')} className="flex-row items-center">
                        <View className="w-3 h-3 bg-red-500 rounded-sm mr-3" />
                        <View className="flex-1" pointerEvents="none">
                            <AppInput
                                placeholder={t('where_to')}
                                value={dropoffQuery}
                                editable={false}
                                containerClassName="mb-0 flex-1 h-10"
                                inputContainerClassName="border-gray-100"
                                className="bg-gray-50 text-sm"
                            />
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};
