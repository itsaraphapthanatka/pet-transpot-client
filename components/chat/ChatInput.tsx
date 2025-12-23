import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Platform } from 'react-native';
import { Send } from 'lucide-react-native';

interface ChatInputProps {
    onSend: (text: string) => void;
    onTyping: (isTyping: boolean) => void;
}

export default function ChatInput({ onSend, onTyping }: ChatInputProps) {
    const [text, setText] = useState("");

    const handleSend = () => {
        if (text.trim().length === 0) return;
        onSend(text);
        setText("");
        onTyping(false);
    };

    return (
        <View className={`flex-row p-3 bg-white border-t border-gray-100 items-center ${Platform.OS === 'ios' ? 'pb-8' : 'pb-3'}`}>
            <TextInput
                className="flex-1 bg-gray-100 rounded-full px-5 py-3 mr-3 font-medium"
                placeholder="Type a message..."
                value={text}
                onChangeText={(v) => {
                    setText(v);
                    onTyping(v.length > 0);
                }}
                multiline
            />
            <TouchableOpacity
                onPress={handleSend}
                className="bg-blue-500 w-12 h-12 rounded-full items-center justify-center shadow-sm"
                disabled={text.trim().length === 0}
                style={{ opacity: text.trim().length === 0 ? 0.5 : 1 }}
            >
                <Send size={20} color="white" />
            </TouchableOpacity>
        </View>
    );
}
