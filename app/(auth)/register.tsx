import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { ArrowLeft, Mail, Lock, User, Phone } from 'lucide-react-native';

export default function RegisterScreen() {
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
                            label="Full Name"
                            placeholder="John Doe"
                            icon={<User size={20} color="gray" />}
                        />
                        <AppInput
                            label="Phone Number"
                            placeholder="081 234 5678"
                            keyboardType="phone-pad"
                            icon={<Phone size={20} color="gray" />}
                        />
                        <AppInput
                            label="Email"
                            placeholder="Example@email.com"
                            keyboardType="email-address"
                            icon={<Mail size={20} color="gray" />}
                        />
                        <AppInput
                            label="Password"
                            placeholder="********"
                            secureTextEntry
                            icon={<Lock size={20} color="gray" />}
                        />

                        <View className="flex-row items-start mb-6 mt-2">
                            <View className="w-5 h-5 border border-primary rounded mr-3 mt-0.5 items-center justify-center">
                                {/* Checkbox placeholder */}
                            </View>
                            <Text className="flex-1 text-gray-500 text-sm">
                                By signing up, you agree to our <Text className="text-primary font-bold">Terms of Service</Text> and <Text className="text-primary font-bold">Privacy Policy</Text>.
                            </Text>
                        </View>

                        <AppButton title="Sign Up" onPress={() => router.back()} />
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
