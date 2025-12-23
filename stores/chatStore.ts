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
        set((state) => ({
            messages: [...state.messages, msg],
        })),

    setMessages: (msgs: ChatMessage[]) => set({ messages: msgs }),

    setTyping: (val: boolean) => set({ typing: val }),

    clearMessages: () => set({ messages: [], typing: false }),
}));
