import { Slot, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { api } from '../services/api';
import { View } from 'react-native';
import '../global.css';
import '../i18n';

// Initial Route Logic
export default function RootLayout() {
    const { isAuthenticated, role } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();
    const navigationState = useRootNavigationState();
    const { setMapProvider } = useSettingsStore();

    // Fetch Map Settings
    useEffect(() => {
        const syncSettings = async () => {
            try {
                const settings = await api.getPricingSettings();
                if (settings && (settings.map === 'google' || settings.map === 'here')) {
                    setMapProvider(settings.map as 'google' | 'here');
                    console.log('Map provider synced:', settings.map);
                }
            } catch (error) {
                // Just warn, not critical - app can work with default settings
                console.warn('Could not sync map settings from backend, using defaults:', error);
            }
        };

        syncSettings();
    }, []);

    // Restore user session on app start
    useEffect(() => {
        const { loadUser } = useAuthStore.getState();
        loadUser();
    }, []);

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
