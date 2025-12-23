import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { ArrowLeft, Mail, Lock, User, Phone } from 'lucide-react-native';

export default function RegisterScreen() {
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [agreeToTerms, setAgreeToTerms] = useState(false);

    const { register, isLoading, error, clearError } = useAuthStore();

    const handleRegister = async () => {
        // Validation
        if (!fullName || !phone || !password) {
            Alert.alert('Error', 'Please fill in all required fields (name, phone, password)');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        if (!agreeToTerms) {
            Alert.alert('Error', 'Please agree to the Terms of Service and Privacy Policy');
            return;
        }

        try {
            clearError();
            await register(fullName, phone, email, password);
            // Navigation handled by _layout.tsx based on role
        } catch (error: any) {
            Alert.alert('Registration Failed', error.message || 'Could not create account');
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6">

                    <TouchableOpacity onPress={() => router.back()} className="mt-4 mb-6">
                        <ArrowLeft color="black" size={24} />
                    </TouchableOpacity>

                    <View className="mb-8">
                        <Text className="text-3xl font-bold text-gray-900">Create Account</Text>
                        <Text className="text-gray-500 mt-2">Join our pet loving community</Text>
                    </View>

                    <View className="space-y-4">
                        <AppInput
                            label="Full Name *"
                            placeholder="John Doe"
                            value={fullName}
                            onChangeText={setFullName}
                            icon={<User size={20} color="gray" />}
                        />
                        <AppInput
                            label="Phone Number *"
                            placeholder="+66812345678"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            icon={<Phone size={20} color="gray" />}
                        />
                        <AppInput
                            label="Email (Optional)"
                            placeholder="email@example.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            icon={<Mail size={20} color="gray" />}
                        />
                        <AppInput
                            label="Password *"
                            placeholder="********"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            icon={<Lock size={20} color="gray" />}
                        />

                        <TouchableOpacity
                            onPress={() => setAgreeToTerms(!agreeToTerms)}
                            className="flex-row items-start mb-6 mt-2"
                        >
                            <View className={`w-5 h-5 border ${agreeToTerms ? 'bg-primary border-primary' : 'border-gray-400'} rounded mr-3 mt-0.5 items-center justify-center`}>
                                {agreeToTerms && <Text className="text-white text-xs">✓</Text>}
                            </View>
                            <Text className="flex-1 text-gray-500 text-sm">
                                By signing up, you agree to our <Text className="text-primary font-bold">Terms of Service</Text> and <Text className="text-primary font-bold">Privacy Policy</Text>.
                            </Text>
                        </TouchableOpacity>

                        <AppButton
                            title="Sign Up"
                            onPress={handleRegister}
                            isLoading={isLoading}
                        />
                    </View>

                    <View className="flex-row justify-center mt-8 mb-8">
                        <Text className="text-gray-500">Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Text className="text-primary font-bold">Login</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
