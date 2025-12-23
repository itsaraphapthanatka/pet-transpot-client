export interface ChatMessage {
    id?: number;
    order_id: number;
    user_id: number;
    role: "customer" | "driver" | "system";
    message: string;
    is_read?: boolean;
    created_at?: string;
    type?: "message" | "typing";
    is_typing?: boolean;
}
