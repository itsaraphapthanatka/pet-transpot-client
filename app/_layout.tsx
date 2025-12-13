import { Slot, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { View } from 'react-native';
import '../global.css';
import '../i18n';

// Initial Route Logic
export default function RootLayout() {
    const { isAuthenticated, role } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();
    const navigationState = useRootNavigationState();

    useEffect(() => {
        if (!navigationState?.key) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (isAuthenticated && inAuthGroup) {
            if (role === 'customer') router.replace('/(customer)/(tabs)/home');
            else if (role === 'driver') router.replace('/(driver)/(tabs)/home');
            else if (role === 'admin') router.replace('/(admin)/dashboard');
        } else if (!isAuthenticated && !inAuthGroup) {
            // Redirect to login if token expired (mock)
            setTimeout(() => {
                router.replace('/(auth)/onboarding');
            }, 0);
        }
    }, [isAuthenticated, role, segments, navigationState?.key]);

    return <Slot />;
}
