import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppButton } from '../../../components/ui/AppButton';
import { ArrowLeft, Plus } from 'lucide-react-native';

const MY_PETS = [
    { id: '1', name: 'Mochi', type: 'Dog', weight: '5kg', image: '🐶' },
    { id: '2', name: 'Luna', type: 'Cat', weight: '3kg', image: '🐱' },
];

export default function SelectPetScreen() {
    const [selectedPet, setSelectedPet] = useState<string | null>(null);

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="px-5 pt-2 flex-1">
                <View className="flex-row items-center mb-6">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4">
                        <ArrowLeft size={24} color="black" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold">Select Passenger</Text>
                </View>

                <Text className="text-gray-500 mb-4">Who is traveling today?</Text>

                <ScrollView>
                    {MY_PETS.map((pet) => (
                        <TouchableOpacity
                            key={pet.id}
                            onPress={() => setSelectedPet(pet.id)}
                            className={`p-4 rounded-xl border-2 mb-4 flex-row items-center ${selectedPet === pet.id ? 'border-primary bg-green-50' : 'border-gray-100 bg-white'}`}
                        >
                            <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-4">
                                <Text className="text-2xl">{pet.image}</Text>
                            </View>
                            <View className="flex-1">
                                <Text className="font-bold text-lg text-gray-800">{pet.name}</Text>
                                <Text className="text-gray-500 text-sm">{pet.type} • {pet.weight}</Text>
                            </View>
                            <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${selectedPet === pet.id ? 'border-primary' : 'border-gray-300'}`}>
                                {selectedPet === pet.id && <View className="w-3 h-3 rounded-full bg-primary" />}
                            </View>
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity className="flex-row items-center justify-center p-4 border border-dashed border-gray-300 rounded-xl mt-2">
                        <Plus size={20} color="gray" className="mr-2" />
                        <Text className="text-gray-500 font-semibold">Add New Pet</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            <View className="p-5 border-t border-gray-100">
                <AppButton
                    title="Next"
                    disabled={!selectedPet}
                    onPress={() => router.push('/(customer)/booking/confirm')}
                />
            </View>
        </SafeAreaView>
    );
}
