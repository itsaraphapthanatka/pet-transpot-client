import { Stack } from 'expo-router';

export default function BookingLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="destination" />
            <Stack.Screen name="select-pet" />
            <Stack.Screen name="confirm" />
        </Stack>
    );
}
