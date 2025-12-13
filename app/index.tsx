import { Redirect } from 'expo-router';

export default function Index() {
    // Redirect immediately to Onboarding
    return <Redirect href="/(auth)/onboarding" />;
}
