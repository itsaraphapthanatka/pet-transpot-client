import { Stack } from 'expo-router';

export default function DriverLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="job/[id]" />
        </Stack>
    );
}
