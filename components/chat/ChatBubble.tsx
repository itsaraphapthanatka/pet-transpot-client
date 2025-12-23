import React from 'react';
import { View, Text } from 'react-native';
import { ChatMessage } from '../../types/chat';

interface ChatBubbleProps {
    message: ChatMessage;
    isOwnMessage?: boolean;
}

export default function ChatBubble({ message, isOwnMessage }: ChatBubbleProps) {
    const isMe = isOwnMessage ?? (message.role === 'customer');

    return (
        <View className={`flex-row w-full mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
            <View
                className={`max-w-[75%] px-4 py-3 rounded-2xl ${isMe
                    ? 'bg-blue-500 rounded-tr-none'
                    : 'bg-white border border-gray-200 rounded-tl-none'
                    }`}
            >
                <Text className={`${isMe ? 'text-white' : 'text-gray-800'}`}>
                    {message.message}
                </Text>
            </View>
        </View>
    );
}
