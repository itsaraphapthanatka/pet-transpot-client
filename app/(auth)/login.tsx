import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { Mail, Lock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export default function LoginScreen() {
    const [loading, setLoading] = useState(false);
    const { login } = useAuthStore();
    const { t } = useTranslation();

    const handleLogin = (role: 'customer' | 'driver' | 'admin') => {
        setLoading(true);
        setTimeout(() => {
            login(role);
            setLoading(false);

            // Router redirection is handled by _layout.tsx in root
        }, 1000);
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="px-6">

                    <View className="items-center mb-10">
                        <View className="w-20 h-20 bg-green-100 rounded-2xl items-center justify-center mb-4 transform -rotate-6">
                            <Text className="text-4xl">🐾</Text>
                        </View>
                        <Text className="text-3xl font-bold text-gray-900">{t('login_screen.title')}</Text>
                        <Text className="text-gray-500 mt-2">{t('login_screen.subtitle')}</Text>
                    </View>

                    <View className="space-y-4">
                        <AppInput
                            label={t('login_screen.email')}
                            placeholder="Example@email.com"
                            icon={<Mail size={20} color="gray" />}
                        />
                        <AppInput
                            label={t('login_screen.password')}
                            placeholder="********"
                            secureTextEntry
                            icon={<Lock size={20} color="gray" />}
                        />

                        <TouchableOpacity className="items-end mb-6">
                            <Text className="text-primary font-semibold">{t('login_screen.forgot_password')}</Text>
                        </TouchableOpacity>

                        <AppButton title={t('login_screen.login_as_customer')} onPress={() => handleLogin('customer')} isLoading={loading} />

                        <View className="flex-row justify-between mt-4">
                            <AppButton title={t('login_screen.driver')} variant="outline" className="flex-1 mr-2" onPress={() => handleLogin('driver')} />
                            <AppButton title={t('login_screen.admin')} variant="ghost" className="flex-1 ml-2" onPress={() => handleLogin('admin')} />
                        </View>
                    </View>

                    <View className="flex-row justify-center mt-10">
                        <Text className="text-gray-500">{t('login_screen.dont_have_account')} </Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                            <Text className="text-primary font-bold">{t('login_screen.sign_up')}</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
