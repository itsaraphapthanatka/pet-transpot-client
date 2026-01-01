import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell } from 'lucide-react-native';
import { router } from 'expo-router';
import { api } from '../../services/api';

interface Notification {
    id: number;
    title: string;
    message: string;
    created_at: string;
    is_read: boolean;
}

export default function DriverNotificationsScreen() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = async () => {
        try {
            const data = await api.getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleNotificationTap = async (notification: Notification) => {
        if (!notification.is_read) {
            try {
                await api.markNotificationAsRead(notification.id);
                // Update local state
                setNotifications(prev =>
                    prev.map(n =>
                        n.id === notification.id ? { ...n, is_read: true } : n
                    )
                );
            } catch (error) {
                console.error('Failed to mark notification as read:', error);
            }
        }
    };

    const getRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'เมื่อสักครู่';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} นาทีที่แล้ว`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ชั่วโมงที่แล้ว`;
        return `${Math.floor(diffInSeconds / 86400)} วันที่แล้ว`;
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white px-5 py-4 flex-row items-center border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <ArrowLeft size={24} color="#000" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-800">การแจ้งเตือน</Text>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#00A862" />
                    <Text className="text-gray-500 mt-4">กำลังโหลด...</Text>
                </View>
            ) : (
                <ScrollView
                    className="flex-1"
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00A862']} />
                    }
                >
                    {notifications.length === 0 ? (
                        <View className="flex-1 items-center justify-center p-10 mt-20">
                            <View className="bg-gray-200 w-20 h-20 rounded-full items-center justify-center mb-4">
                                <Bell size={40} color="gray" />
                            </View>
                            <Text className="text-xl font-bold text-gray-400 text-center">ไม่มีการแจ้งเตือน</Text>
                            <Text className="text-gray-500 text-center mt-2">
                                คุณจะได้รับการแจ้งเตือนเมื่อมีงานใหม่หรือข้อมูลสำคัญ
                            </Text>
                        </View>
                    ) : (
                        <View className="p-5">
                            {notifications.map((notification) => (
                                <TouchableOpacity
                                    key={notification.id}
                                    onPress={() => handleNotificationTap(notification)}
                                    className={`bg-white p-4 rounded-xl mb-3 ${!notification.is_read ? 'border-2 border-green-500' : 'border border-gray-200'
                                        }`}
                                >
                                    <View className="flex-row justify-between items-start mb-2">
                                        <Text className={`text-base font-bold ${!notification.is_read ? 'text-green-600' : 'text-gray-800'
                                            }`}>
                                            {notification.title}
                                        </Text>
                                        {!notification.is_read && (
                                            <View className="w-2 h-2 bg-green-500 rounded-full ml-2" />
                                        )}
                                    </View>
                                    <Text className="text-gray-600 mb-2">{notification.message}</Text>
                                    <Text className="text-gray-400 text-xs">{getRelativeTime(notification.created_at)}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}
