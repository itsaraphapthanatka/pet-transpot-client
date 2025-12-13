import { create } from 'zustand';

type UserRole = 'customer' | 'driver' | 'admin' | null;

interface AuthState {
    user: { name: string; email: string; photo?: string } | null;
    role: UserRole;
    isAuthenticated: boolean;
    login: (role: UserRole) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    role: null,
    isAuthenticated: false,
    login: (role) => set({
        isAuthenticated: true,
        role,
        user: { name: 'Demo User', email: 'user@example.com' }
    }),
    logout: () => set({ isAuthenticated: false, role: null, user: null }),
}));
