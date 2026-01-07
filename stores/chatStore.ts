import { create } from "zustand";
import { ChatMessage } from "../types/chat";

interface ChatState {
    messages: ChatMessage[];
    typing: boolean;
    addMessage: (msg: ChatMessage) => void;
    setTyping: (val: boolean) => void;
    setMessages: (msgs: ChatMessage[]) => void;
    clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
    messages: [],
    typing: false,

    addMessage: (msg: ChatMessage) =>
        set((state) => {
            // Deduplication logic
            const isDuplicate = state.messages.some(existingMsg => {
                // 1. If both have IDs, compare IDs
                if (msg.id && existingMsg.id) {
                    return msg.id === existingMsg.id;
                }

                // 2. Fallback for optimistic updates (no ID yet)
                // Check if content, sender, and approximate time match
                const timeDiff = Math.abs(
                    new Date(msg.created_at || '').getTime() -
                    new Date(existingMsg.created_at || '').getTime()
                );

                return (
                    msg.message === existingMsg.message &&
                    msg.role === existingMsg.role &&
                    msg.user_id === existingMsg.user_id &&
                    timeDiff < 5000 // Within 5 seconds
                );
            });

            if (isDuplicate) {
                // If the incoming message has an ID but the stored one doesn't,
                // replace the optimistic message with the server-confirmed one.
                if (msg.id) {
                    return {
                        messages: state.messages.map(m =>
                            (!m.id && m.message === msg.message && m.user_id === msg.user_id)
                                ? msg : m
                        )
                    };
                }
                return state;
            }

            return {
                messages: [...state.messages, msg],
            };
        }),

    setMessages: (msgs: ChatMessage[]) => set({ messages: msgs }),

    setTyping: (val: boolean) => set({ typing: val }),

    clearMessages: () => set({ messages: [], typing: false }),
}));
