import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../store/useAuthStore';
import { AppButton } from '../../../components/ui/AppButton';
import { User, LogOut, ChevronRight, Settings, Shield, Bell } from 'lucide-react-native';
import { router } from 'expo-router';

export default function DriverProfileScreen() {
    const { user, logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        router.replace('/');
    };

    const menuItems = [
        { icon: Settings, label: 'Settings', screen: 'settings' },
        { icon: Shield, label: 'Privacy & Security', screen: 'privacy' },
        { icon: Bell, label: 'Notifications', screen: 'notifications' },
    ];

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {/* Header */}
                <View className="items-center mb-8 mt-4">
                    <View className="w-24 h-24 bg-gray-200 rounded-full items-center justify-center mb-4 overflow-hidden border-2 border-white shadow-sm">
                        {user?.photo ? (
                            <Image source={{ uri: user.photo }} className="w-full h-full" />
                        ) : (
                            <User size={40} color="gray" />
                        )}
                    </View>
                    <Text className="text-xl font-bold text-gray-800">{user?.name || 'Driver'}</Text>
                    <Text className="text-gray-500">{user?.email || 'driver@example.com'}</Text>
                    <View className="bg-green-100 px-3 py-1 rounded-full mt-2">
                        <Text className="text-green-700 font-bold text-xs">Verified Driver</Text>
                    </View>
                </View>

                {/* Stats */}
                <View className="flex-row justify-between mb-8">
                    <View className="flex-1 bg-white p-4 rounded-xl shadow-sm items-center mr-2">
                        <Text className="text-2xl font-bold text-gray-800">4.9</Text>
                        <Text className="text-gray-500 text-xs text-center">Rating</Text>
                    </View>
                    <View className="flex-1 bg-white p-4 rounded-xl shadow-sm items-center mx-2">
                        <Text className="text-2xl font-bold text-gray-800">150</Text>
                        <Text className="text-gray-500 text-xs text-center">Trips</Text>
                    </View>
                    <View className="flex-1 bg-white p-4 rounded-xl shadow-sm items-center ml-2">
                        <Text className="text-2xl font-bold text-gray-800">2</Text>
                        <Text className="text-gray-500 text-xs text-center">Years</Text>
                    </View>
                </View>

                {/* Menu Items */}
                <View className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            className={`flex-row items-center p-4 ${index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''}`}
                        >
                            <View className="bg-gray-100 p-2 rounded-full mr-4">
                                <item.icon size={20} color="#4B5563" />
                            </View>
                            <Text className="flex-1 text-gray-700 font-medium">{item.label}</Text>
                            <ChevronRight size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout Button */}
                <AppButton
                    title="Log Out"
                    variant="outline"
                    className="border-red-500"
                    textClassName="text-red-500"
                    icon={<LogOut size={20} color="#EF4444" />}
                    onPress={handleLogout}
                />
            </ScrollView>
        </SafeAreaView>
    );
}
