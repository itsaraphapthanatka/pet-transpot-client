import { View, FlatList, Text, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { connectChat, sendMessage, sendTyping, disconnectChat, ChatSocketFailure } from "../../../services/chatSocket";
import { api } from "../../../services/api";
import { useChatStore } from "../../../stores/chatStore";
import { useAuthStore } from "../../../store/useAuthStore";
import { orderService } from "../../../services/orderService";
import ChatBubble from "../../../components/chat/ChatBubble";
import ChatInput from "../../../components/chat/ChatInput";
import { ArrowLeft, Phone } from "lucide-react-native";
import { Order } from "../../../types/order";

export default function ChatScreen() {
    const { orderId } = useLocalSearchParams();
    const router = useRouter();
    const { t } = useTranslation();
    const { messages, addMessage, setTyping, setMessages, clearMessages, typing } = useChatStore();
    const { user } = useAuthStore();
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [socketFailure, setSocketFailure] = useState<ChatSocketFailure | null>(null);

    const userId = user?.id || 0;
    const driverName = order?.driver?.full_name || t('driver');

    useEffect(() => {
        // Clear previous messages when entering
        clearMessages();
        setIsLoading(true);
        setSocketFailure(null);

        // Fetch order details to get driver name
        orderService.getOrder(Number(orderId)).then((data) => {
            setOrder(data);
        }).catch((err) => {
            console.error("Failed to fetch order:", err);
        });

        // Fetch chat history
        api.getChatHistory(Number(orderId)).then((data) => {
            if (Array.isArray(data)) {
                const mappedMessages = data.map((msg: any) => ({
                    ...msg,
                    role: msg.role || msg.sender_role,
                    user_id: msg.user_id || msg.sender_id
                }));
                setMessages(mappedMessages);
            }
            setIsLoading(false);
        }).catch(() => setIsLoading(false));

        // Mark as read
        if (userId) {
            api.markChatRead(Number(orderId));
        }

        // Connect Socket as customer. The token authenticates the socket; the server derives the
        // sender from it. A failure is shown once - connectChat never retries by itself.
        connectChat(
            Number(orderId),
            userId,
            "customer",
            (data) => {
                if (data.type === "typing") {
                    setTyping(data.is_typing);
                } else {
                    // Map fields for consistency with state and deduplication
                    const normalizedMsg = {
                        ...data,
                        user_id: data.user_id || data.sender_id,
                        role: data.role || data.sender_role
                    };
                    addMessage(normalizedMsg);
                }
            },
            (reason) => setSocketFailure(reason)
        );

        return () => {
            disconnectChat();
        };
    }, [orderId, userId]);

    if (isLoading) {
        return (
            <View className="flex-1 bg-gray-50 items-center justify-center">
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="px-5 py-4 border-b border-gray-200 bg-white flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                        <TouchableOpacity onPress={() => router.back()} className="mr-4">
                            <ArrowLeft size={24} color="#1F2937" />
                        </TouchableOpacity>
                        <View className="flex-1">
                            <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>{driverName}</Text>
                            {typing && <Text className="text-xs text-blue-500 font-medium">Typing...</Text>}
                        </View>
                    </View>
                    <TouchableOpacity className="bg-green-500 p-2 rounded-full">
                        <Phone size={20} color="white" />
                    </TouchableOpacity>
                </View>

                {socketFailure && (
                    <View className="bg-amber-50 border-b border-amber-200 px-5 py-3">
                        <Text className="text-amber-800 text-xs font-medium">
                            {socketFailure === 'auth' ? t('chat_socket_auth_failed') : t('chat_socket_disconnected')}
                        </Text>
                    </View>
                )}

                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    className="flex-1"
                    keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
                >
                    <FlatList
                        data={messages}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                            <ChatBubble
                                message={item}
                                isOwnMessage={item.role === 'customer'}
                            />
                        )}
                        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                        className="flex-1"
                    />
                    <ChatInput
                        onSend={(text) => {
                            // 1. Optimistic Update: Show message immediately
                            const newMessage = {
                                message: text,
                                role: "customer" as const,
                                user_id: userId,
                                order_id: Number(orderId),
                                created_at: new Date().toISOString()
                            };
                            addMessage(newMessage);

                            // 2. Send to Socket
                            sendMessage(newMessage);
                        }}
                        onTyping={(v) => sendTyping(v)}
                    />
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
